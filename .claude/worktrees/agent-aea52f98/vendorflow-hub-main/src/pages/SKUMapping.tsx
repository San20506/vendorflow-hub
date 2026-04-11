import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockSKUMappings } from '@/services/mockData';
import { MasterSKUMapping } from '@/types';
import { Plus, Edit2, Link, Unlink, Search, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type MappingStatus = 'mapped' | 'partially_mapped' | 'unmapped';

function getMappingStatus(mapping: MasterSKUMapping): MappingStatus {
  const fields = [mapping.amazonSku, mapping.flipkartSku, mapping.meeshoSku, mapping.firstcrySku, mapping.blinkitSku, mapping.ownWebsiteSku];
  const filled = fields.filter(Boolean).length;
  if (filled === 0) return 'unmapped';
  if (filled >= 4) return 'mapped';
  return 'partially_mapped';
}

function getMappedCount(mapping: MasterSKUMapping): number {
  return [mapping.amazonSku, mapping.flipkartSku, mapping.meeshoSku, mapping.firstcrySku, mapping.blinkitSku, mapping.ownWebsiteSku].filter(Boolean).length;
}

const statusBadge = (status: MappingStatus) => {
  switch (status) {
    case 'mapped':
      return <Badge variant="outline" className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 gap-1"><Link className="w-3 h-3" />Mapped</Badge>;
    case 'partially_mapped':
      return <Badge variant="outline" className="bg-amber-500/15 text-amber-600 border-amber-500/30 gap-1"><AlertCircle className="w-3 h-3" />Partial</Badge>;
    case 'unmapped':
      return <Badge variant="outline" className="bg-rose-500/15 text-rose-600 border-rose-500/30 gap-1"><Unlink className="w-3 h-3" />Unmapped</Badge>;
  }
};

export default function SKUMapping() {
  const [mappings] = useState<MasterSKUMapping[]>(mockSKUMappings);
  const [filterStatus, setFilterStatus] = useState<MappingStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<MasterSKUMapping | null>(null);
  const { toast } = useToast();

  const filteredMappings = mappings.filter((m) => {
    const status = getMappingStatus(m);
    if (filterStatus !== 'all' && status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!m.masterSkuId.toLowerCase().includes(q) && !m.productName.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const handleAddMapping = () => {
    toast({ title: 'Mapping Added', description: 'New SKU mapping has been created successfully.' });
    setIsAddDialogOpen(false);
  };

  const handleEditMapping = () => {
    toast({ title: 'Mapping Updated', description: 'SKU mapping has been updated successfully.' });
    setEditingMapping(null);
  };

  const mappedCount = mappings.filter(m => getMappingStatus(m) === 'mapped').length;
  const partialCount = mappings.filter(m => getMappingStatus(m) === 'partially_mapped').length;
  const unmappedCount = mappings.filter(m => getMappingStatus(m) === 'unmapped').length;
  const coveragePercent = Math.round(((mappedCount * 6 + partialCount * 3) / (mappings.length * 6)) * 100);

  const skuField = (label: string, icon: string, placeholder: string, defaultValue?: string, disabled?: boolean) => (
    <div className="space-y-2">
      <Label>{icon} {label}</Label>
      <Input defaultValue={defaultValue || ''} placeholder={placeholder} disabled={disabled} />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">SKU Mapping Center</h1>
          <p className="text-muted-foreground">Map marketplace SKUs to a single internal master SKU</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search SKUs..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-[180px] pl-9" />
          </div>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as MappingStatus | 'all')}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="mapped">Mapped</SelectItem>
              <SelectItem value="partially_mapped">Partially Mapped</SelectItem>
              <SelectItem value="unmapped">Unmapped</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" />Add Mapping</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add SKU Mapping</DialogTitle>
                <DialogDescription>Map portal-specific SKUs to a master internal SKU</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  {skuField('Master SKU ID', '🔑', 'MSK-XXX')}
                  {skuField('Product Name', '📋', 'Product name')}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {skuField('Amazon SKU', '🛒', 'SKU-AMZ-XXX')}
                  {skuField('Flipkart SKU', '🛍️', 'SKU-FLK-XXX')}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {skuField('Meesho SKU', '📦', 'SKU-MSH-XXX')}
                  {skuField('FirstCry SKU', '👶', 'SKU-FCY-XXX')}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {skuField('Blinkit SKU', '⚡', 'SKU-BLK-XXX')}
                  {skuField('Own Website SKU', '🌐', 'SKU-OWN-XXX')}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddMapping}>Create Mapping</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><Link className="w-5 h-5 text-primary" /></div>
              <div>
                <p className="text-2xl font-bold">{mappings.length}</p>
                <p className="text-sm text-muted-foreground">Total SKUs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10"><Link className="w-5 h-5 text-emerald-600" /></div>
              <div>
                <p className="text-2xl font-bold">{mappedCount}</p>
                <p className="text-sm text-muted-foreground">Fully Mapped</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10"><AlertCircle className="w-5 h-5 text-amber-600" /></div>
              <div>
                <p className="text-2xl font-bold">{partialCount}</p>
                <p className="text-sm text-muted-foreground">Partial</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-500/10"><Unlink className="w-5 h-5 text-rose-600" /></div>
              <div>
                <p className="text-2xl font-bold">{unmappedCount}</p>
                <p className="text-sm text-muted-foreground">Unmapped</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{coveragePercent}%</p>
              <p className="text-sm text-muted-foreground">Coverage</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mapping Table */}
      <Card>
        <CardHeader>
          <CardTitle>SKU Mapping List</CardTitle>
          <CardDescription>View and manage portal SKU mappings • {filteredMappings.length} items</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Master SKU</TableHead>
                  <TableHead className="font-semibold">Product Name</TableHead>
                  <TableHead className="font-semibold">Brand</TableHead>
                  <TableHead className="text-center font-semibold">🛒 Amazon</TableHead>
                  <TableHead className="text-center font-semibold">🛍️ Flipkart</TableHead>
                  <TableHead className="text-center font-semibold">📦 Meesho</TableHead>
                  <TableHead className="text-center font-semibold">👶 FirstCry</TableHead>
                  <TableHead className="text-center font-semibold">⚡ Blinkit</TableHead>
                  <TableHead className="text-center font-semibold">🌐 Own Web</TableHead>
                  <TableHead className="font-semibold">Coverage</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMappings.map((mapping) => {
                  const count = getMappedCount(mapping);
                  const status = getMappingStatus(mapping);
                  const skuCell = (sku?: string) => (
                    <TableCell className="text-center">
                      {sku ? (
                        <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{sku}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  );
                  return (
                    <TableRow key={mapping.masterSkuId}>
                      <TableCell className="font-mono text-sm font-medium">{mapping.masterSkuId}</TableCell>
                      <TableCell className="max-w-[200px] truncate font-medium">{mapping.productName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{mapping.brand}</Badge>
                      </TableCell>
                      {skuCell(mapping.amazonSku)}
                      {skuCell(mapping.flipkartSku)}
                      {skuCell(mapping.meeshoSku)}
                      {skuCell(mapping.firstcrySku)}
                      {skuCell(mapping.blinkitSku)}
                      {skuCell(mapping.ownWebsiteSku)}
                      <TableCell>
                        <span className="text-sm font-medium">{count}/6</span>
                      </TableCell>
                      <TableCell>{statusBadge(status)}</TableCell>
                      <TableCell>
                        <Dialog open={editingMapping?.masterSkuId === mapping.masterSkuId} onOpenChange={(open) => !open && setEditingMapping(null)}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setEditingMapping(mapping)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Edit SKU Mapping</DialogTitle>
                              <DialogDescription>Update portal-specific SKUs for {mapping.productName}</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-2 gap-4">
                                {skuField('Master SKU ID', '🔑', '', mapping.masterSkuId, true)}
                                {skuField('Product Name', '📋', '', mapping.productName)}
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                {skuField('Amazon SKU', '🛒', 'SKU-AMZ-XXX', mapping.amazonSku)}
                                {skuField('Flipkart SKU', '🛍️', 'SKU-FLK-XXX', mapping.flipkartSku)}
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                {skuField('Meesho SKU', '📦', 'SKU-MSH-XXX', mapping.meeshoSku)}
                                {skuField('FirstCry SKU', '👶', 'SKU-FCY-XXX', mapping.firstcrySku)}
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                {skuField('Blinkit SKU', '⚡', 'SKU-BLK-XXX', mapping.blinkitSku)}
                                {skuField('Own Website SKU', '🌐', 'SKU-OWN-XXX', mapping.ownWebsiteSku)}
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setEditingMapping(null)}>Cancel</Button>
                              <Button onClick={handleEditMapping}>Save Changes</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredMappings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-12 text-muted-foreground">
                      <Unlink className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">No mappings found</p>
                      <p className="text-sm">Try adjusting your filters</p>
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
