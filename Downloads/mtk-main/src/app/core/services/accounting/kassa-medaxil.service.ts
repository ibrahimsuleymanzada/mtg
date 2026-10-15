import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from 'app/core/services/base-api.service';
import { ApiResponse, PaginatedResponse, PaginationRequest } from 'app/core/models/api-response.model';
import { KassaMedaxilListItem, KassaMedaxil, KassaMedaxilFormData } from 'app/core/models/accounting/kassa-medaxil.types';

@Injectable({
    providedIn: 'root'
})
export class KassaMedaxilService extends BaseApiService {
    private readonly endpoints = {
        getAll: 'Accounting/GetAllKassaMedaxil',
        getById: 'Accounting/GetKassaMedaxilById',
        save: 'Accounting/SaveKassaMedaxil',
        delete: 'Accounting/DeleteKassaMedaxil'
    };

    getAllKassaMedaxil(request: PaginationRequest): Observable<ApiResponse<PaginatedResponse<KassaMedaxilListItem>>> {
        return this.getList<KassaMedaxilListItem>(this.endpoints.getAll, request);
    }

    getKassaMedaxilById(id: number): Observable<ApiResponse<KassaMedaxil>> {
        return this.getById<KassaMedaxil>(this.endpoints.getById, id);
    }

    saveKassaMedaxil(data: KassaMedaxilFormData): Observable<ApiResponse<any>> {
        return this.save(this.endpoints.save, data);
    }

    deleteKassaMedaxil(id: number): Observable<ApiResponse<any>> {
        return this.delete(this.endpoints.delete, id);
    }
}
