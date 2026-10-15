import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoModule } from '@ngneat/transloco';
import { AuthService } from 'app/core/auth/auth.service';
import { NotificationService } from 'app/core/services/notification.service';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
        return { passwordMismatch: true };
    }
    return null;
}

@Component({
    selector: 'change-password',
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
    templateUrl: './change-password.component.html',
})
export class ChangePasswordComponent {
    form: FormGroup;
    saving = false;
    showOld = false;
    showNew = false;
    showConfirm = false;

    constructor(
        public dialogRef: MatDialogRef<ChangePasswordComponent>,
        private fb: FormBuilder,
        private authService: AuthService,
        private notificationService: NotificationService,
    ) {
        this.form = this.fb.group({
            oldPassword: [null, Validators.required],
            newPassword: [null, [Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{6,}$/)]],
            confirmPassword: [null, Validators.required],
        }, { validators: passwordMatchValidator });
    }

    onSave(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        this.saving = true;
        this.authService.changePassword(this.form.value).subscribe({
            next: (response) => {
                this.saving = false;
                if (response.status) {
                    this.notificationService.success(response.message);
                    this.dialogRef.close(true);
                } else {
                    this.notificationService.error(response.message);
                }
            },
            error: (err) => {
                this.saving = false;
                this.notificationService.error(err?.error?.message || 'Xəta baş verdi');
            }
        });
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }
}
