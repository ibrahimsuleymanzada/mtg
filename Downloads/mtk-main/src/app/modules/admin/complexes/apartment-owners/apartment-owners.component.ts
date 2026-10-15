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
import { ApartmentsListItem } from 'app/core/models/apartments.model';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import {  ApartmentOwnerFormComponent } from './apartment-owner-form/apartment-owner-form.component';
import { ApartmentOwnersService } from 'app/core/services/complexes/apartment-owners.service';
import { ApartmentOwner, ApartmentOwnerListItem } from 'app/core/models/apartment-owners.model';
import { RouterLink } from "@angular/router";
import { environment } from 'environments/environment';

@Component({
    selector: 'apartment-owners',
    standalone: true,
    templateUrl: './apartment-owners.component.html',
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
export class ApartmentOwnersComponent implements OnInit {
    @ViewChild(MatPaginator) paginator: MatPaginator;

// Mənzil sahibləri Kolon konfiqurasiyası
columnConfig: { key: string; labelKey: string; filterable: boolean; type?: string }[] = [
    { key: 'complexName',      labelKey: 'common.columns.complexName',                    filterable: true },
    { key: 'buildingName',     labelKey: 'common.columns.buildingName',                   filterable: true },
    { key: 'apartmentNumber',  labelKey: 'modules.apartments.columns.apartmentNumber',    filterable: true },
    { key: 'person',  labelKey: 'modules.apartmentOwners.columns.person',    filterable: true },
    { key: 'purchaseDate',     labelKey: 'modules.apartmentOwners.columns.purchaseDate',  filterable: true,  type: 'date' },
    { key: 'purchasePrice',    labelKey: 'modules.apartmentOwners.columns.purchasePrice', filterable: true,  type: 'currency' },
    { key: 'deedNumber',       labelKey: 'modules.apartmentOwners.columns.deedNumber',    filterable: true },
    { key: 'isMainOwner',      labelKey: 'modules.apartmentOwners.columns.isMainOwner',   filterable: false, type: 'boolean' },
    { key: 'startDate',        labelKey: 'modules.apartmentOwners.columns.startDate',     filterable: true,  type: 'date' },
    { key: 'endDate',          labelKey: 'modules.apartmentOwners.columns.endDate',       filterable: true,  type: 'date' },
    { key: 'actions',          labelKey: 'common.columns.actions',                        filterable: false },
];

    // displayedColumns artıq columnConfig-dən yaranır
    displayedColumns: string[] = this.columnConfig.map(c => c.key);

    dataSource: MatTableDataSource<ApartmentOwnerListItem> = new MatTableDataSource<ApartmentOwnerListItem>([]);

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

    apiFileurl: string = environment.fileUrl

    constructor(
        private apartmentOwnersService: ApartmentOwnersService,
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
        this.apartmentOwnersService.getAllApartmentOwner(this.requestBody).subscribe({
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
        const dialogRef = this.dialog.open(ApartmentOwnerFormComponent, {
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
    onEdit(apartmentOwner: ApartmentOwner): void {
        const dialogRef = this.dialog.open(ApartmentOwnerFormComponent, {
            width: '50%',
            maxHeight: '98vh',
            disableClose: true,
            data: { apartmentOwnerId: apartmentOwner.id }
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.loadApartmentes();
            }
        });
    }

    /**
     * Delete apartmentOwner
     */
    onDelete(apartmentOwner: ApartmentOwner): void {
        const message = this._translocoService.translate(
            'modules.complexes.confirmation.apartmentOwners.message',
            { apartmentOwners: apartmentOwner.person }
        );
        const confirmation = this.confirmationService.open({
            title: 'modules.complexes.confirmation.apartmentOwners.title',
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
                this.apartmentOwnersService.deleteApartmentOwnerparment(apartmentOwner.id).subscribe({
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