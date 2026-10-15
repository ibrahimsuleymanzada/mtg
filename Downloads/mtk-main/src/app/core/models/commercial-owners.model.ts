export interface CommercialOwnerListItem {
    id: number;
    ownerName: string;
    phone: string;
    complexName: string;
    buildingName: string;
    spaceNumber: string;
    spaceTypeName: string;
    purchaseDate: string;
    purchasePrice: number;
    deedNumber: string;
    isMainOwner: boolean;
    isActive: boolean;
}

export interface CommercialOwner {
    id: number;
    userId: number;
    spaceId: number;
    firstName: string;
    lastName: string;
    fatherName?: string;
    email: string;
    phone?: string;
    idcardNumber: string;
    purchaseDate: string;
    purchasePrice: number;
    deedNumber?: string;
    deedDocumentUrl?: string;
    isMainOwner: boolean;
    startDate: string;
    endDate?: string;
}
