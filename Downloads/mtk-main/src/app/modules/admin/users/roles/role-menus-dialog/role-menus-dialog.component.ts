import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NotificationService } from 'app/core/services/notification.service';
import { RolesService } from 'app/core/services/users/roles.service';
import { FlatMenuItem, RoleMenuItem, RoleMenuSaveRequest } from 'app/core/models/users/role.types';
import { TranslocoModule } from '@ngneat/transloco';

interface MenuGroup {
    moduleKey: string;
    moduleName: string;
    moduleIcon: string;
    isResident: boolean;
    items: FlatMenuItem[];
}

const MODULE_MAP: Record<string, { name: string; icon: string; isResident: boolean }> = {
    complexes:      { name: 'Komplekslər',         icon: 'heroicons_outline:building-office-2',   isResident: false },
    accounting:     { name: 'Mühasibatlıq',         icon: 'heroicons_outline:calculator',          isResident: false },
    general:        { name: 'Ümumi',                icon: 'heroicons_outline:globe-alt',           isResident: false },
    reports:        { name: 'Hesabatlar',           icon: 'heroicons_outline:chart-pie',           isResident: false },
    configurations: { name: 'Tənzimləmələr',        icon: 'heroicons_outline:cog-8-tooth',         isResident: false },
    resident:       { name: 'İstifadəçi Portalı',   icon: 'heroicons_outline:device-phone-mobile', isResident: true  },
};

const ADMIN_ORDER = ['complexes', 'accounting', 'general', 'reports', 'configurations'];

@Component({
    selector: 'role-menus-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatCheckboxModule,
        MatTooltipModule,
        TranslocoModule,
    ],
    templateUrl: './role-menus-dialog.component.html'
})
export class RoleMenusDialogComponent implements OnInit {
    menuGroups: MenuGroup[] = [];
    loading = true;
    saving = false;

    constructor(
        public dialogRef: MatDialogRef<RoleMenusDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { roleId: number; roleName: string },
        private rolesService: RolesService,
        private notificationService: NotificationService,
    ) {}

    ngOnInit(): void {
        this.loadMenus();
    }

    loadMenus(): void {
        this.loading = true;
        this.rolesService.getMenusByRoleId(this.data.roleId).subscribe({
            next: (response) => {
                if (response.status && response.data) {
                    this.menuGroups = this.buildGroups(response.data);
                }
                this.loading = false;
            },
            error: () => {
                this.notificationService.error('Menyular yüklənərkən xəta baş verdi');
                this.loading = false;
            }
        });
    }

    private buildGroups(items: RoleMenuItem[]): MenuGroup[] {
        const sorted = [...items].sort((a, b) => a.orderIndex - b.orderIndex);

        const groupMap = new Map<string, FlatMenuItem[]>();
        for (const item of sorted) {
            const key = this.getModuleKey(item.url);
            if (!groupMap.has(key)) groupMap.set(key, []);
            groupMap.get(key)!.push({
                ...item,
                level: 0,
                canView:   item.canView   ?? false,
                canCreate: item.canCreate ?? false,
                canEdit:   item.canEdit   ?? false,
                canDelete: item.canDelete ?? false,
                canExport: item.canExport ?? false,
            });
        }

        const groups: MenuGroup[] = [];

        for (const key of ADMIN_ORDER) {
            if (groupMap.has(key)) {
                const mod = MODULE_MAP[key] ?? { name: key, icon: 'heroicons_outline:squares-2x2', isResident: false };
                groups.push({ moduleKey: key, moduleName: mod.name, moduleIcon: mod.icon, isResident: false, items: groupMap.get(key)! });
            }
        }

        if (groupMap.has('resident')) {
            const mod = MODULE_MAP['resident'];
            groups.push({ moduleKey: 'resident', moduleName: mod.name, moduleIcon: mod.icon, isResident: true, items: groupMap.get('resident')! });
        }

        // Unknown keys
        for (const [key, groupItems] of groupMap) {
            if (!ADMIN_ORDER.includes(key) && key !== 'resident') {
                groups.push({ moduleKey: key, moduleName: key, moduleIcon: 'heroicons_outline:squares-2x2', isResident: false, items: groupItems });
            }
        }

        return groups;
    }

    private getModuleKey(url: string | null): string {
        if (!url) return 'other';
        const match = url.match(/^\/([^/]+)/);
        return match ? match[1] : 'other';
    }

    private get allItems(): FlatMenuItem[] {
        return this.menuGroups.flatMap(g => g.items);
    }

    onToggleSelect(item: FlatMenuItem): void {
        item.isSelected = !item.isSelected;
        if (!item.isSelected) {
            item.canView = false;
            item.canCreate = false;
            item.canEdit = false;
            item.canDelete = false;
            item.canExport = false;
        } else {
            item.canView = true;
        }
    }

    onSave(): void {
        this.saving = true;
        const request: RoleMenuSaveRequest = {
            roleId: this.data.roleId,
            menus: this.allItems
                .filter(m => m.isSelected)
                .map(m => ({
                    menuId:    m.id,
                    canView:   m.canView,
                    canCreate: m.canCreate,
                    canEdit:   m.canEdit,
                    canDelete: m.canDelete,
                    canExport: m.canExport,
                }))
        };
        this.rolesService.saveRoleMenus(request).subscribe({
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

    onClose(): void {
        this.dialogRef.close(false);
    }
}
