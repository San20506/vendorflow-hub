import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, Percent, Package, ArrowDown } from 'lucide-react';
import { ExportButton } from '@/components/TableEnhancements';

interface LandingCostItem {
  productName: string;
  skuId: string;
  portal: string;
  imageUrl: string;
  mrp: number;
  sellingPrice: number;
  commission: number;
  shippingFee: number;
  taxes: number;
  paymentGatewayFee: number;
  promotions: number;
}

const mockLandingCostData: LandingCostItem[] = [
  { productName: 'Boat Earbuds Pro', skuId: 'BT-EP-101', portal: 'Amazon', imageUrl: '', mrp: 2999, sellingPrice: 2499, commission: 375, shippingFee: 80, taxes: 225, paymentGatewayFee: 50, promotions: 100 },
  { productName: 'Nike Running Shoes', skuId: 'NK-RS-220', portal: 'Flipkart', imageUrl: '', mrp: 7999, sellingPrice: 6499, commission: 975, shippingFee: 120, taxes: 585, paymentGatewayFee: 130, promotions: 300 },
  { productName: 'Samsung Charger 25W', skuId: 'SM-CH-305', portal: 'Amazon', imageUrl: '', mrp: 1499, sellingPrice: 1199, commission: 180, shippingFee: 50, taxes: 108, paymentGatewayFee: 24, promotions: 0 },
  { productName: 'Levi\'s Slim Jeans', skuId: 'LV-SJ-410', portal: 'Meesho', imageUrl: '', mrp: 3499, sellingPrice: 2799, commission: 420, shippingFee: 90, taxes: 252, paymentGatewayFee: 56, promotions: 200 },
  { productName: 'Fisher-Price Rattle', skuId: 'FP-RT-510', portal: 'FirstCry', imageUrl: '', mrp: 899, sellingPrice: 749, commission: 112, shippingFee: 40, taxes: 67, paymentGatewayFee: 15, promotions: 50 },
  { productName: 'Himalaya Baby Cream', skuId: 'HM-BC-601', portal: 'Blinkit', imageUrl: '', mrp: 299, sellingPrice: 249, commission: 37, shippingFee: 25, taxes: 22, paymentGatewayFee: 5, promotions: 0 },
  { productName: 'Adidas Sports Tee', skuId: 'AD-ST-720', portal: 'Flipkart', imageUrl: '', mrp: 1999, sellingPrice: 1599, commission: 240, shippingFee: 60, taxes: 144, paymentGatewayFee: 32, promotions: 100 },
  { productName: 'JBL Bluetooth Speaker', skuId: 'JB-BS-830', portal: 'Amazon', imageUrl: '', mrp: 4999, sellingPrice: 3999, commission: 600, shippingFee: 100, taxes: 360, paymentGatewayFee: 80, promotions: 250 },
  { productName: 'Puma Backpack', skuId: 'PM-BP-940', portal: 'Meesho', imageUrl: '', mrp: 2499, sellingPrice: 1899, commission: 285, shippingFee: 70, taxes: 171, paymentGatewayFee: 38, promotions: 150 },
  { productName: 'OnePlus Buds Z2', skuId: 'OP-BZ-105', portal: 'Amazon', imageUrl: '', mrp: 3299, sellingPrice: 2799, commission: 420, shippingFee: 80, taxes: 252, paymentGatewayFee: 56, promotions: 0 },
];

const getDeductions = (item: LandingCostItem) => item.commission + item.shippingFee + item.taxes + item.paymentGatewayFee + item.promotions;
const getLandingCost = (item: LandingCostItem) => item.sellingPrice - getDeductions(item);
const getMarginPercent = (item: LandingCostItem) => ((getLandingCost(item) / item.sellingPrice) * 100);

