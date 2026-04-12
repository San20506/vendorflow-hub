import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

type EntityType = 'products' | 'orders' | 'settlements';

interface BulkDeleteRequest {
  entityType: EntityType;
  recordIds: string[];
  reason?: string;
}

interface BulkDeleteResponse {
  success: boolean;
  deletedCount: number;
  versionsCreated: number;
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
    const body = await req.json() as BulkDeleteRequest;
    const { entityType, recordIds, reason } = body;

    if (!entityType || !recordIds || recordIds.length === 0) {
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

    // Fetch current records (to snapshot before delete)
    const { data: currentRecords, error: fetchError } = await supabase
      .from(table)
      .select('*')
      .eq('vendor_id', vendorId)
      .in('id', recordIds);

    if (fetchError || !currentRecords) {
      console.error('Fetch error:', fetchError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch records' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let versionsCreated = 0;

    // Process each record: check version count, manage FIFO, create history entry
    for (const record of currentRecords) {
      // Check if record is already deleted (idempotence check)
      if (record.is_deleted === true) {
        continue; // Skip if already deleted
      }

      // Count existing versions for this record
      const { data: existingVersions, error: versionError } = await supabase
        .from('deleted_records_history')
        .select('version_number', { count: 'exact' })
        .eq('vendor_id', vendorId)
        .eq('record_id', record.id)
        .eq('entity_type', entityType);

      if (versionError) {
        console.error('Version check error:', versionError);
        continue;
      }

      const versionCount = existingVersions?.length || 0;

      // If 5 versions already exist, delete the oldest (version_number = 1, shift others down)
      if (versionCount >= 5) {
        // Get the oldest version to delete
        const { data: oldestVersion } = await supabase
          .from('deleted_records_history')
          .select('id')
          .eq('vendor_id', vendorId)
          .eq('record_id', record.id)
          .eq('version_number', 1)
          .single();

        if (oldestVersion) {
          // Delete oldest version
          await supabase
            .from('deleted_records_history')
            .delete()
            .eq('id', oldestVersion.id);

          // Shift versions down: 2→1, 3→2, 4→3, 5→4
          const { data: versionsToShift } = await supabase
            .from('deleted_records_history')
            .select('id, version_number')
            .eq('vendor_id', vendorId)
            .eq('record_id', record.id)
            .gt('version_number', 1)
            .order('version_number', { ascending: true });

          if (versionsToShift) {
            for (const versionRow of versionsToShift) {
              await supabase
                .from('deleted_records_history')
                .update({ version_number: versionRow.version_number - 1 })
                .eq('id', versionRow.id);
            }
          }
        }
      }

      // Insert new version with version_number = 5 (or next available if < 5 versions)
      const nextVersionNumber = Math.min(versionCount + 1, 5);
      const { error: insertError } = await supabase
        .from('deleted_records_history')
        .insert({
          record_id: record.id,
          entity_type: entityType,
          version_number: nextVersionNumber,
          snapshot: record, // Store full record as JSON snapshot
          deleted_by: user.id,
          vendor_id: vendorId,
          deleted_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Insert history error:', insertError);
        continue;
      }

      versionsCreated++;
    }

    // Update records: set is_deleted=true, deleted_at=now
    const { error: updateError, data: updatedData } = await supabase
      .from(table)
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('vendor_id', vendorId)
      .in('id', recordIds)
      .is('is_deleted', false) // Only update records that aren't already deleted (idempotence)
      .select();

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Delete failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const deletedCount = updatedData?.length || 0;

    // Create audit log entry
    const auditLog = {
      vendor_id: vendorId,
      user_id: user.id,
      operation_type: 'bulk_delete',
      entity_type: entityType,
      record_count: deletedCount,
      metadata: {
        reason: reason || 'No reason provided',
        versions_created: versionsCreated,
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
        deletedCount,
        versionsCreated,
        auditId: auditData?.id,
      } as BulkDeleteResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Bulk delete error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
