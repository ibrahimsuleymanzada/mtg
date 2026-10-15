import { Route } from '@angular/router';
import { initialDataResolver, residentDataResolver } from 'app/app.resolvers';
import { AuthGuard } from 'app/core/auth/guards/auth.guard';
import { NoAuthGuard } from 'app/core/auth/guards/noAuth.guard';
import { ResidentGuard } from 'app/core/auth/guards/resident.guard';
import { LayoutComponent } from 'app/layout/layout.component';

// @formatter:off
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
export const appRoutes: Route[] = [

    // Redirect empty path to '/example'
    { path: '', pathMatch: 'full', redirectTo: 'modules' },

    // Redirect signed-in user to the '/example'
    //
    // After the user signs in, the sign-in page will redirect the user to the 'signed-in-redirect'
    // path. Below is another redirection for that path to redirect the user to the desired
    // location. This is a small convenience to keep all main routes together here on this file.
    { path: 'signed-in-redirect', pathMatch: 'full', redirectTo: 'modules' },

    // Auth routes for guests
    {
        path: '',
        canActivate: [NoAuthGuard],
        canActivateChild: [NoAuthGuard],
        component: LayoutComponent,
        data: {
            layout: 'empty'
        },
        children: [
            { path: 'confirmation-required', loadChildren: () => import('app/modules/auth/confirmation-required/confirmation-required.routes') },
            { path: 'forgot-password', loadChildren: () => import('app/modules/auth/forgot-password/forgot-password.routes') },
            { path: 'reset-password', loadChildren: () => import('app/modules/auth/reset-password/reset-password.routes') },
            { path: 'sign-in', loadChildren: () => import('app/modules/auth/sign-in/sign-in.routes') },
            { path: 'sign-up', loadChildren: () => import('app/modules/auth/sign-up/sign-up.routes') },
            { path: 'register', loadChildren: () => import('app/modules/auth/self-register/self-register.routes') },
        ]
    },

    // Auth routes for authenticated users
    {
        path: '',
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard],
        component: LayoutComponent,
        data: {
            layout: 'empty'
        },
        children: [
            { path: 'sign-out', loadChildren: () => import('app/modules/auth/sign-out/sign-out.routes') },
            { path: 'select-tenant', loadChildren: () => import('app/modules/auth/select-tenant/select-tenant.routes') },
        ]
    },



    // Admin routes
    {
        path: '',
        canActivate: [AuthGuard],
        component: LayoutComponent,
        resolve: {
            initialData: initialDataResolver
        },
        children: [
            { path: 'complexes', loadChildren: () => import('app/modules/admin/complexes/complexes.routes') },
            { path: 'accounting', loadChildren: () => import('app/modules/admin/accounting/accounting.routes') },
            { path: 'general', loadChildren: () => import('app/modules/admin/complaints/complaints.routes') },
            { path: 'configurations', loadChildren: () => import('app/modules/admin/users/users.routes') },
            { path: 'reports', loadChildren: () => import('app/modules/admin/reports/reports.routes') },
            { path: 'companies', loadChildren: () => import('app/modules/admin/companies/companies.routes') },
        ]
    },

    // Modul seçimi (layout YOX)
    {
        path: '',
        canActivate: [AuthGuard],
        component: LayoutComponent,
        data: { layout: 'empty' },
        children: [
            { path: 'modules', loadChildren: () => import('app/modules/admin/modules-selector/modules-selector.routes') },
        ]
    },

    // Sakin Portalı routes
    {
        path: 'resident',
        canActivate: [ResidentGuard],
        canActivateChild: [ResidentGuard],
        component: LayoutComponent,
        resolve: {
            initialData: residentDataResolver
        },
        children: [
            { path: '', loadChildren: () => import('app/modules/resident/resident.routes') }
        ]
    },

    // 404 və wildcard route-lar ƏN SONDA olmalıdır
    {
        path: '',
        component: LayoutComponent,
        data: { layout: 'empty' },
        children: [
            { path: '404-not-found', pathMatch: 'full', loadChildren: () => import('app/modules/admin/error-404/error-404.routes') },
            { path: '**', redirectTo: '404-not-found' }
        ]
    }




];


