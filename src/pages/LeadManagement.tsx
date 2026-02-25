import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus, UserPlus, Users, Phone, Mail, Globe, TrendingUp, Clock, CheckCircle2,
  XCircle, AlertCircle, Search, Filter, Download, Eye, Edit, Building2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'negotiation' | 'won' | 'lost';
type LeadSource = 'indiamart' | 'justdial' | 'tradeindia' | 'website' | 'referral' | 'whatsapp' | 'social_media';
type LeadPriority = 'low' | 'medium' | 'high';

interface Lead {
  id: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  source: LeadSource;
  status: LeadStatus;
  priority: LeadPriority;
  assignedTo: string;
  value: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
  activities: { action: string; by: string; time: string }[];
}

const daysAgo = (d: number) => { const dt = new Date(); dt.setDate(dt.getDate() - d); return dt.toISOString(); };

const mockLeads: Lead[] = [
  { id: 'LEAD-001', companyName: 'FastTrack Retail Pvt Ltd', contactPerson: 'Vikram Patel', phone: '+91 98765 43210', email: 'vikram@fasttrack.in', source: 'indiamart', status: 'new', priority: 'high', assignedTo: '', value: 250000, notes: 'Interested in bulk electronics order', createdAt: daysAgo(0), updatedAt: daysAgo(0), activities: [{ action: 'Lead created from Indiamart inquiry', by: 'System', time: daysAgo(0) }] },
  { id: 'LEAD-002', companyName: 'GreenLeaf Organics', contactPerson: 'Meena Sharma', phone: '+91 87654 32109', email: 'meena@greenleaf.com', source: 'justdial', status: 'contacted', priority: 'medium', assignedTo: 'Rahul Singh', value: 180000, notes: 'Looking for organic product sourcing', createdAt: daysAgo(2), updatedAt: daysAgo(1), activities: [{ action: 'Lead created', by: 'System', time: daysAgo(2) }, { action: 'First call made, interested', by: 'Rahul Singh', time: daysAgo(1) }] },
  { id: 'LEAD-003', companyName: 'TechZone Solutions', contactPerson: 'Amit Kumar', phone: '+91 76543 21098', email: 'amit@techzone.in', source: 'website', status: 'qualified', priority: 'high', assignedTo: 'Priya Mehta', value: 450000, notes: 'Enterprise client, needs customized VMS', createdAt: daysAgo(5), updatedAt: daysAgo(1), activities: [{ action: 'Lead created from website form', by: 'System', time: daysAgo(5) }, { action: 'Demo scheduled', by: 'Priya Mehta', time: daysAgo(3) }, { action: 'Demo completed, positive feedback', by: 'Priya Mehta', time: daysAgo(1) }] },
  { id: 'LEAD-004', companyName: 'HomeStyle Decor', contactPerson: 'Sneha Reddy', phone: '+91 65432 10987', email: 'sneha@homestyle.in', source: 'tradeindia', status: 'negotiation', priority: 'high', assignedTo: 'Rahul Singh', value: 320000, notes: 'Price negotiation ongoing for home decor catalog', createdAt: daysAgo(10), updatedAt: daysAgo(0), activities: [{ action: 'Lead created', by: 'System', time: daysAgo(10) }, { action: 'Proposal sent', by: 'Rahul Singh', time: daysAgo(7) }, { action: 'Counter offer received', by: 'Rahul Singh', time: daysAgo(2) }, { action: 'Final pricing discussed', by: 'Rahul Singh', time: daysAgo(0) }] },
  { id: 'LEAD-005', companyName: 'QuickMart Online', contactPerson: 'Ravi Joshi', phone: '+91 54321 09876', email: 'ravi@quickmart.com', source: 'referral', status: 'won', priority: 'medium', assignedTo: 'Priya Mehta', value: 520000, notes: 'Contract signed for 1 year', createdAt: daysAgo(20), updatedAt: daysAgo(3), activities: [{ action: 'Lead created via referral', by: 'System', time: daysAgo(20) }, { action: 'Contract signed', by: 'Priya Mehta', time: daysAgo(3) }] },
  { id: 'LEAD-006', companyName: 'CityWear Fashion', contactPerson: 'Kavita Nair', phone: '+91 43210 98765', email: 'kavita@citywear.in', source: 'whatsapp', status: 'lost', priority: 'low', assignedTo: 'Rahul Singh', value: 95000, notes: 'Went with competitor', createdAt: daysAgo(15), updatedAt: daysAgo(5), activities: [{ action: 'Lead from WhatsApp inquiry', by: 'System', time: daysAgo(15) }, { action: 'Lost to competitor on pricing', by: 'Rahul Singh', time: daysAgo(5) }] },
  { id: 'LEAD-007', companyName: 'BabyBliss Store', contactPerson: 'Nandini Gupta', phone: '+91 32109 87654', email: 'nandini@babybliss.in', source: 'social_media', status: 'contacted', priority: 'medium', assignedTo: '', value: 150000, notes: 'Inquired via Instagram about baby products', createdAt: daysAgo(1), updatedAt: daysAgo(0), activities: [{ action: 'Lead from Instagram DM', by: 'System', time: daysAgo(1) }, { action: 'Introductory message sent', by: 'System', time: daysAgo(0) }] },
];

