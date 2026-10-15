import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from 'app/core/services/base-api.service';
import { ApiResponse } from 'app/core/models/api-response.model';
import { Resident, ResidentFormData } from 'app/core/models/users/resident.types';

@Injectable({
    providedIn: 'root'
})
export class ResidentsService extends BaseApiService {
    private readonly endpoints = {
        getByApartment: 'Users/GetResidentsByApartmentId',
        save: 'Users/SaveResident',
        delete: 'Users/DeleteResident',
    };

    getResidentsByApartmentId(apartmentId: number): Observable<ApiResponse<Resident[]>> {
        const params = new HttpParams().set('apartmentId', apartmentId.toString());
        return this.http.get<ApiResponse<Resident[]>>(`${this.apiUrl}/${this.endpoints.getByApartment}`, { params });
    }

    saveResident(data: ResidentFormData): Observable<ApiResponse<any>> {
        return this.save(this.endpoints.save, data);
    }

    deleteResident(id: number): Observable<ApiResponse<any>> {
        return this.delete(this.endpoints.delete, id);
    }
}
