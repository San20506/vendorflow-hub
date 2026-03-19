export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: 'marketing' | 'utility' | 'authentication';
  status: 'approved' | 'pending' | 'rejected';
  language: string;
  body: string;
  lastUsed: string;
  sentCount: number;
  hasMedia?: boolean;
  mediaType?: 'image' | 'video' | 'document';
}

export interface MessageLog {
  id: string;
  recipient: string;
  recipientName: string;
  template: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  direction: 'outbound' | 'inbound';
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'document';
}

export interface ClientContact {
  id: string;
  name: string;
  phone: string;
  category: string;
  lastMessage?: string;
  tags: string[];
}

export interface ClientCategory {
  id: string;
  name: string;
  color: string;
  count: number;
}

export const CLIENT_CATEGORIES: ClientCategory[] = [
  { id: 'vip', name: 'VIP Clients', color: 'bg-amber-500', count: 12 },
  { id: 'wholesale', name: 'Wholesale Buyers', color: 'bg-blue-500', count: 28 },
  { id: 'retail', name: 'Retail Customers', color: 'bg-emerald-500', count: 145 },
  { id: 'new', name: 'New Leads', color: 'bg-purple-500', count: 34 },
  { id: 'inactive', name: 'Inactive', color: 'bg-gray-400', count: 18 },
];

export const SAMPLE_CONTACTS: ClientContact[] = [
  { id: 'C-001', name: 'Vikram Patel', phone: '+91 98765 43210', category: 'vip', tags: ['frequent', 'bulk'], lastMessage: 'Order confirmed' },
  { id: 'C-002', name: 'Meena Sharma', phone: '+91 87654 32109', category: 'wholesale', tags: ['wholesale'], lastMessage: 'Shipping update sent' },
  { id: 'C-003', name: 'Amit Kumar', phone: '+91 76543 21098', category: 'retail', tags: ['new'], lastMessage: 'Payment reminder' },
  { id: 'C-004', name: 'Sneha Reddy', phone: '+91 65432 10987', category: 'new', tags: ['lead'], lastMessage: 'Inquiry received' },
  { id: 'C-005', name: 'Ravi Joshi', phone: '+91 54321 09876', category: 'vip', tags: ['premium'], lastMessage: 'OTP sent' },
  { id: 'C-006', name: 'Priya Nair', phone: '+91 43210 98765', category: 'wholesale', tags: ['bulk'], lastMessage: 'Invoice shared' },
  { id: 'C-007', name: 'Karan Singh', phone: '+91 32109 87654', category: 'retail', tags: [], lastMessage: 'Delivery confirmed' },
  { id: 'C-008', name: 'Anita Desai', phone: '+91 21098 76543', category: 'inactive', tags: ['churned'], lastMessage: '3 months ago' },
];

export const SAMPLE_TEMPLATES: WhatsAppTemplate[] = [
  { id: 'TPL-001', name: 'order_confirmation', category: 'utility', status: 'approved', language: 'en', body: 'Hi {{1}}, your order {{2}} has been confirmed. Track: {{3}}', lastUsed: '', sentCount: 1240 },
  { id: 'TPL-002', name: 'shipping_update', category: 'utility', status: 'approved', language: 'en', body: 'Your order {{1}} has been shipped via {{2}}. AWB: {{3}}. Expected delivery: {{4}}', lastUsed: '', sentCount: 890, hasMedia: true, mediaType: 'image' },
  { id: 'TPL-003', name: 'payment_reminder', category: 'utility', status: 'approved', language: 'en', body: 'Hi {{1}}, payment of ₹{{2}} is pending for invoice {{3}}. Pay now: {{4}}', lastUsed: '', sentCount: 345 },
  { id: 'TPL-004', name: 'festive_offer', category: 'marketing', status: 'approved', language: 'en', body: '🎉 Exclusive offer for you! Get {{1}}% off on {{2}}. Shop now: {{3}}', lastUsed: '', sentCount: 2100, hasMedia: true, mediaType: 'image' },
  { id: 'TPL-005', name: 'return_pickup', category: 'utility', status: 'pending', language: 'en', body: 'Return pickup for order {{1}} is scheduled on {{2}} between {{3}}. Keep package ready.', lastUsed: '', sentCount: 0 },
  { id: 'TPL-006', name: 'otp_verification', category: 'authentication', status: 'approved', language: 'en', body: 'Your OTP is {{1}}. Valid for 10 minutes. Do not share.', lastUsed: '', sentCount: 4500 },
  { id: 'TPL-007', name: 'abandoned_cart', category: 'marketing', status: 'rejected', language: 'en', body: 'Hi {{1}}, you left items in your cart worth ₹{{2}}. Complete your order: {{3}}', lastUsed: '', sentCount: 0 },
  { id: 'TPL-008', name: 'product_catalog', category: 'marketing', status: 'approved', language: 'en', body: 'Hi {{1}}, check out our new {{2}} collection! Browse: {{3}}', lastUsed: '', sentCount: 560, hasMedia: true, mediaType: 'video' },
  { id: 'TPL-009', name: 'invoice_share', category: 'utility', status: 'approved', language: 'en', body: 'Hi {{1}}, your invoice {{2}} for ₹{{3}} is attached. Download: {{4}}', lastUsed: '', sentCount: 780, hasMedia: true, mediaType: 'document' },
  { id: 'TPL-010', name: 'feedback_request', category: 'marketing', status: 'approved', language: 'en', body: 'Hi {{1}}, how was your experience with order {{2}}? Rate us: {{3}}', lastUsed: '', sentCount: 430 },
];
