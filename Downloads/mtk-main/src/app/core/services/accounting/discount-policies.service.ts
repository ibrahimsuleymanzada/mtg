import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from 'app/core/services/base-api.service';
import { ApiResponse, PaginatedResponse, PaginationRequest } from 'app/core/models/api-response.model';
import { DiscountPolicy, DiscountPolicyFormData, DiscountPolicyListItem } from 'app/core/models/accounting/discount-policy.types';

@Injectable({
    providedIn: 'root'
})
export class DiscountPoliciesService extends BaseApiService {
    private readonly endpoints = {
        getAll: 'Accounting/GetAllDiscountPolicies',
        getById: 'Accounting/GetDiscountPolicyById',
        save: 'Accounting/SaveDiscountPolicy',
        delete: 'Accounting/DeleteDiscountPolicy'
    };

    getAllDiscountPolicies(request: PaginationRequest): Observable<ApiResponse<PaginatedResponse<DiscountPolicyListItem>>> {
        return this.getList<DiscountPolicyListItem>(this.endpoints.getAll, request);
    }

    getDiscountPolicyById(id: number): Observable<ApiResponse<DiscountPolicy>> {
        return this.getById<DiscountPolicy>(this.endpoints.getById, id);
    }

    saveDiscountPolicy(data: DiscountPolicyFormData): Observable<ApiResponse<any>> {
        return this.save(this.endpoints.save, data);
    }

    deleteDiscountPolicy(id: number): Observable<ApiResponse<any>> {
        return this.delete(this.endpoints.delete, id);
    }
}
