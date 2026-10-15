import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { AuthService } from 'app/core/auth/auth.service';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { catchError, Observable, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

/**
 * Intercept
 *
 * @param req
 * @param next
 */
export const authInterceptor = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
    const authService = inject(AuthService);
    const translocoService = inject(TranslocoService);
    const notificationService = inject(NotificationService);
    // Clone the request object
    let newReq = req.clone();

    // Header-ləri toplamaq üçün obyekt
    const headers: any = {};

    // Authorization header
    if (authService.accessToken && !AuthUtils.isTokenExpired(authService.accessToken)) {
        headers['Authorization'] = 'Bearer ' + authService.accessToken;
    }

    // Accept-Language header
    const selectedLanguage = translocoService.getActiveLang() || 'az';
    if (selectedLanguage) {
        headers['Accept-Language'] = selectedLanguage;
    }

    // Bütün header-ləri bir dəfə əlavə edirik
    if (Object.keys(headers).length > 0) {
        newReq = req.clone({
            setHeaders: headers
        });
    }

    // Response
    return next(newReq).pipe(
        catchError((error) => {
            if (req.url.includes('/Auth/logout')) {
                return throwError(() => error);
            }

            if (error instanceof HttpErrorResponse) {
                const message = error.error?.Message
                    || error.error?.title
                    || 'Xəta baş verdi';
                switch (error.status) {
                    case 401:
                        authService.signOut().subscribe();
                        notificationService.error(message);
                        break;

                    default:
                        notificationService.error(message);
                        break;
                }
            }

            return throwError(() => error);
        }),
    );
};
