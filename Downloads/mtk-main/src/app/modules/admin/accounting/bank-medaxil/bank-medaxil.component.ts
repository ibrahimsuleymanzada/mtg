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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PaginationRequest, TABLE_CONFIG } from 'app/core/models/api-response.model';
import { BankMedaxilListItem } from 'app/core/models/accounting/bank-medaxil.types';
import { BankMedaxilService } from 'app/core/services/accounting/bank-medaxil.service';
import { BankMedaxilFormDialogComponent } from './bank-medaxil-form-dialog/bank-medaxil-form-dialog.component';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { NotificationService } from 'app/core/services/notification.service';
import { BaseTableService } from 'app/core/services/base-table.service';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';

@Component({
    selector: 'bank-medaxil',
    standalone: true,
    templateUrl: './bank-medaxil.component.html',
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
        MatDatepickerModule,
        ReactiveFormsModule,
        TranslocoModule,
    ],
    providers: [BaseTableService]
})
export class BankMedaxilComponent implements OnInit {
    @ViewChild(MatPaginator) paginator: MatPaginator;

    columnConfig: { key: string; labelKey: string; filterable: boolean }[] = [
        { key: 'invoiceNumber', labelKey: 'modules.accounting.kassaMedaxil.columns.invoiceNumber', filterable: true },
        { key: 'person', labelKey: 'modules.accounting.kassaMedaxil.columns.person', filterable: true },
        { key: 'amount', labelKey: 'modules.accounting.kassaMedaxil.columns.amount', filterable: false },
        { key: 'paymentMethod', labelKey: 'modules.accounting.kassaMedaxil.columns.paymentMethod', filterable: false },
        { key: 'paymentDate', labelKey: 'modules.accounting.kassaMedaxil.columns.paymentDate', filterable: false },
        { key: 'actions', labelKey: 'common.columns.actions', filterable: false },
    ];

    displayedColumns: string[] = this.columnConfig.map(c => c.key);
    dataSource: MatTableDataSource<BankMedaxilListItem> = new MatTableDataSource([]);
    readonly TABLE_CONFIG = TABLE_CONFIG;
    totalCount = 0;
    pageSize:number = TABLE_CONFIG.pagination.defaultPageSize;
    pageIndex:number = TABLE_CONFIG.pagination.defaultPageIndex;
    filterForm: FormGroup;
    dateRangeForm: FormGroup;
    requestBody: PaginationRequest;
    loading = true;

    constructor(
        private bankMedaxilService: BankMedaxilService,
        private dialog: MatDialog,
        private confirmationService: FuseConfirmationService,
        private notificationService: NotificationService,
        private baseTableService: BaseTableService,
        private _translocoService: TranslocoService
    ) {}

    ngOnInit(): void {
        this.requestBody = this.baseTableService.createInitialRequest();
        this.filterForm = this.baseTableService.createFilterForm(this.displayedColumns);
        this.dateRangeForm = this.baseTableService.createDateRangeForm();
        this.applyFilters();
    }

    applyFilters(): void {
        this.requestBody.filters = this.baseTableService.formToFilters(this.filterForm.value);
        const { beginDate, endDate } = this.dateRangeForm.value;
        this.requestBody = this.baseTableService.addDateRangeToRequest(this.requestBody, beginDate, endDate);
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
        this.bankMedaxilService.getAllBankMedaxil(this.requestBody).subscribe({
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

    trackByFn(index: number, item: BankMedaxilListItem): number {
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
        const dialogRef = this.dialog.open(BankMedaxilFormDialogComponent, {
            width: '60%',
            maxHeight: '98vh',
            disableClose: true,
            data: {}
        });
        dialogRef.afterClosed().subscribe(result => { if (result) this.loadData(); });
    }

    onEdit(item: BankMedaxilListItem): void {
        const dialogRef = this.dialog.open(BankMedaxilFormDialogComponent, {
            width: '60%',
            maxHeight: '98vh',
            disableClose: true,
            data: { bankMedaxilId: item.id }
        });
        dialogRef.afterClosed().subscribe(result => { if (result) this.loadData(); });
    }

    onDelete(item: BankMedaxilListItem): void {
        const message = this._translocoService.translate(
            'modules.accounting.bankMedaxil.confirmation.delete.message',
            { invoiceNumber: item.invoiceNumber }
        );
        const confirmation = this.confirmationService.open({
            title: 'modules.accounting.bankMedaxil.confirmation.delete.title',
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
                this.bankMedaxilService.deleteBankMedaxil(item.id).subscribe({
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
