import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IndianRupee, TrendingUp, Download, FileSpreadsheet, AlertTriangle, CheckCircle2, XCircle, Shield } from 'lucide-react';
import PriceAuditEngine from '@/components/settlements/PriceAuditEngine';
import { useToast } from '@/hooks/use-toast';

interface PriceBreakdown {
  productName: string;
  productId: string;
  portal: string;
  portalIcon: string;
  channel: string;
  marketplacePrice: number;
  commission: number;
  commissionPct: number;
  platformFees: number;
  shippingFees: number;
  gst: number;
  tcs: number;
  netPayout: number;
}

interface ReconEntry {
  id: string;
  productId: string;
  productName: string;
  channel: string;
  channelIcon: string;
  expectedSettlement: number;
  actualSettlement: number;
  commissionExpected: number;
  commissionActual: number;
  refundExpected: number;
  refundActual: number;
  penaltyAmount: number;
  status: 'matched' | 'mismatch' | 'pending';
}

const mockPriceData: PriceBreakdown[] = [
  { productName: 'Premium Wireless Earbuds Pro', productId: 'PROD-001', portal: 'Amazon', portalIcon: '🛒', channel: 'Amazon', marketplacePrice: 2999, commission: 450, commissionPct: 15, platformFees: 45, shippingFees: 60, gst: 162, tcs: 30, netPayout: 2252 },
  { productName: 'Premium Wireless Earbuds Pro', productId: 'PROD-001', portal: 'Flipkart', portalIcon: '🛍️', channel: 'Flipkart', marketplacePrice: 2999, commission: 390, commissionPct: 13, platformFees: 50, shippingFees: 55, gst: 162, tcs: 30, netPayout: 2312 },
  { productName: 'Premium Wireless Earbuds Pro', productId: 'PROD-001', portal: 'Own Website', portalIcon: '🌐', channel: 'Website', marketplacePrice: 2999, commission: 0, commissionPct: 0, platformFees: 75, shippingFees: 80, gst: 162, tcs: 0, netPayout: 2682 },
  { productName: 'Smart Fitness Watch X2', productId: 'PROD-002', portal: 'Amazon', portalIcon: '🛒', channel: 'Amazon', marketplacePrice: 4999, commission: 750, commissionPct: 15, platformFees: 75, shippingFees: 60, gst: 270, tcs: 50, netPayout: 3794 },
  { productName: 'Smart Fitness Watch X2', productId: 'PROD-002', portal: 'Meesho', portalIcon: '📦', channel: 'Meesho', marketplacePrice: 4999, commission: 600, commissionPct: 12, platformFees: 40, shippingFees: 65, gst: 270, tcs: 50, netPayout: 3974 },
  { productName: 'Smart Fitness Watch X2', productId: 'PROD-002', portal: 'Shopify', portalIcon: '🛒', channel: 'Shopify', marketplacePrice: 4999, commission: 0, commissionPct: 0, platformFees: 150, shippingFees: 70, gst: 270, tcs: 0, netPayout: 4509 },
  { productName: 'Organic Cotton T-Shirt', productId: 'PROD-003', portal: 'Amazon', portalIcon: '🛒', channel: 'Amazon', marketplacePrice: 599, commission: 120, commissionPct: 20, platformFees: 15, shippingFees: 50, gst: 32, tcs: 6, netPayout: 376 },
  { productName: 'Organic Cotton T-Shirt', productId: 'PROD-003', portal: 'Flipkart', portalIcon: '🛍️', channel: 'Flipkart', marketplacePrice: 599, commission: 108, commissionPct: 18, platformFees: 18, shippingFees: 45, gst: 32, tcs: 6, netPayout: 390 },
  { productName: 'Baby Care Gift Set', productId: 'PROD-005', portal: 'FirstCry', portalIcon: '👶', channel: 'FirstCry', marketplacePrice: 1299, commission: 195, commissionPct: 15, platformFees: 25, shippingFees: 55, gst: 70, tcs: 13, netPayout: 941 },
  { productName: 'Baby Care Gift Set', productId: 'PROD-005', portal: 'Own Website', portalIcon: '🌐', channel: 'Website', marketplacePrice: 1299, commission: 0, commissionPct: 0, platformFees: 35, shippingFees: 60, gst: 70, tcs: 0, netPayout: 1134 },
  { productName: 'Stainless Steel Water Bottle', productId: 'PROD-004', portal: 'Blinkit', portalIcon: '⚡', channel: 'Blinkit', marketplacePrice: 799, commission: 160, commissionPct: 20, platformFees: 20, shippingFees: 0, gst: 43, tcs: 8, netPayout: 568 },
];

