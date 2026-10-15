import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoModule } from '@ngneat/transloco';
import { NotificationService } from 'app/core/services/notification.service';
import { SakinlerService } from 'app/core/services/users/sakinler.service';

@Component({
    selector: 'reset-password-dialog',
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
    template: `
        <div class="flex flex-col w-full">
            <div class="flex items-center justify-between px-6 py-4 border-b">
                <h2 class="text-xl font-semibold">
                    {{'modules.sakinler.resetPassword.title' | transloco}}
                </h2>
                <button mat-icon-button (click)="onCancel()">
                    <mat-icon>close</mat-icon>
                </button>
            </div>

            <div *ngIf="loading" class="flex items-center justify-center py-10">
                <mat-spinner diameter="36"></mat-spinner>
            </div>

            <form *ngIf="!loading" [formGroup]="form" class="p-6">
                <p class="text-sm text-secondary mb-4">
                    <strong>{{ data.personName }}</strong> {{'modules.sakinler.resetPassword.subtitle' | transloco}}
                </p>

                <mat-form-field class="w-full">
                    <mat-label>{{'modules.sakinler.resetPassword.newPassword' | transloco}}</mat-label>
                    <input matInput type="password" formControlName="newPassword">
                    <mat-icon matPrefix class="icon-size-5">lock</mat-icon>
                    <mat-error *ngIf="form.get('newPassword')?.hasError('required')">
                        {{'modules.sakinler.resetPassword.errors.required' | transloco}}
                    </mat-error>
                    <mat-error *ngIf="form.get('newPassword')?.hasError('minlength')">
                        {{'modules.sakinler.resetPassword.errors.minLength' | transloco}}
                    </mat-error>
                </mat-form-field>
            </form>

            <div class="flex items-center justify-end px-6 py-4 border-t bg-gray-50 dark:bg-gray-900">
                <button mat-button (click)="onCancel()" [disabled]="loading">
                    {{'common.actions.cancel' | transloco}}
                </button>
                <button class="ml-2" mat-flat-button color="primary" (click)="onSave()"
                    [disabled]="loading || form.invalid">
                    {{'modules.sakinler.resetPassword.save' | transloco}}
                </button>
            </div>
        </div>
    `
})
export class ResetPasswordDialogComponent {
    form: FormGroup;
    loading = false;

    constructor(
        public dialogRef: MatDialogRef<ResetPasswordDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { sakinId: number; userId: number; personName: string },
        private fb: FormBuilder,
        private sakinlerService: SakinlerService,
        private notificationService: NotificationService
    ) {
        this.form = this.fb.group({
            newPassword: [null, [Validators.required, Validators.minLength(6)]]
        });
    }

    onSave(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        this.loading = true;
        this.sakinlerService.resetUserPassword(this.data.userId, this.form.value.newPassword).subscribe({
            next: (response) => {
                this.loading = false;
                if (response.status) {
                    this.dialogRef.close(true);
                    this.notificationService.success(response.message);
                } else {
                    this.notificationService.info(response.message);
                }
            },
            error: () => {
                this.loading = false;
                this.notificationService.error('Şifrə sıfırlanarkən xəta baş verdi');
            }
        });
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }
}
