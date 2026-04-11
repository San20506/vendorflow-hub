import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Video, Camera, FileImage, Search, FileSpreadsheet, FileDown, Eye,
  AlertTriangle, CheckCircle2, Clock, XCircle, ArrowUpDown, Settings2,
  ShieldCheck, HardDrive, Timer,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type VideoStatus = 'not_captured' | 'video_captured' | 'invoice_captured' | 'verified' | 'completed';

interface VideoRecord {
  id: string;
  orderId: string;
  videoStatus: VideoStatus;
  invoiceImage: boolean;
  internalStatus: string;
  fileName: string;
  resolution: 'low' | 'medium' | 'high';
  capturedAt: string;
  verifiedBy: string;
  retentionDays: number;
  expiresAt: string;
  fileSize: string;
  notes: string;
}

const statusConfig: Record<VideoStatus, { label: string; color: string; icon: React.ElementType }> = {
  not_captured: { label: 'Not Captured', color: 'bg-rose-500/10 text-rose-600 border-rose-500/30', icon: XCircle },
  video_captured: { label: 'Video Captured', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30', icon: Video },
  invoice_captured: { label: 'Invoice Captured', color: 'bg-amber-500/10 text-amber-600 border-amber-500/30', icon: FileImage },
  verified: { label: 'Verified', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30', icon: ShieldCheck },
  completed: { label: 'Completed', color: 'bg-primary/10 text-primary border-primary/30', icon: CheckCircle2 },
};

const mockRecords: VideoRecord[] = [
  { id: '1', orderId: 'ORD-10234', videoStatus: 'completed', invoiceImage: true, internalStatus: 'Dispatched', fileName: 'ORD-10234_20260213_143200', resolution: 'high', capturedAt: '2026-02-13 14:32:00', verifiedBy: 'Rahul S.', retentionDays: 120, expiresAt: '2026-06-13', fileSize: '45.2 MB', notes: '' },
  { id: '2', orderId: 'ORD-10235', videoStatus: 'verified', invoiceImage: true, internalStatus: 'Packed', fileName: 'ORD-10235_20260213_141500', resolution: 'medium', capturedAt: '2026-02-13 14:15:00', verifiedBy: 'Priya M.', retentionDays: 90, expiresAt: '2026-05-14', fileSize: '28.7 MB', notes: '' },
  { id: '3', orderId: 'ORD-10236', videoStatus: 'invoice_captured', invoiceImage: true, internalStatus: 'Processing', fileName: 'ORD-10236_20260213_135800', resolution: 'medium', capturedAt: '2026-02-13 13:58:00', verifiedBy: '—', retentionDays: 90, expiresAt: '2026-05-14', fileSize: '12.1 MB', notes: 'Awaiting video upload' },
  { id: '4', orderId: 'ORD-10237', videoStatus: 'video_captured', invoiceImage: false, internalStatus: 'Packed', fileName: 'ORD-10237_20260213_132000', resolution: 'low', capturedAt: '2026-02-13 13:20:00', verifiedBy: '—', retentionDays: 90, expiresAt: '2026-05-14', fileSize: '8.4 MB', notes: 'Invoice pending' },
  { id: '5', orderId: 'ORD-10238', videoStatus: 'not_captured', invoiceImage: false, internalStatus: 'Dispatched', fileName: '—', resolution: 'medium', capturedAt: '—', verifiedBy: '—', retentionDays: 90, expiresAt: '—', fileSize: '—', notes: 'Alert: processed without video' },
  { id: '6', orderId: 'ORD-10239', videoStatus: 'completed', invoiceImage: true, internalStatus: 'Delivered', fileName: 'ORD-10239_20260212_160400', resolution: 'high', capturedAt: '2026-02-12 16:04:00', verifiedBy: 'Amit K.', retentionDays: 120, expiresAt: '2026-06-12', fileSize: '52.8 MB', notes: '' },
  { id: '7', orderId: 'ORD-10240', videoStatus: 'not_captured', invoiceImage: false, internalStatus: 'Packed', fileName: '—', resolution: 'medium', capturedAt: '—', verifiedBy: '—', retentionDays: 90, expiresAt: '—', fileSize: '—', notes: 'Alert: processed without video' },
  { id: '8', orderId: 'ORD-10241', videoStatus: 'verified', invoiceImage: true, internalStatus: 'Dispatched', fileName: 'ORD-10241_20260212_110200', resolution: 'high', capturedAt: '2026-02-12 11:02:00', verifiedBy: 'Sneha R.', retentionDays: 120, expiresAt: '2026-06-12', fileSize: '41.3 MB', notes: '' },
];

export default function VideoManagement() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [detailRecord, setDetailRecord] = useState<VideoRecord | null>(null);
  const [defaultRetention, setDefaultRetention] = useState('90');
  const [defaultResolution, setDefaultResolution] = useState('medium');
  const [alertEnabled, setAlertEnabled] = useState(true);
  const [sortField, setSortField] = useState<'orderId' | 'capturedAt' | 'videoStatus'>('orderId');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const filtered = useMemo(() => {
    let data = [...mockRecords];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(r => r.orderId.toLowerCase().includes(q) || r.fileName.toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') {
      data = data.filter(r => r.videoStatus === statusFilter);
    }
    data.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      const cmp = valA < valB ? -1 : valA > valB ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return data;
  }, [searchQuery, statusFilter, sortField, sortDir]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const stats = useMemo(() => ({
    total: mockRecords.length,
    completed: mockRecords.filter(r => r.videoStatus === 'completed').length,
    notCaptured: mockRecords.filter(r => r.videoStatus === 'not_captured').length,
    verified: mockRecords.filter(r => r.videoStatus === 'verified').length,
    pendingInvoice: mockRecords.filter(r => !r.invoiceImage).length,
  }), []);

  const alertOrders = mockRecords.filter(r => r.videoStatus === 'not_captured' && r.internalStatus !== 'Processing');

  const handleExport = (fmt: 'excel' | 'pdf') => {
    toast({ title: `Export ${fmt.toUpperCase()}`, description: 'Preparing video log export...' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Video Management System</h1>
          <p className="text-muted-foreground mt-1">Track order videos, invoice images, and verification status</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleExport('excel')}>
            <FileSpreadsheet className="w-4 h-4" />Excel
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleExport('pdf')}>
            <FileDown className="w-4 h-4" />PDF
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><Video className="w-5 h-5 text-primary" /></div><div><p className="text-2xl font-bold">{stats.total}</p><p className="text-sm text-muted-foreground">Total Records</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-emerald-500/10"><CheckCircle2 className="w-5 h-5 text-emerald-600" /></div><div><p className="text-2xl font-bold">{stats.completed}</p><p className="text-sm text-muted-foreground">Completed</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-emerald-500/10"><ShieldCheck className="w-5 h-5 text-emerald-600" /></div><div><p className="text-2xl font-bold">{stats.verified}</p><p className="text-sm text-muted-foreground">Verified</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-rose-500/10"><XCircle className="w-5 h-5 text-rose-600" /></div><div><p className="text-2xl font-bold text-rose-600">{stats.notCaptured}</p><p className="text-sm text-muted-foreground">Not Captured</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-amber-500/10"><FileImage className="w-5 h-5 text-amber-600" /></div><div><p className="text-2xl font-bold text-amber-600">{stats.pendingInvoice}</p><p className="text-sm text-muted-foreground">No Invoice</p></div></div></CardContent></Card>
      </div>

      {/* Alert Banner */}
      {alertEnabled && alertOrders.length > 0 && (
        <Alert className="border-rose-500/30 bg-rose-500/5">
          <AlertTriangle className="h-4 w-4 text-rose-600" />
          <AlertDescription className="text-rose-600 ml-2">
            <strong>{alertOrders.length} order(s) processed without video capture:</strong>{' '}
            {alertOrders.map(o => o.orderId).join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {/* Search + Filters + Settings */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label className="text-foreground font-medium mb-2 block">Search Order ID</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by Order ID or file name..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Label className="text-foreground font-medium mb-2 block">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="not_captured">Not Captured</SelectItem>
                  <SelectItem value="video_captured">Video Captured</SelectItem>
                  <SelectItem value="invoice_captured">Invoice Captured</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Label className="text-foreground font-medium mb-2 block">Retention</Label>
              <Select value={defaultRetention} onValueChange={setDefaultRetention}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="90">90 Days</SelectItem>
                  <SelectItem value="120">120 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Label className="text-foreground font-medium mb-2 block">Resolution</Label>
              <Select value={defaultResolution} onValueChange={setDefaultResolution}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pb-1">
              <Switch checked={alertEnabled} onCheckedChange={setAlertEnabled} />
              <Label className="text-sm text-muted-foreground whitespace-nowrap">Alerts</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Video Log Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Camera className="w-5 h-5" />Video & Invoice Log</CardTitle>
          <CardDescription>{filtered.length} record(s) found — File naming: OrderID_timestamp</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold cursor-pointer" onClick={() => toggleSort('orderId')}>
                    <span className="flex items-center gap-1">Order ID <ArrowUpDown className="w-3 h-3" /></span>
                  </TableHead>
                  <TableHead className="font-semibold cursor-pointer" onClick={() => toggleSort('videoStatus')}>
                    <span className="flex items-center gap-1">Video Status <ArrowUpDown className="w-3 h-3" /></span>
                  </TableHead>
                  <TableHead className="font-semibold">Invoice</TableHead>
                  <TableHead className="font-semibold">Internal Status</TableHead>
                  <TableHead className="font-semibold">File Name</TableHead>
                  <TableHead className="font-semibold">Resolution</TableHead>
                  <TableHead className="font-semibold cursor-pointer" onClick={() => toggleSort('capturedAt')}>
                    <span className="flex items-center gap-1">Captured <ArrowUpDown className="w-3 h-3" /></span>
                  </TableHead>
                  <TableHead className="font-semibold">Retention</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(r => {
                  const sc = statusConfig[r.videoStatus];
                  const StatusIcon = sc.icon;
                  return (
                    <TableRow key={r.id} className={r.videoStatus === 'not_captured' ? 'bg-rose-500/[0.03]' : ''}>
                      <TableCell className="font-mono font-medium">{r.orderId}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`gap-1 ${sc.color}`}>
                          <StatusIcon className="w-3 h-3" />{sc.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {r.invoiceImage ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1">
                            <FileImage className="w-3 h-3" />Yes
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-muted text-muted-foreground gap-1">
                            <XCircle className="w-3 h-3" />No
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell><Badge variant="secondary">{r.internalStatus}</Badge></TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground max-w-[200px] truncate">{r.fileName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs capitalize">{r.resolution}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.capturedAt === '—' ? '—' : r.capturedAt}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Timer className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{r.retentionDays}d</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="gap-1" onClick={() => setDetailRecord(r)}>
                          <Eye className="w-3.5 h-3.5" />Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No records found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Settings Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings2 className="w-5 h-5" />Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3 p-4 rounded-lg border">
              <HardDrive className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Storage Retention</p>
                <p className="text-sm text-muted-foreground">Default: <strong>{defaultRetention} days</strong></p>
                <p className="text-xs text-muted-foreground mt-1">Files auto-deleted after retention period</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg border">
              <Video className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Default Resolution</p>
                <p className="text-sm text-muted-foreground">Capture quality: <strong className="capitalize">{defaultResolution}</strong></p>
                <p className="text-xs text-muted-foreground mt-1">Low ~8MB · Medium ~25MB · High ~50MB</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg border">
              <AlertTriangle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Missing Video Alerts</p>
                <p className="text-sm text-muted-foreground">Status: <strong>{alertEnabled ? 'Enabled' : 'Disabled'}</strong></p>
                <p className="text-xs text-muted-foreground mt-1">Alert if order processed without video</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={!!detailRecord} onOpenChange={open => { if (!open) setDetailRecord(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Video Record Details</DialogTitle>
          </DialogHeader>
          {detailRecord && (() => {
            const sc = statusConfig[detailRecord.videoStatus];
            const StatusIcon = sc.icon;
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Order ID</p>
                    <p className="font-semibold font-mono">{detailRecord.orderId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Video Status</p>
                    <Badge variant="outline" className={`gap-1 mt-1 ${sc.color}`}>
                      <StatusIcon className="w-3 h-3" />{sc.label}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Invoice Image</p>
                    <p className="text-sm font-medium">{detailRecord.invoiceImage ? 'Captured' : 'Not captured'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Internal Status</p>
                    <Badge variant="secondary" className="mt-1">{detailRecord.internalStatus}</Badge>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">File Name</p>
                  <p className="text-sm font-mono">{detailRecord.fileName}</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Resolution</p>
                    <p className="text-sm font-medium capitalize">{detailRecord.resolution}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">File Size</p>
                    <p className="text-sm font-medium">{detailRecord.fileSize}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Retention</p>
                    <p className="text-sm font-medium">{detailRecord.retentionDays} days</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Captured At</p>
                    <p className="text-sm">{detailRecord.capturedAt}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Verified By</p>
                    <p className="text-sm">{detailRecord.verifiedBy}</p>
                  </div>
                </div>
                {detailRecord.expiresAt !== '—' && (
                  <div>
                    <p className="text-xs text-muted-foreground">Expires On</p>
                    <p className="text-sm">{format(new Date(detailRecord.expiresAt), 'dd MMM yyyy')}</p>
                  </div>
                )}
                {detailRecord.notes && (
                  <Alert className="border-amber-500/30 bg-amber-500/5">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-600 ml-2">{detailRecord.notes}</AlertDescription>
                  </Alert>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
