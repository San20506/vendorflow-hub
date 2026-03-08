import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { customersDb } from '@/services/database';
import { Users, Search, Download, Eye, AlertTriangle, ShieldAlert, UserCheck, UserPlus, MapPin, Package, RotateCcw, TrendingUp, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const FRAUD_THRESHOLD = 30;
const fmt = (n: number) => '₹' + n.toLocaleString('en-IN');

export default function CustomerManagement() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
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
    return { ...c, returnRate, isRepeat: c.total_orders > 1, isFraudRisk: returnRate >= FRAUD_THRESHOLD };
  }), [customers]);

  const filtered = useMemo(() => enriched.filter(c => {
    const matchType = typeFilter === 'all' || (typeFilter === 'repeat' ? c.isRepeat : !c.isRepeat);
    const matchRisk = riskFilter === 'all' || (riskFilter === 'fraud' ? c.isFraudRisk : !c.isFraudRisk);
    return matchType && matchRisk;
  }), [enriched, typeFilter, riskFilter]);

  const stats = useMemo(() => ({
    total: enriched.length,
    repeat: enriched.filter(c => c.isRepeat).length,
    newCust: enriched.filter(c => !c.isRepeat).length,
    fraudRisk: enriched.filter(c => c.isFraudRisk).length,
    totalRevenue: enriched.reduce((s, c) => s + Number(c.total_spent || 0), 0),
  }), [enriched]);

  const handleExport = () => {
    const headers = ['Name', 'Email', 'Phone', 'City', 'State', 'Orders', 'Returns', 'Spent'];
    const rows = enriched.map(c => [c.name, c.email, c.phone, c.city, c.state, c.total_orders, c.total_returns, c.total_spent]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'customers.csv'; a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported', description: 'Customer data exported to CSV' });
  };

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customer Management</h1>
          <p className="text-muted-foreground">Customer database from orders</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleExport}><Download className="w-4 h-4" />Export CSV</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="pt-5 pb-4"><Users className="w-4 h-4 text-primary mb-1" /><p className="text-xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total Customers</p></CardContent></Card>
        <Card><CardContent className="pt-5 pb-4"><UserCheck className="w-4 h-4 text-emerald-600 mb-1" /><p className="text-xl font-bold text-emerald-600">{stats.repeat}</p><p className="text-xs text-muted-foreground">Repeat</p></CardContent></Card>
        <Card><CardContent className="pt-5 pb-4"><UserPlus className="w-4 h-4 text-blue-600 mb-1" /><p className="text-xl font-bold text-blue-600">{stats.newCust}</p><p className="text-xs text-muted-foreground">New</p></CardContent></Card>
        <Card><CardContent className="pt-5 pb-4"><ShieldAlert className="w-4 h-4 text-rose-600 mb-1" /><p className="text-xl font-bold text-rose-600">{stats.fraudRisk}</p><p className="text-xs text-muted-foreground">Fraud Risk</p></CardContent></Card>
        <Card><CardContent className="pt-5 pb-4"><TrendingUp className="w-4 h-4 text-primary mb-1" /><p className="text-xl font-bold">{fmt(stats.totalRevenue)}</p><p className="text-xs text-muted-foreground">Revenue</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Types</SelectItem><SelectItem value="repeat">Repeat</SelectItem><SelectItem value="new">New</SelectItem></SelectContent>
            </Select>
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Risk</SelectItem><SelectItem value="fraud">Fraud Risk</SelectItem><SelectItem value="safe">Safe</SelectItem></SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No customers found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Customer</TableHead>
                  <TableHead className="font-semibold">Location</TableHead>
                  <TableHead className="font-semibold text-center">Orders</TableHead>
                  <TableHead className="font-semibold text-center">Returns</TableHead>
                  <TableHead className="font-semibold text-right">Spent</TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">Risk</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(c => (
                  <TableRow key={c.id}>
                    <TableCell><div><p className="font-medium">{c.name}</p><p className="text-xs text-muted-foreground">{c.email}</p></div></TableCell>
                    <TableCell><div className="flex items-center gap-1 text-sm"><MapPin className="w-3 h-3 text-muted-foreground" />{c.city}, {c.state}</div></TableCell>
                    <TableCell className="text-center font-semibold">{c.total_orders}</TableCell>
                    <TableCell className="text-center">{c.total_returns}</TableCell>
                    <TableCell className="text-right font-semibold">{fmt(Number(c.total_spent || 0))}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={c.isRepeat ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-blue-500/10 text-blue-600 border-blue-500/30'}>
                        {c.isRepeat ? 'Repeat' : 'New'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {c.isFraudRisk ? (
                        <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/30 gap-1"><AlertTriangle className="w-3 h-3" />High Risk</Badge>
                      ) : <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Safe</Badge>}
                    </TableCell>
                    <TableCell><Button variant="ghost" size="sm" onClick={() => setSelected(c)}><Eye className="w-4 h-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{selected?.name}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground">Email</p><p className="font-medium">{selected.email}</p></div>
                <div><p className="text-muted-foreground">Phone</p><p className="font-medium">{selected.phone}</p></div>
                <div><p className="text-muted-foreground">Address</p><p className="font-medium">{selected.address}</p></div>
                <div><p className="text-muted-foreground">Pincode / State</p><p className="font-medium">{selected.pincode} — {selected.state}</p></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Card><CardContent className="pt-4 pb-3 text-center"><Package className="w-5 h-5 mx-auto mb-1 text-primary" /><p className="text-lg font-bold">{selected.total_orders}</p><p className="text-xs text-muted-foreground">Orders</p></CardContent></Card>
                <Card><CardContent className="pt-4 pb-3 text-center"><RotateCcw className="w-5 h-5 mx-auto mb-1 text-amber-600" /><p className="text-lg font-bold">{selected.total_returns}</p><p className="text-xs text-muted-foreground">Returns</p></CardContent></Card>
                <Card><CardContent className="pt-4 pb-3 text-center"><TrendingUp className="w-5 h-5 mx-auto mb-1 text-emerald-600" /><p className="text-lg font-bold">{fmt(Number(selected.total_spent || 0))}</p><p className="text-xs text-muted-foreground">Spent</p></CardContent></Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}