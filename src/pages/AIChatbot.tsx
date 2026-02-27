import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { MessageSquare, Brain, Workflow, Lock, Sparkles, FolderOpen, Zap, BarChart3, Package, RotateCcw, CreditCard, Users, Bell, Star, ThumbsDown, Search, Bot, Save } from 'lucide-react';
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

const mockReviews = [
  { platform: 'Amazon', avg: 4.2, total: 1247, positive: 85, negative: 8, neutral: 7 },
  { platform: 'Flipkart', avg: 4.0, total: 892, positive: 78, negative: 12, neutral: 10 },
  { platform: 'Meesho', avg: 3.8, total: 456, positive: 72, negative: 15, neutral: 13 },
  { platform: 'Myntra', avg: 4.5, total: 321, positive: 90, negative: 5, neutral: 5 },
];

const mockNegativeFeedback = [
  { product: 'Wireless Earbuds Pro', issue: 'Battery drains quickly', count: 23, severity: 'high' },
  { product: 'Cotton T-Shirt XL', issue: 'Size runs small', count: 18, severity: 'medium' },
  { product: 'Phone Case Premium', issue: 'Poor packaging', count: 12, severity: 'low' },
  { product: 'Smart Watch Band', issue: 'Strap quality poor', count: 9, severity: 'medium' },
];

const mockKeywords = [
  { keyword: 'quality', count: 342, sentiment: 'positive' },
  { keyword: 'delivery', count: 287, sentiment: 'positive' },
  { keyword: 'size issue', count: 156, sentiment: 'negative' },
  { keyword: 'value for money', count: 134, sentiment: 'positive' },
  { keyword: 'packaging', count: 98, sentiment: 'negative' },
  { keyword: 'comfortable', count: 89, sentiment: 'positive' },
];

