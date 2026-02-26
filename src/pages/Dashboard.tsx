import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Portal } from '@/types';
import { dashboardApi } from '@/services/api';
import { mockKPIData, mockSalesData, mockInventory, mockOrders, mockReturns, mockSettlements, mockConsolidatedOrders, portalConfigs } from '@/services/mockData';
import { KPICard } from '@/components/dashboard/KPICard';
import { SalesChart, InventoryChart, ReturnsChart, PortalSalesChart, CHART_COLORS } from '@/components/dashboard/Charts';
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  AlertTriangle, 
  RotateCcw, 
  CreditCard,
  TrendingUp,
  TrendingDown,
  Star,
  Users,
  UserPlus,
  UserCheck,
  Percent,
  Plus,
  ShieldCheck,
  ShieldAlert,
  Hash,
  UserX,
  CheckCircle2,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList,
} from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedPortal, setSelectedPortal] = useState<Portal | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [salesViewMode, setSalesViewMode] = useState<'revenue' | 'units'>('revenue');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Aggregate sales data for chart with units
  const salesChartData = useMemo(() => {
    const grouped: Record<string, { date: string; revenue: number; orders: number }> = {};
    
    mockSalesData
      .filter(d => selectedPortal === 'all' || d.portal === selectedPortal)
      .forEach(d => {
        const dateKey = new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!grouped[dateKey]) {
          grouped[dateKey] = { date: dateKey, revenue: 0, orders: 0 };
        }
        grouped[dateKey].revenue += d.revenue;
        grouped[dateKey].orders += d.orders;
      });

    return Object.values(grouped).slice(-10);
  }, [selectedPortal]);

  // Total units sold
  const totalUnitsSold = useMemo(() => {
    return mockSalesData
      .filter(d => selectedPortal === 'all' || d.portal === selectedPortal)
      .reduce((sum, d) => sum + d.orders, 0);
  }, [selectedPortal]);

  // Duplicate customers (same email/phone with >1 order)
  const duplicateCustomerCount = useMemo(() => {
    const customerMap: Record<string, number> = {};
    mockOrders.forEach(o => {
      const key = o.customerEmail || o.customerId;
      customerMap[key] = (customerMap[key] || 0) + 1;
    });
    return Object.values(customerMap).filter(c => c > 1).length;
  }, []);

  // Top 5 products by revenue with return rate
  const topProducts = useMemo(() => {
    const productRevenue: Record<string, { name: string; revenue: number; units: number; returns: number }> = {};
    mockOrders.forEach(o => {
      o.items.forEach(item => {
        if (!productRevenue[item.productName]) {
          productRevenue[item.productName] = { name: item.productName, revenue: 0, units: 0, returns: 0 };
        }
        productRevenue[item.productName].revenue += item.price * item.quantity;
        productRevenue[item.productName].units += item.quantity;
      });
    });
    mockReturns.forEach(r => {
      const order = mockOrders.find(o => o.orderId === r.orderId);
      if (order) {
        order.items.forEach(item => {
          if (productRevenue[item.productName]) {
            productRevenue[item.productName].returns += 1;
          }
        });
      }
    });
    return Object.values(productRevenue)
      .map(p => ({ ...p, returnRate: p.units > 0 ? +((p.returns / p.units) * 100).toFixed(1) : 0 }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, []);

  // Inventory status for pie chart
  const inventoryStatusData = useMemo(() => {
    const items = selectedPortal === 'all' 
      ? mockInventory 
      : mockInventory.filter(i => i.portal === selectedPortal);
    
    const healthy = items.filter(i => i.availableQuantity > i.lowStockThreshold).length;
    const low = items.filter(i => i.availableQuantity <= i.lowStockThreshold && i.availableQuantity > 0).length;
    const out = items.filter(i => i.availableQuantity === 0).length;

    return [
      { name: 'Healthy', value: healthy, color: CHART_COLORS.success },
      { name: 'Low Stock', value: low, color: CHART_COLORS.warning },
      { name: 'Out of Stock', value: out, color: CHART_COLORS.destructive },
    ];
  }, [selectedPortal]);

  const returnsChartData = useMemo(() => {
    return [
      { date: 'Week 1', returns: 12, claims: 8 },
      { date: 'Week 2', returns: 15, claims: 11 },
      { date: 'Week 3', returns: 18, claims: 14 },
      { date: 'Week 4', returns: 22, claims: 16 },
    ];
  }, []);

  const portalRevenueData = useMemo(() => {
    return portalConfigs.map(portal => {
      const revenue = mockSalesData
        .filter(d => d.portal === portal.id)
        .reduce((sum, d) => sum + d.revenue, 0);
      return { portal: portal.name, revenue };
    }).sort((a, b) => b.revenue - a.revenue);
  }, []);

  const recentOrders = mockOrders.slice(0, 5);

  const brandAnalytics = useMemo(() => {
    const brandOrders: Record<string, number> = {};
    mockConsolidatedOrders.forEach(row => {
      brandOrders[row.brand] = (brandOrders[row.brand] || 0) + row.total;
    });
    const growthMap: Record<string, number> = {
      'Boat': 12.4, 'Samsung': 8.7, 'Nike': -4.2, 'Puma': 15.1, 'Mamaearth': 6.3, 'Sony': -1.8, 'Apple': 22.5,
    };
    return Object.entries(brandOrders)
      .map(([brand, orders]) => ({
        brand, orders,
        growth: growthMap[brand] ?? Math.round((Math.random() - 0.3) * 20 * 10) / 10,
      }))
      .sort((a, b) => b.orders - a.orders);
  }, []);

  const customerMetrics = useMemo(() => {
    const customerMap: Record<string, number> = {};
    mockOrders.forEach(o => { customerMap[o.customerId] = (customerMap[o.customerId] || 0) + 1; });
    const totalCustomers = Object.keys(customerMap).length;
    const repeatCustomers = Object.values(customerMap).filter(c => c > 1).length;
    const newCustomers = totalCustomers - repeatCustomers;
    const repeatRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;
    return { newCustomers, repeatCustomers, repeatRate };
  }, []);

  const kpiData = useMemo(() => {
    if (selectedPortal === 'all') return mockKPIData;
    const portalOrders = mockOrders.filter(o => o.portal === selectedPortal);
    const portalInventory = mockInventory.filter(i => i.portal === selectedPortal);
    const portalReturns = mockReturns.filter(r => r.portal === selectedPortal);
    const portalSettlements = mockSettlements.filter(s => s.portal === selectedPortal);
    return {
      totalSales: portalOrders.reduce((sum, o) => sum + o.totalAmount, 0),
      ordersToday: portalOrders.filter(o => new Date(o.orderDate).toDateString() === new Date().toDateString()).length,
      inventoryValue: portalInventory.reduce((sum, i) => sum + (i.availableQuantity * 500), 0),
      lowStockItems: portalInventory.filter(i => i.availableQuantity <= i.lowStockThreshold).length,
      pendingReturns: portalReturns.filter(r => r.status === 'pending').length,
      pendingSettlements: portalSettlements.filter(s => s.status === 'pending').length,
      salesGrowth: 8.2, ordersGrowth: 5.4,
    };
  }, [selectedPortal]);

  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${value}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          </div>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}! Here's your business overview.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* AI Mode Indicators */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-500/30 bg-blue-500/5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-xs font-medium text-blue-600">AI Suggestion</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-medium text-amber-600">Human Approval</span>
            </div>
          </div>
          <Badge variant="outline" className="text-xs font-mono">VendorFlow v1.2</Badge>
        </div>
      </div>

      {/* Channel Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={selectedPortal} onValueChange={(v) => setSelectedPortal(v as Portal | 'all')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Channels</SelectItem>
            {portalConfigs.map(p => (
              <SelectItem key={p.id} value={p.id}>
                <span className="flex items-center gap-2">{p.icon} {p.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="gap-1.5 text-muted-foreground">
          <Plus className="w-3.5 h-3.5" />
          Add Channel
        </Button>
      </div>

      {/* KPI Cards - Extended */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        <KPICard title="Total Sales" value={formatCurrency(kpiData.totalSales)} icon={DollarSign} change={kpiData.salesGrowth} variant="success" />
        <KPICard title="Orders Today" value={kpiData.ordersToday} icon={ShoppingCart} change={kpiData.ordersGrowth} />
        <KPICard title="Inventory Value" value={formatCurrency(kpiData.inventoryValue)} icon={Package} />
        <KPICard title="Low Stock Items" value={kpiData.lowStockItems} icon={AlertTriangle} variant={kpiData.lowStockItems > 10 ? 'warning' : 'default'} />
        <KPICard title="Pending Returns" value={kpiData.pendingReturns} icon={RotateCcw} variant={kpiData.pendingReturns > 20 ? 'warning' : 'default'} />
        <KPICard title="Pending Settlements" value={kpiData.pendingSettlements} icon={CreditCard} variant={kpiData.pendingSettlements > 5 ? 'danger' : 'default'} />
        <KPICard title="Total Units Sold" value={totalUnitsSold} icon={Hash} variant="success" />
        <KPICard title="Duplicate Customers" value={duplicateCustomerCount} icon={UserX} variant={duplicateCustomerCount > 0 ? 'warning' : 'default'} />
      </div>

      {/* Sales Trend with Toggle */}
      <Card>
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
          <ResponsiveContainer width="100%" height={280}>
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
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InventoryChart data={inventoryStatusData} />
        <PortalSalesChart data={portalRevenueData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReturnsChart data={returnsChartData} />

        {/* Top 5 Products by Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Top 5 Products by Revenue
              </CardTitle>
              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-0.5">
                <CheckCircle2 className="w-2.5 h-2.5" /> Updated
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topProducts.map((p, idx) => (
                <div key={p.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.units} units sold</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-sm">{formatCurrency(p.revenue)}</p>
                    <Badge variant="outline" className={`text-xs ${p.returnRate > 5 ? 'bg-rose-500/10 text-rose-600 border-rose-500/30' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'}`}>
                      {p.returnRate}% return
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Recent Orders</CardTitle>
            <a href="/orders" className="text-sm text-accent hover:underline">View all</a>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.orderId} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{order.orderId}</p>
                      <p className="text-xs text-muted-foreground">{order.customerName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{formatCurrency(order.totalAmount)}</p>
                    <Badge variant="secondary" className={`text-xs capitalize ${
                      order.status === 'delivered' ? 'bg-success/10 text-success' :
                      order.status === 'shipped' ? 'bg-info/10 text-info' :
                      order.status === 'pending' ? 'bg-warning/10 text-warning' : ''
                    }`}>{order.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Low Stock Alerts</CardTitle>
            <a href="/inventory" className="text-sm text-accent hover:underline">View all</a>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockInventory
                .filter(i => i.availableQuantity <= i.lowStockThreshold)
                .slice(0, 5)
                .map((item) => (
                  <div key={item.skuId} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.availableQuantity === 0 ? 'bg-destructive/10' : 'bg-warning/10'}`}>
                        <AlertTriangle className={`w-5 h-5 ${item.availableQuantity === 0 ? 'text-destructive' : 'text-warning'}`} />
                      </div>
                      <div>
                        <p className="font-medium text-sm truncate max-w-[180px]">{item.productName}</p>
                        <Badge variant="outline" className="text-xs capitalize">
                          {portalConfigs.find(p => p.id === item.portal)?.icon} {item.portal}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-lg ${item.availableQuantity === 0 ? 'text-destructive' : 'text-warning'}`}>
                        {item.availableQuantity}
                      </p>
                      <p className="text-xs text-muted-foreground">units left</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Insights */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Customer Insights
            </CardTitle>
            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-0.5">
              <CheckCircle2 className="w-2.5 h-2.5" /> Updated
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted/30 text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 rounded-lg bg-emerald-500/10"><UserPlus className="w-5 h-5 text-emerald-600" /></div>
              </div>
              <p className="text-2xl font-bold">{customerMetrics.newCustomers}</p>
              <p className="text-sm text-muted-foreground">New Customers</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 rounded-lg bg-blue-500/10"><UserCheck className="w-5 h-5 text-blue-600" /></div>
              </div>
              <p className="text-2xl font-bold">{customerMetrics.repeatCustomers}</p>
              <p className="text-sm text-muted-foreground">Repeat Customers</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 rounded-lg bg-primary/10"><Percent className="w-5 h-5 text-primary" /></div>
              </div>
              <p className="text-2xl font-bold">{customerMetrics.repeatRate}%</p>
              <p className="text-sm text-muted-foreground">Repeat Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brand Analytics */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            Top Performing Brands
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {brandAnalytics.map((item, index) => (
              <div key={item.brand} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{index + 1}</div>
                  <div>
                    <p className="font-medium text-sm">{item.brand}</p>
                    <p className="text-xs text-muted-foreground">{item.orders} orders</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.growth >= 0 ? (
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 gap-0.5 text-xs">
                      <TrendingUp className="w-3 h-3" />+{item.growth}%
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-rose-500/10 text-rose-600 gap-0.5 text-xs">
                      <TrendingDown className="w-3 h-3" />{item.growth}%
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
