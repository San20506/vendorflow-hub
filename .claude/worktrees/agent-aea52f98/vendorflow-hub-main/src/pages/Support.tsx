import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, MessageSquare, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type TicketStatus = 'open' | 'in_progress' | 'resolved';
type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

interface Ticket {
  ticketId: string;
  subject: string;
  issueType: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  description: string;
  timeline: { status: string; timestamp: string; note: string }[];
}

const daysAgo = (d: number) => { const dt = new Date(); dt.setDate(dt.getDate() - d); return dt.toISOString(); };

const mockTickets: Ticket[] = [
  {
    ticketId: 'TKT-2026-001', subject: 'Settlement delayed for Amazon orders', issueType: 'Payment Issue',
    priority: 'high', status: 'open', createdAt: daysAgo(0), updatedAt: daysAgo(0),
    description: 'Amazon settlement for January cycle has not been received yet.',
    timeline: [
      { status: 'Created', timestamp: daysAgo(0), note: 'Ticket raised by vendor' },
    ],
  },
  {
    ticketId: 'TKT-2026-002', subject: 'Product listing not appearing on Flipkart', issueType: 'Listing Issue',
    priority: 'medium', status: 'in_progress', createdAt: daysAgo(2), updatedAt: daysAgo(1),
    description: 'SKU-FLK-003 has been inactive for 3 days despite stock availability.',
    timeline: [
      { status: 'Created', timestamp: daysAgo(2), note: 'Ticket raised by operations' },
      { status: 'Assigned', timestamp: daysAgo(2), note: 'Assigned to marketplace team' },
      { status: 'In Progress', timestamp: daysAgo(1), note: 'Investigating with Flipkart support' },
    ],
  },
  {
    ticketId: 'TKT-2026-003', subject: 'Incorrect inventory count at Mumbai FC', issueType: 'Inventory Issue',
    priority: 'urgent', status: 'in_progress', createdAt: daysAgo(1), updatedAt: daysAgo(0),
    description: 'Physical count does not match system count for 12 SKUs.',
    timeline: [
      { status: 'Created', timestamp: daysAgo(1), note: 'Discrepancy reported by warehouse' },
      { status: 'Escalated', timestamp: daysAgo(0), note: 'Escalated to warehouse manager' },
    ],
  },
  {
    ticketId: 'TKT-2026-004', subject: 'Return claim rejected incorrectly', issueType: 'Returns Issue',
    priority: 'medium', status: 'resolved', createdAt: daysAgo(5), updatedAt: daysAgo(1),
    description: 'Return RET-2024-003 was marked ineligible but product was damaged in transit.',
    timeline: [
      { status: 'Created', timestamp: daysAgo(5), note: 'Ticket raised by vendor' },
      { status: 'In Progress', timestamp: daysAgo(4), note: 'Reviewing claim evidence' },
      { status: 'Resolved', timestamp: daysAgo(1), note: 'Claim approved after review. Refund processed.' },
    ],
  },
  {
    ticketId: 'TKT-2026-005', subject: 'Bulk upload failing for CSV format', issueType: 'Technical Issue',
    priority: 'low', status: 'resolved', createdAt: daysAgo(7), updatedAt: daysAgo(3),
    description: 'CSV files with UTF-8 encoding are failing during upload.',
    timeline: [
      { status: 'Created', timestamp: daysAgo(7), note: 'Bug reported' },
      { status: 'Resolved', timestamp: daysAgo(3), note: 'Fixed in v1.0.2 update' },
    ],
  },
];

const statusBadge = (status: TicketStatus) => {
  switch (status) {
    case 'open': return <Badge variant="outline" className="bg-blue-500/15 text-blue-600 border-blue-500/30 gap-1"><AlertCircle className="w-3 h-3" />Open</Badge>;
    case 'in_progress': return <Badge variant="outline" className="bg-amber-500/15 text-amber-600 border-amber-500/30 gap-1"><Loader2 className="w-3 h-3" />In Progress</Badge>;
    case 'resolved': return <Badge variant="outline" className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 gap-1"><CheckCircle2 className="w-3 h-3" />Resolved</Badge>;
  }
};

