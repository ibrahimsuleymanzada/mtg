import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { TranslocoModule } from '@ngneat/transloco';
import { NotificationService } from 'app/core/services/notification.service';
import { DropdownService } from 'app/core/services/dropdown.service';
import { DropdownItem } from 'app/core/models/dropdown.model';
import { ContractorsService } from 'app/core/services/contractors/contractors.service';
import { ContractorFormData } from 'app/core/models/contractors/contractor.types';
import { forkJoin } from 'rxjs';
import { NgxMaskDirective } from 'ngx-mask';

@Component({
    selector: 'contractor-form-dialog',
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
        MatSelectModule,
        TranslocoModule,
        NgxMaskDirective
    ],
    templateUrl: './contractor-form-dialog.component.html'
})
export class ContractorFormDialogComponent implements OnInit {
    form: FormGroup;
    isEdit = false;
    dropdownsLoading = true;

    serviceTypes: DropdownItem[] = [];

    constructor(
        public dialogRef: MatDialogRef<ContractorFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { contractorId?: number },
        private fb: FormBuilder,
        private contractorsService: ContractorsService,
        private notificationService: NotificationService,
        private dropdownService: DropdownService
    ) {
        this.isEdit = !!data?.contractorId;
        this.initForm();
    }

    ngOnInit(): void {
        this.loadDropdowns();
    }

    private initForm(): void {
        this.form = this.fb.group({
            id:            [0],
            companyName:   [null, Validators.required],
            serviceType:   [null, Validators.required],
            contactPerson: [null, Validators.required],
            phone:         [null, Validators.required],
            email:         [null, [Validators.email]],
            address:       [null],
            taxNumber:     [null],
            notes:         [null]
        });
    }

    private loadDropdowns(): void {
        forkJoin({
            serviceTypes: this.dropdownService.getSpecCodeByType('contractorServiceType')
        }).subscribe({
            next: ({ serviceTypes }) => {
                this.serviceTypes = serviceTypes;
                if (this.isEdit && this.data.contractorId) {
                    this.loadContractor(this.data.contractorId);
                } else {
                    this.dropdownsLoading = false;
                }
            },
            error: () => {
                this.dropdownsLoading = false;
                this.notificationService.error('Siyahı məlumatları yüklənərkən xəta baş verdi');
            }
        });
    }

    private loadContractor(id: number): void {
        this.contractorsService.getContractorById(id).subscribe({
            next: (response) => {
                const item = Array.isArray(response.data) ? response.data[0] : response.data;
                if (response.status && item) {
                    this.form.patchValue(item);
                } else {
                    this.notificationService.info(response.message || 'Məlumat tapılmadı');
                }
                this.dropdownsLoading = false;
            },
            error: (error) => {
                this.notificationService.error(error?.error?.message || 'Məlumat yüklənərkən xəta baş verdi');
                this.dropdownsLoading = false;
            }
        });
    }

    onSave(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        const payload: ContractorFormData = this.form.value;
        this.contractorsService.saveContractor(payload).subscribe({
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
