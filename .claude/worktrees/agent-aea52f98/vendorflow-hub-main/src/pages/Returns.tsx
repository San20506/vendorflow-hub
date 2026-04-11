import { useState, useMemo } from 'react';
import { mockReturns, portalConfigs } from '@/services/mockData';
import { Portal, ReturnReason } from '@/types';
import { PortalFilter } from '@/components/dashboard/PortalFilter';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Search, RotateCcw, CheckCircle, XCircle, Clock, AlertTriangle, IndianRupee,
  ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Package, Truck, Ban,
  FileText, ShieldCheck, Warehouse, Link2, FileSpreadsheet, FileDown,
} from 'lucide-react';
import { DateFilter, ExportButton, useRowSelection, SelectAllCheckbox, RowCheckbox } from '@/components/TableEnhancements';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

// Return types
type ReturnType = 'customer_return' | 'courier_return' | 'rto' | 'before_pickup_cancel' | 'upcoming_return' | 'pending_return';

const returnTypeConfig: Record<ReturnType, { label: string; color: string; icon: React.ElementType }> = {
  customer_return: { label: 'Customer Return', color: 'bg-rose-500/10 text-rose-600', icon: RotateCcw },
  courier_return: { label: 'Courier Return', color: 'bg-amber-500/10 text-amber-600', icon: Truck },
  rto: { label: 'RTO', color: 'bg-orange-500/10 text-orange-600', icon: Ban },
  before_pickup_cancel: { label: 'Before Pickup Cancel', color: 'bg-muted text-muted-foreground', icon: XCircle },
  upcoming_return: { label: 'Upcoming Return', color: 'bg-blue-500/10 text-blue-600', icon: Clock },
  pending_return: { label: 'Pending Return', color: 'bg-purple-500/10 text-purple-600', icon: Package },
};

type LifecycleStage = 'return_initiated' | 'pickup_completed' | 'warehouse_received' | 'physical_verification' | 'claim_raised' | 'claim_approved' | 'claim_rejected' | 'refund_approved' | 'settlement_adjusted';

const stageConfig: Record<LifecycleStage, { label: string; color: string; icon: React.ElementType }> = {
  return_initiated: { label: 'Return Initiated', color: 'bg-amber-500/10 text-amber-600', icon: RotateCcw },
  pickup_completed: { label: 'Pickup Completed', color: 'bg-blue-500/10 text-blue-600', icon: Truck },
  warehouse_received: { label: 'Warehouse Received', color: 'bg-teal-500/10 text-teal-600', icon: Warehouse },
  physical_verification: { label: 'Physical Verification', color: 'bg-indigo-500/10 text-indigo-600', icon: ShieldCheck },
  claim_raised: { label: 'Claim Raised', color: 'bg-purple-500/10 text-purple-600', icon: AlertTriangle },
  claim_approved: { label: 'Claim Approved', color: 'bg-emerald-500/10 text-emerald-600', icon: CheckCircle },
  claim_rejected: { label: 'Claim Rejected', color: 'bg-rose-500/10 text-rose-600', icon: XCircle },
  refund_approved: { label: 'Refund Approved', color: 'bg-green-500/10 text-green-600', icon: IndianRupee },
  settlement_adjusted: { label: 'Settlement Adjusted', color: 'bg-primary/10 text-primary', icon: Link2 },
};

// Claim eligibility reasons
type ClaimEligibility = 'eligible' | 'ineligible' | 'pending_review';
interface ClaimEligibilityInfo {
  status: ClaimEligibility;
  withinWindow: boolean;
  conditionEligible: boolean;
  categoryRestricted: boolean;
  reason?: string;
}

interface ReturnLifecycle {
  returnId: string;
  orderId: string;
  portal: Portal;
  productName: string;
  skuId: string;
  reason: ReturnReason;
  returnType: ReturnType;
  refundAmount: number;
  currentStage: LifecycleStage;
  responsibleUser: string;
  warehouseReceived: boolean;
  physicalVerification: 'pending' | 'passed' | 'failed';
  refundApproved: boolean;
  claimEligibility: ClaimEligibilityInfo;
  linkedSettlementId?: string;
  returnDate: string;
  timeline: { stage: LifecycleStage; timestamp: string; note?: string; user: string }[];
}

