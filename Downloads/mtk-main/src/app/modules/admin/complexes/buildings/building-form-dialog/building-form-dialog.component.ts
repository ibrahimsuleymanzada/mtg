import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotificationService } from 'app/core/services/notification.service';
import { BuildingsService } from 'app/core/services/complexes/buildings.service';
import { BuildingsFormData } from 'app/core/models/buildings.model';
import { DropdownItem } from 'app/core/models/dropdown.model';
import { forkJoin } from 'rxjs';
import { DropdownService } from 'app/core/services/dropdown.service';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslocoModule } from '@ngneat/transloco';

@Component({
    selector: 'building-form-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatSelectModule ,
        MatCheckboxModule,
        TranslocoModule
    ],
    templateUrl: './building-form-dialog.component.html'
})
export class BuildingsFormDialogComponent implements OnInit {
    form: FormGroup;
    isEdit: boolean = false;
    dropdownsLoading: boolean = true;

    // Dropdown data
    complexes: DropdownItem[] = [];
    buildingTypes: DropdownItem[] = [];

    readonly currentYear = new Date().getFullYear();
    constructor(
        public dialogRef: MatDialogRef<BuildingsFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { buildingId?: number },
        private fb: FormBuilder,
        private buildingService: BuildingsService,
        private notificationService: NotificationService,
        private dropdownService: DropdownService,
    ) {
        this.isEdit = !!data?.buildingId;
        this.initForm();
    }

    ngOnInit(): void {
        this.loadDropdowns();
    }

    // Bina
    private initForm(): void {
        this.form = this.fb.group({
            id: [0],
            complexId: [null, Validators.required], // Default complex ID
            buildingName: ['', Validators.required],
            buildingNumber: ['', Validators.required],
            totalFloors: [null, [Validators.required, Validators.min(1)]],
            totalApartments: [null, [Validators.required, Validators.min(1)]],
            buildingType: [null, Validators.required],
            hasElevator: [false],
            elevatorCount: [null],
            hasParking: [false],
            constructionYear: [null, [
                Validators.required,
                Validators.min(1800),
                Validators.max(this.currentYear)
            ]],
            address: ['', Validators.required]
        });

        this.form.get('hasElevator')?.valueChanges.subscribe(value => {
            const elevatorCount = this.form.get('elevatorCount');
            if (value) {
                elevatorCount?.setValidators([Validators.required, Validators.min(1)]);
            } else {
                elevatorCount?.clearValidators();
                elevatorCount?.setValue(null);
            }
            elevatorCount?.updateValueAndValidity();
        });
    }

    private loadDropdowns(): void {
        this.dropdownsLoading = true;

        forkJoin({
            complexes: this.dropdownService.getComplexesDropdown(),
            buildingTypes: this.dropdownService.getSpecCodeByType('buildingType')
        }).subscribe({
            next: ({ complexes, buildingTypes }) => {
                this.complexes = complexes;
                this.buildingTypes = buildingTypes;
                

                // Load building data after dropdowns are ready (edit mode)
                if (this.isEdit && this.data.buildingId) {
                    this.loadBuilding(this.data.buildingId);
                }else{
                    this.dropdownsLoading = false;
                }
            },
            error: () => {
                this.dropdownsLoading = false;
                this.notificationService.error('Siyahı məlumatları yüklənərkən xəta baş verdi');
            }
        });
    }

    private loadBuilding(id: number): void {
        this.buildingService.getBuildingById(id).subscribe({
            next: (response) => {
                if (response.status && response.data) {
                    this.form.patchValue(response.data);
                    this.dropdownsLoading = false
                } else {
                    this.notificationService.info(
                        response.message || 'Bina məlumatları tapılmadı'
                    );
                }
            },
            error: (error) => {
                this.notificationService.error(
                    error?.error?.message || 'Bina yüklənərkən xəta baş verdi'
                );
            }
        });
    }

    onSave(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const formData: BuildingsFormData = this.form.value;

        this.buildingService.saveBuilding(formData).subscribe({
            next: (response) => {
                if (response.status) {
                    this.dialogRef.close(true);
                    this.notificationService.success(response.message);
                } else {
                    // Info/Warning - API status = false
                    this.notificationService.info(response.message);
                }
            }
        });
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }

        // Convenience getter for template
    get hasElevator(): boolean {
        return this.form.get('hasElevator')?.value ?? false;
    }
}
