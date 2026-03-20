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

export const CLIENT_CATEGORIES: ClientCategory[] = [];

export const SAMPLE_CONTACTS: ClientContact[] = [];

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
