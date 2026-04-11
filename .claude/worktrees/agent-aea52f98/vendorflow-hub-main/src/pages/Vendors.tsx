import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { mockVendors } from '@/services/mockData';
import { Vendor } from '@/types';
import { Users, Plus, MapPin, Package, ShoppingCart, Crown, ShieldCheck, ShieldX, Loader2, Download, FileSpreadsheet, FileText, Search } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const statusBadge = (status: string) => {
  switch (status) {
    case 'active': return <Badge variant="outline" className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">Active</Badge>;
    case 'inactive': return <Badge variant="outline" className="bg-muted text-muted-foreground">Inactive</Badge>;
    case 'suspended': return <Badge variant="outline" className="bg-rose-500/15 text-rose-600 border-rose-500/30">Suspended</Badge>;
    default: return null;
  }
};

const subscriptionData: Record<string, { plan: string; status: string }> = {
  'VEN-001': { plan: 'Pro', status: 'active' },
  'VEN-002': { plan: 'Enterprise', status: 'active' },
  'VEN-003': { plan: 'Basic', status: 'expired' },
};

// Simulated GST verification response
const simulateGSTVerification = (gstNumber: string): Promise<{ businessName: string; address: string; gstStatus: string }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const gstData: Record<string, { businessName: string; address: string; gstStatus: string }> = {
        '29AABCT1332L1ZG': { businessName: 'TechGadgets India Pvt Ltd', address: '123 Electronic City, Phase 1, Bangalore, Karnataka - 560100', gstStatus: 'Active' },
        '27AADCF8765M1ZP': { businessName: 'FashionHub Exports LLP', address: '456 Textile Market, Kalbadevi, Mumbai, Maharashtra - 400001', gstStatus: 'Active' },
        '07AAFCB9012K1ZR': { businessName: 'BabyCare Essentials Pvt Ltd', address: '789 Kids Market, Chandni Chowk, Delhi - 110001', gstStatus: 'Active' },
      };
      if (gstData[gstNumber]) {
        resolve(gstData[gstNumber]);
      } else if (/^\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z\d]{2}$/.test(gstNumber)) {
        resolve({ businessName: 'Verified Business Entity', address: 'Registered Address, India', gstStatus: 'Active' });
      } else {
        resolve({ businessName: '', address: '', gstStatus: 'Invalid' });
      }
    }, 1500);
  });
};

