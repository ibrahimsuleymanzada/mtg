import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from 'app/core/services/base-api.service';
import { ApiResponse, PaginatedResponse, PaginationRequest } from 'app/core/models/api-response.model';
import { ServiceTariff, ServiceTariffFormData, ServiceTariffListItem } from 'app/core/models/accounting/service-tariff.types';

@Injectable({
    providedIn: 'root'
})
export class ServiceTariffsService extends BaseApiService {
    private readonly endpoints = {
        getAll: 'Accounting/GetAllServiceTariffs',
        getById: 'Accounting/GetServiceTariffById',
        save: 'Accounting/SaveServiceTariff',
        delete: 'Accounting/DeleteServiceTariff'
    };

    getAllServiceTariffs(request: PaginationRequest): Observable<ApiResponse<PaginatedResponse<ServiceTariffListItem>>> {
        return this.getList<ServiceTariffListItem>(this.endpoints.getAll, request);
    }

    getServiceTariffById(id: number): Observable<ApiResponse<ServiceTariff>> {
        return this.getById<ServiceTariff>(this.endpoints.getById, id);
    }

    saveServiceTariff(data: ServiceTariffFormData): Observable<ApiResponse<any>> {
        return this.save(this.endpoints.save, data);
    }

    deleteServiceTariff(id: number): Observable<ApiResponse<any>> {
        return this.delete(this.endpoints.delete, id);
    }
}
