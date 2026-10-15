import { CdkScrollable } from '@angular/cdk/scrolling';
import { Component, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'complaints',
    standalone: true,
    templateUrl: './complaints.component.html',
    encapsulation: ViewEncapsulation.None,
    imports: [CdkScrollable, RouterOutlet]
})
export class ComplaintsComponent {}
