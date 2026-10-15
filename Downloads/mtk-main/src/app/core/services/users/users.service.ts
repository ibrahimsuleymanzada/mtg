import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from 'app/core/services/base-api.service';
import { ApiResponse, PaginatedResponse, PaginationRequest } from 'app/core/models/api-response.model';
import { UserListItem, UserDetail, UserFormData } from 'app/core/models/users/user.types';

@Injectable({
    providedIn: 'root'
})
export class UsersService extends BaseApiService {
    private readonly endpoints = {
        getAll: 'Users/GetAllUsers',
        getById: 'Users/GetUserById',
        save: 'Users/SaveUser',
        delete: 'Users/DeleteUser',
    };

    getAllUsers(request: PaginationRequest): Observable<ApiResponse<PaginatedResponse<UserListItem>>> {
        return this.getList<UserListItem>(this.endpoints.getAll, request);
    }

    getUserById(id: number): Observable<ApiResponse<UserDetail>> {
        return this.getById<UserDetail>(this.endpoints.getById, id);
    }

    saveUser(data: UserFormData): Observable<ApiResponse<any>> {
        return this.save(this.endpoints.save, data);
    }

    deleteUser(id: number): Observable<ApiResponse<any>> {
        return this.delete(this.endpoints.delete, id);
    }
}
