import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from 'app/core/services/base-api.service';
import { ApiResponse, PaginatedResponse, PaginationRequest } from 'app/core/models/api-response.model';
import { ApartmentOwner, ApartmentOwnerFormData, ApartmentOwnerListItem } from '../../models/apartment-owners.model';

@Injectable({
    providedIn: 'root'
})
export class ApartmentOwnersService extends BaseApiService {
    private readonly endpoints = {
        getAll: 'Complexes/GetAllApartmentOwner',
        getById: 'Complexes/GetApartmentOwnerById',
        save: 'Complexes/SaveApartmentOwner',
        delete: 'Complexes/DeleteAparmentOwner'
    };

    /**
     * Get all complexes with pagination and filters
     */
    getAllApartmentOwner(request: PaginationRequest): Observable<ApiResponse<PaginatedResponse<ApartmentOwnerListItem>>> {
        return this.getList<ApartmentOwnerListItem>(this.endpoints.getAll, request);
    }

    /**
     * Get apartment by ID
     */
    getApartmentOwnerById(id: number): Observable<ApiResponse<ApartmentOwner>> {
        return this.getById<ApartmentOwner>(this.endpoints.getById, id);
    }

    /**
     * Save apartment (create or update)
     */
    saveApartmentOwner(data: FormData): Observable<ApiResponse<any>> {
        return this.save(this.endpoints.save, data);
    }

    /**
     * Delete apartment
     */
    deleteApartmentOwnerparment(id: number): Observable<ApiResponse<any>> {
        return this.delete(this.endpoints.delete, id);
    }
}