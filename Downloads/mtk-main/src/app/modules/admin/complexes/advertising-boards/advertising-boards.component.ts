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
import { AdvertisingBoardListItem, AdvertisingBoardsService } from 'app/core/services/complexes/advertising-boards.service';
import { AdvertisingBoardFormComponent } from './advertising-board-form/advertising-board-form.component';

@Component({
    selector: 'advertising-boards',
    standalone: true,
    templateUrl: './advertising-boards.component.html',
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
export class AdvertisingBoardsComponent implements OnInit {
    @ViewChild(MatPaginator) paginator: MatPaginator;

    columnConfig: { key: string; labelKey: string; filterable: boolean; type?: string }[] = [
        { key: 'complexName',  labelKey: 'common.columns.complexName',                           filterable: true  },
        { key: 'buildingName', labelKey: 'common.columns.buildingName',                          filterable: true  },
        { key: 'location',     labelKey: 'modules.advertisingBoards.columns.location',           filterable: true  },
        { key: 'boardSize',    labelKey: 'modules.advertisingBoards.columns.boardSize',          filterable: true  },
        { key: 'description',  labelKey: 'modules.advertisingBoards.columns.description',        filterable: true  },
        { key: 'monthlyPrice', labelKey: 'modules.advertisingBoards.columns.monthlyPrice',       filterable: true, type: 'currency' },
        { key: 'status',       labelKey: 'common.columns.status',                               filterable: true  },
        { key: 'actions',      labelKey: 'common.columns.actions',                              filterable: false },
    ];

    displayedColumns: string[] = this.columnConfig.map(c => c.key);

    dataSource: MatTableDataSource<AdvertisingBoardListItem> = new MatTableDataSource<AdvertisingBoardListItem>([]);

    readonly TABLE_CONFIG = TABLE_CONFIG;

    totalCount: number = 0;
    pageSize: number = TABLE_CONFIG.pagination.defaultPageSize;
    pageIndex: number = TABLE_CONFIG.pagination.defaultPageIndex;

    filterForm: FormGroup;
    requestBody: PaginationRequest;
    loading: boolean = true;

    constructor(
        private advertisingBoardsService: AdvertisingBoardsService,
        private dialog: MatDialog,
        private confirmationService: FuseConfirmationService,
        private notificationService: NotificationService,
        private baseTableService: BaseTableService,
        private _translocoService: TranslocoService
    ) { }

    ngOnInit(): void {
        this.requestBody = this.baseTableService.createInitialRequest();
        this.filterForm = this.baseTableService.createFilterForm(this.displayedColumns);
        this.loadBoards();
    }

    applyFilters(): void {
        this.requestBody.filters = this.baseTableService.formToFilters(this.filterForm.value);
        this.pageIndex = 0;
        this.requestBody.nextPageNumber = 1;
        if (this.paginator) {
            this.paginator.pageIndex = 0;
        }
        this.loadBoards();
    }

    clearInput(controlName: string): void {
        this.filterForm.get(controlName).reset();
        this.applyFilters();
    }

    loadBoards(): void {
        this.advertisingBoardsService.getAllAdvertisingBoards(this.requestBody).subscribe({
            next: (response) => {
                if (response.status && response.data) {
                    this.dataSource.data = response.data.result;
                    this.totalCount = response.data.count;
                    this.loading = false;
                }
            },
            error: (error) => {
                console.error('Error loading advertising boards:', error);
                this.notificationService.error('Məlumatlar yüklənərkən xəta baş verdi');
            }
        });
    }

    trackByFn(index: number, item: AdvertisingBoardListItem): number {
        return item.id;
    }

    onPageChange(event: PageEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.requestBody.nextPageNumber = event.pageIndex + 1;
        this.requestBody.visibleItemCount = event.pageSize;
        this.loadBoards();
    }

    onCreate(): void {
        const dialogRef = this.dialog.open(AdvertisingBoardFormComponent, {
            width: '60%',
            maxHeight: '98vh',
            disableClose: true,
            data: {}
        });
        dialogRef.afterClosed().subscribe((result) => {
            if (result) { this.loadBoards(); }
        });
    }

    onEdit(board: AdvertisingBoardListItem): void {
        const dialogRef = this.dialog.open(AdvertisingBoardFormComponent, {
            width: '60%',
            maxHeight: '98vh',
            disableClose: true,
            data: { id: board.id }
        });
        dialogRef.afterClosed().subscribe((result) => {
            if (result) { this.loadBoards(); }
        });
    }

    onDelete(board: AdvertisingBoardListItem): void {
        const message = this._translocoService.translate(
            'modules.advertisingBoards.confirmation.delete.message',
            { board: board.location }
        );

        const confirmation = this.confirmationService.open({
            title: 'modules.advertisingBoards.confirmation.delete.title',
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
                this.advertisingBoardsService.deleteAdvertisingBoard(board.id).subscribe({
                    next: (response) => {
                        if (response.status) {
                            this.loadBoards();
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