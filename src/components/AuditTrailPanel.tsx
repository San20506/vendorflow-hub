import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAuditLogs } from '@/lib/bulk-operations';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Trash2, RotateCcw, Edit2 } from 'lucide-react';

interface AuditLog {
  operation_type: string;
  entity_type: string;
  record_id?: string;
  record_count?: number;
  user_id: string;
  userName: string;
  timestamp: string;
  metadata?: any;
  status: string;
}

export function AuditTrailPanel() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [operationFilter, setOperationFilter] = useState<string>('');
  const [entityFilter, setEntityFilter] = useState<string>('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadLogs();
  }, [operationFilter, entityFilter, page]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters: any = { page, limit: 10 };
      if (operationFilter) filters.operationType = operationFilter;
      if (entityFilter) filters.entityType = entityFilter;

      const response = await fetchAuditLogs(filters);
      setLogs(response.logs);
      setTotal(response.total);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setError('Failed to load audit trail. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getOperationIcon = (operationType: string) => {
    switch (operationType) {
      case 'bulk_delete':
        return <Trash2 className="w-4 h-4" />;
      case 'restore':
        return <RotateCcw className="w-4 h-4" />;
      case 'bulk_update':
        return <Edit2 className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getOperationBadge = (operationType: string) => {
    const variants: Record<string, any> = {
      bulk_delete: 'destructive',
      restore: 'default',
      bulk_update: 'secondary'
    };
    return variants[operationType] || 'outline';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getOperationDescription = (log: AuditLog) => {
    switch (log.operation_type) {
      case 'bulk_delete':
        return `✓ ${log.record_count || 1} record(s) deleted`;
      case 'restore':
        return `✓ Record restored from version ${log.metadata?.from_version || 'N/A'}`;
      case 'bulk_update':
        return `✓ ${log.record_count || 1} record(s) updated`;
      default:
        return `${log.operation_type}`;
    }
  };

  if (error) {
    return (
      <Card className="p-6 border-red-200 bg-red-50">
        <p className="text-sm text-red-700">{error}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3">
        <Select value={operationFilter} onValueChange={setOperationFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All operations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All operations</SelectItem>
            <SelectItem value="bulk_delete">Delete operations</SelectItem>
            <SelectItem value="restore">Restore operations</SelectItem>
            <SelectItem value="bulk_update">Update operations</SelectItem>
          </SelectContent>
        </Select>

        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All entities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All entities</SelectItem>
            <SelectItem value="products">Products</SelectItem>
            <SelectItem value="orders">Orders</SelectItem>
            <SelectItem value="settlements">Settlements</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <Card className="p-8 text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No audit logs in this period</p>
          </Card>
        ) : (
          logs.map((log, idx) => (
            <Card key={idx} className="p-4 border-l-4 border-l-blue-500">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getOperationIcon(log.operation_type)}
                    <Badge variant={getOperationBadge(log.operation_type)}>
                      {log.operation_type}
                    </Badge>
                    {log.entity_type && (
                      <Badge variant="outline" className="text-xs">
                        {log.entity_type}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium">{getOperationDescription(log)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    By {log.userName} • {formatDate(log.timestamp)}
                  </p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && total > 10 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-xs text-muted-foreground">
            Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page * 10 >= total}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
