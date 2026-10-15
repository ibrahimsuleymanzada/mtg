import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from 'app/core/services/base-api.service';
import { ApiResponse, PaginatedResponse, PaginationRequest } from 'app/core/models/api-response.model';

export interface AdvertisingBoardListItem {
    id: number;
    complexName: string;
    buildingName: string;
    location: string;
    boardSize: string;
    description: string;
    monthlyPrice: number;
    status: string;
}

export interface AdvertisingBoard {
    id: number;
    complexId: number;
    complexName: string;
    buildingId: number;
    buildingName: string;
    location: string;
    boardSize: string;
    description: string;
    monthlyPrice: number;
}

export interface AdvertisingBoardFormData {
    id: number;
    complexId: number;
    buildingId: number;
    location: string;
    boardSize: string;
    description: string;
    monthlyPrice: number;
}

@Injectable({
    providedIn: 'root'
})
export class AdvertisingBoardsService extends BaseApiService {
    private readonly endpoints = {
        getAll: 'Complexes/GetAllAdvertisingBoards',
        getById: 'Complexes/GetAdvertisingBoardById',
        save: 'Complexes/SaveAdvertisingBoard',
        delete: 'Complexes/DeleteAdvertisingBoard'
    };

    getAllAdvertisingBoards(request: PaginationRequest): Observable<ApiResponse<PaginatedResponse<AdvertisingBoardListItem>>> {
        return this.getList<AdvertisingBoardListItem>(this.endpoints.getAll, request);
    }

    getAdvertisingBoardById(id: number): Observable<ApiResponse<AdvertisingBoard>> {
        return this.getById<AdvertisingBoard>(this.endpoints.getById, id);
    }

    saveAdvertisingBoard(data: AdvertisingBoardFormData): Observable<ApiResponse<any>> {
        return this.save(this.endpoints.save, data);
    }

    deleteAdvertisingBoard(id: number): Observable<ApiResponse<any>> {
        return this.delete(this.endpoints.delete, id);
    }
}