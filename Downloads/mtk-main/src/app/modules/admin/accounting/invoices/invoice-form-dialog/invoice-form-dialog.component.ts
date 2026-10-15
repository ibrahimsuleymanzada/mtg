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
import { debounceTime, distinctUntilChanged, forkJoin, Subject, switchMap } from 'rxjs';
import { NotificationService } from 'app/core/services/notification.service';
import { InvoicesService } from 'app/core/services/accounting/invoices.service';
import { InvoiceFormData } from 'app/core/models/invoice.model';
import { DropdownItem } from 'app/core/models/dropdown.model';
import { DropdownService } from 'app/core/services/dropdown.service';
import { TranslocoModule } from '@ngneat/transloco';

@Component({
    selector: 'invoice-form-dialog',
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
        TranslocoModule,
    ],
    templateUrl: './invoice-form-dialog.component.html'
})
export class InvoiceFormDialogComponent implements OnInit, OnDestroy {
    form: FormGroup;
    isEdit: boolean = false;
    dropdownsLoading: boolean = true;

    categories: DropdownItem[] = [];
    invoiceStatuses: DropdownItem[] = [];
    complexes: DropdownItem[] = [];

    readonly targetTypes = [
        { key: 'Apartment', labelKey: 'forms.invoices.targetTypes.apartment' },
        { key: 'CommercialSpace', labelKey: 'forms.invoices.targetTypes.commercialSpace' },
        { key: 'ParkingSpace', labelKey: 'forms.invoices.targetTypes.parkingSpace' },
    ];

    // Building autocomplete
    filteredBuildings: { key: number; value: string }[] = [];
    buildingSearchLoading = false;
    private buildingSearchSubject = new Subject<string>();

    // Target mat-select dropdown
    targetOptions: { key: number; value: string }[] = [];
    targetLoading = false;

    // User autocomplete
    filteredUsers: { key: number; value: string }[] = [];
    userSearchLoading = false;
    private userSearchSubject = new Subject<string>();

    constructor(
        public dialogRef: MatDialogRef<InvoiceFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { invoiceId?: number },
        private fb: FormBuilder,
        private invoicesService: InvoicesService,
        private notificationService: NotificationService,
        private dropdownService: DropdownService,
    ) {
        this.isEdit = !!data?.invoiceId;
        this.initForm();
    }

    ngOnInit(): void {
        this.loadDropdowns();
        this.setupBuildingAutocomplete();
        this.setupUserAutocomplete();
    }

    ngOnDestroy(): void {
        this.buildingSearchSubject.complete();
        this.userSearchSubject.complete();
    }

    get isTargetEnabled(): boolean {
        const { complexId, buildingId, targetType } = this.form.value;
        return !!complexId && !!buildingId && !!targetType;
    }

    private initForm(): void {
        this.form = this.fb.group({
            id: [0],
            invoiceNumber: [''],
            complexId: [null, Validators.required],
            buildingId: [null, Validators.required],
            buildingName: [null, Validators.required],
            targetType: ['Apartment', Validators.required],
            targetId: [null, Validators.required],
            targetIdentifier: [null],
            userId: [0, Validators.required],
            person: [null],
            categoryId: [null, Validators.required],
            description: [''],
            amount: [null, [Validators.required, Validators.min(0)]],
            dueDate: [null, Validators.required],
            issueDate: [null, Validators.required],
            statusId: [1, Validators.required],
            lateFee: [0, Validators.min(0)],
            discount: [0, Validators.min(0)],
            notes: [''],
        });
    }

    private setupBuildingAutocomplete(): void {
        this.buildingSearchSubject
            .pipe(
                debounceTime(400),
                distinctUntilChanged(),
                switchMap(term => {
                    if (!term || term.trim().length < 2) {
                        this.filteredBuildings = [];
                        this.buildingSearchLoading = false;
                        return [];
                    }
                    this.buildingSearchLoading = true;
                    const complexId = this.form.get('complexId')?.value ?? 0;
                    return this.dropdownService.getBuildingAutocomplete(term, complexId);
                })
            )
            .subscribe({
                next: results => {
                    this.filteredBuildings = results;
                    this.buildingSearchLoading = false;
                },
                error: () => {
                    this.filteredBuildings = [];
                    this.buildingSearchLoading = false;
                }
            });
    }

    private setupUserAutocomplete(): void {
        this.userSearchSubject
            .pipe(
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
            )
            .subscribe({
                next: results => {
                    this.filteredUsers = results;
                    this.userSearchLoading = false;
                },
                error: () => {
                    this.filteredUsers = [];
                    this.userSearchLoading = false;
                }
            });
    }

