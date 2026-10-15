import { CdkScrollable } from '@angular/cdk/scrolling';
import { Component, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'reports',
    standalone: true,
    templateUrl: './reports.component.html',
    encapsulation: ViewEncapsulation.None,
    imports: [CdkScrollable, RouterOutlet]
})
export class ReportsComponent {}
