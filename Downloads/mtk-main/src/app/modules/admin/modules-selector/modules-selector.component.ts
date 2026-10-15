import { Component, inject, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Navigation } from 'app/core/navigation/navigation.types';
import { FuseFullscreenComponent } from '@fuse/components/fullscreen';
import { FuseNavigationService } from '@fuse/components/navigation';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { NavigationService } from 'app/core/navigation/navigation.service';
import { LanguagesComponent } from 'app/layout/common/languages/languages.component';
import { UserComponent } from 'app/layout/common/user/user.component';
import { skip, Subject, takeUntil } from 'rxjs';
import { FuseCardComponent } from '@fuse/components/card';
import { NgFor } from '@angular/common';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { FuseLoadingBarComponent } from '@fuse/components/loading-bar';
import { ModulesService } from 'app/core/services/modules.service';
import { ModuleItem } from 'app/core/models/module.model';
import { TenantSelectorComponent } from "app/layout/common/tenant-selector/tenant-selector.component";



@Component({
    selector: 'app-modules-selector',
    standalone: true,
    templateUrl: './modules-selector.component.html',
    encapsulation: ViewEncapsulation.None,
    imports: [MatButtonModule, FuseCardComponent, FuseLoadingBarComponent, TranslocoModule, NgFor, RouterLink, MatIconModule, LanguagesComponent, FuseFullscreenComponent, UserComponent, TenantSelectorComponent],
})
export class ModulesSelectorComponent {
    isScreenSmall: boolean;
    navigation: Navigation;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    modules: ModuleItem[] = [];
    constructor(
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _translocoService: TranslocoService,
    ) {
    }

    private _modulesService = inject(ModulesService);

    ngOnInit(): void {

        // Subscribe to media changes
        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({ matchingAliases }) => {
                // Check if the screen is small
                this.isScreenSmall = !matchingAliases.includes('md');
            });
        this.loadModules();

        // ✅ Dil dəyişəndə modulları reload et
        this._translocoService.langChanges$
            .pipe(skip(2),takeUntil(this._unsubscribeAll))
            .subscribe((activeLang) => {
                this.loadModules(); // ← Yenidən yüklə
            });

    }

    loadModules(): void {
        this._modulesService.getModules().subscribe({
            next: (modules) => {
                this.modules = modules;
            },
            error: (error) => {
                console.error('Modullar yüklənərkən xəta:', error);
            }
        });
    }

    selectModule(module: ModuleItem): void {
        // Module code-u localStorage-ə yazırıq
        localStorage.setItem('selectedModuleCode', module.code);
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }



}
