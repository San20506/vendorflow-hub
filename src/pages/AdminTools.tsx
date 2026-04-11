import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, RefreshCw, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff, Shield } from 'lucide-react';

const TEST_ACCOUNTS = [
  { email: 'admin@vendorpro.com', password: 'admin123', role: 'admin' },
  { email: 'vendor@vendorpro.com', password: 'vendor123', role: 'vendor' },
  { email: 'ops@vendorpro.com', password: 'ops123', role: 'operations' },
];

export default function AdminTools() {
  const { toast } = useToast();
  const [isResetting, setIsResetting] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [results, setResults] = useState<{ email: string; role: string; status: string }[] | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);

  const handleProvisionTestUsers = async () => {
    setIsProvisioning(true);
    setResults(null);
    try {
      const response = await supabase.functions.invoke('seed-test-users');
      if (response.error) throw new Error(response.error.message);
      setResults(response.data?.results ?? []);
      toast({ title: 'Test accounts provisioned', description: 'Accounts are ready to use.' });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to provision accounts.';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
    setIsProvisioning(false);
  };

  const handleResetTestUsers = async () => {
    if (!confirm('This will DELETE all data for test accounts and recreate them fresh. Continue?')) return;
    setIsResetting(true);
    setResults(null);
    try {
      const response = await supabase.functions.invoke('reset-test-users');
      if (response.error) throw new Error(response.error.message);
      setResults(response.data?.results ?? []);
      toast({ title: 'Test accounts reset', description: 'All test accounts wiped and recreated.' });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to reset accounts.';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
    setIsResetting(false);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Admin Tools</h1>
          <p className="text-sm text-muted-foreground">Test account management and system utilities</p>
        </div>
      </div>

      {/* Test Accounts Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="w-4 h-4" />
            Test Account Credentials
          </CardTitle>
          <CardDescription>Pre-configured accounts for testing each role</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {TEST_ACCOUNTS.map(acc => (
            <div key={acc.email} className="flex items-center justify-between p-3 rounded-xl border bg-muted/30">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-xs capitalize">{acc.role}</Badge>
                <span className="text-sm font-medium">{acc.email}</span>
              </div>
              <span className="text-sm font-mono text-muted-foreground">
                {showPasswords ? acc.password : '••••••••'}
              </span>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => setShowPasswords(v => !v)}
          >
            {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showPasswords ? 'Hide' : 'Show'} passwords
          </Button>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <RefreshCw className="w-4 h-4" />
            Account Management
          </CardTitle>
          <CardDescription>
            These actions require the edge functions to be deployed to your Supabase project.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-4 p-4 rounded-xl border">
            <div className="flex-1">
              <p className="text-sm font-semibold">Provision Test Accounts</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Creates the 3 test accounts if they don't exist (email pre-verified).
              </p>
            </div>
            <Button onClick={handleProvisionTestUsers} disabled={isProvisioning} size="sm" className="gap-1.5">
              {isProvisioning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5" />}
              Provision
            </Button>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl border border-destructive/20 bg-destructive/5">
            <div className="flex-1">
              <p className="text-sm font-semibold text-destructive">Reset Test Accounts</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Wipes all data for test accounts and recreates them fresh. Irreversible.
              </p>
            </div>
            <Button
              onClick={handleResetTestUsers}
              disabled={isResetting}
              size="sm"
              variant="destructive"
              className="gap-1.5"
            >
              {isResetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {results.map((r, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg">
                {r.status === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                )}
                <span className="text-sm">{r.email}</span>
                <Badge variant="outline" className="text-xs capitalize ml-auto">{r.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
