export interface UserListItem {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    mobilePhone: string;
    isActive: boolean;
}

export interface UserDetail {
    user: {
        id: number;
        username: string;
        email: string;
        firstName: string;
        lastName: string;
        fatherName: string;
        phone: string;
        mobilePhone: string;
        idcardNumber: string;
        dateOfBirth: string;
        profilePhotoUrl: string | null;
        emergencyContact: string;
        emergencyPhone: string;
        isActive: boolean;
    };
    roles: Array<{
        id: number;
        userId: number;
        roleId: number;
        isActive: boolean;
    }>;
}

export interface UserFormData {
    id: number;
    username: string;
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    fatherName: string;
    phone: string;
    mobilePhone: string;
    idcardNumber: string;
    dateOfBirth: string;
    profilePhotoUrl: string | null;
    emergencyContact: string;
    emergencyPhone: string;
    isActive: boolean;
}
