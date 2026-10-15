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
import { PaginationRequest, TABLE_CONFIG } from 'app/core/models/api-response.model';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { NotificationService } from 'app/core/services/notification.service';
import { BaseTableService } from 'app/core/services/base-table.service';
import { ApartmentFormDialogComponent } from './apartment-form-dialog/apartment-form-dialog.component';
import { ApartmentsListItem } from 'app/core/models/apartments.model';
import { AparmentService } from 'app/core/services/complexes/apartments.service';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';

@Component({
    selector: 'apartments',
    standalone: true,
    templateUrl: './apartments.component.html',
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
export class ApartmentsComponent implements OnInit {
    @ViewChild(MatPaginator) paginator: MatPaginator;

    //Menziller Kolon konfiqurasiyası
    columnConfig: { key: string; labelKey: string; filterable: boolean; type?: string }[] = [
        { key: 'buildingName', labelKey: 'common.columns.buildingName', filterable: true },
        { key: 'apartmentNumber', labelKey: 'modules.apartments.columns.apartmentNumber', filterable: true },
        { key: 'floor', labelKey: 'modules.apartments.columns.floor', filterable: true },
        { key: 'roomCount', labelKey: 'modules.apartments.columns.roomCount', filterable: true },
        { key: 'area', labelKey: 'modules.apartments.columns.area', filterable: true, type: 'withField' },
        { key: 'apartmentType', labelKey: 'modules.apartments.columns.apartmentType', filterable: true },
        { key: 'hasBalcony', labelKey: 'modules.apartments.columns.hasBalcony', filterable: true, type: 'boolean' },
        { key: 'balconyArea', labelKey: 'modules.apartments.columns.balconyArea', filterable: true, type: 'withField' },
        { key: 'status', labelKey: 'modules.apartments.columns.status', filterable: true },
        { key: 'actions', labelKey: 'common.columns.actions', filterable: false },
    ];

    // displayedColumns artıq columnConfig-dən yaranır
    displayedColumns: string[] = this.columnConfig.map(c => c.key);

    dataSource: MatTableDataSource<ApartmentsListItem> = new MatTableDataSource<ApartmentsListItem>([]);

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
        private aparmentService: AparmentService,
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
        this.loadApartmentes();
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

        this.loadApartmentes();
    }

    clearInput(controlName: string): void {
        this.filterForm.get(controlName).reset();
        // Avtomatik filter işlətmək istəyirsinizsə:
        this.applyFilters();
    }


    loadApartmentes(): void {
        this.aparmentService.getAllAparments(this.requestBody).subscribe({
            next: (response) => {
                if (response.status && response.data) {
                    this.dataSource.data = response.data.result;
                    this.totalCount = response.data.count;
                    this.loading = false
                }
            },
            error: (error) => {
                console.error('Error loading apartmentes:', error);
                this.notificationService.error('Məlumatlar yüklənərkən xəta baş verdi');
            }
        });
    }

    /**
 * Track by function for performance
 */
    trackByFn(index: number, item: ApartmentsListItem): number {
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

        this.loadApartmentes();
    }


    /**
     * Open create dialog
     */
    onCreate(): void {
        const dialogRef = this.dialog.open(ApartmentFormDialogComponent, {
            width: '60%',
            maxHeight: '98vh',
            disableClose: true,
            data: {}
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.loadApartmentes();
            }
        });
    }

    /**
     * Open edit dialog
     */
    onEdit(apartment: ApartmentsListItem): void {
        const dialogRef = this.dialog.open(ApartmentFormDialogComponent, {
            width: '50%',
            maxHeight: '98vh',
            disableClose: true,
            data: { apartmentId: apartment.id }
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.loadApartmentes();
            }
        });
    }

    /**
     * Delete apartment
     */
    onDelete(apartment: ApartmentsListItem): void {
        const message = this._translocoService.translate(
            'modules.complexes.confirmation.apartments.message',
            { apartmentNumber: apartment.apartmentNumber }
        );
        const confirmation = this.confirmationService.open({
            title: 'modules.complexes.confirmation.apartments.title',
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
                this.aparmentService.deleteAparment(apartment.id).subscribe({
                    next: (response) => {
                        if (response.status) {
                            this.loadApartmentes();
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