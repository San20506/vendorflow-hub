import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockConsolidatedOrders, portalConfigs } from '@/services/mockData';
import { Download, FileSpreadsheet, TrendingUp, TrendingDown, Calendar, ArrowUpRight, ArrowDownRight, Trophy, AlertTriangle, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const portals = ['amazon', 'flipkart', 'meesho', 'firstcry', 'blinkit', 'own_website'] as const;

const dateRanges = [
  { value: 'today', label: 'Today' },
  { value: '7days', label: 'Last 7 Days' },
  { value: '30days', label: 'Last 30 Days' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'this_year', label: 'This Year' },
  { value: 'last_year', label: 'Last Year' },
  { value: 'custom_year', label: 'Custom Year' },
  { value: 'yoy', label: 'Year vs Year' },
];

// Mock previous year data (~15-25% lower than current)
const mockPrevYearOrders = mockConsolidatedOrders.map(row => ({
  ...row,
  amazon: Math.round(row.amazon * (0.72 + Math.random() * 0.18)),
  flipkart: Math.round(row.flipkart * (0.68 + Math.random() * 0.22)),
  meesho: Math.round(row.meesho * (0.60 + Math.random() * 0.25)),
  firstcry: Math.round(row.firstcry * (0.75 + Math.random() * 0.15)),
  blinkit: Math.round(row.blinkit * (0.55 + Math.random() * 0.20)),
  own_website: Math.round(row.own_website * (0.50 + Math.random() * 0.30)),
  total: 0,
})).map(row => ({ ...row, total: portals.reduce((s, p) => s + row[p], 0) }));

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

export default function ConsolidatedOrders() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState('7days');
  const [customYear, setCustomYear] = useState('2025');
  const [viewMode, setViewMode] = useState<'normal' | 'comparison'>('normal');

  const isYoY = dateRange === 'yoy';
  const activeView = isYoY ? 'comparison' : viewMode;

  // Current year data
  const currentData = mockConsolidatedOrders;
  const prevData = mockPrevYearOrders;

  const totalOrders = currentData.reduce((sum, row) => sum + row.total, 0);
  const prevTotalOrders = prevData.reduce((sum, row) => sum + row.total, 0);

  const portalTotals = useMemo(() => {
    const curr: Record<string, number> = {};
    const prev: Record<string, number> = {};
    for (const p of portals) {
      curr[p] = currentData.reduce((s, r) => s + r[p], 0);
      prev[p] = prevData.reduce((s, r) => s + r[p], 0);
    }
    return { curr, prev };
  }, []);

  const highVolumeThreshold = 80;
  const topSku = currentData.reduce((max, row) => row.total > max.total ? row : max, currentData[0]);

  // YoY summary
  const yoyPortalGrowth = portals.map(p => ({
    portal: p,
    config: portalConfigs.find(c => c.id === p)!,
    curr: portalTotals.curr[p],
    prev: portalTotals.prev[p],
    pct: pctChange(portalTotals.curr[p], portalTotals.prev[p]),
  }));
  const bestPortal = yoyPortalGrowth.reduce((best, p) => p.pct > best.pct ? p : best, yoyPortalGrowth[0]);
  const lowestPortal = yoyPortalGrowth.reduce((low, p) => p.pct < low.pct ? p : low, yoyPortalGrowth[0]);
  const overallYoY = pctChange(totalOrders, prevTotalOrders);

  const currentYear = 2026;
  const prevYear = 2025;

  const exportLabel = isYoY ? 'Export – Year Comparison' : dateRange === 'this_year' ? `Export – ${currentYear}` : dateRange === 'last_year' ? `Export – ${prevYear}` : dateRange === 'custom_year' ? `Export – ${customYear}` : 'Export to Excel';

  const handleExport = () => {
    toast({ title: 'Export Started', description: `Preparing: ${exportLabel}` });
  };

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

          {dateRange === 'custom_year' && (
            <Select value={customYear} onValueChange={setCustomYear}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2026, 2025, 2024, 2023, 2022].map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

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
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardContent className="pt-4 pb-3">
            <div className="text-center">
              <TrendingUp className="w-6 h-6 mx-auto text-emerald-600" />
              <p className="text-lg font-bold mt-1 text-emerald-600">{topSku.skuName.split(' ').slice(0, 2).join(' ')}</p>
              <p className="text-xs text-muted-foreground">Top SKU ({topSku.total})</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* YoY Comparison Summary Cards */}
      {activeView === 'comparison' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-emerald-500/5 border-emerald-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <Trophy className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Best Performing Portal (YoY)</p>
                  <p className="text-xl font-bold">{bestPortal.config.icon} {bestPortal.config.name}</p>
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
                <div className="p-2 rounded-lg bg-rose-500/10">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lowest Growth Portal</p>
                  <p className="text-xl font-bold">{lowestPortal.config.icon} {lowestPortal.config.name}</p>
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Product</TableHead>
                  <TableHead className="font-semibold">Brand</TableHead>
                  <TableHead className="font-semibold">Barcode</TableHead>
                  <TableHead className="font-semibold">SKU ID</TableHead>
                  <TableHead className="font-semibold">Master SKU</TableHead>
                  {activeView === 'comparison' ? (
                    <>
                      <TableHead className="text-center font-semibold">🛒 Amazon</TableHead>
                      <TableHead className="text-center font-semibold">🛍️ Flipkart</TableHead>
                      <TableHead className="text-center font-semibold">📦 Meesho</TableHead>
                      <TableHead className="text-center font-semibold">👶 FirstCry</TableHead>
                      <TableHead className="text-center font-semibold">⚡ Blinkit</TableHead>
                      <TableHead className="text-center font-semibold">🌐 Own Web</TableHead>
                      <TableHead className="text-center font-semibold bg-blue-500/10">{currentYear} Qty</TableHead>
                      <TableHead className="text-center font-semibold bg-muted">{prevYear} Qty</TableHead>
                      <TableHead className="text-center font-semibold bg-primary/10 text-primary">YoY Change</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead className="text-center font-semibold">🛒 Amazon</TableHead>
                      <TableHead className="text-center font-semibold">🛍️ Flipkart</TableHead>
                      <TableHead className="text-center font-semibold">📦 Meesho</TableHead>
                      <TableHead className="text-center font-semibold">👶 FirstCry</TableHead>
                      <TableHead className="text-center font-semibold">⚡ Blinkit</TableHead>
                      <TableHead className="text-center font-semibold">🌐 Own Website</TableHead>
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
                    <TableRow key={row.skuId} className={isHighVolume ? 'bg-emerald-500/5' : ''}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <img
                            src={`https://images.unsplash.com/photo-${['1590658268037-6bf12165a8df','1579586337278-3befd40fd17a','1521572163474-6864f9cf17ab','1602143407151-7111542de6e8','1515488042361-ee00e0ddd4e4','1608043152269-423dbba4e7e1','1601925260368-ae2f83cf8b7f','1507473885765-e6ed057f782c'][parseInt(row.skuId.replace('MSK-00','')) - 1] || '1590658268037-6bf12165a8df'}?w=80`}
                            alt={row.skuName}
                            className="w-8 h-8 rounded object-cover shrink-0"
                          />
                          <div>
                            {row.skuName}
                            {isHighVolume && (
                              <TrendingUp className="w-3.5 h-3.5 text-emerald-600 inline ml-1" />
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{row.brand}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs tracking-widest text-muted-foreground">||||| || ||||</span>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{row.skuId}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{row.skuId.replace('MSK', 'MSK')}</TableCell>
                      {activeView === 'comparison' ? (
                        <>
                          {portals.map(portal => (
                            <TableCell key={portal} className="text-center">
                              {row[portal] > 0 ? (
                                <div className="flex flex-col items-center">
                                  <span className="font-medium">{row[portal]}</span>
                                  {prevRow[portal] > 0 && (
                                    <span className="text-xs text-muted-foreground">({prevRow[portal]})</span>
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
                            <span className="font-medium text-muted-foreground">{prevRow.total}</span>
                          </TableCell>
                          <TableCell className="text-center bg-primary/5">
                            <GrowthBadge curr={row.total} prev={prevRow.total} />
                          </TableCell>
                        </>
                      ) : (
                        <>
                          {portals.map(portal => (
                            <TableCell key={portal} className="text-center">
                              {row[portal] > 0 ? (
                                <span className={`font-medium ${row[portal] >= 50 ? 'text-emerald-600' : ''}`}>
                                  {row[portal]}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          ))}
                          <TableCell className="text-center bg-primary/5">
                            <span className={`font-bold ${isHighVolume ? 'text-emerald-600' : 'text-primary'}`}>
                              {row.total}
                            </span>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  );
                })}
                {/* Totals Row */}
                <TableRow className="bg-muted/50 font-bold border-t-2">
                  <TableCell colSpan={5}>Total Orders</TableCell>
                  {activeView === 'comparison' ? (
                    <>
                      {portals.map(p => (
                        <TableCell key={p} className="text-center">
                          <div className="flex flex-col items-center">
                            <span>{portalTotals.curr[p]}</span>
                            <span className="text-xs text-muted-foreground font-normal">({portalTotals.prev[p]})</span>
                          </div>
                        </TableCell>
                      ))}
                      <TableCell className="text-center bg-blue-500/10">{totalOrders}</TableCell>
                      <TableCell className="text-center bg-muted/50">{prevTotalOrders}</TableCell>
                      <TableCell className="text-center bg-primary/10">
                        <GrowthBadge curr={totalOrders} prev={prevTotalOrders} />
                      </TableCell>
                    </>
                  ) : (
                    <>
                      {portals.map(p => (
                        <TableCell key={p} className="text-center">{portalTotals.curr[p]}</TableCell>
                      ))}
                      <TableCell className="text-center bg-primary/10 text-primary">{totalOrders}</TableCell>
                    </>
                  )}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
