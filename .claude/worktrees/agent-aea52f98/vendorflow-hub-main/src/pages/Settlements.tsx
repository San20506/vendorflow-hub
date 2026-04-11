import { useState, useMemo } from 'react';
import { mockSettlements, portalConfigs } from '@/services/mockData';
import { Portal, SettlementStatus } from '@/types';
import { PortalFilter } from '@/components/dashboard/PortalFilter';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, CheckCircle, Clock, AlertTriangle, TrendingUp, Percent } from 'lucide-react';
import { DateFilter, ExportButton, useRowSelection, SelectAllCheckbox, RowCheckbox } from '@/components/TableEnhancements';
import OrderPaymentSettlement from '@/components/settlements/OrderPaymentSettlement';
import LandingCostAnalysis from '@/components/settlements/LandingCostAnalysis';

const settlementStatusConfig: Record<SettlementStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'bg-warning/10 text-warning', icon: Clock },
  completed: { label: 'Completed', color: 'bg-success/10 text-success', icon: CheckCircle },
  delayed: { label: 'Delayed', color: 'bg-destructive/10 text-destructive', icon: AlertTriangle },
};

// Mock individual order settlements
const mockOrderSettlements = [
  { orderId: 'ORD-2024-001', portal: 'amazon' as Portal, amount: 2999, fees: 150, commission: 450, net: 2399, status: 'completed' as SettlementStatus },
  { orderId: 'ORD-2024-002', portal: 'flipkart' as Portal, amount: 4197, fees: 210, commission: 630, net: 3357, status: 'completed' as SettlementStatus },
  { orderId: 'ORD-2024-003', portal: 'meesho' as Portal, amount: 4999, fees: 250, commission: 750, net: 3999, status: 'pending' as SettlementStatus },
  { orderId: 'ORD-2024-004', portal: 'firstcry' as Portal, amount: 2598, fees: 130, commission: 390, net: 2078, status: 'pending' as SettlementStatus },
  { orderId: 'ORD-2024-005', portal: 'blinkit' as Portal, amount: 2397, fees: 120, commission: 360, net: 1917, status: 'delayed' as SettlementStatus },
  { orderId: 'ORD-2024-006', portal: 'amazon' as Portal, amount: 2598, fees: 130, commission: 390, net: 2078, status: 'pending' as SettlementStatus },
  { orderId: 'ORD-2024-007', portal: 'amazon' as Portal, amount: 8796, fees: 440, commission: 1319, net: 7037, status: 'completed' as SettlementStatus },
  { orderId: 'ORD-2024-008', portal: 'flipkart' as Portal, amount: 5998, fees: 300, commission: 900, net: 4798, status: 'pending' as SettlementStatus },
];

