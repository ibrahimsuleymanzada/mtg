import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from 'app/core/services/base-api.service';
import { ApiResponse, PaginatedResponse, PaginationRequest } from 'app/core/models/api-response.model';
import { Tenant, TenantListItem } from '../../models/apartment-tenants.model';

@Injectable({
    providedIn: 'root'
})
export class ApartmentTenantsService extends BaseApiService {
    private readonly endpoints = {
        getAll: 'Complexes/GetAllTenants',
        getById: 'Complexes/GetTenantById',
        save: 'Complexes/SaveTenant',
        delete: 'Complexes/DeleteTenant'
    };

    getAllTenants(request: PaginationRequest): Observable<ApiResponse<PaginatedResponse<TenantListItem>>> {
        return this.getList<TenantListItem>(this.endpoints.getAll, request);
    }

    getTenantById(id: number): Observable<ApiResponse<Tenant>> {
        return this.getById<Tenant>(this.endpoints.getById, id);
    }

    saveTenant(data: FormData): Observable<ApiResponse<any>> {
        return this.save(this.endpoints.save, data);
    }

    deleteTenant(id: number): Observable<ApiResponse<any>> {
        return this.delete(this.endpoints.delete, id);
    }
}
