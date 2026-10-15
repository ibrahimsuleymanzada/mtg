import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { of, switchMap } from 'rxjs';
import { AuthService } from 'app/core/auth/auth.service';

export const ResidentGuard: CanActivateFn | CanActivateChildFn = (route, state) =>
{
    const router      = inject(Router);
    const authService = inject(AuthService);

    return authService.check().pipe(
        switchMap((authenticated) =>
        {
            if ( !authenticated )
            {
                return of(router.parseUrl(`sign-in?redirectURL=${state.url}`));
            }

            if ( !authService.hasRole('5') && !authService.hasRole('6') )
            {
                return of(router.parseUrl('modules'));
            }

            return of(true);
        }),
    );
};
