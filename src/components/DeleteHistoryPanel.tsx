import { useState } from 'react';
import { AlertCircle, RotateCcw, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { bulkRestoreRecords, fetchDeleteHistory } from '@/lib/bulk-operations';

interface DeleteHistoryRecord {
  version_number: number;
  deleted_by: string;
  deleted_at: string;
  restored_at?: string;
}

interface DeleteHistoryPanelProps {
  isOpen: boolean;
  recordId: string;
  entityType: 'products' | 'orders' | 'settlements';
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteHistoryPanel({
  isOpen,
  recordId,
  entityType,
  onClose,
  onSuccess,
}: DeleteHistoryPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [history, setHistory] = useState<DeleteHistoryRecord[]>([]);
  const [restoringVersion, setRestoringVersion] = useState<number | null>(null);

  const handleOpen = async () => {
    const records = await fetchDeleteHistory(recordId, entityType);
    setHistory(records);
    setError(null);
    setSuccess(null);
  };

  const handleRestore = async (version: number) => {
    setError(null);
    setSuccess(null);
    setRestoringVersion(version);
    setLoading(true);

    try {
      const result = await bulkRestoreRecords(recordId, entityType, version);
      if (result.success) {
        setSuccess(`✓ Record restored from version ${version}`);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setError(result.error || 'Restore failed. Please try again later.');
      }
    } catch (err) {
      console.error('Restore error:', err);
      setError('Restore failed. Please try again later.');
    } finally {
      setLoading(false);
      setRestoringVersion(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-lg"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          handleOpen();
        }}
      >
        <DialogHeader>
          <DialogTitle>Delete History</DialogTitle>
          <DialogDescription>
            View and restore from previous versions (up to 5 versions stored)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Record ID */}
          <div className="bg-muted rounded-lg p-3 border border-muted-foreground/20">
            <p className="text-xs text-muted-foreground">Record ID</p>
            <p className="text-sm font-mono text-foreground break-all">{recordId}</p>
          </div>

          {/* History list */}
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Version Timeline
            </p>

            {history.length === 0 ? (
              <div className="bg-muted rounded-lg p-4 text-center text-sm text-muted-foreground">
                No deletion history found
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {history
                  .sort((a, b) => b.version_number - a.version_number)
                  .map((version) => (
                    <div
                      key={version.version_number}
                      className="bg-muted rounded-lg p-3 border border-muted-foreground/20 flex items-center justify-between gap-3"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm text-foreground">
                          Version {version.version_number}
                          {version.restored_at && (
                            <span className="text-xs text-muted-foreground ml-2">(Restored)</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1 mt-1">
                          <div>
                            Deleted: {new Date(version.deleted_at).toLocaleDateString()}{' '}
                            {new Date(version.deleted_at).toLocaleTimeString()}
                          </div>
                          <div>By: {version.deleted_by.slice(0, 12)}</div>
                        </div>
                      </div>

                      {!version.restored_at && (
                        <Button
                          size="sm"
                          variant={
                            restoringVersion === version.version_number ? 'default' : 'outline'
                          }
                          onClick={() => handleRestore(version.version_number)}
                          disabled={loading}
                          className="whitespace-nowrap"
                        >
                          {loading && restoringVersion === version.version_number ? (
                            <>
                              <RotateCcw className="w-3 h-3 animate-spin mr-1" />
                              Restoring...
                            </>
                          ) : (
                            <>
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Restore
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Error state */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success state */}
          {success && (
            <Alert className="bg-emerald-500/10 border-emerald-500/20 text-emerald-700">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Close button */}
          <Button variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
