export interface ApartmentResidents {
    id: number;
    userId: number;
    username: string;
    complexId: number;
    complexName: string;
    buildingId: number;
    buildingName: string;
    apartmentId: number;
    apartmentNumber: string;
    dateOfBirth: string;
    phone: number;
    moveInDate: string;
    moveOutDate?: string;
}

export interface ApartmentResidentsListItem {
    id: number;
    complexName: string;
    buildingName: string;
    apartmentNumber: string;
    resident: number;
    dateOfBirth: number;
    phone: number;
    moveInDate: number;
    moveOutDate: number;
}

export interface ApartmentResidentsFormData {
    id: number;
    userId: number;
    apartmentId: number;
    dateOfBirth: string;
    phone: number;
    moveInDate: string;
    moveOutDate?: string;
}