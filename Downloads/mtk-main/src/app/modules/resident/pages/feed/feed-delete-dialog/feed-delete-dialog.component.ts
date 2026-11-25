import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoModule } from '@ngneat/transloco';

export interface FeedDeleteDialogResult {
    confirmed:    boolean;
    dontAskAgain: boolean;
}

/**
 * Delete confirmation with a "don't show this again" checkbox.
 * FuseConfirmationService has no checkbox support, so this follows its look (icon, title, grey action bar).
 * Closes with a FeedDeleteDialogResult; dismissing (X / Esc / backdrop) closes with `undefined`.
 */
@Component({
    selector        : 'feed-delete-dialog',
    templateUrl     : './feed-delete-dialog.component.html',
    encapsulation   : ViewEncapsulation.None,
    changeDetection : ChangeDetectionStrategy.OnPush,
    standalone      : true,
    imports         : [FormsModule, MatButtonModule, MatCheckboxModule, MatDialogModule, MatIconModule, TranslocoModule],
    styles          : [`
        .feed-delete-dialog-panel .mat-mdc-dialog-container .mat-mdc-dialog-surface {
            padding: 0 !important;
        }
    `],
})
export class FeedDeleteDialogComponent {
    dontAskAgain = false;

    constructor(private _dialogRef: MatDialogRef<FeedDeleteDialogComponent, FeedDeleteDialogResult>) {}

    close(confirmed: boolean): void {
        // "Don't ask again" only makes sense together with a confirmed deletion.
        this._dialogRef.close({ confirmed, dontAskAgain: confirmed && this.dontAskAgain });
    }
}
