import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthService } from 'app/core/auth/auth.service';
import { of, switchMap } from 'rxjs';

export const AuthGuard: CanActivateFn | CanActivateChildFn = (route, state) =>
{
    const router: Router = inject(Router);
    const authService = inject(AuthService);

    // Check the authentication status
    return authService.check().pipe(
        switchMap((authenticated) =>
        {
            // If the user is not authenticated...
            if ( !authenticated )
            {
                // Redirect to the sign-in page with a redirectUrl param
                const redirectURL = state.url === '/sign-out' ? '' : `redirectURL=${state.url}`;
                const urlTree = router.parseUrl(`sign-in?${redirectURL}`);

                return of(urlTree);
            }

            // Resident / Tenant users can only access resident routes and sign-out
            if ( (authService.hasRole('5') || authService.hasRole('6')) && !state.url.startsWith('/sign-out') )
            {
                return of(router.parseUrl('/resident/dashboard'));
            }

            // Allow the access
            return of(true);
        }),
    );
};
