import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from 'app/core/services/base-api.service';
import { ApiResponse, PaginatedResponse, PaginationRequest } from 'app/core/models/api-response.model';
import { AnnouncementListItem, Announcement, AnnouncementFormData } from 'app/core/models/complaints/announcement.types';

@Injectable({
    providedIn: 'root'
})
export class AnnouncementsService extends BaseApiService {
    private readonly endpoints = {
        getAll: 'Complaints/GetAllAnnouncements',
        getById: 'Complaints/GetAnnouncementById',
        save: 'Complaints/SaveAnnouncement',
        delete: 'Complaints/DeleteAnnouncement',
    };

    getAllAnnouncements(request: PaginationRequest): Observable<ApiResponse<PaginatedResponse<AnnouncementListItem>>> {
        return this.getList<AnnouncementListItem>(this.endpoints.getAll, request);
    }

    getAnnouncementById(id: number): Observable<ApiResponse<Announcement>> {
        return this.getById<Announcement>(this.endpoints.getById, id);
    }

    saveAnnouncement(data: AnnouncementFormData): Observable<ApiResponse<any>> {
        return this.save(this.endpoints.save, data);
    }

    saveAnnouncementMultipart(data: AnnouncementFormData, files: File[]): Observable<ApiResponse<any>> {
        return this.saveMultipart(this.endpoints.save, data as Record<string, any>, files);
    }

    deleteAnnouncement(id: number): Observable<ApiResponse<any>> {
        return this.delete(this.endpoints.delete, id);
    }
}
