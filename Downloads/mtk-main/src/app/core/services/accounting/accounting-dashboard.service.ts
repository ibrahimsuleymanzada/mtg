import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from 'app/core/services/base-api.service';
import { ApiResponse } from 'app/core/models/api-response.model';
import { AccountingDashboard } from 'app/core/models/accounting/accounting-dashboard.types';

@Injectable({
    providedIn: 'root'
})
export class AccountingDashboardService extends BaseApiService {
    getDashboard(): Observable<ApiResponse<AccountingDashboard>> {
        return this.http.get<ApiResponse<AccountingDashboard>>(`${this.apiUrl}/Accounting/GetDashboard`);
    }
}
