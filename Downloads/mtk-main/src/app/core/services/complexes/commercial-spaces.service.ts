import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from 'app/core/services/base-api.service';
import { ApiResponse, PaginatedResponse, PaginationRequest } from 'app/core/models/api-response.model';
import { CommercialSpaceListItem } from 'app/core/models/commercial-spaces.model';

@Injectable({
    providedIn: 'root'
})
export class CommercialSpacesService extends BaseApiService {
    private readonly endpoints = {
        getAll: 'Complexes/GetAllCommercialSpaces',
        getById: 'Complexes/GetCommercialSpaceById',
        save: 'Complexes/SaveCommersialSpace',
        delete: 'Complexes/DeleteCommercialSpace'
    };

    /**
     * Get all commercial spaces with pagination and filters
     */
    getAllCommercialSpaces(request: PaginationRequest): Observable<ApiResponse<PaginatedResponse<CommercialSpaceListItem>>> {
        return this.getList<CommercialSpaceListItem>(this.endpoints.getAll, request);
    }

    /**
     * Get commercial space by ID
     */
    getCommercialSpaceById(id: number): Observable<ApiResponse<CommercialSpaceListItem>> {
        return this.getById<CommercialSpaceListItem>(this.endpoints.getById, id);
    }

    /**
     * Save commercial space (create or update)
     */
    saveCommercialSpace(data: any): Observable<ApiResponse<any>> {
        return this.save(this.endpoints.save, data);
    }

    /**
     * Delete commercial space
     */
    deleteCommercialSpace(id: number): Observable<ApiResponse<any>> {
        return this.delete(this.endpoints.delete, id);
    }
}