export interface CompanyListItem {
    id:           number;
    companyName:  string;
    taxNumber:    string;
    directorName: string;
    contactPhone: string;
}

export interface Company {
    id:           number;
    companyName:  string;
    taxNumber:    string;
    directorName: string;
    contactPhone: string;
    email:        string | null;
    address:      string | null;
    description:  string | null;
}

export interface CompanyFormData {
    id:           number;
    companyName:  string;
    taxNumber:    string;
    directorName: string;
    contactPhone: string;
    email:        string | null;
    address:      string | null;
    description:  string | null;
}
