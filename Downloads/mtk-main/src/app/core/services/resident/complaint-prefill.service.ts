import { Injectable } from '@angular/core';

export interface ComplaintPrefill {
    title?:       string;
    description?: string;
}

/**
 * One-shot hand-over of a draft to the "Müraciətlər" page.
 * The complaints route takes no parameters, so other pages (e.g. the feed) leave a draft here
 * and navigate to `/resident/request`; the page takes it once and opens the create dialog.
 * Held in memory only: a refresh or a back navigation never reopens a stale draft.
 */
@Injectable({ providedIn: 'root' })
export class ComplaintPrefillService {
    private _draft: ComplaintPrefill | null = null;

    set(draft: ComplaintPrefill): void {
        this._draft = draft;
    }

    take(): ComplaintPrefill | null {
        const draft = this._draft;
        this._draft = null;
        return draft;
    }
}
