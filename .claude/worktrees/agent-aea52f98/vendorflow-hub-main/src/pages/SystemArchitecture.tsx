import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Package, ShoppingCart, BoxIcon, RotateCcw, CreditCard, Scale, Users, Warehouse, Upload, BarChart3, 
  CheckCircle, Plug, AlertTriangle, Shield, TrendingDown, Truck
} from 'lucide-react';

const modules = [
  { name: 'Inventory', icon: BoxIcon, desc: 'Stock tracking across portals & warehouses', ready: true, apiReady: true },
  { name: 'Orders', icon: ShoppingCart, desc: 'Multi-portal order lifecycle management', ready: true, apiReady: true },
  { name: 'Returns & Claims', icon: RotateCcw, desc: 'Return processing & claim eligibility', ready: true, apiReady: true },
  { name: 'Settlements', icon: CreditCard, desc: 'Batch & individual payment tracking', ready: true, apiReady: true },
  { name: 'Reconciliation', icon: Scale, desc: 'Expected vs processed order matching', ready: true, apiReady: true },
  { name: 'Vendors', icon: Users, desc: 'Vendor onboarding & performance', ready: true, apiReady: false },
  { name: 'Warehouses', icon: Warehouse, desc: 'Storage & logistics management', ready: true, apiReady: false },
  { name: 'Data Import', icon: Upload, desc: 'Excel import & barcode scanning', ready: true, apiReady: true },
  { name: 'Products', icon: Package, desc: 'Catalog & SKU management', ready: true, apiReady: true },
  { name: 'Analytics', icon: BarChart3, desc: 'BI dashboards & reports', ready: true, apiReady: false },
];

const reconciliationModules = [
  { name: 'Settlement Mismatch Detection', desc: 'Flag discrepancies between expected and actual settlement amounts', icon: AlertTriangle, severity: 'critical', alertCount: 3 },
  { name: 'Commission Discrepancy Tracking', desc: 'Track portal-wise commission deviations from agreed rates', icon: TrendingDown, severity: 'warning', alertCount: 5 },
  { name: 'Refund Reconciliation', desc: 'Match refund claims with actual credits received from portals', icon: RotateCcw, severity: 'warning', alertCount: 2 },
  { name: 'Penalty Tracking', desc: 'Monitor SLA penalties, late shipment fees, and cancellation charges', icon: Shield, severity: 'info', alertCount: 8 },
  { name: 'Logistics Cost Audit', desc: 'Validate shipping charges against carrier rate cards', icon: Truck, severity: 'warning', alertCount: 4 },
  { name: 'Margin Leakage Alerts', desc: 'Detect products selling below profitable threshold after all deductions', icon: TrendingDown, severity: 'critical', alertCount: 6 },
];

const severityConfig: Record<string, { className: string }> = {
  critical: { className: 'bg-rose-500/15 text-rose-600 border-rose-500/30' },
  warning: { className: 'bg-amber-500/15 text-amber-600 border-amber-500/30' },
  info: { className: 'bg-blue-500/15 text-blue-600 border-blue-500/30' },
};

export default function SystemArchitecture() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">System Architecture</h1>
          <p className="text-muted-foreground">Modular platform overview — all modules are reusable and API-ready</p>
        </div>
        <Badge variant="outline" className="gap-1 text-sm bg-primary/5 border-primary/20 text-primary">
          <Plug className="w-3.5 h-3.5" />
          Enterprise SaaS Architecture
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <Card key={mod.name} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10 shrink-0">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold text-lg">{mod.name}</h3>
                    <p className="text-sm text-muted-foreground">{mod.desc}</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {mod.ready && (
                        <Badge variant="outline" className="gap-1 text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                          <CheckCircle className="w-3 h-3" />Reusable Module
                        </Badge>
                      )}
                      {mod.apiReady && (
                        <Badge variant="outline" className="gap-1 text-xs bg-blue-500/10 text-blue-600 border-blue-500/30">
                          <Plug className="w-3 h-3" />API Ready
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Reconciliation Modules */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Scale className="w-5 h-5" />Reconciliation Engine Modules</CardTitle>
              <CardDescription>Essential ecommerce reconciliation modules with financial discrepancy alerts</CardDescription>
            </div>
            <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/30 gap-1">
              <AlertTriangle className="w-3 h-3" />
              {reconciliationModules.reduce((s, m) => s + m.alertCount, 0)} Active Alerts
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reconciliationModules.map(mod => {
              const Icon = mod.icon;
              return (
                <Card key={mod.name} className="border-dashed">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg shrink-0 ${severityConfig[mod.severity].className.split(' ').slice(0, 1).join(' ')}`}>
                        <Icon className={`w-5 h-5 ${severityConfig[mod.severity].className.split(' ')[1]}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-semibold text-sm">{mod.name}</h4>
                          <Badge variant="outline" className={`text-xs ${severityConfig[mod.severity].className}`}>
                            {mod.alertCount} alerts
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{mod.desc}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/30 border-dashed">
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground text-sm">
            All modules follow a standardized data architecture with typed interfaces, mock service layers, and consistent identifiers (productId, skuId, orderId) for seamless backend integration.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
