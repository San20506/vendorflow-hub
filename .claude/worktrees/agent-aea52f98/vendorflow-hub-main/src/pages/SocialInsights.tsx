import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TrendingUp, Eye, Heart, Search, Send, MessageCircle, Instagram, Facebook, Mail,
  MessageSquare as WhatsApp, ShoppingCart, Bot, Zap, UserPlus, AlertTriangle,
  ChevronRight, ClipboardList, FileSpreadsheet, FileDown, Phone, Users,
  CheckCircle, Clock, XCircle, ArrowRight, BellRing, Sparkles, Tag,
  Brain, GraduationCap, RotateCcw, Ban, CalendarClock,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

type Channel = 'all' | 'instagram' | 'facebook' | 'whatsapp' | 'email' | 'marketplace';
type MessageCategory = 'new_lead' | 'order_status' | 'complaint' | 'return' | 'follow_up' | 'ignore';
type TaskCategory = 'done' | 'follow_up' | 'more_info' | 'ignore';
type AutoReplyFlow = 'order_status' | 'new_lead' | 'complaint' | 'product_inquiry';
type FollowUpStatus = 'none' | 'scheduled' | 'in_progress' | 'completed' | 'overdue';

interface Message {
  id: string;
  channel: Channel;
  channelIcon: string;
  sender: string;
  senderPhone?: string;
  subject: string;
  preview: string;
  time: string;
  status: 'unread' | 'replied' | 'pending' | 'escalated';
  avatar: string;
  category: MessageCategory;
  autoReplyTriggered: boolean;
  autoReplyFlow?: AutoReplyFlow;
  convertedToTask: boolean;
  taskCategory?: TaskCategory;
  savedToContacts: boolean;
  aiConfidence?: number;
  escalatedTo?: string;
  followUpStatus: FollowUpStatus;
  followUpDate?: string;
  humanReplied: boolean;
  learnedFromHuman: boolean;
  conversationHistory: { role: 'customer' | 'ai' | 'agent'; message: string; time: string }[];
}

