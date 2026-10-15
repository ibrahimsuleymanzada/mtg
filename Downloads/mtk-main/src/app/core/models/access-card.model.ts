// ─── List (Browse) ───────────────────────────────────────────────────────────
export interface AccessCardListItem {
    id: number;
    cardNumber: string;
    cardType: string;
    user: string;
    complexName: string;
    buildingName: string;
    apartmentNumber: string;
    status: string;
    issueDate: string;
    expiryDate: string;
    orderStatus: string;
    blockReason: string;
}

// ─── Detail (GetById) ─────────────────────────────────────────────────────────
export interface AccessCard {
    id: number;
    cardNumber: string;
    cardType: number;
    cardTypeName: string;
    userId: number;
    user: string;
    status: number;
    statusName: string;
    issueDate: string;
    expiryDate: string;
    orderStatus: string;
    orderDate: string | null;
    deliveredDate: string | null;
    orderNotes: string | null;
    blockReason: string;
    apartmentId: number;
    apartment: string;
    accessLevelIds: number[];
    accessLevelsJson: string | null;
}

// ─── Update Order Status ──────────────────────────────────────────────────────
export interface UpdateCardOrderStatusRequest {
    id: number;
    orderStatus: string;
    deliveredDate: string | null;
    orderNotes: string | null;
}

// ─── Save (Create / Update) ───────────────────────────────────────────────────
export interface AccessCardFormData {
    id: number;
    cardType: number;
    userId: number;
    apartmentId: number;
    status: number;
    issueDate: string;
    expiryDate: string;
    accessLevelIds: number[];
    orderNotes: string | null;
    blockReason: string;
}
