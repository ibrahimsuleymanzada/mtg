import { Routes } from '@angular/router';
import { ResidentDashboardComponent } from './pages/dashboard/dashboard.component';
import { ResidentInvoicesComponent } from './pages/invoices/invoices.component';
import { ResidentPaymentsComponent } from './pages/payments/payments.component';
import { ResidentComplaintsComponent } from './pages/complaints/complaints.component';
import { ResidentAnnouncementsComponent } from './pages/announcements/announcements.component';
import { ResidentMyPropertiesComponent } from './pages/my-properties/my-properties.component';
import { ResidentMyClaimsComponent } from './pages/my-claims/my-claims.component';
import { ResidentGuestRequestsComponent } from './pages/guest-requests/guest-requests.component';

export default [
    { path: 'dashboard',      component: ResidentDashboardComponent },
    { path: 'invoice',        component: ResidentInvoicesComponent },
    { path: 'payment',        component: ResidentPaymentsComponent },
    { path: 'request',        component: ResidentComplaintsComponent },
    { path: 'announcement',   component: ResidentAnnouncementsComponent },
    { path: 'my-properties',  component: ResidentMyPropertiesComponent },
    { path: 'my-claims',      component: ResidentMyClaimsComponent },
    { path: 'guest-requests', component: ResidentGuestRequestsComponent },
    { path: '',                redirectTo: 'dashboard', pathMatch: 'full' },
] as Routes;
