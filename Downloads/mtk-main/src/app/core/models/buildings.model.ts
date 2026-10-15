export interface Building {
    id: number;
    complexId: number;
    buildingName: string;
    buildingNumber: string;
    totalFloors: number;
    totalApartments: number;
    buildingType: string;
    hasElevator: boolean;
    elevatorCount: number;
    hasParking: boolean;
    constructionYear: number;
    address: string;
}


export interface BuildingsListItem {
    id: number;
    complexName: string;
    buildingName: string;
    buildingNumber: string;
    totalFloors: number;
    totalApartments: number;
    buildingType: string;
    hasElevator: boolean;
    elevatorCount: number;
    hasParking: boolean;
    constructionYear: number;
    address: string;
}

export interface BuildingsFormData {
    id: number;
    complexId: number;
    buildingName: string;
    buildingNumber: string;
    totalFloors: number;
    totalApartments: number;
    buildingType: string;
    hasElevator: boolean;
    elevatorCount: number;
    hasParking: boolean;
    constructionYear: number;
    address: string;
}