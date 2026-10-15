import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { FuseNavigationItem } from '@fuse/components/navigation';
import { TranslocoService } from '@ngneat/transloco';
import { Navigation } from 'app/core/navigation/navigation.types';
import { environment } from 'environments/environment';
import { Observable, of, ReplaySubject, skip, Subject, takeUntil, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NavigationService {
    private _httpClient = inject(HttpClient);
    private _navigation: ReplaySubject<Navigation> = new ReplaySubject<Navigation>(1);
    private _router = inject(Router);
    private readonly API_URL = environment.apiUrl;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    constructor(private _translocoService: TranslocoService,) {
        this._translocoService.langChanges$
            .pipe(
                skip(2),
                takeUntil(this._unsubscribeAll)
            )
            .subscribe(() => {
                this.reloadNavigation();
            });
    }
    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for navigation
     */
    get navigation$(): Observable<Navigation> {
        return this._navigation.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get all navigation data
     */

    reloadNavigation(): void {
    const moduleCode = localStorage.getItem('selectedModuleCode');
    if (!moduleCode) return;

    this._httpClient.get<any>(`${this.API_URL}/Global/GetMenus/${moduleCode}`)
        .subscribe((response) => {
            if (response.status && response.data) {
                const navigation = this.transformToNavigation(response.data);
                this._navigation.next(navigation); // ← Bütün component-lər yenilənir!
            }
        });
}

    get(): Observable<Navigation> {

        let moduleCode = localStorage.getItem('selectedModuleCode');

        if (!moduleCode) {
            this._router.navigateByUrl('/modules');
        }

        return this._httpClient.get<any>(`${this.API_URL}/Global/GetMenus/${moduleCode}`).pipe(
            tap((response) => {
                if (response.status && response.data) {
                    const navigation = this.transformToNavigation(response.data);
                    this._navigation.next(navigation);
                } else {
                    console.error('Navigation data yüklənmədi:', response.message);
                }
            }),
        );
    }

    /**
     * API response-u Navigation formatına çevirir
     */
    private transformToNavigation(menuData: FuseNavigationItem[]): Navigation {
        // Link-ləri düzəldirik - əvvəlinə /modules əlavə edirik
        // const updatedMenuData = this.addModulePrefixToLinks(menuData);

        return {
            compact: menuData,
            default: menuData,
            futuristic: menuData,
            horizontal: menuData
        };
    }

}

