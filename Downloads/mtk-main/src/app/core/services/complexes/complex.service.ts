import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from 'app/core/services/base-api.service';
import { Complex, ComplexListItem, ComplexFormData } from 'app/core/models/complex.model';
import { ApiResponse, PaginatedResponse, PaginationRequest } from 'app/core/models/api-response.model';

@Injectable({
    providedIn: 'root'
})
export class ComplexService extends BaseApiService {
    private readonly endpoints = {
        getAll: 'Complexes/GetAllComplexes',
        getById: 'Complexes/GetComplexById',
        save: 'Complexes/SaveComplexes',
        delete: 'Complexes/DeleteComplex'
    };

    /**
     * Get all complexes with pagination and filters
     */
    getAllComplexes(request: PaginationRequest): Observable<ApiResponse<PaginatedResponse<ComplexListItem>>> {
        return this.getList<ComplexListItem>(this.endpoints.getAll, request);
    }

    /**
     * Get complex by ID
     */
    getComplexById(id: number): Observable<ApiResponse<Complex>> {
        return this.getById<Complex>(this.endpoints.getById, id);
    }

    /**
     * Save complex (create or update)
     */
    saveComplex(data: ComplexFormData): Observable<ApiResponse<any>> {
        return this.save(this.endpoints.save, data);
    }

    /**
     * Delete complex
     */
    deleteComplex(id: number): Observable<ApiResponse<any>> {
        return this.delete(this.endpoints.delete, id);
    }
}