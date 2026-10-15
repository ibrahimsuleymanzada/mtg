// parking-assignment-form.component.ts

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
import { DropdownItem } from 'app/core/models/dropdown.model';
import { ParkingAssignmentsService } from 'app/core/services/complexes/parking-assignments.service';
import { NotificationService } from 'app/core/services/notification.service';
import { DropdownService } from 'app/core/services/dropdown.service';
import { NgxMaskDirective } from 'ngx-mask';

@Component({
    selector: 'parking-assignment-form',
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
        TranslocoModule,
        NgxMaskDirective,
    ],
    templateUrl: './parking-assignment-form.component.html'
})
export class ParkingAssignmentFormComponent implements OnInit {
    form: FormGroup;
    isEdit: boolean = false;
    dropdownsLoading: boolean = true;

    // Dropdown data
    assignmentTypes: DropdownItem[] = [];
    complexes: DropdownItem[] = [];

    // Autocomplete - User
    filteredUsers: DropdownItem[] = [];
    userSearchLoading: boolean = false;
    private userSearchSubject = new Subject<string>();

    // Autocomplete - Parking Space
    filteredParkingSpaces: DropdownItem[] = [];
    parkingSpaceSearchLoading: boolean = false;
    private parkingSpaceSearchSubject = new Subject<string>();

    // Autocomplete - Building
    filteredBuildings: { key: number; value: string }[] = [];
    buildingSearchLoading: boolean = false;
    private buildingSearchSubject = new Subject<string>();

    // Autocomplete - Apartment
    filteredApartments: DropdownItem[] = [];
    apartmentSearchLoading: boolean = false;
    private apartmentSearchSubject = new Subject<string>();

        // Maşın rəngləri (statik)
    vehicleColors = [
        { value: 'white', colorCode: '#FFFFFF' },
        { value: 'black', colorCode: '#000000' },
        { value: 'gray', colorCode: '#808080' },
        { value: 'silver', colorCode: '#C0C0C0' },
        { value: 'red', colorCode: '#DC143C' },
        { value: 'blue', colorCode: '#1E90FF' },
        { value: 'green', colorCode: '#228B22' },
        { value: 'yellow', colorCode: '#FFD700' },
        { value: 'orange', colorCode: '#FF8C00' },
        { value: 'brown', colorCode: '#8B4513' },
        { value: 'beige', colorCode: '#F5F5DC' },
        { value: 'gold', colorCode: '#FFD700' },
    ];

    constructor(
        public dialogRef: MatDialogRef<ParkingAssignmentFormComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { id?: number },
        private fb: FormBuilder,
        private parkingAssignmentsService: ParkingAssignmentsService,
        private notificationService: NotificationService,
        private dropdownService: DropdownService
    ) {
        this.isEdit = !!data?.id;
        this.initForm();
    }

    ngOnInit(): void {
        this.loadDropdowns();
        this.setupUserAutocomplete();
        this.setupParkingSpaceAutocomplete();
        this.setupBuildingAutocomplete();
        this.setupApartmentAutocomplete();
    }

    private initForm(): void {
        this.form = this.fb.group({
            id: [0],
            parkingSpaceId: [null, Validators.required],
            parkingSpaceName: [null, Validators.required],
            userId: [null, Validators.required],
            userName: [null, Validators.required],
            complexId: [null, Validators.required],
            buildingId: [null, Validators.required],
            buildingName: [{ value: null, disabled: true }, Validators.required],
            apartmentId: [null, Validators.required],
            apartmentNumber: [{ value: null, disabled: true }, Validators.required],
            assignmentType: [null, Validators.required],
            vehicleNumber: ['', Validators.required],
            vehicleBrand: ['', Validators.required],
            vehicleModel: ['', Validators.required],
            vehicleColor: [''],
            monthlyFee: [null],
            contractStartDate: [null, Validators.required],
            contractEndDate: [null, Validators.required],
        });

        this.setupFormDependencies();
    }

