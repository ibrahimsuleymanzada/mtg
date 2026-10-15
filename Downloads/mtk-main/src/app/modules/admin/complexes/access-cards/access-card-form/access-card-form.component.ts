import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { TranslocoModule } from '@ngneat/transloco';
import { forkJoin, Subject, takeUntil } from 'rxjs';

import { AccessCardFormData } from 'app/core/models/access-card.model';
import { DropdownService } from 'app/core/services/dropdown.service';
import { NotificationService } from 'app/core/services/notification.service';
import { DropdownItem } from 'app/core/models/dropdown.model';
import { AccessCardsService } from 'app/core/services/complexes/access-cards.service';

@Component({
    selector: 'access-card-form',
    standalone: true,
    templateUrl: './access-card-form.component.html',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatAutocompleteModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatDividerModule,
        TranslocoModule
    ]
})
export class AccessCardFormComponent implements OnInit, OnDestroy {

    form: FormGroup;
    isEdit = false;
    dropdownsLoading = true;
    saving = false;

    userSearchLoading = false;
    buildingSearchLoading = false;
    apartmentSearchLoading = false;

    cardTypes: DropdownItem[] = [];
    statuses: DropdownItem[] = [];
    complexes: DropdownItem[] = [];
    accessLevels: { key: number; value: string }[] = [];

    filteredUsers: { key: number; value: string }[] = [];
    filteredBuildings: { key: number; value: string }[] = [];
    filteredApartments: { key: number; value: string }[] = [];

    private selectedComplexId = 0;
    private selectedBuildingId = 0;

    private _unsubscribeAll = new Subject<void>();

    get isBlocked(): boolean {
        const val = this.form?.get('status')?.value;
        return val !== null && val !== '' && (val !== 1 && val !== 3 && val !== 4);
    }

    constructor(
        private fb: FormBuilder,
        private accessCardsService: AccessCardsService,
        private dropdownService: DropdownService,
        private notificationService: NotificationService,
        private dialogRef: MatDialogRef<AccessCardFormComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { accessCardId?: number }
    ) { }

