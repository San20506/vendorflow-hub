import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { portalConfigs } from '@/services/mockData';
import { Portal } from '@/types';
import { ShieldAlert, AlertCircle, CheckCircle2, Clock, XCircle, DollarSign } from 'lucide-react';

type ChargebackStatus = 'initiated' | 'under_review' | 'won' | 'lost';

interface Chargeback {
  id: string;
  orderId: string;
  portal: Portal;
  amount: number;
  reason: string;
  status: ChargebackStatus;
  filedDate: string;
  responsibleUser: string;
}

const mockChargebacks: Chargeback[] = [
  { id: 'CB-001', orderId: 'ORD-2024-102', portal: 'amazon', amount: 2999, reason: 'Product not received', status: 'under_review', filedDate: '2026-02-05', responsibleUser: 'Priya Sharma' },
  { id: 'CB-002', orderId: 'ORD-2024-118', portal: 'flipkart', amount: 4197, reason: 'Defective product', status: 'lost', filedDate: '2026-01-28', responsibleUser: 'Rahul Verma' },
  { id: 'CB-003', orderId: 'ORD-2024-134', portal: 'meesho', amount: 1299, reason: 'Wrong item shipped', status: 'won', filedDate: '2026-01-20', responsibleUser: 'Anita Desai' },
  { id: 'CB-004', orderId: 'ORD-2024-156', portal: 'amazon', amount: 5498, reason: 'Unauthorized transaction', status: 'initiated', filedDate: '2026-02-10', responsibleUser: 'Vikram Singh' },
  { id: 'CB-005', orderId: 'ORD-2024-171', portal: 'blinkit', amount: 899, reason: 'Item not as described', status: 'under_review', filedDate: '2026-02-08', responsibleUser: 'Priya Sharma' },
  { id: 'CB-006', orderId: 'ORD-2024-189', portal: 'flipkart', amount: 3450, reason: 'Double charged', status: 'lost', filedDate: '2026-01-15', responsibleUser: 'Rahul Verma' },
  { id: 'CB-007', orderId: 'ORD-2024-203', portal: 'firstcry', amount: 1899, reason: 'Delivery delay refund', status: 'won', filedDate: '2026-01-22', responsibleUser: 'Anita Desai' },
];

const statusConfig: Record<ChargebackStatus, { label: string; className: string; icon: React.ElementType }> = {
  initiated: { label: 'Initiated', className: 'bg-blue-500/15 text-blue-600 border-blue-500/30', icon: Clock },
  under_review: { label: 'Under Review', className: 'bg-amber-500/15 text-amber-600 border-amber-500/30', icon: AlertCircle },
  won: { label: 'Won', className: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30', icon: CheckCircle2 },
  lost: { label: 'Lost', className: 'bg-rose-500/15 text-rose-600 border-rose-500/30', icon: XCircle },
};

export default function ChargebackTracker() {
  const [filterStatus, setFilterStatus] = useState<ChargebackStatus | 'all'>('all');

  const filtered = useMemo(() => {
    return filterStatus === 'all' ? mockChargebacks : mockChargebacks.filter(c => c.status === filterStatus);
  }, [filterStatus]);

  const stats = useMemo(() => ({
    total: mockChargebacks.length,
    totalLost: mockChargebacks.filter(c => c.status === 'lost').reduce((s, c) => s + c.amount, 0),
    openDisputes: mockChargebacks.filter(c => c.status === 'initiated' || c.status === 'under_review').length,
  }), []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-amber-500/10"><ShieldAlert className="w-5 h-5 text-amber-600" /></div><div><p className="text-2xl font-bold">{stats.total}</p><p className="text-sm text-muted-foreground">Total Chargebacks</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-rose-500/10"><DollarSign className="w-5 h-5 text-rose-600" /></div><div><p className="text-2xl font-bold text-rose-600">₹{stats.totalLost.toLocaleString()}</p><p className="text-sm text-muted-foreground">Total Lost Amount</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-500/10"><Clock className="w-5 h-5 text-blue-600" /></div><div><p className="text-2xl font-bold">{stats.openDisputes}</p><p className="text-sm text-muted-foreground">Open Disputes</p></div></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <CardTitle>Chargebacks & Disputes</CardTitle>
              <CardDescription>Track and manage marketplace chargebacks and dispute resolutions</CardDescription>
            </div>
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as ChargebackStatus | 'all')}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="initiated">Initiated</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Order ID</TableHead>
                  <TableHead className="font-semibold">Portal</TableHead>
                  <TableHead className="text-right font-semibold">Chargeback Amount</TableHead>
                  <TableHead className="font-semibold">Reason</TableHead>
                  <TableHead className="font-semibold">Filed Date</TableHead>
                  <TableHead className="font-semibold">Responsible</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(c => {
                  const portal = portalConfigs.find(p => p.id === c.portal);
                  const sc = statusConfig[c.status];
                  const Icon = sc.icon;
                  return (
                    <TableRow key={c.id} className={c.status === 'lost' ? 'bg-rose-500/5' : ''}>
                      <TableCell className="font-medium">{c.orderId}</TableCell>
                      <TableCell><span className="flex items-center gap-1.5 text-sm">{portal?.icon} {portal?.name}</span></TableCell>
                      <TableCell className="text-right font-bold text-rose-600">₹{c.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{c.reason}</TableCell>
                      <TableCell className="text-sm">{new Date(c.filedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</TableCell>
                      <TableCell className="text-sm">{c.responsibleUser}</TableCell>
                      <TableCell><Badge variant="outline" className={`gap-1 ${sc.className}`}><Icon className="w-3 h-3" />{sc.label}</Badge></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
