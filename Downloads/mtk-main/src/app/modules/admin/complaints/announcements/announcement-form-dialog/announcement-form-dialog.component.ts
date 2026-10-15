import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
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
import { debounceTime, distinctUntilChanged, forkJoin, Subject, switchMap } from 'rxjs';
import { NotificationService } from 'app/core/services/notification.service';
import { DropdownService } from 'app/core/services/dropdown.service';
import { DropdownItem } from 'app/core/models/dropdown.model';
import { TranslocoModule } from '@ngneat/transloco';
import { AnnouncementsService } from 'app/core/services/complaints/announcements.service';
import { AnnouncementFormData } from 'app/core/models/complaints/announcement.types';

@Component({
    selector: 'announcement-form-dialog',
    standalone: true,
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
    templateUrl: './announcement-form-dialog.component.html'
})
export class AnnouncementFormDialogComponent implements OnInit, OnDestroy {
    form: FormGroup;
    isEdit = false;
    dropdownsLoading = true;
    selectedFiles: File[] = [];

    complexes: DropdownItem[] = [];
    categories: DropdownItem[] = ['General', 'ForSale', 'Services', 'Jobs', 'Events'].map((c, i) => ({ key: i + 1, value: c }));
    priorities: DropdownItem[] = ['Normal', 'Important', 'Urgent'].map((p, i) => ({ key: i + 1, value: p }));
    types: DropdownItem[] = ['Announcement', 'Marketplace', 'Service', 'Job'].map((t, i) => ({ key: i + 1, value: t }));
    statuses: DropdownItem[] = ['Pending', 'Approved', 'Rejected', 'Expired'].map((s, i) => ({ key: i + 1, value: s }));

    filteredBuildings: { key: number; value: string }[] = [];
    buildingSearchLoading = false;
    private buildingSearchSubject = new Subject<string>();

    filteredPostedBy: { key: number; value: string }[] = [];
    postedBySearchLoading = false;
    private postedBySearchSubject = new Subject<string>();

    constructor(
        public dialogRef: MatDialogRef<AnnouncementFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { announcementId?: number },
        private fb: FormBuilder,
        private announcementsService: AnnouncementsService,
        private notificationService: NotificationService,
        private dropdownService: DropdownService,
    ) {
        this.isEdit = !!data?.announcementId;
        this.initForm();
    }

    ngOnInit(): void {
        this.setupBuildingAutocomplete();
        this.setupPostedByAutocomplete();
        this.loadDropdowns();
    }

    ngOnDestroy(): void {
        this.buildingSearchSubject.complete();
        this.postedBySearchSubject.complete();
    }

    private initForm(): void {
        this.form = this.fb.group({
            id: [0],
            complexId: [null, Validators.required],
            buildingId: [null],
            buildingName: [null],
            postedBy: [null, Validators.required],
            postedByName: [null, Validators.required],
            title: ['', Validators.required],
            content: ['', Validators.required],
            category: [null, Validators.required],
            type: [1, Validators.required],
            imagesUrl: [null],
            priority: [1, Validators.required],
            status: [null, Validators.required],
            expiryDate: [null, Validators.required],
        });
    }

    private setupBuildingAutocomplete(): void {
        this.buildingSearchSubject.pipe(
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
                return this.dropdownService.getBuildingAutocomplete(term, complexId);
            })
        ).subscribe({
            next: (results) => { this.filteredBuildings = results; this.buildingSearchLoading = false; },
            error: () => { this.filteredBuildings = []; this.buildingSearchLoading = false; }
        });
    }

    private setupPostedByAutocomplete(): void {
        this.postedBySearchSubject.pipe(
            debounceTime(400),
            distinctUntilChanged(),
            switchMap(term => {
                if (!term || term.trim().length < 2) {
                    this.filteredPostedBy = [];
                    this.postedBySearchLoading = false;
                    return [];
                }
                this.postedBySearchLoading = true;
                return this.dropdownService.getUserAutocomplete(term);
            })
        ).subscribe({
            next: (results) => { this.filteredPostedBy = results; this.postedBySearchLoading = false; },
            error: () => { this.filteredPostedBy = []; this.postedBySearchLoading = false; }
        });
    }

    onBuildingSearch(event: Event): void {
        this.form.patchValue({ buildingId: null });
        this.buildingSearchSubject.next((event.target as HTMLInputElement).value);
    }

    onBuildingSelected(event: MatAutocompleteSelectedEvent): void {
        const item = this.filteredBuildings.find(b => b.value === event.option.value);
        if (item) this.form.patchValue({ buildingId: item.key, buildingName: item.value });
    }

    onPostedBySearch(event: Event): void {
        this.form.patchValue({ postedBy: null });
        this.postedBySearchSubject.next((event.target as HTMLInputElement).value);
    }

    onPostedBySelected(event: MatAutocompleteSelectedEvent): void {
        const item = this.filteredPostedBy.find(u => u.value === event.option.value);
        if (item) this.form.patchValue({ postedBy: item.key, postedByName: item.value });
    }

    private loadDropdowns(): void {
        this.dropdownsLoading = true;
        forkJoin({
            complexes: this.dropdownService.getComplexesDropdown(),
            // categories: this.dropdownService.getPaymentCategories(),
            // types: this.dropdownService.getSpecCodeByType('AnnouncementType'),
            // priorities: this.dropdownService.getSpecCodeByType('AnnouncementPriority'),
            // statuses: this.dropdownService.getSpecCodeByType('ComplaintStatus'),
        }).subscribe({
            next: ({ complexes}) => {
                this.complexes = complexes;
                // this.categories = categories;
                // this.types = types;
                // this.priorities = priorities;
                // this.statuses = statuses;
                if (this.isEdit && this.data.announcementId) {
                    this.loadRecord(this.data.announcementId);
                } else {
                    this.dropdownsLoading = false;
                }
            },
            error: () => {
                this.dropdownsLoading = false;
                this.notificationService.error('Siyahı məlumatları yüklənərkən xəta baş verdi');
            }
        });
    }

    private loadRecord(id: number): void {
        this.announcementsService.getAnnouncementById(id).subscribe({
            next: (response) => {
                if (response.status && response.data) {
                    const record = Array.isArray(response.data) ? response.data[0] : response.data;
                    this.form.patchValue(record);
                } else {
                    this.notificationService.info(response.message || 'Məlumat tapılmadı');
                }
                this.dropdownsLoading = false;
            },
            error: () => {
                this.notificationService.error('Elan yüklənərkən xəta baş verdi');
                this.dropdownsLoading = false;
            }
        });
    }

    onSave(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        const { buildingName, postedByName, ...rest } = this.form.value;
        const payload: AnnouncementFormData = rest;
        this.announcementsService.saveAnnouncementMultipart(payload, this.selectedFiles).subscribe({
            next: (response) => {
                if (response.status) {
                    this.dialogRef.close(true);
                    this.notificationService.success(response.message);
                } else {
                    this.notificationService.info(response.message);
                }
            }
        });
    }

    onFilesSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.selectedFiles = input.files ? Array.from(input.files) : [];
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }
}
