export interface DropdownItem {
    key: number ;
    value: string ;
}

export interface SpeCode {
    key: number ;
    value: string ;
}

export interface ComplexDropdown {
    id: number;
    complexName: string;
    companyName: string
}

export interface TargetDropdownItem {
    key: number;
    value: string;
    defaultUserId: number | null;
    defaultUserName: string | null;
}