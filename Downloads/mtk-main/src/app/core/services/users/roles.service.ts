import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { BaseApiService } from 'app/core/services/base-api.service';
import { ApiResponse, PaginatedResponse, PaginationRequest } from 'app/core/models/api-response.model';
import { RoleListItem, Role, RoleFormData, AddRolesToUserRequest, RoleMenuItem, RoleMenuSaveRequest } from 'app/core/models/users/role.types';

@Injectable({
    providedIn: 'root'
})
export class RolesService extends BaseApiService {
    private readonly endpoints = {
        getAll: 'Users/GetAllRoles',
        getById: 'Users/GetRoleById',
        save: 'Users/SaveRole',
        delete: 'Users/DeleteRole',
        addRolesToUser: 'Users/AddRolesToUser',
    };

    getAllRoles(request: PaginationRequest): Observable<ApiResponse<PaginatedResponse<RoleListItem>>> {
        return this.getList<RoleListItem>(this.endpoints.getAll, request);
    }

    getRoleById(id: number): Observable<ApiResponse<Role>> {
        return this.getById<Role>(this.endpoints.getById, id);
    }

    saveRole(data: RoleFormData): Observable<ApiResponse<any>> {
        return this.save(this.endpoints.save, data);
    }

    deleteRole(id: number): Observable<ApiResponse<any>> {
        return this.delete(this.endpoints.delete, id);
    }

    addRolesToUser(request: AddRolesToUserRequest): Observable<ApiResponse<any>> {
        return this.save(this.endpoints.addRolesToUser, request);
    }

    getMenusByRoleId(roleId: number): Observable<ApiResponse<RoleMenuItem[]>> {
        const params = new HttpParams().set('roleId', roleId.toString());
        return this.http.get<ApiResponse<RoleMenuItem[]>>(`${this.apiUrl}/Roles/GetMenusByRoleId`, { params });
    }

    saveRoleMenus(request: RoleMenuSaveRequest): Observable<ApiResponse<any>> {
        return this.save('Roles/SaveRoleMenus', request);
    }
}
