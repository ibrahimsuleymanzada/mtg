import {
    ChangeDetectionStrategy, Component, HostListener, Inject, ViewEncapsulation,
} from '@angular/core';
import { NgFor, NgIf, NgSwitch, NgSwitchCase } from '@angular/common';
import { SafeUrl } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoModule } from '@ngneat/transloco';

export interface LightboxItem {
    type: 'image' | 'video';
    src:  string | SafeUrl;
    name: string;
}

export interface LightboxData {
    items: LightboxItem[];
    index: number;
}

/**
 * Full-screen media viewer: arrows / swipe / keyboard navigation, Esc or a click outside the media closes it.
 * Works with any URL, including local blob URLs of files that are not uploaded yet.
 */
@Component({
    selector        : 'feed-lightbox',
    templateUrl     : './feed-lightbox.component.html',
    styleUrls       : ['./feed-lightbox.component.scss'],
    encapsulation   : ViewEncapsulation.None,
    changeDetection : ChangeDetectionStrategy.OnPush,
    standalone      : true,
    imports         : [NgFor, NgIf, NgSwitch, NgSwitchCase, MatButtonModule, MatDialogModule, MatIconModule, TranslocoModule],
})
export class FeedLightboxComponent {
    items: LightboxItem[];
    index: number;

    private _touchStartX: number | null = null;

    constructor(
        @Inject(MAT_DIALOG_DATA) data: LightboxData,
        private _dialogRef: MatDialogRef<FeedLightboxComponent>,
    ) {
        this.items = data.items;
        this.index = Math.min(Math.max(data.index, 0), data.items.length - 1);
    }

    get current(): LightboxItem[] {
        return [this.items[this.index]];   // one-element list: ngFor re-creates the node on change, replaying the CSS fade
    }

    get hasMany(): boolean {
        return this.items.length > 1;
    }

    prev(): void {
        this.index = (this.index - 1 + this.items.length) % this.items.length;
    }

    next(): void {
        this.index = (this.index + 1) % this.items.length;
    }

    close(): void {
        this._dialogRef.close();
    }

    /** Clicking the dark area around the media (not the media or the controls) closes the viewer. */
    onStageClick(event: MouseEvent): void {
        if (event.target === event.currentTarget) {
            this.close();
        }
    }

    @HostListener('document:keydown', ['$event'])
    onKey(event: KeyboardEvent): void {
        if (!this.hasMany) return;
        if (event.key === 'ArrowLeft')  { this.prev(); event.preventDefault(); }
        if (event.key === 'ArrowRight') { this.next(); event.preventDefault(); }
    }

    onTouchStart(event: TouchEvent): void {
        this._touchStartX = event.changedTouches[0].clientX;
    }

    onTouchEnd(event: TouchEvent): void {
        if (this._touchStartX === null || !this.hasMany) return;
        const dx = event.changedTouches[0].clientX - this._touchStartX;
        this._touchStartX = null;
        if (Math.abs(dx) > 50) {
            dx > 0 ? this.prev() : this.next();
        }
    }
}
