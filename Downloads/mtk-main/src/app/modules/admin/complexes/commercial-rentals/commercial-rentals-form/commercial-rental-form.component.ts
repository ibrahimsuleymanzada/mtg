import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { TranslocoModule } from '@ngneat/transloco';
import { debounceTime, distinctUntilChanged, forkJoin, Subject, switchMap } from 'rxjs';

import { NotificationService } from 'app/core/services/notification.service';
import { DropdownService } from 'app/core/services/dropdown.service';
import { environment } from 'environments/environment';
import { CommercialRentalsService } from 'app/core/services/complexes/commercial-rental.service';

@Component({
    selector: 'commercial-rental-form',
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
        MatAutocompleteModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        TranslocoModule
    ],
    templateUrl: './commercial-rental-form.component.html'
})
export class CommercialRentalFormComponent implements OnInit {

    form: FormGroup;
    isEdit: boolean = false;
    dropdownsLoading: boolean = true;

    // Seçilmiş fayl
    selectedFile: File | null = null;
    existingDocumentURL: string | null = null;
    readonly apiUrl = environment.fileUrl;

    // Autocomplete - Building
    filteredBuildings: { key: number; value: string }[] = [];
    buildingSearchLoading: boolean = false;
    private buildingSearchSubject = new Subject<string>();

    // Autocomplete - Commercial Space
    filteredSpaces: { key: number; value: string }[] = [];
    spaceSearchLoading: boolean = false;
    private spaceSearchSubject = new Subject<string>();

    // Autocomplete - User (Tenant)
    filteredUsers: { key: number; value: string }[] = [];
    userSearchLoading: boolean = false;
    private userSearchSubject = new Subject<string>();

    // Complexes dropdown
    complexes: { key: number; value: string }[] = [];

    constructor(
        public dialogRef: MatDialogRef<CommercialRentalFormComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { commercialRentalId?: number },
        private fb: FormBuilder,
        private commercialRentalsService: CommercialRentalsService,
        private notificationService: NotificationService,
        private dropdownService: DropdownService
    ) {
        this.isEdit = !!data?.commercialRentalId;
        this.initForm();
    }

    ngOnInit(): void {
        this.loadDropdowns();
        this.setupBuildingAutocomplete();
        this.setupSpaceAutocomplete();
        this.setupUserAutocomplete();
    }

    // ─── FORM ───
    private initForm(): void {
        this.form = this.fb.group({
            id: [0],
            complexId: [null, Validators.required],
            buildingId: [null, Validators.required],
            buildingName: [{ value: null, disabled: true }, Validators.required],
            spaceId: [null, Validators.required],
            spaceName: [{ value: null, disabled: true }, Validators.required],
            tenantUserId: [null, Validators.required],
            tenantUserName: [{ value: null, disabled: false }],
            tenantContactName: [null, Validators.required],
            tenantPhone: [null, Validators.required],
            tenantEmail: [null, [Validators.required, Validators.email]],
            tenantCompanyName: [null],
            businessType: [null],
            monthlyRent: [null, [Validators.required, Validators.min(1)]],
            securityDeposit: [null, [Validators.required, Validators.min(1)]],
            paymentDay: [null, [Validators.required, Validators.min(1), Validators.max(31)]],
            contractStartDate: [null, Validators.required],
            contractEndDate: [null]
        });

        this.setupFormDependencies();
    }

    private setupFormDependencies(): void {
        // Complex dəyişdikdə building və space-i resetlə
        this.form.get('complexId')?.valueChanges.subscribe(value => {
            const buildingName = this.form.get('buildingName');
            const spaceName = this.form.get('spaceName');

            if (value) {
                buildingName?.enable();
            } else {
                buildingName?.disable();
                spaceName?.disable();
            }

            this.form.patchValue({ buildingId: null, buildingName: null, spaceId: null, spaceName: null });
            this.filteredBuildings = [];
            this.filteredSpaces = [];
        });

        // Building dəyişdikdə space-i resetlə
        this.form.get('buildingId')?.valueChanges.subscribe(value => {
            const spaceName = this.form.get('spaceName');
            if (value) {
                spaceName?.enable();
            } else {
                spaceName?.disable();
            }
            this.form.patchValue({ spaceId: null, spaceName: null });
            this.filteredSpaces = [];
        });
    }

    // ─── BUILDING AUTOCOMPLETE ───
    private setupBuildingAutocomplete(): void {
        this.buildingSearchSubject.pipe(
            debounceTime(400),
            distinctUntilChanged(),
            switchMap(term => {
                const complexId = this.form.get('complexId')?.value;
                if (!complexId || !term || term.trim().length < 2) {
                    this.filteredBuildings = [];
                    this.buildingSearchLoading = false;
                    return [];
                }
                this.buildingSearchLoading = true;
                return this.dropdownService.getBuildingAutocomplete(term, complexId);
            })
        ).subscribe({
            next: (results) => { this.filteredBuildings = results; this.buildingSearchLoading = false; },
            error: () => { this.filteredBuildings = []; this.buildingSearchLoading = false; }
        });
    }

