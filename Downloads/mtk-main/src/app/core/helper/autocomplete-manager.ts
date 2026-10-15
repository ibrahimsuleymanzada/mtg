import { Subject, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

export class AutocompleteManager<T = { key: number; value: string }> {
    filteredItems: T[] = [];
    loading: boolean = false;
    private searchSubject = new Subject<string>();

    constructor(
        private searchFn: (term: string, ...params: any[]) => Observable<T[]>,
        private minLength: number = 2
    ) {
        this.setupSearch();
    }

    private setupSearch(): void {
        this.searchSubject
            .pipe(
                debounceTime(400),
                distinctUntilChanged(),
                switchMap(searchTerm => {
                    if (!searchTerm || searchTerm.trim().length < this.minLength) {
                        this.filteredItems = [];
                        this.loading = false;
                        return [];
                    }

                    this.loading = true;
                    return this.searchFn(searchTerm);
                })
            )
            .subscribe({
                next: (results) => {
                    this.filteredItems = results;
                    this.loading = false;
                },
                error: () => {
                    this.filteredItems = [];
                    this.loading = false;
                }
            });
    }

    search(term: string): void {
        this.searchSubject.next(term);
    }

    clear(): void {
        this.filteredItems = [];
        this.loading = false;
    }

    destroy(): void {
        this.searchSubject.complete();
    }
}