export default function Settlements() {
  const [selectedPortal, setSelectedPortal] = useState<Portal | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('30days');
  const [viewTab, setViewTab] = useState('batch');

  const filteredSettlements = useMemo(() => {
    return mockSettlements.filter(settlement => {
      const matchesPortal = selectedPortal === 'all' || settlement.portal === selectedPortal;
      const matchesStatus = statusFilter === 'all' || settlement.status === statusFilter;
      return matchesPortal && matchesStatus;
    });
  }, [selectedPortal, statusFilter]);

  const filteredOrderSettlements = useMemo(() => {
    return mockOrderSettlements.filter(s => {
      const matchesPortal = selectedPortal === 'all' || s.portal === selectedPortal;
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchesPortal && matchesStatus;
    });
  }, [selectedPortal, statusFilter]);

  const batchRowSelection = useRowSelection(filteredSettlements.map(s => s.settlementId));
  const orderRowSelection = useRowSelection(filteredOrderSettlements.map(s => s.orderId));

  const stats = useMemo(() => {
    const settlements = selectedPortal === 'all' ? mockSettlements : mockSettlements.filter(s => s.portal === selectedPortal);
    const totalAmount = settlements.reduce((sum, s) => sum + s.amount, 0);
    const totalNet = settlements.reduce((sum, s) => sum + s.netAmount, 0);
    const totalCommission = settlements.reduce((sum, s) => sum + s.commission, 0);
    return {
      totalAmount, totalNet, totalCommission,
      pending: settlements.filter(s => s.status === 'pending').reduce((sum, s) => sum + s.netAmount, 0),
      delayed: settlements.filter(s => s.status === 'delayed').length,
    };
  }, [selectedPortal]);

  const formatCurrency = (value: number) => {
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${value.toLocaleString()}`;
  };
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const dateLabel = dateFilter === 'today' ? 'Today' : dateFilter === '7days' ? 'Last 7 Days' : dateFilter === '30days' ? 'Last 30 Days' : dateFilter === 'this_month' ? 'This Month' : dateFilter === 'this_year' ? 'This Year' : 'Custom';
  const activeSelection = viewTab === 'batch' ? batchRowSelection : orderRowSelection;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payments & Settlements</h1>
          <p className="text-muted-foreground">Track portal-wise settlements and payment cycles</p>
        </div>
        <ExportButton label={activeSelection.count > 0 ? undefined : `Export – ${dateLabel}`} selectedCount={activeSelection.count} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-card"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><CreditCard className="w-5 h-5 text-primary" /></div><div><p className="text-xl font-bold">{formatCurrency(stats.totalAmount)}</p><p className="text-xs text-muted-foreground">Gross Amount</p></div></div></CardContent></Card>
        <Card className="bg-card"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-success/10"><TrendingUp className="w-5 h-5 text-success" /></div><div><p className="text-xl font-bold">{formatCurrency(stats.totalNet)}</p><p className="text-xs text-muted-foreground">Net Amount</p></div></div></CardContent></Card>
        <Card className="bg-card"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-accent/10"><Percent className="w-5 h-5 text-accent" /></div><div><p className="text-xl font-bold">{formatCurrency(stats.totalCommission)}</p><p className="text-xs text-muted-foreground">Commission</p></div></div></CardContent></Card>
        <Card className="bg-card"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-warning/10"><Clock className="w-5 h-5 text-warning" /></div><div><p className="text-xl font-bold">{formatCurrency(stats.pending)}</p><p className="text-xs text-muted-foreground">Pending</p></div></div></CardContent></Card>
        <Card className="bg-card"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-destructive/10"><AlertTriangle className="w-5 h-5 text-destructive" /></div><div><p className="text-xl font-bold">{stats.delayed}</p><p className="text-xs text-muted-foreground">Delayed</p></div></div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <PortalFilter selectedPortal={selectedPortal} onPortalChange={setSelectedPortal} />
            <DateFilter value={dateFilter} onChange={setDateFilter} />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(settlementStatusConfig).map(([key, config]) => (<SelectItem key={key} value={key}>{config.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs value={viewTab} onValueChange={setViewTab}>
        <TabsList>
          <TabsTrigger value="batch">Batch Settlement View</TabsTrigger>
          <TabsTrigger value="individual">Individual Order Settlement</TabsTrigger>
          <TabsTrigger value="detailed">Order Payment Settlement</TabsTrigger>
          <TabsTrigger value="landing-cost">Landing Cost Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="batch">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-10"><SelectAllCheckbox checked={batchRowSelection.isAllSelected} onCheckedChange={batchRowSelection.toggleAll} /></TableHead>
                      <TableHead className="font-semibold">Batch ID</TableHead>
                      <TableHead className="font-semibold">Portal</TableHead>
                      <TableHead className="font-semibold">Cycle Period</TableHead>
                      <TableHead className="font-semibold text-right">Gross Amount</TableHead>
                      <TableHead className="font-semibold text-right">Commission</TableHead>
                      <TableHead className="font-semibold text-right">Fees</TableHead>
                      <TableHead className="font-semibold text-right">Net Amount</TableHead>
                      <TableHead className="font-semibold">Orders</TableHead>
                      <TableHead className="font-semibold">Expected Date</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSettlements.map((settlement) => {
                      const status = settlementStatusConfig[settlement.status];
                      const portal = portalConfigs.find(p => p.id === settlement.portal);
                      const StatusIcon = status.icon;
                      return (
                        <TableRow key={settlement.settlementId} className={`hover:bg-muted/30 ${batchRowSelection.isSelected(settlement.settlementId) ? 'bg-primary/5' : ''}`}>
                          <TableCell><RowCheckbox checked={batchRowSelection.isSelected(settlement.settlementId)} onCheckedChange={() => batchRowSelection.toggle(settlement.settlementId)} /></TableCell>
                          <TableCell className="font-medium">{settlement.settlementId}</TableCell>
                          <TableCell><Badge variant="outline" className="gap-1">{portal?.icon} {portal?.name}</Badge></TableCell>
                          <TableCell className="text-sm">{formatDate(settlement.cycleStart)} - {formatDate(settlement.cycleEnd)}</TableCell>
                          <TableCell className="text-right font-medium">₹{settlement.amount.toLocaleString()}</TableCell>
                          <TableCell className="text-right text-destructive">-₹{settlement.commission.toLocaleString()}</TableCell>
                          <TableCell className="text-right text-muted-foreground">-₹{settlement.fees.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-bold text-success">₹{settlement.netAmount.toLocaleString()}</TableCell>
                          <TableCell className="text-center"><Badge variant="secondary">{settlement.ordersCount}</Badge></TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(settlement.expectedDate)}</TableCell>
                          <TableCell><Badge variant="secondary" className={`gap-1 ${status.color}`}><StatusIcon className="w-3 h-3" />{status.label}</Badge></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {filteredSettlements.length === 0 && (
                <div className="text-center py-12"><CreditCard className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" /><p className="text-muted-foreground">No settlements found</p></div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="individual">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-10"><SelectAllCheckbox checked={orderRowSelection.isAllSelected} onCheckedChange={orderRowSelection.toggleAll} /></TableHead>
                      <TableHead className="font-semibold">Order ID</TableHead>
                      <TableHead className="font-semibold">Portal</TableHead>
                      <TableHead className="font-semibold text-right">Settlement Amount</TableHead>
                      <TableHead className="font-semibold text-right">Fees</TableHead>
                      <TableHead className="font-semibold text-right">Commission</TableHead>
                      <TableHead className="font-semibold text-right">Net Credit</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrderSettlements.map((s) => {
                      const status = settlementStatusConfig[s.status];
                      const portal = portalConfigs.find(p => p.id === s.portal);
                      const StatusIcon = status.icon;
                      return (
                        <TableRow key={s.orderId} className={`hover:bg-muted/30 ${orderRowSelection.isSelected(s.orderId) ? 'bg-primary/5' : ''}`}>
                          <TableCell><RowCheckbox checked={orderRowSelection.isSelected(s.orderId)} onCheckedChange={() => orderRowSelection.toggle(s.orderId)} /></TableCell>
                          <TableCell className="font-medium">{s.orderId}</TableCell>
                          <TableCell><Badge variant="outline" className="gap-1">{portal?.icon} {portal?.name}</Badge></TableCell>
                          <TableCell className="text-right font-medium">₹{s.amount.toLocaleString()}</TableCell>
                          <TableCell className="text-right text-muted-foreground">-₹{s.fees.toLocaleString()}</TableCell>
                          <TableCell className="text-right text-destructive">-₹{s.commission.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-bold text-success">₹{s.net.toLocaleString()}</TableCell>
                          <TableCell><Badge variant="secondary" className={`gap-1 ${status.color}`}><StatusIcon className="w-3 h-3" />{status.label}</Badge></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed">
          <OrderPaymentSettlement />
        </TabsContent>

        <TabsContent value="landing-cost">
          <LandingCostAnalysis />
        </TabsContent>
      </Tabs>
    </div>
  );
}