    onBuildingSearch(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.form.patchValue({ buildingId: null });
        this.buildingSearchSubject.next(input.value);
    }

    onBuildingSelected(event: MatAutocompleteSelectedEvent): void {
        const selected = this.filteredBuildings.find(b => b.value === event.option.value);
        if (selected) {
            this.form.patchValue({ buildingId: selected.key, buildingName: selected.value });
        }
    }

    // ─── SPACE AUTOCOMPLETE ───
    private setupSpaceAutocomplete(): void {
        this.spaceSearchSubject.pipe(
            debounceTime(400),
            distinctUntilChanged(),
            switchMap(term => {
                if (!term || term.trim().length < 1) {
                    this.filteredSpaces = [];
                    this.spaceSearchLoading = false;
                    return [];
                }
                this.spaceSearchLoading = true;
                return this.dropdownService.getCommercialSpaceAutoComplete(term, this.form.get('buildingId')?.value);
            })
        ).subscribe({
            next: (results) => { this.filteredSpaces = results; this.spaceSearchLoading = false; },
            error: () => { this.filteredSpaces = []; this.spaceSearchLoading = false; }
        });
    }

    onSpaceSearch(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.form.patchValue({ spaceId: null });
        this.spaceSearchSubject.next(input.value);
    }

    onSpaceSelected(event: MatAutocompleteSelectedEvent): void {
        const selected = this.filteredSpaces.find(s => s.value === event.option.value);
        if (selected) {
            this.form.patchValue({ spaceId: selected.key, spaceName: selected.value });
        }
    }

    // ─── USER AUTOCOMPLETE ───
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

    onUserSearch(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.form.patchValue({ tenantUserId: null });
        this.userSearchSubject.next(input.value);
    }

    onUserSelected(event: MatAutocompleteSelectedEvent): void {
        const selected = this.filteredUsers.find(u => u.value === event.option.value);
        if (selected) {
            this.form.patchValue({ tenantUserId: selected.key, tenantUserName: selected.value });
        }
    }

    // ─── DROPDOWNS ───
    private loadDropdowns(): void {
        this.dropdownsLoading = true;

        this.dropdownService.getComplexesDropdown().subscribe({
            next: (complexes) => {
                this.complexes = complexes;
                this.dropdownsLoading = false;

                if (this.isEdit && this.data.commercialRentalId) {
                    this.loadCommercialRental(this.data.commercialRentalId);
                }
            },
            error: (error) => {
                this.dropdownsLoading = false;
                this.notificationService.error(error?.error?.message || 'Xəta baş verdi');
            }
        });
    }

    private loadCommercialRental(id: number): void {
        this.commercialRentalsService.getCommercialRentalById(id).subscribe({
            next: (response) => {
                if (response.status && response.data) {
                    const d = response.data[0];

                    this.existingDocumentURL = d.contractDocumentURL;

                    this.form.patchValue({
                        id: d.id,
                        complexId: d.complexId,
                        buildingId: d.buildingId,
                        buildingName: d.buildingName,
                        tenantUserId: d.tenantUserId,
                        tenantUserName: d.tenantContactName,
                        tenantContactName: d.tenantContactName,
                        tenantPhone: d.tenantPhone,
                        tenantEmail: d.tenantEmail,
                        tenantCompanyName: d.tenantCompanyName,
                        businessType: d.businessType,
                        monthlyRent: d.monthlyRent,
                        securityDeposit: d.securityDeposit,
                        paymentDay: d.paymentDay,
                        contractStartDate: d.contractStartDate,
                        contractEndDate: d.contractEndDate
                    });
                } else {
                    this.notificationService.info(response.message || 'Məlumat tapılmadı');
                }
            },
            error: (error) => {
                this.notificationService.error(error?.error?.message || 'Məlumat yüklənərkən xəta baş verdi');
            }
        });
    }

    // ─── FILE ───
    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.selectedFile = input.files[0];
        }
    }

    removeFile(): void {
        this.selectedFile = null;
    }

    get documentLabel(): string {
        if (this.selectedFile) return this.selectedFile.name;
        if (this.existingDocumentURL) {
            const parts = this.existingDocumentURL.replace(/\\/g, '/').split('/');
            return parts[parts.length - 1];
        }
        return '';
    }

    // ─── SAVE ───
    onSave(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const formData = new FormData();
        const formValue = this.form.value;

        // Display field-lərini exclude edirik (bunlar yalnız UI üçündür)
        const excludeFields = ['tenantUserName', 'buildingName', 'spaceName'];

        Object.keys(formValue).forEach(key => {
            if (excludeFields.includes(key)) return;

            const value = formValue[key];

            // Null/undefined/empty olmayan dəyərləri əlavə et
            if (value !== null && value !== undefined && value !== '') {
                formData.append(key, value.toString());
            }
        });

        // Fayl ayrıca append olunur
        if (this.selectedFile) {
            formData.append('contractDocument', this.selectedFile);
        }

        this.commercialRentalsService.saveCommercialRental(formData).subscribe({
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