    private setupFormDependencies(): void {
        // Complex seçiləndə building enable et
        this.form.get('complexId')?.valueChanges.subscribe(value => {
            const buildingName = this.form.get('buildingName');
            const apartmentNumber = this.form.get('apartmentNumber');

            if (value) {
                buildingName?.enable();
            } else {
                buildingName?.disable();
                apartmentNumber?.disable();
            }

            // Building və apartment-i resetlə
            this.form.patchValue({
                buildingId: null,
                buildingName: null,
                apartmentId: null,
                apartmentNumber: null
            });
            this.filteredBuildings = [];
            this.filteredApartments = [];
        });

        // Building seçiləndə apartment enable et
        this.form.get('buildingId')?.valueChanges.subscribe(value => {
            const apartmentNumber = this.form.get('apartmentNumber');

            if (value) {
                apartmentNumber?.enable();
            } else {
                apartmentNumber?.disable();
            }

            // Apartment-i resetlə
            this.form.patchValue({
                apartmentId: null,
                apartmentNumber: null
            });
            this.filteredApartments = [];
        });
    }

    // ─── USER AUTOCOMPLETE ───
    private setupUserAutocomplete(): void {
        this.userSearchSubject
            .pipe(
                debounceTime(400),
                distinctUntilChanged(),
                switchMap(searchTerm => {
                    if (!searchTerm || searchTerm.trim().length < 2) {
                        this.filteredUsers = [];
                        this.userSearchLoading = false;
                        return [];
                    }

                    this.userSearchLoading = true;
                    return this.dropdownService.getUserAutocomplete(searchTerm);
                })
            )
            .subscribe({
                next: (results) => {
                    this.filteredUsers = results;
                    this.userSearchLoading = false;
                },
                error: () => {
                    this.filteredUsers = [];
                    this.userSearchLoading = false;
                }
            });
    }

    onUserSearch(event: Event): void {
        const input = event.target as HTMLInputElement;
        const searchTerm = input.value;
        this.form.patchValue({ userId: null });
        this.userSearchSubject.next(searchTerm);
    }

    onUserSelected(event: MatAutocompleteSelectedEvent): void {
        const selectedUser = this.filteredUsers.find(u => u.value === event.option.value);
        if (selectedUser) {
            this.form.patchValue({
                userId: selectedUser.key,
                userName: selectedUser.value
            });
        }
    }

    // ─── PARKING SPACE AUTOCOMPLETE ───
    private setupParkingSpaceAutocomplete(): void {
        this.parkingSpaceSearchSubject
            .pipe(
                debounceTime(400),
                distinctUntilChanged(),
                switchMap(searchTerm => {
                    if (!searchTerm || searchTerm.trim().length < 2) {
                        this.filteredParkingSpaces = [];
                        this.parkingSpaceSearchLoading = false;
                        return [];
                    }

                    this.parkingSpaceSearchLoading = true;
                    return this.dropdownService.getParkingSpaceAutocomplete(searchTerm);
                })
            )
            .subscribe({
                next: (results) => {
                    this.filteredParkingSpaces = results;
                    this.parkingSpaceSearchLoading = false;
                },
                error: () => {
                    this.filteredParkingSpaces = [];
                    this.parkingSpaceSearchLoading = false;
                }
            });
    }

    onParkingSpaceSearch(event: Event): void {
        const input = event.target as HTMLInputElement;
        const searchTerm = input.value;
        this.form.patchValue({ parkingSpaceId: null });
        this.parkingSpaceSearchSubject.next(searchTerm);
    }

    onParkingSpaceSelected(event: MatAutocompleteSelectedEvent): void {
        const selected = this.filteredParkingSpaces.find(p => p.value === event.option.value);
        if (selected) {
            this.form.patchValue({
                parkingSpaceId: selected.key,
                parkingSpaceName: selected.value
            });
        }
    }


    // ─── BUILDING AUTOCOMPLETE ───
    private setupBuildingAutocomplete(): void {
        this.buildingSearchSubject
            .pipe(
                debounceTime(400),
                distinctUntilChanged(),
                switchMap(searchTerm => {
                    const complexId = this.form.get('complexId')?.value;

                    if (!complexId) {
                        this.filteredBuildings = [];
                        this.buildingSearchLoading = false;
                        return [];
                    }

                    if (!searchTerm || searchTerm.trim().length < 2) {
                        this.filteredBuildings = [];
                        this.buildingSearchLoading = false;
                        return [];
                    }

                    this.buildingSearchLoading = true;
                    return this.dropdownService.getBuildingAutocomplete(searchTerm, complexId);
                })
            )
            .subscribe({
                next: (results) => {
                    this.filteredBuildings = results;
                    this.buildingSearchLoading = false;
                },
                error: () => {
                    this.filteredBuildings = [];
                    this.buildingSearchLoading = false;
                }
            });
    }

