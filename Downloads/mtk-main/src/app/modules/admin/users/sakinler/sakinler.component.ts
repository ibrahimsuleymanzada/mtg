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
import { SakinListItem } from 'app/core/models/users/sakin.types';
import { SakinlerService } from 'app/core/services/users/sakinler.service';
import { ResetPasswordDialogComponent } from './reset-password-dialog/reset-password-dialog.component';
import { NotificationService } from 'app/core/services/notification.service';
import { BaseTableService } from 'app/core/services/base-table.service';
import { TranslocoModule } from '@ngneat/transloco';

@Component({
    selector: 'sakinler',
    standalone: true,
    templateUrl: './sakinler.component.html',
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
export class SakinlerComponent implements OnInit {
    @ViewChild(MatPaginator) paginator: MatPaginator;

    columnConfig: { key: string; labelKey: string; filterable: boolean; type?: string }[] = [
        { key: 'fullName', labelKey: 'modules.sakinler.columns.person', filterable: true },
        { key: 'complexName', labelKey: 'common.columns.complexName', filterable: true },
        { key: 'buildingName', labelKey: 'common.columns.buildingName', filterable: true },
        { key: 'apartmentNumber', labelKey: 'modules.sakinler.columns.apartmentNumber', filterable: true },
        { key: 'isMainOwner', labelKey: 'modules.sakinler.columns.isMainOwner', filterable: false, type: 'boolean' },
        { key: 'actions', labelKey: 'common.columns.actions', filterable: false },
    ];

    displayedColumns: string[] = this.columnConfig.map(c => c.key);
    dataSource: MatTableDataSource<SakinListItem> = new MatTableDataSource([]);
    readonly TABLE_CONFIG = TABLE_CONFIG;
    totalCount = 0;
    pageSize: number = TABLE_CONFIG.pagination.defaultPageSize;
    pageIndex: number = TABLE_CONFIG.pagination.defaultPageIndex;
    filterForm: FormGroup;
    requestBody: PaginationRequest;
    loading = true;

    constructor(
        private sakinlerService: SakinlerService,
        private dialog: MatDialog,
        private notificationService: NotificationService,
        private baseTableService: BaseTableService,
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
        this.sakinlerService.getAllSakinler(this.requestBody).subscribe({
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

    trackByFn(index: number, item: SakinListItem): number {
        return item.id;
    }

    onPageChange(event: PageEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.requestBody.nextPageNumber = event.pageIndex + 1;
        this.requestBody.visibleItemCount = event.pageSize;
        this.loadData();
    }

    onResetPassword(item: SakinListItem): void {
        if (item.userId) {
            this.openResetDialog(item.userId, item.fullName);
        } else {
            // userId siyahıda yoxdursa GetSakinById ilə alırıq
            this.sakinlerService.getSakinById(item.id).subscribe({
                next: (response) => {
                    if (response.status && response.data) {
                        this.openResetDialog(response.data.userId, item.fullName);
                    }
                },
                error: () => this.notificationService.error('Sakin məlumatları alınarkən xəta baş verdi')
            });
        }
    }

    private openResetDialog(userId: number, personName: string): void {
        this.dialog.open(ResetPasswordDialogComponent, {
            width: '400px',
            disableClose: true,
            data: { userId, personName }
        });
    }
}
