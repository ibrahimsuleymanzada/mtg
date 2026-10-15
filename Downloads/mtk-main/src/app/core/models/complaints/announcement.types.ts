export interface AnnouncementListItem {
    id: number;
    title: string;
    category: string;
    type: string;
    priority: string;
    status: string;
    complexName: string;
    createdDate: string;
}

export interface Announcement {
    id: number;
    complexId: number;
    buildingId: number | null;
    postedBy: number;
    title: string;
    content: string;
    category: string;
    type: string;
    imagesUrl: string | null;
    priority: string;
    status: string;
    expiryDate: string;
}

export interface AnnouncementFormData {
    id: number;
    complexId: number;
    buildingId: number | null;
    postedBy: number;
    title: string;
    content: string;
    category: string;
    type: string;
    imagesUrl: string | null;
    priority: string;
    status: string;
    expiryDate: string;
}