    onBuildingSearch(event: Event): void {
        const input = event.target as HTMLInputElement;
        const searchTerm = input.value;
        this.form.patchValue({ buildingId: null });
        this.buildingSearchSubject.next(searchTerm);
    }

    onBuildingSelected(event: MatAutocompleteSelectedEvent): void {
        const selectedBuilding = this.filteredBuildings.find(b => b.value === event.option.value);
        if (selectedBuilding) {
            this.form.patchValue({
                buildingId: selectedBuilding.key,
                buildingName: selectedBuilding.value
            });
        }
    }

    // ─── APARTMENT AUTOCOMPLETE ───
    private setupApartmentAutocomplete(): void {
        this.apartmentSearchSubject
            .pipe(
                debounceTime(400),
                distinctUntilChanged(),
                switchMap(searchTerm => {
                    const buildingId = this.form.get('buildingId')?.value;

                    if (!buildingId) {
                        this.filteredApartments = [];
                        this.apartmentSearchLoading = false;
                        return [];
                    }

                    if (!searchTerm || searchTerm.trim().length < 2) {
                        this.filteredApartments = [];
                        this.apartmentSearchLoading = false;
                        return [];
                    }

                    this.apartmentSearchLoading = true;
                    return this.dropdownService.getApartmentAutocomplete(searchTerm, buildingId);
                })
            )
            .subscribe({
                next: (results) => {
                    this.filteredApartments = results;
                    this.apartmentSearchLoading = false;
                },
                error: () => {
                    this.filteredApartments = [];
                    this.apartmentSearchLoading = false;
                }
            });
    }

    onApartmentSearch(event: Event): void {
        const input = event.target as HTMLInputElement;
        const searchTerm = input.value;
        this.form.patchValue({ apartmentId: null });
        this.apartmentSearchSubject.next(searchTerm);
    }

    onApartmentSelected(event: MatAutocompleteSelectedEvent): void {
        const selectedApartment = this.filteredApartments.find(a => a.value === event.option.value);
        if (selectedApartment) {
            this.form.patchValue({
                apartmentId: selectedApartment.key,
                apartmentNumber: selectedApartment.value
            });
        }
    }

    // ─── DROPDOWNS ───
    private loadDropdowns(): void {
        this.dropdownsLoading = true;

        forkJoin({
            assignmentTypes: this.dropdownService.getSpecCodeByType('parkingAssignmentType'),
            complexes: this.dropdownService.getComplexesDropdown()
        }).subscribe({
            next: ({ assignmentTypes, complexes }) => {
                this.assignmentTypes = assignmentTypes;
                this.complexes = complexes;
                this.dropdownsLoading = false;

                if (this.isEdit && this.data.id) {
                    this.loadData(this.data.id);
                }
            },
            error: (error) => {
                this.dropdownsLoading = false;
                this.notificationService.error(error.error.message);
            }
        });
    }

    private loadData(id: number): void {
        this.parkingAssignmentsService.getParkingAssignmentsById(id).subscribe({
            next: (response) => {
                if (response.status && response.data) {
                    const data = response.data[0];
                    this.form.patchValue(data);
                    this.form.patchValue({
                        userName: data.userFullname
                    })
                } else {
                    this.notificationService.info(
                        response.message || 'Məlumat tapılmadı'
                    );
                }
            },
            error: (error) => {
                this.notificationService.error(
                    error?.error?.message || 'Məlumat yüklənərkən xəta baş verdi'
                );
            }
        });
    }

    // ─── SAVE ───
    onSave(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const formValue = this.form.value;

        this.parkingAssignmentsService.saveParkingAssignments(formValue).subscribe({
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

    vehicleNumberPatterns = {
        '0': { pattern: /[0-9]/ },
        'A': { pattern: /[a-zA-Z]/, transform: (v: string) => v.toUpperCase() }
    };

    onCancel(): void {
        this.dialogRef.close(false);
    }
}