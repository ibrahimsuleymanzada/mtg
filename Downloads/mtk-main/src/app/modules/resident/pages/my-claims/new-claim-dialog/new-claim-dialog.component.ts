import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoModule } from '@ngneat/transloco';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { ResidentService } from 'app/core/services/resident/resident.service';
import { DropdownService } from 'app/core/services/dropdown.service';
import { NotificationService } from 'app/core/services/notification.service';
import { ClaimFormData } from 'app/core/models/resident/resident.types';

@Component({
    selector: 'resident-new-claim-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatSelectModule,
        MatAutocompleteModule,
        MatProgressSpinnerModule,
        TranslocoModule,
    ],
    templateUrl: './new-claim-dialog.component.html',
})
export class ResidentNewClaimDialogComponent implements OnInit {
    form: FormGroup;
    saving = false;

    targetTypes = [
        { value: 'Apartment',       label: 'Mənzil' },
        { value: 'ParkingSpace',    label: 'Qaraj' },
        { value: 'CommercialSpace', label: 'Ticarət obyekti' },
    ];

    filteredUnits: { key: number; value: string }[] = [];
    unitSearchLoading = false;
    private _unitSearchSubject = new Subject<string>();

    constructor(
        public dialogRef: MatDialogRef<ResidentNewClaimDialogComponent>,
        private _fb: FormBuilder,
        private _residentService: ResidentService,
        private _dropdownService: DropdownService,
        private _notificationService: NotificationService,
    ) {
        this._initForm();
    }

    ngOnInit(): void {
        this._setupUnitAutocomplete();
    }

    private _initForm(): void {
        this.form = this._fb.group({
            targetType: [null, Validators.required],
            targetId:   [null, Validators.required],
            targetName: [null, Validators.required],
            deedNumber: [null, Validators.required],
        });
        this.form.get('targetType')?.valueChanges.subscribe(() => {
            this.form.patchValue({ targetId: null, targetName: null });
            this.filteredUnits = [];
        });
    }

    private _setupUnitAutocomplete(): void {
        this._unitSearchSubject.pipe(
            debounceTime(400),
            distinctUntilChanged(),
            switchMap(term => {
                if (!term || term.trim().length < 1) {
                    this.filteredUnits = [];
                    this.unitSearchLoading = false;
                    return [];
                }
                this.unitSearchLoading = true;
                const type = this.form.get('targetType')?.value;
                if (type === 'Apartment') {
                    return this._dropdownService.getApartmentAutocomplete(term);
                } else if (type === 'ParkingSpace') {
                    return this._dropdownService.getParkingSpaceAutocomplete(term);
                } else if (type === 'CommercialSpace') {
                    return this._dropdownService.getCommercialSpaceAutoComplete(term);
                }
                this.unitSearchLoading = false;
                return [];
            })
        ).subscribe({
            next: (results) => {
                this.filteredUnits = results;
                this.unitSearchLoading = false;
            },
            error: () => {
                this.filteredUnits = [];
                this.unitSearchLoading = false;
            },
        });
    }

    onUnitSearch(event: Event): void {
        this.form.patchValue({ targetId: null });
        this._unitSearchSubject.next((event.target as HTMLInputElement).value);
    }

    onUnitSelected(event: MatAutocompleteSelectedEvent): void {
        const selected = this.filteredUnits.find(u => u.value === event.option.value);
        if (selected) {
            this.form.patchValue({ targetId: selected.key, targetName: selected.value });
        }
    }

    onSave(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        this.saving = true;
        const type: string = this.form.get('targetType')?.value;
        const payload: ClaimFormData = {
            targetId:   this.form.get('targetId')?.value,
            deedNumber: this.form.get('deedNumber')?.value,
        };

        let obs$;
        if (type === 'Apartment') {
            obs$ = this._residentService.claimApartment(payload);
        } else if (type === 'ParkingSpace') {
            obs$ = this._residentService.claimParking(payload);
        } else {
            obs$ = this._residentService.claimCommercial(payload);
        }

        obs$.subscribe({
            next: (res) => {
                this.saving = false;
                if (res.status) {
                    this._notificationService.success(res.message || 'Müraciət göndərildi');
                    this.dialogRef.close(true);
                } else {
                    this._notificationService.info(res.message);
                }
            },
            error: () => {
                this.saving = false;
            },
        });
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }
}
