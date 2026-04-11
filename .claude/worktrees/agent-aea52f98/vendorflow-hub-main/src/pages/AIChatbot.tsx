import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { MessageSquare, Brain, Workflow, Lock, Sparkles, FolderOpen, Zap, BarChart3, Package, RotateCcw, CreditCard, Users, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AutomationFeature {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  enabled: boolean;
  status: 'active' | 'beta' | 'coming';
}

const initialFeatures: AutomationFeature[] = [
  { id: 'auto-restock', name: 'Auto Restock Alerts', description: 'Automatically trigger alerts when inventory drops below threshold', icon: Package, enabled: true, status: 'active' },
  { id: 'smart-pricing', name: 'Smart Pricing Engine', description: 'AI-driven dynamic pricing recommendations across channels', icon: Zap, enabled: true, status: 'active' },
  { id: 'order-routing', name: 'Intelligent Order Routing', description: 'Route orders to nearest warehouse for faster delivery', icon: Workflow, enabled: false, status: 'beta' },
  { id: 'return-analysis', name: 'Return Pattern Analysis', description: 'Identify return-prone products and suggest preventive actions', icon: RotateCcw, enabled: true, status: 'active' },
  { id: 'settlement-tracker', name: 'Settlement Discrepancy Detector', description: 'Automatically flag settlement mismatches and delayed payments', icon: CreditCard, enabled: true, status: 'active' },
  { id: 'vendor-scoring', name: 'Vendor Performance Scoring', description: 'AI-generated vendor performance scores and recommendations', icon: Users, enabled: false, status: 'beta' },
  { id: 'demand-forecast', name: 'Demand Forecasting', description: 'Predict SKU-level demand using historical data and trends', icon: BarChart3, enabled: false, status: 'coming' },
  { id: 'anomaly-detection', name: 'Anomaly Detection', description: 'Detect unusual patterns in orders, returns, and settlements', icon: Bell, enabled: false, status: 'coming' },
];

export default function AIChatbot() {
  const { toast } = useToast();
  const [features, setFeatures] = useState(initialFeatures);

  const toggleFeature = (id: string) => {
    const feature = features.find(f => f.id === id);
    if (feature?.status === 'coming') {
      toast({ title: 'Coming Soon', description: `${feature.name} is planned for a future release.` });
      return;
    }
    setFeatures(prev => prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
    const updated = features.find(f => f.id === id);
    if (updated) {
      toast({
        title: updated.enabled ? 'Feature Disabled' : 'Feature Enabled',
        description: `${updated.name} has been ${updated.enabled ? 'disabled' : 'enabled'}.`,
      });
    }
  };

  const activeCount = features.filter(f => f.enabled).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI & Automation Hub</h1>
          <p className="text-muted-foreground">Manage intelligent automation features — Admin only</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">{activeCount} Active</Badge>
          <Badge variant="outline" className="gap-1"><Lock className="w-3 h-3" />Admin Only</Badge>
        </div>
      </div>

      {/* AI Modules Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-dashed border-2">
          <CardHeader className="text-center">
            <div className="mx-auto p-4 rounded-2xl bg-primary/10 w-fit mb-3">
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-lg">System AI Chatbot</CardTitle>
            <CardDescription>Conversational AI assistant for VMS queries</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="p-6 bg-muted/30 rounded-xl">
              <Sparkles className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">AI chat interface will be available here</p>
            </div>
            <Badge variant="outline" className="bg-amber-500/15 text-amber-600 border-amber-500/30">
              <Lock className="w-3 h-3 mr-1" />Coming in Advanced Phase
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-dashed border-2">
          <CardHeader className="text-center">
            <div className="mx-auto p-4 rounded-2xl bg-blue-500/10 w-fit mb-3">
              <FolderOpen className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-lg">AI Knowledge Base</CardTitle>
            <CardDescription>Centralized knowledge for AI training</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="p-6 bg-muted/30 rounded-xl space-y-2">
              <Brain className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Upload documents, SOPs, and catalogs</p>
            </div>
            <Badge variant="outline" className="bg-amber-500/15 text-amber-600 border-amber-500/30">
              <Lock className="w-3 h-3 mr-1" />Coming in Advanced Phase
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-dashed border-2">
          <CardHeader className="text-center">
            <div className="mx-auto p-4 rounded-2xl bg-purple-500/10 w-fit mb-3">
              <Workflow className="w-8 h-8 text-purple-600" />
            </div>
            <CardTitle className="text-lg">Agentic AI & Workflows</CardTitle>
            <CardDescription>Automated workflows for operations</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="p-6 bg-muted/30 rounded-xl space-y-2">
              <Workflow className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Auto-restock, smart alerts, order routing</p>
            </div>
            <Badge variant="outline" className="bg-amber-500/15 text-amber-600 border-amber-500/30">
              <Lock className="w-3 h-3 mr-1" />Coming in Advanced Phase
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Feature Toggle Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Automation Feature Controls</CardTitle>
              <CardDescription>Enable or disable automation features. Only Admin can control feature activation.</CardDescription>
            </div>
            <Badge variant="secondary">{features.length} features</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map(feature => {
              const Icon = feature.icon;
              const isDisabled = feature.status === 'coming';
              return (
                <Card
                  key={feature.id}
                  className={`transition-all ${
                    isDisabled ? 'opacity-50 grayscale' :
                    feature.enabled ? 'border-primary/30 bg-primary/5' : 'opacity-80'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg shrink-0 ${feature.enabled && !isDisabled ? 'bg-primary/10' : 'bg-muted'}`}>
                          <Icon className={`w-5 h-5 ${feature.enabled && !isDisabled ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm">{feature.name}</h4>
                            <Badge variant="outline" className={`text-[10px] h-4 px-1 ${
                              feature.status === 'active' ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' :
                              feature.status === 'beta' ? 'bg-blue-500/15 text-blue-600 border-blue-500/30' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {feature.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                          <Badge variant={feature.enabled && !isDisabled ? 'default' : 'secondary'} className="mt-2 text-xs">
                            {isDisabled ? 'Coming Soon' : feature.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                      </div>
                      <Switch
                        checked={feature.enabled}
                        onCheckedChange={() => toggleFeature(feature.id)}
                        disabled={isDisabled}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
