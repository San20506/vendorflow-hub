import { useState, useMemo } from 'react';
import { mockOrders, portalConfigs } from '@/services/mockData';
import { Portal, Order, OrderStatus } from '@/types';
import { PortalFilter } from '@/components/dashboard/PortalFilter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Search, Download, ShoppingCart, Package, Truck, CheckCircle, Clock,
  X, Eye, Users, UserPlus, UserCheck, Star, Layers, RotateCcw, AlertTriangle,
  MapPin, Timer, ArrowDownToLine, Ban,
} from 'lucide-react';
import { DateFilter, ExportButton, useRowSelection, SelectAllCheckbox, RowCheckbox } from '@/components/TableEnhancements';

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'bg-warning/10 text-warning', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'bg-info/10 text-info', icon: CheckCircle },
  packed: { label: 'Packed', color: 'bg-accent/10 text-accent', icon: Package },
  shipped: { label: 'Shipped', color: 'bg-primary/10 text-primary', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-success/10 text-success', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-destructive/10 text-destructive', icon: X },
  returned: { label: 'Returned', color: 'bg-muted text-muted-foreground', icon: Package },
  rto: { label: 'RTO', color: 'bg-orange-500/10 text-orange-600', icon: RotateCcw },
  customer_return: { label: 'Customer Return', color: 'bg-rose-500/10 text-rose-600', icon: ArrowDownToLine },
  courier_return: { label: 'Courier Return', color: 'bg-amber-500/10 text-amber-600', icon: Ban },
};

// Portal cutoff configuration
const portalCutoffs: Record<string, { label: string; hour: number | null; description: string }> = {
  amazon: { label: 'Amazon', hour: 14, description: 'Cutoff 2:00 PM' },
  flipkart: { label: 'Flipkart', hour: 15, description: 'Cutoff 3:00 PM' },
  meesho: { label: 'Meesho', hour: 15, description: 'Cutoff 3:00 PM' },
  firstcry: { label: 'FirstCry', hour: 16, description: 'Cutoff 4:00 PM' },
  blinkit: { label: 'Blinkit', hour: null, description: 'Immediate' },
  own_website: { label: 'Website', hour: null, description: 'Immediate' },
};

function getOrderCutoffStatus(order: Order): 'within' | 'missed' | 'immediate' {
  const cutoff = portalCutoffs[order.portal];
  if (!cutoff || cutoff.hour === null) return 'immediate';
  const orderDate = new Date(order.orderDate);
  const orderHour = orderDate.getHours();
  return orderHour < cutoff.hour ? 'within' : 'missed';
}

// Compute customer intelligence from orders
function computeCustomerProfiles(orders: Order[]) {
  const map: Record<string, {
    name: string; phone: string; email: string; orderCount: number; totalSpend: number;
    lastOrderDate: string; addresses: string[]; pinCodes: string[]; cities: string[]; states: string[];
    suspicious: boolean;
  }> = {};
  orders.forEach(o => {
    if (!map[o.customerId]) {
      map[o.customerId] = {
        name: o.customerName, phone: o.customerPhone, email: o.customerEmail,
        orderCount: 0, totalSpend: 0, lastOrderDate: o.orderDate,
        addresses: [], pinCodes: [], cities: [], states: [], suspicious: false,
      };
    }
    const p = map[o.customerId];
    p.orderCount++;
    p.totalSpend += o.totalAmount;
    if (new Date(o.orderDate) > new Date(p.lastOrderDate)) p.lastOrderDate = o.orderDate;
    if (o.shippingAddress && !p.addresses.includes(o.shippingAddress)) p.addresses.push(o.shippingAddress);
    if (o.customerPinCode && !p.pinCodes.includes(o.customerPinCode)) p.pinCodes.push(o.customerPinCode);
    if (o.customerCity && !p.cities.includes(o.customerCity)) p.cities.push(o.customerCity);
    if (o.customerState && !p.states.includes(o.customerState)) p.states.push(o.customerState);
  });
  // Flag suspicious: many addresses or high return rate
  Object.values(map).forEach(p => {
    const returnOrders = orders.filter(o => o.customerId === Object.keys(map).find(k => map[k] === p) && ['returned', 'rto', 'customer_return', 'courier_return', 'cancelled'].includes(o.status));
    if (p.addresses.length >= 3 || (p.orderCount >= 3 && returnOrders.length / p.orderCount > 0.5)) {
      p.suspicious = true;
    }
  });
  return map;
}

