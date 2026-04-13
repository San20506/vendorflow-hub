import { useState } from 'react';
import { seedAllDemoData } from '@/lib/seed-demo-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DemoDataLoaderProps {
  vendorId: string;
}

export function DemoDataLoader({ vendorId }: DemoDataLoaderProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleLoadDemoData = async () => {
    setIsLoading(true);
    try {
      const seedResults = await seedAllDemoData(vendorId);
      setResults(seedResults);

      if (seedResults.errors.length === 0) {
        toast({
          title: 'Demo data loaded successfully!',
          description: `Brands: ${seedResults.brands}, Products: ${seedResults.products}, Orders: ${seedResults.orders}, Channels: ${seedResults.channels}`,
        });
      } else {
        toast({
          title: 'Demo data loaded with warnings',
          description: seedResults.errors.join('; '),
          variant: 'default',
        });
      }
    } catch (error) {
      toast({
        title: 'Failed to load demo data',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="glass-card border-0">
      <CardHeader>
        <CardTitle className="text-lg">Demo Data</CardTitle>
        <CardDescription>Load sample data to explore the app features</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!results ? (
          <Button
            onClick={handleLoadDemoData}
            disabled={isLoading}
            className="w-full gap-2"
            style={{ background: 'var(--gradient-deep)', color: 'white' }}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? 'Loading Demo Data...' : 'Load Demo Data'}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-success/10 rounded-lg border border-success/20">
              <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
              <span className="text-sm font-medium">Demo data loaded successfully</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-card rounded-lg border border-border">
                <div className="text-2xl font-bold text-primary">{results.brands}</div>
                <div className="text-xs text-muted-foreground mt-1">Brands</div>
              </div>
              <div className="p-3 bg-card rounded-lg border border-border">
                <div className="text-2xl font-bold text-primary">{results.products}</div>
                <div className="text-xs text-muted-foreground mt-1">Products</div>
              </div>
              <div className="p-3 bg-card rounded-lg border border-border">
                <div className="text-2xl font-bold text-primary">{results.orders}</div>
                <div className="text-xs text-muted-foreground mt-1">Orders</div>
              </div>
              <div className="p-3 bg-card rounded-lg border border-border">
                <div className="text-2xl font-bold text-primary">{results.channels}</div>
                <div className="text-xs text-muted-foreground mt-1">Channels</div>
              </div>
            </div>

            {results.errors.length > 0 && (
              <div className="flex items-start gap-2 p-3 bg-warning/10 rounded-lg border border-warning/20">
                <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-warning">Some errors occurred:</div>
                  <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                    {results.errors.map((error: string, idx: number) => (
                      <li key={idx}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <Button
              onClick={() => {
                setResults(null);
              }}
              variant="outline"
              className="w-full"
            >
              Load More Data
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
