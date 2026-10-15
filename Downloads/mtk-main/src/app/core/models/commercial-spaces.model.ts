export interface CommercialSpaceListItem {
    id: number;
    complexName: string;
    buildingName: string;
    spaceNumber: string;
    floor: number;
    spaceType: string;
    area: number;
    description: string;
    hasWater: boolean;
    hasElectricity: boolean;
    hasSewerage: boolean;
    monthlyRent: number;
    securityDeposit: number;
    salePrice: number | null;
}