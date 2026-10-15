import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from 'app/core/services/base-api.service';
import { ApiResponse, PaginatedResponse, PaginationRequest } from 'app/core/models/api-response.model';
import { PaymentListItem, Payment } from 'app/core/models/payment.model';

@Injectable({
    providedIn: 'root'
})
export class PaymentsService extends BaseApiService {
    private readonly endpoints = {
        getAll: 'Accounting/GetAllPayments',
        getById: 'Accounting/GetPaymentById',
        save: 'Accounting/SavePayment',
        delete: 'Accounting/DeletePayment'
    };

    getAllPayments(request: PaginationRequest): Observable<ApiResponse<PaginatedResponse<PaymentListItem>>> {
        return this.getList<PaymentListItem>(this.endpoints.getAll, request);
    }

    getPaymentById(id: number): Observable<ApiResponse<Payment>> {
        return this.getById<Payment>(this.endpoints.getById, id);
    }

    savePayment(data: any): Observable<ApiResponse<any>> {
        return this.save(this.endpoints.save, data);
    }

    deletePayment(id: number): Observable<ApiResponse<any>> {
        return this.delete(this.endpoints.delete, id);
    }
}
