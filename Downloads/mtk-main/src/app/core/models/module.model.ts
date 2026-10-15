// app/core/models/module.model.ts
export interface ModuleItem {
    code: string;
    title: string;
    icon?: string;
    color?: string;
    menuCount?: number;
    url?: string; // Frontend üçün
}

export interface ModulesResponse {
    status: boolean;
    message: string;
    data: ModuleItem[];
    statusCode: number;
    errors: any;
    timestamp: string;
}