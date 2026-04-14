import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

type EntityType = 'products' | 'orders' | 'settlements' | undefined;
type OperationType = 'bulk_delete' | 'restore' | 'bulk_update' | undefined;

interface AuditLogsRequest {
  entityType?: EntityType;
  operationType?: OperationType;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

interface AuditLogsResponse {
  success: boolean;
  logs?: any[];
  total?: number;
  hasMore?: boolean;
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get auth token
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized', logs: [] }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request
    const body = (await req.json()) as AuditLogsRequest;
    const { entityType, operationType, dateFrom, dateTo, page = 1, limit = 20 } = body;

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token', logs: [] }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get vendor_id from user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('vendor_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile?.vendor_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Vendor not found', logs: [] }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const vendorId = profile.vendor_id;

    // Build query for audit logs
    let query = supabase
      .from('audit_logs')
      .select('operation_type, entity_type, record_id, record_count, user_id, timestamp, metadata, status', {
        count: 'exact'
      })
      .eq('vendor_id', vendorId);

    // Apply filters
    if (operationType) {
      query = query.eq('operation_type', operationType);
    }

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    // Date range filter (default last 365 days)
    const dateToApply = dateTo || new Date().toISOString();
    const dateFromApply = dateFrom || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();

    query = query.gte('timestamp', dateFromApply).lte('timestamp', dateToApply);

    // Apply ordering
    query = query.order('timestamp', { ascending: false });

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: logs, error: queryError, count } = await query;

    if (queryError) {
      console.error('Audit logs query error:', queryError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch logs. Please try again later.', logs: [] }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch user profiles for display names if we have logs
    let userMap: Record<string, any> = {};
    if (logs && logs.length > 0) {
      const userIds = [...new Set(logs.map(log => log.user_id).filter(Boolean))];
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('user_profiles')
          .select('user_id, full_name, email')
          .in('user_id', userIds);

        if (users) {
          userMap = Object.fromEntries(users.map(u => [u.user_id, u]));
        }
      }
    }

    // Enrich logs with user display names
    const enrichedLogs = (logs || []).map(log => ({
      ...log,
      userName: userMap[log.user_id]?.full_name || userMap[log.user_id]?.email || 'Unknown User'
    }));

    const total = count || 0;
    const hasMore = (page * limit) < total;

    return new Response(
      JSON.stringify({
        success: true,
        logs: enrichedLogs,
        total,
        hasMore
      } as AuditLogsResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Audit logs error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Server error', logs: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
