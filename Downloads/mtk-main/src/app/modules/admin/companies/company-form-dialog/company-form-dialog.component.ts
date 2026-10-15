import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoModule } from '@ngneat/transloco';
import { NotificationService } from 'app/core/services/notification.service';
import { CompaniesService } from 'app/core/services/companies/companies.service';
import { CompanyFormData } from 'app/core/models/companies/company.types';

@Component({
    selector: 'company-form-dialog',
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
        TranslocoModule
    ],
    templateUrl: './company-form-dialog.component.html'
})
export class CompanyFormDialogComponent implements OnInit {
    form: FormGroup;
    isEdit = false;
    loading = true;

    constructor(
        public dialogRef: MatDialogRef<CompanyFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { companyId?: number },
        private fb: FormBuilder,
        private companiesService: CompaniesService,
        private notificationService: NotificationService
    ) {
        this.isEdit = !!data?.companyId;
        this.initForm();
    }

    ngOnInit(): void {
        if (this.isEdit && this.data.companyId) {
            this.loadCompany(this.data.companyId);
        } else {
            this.loading = false;
        }
    }

    private initForm(): void {
        this.form = this.fb.group({
            id:           [0],
            companyName:  [null, Validators.required],
            taxNumber:    [null, Validators.required],
            directorName: [null, Validators.required],
            contactPhone: [null, Validators.required],
            email:        [null, [Validators.email]],
            address:      [null],
            description:  [null]
        });
    }

    private loadCompany(id: number): void {
        this.companiesService.getCompanyById(id).subscribe({
            next: (response) => {
                const item = Array.isArray(response.data) ? response.data[0] : response.data;
                if (response.status && item) {
                    this.form.patchValue(item);
                } else {
                    this.notificationService.info(response.message || 'Məlumat tapılmadı');
                }
                this.loading = false;
            },
            error: (error) => {
                this.notificationService.error(error?.error?.message || 'Məlumat yüklənərkən xəta baş verdi');
                this.loading = false;
            }
        });
    }

    onSave(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        const payload: CompanyFormData = this.form.value;
        this.companiesService.saveCompany(payload).subscribe({
            next: (response) => {
                if (response.status) {
                    this.dialogRef.close(true);
                    this.notificationService.success(response.message);
                } else {
                    this.notificationService.info(response.message);
                }
            }
        });
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }
}
