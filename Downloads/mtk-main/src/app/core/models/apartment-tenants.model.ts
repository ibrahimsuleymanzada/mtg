export interface TenantListItem {
    id: number;
    complexName: string;
    buildingName: string;
    apartmentNumber: string;
    tenantName: string;
    tenantPhone: string;
    monthlyRent: number;
    securityDeposit: number;
    contractStartDate: string;
    contractEndDate: string;
    paymentDay: number;
    ownerName: string;
    isActive: boolean;
}

export interface Tenant {
    id: number;
    userId: number;
    apartmentId: number;
    ownerId: number;
    firstName: string;
    lastName: string;
    fatherName?: string;
    email: string;
    phone: string;
    idcardNumber: string;
    dateOfBirth?: string;
    monthlyRent: number;
    securityDeposit: number;
    contractStartDate: string;
    contractEndDate: string;
    paymentDay: number;
    contractDocumentUrl?: string;
}
