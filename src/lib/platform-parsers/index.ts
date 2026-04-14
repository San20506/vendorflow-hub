/**
 * Platform parser index
 * Auto-detects file format and returns parsed records for import
 */

export * from './flipkart';
export * from './meesho';
export * from './firstcry';
export * from './amazon';

export type Platform = 'flipkart' | 'meesho' | 'firstcry' | 'amazon';

export interface ImportBatch {
  platform: Platform;
  type: 'orders' | 'settlements';
  records: unknown[];
  filename: string;
  rowCount: number;
  errorCount: number;
}

/** Detect platform from filename */
export function detectPlatform(filename: string): Platform | null {
  const lower = filename.toLowerCase();
  if (lower.includes('flipkart')) return 'flipkart';
  if (lower.includes('meesho') || lower.includes('meeesho') || lower.includes('111315')) return 'meesho';
  if (lower.includes('firstcry') || lower.includes('dashboardsale') || lower.includes('vendorreconciliation') || lower.includes('explortpayment')) return 'firstcry';
  if (lower.includes('amazon') || lower.includes('metric-data') || lower.includes('amzn')) return 'amazon';
  return null;
}
