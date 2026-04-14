/**
 * Amazon parser
 * Handles:
 *   - metric-data*.xlsx (sales by ASIN)
 *   - report-*.tsv (returns)
 */

import type { ParsedOrder } from './flipkart';

export function isAmazonMetricFile(filename: string): boolean {
  return filename.toLowerCase().includes('metric-data');
}

export function isAmazonReturnsFile(filename: string): boolean {
  return filename.toLowerCase().startsWith('report-') && filename.endsWith('.tsv');
}

/** Parse an Amazon metric-data CSV/XLSX row (sales summary by ASIN) */
export function parseAmazonMetricRow(headers: string[], row: unknown[]): ParsedOrder | null {
  const get = (key: string) => {
    const idx = headers.findIndex(h => h && h.trim() === key.trim());
    return idx >= 0 ? row[idx] : undefined;
  };

  const asin = get('ASIN');
  if (!asin) return null;

  const raw: Record<string, unknown> = {};
  headers.forEach((h, i) => { if (row[i] != null && h) raw[h.trim()] = row[i]; });

  const unitsSold = get('Units sold');
  const netSales = get('Net sales') ?? get('Sales');
  const avgPrice = get('Average sales price');
  const startDate = get('Start date');
  const msku = get('MSKU');

  return {
    platform_order_id: `${String(asin)}-${String(startDate ?? '')}`,
    platform_order_item_id: undefined,
    order_date: startDate ? String(startDate) : undefined,
    sku: msku ? String(msku) : String(asin),
    product_name: undefined,
    quantity: unitsSold != null ? Number(unitsSold) : 0,
    mrp: avgPrice != null ? Number(avgPrice) : undefined,
    sale_amount: netSales != null ? Number(netSales) : undefined,
    status: 'DELIVERED',
    raw_data: raw,
  };
}

/** Parse an Amazon Returns TSV row */
export function parseAmazonReturnRow(headers: string[], row: string[]): ParsedOrder | null {
  const get = (key: string) => {
    const idx = headers.indexOf(key);
    return idx >= 0 ? row[idx]?.trim() : undefined;
  };

  const orderId = get('Order ID');
  if (!orderId) return null;

  const raw: Record<string, unknown> = {};
  headers.forEach((h, i) => { if (row[i]) raw[h.trim()] = row[i].trim(); });

  return {
    platform_order_id: orderId,
    order_date: get('Order date') ?? get('Return request date'),
    sku: get(' Merchant SKU')?.trim() ?? get('Merchant SKU'),
    product_name: get('Item Name'),
    quantity: get('Return quantity') ? Number(get('Return quantity')) : 1,
    status: 'RETURNED',
    return_reason: get('Return reason'),
    raw_data: raw,
  };
}
