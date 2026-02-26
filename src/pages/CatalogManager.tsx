import { useState, useMemo } from 'react';
import { mockProducts } from '@/services/mockData';
import { Product, Portal } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Search, Download, FileSpreadsheet, FileText, Edit, Package, ToggleLeft,
  CheckCircle, XCircle, DollarSign, Filter, Link2, Eye, Copy,
} from 'lucide-react';

const PORTALS: Portal[] = ['amazon', 'flipkart', 'meesho', 'firstcry', 'blinkit', 'own_website'];

export default function CatalogManager() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isBulkPriceOpen, setIsBulkPriceOpen] = useState(false);
  const [isBulkStatusOpen, setIsBulkStatusOpen] = useState(false);
  const [isBulkPortalOpen, setIsBulkPortalOpen] = useState(false);
  const [bulkPriceAction, setBulkPriceAction] = useState<'fixed' | 'percent'>('percent');
  const [bulkPriceValue, setBulkPriceValue] = useState('');
  const [bulkStatus, setBulkStatus] = useState<'active' | 'inactive'>('active');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [shareLink, setShareLink] = useState('');

  const categories = useMemo(() => {
    const unique = new Set(mockProducts.map(p => p.category));
    return Array.from(unique);
  }, []);

  const filteredProducts = useMemo(() => {
    return mockProducts.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.masterSkuId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.brand.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, categoryFilter]);

  const allSelected = filteredProducts.length > 0 && selectedIds.length === filteredProducts.length;

  const toggleAll = () => {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(filteredProducts.map(p => p.productId));
  };

  const toggleOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkPriceUpdate = () => {
    toast({ title: 'Prices Updated', description: `${selectedIds.length} products updated.` });
    setIsBulkPriceOpen(false);
    setBulkPriceValue('');
  };

  const handleBulkStatusUpdate = () => {
    toast({ title: 'Status Updated', description: `${selectedIds.length} products set to ${bulkStatus}.` });
    setIsBulkStatusOpen(false);
  };

  const handleBulkPortalToggle = (portal: Portal, action: 'enable' | 'disable') => {
    toast({ title: `Portal ${action === 'enable' ? 'Enabled' : 'Disabled'}`, description: `${portal} ${action}d for ${selectedIds.length} products.` });
  };

  const handleExport = (format: 'excel' | 'pdf') => {
    toast({ title: `Exporting ${format.toUpperCase()}`, description: `Catalog export initiated for ${filteredProducts.length} products.` });
  };

  const handleGenerateShareLink = () => {
    const link = `${window.location.origin}/catalog/public/${Date.now().toString(36)}`;
    setShareLink(link);
    toast({ title: 'Public Catalog Link Generated', description: 'Read-only catalog link created.' });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast({ title: 'Link Copied', description: 'Catalog share link copied to clipboard.' });
  };

  const formatCurrency = (value: number) => `₹${value.toLocaleString()}`;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Catalog Manager</h1>
          <p className="text-muted-foreground">Bulk manage products, pricing, status, and portal visibility</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={handleGenerateShareLink}>
            <Link2 className="w-4 h-4" />Share Catalog
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => handleExport('excel')}>
            <FileSpreadsheet className="w-4 h-4" />Export Excel
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => handleExport('pdf')}>
            <FileText className="w-4 h-4" />Export PDF
          </Button>
        </div>
      </div>

      {/* Share Link */}
      {shareLink && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-3 flex items-center gap-3">
            <Link2 className="w-4 h-4 text-primary shrink-0" />
            <code className="text-xs flex-1 truncate text-primary">{shareLink}</code>
            <Button size="sm" variant="outline" className="gap-1 shrink-0" onClick={handleCopyLink}>
              <Copy className="w-3 h-3" />Copy
            </Button>
            <Badge variant="outline" className="text-xs">Read-Only</Badge>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><Package className="w-5 h-5 text-primary" /></div><div><p className="text-2xl font-bold">{mockProducts.length}</p><p className="text-sm text-muted-foreground">Total Products</p></div></div></CardContent></Card>
        <Card className="bg-card"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-emerald-500/10"><CheckCircle className="w-5 h-5 text-emerald-600" /></div><div><p className="text-2xl font-bold">{mockProducts.filter(p => p.status === 'active').length}</p><p className="text-sm text-muted-foreground">Active</p></div></div></CardContent></Card>
        <Card className="bg-card"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-muted"><XCircle className="w-5 h-5 text-muted-foreground" /></div><div><p className="text-2xl font-bold">{mockProducts.filter(p => p.status === 'inactive').length}</p><p className="text-sm text-muted-foreground">Inactive</p></div></div></CardContent></Card>
        <Card className="bg-card"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-500/10"><DollarSign className="w-5 h-5 text-blue-600" /></div><div><p className="text-2xl font-bold">{selectedIds.length}</p><p className="text-sm text-muted-foreground">Selected</p></div></div></CardContent></Card>
      </div>

      {/* Filters & Bulk Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search products..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
              </SelectContent>
            </Select>
            {selectedIds.length > 0 && (
              <>
                <div className="h-6 w-px bg-border" />
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setIsBulkPriceOpen(true)}>
                  <Edit className="w-3.5 h-3.5" />Bulk Edit Price
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setIsBulkStatusOpen(true)}>
                  <ToggleLeft className="w-3.5 h-3.5" />Bulk Status
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setIsBulkPortalOpen(true)}>
                  <Filter className="w-3.5 h-3.5" />Portal Toggle
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-10">
                    <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                  </TableHead>
                  <TableHead className="font-semibold">Product</TableHead>
                  <TableHead className="font-semibold">Master SKU</TableHead>
                  <TableHead className="font-semibold">Category</TableHead>
                  <TableHead className="font-semibold text-right">MRP</TableHead>
                  <TableHead className="font-semibold text-right">Base Price</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Portals</TableHead>
                  <TableHead className="font-semibold text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map(product => (
                  <TableRow key={product.productId} className={`hover:bg-muted/30 ${selectedIds.includes(product.productId) ? 'bg-primary/5' : ''}`}>
                    <TableCell>
                      <Checkbox checked={selectedIds.includes(product.productId)} onCheckedChange={() => toggleOne(product.productId)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img src={product.imageUrl} alt={product.name} className="w-9 h-9 rounded-lg object-cover" />
                        <div>
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.brand}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{product.masterSkuId}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs">{product.category}</Badge></TableCell>
                    <TableCell className="text-right text-sm">{formatCurrency(product.mrp)}</TableCell>
                    <TableCell className="text-right font-medium text-sm">{formatCurrency(product.basePrice)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={product.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}>
                        {product.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {product.portalsEnabled.map(p => (
                          <Badge key={p} variant="outline" className="text-[10px] px-1.5 py-0 capitalize">{p}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="sm" className="gap-1" onClick={() => setSelectedProduct(product)}>
                        <Eye className="w-3.5 h-3.5" />Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No products found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Detail Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-20 h-20 rounded-lg object-cover" />
                <div>
                  <h3 className="font-semibold text-lg">{selectedProduct.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedProduct.brand}</p>
                  <Badge variant="secondary" className={selectedProduct.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 mt-1' : 'bg-muted text-muted-foreground mt-1'}>
                    {selectedProduct.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground text-xs">Master SKU</p>
                  <p className="font-mono font-medium">{selectedProduct.masterSkuId}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground text-xs">Category</p>
                  <p className="font-medium">{selectedProduct.category}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground text-xs">MRP</p>
                  <p className="font-bold text-lg">{formatCurrency(selectedProduct.mrp)}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground text-xs">Base Price</p>
                  <p className="font-bold text-lg">{formatCurrency(selectedProduct.basePrice)}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground text-xs">HSN Code</p>
                  <p className="font-medium">{selectedProduct.hsnCode || 'N/A'}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-muted-foreground text-xs">GST %</p>
                  <p className="font-medium">{selectedProduct.gstPercent || 18}%</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">Portal-wise Pricing</p>
                <div className="space-y-1">
                  {Object.entries(selectedProduct.portalPrices).map(([portal, price]) => (
                    <div key={portal} className="flex justify-between items-center p-2 bg-muted/30 rounded text-sm">
                      <span className="capitalize font-medium">{portal}</span>
                      <span className="font-bold">{formatCurrency(price)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">Enabled Portals</p>
                <div className="flex gap-1.5 flex-wrap">
                  {selectedProduct.portalsEnabled.map(p => (
                    <Badge key={p} variant="outline" className="capitalize">{p}</Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Price Dialog */}
      <Dialog open={isBulkPriceOpen} onOpenChange={setIsBulkPriceOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Bulk Edit Price ({selectedIds.length} products)</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Update Type</Label>
              <Select value={bulkPriceAction} onValueChange={(v: 'fixed' | 'percent') => setBulkPriceAction(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percentage Change</SelectItem>
                  <SelectItem value="fixed">Fixed Price</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{bulkPriceAction === 'percent' ? 'Change %' : 'New Price (₹)'}</Label>
              <Input type="number" value={bulkPriceValue} onChange={e => setBulkPriceValue(e.target.value)} placeholder={bulkPriceAction === 'percent' ? 'e.g. -10' : '0.00'} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsBulkPriceOpen(false)}>Cancel</Button>
              <Button onClick={handleBulkPriceUpdate}>Apply</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Status Dialog */}
      <Dialog open={isBulkStatusOpen} onOpenChange={setIsBulkStatusOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Bulk Status Update ({selectedIds.length} products)</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select value={bulkStatus} onValueChange={(v: 'active' | 'inactive') => setBulkStatus(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsBulkStatusOpen(false)}>Cancel</Button>
              <Button onClick={handleBulkStatusUpdate}>Apply</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Portal Dialog */}
      <Dialog open={isBulkPortalOpen} onOpenChange={setIsBulkPortalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Portal Enable/Disable ({selectedIds.length} products)</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {PORTALS.map(portal => (
              <div key={portal} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="capitalize font-medium">{portal.replace('_', ' ')}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-emerald-600" onClick={() => handleBulkPortalToggle(portal, 'enable')}>Enable</Button>
                  <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleBulkPortalToggle(portal, 'disable')}>Disable</Button>
                </div>
              </div>
            ))}
            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setIsBulkPortalOpen(false)}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
