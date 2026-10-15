import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { NotificationService } from 'app/core/services/notification.service';
import { UsersService } from 'app/core/services/users/users.service';
import { UserFormData } from 'app/core/models/users/user.types';
import { TranslocoModule } from '@ngneat/transloco';
import { NgxMaskDirective } from 'ngx-mask';

const STRONG_PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

@Component({
    selector: 'user-form-dialog',
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
        MatCheckboxModule,
        MatDatepickerModule,
        TranslocoModule,
        NgxMaskDirective,
    ],
    templateUrl: './user-form-dialog.component.html'
})
export class UserFormDialogComponent implements OnInit {
    form: FormGroup;
    isEdit = false;
    dropdownsLoading = true;
    passwordVisible = false;

    constructor(
        public dialogRef: MatDialogRef<UserFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { userId?: number },
        private fb: FormBuilder,
        private usersService: UsersService,
        private notificationService: NotificationService,
    ) {
        this.isEdit = !!data?.userId;
        this.initForm();
    }

    ngOnInit(): void {
        if (this.isEdit && this.data.userId) {
            this.loadRecord(this.data.userId);
        } else {
            this.dropdownsLoading = false;
        }
    }

    private initForm(): void {
        const passwordValidators = this.isEdit
            ? []
            : [Validators.required, Validators.pattern(STRONG_PASSWORD_PATTERN)];

        this.form = this.fb.group({
            id: [0],
            username: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            password: ['', passwordValidators],
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            fatherName: [''],
            phone: [''],
            mobilePhone: ['', Validators.required],
            idcardNumber: ['', Validators.pattern(/^[A-Z0-9]{7}$/)],
            dateOfBirth: [null],
            profilePhotoUrl: [null],
            emergencyContact: [''],
            emergencyPhone: [''],
            isActive: [true],
        });
    }

    private loadRecord(id: number): void {
        this.usersService.getUserById(id).subscribe({
            next: (response) => {
                if (response.status && response.data) {
                    this.form.patchValue(response.data.user);
                } else {
                    this.notificationService.info(response.message || 'Məlumat tapılmadı');
                }
                this.dropdownsLoading = false;
            },
            error: () => {
                this.notificationService.error('İstifadəçi yüklənərkən xəta baş verdi');
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
        const payload: UserFormData = { ...formValue };
        if (this.isEdit) {
            delete payload.password;
        }
        this.usersService.saveUser(payload).subscribe({
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

    onFINInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        const value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        this.form.get('idcardNumber')?.setValue(value, { emitEvent: false });
        input.value = value;
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }
}
