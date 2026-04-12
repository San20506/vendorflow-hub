import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0"

interface ImportRecord {
  entityType: string
  data: Record<string, any>
}

interface ProcessImportRequest {
  vendorId: string
  records: ImportRecord[]
}

interface ProcessImportResponse {
  inserted: number
  skipped: number
  errors: Array<{ rowIndex: number; entityType: string; reason: string }>
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const { vendorId, records } = (await req.json()) as ProcessImportRequest

    if (!vendorId || !records) {
      return new Response(
        JSON.stringify({ error: "Missing vendorId or records" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    const inserted: number[] = []
    const skipped: number[] = []
    const errors: Array<{ rowIndex: number; entityType: string; reason: string }> = []

    // Group records by entity type
    const recordsByType: Record<string, ImportRecord[]> = {}
    records.forEach((record, idx) => {
      if (!recordsByType[record.entityType]) {
        recordsByType[record.entityType] = []
      }
      recordsByType[record.entityType].push(record)
    })

    // Insert records per entity type
    for (const [entityType, typeRecords] of Object.entries(recordsByType)) {
      const tableName = entityType // Assumes table names match entity types (products, orders, settlements)
      const dataToInsert = typeRecords.map((r) => ({
        vendor_id: vendorId,
        ...r.data,
      }))

      const { error: insertError } = await supabase.from(tableName).insert(dataToInsert)

      if (insertError) {
        // Log error but continue with other entity types
        console.error(`Error inserting ${entityType}:`, insertError)
        typeRecords.forEach((_, idx) => {
          errors.push({
            rowIndex: idx,
            entityType,
            reason: insertError.message,
          })
        })
      } else {
        typeRecords.forEach((_, idx) => {
          inserted.push(idx)
        })
      }
    }

    return new Response(
      JSON.stringify({
        inserted: inserted.length,
        skipped: skipped.length,
        errors,
      } as ProcessImportResponse),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    )
  } catch (error) {
    console.error("Process import error:", error)
    return new Response(
      JSON.stringify({
        inserted: 0,
        skipped: 0,
        errors: [
          {
            rowIndex: 0,
            entityType: "system",
            reason: error instanceof Error ? error.message : "Unknown error",
          },
        ],
      } as ProcessImportResponse),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})
