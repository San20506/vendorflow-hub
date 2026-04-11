import { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAIAccess } from '@/contexts/AIAccessContext';
import { useProducts } from '@/hooks/useProducts';
import { useOrders } from '@/hooks/useOrders';
import { useSettlements } from '@/hooks/useSettlements';
import { seedDemoData } from '@/services/seedDemoData';
import { KPICard } from '@/components/dashboard/KPICard';
import { InventoryChart, PortalSalesChart, CHART_COLORS } from '@/components/dashboard/Charts';
import { FinancialOverview } from '@/components/dashboard/FinancialOverview';
import { DashboardCustomizer } from '@/components/DashboardCustomizer';
import { useDashboardWidgets } from '@/hooks/useDashboardWidgets';

import { GlobalDateFilter, DateRange } from '@/components/GlobalDateFilter';
import { EmptyState } from '@/components/EmptyState';
import { OnboardingWizard } from '@/components/OnboardingWizard';
import { Progress } from '@/components/ui/progress';
import {
  DollarSign, ShoppingCart, Package, AlertTriangle, RotateCcw, CreditCard,
  TrendingUp, TrendingDown, Star, Users, UserPlus, UserCheck, Percent,
  Plus, ShieldCheck, ShieldAlert, Hash, UserX, CheckCircle2, BarChart3,
  ArrowUpRight, ArrowDownRight, Clock, ShieldX, PackageCheck, PackageX,
  CalendarClock, Truck, Rocket, Upload,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList,
} from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { criticalDecisionToggle } = useAIAccess();
  const [salesViewMode, setSalesViewMode] = useState<'revenue' | 'units'>('revenue');
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const { widgets, toggleWidget, moveWidget, isVisible, resetWidgets } = useDashboardWidgets();

  // Get vendor ID from current user
  const vendorId = user?.id || null;

  // Fetch real data from Supabase
  const { data: products = [], isLoading: isLoadingProducts } = useProducts(vendorId);
  const { data: orders = [], isLoading: isLoadingOrders } = useOrders(vendorId);
  const { data: settlements = [], isLoading: isLoadingSettlements } = useSettlements(vendorId);

  const isLoading = isLoadingProducts || isLoadingOrders || isLoadingSettlements;

  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${value}`;
  };

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (dateRange.from && new Date(o.created_at) < dateRange.from) return false;
      if (dateRange.to && new Date(o.created_at) > dateRange.to) return false;
      return true;
    });
  }, [orders, dateRange]);

  // ─── KPI CALCULATIONS FROM REAL DATA ───
  const kpiData = useMemo(() => {
    const totalSales = filteredOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const ordersCount = filteredOrders.length;
    const deliveredOrders = filteredOrders.filter(o => o.status === 'delivered').length;
    const pendingSettlements = settlements.filter(s => s.status === 'pending').length;
    const processedSettlements = settlements.filter(s => s.status === 'processed').length;
    const healthyProducts = products.filter(p => p.stock > 0).length;

    return {
      totalSales,
      ordersCount,
      deliveredOrders,
      pendingSettlements,
      processedSettlements,
      healthyProducts,
      productCount: products.length,
    };
  }, [filteredOrders, products, settlements]);

  const hasNoData = products.length === 0 && orders.length === 0 && !isLoading;

  const [showOnboarding, setShowOnboarding] = useState(false);

  const handleSeedDemoData = async () => {
    try {
      await seedDemoData();
      toast({ title: 'Demo Data Seeded', description: 'Demo data loaded successfully. Refresh to see updates.' });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Seeding failed.';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };


  return (
    <div className="space-y-6 animate-fade-in relative">
      <OnboardingWizard />

      {/* ═══ EMPTY STATE ═══ */}
      {hasNoData && (
        <Card className="border-dashed border-2 border-primary/20 bg-primary/5">
          <CardContent className="py-10">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Rocket className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Your dashboard is ready!</h3>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                Start by adding products and importing orders, or load sample data to explore the platform instantly.
              </p>
              <div className="flex items-center gap-3 flex-wrap justify-center">
                <Button onClick={handleSeedDemoData} className="gap-2">
                  <Rocket className="w-4 h-4" /> Load Demo Data
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/products'} className="gap-2">
                  <Plus className="w-4 h-4" /> Add Products
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/data-import'} className="gap-2">
                  <Upload className="w-4 h-4" /> Import Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ PAGE HEADER ═══ */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-foreground">Sales Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Welcome back, {user?.name}!</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-500/30 bg-blue-500/5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-xs font-medium text-blue-600">AI Access Control</span>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${criticalDecisionToggle ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
              <ShieldAlert className={`w-3.5 h-3.5 ${criticalDecisionToggle ? 'text-emerald-500' : 'text-amber-500'}`} />
              <span className={`text-xs font-medium ${criticalDecisionToggle ? 'text-emerald-600' : 'text-amber-600'}`}>Human Approval</span>
            </div>
          </div>
          <Badge variant="outline" className="text-xs font-mono">VendorFlow v1.2</Badge>
          {user?.role === 'admin' && !hasNoData && (
            <Button variant="outline" size="sm" onClick={handleResetDemoData} className="gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/5">
              <RotateCcw className="w-3.5 h-3.5" /> Reset Data
            </Button>
          )}
        </div>
        </div>

        {/* ═══ FILTER CONTROLS ═══ */}
        <div className="flex items-center gap-3 flex-wrap">
        <Select value={selectedPortal} onValueChange={(v) => setSelectedPortal(v as Portal | 'all')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Channels</SelectItem>
            {portalConfigs.map(p => (
              <SelectItem key={p.id} value={p.id}>
                <span className="flex items-center gap-2"><ChannelIcon channelId={p.id} fallbackIcon={p.icon} size={16} /> {p.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <GlobalDateFilter value={dateRange} onChange={setDateRange} />
        <Select value={sortMode} onValueChange={(v) => setSortMode(v as any)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="revenue">Sort: Revenue</SelectItem>
            <SelectItem value="units">Sort: Units</SelectItem>
            <SelectItem value="returns">Sort: Returns</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => navigate('/channels')}>
          <Plus className="w-3.5 h-3.5" />
          Add Channel
        </Button>
        <DashboardCustomizer widgets={widgets} onToggle={toggleWidget} onMove={moveWidget} onReset={resetWidgets} />
      </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
           BLOCK 1: DAILY SUMMARY
         ═══════════════════════════════════════════════════════════════ */}
      {isVisible('daily-summary') && <div>
        <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          Daily Summary
          <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-0.5">
            <CheckCircle2 className="w-2.5 h-2.5" /> Updated
          </Badge>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Daily Orders</p>
                <div className="p-2 rounded-lg bg-primary/10"><ShoppingCart className="w-4 h-4 text-primary" /></div>
              </div>
              <p className="text-2xl font-bold">{dailySummary.todayCount}</p>
              <div className={`flex items-center gap-1 text-xs mt-1 ${dailySummary.orderGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {dailySummary.orderGrowth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(dailySummary.orderGrowth)}% vs yesterday
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Daily Revenue</p>
                <div className="p-2 rounded-lg bg-emerald-500/10"><DollarSign className="w-4 h-4 text-emerald-600" /></div>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(dailySummary.todayRevenue)}</p>
              <div className={`flex items-center gap-1 text-xs mt-1 ${dailySummary.revenueGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {dailySummary.revenueGrowth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(dailySummary.revenueGrowth)}% vs yesterday
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Total Units Sold</p>
                <div className="p-2 rounded-lg bg-blue-500/10"><Hash className="w-4 h-4 text-blue-600" /></div>
              </div>
              <p className="text-2xl font-bold">{totalUnitsSold}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Duplicate Customers</p>
                <div className="p-2 rounded-lg bg-amber-500/10"><UserX className="w-4 h-4 text-amber-600" /></div>
              </div>
              <p className="text-2xl font-bold">{duplicateCustomerCount}</p>
            </CardContent>
          </Card>
        </div>
      </div>}

      {isVisible('kpi-row') && <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard title="Total Sales" value={formatCurrency(kpiData.totalSales)} icon={DollarSign} change={kpiData.salesGrowth} variant="success" />
        <KPICard title="Orders Today" value={kpiData.ordersToday} icon={ShoppingCart} change={kpiData.ordersGrowth} />
        <KPICard title="Inventory Value" value={formatCurrency(kpiData.inventoryValue)} icon={Package} />
        <KPICard title="Low Stock" value={kpiData.lowStockItems} icon={AlertTriangle} variant={kpiData.lowStockItems > 10 ? 'warning' : 'default'} />
        <KPICard title="Pending Returns" value={kpiData.pendingReturns} icon={RotateCcw} variant={kpiData.pendingReturns > 20 ? 'warning' : 'default'} />
        <KPICard title="Pending Settlements" value={kpiData.pendingSettlements} icon={CreditCard} variant={kpiData.pendingSettlements > 5 ? 'danger' : 'default'} />
      </div>}

      {isVisible('sales-trend') && <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold">Sales Trend</CardTitle>
            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-0.5">
              <CheckCircle2 className="w-2.5 h-2.5" /> Updated
            </Badge>
          </div>
          <Tabs value={salesViewMode} onValueChange={(v) => setSalesViewMode(v as 'revenue' | 'units')}>
            <TabsList className="h-8">
              <TabsTrigger value="revenue" className="text-xs px-3 h-6">Revenue (₹)</TabsTrigger>
              <TabsTrigger value="units" className="text-xs px-3 h-6">Units Sold</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={salesChartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={salesViewMode === 'revenue' ? (v) => `₹${(v/1000).toFixed(0)}K` : undefined} />
              <Tooltip formatter={(v: number) => salesViewMode === 'revenue' ? `₹${v.toLocaleString()}` : `${v} units`} />
              <Bar dataKey={salesViewMode === 'revenue' ? 'revenue' : 'orders'} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                <LabelList dataKey={salesViewMode === 'revenue' ? 'revenue' : 'orders'} position="top" className="fill-muted-foreground" fontSize={10} formatter={(v: number) => salesViewMode === 'revenue' ? `₹${(v/1000).toFixed(0)}K` : v} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>}

      {isVisible('top-products') && <div>
        <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          Performance Insights
          <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-0.5">
            <CheckCircle2 className="w-2.5 h-2.5" /> Updated
          </Badge>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top 5 Products by Order Count */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Top 5 Products by Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topProductsByOrders.map((p, idx) => (
                  <div key={p.name} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{idx + 1}</span>
                        <span className="text-sm font-medium truncate max-w-[180px]">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground">{p.units} units</span>
                        <span className="font-semibold">{formatCurrency(p.revenue)}</span>
                      </div>
                    </div>
                    <Progress value={(p.units / maxProductUnits) * 100} className="h-2" />
                  </div>
                ))}
                {topProductsByOrders.length === 0 && <p className="text-sm text-muted-foreground">No order data available.</p>}
              </div>
            </CardContent>
          </Card>

          {/* Top 5 Brands by Revenue */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                Top 5 Brands by Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topBrandsByRevenue.map((b, idx) => (
                  <div key={b.brand} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-amber-500/10 flex items-center justify-center text-xs font-bold text-amber-600">{idx + 1}</span>
                        <span className="text-sm font-medium">{b.brand}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground">{b.units} units</span>
                        <span className="font-semibold">{formatCurrency(b.revenue)}</span>
                        <Badge variant="outline" className="text-[10px]">{b.contribution}%</Badge>
                      </div>
                    </div>
                    <Progress value={(b.revenue / maxBrandRevenue) * 100} className="h-2" />
                  </div>
                ))}
                {topBrandsByRevenue.length === 0 && <p className="text-sm text-muted-foreground">No brand data available.</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>}

      {isVisible('inventory-chart') && <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InventoryChart data={inventoryStatusData} />
        <PortalSalesChart data={portalRevenueData} />
      </div>}

      {isVisible('financial-overview') && <FinancialOverview orders={orders} settlements={settlements} expenses={expenses} invoices={invoices} />}


      {/* ═══════════════════════════════════════════════════════════════
           BLOCK 3: RETURN INSIGHTS
         ═══════════════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          Return Insights
          <Badge variant="outline" className="text-[10px] bg-rose-500/10 text-rose-600 border-rose-500/20 gap-0.5">
            <CheckCircle2 className="w-2.5 h-2.5" /> Updated
          </Badge>
        </h2>

        {/* Return KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="border-l-4 border-l-muted-foreground">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground mb-1">Total Returns</p>
              <p className="text-xl font-bold">{returnCategories.total}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground mb-1">Return Pending</p>
              <p className="text-xl font-bold text-amber-600">{returnCategories.pending}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground mb-1">Return Approved</p>
              <p className="text-xl font-bold text-emerald-600">{returnCategories.approved}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-rose-500">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground mb-1">Return Rejected</p>
              <p className="text-xl font-bold text-rose-600">{returnCategories.rejected}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground mb-1">Eligible for Claim</p>
              <p className="text-xl font-bold text-blue-600">{eligibleForClaim}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top 5 Return Products */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <PackageX className="w-4 h-4 text-rose-500" />
                Top Return Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topReturnProducts.map((p, idx) => (
                  <div key={p.name} className="flex items-center justify-between p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/10">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-rose-500/10 flex items-center justify-center text-xs font-bold text-rose-600">{idx + 1}</span>
                      <span className="text-sm font-medium truncate max-w-[120px]">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-rose-600">{p.returnCount}</span>
                      <Badge variant="outline" className="text-[10px] bg-rose-500/10 text-rose-600 border-rose-500/20">{p.returnRate}%</Badge>
                    </div>
                  </div>
                ))}
                {topReturnProducts.length === 0 && <p className="text-sm text-muted-foreground">No return data.</p>}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Return Window */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-amber-500" />
                Upcoming Return Window
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {upcomingReturns.map(r => (
                  <div key={r.orderId} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                    <div>
                      <p className="text-sm font-medium">{r.orderId}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[140px]">{r.product}</p>
                    </div>
                    <Badge variant="outline" className={`text-xs ${r.daysRemaining <= 7 ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}`}>
                      {r.daysRemaining}d left
                    </Badge>
                  </div>
                ))}
                {upcomingReturns.length === 0 && <p className="text-sm text-muted-foreground">No upcoming returns.</p>}
              </div>
            </CardContent>
          </Card>

          {/* Delivered Returns */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-500" />
                Delivered Returns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {deliveredReturns.map(r => (
                  <div key={r.orderId} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                    <div>
                      <p className="text-sm font-medium">{r.orderId}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[140px]">{r.product}</p>
                    </div>
                    <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20 capitalize">{r.status}</Badge>
                  </div>
                ))}
                {deliveredReturns.length === 0 && <p className="text-sm text-muted-foreground">No delivered returns.</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}
