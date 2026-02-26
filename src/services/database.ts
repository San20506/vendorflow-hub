import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

// ==================== PRODUCTS ====================
export const productsDb = {
  async getAll(search?: string) {
    let query = supabase.from('products').select('*').order('created_at', { ascending: false });
    if (search) query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,brand.ilike.%${search}%`);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
  async getById(id: string) {
    const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },
  async create(product: TablesInsert<'products'>) {
    const { data, error } = await supabase.from('products').insert(product).select().single();
    if (error) throw error;
    return data;
  },
  async update(id: string, updates: TablesUpdate<'products'>) {
    const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  async delete(id: string) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  },
};

// ==================== ORDERS ====================
export const ordersDb = {
  async getAll(filters?: { portal?: string; status?: string; from?: string; to?: string; search?: string }) {
    let query = supabase.from('orders').select('*').order('order_date', { ascending: false });
    if (filters?.portal) query = query.eq('portal', filters.portal);
    if (filters?.status) query = query.eq('status', filters.status as any);
    if (filters?.from) query = query.gte('order_date', filters.from);
    if (filters?.to) query = query.lte('order_date', filters.to);
    if (filters?.search) query = query.or(`order_number.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%`);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
  async getById(id: string) {
    const { data, error } = await supabase.from('orders').select('*, order_items(*)').eq('id', id).single();
    if (error) throw error;
    return data;
  },
  async create(order: TablesInsert<'orders'>) {
    const { data, error } = await supabase.from('orders').insert(order).select().single();
    if (error) throw error;
    return data;
  },
  async updateStatus(id: string, status: string) {
    const updates: TablesUpdate<'orders'> = { status: status as any };
    if (status === 'shipped') updates.shipped_date = new Date().toISOString();
    if (status === 'delivered') updates.delivered_date = new Date().toISOString();
    const { data, error } = await supabase.from('orders').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  async update(id: string, updates: TablesUpdate<'orders'>) {
    const { data, error } = await supabase.from('orders').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
};

// ==================== ORDER ITEMS ====================
export const orderItemsDb = {
  async getByOrderId(orderId: string) {
    const { data, error } = await supabase.from('order_items').select('*').eq('order_id', orderId);
    if (error) throw error;
    return data;
  },
  async create(item: TablesInsert<'order_items'>) {
    const { data, error } = await supabase.from('order_items').insert(item).select().single();
    if (error) throw error;
    return data;
  },
};

// ==================== RETURNS ====================
export const returnsDb = {
  async getAll(filters?: { portal?: string; status?: string; from?: string; to?: string }) {
    let query = supabase.from('returns').select('*').order('created_at', { ascending: false });
    if (filters?.portal) query = query.eq('portal', filters.portal);
    if (filters?.status) query = query.eq('status', filters.status as any);
    if (filters?.from) query = query.gte('requested_at', filters.from);
    if (filters?.to) query = query.lte('requested_at', filters.to);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
  async updateStatus(id: string, status: string) {
    const updates: TablesUpdate<'returns'> = { status: status as any };
    if (['closed', 'refund_initiated'].includes(status)) updates.resolved_at = new Date().toISOString();
    const { data, error } = await supabase.from('returns').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
};

// ==================== INVOICES ====================
export const invoicesDb = {
  async getAll(type?: string) {
    let query = supabase.from('invoices').select('*').order('invoice_date', { ascending: false });
    if (type) query = query.eq('type', type);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
  async create(invoice: TablesInsert<'invoices'>) {
    const { data, error } = await supabase.from('invoices').insert(invoice).select().single();
    if (error) throw error;
    return data;
  },
  async getItems(invoiceId: string) {
    const { data, error } = await supabase.from('invoice_items').select('*').eq('invoice_id', invoiceId);
    if (error) throw error;
    return data;
  },
  async addItem(item: TablesInsert<'invoice_items'>) {
    const { data, error } = await supabase.from('invoice_items').insert(item).select().single();
    if (error) throw error;
    return data;
  },
};

// ==================== DEBIT NOTES ====================
export const debitNotesDb = {
  async getAll() {
    const { data, error } = await supabase.from('debit_notes').select('*').order('note_date', { ascending: false });
    if (error) throw error;
    return data;
  },
  async create(note: TablesInsert<'debit_notes'>) {
    const { data, error } = await supabase.from('debit_notes').insert(note).select().single();
    if (error) throw error;
    return data;
  },
};

// ==================== CREDIT NOTES ====================
export const creditNotesDb = {
  async getAll() {
    const { data, error } = await supabase.from('credit_notes').select('*').order('note_date', { ascending: false });
    if (error) throw error;
    return data;
  },
  async create(note: TablesInsert<'credit_notes'>) {
    const { data, error } = await supabase.from('credit_notes').insert(note).select().single();
    if (error) throw error;
    return data;
  },
};

// ==================== SETTLEMENTS ====================
export const settlementsDb = {
  async getAll(filters?: { portal?: string; status?: string; from?: string; to?: string }) {
    let query = supabase.from('settlements').select('*').order('created_at', { ascending: false });
    if (filters?.portal) query = query.eq('portal', filters.portal);
    if (filters?.status) query = query.eq('status', filters.status as any);
    if (filters?.from) query = query.gte('settlement_date', filters.from);
    if (filters?.to) query = query.lte('settlement_date', filters.to);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
};

// ==================== RECONCILIATION ====================
export const reconciliationDb = {
  async getAll(filters?: { portal?: string; from?: string; to?: string }) {
    let query = supabase.from('reconciliation_logs').select('*').order('date', { ascending: false });
    if (filters?.portal) query = query.eq('portal', filters.portal);
    if (filters?.from) query = query.gte('date', filters.from);
    if (filters?.to) query = query.lte('date', filters.to);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
};

// ==================== LEADS ====================
export const leadsDb = {
  async getAll(filters?: { status?: string; source?: string; search?: string }) {
    let query = supabase.from('leads').select('*').order('created_at', { ascending: false });
    if (filters?.status) query = query.eq('status', filters.status as any);
    if (filters?.source) query = query.eq('source', filters.source);
    if (filters?.search) query = query.or(`company_name.ilike.%${filters.search}%,contact_person.ilike.%${filters.search}%`);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
  async create(lead: TablesInsert<'leads'>) {
    const { data, error } = await supabase.from('leads').insert(lead).select().single();
    if (error) throw error;
    return data;
  },
  async update(id: string, updates: TablesUpdate<'leads'>) {
    const { data, error } = await supabase.from('leads').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
};

// ==================== ONBOARDING ====================
export const onboardingDb = {
  async getAll(filters?: { status?: string }) {
    let query = supabase.from('onboarding_requests').select('*').order('created_at', { ascending: false });
    if (filters?.status) query = query.eq('status', filters.status as any);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
  async create(request: TablesInsert<'onboarding_requests'>) {
    const { data, error } = await supabase.from('onboarding_requests').insert(request).select().single();
    if (error) throw error;
    return data;
  },
  async update(id: string, updates: TablesUpdate<'onboarding_requests'>) {
    const { data, error } = await supabase.from('onboarding_requests').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
};

// ==================== ACTIVITY LOGS ====================
export const activityLogsDb = {
  async getAll(filters?: { module?: string; limit?: number }) {
    let query = supabase.from('activity_logs').select('*').order('created_at', { ascending: false });
    if (filters?.module) query = query.eq('module', filters.module);
    if (filters?.limit) query = query.limit(filters.limit);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
  async log(entry: TablesInsert<'activity_logs'>) {
    const { error } = await supabase.from('activity_logs').insert(entry);
    if (error) console.error('Failed to log activity:', error);
  },
};

// ==================== FILE STORAGE ====================
export const storageService = {
  async upload(bucket: string, path: string, file: File) {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return urlData.publicUrl;
  },
  async delete(bucket: string, paths: string[]) {
    const { error } = await supabase.storage.from(bucket).remove(paths);
    if (error) throw error;
  },
  getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },
};
