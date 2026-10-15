import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, shareReplay, map, of } from 'rxjs';
import { environment } from 'environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { ComplexDropdown, DropdownItem, SpeCode, TargetDropdownItem } from '../models/dropdown.model';
import { InvoiceAutocompleteItem } from '../models/invoice.model';

@Injectable({
    providedIn: 'root'
})
export class DropdownService {
    private apiUrl = environment.apiUrl;

    // Cache map for speCode results (type → observable)
    private speCodeCache: Map<string, Observable<DropdownItem[]>> = new Map();

    constructor(private http: HttpClient) { }

    // -----------------------------------------------------------------------------------------------------
    // @ SpeCode (Enum / Reference Data)
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get spec codes by type - with caching
     * Usage: getSpecCodeByType('buildingType')
     * URL:   /api/Global/GetSpeCodeByType?type=buildingType
     */
    getSpecCodeByType(type: string): Observable<DropdownItem[]> {
        // Return cached if exists
        if (this.speCodeCache.has(type)) {
            return this.speCodeCache.get(type)!;
        }

        const params = new HttpParams().set('type', type);
        const request$ = this.http
            .get<ApiResponse<SpeCode[]>>(`${this.apiUrl}/Global/GetSpeCodeByType`, { params })
            .pipe(
                map(response => {
                    if (response.status && response.data) {
                        return response.data as any
                    }
                }),
                shareReplay(1) // Cache the result
            );

        this.speCodeCache.set(type, request$);
        return request$;
    }

