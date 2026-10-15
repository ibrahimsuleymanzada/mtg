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
import { TranslocoModule } from '@ngneat/transloco';
import { ComplaintsService } from 'app/core/services/complaints/complaints.service';
import { ComplaintMessage } from 'app/core/models/complaints/complaint.types';
import { NotificationService } from 'app/core/services/notification.service';
import { UserService } from 'app/core/user/user.service';

@Component({
    selector: 'complaint-messages-dialog',
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
        TranslocoModule,
    ],
    templateUrl: './complaint-messages-dialog.component.html'
})
export class ComplaintMessagesDialogComponent implements OnInit {
    messages: ComplaintMessage[] = [];
    loading = true;
    sending = false;
    currentUserId: number = 0;
    form: FormGroup;
    selectedFiles: File[] = [];

    constructor(
        public dialogRef: MatDialogRef<ComplaintMessagesDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { complaintId: number; complaintNumber: string },
        private fb: FormBuilder,
        private complaintsService: ComplaintsService,
        private notificationService: NotificationService,
        private userService: UserService,
    ) {
        this.form = this.fb.group({
            messageText: ['', Validators.required],
            isInternal: [false],
        });
    }

    ngOnInit(): void {
        this.userService.user$.subscribe(user => {
            this.currentUserId = +user.userId;
        });
        this.loadMessages();
    }

    loadMessages(): void {
        this.loading = true;
        this.complaintsService.getComplaintMessages(this.data.complaintId).subscribe({
            next: (response) => {
                if (response.status && response.data) {
                    this.messages = response.data;
                }
                this.loading = false;
            },
            error: () => {
                this.notificationService.error('Mesajlar yüklənərkən xəta baş verdi');
                this.loading = false;
            }
        });
    }

    onSend(): void {
        if (this.form.invalid) return;
        this.sending = true;
        const { messageText, isInternal } = this.form.value;
        this.complaintsService.saveComplaintMessageMultipart({
            id: 0,
            complaintId: this.data.complaintId,
            userId: this.currentUserId,
            messageText,
            attachmentsUrl: null,
            isInternal,
        }, this.selectedFiles).subscribe({
            next: (response) => {
                if (response.status) {
                    this.form.reset({ messageText: '', isInternal: false });
                    this.selectedFiles = [];
                    this.loadMessages();
                } else {
                    this.notificationService.info(response.message);
                }
                this.sending = false;
            },
            error: () => {
                this.notificationService.error('Mesaj göndərilmədi');
                this.sending = false;
            }
        });
    }

    onFilesSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.selectedFiles = input.files ? Array.from(input.files) : [];
    }

    onClose(): void {
        this.dialogRef.close();
    }
}
