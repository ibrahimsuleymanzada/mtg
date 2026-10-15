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
import { MatMenuModule } from '@angular/material/menu';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ComplexListItem } from 'app/core/models/complex.model';
import { PaginationRequest, TABLE_CONFIG } from 'app/core/models/api-response.model';
import { ComplexFormDialogComponent } from './complex-form-dialog/complex-form-dialog.component';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { ComplexService } from 'app/core/services/complexes/complex.service';
import { NotificationService } from 'app/core/services/notification.service';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { BaseTableService } from 'app/core/services/base-table.service';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';

@Component({
    selector: 'complex',
    standalone: true,
    templateUrl: './complex.component.html',
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
export class ComplexComponent implements OnInit {
    @ViewChild(MatPaginator) paginator: MatPaginator;

    // Komplekler Kolon konfiqurasiyası
    columnConfig: { key: string; labelKey: string; filterable: boolean }[] = [
        { key: 'complexName', labelKey: 'common.columns.complexName', filterable: true },
        { key: 'companyName', labelKey: 'modules.complexes.columns.companyName', filterable: true },
        { key: 'address', labelKey: 'common.columns.address', filterable: true },
        { key: 'totalArea', labelKey: 'modules.complexes.columns.totalArea', filterable: true },
        { key: 'landArea', labelKey: 'modules.complexes.columns.landArea', filterable: true },
        { key: 'totalBuildings', labelKey: 'modules.complexes.columns.totalBuildings', filterable: true },
        { key: 'actions', labelKey: 'common.columns.actions', filterable: false },
    ];

    // displayedColumns artıq columnConfig-dən yaranır
    displayedColumns: string[] = this.columnConfig.map(c => c.key);

    dataSource: MatTableDataSource<ComplexListItem> = new MatTableDataSource<ComplexListItem>([]);

    // Global konfiqurasiya
    readonly TABLE_CONFIG = TABLE_CONFIG;

    totalCount: number = 0;
    pageSize: number = TABLE_CONFIG.pagination.defaultPageSize;
    pageIndex: number = TABLE_CONFIG.pagination.defaultPageIndex;

    // Filter formu
    filterForm: FormGroup;

    // Request body
    requestBody: PaginationRequest;

    loading: boolean = true


    constructor(
        private complexService: ComplexService,
        private dialog: MatDialog,
        private confirmationService: FuseConfirmationService,
        private notificationService: NotificationService,
        private baseTableService: BaseTableService,
        private _translocoService: TranslocoService
    ) { }

    ngOnInit(): void {
        // İlkin request body
        this.requestBody = this.baseTableService.createInitialRequest();

        // Filter formu yaradırıq
        this.filterForm = this.baseTableService.createFilterForm(this.displayedColumns);

        // İlkin data yükləmə
        this.loadComplexes();
    }


    applyFilters(): void {
        // Filterləri request body-ə əlavə edirik
        this.requestBody.filters = this.baseTableService.formToFilters(this.filterForm.value);

        // İlk səhifəyə qayıdırıq
        this.pageIndex = 0;
        this.requestBody.nextPageNumber = 1;

        // Paginator-u reset edirik
        if (this.paginator) {
            this.paginator.pageIndex = 0;
        }

        this.loadComplexes();
    }

    clearInput(controlName: string): void {
        this.filterForm.get(controlName).reset();
        // Avtomatik filter işlətmək istəyirsinizsə:
        this.applyFilters();
    }


    loadComplexes(): void {
        this.complexService.getAllComplexes(this.requestBody).subscribe({
            next: (response) => {
                if (response.status && response.data) {
                    this.dataSource.data = response.data.result;
                    this.totalCount = response.data.count;
                    this.loading = false
                }
            }
        });
    }

    /**
 * Track by function for performance
 */
    trackByFn(index: number, item: ComplexListItem): number {
        return item.id;
    }

    /**
     * Pagination dəyişikliyi
     */
    onPageChange(event: PageEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;

        this.requestBody.nextPageNumber = event.pageIndex + 1;
        this.requestBody.visibleItemCount = event.pageSize;

        this.loadComplexes();
    }


    /**
     * Open create dialog
     */
    onCreate(): void {
        const dialogRef = this.dialog.open(ComplexFormDialogComponent, {
            width: '60%',
            maxHeight: '98vh',
            disableClose: true,
            data: {}
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.loadComplexes();
            }
        });
    }

    /**
     * Open edit dialog
     */
    onEdit(complex: ComplexListItem): void {
        const dialogRef = this.dialog.open(ComplexFormDialogComponent, {
            width: '50%',
            maxHeight: '98vh',
            disableClose: true,
            data: { complexId: complex.id }
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.loadComplexes();
            }
        });
    }

    /**
     * Delete complex
     */
    onDelete(complex: ComplexListItem): void {
        const message = this._translocoService.translate(
            'modules.complexes.confirmation.complexes.message',
            { complexName: complex.complexName }
        )
        const confirmation = this.confirmationService.open({
            title: 'modules.complexes.confirmation.complexes.title',
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
                this.complexService.deleteComplex(complex.id).subscribe({
                    next: (response) => {
                        if (response.status) {
                            this.loadComplexes();
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