import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Download, FileText, Clock, ShoppingCart, Package, BarChart3, Upload, UserCheck, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown, FileSpreadsheet, FileDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { TimelineFilter, type TimelineValue, getTimelineLabel } from '@/components/TimelineFilter';

const daysAgo = (d: number) => { const dt = new Date(); dt.setDate(dt.getDate() - d); return dt.toISOString(); };

const mockReports = [
  { id: 'RPT-001', name: 'Sales Summary - January 2026', type: 'Sales', format: 'Excel', generatedAt: daysAgo(3), size: '1.2 MB' },
  { id: 'RPT-002', name: 'Inventory Snapshot - Week 5', type: 'Inventory', format: 'PDF', generatedAt: daysAgo(5), size: '845 KB' },
  { id: 'RPT-003', name: 'Order Reconciliation - Jan 2026', type: 'Orders', format: 'Excel', generatedAt: daysAgo(7), size: '2.1 MB' },
  { id: 'RPT-004', name: 'Returns Analysis - Q4 2025', type: 'Returns', format: 'PDF', generatedAt: daysAgo(12), size: '1.5 MB' },
  { id: 'RPT-005', name: 'Portal-wise Revenue - Jan 2026', type: 'Sales', format: 'Excel', generatedAt: daysAgo(2), size: '980 KB' },
  { id: 'RPT-006', name: 'Settlement Report - Jan 2026', type: 'Settlement', format: 'Excel', generatedAt: daysAgo(4), size: '1.8 MB' },
];

const mockHistory = [
  { id: 1, action: 'Product Added', user: 'Sarah Johnson', role: 'Admin', detail: 'Added "LED Desk Lamp" to catalog', timestamp: daysAgo(0) },
  { id: 2, action: 'Excel Upload', user: 'Emily Davis', role: 'Operations', detail: 'Uploaded inventory_update_jan.xlsx (342 rows)', timestamp: daysAgo(0) },
  { id: 3, action: 'Order Status Changed', user: 'System', role: 'System', detail: 'ORD-2024-003 status → Packed', timestamp: daysAgo(0) },
  { id: 4, action: 'SKU Mapped', user: 'Michael Chen', role: 'Vendor', detail: 'Mapped MSK-001 → SKU-FLK-001 (Flipkart)', timestamp: daysAgo(1) },
  { id: 5, action: 'Return Approved', user: 'Emily Davis', role: 'Operations', detail: 'RET-2024-002 approved for refund ₹799', timestamp: daysAgo(1) },
  { id: 6, action: 'Settlement Completed', user: 'System', role: 'System', detail: 'SET-AMZ-2024-01 — ₹3,97,700 credited', timestamp: daysAgo(2) },
  { id: 7, action: 'Vendor Onboarded', user: 'Sarah Johnson', role: 'Admin', detail: 'BabyCare Essentials (VEN-003) activated', timestamp: daysAgo(3) },
  { id: 8, action: 'Product Deactivated', user: 'Michael Chen', role: 'Vendor', detail: 'Yoga Mat Premium set to inactive', timestamp: daysAgo(4) },
  { id: 9, action: 'Alert Resolved', user: 'Emily Davis', role: 'Operations', detail: 'Low stock alert for SKU-BLK-004 resolved', timestamp: daysAgo(5) },
  { id: 10, action: 'Report Generated', user: 'Sarah Johnson', role: 'Admin', detail: 'Sales Summary - January 2026', timestamp: daysAgo(5) },
];

const actionIcons: Record<string, React.ElementType> = {
  'Product Added': Package, 'Excel Upload': Upload, 'Order Status Changed': RefreshCw,
  'SKU Mapped': Package, 'Return Approved': RefreshCw, 'Settlement Completed': ShoppingCart,
  'Vendor Onboarded': UserCheck, 'Product Deactivated': Package, 'Alert Resolved': RefreshCw,
  'Report Generated': FileText,
};

type SortField = 'name' | 'type' | 'format' | 'size' | 'generatedAt';
type SortDir = 'asc' | 'desc';

const reportCategories = [
  { name: 'Sales Report', icon: BarChart3, color: 'bg-primary/10 text-primary', type: 'Sales' },
  { name: 'Inventory Report', icon: Package, color: 'bg-emerald-500/10 text-emerald-600', type: 'Inventory' },
  { name: 'Orders Report', icon: ShoppingCart, color: 'bg-blue-500/10 text-blue-600', type: 'Orders' },
  { name: 'Returns Report', icon: RefreshCw, color: 'bg-amber-500/10 text-amber-600', type: 'Returns' },
  { name: 'Settlement Report', icon: FileText, color: 'bg-violet-500/10 text-violet-600', type: 'Settlement' },
];

