export interface InvoiceListItem {
    id: number;
    invoiceNumber: string;
    targetType: string;
    targetIdentifier: string;
    person: string;
    categoryName: string;
    amount: number;
    paidAmount: number;
    dueDate: string;
    issueDate: string;
    statusId: number;
    status: string;
}

export interface Invoice {
    id: number;
    invoiceNumber: string;
    targetType: string;
    complexId: number;
    buildingId: number | null;
    targetId: number;
    targetIdentifier: string;
    userId: number;
    person: string;
    categoryId: number;
    description: string;
    amount: number;
    dueDate: string;
    issueDate: string;
    statusId: number;
    lateFee: number;
    discount: number;
    notes: string | null;
}

export interface InvoiceAutocompleteItem {
    id: number;
    invoiceNumber: string;
    amount: number;
    discount: number;
    netAmount: number;
    paidAmount: number;
    remainingAmount: number;
    statusId: number;
    customerName: string;
}

export interface InvoiceBalance {
    invoiceId: number;
    amount: number;
    discount: number;
    netAmount: number;
    paidAmount: number;
    remainingAmount: number;
}

export interface InvoiceFormData {
    id: number;
    invoiceNumber: string;
    targetType: string;
    complexId: number;
    buildingId: number | null;
    targetId: number;
    userId: number;
    categoryId: number;
    description: string;
    amount: number;
    dueDate: string;
    issueDate: string;
    statusId: number;
    lateFee: number;
    discount: number;
    notes: string | null;
}
