export interface ParkingAssignmentListItem {
    id: number;
    place: string;
    person: string;
    assignmentType: string;
    vehicleNumber: string;
    vehicleBrand: string;
    vehicleModel: string;
    monthlyFee: number;
    contractStartDate: string;
    contractEndDate: string;
}

export interface ParkingAssignment {
    id: number;
    complexId: number;
    complexName: string;
    buildingId: number;
    buildingName: string;
    buildingNumber: string;
    apartmentId: number;
    apartmentNumber: string;
    userId: number;
    userFullname: string;
    assignmentType: number;
    assignmentTypeName: string;
    vehicleNumber: string;
    vehicleBrand: string;
    vehicleModel: string;
    monthlyFee: number;
    contractStartDate: string;
    contractEndDate: string;
}