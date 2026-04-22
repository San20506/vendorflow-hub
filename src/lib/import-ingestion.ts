/**
 * Import ingestion engine: Gemini error fixing, Supabase insertion, error logging
 */

import { ImportedRecord, PipelineResult } from './import-pipeline';
import { getEntitySchema, humanizeFieldName } from './schema-mapper';

export interface GeminiFixResponse {
  fixed: boolean;
  originalValue: any;
  fixedValue: any;
  confidence: number;
  reason: string;
}

export interface IngestionMetrics {
  totalRecords: number;
  successfulRecords: number;
  skippedRecords: number;
  fixedErrors: number;
  unfixableErrors: number;
  importDuration: number;
  entityCounts: Record<string, number>;
  missingFields: Record<string, string[]>;
}

export interface IngestionResult {
  success: boolean;
  metrics: IngestionMetrics;
  errors: Array<{
    rowIndex: number;
    field: string;
    originalValue: any;
    fixAttempt?: GeminiFixResponse;
  }>;
}

/**
 * Call Gemini API to fix a data value
 * Only applies fixes with confidence >= 96%
 */
export async function fixErrorWithGemini(
  fieldName: string,
  value: any,
  expectedType: string,
  context: Record<string, any>
): Promise<GeminiFixResponse | null> {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error('Gemini API key not configured');
      return null;
    }

    const prompt = `
You are a data validator. The following field value needs to be fixed to match the expected type.

Field: ${fieldName}
Current Value: ${JSON.stringify(value)}
Expected Type: ${expectedType}
Row Context: ${JSON.stringify(context)}

Please fix this value to match the expected type. Your response must be JSON:
{
  "fixed": true/false,
  "value": <fixed value or original if unfixable>,
  "confidence": <0-100>,
  "reason": "explanation"
}

Only respond with valid JSON. If the value cannot be safely fixed with high confidence (>=96%), return fixed: false.
`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1, // Low temperature for consistent outputs
          topP: 0.9,
          topK: 10,
        },
      }),
    });

    if (!response.ok) {
      console.error('Gemini API error:', response.statusText);
      return null;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const result = JSON.parse(jsonMatch[0]);
    if (!result.fixed || result.confidence < 96) {
      return null; // Don't apply fixes below 96% confidence
    }

    return {
      fixed: true,
      originalValue: value,
      fixedValue: result.value,
      confidence: result.confidence,
      reason: result.reason,
    };
  } catch (error) {
    console.error('Gemini error fixing failed:', error);
    return null;
  }
}

/**
 * Attempt to fix errors in records using Gemini
 * Returns records with errors fixed (if confidence >= 96%)
 */
export async function fixRecordsWithGemini(
  errorRecords: ImportedRecord[],
  maxConcurrent: number = 3
): Promise<{
  fixedRecords: ImportedRecord[];
  stillErroredRecords: ImportedRecord[];
  fixLog: Array<{ rowIndex: number; field: string; confidence: number }>;
}> {
  const fixedRecords: ImportedRecord[] = [];
  const stillErroredRecords: ImportedRecord[] = [];
  const fixLog: Array<{ rowIndex: number; field: string; confidence: number }> = [];

  // Process records with concurrency limit
  for (let i = 0; i < errorRecords.length; i += maxConcurrent) {
    const batch = errorRecords.slice(i, i + maxConcurrent);
    const fixPromises = batch.map(async (record) => {
      let hasFixableError = false;
      const schema = getEntitySchema(record.entityType);
      if (!schema) {
        stillErroredRecords.push(record);
        return;
      }

      // Try to fix each error
      for (const error of record.errors) {
        const field = schema.fields.find((f) => f.name === error.field);
        if (!field) continue;

        const fix = await fixErrorWithGemini(
          error.field,
          error.value,
          field.type,
          record.mappedRow
        );

        if (fix) {
          record.mappedRow[error.field] = fix.fixedValue;
          fixLog.push({
            rowIndex: record.rowIndex,
            field: error.field,
            confidence: fix.confidence,
          });
          hasFixableError = true;
        }
      }

      // Re-validate after fixes
      if (hasFixableError) {
        // Remove fixed errors from error list
        record.errors = record.errors.filter((e) => !fixLog.some((l) => l.rowIndex === record.rowIndex && l.field === e.field));
        if (record.errors.length === 0) {
          record.valid = true;
          fixedRecords.push(record);
        } else {
          stillErroredRecords.push(record);
        }
      } else {
        stillErroredRecords.push(record);
      }
    });

    await Promise.all(fixPromises);
  }

  return { fixedRecords, stillErroredRecords, fixLog };
}

/**
 * Log errors to Supabase for developer review
 */
