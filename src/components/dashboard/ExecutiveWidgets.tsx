import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users, UserPlus, UserCheck, Percent, Store, StoreIcon,
  CheckCircle2, XCircle, AlertCircle, Link2, Unlink,
  Package, CalendarDays, ListTodo, Clock, BarChart3,
  ShoppingBag, Globe, Layers,
} from 'lucide-react';
import { portalConfigs } from '@/services/mockData';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface ExecutiveWidgetsProps {
  orders: any[];
  formatCurrency: (v: number) => string;
}

const CHANNEL_COLORS = [
  'hsl(var(--primary))',
  'hsl(220, 70%, 55%)',
  'hsl(150, 60%, 45%)',
  'hsl(35, 90%, 55%)',
  'hsl(280, 60%, 55%)',
  'hsl(0, 70%, 55%)',
  'hsl(190, 70%, 45%)',
  'hsl(60, 70%, 45%)',
  'hsl(330, 60%, 55%)',
];

// Indian holidays for 2026
const UPCOMING_HOLIDAYS = [
  { name: 'Holi', date: '2026-03-20', type: 'Festival' },
  { name: 'Good Friday', date: '2026-04-03', type: 'National' },
  { name: 'Eid ul-Fitr', date: '2026-04-01', type: 'Festival' },
  { name: 'Baisakhi', date: '2026-04-14', type: 'Regional' },
  { name: 'Buddha Purnima', date: '2026-05-12', type: 'National' },
  { name: 'Independence Day', date: '2026-08-15', type: 'National' },
  { name: 'Raksha Bandhan', date: '2026-08-21', type: 'Festival' },
  { name: 'Ganesh Chaturthi', date: '2026-09-07', type: 'Festival' },
  { name: 'Navratri Start', date: '2026-09-28', type: 'Festival' },
  { name: 'Dussehra', date: '2026-10-07', type: 'Festival' },
  { name: 'Diwali', date: '2026-10-26', type: 'Festival' },
  { name: 'Christmas', date: '2026-12-25', type: 'National' },
];