export default function Vendors() {
  const { toast } = useToast();
  const [vendors, setVendors] = useState<Vendor[]>(mockVendors);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [gstInputs, setGstInputs] = useState<Record<string, string>>({});

  const activeCount = vendors.filter(v => v.status === 'active').length;
  const totalProducts = vendors.reduce((s, v) => s + v.totalProducts, 0);
  const totalOrders = vendors.reduce((s, v) => s + v.totalOrders, 0);
  const verifiedCount = vendors.filter(v => v.gstVerified).length;

  const handleVerifyGST = async (vendorId: string) => {
    const vendor = vendors.find(v => v.vendorId === vendorId);
    const gstNumber = gstInputs[vendorId] || vendor?.gstNumber || '';
    if (!gstNumber) {
      toast({ title: 'GST Required', description: 'Please enter a GST number first.', variant: 'destructive' });
      return;
    }
    setVerifyingId(vendorId);
    const result = await simulateGSTVerification(gstNumber);
    setVendors(prev => prev.map(v => v.vendorId === vendorId ? {
      ...v,
      gstNumber,
      gstVerified: result.gstStatus === 'Active',
      gstBusinessName: result.businessName,
      gstAddress: result.address,
      gstStatus: result.gstStatus,
    } : v));
    setVerifyingId(null);
    toast({
      title: result.gstStatus === 'Active' ? 'GST Verified' : 'Verification Failed',
      description: result.gstStatus === 'Active' ? `${result.businessName} verified successfully.` : 'Invalid GST number or inactive registration.',
    });
  };

  const handleExport = (format: 'excel' | 'pdf') => {
    toast({ title: `${format === 'excel' ? 'Excel' : 'PDF'} Export`, description: `Vendor data exported as ${format.toUpperCase()} successfully.` });
  };

  const handleImport = () => {
    toast({ title: 'Import Vendors', description: 'Vendor import from Excel initiated (simulated).' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vendor Management</h1>
          <p className="text-muted-foreground">Manage all vendor partners and their performance</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" className="gap-1.5" onClick={handleImport}>
            <FileSpreadsheet className="w-4 h-4" />Import Excel
          </Button>
          <Button variant="outline" className="gap-1.5" onClick={() => handleExport('excel')}>
            <Download className="w-4 h-4" />Export Excel
          </Button>
          <Button variant="outline" className="gap-1.5" onClick={() => handleExport('pdf')}>
            <FileText className="w-4 h-4" />Export PDF
          </Button>
          <Button className="gap-2"><Plus className="w-4 h-4" />Add Vendor</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><Users className="w-5 h-5 text-primary" /></div><div><p className="text-2xl font-bold">{vendors.length}</p><p className="text-sm text-muted-foreground">Total Vendors</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-emerald-500/10"><Users className="w-5 h-5 text-emerald-600" /></div><div><p className="text-2xl font-bold">{activeCount}</p><p className="text-sm text-muted-foreground">Active</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-500/10"><Package className="w-5 h-5 text-blue-600" /></div><div><p className="text-2xl font-bold">{totalProducts}</p><p className="text-sm text-muted-foreground">Total Products</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-amber-500/10"><ShoppingCart className="w-5 h-5 text-amber-600" /></div><div><p className="text-2xl font-bold">{totalOrders.toLocaleString()}</p><p className="text-sm text-muted-foreground">Total Orders</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-emerald-500/10"><ShieldCheck className="w-5 h-5 text-emerald-600" /></div><div><p className="text-2xl font-bold">{verifiedCount}/{vendors.length}</p><p className="text-sm text-muted-foreground">GST Verified</p></div></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendor List</CardTitle>
          <CardDescription>All registered vendor partners with GST verification & subscription status</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Vendor ID</TableHead>
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Contact</TableHead>
                <TableHead className="font-semibold">GST Number</TableHead>
                <TableHead className="font-semibold">GST Status</TableHead>
                <TableHead className="font-semibold">Warehouses</TableHead>
                <TableHead className="text-center font-semibold">Products</TableHead>
                <TableHead className="text-center font-semibold">Orders</TableHead>
                <TableHead className="font-semibold">Subscription</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.map(v => {
                const sub = subscriptionData[v.vendorId];
                return (
                  <TableRow key={v.vendorId}>
                    <TableCell className="font-mono text-sm">{v.vendorId}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{v.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{v.address.split(',').slice(-2).join(',').trim()}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{v.email}</p>
                        <p className="text-muted-foreground">{v.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Input
                          className="w-40 h-8 text-xs font-mono"
                          placeholder="Enter GST No."
                          value={gstInputs[v.vendorId] ?? v.gstNumber ?? ''}
                          onChange={e => setGstInputs(prev => ({ ...prev, [v.vendorId]: e.target.value }))}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1"
                          disabled={verifyingId === v.vendorId}
                          onClick={() => handleVerifyGST(v.vendorId)}
                        >
                          {verifyingId === v.vendorId ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                          Verify
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {v.gstVerified === true && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <button className="flex items-center gap-1 cursor-pointer">
                              <Badge variant="outline" className="gap-1 bg-emerald-500/15 text-emerald-600 border-emerald-500/30">
                                <ShieldCheck className="w-3 h-3" />Verified
                              </Badge>
                            </button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-emerald-600" />GST Verification Details
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-3 text-sm">
                              <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-muted-foreground text-xs mb-1">GST Number</p>
                                <p className="font-mono font-semibold">{v.gstNumber}</p>
                              </div>
                              <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-muted-foreground text-xs mb-1">Business Name (as per GST)</p>
                                <p className="font-semibold">{v.gstBusinessName}</p>
                              </div>
                              <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-muted-foreground text-xs mb-1">Registered Address</p>
                                <p>{v.gstAddress}</p>
                              </div>
                              <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-muted-foreground text-xs mb-1">GST Status</p>
                                <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30" variant="outline">{v.gstStatus}</Badge>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      {v.gstVerified === false && (
                        <Badge variant="outline" className="gap-1 bg-rose-500/15 text-rose-600 border-rose-500/30">
                          <ShieldX className="w-3 h-3" />Not Verified
                        </Badge>
                      )}
                      {v.gstVerified === undefined && !v.gstNumber && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                      {v.gstVerified === undefined && v.gstNumber && (
                        <Badge variant="outline" className="gap-1 bg-amber-500/15 text-amber-600 border-amber-500/30">
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {v.warehouses.map(w => <Badge key={w} variant="secondary" className="text-xs">{w}</Badge>)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium">{v.totalProducts}</TableCell>
                    <TableCell className="text-center font-medium">{v.totalOrders.toLocaleString()}</TableCell>
                    <TableCell>
                      {sub && (
                        <div className="flex items-center gap-1.5">
                          <Crown className="w-3.5 h-3.5 text-amber-500" />
                          <Badge variant="secondary" className="text-xs">{sub.plan}</Badge>
                          <Badge variant="outline" className={`text-xs ${sub.status === 'active' ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' : 'bg-rose-500/15 text-rose-600 border-rose-500/30'}`}>
                            {sub.status}
                          </Badge>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{statusBadge(v.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{format(new Date(v.joinDate), 'dd MMM yyyy')}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
