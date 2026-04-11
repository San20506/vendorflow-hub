import { useState } from 'react';
import { ExcelUpload } from '@/components/ExcelUpload';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileSpreadsheet, Scan, Package, RotateCcw, CheckCircle, AlertTriangle, XCircle, Lightbulb } from 'lucide-react';

const validationChecks = [
  { label: 'Orders Imported', status: 'success' as const, detail: '1,247 records synced' },
  { label: 'Inventory Synced', status: 'success' as const, detail: 'All warehouses up to date' },
  { label: 'SKU Mapping Complete', status: 'success' as const, detail: '98% mapped' },
  { label: 'Missing Product Data', status: 'warning' as const, detail: '3 products missing images' },
  { label: 'Incorrect Fields', status: 'error' as const, detail: '2 SKUs with invalid barcodes' },
];

const suggestions = [
  'Upload SKU master to resolve mapping errors',
  'Update product images for 3 incomplete listings',
  'Review barcode format for SKU-MSH-007 and SKU-BLK-004',
];

export default function DataImport() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Data Import & Scanning</h1>
        <p className="text-muted-foreground">Upload Excel files or scan barcodes for quick data entry</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10"><FileSpreadsheet className="w-6 h-6 text-primary" /></div>
              <div><h3 className="font-semibold">Excel Upload</h3><p className="text-sm text-muted-foreground">Bulk import data</p></div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <BarcodeScanner mode="order" trigger={
              <div className="flex items-center gap-4 w-full">
                <div className="p-3 rounded-lg bg-emerald-500/10"><Package className="w-6 h-6 text-emerald-600" /></div>
                <div className="text-left"><h3 className="font-semibold">Scan Order</h3><p className="text-sm text-muted-foreground">Process shipments</p></div>
              </div>
            } />
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <BarcodeScanner mode="return" trigger={
              <div className="flex items-center gap-4 w-full">
                <div className="p-3 rounded-lg bg-amber-500/10"><RotateCcw className="w-6 h-6 text-amber-600" /></div>
                <div className="text-left"><h3 className="font-semibold">Scan Return</h3><p className="text-sm text-muted-foreground">Accept returns</p></div>
              </div>
            } />
          </CardContent>
        </Card>
      </div>

      {/* Data Validation Center */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            Data Validation Center
          </CardTitle>
          <CardDescription>System-wide data health checklist</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {validationChecks.map((check) => (
              <div key={check.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  {check.status === 'success' && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                  {check.status === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600" />}
                  {check.status === 'error' && <XCircle className="w-5 h-5 text-rose-600" />}
                  <div>
                    <p className="font-medium">{check.label}</p>
                    <p className="text-sm text-muted-foreground">{check.detail}</p>
                  </div>
                </div>
                <Badge variant="outline" className={`${
                  check.status === 'success' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' :
                  check.status === 'warning' ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' :
                  'bg-rose-500/10 text-rose-600 border-rose-500/30'
                }`}>
                  {check.status === 'success' ? '✔ Passed' : check.status === 'warning' ? '⚠ Warning' : '❌ Failed'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Suggestions */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-primary font-bold">→</span>
                <span className="text-muted-foreground">{s}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <ExcelUpload />
    </div>
  );
}
