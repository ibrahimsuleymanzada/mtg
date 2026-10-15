import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { Complex, ComplexFormData } from 'app/core/models/complex.model';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ComplexService } from 'app/core/services/complexes/complex.service';
import { NotificationService } from 'app/core/services/notification.service';
import { TranslocoModule } from '@ngneat/transloco';
import { DropdownItem } from 'app/core/models/dropdown.model';
import { MatSelectModule } from '@angular/material/select';
import { DropdownService } from 'app/core/services/dropdown.service';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'complex-form-dialog',
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
        TranslocoModule,
        MatSelectModule
    ],
    templateUrl: './complex-form-dialog.component.html'
})
export class ComplexFormDialogComponent implements OnInit {
    form: FormGroup;
    isEdit: boolean = false;
    companies: any[] = []
    loading: boolean = true
    constructor(
        public dialogRef: MatDialogRef<ComplexFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { complexId?: number },
        private fb: FormBuilder,
        private complexService: ComplexService,
        private notificationService: NotificationService,
        private dropdownService: DropdownService,
    ) {
        this.isEdit = !!data?.complexId;
        this.initForm();
    }

    ngOnInit(): void {
        this.loadDropdowns()
    }

    // Kompleks
    private initForm(): void {
        this.form = this.fb.group({
            id: [0],
            companyId: [1, Validators.required],
            complexName: ['', Validators.required],
            address: ['', Validators.required],
            totalArea: [null, [Validators.required, Validators.min(1)]],
            landArea: [null, [Validators.required, Validators.min(1)]],
            totalBuildings: [null, [Validators.required, Validators.min(1)]],
            latitude: [null],
            longitude: [null]
        });
    }

    private loadDropdowns(): void {
        this.loading = true
        forkJoin({
            companies: this.dropdownService.getCompaniesDropdown(),
        }).subscribe({
            next: ({ companies }) => {
                this.companies = companies;

                // Load apartment data after dropdowns are ready (edit mode)
                if (this.isEdit && this.data.complexId) {
                    this.loadComplex(this.data.complexId);
                }else{
                    this.loading = false
                }
            },
            error: (error) => {
                this.notificationService.error(error.error.message);
            }
        });
    }

    private loadComplex(id: number): void {
        this.complexService.getComplexById(id).subscribe({
            next: (response) => {
                if (response.status && response.data) {
                    this.form.patchValue(response.data);
                    this.loading = false
                }
            },
            error: () => {
            }
        });
    }

    onSave(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const formData: ComplexFormData = this.form.value;

        this.complexService.saveComplex(formData).subscribe({
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
}
