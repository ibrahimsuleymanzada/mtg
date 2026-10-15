export interface Resident {
    id: number;
    apartmentId: number;
    userId: number | null;
    fullName: string;
    phone: string;
    dateOfBirth: string;
    isRegistered: boolean;
    moveInDate: string;
    moveOutDate: string | null;
    isActive: boolean;
}

export interface ResidentFormData {
    id: number;
    apartmentId: number;
    userId: number | null;
    dateOfBirth: string;
    phone: string;
    moveInDate: string;
    moveOutDate: string | null;
}
