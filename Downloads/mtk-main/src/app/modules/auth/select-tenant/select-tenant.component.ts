import { NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { TranslocoModule } from '@ngneat/transloco';
import { AuthService } from 'app/core/auth/auth.service';
import { DropdownItem } from 'app/core/models/dropdown.model';
import { DropdownService } from 'app/core/services/dropdown.service';
import { ComplexService } from 'app/core/services/complexes/complex.service';
import { NotificationService } from 'app/core/services/notification.service';
import { TenantItem } from 'app/core/user/user.types';
import { LanguagesComponent } from 'app/layout/common/languages/languages.component';

@Component({
    selector: 'select-tenant',
    templateUrl: './select-tenant.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        NgIf, NgFor,
        ReactiveFormsModule,
        TranslocoModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        LanguagesComponent,
    ],
})
export class SelectTenantComponent implements OnInit {
    tenants: TenantItem[] = [];
    loading = true;
    selecting = false;

    showCreateForm = false;
    companies: any[] = [];
    companiesLoading = false;
    createForm: FormGroup;
    creating = false;

    constructor(
        private _authService: AuthService,
        private _router: Router,
        private _cdr: ChangeDetectorRef,
        private _fb: FormBuilder,
        private _dropdownService: DropdownService,
        private _complexService: ComplexService,
        private _notificationService: NotificationService,
    ) {
        this.createForm = this._fb.group({
            companyId:      [null, Validators.required],
            complexName:    ['', Validators.required],
            address:        [''],
            totalArea:      [0],
            landArea:       [0],
            totalBuildings: [0],
        });
    }

    ngOnInit(): void {
        this._authService.getMyTenants().subscribe({
            next: (list) => {
                this.tenants = list;
                this.loading = false;
                if (list.length === 0) {
                    this.showCreateForm = true;
                    this._loadCompanies();
                }
                this._cdr.markForCheck();
            },
            error: () => {
                this.loading = false;
                this._cdr.markForCheck();
            },
        });
    }

    selectTenant(tenant: TenantItem): void {
        if (this.selecting) return;
        this.selecting = true;
        this._authService.selectTenant(tenant.id).subscribe({
            next: () => this._router.navigateByUrl('/signed-in-redirect'),
            error: () => {
                this.selecting = false;
                this._cdr.markForCheck();
            },
        });
    }

    onCreateMtk(): void {
        if (this.createForm.invalid || this.creating) return;
        this.creating = true;
        const formValue = this.createForm.value;
        this._complexService.saveComplex({
            id:             0,
            companyId:      formValue.companyId,
            complexName:    formValue.complexName,
            address:        formValue.address || '',
            totalArea:      formValue.totalArea || 0,
            landArea:       formValue.landArea || 0,
            totalBuildings: formValue.totalBuildings || 0,
        }).subscribe({
            next: (res) => {
                if (res.status) {
                    this._notificationService.success(res.message);
                    this._authService.getMyTenants().subscribe({
                        next: (list) => {
                            if (list.length > 0) {
                                this.showCreateForm = false;
                                this.tenants = list;
                                this._cdr.markForCheck();
                                this.selectTenant(list[0]);
                            } else {
                                this.creating = false;
                                this._cdr.markForCheck();
                            }
                        },
                        error: () => {
                            this.creating = false;
                            this._cdr.markForCheck();
                        },
                    });
                } else {
                    this._notificationService.error(res.message);
                    this.creating = false;
                    this._cdr.markForCheck();
                }
            },
            error: () => {
                this.creating = false;
                this._cdr.markForCheck();
            },
        });
    }

    private _loadCompanies(): void {
        this.companiesLoading = true;
        this._dropdownService.getCompaniesDropdown().subscribe({
            next: (list) => {
                this.companies = list;
                this.companiesLoading = false;
                if (list.length === 1) {
                    this.createForm.patchValue({ companyId: list[0].key });
                }
                this._cdr.markForCheck();
            },
            error: () => {
                this.companiesLoading = false;
                this._cdr.markForCheck();
            },
        });
    }
}
