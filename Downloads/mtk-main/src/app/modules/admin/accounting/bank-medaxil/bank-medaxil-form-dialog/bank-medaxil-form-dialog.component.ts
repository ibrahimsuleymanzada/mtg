import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { DateTime } from 'luxon';
import { NotificationService } from 'app/core/services/notification.service';
import { BankMedaxilService } from 'app/core/services/accounting/bank-medaxil.service';
import { BankMedaxilFormData } from 'app/core/models/accounting/bank-medaxil.types';
import { DropdownService } from 'app/core/services/dropdown.service';
import { InvoiceAutocompleteItem } from 'app/core/models/invoice.model';
import { TranslocoModule } from '@ngneat/transloco';

@Component({
    selector: 'bank-medaxil-form-dialog',
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
        MatDatepickerModule,
        MatAutocompleteModule,
        TranslocoModule,
    ],
    templateUrl: './bank-medaxil-form-dialog.component.html'
})
export class BankMedaxilFormDialogComponent implements OnInit, OnDestroy {
    form: FormGroup;
    isEdit = false;
    dropdownsLoading = true;

    filteredInvoices: InvoiceAutocompleteItem[] = [];
    invoiceSearchLoading = false;
    private invoiceSearchSubject = new Subject<string>();

    remainingAmount: number | null = null;

    constructor(
        public dialogRef: MatDialogRef<BankMedaxilFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { bankMedaxilId?: number },
        private fb: FormBuilder,
        private bankMedaxilService: BankMedaxilService,
        private notificationService: NotificationService,
        private dropdownService: DropdownService,
    ) {
        this.isEdit = !!data?.bankMedaxilId;
        this.initForm();
    }

    ngOnInit(): void {
        this.setupInvoiceAutocomplete();
        if (this.isEdit && this.data.bankMedaxilId) {
            this.loadRecord(this.data.bankMedaxilId);
        } else {
            this.dropdownsLoading = false;
        }
    }

    ngOnDestroy(): void {
        this.invoiceSearchSubject.complete();
    }

    private initForm(): void {
        this.form = this.fb.group({
            id: [0],
            invoiceId: [null, Validators.required],
            invoiceNumber: [null, Validators.required],
            amount: [null, [Validators.required, Validators.min(0.01)]],
            paymentDate: [DateTime.now(), Validators.required],
            notes: [null],
        });
    }

    private setupInvoiceAutocomplete(): void {
        this.invoiceSearchSubject.pipe(
            debounceTime(400),
            distinctUntilChanged(),
            switchMap(term => {
                if (!term || term.trim().length < 2) {
                    this.filteredInvoices = [];
                    this.invoiceSearchLoading = false;
                    return [];
                }
                this.invoiceSearchLoading = true;
                return this.dropdownService.getInvoiceAutocomplete(term);
            })
        ).subscribe({
            next: (results) => { this.filteredInvoices = results; this.invoiceSearchLoading = false; },
            error: () => { this.filteredInvoices = []; this.invoiceSearchLoading = false; }
        });
    }

    onInvoiceSearch(event: Event): void {
        this.form.patchValue({ invoiceId: null });
        this.remainingAmount = null;
        this.invoiceSearchSubject.next((event.target as HTMLInputElement).value);
    }

    onInvoiceSelected(event: MatAutocompleteSelectedEvent): void {
        const item = this.filteredInvoices.find(i => i.invoiceNumber === event.option.value);
        if (item) {
            this.remainingAmount = item.remainingAmount;
            this.form.patchValue({ invoiceId: item.id, invoiceNumber: item.invoiceNumber });
            const amountControl = this.form.get('amount')!;
            amountControl.setValue(item.remainingAmount);
            amountControl.setValidators([
                Validators.required,
                Validators.min(0.01),
                Validators.max(item.remainingAmount),
            ]);
            amountControl.updateValueAndValidity();
        }
    }

    private loadRecord(id: number): void {
        this.bankMedaxilService.getBankMedaxilById(id).subscribe({
            next: (response) => {
                if (response.status && response.data) {
                    const record = Array.isArray(response.data) ? response.data[0] : response.data;
                    this.form.patchValue(record);
                } else {
                    this.notificationService.info(response.message || 'Məlumat tapılmadı');
                }
                this.dropdownsLoading = false;
            },
            error: () => {
                this.notificationService.error('Məlumat yüklənərkən xəta baş verdi');
                this.dropdownsLoading = false;
            }
        });
    }

    onSave(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        const { invoiceNumber, ...formData } = this.form.value;
        const payload: BankMedaxilFormData = formData;
        this.bankMedaxilService.saveBankMedaxil(payload).subscribe({
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
