import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { NotificationService } from 'app/core/services/notification.service';
import { DropdownService } from 'app/core/services/dropdown.service';
import { ResidentsService } from 'app/core/services/users/residents.service';
import { ResidentFormData } from 'app/core/models/users/resident.types';
import { TranslocoModule } from '@ngneat/transloco';
import { NgxMaskDirective } from 'ngx-mask';

@Component({
    selector: 'resident-form-dialog',
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
        MatDatepickerModule,
        MatAutocompleteModule,
        TranslocoModule,
        NgxMaskDirective
    ],
    templateUrl: './resident-form-dialog.component.html'
})
export class ResidentFormDialogComponent implements OnInit, OnDestroy {
    form: FormGroup;
    isEdit = false;
    dropdownsLoading = false;

    filteredApartments: { key: number; value: string }[] = [];
    apartmentSearchLoading = false;
    private apartmentSearchSubject = new Subject<string>();

    filteredUsers: { key: number; value: string }[] = [];
    userSearchLoading = false;
    private userSearchSubject = new Subject<string>();

    constructor(
        public dialogRef: MatDialogRef<ResidentFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { residentId?: number; apartmentId?: number , apartmentName?: string },
        private fb: FormBuilder,
        private residentsService: ResidentsService,
        private notificationService: NotificationService,
        private dropdownService: DropdownService,
    ) {
        this.isEdit = !!data?.residentId;
        this.initForm();
    }

    ngOnInit(): void {
        this.setupApartmentAutocomplete();
        this.setupUserAutocomplete();
        if (this.isEdit && this.data.residentId) {
            this.loadRecord(this.data.residentId);
        }
    }

    ngOnDestroy(): void {
        this.apartmentSearchSubject.complete();
        this.userSearchSubject.complete();
    }

    private initForm(): void {
        this.form = this.fb.group({
            id: [0],
            apartmentId: [this.data?.apartmentId ?? null, Validators.required],
            apartmentDisplay: [null, Validators.required],
            userId: [null, Validators.required],
            fullName: [null, Validators.required],
            phone: ['', Validators.required],
            dateOfBirth: [null, Validators.required],
            moveInDate: [null, Validators.required],
            moveOutDate: [null],
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

    onApartmentSearch(event: Event): void {
        this.form.patchValue({ apartmentId: null });
        this.apartmentSearchSubject.next((event.target as HTMLInputElement).value);
    }

    onApartmentSelected(event: MatAutocompleteSelectedEvent): void {
        const item = this.filteredApartments.find(a => a.value === event.option.value);
        if (item) this.form.patchValue({ apartmentId: item.key, apartmentDisplay: item.value });
    }

    onUserSearch(event: Event): void {
        this.form.patchValue({ userId: null });
        this.userSearchSubject.next((event.target as HTMLInputElement).value);
    }

    onUserSelected(event: MatAutocompleteSelectedEvent): void {
        const item = this.filteredUsers.find(u => u.value === event.option.value);
        if (item) this.form.patchValue({ userId: item.key, fullName: item.value });
    }

    private loadRecord(id: number): void {
        // Residents doesn't have a getById endpoint — we load the list and find by id
        // The parent already has apartmentId, so we reload the list
        if (!this.data.apartmentId) return;
        this.dropdownsLoading = true;
        this.residentsService.getResidentsByApartmentId(this.data.apartmentId).subscribe({
            next: (response) => {
                if (response.status && response.data) {
                    const record = response.data.find(r => r.id === id);
                    if (record) {
                        this.form.patchValue({
                            ...record,
                            apartmentDisplay: this.data.apartmentName || null,
                        });
                    }
                }
                this.dropdownsLoading = false;
            },
            error: () => {
                this.notificationService.error('Məlumat yüklənərkən xəta baş verdi');
                this.dropdownsLoading = false;
            }
        });
    }

    onSave(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        const { apartmentDisplay, fullName, ...rest } = this.form.value;
        const payload: ResidentFormData = rest;
        this.residentsService.saveResident(payload).subscribe({
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

    onCancel(): void {
        this.dialogRef.close(false);
    }
}
