import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { TranslocoModule } from '@ngneat/transloco';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { NotificationService } from 'app/core/services/notification.service';
import { DropdownService } from 'app/core/services/dropdown.service';
import { NgxMaskDirective } from 'ngx-mask';
import { AdvertisingRentalService } from 'app/core/services/complexes/advertising-rental.service';

@Component({
    selector: 'advertising-rental-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatAutocompleteModule,
        MatDatepickerModule,
        MatNativeDateModule,
        TranslocoModule,
        NgxMaskDirective,
    ],
    templateUrl: './advertising-rental-form.component.html'
})
export class AdvertisingRentalFormComponent implements OnInit {
    form!: FormGroup;
    isEdit: boolean = false;
    isLoading: boolean = false;

    // Autocomplete - Advertising Board
    filteredBoards: { key: number; value: string }[] = [];
    boardSearchLoading: boolean = false;
    private boardSearchSubject = new Subject<string>();

    constructor(
        public dialogRef: MatDialogRef<AdvertisingRentalFormComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { id?: number },
        private fb: FormBuilder,
        private advertisingRentalService: AdvertisingRentalService,
        private notificationService: NotificationService,
        private dropdownService: DropdownService
    ) {
        this.isEdit = !!data?.id;
        this.initForm();
    }

    ngOnInit(): void {
        this.setupBoardAutocomplete();

        if (this.isEdit && this.data.id) {
            this.loadData(this.data.id);
        }
    }

    private initForm(): void {
        this.form = this.fb.group({
            id:                [0],
            boardId:           [null, Validators.required],
            location:         ['', Validators.required],
            companyName:       ['',   Validators.required],
            contactPerson:     ['',   Validators.required],
            contactPhone:      ['',   Validators.required],
            monthlyFee:        [null, [ Validators.min(0)]],
            contractStartDate: [null, Validators.required],
            contractEndDate:   [null, Validators.required],
        });
    }

    // ─── ADVERTISING BOARD AUTOCOMPLETE ───
    private setupBoardAutocomplete(): void {
        this.boardSearchSubject
            .pipe(
                debounceTime(400),
                distinctUntilChanged(),
                switchMap(searchTerm => {
                    if (!searchTerm || searchTerm.trim().length < 2) {
                        this.filteredBoards = [];
                        this.boardSearchLoading = false;
                        return [];
                    }
                    this.boardSearchLoading = true;
                    return this.dropdownService.getAdvertisingBoardAutocomplete(searchTerm);
                })
            )
            .subscribe({
                next: (results) => {
                    this.filteredBoards = results;
                    this.boardSearchLoading = false;
                },
                error: () => {
                    this.filteredBoards = [];
                    this.boardSearchLoading = false;
                }
            });
    }

    onBoardSearch(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.form.patchValue({ boardId: null });
        this.boardSearchSubject.next(input.value);
    }

    onBoardSelected(event: MatAutocompleteSelectedEvent): void {
        const selected = this.filteredBoards.find(b => b.value === event.option.value);
        if (selected) {
            this.form.patchValue({ boardId: selected.key, location: selected.value });
        }
    }

    // ─── LOAD DATA (Edit mode) ───
    private loadData(id: number): void {
        this.isLoading = true;
        this.advertisingRentalService.getAdvertisingRentalById(id).subscribe({
            next: (response) => {
                if (response.status && response.data) {
                    const data = response.data[0];
                    this.form.patchValue({
                        ...data,
                        contractStartDate: data.contractStartDate ? new Date(data.contractStartDate) : null,
                        contractEndDate:   data.contractEndDate   ? new Date(data.contractEndDate)   : null,
                    });
                } else {
                    this.notificationService.info(response.message || 'Məlumat tapılmadı');
                }
                this.isLoading = false;
            },
            error: (error) => {
                this.notificationService.error(error?.error?.message || 'Məlumat yüklənərkən xəta baş verdi');
                this.isLoading = false;
            }
        });
    }

    // ─── SAVE ───
    onSave(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const formValue = this.form.getRawValue();

        this.advertisingRentalService.saveAdvertisingRental(formValue).subscribe({
            next: (response) => {
                if (response.status) {
                    this.dialogRef.close(true);
                    this.notificationService.success(response.message);
                } else {
                    this.notificationService.info(response.message);
                }
            }
        });
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }
}