import { NgIf } from '@angular/common';
import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormsModule, NgForm, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertComponent, FuseAlertType } from '@fuse/components/alert';
import { TranslocoModule } from '@ngneat/transloco';
import { AuthService } from 'app/core/auth/auth.service';
import { LanguagesComponent } from 'app/layout/common/languages/languages.component';
import { finalize, switchMap } from 'rxjs';

@Component({
    selector: 'auth-sign-in',
    templateUrl: './sign-in.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
    standalone: true,
    imports: [RouterLink, FuseAlertComponent, LanguagesComponent, NgIf, TranslocoModule, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatCheckboxModule, MatProgressSpinnerModule],
})
export class AuthSignInComponent implements OnInit {
    @ViewChild('signInNgForm') signInNgForm: NgForm;

    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: '',
    };
    signInForm: UntypedFormGroup;
    showAlert: boolean = false;

    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _authService: AuthService,
        private _formBuilder: UntypedFormBuilder,
        private _router: Router,
    ) {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Create the form
        this.signInForm = this._formBuilder.group({
            username: ['', Validators.required],
            password: ['', Validators.required],
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Sign in
     */
    signIn(): void {
        // Return if the form is invalid
        if (this.signInForm.invalid) {
            return;
        }

        // Disable the form
        this.signInForm.disable();

        // Hide the alert
        this.showAlert = false;

        // Sign in
this._authService.signIn(this.signInForm.value)
        .pipe(
            finalize(() => {
                // Error olsa da, success olsa da form-u enable et
                this.signInForm.enable();
            })
        )
        .pipe(
            switchMap(() => {
                // Sakin / İcarədar → tenant seçimi yoxdur
                if (this._authService.hasRole('5') || this._authService.hasRole('6')) {
                    return [null];
                }
                // Super Admin (role 1) → tenant seçimi yoxdur
                if (this._authService.hasRole('1') || this._authService.isSuperAdmin) {
                    return [null];
                }
                // CompanyAdmin (role 2) → MTK siyahısını çək
                if (this._authService.hasRole('2')) {
                    return this._authService.getMyTenants();
                }
                // Digər rolllar (3, 4, 7 və s.) → birbaşa modules
                return [null];
            })
        )
        .subscribe({
            next: (tenants) => {
                const redirectURL = this._activatedRoute.snapshot.queryParamMap.get('redirectURL');

                // Sakin / İcarədar axını → resident portal
                if (this._authService.hasRole('5') || this._authService.hasRole('6')) {
                    localStorage.setItem('selectedModuleCode', '7');
                    if (redirectURL && redirectURL.startsWith('/resident')) {
                        this._router.navigateByUrl(redirectURL);
                    } else {
                        this._router.navigateByUrl('/resident');
                    }
                    return;
                }

                // Super Admin (role 1) → birbaşa modules, tenant seçimi yoxdur
                if (this._authService.hasRole('1') || this._authService.isSuperAdmin) {
                    this._router.navigateByUrl(redirectURL || '/signed-in-redirect');
                    return;
                }

                // CompanyAdmin (role 2) → tenant siyahısına görə yönləndir
                if (this._authService.hasRole('2')) {
                    const list = tenants as any[];
                    if (!list || list.length === 0) {
                        this._router.navigateByUrl('/select-tenant');
                    } else if (list.length === 1) {
                        this._authService.selectTenant(list[0].id).subscribe({
                            next: () => this._router.navigateByUrl(redirectURL || '/signed-in-redirect'),
                            error: () => this._router.navigateByUrl(redirectURL || '/signed-in-redirect'),
                        });
                    } else {
                        this._router.navigateByUrl('/select-tenant');
                    }
                    return;
                }

                // Digər rolllar → birbaşa modules
                this._router.navigateByUrl(redirectURL || '/signed-in-redirect');
            },
            error: (errorMessage) => {
                console.error('Login error:', errorMessage);
                
                // Form-u reset et
                this.signInNgForm.resetForm();

                // Alert-i göstər
                this.alert = {
                    type: 'error',
                    message: errorMessage
                };
                
                this.showAlert = true;
            }
        });
    }
}
