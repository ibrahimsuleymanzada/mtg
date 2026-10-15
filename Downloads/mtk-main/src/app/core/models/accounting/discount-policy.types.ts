export interface DiscountPolicyListItem {
    id: number;
    targetType: string;
    targetId: number;
    complexId: number | null;
    buildingId: number | null;
    person: string | null;
    discountType: string;
    discountTypeId: number;
    discountValue: number;
    validFrom: string;
    validTo: string;
}

export interface DiscountPolicy {
    id: number;
    targetType: string;
    targetId: number;
    complexId: number | null;
    buildingId: number | null;
    apartmentId: number | null;
    commercialSpaceId: number | null;
    parkingSpaceId: number | null;
    advertisingBoardId: number | null;
    userId: number | null;
    categoryId: number | null;
    discountTypeId: number;
    discountTypeName: string;
    discountValue: number;
    validFrom: string;
    validTo: string;
    description: string;
}

export interface DiscountPolicyFormData {
    id: number;
    targetType: string;
    apartmentId: number | null;
    commercialSpaceId: number | null;
    parkingSpaceId: number | null;
    advertisingBoardId: number | null;
    userId: number | null;
    categoryId: number | null;
    discountTypeId: number;
    discountValue: number;
    validFrom: string;
    validTo: string;
    description: string;
}
