export interface ServiceTariffListItem {
    id: number;
    serviceTypeName: string;
    complexName: string;
    pricePerUnit: number;
    validFrom: string;
}

export interface ServiceTariff {
    id: number;
    serviceTypeRefId: number;
    companyId: number;
    complexId: number;
    calculationTypeRefId: number;
    unitOfMeasureRefId: number;
    pricePerUnit: number;
    minimumCharge: number;
    tier1Limit: number | null;
    tier1Price: number | null;
    tier2Limit: number | null;
    tier2Price: number | null;
    tier3Price: number | null;
    validFrom: string;
    validTo: string | null;
}

export interface ServiceTariffFormData {
    id: number;
    serviceTypeRefId: number;
    companyId: number;
    complexId: number;
    calculationTypeRefId: number;
    unitOfMeasureRefId: number;
    pricePerUnit: number;
    minimumCharge: number;
    tier1Limit: number | null;
    tier1Price: number | null;
    tier2Limit: number | null;
    tier2Price: number | null;
    tier3Price: number | null;
    validFrom: string;
    validTo: string | null;
}
