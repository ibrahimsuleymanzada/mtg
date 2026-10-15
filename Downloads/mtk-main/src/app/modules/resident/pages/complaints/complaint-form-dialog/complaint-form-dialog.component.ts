import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { TranslocoModule } from '@ngneat/transloco';
import { ResidentService } from 'app/core/services/resident/resident.service';
import { NotificationService } from 'app/core/services/notification.service';
import { DropdownService } from 'app/core/services/dropdown.service';
import { DropdownItem } from 'app/core/models/dropdown.model';
import { ResidentComplaintFormData } from 'app/core/models/resident/resident.types';

@Component({
    selector        : 'resident-complaint-form-dialog',
    templateUrl     : './complaint-form-dialog.component.html',
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
        MatSelectModule,
        MatAutocompleteModule,
        MatCheckboxModule,
        TranslocoModule,
    ],
})
export class ResidentComplaintFormDialogComponent implements OnInit, OnDestroy {
    form: FormGroup;
    isEdit = false;
    loading = false;
    selectedFiles: File[] = [];

    categories: DropdownItem[] = [
        { key: 1, value: 'General' },
        { key: 2, value: 'ForSale' },
        { key: 3, value: 'Services' },
        { key: 4, value: 'Jobs' },
        { key: 5, value: 'Events' },
    ];
    priorities: DropdownItem[] = [
        { key: 1, value: 'Normal' },
        { key: 2, value: 'Important' },
        { key: 3, value: 'Urgent' },
    ];

    filteredApartments: { key: number; value: string }[] = [];
    apartmentSearchLoading = false;
    private _apartmentSearch$ = new Subject<string>();

    constructor(
        public  dialogRef:           MatDialogRef<ResidentComplaintFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { complaintId?: number },
        private _fb:                 FormBuilder,
        private _residentService:    ResidentService,
        private _notificationService: NotificationService,
        private _dropdownService:    DropdownService,
        private _cdr:                ChangeDetectorRef,
    ) {
        this.isEdit = !!data?.complaintId;
        this._initForm();
    }

    ngOnInit(): void {
        this._setupApartmentAutocomplete();
        if (this.isEdit && this.data.complaintId) {
            this._loadRecord(this.data.complaintId);
        }
    }

    ngOnDestroy(): void {
        this._apartmentSearch$.complete();
    }

    // ── Private ─────────────────────────────────────────────────────────

    private _initForm(): void {
        this.form = this._fb.group({
            id:              [0],
            categoryId:      [null, Validators.required],
            apartmentId:     [null, Validators.required],
            apartmentNumber: [null, Validators.required],
            title:           ['', Validators.required],
            description:     ['', Validators.required],
            location:        [''],
            priority:        [null, Validators.required],
            isAnonymous:     [false],
            attachmentsUrl:  [null],
        });
    }

    private _setupApartmentAutocomplete(): void {
        this._apartmentSearch$.pipe(
            debounceTime(400),
            distinctUntilChanged(),
            switchMap(term => {
                if (!term || term.trim().length < 2) {
                    this.filteredApartments = [];
                    this.apartmentSearchLoading = false;
                    return [];
                }
                this.apartmentSearchLoading = true;
                return this._dropdownService.getApartmentAutocomplete(term);
            })
        ).subscribe({
            next: (results) => {
                this.filteredApartments = results;
                this.apartmentSearchLoading = false;
                this._cdr.markForCheck();
            },
            error: () => {
                this.filteredApartments = [];
                this.apartmentSearchLoading = false;
                this._cdr.markForCheck();
            }
        });
    }

    private _loadRecord(id: number): void {
        this.loading = true;
        this._cdr.markForCheck();
        this._residentService.getMyComplaintById(id).subscribe({
            next: (response) => {
                if (response.status && response.data) {
                    const record = response.data;
                    this.form.patchValue(record);
                } else {
                    this._notificationService.info(response.message || 'Məlumat tapılmadı');
                }
                this.loading = false;
                this._cdr.markForCheck();
            },
            error: () => {
                this._notificationService.error('Müraciət yüklənərkən xəta baş verdi');
                this.loading = false;
                this._cdr.markForCheck();
            }
        });
    }

    // ── Public ──────────────────────────────────────────────────────────

    onApartmentSearch(event: Event): void {
        this.form.patchValue({ apartmentId: null });
        this._apartmentSearch$.next((event.target as HTMLInputElement).value);
    }

    onApartmentSelected(event: MatAutocompleteSelectedEvent): void {
        const item = this.filteredApartments.find(a => a.value === event.option.value);
        if (item) {
            this.form.patchValue({ apartmentId: item.key, apartmentNumber: item.value });
        }
    }

    onSave(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        this.loading = true;
        this._cdr.markForCheck();

        const { apartmentNumber, ...rest } = this.form.value;
        const payload: ResidentComplaintFormData = rest;

        this._residentService.saveMyComplaintMultipart(payload, this.selectedFiles).subscribe({
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
            }
        });
    }

    onFilesSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.selectedFiles = input.files ? Array.from(input.files) : [];
        this._cdr.markForCheck();
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }
}
