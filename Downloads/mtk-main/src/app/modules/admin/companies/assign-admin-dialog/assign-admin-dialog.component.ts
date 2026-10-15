import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { TranslocoModule } from '@ngneat/transloco';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { NotificationService } from 'app/core/services/notification.service';
import { DropdownService } from 'app/core/services/dropdown.service';
import { CompaniesService } from 'app/core/services/companies/companies.service';

@Component({
    selector: 'assign-admin-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatAutocompleteModule,
        MatChipsModule,
        TranslocoModule
    ],
    templateUrl: './assign-admin-dialog.component.html'
})
export class AssignAdminDialogComponent implements OnInit {
    @ViewChild('userInput') userInput: ElementRef<HTMLInputElement>;

    selectedUsers: { key: number; value: string }[] = [];
    filteredUsers: { key: number; value: string }[] = [];
    userSearchLoading = false;
    loading = true;
    saveAttempted = false;

    private userSearchSubject = new Subject<string>();

    constructor(
        public dialogRef: MatDialogRef<AssignAdminDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { companyId: number; companyName: string },
        private companiesService: CompaniesService,
        private notificationService: NotificationService,
        private dropdownService: DropdownService
    ) {}

    ngOnInit(): void {
        this.setupUserAutocomplete();
        this.loadExistingAdmins();
    }

    private loadExistingAdmins(): void {
        this.companiesService.getCompanyAdmins(this.data.companyId).subscribe({
            next: (response) => {
                if (response.status && response.data) {
                    this.selectedUsers = response.data;
                }
                this.loading = false;
            },
            error: () => { this.loading = false; }
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
        this.userSearchSubject.next((event.target as HTMLInputElement).value);
    }

    onUserSelected(event: MatAutocompleteSelectedEvent): void {
        const selected = event.option.value as { key: number; value: string };
        if (selected && !this.selectedUsers.some(u => u.key === selected.key)) {
            this.selectedUsers.push(selected);
        }
        this.userInput.nativeElement.value = '';
        this.filteredUsers = [];
    }

    removeUser(user: { key: number; value: string }): void {
        this.selectedUsers = this.selectedUsers.filter(u => u.key !== user.key);
    }

    onSave(): void {
        this.saveAttempted = true;
        if (this.selectedUsers.length === 0) return;

        const userIds = this.selectedUsers.map(u => u.key);
        this.companiesService.saveCompanyAdmins(this.data.companyId, userIds).subscribe({
            next: (response) => {
                if (response.status) {
                    this.dialogRef.close(true);
                    this.notificationService.success(response.message || 'Adminlər təyin edildi');
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
