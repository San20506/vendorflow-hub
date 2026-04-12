import { useState, useEffect } from 'react';
import { AlertCircle, Clock, User } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { bulkDeleteRecords, fetchDeleteHistory } from '@/lib/bulk-operations';

interface DeleteHistoryRecord {
  version_number: number;
  deleted_by: string;
  deleted_at: string;
  restored_at?: string;
}

interface BulkDeleteModalProps {
  isOpen: boolean;
  recordIds: string[];
  entityType: 'products' | 'orders' | 'settlements';
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkDeleteModal({
  isOpen,
  recordIds,
  entityType,
  onClose,
  onSuccess,
}: BulkDeleteModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteHistory, setDeleteHistory] = useState<Record<string, DeleteHistoryRecord[]>>({});

  useEffect(() => {
    if (isOpen && recordIds.length > 0) {
      loadDeleteHistory();
    }
  }, [isOpen, recordIds]);

  const loadDeleteHistory = async () => {
    const history: Record<string, DeleteHistoryRecord[]> = {};
    for (const recordId of recordIds) {
      const records = await fetchDeleteHistory(recordId, entityType);
      if (records.length > 0) {
        history[recordId] = records;
      }
    }
    setDeleteHistory(history);
  };

  const handleDelete = async () => {
    setError(null);
    setLoading(true);

    try {
      const result = await bulkDeleteRecords(entityType, recordIds);
      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error || 'Delete failed. Please try again later.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Delete failed. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const hasHistory = Object.keys(deleteHistory).length > 0;
  const historyCount = Object.keys(deleteHistory).reduce((sum, recordId) => {
    return sum + deleteHistory[recordId].length;
  }, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Records</DialogTitle>
          <DialogDescription>
            Permanently mark records as deleted (recoverable from 5 versions)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview section */}
          <div className="bg-destructive/10 rounded-lg p-3 border border-destructive/20">
            <p className="text-sm font-medium text-foreground">
              Will mark <span className="font-bold">{recordIds.length}</span> records as deleted
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Recoverable from 5 versions
            </p>
          </div>

          {/* Delete history section */}
          {hasHistory && (
            <div className="bg-muted rounded-lg p-3 border border-muted-foreground/20">
              <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Version History ({historyCount} existing)
              </p>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {Object.entries(deleteHistory).map(([recordId, versions]) => (
                  <div key={recordId} className="text-xs space-y-1">
                    <p className="font-mono text-muted-foreground">
                      {recordId.slice(0, 8)}...
                    </p>
                    {versions.map((version) => (
                      <div
                        key={`${recordId}-${version.version_number}`}
                        className="pl-2 border-l border-muted-foreground/30 text-muted-foreground text-xs flex items-start gap-2"
                      >
                        <span className="font-medium text-foreground">v{version.version_number}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{version.deleted_by.slice(0, 8)}</span>
                          </div>
                          <div>{new Date(version.deleted_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
