import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { TranslocoModule } from '@ngneat/transloco';

@Component({
    selector        : 'resident-dashboard',
    templateUrl     : './dashboard.component.html',
    encapsulation   : ViewEncapsulation.None,
    changeDetection : ChangeDetectionStrategy.OnPush,
    standalone      : true,
    imports         : [TranslocoModule],
})
export class ResidentDashboardComponent {}
