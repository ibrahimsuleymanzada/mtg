import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotificationService } from 'app/core/services/notification.service';
import { DropdownService } from 'app/core/services/dropdown.service';
import { DropdownItem } from 'app/core/models/dropdown.model';
import { debounceTime, distinctUntilChanged, forkJoin, Subject, switchMap, of } from 'rxjs';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslocoModule } from '@ngneat/transloco';
import { ApartmentOwnersService } from 'app/core/services/complexes/apartment-owners.service';
import { UsersService } from 'app/core/services/users/users.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { environment } from 'environments/environment';
import { NgxMaskDirective } from 'ngx-mask';
@Component({
    selector: 'apartment-owner-form',
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
        MatCheckboxModule,
        TranslocoModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatDividerModule,
        NgxMaskDirective,

    ],
    templateUrl: './apartment-owner-form.component.html'
})
export class ApartmentOwnerFormComponent implements OnInit {

    form: FormGroup;
    isEdit: boolean = false;
    dropdownsLoading: boolean = true;
    isNewUser: boolean = true;

    complexes: DropdownItem[] = [];

    filteredUsers: { key: number; value: string }[] = [];
    userSearchLoading: boolean = false;
    private userSearchSubject = new Subject<string>();

    filteredBuildings: { key: number; value: string }[] = [];
    buildingSearchLoading: boolean = false;
    private buildingSearchSubject = new Subject<string>();

    filteredApartments: { key: number; value: string }[] = [];
    apartmentSearchLoading: boolean = false;
    private apartmentSearchSubject = new Subject<string>();

    selectedFile: File | null = null;
    existingFileUrl: string | null = null;
    apiFileurl: string = environment.fileUrl;

    constructor(
        public dialogRef: MatDialogRef<ApartmentOwnerFormComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { apartmentOwnerId?: number },
        private fb: FormBuilder,
        private apartmentOwnerService: ApartmentOwnersService,
        private usersService: UsersService,
        private notificationService: NotificationService,
        private dropdownService: DropdownService
    ) {
        this.isEdit = !!data?.apartmentOwnerId;
        this.initForm();
    }

    ngOnInit(): void {
        this.loadDropdowns();
        this.setupUserAutocomplete();
        this.setupBuildingAutocomplete();
        this.setupApartmentAutocomplete();
    }

    private initForm(): void {
        this.form = this.fb.group({
            id: [0],
            // User fields
            userId: [0],
            userName: [null],
            firstName: [null, Validators.required],
            lastName: [null, Validators.required],
            fatherName: [null],
            email: [null, [Validators.required, Validators.email]],
            phone: [null],
            mobilePhone: [null],
            idcardNumber: [null, [Validators.required, Validators.pattern(/^[A-Z0-9]{7}$/)]],
            dateOfBirth: [null],
            password: [null, Validators.required],
            // Owner/apartment fields
            complexId: [null, Validators.required],
            buildingId: [null, Validators.required],
            buildingName: [{ value: null, disabled: true }, Validators.required],
            apartmentId: [null, Validators.required],
            apartmentNumber: [{ value: null, disabled: true }, Validators.required],
            purchaseDate: [null, Validators.required],
            purchasePrice: [null, [Validators.required, Validators.min(0)]],
            deedNumber: [''],
            isMainOwner: [true],
            startDate: [null, Validators.required],
            endDate: [null],
        });

        this.setupFormDependencies();
    }

    toggleUserMode(newUser: boolean): void {
        this.isNewUser = newUser;

        if (newUser) {
            this.form.get('firstName')?.setValidators([Validators.required]);
            this.form.get('lastName')?.setValidators([Validators.required]);
            this.form.get('email')?.setValidators([Validators.required, Validators.email]);
            this.form.get('password')?.setValidators([Validators.required]);
            this.form.get('idcardNumber')?.setValidators([Validators.required, Validators.pattern(/^[A-Z0-9]{7}$/)]);
            this.form.get('userName')?.clearValidators();
            this.form.patchValue({ userId: 0, userName: null });
        } else {
            this.form.get('firstName')?.clearValidators();
            this.form.get('lastName')?.clearValidators();
            this.form.get('email')?.clearValidators();
            this.form.get('password')?.clearValidators();
            this.form.get('idcardNumber')?.clearValidators();
            this.form.get('userName')?.setValidators([Validators.required]);
            this.form.patchValue({ userId: 0 });
        }

        ['firstName', 'lastName', 'email', 'password', 'idcardNumber', 'userName'].forEach(f =>
            this.form.get(f)?.updateValueAndValidity()
        );
    }

