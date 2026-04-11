import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { mockTasks, portalConfigs } from '@/services/mockData';
import { ListTodo, Plus, CheckCircle2, Clock, AlertCircle, Loader2, Eye, GripVertical, Calendar, User, Filter, History, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Task, TaskStatus, TaskPriority } from '@/types';

type KanbanStatus = 'pending' | 'in_progress' | 'under_review' | 'completed';

interface ActivityLog {
  id: string;
  taskId: string;
  action: string;
  from?: string;
  to?: string;
  timestamp: string;
  user: string;
}

interface KanbanTask extends Task {
  kanbanStatus: KanbanStatus;
}

const columns: { id: KanbanStatus; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'pending', label: 'To Do', icon: Clock, color: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
  { id: 'in_progress', label: 'In Progress', icon: Loader2, color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  { id: 'under_review', label: 'Under Review', icon: Eye, color: 'bg-purple-500/10 text-purple-600 border-purple-500/30' },
  { id: 'completed', label: 'Completed', icon: CheckCircle2, color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' },
];

const priorityBadge = (priority: string) => {
  const cls = priority === 'urgent' ? 'bg-rose-500/15 text-rose-600 border-rose-500/30'
    : priority === 'high' ? 'bg-amber-500/15 text-amber-600 border-amber-500/30'
    : priority === 'medium' ? 'bg-blue-500/15 text-blue-600 border-blue-500/30'
    : 'bg-muted text-muted-foreground';
  return <Badge variant="outline" className={`capitalize text-xs ${cls}`}>{priority}</Badge>;
};

const roleLabels: Record<string, string> = {
  'ops-001': 'Operations',
  'admin-001': 'Admin',
  'vendor-001': 'Vendor',
};

const assignees = [
  { id: 'ops-001', name: 'Operations' },
  { id: 'admin-001', name: 'Admin' },
  { id: 'vendor-001', name: 'Vendor' },
];

export default function Tasks() {
  const { toast } = useToast();

  const [tasks, setTasks] = useState<KanbanTask[]>(() =>
    mockTasks.map(t => ({
      ...t,
      kanbanStatus: t.status === 'escalated' ? 'pending' as KanbanStatus : t.status as KanbanStatus,
    }))
  );

  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);

  // New task form
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newAssignee, setNewAssignee] = useState('ops-001');
  const [newDueDate, setNewDueDate] = useState('');

  const addActivity = useCallback((taskId: string, action: string, from?: string, to?: string) => {
    setActivityLog(prev => [{
      id: `ACT-${Date.now()}`,
      taskId,
      action,
      from,
      to,
      timestamp: new Date().toISOString(),
      user: 'Admin',
    }, ...prev]);
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (filterAssignee !== 'all' && t.assignedTo !== filterAssignee) return false;
      if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
      if (filterStatus !== 'all' && t.kanbanStatus !== filterStatus) return false;
      return true;
    });
  }, [tasks, filterAssignee, filterPriority, filterStatus]);

  const analytics = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return {
      total: tasks.length,
      overdue: tasks.filter(t => new Date(t.dueDate) < now && t.kanbanStatus !== 'completed').length,
      completedToday: activityLog.filter(a => a.action === 'Status Changed' && a.to === 'Completed' && new Date(a.timestamp) >= todayStart).length,
      inProgress: tasks.filter(t => t.kanbanStatus === 'in_progress').length,
    };
  }, [tasks, activityLog]);

  const columnCounts = useMemo(() => {
    const counts: Record<KanbanStatus, number> = { pending: 0, in_progress: 0, under_review: 0, completed: 0 };
    filteredTasks.forEach(t => counts[t.kanbanStatus]++);
    return counts;
  }, [filteredTasks]);

  const handleDragStart = (taskId: string) => setDraggedTask(taskId);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = (targetStatus: KanbanStatus) => {
    if (!draggedTask) return;
    const task = tasks.find(t => t.taskId === draggedTask);
    if (!task || task.kanbanStatus === targetStatus) { setDraggedTask(null); return; }

    const fromLabel = columns.find(c => c.id === task.kanbanStatus)?.label || '';
    const toLabel = columns.find(c => c.id === targetStatus)?.label || '';

    setTasks(prev => prev.map(t =>
      t.taskId === draggedTask ? { ...t, kanbanStatus: targetStatus, status: targetStatus === 'under_review' ? 'in_progress' as TaskStatus : targetStatus as TaskStatus } : t
    ));

    addActivity(draggedTask, 'Status Changed', fromLabel, toLabel);

    toast({
      title: 'Task Moved',
      description: `"${task.title}" → ${toLabel}`,
    });
    setDraggedTask(null);
  };

  const createTask = () => {
    if (!newTitle.trim()) return;
    const id = `TASK-${String(tasks.length + 1).padStart(3, '0')}`;
    const newTask: KanbanTask = {
      taskId: id,
      title: newTitle,
      description: newDesc,
      assignedTo: newAssignee,
      status: 'pending',
      priority: newPriority,
      dueDate: newDueDate || new Date(Date.now() + 7 * 86400000).toISOString(),
      createdAt: new Date().toISOString(),
      kanbanStatus: 'pending',
    };
    setTasks(prev => [...prev, newTask]);
    addActivity(id, 'Task Created');
    toast({ title: 'Task Created', description: `"${newTitle}" added to To Do` });
    setNewTitle(''); setNewDesc(''); setNewPriority('medium'); setNewAssignee('ops-001'); setNewDueDate('');
    setShowCreateDialog(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Task Manager</h1>
          <p className="text-muted-foreground">Drag and drop tasks between columns to update status</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setShowActivityLog(!showActivityLog)}>
            <History className="w-4 h-4" />Activity Log
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" />New Task</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create New Task</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Title</Label><Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Task title..." /></div>
                <div><Label>Description</Label><Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Task description..." /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Priority</Label>
                    <Select value={newPriority} onValueChange={v => setNewPriority(v as TaskPriority)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Assign To</Label>
                    <Select value={newAssignee} onValueChange={setNewAssignee}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {assignees.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Due Date</Label><Input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} /></div>
                <Button className="w-full" onClick={createTask}>Create Task</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Analytics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><ListTodo className="w-5 h-5 text-primary" /></div><div><p className="text-2xl font-bold">{analytics.total}</p><p className="text-sm text-muted-foreground">Total Tasks</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-rose-500/10"><AlertTriangle className="w-5 h-5 text-rose-600" /></div><div><p className="text-2xl font-bold text-rose-600">{analytics.overdue}</p><p className="text-sm text-muted-foreground">Overdue</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-500/10"><Loader2 className="w-5 h-5 text-blue-600" /></div><div><p className="text-2xl font-bold">{analytics.inProgress}</p><p className="text-sm text-muted-foreground">In Progress</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-emerald-500/10"><CheckCircle2 className="w-5 h-5 text-emerald-600" /></div><div><p className="text-2xl font-bold">{analytics.completedToday}</p><p className="text-sm text-muted-foreground">Completed Today</p></div></div></CardContent></Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={filterAssignee} onValueChange={setFilterAssignee}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Assignee" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                {assignees.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {columns.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
            {(filterAssignee !== 'all' || filterPriority !== 'all' || filterStatus !== 'all') && (
              <Button variant="ghost" size="sm" onClick={() => { setFilterAssignee('all'); setFilterPriority('all'); setFilterStatus('all'); }}>Clear Filters</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Activity Log Panel */}
      {showActivityLog && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><History className="w-4 h-4" />Activity History</CardTitle>
          </CardHeader>
          <CardContent>
            {activityLog.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No activity recorded yet. Move tasks to see history.</p>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {activityLog.slice(0, 20).map(log => (
                  <div key={log.id} className="flex items-center gap-3 text-sm p-2 rounded-lg bg-muted/30">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{format(new Date(log.timestamp), 'HH:mm:ss')}</span>
                    <span className="font-mono text-xs">{log.taskId}</span>
                    <span>{log.action}</span>
                    {log.from && log.to && <span className="text-muted-foreground">{log.from} → <span className="text-foreground font-medium">{log.to}</span></span>}
                    <span className="ml-auto text-xs text-muted-foreground">{log.user}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map(col => {
          const Icon = col.icon;
          const colTasks = filteredTasks.filter(t => t.kanbanStatus === col.id);
          return (
            <div
              key={col.id}
              className="flex flex-col"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(col.id)}
            >
              <div className={`flex items-center gap-2 px-3 py-2.5 rounded-t-lg border border-b-0 ${col.color}`}>
                <Icon className="w-4 h-4" />
                <span className="font-semibold text-sm">{col.label}</span>
                <Badge variant="secondary" className="ml-auto text-xs">{colTasks.length}</Badge>
              </div>
              <div className="flex-1 min-h-[300px] bg-muted/20 border rounded-b-lg p-2 space-y-2">
                {colTasks.map(task => {
                  const portal = portalConfigs.find(p => p.id === task.portal);
                  const isOverdue = new Date(task.dueDate) < new Date() && task.kanbanStatus !== 'completed';
                  return (
                    <Card
                      key={task.taskId}
                      draggable
                      onDragStart={() => handleDragStart(task.taskId)}
                      className={`cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${
                        draggedTask === task.taskId ? 'opacity-50 scale-95' : ''
                      } ${isOverdue ? 'border-rose-500/30' : ''}`}
                    >
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex items-center gap-1.5">
                            <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                            <p className="text-sm font-medium leading-tight">{task.title}</p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 pl-5">{task.description}</p>
                        <div className="flex items-center gap-1.5 flex-wrap pl-5">
                          {priorityBadge(task.priority)}
                          {portal && <Badge variant="secondary" className="text-xs">{portal.icon} {portal.name}</Badge>}
                        </div>
                        <div className="flex items-center justify-between pl-5">
                          <Badge variant="secondary" className="text-xs">{roleLabels[task.assignedTo] || task.assignedTo}</Badge>
                          <span className={`text-xs ${isOverdue ? 'text-rose-600 font-medium' : 'text-muted-foreground'}`}>
                            {format(new Date(task.dueDate), 'dd MMM')}
                            {isOverdue && ' ⚠'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {colTasks.length === 0 && (
                  <div className="flex items-center justify-center h-24 text-xs text-muted-foreground/50 border-2 border-dashed rounded-lg">
                    Drop tasks here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
