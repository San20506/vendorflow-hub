import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrders } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/useProducts';
import { useSettlements } from '@/hooks/useSettlements';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  TrendingUp, TrendingDown, IndianRupee, ShoppingCart, Package,
  BarChart3, Clock, AlertTriangle,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList,
} from 'recharts';

const fmt = (n: number) => '₹' + n.toLocaleString('en-IN');

const CHART_COLORS = {
  success: 'hsl(var(--chart-1))',
  warning: 'hsl(var(--chart-2))',
  info: 'hsl(var(--chart-3))',
  accent: 'hsl(var(--chart-4))',
  secondary: 'hsl(var(--chart-5))',
};

export default function Insights() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('7days');

  // Fetch real data from Supabase
  const vendorId = user?.id || null;
  const { data: orders = [], isLoading: isLoadingOrders } = useOrders(vendorId);
  const { data: products = [], isLoading: isLoadingProducts } = useProducts(vendorId);
  const { data: settlements = [], isLoading: isLoadingSettlements } = useSettlements(vendorId);

  const isLoading = isLoadingOrders || isLoadingProducts || isLoadingSettlements;

  // Calculate metrics from real data
  const metrics = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const totalOrders = orders.length;
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
    const deliveryRate = totalOrders > 0 ? ((deliveredOrders / totalOrders) * 100).toFixed(1) : '0';
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const activeProducts = products.filter(p => p.stock > 0).length;
    const totalSettlements = settlements.reduce((sum, s) => sum + (s.net_amount || 0), 0);
    const pendingSettlements = settlements.filter(s => s.status === 'pending').length;

    return {
      totalRevenue,
      totalOrders,
      deliveryRate,
      avgOrderValue,
      activeProducts,
      totalSettlements,
      pendingSettlements,
    };
  }, [orders, products, settlements]);

  // Generate daily sales data from orders
  const dailySalesData = useMemo(() => {
    const grouped: Record<string, { date: string; revenue: number; orders: number }> = {};

    orders.forEach(order => {
      const date = new Date(order.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      if (!grouped[date]) {
        grouped[date] = { date, revenue: 0, orders: 0 };
      }
      grouped[date].revenue += order.total_amount || 0;
      grouped[date].orders += 1;
    });

    return Object.values(grouped).slice(-10);
  }, [orders]);

  // Generate order status breakdown
  const statusBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    orders.forEach(o => {
      if (breakdown.hasOwnProperty(o.status)) {
        breakdown[o.status] += 1;
      }
    });

    return Object.entries(breakdown).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      color: CHART_COLORS[status as keyof typeof CHART_COLORS] || CHART_COLORS.secondary,
    }));
  }, [orders]);

  // Top products by order count
  const topProducts = useMemo(() => {
    const productOrders: Record<string, { name: string; count: number; revenue: number }> = {};

    orders.forEach(order => {
      const productId = order.product_id;
      const product = products.find(p => p.product_id === productId);
      const productName = product?.name || 'Unknown';

      if (!productOrders[productId]) {
        productOrders[productId] = { name: productName, count: 0, revenue: 0 };
      }
      productOrders[productId].count += 1;
      productOrders[productId].revenue += order.total_amount || 0;
    });

    return Object.values(productOrders)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [orders, products]);

  // Settlement status breakdown
  const settlementStatus = useMemo(() => {
    const pending = settlements.filter(s => s.status === 'pending').reduce((sum, s) => sum + (s.net_amount || 0), 0);
    const processed = settlements.filter(s => s.status === 'processed').reduce((sum, s) => sum + (s.net_amount || 0), 0);

    return [
      { name: 'Pending', value: pending, color: CHART_COLORS.warning },
      { name: 'Processed', value: processed, color: CHART_COLORS.success },
    ];
  }, [settlements]);

  if (!user) {
    return <div className="p-6 text-center">Please log in to view insights</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics & Insights</h1>
          <p className="text-muted-foreground mt-1">Real-time business metrics and performance data</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Last 7 days</SelectItem>
            <SelectItem value="30days">Last 30 days</SelectItem>
            <SelectItem value="90days">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <IndianRupee className="w-4 h-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(metrics.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">From {metrics.totalOrders} orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Avg Order Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(metrics.avgOrderValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">Per order</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="w-4 h-4" />
              Delivery Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.deliveryRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">{metrics.deliveredOrders} of {metrics.totalOrders} delivered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending Settlements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(metrics.totalSettlements)}</div>
            <p className="text-xs text-muted-foreground mt-1">{metrics.pendingSettlements} pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue Trend</CardTitle>
            <CardDescription>Daily revenue over time</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-80 flex items-center justify-center text-muted-foreground">Loading...</div>
            ) : dailySalesData.length === 0 ? (
              <div className="h-80 flex items-center justify-center text-muted-foreground">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailySalesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => fmt(value as number)} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke={CHART_COLORS.success}
                    dot={false}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Order Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Status Breakdown</CardTitle>
            <CardDescription>Distribution of orders by status</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-80 flex items-center justify-center text-muted-foreground">Loading...</div>
            ) : statusBreakdown.length === 0 ? (
              <div className="h-80 flex items-center justify-center text-muted-foreground">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Products</CardTitle>
            <CardDescription>Products by order count</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : topProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No products yet</div>
            ) : (
              <div className="space-y-4">
                {topProducts.map((product, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.count} orders</p>
                    </div>
                    <p className="font-semibold">{fmt(product.revenue)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settlement Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Settlement Status</CardTitle>
            <CardDescription>Amount by settlement status</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-80 flex items-center justify-center text-muted-foreground">Loading...</div>
            ) : settlementStatus.length === 0 ? (
              <div className="h-80 flex items-center justify-center text-muted-foreground">No settlements yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={settlementStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => fmt(value as number)} />
                  <Bar dataKey="value" fill={CHART_COLORS.success} radius={[8, 8, 0, 0]}>
                    {settlementStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
