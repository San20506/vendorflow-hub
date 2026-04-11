import { useState, useMemo } from 'react';
import { mockProducts } from '@/services/mockData';
import { Product } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExcelProductUpload } from '@/components/ExcelProductUpload';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, Plus, Package, Edit, Eye, Video, Image, CheckCircle, XCircle, Upload, FileSpreadsheet, 
  ArrowUpDown, ArrowUp, ArrowDown, AlertTriangle
} from 'lucide-react';

type SortField = 'name' | 'basePrice' | 'masterSkuId' | 'status' | 'margin';
type SortDir = 'asc' | 'desc';

export default function Products() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Image/video upload simulation state
  const [productImage, setProductImage] = useState<string | null>(null);
  const [productVideo, setProductVideo] = useState<string | null>(null);

  const categories = useMemo(() => {
    const unique = new Set(mockProducts.map(p => p.category));
    return Array.from(unique);
  }, []);

  // Duplicate detection
  const duplicateSkus = useMemo(() => {
    const skuCount: Record<string, number> = {};
    mockProducts.forEach(p => {
      skuCount[p.masterSkuId] = (skuCount[p.masterSkuId] || 0) + 1;
    });
    return Object.entries(skuCount).filter(([, c]) => c > 1).map(([sku]) => sku);
  }, []);

  const getMargin = (p: Product) => ((p.mrp - p.basePrice) / p.mrp) * 100;

  const filteredProducts = useMemo(() => {
    let results = mockProducts.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.productId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.masterSkuId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.brand.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });

    results.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'basePrice': cmp = a.basePrice - b.basePrice; break;
        case 'masterSkuId': cmp = a.masterSkuId.localeCompare(b.masterSkuId); break;
        case 'status': cmp = a.status.localeCompare(b.status); break;
        case 'margin': cmp = getMargin(a) - getMargin(b); break;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });

    return results;
  }, [searchQuery, categoryFilter, statusFilter, sortField, sortDir]);

  const stats = useMemo(() => ({
    total: mockProducts.length,
    active: mockProducts.filter(p => p.status === 'active').length,
    inactive: mockProducts.filter(p => p.status === 'inactive').length,
    duplicates: duplicateSkus.length,
  }), [duplicateSkus]);

  const formatCurrency = (value: number) => `₹${value.toLocaleString()}`;
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
    return sortDir === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  const handleImageUpload = () => {
    setProductImage('https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200');
    toast({ title: 'Image uploaded', description: 'Product image preview ready.' });
  };

  const handleVideoUpload = () => {
    setProductVideo('product-demo.mp4');
    toast({ title: 'Video uploaded', description: 'Product video preview ready.' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Product Catalog</h1>
          <p className="text-muted-foreground">Manage your central product catalog and SKU mappings</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Upload className="w-4 h-4" />
                Bulk Upload via Excel
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><FileSpreadsheet className="w-5 h-5" />Bulk Product Upload</DialogTitle>
              </DialogHeader>
              <ExcelProductUpload onClose={() => setIsBulkUploadOpen(false)} />
            </DialogContent>
          </Dialog>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="manual" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                  <TabsTrigger value="excel">Excel Upload</TabsTrigger>
                </TabsList>
                <TabsContent value="manual">
                  <form className="space-y-5" onSubmit={e => { e.preventDefault(); toast({ title: 'Product Created', description: 'New product added to catalog.' }); setIsAddDialogOpen(false); }}>
                    {/* Basic Info */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Basic Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Product Name *</Label>
                          <Input id="name" placeholder="Enter product name" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="masterSku">Master SKU ID *</Label>
                          <Input id="masterSku" placeholder="e.g. MSKU-009" required />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="brand">Brand *</Label>
                          <Select>
                            <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                            <SelectContent>
                              {['Boat', 'Samsung', 'Nike', 'Puma', 'Mamaearth', 'Sony', 'Apple'].map(b => (
                                <SelectItem key={b} value={b}>{b}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="category">Category *</Label>
                          <Select>
                            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                            <SelectContent>
                              {categories.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="hsn">HSN Code *</Label>
                          <Input id="hsn" placeholder="e.g. 8518" required />
                        </div>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Pricing & Tax</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>MRP (₹) *</Label>
                          <Input type="number" placeholder="0.00" required />
                        </div>
                        <div className="space-y-2">
                          <Label>Base Price (₹) *</Label>
                          <Input type="number" placeholder="0.00" required />
                        </div>
                        <div className="space-y-2">
                          <Label>GST % *</Label>
                          <Select>
                            <SelectTrigger><SelectValue placeholder="Select GST" /></SelectTrigger>
                            <SelectContent>
                              {[0, 5, 12, 18, 28].map(g => (
                                <SelectItem key={g} value={String(g)}>{g}%</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Portal Prices */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Portal-wise Selling Price</h3>
                      <div className="grid grid-cols-5 gap-3">
                        {['Amazon', 'Flipkart', 'Meesho', 'Website', 'Blinkit'].map(portal => (
                          <div key={portal} className="space-y-1">
                            <Label className="text-xs">{portal} (₹)</Label>
                            <Input type="number" placeholder="0.00" className="h-9 text-sm" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Description & Features */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea placeholder="Product description" rows={3} />
                      </div>
                      <div className="space-y-2">
                        <Label>Product Features (multi-line)</Label>
                        <Textarea placeholder="Feature 1&#10;Feature 2&#10;Feature 3" rows={3} />
                      </div>
                    </div>

                    {/* Media Upload */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Media</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Product Image</Label>
                          {productImage ? (
                            <div className="relative border rounded-lg p-2">
                              <img src={productImage} alt="Preview" className="w-full h-32 object-cover rounded" />
                              <div className="flex gap-2 mt-2">
                                <Button type="button" size="sm" variant="outline" onClick={handleImageUpload}>Replace</Button>
                                <Button type="button" size="sm" variant="destructive" onClick={() => setProductImage(null)}>Remove</Button>
                              </div>
                            </div>
                          ) : (
                            <div onClick={handleImageUpload} className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                              <Image className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                              <p className="text-sm text-muted-foreground">Click to upload image</p>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Product Video (Optional)</Label>
                          {productVideo ? (
                            <div className="border rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Video className="w-5 h-5 text-primary" />
                                <span className="text-sm font-medium">{productVideo}</span>
                              </div>
                              <div className="flex gap-2">
                                <Button type="button" size="sm" variant="outline" onClick={handleVideoUpload}>Replace</Button>
                                <Button type="button" size="sm" variant="destructive" onClick={() => setProductVideo(null)}>Remove</Button>
                              </div>
                            </div>
                          ) : (
                            <div onClick={handleVideoUpload} className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                              <Video className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                              <p className="text-sm text-muted-foreground">Click to upload video</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                      <Button type="submit">Create Product</Button>
                    </div>
                  </form>
                </TabsContent>
                <TabsContent value="excel">
                  <ExcelProductUpload onClose={() => setIsAddDialogOpen(false)} />
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><Package className="w-5 h-5 text-primary" /></div><div><p className="text-2xl font-bold">{stats.total}</p><p className="text-sm text-muted-foreground">Total Products</p></div></div></CardContent></Card>
        <Card className="bg-card"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-emerald-500/10"><CheckCircle className="w-5 h-5 text-emerald-600" /></div><div><p className="text-2xl font-bold">{stats.active}</p><p className="text-sm text-muted-foreground">Active</p></div></div></CardContent></Card>
        <Card className="bg-card"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-muted"><XCircle className="w-5 h-5 text-muted-foreground" /></div><div><p className="text-2xl font-bold">{stats.inactive}</p><p className="text-sm text-muted-foreground">Inactive</p></div></div></CardContent></Card>
        <Card className="bg-card"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-amber-500/10"><AlertTriangle className="w-5 h-5 text-amber-600" /></div><div><p className="text-2xl font-bold">{stats.duplicates}</p><p className="text-sm text-muted-foreground">Duplicate SKUs</p></div></div></CardContent></Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by name, SKU, or brand..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
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
                  <TableHead className="font-semibold">Product</TableHead>
                  <TableHead className="font-semibold cursor-pointer select-none" onClick={() => toggleSort('masterSkuId')}>
                    <span className="flex items-center">Master SKU <SortIcon field="masterSkuId" /></span>
                  </TableHead>
                  <TableHead className="font-semibold">Category</TableHead>
                  <TableHead className="font-semibold">HSN</TableHead>
                  <TableHead className="font-semibold text-right cursor-pointer select-none" onClick={() => toggleSort('basePrice')}>
                    <span className="flex items-center justify-end">MRP / Base <SortIcon field="basePrice" /></span>
                  </TableHead>
                  <TableHead className="font-semibold text-right">GST</TableHead>
                  <TableHead className="font-semibold text-right cursor-pointer select-none" onClick={() => toggleSort('margin')}>
                    <span className="flex items-center justify-end">Margin <SortIcon field="margin" /></span>
                  </TableHead>
                  <TableHead className="font-semibold cursor-pointer select-none" onClick={() => toggleSort('status')}>
                    <span className="flex items-center">Status <SortIcon field="status" /></span>
                  </TableHead>
                  <TableHead className="font-semibold">Portals</TableHead>
                  <TableHead className="font-semibold text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const margin = getMargin(product);
                  const isDuplicate = duplicateSkus.includes(product.masterSkuId);
                  return (
                    <TableRow key={product.productId} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-medium">{product.name}</p>
                              {isDuplicate && (
                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">DUPLICATE</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{product.brand}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{product.masterSkuId}</TableCell>
                      <TableCell><Badge variant="secondary">{product.category}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{product.hsnCode}</TableCell>
                      <TableCell className="text-right">
                        <div>
                          <p className="text-xs text-muted-foreground line-through">{formatCurrency(product.mrp)}</p>
                          <p className="font-medium">{formatCurrency(product.basePrice)}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm">{product.gstPercent}%</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className={margin > 30 ? 'bg-emerald-500/10 text-emerald-600' : margin > 15 ? 'bg-amber-500/10 text-amber-600' : 'bg-red-500/10 text-red-600'}>
                          {margin.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={product.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}>
                          {product.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {product.portalsEnabled.slice(0, 3).map(p => (
                            <Badge key={p} variant="outline" className="text-[10px] px-1.5 py-0 capitalize">{p}</Badge>
                          ))}
                          {product.portalsEnabled.length > 3 && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">+{product.portalsEnabled.length - 3}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
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
    </div>
  );
}
