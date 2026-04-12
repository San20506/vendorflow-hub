import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit2, Tag, Trash } from 'lucide-react';

export interface BulkSelectToolbarProps {
  selectedCount: number;
  onEdit: () => void;
  onCategorize: () => void;
  onDelete?: () => void;
  onClear: () => void;
  isLoading?: boolean;
}

export function BulkSelectToolbar({
  selectedCount,
  onEdit,
  onCategorize,
  onDelete,
  onClear,
  isLoading = false
}: BulkSelectToolbarProps) {
  const isDisabled = selectedCount === 0 || isLoading;

  return (
    <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
      <Badge variant="secondary" className="text-base px-3 py-1">
        {selectedCount} selected
      </Badge>

      <div className="flex gap-2 ml-auto">
        <Button
          size="sm"
          variant="outline"
          onClick={onEdit}
          disabled={isDisabled}
          className="gap-2"
        >
          <Edit2 className="w-4 h-4" />
          Edit
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={onCategorize}
          disabled={isDisabled}
          className="gap-2"
        >
          <Tag className="w-4 h-4" />
          Categorize
        </Button>

        {onDelete && (
          <Button
            size="sm"
            variant="destructive"
            onClick={onDelete}
            disabled={isDisabled}
            className="gap-2"
          >
            <Trash className="w-4 h-4" />
            Delete
          </Button>
        )}

        <Button
          size="sm"
          variant="destructive"
          onClick={onClear}
          disabled={isDisabled}
          className="gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Clear
        </Button>
      </div>
    </div>
  );
}
