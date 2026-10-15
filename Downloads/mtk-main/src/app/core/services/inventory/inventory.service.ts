import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from 'app/core/services/base-api.service';
import { ApiResponse, PaginatedResponse, PaginationRequest } from 'app/core/models/api-response.model';
import { Inventory, InventoryFormData, InventoryListItem } from 'app/core/models/inventory/inventory.types';

@Injectable({
    providedIn: 'root'
})
export class InventoryService extends BaseApiService {
    private readonly endpoints = {
        getAll:  'Inventory/GetAllInventories',
        getById: 'Inventory/GetInventoryById',
        save:    'Inventory/SaveInventory',
        delete:  'Inventory/DeleteInventory'
    };

    getAllInventories(request: PaginationRequest): Observable<ApiResponse<PaginatedResponse<InventoryListItem>>> {
        return this.getList<InventoryListItem>(this.endpoints.getAll, request);
    }

    getInventoryById(id: number): Observable<ApiResponse<Inventory[]>> {
        return this.getById<Inventory[]>(this.endpoints.getById, id);
    }

    saveInventory(data: InventoryFormData): Observable<ApiResponse<any>> {
        return this.save(this.endpoints.save, data);
    }

    deleteInventory(id: number): Observable<ApiResponse<any>> {
        return this.delete(this.endpoints.delete, id);
    }
}
