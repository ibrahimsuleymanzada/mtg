export interface ComplaintListItem {
    id: number;
    complaintNumber: string;
    categoryName: string;
    person: string;
    apartmentNumber: string;
    complexName: string;
    buildingName: string;
    title: string;
    priority: string;
    status: string;
    isAnonymous: boolean;
    createdDate: string;
    dueDate: string | null;
    resolvedDate: string | null;
    assignedToName: string | null;
}

export interface Complaint {
    id: number;
    categoryId: number;
    userId: number;
    apartmentId: number;
    buildingId: number;
    complexId: number;
    title: string;
    description: string;
    location: string;
    priority: string;
    status: string;
    isAnonymous: boolean;
    attachmentsUrl: string | null;
    dueDate: string | null;
    assignedTo: number | null;
    assignedDate: string | null;
    resolvedDate: string | null;
    resolutionNotes: string | null;
    rating: number | null;
    feedback: string | null;
}

export interface ComplaintFormData {
    id: number;
    categoryId: number;
    userId: number;
    apartmentId: number;
    buildingId: number;
    complexId: number;
    title: string;
    description: string;
    location: string;
    priority: string;
    status: string;
    isAnonymous: boolean;
    attachmentsUrl: string | null;
    dueDate: string | null;
    assignedTo: number | null;
    assignedDate: string | null;
    resolvedDate: string | null;
    resolutionNotes: string | null;
    rating: number | null;
    feedback: string | null;
}

export interface ComplaintMessage {
    id: number;
    complaintId: number;
    userId: number;
    senderName: string;
    profilePhotoUrl: string | null;
    messageText: string;
    attachmentsUrl: string | null;
    isInternal: boolean;
    createdDate: string;
}

export interface ComplaintMessageFormData {
    id: number;
    complaintId: number;
    userId: number;
    messageText: string;
    attachmentsUrl: string | null;
    isInternal: boolean;
}
