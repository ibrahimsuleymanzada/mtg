import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoModule } from '@ngneat/transloco';
import { Subject, takeUntil } from 'rxjs';
import { AccountingDashboardService } from 'app/core/services/accounting/accounting-dashboard.service';
import { AccountingDashboard } from 'app/core/models/accounting/accounting-dashboard.types';
import { NotificationService } from 'app/core/services/notification.service';

@Component({
    selector: 'accounting-dashboard',
    standalone: true,
    templateUrl: './dashboard.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule,
        MatCardModule,
        MatIconModule,
        MatProgressSpinnerModule,
        TranslocoModule,
    ]
})
export class DashboardComponent implements OnInit, OnDestroy {
    dashboardData: AccountingDashboard | null = null;
    loading = true;

    private _unsubscribeAll = new Subject<void>();

    constructor(
        private _dashboardService: AccountingDashboardService,
        private _notificationService: NotificationService,
        private _cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.loadDashboard();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    loadDashboard(): void {
        this.loading = true;
        this._dashboardService.getDashboard()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    if (response.status && response.data) {
                        this.dashboardData = response.data;
                    }
                    this.loading = false;
                    this._cdr.markForCheck();
                },
                error: () => {
                    this._notificationService.error('Məlumatlar yüklənərkən xəta baş verdi');
                    this.loading = false;
                    this._cdr.markForCheck();
                }
            });
    }
}
