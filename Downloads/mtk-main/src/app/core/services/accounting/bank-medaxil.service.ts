import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from 'app/core/services/base-api.service';
import { ApiResponse, PaginatedResponse, PaginationRequest } from 'app/core/models/api-response.model';
import { BankMedaxilListItem, BankMedaxil, BankMedaxilFormData } from 'app/core/models/accounting/bank-medaxil.types';

@Injectable({
    providedIn: 'root'
})
export class BankMedaxilService extends BaseApiService {
    private readonly endpoints = {
        getAll: 'Accounting/GetAllBankMedaxil',
        getById: 'Accounting/GetBankMedaxilById',
        save: 'Accounting/SaveBankMedaxil',
        delete: 'Accounting/DeleteBankMedaxil'
    };

    getAllBankMedaxil(request: PaginationRequest): Observable<ApiResponse<PaginatedResponse<BankMedaxilListItem>>> {
        return this.getList<BankMedaxilListItem>(this.endpoints.getAll, request);
    }

    getBankMedaxilById(id: number): Observable<ApiResponse<BankMedaxil>> {
        return this.getById<BankMedaxil>(this.endpoints.getById, id);
    }

    saveBankMedaxil(data: BankMedaxilFormData): Observable<ApiResponse<any>> {
        return this.save(this.endpoints.save, data);
    }

    deleteBankMedaxil(id: number): Observable<ApiResponse<any>> {
        return this.delete(this.endpoints.delete, id);
    }
}
