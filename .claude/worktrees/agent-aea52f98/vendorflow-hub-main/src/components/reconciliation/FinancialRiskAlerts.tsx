import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { portalConfigs } from '@/services/mockData';
import { Portal } from '@/types';
import { ShieldAlert, Clock, TrendingUp, TrendingDown, RotateCcw, AlertTriangle, XCircle } from 'lucide-react';

type Severity = 'low' | 'medium' | 'high' | 'critical';
type AlertType = 'settlement_delay' | 'commission_spike' | 'margin_leakage' | 'high_refund_rate' | 'chargeback_loss';

interface RiskAlert {
  id: string;
  type: AlertType;
  severity: Severity;
  title: string;
  description: string;
  portal: Portal;
  timestamp: string;
  impact: string;
}

const typeConfig: Record<AlertType, { label: string; icon: React.ElementType }> = {
  settlement_delay: { label: 'Settlement Delay', icon: Clock },
  commission_spike: { label: 'Commission Spike', icon: TrendingUp },
  margin_leakage: { label: 'Margin Leakage', icon: TrendingDown },
  high_refund_rate: { label: 'High Refund Rate', icon: RotateCcw },
  chargeback_loss: { label: 'Chargeback Loss', icon: XCircle },
};

const severityConfig: Record<Severity, { label: string; className: string; borderClass: string }> = {
  low: { label: 'Low', className: 'bg-blue-500/15 text-blue-600 border-blue-500/30', borderClass: 'border-l-blue-500' },
  medium: { label: 'Medium', className: 'bg-amber-500/15 text-amber-600 border-amber-500/30', borderClass: 'border-l-amber-500' },
  high: { label: 'High', className: 'bg-orange-500/15 text-orange-600 border-orange-500/30', borderClass: 'border-l-orange-500' },
  critical: { label: 'Critical', className: 'bg-rose-500/15 text-rose-600 border-rose-500/30', borderClass: 'border-l-rose-500' },
};

const mockAlerts: RiskAlert[] = [
  { id: 'RA-01', type: 'settlement_delay', severity: 'critical', title: 'Flipkart Settlement Overdue by 5 Days', description: 'Batch BATCH-FLK-01 worth ₹89,200 has not been settled. Expected on Feb 7.', portal: 'flipkart', timestamp: '2026-02-12T09:30:00', impact: '₹89,200 at risk' },
  { id: 'RA-02', type: 'commission_spike', severity: 'high', title: 'Meesho Fashion Commission Increased +3%', description: 'Commission rate changed from 10% to 13% on Fashion category without prior notice.', portal: 'meesho', timestamp: '2026-02-11T14:15:00', impact: 'Est. ₹15,000/month loss' },
  { id: 'RA-03', type: 'margin_leakage', severity: 'high', title: 'BT Speaker Margin Dropped 9.5%', description: 'SKU-AMZ-006 margin fell from 22% to 12.5% — investigate deduction changes.', portal: 'amazon', timestamp: '2026-02-11T11:00:00', impact: '₹748 per batch' },
  { id: 'RA-04', type: 'high_refund_rate', severity: 'medium', title: 'Blinkit Refund Rate Exceeds 18%', description: 'Water Bottle SKU-BLK-004 has abnormally high return rate impacting net settlement.', portal: 'blinkit', timestamp: '2026-02-10T16:45:00', impact: '₹497 loss detected' },
  { id: 'RA-05', type: 'chargeback_loss', severity: 'critical', title: '₹7,647 Lost in Chargebacks This Week', description: '2 chargeback disputes lost across Flipkart totaling ₹7,647 — escalation recommended.', portal: 'flipkart', timestamp: '2026-02-10T10:00:00', impact: '₹7,647 lost' },
  { id: 'RA-06', type: 'settlement_delay', severity: 'high', title: 'FirstCry Settlement Critical — 8 Day Delay', description: 'Batch BATCH-FCY-01 worth ₹67,800 is critically delayed. Immediate follow-up needed.', portal: 'firstcry', timestamp: '2026-02-09T09:00:00', impact: '₹67,800 at risk' },
  { id: 'RA-07', type: 'commission_spike', severity: 'medium', title: 'Amazon Electronics Commission Up 1.7%', description: 'Electronics category commission changed from 8.5% to 10.2%.', portal: 'amazon', timestamp: '2026-02-08T13:30:00', impact: 'Est. ₹8,000/month' },
  { id: 'RA-08', type: 'margin_leakage', severity: 'low', title: 'Yoga Mat Margin Under Pressure', description: 'SKU-MSH-007 margin dropped from 24% to 15% — monitor for further decline.', portal: 'meesho', timestamp: '2026-02-07T15:00:00', impact: 'Monitor' },
];

export default function FinancialRiskAlerts() {
  const countBySeverity = useMemo(() => ({
    critical: mockAlerts.filter(a => a.severity === 'critical').length,
    high: mockAlerts.filter(a => a.severity === 'high').length,
    medium: mockAlerts.filter(a => a.severity === 'medium').length,
    low: mockAlerts.filter(a => a.severity === 'low').length,
  }), []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-rose-500/30"><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-rose-500/10"><ShieldAlert className="w-5 h-5 text-rose-600" /></div><div><p className="text-2xl font-bold text-rose-600">{countBySeverity.critical}</p><p className="text-sm text-muted-foreground">Critical</p></div></div></CardContent></Card>
        <Card className="border-orange-500/30"><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-orange-500/10"><AlertTriangle className="w-5 h-5 text-orange-600" /></div><div><p className="text-2xl font-bold text-orange-600">{countBySeverity.high}</p><p className="text-sm text-muted-foreground">High</p></div></div></CardContent></Card>
        <Card className="border-amber-500/30"><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-amber-500/10"><AlertTriangle className="w-5 h-5 text-amber-600" /></div><div><p className="text-2xl font-bold text-amber-600">{countBySeverity.medium}</p><p className="text-sm text-muted-foreground">Medium</p></div></div></CardContent></Card>
        <Card className="border-blue-500/30"><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-500/10"><AlertTriangle className="w-5 h-5 text-blue-600" /></div><div><p className="text-2xl font-bold text-blue-600">{countBySeverity.low}</p><p className="text-sm text-muted-foreground">Low</p></div></div></CardContent></Card>
      </div>

      <div className="space-y-3">
        {mockAlerts.map(alert => {
          const sev = severityConfig[alert.severity];
          const tc = typeConfig[alert.type];
          const TypeIcon = tc.icon;
          const portal = portalConfigs.find(p => p.id === alert.portal);
          return (
            <Card key={alert.id} className={`border-l-4 ${sev.borderClass}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${alert.severity === 'critical' ? 'bg-rose-500/10' : alert.severity === 'high' ? 'bg-orange-500/10' : 'bg-amber-500/10'}`}>
                    <TypeIcon className={`w-5 h-5 ${alert.severity === 'critical' ? 'text-rose-600' : alert.severity === 'high' ? 'text-orange-600' : 'text-amber-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-semibold text-foreground">{alert.title}</h4>
                        <p className="text-sm text-muted-foreground mt-0.5">{alert.description}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="text-xs text-muted-foreground">{new Date(alert.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                        <Badge variant="outline" className="text-xs">{portal?.icon} {portal?.name}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className={`text-xs ${sev.className}`}>{sev.label}</Badge>
                      <Badge variant="secondary" className="text-xs">{tc.label}</Badge>
                      <span className="text-xs font-medium text-rose-600 ml-auto">{alert.impact}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
