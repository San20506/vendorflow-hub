import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  MessageSquare, Wifi, WifiOff, Send, Clock, CheckCircle2, XCircle, Plus,
  Eye, Copy, Phone, Users, BarChart3, Zap, Settings, RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface WhatsAppTemplate {
  id: string;
  name: string;
  category: 'marketing' | 'utility' | 'authentication';
  status: 'approved' | 'pending' | 'rejected';
  language: string;
  body: string;
  lastUsed: string;
  sentCount: number;
}

interface MessageLog {
  id: string;
  recipient: string;
  recipientName: string;
  template: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  direction: 'outbound' | 'inbound';
  content: string;
}

const daysAgo = (d: number, h = 0) => { const dt = new Date(); dt.setDate(dt.getDate() - d); dt.setHours(dt.getHours() - h); return dt.toISOString(); };

const mockTemplates: WhatsAppTemplate[] = [
  { id: 'TPL-001', name: 'order_confirmation', category: 'utility', status: 'approved', language: 'en', body: 'Hi {{1}}, your order {{2}} has been confirmed. Track: {{3}}', lastUsed: daysAgo(0), sentCount: 1240 },
  { id: 'TPL-002', name: 'shipping_update', category: 'utility', status: 'approved', language: 'en', body: 'Your order {{1}} has been shipped via {{2}}. AWB: {{3}}. Expected delivery: {{4}}', lastUsed: daysAgo(0), sentCount: 890 },
  { id: 'TPL-003', name: 'payment_reminder', category: 'utility', status: 'approved', language: 'en', body: 'Hi {{1}}, payment of ₹{{2}} is pending for invoice {{3}}. Pay now: {{4}}', lastUsed: daysAgo(1), sentCount: 345 },
  { id: 'TPL-004', name: 'festive_offer', category: 'marketing', status: 'approved', language: 'en', body: '🎉 Exclusive offer for you! Get {{1}}% off on {{2}}. Shop now: {{3}}', lastUsed: daysAgo(3), sentCount: 2100 },
  { id: 'TPL-005', name: 'return_pickup', category: 'utility', status: 'pending', language: 'en', body: 'Return pickup for order {{1}} is scheduled on {{2}} between {{3}}. Keep package ready.', lastUsed: '', sentCount: 0 },
  { id: 'TPL-006', name: 'otp_verification', category: 'authentication', status: 'approved', language: 'en', body: 'Your OTP is {{1}}. Valid for 10 minutes. Do not share.', lastUsed: daysAgo(0), sentCount: 4500 },
  { id: 'TPL-007', name: 'abandoned_cart', category: 'marketing', status: 'rejected', language: 'en', body: 'Hi {{1}}, you left items in your cart worth ₹{{2}}. Complete your order: {{3}}', lastUsed: '', sentCount: 0 },
];

const mockLogs: MessageLog[] = [
  { id: 'LOG-001', recipient: '+91 98765 43210', recipientName: 'Vikram Patel', template: 'order_confirmation', status: 'read', timestamp: daysAgo(0, 1), direction: 'outbound', content: 'Your order ORD-2026-045 has been confirmed.' },
  { id: 'LOG-002', recipient: '+91 87654 32109', recipientName: 'Meena Sharma', template: 'shipping_update', status: 'delivered', timestamp: daysAgo(0, 2), direction: 'outbound', content: 'Your order has been shipped via BlueDart.' },
  { id: 'LOG-003', recipient: '+91 76543 21098', recipientName: 'Amit Kumar', template: 'payment_reminder', status: 'sent', timestamp: daysAgo(0, 3), direction: 'outbound', content: 'Payment of ₹12,500 is pending.' },
  { id: 'LOG-004', recipient: '+91 65432 10987', recipientName: 'Sneha Reddy', template: '-', status: 'read', timestamp: daysAgo(0, 4), direction: 'inbound', content: 'Hi, I want to place a bulk order for home decor items.' },
  { id: 'LOG-005', recipient: '+91 98765 43210', recipientName: 'Vikram Patel', template: 'festive_offer', status: 'failed', timestamp: daysAgo(1), direction: 'outbound', content: 'Exclusive 20% off on electronics!' },
  { id: 'LOG-006', recipient: '+91 54321 09876', recipientName: 'Ravi Joshi', template: 'otp_verification', status: 'delivered', timestamp: daysAgo(0, 5), direction: 'outbound', content: 'Your OTP is 482910.' },
];

