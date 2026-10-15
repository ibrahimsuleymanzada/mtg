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
import { TranslocoModule } from '@ngneat/transloco';
import { debounceTime, distinctUntilChanged, forkJoin, Subject, switchMap } from 'rxjs';
import { DropdownItem } from 'app/core/models/dropdown.model';
import { NotificationService } from 'app/core/services/notification.service';
import { DropdownService } from 'app/core/services/dropdown.service';
import { AdvertisingBoardsService } from 'app/core/services/complexes/advertising-boards.service';

@Component({
    selector: 'advertising-board-form',
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
        TranslocoModule,
    ],
    templateUrl: './advertising-board-form.component.html'
})
export class AdvertisingBoardFormComponent implements OnInit {
    form: FormGroup;
    isEdit: boolean = false;
    dropdownsLoading: boolean = true;

    // Dropdown data
    complexes: DropdownItem[] = [];

    // Autocomplete - Building
    filteredBuildings: { key: number; value: string }[] = [];
    buildingSearchLoading: boolean = false;
    private buildingSearchSubject = new Subject<string>();

    constructor(
        public dialogRef: MatDialogRef<AdvertisingBoardFormComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { id?: number },
        private fb: FormBuilder,
        private advertisingBoardsService: AdvertisingBoardsService,
        private notificationService: NotificationService,
        private dropdownService: DropdownService
    ) {
        this.isEdit = !!data?.id;
        this.initForm();
    }

    ngOnInit(): void {
        this.loadDropdowns();
        this.setupBuildingAutocomplete();
    }

    private initForm(): void {
        this.form = this.fb.group({
            id:           [0],
            complexId:    [null, Validators.required],
            buildingId:   [null, Validators.required],
            buildingName: [{ value: null, disabled: true }, Validators.required],
            location:     ['', Validators.required],
            boardSize:    ['', Validators.required],
            description:  [''],
            monthlyPrice: [null, [Validators.required, Validators.min(0)]],
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

            this.form.patchValue({ buildingId: null, buildingName: null });
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

                    if (!complexId || !searchTerm || searchTerm.trim().length < 2) {
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
            this.form.patchValue({ buildingId: selected.key, buildingName: selected.value });
        }
    }

    // ─── DROPDOWNS ───
    private loadDropdowns(): void {
        this.dropdownsLoading = true;

        forkJoin({
            complexes: this.dropdownService.getComplexesDropdown()
        }).subscribe({
            next: ({ complexes }) => {
                this.complexes = complexes;
                this.dropdownsLoading = false;

                if (this.isEdit && this.data.id) {
                    this.loadData(this.data.id);
                }
            },
            error: (error) => {
                this.dropdownsLoading = false;
                this.notificationService.error(error?.error?.message || 'Xəta baş verdi');
            }
        });
    }

    private loadData(id: number): void {
        this.advertisingBoardsService.getAdvertisingBoardById(id).subscribe({
            next: (response) => {
                if (response.status && response.data) {
                    const data = response.data[0];

                    // Enable building field before patching
                    this.form.get('buildingName')?.enable();

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

        const formValue = this.form.getRawValue();

        this.advertisingBoardsService.saveAdvertisingBoard(formValue).subscribe({
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