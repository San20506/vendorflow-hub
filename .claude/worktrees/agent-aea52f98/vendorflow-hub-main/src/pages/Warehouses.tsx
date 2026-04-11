import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { mockWarehouses, mockInventory } from '@/services/mockData';
import { Warehouse, MapPin, Package, Clock, IndianRupee } from 'lucide-react';

export default function Warehouses() {
  const totalCapacity = mockWarehouses.reduce((s, w) => s + w.capacity, 0);
  const totalUtilized = mockWarehouses.reduce((s, w) => s + w.utilized, 0);
  const overallUtil = Math.round((totalUtilized / totalCapacity) * 100);

  // Inventory aging summary
  const agingOver90 = mockInventory.filter(i => i.agingDays > 90).length;
  const agingOver60 = mockInventory.filter(i => i.agingDays > 60 && i.agingDays <= 90).length;
  const agingUnder60 = mockInventory.filter(i => i.agingDays <= 60).length;
  const totalDailyStorageCost = mockWarehouses.reduce((s, w) => s + (w.utilized * w.storageCostPerDay), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Warehouse & Storage</h1>
        <p className="text-muted-foreground">Monitor warehouse capacity, storage costs, and inventory aging</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><Warehouse className="w-5 h-5 text-primary" /></div><div><p className="text-2xl font-bold">{mockWarehouses.length}</p><p className="text-sm text-muted-foreground">Warehouses</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-500/10"><Package className="w-5 h-5 text-blue-600" /></div><div><p className="text-2xl font-bold">{overallUtil}%</p><p className="text-sm text-muted-foreground">Utilization</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-emerald-500/10"><Package className="w-5 h-5 text-emerald-600" /></div><div><p className="text-2xl font-bold">{agingUnder60}</p><p className="text-sm text-muted-foreground">&lt;60 days</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-amber-500/10"><Clock className="w-5 h-5 text-amber-600" /></div><div><p className="text-2xl font-bold">{agingOver60}</p><p className="text-sm text-muted-foreground">60-90 days</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-rose-500/10"><Clock className="w-5 h-5 text-rose-600" /></div><div><p className="text-2xl font-bold">{agingOver90}</p><p className="text-sm text-muted-foreground">&gt;90 days</p></div></div></CardContent></Card>
      </div>

      {/* Warehouse Details */}
      <Card>
        <CardHeader>
          <CardTitle>Warehouse Capacity</CardTitle>
          <CardDescription>Storage capacity and utilization per warehouse</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Warehouse</TableHead>
                <TableHead className="font-semibold">Location</TableHead>
                <TableHead className="font-semibold text-center">Capacity</TableHead>
                <TableHead className="font-semibold text-center">Utilized</TableHead>
                <TableHead className="font-semibold">Utilization</TableHead>
                <TableHead className="font-semibold text-right">Daily Cost</TableHead>
                <TableHead className="font-semibold text-right">Monthly Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockWarehouses.map(w => {
                const util = Math.round((w.utilized / w.capacity) * 100);
                const dailyCost = w.utilized * w.storageCostPerDay;
                return (
                  <TableRow key={w.warehouseId}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Warehouse className="w-4 h-4 text-primary" />
                        <span className="font-medium">{w.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />{w.location}
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-medium">{w.capacity.toLocaleString()}</TableCell>
                    <TableCell className="text-center font-medium">{w.utilized.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={util} className="h-2 flex-1" />
                        <span className={`text-sm font-medium ${util > 80 ? 'text-amber-600' : 'text-emerald-600'}`}>{util}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">₹{dailyCost.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-medium">₹{(dailyCost * 30).toLocaleString()}</TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="bg-muted/50 font-bold border-t-2">
                <TableCell colSpan={2}>Total</TableCell>
                <TableCell className="text-center">{totalCapacity.toLocaleString()}</TableCell>
                <TableCell className="text-center">{totalUtilized.toLocaleString()}</TableCell>
                <TableCell><span className="text-sm font-bold">{overallUtil}%</span></TableCell>
                <TableCell className="text-right">₹{totalDailyStorageCost.toLocaleString()}</TableCell>
                <TableCell className="text-right">₹{(totalDailyStorageCost * 30).toLocaleString()}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Inventory Aging */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Aging Report</CardTitle>
          <CardDescription>Track storage duration and identify slow-moving inventory</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">SKU</TableHead>
                <TableHead className="font-semibold">Product</TableHead>
                <TableHead className="font-semibold">Warehouse</TableHead>
                <TableHead className="text-center font-semibold">Stock</TableHead>
                <TableHead className="text-center font-semibold">Aging (Days)</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="text-right font-semibold">Est. Storage Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockInventory.sort((a, b) => b.agingDays - a.agingDays).map(item => {
                const wh = mockWarehouses.find(w => w.name === item.warehouse);
                const storageCost = item.availableQuantity * (wh?.storageCostPerDay || 0.5) * item.agingDays;
                return (
                  <TableRow key={item.skuId} className={item.agingDays > 90 ? 'bg-rose-500/5' : item.agingDays > 60 ? 'bg-amber-500/5' : ''}>
                    <TableCell className="font-mono text-sm">{item.skuId}</TableCell>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.warehouse}</TableCell>
                    <TableCell className="text-center">{item.availableQuantity}</TableCell>
                    <TableCell className="text-center font-medium">{item.agingDays}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        item.agingDays > 90 ? 'bg-rose-500/15 text-rose-600 border-rose-500/30' :
                        item.agingDays > 60 ? 'bg-amber-500/15 text-amber-600 border-amber-500/30' :
                        'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
                      }>
                        {item.agingDays > 90 ? 'Slow Moving' : item.agingDays > 60 ? 'Aging' : 'Fresh'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">₹{Math.round(storageCost).toLocaleString()}</TableCell>
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
