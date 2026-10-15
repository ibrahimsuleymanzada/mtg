import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from 'app/core/services/base-api.service';
import { ApiResponse, PaginatedResponse, PaginationRequest } from 'app/core/models/api-response.model';
import { SakinListItem, Sakin } from 'app/core/models/users/sakin.types';

@Injectable({
    providedIn: 'root'
})
export class SakinlerService extends BaseApiService {
    private readonly endpoints = {
        getAll: 'Users/GetAllSakinler',
        getById: 'Users/GetSakinById',
        resetPassword: 'Users/ResetUserPassword',
    };

    getAllSakinler(request: PaginationRequest): Observable<ApiResponse<PaginatedResponse<SakinListItem>>> {
        return this.getList<SakinListItem>(this.endpoints.getAll, request);
    }

    getSakinById(id: number): Observable<ApiResponse<Sakin>> {
        return this.getById<Sakin>(this.endpoints.getById, id);
    }

    resetUserPassword(userId: number, newPassword: string): Observable<ApiResponse<any>> {
        return this.save(this.endpoints.resetPassword, { userId, newPassword });
    }
}