export default function AIChatbot() {
  const { toast } = useToast();
  const [features, setFeatures] = useState(initialFeatures);
  const [chatbotConfig, setChatbotConfig] = useState({ name: 'VendorFlow Assistant', greeting: 'Hello! How can I help you today?', responseDelay: '1', maxHistory: '50' });

  const toggleFeature = (id: string) => {
    const feature = features.find(f => f.id === id);
    if (feature?.status === 'coming') {
      toast({ title: 'Coming Soon', description: `${feature.name} is planned for a future release.` });
      return;
    }
    setFeatures(prev => prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
    const updated = features.find(f => f.id === id);
    if (updated) {
      toast({ title: updated.enabled ? 'Feature Disabled' : 'Feature Enabled', description: `${updated.name} has been ${updated.enabled ? 'disabled' : 'enabled'}.` });
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
          <Badge variant="outline">✔ Updated</Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Overview</TabsTrigger>
          <TabsTrigger value="reviews" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Reviews</TabsTrigger>
          <TabsTrigger value="feedback" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Feedback</TabsTrigger>
          <TabsTrigger value="keywords" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Keywords</TabsTrigger>
          <TabsTrigger value="chatbot" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Chatbot</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* AI Modules */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-dashed border-2">
              <CardHeader className="text-center">
                <div className="mx-auto p-4 rounded-2xl bg-primary/10 w-fit mb-3"><MessageSquare className="w-8 h-8 text-primary" /></div>
                <CardTitle className="text-lg">System AI Chatbot</CardTitle>
                <CardDescription>Conversational AI assistant for VMS queries</CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="p-6 bg-muted/30 rounded-xl">
                  <Sparkles className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">AI chat interface will be available here</p>
                </div>
                <Badge variant="outline" className="bg-amber-500/15 text-amber-600 border-amber-500/30"><Lock className="w-3 h-3 mr-1" />Coming in Advanced Phase</Badge>
              </CardContent>
            </Card>
            <Card className="border-dashed border-2">
              <CardHeader className="text-center">
                <div className="mx-auto p-4 rounded-2xl bg-blue-500/10 w-fit mb-3"><FolderOpen className="w-8 h-8 text-blue-600" /></div>
                <CardTitle className="text-lg">AI Knowledge Base</CardTitle>
                <CardDescription>Centralized knowledge for AI training</CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="p-6 bg-muted/30 rounded-xl space-y-2">
                  <Brain className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Upload documents, SOPs, and catalogs</p>
                </div>
                <Badge variant="outline" className="bg-amber-500/15 text-amber-600 border-amber-500/30"><Lock className="w-3 h-3 mr-1" />Coming in Advanced Phase</Badge>
              </CardContent>
            </Card>
            <Card className="border-dashed border-2">
              <CardHeader className="text-center">
                <div className="mx-auto p-4 rounded-2xl bg-purple-500/10 w-fit mb-3"><Workflow className="w-8 h-8 text-purple-600" /></div>
                <CardTitle className="text-lg">Agentic AI & Workflows</CardTitle>
                <CardDescription>Automated workflows for operations</CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="p-6 bg-muted/30 rounded-xl space-y-2">
                  <Workflow className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Auto-restock, smart alerts, order routing</p>
                </div>
                <Badge variant="outline" className="bg-amber-500/15 text-amber-600 border-amber-500/30"><Lock className="w-3 h-3 mr-1" />Coming in Advanced Phase</Badge>
              </CardContent>
            </Card>
          </div>

          {/* AI Suggestion Placeholder */}
          <Card className="border-dashed border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" />AI Suggestions</CardTitle>
              <CardDescription>AI-powered recommendations based on your data patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['Optimize pricing for SKU-001 based on competitor data', 'Restock Wireless Earbuds — stock drops below threshold in 3 days', 'Review return rate spike on Flipkart channel this week'].map((suggestion, i) => (
                  <div key={i} className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                    <Sparkles className="w-4 h-4 text-primary mb-2" />
                    <p className="text-sm text-foreground">{suggestion}</p>
                    <Badge variant="outline" className="mt-2 text-xs">AI Generated</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Feature Toggle Panel */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div><CardTitle>Automation Feature Controls</CardTitle><CardDescription>Enable or disable automation features.</CardDescription></div>
                <Badge variant="secondary">{features.length} features</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map(feature => {
                  const Icon = feature.icon;
                  const isDisabled = feature.status === 'coming';
                  return (
                    <Card key={feature.id} className={`transition-all ${isDisabled ? 'opacity-50 grayscale' : feature.enabled ? 'border-primary/30 bg-primary/5' : 'opacity-80'}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg shrink-0 ${feature.enabled && !isDisabled ? 'bg-primary/10' : 'bg-muted'}`}>
                              <Icon className={`w-5 h-5 ${feature.enabled && !isDisabled ? 'text-primary' : 'text-muted-foreground'}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-sm">{feature.name}</h4>
                                <Badge variant="outline" className={`text-[10px] h-4 px-1 ${feature.status === 'active' ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' : feature.status === 'beta' ? 'bg-blue-500/15 text-blue-600 border-blue-500/30' : 'bg-muted text-muted-foreground'}`}>{feature.status}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                              <Badge variant={feature.enabled && !isDisabled ? 'default' : 'secondary'} className="mt-2 text-xs">{isDisabled ? 'Coming Soon' : feature.enabled ? 'Enabled' : 'Disabled'}</Badge>
                            </div>
                          </div>
                          <Switch checked={feature.enabled} onCheckedChange={() => toggleFeature(feature.id)} disabled={isDisabled} />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Star className="w-5 h-5 text-amber-500" />Review Rating Summary</CardTitle>
              <CardDescription>Platform-wise customer review overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {mockReviews.map(r => (
                  <Card key={r.platform} className="bg-muted/20">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{r.platform}</h4>
                        <div className="flex items-center gap-1"><Star className="w-4 h-4 text-amber-500 fill-amber-500" /><span className="font-bold">{r.avg}</span></div>
                      </div>
                      <p className="text-sm text-muted-foreground">{r.total.toLocaleString()} reviews</p>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs"><span className="w-16">Positive</span><Progress value={r.positive} className="h-2 flex-1" /><span className="w-8 text-right">{r.positive}%</span></div>
                        <div className="flex items-center gap-2 text-xs"><span className="w-16">Neutral</span><Progress value={r.neutral} className="h-2 flex-1" /><span className="w-8 text-right">{r.neutral}%</span></div>
                        <div className="flex items-center gap-2 text-xs"><span className="w-16">Negative</span><Progress value={r.negative} className="h-2 flex-1" /><span className="w-8 text-right">{r.negative}%</span></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ThumbsDown className="w-5 h-5 text-rose-500" />Negative Feedback Indicators</CardTitle>
              <CardDescription>Top issues flagged by customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockNegativeFeedback.map((fb, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${fb.severity === 'high' ? 'bg-rose-500' : fb.severity === 'medium' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                      <div>
                        <p className="font-medium text-sm">{fb.product}</p>
                        <p className="text-xs text-muted-foreground">{fb.issue}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{fb.count} mentions</Badge>
                      <Badge variant="outline" className={fb.severity === 'high' ? 'bg-rose-500/10 text-rose-600 border-rose-500/30' : fb.severity === 'medium' ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' : 'bg-blue-500/10 text-blue-600 border-blue-500/30'}>{fb.severity}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Keywords Tab */}
        <TabsContent value="keywords" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Search className="w-5 h-5 text-primary" />Keyword Insights</CardTitle>
              <CardDescription>Most mentioned keywords in customer reviews</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {mockKeywords.map((kw, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={kw.sentiment === 'positive' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-rose-500/10 text-rose-600 border-rose-500/30'}>{kw.sentiment === 'positive' ? '👍' : '👎'}</Badge>
                      <span className="font-medium text-sm">{kw.keyword}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{kw.count} mentions</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chatbot Config Tab */}
        <TabsContent value="chatbot" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bot className="w-5 h-5 text-primary" />Chatbot Configuration</CardTitle>
              <CardDescription>Configure AI chatbot behavior and appearance (UI only)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Bot Name</Label><Input value={chatbotConfig.name} onChange={e => setChatbotConfig(p => ({ ...p, name: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Response Delay (seconds)</Label><Input type="number" value={chatbotConfig.responseDelay} onChange={e => setChatbotConfig(p => ({ ...p, responseDelay: e.target.value }))} /></div>
                <div className="space-y-2 md:col-span-2"><Label>Greeting Message</Label><Input value={chatbotConfig.greeting} onChange={e => setChatbotConfig(p => ({ ...p, greeting: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Max Conversation History</Label><Input type="number" value={chatbotConfig.maxHistory} onChange={e => setChatbotConfig(p => ({ ...p, maxHistory: e.target.value }))} /></div>
              </div>
              <div className="p-4 rounded-lg border border-dashed bg-muted/20">
                <h4 className="font-medium text-sm mb-2">Preview</h4>
                <div className="bg-card rounded-lg p-4 shadow-sm space-y-3 max-w-sm">
                  <div className="flex items-center gap-2"><Bot className="w-5 h-5 text-primary" /><span className="font-semibold text-sm">{chatbotConfig.name}</span><Badge variant="outline" className="text-[10px]">Online</Badge></div>
                  <div className="bg-primary/5 rounded-lg p-3"><p className="text-sm">{chatbotConfig.greeting}</p></div>
                </div>
              </div>
              <Button onClick={() => toast({ title: 'Chatbot Config Saved', description: 'Configuration updated (UI only).' })} className="bg-primary hover:bg-primary/90"><Save className="w-4 h-4 mr-1.5" />Save Configuration</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
