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
import { RolesService } from 'app/core/services/users/roles.service';
import { RoleFormData } from 'app/core/models/users/role.types';
import { TranslocoModule } from '@ngneat/transloco';

@Component({
    selector: 'role-form-dialog',
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
        TranslocoModule,
    ],
    templateUrl: './role-form-dialog.component.html'
})
export class RoleFormDialogComponent implements OnInit {
    form: FormGroup;
    isEdit = false;
    loading = false;
    dropdownsLoading = false;

    constructor(
        public dialogRef: MatDialogRef<RoleFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { roleId?: number },
        private fb: FormBuilder,
        private rolesService: RolesService,
        private notificationService: NotificationService,
    ) {
        this.isEdit = !!data?.roleId;
        this.initForm();
    }

    ngOnInit(): void {
        if (this.isEdit && this.data.roleId) {
            this.loadRecord(this.data.roleId);
        }
    }

    private initForm(): void {
        this.form = this.fb.group({
            id: [0],
            roleName: ['', Validators.required],
            description: ['', Validators.required],
        });
    }

    private loadRecord(id: number): void {
        this.dropdownsLoading = true;
        this.rolesService.getRoleById(id).subscribe({
            next: (response) => {
                if (response.status && response.data) {
                    this.form.patchValue(response.data);
                } else {
                    this.notificationService.info(response.message || 'Məlumat tapılmadı');
                }
                this.dropdownsLoading = false;
            },
            error: () => {
                this.notificationService.error('Rol yüklənərkən xəta baş verdi');
                this.dropdownsLoading = false;
            }
        });
    }

    onSave(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        this.loading = true;
        const payload: RoleFormData = this.form.value;
        this.rolesService.saveRole(payload).subscribe({
            next: (response) => {
                if (response.status) {
                    this.dialogRef.close(true);
                    this.notificationService.success(response.message);
                } else {
                    this.notificationService.info(response.message);
                }
                this.loading = false;
            },
            error: () => {
                this.notificationService.error('Yadda saxlanarkən xəta baş verdi');
                this.loading = false;
            }
        });
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }
}
