import { Routes, UrlMatchResult, UrlSegment } from '@angular/router';
import { ResidentDashboardComponent } from './pages/dashboard/dashboard.component';
import { ResidentInvoicesComponent } from './pages/invoices/invoices.component';
import { ResidentPaymentsComponent } from './pages/payments/payments.component';
import { ResidentComplaintsComponent } from './pages/complaints/complaints.component';
import { ResidentAnnouncementsComponent } from './pages/announcements/announcements.component';
import { ResidentMyPropertiesComponent } from './pages/my-properties/my-properties.component';
import { ResidentMyClaimsComponent } from './pages/my-claims/my-claims.component';
import { ResidentGuestRequestsComponent } from './pages/guest-requests/guest-requests.component';
import { ResidentFeedComponent } from './pages/feed/feed.component';

/**
 * Matches both `feed` and `feed/:id` with ONE route config, so the feed component is reused
 * (not recreated) when only the post id changes, e.g. when leaving a shared link for the whole feed.
 */
export function feedUrlMatcher(segments: UrlSegment[]): UrlMatchResult | null {
    if (segments[0]?.path !== 'feed' || segments.length > 2) {
        return null;
    }
    return { consumed: segments, posParams: segments[1] ? { id: segments[1] } : {} };
}

export default [
    { path: 'dashboard',      component: ResidentDashboardComponent },
    { path: 'invoice',        component: ResidentInvoicesComponent },
    { path: 'payment',        component: ResidentPaymentsComponent },
    { path: 'request',        component: ResidentComplaintsComponent },
    { path: 'announcement',   component: ResidentAnnouncementsComponent },
    { path: 'my-properties',  component: ResidentMyPropertiesComponent },
    { path: 'my-claims',      component: ResidentMyClaimsComponent },
    { path: 'guest-requests', component: ResidentGuestRequestsComponent },
    { matcher: feedUrlMatcher, component: ResidentFeedComponent },
    { path: '',                redirectTo: 'dashboard', pathMatch: 'full' },
] as Routes;
