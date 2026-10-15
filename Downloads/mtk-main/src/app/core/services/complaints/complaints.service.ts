import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { BaseApiService } from 'app/core/services/base-api.service';
import { ApiResponse, PaginatedResponse, PaginationRequest } from 'app/core/models/api-response.model';
import { ComplaintListItem, Complaint, ComplaintFormData, ComplaintMessage, ComplaintMessageFormData } from 'app/core/models/complaints/complaint.types';

@Injectable({
    providedIn: 'root'
})
export class ComplaintsService extends BaseApiService {
    private readonly endpoints = {
        getAll: 'Complaints/GetAllComplaints',
        getById: 'Complaints/GetComplaintById',
        save: 'Complaints/SaveComplaint',
        delete: 'Complaints/DeleteComplaint',
        getMessages: 'Complaints/GetComplaintMessages',
        saveMessage: 'Complaints/SaveComplaintMessage',
    };

    getAllComplaints(request: PaginationRequest): Observable<ApiResponse<PaginatedResponse<ComplaintListItem>>> {
        return this.getList<ComplaintListItem>(this.endpoints.getAll, request);
    }

    getComplaintById(id: number): Observable<ApiResponse<Complaint>> {
        return this.getById<Complaint>(this.endpoints.getById, id);
    }

    saveComplaint(data: ComplaintFormData): Observable<ApiResponse<any>> {
        return this.save(this.endpoints.save, data);
    }

    saveComplaintMultipart(data: ComplaintFormData, files: File[]): Observable<ApiResponse<any>> {
        return this.saveMultipart(this.endpoints.save, data as Record<string, any>, files);
    }

    deleteComplaint(id: number): Observable<ApiResponse<any>> {
        return this.delete(this.endpoints.delete, id);
    }

    getComplaintMessages(complaintId: number): Observable<ApiResponse<ComplaintMessage[]>> {
        const params = new HttpParams().set('complaintId', complaintId.toString());
        return this.http.get<ApiResponse<ComplaintMessage[]>>(`${this.apiUrl}/${this.endpoints.getMessages}`, { params });
    }

    saveComplaintMessage(data: ComplaintMessageFormData): Observable<ApiResponse<any>> {
        return this.save(this.endpoints.saveMessage, data);
    }

    saveComplaintMessageMultipart(data: ComplaintMessageFormData, files: File[]): Observable<ApiResponse<any>> {
        return this.saveMultipart(this.endpoints.saveMessage, data as Record<string, any>, files);
    }
}
