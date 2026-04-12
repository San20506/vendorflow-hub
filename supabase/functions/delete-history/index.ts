import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

type EntityType = 'products' | 'orders' | 'settlements';

interface DeleteHistoryRequest {
  recordId: string;
  entityType: EntityType;
}

interface DeleteHistoryResponse {
  success: boolean;
  history: any[];
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
        JSON.stringify({ success: false, error: 'Unauthorized', history: [] }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request
    const body = await req.json() as DeleteHistoryRequest;
    const { recordId, entityType } = body;

    if (!recordId || !entityType) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields', history: [] }),
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
        JSON.stringify({ success: false, error: 'Invalid token', history: [] }),
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
        JSON.stringify({ success: false, error: 'Vendor not found', history: [] }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const vendorId = profile.vendor_id;

    // Fetch delete history for this record
    const { data: history, error: historyError } = await supabase
      .from('deleted_records_history')
      .select('version_number, deleted_by, deleted_at, restored_at')
      .eq('vendor_id', vendorId)
      .eq('record_id', recordId)
      .eq('entity_type', entityType)
      .order('version_number', { ascending: false });

    if (historyError) {
      console.error('History fetch error:', historyError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch history', history: [] }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        history: history || [],
      } as DeleteHistoryResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Delete history error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Server error', history: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
