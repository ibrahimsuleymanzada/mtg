import { CdkScrollable } from '@angular/cdk/scrolling';
import { Component, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'users',
    standalone: true,
    templateUrl: './users.component.html',
    encapsulation: ViewEncapsulation.None,
    imports: [CdkScrollable, RouterOutlet]
})
export class UsersComponent {}