const priorityBadge = (priority: TicketPriority) => {
  const cls = priority === 'urgent' ? 'bg-rose-500/15 text-rose-600 border-rose-500/30'
    : priority === 'high' ? 'bg-amber-500/15 text-amber-600 border-amber-500/30'
    : priority === 'medium' ? 'bg-blue-500/15 text-blue-600 border-blue-500/30'
    : 'bg-muted text-muted-foreground';
  return <Badge variant="outline" className={`capitalize ${cls}`}>{priority}</Badge>;
};

export default function Support() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const openCount = mockTickets.filter(t => t.status === 'open').length;
  const inProgressCount = mockTickets.filter(t => t.status === 'in_progress').length;
  const resolvedCount = mockTickets.filter(t => t.status === 'resolved').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Support Center</h1>
          <p className="text-muted-foreground">Raise and track support tickets</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />New Ticket</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Raise Support Ticket</DialogTitle>
              <DialogDescription>Describe your issue and we'll get back to you shortly</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2"><Label>Subject</Label><Input placeholder="Brief description of the issue" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Issue Type</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="payment">Payment Issue</SelectItem>
                      <SelectItem value="listing">Listing Issue</SelectItem>
                      <SelectItem value="inventory">Inventory Issue</SelectItem>
                      <SelectItem value="returns">Returns Issue</SelectItem>
                      <SelectItem value="technical">Technical Issue</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2"><Label>Description</Label><Textarea placeholder="Provide details about your issue..." rows={4} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button onClick={() => { toast({ title: 'Ticket Created', description: 'Your support ticket has been submitted.' }); setIsOpen(false); }}>Submit Ticket</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><MessageSquare className="w-5 h-5 text-primary" /></div><div><p className="text-2xl font-bold">{mockTickets.length}</p><p className="text-sm text-muted-foreground">Total Tickets</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-500/10"><AlertCircle className="w-5 h-5 text-blue-600" /></div><div><p className="text-2xl font-bold">{openCount}</p><p className="text-sm text-muted-foreground">Open</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-amber-500/10"><Clock className="w-5 h-5 text-amber-600" /></div><div><p className="text-2xl font-bold">{inProgressCount}</p><p className="text-sm text-muted-foreground">In Progress</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-emerald-500/10"><CheckCircle2 className="w-5 h-5 text-emerald-600" /></div><div><p className="text-2xl font-bold">{resolvedCount}</p><p className="text-sm text-muted-foreground">Resolved</p></div></div></CardContent></Card>
      </div>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Support Tickets</CardTitle>
          <CardDescription>All support tickets and their current status</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Ticket ID</TableHead>
                <TableHead className="font-semibold">Subject</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Priority</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Created</TableHead>
                <TableHead className="font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTickets.map(ticket => (
                <TableRow key={ticket.ticketId}>
                  <TableCell className="font-mono text-sm">{ticket.ticketId}</TableCell>
                  <TableCell className="font-medium max-w-[250px] truncate">{ticket.subject}</TableCell>
                  <TableCell><Badge variant="secondary" className="text-xs">{ticket.issueType}</Badge></TableCell>
                  <TableCell>{priorityBadge(ticket.priority)}</TableCell>
                  <TableCell>{statusBadge(ticket.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{format(new Date(ticket.createdAt), 'dd MMM yyyy')}</TableCell>
                  <TableCell>
                    <Dialog open={selectedTicket?.ticketId === ticket.ticketId} onOpenChange={open => !open && setSelectedTicket(null)}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(ticket)}>View</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{ticket.subject}</DialogTitle>
                          <DialogDescription>{ticket.ticketId} • {ticket.issueType}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="flex gap-2">{priorityBadge(ticket.priority)}{statusBadge(ticket.status)}</div>
                          <p className="text-sm text-muted-foreground">{ticket.description}</p>
                          <div>
                            <h4 className="text-sm font-semibold mb-3">Response Timeline</h4>
                            <div className="space-y-3">
                              {ticket.timeline.map((t, i) => (
                                <div key={i} className="flex gap-3">
                                  <div className="flex flex-col items-center">
                                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${i === ticket.timeline.length - 1 ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                                    {i < ticket.timeline.length - 1 && <div className="w-px h-full bg-muted-foreground/20" />}
                                  </div>
                                  <div className="pb-3">
                                    <p className="text-sm font-medium">{t.status}</p>
                                    <p className="text-xs text-muted-foreground">{t.note}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(t.timestamp), 'dd MMM yyyy, HH:mm')}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
