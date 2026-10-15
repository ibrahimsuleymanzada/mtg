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
import { ContractorContractListItem } from 'app/core/models/contractors/contractor.types';
import { ContractorsService } from 'app/core/services/contractors/contractors.service';
import { ContractorContractFormDialogComponent } from './contractor-contract-form-dialog/contractor-contract-form-dialog.component';

@Component({
    selector: 'contractor-contracts',
    standalone: true,
    templateUrl: './contractor-contracts.component.html',
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
export class ContractorContractsComponent implements OnInit {
    @ViewChild(MatPaginator) paginator: MatPaginator;

    columnConfig: { key: string; labelKey: string; filterable: boolean }[] = [
        { key: 'companyName',       labelKey: 'modules.contractorContracts.columns.companyName',       filterable: true },
        { key: 'serviceType',       labelKey: 'modules.contractorContracts.columns.serviceType',       filterable: true },
        { key: 'contractStartDate', labelKey: 'modules.contractorContracts.columns.contractStartDate', filterable: true },
        { key: 'contractEndDate',   labelKey: 'modules.contractorContracts.columns.contractEndDate',   filterable: true },
        { key: 'monthlyFee',        labelKey: 'modules.contractorContracts.columns.monthlyFee',        filterable: true },
        { key: 'actions',           labelKey: 'common.columns.actions',                                filterable: false },
    ];

    displayedColumns: string[] = this.columnConfig.map(c => c.key);
    dataSource: MatTableDataSource<ContractorContractListItem> = new MatTableDataSource([]);
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
        this.loadContracts();
    }

    loadContracts(): void {
        this.loading = true;
        this.contractorsService.getAllContracts(this.requestBody).subscribe({
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
        this.loadContracts();
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
        this.loadContracts();
    }

    trackByFn(index: number, item: ContractorContractListItem): number {
        return item.id;
    }

    onCreate(): void {
        const dialogRef = this.dialog.open(ContractorContractFormDialogComponent, {
            width: '55%',
            maxHeight: '98vh',
            disableClose: true,
            data: {}
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) this.loadContracts();
        });
    }

    onEdit(item: ContractorContractListItem): void {
        const dialogRef = this.dialog.open(ContractorContractFormDialogComponent, {
            width: '55%',
            maxHeight: '98vh',
            disableClose: true,
            data: { contractId: item.id, contractorName: item.companyName }
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) this.loadContracts();
        });
    }

    onDelete(item: ContractorContractListItem): void {
        const message = this._translocoService.translate(
            'modules.contractorContracts.confirmation.delete.message',
            { name: item.companyName }
        );
        const confirmation = this.confirmationService.open({
            title: 'modules.contractorContracts.confirmation.delete.title',
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
                this.contractorsService.deleteContract(item.id).subscribe({
                    next: (response) => {
                        if (response.status) {
                            this.loadContracts();
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