    ngOnInit(): void {
        this.isEdit = !!this.data?.accessCardId;
        this._buildForm();
        this._loadDropdowns();
        this._watchStatus();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    // ─── Form ─────────────────────────────────────────────────────────────────

    private _buildForm(): void {
        this.form = this.fb.group({
            id: [0],
            complexId: [null, Validators.required],
            buildingName: [{ value: null, disabled: true }, Validators.required],
            buildingId: [null],
            apartment: [{ value: null, disabled: true }, Validators.required],
            apartmentId: [null, Validators.required],
            cardType: [null, Validators.required],
            user: ['', Validators.required],
            userId: [null, Validators.required],
            status: [1, Validators.required],
            issueDate: [null, Validators.required],
            expiryDate: [null, Validators.required],
            accessLevelIds: [[], Validators.required],
            orderNotes: [null],
            blockReason: ['']
        });

        this._setupFormDependencies();
    }

    private _setupFormDependencies(): void {
        this.form.get('complexId')?.valueChanges.subscribe(value => {
            if (value) {
                this.form.get('buildingName')?.enable();
            } else {
                this.form.get('buildingName')?.disable();
                this.form.get('apartment')?.disable();
            }
            this.form.patchValue({ buildingId: null, buildingName: null, apartmentId: null, apartment: null });
            this.filteredBuildings = [];
            this.filteredApartments = [];
        });

        this.form.get('buildingId')?.valueChanges.subscribe(value => {
            if (value) {
                this.form.get('apartment')?.enable();
            } else {
                this.form.get('apartment')?.disable();
            }
            this.form.patchValue({ apartmentId: null, apartment: null });
            this.filteredApartments = [];
        });
    }

    // ─── Dropdowns ────────────────────────────────────────────────────────────

    private _loadDropdowns(): void {
        forkJoin({
            cardTypes: this.dropdownService.getSpecCodeByType('accessCardType'),
            statuses: this.dropdownService.getSpecCodeByType('accessCardStatus'),
            complexes: this.dropdownService.getComplexesDropdown(),
            accessLevels: this.dropdownService.getAccessLevelsDropDown()
        }).pipe(takeUntil(this._unsubscribeAll))
          .subscribe({
            next: ({ cardTypes, statuses, complexes, accessLevels }) => {
                this.cardTypes = cardTypes;
                this.statuses = statuses;
                console.log(statuses);
                this.complexes = complexes;
                this.accessLevels = accessLevels;
                this.dropdownsLoading = false;
                if (this.isEdit && this.data.accessCardId) {
                    this._loadCard(this.data.accessCardId);
                }
            },
            error: () => {
                this.notificationService.error('Məlumatlar yüklənərkən xəta baş verdi');
                this.dropdownsLoading = false;
            }
        });
    }

    // ─── Status → blockReason validation ─────────────────────────────────────

    private _watchStatus(): void {
        this.form.get('status')?.valueChanges
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(val => {
                const ctrl = this.form.get('blockReason');
                if (val !== null && val !== '' && val !== 1) {
                    ctrl?.setValidators([Validators.required]);
                } else {
                    ctrl?.clearValidators();
                    ctrl?.reset('');
                }
                ctrl?.updateValueAndValidity();
            });
    }

    // ─── Complex change ───────────────────────────────────────────────────────

    onComplexChange(complexId: number): void {
        this.selectedComplexId = complexId;
        this.selectedBuildingId = 0;
        this.form.patchValue({ buildingName: null, buildingId: null, apartment: null, apartmentId: null });
        this.filteredBuildings = [];
        this.filteredApartments = [];
    }

    // ─── Autocomplete handlers ────────────────────────────────────────────────

    onUserSearch(event: Event): void {
        const value = (event.target as HTMLInputElement).value?.trim();
        if (!value) { this.filteredUsers = []; return; }
        this.userSearchLoading = true;
        this.dropdownService.getUserAutocomplete(value)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(data => { this.filteredUsers = data; this.userSearchLoading = false; });
    }

    onBuildingSearch(event: Event): void {
        const value = (event.target as HTMLInputElement).value?.trim();
        if (!value) { this.filteredBuildings = []; return; }
        this.buildingSearchLoading = true;
        this.dropdownService.getBuildingAutocomplete(value, this.selectedComplexId)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(data => { this.filteredBuildings = data; this.buildingSearchLoading = false; });
    }

    onApartmentSearch(event: Event): void {
        const value = (event.target as HTMLInputElement).value?.trim();
        if (!value) { this.filteredApartments = []; return; }
        this.apartmentSearchLoading = true;
        this.dropdownService.getApartmentAutocomplete(value, this.selectedBuildingId)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(data => { this.filteredApartments = data; this.apartmentSearchLoading = false; });
    }

    onUserSelected(event: any): void {
        const selected = this.filteredUsers.find(u => u.value === event.option.value);
        if (selected) this.form.patchValue({ userId: selected.key });
    }

    onBuildingSelected(event: any): void {
        const selected = this.filteredBuildings.find(b => b.value === event.option.value);
        if (selected) {
            this.selectedBuildingId = selected.key;
            this.form.patchValue({ buildingId: selected.key, apartment: null, apartmentId: null });
            this.filteredApartments = [];
        }
    }

    onApartmentSelected(event: any): void {
        const selected = this.filteredApartments.find(a => a.value === event.option.value);
        if (selected) this.form.patchValue({ apartmentId: selected.key });
    }

    // ─── Load for edit ────────────────────────────────────────────────────────

    private _loadCard(id: number): void {
        this.accessCardsService.getAccessCardById(id)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    if (response.status && response.data) {
                        const card = response.data;
                        this.form.get('buildingName')?.enable({ emitEvent: false });
                        this.form.get('apartment')?.enable({ emitEvent: false });
                        this.form.patchValue({
                            ...card,
                            accessLevelIds: card.accessLevelIds ?? []
                        }, { emitEvent: false });
                    }
                },
                error: () => this.notificationService.error('Məlumatlar yüklənərkən xəta baş verdi')
            });
    }

    // ─── Save ─────────────────────────────────────────────────────────────────

    onSave(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        this.saving = true;
        const v = this.form.getRawValue();

        const payload: AccessCardFormData = {
            id: v.id,
            cardType: v.cardType,
            userId: v.userId,
            apartmentId: v.apartmentId,
            status: v.status,
            issueDate: v.issueDate instanceof Date ? v.issueDate.toISOString() : v.issueDate,
            expiryDate: v.expiryDate instanceof Date ? v.expiryDate.toISOString() : v.expiryDate,
            accessLevelIds: v.accessLevelIds ?? [],
            orderNotes: v.orderNotes || null,
            blockReason: v.blockReason ?? ''
        };

        this.accessCardsService.saveAccessCard(payload).subscribe({
            next: (response) => {
                this.saving = false;
                if (response.status) {
                    this.notificationService.success(response.message);
                    this.dialogRef.close(true);
                } else {
                    this.notificationService.info(response.message);
                }
            },
            error: () => {
                this.saving = false;
                this.notificationService.error('Yadda saxlanarkən xəta baş verdi');
            }
        });
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }
}
