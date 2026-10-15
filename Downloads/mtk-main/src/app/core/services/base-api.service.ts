import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';
import { ApiResponse, PaginatedResponse, PaginationRequest } from '../models/api-response.model';

@Injectable({
    providedIn: 'root'
})
export class BaseApiService {
    protected apiUrl = environment.apiUrl;

    constructor(protected http: HttpClient) { }

    /**
     * Get paginated list with filters
     */
    protected getList<T>(endpoint: string, request: PaginationRequest): Observable<ApiResponse<PaginatedResponse<T>>> {
        return this.http.post<ApiResponse<PaginatedResponse<T>>>(`${this.apiUrl}/${endpoint}`, request);
    }

    /**
     * Get single item by ID
     */
    protected getById<T>(endpoint: string, id: number): Observable<ApiResponse<T>> {
        const params = new HttpParams().set('id', id.toString());
        return this.http.get<ApiResponse<T>>(`${this.apiUrl}/${endpoint}`, { params });
    }

    /**
     * Save (Create or Update) item
     */
    protected save<T>(endpoint: string, data: any): Observable<ApiResponse<T>> {
        return this.http.post<ApiResponse<T>>(`${this.apiUrl}/${endpoint}`, data);
    }

    /**
     * Save item as multipart/form-data with optional file attachments.
     * Files are appended under the 'Files' key as required by the backend.
     */
    protected saveMultipart<T>(endpoint: string, data: Record<string, any>, files: File[] = []): Observable<ApiResponse<T>> {
        const fd = new FormData();
        Object.keys(data).forEach(key => {
            const val = data[key];
            if (val !== null && val !== undefined) {
                fd.append(key, String(val));
            }
        });
        files.forEach(file => fd.append('Files', file));
        return this.http.post<ApiResponse<T>>(`${this.apiUrl}/${endpoint}`, fd);
    }

    /**
     * Delete item by ID
     */
    protected delete<T>(endpoint: string, id: number): Observable<ApiResponse<T>> {
        const params = new HttpParams().set('id', id.toString());
        return this.http.get<ApiResponse<T>>(`${this.apiUrl}/${endpoint}`, { params });
    }

    /**
     * Normalizes API responses that may return PascalCase keys (e.g. on 2007 errors)
     * instead of the usual camelCase.
     */
    protected normalizeResponse<T>(response: any): ApiResponse<T> {
        return {
            data:       response.data       ?? response.Data,
            message:    response.message    ?? response.Message    ?? '',
            statusCode: response.statusCode ?? response.StatusCode ?? 200,
            status:     response.status     ?? response.Status     ?? false,
        };
    }
}