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
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { NotificationService } from 'app/core/services/notification.service';
import { BaseTableService } from 'app/core/services/base-table.service';
import { PaginationRequest, TABLE_CONFIG } from 'app/core/models/api-response.model';
import { CompanyListItem } from 'app/core/models/companies/company.types';
import { CompaniesService } from 'app/core/services/companies/companies.service';
import { CompanyFormDialogComponent } from './company-form-dialog/company-form-dialog.component';
import { AssignAdminDialogComponent } from './assign-admin-dialog/assign-admin-dialog.component';

@Component({
    selector: 'companies',
    standalone: true,
    templateUrl: './companies.component.html',
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
        TranslocoModule
    ],
    providers: [BaseTableService]
})
export class CompaniesComponent implements OnInit {
    @ViewChild(MatPaginator) paginator: MatPaginator;

    columnConfig: { key: string; labelKey: string; filterable: boolean }[] = [
        { key: 'companyName',  labelKey: 'modules.companies.columns.companyName',  filterable: true },
        { key: 'taxNumber',    labelKey: 'modules.companies.columns.taxNumber',    filterable: true },
        { key: 'directorName', labelKey: 'modules.companies.columns.directorName', filterable: true },
        { key: 'contactPhone', labelKey: 'modules.companies.columns.contactPhone', filterable: true },
        { key: 'actions',      labelKey: 'common.columns.actions',                 filterable: false },
    ];

    displayedColumns: string[] = this.columnConfig.map(c => c.key);
    dataSource: MatTableDataSource<CompanyListItem> = new MatTableDataSource([]);
    readonly TABLE_CONFIG = TABLE_CONFIG;
    totalCount = 0;
    pageSize: number = TABLE_CONFIG.pagination.defaultPageSize;
    pageIndex: number = TABLE_CONFIG.pagination.defaultPageIndex;
    filterForm: FormGroup;
    requestBody: PaginationRequest;
    loading = true;

    constructor(
        private companiesService: CompaniesService,
        private dialog: MatDialog,
        private confirmationService: FuseConfirmationService,
        private notificationService: NotificationService,
        private baseTableService: BaseTableService,
        private _translocoService: TranslocoService
    ) {}

    ngOnInit(): void {
        this.requestBody = this.baseTableService.createInitialRequest();
        this.filterForm = this.baseTableService.createFilterForm(this.displayedColumns);
        this.loadCompanies();
    }

    loadCompanies(): void {
        this.loading = true;
        this.companiesService.getAllCompanies(this.requestBody).subscribe({
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

    applyFilters(): void {
        this.requestBody.filters = this.baseTableService.formToFilters(this.filterForm.value);
        this.pageIndex = 0;
        this.requestBody.nextPageNumber = 1;
        if (this.paginator) this.paginator.pageIndex = 0;
        this.loadCompanies();
    }

    clearInput(controlName: string): void {
        this.filterForm.get(controlName)?.reset();
        this.applyFilters();
    }

    onPageChange(event: PageEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.requestBody.nextPageNumber = event.pageIndex + 1;
        this.requestBody.visibleItemCount = event.pageSize;
        this.loadCompanies();
    }

    trackByFn(index: number, item: CompanyListItem): number {
        return item.id;
    }

    onCreate(): void {
        const dialogRef = this.dialog.open(CompanyFormDialogComponent, {
            width: '55%',
            maxHeight: '98vh',
            disableClose: true,
            data: {}
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) this.loadCompanies();
        });
    }

    onEdit(item: CompanyListItem): void {
        const dialogRef = this.dialog.open(CompanyFormDialogComponent, {
            width: '55%',
            maxHeight: '98vh',
            disableClose: true,
            data: { companyId: item.id }
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) this.loadCompanies();
        });
    }

    onAssignAdmin(item: CompanyListItem): void {
        this.dialog.open(AssignAdminDialogComponent, {
            width: '40%',
            maxHeight: '98vh',
            disableClose: true,
            data: { companyId: item.id, companyName: item.companyName }
        });
    }

    onDelete(item: CompanyListItem): void {
        const message = this._translocoService.translate(
            'modules.companies.confirmation.delete.message',
            { name: item.companyName }
        );
        const confirmation = this.confirmationService.open({
            title: 'modules.companies.confirmation.delete.title',
            message,
            icon: { show: true, name: 'heroicons_outline:exclamation-triangle', color: 'warn' },
            actions: {
                confirm: { show: true, label: 'common.actions.delete', color: 'warn' },
                cancel:  { show: true, label: 'common.actions.cancel' }
            },
            dismissible: true
        });
        confirmation.afterClosed().subscribe(result => {
            if (result === 'confirmed') {
                this.companiesService.deleteCompany(item.id).subscribe({
                    next: (response) => {
                        if (response.status) {
                            this.loadCompanies();
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