const statusBadge = (s: string) => {
  const map: Record<string, { cls: string; icon: React.ElementType }> = {
    sent: { cls: 'bg-blue-500/15 text-blue-600 border-blue-500/30', icon: Send },
    delivered: { cls: 'bg-amber-500/15 text-amber-600 border-amber-500/30', icon: CheckCircle2 },
    read: { cls: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30', icon: Eye },
    failed: { cls: 'bg-rose-500/15 text-rose-600 border-rose-500/30', icon: XCircle },
    approved: { cls: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30', icon: CheckCircle2 },
    pending: { cls: 'bg-amber-500/15 text-amber-600 border-amber-500/30', icon: Clock },
    rejected: { cls: 'bg-rose-500/15 text-rose-600 border-rose-500/30', icon: XCircle },
  };
  const cfg = map[s] || map.pending;
  const Icon = cfg.icon;
  return <Badge variant="outline" className={`gap-1 capitalize ${cfg.cls}`}><Icon className="w-3 h-3" />{s}</Badge>;
};

export default function WhatsAppAPI() {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(true);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [autoReply, setAutoReply] = useState(true);
  const [businessVerified, setBusinessVerified] = useState(true);

  const stats = {
    totalSent: mockLogs.filter(l => l.direction === 'outbound').length,
    delivered: mockLogs.filter(l => l.status === 'delivered' || l.status === 'read').length,
    read: mockLogs.filter(l => l.status === 'read').length,
    failed: mockLogs.filter(l => l.status === 'failed').length,
    templates: mockTemplates.filter(t => t.status === 'approved').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">WhatsApp Business API</h1>
          <p className="text-muted-foreground">Manage messaging, templates, and conversation logs</p>
        </div>
        <div className="flex gap-2 items-center">
          <Badge variant="outline" className={isConnected ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30 gap-1.5' : 'bg-rose-500/15 text-rose-600 border-rose-500/30 gap-1.5'}>
            {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
          <Button variant={isConnected ? 'outline' : 'default'} className="gap-2" onClick={() => {
            setIsConnected(!isConnected);
            toast({ title: isConnected ? 'Disconnected' : 'Connected', description: isConnected ? 'WhatsApp API disconnected' : 'WhatsApp Business API connected successfully' });
          }}>
            {isConnected ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
            {isConnected ? 'Disconnect' : 'Connect'}
          </Button>
        </div>
      </div>

      {/* Connection Status Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Business Account</p>
              <p className="font-semibold">VendorFlow Commerce</p>
              <Badge variant="outline" className={businessVerified ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs' : 'bg-amber-500/10 text-amber-600 text-xs'}>{businessVerified ? '✓ Verified' : 'Pending'}</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Phone Number</p>
              <p className="font-semibold">+91 98765 00001</p>
              <p className="text-xs text-muted-foreground">Quality: High</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">API Status</p>
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                <p className="font-semibold">{isConnected ? 'Active' : 'Inactive'}</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Auto Reply</p>
              <div className="flex items-center gap-2">
                <Switch checked={autoReply} onCheckedChange={v => { setAutoReply(v); toast({ title: v ? 'Auto-reply enabled' : 'Auto-reply disabled' }); }} />
                <span className="text-sm">{autoReply ? 'On' : 'Off'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="pt-5 pb-4"><p className="text-xl font-bold">{stats.totalSent}</p><p className="text-xs text-muted-foreground">Messages Sent</p></CardContent></Card>
        <Card><CardContent className="pt-5 pb-4"><p className="text-xl font-bold text-amber-600">{stats.delivered}</p><p className="text-xs text-muted-foreground">Delivered</p></CardContent></Card>
        <Card><CardContent className="pt-5 pb-4"><p className="text-xl font-bold text-emerald-600">{stats.read}</p><p className="text-xs text-muted-foreground">Read</p></CardContent></Card>
        <Card><CardContent className="pt-5 pb-4"><p className="text-xl font-bold text-rose-600">{stats.failed}</p><p className="text-xs text-muted-foreground">Failed</p></CardContent></Card>
        <Card><CardContent className="pt-5 pb-4"><p className="text-xl font-bold text-primary">{stats.templates}</p><p className="text-xs text-muted-foreground">Active Templates</p></CardContent></Card>
      </div>

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates" className="gap-1.5"><MessageSquare className="w-4 h-4" />Templates</TabsTrigger>
          <TabsTrigger value="logs" className="gap-1.5"><Clock className="w-4 h-4" />Message Log</TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5"><Settings className="w-4 h-4" />Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{mockTemplates.length} templates configured</p>
            <Button className="gap-2" onClick={() => setShowNewTemplate(true)}><Plus className="w-4 h-4" />New Template</Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Template Name</TableHead>
                    <TableHead className="font-semibold">Category</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Language</TableHead>
                    <TableHead className="font-semibold text-right">Sent</TableHead>
                    <TableHead className="font-semibold">Preview</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockTemplates.map(tpl => (
                    <TableRow key={tpl.id}>
                      <TableCell className="font-mono text-sm">{tpl.name}</TableCell>
                      <TableCell><Badge variant="secondary" className="capitalize text-xs">{tpl.category}</Badge></TableCell>
                      <TableCell>{statusBadge(tpl.status)}</TableCell>
                      <TableCell className="uppercase text-sm">{tpl.language}</TableCell>
                      <TableCell className="text-right font-semibold">{tpl.sentCount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => toast({ title: tpl.name, description: tpl.body })}><Eye className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle>Message Log</CardTitle><CardDescription>Recent WhatsApp message activity</CardDescription></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Direction</TableHead>
                    <TableHead className="font-semibold">Recipient</TableHead>
                    <TableHead className="font-semibold">Template</TableHead>
                    <TableHead className="font-semibold">Content</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockLogs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge variant="outline" className={log.direction === 'outbound' ? 'bg-blue-500/10 text-blue-600 border-blue-500/30' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'}>
                          {log.direction === 'outbound' ? '↑ Out' : '↓ In'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div><p className="text-sm font-medium">{log.recipientName}</p><p className="text-xs text-muted-foreground">{log.recipient}</p></div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{log.template}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{log.content}</TableCell>
                      <TableCell>{statusBadge(log.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(new Date(log.timestamp), 'dd MMM, HH:mm')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>API Configuration</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label>API Key</Label><div className="flex gap-2"><Input value="whsec_••••••••••••••••" readOnly /><Button variant="outline" size="icon" onClick={() => toast({ title: 'Copied' })}><Copy className="w-4 h-4" /></Button></div></div>
                <div className="space-y-2"><Label>Webhook URL</Label><Input value="https://api.vendorflow.in/webhooks/whatsapp" readOnly /></div>
                <div className="space-y-2"><Label>Callback URL</Label><Input value="https://api.vendorflow.in/callbacks/wa-status" readOnly /></div>
                <Button className="gap-2" onClick={() => toast({ title: 'Connection Tested', description: 'API endpoint is reachable' })}><RefreshCw className="w-4 h-4" />Test Connection</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Notification Preferences</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {['Order Confirmation', 'Shipping Update', 'Payment Reminder', 'Return/Refund Update', 'Promotional Messages'].map(item => (
                  <div key={item} className="flex items-center justify-between">
                    <span className="text-sm">{item}</span>
                    <Switch defaultChecked />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* New Template Dialog */}
      <Dialog open={showNewTemplate} onOpenChange={setShowNewTemplate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Message Template</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label>Template Name</Label><Input placeholder="e.g., order_update" /></div>
            <div className="space-y-2">
              <Label>Category</Label>
              <select className="w-full border rounded-md px-3 py-2 text-sm bg-background">
                <option value="utility">Utility</option>
                <option value="marketing">Marketing</option>
                <option value="authentication">Authentication</option>
              </select>
            </div>
            <div className="space-y-2"><Label>Message Body</Label><Textarea placeholder="Use {{1}}, {{2}} for variables..." rows={4} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewTemplate(false)}>Cancel</Button>
            <Button onClick={() => { toast({ title: 'Template Submitted', description: 'Sent for WhatsApp approval' }); setShowNewTemplate(false); }}>Submit for Approval</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