const mockReconData: ReconEntry[] = [
  { id: 'RC-001', productId: 'PROD-001', productName: 'Premium Wireless Earbuds Pro', channel: 'Amazon', channelIcon: '🛒', expectedSettlement: 225200, actualSettlement: 225200, commissionExpected: 45000, commissionActual: 45000, refundExpected: 2999, refundActual: 2999, penaltyAmount: 0, status: 'matched' },
  { id: 'RC-002', productId: 'PROD-001', productName: 'Premium Wireless Earbuds Pro', channel: 'Flipkart', channelIcon: '🛍️', expectedSettlement: 231200, actualSettlement: 228500, commissionExpected: 39000, commissionActual: 41700, refundExpected: 0, refundActual: 0, penaltyAmount: 0, status: 'mismatch' },
  { id: 'RC-003', productId: 'PROD-002', productName: 'Smart Fitness Watch X2', channel: 'Amazon', channelIcon: '🛒', expectedSettlement: 379400, actualSettlement: 379400, commissionExpected: 75000, commissionActual: 75000, refundExpected: 4999, refundActual: 4999, penaltyAmount: 0, status: 'matched' },
  { id: 'RC-004', productId: 'PROD-002', productName: 'Smart Fitness Watch X2', channel: 'Meesho', channelIcon: '📦', expectedSettlement: 397400, actualSettlement: 385000, commissionExpected: 60000, commissionActual: 60000, refundExpected: 0, refundActual: 12400, penaltyAmount: 0, status: 'mismatch' },
  { id: 'RC-005', productId: 'PROD-003', productName: 'Organic Cotton T-Shirt', channel: 'Amazon', channelIcon: '🛒', expectedSettlement: 37600, actualSettlement: 37600, commissionExpected: 12000, commissionActual: 12000, refundExpected: 599, refundActual: 599, penaltyAmount: 0, status: 'matched' },
  { id: 'RC-006', productId: 'PROD-003', productName: 'Organic Cotton T-Shirt', channel: 'Flipkart', channelIcon: '🛍️', expectedSettlement: 39000, actualSettlement: 37200, commissionExpected: 10800, commissionActual: 12600, refundExpected: 0, refundActual: 0, penaltyAmount: 200, status: 'mismatch' },
  { id: 'RC-007', productId: 'PROD-005', productName: 'Baby Care Gift Set', channel: 'FirstCry', channelIcon: '👶', expectedSettlement: 94100, actualSettlement: 0, commissionExpected: 19500, commissionActual: 0, refundExpected: 0, refundActual: 0, penaltyAmount: 0, status: 'pending' },
  { id: 'RC-008', productId: 'PROD-004', productName: 'Stainless Steel Water Bottle', channel: 'Blinkit', channelIcon: '⚡', expectedSettlement: 56800, actualSettlement: 54300, commissionExpected: 16000, commissionActual: 18500, refundExpected: 799, refundActual: 799, penaltyAmount: 500, status: 'mismatch' },
];

const channels = ['All Channels', 'Amazon', 'Flipkart', 'Meesho', 'Shopify', 'Website', 'FirstCry', 'Blinkit'];