    private setupFormDependencies(): void {
        this.form.get('complexId')?.valueChanges.subscribe(value => {
            if (value) {
                this.form.get('buildingName')?.enable();
            } else {
                this.form.get('buildingName')?.disable();
                this.form.get('apartmentNumber')?.disable();
            }
            this.form.patchValue({ buildingId: null, buildingName: null, apartmentId: null, apartmentNumber: null });
            this.filteredBuildings = [];
            this.filteredApartments = [];
        });

        this.form.get('buildingId')?.valueChanges.subscribe(value => {
            if (value) {
                this.form.get('apartmentNumber')?.enable();
            } else {
                this.form.get('apartmentNumber')?.disable();
            }
            this.form.patchValue({ apartmentId: null, apartmentNumber: null });
            this.filteredApartments = [];
        });
    }

    // ─── USER AUTOCOMPLETE (mövcud istifadəçi) ───
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
        this.form.patchValue({ userId: 0 });
        this.userSearchSubject.next((event.target as HTMLInputElement).value);
    }

    onUserSelected(event: MatAutocompleteSelectedEvent): void {
        const selected = this.filteredUsers.find(u => u.value === event.option.value);
        if (selected) {
            this.form.patchValue({ userId: selected.key, userName: selected.value });
        }
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
        this.form.patchValue({ buildingId: null });
        this.buildingSearchSubject.next((event.target as HTMLInputElement).value);
    }

    onBuildingSelected(event: MatAutocompleteSelectedEvent): void {
        const selected = this.filteredBuildings.find(b => b.value === event.option.value);
        if (selected) {
            this.form.patchValue({ buildingId: selected.key, buildingName: selected.value });
        }
    }

    // ─── APARTMENT AUTOCOMPLETE ───
    private setupApartmentAutocomplete(): void {
        this.apartmentSearchSubject.pipe(
            debounceTime(400),
            distinctUntilChanged(),
            switchMap(term => {
                const buildingId = this.form.get('buildingId')?.value;
                if (!buildingId || !term || term.trim().length < 2) {
                    this.filteredApartments = [];
                    this.apartmentSearchLoading = false;
                    return [];
                }
                this.apartmentSearchLoading = true;
                return this.dropdownService.getApartmentAutocomplete(term, buildingId);
            })
        ).subscribe({
            next: (results) => { this.filteredApartments = results; this.apartmentSearchLoading = false; },
            error: () => { this.filteredApartments = []; this.apartmentSearchLoading = false; }
        });
    }

    onApartmentSearch(event: Event): void {
        this.form.patchValue({ apartmentId: null });
        this.apartmentSearchSubject.next((event.target as HTMLInputElement).value);
    }

    onApartmentSelected(event: MatAutocompleteSelectedEvent): void {
        const selected = this.filteredApartments.find(a => a.value === event.option.value);
        if (selected) {
            this.form.patchValue({ apartmentId: selected.key, apartmentNumber: selected.value });
        }
    }

    // ─── DROPDOWNS ───
    private loadDropdowns(): void {
        forkJoin({ complexes: this.dropdownService.getComplexesDropdown() }).subscribe({
            next: ({ complexes }) => {
                this.complexes = complexes;
                this.dropdownsLoading = false;
                if (this.isEdit && this.data.apartmentOwnerId) {
                    this.loadApartmentOwner(this.data.apartmentOwnerId);
                }
            },
            error: (error) => {
                this.dropdownsLoading = false;
                this.notificationService.error(error.error?.message || 'Xəta baş verdi');
            }
        });
    }

    private loadApartmentOwner(id: number): void {
        this.apartmentOwnerService.getApartmentOwnerById(id).pipe(
            switchMap(ownerResponse => {
                if (!ownerResponse.status || !ownerResponse.data) {
                    return of({ ownerResponse, userResponse: null });
                }
                const ownerData = Array.isArray(ownerResponse.data)
                    ? (ownerResponse.data as any)[0]
                    : ownerResponse.data;
                if (!ownerData?.userId) {
                    return of({ ownerResponse, userResponse: null });
                }
                return forkJoin({
                    ownerResponse: of(ownerResponse),
                    userResponse: this.usersService.getUserById(ownerData.userId)
                });
            })
        ).subscribe({
            next: ({ ownerResponse, userResponse }) => {
                if (!ownerResponse.status || !ownerResponse.data) {
                    this.notificationService.info(ownerResponse.message || 'Məlumat tapılmadı');
                    return;
                }

                const ownerData = Array.isArray(ownerResponse.data)
                    ? (ownerResponse.data as any)[0]
                    : ownerResponse.data;

                // Owner sahələrini doldur
                this.form.patchValue(ownerData);

                if (ownerData.buildingId) {
                    this.form.get('buildingName')?.enable();
                    this.form.patchValue({ buildingName: ownerData.buildingName });
                }
                if (ownerData.apartmentId) {
                    this.form.get('apartmentNumber')?.enable();
                    this.form.patchValue({ apartmentNumber: ownerData.apartmentNumber });
                }

                // User sahələrini getUserById-dan doldur
                if (userResponse?.status && userResponse.data?.user) {
                    const u = userResponse.data.user;
                    this.form.patchValue({
                        firstName: u.firstName,
                        lastName: u.lastName,
                        fatherName: u.fatherName,
                        email: u.email,
                        phone: u.phone,
                        mobilePhone: u.mobilePhone,
                        idcardNumber: u.idcardNumber,
                        dateOfBirth: u.dateOfBirth,
                    });
                }

                // Edit modunda şifrə məcburi deyil
                this.form.get('password')?.clearValidators();
                this.form.get('password')?.updateValueAndValidity();
                this.existingFileUrl = ownerData.deedDocumentURL;
            },
            error: (error) => {
                this.notificationService.error(error?.error?.message || 'Məlumat yüklənərkən xəta baş verdi');
            }
        });
    }

    // ─── FILE UPLOAD ───
    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.selectedFile = input.files[0];
        }
    }

    removeFile(): void {
        this.selectedFile = null;
        this.existingFileUrl = null;
    }

    get documentLabel(): string {
        if (this.selectedFile) return this.selectedFile.name;
        if (this.existingFileUrl) {
            const parts = this.existingFileUrl.replace(/\\/g, '/').split('/');
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

        // Mövcud istifadəçi seçiləndə userId yoxlanır
        if (!this.isNewUser && !this.isEdit) {
            const userId = this.form.get('userId')?.value;
            if (!userId || userId === 0) {
                this.notificationService.error('İstifadəçi siyahıdan seçilməlidir');
                return;
            }
        }

        const formData = new FormData();
        const formValue = this.form.getRawValue();

        const excludeFields = ['buildingName', 'apartmentNumber', 'complexId', 'buildingId'];

        if (!this.isNewUser && !this.isEdit) {
            // Mövcud user: user detalları göndərilmir
            excludeFields.push('firstName', 'lastName', 'fatherName', 'email',
                'phone', 'mobilePhone', 'idcardNumber', 'dateOfBirth', 'password', 'userName');
        } else {
            // Yeni user və ya edit: userName display sahəsini çıxar
            excludeFields.push('userName');
        }

        Object.keys(formValue).forEach(key => {
            if (excludeFields.includes(key)) return;
            const value = formValue[key];
            if (value !== null && value !== undefined && value !== '') {
                if (value instanceof Date) {
                    formData.append(key, value.toISOString());
                } else {
                    formData.append(key, value.toString());
                }
            }
        });

        if (this.selectedFile) {
            formData.append('deedFile', this.selectedFile);
        }

        this.apartmentOwnerService.saveApartmentOwner(formData).subscribe({
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

    onFINInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        const value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        this.form.get('idcardNumber')?.setValue(value, { emitEvent: false });
        input.value = value;
    }

    get isMainOwnerValue(): boolean {
        return this.form.get('isMainOwner')?.value ?? false;
    }
}
