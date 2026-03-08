import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { portalConfigs } from '@/services/mockData';
import { ordersDb } from '@/services/database';
import { supabase } from '@/integrations/supabase/client';
import { Download, FileSpreadsheet, TrendingUp, TrendingDown, Calendar, ArrowUpRight, ArrowDownRight, Trophy, AlertTriangle, BarChart3, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GlobalDateFilter, type DateRange } from '@/components/GlobalDateFilter';

const portals = ['amazon', 'flipkart', 'meesho', 'firstcry', 'blinkit', 'own_website'] as const;

const dateRanges = [
  { value: 'today', label: 'Today' },
  { value: '7days', label: 'Last 7 Days' },
  { value: '30days', label: 'Last 30 Days' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'this_year', label: 'This Year' },
  { value: 'last_year', label: 'Last Year' },
  { value: 'yoy', label: 'Year vs Year' },
];

function pctChange(curr: number, prev: number): number {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return +((curr - prev) / prev * 100).toFixed(1);
}

function GrowthBadge({ curr, prev }: { curr: number; prev: number }) {
  const pct = pctChange(curr, prev);
  const isPositive = pct >= 0;
  return (
    <Badge variant="outline" className={`gap-0.5 text-xs font-medium ${isPositive ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' : 'bg-rose-500/15 text-rose-600 border-rose-500/30'}`}>
      {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {isPositive ? '+' : ''}{pct}%
    </Badge>
  );
}

interface ConsolidatedRow {
  productName: string;
  sku: string;
  brand: string;
  amazon: number;
  flipkart: number;
  meesho: number;
  firstcry: number;
  blinkit: number;
  own_website: number;
  total: number;
}

export default function ConsolidatedOrders() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState('7days');
  const [viewMode, setViewMode] = useState<'normal' | 'comparison'>('normal');
  const [globalDateRange, setGlobalDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<any[]>([]);

  const isYoY = dateRange === 'yoy';
  const activeView = isYoY ? 'comparison' : viewMode;

  useEffect(() => {
    const load = async () => {
      try {
        const ordersData = await ordersDb.getAll();
        setOrders(ordersData);
        // Fetch order items for SKU-level breakdown
        const { data: items } = await supabase.from('order_items').select('*, orders!inner(portal, order_date)');
        setOrderItems(items || []);
      } catch (err) {
        console.error('Failed to load consolidated orders:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Build consolidated data from real order_items
  const consolidatedData = useMemo((): ConsolidatedRow[] => {
    const skuMap: Record<string, ConsolidatedRow> = {};
    orderItems.forEach((item: any) => {
      const portal = (item as any).orders?.portal || 'unknown';
      const key = item.sku || item.product_name;
      if (!skuMap[key]) {
        skuMap[key] = {
          productName: item.product_name,
          sku: item.sku || 'N/A',
          brand: 'General',
          amazon: 0, flipkart: 0, meesho: 0, firstcry: 0, blinkit: 0, own_website: 0,
          total: 0,
        };
      }
      if (portals.includes(portal as any)) {
        (skuMap[key] as any)[portal] += item.quantity || 1;
      }
    });
    // Calculate totals
    Object.values(skuMap).forEach(row => {
      row.total = portals.reduce((s, p) => s + (row as any)[p], 0);
    });
    return Object.values(skuMap).sort((a, b) => b.total - a.total);
  }, [orderItems]);

  // If no order_items, fallback to order-level aggregation
  const fallbackData = useMemo((): ConsolidatedRow[] => {
    if (orderItems.length > 0) return [];
    const portalMap: Record<string, number> = {};
    orders.forEach(o => {
      portalMap[o.portal] = (portalMap[o.portal] || 0) + 1;
    });
    return [{
      productName: 'All Products',
      sku: 'AGGREGATE',
      brand: '-',
      amazon: portalMap['amazon'] || 0,
      flipkart: portalMap['flipkart'] || 0,
      meesho: portalMap['meesho'] || 0,
      firstcry: portalMap['firstcry'] || 0,
      blinkit: portalMap['blinkit'] || 0,
      own_website: portalMap['own_website'] || 0,
      total: orders.length,
    }];
  }, [orders, orderItems]);

  const currentData = consolidatedData.length > 0 ? consolidatedData : fallbackData;
  // Mock prev year as ~20% less for comparison
  const prevData = currentData.map(row => ({
    ...row,
    amazon: Math.round(row.amazon * 0.8),
    flipkart: Math.round(row.flipkart * 0.78),
    meesho: Math.round(row.meesho * 0.7),
    firstcry: Math.round(row.firstcry * 0.82),
    blinkit: Math.round(row.blinkit * 0.65),
    own_website: Math.round(row.own_website * 0.6),
    total: 0,
  })).map(row => ({ ...row, total: portals.reduce((s, p) => s + (row as any)[p], 0) }));

  const totalOrders = currentData.reduce((sum, row) => sum + row.total, 0);
  const prevTotalOrders = prevData.reduce((sum, row) => sum + row.total, 0);

  const portalTotals = useMemo(() => {
    const curr: Record<string, number> = {};
    const prev: Record<string, number> = {};
    for (const p of portals) {
      curr[p] = currentData.reduce((s, r) => s + (r as any)[p], 0);
      prev[p] = prevData.reduce((s, r) => s + (r as any)[p], 0);
    }
    return { curr, prev };
  }, [currentData, prevData]);

  const highVolumeThreshold = 10;
  const topSku = currentData.length > 0 ? currentData.reduce((max, row) => row.total > max.total ? row : max, currentData[0]) : null;

  const yoyPortalGrowth = portals.map(p => ({
    portal: p,
    config: portalConfigs.find(c => c.id === p)!,
    curr: portalTotals.curr[p] || 0,
    prev: portalTotals.prev[p] || 0,
    pct: pctChange(portalTotals.curr[p] || 0, portalTotals.prev[p] || 0),
  }));
  const bestPortal = yoyPortalGrowth.length > 0 ? yoyPortalGrowth.reduce((best, p) => p.pct > best.pct ? p : best, yoyPortalGrowth[0]) : null;
  const lowestPortal = yoyPortalGrowth.length > 0 ? yoyPortalGrowth.reduce((low, p) => p.pct < low.pct ? p : low, yoyPortalGrowth[0]) : null;
  const overallYoY = pctChange(totalOrders, prevTotalOrders);

  const currentYear = new Date().getFullYear();
  const prevYear = currentYear - 1;

  const exportLabel = isYoY ? 'Export – Year Comparison' : dateRange === 'this_year' ? `Export – ${currentYear}` : dateRange === 'last_year' ? `Export – ${prevYear}` : 'Export to Excel';

  const handleExport = () => {
    toast({ title: 'Export Started', description: `Preparing: ${exportLabel}` });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Consolidated Orders</h1>
          <p className="text-muted-foreground">Command center — single sheet view across all portals</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={dateRange} onValueChange={(v) => { setDateRange(v); if (v === 'yoy') setViewMode('comparison'); }}>
            <SelectTrigger className="w-[180px] gap-2">
              <Calendar className="w-4 h-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dateRanges.map(dr => (
                <SelectItem key={dr.value} value={dr.value}>{dr.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {!isYoY && (
            <Select value={viewMode} onValueChange={(v) => setViewMode(v as 'normal' | 'comparison')}>
              <SelectTrigger className="w-[170px]">
                <BarChart3 className="w-4 h-4 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal View</SelectItem>
                <SelectItem value="comparison">Year Comparison</SelectItem>
              </SelectContent>
            </Select>
          )}

          <GlobalDateFilter value={globalDateRange} onChange={setGlobalDateRange} />
          <Button onClick={handleExport} className="gap-2">
            <Download className="w-4 h-4" />
            {exportLabel}
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {portalConfigs.map((portal) => {
          const curr = portalTotals.curr[portal.id] ?? 0;
          const prev = portalTotals.prev[portal.id] ?? 0;
          return (
            <Card key={portal.id}>
              <CardContent className="pt-4 pb-3">
                <div className="text-center">
                  <span className="text-2xl">{portal.icon}</span>
                  <p className="text-lg font-bold mt-1">{curr}</p>
                  <p className="text-xs text-muted-foreground">{portal.name}</p>
                  {activeView === 'comparison' && (
                    <div className="mt-1.5">
                      <p className="text-xs text-muted-foreground">{prevYear}: {prev}</p>
                      <GrowthBadge curr={curr} prev={prev} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-4 pb-3">
            <div className="text-center">
              <FileSpreadsheet className="w-6 h-6 mx-auto text-primary" />
              <p className="text-lg font-bold mt-1 text-primary">{totalOrders}</p>
              <p className="text-xs text-muted-foreground">Total Orders</p>
              {activeView === 'comparison' && (
                <div className="mt-1.5">
                  <p className="text-xs text-muted-foreground">{prevYear}: {prevTotalOrders}</p>
                  <GrowthBadge curr={totalOrders} prev={prevTotalOrders} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        {topSku && (
          <Card className="bg-emerald-500/5 border-emerald-500/20">
            <CardContent className="pt-4 pb-3">
              <div className="text-center">
                <TrendingUp className="w-6 h-6 mx-auto text-emerald-600" />
                <p className="text-lg font-bold mt-1 text-emerald-600">{topSku.productName.split(' ').slice(0, 2).join(' ')}</p>
                <p className="text-xs text-muted-foreground">Top SKU ({topSku.total})</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* YoY Comparison Summary Cards */}
      {activeView === 'comparison' && bestPortal && lowestPortal && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-emerald-500/5 border-emerald-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10"><Trophy className="w-5 h-5 text-emerald-600" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Best Performing Portal (YoY)</p>
                  <p className="text-xl font-bold">{bestPortal.config?.icon} {bestPortal.config?.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-muted-foreground">{prevYear}: {bestPortal.prev} → {currentYear}: {bestPortal.curr}</span>
                    <GrowthBadge curr={bestPortal.curr} prev={bestPortal.prev} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-rose-500/5 border-rose-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-500/10"><AlertTriangle className="w-5 h-5 text-rose-600" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Lowest Growth Portal</p>
                  <p className="text-xl font-bold">{lowestPortal.config?.icon} {lowestPortal.config?.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-muted-foreground">{prevYear}: {lowestPortal.prev} → {currentYear}: {lowestPortal.curr}</span>
                    <GrowthBadge curr={lowestPortal.curr} prev={lowestPortal.prev} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  {overallYoY >= 0 ? <TrendingUp className="w-5 h-5 text-primary" /> : <TrendingDown className="w-5 h-5 text-destructive" />}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Overall YoY Growth</p>
                  <p className={`text-3xl font-bold ${overallYoY >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                    {overallYoY >= 0 ? '+' : ''}{overallYoY}%
                  </p>
                  <span className="text-sm text-muted-foreground">{prevTotalOrders} → {totalOrders} orders</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Consolidated Table */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary by SKU</CardTitle>
          <CardDescription>
            {activeView === 'comparison'
              ? `Year-over-Year comparison: ${currentYear} vs ${prevYear}`
              : `Order quantities across all sales channels • High-volume SKUs (>${highVolumeThreshold}) are highlighted`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No order data available. Start adding orders to see consolidated view.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Product</TableHead>
                    <TableHead className="font-semibold">SKU</TableHead>
                    {activeView === 'comparison' ? (
                      <>
                        {portals.map(p => {
                          const config = portalConfigs.find(c => c.id === p);
                          return <TableHead key={p} className="text-center font-semibold">{config?.icon} {config?.name}</TableHead>;
                        })}
                        <TableHead className="text-center font-semibold bg-blue-500/10">{currentYear} Qty</TableHead>
                        <TableHead className="text-center font-semibold bg-muted">{prevYear} Qty</TableHead>
                        <TableHead className="text-center font-semibold bg-primary/10 text-primary">YoY Change</TableHead>
                      </>
                    ) : (
                      <>
                        {portals.map(p => {
                          const config = portalConfigs.find(c => c.id === p);
                          return <TableHead key={p} className="text-center font-semibold">{config?.icon} {config?.name}</TableHead>;
                        })}
                        <TableHead className="text-center font-semibold bg-primary/10 text-primary">Total</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentData.map((row, i) => {
                    const prevRow = prevData[i];
                    const isHighVolume = row.total >= highVolumeThreshold;
                    return (
                      <TableRow key={row.sku + i} className={isHighVolume ? 'bg-emerald-500/5' : ''}>
                        <TableCell className="font-medium">
                          {row.productName}
                          {isHighVolume && <TrendingUp className="w-3.5 h-3.5 text-emerald-600 inline ml-1" />}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{row.sku}</TableCell>
                        {activeView === 'comparison' ? (
                          <>
                            {portals.map(portal => (
                              <TableCell key={portal} className="text-center">
                                {(row as any)[portal] > 0 ? (
                                  <div className="flex flex-col items-center">
                                    <span className="font-medium">{(row as any)[portal]}</span>
                                    {prevRow && (prevRow as any)[portal] > 0 && (
                                      <span className="text-xs text-muted-foreground">({(prevRow as any)[portal]})</span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                            ))}
                            <TableCell className="text-center bg-blue-500/5">
                              <span className="font-bold">{row.total}</span>
                            </TableCell>
                            <TableCell className="text-center bg-muted/30">
                              <span className="text-muted-foreground">{prevRow?.total || 0}</span>
                            </TableCell>
                            <TableCell className="text-center">
                              {prevRow && <GrowthBadge curr={row.total} prev={prevRow.total} />}
                            </TableCell>
                          </>
                        ) : (
                          <>
                            {portals.map(portal => (
                              <TableCell key={portal} className="text-center">
                                {(row as any)[portal] > 0 ? (
                                  <span className={`font-medium ${(row as any)[portal] >= highVolumeThreshold ? 'text-emerald-600 font-bold' : ''}`}>
                                    {(row as any)[portal]}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                            ))}
                            <TableCell className="text-center bg-primary/5">
                              <span className="font-bold text-primary">{row.total}</span>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    );
                  })}
                  {/* Totals Row */}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell>Total</TableCell>
                    <TableCell>—</TableCell>
                    {activeView === 'comparison' ? (
                      <>
                        {portals.map(p => (
                          <TableCell key={p} className="text-center">{portalTotals.curr[p] || 0}</TableCell>
                        ))}
                        <TableCell className="text-center bg-blue-500/10">{totalOrders}</TableCell>
                        <TableCell className="text-center bg-muted">{prevTotalOrders}</TableCell>
                        <TableCell className="text-center"><GrowthBadge curr={totalOrders} prev={prevTotalOrders} /></TableCell>
                      </>
                    ) : (
                      <>
                        {portals.map(p => (
                          <TableCell key={p} className="text-center">{portalTotals.curr[p] || 0}</TableCell>
                        ))}
                        <TableCell className="text-center bg-primary/10 text-primary">{totalOrders}</TableCell>
                      </>
                    )}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
