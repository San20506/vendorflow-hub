/**
 * Schema mapper for auto-detecting and mapping data fields to Supabase schema
 */

export interface SchemaField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'uuid' | 'json';
  required: boolean;
  humanized: string; // e.g., "customer_id" → "customer id"
}

export interface EntitySchema {
  name: string;
  fields: SchemaField[];
  requiredFields: string[];
}

// Define schemas for each supported entity type
const ENTITY_SCHEMAS: Record<string, EntitySchema> = {
  products: {
    name: 'products',
    fields: [
      { name: 'id', type: 'uuid', required: true, humanized: 'id' },
      { name: 'vendor_id', type: 'uuid', required: true, humanized: 'vendor id' },
      { name: 'external_product_id', type: 'string', required: true, humanized: 'external product id' },
      { name: 'channel_id', type: 'string', required: true, humanized: 'channel id' },
      { name: 'name', type: 'string', required: true, humanized: 'name' },
      { name: 'sku', type: 'string', required: false, humanized: 'sku' },
      { name: 'price', type: 'number', required: false, humanized: 'price' },
      { name: 'cost', type: 'number', required: false, humanized: 'cost' },
      { name: 'stock', type: 'number', required: false, humanized: 'stock' },
      { name: 'description', type: 'string', required: false, humanized: 'description' },
      { name: 'category', type: 'string', required: false, humanized: 'category' },
      { name: 'last_synced_at', type: 'date', required: false, humanized: 'last synced at' },
    ],
    requiredFields: ['external_product_id', 'channel_id', 'name'],
  },
  orders: {
    name: 'orders',
    fields: [
      { name: 'id', type: 'uuid', required: true, humanized: 'id' },
      { name: 'vendor_id', type: 'uuid', required: true, humanized: 'vendor id' },
      { name: 'external_order_id', type: 'string', required: true, humanized: 'external order id' },
      { name: 'channel', type: 'string', required: true, humanized: 'channel' },
      { name: 'customer_id', type: 'string', required: true, humanized: 'customer id' },
      { name: 'customer_email', type: 'string', required: false, humanized: 'customer email' },
      { name: 'total_amount', type: 'number', required: false, humanized: 'total amount' },
      { name: 'status', type: 'string', required: false, humanized: 'status' },
      { name: 'created_at', type: 'date', required: false, humanized: 'created at' },
      { name: 'shipped_at', type: 'date', required: false, humanized: 'shipped at' },
    ],
    requiredFields: ['external_order_id', 'channel', 'customer_id'],
  },
  settlements: {
    name: 'settlements',
    fields: [
      { name: 'id', type: 'uuid', required: true, humanized: 'id' },
      { name: 'vendor_id', type: 'uuid', required: true, humanized: 'vendor id' },
      { name: 'external_settlement_id', type: 'string', required: true, humanized: 'external settlement id' },
      { name: 'channel', type: 'string', required: true, humanized: 'channel' },
      { name: 'amount', type: 'number', required: false, humanized: 'amount' },
      { name: 'currency', type: 'string', required: false, humanized: 'currency' },
      { name: 'status', type: 'string', required: false, humanized: 'status' },
      { name: 'settlement_date', type: 'date', required: false, humanized: 'settlement date' },
    ],
    requiredFields: ['external_settlement_id', 'channel'],
  },
};

/**
 * Normalize column header to match schema field names
 * Handles variations like: product_id, productId, product id, Product ID, etc.
 */
export function normalizeColumnName(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\w_]/g, '');
}

/**
 * Humanize field name for error messages: customer_id → "customer id"
 */
export function humanizeFieldName(fieldName: string): string {
  return fieldName
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .toLowerCase();
}

/**
 * Auto-detect which entity type a row belongs to based on available columns
 */
