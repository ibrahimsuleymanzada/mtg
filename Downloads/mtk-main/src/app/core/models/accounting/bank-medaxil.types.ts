export interface BankMedaxilListItem {
    id: number;
    invoiceNumber: string;
    person: string;
    amount: number;
    bankName: string;
    referenceNumber: string;
    paymentDate: string;
}

export interface BankMedaxil {
    id: number;
    invoiceId: number;
    paymentMethod: string;
    amount: number;
    paymentDate: string;
    transactionId: string | null;
    receiptNumber: string | null;
    notes: string | null;
}

export interface BankMedaxilFormData {
    id: number;
    invoiceId: number;
    amount: number;
    paymentDate: string;
    notes: string | null;
}
