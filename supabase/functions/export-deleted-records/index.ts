import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

type EntityType = 'products' | 'orders' | 'settlements' | 'all';
type Format = 'csv' | 'json' | 'pdf';

interface ExportRequest {
  entityType: EntityType;
  format: Format;
  dateRange?: {
    from: string;
    to: string;
  };
}

interface ExportResponse {
  success: boolean;
  data?: string | ArrayBuffer;
  error?: string;
  contentType?: string;
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
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request
    const body = (await req.json()) as ExportRequest;
    const { entityType, format, dateRange } = body;

    if (!entityType || !format) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
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
        JSON.stringify({ success: false, error: 'Vendor not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const vendorId = profile.vendor_id;

    // Build query
    let query = supabase
      .from('deleted_records_history')
      .select('record_id, entity_type, deleted_at, deleted_by, snapshot, metadata')
      .eq('vendor_id', vendorId);

    // Filter by entity type
    if (entityType !== 'all') {
      query = query.eq('entity_type', entityType);
    }

    // Filter by date range
    if (dateRange?.from) {
      query = query.gte('deleted_at', dateRange.from);
    }
    if (dateRange?.to) {
      query = query.lte('deleted_at', dateRange.to);
    }

    // Limit to prevent memory issues
    query = query.order('deleted_at', { ascending: false }).limit(10000);

    const { data: records, error: queryError } = await query;

    if (queryError) {
      console.error('Export query error:', queryError);
      return new Response(
        JSON.stringify({ success: false, error: 'Export failed. Please try again later.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format export
    let exportData: string | ArrayBuffer;
    let contentType: string;
    let filename: string;

    if (format === 'csv') {
      const csv = convertToCSV(records || []);
      exportData = csv;
      contentType = 'text/csv;charset=utf-8';
      filename = `deleted-records-${new Date().toISOString().split('T')[0]}.csv`;
    } else if (format === 'json') {
      const jsonData = {
        exportDate: new Date().toISOString(),
        vendorId: vendorId,
        recordCount: records?.length || 0,
        records: records || []
      };
      exportData = JSON.stringify(jsonData, null, 2);
      contentType = 'application/json';
      filename = `deleted-records-${new Date().toISOString().split('T')[0]}.json`;
    } else if (format === 'pdf') {
      // For PDF, return JSON and let frontend handle client-side generation
      // This avoids server-side PDF library dependencies
      const jsonData = {
        exportDate: new Date().toISOString(),
        vendorId: vendorId,
        recordCount: records?.length || 0,
        records: records || [],
        format: 'pdf-data'
      };
      exportData = JSON.stringify(jsonData);
      contentType = 'application/json';
      filename = `deleted-records-${new Date().toISOString().split('T')[0]}.pdf.json`;
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return file with download header
    return new Response(exportData, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      }
    });
  } catch (error) {
    console.error('Export error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function convertToCSV(records: any[]): string {
  if (records.length === 0) {
    return 'record_id,entity_type,deleted_at,deleted_by,deletion_reason\n';
  }

  const headers = ['record_id', 'entity_type', 'deleted_at', 'deleted_by', 'deletion_reason'];
  const rows = records.map(record => {
    const deletedReason = record.metadata?.deletion_reason || '';
    return [
      `"${record.record_id}"`,
      `"${record.entity_type}"`,
      `"${record.deleted_at}"`,
      `"${record.deleted_by}"`,
      `"${deletedReason}"`
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
