/**
 * Bulk operations library: edit, categorize, delete, restore with audit logging
 */

type EntityType = 'products' | 'orders' | 'settlements';

export interface BulkOperationResult {
  success: boolean;
  updatedCount?: number;
  deletedCount?: number;
  versionsCreated?: number;
  error?: string;
}

export interface DeleteHistoryRecord {
  version_number: number;
  deleted_by: string;
  deleted_at: string;
  restored_at?: string;
}

/**
 * Bulk update records via edge function
 */
export async function bulkUpdateRecords(
  entityType: EntityType,
  recordIds: string[],
  field: string,
  value: any
): Promise<BulkOperationResult> {
  try {
    // Get auth token for user context
    const token = localStorage.getItem('sb-auth-token') || '';

    const response = await fetch('/functions/v1/bulk-update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        entityType,
        recordIds,
        field,
        value,
        operation: 'edit',
      }),
    });

    if (!response.ok) {
      console.error('Bulk update error:', response.statusText);
      return {
        success: false,
        error: 'Update failed. Please try again later.',
      };
    }

    const result = await response.json();
    return {
      success: true,
      updatedCount: result.updatedCount || recordIds.length,
    };
  } catch (error) {
    console.error('Bulk update failed:', error);
    return {
      success: false,
      error: 'Update failed. Please try again later.',
    };
  }
}

/**
 * Bulk categorize products
 */
export async function bulkCategorizeRecords(
  recordIds: string[],
  category: string
): Promise<BulkOperationResult> {
  try {
    // Get auth token for user context
    const token = localStorage.getItem('sb-auth-token') || '';

    const response = await fetch('/functions/v1/bulk-update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        entityType: 'products',
        recordIds,
        field: 'category',
        value: category,
        operation: 'categorize',
      }),
    });

    if (!response.ok) {
      console.error('Bulk categorize error:', response.statusText);
      return {
        success: false,
        error: 'Assignment failed. Please try again later.',
      };
    }

    const result = await response.json();
    return {
      success: true,
      updatedCount: result.updatedCount || recordIds.length,
    };
  } catch (error) {
    console.error('Bulk categorize failed:', error);
    return {
      success: false,
      error: 'Assignment failed. Please try again later.',
    };
  }
}

/**
 * Bulk delete records with soft-delete and versioning
 */
export async function bulkDeleteRecords(
  entityType: EntityType,
  recordIds: string[]
): Promise<BulkOperationResult> {
  try {
    // Get auth token for user context
    const token = localStorage.getItem('sb-auth-token') || '';

    const response = await fetch('/functions/v1/bulk-delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        entityType,
        recordIds,
      }),
    });

    if (!response.ok) {
      console.error('Bulk delete error:', response.statusText);
      return {
        success: false,
        error: 'Delete failed. Please try again later.',
      };
    }

    const result = await response.json();
    return {
      success: true,
      deletedCount: result.deletedCount,
      versionsCreated: result.versionsCreated,
    };
  } catch (error) {
    console.error('Bulk delete failed:', error);
    return {
      success: false,
      error: 'Delete failed. Please try again later.',
    };
  }
}

/**
 * Restore a record from a specific version
 */
export async function bulkRestoreRecords(
  recordId: string,
  entityType: EntityType,
  toVersion: number
): Promise<BulkOperationResult> {
  try {
    // Get auth token for user context
    const token = localStorage.getItem('sb-auth-token') || '';

    const response = await fetch('/functions/v1/bulk-restore', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        recordId,
        entityType,
        toVersion,
      }),
    });

    if (!response.ok) {
      console.error('Bulk restore error:', response.statusText);
      return {
        success: false,
        error: 'Restore failed. Please try again later.',
      };
    }

    const result = await response.json();
    return {
      success: true,
    };
  } catch (error) {
    console.error('Bulk restore failed:', error);
    return {
      success: false,
      error: 'Restore failed. Please try again later.',
    };
  }
}

/**
 * Fetch delete history for a record
 */
export async function fetchDeleteHistory(
  recordId: string,
  entityType: EntityType
): Promise<DeleteHistoryRecord[]> {
  try {
    // Get auth token for user context
    const token = localStorage.getItem('sb-auth-token') || '';

    const response = await fetch('/functions/v1/delete-history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        recordId,
        entityType,
      }),
    });

    if (!response.ok) {
      console.error('Fetch delete history error:', response.statusText);
      return [];
    }

    const result = await response.json();
    return result.history || [];
  } catch (error) {
    console.error('Fetch delete history failed:', error);
    return [];
  }
}
