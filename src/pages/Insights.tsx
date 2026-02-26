import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  TrendingUp, TrendingDown, IndianRupee, Users, ShoppingCart, Package,
  BarChart3, HeadphonesIcon, Clock, AlertTriangle, Activity, Zap,
  ArrowUpRight, ArrowDownRight, ShieldAlert, CheckCircle2, Filter,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList,
} from 'recharts';

const fmt = (n: number) => '₹' + n.toLocaleString('en-IN');

// Channel options
const channels = [
  { id: 'all', name: 'All Channels' },
  { id: 'amazon', name: 'Amazon' },
  { id: 'flipkart', name: 'Flipkart' },
  { id: 'meesho', name: 'Meesho' },
  { id: 'website', name: 'Website' },
  { id: 'blinkit', name: 'Blinkit' },
];

// Sort options
const sortOptions = [
  { id: 'date', name: 'Date' },
  { id: 'revenue', name: 'Revenue' },
  { id: 'units', name: 'Units' },
];

// ---- Mock data ----
const dailySales = Array.from({ length: 14 }, (_, i) => ({
  day: `Feb ${i + 12}`,
  revenue: Math.round(18000 + Math.random() * 22000),
  orders: Math.round(25 + Math.random() * 40),
  cost: Math.round(8000 + Math.random() * 10000),
}));

const channelRevenue = [
  { name: 'Amazon', value: 185000, color: 'hsl(var(--chart-1))' },
  { name: 'Flipkart', value: 142000, color: 'hsl(var(--chart-2))' },
  { name: 'Meesho', value: 78000, color: 'hsl(var(--chart-3))' },
  { name: 'Website', value: 55000, color: 'hsl(var(--chart-4))' },
  { name: 'Blinkit', value: 25000, color: 'hsl(var(--chart-5))' },
];

const topProducts = [
  { name: 'Premium T-Shirt', revenue: 128500, orders: 245, growth: 12.5 },
  { name: 'Cotton Kurta Set', revenue: 98200, orders: 187, growth: 8.3 },
  { name: 'Denim Jeans', revenue: 76400, orders: 153, growth: -2.1 },
  { name: 'Silk Saree', revenue: 65800, orders: 89, growth: 15.7 },
  { name: 'Sports Shoes', revenue: 54300, orders: 112, growth: 5.4 },
];

const ticketData = [
  { category: 'Delivery Delay', count: 23, trend: -8 },
  { category: 'Wrong Product', count: 15, trend: 3 },
  { category: 'Refund Request', count: 12, trend: -5 },
  { category: 'Quality Issue', count: 9, trend: 2 },
  { category: 'Payment Failed', count: 7, trend: -12 },
];

const profitTrend = Array.from({ length: 6 }, (_, i) => {
  const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
  const rev = 350000 + i * 25000 + Math.round(Math.random() * 30000);
  const cost = 180000 + i * 10000 + Math.round(Math.random() * 15000);
  return { month: months[i], revenue: rev, cost, profit: rev - cost, margin: +((rev - cost) / rev * 100).toFixed(1) };
});

const opsData = {
  automationRate: 78,
  workflowLoad: 62,
  processingVolume: dailySales.reduce((s, d) => s + d.orders, 0),
  bottlenecks: [
    { area: 'Shipping Label Generation', load: 89, status: 'critical' as const },
    { area: 'Invoice Processing', load: 72, status: 'warning' as const },
    { area: 'Inventory Sync', load: 45, status: 'ok' as const },
    { area: 'Return Processing', load: 68, status: 'warning' as const },
  ],
};

