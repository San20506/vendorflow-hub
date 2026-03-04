import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Plus, Download, Search, Users, IndianRupee, Calendar, Clock, Fingerprint,
  Wifi, Smartphone, UserCheck, UserX, Scissors, Package, AlertTriangle, CheckCircle2
} from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  role: string;
  type: 'fixed' | 'piece_rate';
  phone: string;
  joinDate: string;
  status: 'active' | 'inactive';
  monthlySalary?: number;
  perPieceRate?: number;
  department: string;
  attendanceDays: number;
  totalWorkDays: number;
  piecesCompleted?: number;
  piecesTarget?: number;
}

interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: string;
  checkOut: string;
  method: 'fingerprint' | 'face' | 'manual';
  network: 'office_wifi' | 'mobile' | 'manual';
  hoursWorked: number;
  status: 'present' | 'half_day' | 'absent' | 'late';
}

interface TailorWork {
  id: string;
  employeeId: string;
  employeeName: string;
  productName: string;
  sku: string;
  received: number;
  completed: number;
  pending: number;
  ratePerPiece: number;
  totalEarned: number;
  date: string;
}

const mockEmployees: Employee[] = [
  { id: '1', name: 'Rajesh Kumar', role: 'Tailor - Senior', type: 'piece_rate', phone: '9876543210', joinDate: '2024-01-15', status: 'active', perPieceRate: 45, department: 'Stitching', attendanceDays: 24, totalWorkDays: 26, piecesCompleted: 320, piecesTarget: 400 },
  { id: '2', name: 'Sunita Devi', role: 'Tailor', type: 'piece_rate', phone: '9876543211', joinDate: '2024-03-10', status: 'active', perPieceRate: 35, department: 'Stitching', attendanceDays: 22, totalWorkDays: 26, piecesCompleted: 280, piecesTarget: 350 },
  { id: '3', name: 'Amit Sharma', role: 'Warehouse Mgr', type: 'fixed', phone: '9876543212', joinDate: '2023-11-01', status: 'active', monthlySalary: 25000, department: 'Warehouse', attendanceDays: 25, totalWorkDays: 26 },
  { id: '4', name: 'Priya Patel', role: 'Packing Staff', type: 'fixed', phone: '9876543213', joinDate: '2024-06-20', status: 'active', monthlySalary: 15000, department: 'Packing', attendanceDays: 20, totalWorkDays: 26 },
  { id: '5', name: 'Mohit Verma', role: 'Quality Check', type: 'fixed', phone: '9876543214', joinDate: '2024-08-01', status: 'inactive', monthlySalary: 18000, department: 'QC', attendanceDays: 0, totalWorkDays: 26 },
  { id: '6', name: 'Geeta Rani', role: 'Tailor - Helper', type: 'piece_rate', phone: '9876543215', joinDate: '2025-01-05', status: 'active', perPieceRate: 20, department: 'Stitching', attendanceDays: 23, totalWorkDays: 26, piecesCompleted: 450, piecesTarget: 500 },
];

const mockAttendance: AttendanceRecord[] = [
  { id: '1', employeeId: '1', employeeName: 'Rajesh Kumar', date: '2026-03-04', checkIn: '09:02', checkOut: '18:15', method: 'fingerprint', network: 'office_wifi', hoursWorked: 9.2, status: 'present' },
  { id: '2', employeeId: '2', employeeName: 'Sunita Devi', date: '2026-03-04', checkIn: '09:30', checkOut: '17:45', method: 'face', network: 'office_wifi', hoursWorked: 8.25, status: 'present' },
  { id: '3', employeeId: '3', employeeName: 'Amit Sharma', date: '2026-03-04', checkIn: '09:45', checkOut: '14:00', method: 'fingerprint', network: 'office_wifi', hoursWorked: 4.25, status: 'half_day' },
  { id: '4', employeeId: '4', employeeName: 'Priya Patel', date: '2026-03-04', checkIn: '10:15', checkOut: '18:30', method: 'face', network: 'mobile', hoursWorked: 8.25, status: 'late' },
  { id: '5', employeeId: '6', employeeName: 'Geeta Rani', date: '2026-03-04', checkIn: '08:55', checkOut: '18:00', method: 'fingerprint', network: 'office_wifi', hoursWorked: 9.08, status: 'present' },
];

