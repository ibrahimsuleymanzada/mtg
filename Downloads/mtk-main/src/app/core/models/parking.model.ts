export interface Parking {
    id: number;
    complexId: number;
    complexName: string;
    buildingId: number;
    buildingName: string;
    spaceNumber: string;
    spaceTypeId: number;
    spaceTypeName: string;
    level: number;
    monthlyRentalPrice?: number;
    salePrice?: number;
    isElectricCharging: boolean;
    statusId: number;
    statusName?: string;
}

export interface ParkingListItem {
    id: number;
    complexName: string;
    buildingName: string;
    spaceNumber: string;
    spaceType: string;
    level: number;
    monthlyRentalPrice?: number;
    salePrice?: number;
    isElectricCharging: boolean;
    status: string;
}

