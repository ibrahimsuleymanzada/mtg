import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from 'app/core/services/base-api.service';
import { ApiResponse, PaginatedResponse, PaginationRequest } from 'app/core/models/api-response.model';
import { CommercialRentalListItem, CommercialRentalDetail } from 'app/core/models/rental.model';

@Injectable({
    providedIn: 'root'
})
export class CommercialRentalsService extends BaseApiService {
    private readonly endpoints = {
        getAll:  'Complexes/GetAllCommercialRentals',
        getById: 'Complexes/GetAllCommercialRentalById',
        save:    'Complexes/SaveCommersialRental',
        delete:  'Complexes/DeleteCommercialRental'
    };

    getAllCommercialRentals(request: PaginationRequest): Observable<ApiResponse<PaginatedResponse<CommercialRentalListItem>>> {
        return this.getList<CommercialRentalListItem>(this.endpoints.getAll, request);
    }

    getCommercialRentalById(id: number): Observable<ApiResponse<CommercialRentalDetail>> {
        return this.getById<CommercialRentalDetail>(this.endpoints.getById, id);
    }

    // FormData göndəririk - file upload olduğu üçün
    saveCommercialRental(formData: FormData): Observable<ApiResponse<any>> {
        return this.save(this.endpoints.save, formData);
    }

    deleteCommercialRental(id: number): Observable<ApiResponse<any>> {
        return this.delete(this.endpoints.delete, id);
    }
}