// ---- Filter bar component ----
function InsightsFilterBar({ channel, onChannelChange, sortBy, onSortChange }: {
  channel: string; onChannelChange: (v: string) => void;
  sortBy: string; onSortChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Filter className="w-3.5 h-3.5" />
        <span>Filters:</span>
      </div>
      <Select value={channel} onValueChange={onChannelChange}>
        <SelectTrigger className="w-[160px] h-8 text-xs">
          <SelectValue placeholder="Channel" />
        </SelectTrigger>
        <SelectContent>
          {channels.map(c => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="w-[130px] h-8 text-xs">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map(s => (
            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ---- Stat card component ----
function StatCard({ icon: Icon, label, value, change, variant = 'default' }: {
  icon: React.ElementType; label: string; value: string; change?: number; variant?: 'default' | 'success' | 'warning' | 'danger';
}) {
  const colors: Record<string, string> = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-emerald-500/10 text-emerald-600',
    warning: 'bg-amber-500/10 text-amber-600',
    danger: 'bg-rose-500/10 text-rose-600',
  };
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center justify-between mb-2">
          <div className={`p-2 rounded-lg ${colors[variant]}`}><Icon className="w-4 h-4" /></div>
          {change !== undefined && (
            <Badge variant="secondary" className={`text-xs gap-0.5 ${change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(change)}%
            </Badge>
          )}
        </div>
        <p className="text-xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

// ---- Executive Dashboard ----
function ExecutiveDashboard() {
  const [channel, setChannel] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  const filteredChannelRevenue = useMemo(() => {
    let data = channel === 'all' ? channelRevenue : channelRevenue.filter(c => c.name.toLowerCase() === channel);
    if (sortBy === 'revenue') data = [...data].sort((a, b) => b.value - a.value);
    return data;
  }, [channel, sortBy]);

  const totalRevenue = filteredChannelRevenue.reduce((s, c) => s + c.value, 0);
  const topChannel = channelRevenue.reduce((a, b) => a.value > b.value ? a : b);

  return (
    <div className="space-y-6">
      <InsightsFilterBar channel={channel} onChannelChange={setChannel} sortBy={sortBy} onSortChange={setSortBy} />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={IndianRupee} label="Total Revenue" value={fmt(totalRevenue)} change={14.2} variant="success" />
        <StatCard icon={TrendingUp} label="Growth %" value="14.2%" change={3.1} variant="success" />
        <StatCard icon={Users} label="Active Vendors" value="24" change={8} />
        <StatCard icon={IndianRupee} label="Net Profit" value={fmt(totalRevenue * 0.32)} change={5.8} variant="success" />
        <StatCard icon={BarChart3} label="Top Channel" value={topChannel.name} />
        <StatCard icon={ShieldAlert} label="High Risk Flags" value="3" variant="danger" />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Revenue Trend</CardTitle>
            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-0.5">
              <CheckCircle2 className="w-2.5 h-2.5" /> Updated
            </Badge>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={dailySales}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/.15)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Channel Revenue Share</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={filteredChannelRevenue} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {filteredChannelRevenue.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ---- Sales Dashboard ----
function SalesDashboard() {
  const [channel, setChannel] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  const sortedProducts = useMemo(() => {
    let data = [...topProducts];
    if (sortBy === 'revenue') data.sort((a, b) => b.revenue - a.revenue);
    else if (sortBy === 'units') data.sort((a, b) => b.orders - a.orders);
    return data;
  }, [sortBy]);

  const totalOrders = dailySales.reduce((s, d) => s + d.orders, 0);
  const totalRev = dailySales.reduce((s, d) => s + d.revenue, 0);

  return (
    <div className="space-y-6">
      <InsightsFilterBar channel={channel} onChannelChange={setChannel} sortBy={sortBy} onSortChange={setSortBy} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={IndianRupee} label="Period Revenue" value={fmt(totalRev)} change={11.4} variant="success" />
        <StatCard icon={ShoppingCart} label="Total Orders" value={totalOrders.toString()} change={7.2} />
        <StatCard icon={TrendingUp} label="Conversion Rate" value="3.8%" change={0.4} variant="success" />
        <StatCard icon={Package} label="Avg Order Value" value={fmt(Math.round(totalRev / totalOrders))} change={2.1} />
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Daily Sales</CardTitle>
          <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-0.5">
            <CheckCircle2 className="w-2.5 h-2.5" /> Updated
          </Badge>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dailySales}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend />
              <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="revenue" position="top" className="fill-muted-foreground" fontSize={9} formatter={(v: number) => `₹${(v / 1000).toFixed(0)}K`} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Top Products</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {sortedProducts.map(p => (
              <div key={p.name} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="font-medium text-sm">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.orders} orders</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold text-sm">{fmt(p.revenue)}</p>
                  <Badge variant="secondary" className={`text-xs ${p.growth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {p.growth >= 0 ? '+' : ''}{p.growth}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---- Support Dashboard ----
function SupportDashboard() {
  const [channel, setChannel] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const totalTickets = ticketData.reduce((s, t) => s + t.count, 0);

  return (
    <div className="space-y-6">
      <InsightsFilterBar channel={channel} onChannelChange={setChannel} sortBy={sortBy} onSortChange={setSortBy} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={HeadphonesIcon} label="Open Tickets" value={totalTickets.toString()} change={-6} variant="warning" />
        <StatCard icon={Clock} label="Avg Response Time" value="2.4 hrs" change={-12} variant="success" />
        <StatCard icon={CheckCircle2} label="Resolution Rate" value="87%" change={3} variant="success" />
        <StatCard icon={Users} label="Customer Retention" value="92%" change={1.5} variant="success" />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Issue Categories</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ticketData.map(t => (
              <div key={t.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{t.category}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{t.count} tickets</span>
                    <Badge variant="secondary" className={`text-xs ${t.trend <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {t.trend <= 0 ? '↓' : '↑'} {Math.abs(t.trend)}%
                    </Badge>
                  </div>
                </div>
                <Progress value={(t.count / totalTickets) * 100} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---- Financial Dashboard ----
function FinancialDashboard() {
  const [channel, setChannel] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const latest = profitTrend[profitTrend.length - 1];
  const marginWarning = latest.margin < 25;

  return (
    <div className="space-y-6">
      <InsightsFilterBar channel={channel} onChannelChange={setChannel} sortBy={sortBy} onSortChange={setSortBy} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={IndianRupee} label="Revenue (Latest)" value={fmt(latest.revenue)} change={8.3} variant="success" />
        <StatCard icon={TrendingDown} label="Total Cost" value={fmt(latest.cost)} change={4.1} variant="warning" />
        <StatCard icon={TrendingUp} label="Net Profit" value={fmt(latest.profit)} change={12.6} variant="success" />
        <StatCard icon={AlertTriangle} label="Profit Margin" value={`${latest.margin}%`} variant={marginWarning ? 'danger' : 'success'} />
      </div>
      {marginWarning && (
        <Card className="border-rose-500/30 bg-rose-500/5">
          <CardContent className="pt-4 pb-3 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <p className="font-semibold text-rose-600 text-sm">Margin Alert</p>
              <p className="text-xs text-muted-foreground">Profit margin is below 25% threshold. Review cost structure.</p>
            </div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Revenue vs Cost Trend</CardTitle>
          <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-0.5">
            <CheckCircle2 className="w-2.5 h-2.5" /> Updated
          </Badge>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={profitTrend}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend />
              <Line type="monotone" dataKey="revenue" name="Revenue" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="cost" name="Cost" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="profit" name="Profit" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Profit Margin Trend</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={profitTrend}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 50]} className="fill-muted-foreground" />
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Area type="monotone" dataKey="margin" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2)/.15)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// ---- Operations Dashboard ----
function OperationsDashboard() {
  const [channel, setChannel] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  return (
    <div className="space-y-6">
      <InsightsFilterBar channel={channel} onChannelChange={setChannel} sortBy={sortBy} onSortChange={setSortBy} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Zap} label="Automation Rate" value={`${opsData.automationRate}%`} change={5} variant="success" />
        <StatCard icon={Activity} label="Workflow Load" value={`${opsData.workflowLoad}%`} variant={opsData.workflowLoad > 80 ? 'danger' : 'default'} />
        <StatCard icon={ShoppingCart} label="Orders Processed" value={opsData.processingVolume.toString()} change={9.3} />
        <StatCard icon={AlertTriangle} label="Active Bottlenecks" value={opsData.bottlenecks.filter(b => b.status !== 'ok').length.toString()} variant="warning" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workflow Bottleneck Monitor</CardTitle>
          <CardDescription>System load across processing areas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            {opsData.bottlenecks.map(b => (
              <div key={b.area} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{b.area}</span>
                    <Badge variant="outline" className={
                      b.status === 'critical' ? 'bg-rose-500/10 text-rose-600 border-rose-500/30' :
                      b.status === 'warning' ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' :
                      'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                    }>
                      {b.status === 'critical' ? 'Critical' : b.status === 'warning' ? 'Warning' : 'Normal'}
                    </Badge>
                  </div>
                  <span className="text-muted-foreground font-semibold">{b.load}%</span>
                </div>
                <Progress value={b.load} className={`h-2.5 ${b.status === 'critical' ? '[&>div]:bg-rose-500' : b.status === 'warning' ? '[&>div]:bg-amber-500' : ''}`} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Order Processing Volume</CardTitle>
          <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-0.5">
            <CheckCircle2 className="w-2.5 h-2.5" /> Updated
          </Badge>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dailySales}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <Tooltip />
              <Bar dataKey="orders" name="Orders" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="orders" position="top" className="fill-muted-foreground" fontSize={9} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// ---- Main Page ----
export default function Insights() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Insights</h1>
          <p className="text-muted-foreground">Business intelligence dashboards</p>
        </div>
        <Badge variant="outline" className="text-xs font-mono">v1.2</Badge>
      </div>
      <Tabs defaultValue="executive" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1 bg-muted/60 p-1">
          <TabsTrigger value="executive" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"><BarChart3 className="w-3.5 h-3.5" />Executive</TabsTrigger>
          <TabsTrigger value="sales" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"><ShoppingCart className="w-3.5 h-3.5" />Sales</TabsTrigger>
          <TabsTrigger value="support" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"><HeadphonesIcon className="w-3.5 h-3.5" />Support</TabsTrigger>
          <TabsTrigger value="financial" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"><IndianRupee className="w-3.5 h-3.5" />Financial</TabsTrigger>
          <TabsTrigger value="operations" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"><Activity className="w-3.5 h-3.5" />Operations</TabsTrigger>
        </TabsList>
        <TabsContent value="executive"><ExecutiveDashboard /></TabsContent>
        <TabsContent value="sales"><SalesDashboard /></TabsContent>
        <TabsContent value="support"><SupportDashboard /></TabsContent>
        <TabsContent value="financial"><FinancialDashboard /></TabsContent>
        <TabsContent value="operations"><OperationsDashboard /></TabsContent>
      </Tabs>
    </div>
  );
}
