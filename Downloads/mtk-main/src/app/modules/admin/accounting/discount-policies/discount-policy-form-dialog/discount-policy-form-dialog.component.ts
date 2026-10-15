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
import { DropdownService } from 'app/core/services/dropdown.service';
import { DropdownItem, TargetDropdownItem } from 'app/core/models/dropdown.model';
import { TranslocoModule } from '@ngneat/transloco';
import { DiscountPoliciesService } from 'app/core/services/accounting/discount-policies.service';
import { DiscountPolicyFormData } from 'app/core/models/accounting/discount-policy.types';

const TARGET_TYPE_MAP: Record<number, string> = {
    1: 'Apartment',
    2: 'CommercialSpace',
    3: 'ParkingSpace'
};

const TARGET_TYPE_REVERSE: Record<string, number> = {
    'Apartment': 1,
    'CommercialSpace': 2,
    'ParkingSpace': 3
};

@Component({
    selector: 'discount-policy-form-dialog',
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
    templateUrl: './discount-policy-form-dialog.component.html'
})
export class DiscountPolicyFormDialogComponent implements OnInit, OnDestroy {
    form: FormGroup;
    isEdit: boolean = false;
    dropdownsLoading: boolean = true;
    targetsLoading: boolean = false;

    categories: DropdownItem[] = [];
    discountTypes: DropdownItem[] = [];
    targetTypes: DropdownItem[] = [];
    targets: TargetDropdownItem[] = [];

    filteredUsers: { key: number; value: string }[] = [];
    userSearchLoading = false;
    private userSearchSubject = new Subject<string>();

    constructor(
        public dialogRef: MatDialogRef<DiscountPolicyFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { policyId?: number },
        private fb: FormBuilder,
        private discountPoliciesService: DiscountPoliciesService,
        private notificationService: NotificationService,
        private dropdownService: DropdownService,
    ) {
        this.isEdit = !!data?.policyId;
        this.initForm();
    }

    ngOnInit(): void {
        this.setupUserAutocomplete();
        this.loadDropdowns();
    }

    ngOnDestroy(): void {
        this.userSearchSubject.complete();
    }

    private initForm(): void {
        this.form = this.fb.group({
            id: [0],
            targetTypeKey: [null, Validators.required],
            targetId: [null, Validators.required],
            userId: [null],
            person: [null],
            categoryId: [null],
            discountTypeId: [null, Validators.required],
            discountValue: [null, [Validators.required, Validators.min(0)]],
            validFrom: [null, Validators.required],
            validTo: [null, Validators.required],
            description: ['']
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

    onTargetTypeChange(targetTypeKey: number): void {
        this.form.patchValue({ targetId: null });
        this.targets = [];
        if (!targetTypeKey) return;

        const targetTypeString = TARGET_TYPE_MAP[targetTypeKey];
        if (!targetTypeString) return;

        this.targetsLoading = true;
        this.dropdownService.getTargetDropdown(null, null, targetTypeString).subscribe({
            next: (items) => {
                this.targets = items;
                this.targetsLoading = false;
            },
            error: () => {
                this.targets = [];
                this.targetsLoading = false;
            }
        });
    }

    onTargetSelected(targetId: number): void {
        const selected = this.targets.find(t => t.key === targetId);
        if (selected?.defaultUserId) {
            this.form.patchValue({
                userId: selected.defaultUserId,
                person: selected.defaultUserName
            });
        }
    }

    private loadDropdowns(): void {
        this.dropdownsLoading = true;

        forkJoin({
            categories: this.dropdownService.getPaymentCategories(),
            discountTypes: this.dropdownService.getSpecCodeByType('DiscountType'),
            targetTypes: this.dropdownService.getSpecCodeByType('TargetType'),
        }).subscribe({
            next: ({ categories, discountTypes, targetTypes }) => {
                this.categories = categories;
                this.discountTypes = discountTypes || [];
                this.targetTypes = targetTypes || [];

                if (this.isEdit && this.data.policyId) {
                    this.loadPolicy(this.data.policyId);
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

    private loadPolicy(id: number): void {
        this.discountPoliciesService.getDiscountPolicyById(id).subscribe({
            next: (response) => {
                if (response.status && response.data) {
                    const policy = Array.isArray(response.data) ? response.data[0] : response.data;
                    const targetTypeKey = TARGET_TYPE_REVERSE[policy.targetType] ?? 1;
                    const targetTypeString = TARGET_TYPE_MAP[targetTypeKey];

                    this.dropdownService.getTargetDropdown(null, null, targetTypeString).subscribe({
                        next: (targets) => {
                            this.targets = targets;
                            this.form.patchValue({
                                id: policy.id,
                                targetTypeKey,
                                targetId: policy.targetId,
                                userId: policy.userId,
                                person: targets.find(t => t.key === policy.targetId)?.defaultUserName ?? null,
                                categoryId: policy.categoryId,
                                discountTypeId: policy.discountTypeId,
                                discountValue: policy.discountValue,
                                validFrom: policy.validFrom,
                                validTo: policy.validTo,
                                description: policy.description ?? ''
                            });
                            this.dropdownsLoading = false;
                        },
                        error: () => {
                            this.dropdownsLoading = false;
                            this.notificationService.error('Hədəf siyahısı yüklənərkən xəta baş verdi');
                        }
                    });
                } else {
                    this.notificationService.info(response.message || 'Güzəşt məlumatları tapılmadı');
                    this.dropdownsLoading = false;
                }
            },
            error: () => {
                this.notificationService.error('Güzəşt yüklənərkən xəta baş verdi');
                this.dropdownsLoading = false;
            }
        });
    }

    onSave(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const v = this.form.value;
        const targetTypeKey: number = v.targetTypeKey;
        const targetTypeString = TARGET_TYPE_MAP[targetTypeKey];

        const formData: DiscountPolicyFormData = {
            id: v.id,
            targetType: targetTypeString,
            apartmentId: targetTypeKey === 1 ? v.targetId : null,
            commercialSpaceId: targetTypeKey === 2 ? v.targetId : null,
            parkingSpaceId: targetTypeKey === 3 ? v.targetId : null,
            advertisingBoardId: null,
            userId: v.userId || null,
            categoryId: v.categoryId || null,
            discountTypeId: v.discountTypeId,
            discountValue: v.discountValue,
            validFrom: v.validFrom instanceof Date ? v.validFrom.toISOString() : v.validFrom,
            validTo: v.validTo instanceof Date ? v.validTo.toISOString() : v.validTo,
            description: v.description || ''
        };

        this.discountPoliciesService.saveDiscountPolicy(formData).subscribe({
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
