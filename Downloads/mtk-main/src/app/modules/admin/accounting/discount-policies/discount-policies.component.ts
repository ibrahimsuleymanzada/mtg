import { Component, OnDestroy, OnInit, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { PaginationRequest, TABLE_CONFIG } from 'app/core/models/api-response.model';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { NotificationService } from 'app/core/services/notification.service';
import { BaseTableService } from 'app/core/services/base-table.service';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { DiscountPoliciesService } from 'app/core/services/accounting/discount-policies.service';
import { DiscountPolicyListItem } from 'app/core/models/accounting/discount-policy.types';
import { DiscountPolicyFormDialogComponent } from './discount-policy-form-dialog/discount-policy-form-dialog.component';

@Component({
    selector: 'discount-policies',
    standalone: true,
    templateUrl: './discount-policies.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
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
        FormsModule,
        TranslocoModule
    ],
    providers: [BaseTableService]
})
export class DiscountPoliciesComponent implements OnInit, OnDestroy {
    @ViewChild(MatPaginator) paginator: MatPaginator;

    columnConfig: { key: string; labelKey: string; filterable: boolean; type?: string }[] = [
        { key: 'person',       labelKey: 'modules.accounting.discountPolicies.columns.person',       filterable: true },
        { key: 'targetType',   labelKey: 'modules.accounting.discountPolicies.columns.targetType',   filterable: true },
        { key: 'discountType', labelKey: 'modules.accounting.discountPolicies.columns.discountType', filterable: true },
        { key: 'discountValue',labelKey: 'modules.accounting.discountPolicies.columns.discountValue',filterable: true },
        { key: 'validFrom',    labelKey: 'modules.accounting.discountPolicies.columns.validFrom',    filterable: true },
        { key: 'validTo',      labelKey: 'modules.accounting.discountPolicies.columns.validTo',      filterable: true },
        { key: 'actions',      labelKey: 'common.columns.actions',                                   filterable: false },
    ];

    displayedColumns: string[] = this.columnConfig.map(c => c.key);
    dataSource: MatTableDataSource<DiscountPolicyListItem> = new MatTableDataSource<DiscountPolicyListItem>([]);

    readonly TABLE_CONFIG = TABLE_CONFIG;
    totalCount: number = 0;
    pageSize: number = TABLE_CONFIG.pagination.defaultPageSize;
    pageIndex: number = TABLE_CONFIG.pagination.defaultPageIndex;

    filterForm: FormGroup;
    requestBody: PaginationRequest;
    loading: boolean = true;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private discountPoliciesService: DiscountPoliciesService,
        private dialog: MatDialog,
        private confirmationService: FuseConfirmationService,
        private notificationService: NotificationService,
        private baseTableService: BaseTableService,
        private _translocoService: TranslocoService,
        private _changeDetectorRef: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.requestBody = this.baseTableService.createInitialRequest();
        this.filterForm = this.baseTableService.createFilterForm(this.displayedColumns);
        this.loadDiscountPolicies();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    applyFilters(): void {
        this.requestBody.filters = this.baseTableService.formToFilters(this.filterForm.value);
        this.pageIndex = 0;
        this.requestBody.nextPageNumber = 1;
        if (this.paginator) { this.paginator.pageIndex = 0; }
        this.loadDiscountPolicies();
    }

    clearInput(controlName: string): void {
        this.filterForm.get(controlName)?.reset();
        this.applyFilters();
    }

    loadDiscountPolicies(): void {
        this.loading = true;
        this.discountPoliciesService.getAllDiscountPolicies(this.requestBody)
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

    trackByFn(index: number, item: DiscountPolicyListItem): number {
        return item.id;
    }

    onPageChange(event: PageEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.requestBody.nextPageNumber = event.pageIndex + 1;
        this.requestBody.visibleItemCount = event.pageSize;
        this.loadDiscountPolicies();
    }

    onCreate(): void {
        const dialogRef = this.dialog.open(DiscountPolicyFormDialogComponent, {
            width: '60%',
            maxHeight: '98vh',
            disableClose: true,
            data: {}
        });
        dialogRef.afterClosed().subscribe((result) => {
            if (result) { this.loadDiscountPolicies(); }
        });
    }

    onEdit(item: DiscountPolicyListItem): void {
        const dialogRef = this.dialog.open(DiscountPolicyFormDialogComponent, {
            width: '60%',
            maxHeight: '98vh',
            disableClose: true,
            data: { policyId: item.id }
        });
        dialogRef.afterClosed().subscribe((result) => {
            if (result) { this.loadDiscountPolicies(); }
        });
    }

    onDelete(item: DiscountPolicyListItem): void {
        const message = this._translocoService.translate(
            'modules.accounting.discountPolicies.confirmation.delete.message',
            { person: item.person }
        );
        const confirmation = this.confirmationService.open({
            title: 'modules.accounting.discountPolicies.confirmation.delete.title',
            message,
            icon: { show: true, name: 'heroicons_outline:exclamation-triangle', color: 'warn' },
            actions: {
                confirm: { show: true, label: 'common.actions.delete', color: 'warn' },
                cancel: { show: true, label: 'common.actions.cancel' }
            },
            dismissible: true
        });

        confirmation.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                this.discountPoliciesService.deleteDiscountPolicy(item.id).subscribe({
                    next: (response) => {
                        if (response.status) {
                            this.loadDiscountPolicies();
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
