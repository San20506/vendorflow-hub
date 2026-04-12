/**
 * Data import pipeline: format detection, parsing, schema mapping, validation
 */

import {
  normalizeColumnName,
  detectEntityType,
  mapColumnsToSchema,
  validateRow,
  remapRow,
  humanizeFieldName,
  getEntitySchema,
} from './schema-mapper';

export interface ImportedRecord {
  entityType: string;
  originalRow: Record<string, any>;
  mappedRow: Record<string, any>;
  rowIndex: number;
  valid: boolean;
  errors: { field: string; value: any; reason: string }[];
}

export interface PipelineError {
  rowIndex: number;
  field?: string;
  value?: any;
  reason: string;
}

export interface PipelineResult {
  format: string;
  recordCount: number;
  validRecords: ImportedRecord[];
  errorRecords: ImportedRecord[];
  entityTypeCounts: Record<string, number>;
  missingFieldsByEntity: Record<string, string[]>;
}

/**
 * Detect file format from file name and/or content
 */
export function detectFileFormat(fileName: string, content: any): string {
  const lowerName = fileName.toLowerCase();

  if (lowerName.endsWith('.csv')) return 'csv';
  if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) return 'excel';
  if (lowerName.endsWith('.json')) {
    // Check if it's JSONL (newline-delimited)
    if (typeof content === 'string' && content.includes('\n') && content.split('\n')[0].startsWith('{')) {
      return 'jsonl';
    }
    return 'json';
  }

  // Fallback: try to detect from content
  if (typeof content === 'string') {
    if (content.trim().startsWith('[') || content.trim().startsWith('{')) {
      return 'json';
    }
    if (content.includes(',') && content.includes('\n')) {
      return 'csv';
    }
  }

  return 'unknown';
}

/**
 * Parse CSV content into records
 */
export function parseCSV(content: string): Record<string, any>[] {
  const lines = content.trim().split('\n');
  if (lines.length === 0) return [];

  // Parse header
  const header = parseCSVLine(lines[0]);
  const records: Record<string, any>[] = [];

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '') continue;
    const values = parseCSVLine(lines[i]);
    const record: Record<string, any> = {};
    for (let j = 0; j < header.length; j++) {
      record[header[j]] = values[j] || '';
    }
    records.push(record);
  }

  return records;
}

/**
 * Parse a single CSV line (handles quoted values)
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Parse JSON content (both regular and JSONL)
 */
export function parseJSON(content: string, format: string): Record<string, any>[] {
  try {
    if (format === 'jsonl') {
      // Parse line-delimited JSON
      const records: Record<string, any>[] = [];
      const lines = content.trim().split('\n');
      for (const line of lines) {
        if (line.trim()) {
          records.push(JSON.parse(line));
        }
      }
      return records;
    } else {
      // Parse regular JSON
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : [parsed];
    }
  } catch (error) {
    console.error('JSON parse error:', error);
    return [];
  }
}

/**
 * Main pipeline: parse file and detect entities
 */
export async function processImport(file: File): Promise<PipelineResult> {
  const content = await file.text();
  const format = detectFileFormat(file.name, content);

  // Parse file into records
  let records: Record<string, any>[] = [];
  if (format === 'csv') {
    records = parseCSV(content);
  } else if (format === 'json' || format === 'jsonl') {
    records = parseJSON(content, format);
  } else {
    throw new Error(`Unsupported format: ${format}`);
  }

  if (records.length === 0) {
    throw new Error('No records found in file');
  }

  // Get column headers
  const headers = Object.keys(records[0]);

  // Detect entity types for first few records (sample)
  const entityTypes = new Set<string>();
  for (let i = 0; i < Math.min(5, records.length); i++) {
    const detected = detectEntityType(headers);
    if (detected) entityTypes.add(detected);
  }

  // Process all records
  const validRecords: ImportedRecord[] = [];
  const errorRecords: ImportedRecord[] = [];
  const entityTypeCounts: Record<string, number> = {};
  const missingFieldsByEntity: Record<string, string[]> = {};

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const detectedType = detectEntityType(Object.keys(row));

    if (!detectedType) {
      // Skip rows that don't match any entity type
      continue;
    }

    // Map and validate
    const { mapping, missingRequired } = mapColumnsToSchema(Object.keys(row), detectedType);

    // Store missing fields for this entity type
    if (missingRequired.length > 0 && !missingFieldsByEntity[detectedType]) {
      missingFieldsByEntity[detectedType] = missingRequired;
    }

    // Remap row
    const mappedRow = remapRow(row, mapping);

    // Validate
    const validation = validateRow(row, detectedType, mapping);

    const importedRecord: ImportedRecord = {
      entityType: detectedType,
      originalRow: row,
      mappedRow,
      rowIndex: i + 2, // Account for header row
      valid: validation.valid,
      errors: validation.errors,
    };

    if (validation.valid) {
      validRecords.push(importedRecord);
    } else {
      errorRecords.push(importedRecord);
    }

    // Count entity types
    entityTypeCounts[detectedType] = (entityTypeCounts[detectedType] || 0) + 1;
  }

  return {
    format,
    recordCount: records.length,
    validRecords,
    errorRecords,
    entityTypeCounts,
    missingFieldsByEntity,
  };
}

/**
 * Format pipeline result for display
 */
export function formatPipelineResult(result: PipelineResult): string {
  const lines: string[] = [];

  lines.push(`Format: ${result.format}`);
  lines.push(`Total records: ${result.recordCount}`);
  lines.push(`Valid: ${result.validRecords.length}`);
  lines.push(`Errors: ${result.errorRecords.length}`);
  lines.push('');

  // Entity type summary
  for (const [entityType, count] of Object.entries(result.entityTypeCounts)) {
    lines.push(`${entityType}: ${count} records`);
    if (result.missingFieldsByEntity[entityType]) {
      lines.push(
        `  ⚠️ Missing: ${result.missingFieldsByEntity[entityType].join(', ')}`
      );
    }
  }

  return lines.join('\n');
}
