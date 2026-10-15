// Browse / GetAll üçün
export interface CommercialRentalListItem {
    id: number;
    complexId: number;
    complexName: string;
    buildingId: number;
    buildingName: string;
    tenantCompanyName: string | null;
    tenantContactName: string;
    tenantPhone: string;
    tenantEmail: string;
    businessType: string | null;
    monthlyRent: number;
    securityDeposit: number | null;
    contractStartDate: string;
    contractEndDate: string | null;
    paymentDay: number;
    contractDocumentURL: string | null;
}

// GetById üçün (userId əlavədir)
export interface CommercialRentalDetail extends CommercialRentalListItem {
    userId: number;
}