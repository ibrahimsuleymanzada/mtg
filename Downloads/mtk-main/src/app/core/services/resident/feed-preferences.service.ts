import { Injectable } from '@angular/core';

const SKIP_DELETE_CONFIRM_KEY = 'cityhub.feed.skipDeleteConfirm';
const DRAFT_KEY               = 'cityhub.feed.draft';

/**
 * Per-browser feed preferences kept in localStorage.
 * Storage may be unavailable (private mode, blocked site data) or full, so every access is guarded:
 * the feed must keep working, the preference simply does not persist.
 */
@Injectable({ providedIn: 'root' })
export class FeedPreferencesService {

    /** "Bir daha göstərmə": delete a post without asking. */
    get skipDeleteConfirm(): boolean {
        return this._read(SKIP_DELETE_CONFIRM_KEY) === '1';
    }

    set skipDeleteConfirm(value: boolean) {
        value ? this._write(SKIP_DELETE_CONFIRM_KEY, '1') : this._remove(SKIP_DELETE_CONFIRM_KEY);
    }

    /** Unsent text of the composer, restored after a reload. */
    get draft(): string {
        return this._read(DRAFT_KEY) ?? '';
    }

    set draft(value: string) {
        value ? this._write(DRAFT_KEY, value) : this._remove(DRAFT_KEY);
    }

    private _read(key: string): string | null {
        try {
            return localStorage.getItem(key);
        } catch {
            return null;
        }
    }

    private _write(key: string, value: string): void {
        try {
            localStorage.setItem(key, value);
        } catch {
            // storage unavailable or full: ignore
        }
    }

    private _remove(key: string): void {
        try {
            localStorage.removeItem(key);
        } catch {
            // storage unavailable: ignore
        }
    }
}
