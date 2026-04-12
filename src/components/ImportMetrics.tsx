import { IngestionMetrics } from '@/lib/import-ingestion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Database, AlertTriangle } from 'lucide-react';

interface ImportMetricsProps {
  metrics: IngestionMetrics;
  status: 'success' | 'error';
  fileName?: string;
}

export function ImportMetrics({ metrics, status, fileName }: ImportMetricsProps) {
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (status === 'error') {
    return (
      <Card className="border-rose-500/50 bg-rose-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-rose-600">
            <AlertTriangle className="w-5 h-5" />
            Import Encountered Issues
          </CardTitle>
          <CardDescription>Try again later or contact support if the problem persists</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <CardTitle>Import Successful</CardTitle>
          </div>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
            ✓ Complete
          </Badge>
        </div>
        {fileName && <CardDescription>File: {fileName}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 rounded-lg bg-emerald-500/10">
            <div className="flex items-center gap-2 text-emerald-600 font-semibold mb-1">
              <Database className="w-4 h-4" />
              Records Imported
            </div>
            <div className="text-2xl font-bold text-foreground">{metrics.successfulRecords}</div>
          </div>

          <div className="p-3 rounded-lg bg-blue-500/10">
            <div className="text-blue-600 font-semibold text-sm mb-1">Records Skipped</div>
            <div className="text-2xl font-bold text-foreground">{metrics.skippedRecords}</div>
          </div>

          <div className="p-3 rounded-lg bg-amber-500/10">
            <div className="text-amber-600 font-semibold text-sm mb-1">Errors Fixed</div>
            <div className="text-2xl font-bold text-foreground">{metrics.fixedErrors}</div>
          </div>

          <div className="p-3 rounded-lg bg-slate-500/10">
            <div className="flex items-center gap-2 text-slate-600 font-semibold text-sm mb-1">
              <Clock className="w-4 h-4" />
              Duration
            </div>
            <div className="text-2xl font-bold text-foreground">{formatDuration(metrics.importDuration)}</div>
          </div>
        </div>

        {/* Entity Type Breakdown */}
        {Object.keys(metrics.entityCounts).length > 0 && (
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Records by Type</h3>
            <div className="space-y-2">
              {Object.entries(metrics.entityCounts).map(([entityType, count]) => (
                <div key={entityType} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div>
                    <span className="font-medium capitalize">{entityType}</span>
                    {metrics.missingFields[entityType] && metrics.missingFields[entityType].length > 0 && (
                      <div className="text-xs text-amber-600 mt-1">
                        ⚠️ Missing: {metrics.missingFields[entityType].join(', ')}
                      </div>
                    )}
                  </div>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Missing Fields Info */}
        {Object.values(metrics.missingFields).some((fields) => fields.length > 0) && (
          <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <div className="text-sm text-amber-700">
              <strong>Note:</strong> Some records were skipped due to missing required fields. Check the details above.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