const mockMessages: Message[] = [
  {
    id: 'MSG-001', channel: 'instagram', channelIcon: '📸', sender: 'priya_fashion', subject: 'Product inquiry',
    preview: 'Hi, is the wireless earbuds available in white?', time: '2m ago', status: 'unread', avatar: 'P',
    category: 'new_lead', autoReplyTriggered: false, convertedToTask: false, savedToContacts: false, aiConfidence: 0.85,
    followUpStatus: 'none', humanReplied: false, learnedFromHuman: false,
    conversationHistory: [
      { role: 'customer', message: 'Hi, is the wireless earbuds available in white?', time: '2m ago' },
    ],
  },
  {
    id: 'MSG-002', channel: 'facebook', channelIcon: '📘', sender: 'Rahul Sharma', subject: 'Order status',
    preview: 'Can you check my order ORD-2024-001 status?', time: '15m ago', status: 'replied', avatar: 'R',
    category: 'order_status', autoReplyTriggered: true, autoReplyFlow: 'order_status', convertedToTask: false, savedToContacts: false, aiConfidence: 0.95,
    followUpStatus: 'none', humanReplied: false, learnedFromHuman: false,
    conversationHistory: [
      { role: 'customer', message: 'Can you check my order ORD-2024-001 status?', time: '15m ago' },
      { role: 'ai', message: 'Your order ORD-2024-001 is currently Shipped and in transit via BlueDart (AWB123456789). Expected delivery in 1-2 days.', time: '15m ago' },
    ],
  },
  {
    id: 'MSG-003', channel: 'whatsapp', channelIcon: '💬', sender: '+91 98765 43210', senderPhone: '+919876543210', subject: 'Bulk order',
    preview: 'We need 50 units of the fitness watch. Whats the bulk price?', time: '32m ago', status: 'pending', avatar: 'W',
    category: 'new_lead', autoReplyTriggered: true, autoReplyFlow: 'new_lead', convertedToTask: false, savedToContacts: true, aiConfidence: 0.72,
    followUpStatus: 'scheduled', followUpDate: '2026-02-14', humanReplied: false, learnedFromHuman: false,
    conversationHistory: [
      { role: 'customer', message: 'We need 50 units of the fitness watch. Whats the bulk price?', time: '32m ago' },
      { role: 'ai', message: 'Thank you for your interest! For bulk orders of 50+ units, our team will prepare a custom quote. A representative will reach out shortly.', time: '32m ago' },
    ],
  },
  {
    id: 'MSG-004', channel: 'email', channelIcon: '📧', sender: 'kavita.m@email.com', subject: 'Return request',
    preview: 'I received a damaged speaker, need to initiate return process.', time: '1h ago', status: 'replied', avatar: 'K',
    category: 'return', autoReplyTriggered: true, autoReplyFlow: 'complaint', convertedToTask: true, taskCategory: 'follow_up', savedToContacts: false, aiConfidence: 0.88,
    followUpStatus: 'in_progress', humanReplied: true, learnedFromHuman: true,
    conversationHistory: [
      { role: 'customer', message: 'I received a damaged speaker, need to initiate return process.', time: '1h ago' },
      { role: 'ai', message: 'We apologize for the inconvenience. I\'ve flagged this for our returns team. Could you share a photo of the damage?', time: '58m ago' },
      { role: 'customer', message: 'Here is the photo. The speaker has a visible crack on the side.', time: '50m ago' },
      { role: 'agent', message: 'Thank you, Kavita. I\'ve initiated return RET-2024-008 for you. Pickup will be scheduled within 24 hours.', time: '45m ago' },
    ],
  },
  {
    id: 'MSG-005', channel: 'marketplace', channelIcon: '🛒', sender: 'Amazon Buyer', subject: 'Quality concern',
    preview: 'The yoga mat seems different from the product image shown...', time: '2h ago', status: 'escalated', avatar: 'A',
    category: 'complaint', autoReplyTriggered: true, autoReplyFlow: 'complaint', convertedToTask: true, taskCategory: 'more_info', savedToContacts: false, aiConfidence: 0.35, escalatedTo: 'Operations Manager',
    followUpStatus: 'overdue', humanReplied: true, learnedFromHuman: false,
    conversationHistory: [
      { role: 'customer', message: 'The yoga mat seems different from the product image shown...', time: '2h ago' },
      { role: 'ai', message: 'We take product quality very seriously. Let me connect you with our team for a detailed review.', time: '2h ago' },
      { role: 'agent', message: 'Hi, could you send us photos comparing what you received vs what was shown? This helps us investigate.', time: '1h 45m ago' },
    ],
  },
  {
    id: 'MSG-006', channel: 'instagram', channelIcon: '📸', sender: 'sneha_reviews', subject: 'Collaboration',
    preview: 'Would love to review your products. Please DM details.', time: '3h ago', status: 'unread', avatar: 'S',
    category: 'new_lead', autoReplyTriggered: false, convertedToTask: false, savedToContacts: false, aiConfidence: 0.78,
    followUpStatus: 'none', humanReplied: false, learnedFromHuman: false,
    conversationHistory: [
      { role: 'customer', message: 'Would love to review your products. Please DM details.', time: '3h ago' },
    ],
  },
  {
    id: 'MSG-007', channel: 'whatsapp', channelIcon: '💬', sender: '+91 87654 32109', senderPhone: '+918765432109', subject: 'Payment query',
    preview: 'My payment got debited but order not confirmed yet', time: '4h ago', status: 'escalated', avatar: 'W',
    category: 'complaint', autoReplyTriggered: true, autoReplyFlow: 'complaint', convertedToTask: true, taskCategory: 'follow_up', savedToContacts: true, aiConfidence: 0.30, escalatedTo: 'Finance Team',
    followUpStatus: 'in_progress', humanReplied: true, learnedFromHuman: false,
    conversationHistory: [
      { role: 'customer', message: 'My payment got debited but order not confirmed yet', time: '4h ago' },
      { role: 'ai', message: 'I understand your concern about the payment. Let me escalate this to our finance team for immediate review.', time: '4h ago' },
      { role: 'agent', message: 'We\'re checking with the payment gateway. Your transaction ID has been flagged for priority review.', time: '3h 30m ago' },
    ],
  },
  {
    id: 'MSG-008', channel: 'facebook', channelIcon: '📘', sender: 'Amit Kumar', subject: 'Product feedback',
    preview: 'The baby care gift set was amazing! Can you add more variants?', time: '5h ago', status: 'replied', avatar: 'A',
    category: 'follow_up', autoReplyTriggered: true, autoReplyFlow: 'product_inquiry', convertedToTask: false, savedToContacts: false, aiConfidence: 0.92,
    followUpStatus: 'completed', humanReplied: false, learnedFromHuman: false,
    conversationHistory: [
      { role: 'customer', message: 'The baby care gift set was amazing! Can you add more variants?', time: '5h ago' },
      { role: 'ai', message: 'Thank you for the wonderful feedback! We\'re glad you loved it. We\'re working on new variants — stay tuned!', time: '5h ago' },
    ],
  },
  {
    id: 'MSG-009', channel: 'email', channelIcon: '📧', sender: 'vendor@partner.com', subject: 'Stock update',
    preview: 'Please update availability for SKU-AMZ-006 on your portal.', time: '6h ago', status: 'pending', avatar: 'V',
    category: 'ignore', autoReplyTriggered: false, convertedToTask: false, savedToContacts: false, aiConfidence: 0.40,
    followUpStatus: 'none', humanReplied: false, learnedFromHuman: false,
    conversationHistory: [
      { role: 'customer', message: 'Please update availability for SKU-AMZ-006 on your portal.', time: '6h ago' },
    ],
  },
  {
    id: 'MSG-010', channel: 'marketplace', channelIcon: '🛒', sender: 'Flipkart Buyer', subject: 'Size exchange',
    preview: 'Need size L instead of M for the cotton t-shirt order', time: '8h ago', status: 'replied', avatar: 'F',
    category: 'return', autoReplyTriggered: true, autoReplyFlow: 'order_status', convertedToTask: true, taskCategory: 'done', savedToContacts: false, aiConfidence: 0.90,
    followUpStatus: 'completed', humanReplied: true, learnedFromHuman: true,
    conversationHistory: [
      { role: 'customer', message: 'Need size L instead of M for the cotton t-shirt order', time: '8h ago' },
      { role: 'ai', message: 'I can help with the size exchange. Could you share your order ID so I can initiate the process?', time: '8h ago' },
      { role: 'customer', message: 'Order ID is FLK-OD-345678901', time: '7h 50m ago' },
      { role: 'agent', message: 'Exchange initiated for order FLK-OD-345678901. Size L will be dispatched after we receive the current item.', time: '7h 30m ago' },
    ],
  },
];

