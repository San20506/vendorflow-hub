import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, FileSpreadsheet, X, CheckCircle2, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  rows: number;
  uploadedAt: string;
  progress: number;
  status: 'uploading' | 'complete' | 'error';
}

const mockPreviewData = [
  { skuId: 'SKU-001', productName: 'Wireless Earbuds', quantity: 150, price: 2999 },
  { skuId: 'SKU-002', productName: 'Fitness Watch', quantity: 85, price: 4999 },
  { skuId: 'SKU-003', productName: 'Cotton T-Shirt', quantity: 320, price: 599 },
  { skuId: 'SKU-004', productName: 'Water Bottle', quantity: 200, price: 799 },
  { skuId: 'SKU-005', productName: 'Baby Gift Set', quantity: 45, price: 1299 },
];

const mockFileHistory: UploadedFile[] = [
  { id: 'hist-1', name: 'inventory_update_jan.xlsx', size: '245.3 KB', rows: 342, uploadedAt: '2026-02-08 14:30', progress: 100, status: 'complete' },
  { id: 'hist-2', name: 'orders_batch_007.csv', size: '128.7 KB', rows: 189, uploadedAt: '2026-02-07 09:15', progress: 100, status: 'complete' },
  { id: 'hist-3', name: 'sku_mapping_update.xlsx', size: '67.2 KB', rows: 56, uploadedAt: '2026-02-05 16:45', progress: 100, status: 'complete' },
];

export function ExcelUpload() {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragActive(true);
    else if (e.type === 'dragleave') setIsDragActive(false);
  }, []);

  const processFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles: UploadedFile[] = Array.from(files).map((file, index) => ({
      id: `file-${Date.now()}-${index}`,
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      rows: Math.floor(Math.random() * 500) + 100,
      uploadedAt: new Date().toLocaleString(),
      progress: 0,
      status: 'uploading' as const,
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);

    // Simulate upload progress
    newFiles.forEach(f => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30 + 10;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setUploadedFiles(prev => prev.map(uf => uf.id === f.id ? { ...uf, progress: 100, status: 'complete' } : uf));
        } else {
          setUploadedFiles(prev => prev.map(uf => uf.id === f.id ? { ...uf, progress: Math.min(progress, 95) } : uf));
        }
      }, 400);
    });

    setShowPreview(true);
    toast({ title: 'Files Uploaded', description: `${files.length} file(s) uploaded successfully.` });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    processFiles(e.dataTransfer.files);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => processFiles(e.target.files);

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
    if (uploadedFiles.length <= 1) setShowPreview(false);
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Excel Files</CardTitle>
          <CardDescription>Upload one or more Excel files to import data</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
            }`}
          >
            <div className="flex flex-col items-center gap-4">
              <div className={`p-4 rounded-full transition-colors ${isDragActive ? 'bg-primary/10' : 'bg-muted'}`}>
                <Upload className={`w-8 h-8 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="text-lg font-medium text-foreground">
                  {isDragActive ? 'Drop files here' : 'Drag & drop Excel files here'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">or click to browse from your computer</p>
              </div>
              <label>
                <input type="file" accept=".xlsx,.xls,.csv" multiple onChange={handleFileInput} className="hidden" />
                <Button variant="outline" className="gap-2" asChild>
                  <span><FileSpreadsheet className="w-4 h-4" />Browse Files</span>
                </Button>
              </label>
              <p className="text-xs text-muted-foreground">Supported formats: .xlsx, .xls, .csv</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files List with Progress */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Uploaded Files ({uploadedFiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{file.size} • {file.rows} rows • {file.uploadedAt}</p>
                      {file.status === 'uploading' && (
                        <Progress value={file.progress} className="h-1.5 mt-1.5" />
                      )}
                    </div>
                    <Badge variant="outline" className={file.status === 'complete' ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' : 'bg-blue-500/15 text-blue-600 border-blue-500/30'}>
                      {file.status === 'complete' ? 'Complete' : `${Math.round(file.progress)}%`}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeFile(file.id)} className="text-muted-foreground hover:text-destructive ml-2">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* File History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            Upload History
          </CardTitle>
          <CardDescription>Previously uploaded files</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {mockFileHistory.map(file => (
              <div key={file.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{file.size} • {file.rows} rows</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{file.uploadedAt}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Preview */}
      {showPreview && (
        <Card>
          <CardHeader>
            <CardTitle>Data Preview</CardTitle>
            <CardDescription>Sample data from uploaded files (first 5 rows)</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU ID</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Price (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockPreviewData.map((row) => (
                  <TableRow key={row.skuId}>
                    <TableCell className="font-mono text-sm">{row.skuId}</TableCell>
                    <TableCell>{row.productName}</TableCell>
                    <TableCell className="text-right">{row.quantity}</TableCell>
                    <TableCell className="text-right">₹{row.price.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowPreview(false)}>Cancel</Button>
              <Button onClick={() => toast({ title: 'Import Started', description: 'Processing your data...' })}>Import Data</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
