import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { NotificationService } from 'app/core/services/notification.service';
import { DropdownService } from 'app/core/services/dropdown.service';
import { ResidentsService } from 'app/core/services/users/residents.service';
import { Resident } from 'app/core/models/users/resident.types';
import { ResidentFormDialogComponent } from './resident-form-dialog/resident-form-dialog.component';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';

@Component({
    selector: 'residents',
    standalone: true,
    templateUrl: './residents.component.html',
    imports: [
        CommonModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        MatAutocompleteModule,
        ReactiveFormsModule,
        TranslocoModule,
    ]
})
export class ResidentsComponent implements OnInit, OnDestroy {
    columnConfig: { key: string; labelKey: string; type?: string }[] = [
        { key: 'fullName', labelKey: 'modules.residents.columns.fullName' },
        { key: 'phone', labelKey: 'modules.residents.columns.phone' },
        { key: 'dateOfBirth', labelKey: 'modules.residents.columns.dateOfBirth' },
        { key: 'isRegistered', labelKey: 'modules.residents.columns.isRegistered', type: 'boolean' },
        { key: 'moveInDate', labelKey: 'modules.residents.columns.moveInDate' },
        { key: 'moveOutDate', labelKey: 'modules.residents.columns.moveOutDate' },
        { key: 'isActive', labelKey: 'modules.residents.columns.isActive', type: 'boolean' },
        { key: 'actions', labelKey: 'common.columns.actions' },
    ];

    displayedColumns: string[] = this.columnConfig.map(c => c.key);
    dataSource: MatTableDataSource<Resident> = new MatTableDataSource([]);
    loading = false;
    selectedApartmentId: number | null = null;
    selectedApartmentName: string | null = null;

    apartmentControl = new FormControl('');
    filteredApartments: { key: number; value: string }[] = [];
    apartmentSearchLoading = false;

    private _unsubscribeAll = new Subject<void>();

    constructor(
        private residentsService: ResidentsService,
        private dialog: MatDialog,
        private confirmationService: FuseConfirmationService,
        private notificationService: NotificationService,
        private dropdownService: DropdownService,
        private _translocoService: TranslocoService
    ) {}

    ngOnInit(): void {
        this.apartmentControl.valueChanges.pipe(
            debounceTime(400),
            distinctUntilChanged(),
            switchMap(term => {
                if (!term || term.trim().length < 2) {
                    this.filteredApartments = [];
                    this.apartmentSearchLoading = false;
                    return [];
                }
                this.apartmentSearchLoading = true;
                return this.dropdownService.getApartmentAutocomplete(term);
            }),
            takeUntil(this._unsubscribeAll)
        ).subscribe({
            next: (results) => { this.filteredApartments = results; this.apartmentSearchLoading = false; },
            error: () => { this.filteredApartments = []; this.apartmentSearchLoading = false; }
        });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    onApartmentSelected(event: MatAutocompleteSelectedEvent): void {
        const item = this.filteredApartments.find(a => a.value === event.option.value);
        if (item) {
            this.selectedApartmentId = item.key;
            this.selectedApartmentName = item.value;
            this.loadData();
        }
    }

    clearApartment(): void {
        this.apartmentControl.setValue('');
        this.selectedApartmentId = null;
        this.dataSource.data = [];
        this.filteredApartments = [];
    }

    loadData(): void {
        if (!this.selectedApartmentId) return;
        this.loading = true;
        this.residentsService.getResidentsByApartmentId(this.selectedApartmentId).subscribe({
            next: (response) => {
                if (response.status && response.data) {
                    this.dataSource.data = response.data;
                }
                this.loading = false;
            },
            error: () => {
                this.notificationService.error('Məlumatlar yüklənərkən xəta baş verdi');
                this.loading = false;
            }
        });
    }

    trackByFn(index: number, item: Resident): number {
        return item.id;
    }

    onCreate(): void {
        const dialogRef = this.dialog.open(ResidentFormDialogComponent, {
            width: '60%',
            maxHeight: '98vh',
            disableClose: true,
            data: { apartmentId: this.selectedApartmentId }
        });
        dialogRef.afterClosed().subscribe(result => { if (result) this.loadData(); });
    }

    onEdit(item: Resident): void {
        const dialogRef = this.dialog.open(ResidentFormDialogComponent, {
            width: '60%',
            maxHeight: '98vh',
            disableClose: true,
            data: { residentId: item.id, apartmentId: item.apartmentId, apartmentName: this.selectedApartmentName }
        });
        dialogRef.afterClosed().subscribe(result => { if (result) this.loadData(); });
    }

    onDelete(item: Resident): void {
        const message = this._translocoService.translate(
            'modules.residents.confirmation.delete.message',
            { fullName: item.fullName }
        );
        const confirmation = this.confirmationService.open({
            title: 'modules.residents.confirmation.delete.title',
            message,
            icon: { show: true, name: 'heroicons_outline:exclamation-triangle', color: 'warn' },
            actions: {
                confirm: { show: true, label: 'common.actions.delete', color: 'warn' },
                cancel: { show: true, label: 'common.actions.cancel' }
            },
            dismissible: true
        });
        confirmation.afterClosed().subscribe(result => {
            if (result === 'confirmed') {
                this.residentsService.deleteResident(item.id).subscribe({
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