export async function logErrorsForDeveloper(
  pipelineResult: PipelineResult,
  fixLog: Array<{ rowIndex: number; field: string; confidence: number }>,
  vendorId: string,
  fileName: string
): Promise<void> {
  try {
    // Get first few error records for context
    const errorSamples = pipelineResult.errorRecords.slice(0, 5).map((r) => ({
      rowIndex: r.rowIndex,
      originalRow: r.originalRow,
      errors: r.errors,
    }));

    const logEntry = {
      vendor_id: vendorId,
      file_name: fileName,
      error_count: pipelineResult.errorRecords.length,
      fixed_count: fixLog.length,
      entity_type_counts: pipelineResult.entityTypeCounts,
      missing_fields: pipelineResult.missingFieldsByEntity,
      error_samples: errorSamples,
      logged_at: new Date().toISOString(),
    };

    // Log to console for now (in real implementation, would log to Supabase)
    console.error('[IMPORT ERROR LOG]', JSON.stringify(logEntry, null, 2));

    // TODO: Integrate with Supabase logging table
    // await supabase
    //   .from('import_error_logs')
    //   .insert([logEntry]);
  } catch (error) {
    console.error('Failed to log errors:', error);
  }
}

/**
 * Ingest valid records into Supabase via edge function
 */
export async function ingestRecordsToSupabase(
  validRecords: ImportedRecord[],
  vendorId: string
): Promise<{
  inserted: number;
  skipped: number;
  errors: Array<{ rowIndex: number; reason: string }>;
}> {
  try {
    const response = await fetch('/functions/v1/process-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vendorId,
        records: validRecords.map(r => ({
          entityType: r.entityType,
          data: r.mappedRow
        }))
      })
    });

    if (!response.ok) {
      console.error('Edge function error:', response.statusText);
      return {
        inserted: 0,
        skipped: validRecords.length,
        errors: [{ rowIndex: 0, reason: `Failed to ingest: ${response.statusText}` }]
      };
    }

    const result = await response.json();
    return {
      inserted: result.inserted || 0,
      skipped: result.skipped || 0,
      errors: result.errors?.map((e: any) => ({
        rowIndex: e.rowIndex,
        reason: e.reason
      })) || []
    };
  } catch (error) {
    console.error('Ingestion error:', error);
    return {
      inserted: 0,
      skipped: validRecords.length,
      errors: [{ rowIndex: 0, reason: String(error) }]
    };
  }
}

/**
 * Process complete import workflow
 */
export async function processImportWorkflow(
  pipelineResult: PipelineResult,
  vendorId: string,
  fileName: string
): Promise<IngestionResult> {
  const startTime = performance.now();

  try {
    // Step 1: Try to fix errors with Gemini
    const { fixedRecords, stillErroredRecords, fixLog } = await fixRecordsWithGemini(
      pipelineResult.errorRecords
    );

    // Step 2: Log remaining errors for developer
    if (stillErroredRecords.length > 0) {
      await logErrorsForDeveloper(pipelineResult, fixLog, vendorId, fileName);
    }

    // Step 3: Combine valid and fixed records
    const allValidRecords = [...pipelineResult.validRecords, ...fixedRecords];

    // Step 4: Ingest to Supabase
    const ingestionResult = await ingestRecordsToSupabase(allValidRecords, vendorId);

    const duration = performance.now() - startTime;

    // Count records by entity type
    const entityCounts: Record<string, number> = {};
    for (const record of allValidRecords) {
      entityCounts[record.entityType] = (entityCounts[record.entityType] || 0) + 1;
    }

    return {
      success: stillErroredRecords.length === 0,
      metrics: {
        totalRecords: pipelineResult.recordCount,
        successfulRecords: allValidRecords.length,
        skippedRecords: pipelineResult.errorRecords.length - fixedRecords.length,
        fixedErrors: fixLog.length,
        unfixableErrors: stillErroredRecords.length,
        importDuration: duration,
        entityCounts,
        missingFields: pipelineResult.missingFieldsByEntity,
      },
      errors: stillErroredRecords.map((r) => ({
        rowIndex: r.rowIndex,
        field: r.errors[0]?.field || 'unknown',
        originalValue: r.errors[0]?.value,
      })),
    };
  } catch (error) {
    return {
      success: false,
      metrics: {
        totalRecords: pipelineResult.recordCount,
        successfulRecords: 0,
        skippedRecords: pipelineResult.recordCount,
        fixedErrors: 0,
        unfixableErrors: pipelineResult.recordCount,
        importDuration: performance.now() - startTime,
        entityCounts: {},
        missingFields: {},
      },
      errors: [{ rowIndex: 0, field: 'system', originalValue: String(error) }],
    };
  }
}
