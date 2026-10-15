import { CdkScrollable } from '@angular/cdk/scrolling';
import { Component, ViewEncapsulation } from '@angular/core';

@Component({
    selector     : 'example',
    standalone   : true,
    templateUrl  : './example.component.html',
    encapsulation: ViewEncapsulation.None,
    imports: [CdkScrollable]
})
export class ExampleComponent
{
    /**
     * Constructor
     */
    constructor()
    {
    }
}
