import { useState, useEffect, useSyncExternalStore } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Settings, Cog, Upload, Download, FileSpreadsheet, Eye, Pencil, ToggleLeft, Blocks, Clock, Zap, Users, Lock, IndianRupee, CheckCircle2, AlertTriangle, SlidersHorizontal } from 'lucide-react';
import { getReconciliationSettings, setReconciliationSettings, subscribeReconciliationSettings } from '@/services/reconciliationSettings';
import { useToast } from '@/hooks/use-toast';

// TAB 1 — Field Configuration
interface FieldConfig {
  field: string;
  module: string;
  mandatory: boolean;
  visible: boolean;
  editable: boolean;
}

const initialFields: FieldConfig[] = [
  { field: 'SKU ID', module: 'Inventory / Orders', mandatory: true, visible: true, editable: false },
  { field: 'Master SKU ID', module: 'SKU Mapping', mandatory: true, visible: true, editable: false },
  { field: 'Product Name', module: 'Products', mandatory: true, visible: true, editable: true },
  { field: 'Brand', module: 'Products / Inventory', mandatory: true, visible: true, editable: true },
  { field: 'Category', module: 'Products', mandatory: true, visible: true, editable: true },
  { field: 'Base Price', module: 'Products', mandatory: true, visible: true, editable: true },
  { field: 'Portal', module: 'All Modules', mandatory: true, visible: true, editable: false },
  { field: 'Warehouse', module: 'Inventory', mandatory: true, visible: true, editable: true },
  { field: 'Barcode', module: 'Consolidated Orders', mandatory: false, visible: true, editable: true },
  { field: 'Video URL', module: 'Products', mandatory: false, visible: false, editable: true },
  { field: 'Tracking Number', module: 'Orders / Returns', mandatory: false, visible: true, editable: true },
  { field: 'Description', module: 'Products', mandatory: false, visible: true, editable: true },
  { field: 'Image URL', module: 'Products', mandatory: false, visible: true, editable: true },
  { field: 'Customer Email', module: 'Orders', mandatory: false, visible: true, editable: false },
  { field: 'Batch ID', module: 'Settlements', mandatory: false, visible: true, editable: false },
];

// TAB 2 — Feature Toggles
interface FeatureToggle {
  name: string;
  description: string;
  enabled: boolean;
  icon: React.ElementType;
}

const initialFeatures: FeatureToggle[] = [
  { name: 'Inventory Import', description: 'Bulk inventory data upload via Excel', enabled: true, icon: Upload },
  { name: 'Excel Upload', description: 'General Excel file uploads across modules', enabled: true, icon: FileSpreadsheet },
  { name: 'Barcode Scanning', description: 'Warehouse barcode scan for order fulfillment', enabled: true, icon: Cog },
  { name: 'AI Assistant', description: 'AI-powered chatbot and recommendations', enabled: true, icon: Zap },
  { name: 'Reconciliation', description: 'Financial order reconciliation engine', enabled: true, icon: Shield },
  { name: 'Batch Settlements', description: 'Grouped batch payment settlements', enabled: true, icon: Blocks },
  { name: 'Vendor Access', description: 'External vendor portal access', enabled: false, icon: Users },
  { name: 'Analytics', description: 'Advanced analytics and reporting', enabled: true, icon: Settings },
];

// TAB 3 — Services
interface ServiceItem {
  name: string;
  status: 'active' | 'coming' | 'planned' | 'future';
  lastUpdated: string;
}

const services: ServiceItem[] = [
  { name: 'API Integration', status: 'coming', lastUpdated: '2025-01-15' },
  { name: 'Data Sync Engine', status: 'planned', lastUpdated: '2025-01-10' },
  { name: 'Automation Engine', status: 'future', lastUpdated: '2025-01-01' },
  { name: 'Webhook Support', status: 'planned', lastUpdated: '2025-01-12' },
  { name: 'Multi-Tenant Architecture', status: 'future', lastUpdated: '2024-12-20' },
  { name: 'Real-time Notifications', status: 'coming', lastUpdated: '2025-01-14' },
  { name: 'Custom Report Builder', status: 'planned', lastUpdated: '2025-01-08' },
];

