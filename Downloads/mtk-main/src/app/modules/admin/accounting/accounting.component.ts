import { CdkScrollable } from '@angular/cdk/scrolling';
import { Component, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
    selector     : 'accounting',
    standalone   : true,
    templateUrl  : './accounting.component.html',
    encapsulation: ViewEncapsulation.None,
    imports: [CdkScrollable, RouterOutlet]
})
export class AccountingComponent
{
    /**
     * Constructor
     */
    constructor()
    {
    }
}
