import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Image, Video, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { statusBadge } from './WhatsAppStatusBadge';
import { MessageLog } from './WhatsAppTypes';

const daysAgo = (d: number, h = 0) => { const dt = new Date(); dt.setDate(dt.getDate() - d); dt.setHours(dt.getHours() - h); return dt.toISOString(); };

const mockLogs: MessageLog[] = [
  { id: 'LOG-001', recipient: '+91 98765 43210', recipientName: 'Vikram Patel', template: 'order_confirmation', status: 'read', timestamp: daysAgo(0, 1), direction: 'outbound', content: 'Your order ORD-2026-045 has been confirmed.' },
  { id: 'LOG-002', recipient: '+91 87654 32109', recipientName: 'Meena Sharma', template: 'shipping_update', status: 'delivered', timestamp: daysAgo(0, 2), direction: 'outbound', content: 'Your order has been shipped via BlueDart.', mediaType: 'image' },
  { id: 'LOG-003', recipient: '+91 76543 21098', recipientName: 'Amit Kumar', template: 'payment_reminder', status: 'sent', timestamp: daysAgo(0, 3), direction: 'outbound', content: 'Payment of ₹12,500 is pending.' },
  { id: 'LOG-004', recipient: '+91 65432 10987', recipientName: 'Sneha Reddy', template: '-', status: 'read', timestamp: daysAgo(0, 4), direction: 'inbound', content: 'Hi, I want to place a bulk order for home decor items.' },
  { id: 'LOG-005', recipient: '+91 98765 43210', recipientName: 'Vikram Patel', template: 'festive_offer', status: 'failed', timestamp: daysAgo(1), direction: 'outbound', content: 'Exclusive 20% off on electronics!', mediaType: 'image' },
  { id: 'LOG-006', recipient: '+91 54321 09876', recipientName: 'Ravi Joshi', template: 'otp_verification', status: 'delivered', timestamp: daysAgo(0, 5), direction: 'outbound', content: 'Your OTP is 482910.' },
  { id: 'LOG-007', recipient: '+91 43210 98765', recipientName: 'Priya Nair', template: 'invoice_share', status: 'read', timestamp: daysAgo(0, 6), direction: 'outbound', content: 'Invoice INV-2026-078 attached.', mediaType: 'document' },
  { id: 'LOG-008', recipient: '+91 32109 87654', recipientName: 'Karan Singh', template: 'product_catalog', status: 'delivered', timestamp: daysAgo(0, 7), direction: 'outbound', content: 'Check out our new summer collection!', mediaType: 'video' },
];

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