const executives = ['Rahul Singh', 'Priya Mehta', 'Arjun Kapoor', 'Neha Verma'];

const sourceConfig: Record<LeadSource, { label: string; icon: string; color: string }> = {
  indiamart: { label: 'IndiaMART', icon: '🏭', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  justdial: { label: 'JustDial', icon: '📞', color: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
  tradeindia: { label: 'TradeIndia', icon: '🌐', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' },
  website: { label: 'Website', icon: '💻', color: 'bg-violet-500/10 text-violet-600 border-violet-500/30' },
  referral: { label: 'Referral', icon: '🤝', color: 'bg-pink-500/10 text-pink-600 border-pink-500/30' },
  whatsapp: { label: 'WhatsApp', icon: '💬', color: 'bg-green-500/10 text-green-600 border-green-500/30' },
  social_media: { label: 'Social Media', icon: '📱', color: 'bg-purple-500/10 text-purple-600 border-purple-500/30' },
};

const statusConfig: Record<LeadStatus, { label: string; color: string; icon: React.ElementType }> = {
  new: { label: 'New', color: 'bg-blue-500/15 text-blue-600 border-blue-500/30', icon: AlertCircle },
  contacted: { label: 'Contacted', color: 'bg-amber-500/15 text-amber-600 border-amber-500/30', icon: Phone },
  qualified: { label: 'Qualified', color: 'bg-violet-500/15 text-violet-600 border-violet-500/30', icon: CheckCircle2 },
  negotiation: { label: 'Negotiation', color: 'bg-orange-500/15 text-orange-600 border-orange-500/30', icon: TrendingUp },
  won: { label: 'Won', color: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30', icon: CheckCircle2 },
  lost: { label: 'Lost', color: 'bg-rose-500/15 text-rose-600 border-rose-500/30', icon: XCircle },
};

const fmt = (n: number) => '₹' + n.toLocaleString('en-IN');

export default function LeadManagement() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showNewLead, setShowNewLead] = useState(false);
  const [assignDialog, setAssignDialog] = useState<Lead | null>(null);

  const filtered = useMemo(() => mockLeads.filter(l => {
    const matchSearch = l.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.contactPerson.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || l.status === statusFilter;
    const matchSource = sourceFilter === 'all' || l.source === sourceFilter;
    return matchSearch && matchStatus && matchSource;
  }), [searchQuery, statusFilter, sourceFilter]);

  const stats = useMemo(() => ({
    total: mockLeads.length,
    new: mockLeads.filter(l => l.status === 'new').length,
    active: mockLeads.filter(l => ['contacted', 'qualified', 'negotiation'].includes(l.status)).length,
    won: mockLeads.filter(l => l.status === 'won').length,
    lost: mockLeads.filter(l => l.status === 'lost').length,
    totalValue: mockLeads.filter(l => l.status !== 'lost').reduce((s, l) => s + l.value, 0),
    unassigned: mockLeads.filter(l => !l.assignedTo).length,
  }), []);

  const pipelineData = useMemo(() => {
    const stages: LeadStatus[] = ['new', 'contacted', 'qualified', 'negotiation', 'won', 'lost'];
    return stages.map(s => ({
      status: s,
      ...statusConfig[s],
      count: mockLeads.filter(l => l.status === s).length,
      value: mockLeads.filter(l => l.status === s).reduce((sum, l) => sum + l.value, 0),
    }));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lead Management</h1>
          <p className="text-muted-foreground">Track and manage business leads from all sources</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => toast({ title: 'Exported', description: 'Leads exported to Excel' })}>
            <Download className="w-4 h-4" />Export
          </Button>
          <Button className="gap-2" onClick={() => setShowNewLead(true)}>
            <Plus className="w-4 h-4" />Add Lead
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card><CardContent className="pt-5 pb-4"><p className="text-xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total Leads</p></CardContent></Card>
        <Card><CardContent className="pt-5 pb-4"><p className="text-xl font-bold text-blue-600">{stats.new}</p><p className="text-xs text-muted-foreground">New</p></CardContent></Card>
        <Card><CardContent className="pt-5 pb-4"><p className="text-xl font-bold text-amber-600">{stats.active}</p><p className="text-xs text-muted-foreground">Active Pipeline</p></CardContent></Card>
        <Card><CardContent className="pt-5 pb-4"><p className="text-xl font-bold text-emerald-600">{stats.won}</p><p className="text-xs text-muted-foreground">Won</p></CardContent></Card>
        <Card><CardContent className="pt-5 pb-4"><p className="text-xl font-bold text-rose-600">{stats.lost}</p><p className="text-xs text-muted-foreground">Lost</p></CardContent></Card>
        <Card><CardContent className="pt-5 pb-4"><p className="text-xl font-bold">{fmt(stats.totalValue)}</p><p className="text-xs text-muted-foreground">Pipeline Value</p></CardContent></Card>
        <Card><CardContent className="pt-5 pb-4"><p className="text-xl font-bold text-orange-600">{stats.unassigned}</p><p className="text-xs text-muted-foreground">Unassigned</p></CardContent></Card>
      </div>

      {/* Pipeline Visual */}
      <Card>
        <CardHeader><CardTitle>Sales Pipeline</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {pipelineData.map(stage => (
              <div key={stage.status} className="text-center p-3 rounded-lg bg-muted/30 border">
                <Badge variant="outline" className={stage.color}>{stage.label}</Badge>
                <p className="text-2xl font-bold mt-2">{stage.count}</p>
                <p className="text-xs text-muted-foreground">{fmt(stage.value)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters + Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search leads..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Source" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {Object.entries(sourceConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.icon} {v.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Lead</TableHead>
                <TableHead className="font-semibold">Contact</TableHead>
                <TableHead className="font-semibold">Source</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Priority</TableHead>
                <TableHead className="font-semibold">Assigned To</TableHead>
                <TableHead className="font-semibold text-right">Value</TableHead>
                <TableHead className="font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(lead => {
                const src = sourceConfig[lead.source];
                const st = statusConfig[lead.status];
                return (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div><p className="font-medium">{lead.companyName}</p><p className="text-xs text-muted-foreground font-mono">{lead.id}</p></div>
                    </TableCell>
                    <TableCell>
                      <div><p className="text-sm">{lead.contactPerson}</p><p className="text-xs text-muted-foreground">{lead.phone}</p></div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className={src.color}>{src.icon} {src.label}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className={st.color}><st.icon className="w-3 h-3 mr-1" />{st.label}</Badge></TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        lead.priority === 'high' ? 'bg-rose-500/10 text-rose-600 border-rose-500/30' :
                        lead.priority === 'medium' ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' :
                        'bg-muted text-muted-foreground'
                      }>{lead.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      {lead.assignedTo ? (
                        <span className="text-sm">{lead.assignedTo}</span>
                      ) : (
                        <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => setAssignDialog(lead)}>
                          <UserPlus className="w-3 h-3" />Assign
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold">{fmt(lead.value)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedLead(lead)}><Eye className="w-4 h-4" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Lead Detail Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={open => !open && setSelectedLead(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedLead?.companyName}</DialogTitle>
            <DialogDescription>{selectedLead?.id} • {sourceConfig[selectedLead?.source || 'website'].label}</DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground">Contact</p><p className="font-medium">{selectedLead.contactPerson}</p></div>
                <div><p className="text-muted-foreground">Phone</p><p className="font-medium">{selectedLead.phone}</p></div>
                <div><p className="text-muted-foreground">Email</p><p className="font-medium">{selectedLead.email}</p></div>
                <div><p className="text-muted-foreground">Value</p><p className="font-medium">{fmt(selectedLead.value)}</p></div>
                <div><p className="text-muted-foreground">Assigned To</p><p className="font-medium">{selectedLead.assignedTo || 'Unassigned'}</p></div>
                <div><p className="text-muted-foreground">Created</p><p className="font-medium">{format(new Date(selectedLead.createdAt), 'dd MMM yyyy')}</p></div>
              </div>
              <div><p className="text-muted-foreground text-sm">Notes</p><p className="text-sm mt-1">{selectedLead.notes}</p></div>
              <div>
                <h4 className="text-sm font-semibold mb-3">Activity Timeline</h4>
                <div className="space-y-3">
                  {selectedLead.activities.map((a, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${i === 0 ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                        {i < selectedLead.activities.length - 1 && <div className="w-px flex-1 bg-muted-foreground/20" />}
                      </div>
                      <div className="pb-3">
                        <p className="text-sm">{a.action}</p>
                        <p className="text-xs text-muted-foreground">{a.by} • {format(new Date(a.time), 'dd MMM, HH:mm')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={!!assignDialog} onOpenChange={open => !open && setAssignDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Lead</DialogTitle><DialogDescription>Assign {assignDialog?.companyName} to an executive</DialogDescription></DialogHeader>
          <div className="space-y-3 py-4">
            {executives.map(exec => (
              <Button key={exec} variant="outline" className="w-full justify-start gap-2" onClick={() => {
                toast({ title: 'Lead Assigned', description: `${assignDialog?.companyName} assigned to ${exec}` });
                setAssignDialog(null);
              }}>
                <Users className="w-4 h-4" />{exec}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* New Lead Dialog */}
      <Dialog open={showNewLead} onOpenChange={setShowNewLead}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Lead</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Company Name</Label><Input placeholder="Company name" /></div>
              <div className="space-y-2"><Label>Contact Person</Label><Input placeholder="Full name" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Phone</Label><Input placeholder="+91" /></div>
              <div className="space-y-2"><Label>Email</Label><Input placeholder="email@company.com" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Source</Label>
                <Select><SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                  <SelectContent>{Object.entries(sourceConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.icon} {v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select><SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Estimated Value (₹)</Label><Input type="number" placeholder="0" /></div>
            <div className="space-y-2"><Label>Notes</Label><Textarea placeholder="Additional details..." rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewLead(false)}>Cancel</Button>
            <Button onClick={() => { toast({ title: 'Lead Created', description: 'New lead added successfully' }); setShowNewLead(false); }}>Create Lead</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
