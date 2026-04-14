/**
 * Flipkart XLSX parser
 * Handles: Orders report (sheet "Orders"), Settled Transactions (sheet "Orders")
 */

export interface ParsedOrder {
  platform_order_id: string;
  platform_order_item_id?: string;
  order_date?: string;
  sku?: string;
  product_name?: string;
  quantity?: number;
  mrp?: number;
  sale_amount?: number;
  status?: string;
  return_reason?: string;
  category?: string;
  fulfillment_type?: string;
  raw_data: Record<string, unknown>;
}

export interface ParsedSettlement {
  settlement_ref?: string;
  platform_order_id?: string;
  payment_date?: string;
  sale_amount?: number;
  commission?: number;
  shipping_fee?: number;
  tcs?: number;
  tds?: number;
  other_deductions?: number;
  net_settlement?: number;
  raw_data: Record<string, unknown>;
}

/** Detect if an XLSX workbook is a Flipkart Orders report */
export function isFlipkartOrdersFile(sheetNames: string[]): boolean {
  return sheetNames.includes('Orders') && sheetNames.includes('Help');
}

/** Detect if an XLSX workbook is a Flipkart Settled Transactions report */
export function isFlipkartSettlementsFile(sheetNames: string[]): boolean {
  return sheetNames.includes('Orders') && sheetNames.includes('TDS') && sheetNames.includes('TCS_Recovery');
}

/** Parse a Flipkart Orders sheet row array (after header row) */
export function parseFlipkartOrderRow(headers: string[], row: unknown[]): ParsedOrder | null {
  const get = (key: string) => {
    const idx = headers.indexOf(key);
    return idx >= 0 ? row[idx] : undefined;
  };

  const orderId = get('order_id');
  if (!orderId) return null;

  const raw: Record<string, unknown> = {};
  headers.forEach((h, i) => { if (row[i] != null) raw[h] = row[i]; });

  const qty = get('quantity');
  const saleAmt = get('selling_price') ?? get('sale_price') ?? get('mrp');

  return {
    platform_order_id: String(orderId),
    platform_order_item_id: get('order_item_id') ? String(get('order_item_id')) : undefined,
    order_date: get('order_date') ? String(get('order_date')) : undefined,
    sku: get('sku') ? String(get('sku')).replace(/^"""|"""$/g, '').replace(/^SKU:/, '') : undefined,
    product_name: get('product_title') ? String(get('product_title')).replace(/^"""|"""$/g, '') : undefined,
    quantity: qty != null ? Number(qty) : 1,
    sale_amount: saleAmt != null ? Number(saleAmt) : undefined,
    status: get('order_item_status') ? String(get('order_item_status')) : undefined,
    return_reason: get('return_reason') ? String(get('return_reason')) : undefined,
    fulfillment_type: get('fulfilment_type') ? String(get('fulfilment_type')) : undefined,
    raw_data: raw,
  };
}

/** Parse a Flipkart Settled Transactions "Orders" sheet (2-row header) */
export function parseFlipkartSettlementRow(subHeaders: string[], row: unknown[]): ParsedSettlement | null {
  const get = (key: string) => {
    const idx = subHeaders.findIndex(h => h && h.trim().startsWith(key.trim()));
    return idx >= 0 ? row[idx] : undefined;
  };

  const orderId = get('Order ID');
  if (!orderId) return null;

  const raw: Record<string, unknown> = {};
  subHeaders.forEach((h, i) => { if (row[i] != null && h) raw[h.trim()] = row[i]; });

  const saleAmt = get('Sale Amount (Rs.)');
  const commission = get('Commission (Rs.)');
  const shippingFee = get('Shipping Fee (Rs.)');
  const tcs = get('TCS (Rs.)');
  const tds = get('TDS (Rs.)');
  const netSettlement = get('Bank Settlement Value');

  return {
    settlement_ref: get('NEFT ID') ? String(get('NEFT ID')) : undefined,
    platform_order_id: String(orderId),
    payment_date: get('Payment Date') ? String(get('Payment Date')) : undefined,
    sale_amount: saleAmt != null ? Math.abs(Number(saleAmt)) : undefined,
    commission: commission != null ? Math.abs(Number(commission)) : undefined,
    shipping_fee: shippingFee != null ? Math.abs(Number(shippingFee)) : undefined,
    tcs: tcs != null ? Math.abs(Number(tcs)) : undefined,
    tds: tds != null ? Math.abs(Number(tds)) : undefined,
    net_settlement: netSettlement != null ? Number(netSettlement) : undefined,
    raw_data: raw,
  };
}
