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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { forkJoin } from 'rxjs';
import { NotificationService } from 'app/core/services/notification.service';
import { DropdownService } from 'app/core/services/dropdown.service';
import { DropdownItem } from 'app/core/models/dropdown.model';
import { TranslocoModule } from '@ngneat/transloco';
import { ServiceTariffsService } from 'app/core/services/accounting/service-tariffs.service';
import { ServiceTariffFormData } from 'app/core/models/accounting/service-tariff.types';

@Component({
    selector: 'service-tariff-form-dialog',
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
        MatDatepickerModule,
        TranslocoModule
    ],
    templateUrl: './service-tariff-form-dialog.component.html'
})
export class ServiceTariffFormDialogComponent implements OnInit {
    form: FormGroup;
    isEdit: boolean = false;
    dropdownsLoading: boolean = true;

    serviceTypes: DropdownItem[] = [];
    companies: any[] = [];
    complexes: DropdownItem[] = [];
    calculationTypes: DropdownItem[] = [];
    unitOfMeasures: DropdownItem[] = [];

    constructor(
        public dialogRef: MatDialogRef<ServiceTariffFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { tariffId?: number },
        private fb: FormBuilder,
        private serviceTariffsService: ServiceTariffsService,
        private notificationService: NotificationService,
        private dropdownService: DropdownService,
    ) {
        this.isEdit = !!data?.tariffId;
        this.initForm();
    }

    ngOnInit(): void {
        this.loadDropdowns();
    }

    private initForm(): void {
        this.form = this.fb.group({
            id: [0],
            serviceTypeRefId: [null, Validators.required],
            companyId: [null, Validators.required],
            complexId: [null, Validators.required],
            calculationTypeRefId: [null, Validators.required],
            unitOfMeasureRefId: [null, Validators.required],
            pricePerUnit: [null, [Validators.required, Validators.min(0)]],
            minimumCharge: [0],
            tier1Limit: [null],
            tier1Price: [null],
            tier2Limit: [null],
            tier2Price: [null],
            tier3Price: [null],
            validFrom: [null, Validators.required],
            validTo: [null]
        });
    }

    private loadDropdowns(): void {
        this.dropdownsLoading = true;

        forkJoin({
            serviceTypes: this.dropdownService.getSpecCodeByType('ServiceType'),
            companies: this.dropdownService.getCompaniesDropdown(),
            complexes: this.dropdownService.getComplexesDropdown(),
            calculationTypes: this.dropdownService.getSpecCodeByType('CalculationType'),
            unitOfMeasures: this.dropdownService.getSpecCodeByType('UnitOfMeasure')
        }).subscribe({
            next: ({ serviceTypes, companies, complexes, calculationTypes, unitOfMeasures }) => {
                this.serviceTypes = serviceTypes;
                this.companies = companies;
                this.complexes = complexes;
                this.calculationTypes = calculationTypes;
                this.unitOfMeasures = unitOfMeasures;

                if (this.isEdit && this.data.tariffId) {
                    this.loadServiceTariff(this.data.tariffId);
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

    private loadServiceTariff(id: number): void {
        this.serviceTariffsService.getServiceTariffById(id).subscribe({
            next: (response) => {
                if (response.status && response.data) {
                    const tariff = Array.isArray(response.data) ? response.data[0] : response.data;
                    this.form.patchValue(tariff);
                    this.dropdownsLoading = false;
                } else {
                    this.notificationService.info(response.message || 'Tarif məlumatları tapılmadı');
                    this.dropdownsLoading = false;
                }
            },
            error: () => {
                this.notificationService.error('Tarif yüklənərkən xəta baş verdi');
                this.dropdownsLoading = false;
            }
        });
    }

    onSave(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const formData: ServiceTariffFormData = this.form.value;

        this.serviceTariffsService.saveServiceTariff(formData).subscribe({
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
