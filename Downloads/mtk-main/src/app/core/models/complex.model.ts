export interface Complex {
    id: number;
    companyId?: number;
    companyName?: string;
    complexName: string;
    address: string;
    totalArea: number;
    landArea: number;
    totalBuildings: number;
    longitude?: number;
    latitude?: number;
}

export interface ComplexListItem {
    id: number;
    companyName: string;
    complexName: string;
    address: string;
    totalArea: number;
    landArea: number;
    totalBuildings: number;
}

export interface ComplexFormData {
    id: number;
    companyId: number;
    complexName: string;
    address: string;
    totalArea: number;
    landArea: number;
    totalBuildings: number;
    latitude?: number;
    longitude?: number;
}