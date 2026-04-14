import { useState } from 'react';
import { AuditTrailPanel } from '@/components/AuditTrailPanel';
import { ExportModal } from '@/components/ExportModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export default function AuditTrails() {
  const [exportModalOpen, setExportModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Audit Trail
            </CardTitle>
            <Button
              onClick={() => setExportModalOpen(true)}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export Deleted Records
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <AuditTrailPanel />
        </CardContent>
      </Card>

      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        onSuccess={() => {
          // Modal already handles success state
        }}
      />
    </div>
  );
}
