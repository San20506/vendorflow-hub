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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Plus, Download, Search, Filter, IndianRupee, TrendingUp, TrendingDown,
  Building2, Warehouse, Coffee, Bus, Pencil, Receipt, Calendar, Trash2
} from 'lucide-react';

const expenseCategories = [
  { id: 'office_misc', label: 'Office Miscellaneous', icon: Building2, color: 'bg-blue-100 text-blue-700' },
  { id: 'warehouse_misc', label: 'Warehouse Miscellaneous', icon: Warehouse, color: 'bg-orange-100 text-orange-700' },
  { id: 'daily', label: 'Day to Day Expense', icon: Receipt, color: 'bg-green-100 text-green-700' },
  { id: 'food', label: 'Lunch, Tea & Coffee', icon: Coffee, color: 'bg-amber-100 text-amber-700' },
  { id: 'stationery', label: 'Stationery', icon: Pencil, color: 'bg-purple-100 text-purple-700' },
  { id: 'transport', label: 'Transport', icon: Bus, color: 'bg-cyan-100 text-cyan-700' },
  { id: 'tips_wages', label: 'Tips & Wages', icon: IndianRupee, color: 'bg-pink-100 text-pink-700' },
];

interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  paidBy: string;
  paymentMode: string;
  receipt: boolean;
}

const mockExpenses: Expense[] = [
  { id: '1', date: '2026-03-04', category: 'office_misc', description: 'Printer ink cartridge', amount: 1200, paidBy: 'Ravi', paymentMode: 'UPI', receipt: true },
  { id: '2', date: '2026-03-04', category: 'food', description: 'Team lunch', amount: 2500, paidBy: 'Priya', paymentMode: 'Cash', receipt: true },
  { id: '3', date: '2026-03-03', category: 'transport', description: 'Courier delivery charges', amount: 450, paidBy: 'Amit', paymentMode: 'UPI', receipt: false },
  { id: '4', date: '2026-03-03', category: 'stationery', description: 'A4 paper & pens', amount: 800, paidBy: 'Ravi', paymentMode: 'Cash', receipt: true },
  { id: '5', date: '2026-03-02', category: 'warehouse_misc', description: 'Packing tape & bubble wrap', amount: 1500, paidBy: 'Sunil', paymentMode: 'Card', receipt: true },
  { id: '6', date: '2026-03-02', category: 'tips_wages', description: 'Daily helper wages', amount: 600, paidBy: 'Priya', paymentMode: 'Cash', receipt: false },
  { id: '7', date: '2026-03-01', category: 'daily', description: 'Electricity bill (office)', amount: 3200, paidBy: 'Ravi', paymentMode: 'Online', receipt: true },
  { id: '8', date: '2026-03-01', category: 'food', description: 'Tea & snacks for guests', amount: 350, paidBy: 'Amit', paymentMode: 'Cash', receipt: false },
];

