import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { TranslocoModule } from '@ngneat/transloco';
import { ResidentService } from 'app/core/services/resident/resident.service';
import { NotificationService } from 'app/core/services/notification.service';
import { DropdownService } from 'app/core/services/dropdown.service';
import { ResidentClaimsData, ResidentClaimItem } from 'app/core/models/resident/resident.types';
import { ResidentNewClaimDialogComponent } from './new-claim-dialog/new-claim-dialog.component';

@Component({
    selector: 'resident-my-claims',
    templateUrl: './my-claims.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        TranslocoModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatTabsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatAutocompleteModule,
    ],
})
export class ResidentMyClaimsComponent implements OnInit, OnDestroy {
    claims: ResidentClaimsData = { apartments: [], parkingSpaces: [], commercialSpaces: [] };
    loading = true;

    private _unsubscribeAll = new Subject<void>();

    constructor(
        private _residentService: ResidentService,
        private _notificationService: NotificationService,
        private _matDialog: MatDialog,
        private _cdr: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        this._loadClaims();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    private _loadClaims(): void {
        this.loading = true;
        this._residentService.getMyClaims()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (res) => {
                    if (res.status && res.data) {
                        this.claims = res.data;
                    }
                    this.loading = false;
                    this._cdr.markForCheck();
                },
                error: () => {
                    this.loading = false;
                    this._cdr.markForCheck();
                },
            });
    }

    openNewClaimDialog(): void {
        this._matDialog.open(ResidentNewClaimDialogComponent, {
            width: '100%',
            maxWidth: '520px',
            maxHeight: '98vh',
            disableClose: true,
        }).afterClosed().subscribe(result => {
            if (result) {
                this._loadClaims();
            }
        });
    }

    statusBadgeClass(status: number): string {
        switch (status) {
            case 2:  return 'bg-green-100 text-green-700';
            case 3:  return 'bg-red-100 text-red-700';
            default: return 'bg-yellow-100 text-yellow-700';
        }
    }

    statusLabel(status: number): string {
        switch (status) {
            case 2:  return 'Təsdiqlənib';
            case 3:  return 'Rədd edilib';
            default: return 'Gözlənilir';
        }
    }
}
