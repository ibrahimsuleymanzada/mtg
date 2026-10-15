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
import { PaginationRequest, TABLE_CONFIG } from 'app/core/models/api-response.model';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { NotificationService } from 'app/core/services/notification.service';
import { BaseTableService } from 'app/core/services/base-table.service';
import { CommercialOwnersService } from 'app/core/services/complexes/commercial-owners.service';
import { CommercialOwnerListItem } from 'app/core/models/commercial-owners.model';
import { CommercialOwnerFormComponent } from './commercial-owner-form/commercial-owner-form.component';

@Component({
    selector: 'commercial-owners',
    standalone: true,
    templateUrl: './commercial-owners.component.html',
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
export class CommercialOwnersComponent implements OnInit {
    @ViewChild(MatPaginator) paginator: MatPaginator;

    columnConfig: { key: string; labelKey: string; filterable: boolean; type?: string }[] = [
        { key: 'complexName',   labelKey: 'common.columns.complexName',                          filterable: true  },
        { key: 'buildingName',  labelKey: 'common.columns.buildingName',                         filterable: true  },
        { key: 'spaceNumber',   labelKey: 'modules.commercialOwners.columns.spaceNumber',        filterable: true  },
        { key: 'spaceTypeName', labelKey: 'modules.commercialOwners.columns.spaceTypeName',      filterable: true  },
        { key: 'ownerName',     labelKey: 'modules.commercialOwners.columns.ownerName',          filterable: true  },
        { key: 'phone',         labelKey: 'modules.commercialOwners.columns.phone',              filterable: true  },
        { key: 'purchaseDate',  labelKey: 'modules.commercialOwners.columns.purchaseDate',       filterable: false },
        { key: 'deedNumber',    labelKey: 'modules.commercialOwners.columns.deedNumber',         filterable: true  },
        { key: 'isMainOwner',   labelKey: 'modules.commercialOwners.columns.isMainOwner',        filterable: false, type: 'boolean' },
        { key: 'isActive',      labelKey: 'common.columns.isActive',                             filterable: false, type: 'boolean' },
        { key: 'actions',       labelKey: 'common.columns.actions',                              filterable: false },
    ];

    displayedColumns: string[] = this.columnConfig.map(c => c.key);
    dataSource: MatTableDataSource<CommercialOwnerListItem> = new MatTableDataSource<CommercialOwnerListItem>([]);

    totalCount = 0;
    pageSize: number = TABLE_CONFIG.pagination.defaultPageSize;
    pageIndex: number = TABLE_CONFIG.pagination.defaultPageIndex;
    filterForm: FormGroup;
    requestBody: PaginationRequest;
    loading = true;

    constructor(
        private commercialOwnersService: CommercialOwnersService,
        private dialog: MatDialog,
        private confirmationService: FuseConfirmationService,
        private notificationService: NotificationService,
        private baseTableService: BaseTableService,
        private _translocoService: TranslocoService,
    ) { }

    ngOnInit(): void {
        this.requestBody = this.baseTableService.createInitialRequest();
        this.filterForm = this.baseTableService.createFilterForm(this.displayedColumns);
        this.loadData();
    }

    loadData(): void {
        this.loading = true;
        this.commercialOwnersService.getAllCommercialOwners(this.requestBody).subscribe({
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
        this.loadData();
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
        this.loadData();
    }

    trackByFn(index: number, item: CommercialOwnerListItem): number {
        return item.id;
    }

    onCreate(): void {
        const dialogRef = this.dialog.open(CommercialOwnerFormComponent, {
            width: '60%', maxHeight: '98vh', disableClose: true, data: {}
        });
        dialogRef.afterClosed().subscribe(result => { if (result) this.loadData(); });
    }

    onEdit(item: CommercialOwnerListItem): void {
        const dialogRef = this.dialog.open(CommercialOwnerFormComponent, {
            width: '60%', maxHeight: '98vh', disableClose: true,
            data: { commercialOwnerId: item.id }
        });
        dialogRef.afterClosed().subscribe(result => { if (result) this.loadData(); });
    }

    onDelete(item: CommercialOwnerListItem): void {
        const message = this._translocoService.translate(
            'modules.commercialOwners.confirmation.delete.message',
            { name: item.ownerName }
        );
        const confirmation = this.confirmationService.open({
            title: 'modules.commercialOwners.confirmation.delete.title',
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
                this.commercialOwnersService.deleteCommercialOwner(item.id).subscribe({
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
