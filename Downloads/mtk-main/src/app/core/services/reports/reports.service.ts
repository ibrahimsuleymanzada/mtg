import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from 'app/core/services/base-api.service';
import { ApiResponse, PaginatedResponse, PaginationRequest } from 'app/core/models/api-response.model';
import { BorcluMusteriReportItem, MusteriReportItem, InvoiceReportItem } from 'app/core/models/reports/reports.types';

@Injectable({
    providedIn: 'root'
})
export class ReportsService extends BaseApiService {
    private readonly endpoints = {
        borcluMusteri: 'Reports/GetBorcluMusteriReport',
        musteri: 'Reports/GetMusteriReport',
        invoice: 'Reports/GetInvoiceReport',
    };

    getBorcluMusteriReport(request: PaginationRequest): Observable<ApiResponse<PaginatedResponse<BorcluMusteriReportItem>>> {
        return this.getList<BorcluMusteriReportItem>(this.endpoints.borcluMusteri, request);
    }

    getMusteriReport(request: PaginationRequest): Observable<ApiResponse<PaginatedResponse<MusteriReportItem>>> {
        return this.getList<MusteriReportItem>(this.endpoints.musteri, request);
    }

    getInvoiceReport(request: PaginationRequest): Observable<ApiResponse<PaginatedResponse<InvoiceReportItem>>> {
        return this.getList<InvoiceReportItem>(this.endpoints.invoice, request);
    }
}
