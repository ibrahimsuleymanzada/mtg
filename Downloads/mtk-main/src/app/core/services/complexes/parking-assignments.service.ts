import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from 'app/core/services/base-api.service';
import { ApiResponse, PaginatedResponse, PaginationRequest } from 'app/core/models/api-response.model';
import { ParkingListItem, Parking } from 'app/core/models/parking.model';
import { ParkingAssignment, ParkingAssignmentListItem } from 'app/core/models/parking-assignments.types';

@Injectable({
    providedIn: 'root'
})
export class ParkingAssignmentsService extends BaseApiService {
    private readonly endpoints = {
        getAll: 'Complexes/GetAllParkingAssignments',
        getById: 'Complexes/GetParkingAssignmentById',
        save: 'Complexes/SaveParkingAssignment',
        delete: 'Complexes/DeleteParkingAssignment'
    };

    /**
     * Get all parking with pagination and filters
     */
    getAllParkingAssignments(request: PaginationRequest): Observable<ApiResponse<PaginatedResponse<ParkingAssignmentListItem>>> {
        return this.getList<ParkingAssignmentListItem>(this.endpoints.getAll, request);
    }

    /**
     * Get parking by ID
     */
    getParkingAssignmentsById(id: number): Observable<ApiResponse<ParkingAssignment>> {
        return this.getById<ParkingAssignment>(this.endpoints.getById, id);
    }

    /**
     * Save parking (create or update)
     */
    saveParkingAssignments(data: FormData): Observable<ApiResponse<any>> {
        return this.save(this.endpoints.save, data);
    }

    /**
     * Delete parking
     */
    deleteADeleteParkingAssignmentsparment(id: number): Observable<ApiResponse<any>> {
        return this.delete(this.endpoints.delete, id);
    }
}