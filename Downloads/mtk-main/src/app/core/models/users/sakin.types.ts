export interface SakinListItem {
    id: number;
    userId: number;
    fullName: string;
    complexName: string;
    buildingName: string;
    apartmentNumber: string;
    isMainOwner: boolean;
}

export interface Sakin {
    id: number;
    userId: number;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    apartmentId: number;
    apartmentNumber: string;
    buildingName: string;
    complexName: string;
    isMainOwner: boolean;
    deedNumber: string;
    purchaseDate: string;
    purchasePrice: number;
    startDate: string;
    endDate: string | null;
}

export interface SakinFormData {
    id: number;
    userId: number;
    apartmentId: number;
    purchaseDate: string | null;
    purchasePrice: number | null;
    deedNumber: string;
    isMainOwner: boolean;
    startDate: string;
    endDate: string | null;
    deedFile: null;
}
