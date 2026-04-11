import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { mockProductHealth, mockSKUMappings, portalConfigs } from '@/services/mockData';
import { ProductHealthStatus, Portal } from '@/types';
import { Activity, CheckCircle2, XCircle, Package, Search, AlertCircle } from 'lucide-react';
import { DateFilter, ExportButton, useRowSelection, SelectAllCheckbox, RowCheckbox } from '@/components/TableEnhancements';

const statusConfig: Record<ProductHealthStatus, { label: string; icon: React.ElementType; className: string }> = {
  live: { label: 'Live', icon: CheckCircle2, className: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' },
  not_active: { label: 'Not Active', icon: XCircle, className: 'bg-amber-500/15 text-amber-600 border-amber-500/30' },
  out_of_stock: { label: 'Out of Stock', icon: Package, className: 'bg-rose-500/15 text-rose-600 border-rose-500/30' },
};

function getOverallStatus(portalStatus: Record<Portal, ProductHealthStatus>): ProductHealthStatus {
  const values = Object.values(portalStatus);
  if (values.every(s => s === 'live')) return 'live';
  if (values.some(s => s === 'out_of_stock')) return 'out_of_stock';
  return 'not_active';
}

function getMasterSku(productId: string): string {
  const mapping = mockSKUMappings.find(m => m.masterSkuId.replace('MSK', 'PROD') === productId);
  return mapping?.masterSkuId || productId.replace('PROD', 'MSK');
}

export default function ProductHealth() {
  const [selectedPortal, setSelectedPortal] = useState<Portal | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<ProductHealthStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('30days');

  const filteredProducts = mockProductHealth.filter((product) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const masterSku = getMasterSku(product.productId).toLowerCase();
      if (!product.productName.toLowerCase().includes(q) && !masterSku.includes(q) && !product.productId.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (selectedPortal !== 'all' && selectedStatus !== 'all') {
      return product.portalStatus[selectedPortal] === selectedStatus;
    }
    if (selectedStatus !== 'all') {
      return Object.values(product.portalStatus).includes(selectedStatus);
    }
    return true;
  });

  const rowSelection = useRowSelection(filteredProducts.map(p => p.productId));

  const getStatusBadge = (status: ProductHealthStatus) => {
    const config = statusConfig[status];
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={`${config.className} gap-1 font-medium`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const totalProducts = mockProductHealth.length;
  const liveCount = mockProductHealth.filter(p => Object.values(p.portalStatus).every(s => s === 'live')).length;
  const partialCount = mockProductHealth.filter(p => {
    const values = Object.values(p.portalStatus);
    return values.some(s => s === 'live') && values.some(s => s !== 'live');
  }).length;
  const outOfStockCount = mockProductHealth.filter(p => Object.values(p.portalStatus).some(s => s === 'out_of_stock')).length;
  const healthScore = Math.round(
    (mockProductHealth.reduce((sum, p) => {
      const live = Object.values(p.portalStatus).filter(s => s === 'live').length;
      return sum + (live / Object.values(p.portalStatus).length);
    }, 0) / mockProductHealth.length) * 100
  );

  const dateLabel = dateFilter === 'today' ? 'Today' : dateFilter === '7days' ? 'Last 7 Days' : dateFilter === '30days' ? 'Last 30 Days' : dateFilter === 'this_month' ? 'This Month' : dateFilter === 'this_year' ? 'This Year' : 'Custom';
  const exportLabel = rowSelection.count > 0 ? undefined : `Export – ${dateLabel}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Product Health Check</h1>
          <p className="text-muted-foreground">Monitor product visibility status across all portals</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <DateFilter value={dateFilter} onChange={setDateFilter} />
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by SKU or name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-[200px] pl-9" />
          </div>
          <Select value={selectedPortal} onValueChange={(v) => setSelectedPortal(v as Portal | 'all')}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Select Portal" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Portals</SelectItem>
              {portalConfigs.map((portal) => (<SelectItem key={portal.id} value={portal.id}>{portal.icon} {portal.name}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as ProductHealthStatus | 'all')}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Select Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="live">🟢 Live</SelectItem>
              <SelectItem value="not_active">🟡 Not Active</SelectItem>
              <SelectItem value="out_of_stock">🔴 Out of Stock</SelectItem>
            </SelectContent>
          </Select>
          <ExportButton label={exportLabel} selectedCount={rowSelection.count} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><Activity className="w-5 h-5 text-primary" /></div><div><p className="text-2xl font-bold">{totalProducts}</p><p className="text-sm text-muted-foreground">Total Products</p></div></div></CardContent></Card>
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-10"><SelectAllCheckbox checked={rowSelection.isAllSelected} onCheckedChange={rowSelection.toggleAll} /></TableHead>
                  <TableHead className="font-semibold">Product Name</TableHead>
                  <TableHead className="font-semibold">Master SKU</TableHead>
                  {portalConfigs.map((portal) => (
                    <TableHead key={portal.id} className="text-center font-semibold">
                      <span className="flex items-center justify-center gap-1">{portal.icon} {portal.name}</span>
                    </TableHead>
                  ))}
                  <TableHead className="text-center font-semibold bg-primary/5">Overall</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const overall = getOverallStatus(product.portalStatus);
                  return (
                    <TableRow key={product.productId} className={rowSelection.isSelected(product.productId) ? 'bg-primary/5' : ''}>
                      <TableCell><RowCheckbox checked={rowSelection.isSelected(product.productId)} onCheckedChange={() => rowSelection.toggle(product.productId)} /></TableCell>
                      <TableCell className="font-medium">{product.productName}</TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">{getMasterSku(product.productId)}</TableCell>
                      {portalConfigs.map((portal) => (
                        <TableCell key={portal.id} className="text-center">{getStatusBadge(product.portalStatus[portal.id])}</TableCell>
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
                      <p className="text-sm">Try adjusting your filters or search query</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
