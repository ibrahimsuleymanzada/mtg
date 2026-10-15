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
import { InvoiceListItem } from 'app/core/models/invoice.model';
import { InvoicesService } from 'app/core/services/accounting/invoices.service';
import { InvoiceFormDialogComponent } from './invoice-form-dialog/invoice-form-dialog.component';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { NotificationService } from 'app/core/services/notification.service';
import { BaseTableService } from 'app/core/services/base-table.service';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';

@Component({
    selector: 'invoices',
    standalone: true,
    templateUrl: './invoices.component.html',
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
export class InvoicesComponent implements OnInit {
    @ViewChild(MatPaginator) paginator: MatPaginator;

    columnConfig: { key: string; labelKey: string; filterable: boolean; type?: string }[] = [
        { key: 'invoiceNumber', labelKey: 'modules.invoices.columns.invoiceNumber', filterable: true },
        { key: 'targetIdentifier', labelKey: 'modules.invoices.columns.targetIdentifier', filterable: true },
        { key: 'person', labelKey: 'modules.invoices.columns.person', filterable: true },
        { key: 'categoryName', labelKey: 'modules.invoices.columns.categoryName', filterable: true },
        { key: 'amount', labelKey: 'modules.invoices.columns.amount', filterable: true },
        { key: 'paidAmount', labelKey: 'modules.invoices.columns.paidAmount', filterable: false },
        { key: 'dueDate', labelKey: 'modules.invoices.columns.dueDate', filterable: true },
        { key: 'statusName', labelKey: 'modules.invoices.columns.status', filterable: false },
        { key: 'actions', labelKey: 'common.columns.actions', filterable: false },
    ];

    displayedColumns: string[] = this.columnConfig.map(c => c.key);

    dataSource: MatTableDataSource<InvoiceListItem> = new MatTableDataSource<InvoiceListItem>([]);

    readonly TABLE_CONFIG = TABLE_CONFIG;

    totalCount: number = 0;
    pageSize: number = TABLE_CONFIG.pagination.defaultPageSize;
    pageIndex: number = TABLE_CONFIG.pagination.defaultPageIndex;

    filterForm: FormGroup;
    dateRangeForm: FormGroup;
    requestBody: PaginationRequest;
    loading: boolean = true;

    constructor(
        private invoicesService: InvoicesService,
        private dialog: MatDialog,
        private confirmationService: FuseConfirmationService,
        private notificationService: NotificationService,
        private baseTableService: BaseTableService,
        private _translocoService: TranslocoService
    ) { }

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

        if (this.paginator) {
            this.paginator.pageIndex = 0;
        }

        this.loadInvoices();
    }

    clearInput(controlName: string): void {
        this.filterForm.get(controlName)?.reset();
        this.applyFilters();
    }

    loadInvoices(): void {
        this.loading = true;
        this.invoicesService.getAllInvoices(this.requestBody).subscribe({
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

    trackByFn(index: number, item: InvoiceListItem): number {
        return item.id;
    }

    onPageChange(event: PageEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.requestBody.nextPageNumber = event.pageIndex + 1;
        this.requestBody.visibleItemCount = event.pageSize;
        this.loadInvoices();
    }

    onCreate(): void {
        const dialogRef = this.dialog.open(InvoiceFormDialogComponent, {
            width: '60%',
            maxHeight: '98vh',
            disableClose: true,
            data: {}
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.loadInvoices();
            }
        });
    }

    isEditable(invoice: InvoiceListItem): boolean {
        // Paid (3) və Cancelled (5) statusunda edit olmaz
        return invoice.statusId !== 3 && invoice.statusId !== 5;
    }

    isDeletable(invoice: InvoiceListItem): boolean {
        // Yalnız Pending (1) və Overdue (4) silinə bilər
        return invoice.statusId === 1 || invoice.statusId === 4;
    }

    onEdit(invoice: InvoiceListItem): void {
        if (!this.isEditable(invoice)) return;
        const dialogRef = this.dialog.open(InvoiceFormDialogComponent, {
            width: '60%',
            maxHeight: '98vh',
            disableClose: true,
            data: {
                invoiceId: invoice.id,
            }
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.loadInvoices();
            }
        });
    }

    onDelete(invoice: InvoiceListItem): void {
        const message = this._translocoService.translate(
            'modules.invoices.confirmation.delete.message',
            { invoiceNumber: invoice.invoiceNumber }
        );
        const confirmation = this.confirmationService.open({
            title: 'modules.invoices.confirmation.delete.title',
            message,
            icon: {
                show: true,
                name: 'heroicons_outline:exclamation-triangle',
                color: 'warn'
            },
            actions: {
                confirm: {
                    show: true,
                    label: 'common.actions.delete',
                    color: 'warn'
                },
                cancel: {
                    show: true,
                    label: 'common.actions.cancel'
                }
            },
            dismissible: true
        });

        confirmation.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                this.invoicesService.deleteInvoice(invoice.id).subscribe({
                    next: (response) => {
                        if (response.status) {
                            this.loadInvoices();
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
