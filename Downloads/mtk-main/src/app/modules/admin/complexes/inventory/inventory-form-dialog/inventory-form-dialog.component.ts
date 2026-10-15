import { Component, Inject, OnInit } from '@angular/core';
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
import { TranslocoModule } from '@ngneat/transloco';
import { NotificationService } from 'app/core/services/notification.service';
import { DropdownService } from 'app/core/services/dropdown.service';
import { DropdownItem } from 'app/core/models/dropdown.model';
import { InventoryService } from 'app/core/services/inventory/inventory.service';
import { InventoryFormData } from 'app/core/models/inventory/inventory.types';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'inventory-form-dialog',
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
        TranslocoModule
    ],
    templateUrl: './inventory-form-dialog.component.html'
})
export class InventoryFormDialogComponent implements OnInit {
    form: FormGroup;
    isEdit = false;
    dropdownsLoading = true;

    complexes: DropdownItem[] = [];
    statuses: DropdownItem[] = [];
    categories: DropdownItem[] = [];
    units: DropdownItem[] = [];

    constructor(
        public dialogRef: MatDialogRef<InventoryFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { inventoryId?: number },
        private fb: FormBuilder,
        private inventoryService: InventoryService,
        private notificationService: NotificationService,
        private dropdownService: DropdownService
    ) {
        this.isEdit = !!data?.inventoryId;
        this.initForm();
    }

    ngOnInit(): void {
        this.loadDropdowns();
    }

    private initForm(): void {
        this.form = this.fb.group({
            id:            [0],
            complexId:     [null, Validators.required],
            name:          [null, Validators.required],
            category:      [null, Validators.required],
            quantity:      [null, [Validators.required, Validators.min(0)]],
            unit:          [null, Validators.required],
            status:        [null, Validators.required],
            location:      [null],
            purchaseDate:  [null],
            purchasePrice: [null, [Validators.min(0)]],
            notes:         [null]
        });
    }

    private loadDropdowns(): void {
        forkJoin({
            statuses:   this.dropdownService.getSpecCodeByType('inventoryStatus'),
            categories: this.dropdownService.getSpecCodeByType('inventoryCategory'),
            units:      this.dropdownService.getSpecCodeByType('unitOfMeasure'),
            complexes:  this.dropdownService.getComplexesDropdown()
        }).subscribe({
            next: ({ statuses, categories, units, complexes }) => {
                this.statuses   = statuses;
                this.categories = categories;
                this.units      = units;
                this.complexes  = complexes;
                if (this.isEdit && this.data.inventoryId) {
                    this.loadInventory(this.data.inventoryId);
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

    private loadInventory(id: number): void {
        this.inventoryService.getInventoryById(id).subscribe({
            next: (response) => {
                const item = Array.isArray(response.data) ? response.data[0] : response.data;
                if (response.status && item) {
                    this.form.patchValue(item);
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
        const payload: InventoryFormData = {
            ...formValue,
            purchaseDate: formValue.purchaseDate
                ? new Date(formValue.purchaseDate).toISOString()
                : null
        };
        this.inventoryService.saveInventory(payload).subscribe({
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
