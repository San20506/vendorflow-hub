import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { portalConfigs } from '@/services/mockData';
import { Portal } from '@/types';
import { TrendingUp, TrendingDown, AlertTriangle, Star } from 'lucide-react';

interface SKUTrend {
  id: string;
  sku: string;
  productName: string;
  portal: Portal;
  currentMargin: number;
  lastMonthMargin: number;
  trend: 'up' | 'down' | 'stable';
  dropAlert: boolean;
}

const mockSKUTrends: SKUTrend[] = [
  { id: 'ST-01', sku: 'SKU-AMZ-001', productName: 'Wireless Earbuds Pro', portal: 'amazon', currentMargin: 32.5, lastMonthMargin: 28.0, trend: 'up', dropAlert: false },
  { id: 'ST-02', sku: 'SKU-FLK-003', productName: 'Cotton T-Shirt', portal: 'flipkart', currentMargin: 18.2, lastMonthMargin: 25.8, trend: 'down', dropAlert: true },
  { id: 'ST-03', sku: 'SKU-MSH-002', productName: 'Smart Fitness Watch', portal: 'meesho', currentMargin: 24.0, lastMonthMargin: 26.5, trend: 'down', dropAlert: false },
  { id: 'ST-04', sku: 'SKU-AMZ-006', productName: 'BT Speaker', portal: 'amazon', currentMargin: 12.5, lastMonthMargin: 22.0, trend: 'down', dropAlert: true },
  { id: 'ST-05', sku: 'SKU-FCY-005', productName: 'Baby Care Set', portal: 'firstcry', currentMargin: 35.0, lastMonthMargin: 33.0, trend: 'up', dropAlert: false },
  { id: 'ST-06', sku: 'SKU-BLK-004', productName: 'Water Bottle', portal: 'blinkit', currentMargin: 8.5, lastMonthMargin: 15.0, trend: 'down', dropAlert: true },
  { id: 'ST-07', sku: 'SKU-FLK-001', productName: 'Earbuds Pro Max', portal: 'flipkart', currentMargin: 28.0, lastMonthMargin: 27.5, trend: 'stable', dropAlert: false },
  { id: 'ST-08', sku: 'SKU-MSH-007', productName: 'Yoga Mat Premium', portal: 'meesho', currentMargin: 15.0, lastMonthMargin: 24.0, trend: 'down', dropAlert: true },
];

export default function SKUProfitabilityTrend() {
  const stats = useMemo(() => {
    const drops = mockSKUTrends.filter(s => s.dropAlert);
    const sorted = [...mockSKUTrends].sort((a, b) => b.currentMargin - a.currentMargin);
    return {
      marginDropCount: drops.length,
      mostProfitable: sorted[0],
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-amber-500/30 bg-amber-500/5"><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-amber-500/10"><AlertTriangle className="w-5 h-5 text-amber-600" /></div><div><p className="text-2xl font-bold">{stats.marginDropCount}</p><p className="text-sm text-muted-foreground">SKUs with Margin Drop</p></div></div></CardContent></Card>
        <Card className="border-emerald-500/30 bg-emerald-500/5"><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-emerald-500/10"><Star className="w-5 h-5 text-emerald-600" /></div><div><p className="text-2xl font-bold">{stats.mostProfitable?.currentMargin}%</p><p className="text-sm text-muted-foreground">Top: {stats.mostProfitable?.productName}</p></div></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SKU-Level Profitability Trend</CardTitle>
          <CardDescription>Month-over-month margin analysis with drop alerts for seller protection</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">SKU</TableHead>
                  <TableHead className="font-semibold">Product</TableHead>
                  <TableHead className="font-semibold">Portal</TableHead>
                  <TableHead className="text-right font-semibold">Current Margin %</TableHead>
                  <TableHead className="text-right font-semibold">Last Month %</TableHead>
                  <TableHead className="text-center font-semibold">Trend</TableHead>
                  <TableHead className="font-semibold">Alert</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockSKUTrends.map(s => {
                  const portal = portalConfigs.find(p => p.id === s.portal);
                  const diff = s.currentMargin - s.lastMonthMargin;
                  return (
                    <TableRow key={s.id} className={s.dropAlert ? 'bg-rose-500/5' : ''}>
                      <TableCell className="font-mono text-xs">{s.sku}</TableCell>
                      <TableCell className="text-sm font-medium">{s.productName}</TableCell>
                      <TableCell><span className="flex items-center gap-1.5 text-sm">{portal?.icon} {portal?.name}</span></TableCell>
                      <TableCell className="text-right font-bold">{s.currentMargin.toFixed(1)}%</TableCell>
                      <TableCell className="text-right text-muted-foreground">{s.lastMonthMargin.toFixed(1)}%</TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center gap-1 font-semibold ${diff > 0 ? 'text-emerald-600' : diff < -5 ? 'text-rose-600' : diff < 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                          {s.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : s.trend === 'down' ? <TrendingDown className="w-4 h-4" /> : '—'}
                          {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        {s.dropAlert ? (
                          <Badge variant="outline" className="bg-rose-500/15 text-rose-600 border-rose-500/30 gap-1">
                            <AlertTriangle className="w-3 h-3" />Margin Drop Alert
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
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
    </div>
  );
}
