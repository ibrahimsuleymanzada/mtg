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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { TranslocoModule } from '@ngneat/transloco';
import { DateTime } from 'luxon';
import { ResidentService } from 'app/core/services/resident/resident.service';
import { NotificationService } from 'app/core/services/notification.service';
import { DropdownService } from 'app/core/services/dropdown.service';
import { DropdownItem } from 'app/core/models/dropdown.model';
import { ResidentAnnouncementFormData } from 'app/core/models/resident/resident.types';

@Component({
    selector        : 'resident-announcement-form-dialog',
    templateUrl     : './announcement-form-dialog.component.html',
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
        MatDatepickerModule,
        MatAutocompleteModule,
        TranslocoModule,
    ],
})
export class ResidentAnnouncementFormDialogComponent implements OnInit, OnDestroy {
    form: FormGroup;
    isEdit = false;
    loading = false;
    dropdownsLoading = true;
    selectedFiles: File[] = [];

    complexes: DropdownItem[] = [];
    categories: DropdownItem[] = [
        { key: 1, value: 'General' },
        { key: 2, value: 'ForSale' },
        { key: 3, value: 'Services' },
        { key: 4, value: 'Jobs' },
        { key: 5, value: 'Events' },
        { key: 6, value: 'Lost' },
    ];
    types: DropdownItem[] = [
        { key: 1, value: 'General' },
        { key: 2, value: 'Announcement' },
        { key: 3, value: 'Marketplace' },
        { key: 4, value: 'Service' },
    ];
    priorities: DropdownItem[] = [
        { key: 1, value: 'Low' },
        { key: 2, value: 'Normal' },
        { key: 3, value: 'Important' },
        { key: 4, value: 'Urgent' },
    ];

    filteredBuildings: { key: number; value: string }[] = [];
    buildingSearchLoading = false;
    private _buildingSearch$ = new Subject<string>();

    constructor(
        public  dialogRef:           MatDialogRef<ResidentAnnouncementFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { announcementId?: number },
        private _fb:                 FormBuilder,
        private _residentService:    ResidentService,
        private _notificationService: NotificationService,
        private _dropdownService:    DropdownService,
        private _cdr:                ChangeDetectorRef,
    ) {
        this.isEdit = !!data?.announcementId;
        this._initForm();
    }

    ngOnInit(): void {
        this._setupBuildingAutocomplete();
        this._loadDropdowns();
    }

    ngOnDestroy(): void {
        this._buildingSearch$.complete();
    }

    // ── Private ─────────────────────────────────────────────────────────

    private _initForm(): void {
        this.form = this._fb.group({
            id:           [0],
            complexId:    [null, Validators.required],
            buildingId:   [null],
            buildingName: [null],
            title:        ['', Validators.required],
            content:      ['', Validators.required],
            category:     [null, Validators.required],
            type:         ['General', Validators.required],
            imagesUrl:    [null],
            priority:     ['Low', Validators.required],
            expiryDate:   [null, Validators.required],
        });
    }

    private _setupBuildingAutocomplete(): void {
        this._buildingSearch$.pipe(
            debounceTime(400),
            distinctUntilChanged(),
            switchMap(term => {
                if (!term || term.trim().length < 2) {
                    this.filteredBuildings = [];
                    this.buildingSearchLoading = false;
                    return [];
                }
                this.buildingSearchLoading = true;
                const complexId = this.form.get('complexId')?.value || 0;
                return this._dropdownService.getBuildingAutocomplete(term, complexId);
            })
        ).subscribe({
            next: (results) => {
                this.filteredBuildings = results;
                this.buildingSearchLoading = false;
                this._cdr.markForCheck();
            },
            error: () => {
                this.filteredBuildings = [];
                this.buildingSearchLoading = false;
                this._cdr.markForCheck();
            }
        });
    }

    private _loadDropdowns(): void {
        this.dropdownsLoading = true;
        this._dropdownService.getComplexesDropdown().subscribe({
            next: (complexes) => {
                this.complexes = complexes;
                if (complexes.length === 1) {
                    this.form.patchValue({ complexId: complexes[0].key });
                }
                if (this.isEdit && this.data.announcementId) {
                    this._loadRecord(this.data.announcementId);
                } else {
                    this.dropdownsLoading = false;
                    this._cdr.markForCheck();
                }
            },
            error: () => {
                this.dropdownsLoading = false;
                this._cdr.markForCheck();
            }
        });
    }

    private _loadRecord(id: number): void {
        // GetMyAnnouncements doesn't have a getById for resident,
        // so we reuse the admin announcements service for reading
        // Actually the resident doesn't have getById - we'll populate from list data
        // For now just mark loading done - the form is for create mostly
        this.dropdownsLoading = false;
        this._cdr.markForCheck();
    }

    // ── Public ──────────────────────────────────────────────────────────

    onBuildingSearch(event: Event): void {
        this.form.patchValue({ buildingId: null });
        this._buildingSearch$.next((event.target as HTMLInputElement).value);
    }

    onBuildingSelected(event: MatAutocompleteSelectedEvent): void {
        const item = this.filteredBuildings.find(b => b.value === event.option.value);
        if (item) {
            this.form.patchValue({ buildingId: item.key, buildingName: item.value });
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
        const payload: ResidentAnnouncementFormData = {
            id:         val.id,
            complexId:  val.complexId,
            buildingId: val.buildingId || null,
            title:      val.title,
            content:    val.content,
            category:   val.category,
            type:       val.type,
            imagesUrl:  val.imagesUrl || null,
            priority:   val.priority,
            expiryDate: val.expiryDate
                ? (val.expiryDate instanceof DateTime ? val.expiryDate.toISO() : new Date(val.expiryDate).toISOString())
                : '',
        };

        this._residentService.saveMyAnnouncementMultipart(payload, this.selectedFiles).subscribe({
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
