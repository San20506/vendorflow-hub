import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

type EntityType = 'products' | 'orders' | 'settlements';

interface BulkUpdateRequest {
  entityType: EntityType;
  recordIds: string[];
  field: string;
  value: any;
  operation: 'edit' | 'categorize';
}

interface BulkUpdateResponse {
  success: boolean;
  updatedCount: number;
  auditId?: string;
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
    const body = await req.json() as BulkUpdateRequest;
    const { entityType, recordIds, field, value, operation } = body;

    if (!entityType || !recordIds || !field || value === undefined) {
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

    // Update records
    const { error: updateError, data: updatedData } = await supabase
      .from(table)
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq('vendor_id', vendorId)
      .in('id', recordIds)
      .select();

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Update failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const updatedCount = updatedData?.length || recordIds.length;

    // Create audit log entry
    const auditLog = {
      vendor_id: vendorId,
      user_id: user.id,
      operation_type: operation === 'categorize' ? 'bulk_categorize' : 'bulk_edit',
      entity_type: entityType,
      field_name: field,
      new_value: value,
      record_count: updatedCount,
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
        updatedCount,
        auditId: auditData?.id,
      } as BulkUpdateResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Bulk update error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
