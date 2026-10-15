import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from 'app/core/services/base-api.service';
import { ApiResponse, PaginatedResponse, PaginationRequest } from 'app/core/models/api-response.model';
import { ParkingListItem, Parking } from 'app/core/models/parking.model';

@Injectable({
    providedIn: 'root'
})
export class ParkingsService extends BaseApiService {
    private readonly endpoints = {
        getAll: 'Complexes/GetAllParkingSpaces',
        getById: 'Complexes/GetParkingSalesById',
        save: 'Complexes/SaveParkingSpace',
        delete: 'Complexes/DeleteParkingSpace'
    };

    /**
     * Get all parking with pagination and filters
     */
    getAllParking(request: PaginationRequest): Observable<ApiResponse<PaginatedResponse<ParkingListItem>>> {
        return this.getList<ParkingListItem>(this.endpoints.getAll, request);
    }

    /**
     * Get parking by ID
     */
    getParkingById(id: number): Observable<ApiResponse<Parking>> {
        return this.getById<Parking>(this.endpoints.getById, id);
    }

    /**
     * Save parking (create or update)
     */
    saveParking(data: FormData): Observable<ApiResponse<any>> {
        return this.save(this.endpoints.save, data);
    }

    /**
     * Delete parking
     */
    deleteADeleteParkingparment(id: number): Observable<ApiResponse<any>> {
        return this.delete(this.endpoints.delete, id);
    }
}