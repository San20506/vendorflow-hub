import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, Scan, Package, RotateCcw, CheckCircle2, XCircle, Video, FileImage, ShieldCheck, AlertTriangle, IndianRupee } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ScanMode = 'order' | 'return';

interface ScanResult {
  barcode: string;
  type: 'order' | 'product' | 'return';
  details: {
    id: string;
    name: string;
    status: string;
    quantity?: number;
    sku?: string;
    mrp?: number;
    sellingPrice?: number;
    image?: string;
  };
}

const mockScanResults: Record<string, ScanResult> = {
  'ORD-2024-001': {
    barcode: 'ORD-2024-001',
    type: 'order',
    details: {
      id: 'ORD-2024-001',
      name: 'Premium Wireless Earbuds Pro',
      status: 'shipped',
      quantity: 1,
      sku: 'SKU-EAR-PRO-001',
      mrp: 2999,
      sellingPrice: 2499,
      image: '/placeholder.svg',
    },
  },
  'RET-2024-001': {
    barcode: 'RET-2024-001',
    type: 'return',
    details: {
      id: 'RET-2024-001',
      name: 'Organic Cotton T-Shirt',
      status: 'pending',
      quantity: 1,
      sku: 'SKU-TSH-ORG-042',
      mrp: 999,
      sellingPrice: 749,
      image: '/placeholder.svg',
    },
  },
  'SKU-AMZ-001': {
    barcode: 'SKU-AMZ-001',
    type: 'product',
    details: {
      id: 'SKU-AMZ-001',
      name: 'Premium Wireless Earbuds Pro',
      status: 'in_stock',
      quantity: 245,
      sku: 'SKU-EAR-PRO-001',
      mrp: 2999,
      sellingPrice: 2499,
      image: '/placeholder.svg',
    },
  },
};

interface BarcodeScannerProps {
  mode?: ScanMode;
  trigger?: React.ReactNode;
}

