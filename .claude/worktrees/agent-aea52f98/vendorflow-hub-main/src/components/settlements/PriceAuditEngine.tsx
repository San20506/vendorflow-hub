import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown, Download, ShieldAlert, History, TrendingDown, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PriceAuditItem {
  skuId: string;
  productName: string;
  portal: string;
  mrp: number;
  sellingPrice: number;
  portalSellingPrice: number;
  expectedMarginPct: number;
  actualMarginPct: number;
  lastAuditDate: string;
  previousMarginPct: number;
}

interface AuditLogEntry {
  id: string;
  skuId: string;
  productName: string;
  portal: string;
  timestamp: string;
  field: string;
  oldValue: string;
  newValue: string;
  marginImpact: number;
  severity: 'warning' | 'critical' | 'info';
}

const mockAuditData: PriceAuditItem[] = [
  { skuId: 'BT-EP-101', productName: 'Boat Earbuds Pro', portal: 'Amazon', mrp: 2999, sellingPrice: 2499, portalSellingPrice: 2399, expectedMarginPct: 32, actualMarginPct: 28.5, lastAuditDate: '2026-02-13', previousMarginPct: 33 },
  { skuId: 'NK-RS-220', productName: 'Nike Running Shoes', portal: 'Flipkart', mrp: 7999, sellingPrice: 6499, portalSellingPrice: 6299, expectedMarginPct: 28, actualMarginPct: 22.1, lastAuditDate: '2026-02-13', previousMarginPct: 27 },
  { skuId: 'SM-CH-305', productName: 'Samsung Charger 25W', portal: 'Amazon', mrp: 1499, sellingPrice: 1199, portalSellingPrice: 1199, expectedMarginPct: 35, actualMarginPct: 34.8, lastAuditDate: '2026-02-14', previousMarginPct: 35 },
  { skuId: 'LV-SJ-410', productName: "Levi's Slim Jeans", portal: 'Meesho', mrp: 3499, sellingPrice: 2799, portalSellingPrice: 2599, expectedMarginPct: 25, actualMarginPct: 18.3, lastAuditDate: '2026-02-12', previousMarginPct: 24 },
  { skuId: 'FP-RT-510', productName: 'Fisher-Price Rattle', portal: 'FirstCry', mrp: 899, sellingPrice: 749, portalSellingPrice: 699, expectedMarginPct: 22, actualMarginPct: 15.2, lastAuditDate: '2026-02-14', previousMarginPct: 21 },
  { skuId: 'HM-BC-601', productName: 'Himalaya Baby Cream', portal: 'Blinkit', mrp: 299, sellingPrice: 249, portalSellingPrice: 249, expectedMarginPct: 30, actualMarginPct: 29.5, lastAuditDate: '2026-02-14', previousMarginPct: 30 },
  { skuId: 'AD-ST-720', productName: 'Adidas Sports Tee', portal: 'Flipkart', mrp: 1999, sellingPrice: 1599, portalSellingPrice: 1499, expectedMarginPct: 26, actualMarginPct: 19.8, lastAuditDate: '2026-02-13', previousMarginPct: 25 },
  { skuId: 'JB-BS-830', productName: 'JBL Bluetooth Speaker', portal: 'Amazon', mrp: 4999, sellingPrice: 3999, portalSellingPrice: 3999, expectedMarginPct: 30, actualMarginPct: 29.2, lastAuditDate: '2026-02-14', previousMarginPct: 30 },
  { skuId: 'PM-BP-940', productName: 'Puma Backpack', portal: 'Meesho', mrp: 2499, sellingPrice: 1899, portalSellingPrice: 1699, expectedMarginPct: 20, actualMarginPct: 12.4, lastAuditDate: '2026-02-12', previousMarginPct: 19 },
  { skuId: 'OP-BZ-105', productName: 'OnePlus Buds Z2', portal: 'Amazon', mrp: 3299, sellingPrice: 2799, portalSellingPrice: 2799, expectedMarginPct: 28, actualMarginPct: 27.5, lastAuditDate: '2026-02-14', previousMarginPct: 28 },
];

