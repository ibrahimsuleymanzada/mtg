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
import { AparmentService } from 'app/core/services/complexes/apartments.service';
import { ApartmentFormData } from 'app/core/models/apartments.model';
import { DropdownService } from 'app/core/services/dropdown.service';
import { DropdownItem } from 'app/core/models/dropdown.model';
import { debounceTime, distinctUntilChanged, forkJoin, Subject, switchMap } from 'rxjs';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslocoModule } from '@ngneat/transloco';

@Component({
    selector: 'apartment-form-dialog',
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
        MatAutocompleteModule,
        MatSelectModule,
        MatCheckboxModule,
        TranslocoModule
    ],
    templateUrl: './apartment-form-dialog.component.html'
})
export class ApartmentFormDialogComponent implements OnInit {
    form: FormGroup;
    isEdit: boolean = false;
    dropdownsLoading: boolean = true;

    // Dropdown data
    complexes: DropdownItem[] = [];
    statuses: DropdownItem[] = [];
    apartmentTypes: DropdownItem[] = [];

    // Autocomplete
    filteredBuildings: { key: number; value: string }[] = [];
    buildingSearchLoading: boolean = false;
    private buildingSearchSubject = new Subject<string>();

    constructor(
        public dialogRef: MatDialogRef<ApartmentFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { apartmentId?: number },
        private fb: FormBuilder,
        private apartmentService: AparmentService,
        private notificationService: NotificationService,
        private dropdownService: DropdownService
    ) {
        this.isEdit = !!data?.apartmentId;
        this.initForm();
    }

    ngOnInit(): void {
        this.loadDropdowns();
        this.setupBuildingAutocomplete();
    }

    // Menzil
    private initForm(): void {
        this.form = this.fb.group({
            id: [0],
            complexId: [null, Validators.required],
            buildingId: [null, Validators.required],
            buildingName: [{ value: null, disabled: true }, Validators.required],
            apartmentNumber: ['', Validators.required],
            floor: [null, Validators.required],
            roomCount: [null, Validators.required],
            area: [null, [Validators.required, Validators.min(1)]],
            apartmentType: ['', Validators.required],
            hasBalcony: [false],
            balconyArea: [null],
            status: [null, Validators.required]
        });

        this.form.get('hasBalcony')?.valueChanges.subscribe(value => {
            const balconyArea = this.form.get('balconyArea');
            if (value) {
                balconyArea?.setValidators([Validators.required, Validators.min(1)]);
            } else {
                balconyArea?.clearValidators();
                balconyArea?.setValue(null);
            }
            balconyArea?.updateValueAndValidity();
        });

        this.setupFormDependencies();
    }

    private setupFormDependencies(): void {
        this.form.get('complexId')?.valueChanges.subscribe(value => {
            const buildingName = this.form.get('buildingName');
            if (value) {
                buildingName?.enable();
            } else {
                buildingName?.disable();
            }
            this.form.patchValue({ buildingId: null, buildingName: null });
            this.filteredBuildings = [];
        });
    }

     /**
     * Setup building autocomplete with debounce
     */
    private setupBuildingAutocomplete(): void {
        this.buildingSearchSubject
            .pipe(
                debounceTime(400),
                distinctUntilChanged(),
                switchMap(searchTerm => {
                    const complexId = this.form.get('complexId')?.value;

                    if (!complexId) {
                        this.filteredBuildings = [];
                        this.buildingSearchLoading = false;
                        return [];
                    }

                    if (!searchTerm || searchTerm.trim().length < 2) {
                        this.filteredBuildings = [];
                        this.buildingSearchLoading = false;
                        return [];
                    }

                    this.buildingSearchLoading = true;
                    return this.dropdownService.getBuildingAutocomplete(searchTerm, complexId);
                })
            )
            .subscribe({
                next: (results) => {
                    this.filteredBuildings = results;
                    this.buildingSearchLoading = false;
                },
                error: () => {
                    this.filteredBuildings = [];
                    this.buildingSearchLoading = false;
                }
            });
    }

    /**
     * Triggered on every input change in building field
     */
    onBuildingSearch(event: Event): void {
        const input = event.target as HTMLInputElement;
        const searchTerm = input.value;

        // Clear buildingId when user types
        this.form.patchValue({ buildingId: null });

        this.buildingSearchSubject.next(searchTerm);
    }

    /**
     * Triggered when user selects a building from autocomplete
     */
    onBuildingSelected(event: MatAutocompleteSelectedEvent): void {
        const selectedBuilding = this.filteredBuildings.find(b => b.value === event.option.value);
        if (selectedBuilding) {
            this.form.patchValue({
                buildingId: selectedBuilding.key,
                buildingName: selectedBuilding.value
            });
        }
    }

    private loadDropdowns(): void {
        this.dropdownsLoading = true;

        forkJoin({
            statuses: this.dropdownService.getSpecCodeByType('apartmentStatus'),
            apartmentTypes: this.dropdownService.getSpecCodeByType('apartmentType'),
            complexes: this.dropdownService.getComplexesDropdown()
        }).subscribe({
            next: ({ statuses, apartmentTypes, complexes }) => {
                this.statuses = statuses;
                this.apartmentTypes = apartmentTypes;
                this.complexes = complexes;
                this.dropdownsLoading = false;

                // Load apartment data after dropdowns are ready (edit mode)
                if (this.isEdit && this.data.apartmentId) {
                    this.loadApartments(this.data.apartmentId);
                }
            },
            error: (error) => {
                this.dropdownsLoading = false;
                this.notificationService.error(error.error.message);
            }
        });
    }

    private loadApartments(id: number): void {
        this.apartmentService.getAparmentById(id).subscribe({
            next: (response) => {
                if (response.status && response.data) {
                    this.form.get('buildingName')?.enable();
                    this.form.patchValue(response.data);
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

        const formData: ApartmentFormData = this.form.value;

        this.apartmentService.saveAparment(formData).subscribe({
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
    get hasBalcony(): boolean {
        return this.form.get('hasBalcony')?.value ?? false;
    }
}
