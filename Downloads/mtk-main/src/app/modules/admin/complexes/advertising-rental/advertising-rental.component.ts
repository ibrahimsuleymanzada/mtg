import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { BaseTableService } from 'app/core/services/base-table.service';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { NotificationService } from 'app/core/services/notification.service';
import { TABLE_CONFIG, PaginationRequest } from 'app/core/models/api-response.model';
import { AdvertisingRentalFormComponent } from './advertising-rental-form/advertising-rental-form.component';
import { AdvertisingRentalListItem, AdvertisingRentalService } from 'app/core/services/complexes/advertising-rental.service';

@Component({
    selector: 'advertising-rental',
    standalone: true,
    templateUrl: './advertising-rental.component.html',
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
export class AdvertisingRentalComponent implements OnInit {
    @ViewChild(MatPaginator) paginator: MatPaginator;

    columnConfig: { key: string; labelKey: string; filterable: boolean; type?: string }[] = [
        { key: 'location',          labelKey: 'modules.advertisingRental.columns.location',          filterable: true                },
        { key: 'companyName',       labelKey: 'modules.advertisingRental.columns.companyName',       filterable: true                },
        { key: 'contactPerson',     labelKey: 'modules.advertisingRental.columns.contactPerson',     filterable: true                },
        { key: 'contactPhone',      labelKey: 'modules.advertisingRental.columns.contactPhone',      filterable: true                },
        { key: 'monthlyFee',        labelKey: 'modules.advertisingRental.columns.monthlyFee',        filterable: true,  type: 'currency' },
        { key: 'contractStartDate', labelKey: 'modules.advertisingRental.columns.contractStartDate', filterable: true,  type: 'date'     },
        { key: 'contractEndDate',   labelKey: 'modules.advertisingRental.columns.contractEndDate',   filterable: true,  type: 'date'     },
        { key: 'actions',           labelKey: 'common.columns.actions',                              filterable: false               },
    ];

    displayedColumns: string[] = this.columnConfig.map(c => c.key);

    dataSource: MatTableDataSource<AdvertisingRentalListItem> = new MatTableDataSource<AdvertisingRentalListItem>([]);

    readonly TABLE_CONFIG = TABLE_CONFIG;

    totalCount: number = 0;
    pageSize: number  = TABLE_CONFIG.pagination.defaultPageSize;
    pageIndex: number = TABLE_CONFIG.pagination.defaultPageIndex;

    filterForm: FormGroup;
    requestBody: PaginationRequest;
    loading: boolean = true;

    constructor(
        private advertisingRentalService: AdvertisingRentalService,
        private dialog: MatDialog,
        private confirmationService: FuseConfirmationService,
        private notificationService: NotificationService,
        private baseTableService: BaseTableService,
        private _translocoService: TranslocoService
    ) { }

    ngOnInit(): void {
        this.requestBody = this.baseTableService.createInitialRequest();
        this.filterForm  = this.baseTableService.createFilterForm(this.displayedColumns);
        this.loadRentals();
    }

    applyFilters(): void {
        this.requestBody.filters = this.baseTableService.formToFilters(this.filterForm.value);
        this.pageIndex = 0;
        this.requestBody.nextPageNumber = 1;
        if (this.paginator) { this.paginator.pageIndex = 0; }
        this.loadRentals();
    }

    clearInput(controlName: string): void {
        this.filterForm.get(controlName).reset();
        this.applyFilters();
    }

    loadRentals(): void {
        this.advertisingRentalService.getAllAdvertisingRentals(this.requestBody).subscribe({
            next: (response) => {
                if (response.status && response.data) {
                    this.dataSource.data = response.data.result;
                    this.totalCount = response.data.count;
                    this.loading = false;
                }
            },
            error: (error) => {
                console.error('Error loading advertising rentals:', error);
                this.notificationService.error('Məlumatlar yüklənərkən xəta baş verdi');
            }
        });
    }

    trackByFn(index: number, item: AdvertisingRentalListItem): number {
        return item.id;
    }

    onPageChange(event: PageEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize  = event.pageSize;
        this.requestBody.nextPageNumber  = event.pageIndex + 1;
        this.requestBody.visibleItemCount = event.pageSize;
        this.loadRentals();
    }

    onCreate(): void {
        const dialogRef = this.dialog.open(AdvertisingRentalFormComponent, {
            width: '60%',
            maxHeight: '98vh',
            disableClose: true,
            data: {}
        });
        dialogRef.afterClosed().subscribe(result => { if (result) { this.loadRentals(); } });
    }

    onEdit(rental: AdvertisingRentalListItem): void {
        const dialogRef = this.dialog.open(AdvertisingRentalFormComponent, {
            width: '60%',
            maxHeight: '98vh',
            disableClose: true,
            data: { id: rental.id }
        });
        dialogRef.afterClosed().subscribe(result => { if (result) { this.loadRentals(); } });
    }

    onDelete(rental: AdvertisingRentalListItem): void {
        const message = this._translocoService.translate(
            'modules.advertisingRental.confirmation.delete.message',
            { company: rental.companyName }
        );

        const confirmation = this.confirmationService.open({
            title: 'modules.advertisingRental.confirmation.delete.title',
            message,
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

        confirmation.afterClosed().subscribe(result => {
            if (result === 'confirmed') {
                this.advertisingRentalService.deleteAdvertisingRental(rental.id).subscribe({
                    next: (response) => {
                        if (response.status) {
                            this.loadRentals();
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