const mockAuditLog: AuditLogEntry[] = [
  { id: 'AL-001', skuId: 'NK-RS-220', productName: 'Nike Running Shoes', portal: 'Flipkart', timestamp: '2026-02-13 14:22', field: 'Portal Selling Price', oldValue: '₹6,499', newValue: '₹6,299', marginImpact: -4.9, severity: 'critical' },
  { id: 'AL-002', skuId: 'LV-SJ-410', productName: "Levi's Slim Jeans", portal: 'Meesho', timestamp: '2026-02-12 09:15', field: 'Portal Selling Price', oldValue: '₹2,799', newValue: '₹2,599', marginImpact: -5.7, severity: 'critical' },
  { id: 'AL-003', skuId: 'PM-BP-940', productName: 'Puma Backpack', portal: 'Meesho', timestamp: '2026-02-12 11:30', field: 'Portal Selling Price', oldValue: '₹1,899', newValue: '₹1,699', marginImpact: -6.6, severity: 'critical' },
  { id: 'AL-004', skuId: 'BT-EP-101', productName: 'Boat Earbuds Pro', portal: 'Amazon', timestamp: '2026-02-13 16:45', field: 'Portal Selling Price', oldValue: '₹2,499', newValue: '₹2,399', marginImpact: -3.5, severity: 'warning' },
  { id: 'AL-005', skuId: 'AD-ST-720', productName: 'Adidas Sports Tee', portal: 'Flipkart', timestamp: '2026-02-13 10:00', field: 'Selling Price', oldValue: '₹1,699', newValue: '₹1,599', marginImpact: -5.2, severity: 'warning' },
  { id: 'AL-006', skuId: 'FP-RT-510', productName: 'Fisher-Price Rattle', portal: 'FirstCry', timestamp: '2026-02-14 08:10', field: 'Portal Selling Price', oldValue: '₹749', newValue: '₹699', marginImpact: -5.8, severity: 'warning' },
  { id: 'AL-007', skuId: 'SM-CH-305', productName: 'Samsung Charger 25W', portal: 'Amazon', timestamp: '2026-02-14 12:00', field: 'MRP', oldValue: '₹1,499', newValue: '₹1,499', marginImpact: 0, severity: 'info' },
  { id: 'AL-008', skuId: 'JB-BS-830', productName: 'JBL Bluetooth Speaker', portal: 'Amazon', timestamp: '2026-02-14 09:30', field: 'Commission Rate', oldValue: '14%', newValue: '15%', marginImpact: -0.8, severity: 'info' },
];

const MARGIN_DROP_THRESHOLD = 3; // percentage points

type SortField = 'productName' | 'mrp' | 'sellingPrice' | 'portalSellingPrice' | 'expectedMarginPct' | 'actualMarginPct' | 'marginDrop';
type SortDir = 'asc' | 'desc';

const portals = ['All', 'Amazon', 'Flipkart', 'Meesho', 'FirstCry', 'Blinkit'];

