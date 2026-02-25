import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Building2, Plus, FileText, CheckCircle2, Clock, XCircle, Upload, Eye,
  AlertCircle, Shield, Users, ClipboardList,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type OnboardingStatus = 'submitted' | 'under_review' | 'approved' | 'rejected';

interface OnboardingRequest {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  gstin: string;
  platforms: string[];
  status: OnboardingStatus;
  submittedAt: string;
  updatedAt: string;
  documents: { name: string; uploaded: boolean }[];
  adminNotes: string;
  auditLog: { action: string; by: string; time: string }[];
}

const daysAgo = (d: number) => { const dt = new Date(); dt.setDate(dt.getDate() - d); return dt.toISOString(); };

const mockRequests: OnboardingRequest[] = [
  {
    id: 'ONB-001', companyName: 'NovaTech Industries', contactPerson: 'Rajesh Gupta', email: 'rajesh@novatech.in', phone: '+91 98765 11111', gstin: '27AABCN1234M1Z5', platforms: ['Amazon', 'Flipkart'], status: 'submitted', submittedAt: daysAgo(0), updatedAt: daysAgo(0),
    documents: [{ name: 'GST Certificate', uploaded: true }, { name: 'PAN Card', uploaded: true }, { name: 'Bank Statement', uploaded: false }],
    adminNotes: '', auditLog: [{ action: 'Application submitted', by: 'Rajesh Gupta', time: daysAgo(0) }],
  },
  {
    id: 'ONB-002', companyName: 'EverGreen Foods', contactPerson: 'Sunita Devi', email: 'sunita@evergreen.com', phone: '+91 87654 22222', gstin: '29AADCE5678N1Z3', platforms: ['Meesho', 'Blinkit', 'Amazon'], status: 'under_review', submittedAt: daysAgo(3), updatedAt: daysAgo(1),
    documents: [{ name: 'GST Certificate', uploaded: true }, { name: 'PAN Card', uploaded: true }, { name: 'FSSAI License', uploaded: true }, { name: 'Bank Statement', uploaded: true }],
    adminNotes: 'FSSAI license validity check in progress', auditLog: [{ action: 'Application submitted', by: 'Sunita Devi', time: daysAgo(3) }, { action: 'Documents verified', by: 'Admin', time: daysAgo(2) }, { action: 'Under review — FSSAI check', by: 'Admin', time: daysAgo(1) }],
  },
  {
    id: 'ONB-003', companyName: 'BrightWave Electronics', contactPerson: 'Karan Malhotra', email: 'karan@brightwave.in', phone: '+91 76543 33333', gstin: '07AABCB9012P1Z7', platforms: ['Amazon', 'Flipkart', 'Own Website'], status: 'approved', submittedAt: daysAgo(10), updatedAt: daysAgo(5),
    documents: [{ name: 'GST Certificate', uploaded: true }, { name: 'PAN Card', uploaded: true }, { name: 'Bank Statement', uploaded: true }, { name: 'Brand Authorization', uploaded: true }],
    adminNotes: 'All documents verified. Onboarding complete.', auditLog: [{ action: 'Application submitted', by: 'Karan Malhotra', time: daysAgo(10) }, { action: 'Documents verified', by: 'Admin', time: daysAgo(8) }, { action: 'Background check passed', by: 'Admin', time: daysAgo(6) }, { action: 'Approved', by: 'Admin', time: daysAgo(5) }],
  },
  {
    id: 'ONB-004', companyName: 'UrbanStyle Clothing', contactPerson: 'Priya Kapoor', email: 'priya@urbanstyle.in', phone: '+91 65432 44444', gstin: '27AABC1234K1ZY', platforms: ['Meesho'], status: 'rejected', submittedAt: daysAgo(8), updatedAt: daysAgo(4),
    documents: [{ name: 'GST Certificate', uploaded: true }, { name: 'PAN Card', uploaded: false }, { name: 'Bank Statement', uploaded: false }],
    adminNotes: 'Incomplete documents. PAN and bank statement missing.', auditLog: [{ action: 'Application submitted', by: 'Priya Kapoor', time: daysAgo(8) }, { action: 'Documents incomplete', by: 'Admin', time: daysAgo(6) }, { action: 'Reminder sent', by: 'System', time: daysAgo(5) }, { action: 'Rejected — documents not provided', by: 'Admin', time: daysAgo(4) }],
  },
];

