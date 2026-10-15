export interface Payment {
    id: number;
    complexId: number;
    complexName: string;
    buildingId: number;
    buildingName: string;
    apartmentId: number;
    apartmentNumber: string;
    residentName: string;
    amount: number;
    paymentDate: string;
    paymentTypeId: number;
    paymentTypeName: string;
    statusId: number;
    statusName: string;
    description: string;
}

export interface PaymentListItem {
    id: number;
    complexName: string;
    buildingName: string;
    apartmentNumber: string;
    residentName: string;
    amount: number;
    paymentDate: string;
    paymentType: string;
    status: string;
    description: string;
}
