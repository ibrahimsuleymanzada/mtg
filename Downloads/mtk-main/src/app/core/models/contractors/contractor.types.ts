export interface ContractorListItem {
    id:            number;
    companyName:   string;
    serviceType:   string;
    contactPerson: string;
    phone:         string;
    email:         string;
}

export interface Contractor {
    id:            number;
    companyName:   string;
    serviceType:   string;
    contactPerson: string;
    phone:         string;
    email:         string;
    address:       string | null;
    taxNumber:     string | null;
    notes:         string | null;
}

export interface ContractorFormData {
    id:            number;
    companyName:   string;
    serviceType:   string;
    contactPerson: string;
    phone:         string;
    email:         string;
    address:       string | null;
    taxNumber:     string | null;
    notes:         string | null;
}

export interface ContractorContractListItem {
    id:                number;
    companyName:       string;
    serviceType:       string;
    contractStartDate: string;
    contractEndDate:   string;
    monthlyFee:        number;
}

export interface ContractorContract {
    id:                number;
    contractorId:      number;
    contractStartDate: string;
    contractEndDate:   string;
    monthlyFee:        number;
    description:       string | null;
    status:            string;
}

export interface ContractorContractFormData {
    id:                number;
    contractorId:      number;
    complexId:         number;
    buildingId:        number | null;
    contractStartDate: string;
    contractEndDate:   string;
    monthlyFee:        number;
    description:       string | null;
    status:            string;
}
