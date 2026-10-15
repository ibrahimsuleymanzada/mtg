import { Routes } from '@angular/router';
import { AccountingComponent } from './accounting.component';

export default [
    {
        path: '',
        component: AccountingComponent,
        children: [
            {
                path: 'dashboard',
                loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
            },
            // {
            //     path: 'payments',
            //     loadComponent: () => import('./payments/payments.component').then(m => m.PaymentsComponent)
            // },
            {
                path: 'invoice',
                loadComponent: () => import('./invoices/invoices.component').then(m => m.InvoicesComponent)
            },
            {
                path: 'tariffs',
                loadComponent: () => import('./service-tariffs/service-tariffs.component').then(m => m.ServiceTariffsComponent)
            },
            {
                path: 'discount',
                loadComponent: () => import('./discount-policies/discount-policies.component').then(m => m.DiscountPoliciesComponent)
            },
            {
                path: 'bank',
                loadComponent: () => import('./bank-medaxil/bank-medaxil.component').then(m => m.BankMedaxilComponent)
            },
            {
                path: 'cashin',
                loadComponent: () => import('./kassa-medaxil/kassa-medaxil.component').then(m => m.KassaMedaxilComponent)
            },
            // Default redirect
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            }
        ]
    },
] as Routes;
