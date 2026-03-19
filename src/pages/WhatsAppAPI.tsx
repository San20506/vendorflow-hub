import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Wifi, WifiOff, Clock, Send, Settings, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import WhatsAppTemplates from '@/components/whatsapp/WhatsAppTemplates';
import WhatsAppMessaging from '@/components/whatsapp/WhatsAppMessaging';
import WhatsAppMessageLog from '@/components/whatsapp/WhatsAppMessageLog';
import WhatsAppMetaConfig from '@/components/whatsapp/WhatsAppMetaConfig';

export default function WhatsAppAPI() {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(true);
  const [autoReply, setAutoReply] = useState(true);

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

      {/* Connection Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Business Account</p>
              <p className="font-semibold">VendorFlow Commerce</p>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs">✓ Verified</Badge>
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
        <Card><CardContent className="pt-5 pb-4"><p className="text-xl font-bold">5</p><p className="text-xs text-muted-foreground">Messages Sent</p></CardContent></Card>
        <Card><CardContent className="pt-5 pb-4"><p className="text-xl font-bold text-amber-600">3</p><p className="text-xs text-muted-foreground">Delivered</p></CardContent></Card>
        <Card><CardContent className="pt-5 pb-4"><p className="text-xl font-bold text-emerald-600">2</p><p className="text-xs text-muted-foreground">Read</p></CardContent></Card>
        <Card><CardContent className="pt-5 pb-4"><p className="text-xl font-bold text-rose-600">1</p><p className="text-xs text-muted-foreground">Failed</p></CardContent></Card>
        <Card><CardContent className="pt-5 pb-4"><p className="text-xl font-bold text-primary">8</p><p className="text-xs text-muted-foreground">Active Templates</p></CardContent></Card>
      </div>

      <Tabs defaultValue="messaging">
        <TabsList>
          <TabsTrigger value="messaging" className="gap-1.5"><Send className="w-4 h-4" />Messaging</TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5"><MessageSquare className="w-4 h-4" />Templates</TabsTrigger>
          <TabsTrigger value="logs" className="gap-1.5"><Clock className="w-4 h-4" />Message Log</TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5"><Settings className="w-4 h-4" />Meta API Config</TabsTrigger>
        </TabsList>

        <TabsContent value="messaging" className="mt-4">
          <WhatsAppMessaging />
        </TabsContent>
        <TabsContent value="templates" className="space-y-4 mt-4">
          <WhatsAppTemplates />
        </TabsContent>
        <TabsContent value="logs" className="space-y-4 mt-4">
          <WhatsAppMessageLog />
        </TabsContent>
        <TabsContent value="settings" className="space-y-4 mt-4">
          <WhatsAppMetaConfig />
        </TabsContent>
      </Tabs>
    </div>
  );
}
