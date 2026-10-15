import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';

import { BaseTableService } from 'app/core/services/base-table.service';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { NotificationService } from 'app/core/services/notification.service';
import { TABLE_CONFIG, PaginationRequest } from 'app/core/models/api-response.model';
import { CommercialRentalListItem } from 'app/core/models/rental.model';
import { CommercialRentalsService } from 'app/core/services/complexes/commercial-rental.service';
import { CommercialRentalFormComponent } from './commercial-rentals-form/commercial-rental-form.component';
import { environment } from 'environments/environment.prod';

@Component({
    selector: 'commercial-rentals',
    standalone: true,
    templateUrl: './commercial-rentals.component.html',
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
export class CommercialRentalsComponent implements OnInit {
    @ViewChild(MatPaginator) paginator: MatPaginator;

    columnConfig: { key: string; labelKey: string; filterable: boolean; type?: string }[] = [
        { key: 'complexName',       labelKey: 'common.columns.complexName',                                 filterable: true },
        { key: 'buildingName',      labelKey: 'common.columns.buildingName',                                filterable: true },
        { key: 'tenantContactName', labelKey: 'modules.commercialRentals.columns.tenantContactName',        filterable: true },
        { key: 'tenantCompanyName', labelKey: 'modules.commercialRentals.columns.tenantCompanyName',        filterable: true },
        { key: 'tenantPhone',       labelKey: 'modules.commercialRentals.columns.tenantPhone',              filterable: true },
        { key: 'tenantEmail',       labelKey: 'modules.commercialRentals.columns.tenantEmail',              filterable: true },
        { key: 'businessType',      labelKey: 'modules.commercialRentals.columns.businessType',             filterable: true },
        { key: 'monthlyRent',       labelKey: 'modules.commercialRentals.columns.monthlyRent',              filterable: true, type: 'currency' },
        { key: 'securityDeposit',   labelKey: 'modules.commercialRentals.columns.securityDeposit',          filterable: true, type: 'currency' },
        { key: 'paymentDay',        labelKey: 'modules.commercialRentals.columns.paymentDay',               filterable: false },
        { key: 'contractStartDate', labelKey: 'modules.commercialRentals.columns.contractStartDate',        filterable: false, type: 'date' },
        { key: 'contractEndDate',   labelKey: 'modules.commercialRentals.columns.contractEndDate',          filterable: false, type: 'date' },
        { key: 'actions',           labelKey: 'common.columns.actions',                                     filterable: false },
    ];

    displayedColumns: string[] = this.columnConfig.map(c => c.key);

    dataSource: MatTableDataSource<CommercialRentalListItem> = new MatTableDataSource<CommercialRentalListItem>([]);

    readonly TABLE_CONFIG = TABLE_CONFIG;

    totalCount: number = 0;
    pageSize: number = TABLE_CONFIG.pagination.defaultPageSize;
    pageIndex: number = TABLE_CONFIG.pagination.defaultPageIndex;

    filterForm: FormGroup;
    requestBody: PaginationRequest;
    loading: boolean = true;


        apiFileurl: string = environment.fileUrl
    

    constructor(
        private commercialRentalsService: CommercialRentalsService,
        private dialog: MatDialog,
        private confirmationService: FuseConfirmationService,
        private notificationService: NotificationService,
        private baseTableService: BaseTableService,
        private _translocoService: TranslocoService
    ) { }

    ngOnInit(): void {
        this.requestBody = this.baseTableService.createInitialRequest();
        this.filterForm = this.baseTableService.createFilterForm(this.displayedColumns);
        this.loadCommercialRentals();
    }

    applyFilters(): void {
        this.requestBody.filters = this.baseTableService.formToFilters(this.filterForm.value);
        this.pageIndex = 0;
        this.requestBody.nextPageNumber = 1;
        if (this.paginator) {
            this.paginator.pageIndex = 0;
        }
        this.loadCommercialRentals();
    }

    clearInput(controlName: string): void {
        this.filterForm.get(controlName).reset();
        this.applyFilters();
    }

    loadCommercialRentals(): void {
        this.commercialRentalsService.getAllCommercialRentals(this.requestBody).subscribe({
            next: (response) => {
                if (response.status && response.data) {
                    this.dataSource.data = response.data.result;
                    this.totalCount = response.data.count;
                    this.loading = false;
                }
            },
            error: (error) => {
                console.error('Error loading commercial rentals:', error);
                this.notificationService.error('Məlumatlar yüklənərkən xəta baş verdi');
            }
        });
    }

    trackByFn(index: number, item: CommercialRentalListItem): number {
        return item.id;
    }

    onPageChange(event: PageEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.requestBody.nextPageNumber = event.pageIndex + 1;
        this.requestBody.visibleItemCount = event.pageSize;
        this.loadCommercialRentals();
    }

    onCreate(): void {
        const dialogRef = this.dialog.open(CommercialRentalFormComponent, {
            width: '60%',
            maxHeight: '98vh',
            disableClose: true,
            data: {}
        });
        dialogRef.afterClosed().subscribe((result) => {
            if (result) { this.loadCommercialRentals(); }
        });
    }

    onEdit(rental: CommercialRentalListItem): void {
        const dialogRef = this.dialog.open(CommercialRentalFormComponent, {
            width: '60%',
            maxHeight: '98vh',
            disableClose: true,
            data: { commercialRentalId: rental.id }
        });
        dialogRef.afterClosed().subscribe((result) => {
            if (result) { this.loadCommercialRentals(); }
        });
    }

    onDelete(rental: CommercialRentalListItem): void {
        const message = this._translocoService.translate(
            'modules.commercialRentals.confirmation.delete.message',
            { tenant: rental.tenantContactName }
        );

        const confirmation = this.confirmationService.open({
            title: 'modules.commercialRentals.confirmation.delete.title',
            message: message,
            icon: {
                show: true,
                name: 'heroicons_outline:exclamation-triangle',
                color: 'warn'
            },
            actions: {
                confirm: { show: true, label: 'common.actions.delete', color: 'warn' },
                cancel:  { show: true, label: 'common.actions.cancel' }
            },
            dismissible: true
        });

        confirmation.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                this.commercialRentalsService.deleteCommercialRental(rental.id).subscribe({
                    next: (response) => {
                        if (response.status) {
                            this.loadCommercialRentals();
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