const mockTailorWork: TailorWork[] = [
  { id: '1', employeeId: '1', employeeName: 'Rajesh Kumar', productName: 'Men\'s Kurta XL', sku: 'MK-XL-001', received: 50, completed: 42, pending: 8, ratePerPiece: 45, totalEarned: 1890, date: '2026-03-04' },
  { id: '2', employeeId: '1', employeeName: 'Rajesh Kumar', productName: 'Women\'s Top L', sku: 'WT-L-003', received: 30, completed: 30, pending: 0, ratePerPiece: 45, totalEarned: 1350, date: '2026-03-03' },
  { id: '3', employeeId: '2', employeeName: 'Sunita Devi', productName: 'Palazzo Set M', sku: 'PS-M-007', received: 40, completed: 28, pending: 12, ratePerPiece: 35, totalEarned: 980, date: '2026-03-04' },
  { id: '4', employeeId: '6', employeeName: 'Geeta Rani', productName: 'Kids Frock S', sku: 'KF-S-012', received: 80, completed: 65, pending: 15, ratePerPiece: 20, totalEarned: 1300, date: '2026-03-04' },
  { id: '5', employeeId: '6', employeeName: 'Geeta Rani', productName: 'Button Stitching', sku: 'BTN-MIX', received: 200, completed: 200, pending: 0, ratePerPiece: 5, totalEarned: 1000, date: '2026-03-03' },
];

const calcSalary = (emp: Employee) => {
  if (emp.type === 'fixed') {
    return Math.round((emp.monthlySalary || 0) * (emp.attendanceDays / emp.totalWorkDays));
  }
  return (emp.piecesCompleted || 0) * (emp.perPieceRate || 0);
};

