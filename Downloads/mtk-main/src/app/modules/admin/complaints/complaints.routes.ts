import { Routes } from '@angular/router';
import { ComplaintsComponent } from './complaints.component';

export default [
    {
        path: '',
        component: ComplaintsComponent,
        children: [
            {
                path: 'applicants',
                loadComponent: () => import('./complaints/complaints.component').then(m => m.ComplaintsListComponent)
            },
            {
                path: 'listings',
                loadComponent: () => import('./announcements/announcements.component').then(m => m.AnnouncementsComponent)
            },
            {
                path: '',
                redirectTo: 'applicants',
                pathMatch: 'full'
            }
        ]
    },
] as Routes;