export function detectEntityType(headers: string[]): string | null {
  const normalizedHeaders = headers.map(normalizeColumnName);
  const headerSet = new Set(normalizedHeaders);

  // Score each entity type based on matching required fields
  const scores: Record<string, number> = {};

  for (const [entityType, schema] of Object.entries(ENTITY_SCHEMAS)) {
    let matchedRequired = 0;
    for (const required of schema.requiredFields) {
      if (headerSet.has(required)) matchedRequired++;
    }
    // Entity is detected if at least 2/3 of required fields are present
    scores[entityType] = matchedRequired / schema.requiredFields.length;
  }

  // Return entity type with highest score if >= 0.66
  const best = Object.entries(scores).sort(([, a], [, b]) => b - a)[0];
  return best && best[1] >= 0.66 ? best[0] : null;
}

/**
 * Map column headers to schema fields
 * Returns mapping and list of missing required fields
 */
export function mapColumnsToSchema(
  headers: string[],
  entityType: string
): {
  mapping: Record<string, string>; // column header → schema field name
  missingRequired: string[]; // missing required field names (humanized)
} {
  const schema = ENTITY_SCHEMAS[entityType];
  if (!schema) return { mapping: {}, missingRequired: [] };

  const normalizedHeaders = headers.map(normalizeColumnName);
  const mapping: Record<string, string> = {};
  const foundFields = new Set<string>();

  // For each schema field, try to find matching column
  for (const field of schema.fields) {
    const headerIndex = normalizedHeaders.indexOf(field.name);
    if (headerIndex !== -1) {
      mapping[headers[headerIndex]] = field.name;
      foundFields.add(field.name);
    }
  }

  // Check for missing required fields
  const missingRequired = schema.requiredFields
    .filter(fieldName => !foundFields.has(fieldName))
    .map(fieldName => humanizeFieldName(fieldName));

  return { mapping, missingRequired };
}

/**
 * Get schema for an entity type
 */
export function getEntitySchema(entityType: string): EntitySchema | null {
  return ENTITY_SCHEMAS[entityType] || null;
}

/**
 * Validate a row against schema
 */
export function validateRow(
  row: Record<string, any>,
  entityType: string,
  fieldMapping: Record<string, string>
): {
  valid: boolean;
  errors: { field: string; value: any; reason: string }[];
} {
  const schema = getEntitySchema(entityType);
  if (!schema) return { valid: true, errors: [] };

  const errors: { field: string; value: any; reason: string }[] = [];
  const mappedRow = remapRow(row, fieldMapping);

  // Check required fields
  for (const required of schema.requiredFields) {
    if (!mappedRow[required]) {
      errors.push({
        field: required,
        value: undefined,
        reason: `Required field ${humanizeFieldName(required)} is missing`,
      });
    }
  }

  // Check data types
  for (const field of schema.fields) {
    const value = mappedRow[field.name];
    if (value === undefined || value === null) continue;

    const error = validateFieldType(value, field.type);
    if (error) {
      errors.push({
        field: field.name,
        value,
        reason: error,
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Remap row using field mapping
 */
export function remapRow(
  row: Record<string, any>,
  fieldMapping: Record<string, string>
): Record<string, any> {
  const remapped: Record<string, any> = {};
  for (const [originalHeader, schemaField] of Object.entries(fieldMapping)) {
    if (originalHeader in row) {
      remapped[schemaField] = row[originalHeader];
    }
  }
  return remapped;
}

/**
 * Validate field value against schema type
 */
function validateFieldType(value: any, type: string): string | null {
  if (value === null || value === undefined) return null;

  switch (type) {
    case 'number':
      if (typeof value === 'number') return null;
      if (typeof value === 'string' && !isNaN(Number(value))) return null;
      return `Expected number, got ${typeof value}`;

    case 'date':
      if (typeof value === 'string' && !isNaN(Date.parse(value))) return null;
      if (value instanceof Date) return null;
      return `Expected date format, got ${value}`;

    case 'uuid':
      if (typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) return null;
      return `Expected UUID format`;

    case 'boolean':
      if (typeof value === 'boolean') return null;
      if (typeof value === 'string' && ['true', 'false', '0', '1', 'yes', 'no'].includes(value.toLowerCase())) return null;
      return `Expected boolean value`;

    case 'string':
    default:
      return null;
  }
}