export default function PricePayout() {
  const { toast } = useToast();
  const [selectedChannel, setSelectedChannel] = useState('All Channels');
  const [reconChannel, setReconChannel] = useState('All Channels');
  const [activeTab, setActiveTab] = useState('payout');

  // Payout data
  const filteredData = useMemo(() => {
    if (selectedChannel === 'All Channels') return mockPriceData;
    return mockPriceData.filter(p => p.channel === selectedChannel);
  }, [selectedChannel]);

  const avgMargin = filteredData.length > 0
    ? Math.round(filteredData.reduce((s, p) => s + (p.netPayout / p.marketplacePrice * 100), 0) / filteredData.length)
    : 0;
  const avgCommission = filteredData.length > 0
    ? Math.round(filteredData.reduce((s, p) => s + p.commissionPct, 0) / filteredData.length)
    : 0;
  const totalPayout = filteredData.reduce((s, p) => s + p.netPayout, 0);

  // Reconciliation data
  const filteredRecon = useMemo(() => {
    if (reconChannel === 'All Channels') return mockReconData;
    return mockReconData.filter(r => r.channel === reconChannel);
  }, [reconChannel]);

  const reconSummary = useMemo(() => {
    const totalExpected = filteredRecon.reduce((s, r) => s + r.expectedSettlement, 0);
    const totalReceived = filteredRecon.reduce((s, r) => s + r.actualSettlement, 0);
    const totalDiff = totalExpected - totalReceived;
    const mismatches = filteredRecon.filter(r => r.status === 'mismatch').length;
    const totalPenalty = filteredRecon.reduce((s, r) => s + r.penaltyAmount, 0);
    return { totalExpected, totalReceived, totalDiff, mismatches, totalPenalty };
  }, [filteredRecon]);

  const handleExport = () => {
    toast({ title: 'Export Initiated', description: `Exporting ${activeTab === 'payout' ? 'payout' : 'reconciliation'} data` });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Price & Payout Split</h1>
          <p className="text-muted-foreground">Per-product payout breakdown & channel reconciliation engine</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleExport}>
          <Download className="w-4 h-4" />Export to Excel
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="payout">Payout Breakdown</TabsTrigger>
          <TabsTrigger value="reconciliation">Reconciliation Engine</TabsTrigger>
          <TabsTrigger value="price-audit">Price Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="payout" className="space-y-6">
          <div className="flex items-center gap-3">
            <Select value={selectedChannel} onValueChange={setSelectedChannel}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Sales Channel" /></SelectTrigger>
              <SelectContent>
                {channels.map(ch => <SelectItem key={ch} value={ch}>{ch}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><FileSpreadsheet className="w-5 h-5 text-primary" /></div><div><p className="text-2xl font-bold">{filteredData.length}</p><p className="text-sm text-muted-foreground">Price Entries</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-emerald-500/10"><TrendingUp className="w-5 h-5 text-emerald-600" /></div><div><p className="text-2xl font-bold">{avgMargin}%</p><p className="text-sm text-muted-foreground">Avg Net Margin</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-amber-500/10"><IndianRupee className="w-5 h-5 text-amber-600" /></div><div><p className="text-2xl font-bold">{avgCommission}%</p><p className="text-sm text-muted-foreground">Avg Commission</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-500/10"><IndianRupee className="w-5 h-5 text-blue-600" /></div><div><p className="text-2xl font-bold">₹{totalPayout.toLocaleString()}</p><p className="text-sm text-muted-foreground">Total Net Payout</p></div></div></CardContent></Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Payout Breakdown per Product per Portal</CardTitle>
              <CardDescription>Marketplace Price → Commission → Fees → GST → TCS → Net Payout</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Product</TableHead>
                      <TableHead className="font-semibold">Channel</TableHead>
                      <TableHead className="text-right font-semibold">MRP</TableHead>
                      <TableHead className="text-right font-semibold">Commission</TableHead>
                      <TableHead className="text-right font-semibold">Platform Fee</TableHead>
                      <TableHead className="text-right font-semibold">Shipping</TableHead>
                      <TableHead className="text-right font-semibold">GST</TableHead>
                      <TableHead className="text-right font-semibold">TCS</TableHead>
                      <TableHead className="text-right font-semibold bg-primary/10 text-primary">Net Payout</TableHead>
                      <TableHead className="text-right font-semibold">Margin %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((row, i) => {
                      const margin = Math.round((row.netPayout / row.marketplacePrice) * 100);
                      return (
                        <TableRow key={i}>
                          <TableCell><div><p className="font-medium text-sm">{row.productName}</p><p className="text-xs text-muted-foreground font-mono">{row.productId}</p></div></TableCell>
                          <TableCell><span className="flex items-center gap-1">{row.portalIcon} {row.portal}</span></TableCell>
                          <TableCell className="text-right font-medium">₹{row.marketplacePrice.toLocaleString()}</TableCell>
                          <TableCell className="text-right"><span className="text-rose-600">-₹{row.commission}</span><span className="text-xs text-muted-foreground block">{row.commissionPct}%</span></TableCell>
                          <TableCell className="text-right text-rose-600">-₹{row.platformFees}</TableCell>
                          <TableCell className="text-right text-rose-600">-₹{row.shippingFees}</TableCell>
                          <TableCell className="text-right text-rose-600">-₹{row.gst}</TableCell>
                          <TableCell className="text-right text-rose-600">-₹{row.tcs}</TableCell>
                          <TableCell className="text-right bg-primary/5 font-bold text-primary">₹{row.netPayout.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline" className={margin >= 75 ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' : margin >= 60 ? 'bg-blue-500/15 text-blue-600 border-blue-500/30' : 'bg-amber-500/15 text-amber-600 border-amber-500/30'}>{margin}%</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reconciliation" className="space-y-6">
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={reconChannel} onValueChange={setReconChannel}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Channel" /></SelectTrigger>
              <SelectContent>
                {channels.map(ch => <SelectItem key={ch} value={ch}>{ch}</SelectItem>)}
              </SelectContent>
            </Select>
            <Badge variant="outline" className="gap-1"><Shield className="w-3 h-3" />Reconciliation Engine</Badge>
          </div>

          {/* Reconciliation Summary */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card><CardContent className="pt-6"><p className="text-2xl font-bold">₹{(reconSummary.totalExpected / 1000).toFixed(1)}K</p><p className="text-sm text-muted-foreground">Total Expected</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-2xl font-bold text-emerald-600">₹{(reconSummary.totalReceived / 1000).toFixed(1)}K</p><p className="text-sm text-muted-foreground">Total Received</p></CardContent></Card>
            <Card className={reconSummary.totalDiff > 0 ? 'border-rose-500/30' : ''}><CardContent className="pt-6"><p className={`text-2xl font-bold ${reconSummary.totalDiff > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>₹{(reconSummary.totalDiff / 1000).toFixed(1)}K</p><p className="text-sm text-muted-foreground">Difference</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-2xl font-bold text-amber-600">{reconSummary.mismatches}</p><p className="text-sm text-muted-foreground">Mismatches</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-2xl font-bold text-rose-600">₹{reconSummary.totalPenalty.toLocaleString()}</p><p className="text-sm text-muted-foreground">Penalties</p></CardContent></Card>
          </div>

          {/* Loss Alert */}
          {reconSummary.totalDiff > 5000 && (
            <Card className="border-rose-500/30 bg-rose-500/5">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <p className="font-semibold text-rose-600">⚠ Seller Loss Alert</p>
                  <p className="text-sm text-muted-foreground">Total settlement shortfall of ₹{reconSummary.totalDiff.toLocaleString()} detected. Commission mismatches and undisclosed penalties may be contributing. Review flagged entries below.</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Channel Reconciliation Report</CardTitle>
              <CardDescription>Expected vs Actual settlement comparison — mismatches flagged for review</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Product</TableHead>
                      <TableHead className="font-semibold">Channel</TableHead>
                      <TableHead className="text-right font-semibold">Expected ₹</TableHead>
                      <TableHead className="text-right font-semibold">Actual ₹</TableHead>
                      <TableHead className="text-right font-semibold">Comm. Expected</TableHead>
                      <TableHead className="text-right font-semibold">Comm. Actual</TableHead>
                      <TableHead className="text-right font-semibold">Refund Diff</TableHead>
                      <TableHead className="text-right font-semibold">Penalty</TableHead>
                      <TableHead className="text-right font-semibold">Net Diff</TableHead>
                      <TableHead className="font-semibold text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecon.map(r => {
                      const diff = r.expectedSettlement - r.actualSettlement;
                      const commDiff = r.commissionActual - r.commissionExpected;
                      const refDiff = r.refundActual - r.refundExpected;
                      return (
                        <TableRow key={r.id} className={r.status === 'mismatch' ? 'bg-rose-500/5' : r.status === 'pending' ? 'bg-amber-500/5' : ''}>
                          <TableCell><div><p className="font-medium text-sm">{r.productName}</p><p className="text-xs text-muted-foreground font-mono">{r.productId}</p></div></TableCell>
                          <TableCell><span className="flex items-center gap-1">{r.channelIcon} {r.channel}</span></TableCell>
                          <TableCell className="text-right font-medium">₹{r.expectedSettlement.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-medium">₹{r.actualSettlement.toLocaleString()}</TableCell>
                          <TableCell className="text-right">₹{r.commissionExpected.toLocaleString()}</TableCell>
                          <TableCell className={`text-right ${commDiff > 0 ? 'text-rose-600 font-medium' : ''}`}>₹{r.commissionActual.toLocaleString()}{commDiff > 0 && <span className="text-xs block">+₹{commDiff.toLocaleString()}</span>}</TableCell>
                          <TableCell className={`text-right ${refDiff > 0 ? 'text-rose-600' : ''}`}>{refDiff !== 0 ? `₹${refDiff.toLocaleString()}` : '—'}</TableCell>
                          <TableCell className={`text-right ${r.penaltyAmount > 0 ? 'text-rose-600 font-medium' : 'text-muted-foreground'}`}>{r.penaltyAmount > 0 ? `-₹${r.penaltyAmount}` : '—'}</TableCell>
                          <TableCell className={`text-right font-bold ${diff > 0 ? 'text-rose-600' : diff === 0 ? 'text-emerald-600' : 'text-muted-foreground'}`}>{diff === 0 ? '₹0' : r.status === 'pending' ? '—' : `-₹${diff.toLocaleString()}`}</TableCell>
                          <TableCell className="text-center">
                            {r.status === 'matched' && <Badge variant="outline" className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 gap-1"><CheckCircle2 className="w-3 h-3" />Matched</Badge>}
                            {r.status === 'mismatch' && <Badge variant="outline" className="bg-rose-500/15 text-rose-600 border-rose-500/30 gap-1"><XCircle className="w-3 h-3" />Mismatch</Badge>}
                            {r.status === 'pending' && <Badge variant="outline" className="bg-amber-500/15 text-amber-600 border-amber-500/30 gap-1"><AlertTriangle className="w-3 h-3" />Pending</Badge>}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow className="bg-muted/50 font-bold border-t-2">
                      <TableCell colSpan={2}>Totals</TableCell>
                      <TableCell className="text-right">₹{reconSummary.totalExpected.toLocaleString()}</TableCell>
                      <TableCell className="text-right">₹{reconSummary.totalReceived.toLocaleString()}</TableCell>
                      <TableCell colSpan={4}></TableCell>
                      <TableCell className="text-right text-rose-600">-₹{reconSummary.totalDiff.toLocaleString()}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="price-audit" className="space-y-6">
          <PriceAuditEngine />
        </TabsContent>
      </Tabs>
    </div>
  );
}