const getMarginBadge = (marginPct: number) => {
  if (marginPct >= 35) return { label: 'High Margin', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' };
  if (marginPct >= 15) return { label: 'Moderate', className: 'bg-amber-500/10 text-amber-600 border-amber-500/30' };
  return { label: 'Low / Negative', className: 'bg-destructive/10 text-destructive border-destructive/30' };
};

const portals = ['All', 'Amazon', 'Flipkart', 'Meesho', 'FirstCry', 'Blinkit'];
const brands = ['All', 'Boat', 'Nike', 'Samsung', 'Levi\'s', 'Fisher-Price', 'Himalaya', 'Adidas', 'JBL', 'Puma', 'OnePlus'];
const categories = ['All', 'Electronics', 'Footwear', 'Fashion', 'Baby', 'Personal Care'];
const marginRanges = ['All', 'High (35%+)', 'Moderate (15-35%)', 'Low (<15%)'];

export default function LandingCostAnalysis() {
  const [portalFilter, setPortalFilter] = useState('All');
  const [brandFilter, setBrandFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [marginFilter, setMarginFilter] = useState('All');

  const filteredData = useMemo(() => {
    return mockLandingCostData.filter(item => {
      if (portalFilter !== 'All' && item.portal !== portalFilter) return false;
      if (marginFilter !== 'All') {
        const m = getMarginPercent(item);
        if (marginFilter === 'High (35%+)' && m < 35) return false;
        if (marginFilter === 'Moderate (15-35%)' && (m < 15 || m >= 35)) return false;
        if (marginFilter === 'Low (<15%)' && m >= 15) return false;
      }
      return true;
    });
  }, [portalFilter, marginFilter]);

  const avgLandingCost = filteredData.length > 0 ? filteredData.reduce((s, i) => s + getLandingCost(i), 0) / filteredData.length : 0;
  const totalDeductionPct = filteredData.length > 0
    ? filteredData.reduce((s, i) => s + (getDeductions(i) / i.sellingPrice) * 100, 0) / filteredData.length : 0;
  const highestMargin = filteredData.length > 0 ? [...filteredData].sort((a, b) => getMarginPercent(b) - getMarginPercent(a))[0] : null;
  const lowestMargin = filteredData.length > 0 ? [...filteredData].sort((a, b) => getMarginPercent(a) - getMarginPercent(b))[0] : null;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            {[
              { label: 'Portal', value: portalFilter, onChange: setPortalFilter, options: portals },
              { label: 'Brand', value: brandFilter, onChange: setBrandFilter, options: brands },
              { label: 'Category', value: categoryFilter, onChange: setCategoryFilter, options: categories },
              { label: 'Margin Range', value: marginFilter, onChange: setMarginFilter, options: marginRanges },
            ].map(f => (
              <Select key={f.label} value={f.value} onValueChange={f.onChange}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder={f.label} /></SelectTrigger>
                <SelectContent>{f.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            ))}
            <div className="ml-auto">
              <ExportButton label="Export Landing Cost" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><DollarSign className="w-5 h-5 text-primary" /></div><div><p className="text-xl font-bold">₹{Math.round(avgLandingCost).toLocaleString()}</p><p className="text-xs text-muted-foreground">Avg Landing Cost</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-emerald-500/10"><TrendingUp className="w-5 h-5 text-emerald-600" /></div><div><p className="text-xl font-bold truncate">{highestMargin?.productName || '—'}</p><p className="text-xs text-muted-foreground">Highest Margin Product</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-destructive/10"><TrendingDown className="w-5 h-5 text-destructive" /></div><div><p className="text-xl font-bold truncate">{lowestMargin?.productName || '—'}</p><p className="text-xs text-muted-foreground">Lowest Margin Product</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-amber-500/10"><Percent className="w-5 h-5 text-amber-600" /></div><div><p className="text-xl font-bold">{totalDeductionPct.toFixed(1)}%</p><p className="text-xs text-muted-foreground">Avg Total Deduction %</p></div></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Table */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Product-Level Landing Cost</CardTitle>
                  <CardDescription>True profitability after all deductions</CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">Landing Cost = Selling Price − Total Deductions</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold min-w-[40px]"></TableHead>
                      <TableHead className="font-semibold">Product</TableHead>
                      <TableHead className="font-semibold">SKU ID</TableHead>
                      <TableHead className="font-semibold">Portal</TableHead>
                      <TableHead className="font-semibold text-right">MRP</TableHead>
                      <TableHead className="font-semibold text-right">Selling</TableHead>
                      <TableHead className="font-semibold text-right">Commission</TableHead>
                      <TableHead className="font-semibold text-right">Shipping</TableHead>
                      <TableHead className="font-semibold text-right">Taxes</TableHead>
                      <TableHead className="font-semibold text-right">PG Fee</TableHead>
                      <TableHead className="font-semibold text-right">Promos</TableHead>
                      <TableHead className="font-semibold text-right">Deductions</TableHead>
                      <TableHead className="font-semibold text-right">Landing Cost</TableHead>
                      <TableHead className="font-semibold text-center">Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((item) => {
                      const deductions = getDeductions(item);
                      const landingCost = getLandingCost(item);
                      const marginPct = getMarginPercent(item);
                      const badge = getMarginBadge(marginPct);
                      return (
                        <TableRow key={item.skuId} className="hover:bg-muted/30">
                          <TableCell>
                            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                              <Package className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-sm max-w-[150px] truncate">{item.productName}</TableCell>
                          <TableCell className="text-sm font-mono text-muted-foreground">{item.skuId}</TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{item.portal}</Badge></TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">₹{item.mrp.toLocaleString()}</TableCell>
                          <TableCell className="text-right text-sm font-medium">₹{item.sellingPrice.toLocaleString()}</TableCell>
                          <TableCell className="text-right text-sm text-destructive">-₹{item.commission}</TableCell>
                          <TableCell className="text-right text-sm text-destructive">-₹{item.shippingFee}</TableCell>
                          <TableCell className="text-right text-sm text-destructive">-₹{item.taxes}</TableCell>
                          <TableCell className="text-right text-sm text-destructive">-₹{item.paymentGatewayFee}</TableCell>
                          <TableCell className="text-right text-sm text-destructive">-₹{item.promotions}</TableCell>
                          <TableCell className="text-right text-sm font-semibold text-destructive">-₹{deductions}</TableCell>
                          <TableCell className="text-right font-bold text-emerald-600">₹{landingCost.toLocaleString()}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={`text-xs ${badge.className}`}>{marginPct.toFixed(1)}% {badge.label}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profitability Insights Panel */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" />Profitability Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <div className="flex items-start gap-2">
                  <TrendingDown className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Nike Running Shoes</p>
                    <p className="text-xs text-muted-foreground mt-0.5">High commission (15%) on Flipkart impacting margin. Consider renegotiating rate or optimizing listing price.</p>
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Puma Backpack</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Promotions (₹150) + shipping eroding margin on Meesho. Review promotional strategy.</p>
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                <div className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Boat Earbuds Pro</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Strong net returns on Amazon. Consider scaling ad spend for this SKU.</p>
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                <div className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Samsung Charger 25W</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Zero promotions + low shipping cost = healthy margin. Ideal for bundling.</p>
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <div className="flex items-start gap-2">
                  <ArrowDown className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Overall Trend</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Average deduction across portals is {totalDeductionPct.toFixed(1)}%. Focus on reducing shipping and commission costs.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
