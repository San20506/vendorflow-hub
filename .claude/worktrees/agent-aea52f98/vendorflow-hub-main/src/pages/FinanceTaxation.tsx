import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText, Receipt, ArrowDownUp, Download, FileSpreadsheet, FileDown,
  Plus, IndianRupee, TrendingUp, TrendingDown, Calculator, Building2,
  ArrowUp, ArrowDown, ArrowUpDown, Percent, Eye,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

// ── Mock Data ──

const mockInvoices = [
  { id: 'INV-2026-001', type: 'Sales Invoice' as const, customer: 'RetailMart India', gstin: '27AAACR5055K1ZY', date: '2026-02-10', taxableValue: 45000, cgst: 4050, sgst: 4050, igst: 0, total: 53100, status: 'Paid' as const },
  { id: 'INV-2026-002', type: 'Sales Invoice' as const, customer: 'QuickBuy Online', gstin: '29AAGCQ1234F1Z5', date: '2026-02-08', taxableValue: 28000, cgst: 0, sgst: 0, igst: 5040, total: 33040, status: 'Pending' as const },
  { id: 'DN-2026-001', type: 'Debit Note' as const, customer: 'RetailMart India', gstin: '27AAACR5055K1ZY', date: '2026-02-05', taxableValue: 5000, cgst: 450, sgst: 450, igst: 0, total: 5900, status: 'Issued' as const },
  { id: 'CN-2026-001', type: 'Credit Note' as const, customer: 'QuickBuy Online', gstin: '29AAGCQ1234F1Z5', date: '2026-02-03', taxableValue: 3500, cgst: 0, sgst: 0, igst: 630, total: 4130, status: 'Issued' as const },
  { id: 'INV-2026-003', type: 'Sales Invoice' as const, customer: 'MegaStore Ltd', gstin: '07AABCM9876D1ZP', date: '2026-01-28', taxableValue: 72000, cgst: 6480, sgst: 6480, igst: 0, total: 84960, status: 'Paid' as const },
];

const mockPurchaseBills = [
  { id: 'PB-001', supplier: 'RawMaterials Co', gstin: '27AABCR1234M1Z5', billNo: 'SUP-8801', date: '2026-02-09', taxableValue: 32000, cgst: 2880, sgst: 2880, igst: 0, total: 37760, inputGst: 5760 },
  { id: 'PB-002', supplier: 'PackTech Industries', gstin: '29AADCP5678N1Z3', billNo: 'PT-4420', date: '2026-02-06', taxableValue: 18500, cgst: 0, sgst: 0, igst: 3330, total: 21830, inputGst: 3330 },
  { id: 'PB-003', supplier: 'LogiFreight Services', gstin: '07AABCL9012P1Z7', billNo: 'LF-1192', date: '2026-02-01', taxableValue: 12000, cgst: 1080, sgst: 1080, igst: 0, total: 14160, inputGst: 2160 },
];

const mockGstr1 = mockInvoices.filter(i => i.type === 'Sales Invoice').map(i => ({
  gstin: i.gstin,
  invoiceNo: i.id,
  date: i.date,
  customer: i.customer,
  taxableValue: i.taxableValue,
  cgst: i.cgst,
  sgst: i.sgst,
  igst: i.igst,
  total: i.total,
}));

const plData = {
  revenue: 485000,
  commission: 38800,
  logistics: 24250,
  refundImpact: 12125,
  otherExpenses: 15000,
};
const netProfit = plData.revenue - plData.commission - plData.logistics - plData.refundImpact - plData.otherExpenses;
const marginPct = ((netProfit / plData.revenue) * 100).toFixed(1);

// ── Helpers ──

const fmt = (n: number) => '₹' + n.toLocaleString('en-IN');

type SortDir = 'asc' | 'desc';

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
  return dir === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />;
}

// ── Component ──

