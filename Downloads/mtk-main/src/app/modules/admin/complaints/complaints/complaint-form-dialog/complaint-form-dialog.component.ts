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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { debounceTime, distinctUntilChanged, forkJoin, Subject, switchMap } from 'rxjs';
import { NotificationService } from 'app/core/services/notification.service';
import { DropdownService } from 'app/core/services/dropdown.service';
import { DropdownItem } from 'app/core/models/dropdown.model';
import { TranslocoModule } from '@ngneat/transloco';
import { ComplaintsService } from 'app/core/services/complaints/complaints.service';
import { ComplaintFormData } from 'app/core/models/complaints/complaint.types';

@Component({
    selector: 'complaint-form-dialog',
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
        MatCheckboxModule,
        TranslocoModule,
    ],
    templateUrl: './complaint-form-dialog.component.html'
})
export class ComplaintFormDialogComponent implements OnInit, OnDestroy {
    form: FormGroup;
    isEdit = false;
    dropdownsLoading = true;
    selectedFiles: File[] = [];

    categories: DropdownItem[] = [];
    priorities: DropdownItem[] = [];
    statuses: DropdownItem[] = [];

    filteredApartments: { key: number; value: string }[] = [];
    apartmentSearchLoading = false;
    private apartmentSearchSubject = new Subject<string>();

    filteredUsers: { key: number; value: string }[] = [];
    userSearchLoading = false;
    private userSearchSubject = new Subject<string>();

    filteredAssignees: { key: number; value: string }[] = [];
    assigneeSearchLoading = false;
    private assigneeSearchSubject = new Subject<string>();

    constructor(
        public dialogRef: MatDialogRef<ComplaintFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { complaintId?: number },
        private fb: FormBuilder,
        private complaintsService: ComplaintsService,
        private notificationService: NotificationService,
        private dropdownService: DropdownService,
    ) {
        this.isEdit = !!data?.complaintId;
        this.initForm();
    }

    ngOnInit(): void {
        this.setupApartmentAutocomplete();
        this.setupUserAutocomplete();
        this.setupAssigneeAutocomplete();
        this.loadDropdowns();
    }

    ngOnDestroy(): void {
        this.apartmentSearchSubject.complete();
        this.userSearchSubject.complete();
        this.assigneeSearchSubject.complete();
    }

    private initForm(): void {
        this.form = this.fb.group({
            id: [0],
            categoryId: [null, Validators.required],
            userId: [null, Validators.required],
            person: [null, Validators.required],
            apartmentId: [null, Validators.required],
            apartmentNumber: [null, Validators.required],
            buildingId: [null],
            complexId: [null],
            title: ['', Validators.required],
            description: ['', Validators.required],
            location: [''],
            priority: [null, Validators.required],
            status: [null, Validators.required],
            isAnonymous: [false],
            attachmentsUrl: [null],
            dueDate: [null],
            assignedTo: [null],
            assignedToName: [null],
            assignedDate: [null],
            resolvedDate: [null],
            resolutionNotes: [null],
            rating: [null],
            feedback: [null],
        });
    }

    private setupApartmentAutocomplete(): void {
        this.apartmentSearchSubject.pipe(
            debounceTime(400),
            distinctUntilChanged(),
            switchMap(term => {
                if (!term || term.trim().length < 2) {
                    this.filteredApartments = [];
                    this.apartmentSearchLoading = false;
                    return [];
                }
                this.apartmentSearchLoading = true;
                return this.dropdownService.getApartmentAutocomplete(term);
            })
        ).subscribe({
            next: (results) => { this.filteredApartments = results; this.apartmentSearchLoading = false; },
            error: () => { this.filteredApartments = []; this.apartmentSearchLoading = false; }
        });
    }

    private setupUserAutocomplete(): void {
        this.userSearchSubject.pipe(
            debounceTime(400),
            distinctUntilChanged(),
            switchMap(term => {
                if (!term || term.trim().length < 2) {
                    this.filteredUsers = [];
                    this.userSearchLoading = false;
                    return [];
                }
                this.userSearchLoading = true;
                return this.dropdownService.getUserAutocomplete(term);
            })
        ).subscribe({
            next: (results) => { this.filteredUsers = results; this.userSearchLoading = false; },
            error: () => { this.filteredUsers = []; this.userSearchLoading = false; }
        });
    }

    private setupAssigneeAutocomplete(): void {
        this.assigneeSearchSubject.pipe(
            debounceTime(400),
            distinctUntilChanged(),
            switchMap(term => {
                if (!term || term.trim().length < 2) {
                    this.filteredAssignees = [];
                    this.assigneeSearchLoading = false;
                    return [];
                }
                this.assigneeSearchLoading = true;
                return this.dropdownService.getUserAutocomplete(term);
            })
        ).subscribe({
            next: (results) => { this.filteredAssignees = results; this.assigneeSearchLoading = false; },
            error: () => { this.filteredAssignees = []; this.assigneeSearchLoading = false; }
        });
    }

    onApartmentSearch(event: Event): void {
        this.form.patchValue({ apartmentId: null });
        this.apartmentSearchSubject.next((event.target as HTMLInputElement).value);
    }

    onApartmentSelected(event: MatAutocompleteSelectedEvent): void {
        const item = this.filteredApartments.find(a => a.value === event.option.value);
        if (item) this.form.patchValue({ apartmentId: item.key, apartmentNumber: item.value });
    }

    onUserSearch(event: Event): void {
        this.form.patchValue({ userId: null });
        this.userSearchSubject.next((event.target as HTMLInputElement).value);
    }

    onUserSelected(event: MatAutocompleteSelectedEvent): void {
        const item = this.filteredUsers.find(u => u.value === event.option.value);
        if (item) this.form.patchValue({ userId: item.key, person: item.value });
    }

    onAssigneeSearch(event: Event): void {
        this.form.patchValue({ assignedTo: null });
        this.assigneeSearchSubject.next((event.target as HTMLInputElement).value);
    }

    onAssigneeSelected(event: MatAutocompleteSelectedEvent): void {
        const item = this.filteredAssignees.find(u => u.value === event.option.value);
        if (item) this.form.patchValue({ assignedTo: item.key, assignedToName: item.value });
    }

    private loadDropdowns(): void {
        this.dropdownsLoading = true;
        forkJoin({
            categories: this.dropdownService.getComplaintCategoriesDropdown(),
            priorities: this.dropdownService.getSpecCodeByType('ComplaintPriority'),
            statuses: this.dropdownService.getSpecCodeByType('ComplaintStatus'),
        }).subscribe({
            next: ({ categories, priorities, statuses }) => {
                this.categories = categories;
                this.priorities = priorities;
                this.statuses = statuses;
                if (this.isEdit && this.data.complaintId) {
                    this.loadRecord(this.data.complaintId);
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
        this.complaintsService.getComplaintById(id).subscribe({
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
                this.notificationService.error('Müraciət yüklənərkən xəta baş verdi');
                this.dropdownsLoading = false;
            }
        });
    }

    onSave(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        const { person, apartmentNumber, assignedToName, ...rest } = this.form.value;
        const payload: ComplaintFormData = rest;
        this.complaintsService.saveComplaintMultipart(payload, this.selectedFiles).subscribe({
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
