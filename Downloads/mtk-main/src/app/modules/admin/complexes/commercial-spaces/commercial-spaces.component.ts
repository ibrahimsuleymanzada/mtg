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
import { CommercialSpaceListItem } from 'app/core/models/commercial-spaces.model';
import { CommercialSpacesService } from 'app/core/services/complexes/commercial-spaces.service';
import { CommercialSpaceFormComponent } from './commercial-space-form/commercial-space-form.component';

@Component({
    selector: 'commercial-spaces',
    standalone: true,
    templateUrl: './commercial-spaces.component.html',
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
export class CommercialSpacesComponent implements OnInit {
    @ViewChild(MatPaginator) paginator: MatPaginator;

    columnConfig: { key: string; labelKey: string; filterable: boolean; type?: string }[] = [
        { key: 'complexName',      labelKey: 'common.columns.complexName',                              filterable: true },
        { key: 'buildingName',     labelKey: 'common.columns.buildingName',                             filterable: true },
        { key: 'spaceNumber',      labelKey: 'modules.commercialSpaces.columns.spaceNumber',            filterable: true },
        { key: 'floor',            labelKey: 'modules.commercialSpaces.columns.floor',                  filterable: true },
        { key: 'spaceType',        labelKey: 'modules.commercialSpaces.columns.spaceType',              filterable: true },
        { key: 'area',             labelKey: 'modules.commercialSpaces.columns.area',                   filterable: true },
        { key: 'description',      labelKey: 'modules.commercialSpaces.columns.description',            filterable: true },
        { key: 'monthlyRent',      labelKey: 'modules.commercialSpaces.columns.monthlyRent',            filterable: true, type: 'currency' },
        { key: 'securityDeposit',  labelKey: 'modules.commercialSpaces.columns.securityDeposit',        filterable: true, type: 'currency' },
        { key: 'hasWater',         labelKey: 'modules.commercialSpaces.columns.hasWater',               filterable: false, type: 'boolean' },
        { key: 'hasElectricity',   labelKey: 'modules.commercialSpaces.columns.hasElectricity',         filterable: false, type: 'boolean' },
        { key: 'hasSewerage',      labelKey: 'modules.commercialSpaces.columns.hasSewerage',            filterable: false, type: 'boolean' },
        { key: 'salePrice',        labelKey: 'modules.commercialSpaces.columns.salePrice',              filterable: false, type: 'currency' },
        { key: 'actions',          labelKey: 'common.columns.actions',                                  filterable: false },
    ];

    displayedColumns: string[] = this.columnConfig.map(c => c.key);

    dataSource: MatTableDataSource<CommercialSpaceListItem> = new MatTableDataSource<CommercialSpaceListItem>([]);

    readonly TABLE_CONFIG = TABLE_CONFIG;

    totalCount: number = 0;
    pageSize: number = TABLE_CONFIG.pagination.defaultPageSize;
    pageIndex: number = TABLE_CONFIG.pagination.defaultPageIndex;

    filterForm: FormGroup;
    requestBody: PaginationRequest;
    loading: boolean = true;

    constructor(
        private commercialSpacesService: CommercialSpacesService,
        private dialog: MatDialog,
        private confirmationService: FuseConfirmationService,
        private notificationService: NotificationService,
        private baseTableService: BaseTableService,
        private _translocoService: TranslocoService
    ) { }

    ngOnInit(): void {
        this.requestBody = this.baseTableService.createInitialRequest();
        this.filterForm = this.baseTableService.createFilterForm(this.displayedColumns);
        this.loadCommercialSpaces();
    }

    applyFilters(): void {
        this.requestBody.filters = this.baseTableService.formToFilters(this.filterForm.value);
        this.pageIndex = 0;
        this.requestBody.nextPageNumber = 1;

        if (this.paginator) {
            this.paginator.pageIndex = 0;
        }

        this.loadCommercialSpaces();
    }

    clearInput(controlName: string): void {
        this.filterForm.get(controlName).reset();
        this.applyFilters();
    }

    loadCommercialSpaces(): void {
        this.commercialSpacesService.getAllCommercialSpaces(this.requestBody).subscribe({
            next: (response) => {
                if (response.status && response.data) {
                    this.dataSource.data = response.data.result;
                    this.totalCount = response.data.count;
                    this.loading = false;
                }
            },
            error: (error) => {
                console.error('Error loading commercial spaces:', error);
                this.notificationService.error('Məlumatlar yüklənərkən xəta baş verdi');
            }
        });
    }

    trackByFn(index: number, item: CommercialSpaceListItem): number {
        return item.id;
    }

    onPageChange(event: PageEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;

        this.requestBody.nextPageNumber = event.pageIndex + 1;
        this.requestBody.visibleItemCount = event.pageSize;

        this.loadCommercialSpaces();
    }

    onCreate(): void {
        const dialogRef = this.dialog.open(CommercialSpaceFormComponent, {
            width: '60%',
            maxHeight: '98vh',
            disableClose: true,
            data: {}
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.loadCommercialSpaces();
            }
        });
    }

    onEdit(space: CommercialSpaceListItem): void {
        const dialogRef = this.dialog.open(CommercialSpaceFormComponent, {
            width: '50%',
            maxHeight: '98vh',
            disableClose: true,
            data: { commercialSpaceId: space.id }
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.loadCommercialSpaces();
            }
        });
    }

    onDelete(space: CommercialSpaceListItem): void {
        const message = this._translocoService.translate(
            'modules.commercialSpaces.confirmation.delete.message',
            { spaceNumber: space.spaceNumber }
        );

        const confirmation = this.confirmationService.open({
            title: 'modules.commercialSpaces.confirmation.delete.title',
            message: message,
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
                this.commercialSpacesService.deleteCommercialSpace(space.id).subscribe({
                    next: (response) => {
                        if (response.status) {
                            this.loadCommercialSpaces();
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