const reasonLabels: Record<ReturnReason, string> = {
  damaged: 'Damaged Product', wrong_item: 'Wrong Item', not_as_described: 'Not as Described',
  size_issue: 'Size/Fit Issue', quality_issue: 'Quality Issue', changed_mind: 'Changed Mind',
};

const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString();

const mockLifecycleData: ReturnLifecycle[] = [
  {
    returnId: 'RET-2024-001', orderId: 'ORD-2024-002', portal: 'flipkart', productName: 'Organic Cotton T-Shirt', skuId: 'SKU-FLK-003',
    reason: 'size_issue', returnType: 'customer_return', refundAmount: 599, currentStage: 'claim_raised', responsibleUser: 'Operations',
    warehouseReceived: true, physicalVerification: 'passed', refundApproved: false, returnDate: daysAgo(5),
    claimEligibility: { status: 'eligible', withinWindow: true, conditionEligible: true, categoryRestricted: false },
    timeline: [
      { stage: 'return_initiated', timestamp: daysAgo(5), user: 'Customer', note: 'Size too small' },
      { stage: 'pickup_completed', timestamp: daysAgo(3), user: 'Logistics', note: 'Item picked up from customer' },
      { stage: 'warehouse_received', timestamp: daysAgo(2), user: 'Warehouse', note: 'Received at Mumbai FC' },
      { stage: 'physical_verification', timestamp: daysAgo(2), user: 'QC Team', note: 'Product in original condition' },
      { stage: 'claim_raised', timestamp: daysAgo(2), user: 'Operations', note: 'Claim raised with Flipkart' },
    ],
  },
  {
    returnId: 'RET-2024-002', orderId: 'ORD-2024-005', portal: 'blinkit', productName: 'Stainless Steel Water Bottle', skuId: 'SKU-BLK-004',
    reason: 'damaged', returnType: 'courier_return', refundAmount: 799, currentStage: 'settlement_adjusted', responsibleUser: 'Finance',
    warehouseReceived: true, physicalVerification: 'passed', refundApproved: true, returnDate: daysAgo(10),
    claimEligibility: { status: 'eligible', withinWindow: true, conditionEligible: true, categoryRestricted: false },
    linkedSettlementId: 'STL-2024-002',
    timeline: [
      { stage: 'return_initiated', timestamp: daysAgo(10), user: 'Customer', note: 'Dent on bottle' },
      { stage: 'pickup_completed', timestamp: daysAgo(8), user: 'Logistics' },
      { stage: 'warehouse_received', timestamp: daysAgo(7), user: 'Warehouse', note: 'Received at Delhi FC' },
      { stage: 'physical_verification', timestamp: daysAgo(7), user: 'QC Team', note: 'Damage confirmed' },
      { stage: 'claim_raised', timestamp: daysAgo(7), user: 'Operations' },
      { stage: 'claim_approved', timestamp: daysAgo(5), user: 'Blinkit', note: 'Full refund approved' },
      { stage: 'refund_approved', timestamp: daysAgo(4), user: 'Finance', note: 'Refund processed' },
      { stage: 'settlement_adjusted', timestamp: daysAgo(3), user: 'Finance', note: 'Linked to STL-2024-002' },
    ],
  },
  {
    returnId: 'RET-2024-003', orderId: 'ORD-2024-001', portal: 'amazon', productName: 'Premium Wireless Earbuds Pro', skuId: 'SKU-AMZ-001',
    reason: 'not_as_described', returnType: 'customer_return', refundAmount: 2999, currentStage: 'warehouse_received', responsibleUser: 'QC Team',
    warehouseReceived: true, physicalVerification: 'pending', refundApproved: false, returnDate: daysAgo(3),
    claimEligibility: { status: 'pending_review', withinWindow: true, conditionEligible: true, categoryRestricted: false, reason: 'Awaiting physical verification' },
    timeline: [
      { stage: 'return_initiated', timestamp: daysAgo(3), user: 'Customer', note: 'Product not matching description' },
      { stage: 'pickup_completed', timestamp: daysAgo(1), user: 'Logistics', note: 'Reverse pickup done' },
      { stage: 'warehouse_received', timestamp: daysAgo(0), user: 'Warehouse', note: 'Received at Mumbai FC' },
    ],
  },
  {
    returnId: 'RET-2024-004', orderId: 'ORD-2024-007', portal: 'amazon', productName: 'Smart Fitness Watch X2', skuId: 'SKU-AMZ-002',
    reason: 'quality_issue', returnType: 'rto', refundAmount: 4999, currentStage: 'claim_rejected', responsibleUser: 'Operations',
    warehouseReceived: true, physicalVerification: 'failed', refundApproved: false, returnDate: daysAgo(15),
    claimEligibility: { status: 'ineligible', withinWindow: false, conditionEligible: false, categoryRestricted: false, reason: 'Outside 7-day return window, product tampered' },
    timeline: [
      { stage: 'return_initiated', timestamp: daysAgo(15), user: 'Customer' },
      { stage: 'pickup_completed', timestamp: daysAgo(12), user: 'Logistics' },
      { stage: 'warehouse_received', timestamp: daysAgo(11), user: 'Warehouse' },
      { stage: 'physical_verification', timestamp: daysAgo(10), user: 'QC Team', note: 'Product tampered, seal broken' },
      { stage: 'claim_raised', timestamp: daysAgo(10), user: 'Operations' },
      { stage: 'claim_rejected', timestamp: daysAgo(7), user: 'Amazon', note: 'Item not in return policy window' },
    ],
  },
  {
    returnId: 'RET-2024-005', orderId: 'ORD-2024-009', portal: 'meesho', productName: 'Yoga Mat Premium', skuId: 'SKU-MSH-007',
    reason: 'changed_mind', returnType: 'pending_return', refundAmount: 899, currentStage: 'return_initiated', responsibleUser: 'Logistics',
    warehouseReceived: false, physicalVerification: 'pending', refundApproved: false, returnDate: daysAgo(1),
    claimEligibility: { status: 'pending_review', withinWindow: true, conditionEligible: true, categoryRestricted: false, reason: 'Pending pickup' },
    timeline: [
      { stage: 'return_initiated', timestamp: daysAgo(1), user: 'Customer', note: 'Customer changed mind' },
    ],
  },
  {
    returnId: 'RET-2024-006', orderId: 'ORD-2024-011', portal: 'flipkart', productName: 'Premium Wireless Earbuds Pro', skuId: 'SKU-FLK-001',
    reason: 'wrong_item', returnType: 'upcoming_return', refundAmount: 2999, currentStage: 'return_initiated', responsibleUser: 'Logistics',
    warehouseReceived: false, physicalVerification: 'pending', refundApproved: false, returnDate: daysAgo(0),
    claimEligibility: { status: 'eligible', withinWindow: true, conditionEligible: true, categoryRestricted: false },
    timeline: [
      { stage: 'return_initiated', timestamp: daysAgo(0), user: 'Customer', note: 'Received wrong item' },
    ],
  },
  {
    returnId: 'RET-2024-007', orderId: 'ORD-2024-010', portal: 'amazon', productName: 'Smart Fitness Watch X2', skuId: 'SKU-AMZ-002',
    reason: 'damaged', returnType: 'before_pickup_cancel', refundAmount: 4999, currentStage: 'return_initiated', responsibleUser: 'Operations',
    warehouseReceived: false, physicalVerification: 'pending', refundApproved: false, returnDate: daysAgo(0),
    claimEligibility: { status: 'ineligible', withinWindow: true, conditionEligible: true, categoryRestricted: true, reason: 'Electronics category: no return after unboxing' },
    timeline: [
      { stage: 'return_initiated', timestamp: daysAgo(0), user: 'Customer', note: 'Cancelled before pickup scheduled' },
    ],
  },
];

