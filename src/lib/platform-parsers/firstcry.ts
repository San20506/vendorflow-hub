/**
 * Firstcry XLSX parser
 * Handles:
 *   - dashboardsale_*.xlsx (orders)
 *   - VendorReconciliation*.xlsx (settlements)
 */

import type { ParsedOrder, ParsedSettlement } from './flipkart';

export function isFirstcryOrdersFile(filename: string): boolean {
  return filename.toLowerCase().includes('dashboardsale');
}

export function isFirstcryReconciliationFile(filename: string): boolean {
  return filename.toLowerCase().includes('vendorreconciliation');
}

export function isFirstcryPaymentAdviceFile(filename: string): boolean {
  return filename.toLowerCase().includes('explortpaymentadvice');
}

/** Parse a Firstcry dashboardsale row */
export function parseFirstcryOrderRow(headers: string[], row: unknown[]): ParsedOrder | null {
  const get = (key: string) => {
    const idx = headers.indexOf(key);
    return idx >= 0 ? row[idx] : undefined;
  };

  const poid = get('POID');
  if (!poid) return null;

  const raw: Record<string, unknown> = {};
  headers.forEach((h, i) => { if (row[i] != null) raw[h] = row[i]; });

  const mrp = get('MRP');
  const mrpSales = get('MRP Sales');
  const qty = get('Quantity');

  return {
    platform_order_id: String(poid),
    order_date: get('OrderDate') ? String(get('OrderDate')) : undefined,
    sku: get('VendorStyleCode') ? String(get('VendorStyleCode')) : get('ProductID') ? String(get('ProductID')) : undefined,
    product_name: get('VendorStyleCode') ? String(get('VendorStyleCode')) : get('ProductID') ? String(get('ProductID')) : undefined,
    quantity: qty != null ? Number(qty) : 1,
    mrp: mrp != null ? Number(mrp) : undefined,
    sale_amount: mrpSales != null ? Number(mrpSales) : mrp != null ? Number(mrp) : undefined,
    category: get('categoryname') ? String(get('categoryname')) : undefined,
    subcategory: get('subcategoryname') ? String(get('subcategoryname')) : undefined,
    raw_data: raw,
  };
}

/** Parse a Firstcry VendorReconciliation row */
export function parseFirstcryReconciliationRow(headers: string[], row: unknown[]): ParsedSettlement | null {
  const get = (key: string) => {
    const idx = headers.indexOf(key);
    return idx >= 0 ? row[idx] : undefined;
  };

  const fcRef = get('FC Ref. no.');
  if (!fcRef) return null;

  const raw: Record<string, unknown> = {};
  headers.forEach((h, i) => { if (row[i] != null) raw[h] = row[i]; });

  const gross = get('Gross Amount');
  const total = get('Total');
  const srTotal = get('SR Total Amount');
  const rtoTotal = get('RTO Total Amount');
  const cgst = get('CGST Amount');
  const sgst = get('SGST Amount');
  const paymentAdvice = get('Payment advice no');

  const deductions = Number(srTotal ?? 0) + Number(rtoTotal ?? 0);

  return {
    settlement_ref: paymentAdvice ? String(paymentAdvice) : String(fcRef),
    platform_order_id: get('Order Ids') ? String(get('Order Ids')) : undefined,
    payment_date: get('Delivery date') ? String(get('Delivery date')) : undefined,
    sale_amount: gross != null ? Number(gross) : undefined,
    other_deductions: deductions > 0 ? deductions : undefined,
    tcs: (Number(cgst ?? 0) + Number(sgst ?? 0)) || undefined,
    net_settlement: total != null ? Number(total) : undefined,
    raw_data: raw,
  };
}
