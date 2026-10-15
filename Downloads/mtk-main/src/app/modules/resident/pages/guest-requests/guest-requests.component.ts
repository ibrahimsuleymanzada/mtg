import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { AccessService } from 'app/core/services/access/access.service';
import { NotificationService } from 'app/core/services/notification.service';
import { MyGuestRequest } from 'app/core/models/resident/resident.types';
import { GuestRequestFormDialogComponent } from './guest-request-form-dialog/guest-request-form-dialog.component';

@Component({
    selector        : 'resident-guest-requests',
    templateUrl     : './guest-requests.component.html',
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
export class ResidentGuestRequestsComponent implements OnInit, OnDestroy {
    allRequests:      MyGuestRequest[] = [];
    filteredRequests: MyGuestRequest[] = [];
    loading = true;
    activeTab = 'all';

    private _unsubscribeAll = new Subject<void>();

    constructor(
        private _accessService:       AccessService,
        private _matDialog:           MatDialog,
        private _confirmationService: FuseConfirmationService,
        private _translocoService:    TranslocoService,
        private _notificationService: NotificationService,
        private _cdr:                 ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        this._load();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    get pendingCount():   number { return this.allRequests.filter(r => r.status === 'Pending').length; }
    get activeCount():    number { return this.allRequests.filter(r => r.status === 'Active').length; }
    get rejectedCount():  number { return this.allRequests.filter(r => r.status === 'Rejected').length; }
    get cancelledCount(): number { return this.allRequests.filter(r => r.status === 'Cancelled').length; }
    get expiredCount():   number { return this.allRequests.filter(r => r.status === 'Expired').length; }

    setTab(tab: string): void {
        this.activeTab = tab;
        this.filteredRequests = tab === 'all'
            ? [...this.allRequests]
            : this.allRequests.filter(r => r.status === tab);
        this._cdr.markForCheck();
    }

    openCreateDialog(): void {
        const dialogRef = this._matDialog.open(GuestRequestFormDialogComponent, {
            width: '560px',
            panelClass: 'fuse-confirmation-dialog-panel',
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) this._load();
        });
    }

    onCancel(item: MyGuestRequest): void {
        const message = this._translocoService.translate(
            'resident.guestRequests.confirmation.cancel.message',
            { plateNumber: item.plateNumber }
        );
        const confirmation = this._confirmationService.open({
            title: 'resident.guestRequests.confirmation.cancel.title',
            message,
            icon: { show: true, name: 'heroicons_outline:x-circle', color: 'warn' },
            actions: {
                confirm: { show: true, label: 'resident.guestRequests.actions.cancel', color: 'warn' },
                cancel:  { show: true, label: 'common.actions.cancel' },
            },
            dismissible: true,
        });
        confirmation.afterClosed().pipe(takeUntil(this._unsubscribeAll)).subscribe(result => {
            if (result === 'confirmed') {
                this._accessService.cancelGuestRequest(item.id).subscribe({
                    next: (response) => {
                        if (response.status) {
                            this._notificationService.success(response.message);
                            this._load();
                        } else {
                            this._notificationService.info(response.message);
                        }
                    },
                });
            }
        });
    }

    private _load(): void {
        this.loading = true;
        this._cdr.markForCheck();
        this._accessService.getMyGuestRequests()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    this.allRequests = response.data ?? [];
                    this.setTab(this.activeTab);
                    this.loading = false;
                    this._cdr.markForCheck();
                },
                error: () => {
                    this.loading = false;
                    this._cdr.markForCheck();
                },
            });
    }
}