// Sorting
type SortField = 'date' | 'refund' | 'status' | null;
type SortDir = 'asc' | 'desc';

const stageOrder: LifecycleStage[] = ['return_initiated', 'pickup_completed', 'warehouse_received', 'physical_verification', 'claim_raised', 'claim_approved', 'claim_rejected', 'refund_approved', 'settlement_adjusted'];

export default function Returns() {
  const { toast } = useToast();
  const [selectedPortal, setSelectedPortal] = useState<Portal | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [returnTypeFilter, setReturnTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('30days');
  const [selectedReturn, setSelectedReturn] = useState<ReturnLifecycle | null>(null);
  const [lifecycleData, setLifecycleData] = useState(mockLifecycleData);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
    return sortDir === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  const filtered = useMemo(() => {
    let data = lifecycleData.filter(r => {
      if (selectedPortal !== 'all' && r.portal !== selectedPortal) return false;
      if (stageFilter !== 'all' && r.currentStage !== stageFilter) return false;
      if (returnTypeFilter !== 'all' && r.returnType !== returnTypeFilter) return false;
      if (searchQuery && !r.returnId.toLowerCase().includes(searchQuery.toLowerCase()) && !r.orderId.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });

    if (sortField) {
      data = [...data].sort((a, b) => {
        let cmp = 0;
        if (sortField === 'date') cmp = new Date(a.returnDate).getTime() - new Date(b.returnDate).getTime();
        if (sortField === 'refund') cmp = a.refundAmount - b.refundAmount;
        if (sortField === 'status') cmp = stageOrder.indexOf(a.currentStage) - stageOrder.indexOf(b.currentStage);
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }

    return data;
  }, [lifecycleData, selectedPortal, stageFilter, returnTypeFilter, searchQuery, sortField, sortDir]);

  const rowSelection = useRowSelection(filtered.map(r => r.returnId));

  const summary = useMemo(() => ({
    total: lifecycleData.length,
    pending: lifecycleData.filter(r => ['return_initiated', 'pickup_completed', 'warehouse_received', 'physical_verification', 'claim_raised'].includes(r.currentStage)).length,
    approved: lifecycleData.filter(r => ['claim_approved', 'refund_approved', 'settlement_adjusted'].includes(r.currentStage)).length,
    rejected: lifecycleData.filter(r => r.currentStage === 'claim_rejected').length,
    financialImpact: lifecycleData.filter(r => r.currentStage !== 'claim_rejected').reduce((s, r) => s + r.refundAmount, 0),
    warehousePending: lifecycleData.filter(r => !r.warehouseReceived).length,
    linkedSettlements: lifecycleData.filter(r => r.linkedSettlementId).length,
  }), [lifecycleData]);

  const advanceStage = (returnId: string) => {
    const advanceOrder: LifecycleStage[] = ['return_initiated', 'pickup_completed', 'warehouse_received', 'physical_verification', 'claim_raised', 'claim_approved', 'refund_approved', 'settlement_adjusted'];
    setLifecycleData(prev => prev.map(r => {
      if (r.returnId !== returnId) return r;
      const currentIdx = advanceOrder.indexOf(r.currentStage);
      if (currentIdx < 0 || currentIdx >= advanceOrder.length - 1) return r;
      const nextStage = advanceOrder[currentIdx + 1];
      const updated = {
        ...r,
        currentStage: nextStage,
        timeline: [...r.timeline, { stage: nextStage, timestamp: new Date().toISOString(), user: 'Admin' }],
      };
      if (nextStage === 'warehouse_received') updated.warehouseReceived = true;
      if (nextStage === 'physical_verification') updated.physicalVerification = 'passed' as const;
      if (nextStage === 'refund_approved') updated.refundApproved = true;
      if (nextStage === 'settlement_adjusted') updated.linkedSettlementId = `STL-2024-${String(Math.floor(Math.random() * 900) + 100)}`;
      return updated;
    }));
    toast({ title: 'Stage Advanced', description: `Return ${returnId} moved to next stage` });
  };

  const dateLabel = dateFilter === 'today' ? 'Today' : dateFilter === '7days' ? 'Last 7 Days' : dateFilter === '30days' ? 'Last 30 Days' : 'Custom';

  const handleExport = (type: 'excel' | 'pdf') => {
    toast({ title: `${type.toUpperCase()} Export`, description: `${filtered.length} returns exported as ${type.toUpperCase()}` });
  };

  const getEligibilityBadge = (info: ClaimEligibilityInfo) => {
    if (info.status === 'eligible') return <Badge variant="secondary" className="gap-1 bg-emerald-500/10 text-emerald-600 text-xs"><CheckCircle className="w-3 h-3" />Eligible</Badge>;
    if (info.status === 'ineligible') return <Badge variant="secondary" className="gap-1 bg-rose-500/10 text-rose-600 text-xs"><XCircle className="w-3 h-3" />Ineligible</Badge>;
    return <Badge variant="secondary" className="gap-1 bg-amber-500/10 text-amber-600 text-xs"><Clock className="w-3 h-3" />Pending</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Returns, Claims & Settlement Lifecycle</h1>
          <p className="text-muted-foreground">Full lifecycle tracking with warehouse reconciliation & claim eligibility</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleExport('excel')}>
            <FileSpreadsheet className="w-4 h-4" />Excel
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleExport('pdf')}>
            <FileDown className="w-4 h-4" />PDF
          </Button>
          <ExportButton label={rowSelection.count > 0 ? undefined : `Export – ${dateLabel}`} selectedCount={rowSelection.count} />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card><CardContent className="p-3"><div className="flex flex-col items-center text-center gap-1"><RotateCcw className="w-5 h-5 text-primary" /><p className="text-xl font-bold">{summary.total}</p><p className="text-[11px] text-muted-foreground leading-tight">Total Returns</p></div></CardContent></Card>
        <Card className="border-warning/30"><CardContent className="p-3"><div className="flex flex-col items-center text-center gap-1"><Clock className="w-5 h-5 text-warning" /><p className="text-xl font-bold text-warning">{summary.pending}</p><p className="text-[11px] text-muted-foreground leading-tight">Pending Claims</p></div></CardContent></Card>
        <Card className="border-success/30"><CardContent className="p-3"><div className="flex flex-col items-center text-center gap-1"><CheckCircle className="w-5 h-5 text-success" /><p className="text-xl font-bold text-success">{summary.approved}</p><p className="text-[11px] text-muted-foreground leading-tight">Approved</p></div></CardContent></Card>
        <Card className="border-destructive/30"><CardContent className="p-3"><div className="flex flex-col items-center text-center gap-1"><XCircle className="w-5 h-5 text-destructive" /><p className="text-xl font-bold text-destructive">{summary.rejected}</p><p className="text-[11px] text-muted-foreground leading-tight">Rejected</p></div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex flex-col items-center text-center gap-1"><IndianRupee className="w-5 h-5 text-info" /><p className="text-xl font-bold">₹{(summary.financialImpact / 1000).toFixed(1)}K</p><p className="text-[11px] text-muted-foreground leading-tight">Financial Impact</p></div></CardContent></Card>
        <Card className="border-amber-500/30"><CardContent className="p-3"><div className="flex flex-col items-center text-center gap-1"><Warehouse className="w-5 h-5 text-amber-600" /><p className="text-xl font-bold text-amber-600">{summary.warehousePending}</p><p className="text-[11px] text-muted-foreground leading-tight">WH Pending</p></div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex flex-col items-center text-center gap-1"><Link2 className="w-5 h-5 text-primary" /><p className="text-xl font-bold">{summary.linkedSettlements}</p><p className="text-[11px] text-muted-foreground leading-tight">Linked Settlements</p></div></CardContent></Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <PortalFilter selectedPortal={selectedPortal} onPortalChange={setSelectedPortal} />
            <div className="flex flex-1 flex-wrap gap-3">
              <DateFilter value={dateFilter} onChange={setDateFilter} />
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search Return ID or Order ID..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
              </div>
              <Select value={returnTypeFilter} onValueChange={setReturnTypeFilter}>
                <SelectTrigger className="w-[190px]"><SelectValue placeholder="Return Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Return Types</SelectItem>
                  {Object.entries(returnTypeConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="w-[190px]"><SelectValue placeholder="Lifecycle Stage" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  {Object.entries(stageConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Returns Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-10"><SelectAllCheckbox checked={rowSelection.isAllSelected} onCheckedChange={rowSelection.toggleAll} /></TableHead>
                  <TableHead className="font-semibold">Return ID</TableHead>
                  <TableHead className="font-semibold">Order ID</TableHead>
                  <TableHead className="font-semibold">Product</TableHead>
                  <TableHead className="font-semibold">Portal</TableHead>
                  <TableHead className="font-semibold">Return Type</TableHead>
                  <TableHead className="font-semibold cursor-pointer select-none" onClick={() => toggleSort('date')}>
                    <span className="flex items-center">Date<SortIcon field="date" /></span>
                  </TableHead>
                  <TableHead className="text-right font-semibold cursor-pointer select-none" onClick={() => toggleSort('refund')}>
                    <span className="flex items-center justify-end">Refund ₹<SortIcon field="refund" /></span>
                  </TableHead>
                  <TableHead className="font-semibold">WH Recon</TableHead>
                  <TableHead className="font-semibold">Claim</TableHead>
                  <TableHead className="font-semibold cursor-pointer select-none" onClick={() => toggleSort('status')}>
                    <span className="flex items-center">Stage<SortIcon field="status" /></span>
                  </TableHead>
                  <TableHead className="font-semibold text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(r => {
                  const stage = stageConfig[r.currentStage];
                  const StageIcon = stage.icon;
                  const portal = portalConfigs.find(p => p.id === r.portal);
                  const rtConfig = returnTypeConfig[r.returnType];
                  const RTIcon = rtConfig.icon;
                  return (
                    <TableRow key={r.returnId} className={`hover:bg-muted/30 ${rowSelection.isSelected(r.returnId) ? 'bg-primary/5' : ''}`}>
                      <TableCell><RowCheckbox checked={rowSelection.isSelected(r.returnId)} onCheckedChange={() => rowSelection.toggle(r.returnId)} /></TableCell>
                      <TableCell className="font-medium">{r.returnId}</TableCell>
                      <TableCell className="text-accent font-medium">{r.orderId}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{r.productName}</p>
                          <p className="text-xs text-muted-foreground font-mono">{r.skuId}</p>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="gap-1">{portal?.icon} {portal?.name}</Badge></TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`gap-1 text-xs ${rtConfig.color}`}>
                          <RTIcon className="w-3 h-3" />{rtConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(new Date(r.returnDate), 'dd MMM yyyy')}</TableCell>
                      <TableCell className="text-right font-medium">₹{r.refundAmount.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <Badge variant="secondary" className={`text-[10px] gap-0.5 ${r.warehouseReceived ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                            {r.warehouseReceived ? <CheckCircle className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                            {r.warehouseReceived ? 'Received' : 'Pending'}
                          </Badge>
                          <Badge variant="secondary" className={`text-[10px] gap-0.5 ${
                            r.physicalVerification === 'passed' ? 'bg-emerald-500/10 text-emerald-600' :
                            r.physicalVerification === 'failed' ? 'bg-rose-500/10 text-rose-600' : 'bg-muted text-muted-foreground'
                          }`}>
                            {r.physicalVerification === 'passed' ? <ShieldCheck className="w-2.5 h-2.5" /> :
                             r.physicalVerification === 'failed' ? <XCircle className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                            QC: {r.physicalVerification.charAt(0).toUpperCase() + r.physicalVerification.slice(1)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{getEligibilityBadge(r.claimEligibility)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Badge variant="secondary" className={`gap-1 text-xs ${stage.color}`}>
                            <StageIcon className="w-3 h-3" />{stage.label}
                          </Badge>
                          {r.linkedSettlementId && (
                            <Badge variant="outline" className="text-[10px] gap-0.5">
                              <Link2 className="w-2.5 h-2.5" />{r.linkedSettlementId}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center gap-1 justify-center">
                          <Button variant="ghost" size="sm" className="text-xs" onClick={() => setSelectedReturn(r)}>Details</Button>
                          {r.currentStage !== 'settlement_adjusted' && r.currentStage !== 'claim_rejected' && (
                            <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => advanceStage(r.returnId)}>
                              <ChevronRight className="w-3 h-3" />Advance
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12"><RotateCcw className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" /><p className="text-muted-foreground">No returns found</p></div>
          )}
        </CardContent>
      </Card>

      {/* Return Detail Dialog */}
      <Dialog open={!!selectedReturn} onOpenChange={() => setSelectedReturn(null)}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Return Details — {selectedReturn?.returnId}
              {selectedReturn && (
                <Badge variant="secondary" className={`gap-1 text-xs ${returnTypeConfig[selectedReturn.returnType].color}`}>
                  {returnTypeConfig[selectedReturn.returnType].label}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedReturn && (
            <div className="space-y-5">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Order:</span> <span className="font-medium">{selectedReturn.orderId}</span></div>
                <div><span className="text-muted-foreground">Portal:</span> <span className="font-medium">{portalConfigs.find(p => p.id === selectedReturn.portal)?.name}</span></div>
                <div><span className="text-muted-foreground">Product:</span> <span className="font-medium">{selectedReturn.productName}</span></div>
                <div><span className="text-muted-foreground">Reason:</span> <span className="font-medium">{reasonLabels[selectedReturn.reason]}</span></div>
                <div><span className="text-muted-foreground">Refund:</span> <span className="font-bold">₹{selectedReturn.refundAmount.toLocaleString()}</span></div>
                <div><span className="text-muted-foreground">Responsible:</span> <Badge variant="secondary" className="text-xs ml-1">{selectedReturn.responsibleUser}</Badge></div>
              </div>

              {/* Warehouse Reconciliation */}
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-1.5"><Warehouse className="w-4 h-4" />Warehouse Reconciliation</h4>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Received at WH</p>
                    <Badge variant="secondary" className={`mt-1 text-xs gap-1 ${selectedReturn.warehouseReceived ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                      {selectedReturn.warehouseReceived ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {selectedReturn.warehouseReceived ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Physical Verification</p>
                    <Badge variant="secondary" className={`mt-1 text-xs gap-1 ${
                      selectedReturn.physicalVerification === 'passed' ? 'bg-emerald-500/10 text-emerald-600' :
                      selectedReturn.physicalVerification === 'failed' ? 'bg-rose-500/10 text-rose-600' : 'bg-amber-500/10 text-amber-600'
                    }`}>
                      {selectedReturn.physicalVerification === 'passed' ? <ShieldCheck className="w-3 h-3" /> :
                       selectedReturn.physicalVerification === 'failed' ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {selectedReturn.physicalVerification.charAt(0).toUpperCase() + selectedReturn.physicalVerification.slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Refund Approved</p>
                    <Badge variant="secondary" className={`mt-1 text-xs gap-1 ${selectedReturn.refundApproved ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                      {selectedReturn.refundApproved ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {selectedReturn.refundApproved ? 'Approved' : 'Pending'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Claim Eligibility */}
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" />Claim Eligibility (Portal Policy)</h4>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="flex items-center gap-1.5">
                    {selectedReturn.claimEligibility.withinWindow
                      ? <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      : <XCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                    <span className={selectedReturn.claimEligibility.withinWindow ? 'text-emerald-600' : 'text-rose-600'}>
                      {selectedReturn.claimEligibility.withinWindow ? 'Within Window' : 'Outside Window'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {selectedReturn.claimEligibility.conditionEligible
                      ? <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      : <XCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                    <span className={selectedReturn.claimEligibility.conditionEligible ? 'text-emerald-600' : 'text-rose-600'}>
                      {selectedReturn.claimEligibility.conditionEligible ? 'Condition OK' : 'Condition Fail'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {!selectedReturn.claimEligibility.categoryRestricted
                      ? <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      : <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
                    <span className={!selectedReturn.claimEligibility.categoryRestricted ? 'text-emerald-600' : 'text-amber-600'}>
                      {selectedReturn.claimEligibility.categoryRestricted ? 'Category Restricted' : 'Category OK'}
                    </span>
                  </div>
                </div>
                {selectedReturn.claimEligibility.reason && (
                  <p className="text-xs text-muted-foreground mt-2 italic">{selectedReturn.claimEligibility.reason}</p>
                )}
                <div className="mt-2">
                  <span className="text-xs text-muted-foreground mr-1">Verdict:</span>
                  {getEligibilityBadge(selectedReturn.claimEligibility)}
                </div>
              </div>

              {/* Settlement Linkage */}
              {selectedReturn.linkedSettlementId && (
                <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-primary" />
                  <span className="text-sm">Linked to Settlement:</span>
                  <Badge variant="outline" className="font-mono">{selectedReturn.linkedSettlementId}</Badge>
                  <span className="text-xs text-muted-foreground">• Refund ₹{selectedReturn.refundAmount.toLocaleString()} adjusted</span>
                </div>
              )}

              {/* Timeline */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-sm mb-3">Lifecycle Timeline</h4>
                <div className="space-y-3">
                  {selectedReturn.timeline.map((entry, idx) => {
                    const cfg = stageConfig[entry.stage];
                    const Icon = cfg.icon;
                    const isLast = idx === selectedReturn.timeline.length - 1;
                    return (
                      <div key={idx} className={`flex gap-3 ${isLast ? '' : 'pb-3 border-b border-dashed'}`}>
                        <div className={`p-1.5 rounded-lg shrink-0 ${cfg.color}`}><Icon className="w-4 h-4" /></div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{cfg.label}</p>
                          {entry.note && <p className="text-xs text-muted-foreground">{entry.note}</p>}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">{format(new Date(entry.timestamp), 'dd MMM yyyy, HH:mm')}</span>
                            <Badge variant="secondary" className="text-xs">{entry.user}</Badge>
                          </div>
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
    </div>
  );
}
