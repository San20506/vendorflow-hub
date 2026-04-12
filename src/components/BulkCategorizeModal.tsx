import { useState, useMemo } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { bulkCategorizeRecords } from '@/lib/bulk-operations';
import { AlertCircle, Loader2 } from 'lucide-react';

interface BulkCategorizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordIds: string[];
  onSuccess: () => void;
}

export function BulkCategorizeModal({
  isOpen,
  onClose,
  recordIds,
  onSuccess,
}: BulkCategorizeModalProps) {
  const { user } = useAuth();
  const { data: products = [] } = useProducts(user?.id || null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats).sort();
  }, [products]);

  const handleAssign = async () => {
    if (!selectedCategory) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await bulkCategorizeRecords(
        recordIds,
        selectedCategory
      );

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || 'Assignment failed. Please try again later.');
      }
    } catch (err) {
      setError('Assignment failed. Please try again later.');
      console.error('Bulk categorize error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedCategory('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Categorize Products</DialogTitle>
          <DialogDescription>
            Assign category to {recordIds.length} product{recordIds.length !== 1 ? 's' : ''}
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
            <Label htmlFor="category">Category</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    No categories found
                  </div>
                ) : (
                  categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedCategory && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded text-sm">
              Will assign <strong>{selectedCategory}</strong> category to <strong>{recordIds.length} product{recordIds.length !== 1 ? 's' : ''}</strong>
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
              onClick={handleAssign}
              disabled={isLoading || !selectedCategory}
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Assign
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
