import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { TranslocoModule } from '@ngneat/transloco';
import { DateTime } from 'luxon';
import { NgxMaskDirective } from 'ngx-mask';
import { AccessService } from 'app/core/services/access/access.service';
import { NotificationService } from 'app/core/services/notification.service';
import { DropdownService } from 'app/core/services/dropdown.service';
import { GuestRequestFormData } from 'app/core/models/resident/resident.types';

@Component({
    selector        : 'guest-request-form-dialog',
    templateUrl     : './guest-request-form-dialog.component.html',
    standalone      : true,
    changeDetection : ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatAutocompleteModule,
        MatDatepickerModule,
        NgxMaskDirective,
        TranslocoModule,
    ],
})
export class GuestRequestFormDialogComponent implements OnInit, OnDestroy {
    form: FormGroup;
    loading = false;

    filteredParkings: { key: number; value: string }[] = [];
    parkingSearchLoading = false;
    private _parkingSearch$ = new Subject<string>();
    private _unsubscribeAll = new Subject<void>();

    constructor(
        public  dialogRef:           MatDialogRef<GuestRequestFormDialogComponent>,
        private _fb:                 FormBuilder,
        private _accessService:      AccessService,
        private _notificationService: NotificationService,
        private _dropdownService:    DropdownService,
        private _cdr:                ChangeDetectorRef,
    ) {
        this._initForm();
    }

    ngOnInit(): void {
        this._setupParkingAutocomplete();
    }

    ngOnDestroy(): void {
        this._parkingSearch$.complete();
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    private _initForm(): void {
        this.form = this._fb.group({
            id:               [0],
            parkingSpaceId:   [null],
            parkingSpaceName: [null],
            plateNumber:      ['', Validators.required],
            guestName:        [null, Validators.required],
            guestPhone:       [null, Validators.required],
            vehicleBrand:     [null, Validators.required],
            vehicleModel:     [null, Validators.required],
            startDateTime:    [null, Validators.required],
            endDateTime:      [null],
        });
    }

    private _setupParkingAutocomplete(): void {
        this._parkingSearch$.pipe(
            debounceTime(400),
            distinctUntilChanged(),
            switchMap(term => {
                if (!term || term.trim().length < 2) {
                    this.filteredParkings = [];
                    this.parkingSearchLoading = false;
                    return [];
                }
                this.parkingSearchLoading = true;
                return this._dropdownService.getParkingSpaceAutocomplete(term);
            })
        ).subscribe({
            next: (results) => {
                this.filteredParkings = results;
                this.parkingSearchLoading = false;
                this._cdr.markForCheck();
            },
            error: () => {
                this.filteredParkings = [];
                this.parkingSearchLoading = false;
                this._cdr.markForCheck();
            }
        });
    }

    onParkingSearch(event: Event): void {
        this.form.patchValue({ parkingSpaceId: null });
        this._parkingSearch$.next((event.target as HTMLInputElement).value);
    }

    onParkingSelected(event: MatAutocompleteSelectedEvent): void {
        const item = this.filteredParkings.find(p => p.value === event.option.value);
        if (item) {
            this.form.patchValue({ parkingSpaceId: item.key, parkingSpaceName: item.value });
        }
    }

    onSave(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        this.loading = true;
        this._cdr.markForCheck();

        const val = this.form.value;
        const toIso = (d: any): string =>
            d instanceof DateTime ? d.toISO()! : new Date(d).toISOString();

        const payload: GuestRequestFormData = {
            id:             val.id,
            parkingSpaceId: val.parkingSpaceId,
            guestName:      val.guestName || null,
            guestPhone:     val.guestPhone || null,
            plateNumber:    val.plateNumber,
            vehicleBrand:   val.vehicleBrand || null,
            vehicleModel:   val.vehicleModel || null,
            startDateTime:  toIso(val.startDateTime),
            endDateTime:    toIso(val.endDateTime),
        };

        this._accessService.saveGuestRequest(payload).subscribe({
            next: (response) => {
                if (response.status) {
                    this._notificationService.success(response.message);
                    this.dialogRef.close(true);
                } else {
                    this._notificationService.info(response.message);
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

    onCancel(): void {
        this.dialogRef.close(false);
    }
}
