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
import { ComplaintListItem } from 'app/core/models/complaints/complaint.types';
import { ComplaintsService } from 'app/core/services/complaints/complaints.service';
import { ComplaintFormDialogComponent } from './complaint-form-dialog/complaint-form-dialog.component';
import { ComplaintMessagesDialogComponent } from './complaint-messages-dialog/complaint-messages-dialog.component';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { NotificationService } from 'app/core/services/notification.service';
import { BaseTableService } from 'app/core/services/base-table.service';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';

@Component({
    selector: 'complaints-list',
    standalone: true,
    templateUrl: './complaints.component.html',
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
export class ComplaintsListComponent implements OnInit {
    @ViewChild(MatPaginator) paginator: MatPaginator;

    columnConfig: { key: string; labelKey: string; filterable: boolean }[] = [
        { key: 'complaintNumber', labelKey: 'modules.complaints.columns.complaintNumber', filterable: true },
        { key: 'categoryName', labelKey: 'modules.complaints.columns.categoryName', filterable: true },
        { key: 'person', labelKey: 'modules.complaints.columns.person', filterable: true },
        { key: 'apartmentNumber', labelKey: 'modules.complaints.columns.apartmentNumber', filterable: true },
        { key: 'title', labelKey: 'modules.complaints.columns.title', filterable: true },
        { key: 'priority', labelKey: 'modules.complaints.columns.priority', filterable: true },
        { key: 'status', labelKey: 'modules.complaints.columns.status', filterable: true },
        { key: 'createdDate', labelKey: 'modules.complaints.columns.createdDate', filterable: true },
        { key: 'actions', labelKey: 'common.columns.actions', filterable: false },
    ];

    displayedColumns: string[] = this.columnConfig.map(c => c.key);
    dataSource: MatTableDataSource<ComplaintListItem> = new MatTableDataSource([]);
    readonly TABLE_CONFIG = TABLE_CONFIG;
    totalCount = 0;
    pageSize: number = TABLE_CONFIG.pagination.defaultPageSize;
    pageIndex: number = TABLE_CONFIG.pagination.defaultPageIndex;
    filterForm: FormGroup;
    requestBody: PaginationRequest;
    loading = true;

    constructor(
        private complaintsService: ComplaintsService,
        private dialog: MatDialog,
        private confirmationService: FuseConfirmationService,
        private notificationService: NotificationService,
        private baseTableService: BaseTableService,
        private _translocoService: TranslocoService
    ) {}

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
        this.complaintsService.getAllComplaints(this.requestBody).subscribe({
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

    trackByFn(index: number, item: ComplaintListItem): number {
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
        const dialogRef = this.dialog.open(ComplaintFormDialogComponent, {
            width: '70%',
            maxHeight: '98vh',
            disableClose: true,
            data: {}
        });
        dialogRef.afterClosed().subscribe(result => { if (result) this.loadData(); });
    }

    onEdit(item: ComplaintListItem): void {
        const dialogRef = this.dialog.open(ComplaintFormDialogComponent, {
            width: '70%',
            maxHeight: '98vh',
            disableClose: true,
            data: { complaintId: item.id }
        });
        dialogRef.afterClosed().subscribe(result => { if (result) this.loadData(); });
    }

    onMessages(item: ComplaintListItem): void {
        this.dialog.open(ComplaintMessagesDialogComponent, {
            width: '640px',
            maxHeight: '90vh',
            disableClose: false,
            data: { complaintId: item.id, complaintNumber: item.complaintNumber }
        });
    }

    onDelete(item: ComplaintListItem): void {
        const message = this._translocoService.translate(
            'modules.complaints.confirmation.delete.message',
            { complaintNumber: item.complaintNumber }
        );
        const confirmation = this.confirmationService.open({
            title: 'modules.complaints.confirmation.delete.title',
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
                this.complaintsService.deleteComplaint(item.id).subscribe({
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
}
