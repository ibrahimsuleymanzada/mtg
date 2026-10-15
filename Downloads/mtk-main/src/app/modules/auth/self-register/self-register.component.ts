import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { TranslocoModule } from '@ngneat/transloco';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertComponent, FuseAlertType } from '@fuse/components/alert';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import { DropdownService } from 'app/core/services/dropdown.service';
import { DropdownItem } from 'app/core/models/dropdown.model';
import { LanguagesComponent } from 'app/layout/common/languages/languages.component';
import { NgxMaskDirective } from 'ngx-mask';

@Component({
    selector: 'auth-self-register',
    templateUrl: './self-register.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterLink,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatSelectModule,
        MatProgressSpinnerModule,
        MatStepperModule,
        MatDatepickerModule,
        TranslocoModule,
        FuseAlertComponent,
        LanguagesComponent,
        NgxMaskDirective
    ],
})
export class SelfRegisterComponent implements OnInit {
    targetForm: FormGroup;
    personalForm: FormGroup;

    companies: DropdownItem[] = [];
    complexes: DropdownItem[] = [];
    buildings: DropdownItem[] = [];
    units: DropdownItem[] = [];

    loadingCompanies = false;
    loadingComplexes = false;
    loadingBuildings = false;
    loadingUnits = false;
    saving = false;

    alert: { type: FuseAlertType; message: string } = { type: 'success', message: '' };
    showAlert = false;
    success = false;

    targetTypes = [
        { value: 'Apartment',       label: 'Mənzil' },
        { value: 'ParkingSpace',    label: 'Qaraj' },
        { value: 'CommercialSpace', label: 'Ticarət obyekti' },
    ];

    private apiUrl = environment.apiUrl;

    constructor(
        private _fb: FormBuilder,
        private _router: Router,
        private _http: HttpClient,
        private _dropdownService: DropdownService,
    ) {}

    ngOnInit(): void {
        this._initForms();
        this._loadCompanies();
    }

    private _initForms(): void {
        this.targetForm = this._fb.group({
            targetType:  [null, Validators.required],
            companyId:   [null, Validators.required],
            complexId:   [null, Validators.required],
            buildingId:  [null, Validators.required],
            targetId:    [null, Validators.required],
            deedNumber:  [null, Validators.required],
        });

        this.personalForm = this._fb.group({
            firstName:    [null, Validators.required],
            lastName:     [null, Validators.required],
            fatherName:   [null],
            idcardNumber: [null, [Validators.required, Validators.pattern(/^[A-Z0-9]{7}$/)]],
            phone:        [null, Validators.required],
            email:        [null, [Validators.email]],
            password:     [null, [Validators.required, Validators.minLength(6)]],
        });

        this.targetForm.get('companyId')?.valueChanges.subscribe(v => {
            this.targetForm.patchValue({ complexId: null, buildingId: null, targetId: null });
            this.complexes = []; this.buildings = []; this.units = [];
            if (v) this._loadComplexes(v);
        });

        this.targetForm.get('complexId')?.valueChanges.subscribe(v => {
            this.targetForm.patchValue({ buildingId: null, targetId: null });
            this.buildings = []; this.units = [];
            if (v) this._loadBuildings(v);
        });

        this.targetForm.get('buildingId')?.valueChanges.subscribe(v => {
            this.targetForm.patchValue({ targetId: null });
            this.units = [];
            const type = this.targetForm.get('targetType')?.value;
            if (v && type) this._loadUnits(v, type);
        });

        this.targetForm.get('targetType')?.valueChanges.subscribe(() => {
            this.targetForm.patchValue({ targetId: null });
            this.units = [];
            const buildingId = this.targetForm.get('buildingId')?.value;
            const type = this.targetForm.get('targetType')?.value;
            if (buildingId && type) this._loadUnits(buildingId, type);
        });
    }

    private _loadCompanies(): void {
        this.loadingCompanies = true;
        this._dropdownService.getPublicCompanies().subscribe({
            next: (data) => { this.companies = data; this.loadingCompanies = false; },
            error: () => { this.loadingCompanies = false; },
        });
    }

    private _loadComplexes(companyId: number): void {
        this.loadingComplexes = true;
        this._dropdownService.getPublicComplexes(companyId).subscribe({
            next: (data) => { this.complexes = data; this.loadingComplexes = false; },
            error: () => { this.loadingComplexes = false; },
        });
    }

    private _loadBuildings(complexId: number): void {
        this.loadingBuildings = true;
        this._dropdownService.getPublicBuildings(complexId).subscribe({
            next: (data) => { this.buildings = data; this.loadingBuildings = false; },
            error: () => { this.loadingBuildings = false; },
        });
    }

    private _loadUnits(buildingId: number, type: string): void {
        this.loadingUnits = true;
        let obs$;
        if (type === 'Apartment') {
            obs$ = this._dropdownService.getPublicApartments(buildingId);
        } else if (type === 'ParkingSpace') {
            obs$ = this._dropdownService.getPublicParkingSpaces(buildingId);
        } else {
            obs$ = this._dropdownService.getPublicCommercialSpaces(buildingId);
        }
        obs$.subscribe({
            next: (data) => { this.units = data; this.loadingUnits = false; },
            error: () => { this.loadingUnits = false; },
        });
    }

    onFINInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        const value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        this.personalForm.get('idcardNumber')?.setValue(value, { emitEvent: false });
        input.value = value;
    }

    onSubmit(): void {
        if (this.targetForm.invalid || this.personalForm.invalid) {
            this.targetForm.markAllAsTouched();
            this.personalForm.markAllAsTouched();
            return;
        }
        this.saving = true;
        this.showAlert = false;

        const payload = {
            ...this.personalForm.value,
            targetType: this.targetForm.get('targetType')?.value,
            targetId:   this.targetForm.get('targetId')?.value,
            deedNumber: this.targetForm.get('deedNumber')?.value,
        };

        this._http.post<any>(`${this.apiUrl}/system/auth/SelfRegister`, payload).subscribe({
            next: (response) => {
                this.saving = false;
                if (response.status) {
                    this.success = true;
                } else {
                    this.alert = { type: 'error', message: response.message || 'Xəta baş verdi' };
                    this.showAlert = true;
                }
            },
            error: (err) => {
                this.saving = false;
                this.alert = {
                    type: 'error',
                    message: err?.error?.message || err?.error?.Message || 'Xəta baş verdi',
                };
                this.showAlert = true;
            },
        });
    }

    goToSignIn(): void {
        this._router.navigateByUrl('/sign-in');
    }
}