export default function ExpenseTracking() {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('this_month');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: '', description: '', amount: '', paidBy: '', paymentMode: 'Cash', receipt: false
  });

  const filteredExpenses = expenses.filter(e => {
    const matchSearch = e.description.toLowerCase().includes(search.toLowerCase()) || e.paidBy.toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === 'all' || e.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const totalExpense = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const categoryTotals = expenseCategories.map(cat => ({
    ...cat,
    total: expenses.filter(e => e.category === cat.id).reduce((s, e) => s + e.amount, 0),
    count: expenses.filter(e => e.category === cat.id).length,
  }));

  const handleAddExpense = () => {
    if (!newExpense.category || !newExpense.description || !newExpense.amount) return;
    const expense: Expense = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      category: newExpense.category,
      description: newExpense.description,
      amount: parseFloat(newExpense.amount),
      paidBy: newExpense.paidBy || 'Self',
      paymentMode: newExpense.paymentMode,
      receipt: newExpense.receipt,
    };
    setExpenses([expense, ...expenses]);
    setShowAddDialog(false);
    setNewExpense({ category: '', description: '', amount: '', paidBy: '', paymentMode: 'Cash', receipt: false });
    toast({ title: 'Expense Added', description: `₹${expense.amount} recorded under ${expenseCategories.find(c => c.id === expense.category)?.label}` });
  };

  const getCategoryInfo = (id: string) => expenseCategories.find(c => c.id === id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Expense Tracking</h1>
          <p className="text-muted-foreground">Track office, warehouse & daily business expenses</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" />Export</Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-2" />Add Expense</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Record New Expense</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Category</Label>
                  <Select value={newExpense.category} onValueChange={v => setNewExpense({ ...newExpense, category: v })}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {expenseCategories.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={newExpense.description} onChange={e => setNewExpense({ ...newExpense, description: e.target.value })} placeholder="What was this expense for?" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Amount (₹)</Label>
                    <Input type="number" value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })} placeholder="0" />
                  </div>
                  <div>
                    <Label>Paid By</Label>
                    <Input value={newExpense.paidBy} onChange={e => setNewExpense({ ...newExpense, paidBy: e.target.value })} placeholder="Name" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Payment Mode</Label>
                    <Select value={newExpense.paymentMode} onValueChange={v => setNewExpense({ ...newExpense, paymentMode: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['Cash', 'UPI', 'Card', 'Online', 'Wallet'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={newExpense.receipt} onChange={e => setNewExpense({ ...newExpense, receipt: e.target.checked })} className="rounded" />
                      <span className="text-sm">Receipt attached</span>
                    </label>
                  </div>
                </div>
                <Button className="w-full" onClick={handleAddExpense}>Save Expense</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <IndianRupee className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total Expenses</span>
            </div>
            <p className="text-2xl font-bold">₹{totalExpense.toLocaleString('en-IN')}</p>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-green-600" />
              <span className="text-xs text-muted-foreground">Avg Daily</span>
            </div>
            <p className="text-2xl font-bold">₹{Math.round(totalExpense / 30).toLocaleString('en-IN')}</p>
            <p className="text-xs text-green-600 mt-1">↓ 8% vs last month</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Receipt className="w-4 h-4 text-orange-600" />
              <span className="text-xs text-muted-foreground">Entries</span>
            </div>
            <p className="text-2xl font-bold">{expenses.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Transactions</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-red-600" />
              <span className="text-xs text-muted-foreground">Top Category</span>
            </div>
            <p className="text-lg font-bold">{categoryTotals.sort((a, b) => b.total - a.total)[0]?.label.split(' ')[0]}</p>
            <p className="text-xs text-red-600 mt-1">₹{categoryTotals.sort((a, b) => b.total - a.total)[0]?.total.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {categoryTotals.map(cat => (
          <Card key={cat.id} className={`cursor-pointer transition-all hover:shadow-md ${filterCategory === cat.id ? 'ring-2 ring-primary' : ''}`} onClick={() => setFilterCategory(filterCategory === cat.id ? 'all' : cat.id)}>
            <CardContent className="p-3 text-center">
              <div className={`w-8 h-8 rounded-lg ${cat.color} flex items-center justify-center mx-auto mb-2`}>
                <cat.icon className="w-4 h-4" />
              </div>
              <p className="text-xs font-medium truncate">{cat.label.split(' ')[0]}</p>
              <p className="text-sm font-bold mt-1">₹{cat.total.toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-muted-foreground">{cat.count} entries</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-lg">Expense Records</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input className="pl-8 w-[200px]" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                <SelectTrigger className="w-[140px]"><Calendar className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="this_week">This Week</SelectItem>
                  <SelectItem value="this_month">This Month</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Paid By</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Receipt</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.map(expense => {
                const cat = getCategoryInfo(expense.category);
                return (
                  <TableRow key={expense.id}>
                    <TableCell className="text-sm">{expense.date}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cat?.color}>{cat?.label.split(' ')[0]}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{expense.description}</TableCell>
                    <TableCell className="text-sm">{expense.paidBy}</TableCell>
                    <TableCell><Badge variant="secondary">{expense.paymentMode}</Badge></TableCell>
                    <TableCell className="text-right font-semibold">₹{expense.amount.toLocaleString('en-IN')}</TableCell>
                    <TableCell>{expense.receipt ? <Badge variant="outline" className="text-green-600 border-green-300">Yes</Badge> : <span className="text-muted-foreground text-xs">No</span>}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setExpenses(expenses.filter(e => e.id !== expense.id)); toast({ title: 'Removed' }); }}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {filteredExpenses.length === 0 && <p className="text-center text-muted-foreground py-8">No expenses found</p>}
        </CardContent>
      </Card>
    </div>
  );
}