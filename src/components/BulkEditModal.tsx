import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { bulkUpdateRecords } from '@/lib/bulk-operations';
import { AlertCircle, Loader2 } from 'lucide-react';

type EntityType = 'products' | 'orders' | 'settlements';

const FIELD_OPTIONS: Record<EntityType, { label: string; value: string; type: string }[]> = {
  products: [
    { label: 'Status', value: 'status', type: 'select' },
    { label: 'Category', value: 'category', type: 'text' },
    { label: 'SKU', value: 'sku', type: 'text' },
  ],
  orders: [
    { label: 'Status', value: 'status', type: 'select' },
  ],
  settlements: [
    { label: 'Status', value: 'status', type: 'select' },
  ],
};

const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordIds: string[];
  entityType: EntityType;
  onSuccess: () => void;
}

export function BulkEditModal({
  isOpen,
  onClose,
  recordIds,
  entityType,
  onSuccess,
}: BulkEditModalProps) {
  const [selectedField, setSelectedField] = useState<string>('');
  const [value, setValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fields = FIELD_OPTIONS[entityType] || [];
  const selectedFieldDef = fields.find(f => f.value === selectedField);

  const handleUpdate = async () => {
    if (!selectedField || !value) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await bulkUpdateRecords(
        entityType,
        recordIds,
        selectedField,
        value
      );

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || 'Update failed. Please try again later.');
      }
    } catch (err) {
      setError('Update failed. Please try again later.');
      console.error('Bulk update error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedField('');
    setValue('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Edit Records</DialogTitle>
          <DialogDescription>
            Update {recordIds.length} {entityType} records
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="field">Field</Label>
            <Select value={selectedField} onValueChange={setSelectedField}>
              <SelectTrigger id="field">
                <SelectValue placeholder="Select field to edit" />
              </SelectTrigger>
              <SelectContent>
                {fields.map(field => (
                  <SelectItem key={field.value} value={field.value}>
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">New Value</Label>
            {selectedFieldDef?.type === 'select' ? (
              <Select value={value} onValueChange={setValue}>
                <SelectTrigger id="value">
                  <SelectValue placeholder="Select value" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(option => (
                    <SelectItem key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="value"
                placeholder="Enter value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            )}
          </div>

          {selectedField && value && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded text-sm">
              Will update <strong>{recordIds.length} records</strong><br />
              <strong>{selectedFieldDef?.label}</strong> → <strong>{value}</strong>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isLoading || !selectedField || !value}
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
