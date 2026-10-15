export interface RoleListItem {
    id: number;
    roleName: string;
    description: string;
}

export interface Role {
    id: number;
    roleName: string;
    description: string;
}

export interface RoleFormData {
    id: number;
    roleName: string;
    description: string;
}

export interface AddRolesToUserRequest {
    userId: number;
    roleIds: number[];
}

export interface RoleMenuItem {
    id: number;
    parentMenuId: number | null;
    menuKey: string;
    menuName: string;
    icon: string | null;
    url: string | null;
    orderIndex: number;
    isSelected: boolean;
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canExport: boolean;
}

export interface FlatMenuItem extends RoleMenuItem {
    level: number;
}

export interface RoleMenuSaveItem {
    menuId: number;
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canExport: boolean;
}

export interface RoleMenuSaveRequest {
    roleId: number;
    menus: RoleMenuSaveItem[];
}
