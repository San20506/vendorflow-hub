import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { customersDb } from '@/services/database';
import {
  Users, Search, Download, Eye, AlertTriangle, ShieldAlert, UserCheck, UserPlus,
  MapPin, Package, RotateCcw, TrendingUp, Loader2, Globe, BarChart3, Map
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const FRAUD_THRESHOLD = 30;
const fmt = (n: number) => '₹' + n.toLocaleString('en-IN');

const CHART_COLORS = [
  'hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))',
  'hsl(var(--chart-4))', 'hsl(var(--chart-5))', '#6366f1', '#f59e0b', '#14b8a6',
];

export default function CustomerManagement() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [selected, setSelected] = useState<any | null>(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await customersDb.getAll(search ? { search } : undefined);
      setCustomers(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCustomers(); }, [search]);

  const enriched = useMemo(() => customers.map(c => {
    const returnRate = c.total_orders > 0 ? (c.total_returns / c.total_orders) * 100 : 0;
    return {
      ...c,
      returnRate,
      isRepeat: c.total_orders > 1,
      isFraudRisk: returnRate >= FRAUD_THRESHOLD,
      customerType: c.total_orders > 5 ? 'loyal' : c.total_orders > 1 ? 'repeat' : 'new',
    };
  }), [customers]);

  const filtered = useMemo(() => enriched.filter(c => {
    const matchType = typeFilter === 'all'
      || (typeFilter === 'repeat' ? c.isRepeat : false)
      || (typeFilter === 'new' ? !c.isRepeat : false)
      || (typeFilter === 'loyal' ? c.customerType === 'loyal' : false);
    const matchRisk = riskFilter === 'all' || (riskFilter === 'fraud' ? c.isFraudRisk : !c.isFraudRisk);
    const matchChannel = channelFilter === 'all' || (c.channels && c.channels.includes(channelFilter));
    const matchState = stateFilter === 'all' || c.state === stateFilter;
    return matchType && matchRisk && matchChannel && matchState;
  }), [enriched, typeFilter, riskFilter, channelFilter, stateFilter]);

  const stats = useMemo(() => ({
    total: enriched.length,
    repeat: enriched.filter(c => c.isRepeat).length,
    newCust: enriched.filter(c => !c.isRepeat).length,
    loyal: enriched.filter(c => c.customerType === 'loyal').length,
    fraudRisk: enriched.filter(c => c.isFraudRisk).length,
    totalRevenue: enriched.reduce((s, c) => s + Number(c.total_spent || 0), 0),
  }), [enriched]);

  // Geographic data
  const geoData = useMemo(() => {
    const stateMap: Record<string, { count: number; revenue: number; orders: number }> = {};
    const cityMap: Record<string, { count: number; revenue: number }> = {};
    const pincodeMap: Record<string, number> = {};

    enriched.forEach(c => {
      const st = c.state || 'Unknown';
      if (!stateMap[st]) stateMap[st] = { count: 0, revenue: 0, orders: 0 };
      stateMap[st].count += 1;
      stateMap[st].revenue += Number(c.total_spent || 0);
      stateMap[st].orders += Number(c.total_orders || 0);

      const ct = c.city || 'Unknown';
      if (!cityMap[ct]) cityMap[ct] = { count: 0, revenue: 0 };
      cityMap[ct].count += 1;
      cityMap[ct].revenue += Number(c.total_spent || 0);

      if (c.pincode) pincodeMap[c.pincode] = (pincodeMap[c.pincode] || 0) + 1;
    });

    const stateData = Object.entries(stateMap)
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const cityData = Object.entries(cityMap)
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const topPincodes = Object.entries(pincodeMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([pin, count]) => ({ pin, count }));

    const uniqueStates = Object.keys(stateMap).filter(s => s !== 'Unknown').sort();

    return { stateData, cityData, topPincodes, uniqueStates };
  }, [enriched]);

  // Channel breakdown
  const channelData = useMemo(() => {
    const map: Record<string, number> = {};
    enriched.forEach(c => {
      (c.channels || []).forEach((ch: string) => {
        map[ch] = (map[ch] || 0) + 1;
      });
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [enriched]);

  const allChannels = useMemo(() => {
    const set = new Set<string>();
    enriched.forEach(c => (c.channels || []).forEach((ch: string) => set.add(ch)));
    return Array.from(set).sort();
  }, [enriched]);

  // Customer type pie data
  const typePie = useMemo(() => [
    { name: 'Loyal (5+ orders)', value: stats.loyal },
    { name: 'Repeat (2-5 orders)', value: stats.repeat - stats.loyal },
    { name: 'New (1 order)', value: stats.newCust },
  ].filter(d => d.value > 0), [stats]);

  const handleExport = () => {
    const headers = ['Name', 'Email', 'Phone', 'City', 'State', 'Pincode', 'Address', 'Orders', 'Returns', 'Spent', 'Type', 'Risk', 'Channels'];
    const rows = filtered.map(c => [
      c.name, c.email, c.phone, c.city, c.state, c.pincode, c.address,
      c.total_orders, c.total_returns, c.total_spent,
      c.customerType, c.isFraudRisk ? 'High Risk' : 'Safe',
      (c.channels || []).join('; '),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map((v: any) => `"${v || ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'customers.csv'; a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported', description: `${filtered.length} customers exported to CSV` });
  };

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customer Management</h1>
          <p className="text-muted-foreground">Track customers, geographic sales & identify repeat/fake buyers</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleExport}><Download className="w-4 h-4" />Export CSV</Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { icon: Users, label: 'Total Customers', value: stats.total, color: 'text-primary' },
          { icon: UserCheck, label: 'Repeat Buyers', value: stats.repeat, color: 'text-emerald-600' },
          { icon: UserPlus, label: 'New Customers', value: stats.newCust, color: 'text-blue-600' },
          { icon: TrendingUp, label: 'Loyal (5+)', value: stats.loyal, color: 'text-violet-600' },
          { icon: ShieldAlert, label: 'Fraud Risk', value: stats.fraudRisk, color: 'text-rose-600' },
          { icon: Globe, label: 'Total Revenue', value: fmt(stats.totalRevenue), color: 'text-primary' },
        ].map((kpi, i) => (
          <Card key={i}>
            <CardContent className="pt-5 pb-4">
              <kpi.icon className={`w-4 h-4 ${kpi.color} mb-1`} />
              <p className={`text-xl font-bold ${typeof kpi.value === 'number' ? kpi.color : ''}`}>{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs: Customer List | Geographic Insights */}
      <Tabs defaultValue="customers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="customers" className="gap-1.5"><Users className="w-4 h-4" />Customer Database</TabsTrigger>
          <TabsTrigger value="geo" className="gap-1.5"><Map className="w-4 h-4" />Geographic Insights</TabsTrigger>
          <TabsTrigger value="analysis" className="gap-1.5"><BarChart3 className="w-4 h-4" />Customer Analysis</TabsTrigger>
        </TabsList>

        {/* Tab 1: Customer Database */}
        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search name, email, pincode, state..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="repeat">Repeat</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="loyal">Loyal</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={riskFilter} onValueChange={setRiskFilter}>
                  <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Risk</SelectItem>
                    <SelectItem value="fraud">Fraud Risk</SelectItem>
                    <SelectItem value="safe">Safe</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={channelFilter} onValueChange={setChannelFilter}>
                  <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Channels</SelectItem>
                    {allChannels.map(ch => <SelectItem key={ch} value={ch}>{ch}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={stateFilter} onValueChange={setStateFilter}>
                  <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {geoData.uniqueStates.map(st => <SelectItem key={st} value={st}>{st}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filtered.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No customers found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Customer</TableHead>
                        <TableHead className="font-semibold">Location</TableHead>
                        <TableHead className="font-semibold">Pincode</TableHead>
                        <TableHead className="font-semibold text-center">Orders</TableHead>
                        <TableHead className="font-semibold text-center">Returns</TableHead>
                        <TableHead className="font-semibold text-center">Return%</TableHead>
                        <TableHead className="font-semibold text-right">Spent</TableHead>
                        <TableHead className="font-semibold">Type</TableHead>
                        <TableHead className="font-semibold">Risk</TableHead>
                        <TableHead className="font-semibold">Channels</TableHead>
                        <TableHead className="font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map(c => (
                        <TableRow key={c.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{c.name}</p>
                              <p className="text-xs text-muted-foreground">{c.email}</p>
                              {c.phone && <p className="text-xs text-muted-foreground">{c.phone}</p>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                              <span>{[c.city, c.state].filter(Boolean).join(', ') || '—'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-mono">{c.pincode || '—'}</TableCell>
                          <TableCell className="text-center font-semibold">{c.total_orders}</TableCell>
                          <TableCell className="text-center">{c.total_returns}</TableCell>
                          <TableCell className="text-center">
                            <span className={c.returnRate >= FRAUD_THRESHOLD ? 'text-rose-600 font-semibold' : ''}>{c.returnRate.toFixed(0)}%</span>
                          </TableCell>
                          <TableCell className="text-right font-semibold">{fmt(Number(c.total_spent || 0))}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              c.customerType === 'loyal'
                                ? 'bg-violet-500/10 text-violet-600 border-violet-500/30'
                                : c.isRepeat
                                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                                  : 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                            }>
                              {c.customerType === 'loyal' ? 'Loyal' : c.isRepeat ? 'Repeat' : 'New'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {c.isFraudRisk ? (
                              <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/30 gap-1"><AlertTriangle className="w-3 h-3" />High</Badge>
                            ) : <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Safe</Badge>}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {(c.channels || []).slice(0, 2).map((ch: string) => (
                                <Badge key={ch} variant="secondary" className="text-[10px] px-1.5">{ch}</Badge>
                              ))}
                              {(c.channels || []).length > 2 && <Badge variant="secondary" className="text-[10px] px-1.5">+{c.channels.length - 2}</Badge>}
                            </div>
                          </TableCell>
                          <TableCell><Button variant="ghost" size="sm" onClick={() => setSelected(c)}><Eye className="w-4 h-4" /></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <div className="p-3 border-t text-xs text-muted-foreground">Showing {filtered.length} of {enriched.length} customers</div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Geographic Insights */}
        <TabsContent value="geo">
          <div className="grid md:grid-cols-2 gap-6">
            {/* State-wise Revenue */}
            <Card>
              <CardHeader><CardTitle className="text-base">State-wise Revenue (Top 10)</CardTitle></CardHeader>
              <CardContent>
                {geoData.stateData.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">No geographic data available</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={geoData.stateData} layout="vertical" margin={{ left: 80 }}>
                      <XAxis type="number" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} fontSize={11} />
                      <YAxis type="category" dataKey="name" width={75} fontSize={11} />
                      <Tooltip formatter={(v: number) => fmt(v)} />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* City-wise Customers */}
            <Card>
              <CardHeader><CardTitle className="text-base">City-wise Customers (Top 10)</CardTitle></CardHeader>
              <CardContent>
                {geoData.cityData.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">No city data available</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={geoData.cityData} layout="vertical" margin={{ left: 80 }}>
                      <XAxis type="number" fontSize={11} />
                      <YAxis type="category" dataKey="name" width={75} fontSize={11} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} name="Customers" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* State-wise Customer Table */}
            <Card>
              <CardHeader><CardTitle className="text-base">State-wise Distribution</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">State</TableHead>
                      <TableHead className="font-semibold text-center">Customers</TableHead>
                      <TableHead className="font-semibold text-center">Orders</TableHead>
                      <TableHead className="font-semibold text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {geoData.stateData.map(s => (
                      <TableRow key={s.name}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell className="text-center">{s.count}</TableCell>
                        <TableCell className="text-center">{s.orders}</TableCell>
                        <TableCell className="text-right font-semibold">{fmt(s.revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Top Pincodes */}
            <Card>
              <CardHeader><CardTitle className="text-base">Top Pincodes by Customer Count</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Pincode</TableHead>
                      <TableHead className="font-semibold text-center">Customers</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {geoData.topPincodes.length === 0 ? (
                      <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-6">No pincode data</TableCell></TableRow>
                    ) : geoData.topPincodes.map(p => (
                      <TableRow key={p.pin}>
                        <TableCell className="font-mono font-medium">{p.pin}</TableCell>
                        <TableCell className="text-center">{p.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Customer Analysis */}
        <TabsContent value="analysis">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Customer Type Pie */}
            <Card>
              <CardHeader><CardTitle className="text-base">Customer Type Distribution</CardTitle></CardHeader>
              <CardContent>
                {typePie.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">No data</p>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={typePie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                        {typePie.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Channel-wise Distribution */}
            <Card>
              <CardHeader><CardTitle className="text-base">Channel-wise Customer Distribution</CardTitle></CardHeader>
              <CardContent>
                {channelData.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">No channel data</p>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={channelData}>
                      <XAxis dataKey="name" fontSize={11} />
                      <YAxis fontSize={11} />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} name="Customers" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Fraud Risk Summary */}
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-rose-600" />High Risk Customers (Return Rate ≥ {FRAUD_THRESHOLD}%)</CardTitle></CardHeader>
              <CardContent className="p-0">
                {enriched.filter(c => c.isFraudRisk).length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">No fraud risk customers detected</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Customer</TableHead>
                        <TableHead className="font-semibold">Location</TableHead>
                        <TableHead className="font-semibold text-center">Orders</TableHead>
                        <TableHead className="font-semibold text-center">Returns</TableHead>
                        <TableHead className="font-semibold text-center">Return%</TableHead>
                        <TableHead className="font-semibold text-right">Spent</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enriched.filter(c => c.isFraudRisk).sort((a, b) => b.returnRate - a.returnRate).slice(0, 10).map(c => (
                        <TableRow key={c.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setSelected(c)}>
                          <TableCell><p className="font-medium">{c.name}</p><p className="text-xs text-muted-foreground">{c.email}</p></TableCell>
                          <TableCell className="text-sm">{[c.city, c.state].filter(Boolean).join(', ') || '—'}</TableCell>
                          <TableCell className="text-center">{c.total_orders}</TableCell>
                          <TableCell className="text-center text-rose-600 font-semibold">{c.total_returns}</TableCell>
                          <TableCell className="text-center text-rose-600 font-bold">{c.returnRate.toFixed(0)}%</TableCell>
                          <TableCell className="text-right font-semibold">{fmt(Number(c.total_spent || 0))}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Repeat Buyers */}
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><UserCheck className="w-4 h-4 text-emerald-600" />Top Repeat Buyers</CardTitle></CardHeader>
              <CardContent className="p-0">
                {enriched.filter(c => c.isRepeat).length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">No repeat buyers yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Customer</TableHead>
                        <TableHead className="font-semibold">Location</TableHead>
                        <TableHead className="font-semibold text-center">Orders</TableHead>
                        <TableHead className="font-semibold text-right">Total Spent</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enriched.filter(c => c.isRepeat).sort((a, b) => b.total_orders - a.total_orders).slice(0, 10).map(c => (
                        <TableRow key={c.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setSelected(c)}>
                          <TableCell><p className="font-medium">{c.name}</p><p className="text-xs text-muted-foreground">{c.email}</p></TableCell>
                          <TableCell className="text-sm">{[c.city, c.state].filter(Boolean).join(', ') || '—'}</TableCell>
                          <TableCell className="text-center font-bold text-emerald-600">{c.total_orders}</TableCell>
                          <TableCell className="text-right font-semibold">{fmt(Number(c.total_spent || 0))}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Customer Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{selected?.name}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={
                  selected.customerType === 'loyal'
                    ? 'bg-violet-500/10 text-violet-600 border-violet-500/30'
                    : selected.isRepeat
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                      : 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                }>
                  {selected.customerType === 'loyal' ? 'Loyal Customer' : selected.isRepeat ? 'Repeat Buyer' : 'New Customer'}
                </Badge>
                {selected.isFraudRisk && (
                  <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/30 gap-1"><AlertTriangle className="w-3 h-3" />Fraud Risk ({selected.returnRate.toFixed(0)}% return rate)</Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground">Email</p><p className="font-medium">{selected.email || '—'}</p></div>
                <div><p className="text-muted-foreground">Phone</p><p className="font-medium">{selected.phone || '—'}</p></div>
                <div className="col-span-2"><p className="text-muted-foreground">Address</p><p className="font-medium">{selected.address || '—'}</p></div>
                <div><p className="text-muted-foreground">City</p><p className="font-medium">{selected.city || '—'}</p></div>
                <div><p className="text-muted-foreground">State</p><p className="font-medium">{selected.state || '—'}</p></div>
                <div><p className="text-muted-foreground">Pincode</p><p className="font-mono font-medium">{selected.pincode || '—'}</p></div>
                <div>
                  <p className="text-muted-foreground">Channels</p>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {(selected.channels || []).length > 0
                      ? selected.channels.map((ch: string) => <Badge key={ch} variant="secondary" className="text-xs">{ch}</Badge>)
                      : <span className="text-muted-foreground">—</span>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <Card><CardContent className="pt-4 pb-3 text-center"><Package className="w-5 h-5 mx-auto mb-1 text-primary" /><p className="text-lg font-bold">{selected.total_orders}</p><p className="text-xs text-muted-foreground">Orders</p></CardContent></Card>
                <Card><CardContent className="pt-4 pb-3 text-center"><RotateCcw className="w-5 h-5 mx-auto mb-1 text-amber-600" /><p className="text-lg font-bold">{selected.total_returns}</p><p className="text-xs text-muted-foreground">Returns</p></CardContent></Card>
                <Card><CardContent className="pt-4 pb-3 text-center"><AlertTriangle className="w-5 h-5 mx-auto mb-1 text-rose-600" /><p className="text-lg font-bold">{selected.returnRate.toFixed(0)}%</p><p className="text-xs text-muted-foreground">Return Rate</p></CardContent></Card>
                <Card><CardContent className="pt-4 pb-3 text-center"><TrendingUp className="w-5 h-5 mx-auto mb-1 text-emerald-600" /><p className="text-lg font-bold">{fmt(Number(selected.total_spent || 0))}</p><p className="text-xs text-muted-foreground">Spent</p></CardContent></Card>
              </div>

              {selected.first_order_date && (
                <div className="grid grid-cols-2 gap-4 text-sm border-t pt-3">
                  <div><p className="text-muted-foreground">First Order</p><p className="font-medium">{new Date(selected.first_order_date).toLocaleDateString('en-IN')}</p></div>
                  <div><p className="text-muted-foreground">Last Order</p><p className="font-medium">{selected.last_order_date ? new Date(selected.last_order_date).toLocaleDateString('en-IN') : '—'}</p></div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