export default function PriceAuditEngine() {
  const { toast } = useToast();
  const [portalFilter, setPortalFilter] = useState('All');
  const [sortField, setSortField] = useState<SortField>('marginDrop');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [activeView, setActiveView] = useState<'audit' | 'log'>('audit');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
    return sortDir === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  const filteredData = useMemo(() => {
    let data = portalFilter === 'All' ? mockAuditData : mockAuditData.filter(i => i.portal === portalFilter);

    const getValue = (item: PriceAuditItem, field: SortField): number | string => {
      if (field === 'marginDrop') return item.expectedMarginPct - item.actualMarginPct;
      return item[field];
    };

    return [...data].sort((a, b) => {
      const aVal = getValue(a, sortField);
      const bVal = getValue(b, sortField);
      const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal as string) : (aVal as number) - (bVal as number);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [portalFilter, sortField, sortDir]);

  const marginDropItems = filteredData.filter(i => (i.expectedMarginPct - i.actualMarginPct) >= MARGIN_DROP_THRESHOLD);
  const criticalLogs = mockAuditLog.filter(l => l.severity === 'critical');

  const handleExport = () => {
    toast({ title: 'Audit Report Exported', description: `Exported ${activeView === 'audit' ? filteredData.length + ' audit entries' : mockAuditLog.length + ' log entries'} to Excel` });
  };

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      {marginDropItems.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-amber-700">Margin Drop Alert</p>
              <p className="text-sm text-muted-foreground">{marginDropItems.length} product(s) showing margin drop ≥{MARGIN_DROP_THRESHOLD}% from expected. {criticalLogs.length} critical audit log entries require review.</p>
            </div>
            <Button variant="outline" size="sm" className="gap-1 border-amber-500/30 text-amber-700 hover:bg-amber-500/10" onClick={() => setActiveView('log')}>
              <History className="w-3.5 h-3.5" />View Log
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={portalFilter} onValueChange={setPortalFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Portal" /></SelectTrigger>
          <SelectContent>{portals.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
        </Select>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <Button variant={activeView === 'audit' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveView('audit')}>Audit Table</Button>
          <Button variant={activeView === 'log' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveView('log')} className="gap-1"><History className="w-3.5 h-3.5" />Audit Log</Button>
        </div>
        <div className="ml-auto">
          <Button variant="outline" size="sm" className="gap-1" onClick={handleExport}><Download className="w-3.5 h-3.5" />Export Audit Report</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><ShieldAlert className="w-5 h-5 text-primary" /></div><div><p className="text-xl font-bold">{filteredData.length}</p><p className="text-xs text-muted-foreground">Products Audited</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-destructive/10"><TrendingDown className="w-5 h-5 text-destructive" /></div><div><p className="text-xl font-bold text-destructive">{marginDropItems.length}</p><p className="text-xs text-muted-foreground">Margin Drops</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-amber-500/10"><AlertTriangle className="w-5 h-5 text-amber-600" /></div><div><p className="text-xl font-bold text-amber-600">{filteredData.filter(i => i.sellingPrice !== i.portalSellingPrice).length}</p><p className="text-xs text-muted-foreground">Price Mismatches</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-emerald-500/10"><CheckCircle2 className="w-5 h-5 text-emerald-600" /></div><div><p className="text-xl font-bold text-emerald-600">{filteredData.filter(i => (i.expectedMarginPct - i.actualMarginPct) < MARGIN_DROP_THRESHOLD).length}</p><p className="text-xs text-muted-foreground">Healthy Margins</p></div></div></CardContent></Card>
      </div>

      {activeView === 'audit' ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Price Audit Table</CardTitle>
            <CardDescription>Track MRP, Selling Price, Portal Price & Expected Margin — click headers to sort</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold cursor-pointer select-none" onClick={() => handleSort('productName')}>
                      <span className="flex items-center">Product<SortIcon field="productName" /></span>
                    </TableHead>
                    <TableHead className="font-semibold">SKU ID</TableHead>
                    <TableHead className="font-semibold">Portal</TableHead>
                    <TableHead className="font-semibold text-right cursor-pointer select-none" onClick={() => handleSort('mrp')}>
                      <span className="flex items-center justify-end">MRP<SortIcon field="mrp" /></span>
                    </TableHead>
                    <TableHead className="font-semibold text-right cursor-pointer select-none" onClick={() => handleSort('sellingPrice')}>
                      <span className="flex items-center justify-end">Selling Price<SortIcon field="sellingPrice" /></span>
                    </TableHead>
                    <TableHead className="font-semibold text-right cursor-pointer select-none" onClick={() => handleSort('portalSellingPrice')}>
                      <span className="flex items-center justify-end">Portal Price<SortIcon field="portalSellingPrice" /></span>
                    </TableHead>
                    <TableHead className="font-semibold text-right cursor-pointer select-none" onClick={() => handleSort('expectedMarginPct')}>
                      <span className="flex items-center justify-end">Expected %<SortIcon field="expectedMarginPct" /></span>
                    </TableHead>
                    <TableHead className="font-semibold text-right cursor-pointer select-none" onClick={() => handleSort('actualMarginPct')}>
                      <span className="flex items-center justify-end">Actual %<SortIcon field="actualMarginPct" /></span>
                    </TableHead>
                    <TableHead className="font-semibold text-right cursor-pointer select-none" onClick={() => handleSort('marginDrop')}>
                      <span className="flex items-center justify-end">Drop<SortIcon field="marginDrop" /></span>
                    </TableHead>
                    <TableHead className="font-semibold text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map(item => {
                    const drop = item.expectedMarginPct - item.actualMarginPct;
                    const priceMismatch = item.sellingPrice !== item.portalSellingPrice;
                    const isDropping = drop >= MARGIN_DROP_THRESHOLD;
                    return (
                      <TableRow key={item.skuId} className={isDropping ? 'bg-destructive/5' : ''}>
                        <TableCell className="font-medium text-sm max-w-[160px] truncate">{item.productName}</TableCell>
                        <TableCell className="text-sm font-mono text-muted-foreground">{item.skuId}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{item.portal}</Badge></TableCell>
                        <TableCell className="text-right text-sm">₹{item.mrp.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-sm font-medium">₹{item.sellingPrice.toLocaleString()}</TableCell>
                        <TableCell className={`text-right text-sm font-medium ${priceMismatch ? 'text-amber-600' : ''}`}>
                          ₹{item.portalSellingPrice.toLocaleString()}
                          {priceMismatch && <span className="text-[10px] block text-amber-500">≠ Selling</span>}
                        </TableCell>
                        <TableCell className="text-right text-sm">{item.expectedMarginPct}%</TableCell>
                        <TableCell className={`text-right text-sm font-semibold ${isDropping ? 'text-destructive' : 'text-emerald-600'}`}>{item.actualMarginPct}%</TableCell>
                        <TableCell className={`text-right text-sm font-bold ${isDropping ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {drop > 0 ? `-${drop.toFixed(1)}%` : '0%'}
                        </TableCell>
                        <TableCell className="text-center">
                          {isDropping ? (
                            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 gap-1 text-xs">
                              <AlertTriangle className="w-3 h-3" />Warning
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1 text-xs">
                              <CheckCircle2 className="w-3 h-3" />Healthy
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2"><History className="w-5 h-5" />Audit Log</CardTitle>
            <CardDescription>Chronological record of price changes and margin impacts</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Timestamp</TableHead>
                    <TableHead className="font-semibold">Product</TableHead>
                    <TableHead className="font-semibold">Portal</TableHead>
                    <TableHead className="font-semibold">Field Changed</TableHead>
                    <TableHead className="font-semibold text-right">Old Value</TableHead>
                    <TableHead className="font-semibold text-right">New Value</TableHead>
                    <TableHead className="font-semibold text-right">Margin Impact</TableHead>
                    <TableHead className="font-semibold text-center">Severity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockAuditLog.map(log => (
                    <TableRow key={log.id} className={log.severity === 'critical' ? 'bg-destructive/5' : log.severity === 'warning' ? 'bg-amber-500/5' : ''}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{log.timestamp}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{log.productName}</p>
                          <p className="text-xs text-muted-foreground font-mono">{log.skuId}</p>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{log.portal}</Badge></TableCell>
                      <TableCell className="text-sm">{log.field}</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">{log.oldValue}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{log.newValue}</TableCell>
                      <TableCell className={`text-right text-sm font-bold ${log.marginImpact < -3 ? 'text-destructive' : log.marginImpact < 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                        {log.marginImpact !== 0 ? `${log.marginImpact > 0 ? '+' : ''}${log.marginImpact}%` : '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        {log.severity === 'critical' && <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 text-xs">Critical</Badge>}
                        {log.severity === 'warning' && <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs">Warning</Badge>}
                        {log.severity === 'info' && <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30 text-xs">Info</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
