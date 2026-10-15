import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from 'app/core/services/base-api.service';
import { ApiResponse, PaginatedResponse, PaginationRequest } from 'app/core/models/api-response.model';
import { InvoiceListItem, Invoice, InvoiceBalance } from 'app/core/models/invoice.model';

@Injectable({
    providedIn: 'root'
})
export class InvoicesService extends BaseApiService {
    private readonly endpoints = {
        getAll: 'Accounting/GetAllInvoices',
        getById: 'Accounting/GetInvoiceById',
        save: 'Accounting/SaveInvoice',
        delete: 'Accounting/DeleteInvoice'
    };

    getAllInvoices(request: PaginationRequest): Observable<ApiResponse<PaginatedResponse<InvoiceListItem>>> {
        return this.getList<InvoiceListItem>(this.endpoints.getAll, request);
    }

    getInvoiceById(id: number): Observable<ApiResponse<Invoice>> {
        return this.getById<Invoice>(this.endpoints.getById, id);
    }

    saveInvoice(data: any): Observable<ApiResponse<any>> {
        return this.save(this.endpoints.save, data);
    }

    deleteInvoice(id: number): Observable<ApiResponse<any>> {
        return this.delete(this.endpoints.delete, id);
    }

    getInvoiceBalance(invoiceId: number): Observable<ApiResponse<InvoiceBalance>> {
        const params = new HttpParams().set('invoiceId', invoiceId.toString());
        return this.http.get<ApiResponse<InvoiceBalance>>(`${this.apiUrl}/Accounting/GetInvoiceBalance`, { params });
    }
}
