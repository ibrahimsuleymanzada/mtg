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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslocoModule } from '@ngneat/transloco';
import { debounceTime, distinctUntilChanged, forkJoin, Subject, switchMap } from 'rxjs';
import { DropdownItem } from 'app/core/models/dropdown.model';
import { CommercialSpacesService } from 'app/core/services/complexes/commercial-spaces.service';
import { NotificationService } from 'app/core/services/notification.service';
import { DropdownService } from 'app/core/services/dropdown.service';


@Component({
    selector: 'commercial-space-form',
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
        TranslocoModule
    ],
    templateUrl: './commercial-space-form.component.html'
})
export class CommercialSpaceFormComponent implements OnInit {

    form: FormGroup;
    isEdit: boolean = false;
    dropdownsLoading: boolean = true;

    // Dropdown data
    complexes: DropdownItem[] = [];
    spaceTypes: DropdownItem[] = [];

    // Autocomplete - Building
    filteredBuildings: { key: number; value: string }[] = [];
    buildingSearchLoading: boolean = false;
    private buildingSearchSubject = new Subject<string>();

    constructor(
        public dialogRef: MatDialogRef<CommercialSpaceFormComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { commercialSpaceId?: number },
        private fb: FormBuilder,
        private commercialSpacesService: CommercialSpacesService,
        private notificationService: NotificationService,
        private dropdownService: DropdownService
    ) {
        this.isEdit = !!data?.commercialSpaceId;
        this.initForm();
    }

    ngOnInit(): void {
        this.loadDropdowns();
        this.setupBuildingAutocomplete();
    }

    // ─── FORM ───
    private initForm(): void {
        this.form = this.fb.group({
            id:              [0],
            complexId:       [null, Validators.required],
            buildingId:      [null, Validators.required],
            buildingName:    [{ value: null, disabled: true }, Validators.required],
            spaceNumber:     [null, Validators.required],
            floor:           [null, Validators.required],
            spaceTypeId:       [null, Validators.required],
            area:            [null, [Validators.required, Validators.min(1)]],
            description:     [null],
            salePrice:     [null, [Validators.required, Validators.min(0)]],
            monthlyRent:     [null, [Validators.required, Validators.min(0)]],
            securityDeposit: [null, [Validators.required, Validators.min(0)]],
            hasWater:        [false],
            hasElectricity:  [false],
            hasSewerage:     [false]
        });

        this.setupFormDependencies();
    }

    private setupFormDependencies(): void {
        this.form.get('complexId')?.valueChanges.subscribe(value => {
            const buildingName = this.form.get('buildingName');

            if (value) {
                buildingName?.enable();
            } else {
                buildingName?.disable();
            }

            // Building-i resetlə
            this.form.patchValue({
                buildingId: null,
                buildingName: null
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
        this.form.patchValue({ buildingId: null });
        this.buildingSearchSubject.next(input.value);
    }

    onBuildingSelected(event: MatAutocompleteSelectedEvent): void {
        const selected = this.filteredBuildings.find(b => b.value === event.option.value);
        if (selected) {
            this.form.patchValue({
                buildingId: selected.key,
                buildingName: selected.value
            });
        }
    }

    // ─── DROPDOWNS ───
    private loadDropdowns(): void {
        this.dropdownsLoading = true;

        forkJoin({
            spaceTypes:    this.dropdownService.getSpecCodeByType('commercialSpaceType'),
            complexes:     this.dropdownService.getComplexesDropdown()
        }).subscribe({
            next: ({ spaceTypes, complexes }) => {
                this.spaceTypes    = spaceTypes;
                this.complexes     = complexes;
                this.dropdownsLoading = false;

                if (this.isEdit && this.data.commercialSpaceId) {
                    this.loadCommercialSpace(this.data.commercialSpaceId);
                }
            },
            error: (error) => {
                this.dropdownsLoading = false;
                this.notificationService.error(error?.error?.message || 'Xəta baş verdi');
            }
        });
    }

    private loadCommercialSpace(id: number): void {
        this.commercialSpacesService.getCommercialSpaceById(id).subscribe({
            next: (response) => {
                if (response.status && response.data) {
                    const data = response.data;
                    this.form.patchValue(data);
                } else {
                    this.notificationService.info(response.message || 'Məlumat tapılmadı');
                }
            },
            error: (error) => {
                this.notificationService.error(error?.error?.message || 'Məlumat yüklənərkən xəta baş verdi');
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

        this.commercialSpacesService.saveCommercialSpace(formValue).subscribe({
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