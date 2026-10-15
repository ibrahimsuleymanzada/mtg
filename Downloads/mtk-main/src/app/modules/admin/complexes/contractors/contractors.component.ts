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
import { ContractorListItem } from 'app/core/models/contractors/contractor.types';
import { ContractorsService } from 'app/core/services/contractors/contractors.service';
import { ContractorFormDialogComponent } from './contractor-form-dialog/contractor-form-dialog.component';

@Component({
    selector: 'contractors',
    standalone: true,
    templateUrl: './contractors.component.html',
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
export class ContractorsComponent implements OnInit {
    @ViewChild(MatPaginator) paginator: MatPaginator;

    columnConfig: { key: string; labelKey: string; filterable: boolean }[] = [
        { key: 'companyName',   labelKey: 'modules.contractors.columns.companyName',   filterable: true },
        { key: 'serviceType',   labelKey: 'modules.contractors.columns.serviceType',   filterable: true },
        { key: 'contactPerson', labelKey: 'modules.contractors.columns.contactPerson', filterable: true },
        { key: 'phone',         labelKey: 'modules.contractors.columns.phone',         filterable: true },
        { key: 'email',         labelKey: 'modules.contractors.columns.email',         filterable: true },
        { key: 'actions',       labelKey: 'common.columns.actions',                    filterable: false },
    ];

    displayedColumns: string[] = this.columnConfig.map(c => c.key);
    dataSource: MatTableDataSource<ContractorListItem> = new MatTableDataSource([]);
    readonly TABLE_CONFIG = TABLE_CONFIG;
    totalCount = 0;
    pageSize: number = TABLE_CONFIG.pagination.defaultPageSize;
    pageIndex: number = TABLE_CONFIG.pagination.defaultPageIndex;
    filterForm: FormGroup;
    requestBody: PaginationRequest;
    loading = true;

    constructor(
        private contractorsService: ContractorsService,
        private dialog: MatDialog,
        private confirmationService: FuseConfirmationService,
        private notificationService: NotificationService,
        private baseTableService: BaseTableService,
        private _translocoService: TranslocoService
    ) {}

    ngOnInit(): void {
        this.requestBody = this.baseTableService.createInitialRequest();
        this.filterForm = this.baseTableService.createFilterForm(this.displayedColumns);
        this.loadContractors();
    }

    loadContractors(): void {
        this.loading = true;
        this.contractorsService.getAllContractors(this.requestBody).subscribe({
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
        this.loadContractors();
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
        this.loadContractors();
    }

    trackByFn(index: number, item: ContractorListItem): number {
        return item.id;
    }

    onCreate(): void {
        const dialogRef = this.dialog.open(ContractorFormDialogComponent, {
            width: '55%',
            maxHeight: '98vh',
            disableClose: true,
            data: {}
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) this.loadContractors();
        });
    }

    onEdit(item: ContractorListItem): void {
        const dialogRef = this.dialog.open(ContractorFormDialogComponent, {
            width: '55%',
            maxHeight: '98vh',
            disableClose: true,
            data: { contractorId: item.id }
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) this.loadContractors();
        });
    }

    onDelete(item: ContractorListItem): void {
        const message = this._translocoService.translate(
            'modules.contractors.confirmation.delete.message',
            { name: item.companyName }
        );
        const confirmation = this.confirmationService.open({
            title: 'modules.contractors.confirmation.delete.title',
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
                this.contractorsService.deleteContractor(item.id).subscribe({
                    next: (response) => {
                        if (response.status) {
                            this.loadContractors();
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
