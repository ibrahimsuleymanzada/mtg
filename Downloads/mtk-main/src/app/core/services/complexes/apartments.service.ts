import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from 'app/core/services/base-api.service';
import { ApiResponse, PaginatedResponse, PaginationRequest } from 'app/core/models/api-response.model';
import { Apartment, ApartmentFormData, ApartmentsListItem } from '../../models/apartments.model';

@Injectable({
    providedIn: 'root'
})
export class AparmentService extends BaseApiService {
    private readonly endpoints = {
        getAll: 'Complexes/GetAllApartments',
        getById: 'Complexes/GetAparmentById',
        save: 'Complexes/SaveApartment',
        delete: 'Complexes/DeleteApartment'
    };

    /**
     * Get all complexes with pagination and filters
     */
    getAllAparments(request: PaginationRequest): Observable<ApiResponse<PaginatedResponse<ApartmentsListItem>>> {
        return this.getList<ApartmentsListItem>(this.endpoints.getAll, request);
    }

    /**
     * Get apartment by ID
     */
    getAparmentById(id: number): Observable<ApiResponse<Apartment>> {
        return this.getById<Apartment>(this.endpoints.getById, id);
    }

    /**
     * Save apartment (create or update)
     */
    saveAparment(data: ApartmentFormData): Observable<ApiResponse<any>> {
        return this.save(this.endpoints.save, data);
    }

    /**
     * Delete apartment
     */
    deleteAparment(id: number): Observable<ApiResponse<any>> {
        return this.delete(this.endpoints.delete, id);
    }
}