export default function FinanceTaxation() {
  const { toast } = useToast();

  // Invoice state
  const [invoiceDialog, setInvoiceDialog] = useState(false);
  const [invoiceType, setInvoiceType] = useState<string>('Sales Invoice');
  const [invoiceSort, setInvoiceSort] = useState<{ field: string; dir: SortDir }>({ field: 'date', dir: 'desc' });

  // Purchase bill state
  const [billSort, setBillSort] = useState<{ field: string; dir: SortDir }>({ field: 'date', dir: 'desc' });

  // Invoice form
  const [invForm, setInvForm] = useState({ customer: '', gstin: '', amount: '', gstRate: '18' });

  const toggleInvSort = (field: string) => {
    setInvoiceSort(prev => prev.field === field ? { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' });
  };

  const toggleBillSort = (field: string) => {
    setBillSort(prev => prev.field === field ? { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' });
  };

  const sortedInvoices = useMemo(() => {
    return [...mockInvoices].sort((a, b) => {
      const dir = invoiceSort.dir === 'asc' ? 1 : -1;
      const f = invoiceSort.field;
      if (f === 'date') return dir * (new Date(a.date).getTime() - new Date(b.date).getTime());
      if (f === 'total') return dir * (a.total - b.total);
      if (f === 'taxableValue') return dir * (a.taxableValue - b.taxableValue);
      return dir * ((a as any)[f] ?? '').toString().localeCompare(((b as any)[f] ?? '').toString());
    });
  }, [invoiceSort]);

  const sortedBills = useMemo(() => {
    return [...mockPurchaseBills].sort((a, b) => {
      const dir = billSort.dir === 'asc' ? 1 : -1;
      const f = billSort.field;
      if (f === 'date') return dir * (new Date(a.date).getTime() - new Date(b.date).getTime());
      if (f === 'total') return dir * (a.total - b.total);
      return dir * ((a as any)[f] ?? '').toString().localeCompare(((b as any)[f] ?? '').toString());
    });
  }, [billSort]);

  const handleCreateInvoice = () => {
    if (!invForm.customer || !invForm.gstin || !invForm.amount) {
      toast({ title: 'Validation Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }
    const amt = parseFloat(invForm.amount);
    if (isNaN(amt) || amt <= 0) {
      toast({ title: 'Validation Error', description: 'Enter a valid amount', variant: 'destructive' });
      return;
    }
    const rate = parseFloat(invForm.gstRate) / 100;
    const gst = amt * rate;
    toast({
      title: `${invoiceType} Created`,
      description: `${invForm.customer} — Taxable: ${fmt(amt)}, GST: ${fmt(gst)}, Total: ${fmt(amt + gst)}`,
    });
    setInvoiceDialog(false);
    setInvForm({ customer: '', gstin: '', amount: '', gstRate: '18' });
  };

  const handleExport = (what: string, format: 'excel' | 'pdf') => {
    toast({ title: `Export ${format.toUpperCase()}`, description: `Preparing ${what} export...` });
  };

  const totalInputGst = mockPurchaseBills.reduce((s, b) => s + b.inputGst, 0);
  const totalOutputGst = mockInvoices.filter(i => i.type === 'Sales Invoice').reduce((s, i) => s + i.cgst + i.sgst + i.igst, 0);

  // Summary KPIs
  const kpis = [
    { label: 'Total Revenue', value: fmt(plData.revenue), icon: IndianRupee, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Net Profit', value: fmt(netProfit), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
    { label: 'Margin', value: `${marginPct}%`, icon: Percent, color: 'text-blue-600', bg: 'bg-blue-500/10' },
    { label: 'Output GST', value: fmt(totalOutputGst), icon: Receipt, color: 'text-amber-600', bg: 'bg-amber-500/10' },
    { label: 'Input GST Credit', value: fmt(totalInputGst), icon: Calculator, color: 'text-violet-600', bg: 'bg-violet-500/10' },
    { label: 'Net GST Payable', value: fmt(totalOutputGst - totalInputGst), icon: Building2, color: 'text-rose-600', bg: 'bg-rose-500/10' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Finance & Taxation</h1>
          <p className="text-muted-foreground">Invoicing, purchase bills, GST filing & profitability</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => handleExport('Finance Data', 'excel')}>
            <FileSpreadsheet className="w-4 h-4" />Excel
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => handleExport('Finance Data', 'pdf')}>
            <FileDown className="w-4 h-4" />PDF
          </Button>
        </div>
      </div>

      {/* Dashboard Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map(k => (
          <Card key={k.label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg ${k.bg}`}><k.icon className={`w-4 h-4 ${k.color}`} /></div>
              </div>
              <p className="text-xl font-bold">{k.value}</p>
              <p className="text-xs text-muted-foreground">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="invoices">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="invoices" className="gap-1.5"><FileText className="w-4 h-4" />Invoices</TabsTrigger>
          <TabsTrigger value="purchase" className="gap-1.5"><Receipt className="w-4 h-4" />Purchase Bills</TabsTrigger>
          <TabsTrigger value="gstr1" className="gap-1.5"><Building2 className="w-4 h-4" />GSTR-1 Export</TabsTrigger>
          <TabsTrigger value="pnl" className="gap-1.5"><TrendingUp className="w-4 h-4" />Profit & Loss</TabsTrigger>
        </TabsList>

        {/* ── INVOICES TAB ── */}
        <TabsContent value="invoices" className="space-y-4 mt-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button className="gap-2" onClick={() => { setInvoiceType('Sales Invoice'); setInvoiceDialog(true); }}>
              <Plus className="w-4 h-4" />Sales Invoice
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => { setInvoiceType('Debit Note'); setInvoiceDialog(true); }}>
              <Plus className="w-4 h-4" />Debit Note
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => { setInvoiceType('Credit Note'); setInvoiceDialog(true); }}>
              <Plus className="w-4 h-4" />Credit Note
            </Button>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" className="gap-1" onClick={() => handleExport('Invoices', 'excel')}><FileSpreadsheet className="w-3.5 h-3.5" />Excel</Button>
              <Button variant="outline" size="sm" className="gap-1" onClick={() => handleExport('Invoices', 'pdf')}><FileDown className="w-3.5 h-3.5" />PDF</Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold cursor-pointer select-none" onClick={() => toggleInvSort('id')}>
                      <span className="flex items-center">Invoice #<SortIcon active={invoiceSort.field === 'id'} dir={invoiceSort.dir} /></span>
                    </TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold cursor-pointer select-none" onClick={() => toggleInvSort('customer')}>
                      <span className="flex items-center">Customer<SortIcon active={invoiceSort.field === 'customer'} dir={invoiceSort.dir} /></span>
                    </TableHead>
                    <TableHead className="font-semibold">GSTIN</TableHead>
                    <TableHead className="font-semibold cursor-pointer select-none" onClick={() => toggleInvSort('date')}>
                      <span className="flex items-center">Date<SortIcon active={invoiceSort.field === 'date'} dir={invoiceSort.dir} /></span>
                    </TableHead>
                    <TableHead className="font-semibold text-right cursor-pointer select-none" onClick={() => toggleInvSort('taxableValue')}>
                      <span className="flex items-center justify-end">Taxable<SortIcon active={invoiceSort.field === 'taxableValue'} dir={invoiceSort.dir} /></span>
                    </TableHead>
                    <TableHead className="font-semibold text-right">CGST</TableHead>
                    <TableHead className="font-semibold text-right">SGST</TableHead>
                    <TableHead className="font-semibold text-right">IGST</TableHead>
                    <TableHead className="font-semibold text-right cursor-pointer select-none" onClick={() => toggleInvSort('total')}>
                      <span className="flex items-center justify-end">Total<SortIcon active={invoiceSort.field === 'total'} dir={invoiceSort.dir} /></span>
                    </TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedInvoices.map(inv => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-sm">{inv.id}</TableCell>
                      <TableCell>
                        <Badge variant={inv.type === 'Sales Invoice' ? 'default' : inv.type === 'Debit Note' ? 'secondary' : 'outline'}>
                          {inv.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{inv.customer}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{inv.gstin}</TableCell>
                      <TableCell className="text-sm">{format(new Date(inv.date), 'dd MMM yyyy')}</TableCell>
                      <TableCell className="text-right text-sm">{fmt(inv.taxableValue)}</TableCell>
                      <TableCell className="text-right text-sm">{inv.cgst > 0 ? fmt(inv.cgst) : '—'}</TableCell>
                      <TableCell className="text-right text-sm">{inv.sgst > 0 ? fmt(inv.sgst) : '—'}</TableCell>
                      <TableCell className="text-right text-sm">{inv.igst > 0 ? fmt(inv.igst) : '—'}</TableCell>
                      <TableCell className="text-right font-semibold">{fmt(inv.total)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          inv.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' :
                          inv.status === 'Pending' ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' :
                          'bg-blue-500/10 text-blue-600 border-blue-500/30'
                        }>{inv.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="gap-1" onClick={() => toast({ title: 'PDF Downloaded', description: `${inv.id} saved` })}>
                          <Download className="w-3 h-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── PURCHASE BILLS TAB ── */}
        <TabsContent value="purchase" className="space-y-4 mt-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button className="gap-2" onClick={() => toast({ title: 'Add Purchase Bill', description: 'Form coming soon — simulated' })}>
              <Plus className="w-4 h-4" />Add Purchase Bill
            </Button>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" className="gap-1" onClick={() => handleExport('Purchase Bills', 'excel')}><FileSpreadsheet className="w-3.5 h-3.5" />Excel</Button>
              <Button variant="outline" size="sm" className="gap-1" onClick={() => handleExport('Purchase Bills', 'pdf')}><FileDown className="w-3.5 h-3.5" />PDF</Button>
            </div>
          </div>

          {/* Input GST Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-5 pb-4">
                <p className="text-xs text-muted-foreground mb-1">Total Input GST (CGST+SGST)</p>
                <p className="text-xl font-bold">{fmt(mockPurchaseBills.reduce((s, b) => s + b.cgst + b.sgst, 0))}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <p className="text-xs text-muted-foreground mb-1">Total Input IGST</p>
                <p className="text-xl font-bold">{fmt(mockPurchaseBills.reduce((s, b) => s + b.igst, 0))}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <p className="text-xs text-muted-foreground mb-1">Total Input Tax Credit</p>
                <p className="text-xl font-bold text-emerald-600">{fmt(totalInputGst)}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Purchase Bill Ledger</CardTitle>
              <CardDescription>Supplier bills with input GST tracking</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold cursor-pointer select-none" onClick={() => toggleBillSort('supplier')}>
                      <span className="flex items-center">Supplier<SortIcon active={billSort.field === 'supplier'} dir={billSort.dir} /></span>
                    </TableHead>
                    <TableHead className="font-semibold">GSTIN</TableHead>
                    <TableHead className="font-semibold">Bill No</TableHead>
                    <TableHead className="font-semibold cursor-pointer select-none" onClick={() => toggleBillSort('date')}>
                      <span className="flex items-center">Date<SortIcon active={billSort.field === 'date'} dir={billSort.dir} /></span>
                    </TableHead>
                    <TableHead className="font-semibold text-right">Taxable</TableHead>
                    <TableHead className="font-semibold text-right">CGST</TableHead>
                    <TableHead className="font-semibold text-right">SGST</TableHead>
                    <TableHead className="font-semibold text-right">IGST</TableHead>
                    <TableHead className="font-semibold text-right cursor-pointer select-none" onClick={() => toggleBillSort('total')}>
                      <span className="flex items-center justify-end">Total<SortIcon active={billSort.field === 'total'} dir={billSort.dir} /></span>
                    </TableHead>
                    <TableHead className="font-semibold text-right">Input GST</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedBills.map(b => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.supplier}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{b.gstin}</TableCell>
                      <TableCell className="font-mono text-sm">{b.billNo}</TableCell>
                      <TableCell className="text-sm">{format(new Date(b.date), 'dd MMM yyyy')}</TableCell>
                      <TableCell className="text-right text-sm">{fmt(b.taxableValue)}</TableCell>
                      <TableCell className="text-right text-sm">{b.cgst > 0 ? fmt(b.cgst) : '—'}</TableCell>
                      <TableCell className="text-right text-sm">{b.sgst > 0 ? fmt(b.sgst) : '—'}</TableCell>
                      <TableCell className="text-right text-sm">{b.igst > 0 ? fmt(b.igst) : '—'}</TableCell>
                      <TableCell className="text-right font-semibold">{fmt(b.total)}</TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600">{fmt(b.inputGst)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── GSTR-1 EXPORT TAB ── */}
        <TabsContent value="gstr1" className="space-y-4 mt-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary" className="gap-1"><Building2 className="w-3 h-3" />GSTR-1 Ready Data</Badge>
            <div className="ml-auto flex gap-2">
              <Button className="gap-2" onClick={() => {
                toast({ title: 'GSTR-1 Export', description: 'Generating GST Portal compatible file...' });
              }}>
                <Download className="w-4 h-4" />Export for GST Portal
              </Button>
              <Button variant="outline" size="sm" className="gap-1" onClick={() => handleExport('GSTR-1', 'excel')}><FileSpreadsheet className="w-3.5 h-3.5" />Excel</Button>
              <Button variant="outline" size="sm" className="gap-1" onClick={() => handleExport('GSTR-1', 'pdf')}><FileDown className="w-3.5 h-3.5" />PDF</Button>
            </div>
          </div>

          {/* GSTR-1 Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-5 pb-4">
                <p className="text-xs text-muted-foreground mb-1">Total Taxable Value</p>
                <p className="text-lg font-bold">{fmt(mockGstr1.reduce((s, r) => s + r.taxableValue, 0))}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <p className="text-xs text-muted-foreground mb-1">Total CGST</p>
                <p className="text-lg font-bold">{fmt(mockGstr1.reduce((s, r) => s + r.cgst, 0))}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <p className="text-xs text-muted-foreground mb-1">Total SGST</p>
                <p className="text-lg font-bold">{fmt(mockGstr1.reduce((s, r) => s + r.sgst, 0))}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 pb-4">
                <p className="text-xs text-muted-foreground mb-1">Total IGST</p>
                <p className="text-lg font-bold">{fmt(mockGstr1.reduce((s, r) => s + r.igst, 0))}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>GSTR-1 Data Extract</CardTitle>
              <CardDescription>Sales invoices formatted for GST portal filing</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">GSTIN</TableHead>
                    <TableHead className="font-semibold">Invoice No</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Customer</TableHead>
                    <TableHead className="font-semibold text-right">Taxable Value</TableHead>
                    <TableHead className="font-semibold text-right">CGST</TableHead>
                    <TableHead className="font-semibold text-right">SGST</TableHead>
                    <TableHead className="font-semibold text-right">IGST</TableHead>
                    <TableHead className="font-semibold text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockGstr1.map(r => (
                    <TableRow key={r.invoiceNo}>
                      <TableCell className="font-mono text-xs">{r.gstin}</TableCell>
                      <TableCell className="font-mono text-sm">{r.invoiceNo}</TableCell>
                      <TableCell className="text-sm">{format(new Date(r.date), 'dd MMM yyyy')}</TableCell>
                      <TableCell className="font-medium">{r.customer}</TableCell>
                      <TableCell className="text-right text-sm">{fmt(r.taxableValue)}</TableCell>
                      <TableCell className="text-right text-sm">{r.cgst > 0 ? fmt(r.cgst) : '—'}</TableCell>
                      <TableCell className="text-right text-sm">{r.sgst > 0 ? fmt(r.sgst) : '—'}</TableCell>
                      <TableCell className="text-right text-sm">{r.igst > 0 ? fmt(r.igst) : '—'}</TableCell>
                      <TableCell className="text-right font-semibold">{fmt(r.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── PROFIT & LOSS TAB ── */}
        <TabsContent value="pnl" className="space-y-4 mt-4">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <Badge variant="secondary" className="gap-1"><TrendingUp className="w-3 h-3" />Current Period: Feb 2026</Badge>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" className="gap-1" onClick={() => handleExport('P&L Statement', 'excel')}><FileSpreadsheet className="w-3.5 h-3.5" />Excel</Button>
              <Button variant="outline" size="sm" className="gap-1" onClick={() => handleExport('P&L Statement', 'pdf')}><FileDown className="w-3.5 h-3.5" />PDF</Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Profit & Loss Statement</CardTitle>
              <CardDescription>Revenue breakdown and net profitability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Revenue */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10"><TrendingUp className="w-4 h-4 text-emerald-600" /></div>
                    <div>
                      <p className="font-semibold">Revenue</p>
                      <p className="text-xs text-muted-foreground">Total sales across all channels</p>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-emerald-600">{fmt(plData.revenue)}</p>
                </div>

                {/* Deductions */}
                {[
                  { label: 'Commission', desc: 'Marketplace & platform fees', value: plData.commission, color: 'text-amber-600', bg: 'bg-amber-500/10', borderColor: 'border-amber-500/10' },
                  { label: 'Logistics', desc: 'Shipping & delivery costs', value: plData.logistics, color: 'text-blue-600', bg: 'bg-blue-500/10', borderColor: 'border-blue-500/10' },
                  { label: 'Refund Impact', desc: 'Returns & refund losses', value: plData.refundImpact, color: 'text-rose-600', bg: 'bg-rose-500/10', borderColor: 'border-rose-500/10' },
                  { label: 'Other Expenses', desc: 'Packaging, ads & misc', value: plData.otherExpenses, color: 'text-muted-foreground', bg: 'bg-muted/50', borderColor: 'border-muted' },
                ].map(item => (
                  <div key={item.label} className={`flex items-center justify-between p-3 rounded-lg bg-background border ${item.borderColor}`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${item.bg}`}><TrendingDown className={`w-4 h-4 ${item.color}`} /></div>
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                    <p className={`text-lg font-semibold ${item.color}`}>- {fmt(item.value)}</p>
                  </div>
                ))}

                {/* Divider */}
                <div className="border-t-2 border-dashed my-2" />

                {/* Net Profit */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border-2 border-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10"><IndianRupee className="w-5 h-5 text-primary" /></div>
                    <div>
                      <p className="font-bold text-lg">Net Profit</p>
                      <p className="text-sm text-muted-foreground">Margin: {marginPct}%</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-primary">{fmt(netProfit)}</p>
                </div>

                {/* Margin Bar */}
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Profit Margin</span>
                    <span className="font-semibold">{marginPct}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500 transition-all"
                      style={{ width: `${marginPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Invoice Creation Dialog ── */}
      <Dialog open={invoiceDialog} onOpenChange={setInvoiceDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create {invoiceType}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer Name *</Label>
                <Input placeholder="e.g. RetailMart India" value={invForm.customer} onChange={e => setInvForm(f => ({ ...f, customer: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>GSTIN *</Label>
                <Input placeholder="e.g. 27AAACR5055K1ZY" maxLength={15} value={invForm.gstin} onChange={e => setInvForm(f => ({ ...f, gstin: e.target.value.toUpperCase() }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Taxable Amount (₹) *</Label>
                <Input type="number" placeholder="0.00" min="0" value={invForm.amount} onChange={e => setInvForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>GST Rate</Label>
                <Select value={invForm.gstRate} onValueChange={v => setInvForm(f => ({ ...f, gstRate: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5%</SelectItem>
                    <SelectItem value="12">12%</SelectItem>
                    <SelectItem value="18">18%</SelectItem>
                    <SelectItem value="28">28%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {invForm.amount && !isNaN(parseFloat(invForm.amount)) && parseFloat(invForm.amount) > 0 && (
              <Card className="bg-muted/30">
                <CardContent className="pt-4 pb-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">GST Auto Calculation</p>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Taxable</p>
                      <p className="font-semibold">{fmt(parseFloat(invForm.amount))}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">GST ({invForm.gstRate}%)</p>
                      <p className="font-semibold">{fmt(parseFloat(invForm.amount) * parseFloat(invForm.gstRate) / 100)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Total</p>
                      <p className="font-bold text-primary">{fmt(parseFloat(invForm.amount) * (1 + parseFloat(invForm.gstRate) / 100))}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            <Button className="w-full" onClick={handleCreateInvoice}>
              Create {invoiceType} & Download PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
