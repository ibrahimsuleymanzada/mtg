import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from 'app/core/services/base-api.service';
import { Complex, ComplexListItem, ComplexFormData } from 'app/core/models/complex.model';
import { ApiResponse, PaginatedResponse, PaginationRequest } from 'app/core/models/api-response.model';
import { Building, BuildingsFormData, BuildingsListItem } from '../../models/buildings.model';

@Injectable({
    providedIn: 'root'
})
export class BuildingsService extends BaseApiService {
    private readonly endpoints = {
        getAll: 'Complexes/GetAllBuildings',
        getById: 'Complexes/GetBuildingById',
        save: 'Complexes/SaveBuilding',
        delete: 'Complexes/DeleteBuilding'
    };

    /**
     * Get all buildings with pagination and filters
     */
    getAllBuildings(request: PaginationRequest): Observable<ApiResponse<PaginatedResponse<BuildingsListItem>>> {
        return this.getList<BuildingsListItem>(this.endpoints.getAll, request);
    }

    /**
     * Get building by ID
     */
    getBuildingById(id: number): Observable<ApiResponse<Building>> {
        return this.getById<Building>(this.endpoints.getById, id);
    }

    /**
     * Save building (create or update)
     */
    saveBuilding(data: BuildingsFormData): Observable<ApiResponse<any>> {
        return this.save(this.endpoints.save, data);
    }

    /**
     * Delete building  
     */
    deleteBuilding(id: number): Observable<ApiResponse<any>> {
        return this.delete(this.endpoints.delete, id);
    }
}