export default function Reports() {
  const { toast } = useToast();
  const [timeline, setTimeline] = useState<TimelineValue>({ preset: '30days' });
  const [sortField, setSortField] = useState<SortField>('generatedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [scheduledReports, setScheduledReports] = useState<Record<string, boolean>>({});

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
    return sortDir === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  const sortedReports = useMemo(() => {
    return [...mockReports].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'generatedAt') return dir * (new Date(a.generatedAt).getTime() - new Date(b.generatedAt).getTime());
      return dir * (a[sortField] ?? '').localeCompare(b[sortField] ?? '');
    });
  }, [sortField, sortDir]);

  const handleGenerate = (name: string) => {
    const label = getTimelineLabel(timeline);
    toast({ title: 'Generating Report', description: `${name} for "${label}" is being generated...` });
  };

  const handleExport = (type: 'excel' | 'pdf') => {
    const label = getTimelineLabel(timeline);
    toast({
      title: `Export to ${type === 'excel' ? 'Excel' : 'PDF'}`,
      description: `Preparing ${type.toUpperCase()} export for "${label}"...`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports & History</h1>
          <p className="text-muted-foreground">Access reports and view platform activity log</p>
        </div>
        <TimelineFilter value={timeline} onChange={setTimeline} />
      </div>

      <Tabs defaultValue="reports">
        <TabsList>
          <TabsTrigger value="reports" className="gap-1.5"><FileText className="w-4 h-4" />Reports</TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5"><Clock className="w-4 h-4" />Activity History</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4 mt-4">
          {/* Quick Generate with timeline applied */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {reportCategories.map(r => (
              <Card key={r.name} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleGenerate(r.name)}>
                <CardContent className="pt-6 text-center">
                  <div className={`mx-auto p-3 rounded-xl w-fit mb-3 ${r.color}`}>
                    <r.icon className="w-6 h-6" />
                  </div>
                  <p className="font-medium text-sm">{r.name}</p>
                  <Button variant="ghost" size="sm" className="mt-2 gap-1"><Download className="w-3 h-3" />Generate</Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Export & Schedule Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" className="gap-2" onClick={() => handleExport('excel')}>
              <FileSpreadsheet className="w-4 h-4" />Export to Excel
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => handleExport('pdf')}>
              <FileDown className="w-4 h-4" />Export to PDF
            </Button>
            <Badge variant="secondary" className="text-xs">
              Timeline: {getTimelineLabel(timeline)}
            </Badge>
          </div>

          {/* Report History Table with Sorting */}
          <Card>
            <CardHeader>
              <CardTitle>Generated Reports</CardTitle>
              <CardDescription>Previously generated reports available for download</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold cursor-pointer select-none" onClick={() => toggleSort('name')}>
                      <span className="flex items-center">Report<SortIcon field="name" /></span>
                    </TableHead>
                    <TableHead className="font-semibold cursor-pointer select-none" onClick={() => toggleSort('type')}>
                      <span className="flex items-center">Type<SortIcon field="type" /></span>
                    </TableHead>
                    <TableHead className="font-semibold cursor-pointer select-none" onClick={() => toggleSort('format')}>
                      <span className="flex items-center">Format<SortIcon field="format" /></span>
                    </TableHead>
                    <TableHead className="font-semibold cursor-pointer select-none" onClick={() => toggleSort('size')}>
                      <span className="flex items-center">Size<SortIcon field="size" /></span>
                    </TableHead>
                    <TableHead className="font-semibold cursor-pointer select-none" onClick={() => toggleSort('generatedAt')}>
                      <span className="flex items-center">Generated<SortIcon field="generatedAt" /></span>
                    </TableHead>
                    <TableHead className="font-semibold">Scheduled</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedReports.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell><Badge variant="secondary">{r.type}</Badge></TableCell>
                      <TableCell><Badge variant="outline">{r.format}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.size}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(new Date(r.generatedAt), 'dd MMM yyyy')}</TableCell>
                      <TableCell>
                        <Switch
                          checked={!!scheduledReports[r.id]}
                          onCheckedChange={(checked) => {
                            setScheduledReports(prev => ({ ...prev, [r.id]: checked }));
                            toast({
                              title: checked ? 'Schedule Enabled' : 'Schedule Disabled',
                              description: `${r.name} ${checked ? 'will be auto-generated weekly' : 'scheduling removed'}`,
                            });
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="gap-1" onClick={() => toast({ title: 'Download Started', description: `Downloading ${r.name}...` })}>
                            <Download className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="gap-1" onClick={() => handleExport('excel')}>
                            <FileSpreadsheet className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="gap-1" onClick={() => handleExport('pdf')}>
                            <FileDown className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>Platform activity and user actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockHistory.map(item => {
                  const Icon = actionIcons[item.action] || Clock;
                  return (
                    <div key={item.id} className="flex items-start gap-4 p-3 bg-muted/30 rounded-lg">
                      <div className="p-2 rounded-lg bg-primary/10 shrink-0 mt-0.5">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">{item.action}</p>
                          <Badge variant="secondary" className="text-xs">{item.role}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.detail}</p>
                        <p className="text-xs text-muted-foreground mt-1">{item.user} • {format(new Date(item.timestamp), 'dd MMM yyyy, HH:mm')}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
