import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Globe, ShoppingCart, Package, TrendingUp, IndianRupee } from 'lucide-react';

const mockOwnProducts = [
  { skuId: 'SKU-OWN-001', name: 'Premium Wireless Earbuds Pro', stock: 120, price: 2999, orders: 12, status: 'active' },
  { skuId: 'SKU-OWN-002', name: 'Smart Fitness Watch X2', stock: 45, price: 4999, orders: 8, status: 'active' },
  { skuId: 'SKU-OWN-003', name: 'Organic Cotton T-Shirt', stock: 280, price: 599, orders: 45, status: 'active' },
  { skuId: 'SKU-OWN-005', name: 'Baby Care Gift Set', stock: 35, price: 1299, orders: 15, status: 'active' },
  { skuId: 'SKU-OWN-008', name: 'LED Desk Lamp', stock: 68, price: 1499, orders: 18, status: 'active' },
];

const mockOwnOrders = [
  { orderId: 'OWN-001', customer: 'Arjun Mehta', items: 'Premium Wireless Earbuds Pro x1', total: 2999, status: 'delivered', date: '09 Feb 2026' },
  { orderId: 'OWN-002', customer: 'Riya Kapoor', items: 'Cotton T-Shirt x3', total: 1797, status: 'shipped', date: '09 Feb 2026' },
  { orderId: 'OWN-003', customer: 'Deepak Singh', items: 'LED Desk Lamp x1', total: 1499, status: 'processing', date: '08 Feb 2026' },
  { orderId: 'OWN-004', customer: 'Neha Gupta', items: 'Baby Care Gift Set x2', total: 2598, status: 'delivered', date: '07 Feb 2026' },
  { orderId: 'OWN-005', customer: 'Karan Joshi', items: 'Fitness Watch X2 x1', total: 4999, status: 'delivered', date: '06 Feb 2026' },
];

export default function OwnWebsite() {
  const totalRevenue = mockOwnOrders.reduce((s, o) => s + o.total, 0);
  const totalOrders = mockOwnOrders.length;
  const totalProducts = mockOwnProducts.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">🌐 Own Website Channel</h1>
        <p className="text-muted-foreground">Manage products, orders, and inventory for your direct-to-consumer website</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><Globe className="w-5 h-5 text-primary" /></div><div><p className="text-2xl font-bold">{totalProducts}</p><p className="text-sm text-muted-foreground">Products Listed</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-500/10"><ShoppingCart className="w-5 h-5 text-blue-600" /></div><div><p className="text-2xl font-bold">{totalOrders}</p><p className="text-sm text-muted-foreground">Recent Orders</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-emerald-500/10"><IndianRupee className="w-5 h-5 text-emerald-600" /></div><div><p className="text-2xl font-bold">₹{(totalRevenue/1000).toFixed(1)}K</p><p className="text-sm text-muted-foreground">Revenue</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-amber-500/10"><TrendingUp className="w-5 h-5 text-amber-600" /></div><div><p className="text-2xl font-bold">0%</p><p className="text-sm text-muted-foreground">Commission</p></div></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Products</CardTitle><CardDescription>Products listed on own website</CardDescription></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow className="bg-muted/50"><TableHead className="font-semibold">SKU</TableHead><TableHead className="font-semibold">Product</TableHead><TableHead className="text-center font-semibold">Stock</TableHead><TableHead className="text-right font-semibold">Price</TableHead></TableRow></TableHeader>
              <TableBody>
                {mockOwnProducts.map(p => (
                  <TableRow key={p.skuId}>
                    <TableCell className="font-mono text-sm">{p.skuId}</TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-center">{p.stock}</TableCell>
                    <TableCell className="text-right font-medium">₹{p.price.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent Orders</CardTitle><CardDescription>Latest orders from own website</CardDescription></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow className="bg-muted/50"><TableHead className="font-semibold">Order</TableHead><TableHead className="font-semibold">Customer</TableHead><TableHead className="text-right font-semibold">Total</TableHead><TableHead className="font-semibold">Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {mockOwnOrders.map(o => (
                  <TableRow key={o.orderId}>
                    <TableCell className="font-mono text-sm">{o.orderId}</TableCell>
                    <TableCell>
                      <div><p className="font-medium text-sm">{o.customer}</p><p className="text-xs text-muted-foreground">{o.items}</p></div>
                    </TableCell>
                    <TableCell className="text-right font-medium">₹{o.total.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        o.status === 'delivered' ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' :
                        o.status === 'shipped' ? 'bg-blue-500/15 text-blue-600 border-blue-500/30' :
                        'bg-amber-500/15 text-amber-600 border-amber-500/30'
                      }>{o.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