export function BarcodeScanner({ mode = 'order', trigger }: BarcodeScannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanError, setScanError] = useState(false);
  const [videoCaptured, setVideoCaptured] = useState(false);
  const [capturingVideo, setCapturingVideo] = useState(false);
  const [invoiceCaptured, setInvoiceCaptured] = useState(false);
  const [capturingInvoice, setCapturingInvoice] = useState(false);
  const [verified, setVerified] = useState(false);
  const [mismatchAlert, setMismatchAlert] = useState(false);
  const { toast } = useToast();

  const simulateScan = () => {
    setIsScanning(true);
    setScanResult(null);
    setScanError(false);
    setVideoCaptured(false);
    setInvoiceCaptured(false);
    setVerified(false);
    setMismatchAlert(false);

    setTimeout(() => {
      setIsScanning(false);
      const mockBarcodes = Object.keys(mockScanResults);
      const shouldError = Math.random() < 0.15;

      if (shouldError) {
        setScanError(true);
        toast({ title: 'Scan Failed', description: 'Unable to read barcode. Please try again.', variant: 'destructive' });
      } else {
        const randomBarcode = mockBarcodes[Math.floor(Math.random() * mockBarcodes.length)];
        const result = mockScanResults[randomBarcode];
        setScanResult(result);

        // 20% chance of mismatch alert
        if (Math.random() < 0.2) {
          setMismatchAlert(true);
        }

        toast({ title: 'Barcode Scanned', description: `Successfully scanned: ${result.barcode}` });
      }
    }, 1500);
  };

  const handleCaptureVideo = () => {
    setCapturingVideo(true);
    setTimeout(() => {
      setCapturingVideo(false);
      setVideoCaptured(true);
      toast({ title: 'Video Captured', description: `File: ${scanResult?.details.id}_${Date.now()}` });
    }, 2000);
  };

  const handleCaptureInvoice = () => {
    setCapturingInvoice(true);
    setTimeout(() => {
      setCapturingInvoice(false);
      setInvoiceCaptured(true);
      toast({ title: 'Invoice Photo Captured', description: 'Invoice image saved successfully.' });
    }, 1500);
  };

  const resetScanner = () => {
    setScanResult(null);
    setScanError(false);
    setIsScanning(false);
    setVideoCaptured(false);
    setCapturingVideo(false);
    setInvoiceCaptured(false);
    setCapturingInvoice(false);
    setVerified(false);
    setMismatchAlert(false);
  };

  const handleProcess = () => {
    setVerified(true);
    toast({
      title: mode === 'order' ? 'Order Processed' : 'Return Accepted',
      description: `${scanResult?.details.name} — Status changed to Processed with verification badge.`,
    });
    setTimeout(() => {
      setIsOpen(false);
      resetScanner();
    }, 1200);
  };

  const formatCurrency = (val: number) => `₹${val.toLocaleString()}`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetScanner(); }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Scan className="w-4 h-4" />
            {mode === 'order' ? 'Scan Order' : 'Scan Return'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'order' ? (
              <><Package className="w-5 h-5" />Order Barcode Scanner</>
            ) : (
              <><RotateCcw className="w-5 h-5" />Return Barcode Scanner</>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === 'order' ? 'Scan order barcode, capture video & invoice, then process' : 'Scan return barcode to accept returned items'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera View */}
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            {isScanning ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="text-center space-y-4">
                  <div className="relative">
                    <div className="w-48 h-32 border-2 border-primary rounded-lg animate-pulse" />
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full h-0.5 bg-primary animate-[scan_1.5s_ease-in-out_infinite]" />
                    </div>
                  </div>
                  <p className="text-white text-sm">Scanning...</p>
                </div>
              </div>
            ) : capturingVideo ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="text-center space-y-3">
                  <Video className="w-12 h-12 text-rose-500 mx-auto animate-pulse" />
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <p className="text-white text-sm">Recording video...</p>
                  </div>
                </div>
              </div>
            ) : capturingInvoice ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="text-center space-y-3">
                  <FileImage className="w-12 h-12 text-amber-500 mx-auto animate-pulse" />
                  <p className="text-white text-sm">Capturing invoice...</p>
                </div>
              </div>
            ) : verified ? (
              <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/10">
                <div className="text-center space-y-2">
                  <ShieldCheck className="w-16 h-16 text-emerald-500 mx-auto" />
                  <p className="text-sm font-medium text-emerald-600">Verified & Processed</p>
                </div>
              </div>
            ) : scanResult ? (
              <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/10">
                <CheckCircle2 className="w-16 h-16 text-emerald-500" />
              </div>
            ) : scanError ? (
              <div className="absolute inset-0 flex items-center justify-center bg-destructive/10">
                <XCircle className="w-16 h-16 text-destructive" />
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <Camera className="w-12 h-12 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">Position barcode in view</p>
                </div>
              </div>
            )}
          </div>

          {/* Mismatch Alert */}
          {mismatchAlert && scanResult && (
            <Alert className="border-rose-500/30 bg-rose-500/5">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              <AlertDescription className="text-rose-600 ml-2">
                <strong>Mismatch Detected:</strong> Scanned item quantity or SKU does not match the order manifest. Please verify before processing.
              </AlertDescription>
            </Alert>
          )}

          {/* Product Details After Scan */}
          {scanResult && (
            <Card className="border-emerald-500/30 bg-emerald-500/5">
              <CardContent className="pt-4">
                <div className="flex gap-4">
                  {/* Product Image */}
                  <div className="w-16 h-16 rounded-lg bg-muted border overflow-hidden shrink-0 flex items-center justify-center">
                    <img src={scanResult.details.image} alt={scanResult.details.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <p className="font-mono text-xs text-muted-foreground">{scanResult.barcode}</p>
                    <p className="font-medium text-sm">{scanResult.details.name}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="capitalize text-xs">{scanResult.type}</Badge>
                      <Badge variant="outline" className={
                        scanResult.details.status === 'in_stock' || scanResult.details.status === 'shipped'
                          ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-xs'
                          : 'bg-amber-500/15 text-amber-600 border-amber-500/30 text-xs'
                      }>
                        {scanResult.details.status.replace('_', ' ')}
                      </Badge>
                      {videoCaptured && (
                        <Badge variant="outline" className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 gap-1 text-xs">
                          <ShieldCheck className="w-3 h-3" />Verified
                        </Badge>
                      )}
                    </div>
                    {/* SKU, Qty, MRP, Selling Price */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 text-sm">
                      {scanResult.details.sku && (
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground text-xs">SKU:</span>
                          <span className="font-mono text-xs font-medium">{scanResult.details.sku}</span>
                        </div>
                      )}
                      {scanResult.details.quantity != null && (
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground text-xs">Qty:</span>
                          <span className="font-medium text-xs">{scanResult.details.quantity}</span>
                        </div>
                      )}
                      {scanResult.details.mrp != null && (
                        <div className="flex items-center gap-1">
                          <IndianRupee className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground text-xs">MRP:</span>
                          <span className="font-medium text-xs">{formatCurrency(scanResult.details.mrp)}</span>
                        </div>
                      )}
                      {scanResult.details.sellingPrice != null && (
                        <div className="flex items-center gap-1">
                          <IndianRupee className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground text-xs">Price:</span>
                          <span className="font-medium text-xs text-primary">{formatCurrency(scanResult.details.sellingPrice)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Capture Status Badges */}
                <div className="flex gap-2 mt-3 pt-3 border-t">
                  <Badge variant="outline" className={`gap-1 text-xs ${videoCaptured ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'text-muted-foreground'}`}>
                    <Video className="w-3 h-3" />{videoCaptured ? 'Video ✓' : 'No Video'}
                  </Badge>
                  <Badge variant="outline" className={`gap-1 text-xs ${invoiceCaptured ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'text-muted-foreground'}`}>
                    <FileImage className="w-3 h-3" />{invoiceCaptured ? 'Invoice ✓' : 'No Invoice'}
                  </Badge>
                  {videoCaptured && (
                    <Badge variant="outline" className="gap-1 text-xs bg-primary/10 text-primary border-primary/30">
                      <ShieldCheck className="w-3 h-3" />Processed
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {!scanResult && !scanError && (
              <Button className="flex-1 gap-2" onClick={simulateScan} disabled={isScanning}>
                <Scan className="w-4 h-4" />
                {isScanning ? 'Scanning...' : 'Start Scan'}
              </Button>
            )}

            {scanResult && !verified && (
              <>
                {!videoCaptured && (
                  <Button variant="outline" className="gap-2" onClick={handleCaptureVideo} disabled={capturingVideo}>
                    <Video className="w-4 h-4" />
                    {capturingVideo ? 'Recording...' : 'Capture Video'}
                  </Button>
                )}
                {!invoiceCaptured && (
                  <Button variant="outline" className="gap-2" onClick={handleCaptureInvoice} disabled={capturingInvoice}>
                    <FileImage className="w-4 h-4" />
                    {capturingInvoice ? 'Capturing...' : 'Capture Invoice'}
                  </Button>
                )}
                <Button className="gap-2" onClick={handleProcess} disabled={mismatchAlert && !videoCaptured}>
                  {mode === 'order' ? 'Process Order' : 'Accept Return'}
                </Button>
              </>
            )}

            {(scanResult || scanError) && !verified && (
              <Button variant="ghost" className="gap-2" onClick={resetScanner}>
                <Camera className="w-4 h-4" />Scan Again
              </Button>
            )}
          </div>
        </div>
      </DialogContent>

      <style>{`
        @keyframes scan {
          0%, 100% { transform: translateY(-50px); }
          50% { transform: translateY(50px); }
        }
      `}</style>
    </Dialog>
  );
}
