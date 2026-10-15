import { CdkScrollable } from '@angular/cdk/scrolling';
import { Component, ViewEncapsulation } from '@angular/core';
import {  RouterOutlet } from '@angular/router';

@Component({
    selector     : 'complexes',
    standalone   : true,
    templateUrl  : './complexes.component.html',
    encapsulation: ViewEncapsulation.None,
    imports: [CdkScrollable, RouterOutlet]
})
export class ComplexesComponent
{
    /**
     * Constructor
     */
    constructor()
    {
    }
}
