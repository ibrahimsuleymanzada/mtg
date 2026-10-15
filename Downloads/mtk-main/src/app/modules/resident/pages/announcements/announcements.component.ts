import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { ResidentService } from 'app/core/services/resident/resident.service';
import { DropdownService } from 'app/core/services/dropdown.service';
import { NotificationService } from 'app/core/services/notification.service';
import { DropdownItem } from 'app/core/models/dropdown.model';
import { ResidentPublicAnnouncementListItem, ResidentMyAnnouncementListItem } from 'app/core/models/resident/resident.types';
import { ResidentAnnouncementFormDialogComponent } from './announcement-form-dialog/announcement-form-dialog.component';

@Component({
    selector        : 'resident-announcements',
    templateUrl     : './announcements.component.html',
    encapsulation   : ViewEncapsulation.None,
    changeDetection : ChangeDetectionStrategy.OnPush,
    standalone      : true,
    imports: [
        CommonModule,
        TranslocoModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        MatMenuModule,
    ],
})
export class ResidentAnnouncementsComponent implements OnInit, OnDestroy {
    activeSection: 'public' | 'my' = 'public';

    // Public announcements
    complexes: DropdownItem[] = [];
    selectedComplexId: number | null = null;
    publicAnnouncements: ResidentPublicAnnouncementListItem[] = [];
    publicLoading = true;

    // My announcements
    myAnnouncements: ResidentMyAnnouncementListItem[] = [];
    myLoading = true;

    private _unsubscribeAll = new Subject<void>();

    constructor(
        private _residentService:     ResidentService,
        private _dropdownService:     DropdownService,
        private _matDialog:           MatDialog,
        private _confirmationService: FuseConfirmationService,
        private _translocoService:    TranslocoService,
        private _notificationService: NotificationService,
        private _cdr:                 ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        this._loadComplexes();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    // ── Private ─────────────────────────────────────────────────────────

    private _loadComplexes(): void {
        this._dropdownService.getComplexesDropdown()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (complexes) => {
                    this.complexes = complexes;
                    if (complexes.length > 0) {
                        this.selectedComplexId = complexes[0].key;
                        this._loadPublicAnnouncements();
                    } else {
                        this.publicLoading = false;
                        this._cdr.markForCheck();
                    }
                },
                error: () => {
                    this.publicLoading = false;
                    this._cdr.markForCheck();
                },
            });
    }

    private _loadPublicAnnouncements(): void {
        if (!this.selectedComplexId) return;
        this.publicLoading = true;
        this._cdr.markForCheck();
        this._residentService.getPublicAnnouncements(this.selectedComplexId, 1, 100)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (res) => {
                    this.publicAnnouncements = res.data?.result ?? [];
                    this.publicLoading = false;
                    this._cdr.markForCheck();
                },
                error: () => {
                    this.publicLoading = false;
                    this._cdr.markForCheck();
                },
            });
    }

    private _loadMyAnnouncements(): void {
        this.myLoading = true;
        this._cdr.markForCheck();
        this._residentService.getMyAnnouncements(1, 100)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (res) => {
                    this.myAnnouncements = res.data?.result ?? [];
                    this.myLoading = false;
                    this._cdr.markForCheck();
                },
                error: () => {
                    this.myLoading = false;
                    this._cdr.markForCheck();
                },
            });
    }

    // ── Public ──────────────────────────────────────────────────────────

    setSection(section: 'public' | 'my'): void {
        this.activeSection = section;
        if (section === 'my' && this.myAnnouncements.length === 0) {
            this._loadMyAnnouncements();
        }
    }

    onComplexChange(complexId: number): void {
        this.selectedComplexId = complexId;
        this._loadPublicAnnouncements();
    }

    priorityBadgeClass(priority: string): Record<string, boolean> {
        return {
            'bg-blue-100 text-blue-700':     priority === 'Low',
            'bg-yellow-100 text-yellow-700': priority === 'Normal',
            'bg-orange-100 text-orange-700': priority === 'Important',
            'bg-red-100 text-red-700':       priority === 'Urgent' || priority === 'High',
        };
    }

    statusBadgeClass(status: string): Record<string, boolean> {
        return {
            'bg-green-100 text-green-700':   status === 'Active' || status === 'Approved',
            'bg-yellow-100 text-yellow-700': status === 'Pending',
            'bg-red-100 text-red-700':       status === 'Rejected' || status === 'Expired',
        };
    }

    categoryIcon(category: string): string {
        switch (category) {
            case 'Maintenance': return 'build';
            case 'Events':      return 'event';
            case 'ForSale':     return 'sell';
            case 'Services':    return 'handyman';
            case 'Jobs':        return 'work';
            case 'Lost':        return 'search';
            default:            return 'campaign';
        }
    }

    openCreateDialog(): void {
        this._matDialog.open(ResidentAnnouncementFormDialogComponent, {
            width: '100%',
            maxWidth: '560px',
            maxHeight: '98vh',
            data: {},
        }).afterClosed().subscribe(result => {
            if (result) this._loadMyAnnouncements();
        });
    }

    openEditDialog(announcement: ResidentMyAnnouncementListItem): void {
        this._matDialog.open(ResidentAnnouncementFormDialogComponent, {
            width: '100%',
            maxWidth: '560px',
            maxHeight: '98vh',
            data: { announcementId: announcement.id },
        }).afterClosed().subscribe(result => {
            if (result) this._loadMyAnnouncements();
        });
    }

    deleteAnnouncement(announcement: ResidentMyAnnouncementListItem): void {
        const message = this._translocoService.translate(
            'resident.announcements.confirmation.delete.message',
            { title: announcement.title }
        );
        const confirmation = this._confirmationService.open({
            title:   'resident.announcements.confirmation.delete.title',
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
                this._residentService.deleteMyAnnouncement(announcement.id)
                    .pipe(takeUntil(this._unsubscribeAll))
                    .subscribe({
                        next: (res) => {
                            if (res.status) {
                                this._notificationService.success(res.message);
                                this._loadMyAnnouncements();
                            } else {
                                this._notificationService.info(res.message);
                            }
                        },
                    });
            }
        });
    }

    isExpired(expiryDate: string): boolean {
        return new Date(expiryDate) < new Date();
    }
}
