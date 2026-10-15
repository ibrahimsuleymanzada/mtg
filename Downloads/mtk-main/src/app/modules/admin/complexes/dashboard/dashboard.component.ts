import { CdkScrollable } from '@angular/cdk/scrolling';
import { Component, ViewEncapsulation } from '@angular/core';
import {  RouterOutlet } from '@angular/router';

@Component({
    selector     : 'complexes-dashboard',
    standalone   : true,
    templateUrl  : './dashboard.component.html',
    encapsulation: ViewEncapsulation.None,
    imports: []
})
export class DashboardComponent
{
    /**
     * Constructor
     */
    constructor()
    {
    }
}
