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
import { debounceTime, distinctUntilChanged, forkJoin, Subject, switchMap } from 'rxjs';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslocoModule } from '@ngneat/transloco';
import { ApartmentOwnersService } from 'app/core/services/complexes/apartment-owners.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { environment } from 'environments/environment';
import { ParkingsService } from 'app/core/services/complexes/parking.service';
@Component({
    selector: 'parking-form',
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
        MatNativeDateModule
    ],
    templateUrl: './parking-form.component.html'
})
export class ParkingFormComponent implements OnInit {

    form: FormGroup;
    isEdit: boolean = false;
    dropdownsLoading: boolean = true;

    // Dropdown data
    complexes: DropdownItem[] = [];
    parkingSpaceType: DropdownItem[] = [];
    parkingStatus: DropdownItem[] = [];

    // Autocomplete - Building
    filteredBuildings: { key: number; value: string }[] = [];
    buildingSearchLoading: boolean = false;
    private buildingSearchSubject = new Subject<string>();



    constructor(
        public dialogRef: MatDialogRef<ParkingFormComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { apartmentOwnerId?: number },
        private fb: FormBuilder,
        private parkingsService: ParkingsService,
        private notificationService: NotificationService,
        private dropdownService: DropdownService
    ) {
        this.isEdit = !!data?.apartmentOwnerId;
        this.initForm();
    }

    ngOnInit(): void {
        this.loadDropdowns();
        this.setupBuildingAutocomplete();
    }

    private initForm(): void {
        this.form = this.fb.group({
            id: [0],
            complexId: [null, Validators.required],
            buildingId: [null, Validators.required],
            buildingName: [{ value: null, disabled: true }, Validators.required],
            spaceNumber: [null, Validators.required],
            spaceType: [null, Validators.required],
            monthlyRentalPrice: [null, [ Validators.required, Validators.min(1) ]],
            salePrice: [null, [ Validators.required, Validators.min(1) ]],
            level: [null, Validators.required],
            status: [null, Validators.required],
            isElectricCharging: [false],
        });

        this.setupFormDependencies()
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
        });


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



    // ─── DROPDOWNS ───
    private loadDropdowns(): void {
        this.dropdownsLoading = true;

        forkJoin({
            parkingSpaceType: this.dropdownService.getSpecCodeByType('parkingSpaceType'),
            parkingStatus: this.dropdownService.getSpecCodeByType('parkingStatus'),
            complexes: this.dropdownService.getComplexesDropdown()
        }).subscribe({
            next: ({ parkingSpaceType, parkingStatus, complexes }) => {
                this.parkingSpaceType = parkingSpaceType;
                this.parkingStatus = parkingStatus;
                this.complexes = complexes;
                this.dropdownsLoading = false;

                if (this.isEdit && this.data.apartmentOwnerId) {
                    this.loadApartmentOwner(this.data.apartmentOwnerId);
                }
            },
            error: (error) => {
                this.dropdownsLoading = false;
                this.notificationService.error(error.error.message);
            }
        });
    }

    private loadApartmentOwner(id: number): void {
        this.parkingsService.getParkingById(id).subscribe({
            next: (response) => {
                if (response.status && response.data) {
                    const data = response.data[0];

                    this.form.patchValue(data)
                    this.form.patchValue({
                        status: data.statusId,
                        spaceType: data.spaceTypeId,
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


        this.parkingsService.saveParking(formValue).subscribe({
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