type CustomerTypeFilter = 'all' | 'new' | 'repeat' | 'high_value';

export default function Orders() {
  const [selectedPortal, setSelectedPortal] = useState<Portal | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [customerTypeFilter, setCustomerTypeFilter] = useState<CustomerTypeFilter>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState('30days');
  const [activeTab, setActiveTab] = useState('orders');

  const customerProfiles = useMemo(() => computeCustomerProfiles(mockOrders), []);

  const getCustomerType = (customerId: string): 'new' | 'repeat' => {
    return (customerProfiles[customerId]?.orderCount ?? 0) > 1 ? 'repeat' : 'new';
  };

  const isHighValue = (customerId: string) => (customerProfiles[customerId]?.totalSpend ?? 0) >= 7000;

  const filteredOrders = useMemo(() => {
    return mockOrders.filter(order => {
      const matchesPortal = selectedPortal === 'all' || order.portal === selectedPortal;
      const matchesSearch = order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           order.portalOrderId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const custType = getCustomerType(order.customerId);
      const matchesCustomerType = customerTypeFilter === 'all' ||
        (customerTypeFilter === 'new' && custType === 'new') ||
        (customerTypeFilter === 'repeat' && custType === 'repeat') ||
        (customerTypeFilter === 'high_value' && isHighValue(order.customerId));
      
      return matchesPortal && matchesSearch && matchesStatus && matchesCustomerType;
    });
  }, [selectedPortal, searchQuery, statusFilter, customerTypeFilter, customerProfiles]);

  const rowSelection = useRowSelection(filteredOrders.map(o => o.orderId));

  // Processing dashboard stats
  const processingStats = useMemo(() => {
    const orders = selectedPortal === 'all' ? mockOrders : mockOrders.filter(o => o.portal === selectedPortal);
    const withinCutoff = orders.filter(o => ['pending', 'confirmed'].includes(o.status) && getOrderCutoffStatus(o) === 'within').length;
    const missedCutoff = orders.filter(o => ['pending', 'confirmed'].includes(o.status) && getOrderCutoffStatus(o) === 'missed').length;
    const pendingDispatch = orders.filter(o => ['confirmed', 'packed'].includes(o.status)).length;
    const rtoPending = orders.filter(o => o.status === 'rto').length;
    const total = orders.length;
    const customerReturns = orders.filter(o => o.status === 'customer_return').length;
    const courierReturns = orders.filter(o => o.status === 'courier_return').length;
    const delivered = orders.filter(o => o.status === 'delivered').length;
    const shipped = orders.filter(o => o.status === 'shipped').length;
    return { total, withinCutoff, missedCutoff, pendingDispatch, rtoPending, customerReturns, courierReturns, delivered, shipped };
  }, [selectedPortal]);

  const formatCurrency = (value: number) => `₹${value.toLocaleString()}`;
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const exportLabel = useMemo(() => {
    const parts = ['Export'];
    if (customerTypeFilter !== 'all') {
      const labels: Record<string, string> = { new: 'New Customers', repeat: 'Repeat Customers', high_value: 'High Value' };
      parts.push(labels[customerTypeFilter]);
    }
    parts.push('Orders');
    return parts.join(' ');
  }, [customerTypeFilter]);

  const selectedProfile = selectedCustomerId ? customerProfiles[selectedCustomerId] : null;

  return (
    <TooltipProvider>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Order Management</h1>
            <p className="text-muted-foreground">Manage orders across all sales channels with processing intelligence</p>
          </div>
          <div className="flex items-center gap-2">
            <ExportButton label={rowSelection.count > 0 ? undefined : exportLabel} selectedCount={rowSelection.count} />
          </div>
        </div>

        {/* Processing Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <Card className="bg-card">
            <CardContent className="p-3">
              <div className="flex flex-col items-center text-center gap-1">
                <ShoppingCart className="w-5 h-5 text-primary" />
                <p className="text-xl font-bold">{processingStats.total}</p>
                <p className="text-[11px] text-muted-foreground leading-tight">Total Orders</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-success/30">
            <CardContent className="p-3">
              <div className="flex flex-col items-center text-center gap-1">
                <Timer className="w-5 h-5 text-success" />
                <p className="text-xl font-bold text-success">{processingStats.withinCutoff}</p>
                <p className="text-[11px] text-muted-foreground leading-tight">Within Cutoff</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-destructive/30">
            <CardContent className="p-3">
              <div className="flex flex-col items-center text-center gap-1">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <p className="text-xl font-bold text-destructive">{processingStats.missedCutoff}</p>
                <p className="text-[11px] text-muted-foreground leading-tight">Missed Cutoff</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-warning/30">
            <CardContent className="p-3">
              <div className="flex flex-col items-center text-center gap-1">
                <Package className="w-5 h-5 text-warning" />
                <p className="text-xl font-bold text-warning">{processingStats.pendingDispatch}</p>
                <p className="text-[11px] text-muted-foreground leading-tight">Pending Dispatch</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-orange-500/30">
            <CardContent className="p-3">
              <div className="flex flex-col items-center text-center gap-1">
                <RotateCcw className="w-5 h-5 text-orange-500" />
                <p className="text-xl font-bold text-orange-500">{processingStats.rtoPending}</p>
                <p className="text-[11px] text-muted-foreground leading-tight">RTO Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-3">
              <div className="flex flex-col items-center text-center gap-1">
                <Truck className="w-5 h-5 text-info" />
                <p className="text-xl font-bold">{processingStats.shipped}</p>
                <p className="text-[11px] text-muted-foreground leading-tight">In Transit</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-3">
              <div className="flex flex-col items-center text-center gap-1">
                <CheckCircle className="w-5 h-5 text-success" />
                <p className="text-xl font-bold">{processingStats.delivered}</p>
                <p className="text-[11px] text-muted-foreground leading-tight">Delivered</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-rose-500/30">
            <CardContent className="p-3">
              <div className="flex flex-col items-center text-center gap-1">
                <ArrowDownToLine className="w-5 h-5 text-rose-500" />
                <p className="text-xl font-bold text-rose-500">{processingStats.customerReturns + processingStats.courierReturns}</p>
                <p className="text-[11px] text-muted-foreground leading-tight">Returns</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Portal Cutoff Reference */}
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Timer className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-muted-foreground">Portal Cutoff Times</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {Object.entries(portalCutoffs).map(([key, config]) => (
                <Badge key={key} variant="outline" className="gap-1.5 text-xs px-3 py-1">
                  {portalConfigs.find(p => p.id === key)?.icon}
                  <span className="font-medium">{config.label}:</span>
                  <span className={config.hour === null ? 'text-success' : 'text-foreground'}>{config.description}</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <PortalFilter selectedPortal={selectedPortal} onPortalChange={setSelectedPortal} />
              
              <div className="flex flex-1 flex-wrap gap-3">
                <DateFilter value={dateFilter} onChange={setDateFilter} />
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by Order ID or customer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={customerTypeFilter} onValueChange={(v) => setCustomerTypeFilter(v as CustomerTypeFilter)}>
                  <SelectTrigger className="w-[170px]">
                    <SelectValue placeholder="Customer Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Customers</SelectItem>
                    <SelectItem value="new">New Customers</SelectItem>
                    <SelectItem value="repeat">Repeat Customers</SelectItem>
                    <SelectItem value="high_value">High Value</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-10"><SelectAllCheckbox checked={rowSelection.isAllSelected} onCheckedChange={rowSelection.toggleAll} /></TableHead>
                    <TableHead className="font-semibold">Order ID</TableHead>
                    <TableHead className="font-semibold">Portal</TableHead>
                    <TableHead className="font-semibold">Customer</TableHead>
                    <TableHead className="font-semibold">Customer Type</TableHead>
                    <TableHead className="font-semibold">Order Type</TableHead>
                    <TableHead className="font-semibold">Cutoff</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold text-right">Amount</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const status = statusConfig[order.status];
                    const portal = portalConfigs.find(p => p.id === order.portal);
                    const StatusIcon = status.icon;
                    const isMulti = order.items.length > 1;
                    const custType = getCustomerType(order.customerId);
                    const cutoffStatus = getOrderCutoffStatus(order);
                    const profile = customerProfiles[order.customerId];
                    
                      return (
                        <TableRow key={order.orderId} className={`hover:bg-muted/30 ${rowSelection.isSelected(order.orderId) ? 'bg-primary/5' : ''}`}>
                          <TableCell><RowCheckbox checked={rowSelection.isSelected(order.orderId)} onCheckedChange={() => rowSelection.toggle(order.orderId)} /></TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.orderId}</p>
                            <p className="text-xs text-muted-foreground">{order.portalOrderId}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            {portal?.icon} {portal?.name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <div>
                              <button
                                className="font-medium text-primary hover:underline cursor-pointer text-left"
                                onClick={() => setSelectedCustomerId(order.customerId)}
                              >
                                {order.customerName}
                              </button>
                              <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                            </div>
                            {profile?.suspicious && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                                </TooltipTrigger>
                                <TooltipContent>Suspicious pattern detected</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {custType === 'repeat' ? (
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="secondary" className="gap-1 bg-blue-500/10 text-blue-600">
                                  <UserCheck className="w-3 h-3" />
                                  Repeat
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>Customer has placed orders before</TooltipContent>
                            </Tooltip>
                          ) : (
                            <Badge variant="secondary" className="gap-1 bg-emerald-500/10 text-emerald-600">
                              <UserPlus className="w-3 h-3" />
                              New
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {isMulti ? (
                            <div className="flex items-center gap-1.5">
                              <Badge variant="secondary" className="gap-1 bg-purple-500/10 text-purple-600">
                                <Layers className="w-3 h-3" />
                                Multi-SKU
                              </Badge>
                              <span className="text-xs text-muted-foreground">({order.items.length} SKUs)</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Single Item</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {cutoffStatus === 'within' && (
                            <Badge variant="secondary" className="gap-1 bg-success/10 text-success text-xs">
                              <Timer className="w-3 h-3" />
                              Within
                            </Badge>
                          )}
                          {cutoffStatus === 'missed' && (
                            <Badge variant="secondary" className="gap-1 bg-destructive/10 text-destructive text-xs">
                              <AlertTriangle className="w-3 h-3" />
                              Missed
                            </Badge>
                          )}
                          {cutoffStatus === 'immediate' && (
                            <Badge variant="secondary" className="gap-1 bg-info/10 text-info text-xs">
                              <CheckCircle className="w-3 h-3" />
                              Immediate
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(order.orderDate)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(order.totalAmount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`gap-1 ${status.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                            className="gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            
            {filteredOrders.length === 0 && (
              <div className="text-center py-12">
                <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No orders found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Detail Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Order Details - {selectedOrder?.orderId}
                {selectedOrder && selectedOrder.items.length > 1 && (
                  <Badge variant="secondary" className="gap-1 bg-purple-500/10 text-purple-600">
                    <Layers className="w-3 h-3" />
                    Multi-SKU ({selectedOrder.items.length})
                  </Badge>
                )}
              </DialogTitle>
            </DialogHeader>
            
            {selectedOrder && (
              <div className="space-y-6">
                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Portal Order ID</p>
                    <p className="font-medium">{selectedOrder.portalOrderId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Portal</p>
                    <Badge variant="outline" className="gap-1 mt-1">
                      {portalConfigs.find(p => p.id === selectedOrder.portal)?.icon}{' '}
                      {portalConfigs.find(p => p.id === selectedOrder.portal)?.name}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Order Date</p>
                    <p className="font-medium">{formatDate(selectedOrder.orderDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="font-bold text-lg">{formatCurrency(selectedOrder.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cutoff Status</p>
                    {(() => {
                      const cs = getOrderCutoffStatus(selectedOrder);
                      const cutoff = portalCutoffs[selectedOrder.portal];
                      return (
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className={`gap-1 text-xs ${
                            cs === 'within' ? 'bg-success/10 text-success' : cs === 'missed' ? 'bg-destructive/10 text-destructive' : 'bg-info/10 text-info'
                          }`}>
                            {cs === 'within' ? 'Within Cutoff' : cs === 'missed' ? 'Missed Cutoff' : 'Immediate'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{cutoff?.description}</span>
                        </div>
                      );
                    })()}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Order Type</p>
                    <p className="font-medium">{selectedOrder.items.length > 1 ? 'Multi-SKU Order' : 'Single Order'}</p>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    Customer Information
                    {customerProfiles[selectedOrder.customerId]?.suspicious && (
                      <Badge variant="destructive" className="gap-1 text-xs">
                        <AlertTriangle className="w-3 h-3" />
                        Suspicious
                      </Badge>
                    )}
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Name</p>
                      <p className="font-medium">{selectedOrder.customerName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Phone</p>
                      <p className="font-medium">{selectedOrder.customerPhone}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Shipping Address</p>
                      <p className="font-medium">{selectedOrder.shippingAddress}</p>
                    </div>
                    {selectedOrder.customerCity && (
                      <div>
                        <p className="text-muted-foreground">City</p>
                        <p className="font-medium">{selectedOrder.customerCity}, {selectedOrder.customerState}</p>
                      </div>
                    )}
                    {selectedOrder.customerPinCode && (
                      <div>
                        <p className="text-muted-foreground">Pin Code</p>
                        <p className="font-medium">{selectedOrder.customerPinCode}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Items with Master SKU */}
                <div>
                  <h4 className="font-semibold mb-3">Order Items ({selectedOrder.items.length} SKU{selectedOrder.items.length > 1 ? 's' : ''})</h4>
                  <div className="overflow-x-auto border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-semibold text-xs">SKU ID</TableHead>
                          <TableHead className="font-semibold text-xs">Product</TableHead>
                          <TableHead className="font-semibold text-xs">Brand</TableHead>
                          <TableHead className="font-semibold text-xs text-center">Qty</TableHead>
                          <TableHead className="font-semibold text-xs text-right">Price</TableHead>
                          <TableHead className="font-semibold text-xs text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <div>
                                <p className="text-xs font-mono font-medium">{item.skuId}</p>
                                <p className="text-[10px] text-muted-foreground">Master: {item.skuId.replace(/^SKU-[A-Z]{3}-/, 'MSKU-')}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm font-medium">{item.productName}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">{item.brand}</Badge>
                            </TableCell>
                            <TableCell className="text-center font-medium">{item.quantity}</TableCell>
                            <TableCell className="text-right text-sm">{formatCurrency(item.price)}</TableCell>
                            <TableCell className="text-right font-medium text-sm">{formatCurrency(item.price * item.quantity)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Status Timeline */}
                <div>
                  <h4 className="font-semibold mb-3">Status Timeline</h4>
                  <div className="space-y-3">
                    {selectedOrder.statusTimeline.map((event, index) => {
                      const config = statusConfig[event.status];
                      const Icon = config.icon;
                      return (
                        <div key={index} className="flex items-start gap-3">
                          <div className={`p-1.5 rounded-full ${config.color}`}>
                            <Icon className="w-3 h-3" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm">{config.label}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(event.timestamp).toLocaleString('en-IN')}
                              </p>
                            </div>
                            {event.note && (
                              <p className="text-sm text-muted-foreground">{event.note}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Customer Profile Modal */}
        <Dialog open={!!selectedCustomerId} onOpenChange={() => setSelectedCustomerId(null)}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Customer Profile
              </DialogTitle>
            </DialogHeader>
            {selectedProfile && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                    {selectedProfile.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{selectedProfile.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedProfile.email}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedProfile.orderCount > 1 && (
                    <Badge variant="secondary" className="gap-1 bg-blue-500/10 text-blue-600">
                      <UserCheck className="w-3 h-3" />
                      Repeat Customer
                    </Badge>
                  )}
                  {isHighValue(selectedCustomerId!) && (
                    <Badge variant="secondary" className="gap-1 bg-amber-500/10 text-amber-600">
                      <Star className="w-3 h-3" />
                      High Value Customer
                    </Badge>
                  )}
                  {selectedProfile.orderCount >= 3 && (
                    <Badge variant="secondary" className="gap-1 bg-purple-500/10 text-purple-600">
                      <ShoppingCart className="w-3 h-3" />
                      Frequent Buyer
                    </Badge>
                  )}
                  {selectedProfile.suspicious && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Suspicious Pattern
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{selectedProfile.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Orders</p>
                    <p className="font-bold text-lg">{selectedProfile.orderCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Spend</p>
                    <p className="font-bold text-lg">{formatCurrency(selectedProfile.totalSpend)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Order</p>
                    <p className="font-medium">{formatDate(selectedProfile.lastOrderDate)}</p>
                  </div>
                </div>

                {/* Address & Location */}
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-semibold mb-3 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    Address Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    {selectedProfile.cities.length > 0 && (
                      <div>
                        <p className="text-muted-foreground">Cities</p>
                        <p className="font-medium">{selectedProfile.cities.join(', ')}</p>
                      </div>
                    )}
                    {selectedProfile.states.length > 0 && (
                      <div>
                        <p className="text-muted-foreground">States</p>
                        <p className="font-medium">{selectedProfile.states.join(', ')}</p>
                      </div>
                    )}
                    {selectedProfile.pinCodes.length > 0 && (
                      <div>
                        <p className="text-muted-foreground">Pin Codes</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedProfile.pinCodes.map(pin => (
                            <Badge key={pin} variant="outline" className="text-xs">{pin}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedProfile.addresses.length > 1 && (
                      <div>
                        <p className="text-muted-foreground">Shipping Addresses ({selectedProfile.addresses.length})</p>
                        {selectedProfile.addresses.map((addr, i) => (
                          <p key={i} className="font-medium text-xs mt-1">{addr}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
