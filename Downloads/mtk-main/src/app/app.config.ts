import { provideHttpClient } from '@angular/common/http';
import { APP_INITIALIZER, ApplicationConfig, inject } from '@angular/core';
import { LuxonDateAdapter } from '@angular/material-luxon-adapter';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { PreloadAllModules, provideRouter, withInMemoryScrolling, withPreloading } from '@angular/router';
import { provideFuse } from '@fuse';
import { provideTransloco, TranslocoService } from '@ngneat/transloco';
import { firstValueFrom } from 'rxjs';
import { appRoutes } from 'app/app.routes';
import { provideAuth } from 'app/core/auth/auth.provider';
import { provideIcons } from 'app/core/icons/icons.provider';
import { TranslocoHttpLoader } from './core/transloco/transloco.http-loader';
import { Scheme } from '@fuse/services/config';
import { provideEnvironmentNgxMask } from 'ngx-mask';

export const appConfig: ApplicationConfig = {
    providers: [
        provideAnimations(),
        provideHttpClient(),
        provideRouter(appRoutes,
            withPreloading(PreloadAllModules),
            withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
        ),

        // Material Date Adapter
        {
            provide: DateAdapter,
            useClass: LuxonDateAdapter,
        },
        {
            provide: MAT_DATE_FORMATS,
            useValue: {
                parse: {
                    dateInput: 'dd.MM.yyyy', // Input-a yazılanda parse formatı
                },
                display: {
                    dateInput: 'dd.MM.yyyy',        // ← Input-da görünən format
                    monthYearLabel: 'yyyy',    // Calendar header (Yanvar 2019)
                    dateA11yLabel: 'dd.MM.yyyy',    // Accessibility
                    monthYearA11yLabel: 'LLLL yyyy', // Accessibility
                },
            },
        },

        // Transloco Config
        provideTransloco({
            config: {
                availableLangs: [
                    {
                        id: 'az',
                        label: 'Azərbaycan',
                    },
                    {
                        id: 'en',
                        label: 'English',
                    }
                ],
                defaultLang: 'az',
                reRenderOnLangChange: true,
                prodMode: true,
            },
            loader: TranslocoHttpLoader,
        }),
        {
            // Preload the default language before the app starts to prevent empty/jumping content
            provide: APP_INITIALIZER,
            useFactory: () => {
                const translocoService = inject(TranslocoService);
                const defaultLang = translocoService.getDefaultLang();
                translocoService.setActiveLang(defaultLang);

                return () => firstValueFrom(translocoService.load(defaultLang));
            },
            multi: true,
        },

        // CityHub
        provideAuth(),
        provideIcons(),
        provideFuse({
            mockApi: {
                delay: 0,
            },
            fuse: {
                layout: localStorage.getItem('selectedLayout') || 'classic',
                scheme: localStorage.getItem('selectedScheme') as Scheme || 'light',
                screens: {
                    sm: '600px',
                    md: '960px',
                    lg: '1280px',
                    xl: '1440px',
                },
                theme: localStorage.getItem('selectedTheme') || 'theme-default',
                themes: [
                    {
                        id: 'theme-default',
                        name: 'Default',
                        key: 'default'
                    },
                    {
                        id: 'theme-brand',
                        name: 'Brand',
                        key: 'brand'
                    },
                    {
                        id: 'theme-teal',
                        name: 'Teal',
                        key: 'teal'
                    },
                    {
                        id: 'theme-rose',
                        name: 'Rose',
                        key: 'rose'
                    },
                    {
                        id: 'theme-purple',
                        name: 'Purple',
                        key: 'purple'
                    },
                    {
                        id: 'theme-amber',
                        name: 'Amber',
                        key: 'amber'
                    },
                ],
            },
        }),

         provideEnvironmentNgxMask()
    ],
};
