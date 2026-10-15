// app/core/services/modules.service.ts
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'environments/environment';
import { ModuleItem, ModulesResponse } from '../models/module.model';

@Injectable({ providedIn: 'root' })
export class ModulesService {
    private _httpClient = inject(HttpClient);
    private readonly API_URL = environment.apiUrl;
    

    getModules(): Observable<ModuleItem[]> {
        return this._httpClient.get<ModulesResponse>(`${this.API_URL}/Global/GetModules`).pipe(
            map(response => {
                if (response.status) {
                    // Modulları localStorage-ə saxlayırıq
                    localStorage.setItem('modules', JSON.stringify(response.data));
                    return response.data;
                }
                return [];
            })
        );
    }
}