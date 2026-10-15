import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from 'app/core/services/base-api.service';
import { AccessCard, AccessCardListItem, AccessCardFormData, UpdateCardOrderStatusRequest } from 'app/core/models/access-card.model';
import { ApiResponse, PaginatedResponse, PaginationRequest } from 'app/core/models/api-response.model';

@Injectable({ providedIn: 'root' })
export class AccessCardsService extends BaseApiService {
    private readonly endpoints = {
        getAll:            'Complexes/GetAllAccessCards',
        getById:           'Complexes/GetAccessCardById',
        save:              'Complexes/SaveAccessCard',
        delete:            'Complexes/DeleteAccessCards',
        updateOrderStatus: 'Complexes/UpdateCardOrderStatus'
    };

    getAllAccessCards(request: PaginationRequest): Observable<ApiResponse<PaginatedResponse<AccessCardListItem>>> {
        return this.getList<AccessCardListItem>(this.endpoints.getAll, request);
    }

    getAccessCardById(id: number): Observable<ApiResponse<AccessCard>> {
        return this.getById<AccessCard>(this.endpoints.getById, id);
    }

    saveAccessCard(data: AccessCardFormData): Observable<ApiResponse<any>> {
        return this.save(this.endpoints.save, data);
    }

    deleteAccessCard(id: number): Observable<ApiResponse<any>> {
        return this.delete(this.endpoints.delete, id);
    }

    updateCardOrderStatus(data: UpdateCardOrderStatusRequest): Observable<ApiResponse<any>> {
        return this.save(this.endpoints.updateOrderStatus, data);
    }
}
