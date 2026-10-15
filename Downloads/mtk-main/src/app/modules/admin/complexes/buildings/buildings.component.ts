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
import { BuildingsFormDialogComponent } from './building-form-dialog/building-form-dialog.component';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { NotificationService } from 'app/core/services/notification.service';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { BaseTableService } from 'app/core/services/base-table.service';
import { BuildingsListItem } from 'app/core/models/buildings.model';
import { BuildingsService } from 'app/core/services/complexes/buildings.service';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';

@Component({
    selector: 'buildings',
    standalone: true,
    templateUrl: './buildings.component.html',
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
        MatMenuModule,
        FormsModule,
        TranslocoModule
    ],
    providers: [BaseTableService]
})
export class BuildingsComponent implements OnInit {
    @ViewChild(MatPaginator) paginator: MatPaginator;

    // Binalar Kolon konfiqurasiyası
    columnConfig: { key: string; labelKey: string; filterable: boolean; type?: string }[] = [
        { key: 'complexName', labelKey: 'common.columns.complexName', filterable: true },
        { key: 'buildingName', labelKey: 'common.columns.buildingName', filterable: true },
        { key: 'buildingNumber', labelKey: 'modules.buildings.columns.buildingNumber', filterable: true },
        { key: 'totalFloors', labelKey: 'modules.buildings.columns.totalFloors', filterable: true },
        { key: 'totalApartments', labelKey: 'modules.buildings.columns.totalApartments', filterable: true },
        { key: 'buildingType', labelKey: 'modules.buildings.columns.buildingType', filterable: true },
        { key: 'hasElevator', labelKey: 'modules.buildings.columns.hasElevator', filterable: true, type: 'boolean' },
        { key: 'elevatorCount', labelKey: 'modules.buildings.columns.elevatorCount', filterable: true },
        { key: 'hasParking', labelKey: 'modules.buildings.columns.hasParking', filterable: true, type: 'boolean' },
        { key: 'constructionYear', labelKey: 'modules.buildings.columns.constructionYear', filterable: true },
        { key: 'address', labelKey: 'common.columns.address', filterable: true },
        { key: 'actions', labelKey: 'common.columns.actions', filterable: false },
    ];

    complexName: string;
    buildingName: string;
    buildingNumber: string;
    totalFloors: number;
    totalApartments: number;
    buildingType: string;
    hasElevator: boolean;
    elevatorCount: number;
    hasParking: boolean;
    constructionYear: number;
    address: string;

    // displayedColumns artıq columnConfig-dən yaranır
    displayedColumns: string[] = this.columnConfig.map(c => c.key);

    dataSource: MatTableDataSource<BuildingsListItem> = new MatTableDataSource<BuildingsListItem>([]);

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
        private buildingsService: BuildingsService,
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
        this.loadBuildings();
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

        this.loadBuildings();
    }

    clearInput(controlName: string): void {
        this.filterForm.get(controlName).reset();
        // Avtomatik filter işlətmək istəyirsinizsə:
        this.applyFilters();
    }


    loadBuildings(): void {
        this.buildingsService.getAllBuildings(this.requestBody).subscribe({
            next: (response) => {
                if (response.status && response.data) {
                    this.dataSource.data = response.data.result;
                    this.totalCount = response.data.count;
                    this.loading = false
                }
            },
            error: (error) => {
                console.error('Error loading complexes:', error);
                this.notificationService.error('Məlumatlar yüklənərkən xəta baş verdi');
            }
        });
    }

    /**
 * Track by function for performance
 */
    trackByFn(index: number, item: BuildingsListItem): number {
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

        this.loadBuildings();
    }


    /**
     * Open create dialog
     */
    onCreate(): void {
        const dialogRef = this.dialog.open(BuildingsFormDialogComponent, {
            width: '60%',
            maxHeight: '98vh',
            disableClose: true,
            data: {}
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.loadBuildings();
            }
        });
    }

    /**
     * Open edit dialog
     */
    onEdit(building: BuildingsListItem): void {
        const dialogRef = this.dialog.open(BuildingsFormDialogComponent, {
            width: '50%',
            maxHeight: '98vh',
            disableClose: true,
            data: { buildingId: building.id }
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.loadBuildings();
            }
        });
    }

    /**
     * Delete building
     */
    onDelete(building: BuildingsListItem): void {
        const message = this._translocoService.translate(
            'modules.complexes.confirmation.buildings.message',
            { apartmentNumber: building.buildingName }
        )
        const confirmation = this.confirmationService.open({
            title: 'modules.complexes.confirmation.buildings.title',
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
                this.buildingsService.deleteBuilding(building.id).subscribe({
                    next: (response) => {
                        if (response.status) {
                            this.loadBuildings();
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