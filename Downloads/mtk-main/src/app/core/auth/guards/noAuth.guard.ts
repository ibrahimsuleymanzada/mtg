import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthService } from 'app/core/auth/auth.service';
import { of, switchMap } from 'rxjs';

export const NoAuthGuard: CanActivateFn | CanActivateChildFn = (route, state) =>
{
    const router: Router = inject(Router);
    const authService = inject(AuthService);

    // Check the authentication status
    return authService.check().pipe(
        switchMap((authenticated) =>
        {
            // If the user is authenticated...
            if ( authenticated )
            {
                // Resident users should go directly to resident dashboard
                if ( authService.userRole === '5' )
                {
                    return of(router.parseUrl('/resident/dashboard'));
                }

                return of(router.parseUrl(''));
            }

            // Allow the access
            return of(true);
        }),
    );
};
