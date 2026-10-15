import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from 'app/core/services/base-api.service';
import { ApiResponse, PaginatedResponse, PaginationRequest } from 'app/core/models/api-response.model';
import {
    Contractor, ContractorFormData, ContractorListItem,
    ContractorContract, ContractorContractFormData, ContractorContractListItem
} from 'app/core/models/contractors/contractor.types';

@Injectable({
    providedIn: 'root'
})
export class ContractorsService extends BaseApiService {
    private readonly endpoints = {
        getAll:              'Contractors/GetAllContractors',
        getById:             'Contractors/GetContractorById',
        save:                'Contractors/SaveContractor',
        delete:              'Contractors/DeleteContractor',
        getAllContracts:      'Contractors/GetAllContractorContracts',
        getContractById:     'Contractors/GetContractorContractById',
        saveContract:        'Contractors/SaveContractorContract',
        deleteContract:      'Contractors/DeleteContractorContract'
    };

    getAllContractors(request: PaginationRequest): Observable<ApiResponse<PaginatedResponse<ContractorListItem>>> {
        return this.getList<ContractorListItem>(this.endpoints.getAll, request);
    }

    getContractorById(id: number): Observable<ApiResponse<Contractor[]>> {
        return this.getById<Contractor[]>(this.endpoints.getById, id);
    }

    saveContractor(data: ContractorFormData): Observable<ApiResponse<any>> {
        return this.save(this.endpoints.save, data);
    }

    deleteContractor(id: number): Observable<ApiResponse<any>> {
        return this.delete(this.endpoints.delete, id);
    }

    getAllContracts(request: PaginationRequest): Observable<ApiResponse<PaginatedResponse<ContractorContractListItem>>> {
        return this.getList<ContractorContractListItem>(this.endpoints.getAllContracts, request);
    }

    getContractById(id: number): Observable<ApiResponse<ContractorContract[]>> {
        return this.getById<ContractorContract[]>(this.endpoints.getContractById, id);
    }

    saveContract(data: ContractorContractFormData): Observable<ApiResponse<any>> {
        return this.save(this.endpoints.saveContract, data);
    }

    deleteContract(id: number): Observable<ApiResponse<any>> {
        return this.delete(this.endpoints.deleteContract, id);
    }
}
