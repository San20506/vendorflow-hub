import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Image, Video, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { statusBadge } from './WhatsAppStatusBadge';
import { MessageLog } from './WhatsAppTypes';

const daysAgo = (d: number, h = 0) => { const dt = new Date(); dt.setDate(dt.getDate() - d); dt.setHours(dt.getHours() - h); return dt.toISOString(); };

const mockLogs: MessageLog[] = [];

export default function WhatsAppMessageLog() {
  const mediaIcon = (type?: string) => {
    if (type === 'image') return <Image className="w-3.5 h-3.5 text-blue-500" />;
    if (type === 'video') return <Video className="w-3.5 h-3.5 text-purple-500" />;
    if (type === 'document') return <FileText className="w-3.5 h-3.5 text-amber-500" />;
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Message Log</CardTitle>
        <CardDescription>Recent WhatsApp message activity</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Direction</TableHead>
              <TableHead className="font-semibold">Recipient</TableHead>
              <TableHead className="font-semibold">Template</TableHead>
              <TableHead className="font-semibold">Content</TableHead>
              <TableHead className="font-semibold">Media</TableHead>
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
                <TableCell>{mediaIcon(log.mediaType) || <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                <TableCell>{statusBadge(log.status)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{format(new Date(log.timestamp), 'dd MMM, HH:mm')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
