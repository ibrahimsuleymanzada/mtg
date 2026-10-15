import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from 'app/core/services/base-api.service';
import { ApiResponse, PaginatedResponse, PaginationRequest } from 'app/core/models/api-response.model';
import { CommercialOwner, CommercialOwnerListItem } from 'app/core/models/commercial-owners.model';

@Injectable({ providedIn: 'root' })
export class CommercialOwnersService extends BaseApiService {
    private readonly endpoints = {
        getAll: 'Complexes/GetAllCommercialOwners',
        getById: 'Complexes/GetCommercialOwnerById',
        save: 'Complexes/SaveCommercialOwner',
        delete: 'Complexes/DeleteCommercialOwner'
    };

    getAllCommercialOwners(request: PaginationRequest): Observable<ApiResponse<PaginatedResponse<CommercialOwnerListItem>>> {
        return this.getList<CommercialOwnerListItem>(this.endpoints.getAll, request);
    }

    getCommercialOwnerById(id: number): Observable<ApiResponse<CommercialOwner>> {
        return this.getById<CommercialOwner>(this.endpoints.getById, id);
    }

    saveCommercialOwner(data: FormData): Observable<ApiResponse<any>> {
        return this.save(this.endpoints.save, data);
    }

    deleteCommercialOwner(id: number): Observable<ApiResponse<any>> {
        return this.delete(this.endpoints.delete, id);
    }
}
