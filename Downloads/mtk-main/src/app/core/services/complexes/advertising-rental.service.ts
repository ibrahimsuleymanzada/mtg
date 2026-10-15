import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from 'app/core/services/base-api.service';
import { ApiResponse, PaginatedResponse, PaginationRequest } from 'app/core/models/api-response.model';

export interface AdvertisingRentalListItem {
    id: number;
    location: string;
    companyName: string;
    contactPerson: string;
    contactPhone: string;
    monthlyFee: number;
    contractStartDate: string;
    contractEndDate: string;
}

export interface AdvertisingRental {
    id: number;
    boardId: number;
    boardName: string;
    location: string;
    companyName: string;
    contactPerson: string;
    contactPhone: string;
    monthlyFee: number;
    contractStartDate: string;
    contractEndDate: string;
}

export interface AdvertisingRentalFormData {
    id: number;
    boardId: number;
    companyName: string;
    contactPerson: string;
    contactPhone: string;
    monthlyFee: number;
    contractStartDate: string;
    contractEndDate: string;
}

@Injectable({
    providedIn: 'root'
})
export class AdvertisingRentalService extends BaseApiService {
    private readonly endpoints = {
        getAll:   'Complexes/GetAllAdvertisingRental',
        getById:  'Complexes/GetAdvertisingRentalById',
        save:     'Complexes/SaveAdvertisingRental',
        delete:   'Complexes/DeleteAdvertisingRental'
    };

    getAllAdvertisingRentals(request: PaginationRequest): Observable<ApiResponse<PaginatedResponse<AdvertisingRentalListItem>>> {
        return this.getList<AdvertisingRentalListItem>(this.endpoints.getAll, request);
    }

    getAdvertisingRentalById(id: number): Observable<ApiResponse<AdvertisingRental>> {
        return this.getById<AdvertisingRental>(this.endpoints.getById, id);
    }

    saveAdvertisingRental(data: AdvertisingRentalFormData): Observable<ApiResponse<any>> {
        return this.save(this.endpoints.save, data);
    }

    deleteAdvertisingRental(id: number): Observable<ApiResponse<any>> {
        return this.delete(this.endpoints.delete, id);
    }
}