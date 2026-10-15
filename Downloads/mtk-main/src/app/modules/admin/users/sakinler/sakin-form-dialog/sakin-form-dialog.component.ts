import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { NotificationService } from 'app/core/services/notification.service';
import { DropdownService } from 'app/core/services/dropdown.service';
import { TranslocoModule } from '@ngneat/transloco';
import { SakinlerService } from 'app/core/services/users/sakinler.service';

@Component({
    selector: 'sakin-form-dialog',
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
        MatCheckboxModule,
        MatDatepickerModule,
        MatAutocompleteModule,
        TranslocoModule,
    ],
    templateUrl: './sakin-form-dialog.component.html'
})
export class SakinFormDialogComponent implements OnInit, OnDestroy {
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
        public dialogRef: MatDialogRef<SakinFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { sakinId?: number },
        private fb: FormBuilder,
        private sakinlerService: SakinlerService,
        private notificationService: NotificationService,
        private dropdownService: DropdownService,
    ) {
        this.isEdit = !!data?.sakinId;
        this.initForm();
    }

    ngOnInit(): void {
        this.setupApartmentAutocomplete();
        this.setupUserAutocomplete();
        if (this.isEdit && this.data.sakinId) {
            this.loadRecord(this.data.sakinId);
        }
    }

    ngOnDestroy(): void {
        this.apartmentSearchSubject.complete();
        this.userSearchSubject.complete();
    }

    private initForm(): void {
        this.form = this.fb.group({
            id: [0],
            userId: [null, Validators.required],
            userFullName: [null, Validators.required],
            apartmentId: [null, Validators.required],
            apartmentNumber: [null, Validators.required],
            purchaseDate: [null],
            purchasePrice: [null],
            deedNumber: [''],
            isMainOwner: [false],
            startDate: [null, Validators.required],
            endDate: [null],
            deedFile: [null],
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
        if (item) this.form.patchValue({ apartmentId: item.key, apartmentNumber: item.value });
    }

    onUserSearch(event: Event): void {
        this.form.patchValue({ userId: null });
        this.userSearchSubject.next((event.target as HTMLInputElement).value);
    }

    onUserSelected(event: MatAutocompleteSelectedEvent): void {
        const item = this.filteredUsers.find(u => u.value === event.option.value);
        if (item) this.form.patchValue({ userId: item.key, userFullName: item.value });
    }

    private loadRecord(id: number): void {
        this.dropdownsLoading = true;
        this.sakinlerService.getSakinById(id).subscribe({
            next: (response) => {
                if (response.status && response.data) {
                    const record = response.data;
                    this.form.patchValue({
                        ...record,
                        userFullName: `${record.firstName} ${record.lastName}`,
                        apartmentNumber: record.apartmentNumber,
                    });
                } else {
                    this.notificationService.info(response.message || 'Məlumat tapılmadı');
                }
                this.dropdownsLoading = false;
            },
            error: () => {
                this.notificationService.error('Sakin yüklənərkən xəta baş verdi');
                this.dropdownsLoading = false;
            }
        });
    }

    onSave(): void {
        this.dialogRef.close(false);
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }
}
