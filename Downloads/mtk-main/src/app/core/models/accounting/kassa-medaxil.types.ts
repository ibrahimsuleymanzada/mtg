export interface KassaMedaxilListItem {
    id: number;
    invoiceNumber: string;
    person: string;
    amount: number;
    paymentMethod: string;
    paymentDate: string;
}

export interface KassaMedaxil {
    id: number;
    invoiceId: number;
    paymentMethod: string;
    amount: number;
    paymentDate: string;
    transactionId: string | null;
    receiptNumber: string | null;
    notes: string | null;
}

export interface KassaMedaxilFormData {
    id: number;
    invoiceId: number;
    amount: number;
    paymentDate: string;
    notes: string | null;
}
