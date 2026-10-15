import { NgFor, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { AvailableLangs, TranslocoService } from '@ngneat/transloco';

@Component({
    selector: 'languages',
    templateUrl: './languages.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    exportAs: 'languages',
    standalone: true,
    imports: [MatButtonModule, MatMenuModule, NgTemplateOutlet, NgFor],
})
export class LanguagesComponent implements OnInit, OnDestroy {
    availableLangs: AvailableLangs;
    activeLang: string;
    flagCodes: any;

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _translocoService: TranslocoService,
    ) {
    }

    ngOnInit(): void {
        // Get the available languages from transloco
        this.availableLangs = this._translocoService.getAvailableLangs();

        const savedLang = localStorage.getItem('selectedLanguage') || 'az';

        // Əgər saxlanılmış dil varsa, onu aktiv et
        if (savedLang && this.isValidLang(savedLang)) {
            this._translocoService.setActiveLang(savedLang);
            this._translocoService.load(savedLang).subscribe();
        }

        // Subscribe to language changes
        this._translocoService.langChanges$.subscribe((activeLang) => {
            // Get the active lang
            this.activeLang = activeLang;

            // Update the navigation
        });

        // Set the country iso codes for languages for flags
        this.flagCodes = {
            'az': 'az',
            'en': 'us',
        };
    }

    ngOnDestroy(): void {
    }


    setActiveLang(lang: string): void {
        this._translocoService.setActiveLang(lang);
        localStorage.setItem('selectedLanguage', lang);
        // Preload - faylı əvvəlcədən yükləyir
        this._translocoService.load(lang).subscribe();
    }

    private isValidLang(lang: string): boolean {
        const langs = this.availableLangs as any[];
        return langs.some(l => l.id === lang);
    }


    trackByFn(index: number, item: any): any {
        return item.id || index;
    }



}
