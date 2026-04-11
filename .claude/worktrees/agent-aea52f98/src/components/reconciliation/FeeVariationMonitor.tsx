import { useMemo } from 'react';
import { ChannelIcon } from '@/components/ChannelIcon';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { portalConfigs } from '@/services/mockData';
import { Portal } from '@/types';
import { TrendingUp, TrendingDown, AlertTriangle, Minus } from 'lucide-react';

interface FeeRecord {
  id: string;
  portal: Portal;
  category: string;
  historicalCommission: number;
  currentCommission: number;
  changePct: number;
  alert: boolean;
}

const mockFeeData: FeeRecord[] = [];

export default function FeeVariationMonitor() {
  const alertCount = useMemo(() => mockFeeData.filter(f => f.alert).length, []);

  return (
    <div className="space-y-4">
      {alertCount > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <div>
                <p className="font-semibold text-foreground">{alertCount} Commission Increase Alerts Detected</p>
                <p className="text-sm text-muted-foreground">Sudden commission changes detected across portals — review immediately to prevent margin erosion.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Marketplace Fee Variation Monitor</CardTitle>
          <CardDescription>Track historical vs current commission rates across portals and categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Portal</TableHead>
                  <TableHead className="font-semibold">Category</TableHead>
                  <TableHead className="text-right font-semibold">Historical %</TableHead>
                  <TableHead className="text-right font-semibold">Current %</TableHead>
                  <TableHead className="text-right font-semibold">Change</TableHead>
                  <TableHead className="font-semibold">Alert</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockFeeData.map(f => {
                  const portal = portalConfigs.find(p => p.id === f.portal);
                  return (
                    <TableRow key={f.id} className={f.alert ? 'bg-amber-500/5' : ''}>
                      <TableCell><span className="flex items-center gap-1.5 text-sm"><ChannelIcon channelId={portal?.id || ""} fallbackIcon={portal?.icon} size={16} /> {portal?.name}</span></TableCell>
                      <TableCell className="text-sm">{f.category}</TableCell>
                      <TableCell className="text-right font-medium">{f.historicalCommission.toFixed(1)}%</TableCell>
                      <TableCell className="text-right font-medium">{f.currentCommission.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">
                        <span className={`inline-flex items-center gap-1 font-bold ${f.changePct > 1 ? 'text-rose-600' : f.changePct > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                          {f.changePct > 0 ? <TrendingUp className="w-3 h-3" /> : f.changePct < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                          {f.changePct > 0 ? '+' : ''}{f.changePct.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        {f.alert ? (
                          <Badge variant="outline" className="bg-amber-500/15 text-amber-600 border-amber-500/30 gap-1">
                            <AlertTriangle className="w-3 h-3" />Commission Increased by {f.changePct.toFixed(1)}%
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
