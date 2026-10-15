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
import { PaginationRequest, TABLE_CONFIG } from 'app/core/models/api-response.model';
import { AccessCardListItem } from 'app/core/models/access-card.model';
import { AccessCardsService } from 'app/core/services/complexes/access-cards.service';
import { AccessCardFormComponent } from './access-card-form/access-card-form.component';
import { AccessCardOrderStatusDialogComponent } from './access-card-order-status-dialog/access-card-order-status-dialog.component';

@Component({
    selector: 'access-cards',
    standalone: true,
    templateUrl: './access-cards.component.html',
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
        AccessCardOrderStatusDialogComponent
    ],
    providers: [BaseTableService]
})
export class AccessCardsComponent implements OnInit {
    @ViewChild(MatPaginator) paginator: MatPaginator;

    columnConfig: { key: string; labelKey: string; filterable: boolean; type?: string }[] = [
        { key: 'cardNumber',      labelKey: 'modules.accessCards.columns.cardNumber',      filterable: true  },
        { key: 'cardType',        labelKey: 'modules.accessCards.columns.cardType',        filterable: true  },
        { key: 'user',            labelKey: 'modules.accessCards.columns.user',            filterable: true  },
        { key: 'complexName',     labelKey: 'common.columns.complexName',                  filterable: true  },
        { key: 'buildingName',    labelKey: 'common.columns.buildingName',                 filterable: true  },
        { key: 'apartmentNumber', labelKey: 'modules.accessCards.columns.apartmentNumber', filterable: true  },
        { key: 'status',          labelKey: 'common.columns.status',                       filterable: true  },
        { key: 'issueDate',       labelKey: 'modules.accessCards.columns.issueDate',       filterable: true, type: 'date' },
        { key: 'expiryDate',      labelKey: 'modules.accessCards.columns.expiryDate',      filterable: true, type: 'date' },
        { key: 'orderStatus',     labelKey: 'modules.accessCards.columns.orderStatus',     filterable: true  },
        { key: 'actions',         labelKey: 'common.columns.actions',                      filterable: false },
    ];

    displayedColumns: string[] = this.columnConfig.map(c => c.key);

    dataSource: MatTableDataSource<AccessCardListItem> = new MatTableDataSource<AccessCardListItem>([]);

    readonly TABLE_CONFIG = TABLE_CONFIG;

    totalCount: number = 0;
    pageSize:   number = TABLE_CONFIG.pagination.defaultPageSize;
    pageIndex:  number = TABLE_CONFIG.pagination.defaultPageIndex;

    filterForm: FormGroup;
    requestBody: PaginationRequest;
    loading: boolean = true;

    constructor(
        private accessCardsService: AccessCardsService,
        private dialog: MatDialog,
        private confirmationService: FuseConfirmationService,
        private notificationService: NotificationService,
        private baseTableService: BaseTableService,
        private _translocoService: TranslocoService
    ) {}

    ngOnInit(): void {
        this.requestBody = this.baseTableService.createInitialRequest();
        this.filterForm  = this.baseTableService.createFilterForm(this.displayedColumns);
        this.loadAccessCards();
    }

    // ─── Filter ──────────────────────────────────────────────────────────────

    applyFilters(): void {
        this.requestBody.filters       = this.baseTableService.formToFilters(this.filterForm.value);
        this.pageIndex                 = 0;
        this.requestBody.nextPageNumber = 1;
        if (this.paginator) { this.paginator.pageIndex = 0; }
        this.loadAccessCards();
    }

    clearInput(controlName: string): void {
        this.filterForm.get(controlName).reset();
        this.applyFilters();
    }

    // ─── Data ─────────────────────────────────────────────────────────────────

    loadAccessCards(): void {
        this.accessCardsService.getAllAccessCards(this.requestBody).subscribe({
            next: (response) => {
                if (response.status && response.data) {
                    this.dataSource.data = response.data.result;
                    this.totalCount      = response.data.count;
                    this.loading         = false;
                }
            },
            error: (error) => {
                console.error('Error loading access cards:', error);
                this.notificationService.error('Məlumatlar yüklənərkən xəta baş verdi');
            }
        });
    }

    trackByFn(index: number, item: AccessCardListItem): number {
        return item.id;
    }

    // ─── Pagination ───────────────────────────────────────────────────────────

    onPageChange(event: PageEvent): void {
        this.pageIndex  = event.pageIndex;
        this.pageSize   = event.pageSize;
        this.requestBody.nextPageNumber    = event.pageIndex + 1;
        this.requestBody.visibleItemCount  = event.pageSize;
        this.loadAccessCards();
    }

    // ─── CRUD ─────────────────────────────────────────────────────────────────

    onCreate(): void {
        const dialogRef = this.dialog.open(AccessCardFormComponent, {
            width: '60%',
            maxHeight: '98vh',
            disableClose: true,
            data: {}
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) { this.loadAccessCards(); }
        });
    }

    onEdit(card: AccessCardListItem): void {
        const dialogRef = this.dialog.open(AccessCardFormComponent, {
            width: '60%',
            maxHeight: '98vh',
            disableClose: true,
            data: { accessCardId: card.id }
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) { this.loadAccessCards(); }
        });
    }

    onUpdateOrderStatus(card: AccessCardListItem): void {
        const dialogRef = this.dialog.open(AccessCardOrderStatusDialogComponent, {
            width: '480px',
            disableClose: true,
            data: { card }
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) { this.loadAccessCards(); }
        });
    }

    onDelete(card: AccessCardListItem): void {
        const message = this._translocoService.translate(
            'modules.accessCards.confirmation.delete.message',
            { cardNumber: card.cardNumber }
        );
        const confirmation = this.confirmationService.open({
            title: 'modules.accessCards.confirmation.delete.title',
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
                this.accessCardsService.deleteAccessCard(card.id).subscribe({
                    next: (response) => {
                        if (response.status) {
                            this.loadAccessCards();
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