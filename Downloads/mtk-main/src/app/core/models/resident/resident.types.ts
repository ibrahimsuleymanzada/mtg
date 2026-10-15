export interface ResidentInvoiceListItem {
    id:              number;
    invoiceNumber:   string;
    categoryName:    string;
    amount:          number;
    paidAmount:      number;
    remainingAmount: number;
    discount:        number;
    lateFee:         number;
    status:          string; // 'Pending' | 'Paid' | 'Overdue' | 'Cancelled'
    issueDate:       string;
    dueDate:         string;
    paidDate:        string | null;
    notes:           string | null;
}

export interface ResidentPaymentListItem {
    id:            number;
    invoiceNumber: string;
    categoryName:  string;
    amount:        number;
    paymentMethod: string;
    paymentDate:   string;
    receiptNumber: string | null;
    transactionId: string | null;
    notes:         string | null;
}

export interface ResidentPaymentFormData {
    invoiceId:     number;
    amount:        number;
    paymentMethod: string;
    paymentDate:   string;
    notes:         string | null;
}

// --- Complaints ---

export interface ResidentComplaintListItem {
    id:              number;
    complaintNumber: string;
    categoryName:    string;
    title:           string;
    priority:        string;
    status:          string;
    createdDate:     string;
}

export interface ResidentComplaint {
    id:             number;
    categoryId:     number;
    apartmentId:    number;
    title:          string;
    description:    string;
    location:       string;
    priority:       string;
    status:         string;
    isAnonymous:    boolean;
    attachmentsUrl: string | null;
}

export interface ResidentComplaintFormData {
    id:             number;
    categoryId:     number;
    apartmentId:    number;
    title:          string;
    description:    string;
    location:       string;
    priority:       string;
    isAnonymous:    boolean;
    attachmentsUrl: string | null;
}

export interface ResidentComplaintMessage {
    id:              number;
    complaintId:     number;
    userId:          number;
    senderName:      string;
    profilePhotoUrl: string | null;
    messageText:     string;
    attachmentsUrl:  string | null;
    isInternal:      boolean;
    createdDate:     string;
}

export interface ResidentComplaintMessageFormData {
    id:             number;
    complaintId:    number;
    messageText:    string;
    attachmentsUrl: string | null;
}

// --- My Properties ---

export interface ResidentMyApartment {
    id:              number;
    relation:        string;        // 'Owner' | 'Tenant'
    complexId:       number;
    complexName:     string;
    buildingName:    string;
    apartmentId:     number;
    apartmentNumber: string;
    // Owner fields
    deedNumber?:     string | null;
    purchaseDate?:   string | null;
    isMainOwner?:    boolean;
    // Tenant fields
    monthlyRent?:       number;
    contractStartDate?: string;
    contractEndDate?:   string | null;
}

export interface ResidentMyParkingSpace {
    id:                number;
    parkingSpaceId:    number;
    complexId:         number;
    complexName:       string;
    spaceNumber:       string;
    vehicleNumber:     string;
    vehicleBrand:      string;
    vehicleModel:      string;
    monthlyFee:        number;
    contractStartDate: string;
    contractEndDate:   string;
}

export interface ResidentMyCommercialSpace {
    id:                number;
    relation:          string;        // 'Owner' | 'Tenant'
    complexId:         number;
    complexName:       string;
    spaceNumber:       string;
    // Owned fields
    deedNumber?:       string | null;
    purchaseDate?:     string | null;
    isMainOwner?:      boolean;
    // Rented fields
    businessType?:     string | null;
    monthlyRent?:      number;
    contractStartDate?: string;
    contractEndDate?:  string | null;
}

export interface ResidentMyPropertiesData {
    apartments: {
        owned:  ResidentMyApartment[];
        rented: ResidentMyApartment[];
    };
    parkings:   ResidentMyParkingSpace[];
    commercials: {
        owned:  ResidentMyCommercialSpace[];
        rented: ResidentMyCommercialSpace[];
    };
}

// --- My Claims ---

export interface ResidentClaimItem {
    id:             number;
    targetType:     string; // 'Apartment' | 'ParkingSpace' | 'CommercialSpace'
    unitNumber:     string;
    complexName:    string;
    buildingName:   string;
    approvalStatus: number; // 1=Pending, 2=Approved, 3=Rejected
    claimDate:      string;
    deedNumber:     string;
}

export interface ResidentClaimsData {
    apartments:      ResidentClaimItem[];
    parkingSpaces:   ResidentClaimItem[];
    commercialSpaces: ResidentClaimItem[];
}

export interface ClaimFormData {
    targetId:   number;
    deedNumber: string;
}

// --- Announcements ---

export interface ResidentPublicAnnouncementListItem {
    id:           number;
    title:        string;
    content:      string;
    category:     string;
    type:         string;
    priority:     string;
    status:       string;
    complexName:  string;
    buildingName: string | null;
    createdDate:  string;
    expiryDate:   string;
}

export interface ResidentMyAnnouncementListItem {
    id:              number;
    title:           string;
    content:         string;
    category:        string;
    type:            string;
    priority:        string;
    status:          string;
    isModerated:     boolean;
    moderationNotes: string | null;
    complexName:     string;
    buildingName:    string | null;
    viewCount:       number;
    createdDate:     string;
    expiryDate:      string;
}

export interface ResidentAnnouncementFormData {
    id:         number;
    complexId:  number;
    buildingId: number | null;
    title:      string;
    content:    string;
    category:   string;
    type:       string;
    imagesUrl:  string | null;
    priority:   string;
    expiryDate: string;
}

// ── Guest Requests ──────────────────────────────────────────────────────────

export interface MyGuestRequest {
    id:               number;
    parkingSpaceId:   number;
    parkingSpaceName: string;
    plateNumber:      string;
    guestName:        string | null;
    guestPhone:       string | null;
    vehicleBrand:     string | null;
    vehicleModel:     string | null;
    startDateTime:    string;
    endDateTime:      string;
    status:           string;
}

export interface GuestRequestFormData {
    id:             number;
    parkingSpaceId: number;
    guestName:      string | null;
    guestPhone:     string | null;
    plateNumber:    string;
    vehicleBrand:   string | null;
    vehicleModel:   string | null;
    startDateTime:  string;
    endDateTime:    string;
}
