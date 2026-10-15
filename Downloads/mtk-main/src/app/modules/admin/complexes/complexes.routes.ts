import { Routes } from '@angular/router';
import { ComplexesComponent } from './complexes.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ComplexComponent } from './complex/complex.component';
import { BuildingsComponent } from './buildings/buildings.component';
import { ApartmentsComponent } from './apartments/apartments.component';
import { ApartmentOwnersComponent } from './apartment-owners/apartment-owners.component';
import { ApartmentTenantsComponent } from './apartment-tenants/apartment-tenants.component';
import { ParkingComponent } from './parking/parking.component';
import { ParkingAssignmentsComponent } from './parking-assignments/parking-assignments.component';
import { CommercialSpacesComponent } from './commercial-spaces/commercial-spaces.component';
import { CommercialRentalsComponent } from './commercial-rentals/commercial-rentals.component';
import { AccessCardsComponent } from './access-cards/access-cards.component';
import { AdvertisingBoardsComponent } from './advertising-boards/advertising-boards.component';
import { AdvertisingRentalComponent } from './advertising-rental/advertising-rental.component';
import { CommercialOwnersComponent } from './commercial-owners/commercial-owners.component';
import { InventoryComponent } from './inventory/inventory.component';
import { ContractorsComponent } from './contractors/contractors.component';
import { ContractorContractsComponent } from './contractor-contracts/contractor-contracts.component';
import { PendingClaimsComponent } from './pending-claims/pending-claims.component';
import { GuestVehiclesComponent } from './guest-vehicles/guest-vehicles.component';
export default [
    {
        path: '',
        component: ComplexesComponent,
        children: [
            {
                path: 'dashboard', component: DashboardComponent
            },
            {
                path: 'complexes', component: ComplexComponent
            },
            {
                path: 'building', component: BuildingsComponent
            },
            {
                path: 'apartments', component: ApartmentsComponent
            },
            {
                path: 'aparment-owner', component: ApartmentOwnersComponent
            },
            {
                path: 'aparmetn-tenant', component: ApartmentTenantsComponent
            },
            {
                path: 'parking', component: ParkingComponent
            },
            {
                path: 'parking-owner', component: ParkingAssignmentsComponent
            },
            {
                path: 'objects', component: CommercialSpacesComponent
            },
            {
                path: 'object-tenant', component: CommercialRentalsComponent
            },
            {
                path: 'accesscard', component: AccessCardsComponent
            },
            {
                path: 'advertisingboard', component: AdvertisingBoardsComponent
            },
                        {
                path: 'advertisingrental', component: AdvertisingRentalComponent
            },
            {
                path: 'objectowner', component: CommercialOwnersComponent
            },
            {
                path: 'inventory', component: InventoryComponent
            },
            {
                path: 'contractors', component: ContractorsComponent
            },
            {
                path: 'contractor-contracts', component: ContractorContractsComponent
            },
            {
                path: 'pending-claims', component: PendingClaimsComponent
            },
            {
                path: 'guest-vehicles', component: GuestVehiclesComponent
            },
            // Default redirect
            {
                path: '',
                redirectTo: 'complexes',
                pathMatch: 'full'
            }
        ]
    },
] as Routes;
