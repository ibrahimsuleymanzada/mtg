import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { NotificationService } from 'app/core/services/notification.service';
import { BaseTableService } from 'app/core/services/base-table.service';
import { TABLE_CONFIG } from 'app/core/models/api-response.model';
import { AccessService } from 'app/core/services/access/access.service';
import { GuestVehicleListItem } from 'app/core/models/access/guest-vehicle.types';

@Component({
    selector: 'guest-vehicles',
    standalone: true,
    templateUrl: './guest-vehicles.component.html',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatTableModule,
        MatPaginatorModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        TranslocoModule,
    ],
    providers: [BaseTableService],
})
export class GuestVehiclesComponent implements OnInit, OnDestroy {
    @ViewChild(MatPaginator) paginator: MatPaginator;

    columnConfig: { key: string; labelKey: string; filterable: boolean; type?: string }[] = [
        { key: 'plateNumber',      labelKey: 'modules.guestVehicles.columns.plateNumber',      filterable: true },
        { key: 'guestName',        labelKey: 'modules.guestVehicles.columns.guestName',        filterable: true },
        { key: 'guestPhone',       labelKey: 'modules.guestVehicles.columns.guestPhone',       filterable: false },
        { key: 'parkingSpaceName', labelKey: 'modules.guestVehicles.columns.parkingSpaceName', filterable: true },
        { key: 'vehicleBrand',     labelKey: 'modules.guestVehicles.columns.vehicleBrand',     filterable: false },
        { key: 'startDateTime',    labelKey: 'modules.guestVehicles.columns.startDateTime',    filterable: false, type: 'date' },
        { key: 'endDateTime',      labelKey: 'modules.guestVehicles.columns.endDateTime',      filterable: false, type: 'date' },
        { key: 'status',           labelKey: 'modules.guestVehicles.columns.status',           filterable: false },
        { key: 'requestedByName',  labelKey: 'modules.guestVehicles.columns.requestedByName',  filterable: true },
    ];
    displayedColumns: string[] = [...this.columnConfig.map(c => c.key), 'actions'];

    dataSource = new MatTableDataSource<GuestVehicleListItem>([]);
    totalCount = 0;
    pageSize: number = TABLE_CONFIG.pagination.defaultPageSize;
    pageIndex: number = TABLE_CONFIG.pagination.defaultPageIndex;
    loading = true;

    filterForm: FormGroup;
    statusFilter = '';

    readonly statuses = ['Pending', 'Active', 'Rejected', 'Cancelled', 'Expired'];

    private _unsubscribeAll = new Subject<void>();

    constructor(
        private _fb: FormBuilder,
        private _accessService: AccessService,
        private _confirmationService: FuseConfirmationService,
        private _notificationService: NotificationService,
        private _translocoService: TranslocoService,
        private _baseTableService: BaseTableService,
    ) {}

    ngOnInit(): void {
        this.filterForm = this._baseTableService.createFilterForm(this.displayedColumns);

        this.filterForm.valueChanges.pipe(debounceTime(400), takeUntil(this._unsubscribeAll))
            .subscribe(() => { this.pageIndex = 0; this.loadData(); });

        this.loadData();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    loadData(): void {
        this.loading = true;
        const filters = this._baseTableService.formToFilters(this.filterForm.value);
        if (this.statusFilter) {
            filters.push({ columnName: 'Status', value: this.statusFilter });
        }
        const request = {
            nextPageNumber: this.pageIndex + 1,
            visibleItemCount: this.pageSize,
            filters,
        };
        this._accessService.getAll(request as any).subscribe({
            next: (response) => {
                if (response.status && response.data) {
                    this.dataSource.data = response.data.result;
                    this.totalCount = response.data.count;
                }
                this.loading = false;
            },
            error: () => { this.loading = false; },
        });
    }

    onStatusFilterChange(): void {
        this.pageIndex = 0;
        if (this.paginator) this.paginator.pageIndex = 0;
        this.loadData();
    }

    onPageChange(event: PageEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.loadData();
    }

    clearInput(controlName: string): void {
        this.filterForm.get(controlName)?.reset();
    }

    onApprove(item: GuestVehicleListItem): void {
        const message = this._translocoService.translate(
            'modules.guestVehicles.confirmation.approve.message',
            { plateNumber: item.plateNumber }
        );
        const confirmation = this._confirmationService.open({
            title: 'modules.guestVehicles.confirmation.approve.title',
            message,
            icon: { show: true, name: 'heroicons_outline:check-circle', color: 'success' },
            actions: {
                confirm: { show: true, label: 'modules.guestVehicles.actions.approve', color: 'primary' },
                cancel:  { show: true, label: 'common.actions.cancel' },
            },
            dismissible: true,
        });
        confirmation.afterClosed().subscribe(result => {
            if (result === 'confirmed') {
                this._accessService.approve(item.id).subscribe({
                    next: (response) => {
                        if (response.status) {
                            this._notificationService.success(response.message);
                            this.loadData();
                        } else {
                            this._notificationService.info(response.message);
                        }
                    },
                });
            }
        });
    }

    onReject(item: GuestVehicleListItem): void {
        const message = this._translocoService.translate(
            'modules.guestVehicles.confirmation.reject.message',
            { plateNumber: item.plateNumber }
        );
        const confirmation = this._confirmationService.open({
            title: 'modules.guestVehicles.confirmation.reject.title',
            message,
            icon: { show: true, name: 'heroicons_outline:x-circle', color: 'warn' },
            actions: {
                confirm: { show: true, label: 'modules.guestVehicles.actions.reject', color: 'warn' },
                cancel:  { show: true, label: 'common.actions.cancel' },
            },
            dismissible: true,
        });
        confirmation.afterClosed().subscribe(result => {
            if (result === 'confirmed') {
                this._accessService.reject(item.id).subscribe({
                    next: (response) => {
                        if (response.status) {
                            this._notificationService.success(response.message);
                            this.loadData();
                        } else {
                            this._notificationService.info(response.message);
                        }
                    },
                });
            }
        });
    }
}
