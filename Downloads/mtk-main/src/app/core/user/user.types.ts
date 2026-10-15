export interface User
{
    userId: string;
    username: string;
    firstName: string;
    lastName: string;
    fullName?: string;
    email: string;
    avatar?: string;
    status?: string;
    isSuperAdmin?: boolean;
    selectedComplexId?: number;
    selectedCompanyId?: number;
}

export interface TenantItem
{
    id: number;
    complexName: string;
    companyId: number;
}
