export interface ApartmentOwner {
    id: number;
    userId: number;
    firstName?: string;
    lastName?: string;
    fatherName?: string;
    email?: string;
    phone?: string;
    mobilePhone?: string;
    idcardNumber?: string;
    dateOfBirth?: string;
    person?: string;
    complexId: number;
    complexName: string;
    buildingId: number;
    buildingName: string;
    apartmentId: number;
    apartmentNumber: string;
    purchaseDate: string;
    purchasePrice: number;
    deedNumber?: string;
    deedDocumentURL?: string;
    isMainOwner: boolean;
    startDate: string;
    endDate?: string;
}

export interface ApartmentOwnerListItem {
    id: number;
    person?: string;
    complexName: string;
    buildingName: string;
    apartmentNumber: string;
    purchaseDate: string;
    purchasePrice: number;
    deedNumber?: string;
    deedDocumentURL?: string;
    isMainOwner: boolean;
    startDate: string;
    endDate?: string;
}

export interface ApartmentOwnerFormData {
    id?: number;
    userId: number;
    firstName?: string;
    lastName?: string;
    fatherName?: string;
    email?: string;
    phone?: string;
    mobilePhone?: string;
    idcardNumber?: string;
    dateOfBirth?: string;
    password?: string;
    apartmentId: number;
    purchaseDate: string;
    purchasePrice: number;
    deedNumber?: string;
    isMainOwner: boolean;
    startDate: string;
    endDate?: string;
    deedFile?: File;
}