const statusConfig: Record<OnboardingStatus, { label: string; color: string; icon: React.ElementType }> = {
  submitted: { label: 'Submitted', color: 'bg-blue-500/15 text-blue-600 border-blue-500/30', icon: Clock },
  under_review: { label: 'Under Review', color: 'bg-amber-500/15 text-amber-600 border-amber-500/30', icon: Eye },
  approved: { label: 'Approved', color: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'bg-rose-500/15 text-rose-600 border-rose-500/30', icon: XCircle },
};

const allPlatforms = ['Amazon', 'Flipkart', 'Meesho', 'FirstCry', 'Blinkit', 'Own Website'];

export default function BusinessOnboarding() {
  const { toast } = useToast();
  const [requests, setRequests] = useState(mockRequests);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<OnboardingRequest | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  const stats = {
    total: requests.length,
    submitted: requests.filter(r => r.status === 'submitted').length,
    underReview: requests.filter(r => r.status === 'under_review').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  const handleAdminAction = (id: string, action: 'approved' | 'rejected') => {
    setRequests(prev => prev.map(r => r.id === id ? {
      ...r, status: action, updatedAt: new Date().toISOString(),
      auditLog: [...r.auditLog, { action: action === 'approved' ? 'Approved by admin' : 'Rejected by admin', by: 'Admin', time: new Date().toISOString() }],
    } : r));
    toast({ title: action === 'approved' ? 'Application Approved' : 'Application Rejected', description: `Onboarding request ${id} has been ${action}` });
    setSelectedRequest(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Business Onboarding</h1>
          <p className="text-muted-foreground">Manage business onboarding requests and approvals</p>
        </div>
        <Button className="gap-2" onClick={() => setShowNewRequest(true)}><Plus className="w-4 h-4" />New Request</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="pt-5 pb-4"><p className="text-xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total Requests</p></CardContent></Card>
        <Card><CardContent className="pt-5 pb-4"><p className="text-xl font-bold text-blue-600">{stats.submitted}</p><p className="text-xs text-muted-foreground">Submitted</p></CardContent></Card>
        <Card><CardContent className="pt-5 pb-4"><p className="text-xl font-bold text-amber-600">{stats.underReview}</p><p className="text-xs text-muted-foreground">Under Review</p></CardContent></Card>
        <Card><CardContent className="pt-5 pb-4"><p className="text-xl font-bold text-emerald-600">{stats.approved}</p><p className="text-xs text-muted-foreground">Approved</p></CardContent></Card>
        <Card><CardContent className="pt-5 pb-4"><p className="text-xl font-bold text-rose-600">{stats.rejected}</p><p className="text-xs text-muted-foreground">Rejected</p></CardContent></Card>
      </div>

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests" className="gap-1.5"><ClipboardList className="w-4 h-4" />All Requests</TabsTrigger>
          <TabsTrigger value="admin" className="gap-1.5"><Shield className="w-4 h-4" />Admin Panel</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">ID</TableHead>
                    <TableHead className="font-semibold">Company</TableHead>
                    <TableHead className="font-semibold">Contact</TableHead>
                    <TableHead className="font-semibold">Platforms</TableHead>
                    <TableHead className="font-semibold">Documents</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Submitted</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map(req => {
                    const st = statusConfig[req.status];
                    const docsComplete = req.documents.every(d => d.uploaded);
                    return (
                      <TableRow key={req.id}>
                        <TableCell className="font-mono text-sm">{req.id}</TableCell>
                        <TableCell><div><p className="font-medium">{req.companyName}</p><p className="text-xs text-muted-foreground">{req.gstin}</p></div></TableCell>
                        <TableCell><div><p className="text-sm">{req.contactPerson}</p><p className="text-xs text-muted-foreground">{req.email}</p></div></TableCell>
                        <TableCell><div className="flex flex-wrap gap-1">{req.platforms.map(p => <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>)}</div></TableCell>
                        <TableCell>
                          <Badge variant="outline" className={docsComplete ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-amber-500/10 text-amber-600 border-amber-500/30'}>
                            {req.documents.filter(d => d.uploaded).length}/{req.documents.length}
                          </Badge>
                        </TableCell>
                        <TableCell><Badge variant="outline" className={`gap-1 ${st.color}`}><st.icon className="w-3 h-3" />{st.label}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{format(new Date(req.submittedAt), 'dd MMM yyyy')}</TableCell>
                        <TableCell><Button variant="ghost" size="sm" onClick={() => setSelectedRequest(req)}><Eye className="w-4 h-4" /></Button></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Pending Approvals</CardTitle><CardDescription>Review and approve/reject onboarding requests</CardDescription></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {requests.filter(r => ['submitted', 'under_review'].includes(r.status)).map(req => (
                  <div key={req.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{req.companyName}</p>
                      <p className="text-sm text-muted-foreground">{req.contactPerson} • {req.platforms.join(', ')}</p>
                      <div className="flex gap-2 mt-2">
                        {req.documents.map(d => (
                          <Badge key={d.name} variant="outline" className={d.uploaded ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs' : 'bg-rose-500/10 text-rose-600 border-rose-500/30 text-xs'}>
                            {d.uploaded ? '✓' : '✗'} {d.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="text-rose-600" onClick={() => handleAdminAction(req.id, 'rejected')}>Reject</Button>
                      <Button size="sm" onClick={() => handleAdminAction(req.id, 'approved')}>Approve</Button>
                    </div>
                  </div>
                ))}
                {requests.filter(r => ['submitted', 'under_review'].includes(r.status)).length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No pending approvals</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={open => !open && setSelectedRequest(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedRequest?.companyName}</DialogTitle>
            <DialogDescription>{selectedRequest?.id}</DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground">Contact</p><p className="font-medium">{selectedRequest.contactPerson}</p></div>
                <div><p className="text-muted-foreground">Email</p><p className="font-medium">{selectedRequest.email}</p></div>
                <div><p className="text-muted-foreground">Phone</p><p className="font-medium">{selectedRequest.phone}</p></div>
                <div><p className="text-muted-foreground">GSTIN</p><p className="font-medium font-mono">{selectedRequest.gstin}</p></div>
              </div>
              <div>
                <p className="text-sm font-semibold mb-2">Documents</p>
                <div className="flex flex-wrap gap-2">
                  {selectedRequest.documents.map(d => (
                    <Badge key={d.name} variant="outline" className={d.uploaded ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-rose-500/10 text-rose-600 border-rose-500/30'}>
                      {d.uploaded ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}{d.name}
                    </Badge>
                  ))}
                </div>
              </div>
              {selectedRequest.adminNotes && (
                <div><p className="text-sm font-semibold">Admin Notes</p><p className="text-sm text-muted-foreground mt-1">{selectedRequest.adminNotes}</p></div>
              )}
              <div>
                <p className="text-sm font-semibold mb-3">Audit Trail</p>
                <div className="space-y-3">
                  {selectedRequest.auditLog.map((a, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${i === selectedRequest.auditLog.length - 1 ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                        {i < selectedRequest.auditLog.length - 1 && <div className="w-px flex-1 bg-muted-foreground/20" />}
                      </div>
                      <div className="pb-3">
                        <p className="text-sm">{a.action}</p>
                        <p className="text-xs text-muted-foreground">{a.by} • {format(new Date(a.time), 'dd MMM, HH:mm')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {['submitted', 'under_review'].includes(selectedRequest.status) && (
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1 text-rose-600" onClick={() => handleAdminAction(selectedRequest.id, 'rejected')}>Reject</Button>
                  <Button className="flex-1" onClick={() => handleAdminAction(selectedRequest.id, 'approved')}>Approve</Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Request Dialog */}
      <Dialog open={showNewRequest} onOpenChange={setShowNewRequest}>
        <DialogContent>
          <DialogHeader><DialogTitle>Submit Onboarding Request</DialogTitle><DialogDescription>Fill in business details to begin onboarding</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Company Name</Label><Input placeholder="Company name" /></div>
              <div className="space-y-2"><Label>Contact Person</Label><Input placeholder="Full name" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Email</Label><Input type="email" placeholder="email@company.com" /></div>
              <div className="space-y-2"><Label>Phone</Label><Input placeholder="+91" /></div>
            </div>
            <div className="space-y-2"><Label>GSTIN / Business ID</Label><Input placeholder="e.g., 27AABCN1234M1Z5" /></div>
            <div className="space-y-2">
              <Label>Marketplace Platforms</Label>
              <div className="flex flex-wrap gap-3">
                {allPlatforms.map(p => (
                  <label key={p} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={selectedPlatforms.includes(p)} onCheckedChange={c => setSelectedPlatforms(prev => c ? [...prev, p] : prev.filter(x => x !== p))} />
                    {p}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Upload Documents</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/30 transition-colors">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Click to upload GST Certificate, PAN, Bank Statement</p>
              </div>
            </div>
            <div className="space-y-2"><Label>Additional Notes</Label><Textarea placeholder="Any additional information..." rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewRequest(false)}>Cancel</Button>
            <Button onClick={() => { toast({ title: 'Request Submitted', description: 'Your onboarding request has been submitted for review' }); setShowNewRequest(false); }}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
