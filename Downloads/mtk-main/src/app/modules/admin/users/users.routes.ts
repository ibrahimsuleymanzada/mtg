import { Routes } from '@angular/router';
import { UsersComponent } from './users.component';

export default [
    {
        path: '',
        component: UsersComponent,
        children: [
            {
                path: 'users',
                loadComponent: () => import('./users/users-list.component').then(m => m.UsersListComponent)
            },
            {
                path: 'owners',
                loadComponent: () => import('./sakinler/sakinler.component').then(m => m.SakinlerComponent)
            },
            {
                path: 'family',
                loadComponent: () => import('./residents/residents.component').then(m => m.ResidentsComponent)
            },
            {
                path: 'roles',
                loadComponent: () => import('./roles/roles-list.component').then(m => m.RolesListComponent)
            },
            {
                path: '',
                redirectTo: 'users',
                pathMatch: 'full'
            }
        ]
    },
] as Routes;
