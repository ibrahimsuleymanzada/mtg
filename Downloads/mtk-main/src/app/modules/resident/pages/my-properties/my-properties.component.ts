import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoModule } from '@ngneat/transloco';
import { ResidentService } from 'app/core/services/resident/resident.service';
import { ResidentMyApartment, ResidentMyCommercialSpace, ResidentMyParkingSpace } from 'app/core/models/resident/resident.types';

@Component({
    selector: 'resident-my-properties',
    templateUrl: './my-properties.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [CommonModule, TranslocoModule, MatIconModule, MatProgressSpinnerModule],
})
export class ResidentMyPropertiesComponent implements OnInit, OnDestroy {
    apartments: ResidentMyApartment[] = [];
    parkingSpaces: ResidentMyParkingSpace[] = [];
    commercialSpaces: ResidentMyCommercialSpace[] = [];
    loading = true;

    private _unsubscribeAll = new Subject<void>();

    constructor(
        private _residentService: ResidentService,
        private _cdr: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        this._loadProperties();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    private _loadProperties(): void {
        this.loading = true;
        this._residentService.getMyProperties()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (res) => {
                    if (res.status && res.data) {
                        const d = res.data;
                        this.apartments = [
                            ...d.apartments.owned,
                            ...d.apartments.rented,
                        ];
                        this.parkingSpaces = d.parkings;
                        this.commercialSpaces = [
                            ...d.commercials.owned,
                            ...d.commercials.rented,
                        ];
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

    statusBadgeClass(status: string): string {
        switch (status) {
            case 'Owner':  return 'bg-green-100 text-green-700';
            case 'Tenant': return 'bg-blue-100 text-blue-700';
            default:       return 'bg-gray-100 text-gray-500';
        }
    }
}
