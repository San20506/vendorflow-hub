import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { mockOrders, mockInventory, mockReturns, mockSalesData, mockSettlements, portalConfigs } from '@/services/mockData';
import { BarChart3, ShoppingCart, Package, RotateCcw, TrendingUp, TrendingDown, AlertTriangle, IndianRupee } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, ComposedChart, Area } from 'recharts';

const COLORS = ['hsl(142, 71%, 45%)', 'hsl(217, 91%, 60%)', 'hsl(340, 82%, 52%)', 'hsl(199, 89%, 48%)', 'hsl(45, 100%, 51%)', 'hsl(262, 83%, 58%)'];

export default function Analytics() {
  const [dateRange, setDateRange] = useState('30');
  const [channelFilter, setChannelFilter] = useState('all');

  // Revenue tracking (daily)
  const trendData = useMemo(() => {
    const days = parseInt(dateRange);
    const filtered = mockSalesData.filter(d => {
      const daysDiff = Math.floor((Date.now() - new Date(d.date).getTime()) / 86400000);
      return daysDiff <= days && (channelFilter === 'all' || d.portal === channelFilter);
    });
    const grouped: Record<string, { date: string; revenue: number; orders: number; returns: number }> = {};
    filtered.forEach(d => {
      const key = new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!grouped[key]) grouped[key] = { date: key, revenue: 0, orders: 0, returns: 0 };
      grouped[key].revenue += d.revenue;
      grouped[key].orders += d.orders;
      grouped[key].returns += d.returns;
    });
    return Object.values(grouped).slice(-15);
  }, [dateRange, channelFilter]);

  // Settlement vs Expected
  const settlementComparison = useMemo(() =>
    mockSettlements.map(s => {
      const portal = portalConfigs.find(p => p.id === s.portal);
      return {
        name: portal?.name || s.portal,
        expected: s.amount,
        settled: s.netAmount,
        gap: s.amount - s.netAmount,
      };
    }), []);

  // Refund rate
  const totalOrders = mockOrders.length;
  const totalReturns = mockReturns.length;
  const refundRate = Math.round((totalReturns / totalOrders) * 100 * 10) / 10;

  // SKU performance
  const skuPerformance = useMemo(() => {
    const skuMap: Record<string, { name: string; orders: number; revenue: number }> = {};
    mockOrders.forEach(o => o.items.forEach(item => {
      if (!skuMap[item.skuId]) skuMap[item.skuId] = { name: item.productName, orders: 0, revenue: 0 };
      skuMap[item.skuId].orders += item.quantity;
      skuMap[item.skuId].revenue += item.price * item.quantity;
    }));
    return Object.entries(skuMap)
      .map(([sku, data]) => ({ sku, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }, []);

  // Channel-wise profitability
  const channelProfitability = useMemo(() =>
    portalConfigs.map(p => {
      const orders = mockOrders.filter(o => o.portal === p.id);
      const revenue = orders.reduce((s, o) => s + o.totalAmount, 0);
      const settlements = mockSettlements.filter(s => s.portal === p.id);
      const netSettled = settlements.reduce((s, st) => s + st.netAmount, 0);
      const commissions = settlements.reduce((s, st) => s + st.commission + st.fees, 0);
      const margin = revenue > 0 ? Math.round(((revenue - commissions) / revenue) * 100) : 0;
      return { name: p.name, icon: p.icon, revenue, netSettled, commissions, margin, orders: orders.length };
    }).filter(c => c.orders > 0), []);

  // Seller loss detection
  const sellerLoss = useMemo(() => {
    const losses: { product: string; portal: string; loss: number; reason: string }[] = [];
    mockReturns.forEach(r => {
      const portal = portalConfigs.find(p => p.id === r.portal);
      losses.push({ product: r.items[0]?.productName || 'Unknown', portal: portal?.name || r.portal, loss: r.refundAmount, reason: r.reason.replace(/_/g, ' ') });
    });
    mockSettlements.filter(s => s.status === 'delayed').forEach(s => {
      const portal = portalConfigs.find(p => p.id === s.portal);
      losses.push({ product: 'Settlement Gap', portal: portal?.name || s.portal, loss: s.amount - s.netAmount, reason: 'Delayed settlement' });
    });
    return losses;
  }, []);

  const totalRevenue = mockOrders.reduce((s, o) => s + o.totalAmount, 0);
  const avgOrderValue = Math.round(totalRevenue / totalOrders);
  const totalSettled = mockSettlements.reduce((s, st) => s + st.netAmount, 0);

  // Inventory status for pie chart
  const inventoryByStatus = useMemo(() => {
    const healthy = mockInventory.filter(i => i.availableQuantity > i.lowStockThreshold).length;
    const low = mockInventory.filter(i => i.availableQuantity <= i.lowStockThreshold && i.availableQuantity > 0).length;
    const out = mockInventory.filter(i => i.availableQuantity === 0).length;
    return [
      { name: 'Healthy', value: healthy, color: 'hsl(142, 71%, 45%)' },
      { name: 'Low Stock', value: low, color: 'hsl(45, 100%, 51%)' },
      { name: 'Out of Stock', value: out, color: 'hsl(0, 84%, 60%)' },
    ];
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Operational Analytics</h1>
          <p className="text-muted-foreground">Business performance overview across all channels</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Channels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              {portalConfigs.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.icon} {p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><TrendingUp className="w-5 h-5 text-primary" /></div><div><p className="text-xl font-bold">₹{(totalRevenue / 1000).toFixed(0)}K</p><p className="text-xs text-muted-foreground">Total Revenue</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-500/10"><ShoppingCart className="w-5 h-5 text-blue-600" /></div><div><p className="text-xl font-bold">{totalOrders}</p><p className="text-xs text-muted-foreground">Total Orders</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-emerald-500/10"><IndianRupee className="w-5 h-5 text-emerald-600" /></div><div><p className="text-xl font-bold">₹{avgOrderValue.toLocaleString()}</p><p className="text-xs text-muted-foreground">Avg Order Value</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-amber-500/10"><IndianRupee className="w-5 h-5 text-amber-600" /></div><div><p className="text-xl font-bold">₹{(totalSettled / 1000).toFixed(0)}K</p><p className="text-xs text-muted-foreground">Net Settled</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-rose-500/10"><RotateCcw className="w-5 h-5 text-rose-600" /></div><div><p className="text-xl font-bold">{refundRate}%</p><p className="text-xs text-muted-foreground">Refund Rate</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-rose-500/10"><AlertTriangle className="w-5 h-5 text-rose-600" /></div><div><p className="text-xl font-bold">{sellerLoss.length}</p><p className="text-xs text-muted-foreground">Loss Indicators</p></div></div></CardContent></Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Revenue & Orders Trend</CardTitle><CardDescription>Daily revenue and order count</CardDescription></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis yAxisId="left" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip formatter={(v: number, name: string) => [name === 'revenue' ? `₹${v.toLocaleString()}` : v, name === 'revenue' ? 'Revenue' : 'Orders']} />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="revenue" fill="hsl(var(--primary) / 0.1)" stroke="hsl(var(--primary))" strokeWidth={2} />
                <Bar yAxisId="right" dataKey="orders" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} barSize={20} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Settlement vs Expected</CardTitle><CardDescription>Compare expected vs settled amounts per portal</CardDescription></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={settlementComparison}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="expected" fill="hsl(217, 91%, 60%)" name="Expected" radius={[4, 4, 0, 0]} />
                <Bar dataKey="settled" fill="hsl(142, 71%, 45%)" name="Settled" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle>SKU Performance</CardTitle><CardDescription>Top performing SKUs by revenue</CardDescription></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={skuPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} width={120} className="text-xs" />
                <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Inventory Health</CardTitle><CardDescription>Current stock status distribution</CardDescription></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={inventoryByStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {inventoryByStatus.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Channel Profitability</CardTitle><CardDescription>Margin analysis per sales channel</CardDescription></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {channelProfitability.map((ch, i) => (
                <div key={i} className="p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium">{ch.icon} {ch.name}</span>
                    <Badge variant="outline" className={ch.margin >= 80 ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' : ch.margin >= 60 ? 'bg-blue-500/15 text-blue-600 border-blue-500/30' : 'bg-amber-500/15 text-amber-600 border-amber-500/30'}>
                      {ch.margin}% margin
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Revenue: ₹{(ch.revenue / 1000).toFixed(0)}K</span>
                    <span>Settled: ₹{(ch.netSettled / 1000).toFixed(0)}K</span>
                    <span>{ch.orders} orders</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${ch.margin}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seller Loss Detection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-rose-600" />Seller Loss Detection</CardTitle>
              <CardDescription>Identified revenue losses from returns, settlement gaps, and penalties</CardDescription>
            </div>
            <Badge variant="outline" className="bg-rose-500/15 text-rose-600 border-rose-500/30">{sellerLoss.length} alerts</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sellerLoss.map((loss, i) => (
              <div key={i} className="p-3 border rounded-lg bg-rose-500/5 border-rose-500/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{loss.product}</span>
                  <span className="text-sm font-bold text-rose-600">-₹{loss.loss.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{loss.portal}</span>
                  <span>•</span>
                  <span className="capitalize">{loss.reason}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
