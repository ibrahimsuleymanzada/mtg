import { Component, OnDestroy, OnInit, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
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
import { BorcluMusteriReportItem } from 'app/core/models/reports/reports.types';

@Component({
    selector: 'borclu-musteri',
    standalone: true,
    templateUrl: './borclu-musteri.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule,
        MatTableModule,
        MatPaginatorModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatProgressSpinnerModule,
        ReactiveFormsModule,
        TranslocoModule,
    ],
    providers: [BaseTableService]
})
export class BorcluMusteriComponent implements OnInit, OnDestroy {
    @ViewChild(MatPaginator) paginator: MatPaginator;

    columnConfig: { key: string; labelKey: string; filterable: boolean }[] = [
        { key: 'person', labelKey: 'modules.reports.borcluMusteri.columns.person', filterable: true },
        { key: 'apartmentNumber', labelKey: 'modules.reports.borcluMusteri.columns.apartmentNumber', filterable: true },
        { key: 'complexName', labelKey: 'common.columns.complexName', filterable: true },
        { key: 'totalDebt', labelKey: 'modules.reports.borcluMusteri.columns.totalDebt', filterable: false },
        { key: 'overdueInvoiceCount', labelKey: 'modules.reports.borcluMusteri.columns.overdueInvoiceCount', filterable: false },
    ];

    displayedColumns: string[] = this.columnConfig.map(c => c.key);
    dataSource: MatTableDataSource<BorcluMusteriReportItem> = new MatTableDataSource([]);

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
        this.reportsService.getBorcluMusteriReport(this.requestBody)
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

    trackByFn(index: number, item: BorcluMusteriReportItem): string {
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
