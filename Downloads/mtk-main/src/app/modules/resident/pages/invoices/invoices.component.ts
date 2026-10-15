import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { TranslocoModule } from '@ngneat/transloco';
import { ResidentService } from 'app/core/services/resident/resident.service';
import { ResidentInvoiceListItem } from 'app/core/models/resident/resident.types';
import { PayInvoiceDialogComponent } from './pay-invoice-dialog.component';

@Component({
    selector        : 'resident-invoices',
    templateUrl     : './invoices.component.html',
    encapsulation   : ViewEncapsulation.None,
    changeDetection : ChangeDetectionStrategy.OnPush,
    standalone      : true,
    imports: [
        CommonModule,
        TranslocoModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
    ],
})
export class ResidentInvoicesComponent implements OnInit, OnDestroy {
    allInvoices:      ResidentInvoiceListItem[] = [];
    filteredInvoices: ResidentInvoiceListItem[] = [];
    loading  = true;
    activeTab = 'all';

    private _unsubscribeAll = new Subject<void>();

    constructor(
        private _residentService: ResidentService,
        private _matDialog:       MatDialog,
        private _cdr:             ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        this._loadInvoices();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    private _loadInvoices(): void {
        this.loading = true;
        this._residentService.getMyInvoices(1, 100)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (res) => {
                    this.allInvoices = res.data?.result ?? [];
                    this._applyFilter();
                    this.loading = false;
                    this._cdr.markForCheck();
                },
                error: () => {
                    this.loading = false;
                    this._cdr.markForCheck();
                },
            });
    }

    private _applyFilter(): void {
        this.filteredInvoices = this.activeTab === 'all'
            ? [...this.allInvoices]
            : this.allInvoices.filter(i => i.status === this.activeTab);
        this._cdr.markForCheck();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    setTab(tab: string): void {
        this.activeTab = tab;
        this._applyFilter();
    }

    paidPercent(invoice: ResidentInvoiceListItem): number {
        if (!invoice.amount) return 0;
        return Math.min(100, (invoice.paidAmount / invoice.amount) * 100);
    }

    isOverdue(invoice: ResidentInvoiceListItem): boolean {
        return invoice.status === 'Overdue';
    }

    canPay(invoice: ResidentInvoiceListItem): boolean {
        return invoice.status === 'Pending' || invoice.status === 'Partial' || invoice.status === 'Overdue';
    }

    statusBadgeClass(status: string): Record<string, boolean> {
        return {
            'bg-blue-100 text-blue-700':     status === 'Pending',
            'bg-orange-100 text-orange-700': status === 'Partial',
            'bg-green-100 text-green-700':   status === 'Paid',
            'bg-red-100 text-red-700':       status === 'Overdue',
            'bg-gray-100 text-gray-500':     status === 'Cancelled',
        };
    }

    openPayDialog(invoice: ResidentInvoiceListItem): void {
        this._matDialog.open(PayInvoiceDialogComponent, {
            width:       '100%',
            maxWidth:    '420px',
            data:        { invoice },
        }).afterClosed().subscribe(result => {
            if (result) this._loadInvoices();
        });
    }

    get pendingCount():   number { return this.allInvoices.filter(i => i.status === 'Pending').length; }
    get partialCount():   number { return this.allInvoices.filter(i => i.status === 'Partial').length; }
    get paidCount():      number { return this.allInvoices.filter(i => i.status === 'Paid').length; }
    get overdueCount():   number { return this.allInvoices.filter(i => i.status === 'Overdue').length; }
    get cancelledCount(): number { return this.allInvoices.filter(i => i.status === 'Cancelled').length; }
}
