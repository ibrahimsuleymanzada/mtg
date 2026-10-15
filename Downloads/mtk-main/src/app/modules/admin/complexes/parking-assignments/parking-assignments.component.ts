// parking-assignments.component.ts

import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';


import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { NotificationService } from 'app/core/services/notification.service';
import { BaseTableService } from 'app/core/services/base-table.service';
import { PaginationRequest, TABLE_CONFIG } from 'app/core/models/api-response.model';
import { ParkingAssignmentListItem } from 'app/core/models/parking-assignments.types';
import { ParkingAssignmentsService } from 'app/core/services/complexes/parking-assignments.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { ParkingAssignmentFormComponent } from './parking-assignment-form/parking-assignment-form.component';

@Component({
    selector: 'app-parking-assignments',
    standalone: true,
    templateUrl: './parking-assignments.component.html',
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
        MatDatepickerModule
    ],
    providers: [BaseTableService]
})
export class ParkingAssignmentsComponent implements OnInit, OnDestroy {
    @ViewChild(MatPaginator) paginator: MatPaginator;

    // Kolon konfiqurasiyası
    columnConfig: { key: string; labelKey: string; filterable: boolean; type?: string; width?: string }[] = [
        { key: 'place', labelKey: 'modules.parkingAssignments.columns.place', filterable: true, width: '15%' },
        { key: 'person', labelKey: 'modules.parkingAssignments.columns.person', filterable: true, width: '10%' },
        { key: 'assignmentType', labelKey: 'modules.parkingAssignments.columns.assignmentType', filterable: true },
        { key: 'vehicleNumber', labelKey: 'modules.parkingAssignments.columns.vehicleNumber', filterable: true },
        { key: 'vehicleBrand', labelKey: 'modules.parkingAssignments.columns.vehicleBrand', filterable: true },
        { key: 'vehicleModel', labelKey: 'modules.parkingAssignments.columns.vehicleModel', filterable: true },
        { key: 'monthlyFee', labelKey: 'modules.parkingAssignments.columns.monthlyFee', filterable: true, type: 'currency' },
        { key: 'contractStartDate', labelKey: 'modules.parkingAssignments.columns.contractStartDate', filterable: true, type: 'date' },
        { key: 'contractEndDate', labelKey: 'modules.parkingAssignments.columns.contractEndDate', filterable: true, type: 'date' },
        { key: 'actions', labelKey: 'common.columns.actions', filterable: false },
    ];

    displayedColumns: string[] = this.columnConfig.map(c => c.key);
    dataSource: MatTableDataSource<ParkingAssignmentListItem> = new MatTableDataSource<ParkingAssignmentListItem>([]);

    // Global konfiqurasiya
    readonly TABLE_CONFIG = TABLE_CONFIG;

    totalCount: number = 0;
    pageSize: number = TABLE_CONFIG.pagination.defaultPageSize;
    pageIndex: number = TABLE_CONFIG.pagination.defaultPageIndex;

    // Filter formları
    filterForm: FormGroup;
    dateRangeForm: FormGroup;

    // Request body
    requestBody: PaginationRequest;
    loading: boolean = true;

    private destroy$ = new Subject<void>();

    constructor(
        private parkingAssignmentsService: ParkingAssignmentsService,
        private dialog: MatDialog,
        private confirmationService: FuseConfirmationService,
        private notificationService: NotificationService,
        private baseTableService: BaseTableService,
        private translocoService: TranslocoService
    ) { }

    ngOnInit(): void {
        // İlkin request body
        this.requestBody = this.baseTableService.createInitialRequest();

        // Column filter formu
        this.filterForm = this.baseTableService.createFilterForm(this.displayedColumns);

        // Date range formu
        this.dateRangeForm = this.baseTableService.createDateRangeForm();

        const { beginDate, endDate } = this.dateRangeForm.value;
        this.requestBody = this.baseTableService.addDateRangeToRequest(
            this.requestBody,
            beginDate,
            endDate
        );

        // İlkin data yükləmə
        this.loadData();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    applyFilters(): void {
        // Column filterləri
        this.requestBody.filters = this.baseTableService.formToFilters(this.filterForm.value);

        // Date range - HƏR İKİSİ seçilməlidirsə əlavə et
        const { beginDate, endDate } = this.dateRangeForm.value;

        if (beginDate && endDate && this.dateRangeForm.valid) {
            this.requestBody = this.baseTableService.addDateRangeToRequest(
                this.requestBody,
                beginDate,
                endDate
            );
        } else {
            // Tarixi sil
            this.requestBody = this.baseTableService.addDateRangeToRequest(
                this.requestBody,
                null,
                null
            );
        }

        // İlk səhifəyə qayıt
        this.pageIndex = 0;
        this.requestBody.nextPageNumber = 1;
        if (this.paginator) {
            this.paginator.pageIndex = 0;
        }

        this.loadData();
    }

    clearInput(controlName: string): void {
        this.filterForm.get(controlName).reset();
        this.applyFilters();
    }


    loadData(): void {
        this.loading = true;
        this.parkingAssignmentsService.getAllParkingAssignments(this.requestBody).subscribe({
            next: (response) => {
                if (response.status && response.data) {
                    this.dataSource.data = response.data.result;
                    this.totalCount = response.data.count;
                    this.loading = false;
                }
            },
            error: (error) => {
                console.error('Error loading data:', error);
                this.notificationService.error('Məlumatlar yüklənərkən xəta baş verdi');
                this.loading = false;
            }
        });
    }

    trackByFn(index: number, item: ParkingAssignmentListItem): number {
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
        const dialogRef = this.dialog.open(ParkingAssignmentFormComponent, {
            width: '60%',
            maxHeight: '98vh',
            disableClose: true,
            data: {}
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.loadData();
            }
        });
    }

    onEdit(item: ParkingAssignmentListItem): void {
        const dialogRef = this.dialog.open(ParkingAssignmentFormComponent, {
            width: '60%',
            maxHeight: '98vh',
            disableClose: true,
            data: { id: item.id }
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.loadData();
            }
        });
    }

    onDelete(item: ParkingAssignmentListItem): void {
        const message = this.translocoService.translate(
            'modules.parkingAssignments.confirmation.delete.message',
            { person: item.person }
        );

        const confirmation = this.confirmationService.open({
            title: 'modules.parkingAssignments.confirmation.delete.title',
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
                this.parkingAssignmentsService.deleteADeleteParkingAssignmentsparment(item.id).subscribe({
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