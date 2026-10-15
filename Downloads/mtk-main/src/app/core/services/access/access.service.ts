import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { BaseApiService } from 'app/core/services/base-api.service';
import { ApiResponse, PaginatedResponse, PaginationRequest } from 'app/core/models/api-response.model';
import { GuestVehicleListItem } from 'app/core/models/access/guest-vehicle.types';

@Injectable({ providedIn: 'root' })
export class AccessService extends BaseApiService {

    getAll(request: PaginationRequest): Observable<ApiResponse<PaginatedResponse<GuestVehicleListItem>>> {
        return this.getList<GuestVehicleListItem>('Access/GetAllGuestVehicles', request);
    }

    approve(id: number): Observable<ApiResponse<any>> {
        const params = new HttpParams().set('id', id.toString());
        return this.http.get<ApiResponse<any>>(`${this.apiUrl}/Access/ApproveGuestRequest`, { params });
    }

    reject(id: number): Observable<ApiResponse<any>> {
        const params = new HttpParams().set('id', id.toString());
        return this.http.get<ApiResponse<any>>(`${this.apiUrl}/Access/RejectGuestRequest`, { params });
    }

    testPlateRead(plateNumber: string, complexId: number, direction: string = 'Entry'): Observable<ApiResponse<{ allowed: boolean; reason: string }>> {
        const params = new HttpParams()
            .set('plateNumber', plateNumber)
            .set('complexId', complexId.toString())
            .set('direction', direction);
        return this.http.get<ApiResponse<{ allowed: boolean; reason: string }>>(`${this.apiUrl}/Access/TestPlateRead`, { params });
    }

    getMyGuestRequests(): Observable<ApiResponse<any[]>> {
        return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/Access/GetMyGuestRequests`);
    }

    saveGuestRequest(data: any): Observable<ApiResponse<any>> {
        return this.save<any>('Access/SaveGuestRequest', data);
    }

    cancelGuestRequest(id: number): Observable<ApiResponse<any>> {
        const params = new HttpParams().set('id', id.toString());
        return this.http.get<ApiResponse<any>>(`${this.apiUrl}/Access/CancelGuestRequest`, { params });
    }
}