export default function StaffManagement() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [salaryPeriod, setSalaryPeriod] = useState('monthly');
  const [networkOnly, setNetworkOnly] = useState(true);
  const [showAddEmployee, setShowAddEmployee] = useState(false);

  const activeCount = mockEmployees.filter(e => e.status === 'active').length;
  const totalSalary = mockEmployees.filter(e => e.status === 'active').reduce((s, e) => s + calcSalary(e), 0);
  const totalPiecesCompleted = mockTailorWork.reduce((s, t) => s + t.completed, 0);
  const totalPiecesPending = mockTailorWork.reduce((s, t) => s + t.pending, 0);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      present: 'bg-green-100 text-green-700',
      half_day: 'bg-amber-100 text-amber-700',
      absent: 'bg-red-100 text-red-700',
      late: 'bg-orange-100 text-orange-700',
    };
    return map[status] || '';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Staff & Salary Management</h1>
          <p className="text-muted-foreground">Employee tracking, attendance, piece-rate & salary calculation</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" />Export Payroll</Button>
          <Dialog open={showAddEmployee} onOpenChange={setShowAddEmployee}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-2" />Add Employee</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Add New Employee</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Full Name</Label><Input placeholder="Employee name" /></div>
                  <div><Label>Phone</Label><Input placeholder="Mobile number" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Role</Label><Input placeholder="e.g. Tailor, Packing" /></div>
                  <div><Label>Department</Label>
                    <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {['Stitching', 'Packing', 'Warehouse', 'QC', 'Admin'].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Salary Type</Label>
                    <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed Monthly</SelectItem>
                        <SelectItem value="piece_rate">Piece Rate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Amount (₹)</Label><Input type="number" placeholder="Salary or rate per piece" /></div>
                </div>
                <div><Label>Join Date</Label><Input type="date" /></div>
                <Button className="w-full" onClick={() => { setShowAddEmployee(false); toast({ title: 'Employee Added' }); }}>Save Employee</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><Users className="w-4 h-4 text-primary" /><span className="text-xs text-muted-foreground">Active Staff</span></div>
            <p className="text-2xl font-bold">{activeCount}</p>
            <p className="text-xs text-muted-foreground">of {mockEmployees.length} total</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><IndianRupee className="w-4 h-4 text-green-600" /><span className="text-xs text-muted-foreground">Payroll (Est.)</span></div>
            <p className="text-2xl font-bold">₹{totalSalary.toLocaleString('en-IN')}</p>
            <p className="text-xs text-muted-foreground capitalize">{salaryPeriod}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><CheckCircle2 className="w-4 h-4 text-blue-600" /><span className="text-xs text-muted-foreground">Pieces Done</span></div>
            <p className="text-2xl font-bold">{totalPiecesCompleted}</p>
            <p className="text-xs text-blue-600">This period</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-orange-600" /><span className="text-xs text-muted-foreground">Pending Work</span></div>
            <p className="text-2xl font-bold">{totalPiecesPending}</p>
            <p className="text-xs text-orange-600">Items in queue</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="employees">
        <TabsList>
          <TabsTrigger value="employees" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Employees</TabsTrigger>
          <TabsTrigger value="attendance" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Attendance</TabsTrigger>
          <TabsTrigger value="piece_work" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Piece Rate Tracking</TabsTrigger>
          <TabsTrigger value="salary" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Salary Calculator</TabsTrigger>
        </TabsList>

        {/* Employees Tab */}
        <TabsContent value="employees">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Employee Directory</CardTitle>
                <div className="relative"><Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" /><Input className="pl-8 w-[200px]" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} /></div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Rate / Salary</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockEmployees.filter(e => e.name.toLowerCase().includes(search.toLowerCase())).map(emp => (
                    <TableRow key={emp.id}>
                      <TableCell className="font-medium">{emp.name}</TableCell>
                      <TableCell>{emp.role}</TableCell>
                      <TableCell><Badge variant="outline">{emp.department}</Badge></TableCell>
                      <TableCell><Badge variant="secondary">{emp.type === 'fixed' ? 'Fixed' : 'Piece Rate'}</Badge></TableCell>
                      <TableCell className="font-semibold">{emp.type === 'fixed' ? `₹${emp.monthlySalary?.toLocaleString('en-IN')}/mo` : `₹${emp.perPieceRate}/pc`}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={(emp.attendanceDays / emp.totalWorkDays) * 100} className="w-16 h-2" />
                          <span className="text-xs">{emp.attendanceDays}/{emp.totalWorkDays}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge className={emp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>{emp.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Attendance Log</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Fingerprint & Face ID tracking via office network</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-muted-foreground" />
                    <Label className="text-xs">Office Network Only</Label>
                    <Switch checked={networkOnly} onCheckedChange={setNetworkOnly} />
                  </div>
                  <Select defaultValue="today">
                    <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                  <UserCheck className="w-5 h-5 text-green-600" />
                  <div><p className="text-xs text-muted-foreground">Present</p><p className="font-bold text-green-700">{mockAttendance.filter(a => a.status === 'present').length}</p></div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <div><p className="text-xs text-muted-foreground">Half Day</p><p className="font-bold text-amber-700">{mockAttendance.filter(a => a.status === 'half_day').length}</p></div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-50 border border-orange-200">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <div><p className="text-xs text-muted-foreground">Late</p><p className="font-bold text-orange-700">{mockAttendance.filter(a => a.status === 'late').length}</p></div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                  <UserX className="w-5 h-5 text-red-600" />
                  <div><p className="text-xs text-muted-foreground">Absent</p><p className="font-bold text-red-700">{mockEmployees.filter(e => e.status === 'active').length - mockAttendance.length}</p></div>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Network</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockAttendance.filter(a => !networkOnly || a.network === 'office_wifi').map(att => (
                    <TableRow key={att.id}>
                      <TableCell className="font-medium">{att.employeeName}</TableCell>
                      <TableCell className="text-sm">{att.date}</TableCell>
                      <TableCell className="text-sm font-mono">{att.checkIn}</TableCell>
                      <TableCell className="text-sm font-mono">{att.checkOut}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          {att.method === 'fingerprint' ? <Fingerprint className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
                          {att.method === 'fingerprint' ? 'Fingerprint' : 'Face ID'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={att.network === 'office_wifi' ? 'default' : 'secondary'} className="gap-1">
                          <Wifi className="w-3 h-3" />{att.network === 'office_wifi' ? 'Office' : 'Mobile'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">{att.hoursWorked}h</TableCell>
                      <TableCell><Badge className={statusBadge(att.status)}>{att.status.replace('_', ' ')}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Piece Rate Tab */}
        <TabsContent value="piece_work">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><Scissors className="w-5 h-5" />Tailor / Piece Work Tracker</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Product received → completed → pending tracking</p>
                </div>
                <Button size="sm"><Plus className="w-4 h-4 mr-2" />Log Work</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-center">Received</TableHead>
                    <TableHead className="text-center">Completed</TableHead>
                    <TableHead className="text-center">Pending</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Earned</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockTailorWork.map(work => (
                    <TableRow key={work.id}>
                      <TableCell className="font-medium">{work.employeeName}</TableCell>
                      <TableCell>{work.productName}</TableCell>
                      <TableCell><Badge variant="outline" className="font-mono text-xs">{work.sku}</Badge></TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1"><Package className="w-3 h-3 text-blue-500" />{work.received}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-green-600 font-semibold">{work.completed}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={work.pending > 0 ? 'text-orange-600 font-semibold' : 'text-muted-foreground'}>{work.pending}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={(work.completed / work.received) * 100} className="w-20 h-2" />
                          <span className="text-xs text-muted-foreground">{Math.round((work.completed / work.received) * 100)}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm">₹{work.ratePerPiece}/pc</TableCell>
                      <TableCell className="text-right font-bold text-green-700">₹{work.totalEarned.toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Salary Calculator */}
        <TabsContent value="salary">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Salary Calculation</CardTitle>
                <Select value={salaryPeriod} onValueChange={setSalaryPeriod}>
                  <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Base</TableHead>
                    <TableHead>Days / Pieces</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead className="text-right">Net Payable</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockEmployees.filter(e => e.status === 'active').map(emp => {
                    const gross = calcSalary(emp);
                    const deduction = emp.type === 'fixed' ? Math.round((emp.totalWorkDays - emp.attendanceDays) * ((emp.monthlySalary || 0) / emp.totalWorkDays)) : 0;
                    const net = gross;
                    const divisor = salaryPeriod === 'weekly' ? 4 : 1;
                    return (
                      <TableRow key={emp.id}>
                        <TableCell className="font-medium">{emp.name}</TableCell>
                        <TableCell><Badge variant="secondary">{emp.type === 'fixed' ? 'Fixed' : 'Piece'}</Badge></TableCell>
                        <TableCell className="text-sm">{emp.type === 'fixed' ? `₹${emp.monthlySalary?.toLocaleString('en-IN')}/mo` : `₹${emp.perPieceRate}/pc`}</TableCell>
                        <TableCell className="text-sm">{emp.type === 'fixed' ? `${emp.attendanceDays}/${emp.totalWorkDays} days` : `${emp.piecesCompleted} pieces`}</TableCell>
                        <TableCell className="text-sm text-red-600">{deduction > 0 ? `- ₹${deduction.toLocaleString('en-IN')}` : '—'}</TableCell>
                        <TableCell className="text-right font-bold text-lg">₹{Math.round(net / divisor).toLocaleString('en-IN')}</TableCell>
                        <TableCell><Badge className="bg-green-100 text-green-700">Calculated</Badge></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="mt-4 p-4 rounded-lg bg-muted/50 flex items-center justify-between">
                <span className="font-medium">Total Payroll ({salaryPeriod})</span>
                <span className="text-2xl font-bold text-primary">₹{Math.round(totalSalary / (salaryPeriod === 'weekly' ? 4 : 1)).toLocaleString('en-IN')}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}