export interface BorcluMusteriReportItem {
    person: string;
    apartmentNumber: string;
    complexName: string;
    totalDebt: number;
    overdueInvoiceCount: number;
}

export interface MusteriReportItem {
    person: string;
    apartmentNumber: string;
    complexName: string;
    totalInvoiced: number;
    totalPaid: number;
    totalDebt: number;
    lastPaymentDate: string;
}

export interface InvoiceReportItem {
    id: number;
    invoiceNumber: string;
    person: string;
    amount: number;
    paidAmount: number;
    status: string;
    dueDate: string;
}
