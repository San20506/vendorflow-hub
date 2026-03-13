import { useState, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { productHealthDb } from '@/services/database';
import { supabase } from '@/integrations/supabase/client';
import { portalConfigs } from '@/services/mockData';
import { ProductHealthStatus, Portal } from '@/types';
import { Activity, CheckCircle2, XCircle, Package, Search, AlertCircle, Loader2, RefreshCw, Clock, Star, MessageSquare } from 'lucide-react';
import { DateFilter, ExportButton, useRowSelection, SelectAllCheckbox, RowCheckbox } from '@/components/TableEnhancements';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const statusConfig: Record<ProductHealthStatus, { label: string; icon: React.ElementType; className: string }> = {
  live: { label: 'Live', icon: CheckCircle2, className: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' },
  not_active: { label: 'Not Active', icon: XCircle, className: 'bg-amber-500/15 text-amber-600 border-amber-500/30' },
  out_of_stock: { label: 'Out of Stock', icon: Package, className: 'bg-rose-500/15 text-rose-600 border-rose-500/30' },
};

function getOverallStatus(portalStatus: Record<string, string>): ProductHealthStatus {
  const values = Object.values(portalStatus);
  if (values.length === 0) return 'not_active';
  if (values.every(s => s === 'live')) return 'live';
  if (values.some(s => s === 'out_of_stock')) return 'out_of_stock';
  return 'not_active';
}

export default function ProductHealth() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPortal, setSelectedPortal] = useState<Portal | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<ProductHealthStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('30days');
  const [checkingHealth, setCheckingHealth] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await productHealthDb.getAll(searchQuery ? { search: searchQuery } : undefined);
      setProducts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [searchQuery]);

  const triggerHealthCheck = async () => {
    setCheckingHealth(true);
    try {
      const { data, error } = await supabase.functions.invoke('product-health-check', { body: {} });
      if (error) throw error;
      toast({
        title: '✅ Health Check Complete',
        description: `Checked ${data.checked} products. ${data.statusChanges} changes detected.`,
      });
      fetchData();
    } catch (err: any) {
      toast({ title: 'Health Check Failed', description: err.message, variant: 'destructive' });
    } finally {
      setCheckingHealth(false);
    }
  };

  const filteredProducts = useMemo(() => products.filter(product => {
    const ps = (product.portal_status || {}) as Record<string, string>;
    if (selectedPortal !== 'all' && selectedStatus !== 'all') return ps[selectedPortal] === selectedStatus;
    if (selectedStatus !== 'all') return Object.values(ps).includes(selectedStatus);
    return true;
  }), [products, selectedPortal, selectedStatus]);

  const rowSelection = useRowSelection(filteredProducts.map(p => p.id));

  const getStatusBadge = (status: ProductHealthStatus) => {
    const config = statusConfig[status];
    if (!config) return null;
    const Icon = config.icon;
    return <Badge variant="outline" className={`${config.className} gap-1 font-medium`}><Icon className="w-3 h-3" />{config.label}</Badge>;
  };

  const liveCount = products.filter(p => Object.values(p.portal_status || {}).every((s: any) => s === 'live')).length;
  const partialCount = products.filter(p => {
    const values = Object.values(p.portal_status || {}) as string[];
    return values.some(s => s === 'live') && values.some(s => s !== 'live');
  }).length;
  const outOfStockCount = products.filter(p => Object.values(p.portal_status || {}).some((s: any) => s === 'out_of_stock')).length;
  const healthScore = products.length > 0 ? Math.round((products.reduce((sum, p) => {
    const vals = Object.values(p.portal_status || {}) as string[];
    const live = vals.filter(s => s === 'live').length;
    return sum + (vals.length > 0 ? live / vals.length : 0);
  }, 0) / products.length) * 100) : 100;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Product Health Check</h1>
          <p className="text-muted-foreground">Monitor product visibility via automated URL checks every 8 hours</p>
          {products.some(p => p.last_checked_at) && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3" />
              Last checked: {format(new Date(products.find(p => p.last_checked_at)?.last_checked_at), 'dd MMM yyyy, hh:mm a')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="outline" className="gap-1.5" onClick={triggerHealthCheck} disabled={checkingHealth}>
            {checkingHealth ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Check Now
          </Button>
          <DateFilter value={dateFilter} onChange={setDateFilter} />
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-[200px] pl-9" />
          </div>
          <Select value={selectedPortal} onValueChange={v => setSelectedPortal(v as Portal | 'all')}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Select Portal" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Portals</SelectItem>
              {portalConfigs.map(p => <SelectItem key={p.id} value={p.id}>{p.icon} {p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={v => setSelectedStatus(v as ProductHealthStatus | 'all')}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Select Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="live">🟢 Live</SelectItem>
              <SelectItem value="not_active">🟡 Not Active</SelectItem>
              <SelectItem value="out_of_stock">🔴 Out of Stock</SelectItem>
            </SelectContent>
          </Select>
          <ExportButton label={rowSelection.count > 0 ? undefined : 'Export'} selectedCount={rowSelection.count} data={filteredProducts} filename="product-health" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><Activity className="w-5 h-5 text-primary" /></div><div><p className="text-2xl font-bold">{products.length}</p><p className="text-sm text-muted-foreground">Total Products</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-emerald-500/10"><CheckCircle2 className="w-5 h-5 text-emerald-600" /></div><div><p className="text-2xl font-bold">{liveCount}</p><p className="text-sm text-muted-foreground">Fully Live</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-500/10"><AlertCircle className="w-5 h-5 text-blue-600" /></div><div><p className="text-2xl font-bold">{partialCount}</p><p className="text-sm text-muted-foreground">Partially Live</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-rose-500/10"><Package className="w-5 h-5 text-rose-600" /></div><div><p className="text-2xl font-bold">{outOfStockCount}</p><p className="text-sm text-muted-foreground">Has OOS</p></div></div></CardContent></Card>
        <Card className="bg-primary/5 border-primary/20"><CardContent className="pt-6"><div className="text-center"><p className="text-3xl font-bold text-primary">{healthScore}%</p><p className="text-sm text-muted-foreground">Health Score</p></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Portal Status</CardTitle>
          <CardDescription>View product visibility across all marketplaces • {filteredProducts.length} products</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="overflow-x-auto">
               <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-10"><SelectAllCheckbox checked={rowSelection.isAllSelected} onCheckedChange={rowSelection.toggleAll} /></TableHead>
                    <TableHead className="font-semibold">Product Name</TableHead>
                    <TableHead className="text-center font-semibold"><span className="flex items-center justify-center gap-1"><Star className="w-3.5 h-3.5 text-amber-500" />Rating</span></TableHead>
                    <TableHead className="text-center font-semibold"><span className="flex items-center justify-center gap-1"><MessageSquare className="w-3.5 h-3.5 text-primary" />Reviews</span></TableHead>
                    {portalConfigs.map(p => (
                      <TableHead key={p.id} className="text-center font-semibold">
                        <span className="flex items-center justify-center gap-1">{p.icon} {p.name}</span>
                      </TableHead>
                    ))}
                    <TableHead className="text-center font-semibold bg-primary/5">Overall</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map(product => {
                    const ps = (product.portal_status || {}) as Record<string, string>;
                    const overall = getOverallStatus(ps);
                    const rating = product.rating != null ? Number(product.rating) : null;
                    const reviewCount = product.review_count ?? 0;
                    return (
                      <TableRow key={product.id} className={rowSelection.isSelected(product.id) ? 'bg-primary/5' : ''}>
                        <TableCell><RowCheckbox checked={rowSelection.isSelected(product.id)} onCheckedChange={() => rowSelection.toggle(product.id)} /></TableCell>
                        <TableCell className="font-medium">{product.product_name}</TableCell>
                        <TableCell className="text-center">
                          {rating !== null ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <span className={`inline-flex items-center gap-1 font-semibold text-sm ${rating >= 4 ? 'text-emerald-600' : rating >= 3 ? 'text-amber-600' : 'text-rose-600'}`}>
                                    <Star className="w-3.5 h-3.5 fill-current" />{rating.toFixed(1)}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>{rating >= 4 ? 'Excellent' : rating >= 3 ? 'Average' : 'Needs Attention'}</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-sm font-medium">{reviewCount > 0 ? reviewCount.toLocaleString('en-IN') : '—'}</span>
                        </TableCell>
                        {portalConfigs.map(p => (
                          <TableCell key={p.id} className="text-center">{getStatusBadge((ps[p.id] || 'not_active') as ProductHealthStatus)}</TableCell>
                        ))}
                        <TableCell className="text-center bg-primary/5">{getStatusBadge(overall)}</TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                        <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No products found</p>
                        <p className="text-sm">Try adjusting your filters or add product health data</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
