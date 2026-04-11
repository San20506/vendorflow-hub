import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Portal } from '@/types';
import { dashboardApi } from '@/services/api';
import { mockKPIData, mockSalesData, mockInventory, mockOrders, mockReturns, mockSettlements, mockConsolidatedOrders, portalConfigs } from '@/services/mockData';
import { KPICard } from '@/components/dashboard/KPICard';
import { PortalFilter } from '@/components/dashboard/PortalFilter';
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
  Clock,
  Star,
  Users,
  UserPlus,
  UserCheck,
  Percent,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedPortal, setSelectedPortal] = useState<Portal | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading state
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Aggregate sales data for chart
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

  // Returns data for bar chart
  const returnsChartData = useMemo(() => {
    return [
      { date: 'Week 1', returns: 12, claims: 8 },
      { date: 'Week 2', returns: 15, claims: 11 },
      { date: 'Week 3', returns: 18, claims: 14 },
      { date: 'Week 4', returns: 22, claims: 16 },
    ];
  }, []);

  // Portal revenue data
  const portalRevenueData = useMemo(() => {
    return portalConfigs.map(portal => {
      const revenue = mockSalesData
        .filter(d => d.portal === portal.id)
        .reduce((sum, d) => sum + d.revenue, 0);
      return { portal: portal.name, revenue };
    }).sort((a, b) => b.revenue - a.revenue);
  }, []);

  // Recent orders
  const recentOrders = mockOrders.slice(0, 5);

  // Brand analytics
  const brandAnalytics = useMemo(() => {
    const brandOrders: Record<string, number> = {};
    mockConsolidatedOrders.forEach(row => {
      brandOrders[row.brand] = (brandOrders[row.brand] || 0) + row.total;
    });
    const growthMap: Record<string, number> = {
      'Boat': 12.4,
      'Samsung': 8.7,
      'Nike': -4.2,
      'Puma': 15.1,
      'Mamaearth': 6.3,
      'Sony': -1.8,
      'Apple': 22.5,
    };
    return Object.entries(brandOrders)
      .map(([brand, orders]) => ({
        brand,
        orders,
        growth: growthMap[brand] ?? Math.round((Math.random() - 0.3) * 20 * 10) / 10,
      }))
      .sort((a, b) => b.orders - a.orders);
  }, []);

  // Customer intelligence metrics
  const customerMetrics = useMemo(() => {
    const customerMap: Record<string, number> = {};
    mockOrders.forEach(o => {
      customerMap[o.customerId] = (customerMap[o.customerId] || 0) + 1;
    });
    const totalCustomers = Object.keys(customerMap).length;
    const repeatCustomers = Object.values(customerMap).filter(c => c > 1).length;
    const newCustomers = totalCustomers - repeatCustomers;
    const repeatRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;
    return { newCustomers, repeatCustomers, repeatRate };
  }, []);
  // Get KPIs based on selected portal
  const kpiData = useMemo(() => {
    if (selectedPortal === 'all') return mockKPIData;
    
    // Calculate portal-specific KPIs
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
      salesGrowth: 8.2,
      ordersGrowth: 5.4,
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
            <Badge variant="outline" className="text-xs font-mono">VendorFlow v1.0</Badge>
          </div>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}! Here's your business overview.
          </p>
        </div>
        <PortalFilter 
          selectedPortal={selectedPortal} 
          onPortalChange={setSelectedPortal} 
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          title="Total Sales"
          value={formatCurrency(kpiData.totalSales)}
          icon={DollarSign}
          change={kpiData.salesGrowth}
          variant="success"
        />
        <KPICard
          title="Orders Today"
          value={kpiData.ordersToday}
          icon={ShoppingCart}
          change={kpiData.ordersGrowth}
        />
        <KPICard
          title="Inventory Value"
          value={formatCurrency(kpiData.inventoryValue)}
          icon={Package}
        />
        <KPICard
          title="Low Stock Items"
          value={kpiData.lowStockItems}
          icon={AlertTriangle}
          variant={kpiData.lowStockItems > 10 ? 'warning' : 'default'}
        />
        <KPICard
          title="Pending Returns"
          value={kpiData.pendingReturns}
          icon={RotateCcw}
          variant={kpiData.pendingReturns > 20 ? 'warning' : 'default'}
        />
        <KPICard
          title="Pending Settlements"
          value={kpiData.pendingSettlements}
          icon={CreditCard}
          variant={kpiData.pendingSettlements > 5 ? 'danger' : 'default'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesChart data={salesChartData} />
        <InventoryChart data={inventoryStatusData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReturnsChart data={returnsChartData} />
        <PortalSalesChart data={portalRevenueData} />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Recent Orders</CardTitle>
            <a href="/orders" className="text-sm text-accent hover:underline">View all</a>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div 
                  key={order.orderId} 
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
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
                    <Badge 
                      variant="secondary" 
                      className={`text-xs capitalize ${
                        order.status === 'delivered' ? 'bg-success/10 text-success' :
                        order.status === 'shipped' ? 'bg-info/10 text-info' :
                        order.status === 'pending' ? 'bg-warning/10 text-warning' :
                        ''
                      }`}
                    >
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
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
                  <div 
                    key={item.skuId} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        item.availableQuantity === 0 ? 'bg-destructive/10' : 'bg-warning/10'
                      }`}>
                        <AlertTriangle className={`w-5 h-5 ${
                          item.availableQuantity === 0 ? 'text-destructive' : 'text-warning'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-sm truncate max-w-[180px]">{item.productName}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs capitalize">
                            {portalConfigs.find(p => p.id === item.portal)?.icon} {item.portal}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className={`font-bold text-lg ${
                         item.availableQuantity === 0 ? 'text-destructive' : 'text-warning'
                       }`}>
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
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Customer Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted/30 text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <UserPlus className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
              <p className="text-2xl font-bold">{customerMetrics.newCustomers}</p>
              <p className="text-sm text-muted-foreground">New Customers</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <p className="text-2xl font-bold">{customerMetrics.repeatCustomers}</p>
              <p className="text-sm text-muted-foreground">Repeat Customers</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Percent className="w-5 h-5 text-primary" />
                </div>
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
              <div 
                key={item.brand}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{item.brand}</p>
                    <p className="text-xs text-muted-foreground">{item.orders} orders</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.growth >= 0 ? (
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 gap-0.5 text-xs">
                      <TrendingUp className="w-3 h-3" />
                      +{item.growth}%
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-rose-500/10 text-rose-600 gap-0.5 text-xs">
                      <TrendingDown className="w-3 h-3" />
                      {item.growth}%
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