    private loadTargetDropdown(): void {
        const complexId = this.form.get('complexId')?.value;
        const buildingId = this.form.get('buildingId')?.value;
        const targetType = this.form.get('targetType')?.value;

        if (!complexId || !buildingId || !targetType) {
            this.targetOptions = [];
            return;
        }

        this.targetLoading = true;
        this.targetOptions = [];
        this.form.patchValue({ targetId: null, targetIdentifier: null });

        this.dropdownService.getTargetDropdown(complexId, buildingId, targetType).subscribe({
            next: results => {
                this.targetOptions = results;
                this.targetLoading = false;
            },
            error: () => {
                this.targetOptions = [];
                this.targetLoading = false;
            }
        });
    }

    onComplexChange(): void {
        this.form.patchValue({ buildingId: null, buildingName: null, targetId: null, targetIdentifier: null });
        this.filteredBuildings = [];
        this.targetOptions = [];
    }

    onBuildingSearch(event: Event): void {
        this.form.patchValue({ buildingId: null, targetId: null, targetIdentifier: null });
        this.targetOptions = [];
        this.buildingSearchSubject.next((event.target as HTMLInputElement).value);
    }

    onBuildingSelected(event: MatAutocompleteSelectedEvent): void {
        const item = this.filteredBuildings.find(b => b.value === event.option.value);
        if (item) {
            this.form.patchValue({ buildingId: item.key, buildingName: item.value });
            this.loadTargetDropdown();
        }
    }

    onTargetTypeChange(): void {
        this.form.patchValue({ targetId: null, targetIdentifier: null });
        this.targetOptions = [];
        this.loadTargetDropdown();
    }

    onTargetChange(targetId: number): void {
        const item = this.targetOptions.find(t => t.key === targetId);
        if (item) {
            this.form.patchValue({ targetIdentifier: item.value });
        }
    }

    onUserSearch(event: Event): void {
        this.form.patchValue({ userId: null });
        this.userSearchSubject.next((event.target as HTMLInputElement).value);
    }

    onUserSelected(event: MatAutocompleteSelectedEvent): void {
        const item = this.filteredUsers.find(u => u.value === event.option.value);
        if (item) {
            this.form.patchValue({ userId: item.key, person: item.value });
        }
    }

    private loadDropdowns(): void {
        this.dropdownsLoading = true;

        const requests: any = {
            categories: this.dropdownService.getPaymentCategories(),
            invoiceStatuses: this.dropdownService.getSpecCodeByType('InvoiceStatus'),
            complexes: this.dropdownService.getComplexesDropdown(),
        };

        if (!this.isEdit) {
            requests['invoiceNumber'] = this.dropdownService.GenerateInvoiceNumber();
        }

        forkJoin(requests).subscribe({
            next: (results: any) => {
                this.categories = results.categories;
                this.invoiceStatuses = results.invoiceStatuses ?? [];
                this.complexes = results.complexes ?? [];

                if (!this.isEdit && results.invoiceNumber) {
                    this.form.patchValue({ invoiceNumber: results.invoiceNumber });
                }

                if (this.isEdit && this.data.invoiceId) {
                    this.loadInvoice(this.data.invoiceId);
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

    private loadInvoice(id: number): void {
        this.invoicesService.getInvoiceById(id).subscribe({
            next: (response) => {
                if (response.status && response.data) {
                    const invoice = Array.isArray(response.data) ? response.data[0] : response.data;
                    this.form.patchValue(invoice);
                    // Edit modunda mövcud complex/building/targetType üçün target siyahısını yüklə
                    if (invoice.complexId && invoice.buildingId && invoice.targetType) {
                        this.dropdownService.getTargetDropdown(
                            invoice.complexId,
                            invoice.buildingId,
                            invoice.targetType
                        ).subscribe({
                            next: results => { this.targetOptions = results; }
                        });
                    }
                    this.dropdownsLoading = false;
                } else {
                    this.notificationService.info(response.message || 'İnvoys məlumatları tapılmadı');
                    this.dropdownsLoading = false;
                }
            },
            error: () => {
                this.notificationService.error('İnvoys yüklənərkən xəta baş verdi');
                this.dropdownsLoading = false;
            }
        });
    }

    onSave(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const { buildingName, targetIdentifier, person, ...formData } = this.form.value;
        const invoiceData: InvoiceFormData = formData;

        this.invoicesService.saveInvoice(invoiceData).subscribe({
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