const channelTabs: { id: Channel; label: string; icon: React.ElementType }[] = [
  { id: 'all', label: 'All', icon: MessageCircle },
  { id: 'instagram', label: 'Instagram', icon: Instagram },
  { id: 'facebook', label: 'Facebook', icon: Facebook },
  { id: 'whatsapp', label: 'WhatsApp', icon: WhatsApp },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'marketplace', label: 'Marketplace', icon: ShoppingCart },
];

const statusConfig: Record<string, { label: string; className: string }> = {
  unread: { label: 'Unread', className: 'bg-blue-500/15 text-blue-600 border-blue-500/30' },
  replied: { label: 'Replied', className: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' },
  pending: { label: 'Pending', className: 'bg-amber-500/15 text-amber-600 border-amber-500/30' },
  escalated: { label: 'Escalated', className: 'bg-rose-500/15 text-rose-600 border-rose-500/30' },
};

const categoryConfig: Record<MessageCategory, { label: string; color: string; icon: React.ElementType }> = {
  new_lead: { label: 'New Lead', color: 'bg-emerald-500/10 text-emerald-600', icon: UserPlus },
  order_status: { label: 'Order Status', color: 'bg-blue-500/10 text-blue-600', icon: ShoppingCart },
  complaint: { label: 'Complaint', color: 'bg-rose-500/10 text-rose-600', icon: AlertTriangle },
  return: { label: 'Return', color: 'bg-orange-500/10 text-orange-600', icon: RotateCcw },
  follow_up: { label: 'Follow-up', color: 'bg-purple-500/10 text-purple-600', icon: CalendarClock },
  ignore: { label: 'Ignore', color: 'bg-muted text-muted-foreground', icon: Ban },
};

const flowLabels: Record<AutoReplyFlow, string> = {
  order_status: 'Order Status Query',
  new_lead: 'New Lead Response',
  complaint: 'Complaint Handler',
  product_inquiry: 'Product Inquiry',
};

const taskCategoryConfig: Record<TaskCategory, { label: string; color: string; icon: React.ElementType }> = {
  done: { label: 'Done', color: 'bg-emerald-500/10 text-emerald-600', icon: CheckCircle },
  follow_up: { label: 'Follow-up', color: 'bg-amber-500/10 text-amber-600', icon: Clock },
  more_info: { label: 'More Info Required', color: 'bg-blue-500/10 text-blue-600', icon: Search },
  ignore: { label: 'Ignore', color: 'bg-muted text-muted-foreground', icon: XCircle },
};

const followUpConfig: Record<FollowUpStatus, { label: string; color: string }> = {
  none: { label: 'None', color: '' },
  scheduled: { label: 'Scheduled', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  in_progress: { label: 'In Progress', color: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
  completed: { label: 'Completed', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' },
  overdue: { label: 'Overdue', color: 'bg-rose-500/10 text-rose-600 border-rose-500/30' },
};

export default function SocialInsights() {
  const { toast } = useToast();
  const [activeChannel, setActiveChannel] = useState<Channel>('all');
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(messages[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [aiAutoReply, setAiAutoReply] = useState(true);
  const [aiConfidenceThreshold, setAiConfidenceThreshold] = useState(50);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [taskTarget, setTaskTarget] = useState<Message | null>(null);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [autoReplyFlows, setAutoReplyFlows] = useState<Record<AutoReplyFlow, boolean>>({
    order_status: true, new_lead: true, complaint: true, product_inquiry: true,
  });

  const filteredMessages = useMemo(() => messages.filter(m => {
    const matchesChannel = activeChannel === 'all' || m.channel === activeChannel;
    const matchesSearch = m.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.preview.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter;
    return matchesChannel && matchesSearch && matchesCategory;
  }), [messages, activeChannel, searchQuery, categoryFilter]);

  const stats = useMemo(() => ({
    total: messages.length,
    unread: messages.filter(m => m.status === 'unread').length,
    pending: messages.filter(m => m.status === 'pending').length,
    replied: messages.filter(m => m.status === 'replied').length,
    escalated: messages.filter(m => m.status === 'escalated').length,
    newLeads: messages.filter(m => m.category === 'new_lead').length,
    autoReplied: messages.filter(m => m.autoReplyTriggered).length,
    tasks: messages.filter(m => m.convertedToTask).length,
    lowConfidence: messages.filter(m => (m.aiConfidence || 0) * 100 < aiConfidenceThreshold).length,
  }), [messages, aiConfidenceThreshold]);

  const triggerAutoReply = (msgId: string) => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;

    const confidence = msg.aiConfidence || 0;
    const threshold = aiConfidenceThreshold / 100;

    if (confidence < threshold) {
      // Low confidence → assign to human
      setMessages(prev => prev.map(m => {
        if (m.id !== msgId) return m;
        return { ...m, status: 'escalated' as const, escalatedTo: 'Human Agent' };
      }));
      toast({ title: 'Low Confidence — Assigned to Human', description: `AI confidence ${Math.round(confidence * 100)}% is below threshold ${aiConfidenceThreshold}%. Notification sent.`, variant: 'destructive' });
      return;
    }

    const flow: AutoReplyFlow = msg.category === 'order_status' ? 'order_status'
      : msg.category === 'new_lead' ? 'new_lead'
      : msg.category === 'complaint' || msg.category === 'return' ? 'complaint' : 'product_inquiry';
    const reply = flow === 'order_status'
      ? 'Your order is being processed. We\'ll share tracking details shortly.'
      : flow === 'new_lead'
      ? 'Thank you for reaching out! A team member will connect with you soon.'
      : flow === 'complaint'
      ? 'We apologize for the inconvenience. Your issue has been flagged for priority resolution.'
      : 'Thank you for your interest! Here are the details you requested.';
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m;
      return {
        ...m,
        autoReplyTriggered: true,
        autoReplyFlow: flow,
        status: 'replied' as const,
        conversationHistory: [...m.conversationHistory, { role: 'ai' as const, message: reply, time: 'Just now' }],
      };
    }));
    toast({ title: 'AI Auto-Reply Sent', description: `Confidence: ${Math.round(confidence * 100)}% — automated response sent.` });
  };

  const escalateMessage = (msgId: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m;
      return { ...m, status: 'escalated' as const, escalatedTo: 'Operations Manager' };
    }));
    toast({ title: 'Escalated', description: 'Message assigned to Operations Manager & notification sent' });
  };

  const saveToContacts = (msgId: string) => {
    const msg = messages.find(m => m.id === msgId);
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, savedToContacts: true } : m));
    toast({ title: 'WhatsApp Contact Saved', description: `${msg?.senderPhone || msg?.sender} added to Customer List` });
  };

  const convertToTask = (msgId: string, category: TaskCategory) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, convertedToTask: true, taskCategory: category } : m));
    setShowTaskDialog(false);
    setTaskTarget(null);
    toast({ title: 'Task Created in Task Manager', description: `Conversation converted to task: ${taskCategoryConfig[category].label}` });
  };

  const learnFromHumanReply = (msgId: string) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, learnedFromHuman: true } : m));
    toast({ title: 'AI Learning Recorded', description: 'Human reply captured as training signal. AI will improve future responses for similar queries.' });
  };

  const changeCategory = (msgId: string, category: MessageCategory) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, category } : m));
    toast({ title: 'Category Updated', description: `Message categorized as: ${categoryConfig[category].label}` });
  };

  const changeFollowUpStatus = (msgId: string, status: FollowUpStatus) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, followUpStatus: status } : m));
    toast({ title: 'Follow-up Updated', description: `Status changed to: ${followUpConfig[status].label}` });
  };

  const handleExport = (type: 'excel' | 'pdf') => {
    toast({ title: `${type.toUpperCase()} Export`, description: `${filteredMessages.length} chat logs exported as ${type.toUpperCase()}` });
  };

  const currentSelected = selectedMessage ? messages.find(m => m.id === selectedMessage.id) || null : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Unified Inbox</h1>
          <p className="text-muted-foreground">AI-powered customer conversations with automation workflows</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card">
            <Bot className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">AI Auto-Reply</span>
            <Switch checked={aiAutoReply} onCheckedChange={setAiAutoReply} />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowSettingsDialog(true)}>
            <Zap className="w-4 h-4" />Flows & AI
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleExport('excel')}>
            <FileSpreadsheet className="w-4 h-4" />Excel
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleExport('pdf')}>
            <FileDown className="w-4 h-4" />PDF
          </Button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        <Card><CardContent className="p-3"><div className="flex flex-col items-center text-center gap-1"><MessageCircle className="w-5 h-5 text-primary" /><p className="text-xl font-bold">{stats.total}</p><p className="text-[11px] text-muted-foreground">Total</p></div></CardContent></Card>
        <Card className="border-blue-500/30"><CardContent className="p-3"><div className="flex flex-col items-center text-center gap-1"><Eye className="w-5 h-5 text-blue-600" /><p className="text-xl font-bold text-blue-600">{stats.unread}</p><p className="text-[11px] text-muted-foreground">Unread</p></div></CardContent></Card>
        <Card className="border-rose-500/30"><CardContent className="p-3"><div className="flex flex-col items-center text-center gap-1"><AlertTriangle className="w-5 h-5 text-rose-600" /><p className="text-xl font-bold text-rose-600">{stats.escalated}</p><p className="text-[11px] text-muted-foreground">Escalated</p></div></CardContent></Card>
        <Card className="border-emerald-500/30"><CardContent className="p-3"><div className="flex flex-col items-center text-center gap-1"><UserPlus className="w-5 h-5 text-emerald-600" /><p className="text-xl font-bold text-emerald-600">{stats.newLeads}</p><p className="text-[11px] text-muted-foreground">New Leads</p></div></CardContent></Card>
        <Card><CardContent className="p-3"><div className="flex flex-col items-center text-center gap-1"><Bot className="w-5 h-5 text-primary" /><p className="text-xl font-bold">{stats.autoReplied}</p><p className="text-[11px] text-muted-foreground">AI Replied</p></div></CardContent></Card>
        <Card className="border-amber-500/30"><CardContent className="p-3"><div className="flex flex-col items-center text-center gap-1"><Brain className="w-5 h-5 text-amber-600" /><p className="text-xl font-bold text-amber-600">{stats.lowConfidence}</p><p className="text-[11px] text-muted-foreground">Low Confidence</p></div></CardContent></Card>
      </div>

      {/* Low confidence alert */}
      {stats.lowConfidence > 0 && aiAutoReply && (
        <Alert className="border-amber-500/30 bg-amber-500/5">
          <Brain className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-600 ml-2">
            <strong>{stats.lowConfidence} message(s)</strong> below AI confidence threshold ({aiConfidenceThreshold}%). These will be auto-assigned to a human agent.
          </AlertDescription>
        </Alert>
      )}

      {/* Inbox Layout */}
      <div className="grid grid-cols-12 gap-4 h-[650px]">
        {/* Channel Sidebar */}
        <Card className="col-span-12 md:col-span-2">
          <CardContent className="p-2 h-full">
            <div className="space-y-1 mb-3">
              {channelTabs.map(ch => {
                const Icon = ch.icon;
                const count = ch.id === 'all' ? messages.length : messages.filter(m => m.channel === ch.id).length;
                return (
                  <button
                    key={ch.id}
                    onClick={() => setActiveChannel(ch.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      activeChannel === ch.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{ch.label}</span>
                    <Badge variant="secondary" className="ml-auto text-xs h-5 px-1.5">{count}</Badge>
                  </button>
                );
              })}
            </div>
            <div className="border-t pt-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase px-3 mb-1">Category</p>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(categoryConfig).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Message List */}
        <Card className="col-span-12 md:col-span-4">
          <CardHeader className="p-3 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search messages..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-9" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[550px]">
              <div className="space-y-0.5 p-2">
                {filteredMessages.map(msg => {
                  const cat = categoryConfig[msg.category];
                  const CatIcon = cat.icon;
                  const isLowConf = (msg.aiConfidence || 0) * 100 < aiConfidenceThreshold;
                  return (
                    <button
                      key={msg.id}
                      onClick={() => setSelectedMessage(msg)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        currentSelected?.id === msg.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'
                      } ${msg.status === 'unread' ? 'bg-blue-500/5' : ''}`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
                          {msg.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className={`text-sm truncate ${msg.status === 'unread' ? 'font-semibold' : 'font-medium'}`}>{msg.sender}</span>
                            <span className="text-xs text-muted-foreground shrink-0">{msg.time}</span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{msg.subject}</p>
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            <span className="text-xs">{msg.channelIcon}</span>
                            <Badge variant="outline" className={`text-[10px] h-4 px-1 ${statusConfig[msg.status].className}`}>
                              {statusConfig[msg.status].label}
                            </Badge>
                            <Badge variant="secondary" className={`text-[10px] h-4 px-1 gap-0.5 ${cat.color}`}>
                              <CatIcon className="w-2.5 h-2.5" />{cat.label}
                            </Badge>
                            {msg.autoReplyTriggered && (
                              <Badge variant="secondary" className="text-[10px] h-4 px-1 gap-0.5 bg-primary/10 text-primary">
                                <Bot className="w-2.5 h-2.5" />AI
                              </Badge>
                            )}
                            {isLowConf && (
                              <Badge variant="secondary" className="text-[10px] h-4 px-1 gap-0.5 bg-amber-500/10 text-amber-600">
                                <Brain className="w-2.5 h-2.5" />Low
                              </Badge>
                            )}
                            {msg.followUpStatus !== 'none' && (
                              <Badge variant="outline" className={`text-[10px] h-4 px-1 ${followUpConfig[msg.followUpStatus].color}`}>
                                {followUpConfig[msg.followUpStatus].label}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
                {filteredMessages.length === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground">No messages found</div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Message Detail */}
        <Card className="col-span-12 md:col-span-6">
          {currentSelected ? (
            <div className="h-full flex flex-col">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-medium">
                      {currentSelected.avatar}
                    </div>
                    <div>
                      <CardTitle className="text-base">{currentSelected.sender}</CardTitle>
                      <CardDescription className="flex items-center gap-1.5">
                        <span>{currentSelected.channelIcon}</span>
                        <span>{currentSelected.subject}</span>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    <Badge variant="outline" className={statusConfig[currentSelected.status].className}>
                      {statusConfig[currentSelected.status].label}
                    </Badge>
                    {(() => {
                      const cat = categoryConfig[currentSelected.category];
                      const CatIcon = cat.icon;
                      return (
                        <Badge variant="secondary" className={`gap-1 text-xs ${cat.color}`}>
                          <CatIcon className="w-3 h-3" />{cat.label}
                        </Badge>
                      );
                    })()}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-[350px]">
                  <div className="p-4 space-y-3">
                    {/* Conversation */}
                    {currentSelected.conversationHistory.map((entry, idx) => (
                      <div key={idx} className={`flex ${entry.role === 'customer' ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg ${
                          entry.role === 'customer' ? 'bg-muted/50' :
                          entry.role === 'ai' ? 'bg-primary/10 border border-primary/20' :
                          'bg-accent/10 border border-accent/20'
                        }`}>
                          <div className="flex items-center gap-1.5 mb-1">
                            {entry.role === 'ai' && <Bot className="w-3 h-3 text-primary" />}
                            {entry.role === 'agent' && <Users className="w-3 h-3 text-accent-foreground" />}
                            <span className="text-xs font-semibold capitalize">{entry.role === 'ai' ? 'AI Assistant' : entry.role === 'agent' ? 'Agent' : currentSelected.sender}</span>
                            <span className="text-xs text-muted-foreground ml-auto">{entry.time}</span>
                          </div>
                          <p className="text-sm">{entry.message}</p>
                        </div>
                      </div>
                    ))}

                    {/* AI Info */}
                    {currentSelected.autoReplyTriggered && currentSelected.autoReplyFlow && (
                      <div className="p-3 rounded-lg border bg-card">
                        <div className="flex items-center gap-2 text-xs mb-2">
                          <Sparkles className="w-3.5 h-3.5 text-primary" />
                          <span className="font-semibold">AI Auto-Reply Info</span>
                          {currentSelected.learnedFromHuman && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1 gap-0.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/30 ml-auto">
                              <GraduationCap className="w-2.5 h-2.5" />Learned
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><span className="text-muted-foreground">Flow:</span> <span className="font-medium">{flowLabels[currentSelected.autoReplyFlow]}</span></div>
                          <div><span className="text-muted-foreground">Confidence:</span> <span className={`font-medium ${(currentSelected.aiConfidence || 0) * 100 >= aiConfidenceThreshold ? 'text-emerald-600' : 'text-rose-600'}`}>{Math.round((currentSelected.aiConfidence || 0) * 100)}%</span></div>
                          <div><span className="text-muted-foreground">Threshold:</span> <span className="font-medium">{aiConfidenceThreshold}%</span></div>
                          <div><span className="text-muted-foreground">Action:</span> <span className="font-medium">{(currentSelected.aiConfidence || 0) * 100 >= aiConfidenceThreshold ? 'Auto-replied' : 'Assigned to Human'}</span></div>
                        </div>
                      </div>
                    )}

                    {/* Escalation */}
                    {currentSelected.escalatedTo && (
                      <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/5">
                        <div className="flex items-center gap-2 text-xs">
                          <BellRing className="w-3.5 h-3.5 text-rose-600" />
                          <span className="font-semibold text-rose-600">Escalated to: {currentSelected.escalatedTo}</span>
                        </div>
                      </div>
                    )}

                    {/* Task Info */}
                    {currentSelected.convertedToTask && currentSelected.taskCategory && (
                      <div className="p-3 rounded-lg border bg-card">
                        <div className="flex items-center gap-2 text-xs">
                          <ClipboardList className="w-3.5 h-3.5 text-primary" />
                          <span className="font-semibold">Converted to Task:</span>
                          {(() => {
                            const tc = taskCategoryConfig[currentSelected.taskCategory!];
                            const TcIcon = tc.icon;
                            return <Badge variant="secondary" className={`gap-1 text-xs ${tc.color}`}><TcIcon className="w-3 h-3" />{tc.label}</Badge>;
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Follow-up Status Control */}
                    <div className="p-3 rounded-lg border bg-card">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs">
                          <CalendarClock className="w-3.5 h-3.5 text-primary" />
                          <span className="font-semibold">Follow-up Status</span>
                        </div>
                        <Select value={currentSelected.followUpStatus} onValueChange={(v) => changeFollowUpStatus(currentSelected.id, v as FollowUpStatus)}>
                          <SelectTrigger className="h-7 w-32 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(followUpConfig).map(([key, cfg]) => (
                              <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Category Reassignment */}
                    <div className="p-3 rounded-lg border bg-card">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs">
                          <Tag className="w-3.5 h-3.5 text-primary" />
                          <span className="font-semibold">Message Category</span>
                        </div>
                        <Select value={currentSelected.category} onValueChange={(v) => changeCategory(currentSelected.id, v as MessageCategory)}>
                          <SelectTrigger className="h-7 w-36 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(categoryConfig).map(([key, cfg]) => (
                              <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {!currentSelected.autoReplyTriggered && aiAutoReply && (
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => triggerAutoReply(currentSelected.id)}>
                          <Bot className="w-3.5 h-3.5" />Trigger AI Reply
                        </Button>
                      )}
                      {currentSelected.humanReplied && !currentSelected.learnedFromHuman && (
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => learnFromHumanReply(currentSelected.id)}>
                          <GraduationCap className="w-3.5 h-3.5" />Learn from Human Reply
                        </Button>
                      )}
                      {currentSelected.status !== 'escalated' && (
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => escalateMessage(currentSelected.id)}>
                          <AlertTriangle className="w-3.5 h-3.5" />Escalate
                        </Button>
                      )}
                      {currentSelected.channel === 'whatsapp' && !currentSelected.savedToContacts && (
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => saveToContacts(currentSelected.id)}>
                          <Phone className="w-3.5 h-3.5" />Save to Customer List
                        </Button>
                      )}
                      {!currentSelected.convertedToTask && (
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => { setTaskTarget(currentSelected); setShowTaskDialog(true); }}>
                          <ClipboardList className="w-3.5 h-3.5" />Add to Task Manager
                        </Button>
                      )}
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
              <div className="p-3 border-t">
                <div className="flex items-center gap-2">
                  <Input placeholder="Type a reply..." className="flex-1 h-9" />
                  <Button size="icon" className="h-9 w-9" onClick={() => {
                    setMessages(prev => prev.map(m => m.id === currentSelected.id ? { ...m, humanReplied: true, status: 'replied' as const } : m));
                    toast({ title: 'Reply Sent', description: 'Message reply sent successfully.' });
                  }}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <p className="text-sm">Select a message to view details</p>
            </div>
          )}
        </Card>
      </div>

      {/* Convert to Task Dialog */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ClipboardList className="w-5 h-5" />Add to Task Manager</DialogTitle>
          </DialogHeader>
          {taskTarget && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <p className="font-medium">{taskTarget.sender}</p>
                <p className="text-muted-foreground text-xs mt-1">{taskTarget.preview}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Select Category:</p>
                {Object.entries(taskCategoryConfig).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => convertToTask(taskTarget.id, key as TaskCategory)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className={`p-1.5 rounded-lg ${config.color}`}><Icon className="w-4 h-4" /></div>
                      <span className="text-sm font-medium">{config.label}</span>
                      <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AI & Flow Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Zap className="w-5 h-5" />AI & Flow Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">AI Auto-Reply Engine</span>
              </div>
              <Switch checked={aiAutoReply} onCheckedChange={setAiAutoReply} />
            </div>

            {/* AI Confidence Threshold */}
            <div className="p-4 rounded-lg border space-y-3">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">AI Confidence Threshold</span>
                <Badge variant="secondary" className="ml-auto text-xs">{aiConfidenceThreshold}%</Badge>
              </div>
              <Slider
                value={[aiConfidenceThreshold]}
                onValueChange={v => setAiConfidenceThreshold(v[0])}
                min={10}
                max={95}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Messages below this threshold will be auto-assigned to a human agent with notification.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">Predefined Flows</p>
              {Object.entries(flowLabels).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{label}</span>
                  </div>
                  <Switch
                    checked={autoReplyFlows[key as AutoReplyFlow]}
                    onCheckedChange={(v) => setAutoReplyFlows(prev => ({ ...prev, [key]: v }))}
                  />
                </div>
              ))}
            </div>

            <div className="p-3 rounded-lg border bg-card">
              <div className="flex items-center gap-2 text-xs mb-1">
                <GraduationCap className="w-3.5 h-3.5 text-primary" />
                <span className="font-semibold">AI Learning</span>
              </div>
              <p className="text-xs text-muted-foreground">
                When a human replies to a conversation, use "Learn from Human Reply" to capture the response as a training signal. AI will improve future responses for similar queries.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
