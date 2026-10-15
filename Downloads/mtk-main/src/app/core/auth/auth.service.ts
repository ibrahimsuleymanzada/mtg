import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { UserService } from 'app/core/user/user.service';
import { TenantItem } from 'app/core/user/user.types';
import { environment } from 'environments/environment';
import { catchError, finalize, map, Observable, of, switchMap, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private _authenticated: boolean = false;
    private _httpClient = inject(HttpClient);
    private _userService = inject(UserService);
    private _router = inject(Router);

    private readonly API_URL = environment.apiUrl;

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Setter & getter for access token
     */
    set accessToken(token: string) {
        localStorage.setItem('accessToken', token);
    }

    get accessToken(): string {
        return localStorage.getItem('accessToken') ?? '';
    }

    get userRole(): string | null {
        return AuthUtils.getRolesFromToken(this.accessToken);
    }

    get isSuperAdmin(): boolean {
        return AuthUtils.isSuperAdminFromToken(this.accessToken);
    }

    hasRole(role: string): boolean {
        const raw = AuthUtils.getRolesFromToken(this.accessToken) as string | string[] | null;
        if (!raw) return false;
        return Array.isArray(raw) ? raw.includes(role) : raw === role;
    }

    get selectedComplexId(): number {
        return AuthUtils.getSelectedComplexIdFromToken(this.accessToken);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Forgot password
     *
     * @param email
     */
    forgotPassword(email: string): Observable<any> {
        return this._httpClient.post('api/auth/forgot-password', email);
    }

    /**
     * Reset password
     *
     * @param password
     */
    resetPassword(password: string): Observable<any> {
        return this._httpClient.post('api/auth/reset-password', password);
    }

    set refreshToken(token: string) {
        localStorage.setItem('refreshToken', token);
    }

    get refreshToken(): string {
        return localStorage.getItem('refreshToken') ?? '';
    }

    /**
 * Sign in
 */
    signIn(credentials: { username: string; password: string }): Observable<any> {
        // Throw error, if the user is already logged in
        if (this._authenticated) {
            return throwError(() => 'User is already logged in.');
        }

        return this._httpClient.post(`${this.API_URL}/system/Auth/login`, credentials).pipe(
            switchMap((response: any) => {
                // API-dən gələn response-u yoxlayırıq
                if (!response.status) {
                    return throwError(() => response.message || 'Login failed');
                }

                // Token-ləri saxlayırıq
                this.accessToken = response.data.token;
                this.refreshToken = response.data.refreshToken;

                // Authenticated flag-ı true edirik
                this._authenticated = true;

                // Token-dən user məlumatlarını çıxarırıq
                const tokenUser = AuthUtils.getUserFromToken(response.data.token);
                this._userService.user = {
                    userId:           tokenUser?.userId           ?? '',
                    username:         tokenUser?.username         ?? '',
                    firstName:        '',
                    lastName:         '',
                    fullName:         tokenUser?.fullName         ?? '',
                    email:            tokenUser?.email            ?? '',
                    isSuperAdmin:     tokenUser?.isSuperAdmin     ?? false,
                    selectedComplexId: tokenUser?.selectedComplexId ?? 0,
                    selectedCompanyId: tokenUser?.selectedCompanyId ?? 0,
                };

                // Response-u qaytarırıq
                return of(response);
            }),
            catchError((error) => {
                console.log(error)
                // Error-u handle edirik
                const errorMessage = error.error?.message || error.error?.errors?.[0] || 'Xəta baş verdi';
                return throwError(() => errorMessage);
            })
        );
    }

    /**
     * Sign in using the access token
     */
    /**
    * Sign in using the access token
    */
    signInUsingToken(): Observable<any> {
        // Token yoxdursa, false qaytarırıq
        if (!this.accessToken) {
            return of(false);
        }

        // Token-in expire olub-olmadığını yoxlayırıq
        if (AuthUtils.isTokenExpired(this.accessToken)) {
            // Token expire olubsa, təmizləyirik
            this.signOut();
            return of(false);
        }

        // Token var və keçərlidirsə, authenticated edirik
        this._authenticated = true;

        // Token-dən user məlumatlarını çıxarırıq
        const tokenUser = AuthUtils.getUserFromToken(this.accessToken);
        if (tokenUser) {
            this._userService.user = {
                userId:           tokenUser.userId,
                username:         tokenUser.username,
                firstName:        '',
                lastName:         '',
                fullName:         tokenUser.fullName,
                email:            tokenUser.email,
                isSuperAdmin:     tokenUser.isSuperAdmin,
                selectedComplexId: tokenUser.selectedComplexId,
                selectedCompanyId: tokenUser.selectedCompanyId,
            };
        }

        return of(true);
    }

    changePassword(data: { oldPassword: string; newPassword: string; confirmPassword: string }): Observable<any> {
        return this._httpClient.post(`${this.API_URL}/system/Auth/ChangePassword`, data);
    }

    getMyTenants(): Observable<TenantItem[]> {
        return this._httpClient
            .get<any>(`${this.API_URL}/system/Auth/GetMyTenants`)
            .pipe(map(response => (response?.data ?? response?.Data ?? [])));
    }

    selectTenant(complexId: number): Observable<any> {
        const params = new HttpParams().set('complexId', complexId.toString());
        return this._httpClient
            .get<any>(`${this.API_URL}/system/Auth/SelectTenant`, { params })
            .pipe(
                switchMap(response => {
                    const newToken = response?.data?.token ?? response?.Data?.token;
                    if (newToken) {
                        this.accessToken = newToken;
                        // localStorage-dakı cari user-i oxuyub yeni claim-lərlə yenilə
                        const storedUser = JSON.parse(localStorage.getItem('currentUser') ?? '{}');
                        const tokenUser  = AuthUtils.getUserFromToken(newToken);
                        if (tokenUser) {
                            this._userService.user = {
                                ...storedUser,
                                isSuperAdmin:      tokenUser.isSuperAdmin,
                                selectedComplexId:  tokenUser.selectedComplexId,
                                selectedCompanyId:  tokenUser.selectedCompanyId,
                            };
                        }
                    }
                    return of(response);
                })
            );
    }

    /**
     * Sign out
     */
    signOut(): Observable<any> {
        return this._httpClient.get(`${this.API_URL}/system/Auth/logout`).pipe(
            catchError((error) => {
                console.error('Logout API xətası:', error);
                return of(true); // Error-da belə continue et
            }),
            finalize(() => {
                // Hər halda local data təmizlə (success və ya error)
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('currentUser');
                localStorage.removeItem('modules');
                localStorage.removeItem('selectedModuleCode');
                this._router.navigateByUrl('/sign-in');
                this._authenticated = false;
            })
        );
    }

    /**
     * Sign up
     *
     * @param user
     */
    signUp(user: { name: string; email: string; password: string; company: string }): Observable<any> {
        return this._httpClient.post('api/auth/sign-up', user);
    }

    /**
     * Unlock session
     *
     * @param credentials
     */
    unlockSession(credentials: { email: string; password: string }): Observable<any> {
        return this._httpClient.post('api/auth/unlock-session', credentials);
    }

    /**
     * Check the authentication status
     */
    check(): Observable<boolean> {
        // Check if the user is logged in
        if (this._authenticated) {
            return of(true);
        }

        // Check the access token availability
        if (!this.accessToken) {
            return of(false);
        }

        // Check the access token expire date
        if (AuthUtils.isTokenExpired(this.accessToken)) {
            return of(false);
        }

        // If the access token exists, and it didn't expire, sign in using it
        return this.signInUsingToken();
    }
}
