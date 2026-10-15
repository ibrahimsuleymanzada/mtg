import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoModule } from '@ngneat/transloco';
import { DateTime } from 'luxon';
import { ResidentService } from 'app/core/services/resident/resident.service';
import { NotificationService } from 'app/core/services/notification.service';
import { ResidentInvoiceListItem, ResidentPaymentFormData } from 'app/core/models/resident/resident.types';

@Component({
    selector        : 'pay-invoice-dialog',
    templateUrl     : './pay-invoice-dialog.component.html',
    standalone      : true,
    changeDetection : ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatDialogModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatDatepickerModule,
        MatProgressSpinnerModule,
        TranslocoModule,
    ],
})
export class PayInvoiceDialogComponent {
    form: FormGroup;
    loading = false;
    remainingAmount: number;
    discountedRemaining: number;

    constructor(
        public  dialogRef:           MatDialogRef<PayInvoiceDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { invoice: ResidentInvoiceListItem },
        private fb:                  FormBuilder,
        private residentService:     ResidentService,
        private notificationService: NotificationService,
        private cdr:                 ChangeDetectorRef,
    ) {
        this.remainingAmount = data.invoice.remainingAmount;
        this.discountedRemaining = Math.max(0, this.remainingAmount - (data.invoice.discount ?? 0));
        this.form = this.fb.group({
            amount:      [this.discountedRemaining, [Validators.required, Validators.min(0.01), Validators.max(this.discountedRemaining)]],
            paymentDate: [DateTime.now(), Validators.required],
            notes:       [null],
        });
    }

    onSave(): void {
        if (this.form.invalid) return;
        this.loading = true;
        this.cdr.markForCheck();
        const val = this.form.value;
        const payload: ResidentPaymentFormData = {
            invoiceId:     this.data.invoice.id,
            amount:        +val.amount,
            paymentMethod: 'Cash',
            paymentDate:   (val.paymentDate as DateTime).toISO() ?? new Date().toISOString(),
            notes:         val.notes || null,
        };
        this.residentService.saveMyPayment(payload).subscribe({
            next: (res) => {
                this.notificationService.success(res.message);
                this.dialogRef.close(true);
            },
            error: () => {
                this.loading = false;
                this.cdr.markForCheck();
            },
        });
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }
}
