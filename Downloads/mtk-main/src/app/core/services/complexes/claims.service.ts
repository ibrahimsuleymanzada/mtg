import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';
import { ApiResponse } from 'app/core/models/api-response.model';

export interface PendingClaim {
    id:              number;
    type:            'Apartment' | 'ParkingSpace' | 'CommercialSpace';
    unitNumber:      string;
    buildingName:    string;
    complexName:     string;
    claimantName:    string;
    claimDate:       string;
    deedNumber:      string;
    approvalStatus:  number;
}

export interface PendingClaimsResponse {
    apartments:       PendingClaim[];
    parkingSpaces:    PendingClaim[];
    commercialSpaces: PendingClaim[];
}

@Injectable({
    providedIn: 'root'
})
export class ClaimsService {
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) {}

    getPendingClaims(): Observable<ApiResponse<PendingClaimsResponse>> {
        return this.http.get<ApiResponse<PendingClaimsResponse>>(`${this.apiUrl}/Complexes/GetPendingClaims`);
    }

    approveClaim(type: string, id: number): Observable<ApiResponse<any>> {
        const params = new HttpParams().set('type', type).set('id', id.toString());
        return this.http.get<ApiResponse<any>>(`${this.apiUrl}/Complexes/ApproveClaim`, { params });
    }

    rejectClaim(type: string, id: number): Observable<ApiResponse<any>> {
        const params = new HttpParams().set('type', type).set('id', id.toString());
        return this.http.get<ApiResponse<any>>(`${this.apiUrl}/Complexes/RejectClaim`, { params });
    }
}
