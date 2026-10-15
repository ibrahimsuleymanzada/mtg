import { Component, OnDestroy, OnInit, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { PaginationRequest, TABLE_CONFIG } from 'app/core/models/api-response.model';
import { NotificationService } from 'app/core/services/notification.service';
import { BaseTableService } from 'app/core/services/base-table.service';
import { TranslocoModule } from '@ngneat/transloco';
import { ReportsService } from 'app/core/services/reports/reports.service';
import { MusteriReportItem } from 'app/core/models/reports/reports.types';

@Component({
    selector: 'musteri-report',
    standalone: true,
    templateUrl: './musteri.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule,
        MatTableModule,
        MatPaginatorModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatProgressSpinnerModule,
        ReactiveFormsModule,
        TranslocoModule,
    ],
    providers: [BaseTableService]
})
export class MusteriComponent implements OnInit, OnDestroy {
    @ViewChild(MatPaginator) paginator: MatPaginator;

    columnConfig: { key: string; labelKey: string; filterable: boolean }[] = [
        { key: 'fullName',           labelKey: 'modules.reports.musteri.columns.person',           filterable: true },
        { key: 'apartmentNumber',  labelKey: 'modules.reports.musteri.columns.apartmentNumber',  filterable: true },
        { key: 'complexName',      labelKey: 'common.columns.complexName',                       filterable: true },
        { key: 'totalInvoiced',    labelKey: 'modules.reports.musteri.columns.totalInvoiced',    filterable: false },
        { key: 'totalPaid',        labelKey: 'modules.reports.musteri.columns.totalPaid',        filterable: false },
        { key: 'totalDebt',        labelKey: 'modules.reports.musteri.columns.totalDebt',        filterable: false },
        { key: 'lastPaymentDate',  labelKey: 'modules.reports.musteri.columns.lastPaymentDate',  filterable: false },
    ];

    displayedColumns: string[] = this.columnConfig.map(c => c.key);
    dataSource: MatTableDataSource<MusteriReportItem> = new MatTableDataSource([]);

    readonly TABLE_CONFIG = TABLE_CONFIG;
    totalCount = 0;
    pageSize: number = TABLE_CONFIG.pagination.defaultPageSize;
    pageIndex: number = TABLE_CONFIG.pagination.defaultPageIndex;

    filterForm: FormGroup;
    requestBody: PaginationRequest;
    loading = true;

    private _unsubscribeAll = new Subject<any>();

    constructor(
        private reportsService: ReportsService,
        private notificationService: NotificationService,
        private baseTableService: BaseTableService,
        private _changeDetectorRef: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.requestBody = this.baseTableService.createInitialRequest();
        this.filterForm = this.baseTableService.createFilterForm(this.displayedColumns);
        this.loadData();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    applyFilters(): void {
        this.requestBody.filters = this.baseTableService.formToFilters(this.filterForm.value);
        this.pageIndex = 0;
        this.requestBody.nextPageNumber = 1;
        if (this.paginator) this.paginator.pageIndex = 0;
        this.loadData();
    }

    clearInput(controlName: string): void {
        this.filterForm.get(controlName)?.reset();
        this.applyFilters();
    }

    loadData(): void {
        this.loading = true;
        this.reportsService.getMusteriReport(this.requestBody)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    if (response.status && response.data) {
                        this.dataSource.data = response.data.result;
                        this.totalCount = response.data.count;
                    }
                    this.loading = false;
                    this._changeDetectorRef.markForCheck();
                },
                error: () => {
                    this.notificationService.error('Məlumatlar yüklənərkən xəta baş verdi');
                    this.loading = false;
                    this._changeDetectorRef.markForCheck();
                }
            });
    }

    trackByFn(index: number, item: MusteriReportItem): string {
        return item.person + item.apartmentNumber;
    }

    onPageChange(event: PageEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.requestBody.nextPageNumber = event.pageIndex + 1;
        this.requestBody.visibleItemCount = event.pageSize;
        this.loadData();
    }
}
