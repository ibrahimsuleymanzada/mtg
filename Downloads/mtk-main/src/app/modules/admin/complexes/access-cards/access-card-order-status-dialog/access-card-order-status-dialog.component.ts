import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoModule } from '@ngneat/transloco';
import { Subject, takeUntil } from 'rxjs';
import { DateTime } from 'luxon';

import { AccessCardListItem } from 'app/core/models/access-card.model';
import { AccessCardsService } from 'app/core/services/complexes/access-cards.service';
import { DropdownService } from 'app/core/services/dropdown.service';
import { NotificationService } from 'app/core/services/notification.service';
import { DropdownItem } from 'app/core/models/dropdown.model';

@Component({
    selector: 'access-card-order-status-dialog',
    standalone: true,
    templateUrl: './access-card-order-status-dialog.component.html',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatIconModule,
        MatProgressSpinnerModule,
        TranslocoModule,
    ]
})
export class AccessCardOrderStatusDialogComponent implements OnInit, OnDestroy {
    form: FormGroup;
    loading = true;
    saving  = false;
    orderStatusOptions: DropdownItem[] = [];

    private _unsubscribeAll = new Subject<void>();

    constructor(
        public dialogRef: MatDialogRef<AccessCardOrderStatusDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { card: AccessCardListItem },
        private fb: FormBuilder,
        private accessCardsService: AccessCardsService,
        private dropdownService: DropdownService,
        private notificationService: NotificationService,
    ) {
        this.form = this.fb.group({
            orderStatus:   [null, Validators.required],
            deliveredDate: [null],
            orderNotes:    [null],
        });
    }

    ngOnInit(): void {
        this.dropdownService.getSpecCodeByType('CardOrderStatus')
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(items => {
                this.orderStatusOptions = items;
                this.form.patchValue({ orderStatus: this.data.card.orderStatus });
                this.loading = false;
                this.onStatusChange(this.data.card.orderStatus);
            });

        this.form.get('orderStatus').valueChanges
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(val => this.onStatusChange(val));
    }

    onStatusChange(status: string): void {
        const deliveredDate = this.form.get('deliveredDate');
        if (status === 'Delivered') {
            deliveredDate.setValidators(Validators.required);
        } else {
            deliveredDate.clearValidators();
            deliveredDate.setValue(null);
        }
        deliveredDate.updateValueAndValidity();
    }

    onSave(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.saving = true;
        const { orderStatus, deliveredDate, orderNotes } = this.form.value;

        const deliveredDateIso = deliveredDate
            ? DateTime.fromJSDate(deliveredDate).toISO()
            : null;

        this.accessCardsService.updateCardOrderStatus({
            id:            this.data.card.id,
            orderStatus,
            deliveredDate: deliveredDateIso,
            orderNotes,
        }).pipe(takeUntil(this._unsubscribeAll))
          .subscribe({
            next: (response) => {
                this.saving = false;
                if (response.status) {
                    this.notificationService.success(response.message);
                    this.dialogRef.close(true);
                } else {
                    this.notificationService.error(response.message);
                }
            },
            error: () => {
                this.saving = false;
                this.notificationService.error('Xəta baş verdi');
            }
        });
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }

    get isDelivered(): boolean {
        return this.form.get('orderStatus').value === 'Delivered';
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }
}
