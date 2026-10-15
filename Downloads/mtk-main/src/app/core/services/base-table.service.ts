import { Injectable } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PaginationRequest, TABLE_CONFIG, TableFilter } from '../models/api-response.model';
import { DateTime } from 'luxon';

@Injectable({
    providedIn: 'root' // ✅ providers: [] lazım deyil
})
export class BaseTableService {
    constructor(private fb: FormBuilder) { }

    /**
     * Filter formu yaradır
     * @param displayedColumns - Table-ın kolonları
     */
    createFilterForm(displayedColumns: string[]): FormGroup {
        const formControls = {};

        // 'actions' kimi filter olunmayan kolonları çıxarırıq
        const filterableColumns = displayedColumns.filter(col => col !== 'actions');

        filterableColumns.forEach(column => {
            formControls[column] = [''];
        });

        return this.fb.group(formControls);
    }

    /**
     * Date range formu yaradır (hər iki tarix required + validation)
     */
    createDateRangeForm(): FormGroup {
        const today = DateTime.now();
        const oneMonthAgo = today.minus({ months: 1 });

        return this.fb.group({
            beginDate: [oneMonthAgo, Validators.required],
            endDate: [today, Validators.required]
        }, {
            validators: this.dateRangeValidator()
        });
    }

    /**
     * Custom validator: StartDate EndDate-dən əvvəl olmalıdır
     */
    private dateRangeValidator(): ValidatorFn {
        return (formGroup: AbstractControl): ValidationErrors | null => {
            const beginDate = formGroup.get('beginDate')?.value;
            const endDate = formGroup.get('endDate')?.value;

            if (!beginDate || !endDate) {
                return null; // Hər ikisi seçilməyibsə validation keç
            }

            const begin = new Date(beginDate);
            const end = new Date(endDate);

            if (begin > end) {
                return { dateRangeInvalid: true };
            }

            return null;
        };
    }

    /**
     * Form dəyərlərini API filter formatına çevirir
     */
    formToFilters(formValue: any): TableFilter[] {
        const filters: TableFilter[] = [];

        Object.keys(formValue).forEach(key => {
            const value = formValue[key];
            // Boş olmayan dəyərləri əlavə edirik
            if (value && value.trim()) {
                filters.push({
                    columnName: key,
                    value: value.trim()
                });
            }
        });

        return filters;
    }

    /**
     * İlkin request body yaradır
     */
    createInitialRequest(): PaginationRequest {
        return {
            nextPageNumber: 1,
            visibleItemCount: TABLE_CONFIG.pagination.defaultPageSize,
            filters: []
        };
    }

    /**
     * Date range-i request body-ə əlavə edir
     */
    addDateRangeToRequest(
        request: PaginationRequest,
        beginDate: string | Date | any,
        endDate: string | Date | any
    ): PaginationRequest {
        if (!beginDate || !endDate) {
            const { beginDate: _, endDate: __, ...rest } = request;
            return rest;
        }

        const formatDate = (date: string | Date | any): string => {
            if (typeof date === 'string') {
                return date.split('T')[0];
            }

            // Luxon DateTime obyekti (Material Datepicker istifadə edir)
            if (date && date.toISODate) {
                return date.toISODate(); // "2026-02-10"
            }

            // Native Date obyekti
            if (date instanceof Date) {
                return date.toISOString().split('T')[0];
            }

            return '';
        };

        return {
            ...request,
            beginDate: formatDate(beginDate),
            endDate: formatDate(endDate)
        };
    }
}