const serviceStatusConfig: Record<string, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' },
  coming: { label: 'Coming Phase', className: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  planned: { label: 'Planned', className: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
  future: { label: 'Future Ready', className: 'bg-muted text-muted-foreground' },
};

// TAB 4 — Import/Export
interface ImportExportItem {
  name: string;
  type: 'import' | 'export';
  description: string;
}

const importExportItems: ImportExportItem[] = [
  { name: 'Master Data Import', type: 'import', description: 'Upload master product catalog' },
  { name: 'Bulk Product Upload', type: 'import', description: 'Batch upload product listings' },
  { name: 'Settlement Import', type: 'import', description: 'Import settlement statements' },
  { name: 'Orders Import', type: 'import', description: 'Bulk import order records' },
  { name: 'Inventory Template', type: 'import', description: 'Download & upload inventory data' },
  { name: 'Export Master Data', type: 'export', description: 'Download complete master dataset' },
  { name: 'Export Settlements', type: 'export', description: 'Download settlement records' },
  { name: 'Export Analytics', type: 'export', description: 'Download analytics reports' },
];

// TAB 5 — Permissions
interface PermissionRow {
  feature: string;
  category: string;
  admin: boolean;
  vendor: boolean;
  operations: boolean;
}

const permissionsData: PermissionRow[] = [
  { feature: 'Dashboard Overview', category: 'Overview', admin: true, vendor: true, operations: true },
  { feature: 'Product Catalog', category: 'Catalog', admin: true, vendor: true, operations: false },
  { feature: 'Product Health', category: 'Catalog', admin: true, vendor: true, operations: true },
  { feature: 'SKU Mapping', category: 'Catalog', admin: true, vendor: true, operations: false },
  { feature: 'Inventory Management', category: 'Inventory', admin: true, vendor: true, operations: true },
  { feature: 'Orders', category: 'Inventory', admin: true, vendor: true, operations: true },
  { feature: 'Consolidated Orders', category: 'Inventory', admin: true, vendor: false, operations: true },
  { feature: 'Returns & Claims', category: 'Inventory', admin: true, vendor: false, operations: true },
  { feature: 'Settlements', category: 'Finance', admin: true, vendor: true, operations: false },
  { feature: 'Reconciliation', category: 'Finance', admin: true, vendor: false, operations: true },
  { feature: 'Price & Payout', category: 'Finance', admin: true, vendor: true, operations: false },
  { feature: 'Landing Cost Analysis', category: 'Finance', admin: true, vendor: true, operations: false },
  { feature: 'Vendor Management', category: 'Vendors', admin: true, vendor: false, operations: false },
  { feature: 'Warehouse & Storage', category: 'Vendors', admin: true, vendor: false, operations: true },
  { feature: 'Data Import', category: 'Operations', admin: true, vendor: false, operations: true },
  { feature: 'Task Manager', category: 'Operations', admin: true, vendor: false, operations: true },
  { feature: 'Analytics', category: 'Operations', admin: true, vendor: true, operations: false },
  { feature: 'System Settings', category: 'Admin', admin: true, vendor: false, operations: false },
  { feature: 'Support Center', category: 'System', admin: true, vendor: true, operations: true },
  { feature: 'Subscription', category: 'System', admin: true, vendor: false, operations: false },
  { feature: 'AI Hub', category: 'System', admin: true, vendor: false, operations: false },
];

export default function SystemSettings() {
  const { toast } = useToast();
  const [fields, setFields] = useState(initialFields);
  const [features, setFeatures] = useState(initialFeatures);
  const [permissions, setPermissions] = useState(permissionsData);

  // Financial Controls — tolerance threshold
  const reconSettings = useSyncExternalStore(
    subscribeReconciliationSettings,
    getReconciliationSettings,
  );
  const [tolerancePreset, setTolerancePreset] = useState(reconSettings.tolerancePreset);
  const [customTolerance, setCustomTolerance] = useState(String(reconSettings.toleranceValue));

  const toggleField = (index: number, key: 'mandatory' | 'visible' | 'editable') => {
    setFields(prev => prev.map((f, i) => i === index ? { ...f, [key]: !f[key] } : f));
  };

  const toggleFeature = (index: number) => {
    setFeatures(prev => prev.map((f, i) => i === index ? { ...f, enabled: !f.enabled } : f));
  };

  const togglePermission = (index: number, role: 'admin' | 'vendor' | 'operations') => {
    if (role === 'admin') return;
    setPermissions(prev => prev.map((p, i) => i === index ? { ...p, [role]: !p[role] } : p));
  };

  const categories = [...new Set(permissions.map(p => p.category))];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">System Settings</h1>
          <p className="text-muted-foreground">Centralized admin governance and platform configuration</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1 text-sm bg-primary/5">
            <Lock className="w-3.5 h-3.5" />
            Admin Only
          </Badge>
          <Badge variant="outline" className="gap-1 text-sm">
            <Shield className="w-3.5 h-3.5" />
            Control Center
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="fields" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="fields" className="text-xs sm:text-sm">Field Config</TabsTrigger>
          <TabsTrigger value="features" className="text-xs sm:text-sm">Features</TabsTrigger>
          <TabsTrigger value="financial" className="text-xs sm:text-sm">Financial Controls</TabsTrigger>
          <TabsTrigger value="services" className="text-xs sm:text-sm">Services</TabsTrigger>
          <TabsTrigger value="import-export" className="text-xs sm:text-sm">Import / Export</TabsTrigger>
          <TabsTrigger value="permissions" className="text-xs sm:text-sm">Permissions</TabsTrigger>
        </TabsList>

        {/* TAB 1 — FIELD CONFIGURATION */}
        <TabsContent value="fields">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5" />Field Configuration</CardTitle>
                  <CardDescription>Data Governance Controls — manage mandatory, visibility, and editability per field</CardDescription>
                </div>
                <Badge variant="secondary" className="gap-1"><Eye className="w-3 h-3" />{fields.filter(f => f.visible).length} Visible</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Field Name</TableHead>
                    <TableHead className="font-semibold">Module</TableHead>
                    <TableHead className="font-semibold text-center">Mandatory</TableHead>
                    <TableHead className="font-semibold text-center">Visible</TableHead>
                    <TableHead className="font-semibold text-center">Editable</TableHead>
                    <TableHead className="font-semibold text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, idx) => (
                    <TableRow key={field.field}>
                      <TableCell className="font-medium">{field.field}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{field.module}</TableCell>
                      <TableCell className="text-center"><Switch checked={field.mandatory} onCheckedChange={() => toggleField(idx, 'mandatory')} /></TableCell>
                      <TableCell className="text-center"><Switch checked={field.visible} onCheckedChange={() => toggleField(idx, 'visible')} /></TableCell>
                      <TableCell className="text-center"><Switch checked={field.editable} onCheckedChange={() => toggleField(idx, 'editable')} /></TableCell>
                      <TableCell className="text-center">
                        {field.mandatory ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Required</Badge>
                        ) : (
                          <Badge variant="secondary">Optional</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2 — FEATURE ENABLE / DISABLE */}
        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ToggleLeft className="w-5 h-5" />Feature Management</CardTitle>
              <CardDescription>Controls module visibility across roles. Enable or disable system capabilities.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {features.map((feature, idx) => {
                  const Icon = feature.icon;
                  return (
                    <Card key={feature.name} className={`transition-all ${feature.enabled ? 'border-primary/30 bg-primary/5' : 'opacity-70'}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className={`p-2 rounded-lg ${feature.enabled ? 'bg-primary/10' : 'bg-muted'}`}>
                            <Icon className={`w-5 h-5 ${feature.enabled ? 'text-primary' : 'text-muted-foreground'}`} />
                          </div>
                          <Switch checked={feature.enabled} onCheckedChange={() => toggleFeature(idx)} />
                        </div>
                        <h4 className="font-semibold text-sm">{feature.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                        <Badge variant={feature.enabled ? 'default' : 'secondary'} className="mt-3 text-xs">
                          {feature.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB — FINANCIAL CONTROLS */}
        <TabsContent value="financial">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><SlidersHorizontal className="w-5 h-5" />Financial Controls</CardTitle>
                  <CardDescription>Configure reconciliation tolerance thresholds and matching rules</CardDescription>
                </div>
                <Badge variant="outline" className="gap-1 bg-primary/5">
                  <IndianRupee className="w-3 h-3" />Reconciliation Engine
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tolerance Threshold Setting */}
              <div className="p-5 rounded-lg border bg-card">
                <h3 className="font-semibold text-sm mb-1 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  Mismatch Tolerance Threshold
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  If the difference between expected and settled amounts is within this threshold, the record will be auto-marked as <span className="font-semibold text-emerald-600">Matched</span>. Differences above the threshold are flagged as <span className="font-semibold text-rose-600">Mismatch</span>.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  {[
                    { value: '1' as const, label: '₹1', desc: 'Strict — only ignore ₹1 or less' },
                    { value: '5' as const, label: '₹5', desc: 'Standard — ignore ₹5 or less' },
                    { value: 'custom' as const, label: 'Custom', desc: 'Set your own threshold value' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setTolerancePreset(opt.value);
                        if (opt.value !== 'custom') setCustomTolerance(opt.value);
                      }}
                      className={`p-4 rounded-lg border text-left transition-all ${
                        tolerancePreset === opt.value
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-lg">{opt.label}</span>
                        {tolerancePreset === opt.value && (
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{opt.desc}</p>
                    </button>
                  ))}
                </div>

                {tolerancePreset === 'custom' && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 mb-4">
                    <span className="text-sm font-medium">Custom Value:</span>
                    <div className="relative w-32">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                      <Input
                        type="number"
                        min={0}
                        value={customTolerance}
                        onChange={e => setCustomTolerance(e.target.value)}
                        className="pl-7"
                      />
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => {
                    const value = tolerancePreset === 'custom' ? parseFloat(customTolerance) || 0 : parseFloat(tolerancePreset);
                    setReconciliationSettings({ tolerancePreset, toleranceValue: value });
                    toast({ title: 'Tolerance Updated', description: `Reconciliation mismatch tolerance set to ₹${value}` });
                  }}
                  className="gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Save Tolerance Setting
                </Button>
              </div>

              {/* Preview */}
              <div className="p-4 rounded-lg border bg-muted/30">
                <h4 className="text-sm font-semibold mb-3">How Tolerance Works</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 gap-1">
                      <CheckCircle2 className="w-3 h-3" />Matched
                    </Badge>
                    <span className="text-muted-foreground">Difference ≤ ₹{tolerancePreset === 'custom' ? customTolerance || '0' : tolerancePreset}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-amber-500/15 text-amber-600 border-amber-500/30 gap-1">
                      <AlertTriangle className="w-3 h-3" />Minor Diff
                    </Badge>
                    <span className="text-muted-foreground">Difference {">"} ₹{tolerancePreset === 'custom' ? customTolerance || '0' : tolerancePreset} and ≤ ₹500</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-rose-500/15 text-rose-600 border-rose-500/30 gap-1">
                      <AlertTriangle className="w-3 h-3" />Mismatch
                    </Badge>
                    <span className="text-muted-foreground">Difference {">"} ₹500</span>
                  </div>
                </div>
              </div>

              {/* Current Setting Display */}
              <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                <div className="flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Current Active Tolerance:</span>
                  <Badge className="text-sm">₹{reconSettings.toleranceValue}</Badge>
                  <span className="text-xs text-muted-foreground ml-2">
                    ({reconSettings.tolerancePreset === 'custom' ? 'Custom' : `Preset ₹${reconSettings.tolerancePreset}`})
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3 — SERVICES MANAGEMENT */}
        <TabsContent value="services">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><Blocks className="w-5 h-5" />Services Management</CardTitle>
                  <CardDescription>Platform service roadmap and integration status</CardDescription>
                </div>
                <Badge variant="outline" className="gap-1 bg-blue-500/5 text-blue-600 border-blue-500/30">
                  <Zap className="w-3 h-3" />Integration Ready Architecture
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Service Name</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((svc) => {
                    const cfg = serviceStatusConfig[svc.status];
                    return (
                      <TableRow key={svc.name}>
                        <TableCell className="font-medium">{svc.name}</TableCell>
                        <TableCell><Badge variant="outline" className={cfg.className}>{cfg.label}</Badge></TableCell>
                        <TableCell className="text-muted-foreground text-sm">{new Date(svc.lastUpdated).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4 — GLOBAL IMPORT / EXPORT CONTROLS */}
        <TabsContent value="import-export">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileSpreadsheet className="w-5 h-5" />Global Import / Export Controls</CardTitle>
              <CardDescription>Admin-only data management — import templates, upload files, and export master data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Upload className="w-4 h-4" />Import Operations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {importExportItems.filter(i => i.type === 'import').map((item) => (
                    <Card key={item.name} className="border-dashed">
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-sm">{item.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1 mb-3">{item.description}</p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="text-xs gap-1"><Download className="w-3 h-3" />Template</Button>
                          <Button variant="outline" size="sm" className="text-xs gap-1"><Upload className="w-3 h-3" />Upload</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Download className="w-4 h-4" />Export Operations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {importExportItems.filter(i => i.type === 'export').map((item) => (
                    <Card key={item.name}>
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-sm">{item.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1 mb-3">{item.description}</p>
                        <Button variant="outline" size="sm" className="text-xs gap-1"><Download className="w-3 h-3" />Export</Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5 — ROLE PERMISSIONS */}
        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5" />Role Permissions Matrix</CardTitle>
                  <CardDescription>Security-driven access control — configure feature access per role</CardDescription>
                </div>
                <div className="flex gap-2">
                  {[
                    { role: 'Admin', count: permissions.filter(p => p.admin).length, color: 'text-primary' },
                    { role: 'Vendor', count: permissions.filter(p => p.vendor).length, color: 'text-blue-600' },
                    { role: 'Ops', count: permissions.filter(p => p.operations).length, color: 'text-emerald-600' },
                  ].map(r => (
                    <Badge key={r.role} variant="outline" className="text-xs gap-1">
                      <span className={r.color}>{r.count}</span> {r.role}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Category</TableHead>
                    <TableHead className="font-semibold">Feature</TableHead>
                    <TableHead className="text-center font-semibold">Admin</TableHead>
                    <TableHead className="text-center font-semibold">Vendor</TableHead>
                    <TableHead className="text-center font-semibold">Operations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map(cat =>
                    permissions.filter(p => p.category === cat).map((perm, idx) => {
                      const globalIdx = permissions.indexOf(perm);
                      return (
                        <TableRow key={perm.feature}>
                          {idx === 0 && (
                            <TableCell rowSpan={permissions.filter(p => p.category === cat).length} className="font-medium align-top border-r">
                              <Badge variant="secondary">{cat}</Badge>
                            </TableCell>
                          )}
                          <TableCell className="font-medium">{perm.feature}</TableCell>
                          <TableCell className="text-center"><Switch checked={perm.admin} disabled /></TableCell>
                          <TableCell className="text-center"><Switch checked={perm.vendor} onCheckedChange={() => togglePermission(globalIdx, 'vendor')} /></TableCell>
                          <TableCell className="text-center"><Switch checked={perm.operations} onCheckedChange={() => togglePermission(globalIdx, 'operations')} /></TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
