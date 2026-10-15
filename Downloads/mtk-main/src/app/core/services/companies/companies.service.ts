import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from 'app/core/services/base-api.service';
import { ApiResponse, PaginatedResponse, PaginationRequest } from 'app/core/models/api-response.model';
import { Company, CompanyFormData, CompanyListItem } from 'app/core/models/companies/company.types';

@Injectable({
    providedIn: 'root'
})
export class CompaniesService extends BaseApiService {
    private readonly endpoints = {
        getAll:        'Complexes/GetAllCompaniesBrowse',
        getById:       'Complexes/GetCompanyById',
        save:          'Complexes/SaveCompany',
        delete:        'Complexes/DeleteCompany',
        assignAdmin:   'Complexes/AssignCompanyAdmin'
    };

    getAllCompanies(request: PaginationRequest): Observable<ApiResponse<PaginatedResponse<CompanyListItem>>> {
        return this.getList<CompanyListItem>(this.endpoints.getAll, request);
    }

    getCompanyById(id: number): Observable<ApiResponse<Company[]>> {
        return this.getById<Company[]>(this.endpoints.getById, id);
    }

    saveCompany(data: CompanyFormData): Observable<ApiResponse<any>> {
        return this.save(this.endpoints.save, data);
    }

    deleteCompany(id: number): Observable<ApiResponse<any>> {
        return this.delete(this.endpoints.delete, id);
    }

    assignAdmin(companyId: number, userId: number): Observable<ApiResponse<any>> {
        const params = new HttpParams()
            .set('companyId', companyId.toString())
            .set('userId', userId.toString());
        return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${this.endpoints.assignAdmin}`, { params });
    }

    getCompanyAdmins(companyId: number): Observable<ApiResponse<{ key: number; value: string }[]>> {
        const params = new HttpParams().set('companyId', companyId.toString());
        return this.http.get<ApiResponse<{ key: number; value: string }[]>>(`${this.apiUrl}/Complexes/GetCompanyAdmins`, { params });
    }

    saveCompanyAdmins(companyId: number, userIds: number[]): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}/Complexes/SaveCompanyAdmins`, { companyId, userIds });
    }
}
