import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { NotificationService } from 'app/core/services/notification.service';
import { ClaimsService, PendingClaim, PendingClaimsResponse } from 'app/core/services/complexes/claims.service';

@Component({
    selector: 'pending-claims',
    standalone: true,
    templateUrl: './pending-claims.component.html',
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        MatTabsModule,
        MatTableModule,
        TranslocoModule
    ]
})
export class PendingClaimsComponent implements OnInit {
    loading = true;

    apartmentsSource = new MatTableDataSource<PendingClaim>([]);
    parkingSource    = new MatTableDataSource<PendingClaim>([]);
    commercialSource = new MatTableDataSource<PendingClaim>([]);

    displayedColumns = ['unitNumber', 'buildingName', 'complexName', 'claimantName', 'deedNumber', 'claimDate', 'actions'];

    constructor(
        private claimsService: ClaimsService,
        private notificationService: NotificationService,
        private confirmationService: FuseConfirmationService,
        private translocoService: TranslocoService
    ) {}

    ngOnInit(): void {
        this.loadClaims();
    }

    loadClaims(): void {
        this.loading = true;
        this.claimsService.getPendingClaims().subscribe({
            next: (response) => {
                if (response.status && response.data) {
                    const data: PendingClaimsResponse = response.data;
                    this.apartmentsSource.data = data.apartments       ?? [];
                    this.parkingSource.data    = data.parkingSpaces    ?? [];
                    this.commercialSource.data = data.commercialSpaces ?? [];
                }
                this.loading = false;
            },
            error: () => {
                this.notificationService.error('Məlumatlar yüklənərkən xəta baş verdi');
                this.loading = false;
            }
        });
    }

    onApprove(claim: PendingClaim): void {
        const message = this.translocoService.translate(
            'modules.pendingClaims.confirmation.approve.message',
            { name: claim.claimantName, unit: claim.unitNumber }
        );
        const confirmation = this.confirmationService.open({
            title: 'modules.pendingClaims.confirmation.approve.title',
            message,
            icon: { show: true, name: 'heroicons_outline:check-circle', color: 'primary' },
            actions: {
                confirm: { show: true, label: 'modules.pendingClaims.actions.approve', color: 'primary' },
                cancel:  { show: true, label: 'common.actions.cancel' }
            },
            dismissible: true
        });
        confirmation.afterClosed().subscribe(result => {
            if (result !== 'confirmed') return;
            this.claimsService.approveClaim(claim.type, claim.id).subscribe({
                next: (response) => {
                    const success = response.status || response.statusCode === 1003;
                    if (success) {
                        this.notificationService.success(response.message || 'Müraciət təsdiq edildi');
                        this.loadClaims();
                    } else {
                        this.notificationService.info(response.message);
                    }
                },
                error: (error) => {
                    this.notificationService.error(error?.error?.message || 'Xəta baş verdi');
                }
            });
        });
    }

    onReject(claim: PendingClaim): void {
        const message = this.translocoService.translate(
            'modules.pendingClaims.confirmation.reject.message',
            { name: claim.claimantName, unit: claim.unitNumber }
        );
        const confirmation = this.confirmationService.open({
            title: 'modules.pendingClaims.confirmation.reject.title',
            message,
            icon: { show: true, name: 'heroicons_outline:exclamation-triangle', color: 'warn' },
            actions: {
                confirm: { show: true, label: 'modules.pendingClaims.actions.reject', color: 'warn' },
                cancel:  { show: true, label: 'common.actions.cancel' }
            },
            dismissible: true
        });
        confirmation.afterClosed().subscribe(result => {
            if (result !== 'confirmed') return;
            this.claimsService.rejectClaim(claim.type, claim.id).subscribe({
                next: (response) => {
                    if (response.status) {
                        this.notificationService.success(response.message || 'Müraciət rədd edildi');
                        this.loadClaims();
                    } else {
                        this.notificationService.info(response.message);
                    }
                },
                error: (error) => {
                    this.notificationService.error(error?.error?.message || 'Xəta baş verdi');
                }
            });
        });
    }

    trackByFn(index: number, item: PendingClaim): number {
        return item.id;
    }
}
