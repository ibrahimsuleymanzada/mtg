import { NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { TranslocoModule } from '@ngneat/transloco';
import { AuthService } from 'app/core/auth/auth.service';
import { TenantItem } from 'app/core/user/user.types';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'tenant-selector',
    templateUrl: './tenant-selector.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    exportAs: 'tenantSelector',
    standalone: true,
    imports: [NgIf, NgFor, MatButtonModule, MatMenuModule, MatIconModule, MatProgressSpinnerModule, TranslocoModule],
})
export class TenantSelectorComponent implements OnInit, OnDestroy {
    tenants: TenantItem[] = [];
    activeTenantName: string | null = null;
    activeComplexId: number | null = null;
    loading = false;
    isVisible = false;

    private _unsubscribeAll = new Subject<void>();

    constructor(
        private _authService: AuthService,
        private _router: Router,
        private _cdr: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        // Yalnız isSuperAdmin=false və roles-da '2' olan userlərə göstər
        const canSeeTenants = !this._authService.isSuperAdmin && this._authService.hasRole('2');
        if (!canSeeTenants) {
            this._cdr.markForCheck();
            return;
        }

        this.isVisible = true;
        this._loadTenants();
        console.log(this.activeTenantName);
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    selectTenant(tenant: TenantItem): void {
        console.log('Selected tenant:', tenant);
        this.loading = true;
        this._cdr.markForCheck();
        this._authService.selectTenant(tenant.id).subscribe({
            next: () => {
                this.activeTenantName = tenant.complexName;
                this.activeComplexId = tenant.id;
                this.loading = false;
                this._cdr.markForCheck();
                const currentUrl = this._router.url;
                this._router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
                    this._router.navigateByUrl(currentUrl);
                });
            },
            error: () => {
                this.loading = false;
                this._cdr.markForCheck();
            },
        });
    }

    private _loadTenants(): void {
        this._authService.getMyTenants()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (list) => {
                    this.tenants = list;
                    const currentId = this._authService.selectedComplexId;
                    const active = list.find(t => t.id === currentId);
                    this.activeComplexId = active?.id ?? (list[0]?.id ?? null);
                    this.activeTenantName = active?.complexName ?? (list[0]?.complexName ?? null);
                    this._cdr.markForCheck();
                },
            });
    }
}
