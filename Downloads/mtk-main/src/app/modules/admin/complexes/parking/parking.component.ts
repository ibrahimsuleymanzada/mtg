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
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { ParkingFormComponent } from './parking-form/parking-form.component';
import { ParkingsService } from 'app/core/services/complexes/parking.service';
import { ParkingListItem } from 'app/core/models/parking.model';

@Component({
    selector: 'parking',
    standalone: true,
    templateUrl: './parking.component.html',
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
export class ParkingComponent implements OnInit {
    @ViewChild(MatPaginator) paginator: MatPaginator;

    // Mənzil sahibləri Kolon konfiqurasiyası
    columnConfig: { key: string; labelKey: string; filterable: boolean; type?: string }[] = [
        { key: 'complexName', labelKey: 'common.columns.complexName', filterable: true },
        { key: 'buildingName', labelKey: 'common.columns.buildingName', filterable: true },
        { key: 'spaceNumber', labelKey: 'modules.parking.columns.spaceNumber', filterable: true },
        { key: 'spaceType', labelKey: 'modules.parking.columns.spaceType', filterable: true},
        { key: 'level', labelKey: 'modules.parking.columns.level', filterable: true },
        { key: 'monthlyRentalPrice', labelKey: 'modules.parking.columns.monthlyRentalPrice', filterable: true, type: 'currency' },
        { key: 'salePrice', labelKey: 'modules.parking.columns.salePrice', filterable: true, type: 'currency' },
        { key: 'isElectricCharging', labelKey: 'modules.parking.columns.isElectricCharging', filterable: false, type: 'boolean' },
        { key: 'status', labelKey: 'common.columns.status', filterable: true },
        { key: 'actions', labelKey: 'common.columns.actions', filterable: false },
    ];

    // displayedColumns artıq columnConfig-dən yaranır
    displayedColumns: string[] = this.columnConfig.map(c => c.key);

    dataSource: MatTableDataSource<ParkingListItem> = new MatTableDataSource<ParkingListItem>([]);

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
        private parkingsService: ParkingsService,
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
        this.loadParking();
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

        this.loadParking();
    }

    clearInput(controlName: string): void {
        this.filterForm.get(controlName).reset();
        // Avtomatik filter işlətmək istəyirsinizsə:
        this.applyFilters();
    }


    loadParking(): void {
        this.parkingsService.getAllParking(this.requestBody).subscribe({
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
    trackByFn(index: number, item: ParkingListItem): number {
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

        this.loadParking();
    }


    /**
     * Open create dialog
     */
    onCreate(): void {
        const dialogRef = this.dialog.open(ParkingFormComponent, {
            width: '60%',
            maxHeight: '98vh',
            disableClose: true,
            data: {}
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.loadParking();
            }
        });
    }

    /**
     * Open edit dialog
     */
    onEdit(apartmentOwner: ParkingListItem): void {
        const dialogRef = this.dialog.open(ParkingFormComponent, {
            width: '50%',
            maxHeight: '98vh',
            disableClose: true,
            data: { apartmentOwnerId: apartmentOwner.id }
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.loadParking();
            }
        });
    }

    /**
     * Delete apartmentOwner
     */
    onDelete(apartmentOwner: ParkingListItem): void {
        const message = this._translocoService.translate(
            'modules.complexes.confirmation.parking.message',
            { parking: apartmentOwner.spaceNumber }
        );
        const confirmation = this.confirmationService.open({
            title: 'modules.complexes.confirmation.parking.title',
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
                this.parkingsService.deleteADeleteParkingparment(apartmentOwner.id).subscribe({
                    next: (response) => {
                        if (response.status) {
                            this.loadParking();
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