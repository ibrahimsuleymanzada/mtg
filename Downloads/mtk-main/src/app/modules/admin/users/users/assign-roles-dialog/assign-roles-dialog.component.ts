import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { NotificationService } from 'app/core/services/notification.service';
import { RolesService } from 'app/core/services/users/roles.service';
import { UsersService } from 'app/core/services/users/users.service';
import { RoleListItem } from 'app/core/models/users/role.types';
import { TranslocoModule } from '@ngneat/transloco';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'assign-roles-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatCheckboxModule,
        MatDividerModule,
        TranslocoModule,
    ],
    templateUrl: './assign-roles-dialog.component.html'
})
export class AssignRolesDialogComponent implements OnInit {
    allRoles: RoleListItem[] = [];
    selectedRoleIds: Set<number> = new Set();
    loading = true;
    saving = false;

    constructor(
        public dialogRef: MatDialogRef<AssignRolesDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { userId: number; username: string },
        private rolesService: RolesService,
        private usersService: UsersService,
        private notificationService: NotificationService,
    ) {}

    ngOnInit(): void {
        const rolesRequest = {
            nextPageNumber: 1,
            visibleItemCount: 1000,
            filters: [],
            currentPageName: 'roles',
            exportToExcel: false,
        } as any;

        forkJoin({
            roles: this.rolesService.getAllRoles(rolesRequest),
            user: this.usersService.getUserById(this.data.userId),
        }).subscribe({
            next: ({ roles, user }) => {
                if (roles.status && roles.data) {
                    this.allRoles = roles.data.result;
                }
                if (user.status && user.data) {
                    const assignedIds = user.data.roles
                        .filter(r => r.isActive)
                        .map(r => r.roleId);
                    this.selectedRoleIds = new Set(assignedIds);
                }
                this.loading = false;
            },
            error: () => {
                this.notificationService.error('Məlumatlar yüklənərkən xəta baş verdi');
                this.loading = false;
            }
        });
    }

    toggleRole(roleId: number): void {
        if (this.selectedRoleIds.has(roleId)) {
            this.selectedRoleIds.delete(roleId);
        } else {
            this.selectedRoleIds.add(roleId);
        }
    }

    isChecked(roleId: number): boolean {
        return this.selectedRoleIds.has(roleId);
    }

    onSave(): void {
        this.saving = true;
        this.rolesService.addRolesToUser({
            userId: this.data.userId,
            roleIds: Array.from(this.selectedRoleIds),
        }).subscribe({
            next: (response) => {
                if (response.status) {
                    this.dialogRef.close(true);
                    this.notificationService.success(response.message);
                } else {
                    this.notificationService.info(response.message);
                }
                this.saving = false;
            },
            error: () => {
                this.notificationService.error('Yadda saxlanarkən xəta baş verdi');
                this.saving = false;
            }
        });
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }
}