export function ExecutiveWidgets({ orders, formatCurrency }: ExecutiveWidgetsProps) {
  const [vendors, setVendors] = useState<any[]>([]);
  const [productHealth, setProductHealth] = useState<any[]>([]);
  const [skuMappings, setSkuMappings] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from('vendors').select('*').then(r => r.data || []),
      supabase.from('product_health').select('*').then(r => r.data || []),
      supabase.from('sku_mappings').select('*').then(r => r.data || []),
      supabase.from('products').select('id, name, sku, status, portals_enabled, category, brand').then(r => r.data || []),
      supabase.from('tasks').select('*').then(r => r.data || []),
      supabase.from('customers').select('*').then(r => r.data || []),
    ]).then(([v, ph, sm, pr, t, c]) => {
      setVendors(v); setProductHealth(ph); setSkuMappings(sm);
      setProducts(pr); setTasks(t); setCustomers(c);
    });
  }, []);

  // ─── CUSTOMER INSIGHTS ───
  const customerInsights = useMemo(() => {
    const total = customers.length;
    const repeat = customers.filter(c => (c.total_orders || 0) > 1).length;
    const newC = total - repeat;
    const repeatRate = total > 0 ? Math.round((repeat / total) * 100) : 0;
    return { total, newC, repeat, repeatRate };
  }, [customers]);

  // ─── VENDOR STATUS ───
  const vendorStatus = useMemo(() => {
    const total = vendors.length;
    const active = vendors.filter(v => v.status === 'active').length;
    const inactive = total - active;
    // New = created in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const newVendors = vendors.filter(v => new Date(v.created_at) > thirtyDaysAgo).length;
    const returning = total - newVendors;
    return { total, active, inactive, newVendors, returning };
  }, [vendors]);

  // ─── PRODUCT HEALTH ───
  const healthSummary = useMemo(() => {
    const activeProducts = products.filter(p => p.status === 'active').length;
    const inactiveProducts = products.filter(p => p.status !== 'active').length;
    const totalProducts = products.length;

    // From product_health table
    let live = 0, oos = 0, suppressed = 0;
    productHealth.forEach(ph => {
      const statuses = ph.portal_status as Record<string, string>;
      Object.values(statuses || {}).forEach(s => {
        if (s === 'live') live++;
        else if (s === 'out_of_stock' || s === 'oos') oos++;
        else suppressed++;
      });
    });

    return { totalProducts, activeProducts, inactiveProducts, live, oos, suppressed, healthChecked: productHealth.length };
  }, [products, productHealth]);

  // ─── CHANNEL REVENUE SHARE ───
  const channelRevenue = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach(o => {
      map[o.portal] = (map[o.portal] || 0) + (o.totalAmount || 0);
    });
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    return Object.entries(map)
      .map(([portal, revenue]) => ({
        name: portalConfigs.find(p => p.id === portal)?.name || portal,
        value: revenue,
        share: total > 0 ? +((revenue / total) * 100).toFixed(1) : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [orders]);

  // ─── SKU MAPPING ───
  const skuSummary = useMemo(() => {
    const total = skuMappings.length;
    const fullyMapped = skuMappings.filter(s => {
      const channels = [s.amazon_sku, s.flipkart_sku, s.meesho_sku, s.firstcry_sku, s.blinkit_sku, s.own_website_sku];
      return channels.filter(Boolean).length >= 3;
    }).length;
    const partial = skuMappings.filter(s => {
      const channels = [s.amazon_sku, s.flipkart_sku, s.meesho_sku, s.firstcry_sku, s.blinkit_sku, s.own_website_sku];
      const count = channels.filter(Boolean).length;
      return count >= 1 && count < 3;
    }).length;
    const unmapped = total - fullyMapped - partial;
    return { total, fullyMapped, partial, unmapped };
  }, [skuMappings]);

  // ─── CATALOG MANAGER ───
  const catalogSummary = useMemo(() => {
    const total = products.length;
    const categories = new Set(products.map(p => p.category).filter(Boolean)).size;
    const brands = new Set(products.map(p => p.brand).filter(Boolean)).size;
    const withImages = products.filter(p => p.image_url).length;
    const multiChannel = products.filter(p => (p.portals_enabled || []).length > 1).length;
    return { total, categories, brands, withImages, multiChannel };
  }, [products]);

  // ─── UPCOMING HOLIDAYS ───
  const upcomingHolidays = useMemo(() => {
    const now = new Date();
    return UPCOMING_HOLIDAYS
      .filter(h => new Date(h.date) >= now)
      .slice(0, 5)
      .map(h => {
        const diff = Math.ceil((new Date(h.date).getTime() - now.getTime()) / 86400000);
        return { ...h, daysAway: diff };
      });
  }, []);

  // ─── TASKS PROGRESS ───
  const taskProgress = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter(t => t.status === 'completed' || t.status === 'done').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress' || t.status === 'in-progress').length;
    const pending = tasks.filter(t => t.status === 'pending' || t.status === 'todo').length;
    const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed' && t.status !== 'done').length;
    const highPriority = tasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length;
    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, inProgress, pending, overdue, highPriority, completionRate };
  }, [tasks]);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
        Executive Overview
        <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20 gap-0.5">
          <CheckCircle2 className="w-2.5 h-2.5" /> Live
        </Badge>
      </h2>

      {/* Row 1: Customer + Vendor Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Details */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Customer Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-center">
                <UserPlus className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <p className="text-xl font-bold">{customerInsights.newC}</p>
                <p className="text-xs text-muted-foreground">New Customers</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10 text-center">
                <UserCheck className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <p className="text-xl font-bold">{customerInsights.repeat}</p>
                <p className="text-xs text-muted-foreground">Repeat Customers</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-center">
                <Users className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-xl font-bold">{customerInsights.total}</p>
                <p className="text-xs text-muted-foreground">Total Customers</p>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 text-center">
                <Percent className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                <p className="text-xl font-bold">{customerInsights.repeatRate}%</p>
                <p className="text-xs text-muted-foreground">Repeat Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vendor Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Store className="w-4 h-4 text-primary" />
              Vendor Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <p className="text-xl font-bold">{vendorStatus.active}</p>
                <p className="text-xs text-muted-foreground">Active Vendors</p>
              </div>
              <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/10 text-center">
                <XCircle className="w-5 h-5 text-rose-600 mx-auto mb-1" />
                <p className="text-xl font-bold">{vendorStatus.inactive}</p>
                <p className="text-xs text-muted-foreground">Inactive Vendors</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10 text-center">
                <UserPlus className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <p className="text-xl font-bold">{vendorStatus.newVendors}</p>
                <p className="text-xs text-muted-foreground">New (30 days)</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-center">
                <UserCheck className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-xl font-bold">{vendorStatus.returning}</p>
                <p className="text-xs text-muted-foreground">Returning Vendors</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Product Health + Channel Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Health */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              Product Active Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <p className="text-xl font-bold text-emerald-600">{healthSummary.activeProducts}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-rose-500/5 border border-rose-500/10">
                <p className="text-xl font-bold text-rose-600">{healthSummary.inactiveProducts}</p>
                <p className="text-xs text-muted-foreground">Inactive</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-xl font-bold">{healthSummary.totalProducts}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
            {healthSummary.healthChecked > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Health Check Report ({healthSummary.healthChecked} products)</p>
                <div className="flex gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-xs">Live: {healthSummary.live}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-xs">OOS: {healthSummary.oos}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="text-xs">Suppressed: {healthSummary.suppressed}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Channel Revenue Share */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Channel Revenue Share
            </CardTitle>
          </CardHeader>
          <CardContent>
            {channelRevenue.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={160}>
                  <PieChart>
                    <Pie data={channelRevenue} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} innerRadius={35}>
                      {channelRevenue.map((_, i) => (
                        <Cell key={i} fill={CHANNEL_COLORS[i % CHANNEL_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1.5">
                  {channelRevenue.map((c, i) => (
                    <div key={c.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHANNEL_COLORS[i % CHANNEL_COLORS.length] }} />
                        <span className="text-xs">{c.name}</span>
                      </div>
                      <span className="text-xs font-semibold">{c.share}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No order data available.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3: SKU Mapping + Catalog Manager */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SKU Mapping */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              SKU Mapping Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <Link2 className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-emerald-600">{skuSummary.fullyMapped}</p>
                <p className="text-[10px] text-muted-foreground">Fully Mapped</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                <AlertCircle className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-amber-600">{skuSummary.partial}</p>
                <p className="text-[10px] text-muted-foreground">Partial</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-rose-500/5 border border-rose-500/10">
                <Unlink className="w-4 h-4 text-rose-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-rose-600">{skuSummary.unmapped}</p>
                <p className="text-[10px] text-muted-foreground">Unmapped</p>
              </div>
            </div>
            {skuSummary.total > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Mapping Coverage</span>
                  <span>{Math.round((skuSummary.fullyMapped / skuSummary.total) * 100)}%</span>
                </div>
                <Progress value={(skuSummary.fullyMapped / skuSummary.total) * 100} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Catalog Manager */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-primary" />
              Catalog Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Package className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-lg font-bold">{catalogSummary.total}</p>
                  <p className="text-[10px] text-muted-foreground">Total Products</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Layers className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-lg font-bold">{catalogSummary.categories}</p>
                  <p className="text-[10px] text-muted-foreground">Categories</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <StoreIcon className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-lg font-bold">{catalogSummary.brands}</p>
                  <p className="text-[10px] text-muted-foreground">Brands</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Globe className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-lg font-bold">{catalogSummary.multiChannel}</p>
                  <p className="text-[10px] text-muted-foreground">Multi-Channel</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Upcoming Holidays + Tasks Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Holidays */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary" />
              Upcoming Holidays
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingHolidays.map(h => (
                <div key={h.name} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CalendarDays className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{h.name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(h.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{h.type}</Badge>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${h.daysAway <= 7 ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' : h.daysAway <= 30 ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'}`}
                    >
                      {h.daysAway}d away
                    </Badge>
                  </div>
                </div>
              ))}
              {upcomingHolidays.length === 0 && <p className="text-sm text-muted-foreground">No upcoming holidays.</p>}
            </div>
          </CardContent>
        </Card>

        {/* Tasks Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-primary" />
              Tasks Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Overall Completion</span>
                <span className="font-semibold">{taskProgress.completionRate}%</span>
              </div>
              <Progress value={taskProgress.completionRate} className="h-3" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <p className="text-lg font-bold text-emerald-600">{taskProgress.done}</p>
                <p className="text-[10px] text-muted-foreground">Completed</p>
              </div>
              <div className="text-center p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/10">
                <p className="text-lg font-bold text-blue-600">{taskProgress.inProgress}</p>
                <p className="text-[10px] text-muted-foreground">In Progress</p>
              </div>
              <div className="text-center p-2.5 rounded-lg bg-muted/50 border">
                <p className="text-lg font-bold">{taskProgress.pending}</p>
                <p className="text-[10px] text-muted-foreground">Pending</p>
              </div>
            </div>
            <div className="flex gap-4 text-xs">
              {taskProgress.overdue > 0 && (
                <div className="flex items-center gap-1 text-rose-600">
                  <Clock className="w-3 h-3" />
                  {taskProgress.overdue} overdue
                </div>
              )}
              {taskProgress.highPriority > 0 && (
                <div className="flex items-center gap-1 text-amber-600">
                  <AlertCircle className="w-3 h-3" />
                  {taskProgress.highPriority} high priority
                </div>
              )}
              <div className="text-muted-foreground">Total: {taskProgress.total} tasks</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
