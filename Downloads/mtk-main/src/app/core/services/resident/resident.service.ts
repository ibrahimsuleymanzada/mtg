import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from '../base-api.service';
import { ApiResponse, PaginatedResponse } from '../../models/api-response.model';
import {
    ResidentInvoiceListItem, ResidentPaymentFormData, ResidentPaymentListItem,
    ResidentComplaintListItem, ResidentComplaint, ResidentComplaintFormData,
    ResidentComplaintMessage, ResidentComplaintMessageFormData,
    ResidentPublicAnnouncementListItem, ResidentMyAnnouncementListItem, ResidentAnnouncementFormData,
    ResidentMyPropertiesData, ResidentClaimsData, ClaimFormData,
} from '../../models/resident/resident.types';

@Injectable({ providedIn: 'root' })
export class ResidentService extends BaseApiService {

    getMyInvoices(nextPageNumber: number, visibleItemCount: number): Observable<ApiResponse<PaginatedResponse<ResidentInvoiceListItem>>> {
        const request: any = {
            currentPageName:  'my-invoices',
            nextPageNumber,
            visibleItemCount,
            filters:          [],
            exportToExcel:    false,
        };
        return this.getList<ResidentInvoiceListItem>('Resident/GetMyInvoices', request);
    }

    getMyPayments(beginDate: string, endDate: string, nextPageNumber: number, visibleItemCount: number): Observable<ApiResponse<PaginatedResponse<ResidentPaymentListItem>>> {
        const request: any = {
            beginDate,
            endDate,
            currentPageName:  'my-payments',
            nextPageNumber,
            visibleItemCount,
            filters:          [],
            exportToExcel:    false,
        };
        return this.getList<ResidentPaymentListItem>('Resident/GetMyPayments', request);
    }

    saveMyPayment(data: ResidentPaymentFormData): Observable<ApiResponse<any>> {
        return this.save<any>('Resident/SaveMyPayment', data);
    }

    // ── Complaints ──────────────────────────────────────────────────────

    getMyComplaints(nextPageNumber: number, visibleItemCount: number): Observable<ApiResponse<PaginatedResponse<ResidentComplaintListItem>>> {
        const request: any = {
            currentPageName:  'my-complaints',
            nextPageNumber,
            visibleItemCount,
            filters:          [],
            exportToExcel:    false,
        };
        return this.getList<ResidentComplaintListItem>('Resident/GetMyComplaints', request);
    }

    getMyComplaintById(id: number): Observable<ApiResponse<ResidentComplaint>> {
        return this.getById<ResidentComplaint>('Resident/GetMyComplaintById', id);
    }

    saveMyComplaint(data: ResidentComplaintFormData): Observable<ApiResponse<any>> {
        return this.save<any>('Resident/SaveMyComplaint', data);
    }

    saveMyComplaintMultipart(data: ResidentComplaintFormData, files: File[]): Observable<ApiResponse<any>> {
        return this.saveMultipart<any>('Resident/SaveMyComplaint', data as Record<string, any>, files);
    }

    deleteMyComplaint(id: number): Observable<ApiResponse<any>> {
        return this.delete<any>('Resident/DeleteMyComplaint', id);
    }

    getMyComplaintMessages(complaintId: number): Observable<ApiResponse<ResidentComplaintMessage[]>> {
        const params = new HttpParams().set('complaintId', complaintId.toString());
        return this.http.get<ApiResponse<ResidentComplaintMessage[]>>(
            `${this.apiUrl}/Resident/GetMyComplaintMessages`, { params }
        );
    }

    saveMyComplaintMessage(data: ResidentComplaintMessageFormData): Observable<ApiResponse<any>> {
        return this.save<any>('Resident/SaveMyComplaintMessage', data);
    }

    saveMyComplaintMessageMultipart(data: ResidentComplaintMessageFormData, files: File[]): Observable<ApiResponse<any>> {
        return this.saveMultipart<any>('Resident/SaveMyComplaintMessage', data as Record<string, any>, files);
    }

    // ── Announcements ───────────────────────────────────────────────────

    getPublicAnnouncements(complexId: number, nextPageNumber: number, visibleItemCount: number): Observable<ApiResponse<PaginatedResponse<ResidentPublicAnnouncementListItem>>> {
        const request: any = {
            currentPageName:  'public-announcements',
            nextPageNumber,
            visibleItemCount,
            filters:          [],
            exportToExcel:    false,
        };
        const params = new HttpParams().set('complexId', complexId.toString());
        return this.http.post<ApiResponse<PaginatedResponse<ResidentPublicAnnouncementListItem>>>(
            `${this.apiUrl}/Resident/GetPublicAnnouncements`, request, { params }
        );
    }

    getMyAnnouncements(nextPageNumber: number, visibleItemCount: number): Observable<ApiResponse<PaginatedResponse<ResidentMyAnnouncementListItem>>> {
        const request: any = {
            currentPageName:  'my-announcements',
            nextPageNumber,
            visibleItemCount,
            filters:          [],
            exportToExcel:    false,
        };
        return this.getList<ResidentMyAnnouncementListItem>('Resident/GetMyAnnouncements', request);
    }

    saveMyAnnouncement(data: ResidentAnnouncementFormData): Observable<ApiResponse<any>> {
        return this.save<any>('Resident/SaveMyAnnouncement', data);
    }

    saveMyAnnouncementMultipart(data: ResidentAnnouncementFormData, files: File[]): Observable<ApiResponse<any>> {
        return this.saveMultipart<any>('Resident/SaveMyAnnouncement', data as Record<string, any>, files);
    }

    deleteMyAnnouncement(id: number): Observable<ApiResponse<any>> {
        return this.delete<any>('Resident/DeleteMyAnnouncement', id);
    }

    // ── My Properties ────────────────────────────────────────────────────

    getMyProperties(): Observable<ApiResponse<ResidentMyPropertiesData>> {
        return this.http.get<ApiResponse<ResidentMyPropertiesData>>(
            `${this.apiUrl}/Resident/GetMyProperties`
        );
    }

    // ── My Claims ────────────────────────────────────────────────────────

    getMyClaims(): Observable<ApiResponse<ResidentClaimsData>> {
        return this.http.get<ApiResponse<ResidentClaimsData>>(
            `${this.apiUrl}/Resident/GetMyClaims`
        );
    }

    claimApartment(data: ClaimFormData): Observable<ApiResponse<any>> {
        return this.save<any>('Resident/ClaimApartment', data);
    }

    claimParking(data: ClaimFormData): Observable<ApiResponse<any>> {
        return this.save<any>('Resident/ClaimParking', data);
    }

    claimCommercial(data: ClaimFormData): Observable<ApiResponse<any>> {
        return this.save<any>('Resident/ClaimCommercial', data);
    }
}
