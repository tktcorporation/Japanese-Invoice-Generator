export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
  taxRate: 8 | 10;
}

export interface InvoiceData {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  issuerInfo: string;
  customerInfo: string;
  items: InvoiceItem[];
  paymentInfo: string;
}