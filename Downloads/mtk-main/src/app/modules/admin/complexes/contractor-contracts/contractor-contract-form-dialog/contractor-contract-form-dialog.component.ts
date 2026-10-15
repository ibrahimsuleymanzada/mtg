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
import { TranslocoModule } from '@ngneat/transloco';
import { NotificationService } from 'app/core/services/notification.service';
import { DropdownService } from 'app/core/services/dropdown.service';
import { DropdownItem } from 'app/core/models/dropdown.model';
import { ContractorsService } from 'app/core/services/contractors/contractors.service';
import { ContractorContractFormData } from 'app/core/models/contractors/contractor.types';
import { debounceTime, distinctUntilChanged, forkJoin, Subject, switchMap, takeUntil } from 'rxjs';

@Component({
    selector: 'contractor-contract-form-dialog',
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
        TranslocoModule
    ],
    templateUrl: './contractor-contract-form-dialog.component.html'
})
export class ContractorContractFormDialogComponent implements OnInit, OnDestroy {
    form: FormGroup;
    isEdit = false;
    dropdownsLoading = true;

    complexes: DropdownItem[] = [];
    statuses: DropdownItem[] = [];

    filteredContractors: { key: number; value: string }[] = [];
    contractorSearchLoading = false;
    private contractorSearchSubject = new Subject<string>();

    filteredBuildings: { key: number; value: string }[] = [];
    buildingSearchLoading = false;
    private buildingSearchSubject = new Subject<string>();

    private _unsubscribeAll = new Subject<void>();

    constructor(
        public dialogRef: MatDialogRef<ContractorContractFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { contractId?: number; contractorName?: string },
        private fb: FormBuilder,
        private contractorsService: ContractorsService,
        private notificationService: NotificationService,
        private dropdownService: DropdownService
    ) {
        this.isEdit = !!data?.contractId;
        this.initForm();
    }

    ngOnInit(): void {
        this.loadDropdowns();
        this.setupContractorAutocomplete();
        this.setupBuildingAutocomplete();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    private initForm(): void {
        this.form = this.fb.group({
            id:                [0],
            contractorId:      [null, Validators.required],
            contractorName:    [null, Validators.required],
            complexId:         [null, Validators.required],
            buildingId:        [null],
            buildingName:      [{ value: null, disabled: true }],
            contractStartDate: [null, Validators.required],
            contractEndDate:   [null, Validators.required],
            monthlyFee:        [null, [Validators.required, Validators.min(0)]],
            description:       [null],
            status:            [null, Validators.required]
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

    private setupBuildingAutocomplete(): void {
        this.buildingSearchSubject
            .pipe(
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
                }),
                takeUntil(this._unsubscribeAll)
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
        this.form.patchValue({ buildingId: null });
        this.buildingSearchSubject.next((event.target as HTMLInputElement).value);
    }

    onBuildingSelected(event: MatAutocompleteSelectedEvent): void {
        const selected = this.filteredBuildings.find(b => b.value === event.option.value);
        if (selected) {
            this.form.patchValue({ buildingId: selected.key, buildingName: selected.value });
        }
    }

    private setupContractorAutocomplete(): void {
        this.contractorSearchSubject
            .pipe(
                debounceTime(400),
                distinctUntilChanged(),
                switchMap(term => {
                    if (!term || term.trim().length < 2) {
                        this.filteredContractors = [];
                        this.contractorSearchLoading = false;
                        return [];
                    }
                    this.contractorSearchLoading = true;
                    return this.dropdownService.getContractorAutocomplete(term);
                }),
                takeUntil(this._unsubscribeAll)
            )
            .subscribe({
                next: (results) => {
                    this.filteredContractors = results;
                    this.contractorSearchLoading = false;
                },
                error: () => {
                    this.filteredContractors = [];
                    this.contractorSearchLoading = false;
                }
            });
    }

    onContractorSearch(event: Event): void {
        this.form.patchValue({ contractorId: null });
        this.contractorSearchSubject.next((event.target as HTMLInputElement).value);
    }

    onContractorSelected(event: MatAutocompleteSelectedEvent): void {
        const selected = this.filteredContractors.find(c => c.value === event.option.value);
        if (selected) {
            this.form.patchValue({ contractorId: selected.key, contractorName: selected.value });
        }
    }

    private loadDropdowns(): void {
        forkJoin({
            statuses:  this.dropdownService.getSpecCodeByType('contractStatus'),
            complexes: this.dropdownService.getComplexesDropdown()
        }).subscribe({
            next: ({ statuses, complexes }) => {
                this.statuses  = statuses;
                this.complexes = complexes;
                if (this.isEdit && this.data.contractId) {
                    this.loadContract(this.data.contractId);
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


    private loadContract(id: number): void {
        this.contractorsService.getContractById(id).subscribe({
            next: (response) => {
                const item = Array.isArray(response.data) ? response.data[0] : response.data;
                if (response.status && item) {
                    this.form.get('buildingName')?.enable();
                    this.form.patchValue({
                        ...item,
                        contractorName: this.data.contractorName ?? null
                    });
                } else {
                    this.notificationService.info(response.message || 'Məlumat tapılmadı');
                }
                this.dropdownsLoading = false;
            },
            error: (error) => {
                this.notificationService.error(error?.error?.message || 'Məlumat yüklənərkən xəta baş verdi');
                this.dropdownsLoading = false;
            }
        });
    }

    onSave(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        const formValue = this.form.value;
        const payload: ContractorContractFormData = {
            ...formValue,
            contractStartDate: formValue.contractStartDate
                ? new Date(formValue.contractStartDate).toISOString()
                : null,
            contractEndDate: formValue.contractEndDate
                ? new Date(formValue.contractEndDate).toISOString()
                : null
        };
        this.contractorsService.saveContract(payload).subscribe({
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
