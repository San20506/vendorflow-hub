import { useState, useRef, useCallback } from 'react';
import { processImport, PipelineResult } from '@/lib/import-pipeline';
import { processImportWorkflow, IngestionResult } from '@/lib/import-ingestion';
import { ImportMetrics } from '@/components/ImportMetrics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { FileSpreadsheet, Package, RotateCcw, Upload, FolderOpen, X, File, Image, FileText, Loader2 } from 'lucide-react';

interface UploadedFileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return <Image className="w-5 h-5 text-primary" />;
  if (type.includes('spreadsheet') || type.includes('csv') || type.includes('excel')) return <FileSpreadsheet className="w-5 h-5 text-primary" />;
  return <FileText className="w-5 h-5 text-muted-foreground" />;
}

export default function DataImport() {
  const { user } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileInfo[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null);
  const [ingestionResult, setIngestionResult] = useState<IngestionResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const newFiles: UploadedFileInfo[] = Array.from(files).map(f => ({
      id: crypto.randomUUID(),
      name: f.name,
      size: f.size,
      type: f.type || 'application/octet-stream',
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (id: string) => setUploadedFiles(prev => prev.filter(f => f.id !== id));

  const handleProcessFile = useCallback(async (file: File) => {
    if (!user?.vendor_id) {
      alert('Vendor ID not found. Please log in again.');
      return;
    }

    setIsProcessing(true);
    try {
      // Step 1: Run preprocessing pipeline
      const result = await processImport(file);
      setPipelineResult(result);

      // Step 2: Run ingestion workflow (Gemini fixes + Supabase insert + logging)
      const ingestion = await processImportWorkflow(result, user.vendor_id, file.name);
      setIngestionResult(ingestion);

      // Clear uploaded files on success
      setUploadedFiles([]);
    } catch (error) {
      console.error('Import error:', error);
      setIngestionResult({
        success: false,
        metrics: {
          totalRecords: 0,
          successfulRecords: 0,
          skippedRecords: 0,
          fixedErrors: 0,
          unfixableErrors: 0,
          importDuration: 0,
          entityCounts: {},
          missingFields: {},
        },
        errors: [{ rowIndex: 0, field: 'system', originalValue: String(error) }],
      });
    } finally {
      setIsProcessing(false);
    }
  }, [user?.vendor_id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bulk Data Import</h1>
          <p className="text-muted-foreground">Auto-detect format, validate schema, fix errors with AI, and import data</p>
        </div>
        <Badge variant="outline">v0.2</Badge>
      </div>

      {/* Display metrics after import completes */}
      {ingestionResult && (
        <ImportMetrics
          metrics={ingestionResult.metrics}
          status={ingestionResult.success ? 'success' : 'error'}
          fileName={uploadedFiles[0]?.name}
        />
      )}

      {/* Drag & Drop Import Zone */}
      {!ingestionResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Import Your Data
            </CardTitle>
            <CardDescription>Drag & drop a CSV, JSON, JSONL, or XLSX file</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
            >
              <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium text-foreground mb-1">Drag & drop file here</p>
              <p className="text-sm text-muted-foreground mb-4">Supports CSV, JSON, JSONL, and XLSX formats</p>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
                <File className="w-4 h-4 mr-1.5" />
                Select File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
                accept=".csv,.json,.jsonl,.xlsx,.xls"
                disabled={isProcessing}
              />
            </div>

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">{uploadedFiles.length} file(s) selected</h4>
                  <Button variant="ghost" size="sm" onClick={() => setUploadedFiles([])} disabled={isProcessing}>
                    Clear
                  </Button>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2 scrollbar-thin">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3 min-w-0">
                        {getFileIcon(file.type)}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleProcessFile(new File([new Blob()], file.name, { type: file.type }))}
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            'Import'
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 h-7 w-7"
                          onClick={() => removeFile(file.id)}
                          disabled={isProcessing}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
