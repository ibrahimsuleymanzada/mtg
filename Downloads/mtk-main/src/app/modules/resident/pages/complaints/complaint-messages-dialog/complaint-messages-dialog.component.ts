import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
import { TranslocoModule } from '@ngneat/transloco';
import { ResidentService } from 'app/core/services/resident/resident.service';
import { NotificationService } from 'app/core/services/notification.service';
import { ResidentComplaintMessage } from 'app/core/models/resident/resident.types';

@Component({
    selector        : 'resident-complaint-messages-dialog',
    templateUrl     : './complaint-messages-dialog.component.html',
    standalone      : true,
    changeDetection : ChangeDetectionStrategy.OnPush,
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
})
export class ResidentComplaintMessagesDialogComponent implements OnInit, OnDestroy {
    messages: ResidentComplaintMessage[] = [];
    loading = true;
    sending = false;
    form: FormGroup;
    selectedFiles: File[] = [];

    @ViewChild('messagesContainer') messagesContainer: ElementRef;

    private _unsubscribeAll = new Subject<void>();

    constructor(
        public  dialogRef:           MatDialogRef<ResidentComplaintMessagesDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { complaintId: number; complaintNumber: string },
        private _fb:                 FormBuilder,
        private _residentService:    ResidentService,
        private _notificationService: NotificationService,
        private _cdr:                ChangeDetectorRef,
    ) {
        this.form = this._fb.group({
            messageText: ['', Validators.required],
        });
    }

    ngOnInit(): void {
        this._loadMessages();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    // ── Private ─────────────────────────────────────────────────────────

    private _loadMessages(): void {
        this.loading = true;
        this._cdr.markForCheck();
        this._residentService.getMyComplaintMessages(this.data.complaintId)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (res) => {
                    this.messages = res.data ?? [];
                    this.loading = false;
                    this._cdr.markForCheck();
                    this._scrollToBottom();
                },
                error: () => {
                    this.loading = false;
                    this._cdr.markForCheck();
                },
            });
    }

    private _scrollToBottom(): void {
        setTimeout(() => {
            if (this.messagesContainer?.nativeElement) {
                this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
            }
        }, 100);
    }

    // ── Public ──────────────────────────────────────────────────────────

    sendMessage(): void {
        if (this.form.invalid) return;
        this.sending = true;
        this._cdr.markForCheck();

        this._residentService.saveMyComplaintMessageMultipart({
            id:             0,
            complaintId:    this.data.complaintId,
            messageText:    this.form.value.messageText,
            attachmentsUrl: null,
        }, this.selectedFiles).pipe(takeUntil(this._unsubscribeAll))
          .subscribe({
            next: (res) => {
                if (res.status) {
                    this.form.reset();
                    this.selectedFiles = [];
                    this._loadMessages();
                } else {
                    this._notificationService.info(res.message);
                }
                this.sending = false;
                this._cdr.markForCheck();
            },
            error: () => {
                this.sending = false;
                this._cdr.markForCheck();
            },
        });
    }

    getInitials(name: string): string {
        if (!name) return '?';
        return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    }

    onFilesSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.selectedFiles = input.files ? Array.from(input.files) : [];
        this._cdr.markForCheck();
    }

    onClose(): void {
        this.dialogRef.close();
    }
}
