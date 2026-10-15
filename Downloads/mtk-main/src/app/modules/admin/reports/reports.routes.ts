import { Routes } from '@angular/router';
import { ReportsComponent } from './reports.component';

export default [
    {
        path: '',
        component: ReportsComponent,
        children: [
            {
                path: 'debitor',
                loadComponent: () => import('./borclu-musteri/borclu-musteri.component').then(m => m.BorcluMusteriComponent)
            },
            {
                path: 'customer',
                loadComponent: () => import('./musteri/musteri.component').then(m => m.MusteriComponent)
            },
            {
                path: 'invoicereport',
                loadComponent: () => import('./invoice-report/invoice-report.component').then(m => m.InvoiceReportComponent)
            },
            {
                path: '',
                redirectTo: 'debitor',
                pathMatch: 'full'
            }
        ]
    },
] as Routes;
