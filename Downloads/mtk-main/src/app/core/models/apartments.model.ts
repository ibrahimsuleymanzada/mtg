export interface Apartment {
    id: number;
    buildingId?: number;
    apartmentNumber?: string;
    floor: number;
    roomCount?: number;
    area: number;
    apartmentType: number;
    hasBalcony: number;
    balconyArea: number;
    status?: number;
}

export interface ApartmentsListItem {
    id: number;
    buildingId?: number;
    apartmentNumber?: string;
    floor: number;
    roomCount?: number;
    area: number;
    apartmentType: number;
    hasBalcony: number;
    balconyArea: number;
    status?: number;
}

export interface ApartmentFormData {
    id: number;
    buildingId?: number;
    apartmentNumber?: string;
    floor: number;
    roomCount?: number;
    area: number;
    apartmentType: number;
    hasBalcony: number;
    balconyArea: number;
    status?: number;
}