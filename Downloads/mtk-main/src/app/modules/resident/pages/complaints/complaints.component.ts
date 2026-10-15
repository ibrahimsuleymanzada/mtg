import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { ResidentService } from 'app/core/services/resident/resident.service';
import { NotificationService } from 'app/core/services/notification.service';
import { ResidentComplaintListItem } from 'app/core/models/resident/resident.types';
import { ResidentComplaintFormDialogComponent } from './complaint-form-dialog/complaint-form-dialog.component';
import { ResidentComplaintMessagesDialogComponent } from './complaint-messages-dialog/complaint-messages-dialog.component';

@Component({
    selector        : 'resident-complaints',
    templateUrl     : './complaints.component.html',
    encapsulation   : ViewEncapsulation.None,
    changeDetection : ChangeDetectionStrategy.OnPush,
    standalone      : true,
    imports: [
        CommonModule,
        TranslocoModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatMenuModule,
    ],
})
export class ResidentComplaintsComponent implements OnInit, OnDestroy {
    allComplaints:      ResidentComplaintListItem[] = [];
    filteredComplaints: ResidentComplaintListItem[] = [];
    loading  = true;
    activeTab = 'all';

    private _unsubscribeAll = new Subject<void>();

    constructor(
        private _residentService:     ResidentService,
        private _matDialog:           MatDialog,
        private _confirmationService: FuseConfirmationService,
        private _translocoService:    TranslocoService,
        private _notificationService: NotificationService,
        private _cdr:                 ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        this._loadComplaints();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    // ── Private ─────────────────────────────────────────────────────────

    private _loadComplaints(): void {
        this.loading = true;
        this._residentService.getMyComplaints(1, 100)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (res) => {
                    this.allComplaints = res.data?.result ?? [];
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
        this.filteredComplaints = this.activeTab === 'all'
            ? [...this.allComplaints]
            : this.allComplaints.filter(c => c.status === this.activeTab);
        this._cdr.markForCheck();
    }

    // ── Public ──────────────────────────────────────────────────────────

    setTab(tab: string): void {
        this.activeTab = tab;
        this._applyFilter();
    }

    priorityBadgeClass(priority: string): Record<string, boolean> {
        return {
            'bg-blue-100 text-blue-700':     priority === 'Low',
            'bg-yellow-100 text-yellow-700': priority === 'Medium' || priority === 'Normal',
            'bg-orange-100 text-orange-700': priority === 'High' || priority === 'Important',
            'bg-red-100 text-red-700':       priority === 'Critical' || priority === 'Urgent',
        };
    }

    statusBadgeClass(status: string): Record<string, boolean> {
        return {
            'bg-blue-100 text-blue-700':   status === 'Open',
            'bg-orange-100 text-orange-700': status === 'InProgress',
            'bg-green-100 text-green-700': status === 'Resolved',
            'bg-gray-100 text-gray-500':   status === 'Closed',
        };
    }

    priorityIcon(priority: string): string {
        switch (priority) {
            case 'Critical':
            case 'Urgent':    return 'error';
            case 'High':
            case 'Important': return 'warning';
            case 'Medium':
            case 'Normal':    return 'info';
            default:          return 'low_priority';
        }
    }

    openCreateDialog(): void {
        this._matDialog.open(ResidentComplaintFormDialogComponent, {
            width: '100%',
            maxWidth: '560px',
                maxHeight: '98vh',
            data: {},
        }).afterClosed().subscribe(result => {
            if (result) this._loadComplaints();
        });
    }

    openEditDialog(complaint: ResidentComplaintListItem): void {
        this._matDialog.open(ResidentComplaintFormDialogComponent, {
            width: '100%',
            maxWidth: '560px',
            maxHeight: '98vh',
            data: { complaintId: complaint.id },
        }).afterClosed().subscribe(result => {
            if (result) this._loadComplaints();
        });
    }

    openMessagesDialog(complaint: ResidentComplaintListItem): void {
        this._matDialog.open(ResidentComplaintMessagesDialogComponent, {
            width: '100%',
            maxWidth: '560px',
            maxHeight: '98vh',
            data: { complaintId: complaint.id, complaintNumber: complaint.complaintNumber },
        });
    }

    deleteComplaint(complaint: ResidentComplaintListItem): void {
        const message = this._translocoService.translate(
            'resident.complaints.confirmation.delete.message',
            { complaintNumber: complaint.complaintNumber }
        );
        const confirmation = this._confirmationService.open({
            title:   'resident.complaints.confirmation.delete.title',
            message,
            icon:    { show: true, name: 'heroicons_outline:exclamation-triangle', color: 'warn' },
            actions: {
                confirm: { show: true, label: 'common.actions.delete', color: 'warn' },
                cancel:  { show: true, label: 'common.actions.cancel' },
            },
            dismissible: true,
        });
        confirmation.afterClosed().subscribe(result => {
            if (result === 'confirmed') {
                this._residentService.deleteMyComplaint(complaint.id)
                    .pipe(takeUntil(this._unsubscribeAll))
                    .subscribe({
                        next: (res) => {
                            if (res.status) {
                                this._notificationService.success(res.message);
                                this._loadComplaints();
                            } else {
                                this._notificationService.info(res.message);
                            }
                        },
                    });
            }
        });
    }

    get openCount():       number { return this.allComplaints.filter(c => c.status === 'Open').length; }
    get inProgressCount(): number { return this.allComplaints.filter(c => c.status === 'InProgress').length; }
    get resolvedCount():   number { return this.allComplaints.filter(c => c.status === 'Resolved').length; }
    get closedCount():     number { return this.allComplaints.filter(c => c.status === 'Closed').length; }
}
