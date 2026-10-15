import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslocoModule } from '@ngneat/transloco';
import { DateTime } from 'luxon';
import { ResidentService } from 'app/core/services/resident/resident.service';
import { ResidentPaymentListItem } from 'app/core/models/resident/resident.types';

@Component({
    selector        : 'resident-payments',
    templateUrl     : './payments.component.html',
    encapsulation   : ViewEncapsulation.None,
    changeDetection : ChangeDetectionStrategy.OnPush,
    standalone      : true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        TranslocoModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatDatepickerModule,
        MatFormFieldModule,
        MatInputModule,
    ],
})
export class ResidentPaymentsComponent implements OnInit, OnDestroy {
    payments: ResidentPaymentListItem[] = [];
    loading  = false;
    filterForm: FormGroup;

    private _unsubscribeAll = new Subject<void>();

    constructor(
        private _residentService: ResidentService,
        private _fb:              FormBuilder,
        private _cdr:             ChangeDetectorRef,
    ) {
        const now = DateTime.now();
        this.filterForm = this._fb.group({
            start: [now.startOf('month')],
            end:   [now.endOf('month')],
        });
    }

    ngOnInit(): void {
        this._load();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    search(): void {
        this._load();
    }

    methodIcon(method: string): string {
        return method === 'Cash' ? 'payments' : 'account_balance';
    }

    get totalAmount(): number {
        return this.payments.reduce((s, p) => s + p.amount, 0);
    }

    private _load(): void {
        const { start, end } = this.filterForm.value;
        if (!start || !end) return;
        this.loading = true;
        const beginDate = (start as DateTime).startOf('day').toISO();
        const endDate   = (end   as DateTime).endOf('day').toISO();
        this._residentService.getMyPayments(beginDate, endDate, 1, 200)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (res) => {
                    this.payments = res.data?.result ?? [];
                    this.loading  = false;
                    this._cdr.markForCheck();
                },
                error: () => {
                    this.loading = false;
                    this._cdr.markForCheck();
                },
            });
    }
}
