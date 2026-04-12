import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

type EntityType = 'products' | 'orders' | 'settlements';

interface BulkRestoreRequest {
  recordId: string;
  entityType: EntityType;
  toVersion: number;
}

interface BulkRestoreResponse {
  success: boolean;
  restoredRecord?: any;
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get auth token from headers
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request
    const body = await req.json() as BulkRestoreRequest;
    const { recordId, entityType, toVersion } = body;

    if (!recordId || !entityType || !toVersion) {
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

    // Map entity type to table
    const tableMap: Record<EntityType, string> = {
      products: 'products',
      orders: 'orders',
      settlements: 'settlements',
    };

    const table = tableMap[entityType];

    // Fetch snapshot from deleted_records_history
    const { data: historyRecord, error: historyError } = await supabase
      .from('deleted_records_history')
      .select('snapshot')
      .eq('vendor_id', vendorId)
      .eq('record_id', recordId)
      .eq('version_number', toVersion)
      .single();

    if (historyError || !historyRecord) {
      console.error('History fetch error:', historyError);
      return new Response(
        JSON.stringify({ success: false, error: 'Version not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const snapshot = historyRecord.snapshot;

    // Restore record: set all fields from snapshot, is_deleted=false, deleted_at=NULL
    const restoreData = {
      ...snapshot,
      is_deleted: false,
      deleted_at: null,
      updated_at: new Date().toISOString(),
    };

    const { error: updateError, data: restoredData } = await supabase
      .from(table)
      .update(restoreData)
      .eq('id', recordId)
      .eq('vendor_id', vendorId)
      .select()
      .single();

    if (updateError) {
      console.error('Restore error:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Restore failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update deleted_records_history: set restored_at
    const { error: historyUpdateError } = await supabase
      .from('deleted_records_history')
      .update({ restored_at: new Date().toISOString() })
      .eq('vendor_id', vendorId)
      .eq('record_id', recordId)
      .eq('version_number', toVersion);

    if (historyUpdateError) {
      console.error('History update error:', historyUpdateError);
      // Don't fail the restore if history update fails
    }

    // Create audit log entry
    const auditLog = {
      vendor_id: vendorId,
      user_id: user.id,
      operation_type: 'restore',
      entity_type: entityType,
      record_id: recordId,
      metadata: {
        from_version: toVersion,
      },
      timestamp: new Date().toISOString(),
      status: 'success',
    };

    const { data: auditData, error: auditError } = await supabase
      .from('audit_logs')
      .insert([auditLog])
      .select()
      .single();

    if (auditError) {
      console.error('Audit log error:', auditError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        restoredRecord: restoredData,
      } as BulkRestoreResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Bulk restore error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
