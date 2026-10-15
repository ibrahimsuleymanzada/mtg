export interface AccountingDashboard {
    totalInvoiced:       number;
    totalPaid:           number;
    totalUnpaid:         number;
    totalDiscount:       number;
    totalCashIncome:     number;
    totalBankIncome:     number;
    invoiceCount:        number;
    paidInvoiceCount:    number;
    unpaidInvoiceCount:  number;
    overdueInvoiceCount: number;
}