    /**
     * Clear spec code cache (call when data might have changed)
     */
    clearSpecCodeCache(type?: string): void {
        if (type) {
            this.speCodeCache.delete(type);
        } else {
            this.speCodeCache.clear();
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Complexes Dropdown
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get complexes for dropdown
     * URL: /api/Complexes/GetComplexesDropDown
     */
    getComplexesDropdown(): Observable<DropdownItem[]> {
        return this.http
            .get<ApiResponse<ComplexDropdown[]>>(`${this.apiUrl}/Complexes/GetComplexesDropDown`)
            .pipe(
                map(response => {
                    if (response.status && response.data) {
                        return response.data.map(item => ({
                            key: item.id,
                            value: item.complexName
                        } as DropdownItem));
                    }
                    return [];
                })
            );
    }

    /**
 * Get companies for dropdown
 * URL: /api/Complexes/GetComplexesDropDown
 */
    getCompaniesDropdown(): Observable<DropdownItem[]> {
        return this.http
            .get<ApiResponse<DropdownItem[]>>(`${this.apiUrl}/Complexes/GetAllCompanies`).pipe(map(response => response.data ?? []));
    }

    /**
*  getPaymentCategories for dropdown
* URL: /api/Accounting/getPaymentCategories
*/
    getPaymentCategories(): Observable<DropdownItem[]> {
        return this.http
            .get<ApiResponse<DropdownItem[]>>(`${this.apiUrl}/Accounting/getPaymentCategories`).pipe(map(response => response.data ?? []));
    }

    getComplaintCategoriesDropdown(): Observable<DropdownItem[]> {
        return this.http
            .get<ApiResponse<DropdownItem[]>>(`${this.apiUrl}/Complaints/GetComplaintCategoriesDropdown`).pipe(map(response => response.data ?? []));
    }

    /**
     * Get building autocomplete results
     * URL: /api/Complexes/GetBuildingAutoComplete?filter=...
     */
    getContractorAutocomplete(filter: string): Observable<{ key: number; value: string }[]> {
        if (!filter || filter.trim().length === 0) {
            return of([]);
        }
        const params = new HttpParams().set('filter', filter.trim());
        return this.http
            .get<ApiResponse<{ key: number; value: string }[]>>(
                `${this.apiUrl}/Contractors/GetContractorAutoComplete`,
                { params }
            )
            .pipe(
                map(response => (response.status && response.data) ? response.data : [])
            );
    }

    getBuildingAutocomplete(filter: string, complexId: number = 0): Observable<{ key: number; value: string }[]> {
        if (!filter || filter.trim().length === 0) {
            return of([]);
        }

        let params = new HttpParams().set('filter', filter.trim());

        // ComplexId varsa əlavə et
        if (complexId > 0) {
            params = params.set('complexId', complexId.toString());
        }

        return this.http
            .get<ApiResponse<{ key: number; value: string }[]>>(
                `${this.apiUrl}/Complexes/GetBuildingAutoComplete`,
                { params }
            )
            .pipe(
                map(response => {
                    if (response.status && response.data) {
                        return response.data;
                    }
                    return [];
                })
            );
    }

    getApartmentAutocomplete(filter: string, buildingId: number = 0): Observable<{ key: number; value: string }[]> {
        if (!filter || filter.trim().length === 0) {
            return of([]);
        }

        let params = new HttpParams().set('filter', filter.trim());

        if (buildingId > 0) {
            params = params.set('buildingId', buildingId.toString());
        }
        return this.http
            .get<ApiResponse<{ key: number; value: string }[]>>(
                `${this.apiUrl}/Complexes/GetApartmentsAutoComplete`,
                { params }
            )
            .pipe(
                map(response => {
                    if (response.status && response.data) {
                        return response.data;
                    }
                    return [];
                })
            );
    }

    getUserAutocomplete(filter: string): Observable<{ key: number; value: string }[]> {
        if (!filter || filter.trim().length === 0) {
            return of([]);
        }

        const params = new HttpParams().set('filter', filter.trim());
        return this.http
            .get<ApiResponse<{ key: number; value: string }[]>>(
                `${this.apiUrl}/Global/GetUserAutocomplete`,
                { params }
            )
            .pipe(
                map(response => {
                    if (response.status && response.data) {
                        return response.data;
                    }
                    return [];
                })
            );
    }

    getParkingSpaceAutocomplete(filter: string): Observable<{ key: number; value: string }[]> {
        if (!filter || filter.trim().length === 0) {
            return of([]);
        }

        const params = new HttpParams().set('filter', filter.trim());
        return this.http
            .get<ApiResponse<{ key: number; value: string }[]>>(
                `${this.apiUrl}/Global/GetParkingSpaceAutocomplete`,
                { params }
            )
            .pipe(
                map(response => {
                    if (response.status && response.data) {
                        return response.data;
                    }
                    return [];
                })
            );
    }

    getCommercialSpaceAutoComplete(filter: string, buildingId: number = 0): Observable<{ key: number; value: string }[]> {
        if (!filter || filter.trim().length === 0) {
            return of([]);
        }

        let params = new HttpParams().set('filter', filter.trim());

        if (buildingId > 0) {
            params = params.set('buildingId', buildingId.toString());
        }
        return this.http
            .get<ApiResponse<{ key: number; value: string }[]>>(
                `${this.apiUrl}/Complexes/GetCommercialSpaceAutoComplete`,
                { params }
            )
            .pipe(
                map(response => {
                    if (response.status && response.data) {
                        return response.data;
                    }
                    return [];
                })
            );
    }

    getInvoiceAutocomplete(filter: string): Observable<InvoiceAutocompleteItem[]> {
        if (!filter || filter.trim().length === 0) {
            return of([]);
        }
        const params = new HttpParams().set('filter', filter.trim());
        return this.http
            .get<ApiResponse<InvoiceAutocompleteItem[]>>(
                `${this.apiUrl}/Accounting/GetInvoiceAutoComplete`,
                { params }
            )
            .pipe(
                map(response => {
                    if (response.status && response.data) {
                        return response.data;
                    }
                    return [];
                })
            );
    }

    getTargetDropdown(complexId: number | null, buildingId: number | null, targetType: string): Observable<TargetDropdownItem[]> {
        let params = new HttpParams().set('targetType', targetType);
        if (complexId && complexId > 0) {
            params = params.set('complexId', complexId.toString());
        }
        if (buildingId && buildingId > 0) {
            params = params.set('buildingId', buildingId.toString());
        }
        return this.http
            .get<ApiResponse<TargetDropdownItem[]>>(
                `${this.apiUrl}/Accounting/GetTargetDropdown`,
                { params }
            )
            .pipe(
                map(response => {
                    if (response.status && response.data) {
                        return response.data;
                    }
                    return [];
                })
            );
    }

    GenerateInvoiceNumber(): Observable<string> {
        return this.http
            .get<ApiResponse<string>>(`${this.apiUrl}/Accounting/GenerateInvoiceNumber`).pipe(map(response => response.data ?? ''));
    }

    getApartmentOwnerAutocomplete(filter: string, apartmentId: number = 0): Observable<{ key: number; value: string }[]> {
        if (!filter || filter.trim().length === 0) {
            return of([]);
        }

        let params = new HttpParams().set('filter', filter.trim());
        if (apartmentId > 0) {
            params = params.set('apartmentId', apartmentId.toString());
        }
        return this.http
            .get<ApiResponse<{ key: number; value: string }[]>>(
                `${this.apiUrl}/Complexes/GetApartmentOwnerAutoComplete`,
                { params }
            )
            .pipe(
                map(response => {
                    if (response.status && response.data) {
                        return response.data;
                    }
                    return [];
                })
            );
    }

    getAdvertisingBoardAutocomplete(filter: string): Observable<{ key: number; value: string }[]> {
        if (!filter || filter.trim().length === 0) {
            return of([]);
        }

        const params = new HttpParams().set('filter', filter.trim());
        return this.http
            .get<ApiResponse<{ key: number; value: string }[]>>(
                `${this.apiUrl}/Complexes/GetAdvertisingBoardAutoComplete`,
                { params }
            )
            .pipe(
                map(response => {
                    if (response.status && response.data) {
                        return response.data;
                    }
                    return [];
                })
            );
    }


    getAccessLevelsDropDown(): Observable<{ key: number; value: string }[]> {
        return this.http
            .get<ApiResponse<{ key: number; value: string }[]>>(
                `${this.apiUrl}/Complexes/GetAccessLevelsDropDown`
            )
            .pipe(
                map(response => (response.status && response.data) ? response.data : [])
            );
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Generic Helper (for future dropdowns)
    // -----------------------------------------------------------------------------------------------------

    /**
     * Generic GET dropdown
     * For future endpoints that return {id, name} style lists
     */
    getGenericDropdown(endpoint: string, idKey = 'id', nameKey = 'name'): Observable<DropdownItem[]> {
        return this.http
            .get<ApiResponse<any[]>>(`${this.apiUrl}/${endpoint}`)
            .pipe(
                map(response => {
                    if (response.status && response.data) {
                        return response.data.map(item => ({
                            key: item[idKey],
                            value: item[nameKey]
                        } as DropdownItem));
                    }
                    return [];
                })
            );
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public APIs (no auth required — SelfRegister flow)
    // -----------------------------------------------------------------------------------------------------

    getPublicCompanies(): Observable<DropdownItem[]> {
        return this.http
            .get<ApiResponse<any[]>>(`${this.apiUrl}/Global/GetPublicCompanies`)
            .pipe(map(r => (r.status && r.data) ? r.data.map((i: any) => ({ key: i.id, value: i.companyName } as DropdownItem)) : []));
    }

    getPublicComplexes(companyId: number): Observable<DropdownItem[]> {
        const params = new HttpParams().set('companyId', companyId.toString());
        return this.http
            .get<ApiResponse<any[]>>(`${this.apiUrl}/Global/GetPublicComplexes`, { params })
            .pipe(map(r => (r.status && r.data) ? r.data.map((i: any) => ({ key: i.id, value: i.complexName } as DropdownItem)) : []));
    }

    getPublicBuildings(complexId: number): Observable<DropdownItem[]> {
        const params = new HttpParams().set('complexId', complexId.toString());
        return this.http
            .get<ApiResponse<any[]>>(`${this.apiUrl}/Global/GetPublicBuildings`, { params })
            .pipe(map(r => (r.status && r.data) ? r.data.map((i: any) => ({ key: i.id, value: i.buildingName } as DropdownItem)) : []));
    }

    getPublicApartments(buildingId: number): Observable<DropdownItem[]> {
        const params = new HttpParams().set('buildingId', buildingId.toString());
        return this.http
            .get<ApiResponse<any[]>>(`${this.apiUrl}/Global/GetPublicApartments`, { params })
            .pipe(map(r => (r.status && r.data) ? r.data.map((i: any) => ({ key: i.id, value: i.apartmentNumber ?? i.number ?? String(i.id) } as DropdownItem)) : []));
    }

    getPublicParkingSpaces(buildingId: number): Observable<DropdownItem[]> {
        const params = new HttpParams().set('buildingId', buildingId.toString());
        return this.http
            .get<ApiResponse<any[]>>(`${this.apiUrl}/Global/GetPublicParkingSpaces`, { params })
            .pipe(map(r => (r.status && r.data) ? r.data.map((i: any) => ({ key: i.id, value: i.parkingNumber ?? String(i.id) } as DropdownItem)) : []));
    }

    getPublicCommercialSpaces(buildingId: number): Observable<DropdownItem[]> {
        const params = new HttpParams().set('buildingId', buildingId.toString());
        return this.http
            .get<ApiResponse<any[]>>(`${this.apiUrl}/Global/GetPublicCommercialSpaces`, { params })
            .pipe(map(r => (r.status && r.data) ? r.data.map((i: any) => ({ key: i.id, value: i.spaceNumber ?? String(i.id) } as DropdownItem)) : []));
    }
}