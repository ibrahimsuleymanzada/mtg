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
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { NotificationService } from 'app/core/services/notification.service';
import { BaseTableService } from 'app/core/services/base-table.service';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { ApartmentTenantsService } from 'app/core/services/complexes/apartment-tenants.service';
import { TenantListItem } from 'app/core/models/apartment-tenants.model';
import { ApartmentTenantsFormComponent } from './apartment-tenants-form/apartment-tenants-form.component';

@Component({
    selector: 'apartment-tenants',
    standalone: true,
    templateUrl: './apartment-tenants.component.html',
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
export class ApartmentTenantsComponent implements OnInit {
    @ViewChild(MatPaginator) paginator: MatPaginator;

    columnConfig: { key: string; labelKey: string; filterable: boolean; type?: string }[] = [
        { key: 'tenantName', labelKey: 'modules.apartmentTenants.columns.tenantName', filterable: true },
        { key: 'complexName', labelKey: 'common.columns.complexName', filterable: true },
        { key: 'buildingName', labelKey: 'common.columns.buildingName', filterable: true },
        { key: 'apartmentNumber', labelKey: 'modules.apartments.columns.apartmentNumber', filterable: true },
        { key: 'tenantPhone', labelKey: 'modules.apartmentTenants.columns.tenantPhone', filterable: false },
        { key: 'monthlyRent', labelKey: 'modules.apartmentTenants.columns.monthlyRent', filterable: false },
        { key: 'contractStartDate', labelKey: 'modules.apartmentTenants.columns.contractStartDate', filterable: false },
        { key: 'contractEndDate', labelKey: 'modules.apartmentTenants.columns.contractEndDate', filterable: false },
        { key: 'isActive', labelKey: 'common.columns.isActive', filterable: false, type: 'boolean' },
        { key: 'actions', labelKey: 'common.columns.actions', filterable: false },
    ];

    displayedColumns: string[] = this.columnConfig.map(c => c.key);
    dataSource: MatTableDataSource<TenantListItem> = new MatTableDataSource<TenantListItem>([]);
    readonly TABLE_CONFIG = TABLE_CONFIG;
    totalCount = 0;
    pageSize: number = TABLE_CONFIG.pagination.defaultPageSize;
    pageIndex: number = TABLE_CONFIG.pagination.defaultPageIndex;
    filterForm: FormGroup;
    requestBody: PaginationRequest;
    loading = true;

    constructor(
        private tenantsService: ApartmentTenantsService,
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
        this.tenantsService.getAllTenants(this.requestBody).subscribe({
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

    trackByFn(index: number, item: TenantListItem): number {
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
        const dialogRef = this.dialog.open(ApartmentTenantsFormComponent, {
            width: '60%',
            maxHeight: '98vh',
            disableClose: true,
            data: {}
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) this.loadData();
        });
    }

    onEdit(tenant: TenantListItem): void {
        const dialogRef = this.dialog.open(ApartmentTenantsFormComponent, {
            width: '60%',
            maxHeight: '98vh',
            disableClose: true,
            data: { tenantId: tenant.id }
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) this.loadData();
        });
    }

    onDelete(tenant: TenantListItem): void {
        const message = this._translocoService.translate(
            'modules.apartmentTenants.confirmation.delete.message',
            { name: tenant.tenantName }
        );
        const confirmation = this.confirmationService.open({
            title: 'modules.apartmentTenants.confirmation.delete.title',
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
                this.tenantsService.deleteTenant(tenant.id).subscribe({
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
