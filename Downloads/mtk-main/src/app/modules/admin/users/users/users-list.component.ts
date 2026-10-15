import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PaginationRequest, TABLE_CONFIG } from 'app/core/models/api-response.model';
import { UserListItem } from 'app/core/models/users/user.types';
import { UsersService } from 'app/core/services/users/users.service';
import { UserFormDialogComponent } from './user-form-dialog/user-form-dialog.component';
import { AssignRolesDialogComponent } from './assign-roles-dialog/assign-roles-dialog.component';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { NotificationService } from 'app/core/services/notification.service';
import { BaseTableService } from 'app/core/services/base-table.service';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { ResetPasswordDialogComponent } from '../sakinler/reset-password-dialog/reset-password-dialog.component';

@Component({
    selector: 'users-list',
    standalone: true,
    templateUrl: './users-list.component.html',
    imports: [
        CommonModule,
        MatTableModule,
        MatPaginatorModule,
        MatButtonModule,
        MatIconModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        ReactiveFormsModule,
        TranslocoModule,
    ],
    providers: [BaseTableService]
})
export class UsersListComponent implements OnInit {
    @ViewChild(MatPaginator) paginator: MatPaginator;

    columnConfig: { key: string; labelKey: string; filterable: boolean; type?: string }[] = [
        { key: 'username', labelKey: 'modules.users.columns.username', filterable: true },
        { key: 'fullName', labelKey: 'modules.users.columns.firstName', filterable: true },
        { key: 'email', labelKey: 'modules.users.columns.email', filterable: true },
        { key: 'mobilePhone', labelKey: 'modules.users.columns.mobilePhone', filterable: true },
        { key: 'isActive', labelKey: 'modules.users.columns.isActive', filterable: false, type: 'boolean' },
        { key: 'actions', labelKey: 'common.columns.actions', filterable: false },
    ];

    displayedColumns: string[] = this.columnConfig.map(c => c.key);
    dataSource: MatTableDataSource<UserListItem> = new MatTableDataSource([]);
    readonly TABLE_CONFIG = TABLE_CONFIG;
    totalCount = 0;
    pageSize: number = TABLE_CONFIG.pagination.defaultPageSize;
    pageIndex: number = TABLE_CONFIG.pagination.defaultPageIndex;
    filterForm: FormGroup;
    requestBody: PaginationRequest;
    loading = true;

    constructor(
        private usersService: UsersService,
        private dialog: MatDialog,
        private confirmationService: FuseConfirmationService,
        private notificationService: NotificationService,
        private baseTableService: BaseTableService,
        private _translocoService: TranslocoService
    ) { }

    ngOnInit(): void {
        this.requestBody = this.baseTableService.createInitialRequest();
        this.filterForm = this.baseTableService.createFilterForm(this.displayedColumns);
        this.loadData();
    }

    applyFilters(): void {
        this.requestBody.filters = this.baseTableService.formToFilters(this.filterForm.value);
        this.pageIndex = 0;
        this.requestBody.nextPageNumber = 1;
        if (this.paginator) this.paginator.pageIndex = 0;
        this.loadData();
    }

    clearInput(controlName: string): void {
        this.filterForm.get(controlName)?.reset();
        this.applyFilters();
    }

    loadData(): void {
        this.loading = true;
        this.usersService.getAllUsers(this.requestBody).subscribe({
            next: (response) => {
                if (response.status && response.data) {
                    this.dataSource.data = response.data.result;
                    this.totalCount = response.data.count;
                }
                this.loading = false;
            },
            error: () => {
                this.notificationService.error('Məlumatlar yüklənərkən xəta baş verdi');
                this.loading = false;
            }
        });
    }

    trackByFn(index: number, item: UserListItem): number {
        return item.id;
    }

    onPageChange(event: PageEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.requestBody.nextPageNumber = event.pageIndex + 1;
        this.requestBody.visibleItemCount = event.pageSize;
        this.loadData();
    }

    onCreate(): void {
        const dialogRef = this.dialog.open(UserFormDialogComponent, {
            width: '60%',
            maxHeight: '98vh',
            disableClose: true,
            data: {}
        });
        dialogRef.afterClosed().subscribe(result => { if (result) this.loadData(); });
    }

    onEdit(item: UserListItem): void {
        const dialogRef = this.dialog.open(UserFormDialogComponent, {
            width: '60%',
            maxHeight: '98vh',
            disableClose: true,
            data: { userId: item.id }
        });
        dialogRef.afterClosed().subscribe(result => { if (result) this.loadData(); });
    }

    onAssignRoles(item: UserListItem): void {
        this.dialog.open(AssignRolesDialogComponent, {
            width: '420px',
            disableClose: true,
            data: { userId: item.id, username: item.username }
        });
    }

    onDelete(item: UserListItem): void {
        const message = this._translocoService.translate(
            'modules.users.confirmation.delete.message',
            { username: item.username }
        );
        const confirmation = this.confirmationService.open({
            title: 'modules.users.confirmation.delete.title',
            message,
            icon: { show: true, name: 'heroicons_outline:exclamation-triangle', color: 'warn' },
            actions: {
                confirm: { show: true, label: 'common.actions.delete', color: 'warn' },
                cancel: { show: true, label: 'common.actions.cancel' }
            },
            dismissible: true
        });
        confirmation.afterClosed().subscribe(result => {
            if (result === 'confirmed') {
                this.usersService.deleteUser(item.id).subscribe({
                    next: (response) => {
                        if (response.status) {
                            this.loadData();
                            this.notificationService.success(response.message);
                        } else {
                            this.notificationService.info(response.message);
                        }
                    }
                });
            }
        });
    }

    private openResetDialog(userId: number, personName: string): void {
        this.dialog.open(ResetPasswordDialogComponent, {
            width: '400px',
            disableClose: true,
            data: { userId, personName }
        });
    }
}
