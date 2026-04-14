/**
 * Meesho XLSX parser
 * Handles: SP_ORDER_ADS_REFERRAL_PAYMENT_FILE (sheet "Order Payments")
 * Header is on row 2 (index 1), data starts row 4 (index 3)
 */

import type { ParsedOrder, ParsedSettlement } from './flipkart';

export function isMeeshoPaymentFile(sheetNames: string[]): boolean {
  return sheetNames.includes('Order Payments') && sheetNames.includes('Disclaimer');
}

/** Parse a Meesho Order Payments row (headers at row index 1, data from row 3) */
export function parseMeeshoOrderRow(headers: string[], row: unknown[]): ParsedOrder | null {
  const get = (key: string) => {
    const idx = headers.findIndex(h => h && h.trim() === key.trim());
    return idx >= 0 ? row[idx] : undefined;
  };

  const subOrderNo = get('Sub Order No');
  if (!subOrderNo || String(subOrderNo).trim() === '-') return null;

  const raw: Record<string, unknown> = {};
  headers.forEach((h, i) => { if (row[i] != null && h) raw[h.trim()] = row[i]; });

  const listingPrice = get('Listing Price (Incl. taxes)');
  const qty = get('Quantity');
  const totalSale = get('Total Sale Amount (Incl. Shipping)') ?? get('Total Sale Amount (Incl. Shipp');
  const finalSettlement = get('Final Settlement Amount');
  const orderDate = get('Order Date');
  const paymentDate = get('Payment Date');
  const status = get('Live Order Status');
  const sku = get('Supplier SKU');
  const productName = get('Product Name');

  return {
    platform_order_id: String(subOrderNo),
    order_date: orderDate ? String(orderDate) : undefined,
    sku: sku ? String(sku).trim() : undefined,
    product_name: productName ? String(productName) : undefined,
    quantity: qty != null ? Number(qty) : 1,
    mrp: listingPrice != null ? Number(listingPrice) : undefined,
    sale_amount: totalSale != null ? Number(totalSale) : listingPrice != null ? Number(listingPrice) : undefined,
    status: status ? String(status).trim() : undefined,
    raw_data: raw,
  };
}

/** Parse a Meesho Order Payments row into settlement data */
export function parseMeeshoSettlementRow(headers: string[], row: unknown[]): ParsedSettlement | null {
  const get = (key: string) => {
    const idx = headers.findIndex(h => h && h.trim().startsWith(key.trim()));
    return idx >= 0 ? row[idx] : undefined;
  };

  const subOrderNo = get('Sub Order No');
  if (!subOrderNo || String(subOrderNo).trim() === '-') return null;

  const raw: Record<string, unknown> = {};
  headers.forEach((h, i) => { if (row[i] != null && h) raw[h.trim()] = row[i]; });

  const txnId = get('Transaction ID');
  const paymentDate = get('Payment Date');
  const finalSettlement = get('Final Settlement Amount');
  const totalSale = get('Total Sale Amount');
  const commission = get('Meesho Commission (Incl. GST)');
  const fixedFee = get('Fixed Fee (Incl. GST)');
  const shippingCharge = get('Shipping Charge (Incl. GST)');
  const returnShipping = get('Return Shipping Charge (Incl.');
  const tcs = get('TCS');
  const tds = get('TDS');
  const waivers = get('Waivers');

  const shipping = Number(shippingCharge ?? 0) + Number(returnShipping ?? 0);
  const otherDeductions = Number(fixedFee ?? 0) + Number(waivers ?? 0);

  return {
    settlement_ref: txnId ? String(txnId) : undefined,
    platform_order_id: String(subOrderNo),
    payment_date: paymentDate ? String(paymentDate) : undefined,
    sale_amount: totalSale != null ? Number(totalSale) : undefined,
    commission: commission != null ? Math.abs(Number(commission)) : undefined,
    shipping_fee: shipping > 0 ? shipping : undefined,
    tcs: tcs != null ? Math.abs(Number(tcs)) : undefined,
    tds: tds != null ? Math.abs(Number(tds)) : undefined,
    other_deductions: otherDeductions > 0 ? otherDeductions : undefined,
    net_settlement: finalSettlement != null ? Number(finalSettlement) : undefined,
    raw_data: raw,
  };
}
