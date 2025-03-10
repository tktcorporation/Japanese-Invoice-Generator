import { InvoiceItem } from '../types';

export const calculateSubtotal = (item: InvoiceItem): number => {
  return item.quantity * item.unitPrice;
};

export const calculateTax = (amount: number, taxRate: number): number => {
  return Math.round(amount * (taxRate / 100));
};

export const calculateTotals = (items: InvoiceItem[]) => {
  const subtotalsByTaxRate: { [key: number]: number } = {};
  const taxesByRate: { [key: number]: number } = {};
  let totalBeforeTax = 0;
  let totalTax = 0;

  items.forEach(item => {
    const subtotal = calculateSubtotal(item);
    subtotalsByTaxRate[item.taxRate] = (subtotalsByTaxRate[item.taxRate] || 0) + subtotal;
    totalBeforeTax += subtotal;
  });

  Object.entries(subtotalsByTaxRate).forEach(([rate, subtotal]) => {
    const tax = calculateTax(subtotal, Number(rate));
    taxesByRate[Number(rate)] = tax;
    totalTax += tax;
  });

  return {
    subtotalsByTaxRate,
    taxesByRate,
    totalBeforeTax,
    totalTax,
    total: totalBeforeTax + totalTax
  };
};