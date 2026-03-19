import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Package, Shield, Settings, Sparkles } from 'lucide-react';

const roles: { id: UserRole; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'admin', label: 'Administrator', icon: Shield, description: 'Full system access' },
  { id: 'vendor', label: 'Vendor', icon: Package, description: 'Product & inventory management' },
  { id: 'operations', label: 'Operations', icon: Settings, description: 'Order & fulfillment' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  useEffect(() => {
    if (authUser) {
      navigate('/dashboard', { replace: true });
    }
  }, [authUser, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!selectedRole) {
      setError('Please select a role before signing in.');
      return;
    }
    setIsLoading(true);
    try {
      await login(email, password);
      await new Promise(resolve => setTimeout(resolve, 100));
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', selectedRole)
          .maybeSingle();
        if (!roleData) {
          await supabase.auth.signOut();
          setError('Role mismatch. Contact administrator.');
          setIsLoading(false);
          return;
        }
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      await signup(email, password, name);
      setSuccess('Account created! Please check your email to verify your account.');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-accent/8 blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary/6 blur-3xl animate-float" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent/4 blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Branding */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="inline-flex items-center justify-center w-18 h-18 rounded-2xl mb-4 relative animate-glow" style={{ width: '72px', height: '72px', background: 'var(--gradient-primary)', borderRadius: '1.25rem' }}>
            <Package className="w-9 h-9 text-primary-foreground" />
            <Sparkles className="w-4 h-4 text-primary-foreground/60 absolute -top-1 -right-1" />
          </div>
          <h1 className="text-3xl font-extrabold text-gradient tracking-tight">VendorFlow</h1>
          <p className="text-muted-foreground mt-1.5 text-sm font-medium">Multi-Portal E-Commerce Management</p>
        </div>

        <Card className="shadow-xl border-border/60 glass-card animate-fade-in overflow-hidden" style={{ animationDelay: '0.15s' }}>
          {/* Top accent bar */}
          <div className="gold-accent" />

          <Tabs defaultValue="login">
            <CardHeader className="space-y-1 pb-4 pt-6">
              <TabsList className="grid w-full grid-cols-2 bg-muted/60">
                <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold transition-all duration-300">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold transition-all duration-300">Sign Up</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="pb-8">
              {/* Login Tab */}
              <TabsContent value="login" className="mt-0 space-y-5">
                <form onSubmit={handleLogin} className="space-y-5">
                  {/* Role Selection */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-foreground/80">Select Role</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {roles.map((role, idx) => {
                        const Icon = role.icon;
                        const isSelected = selectedRole === role.id;
                        return (
                          <button
                            key={role.id}
                            type="button"
                            onClick={() => setSelectedRole(role.id)}
                            className={`
                              relative flex flex-col items-center p-3.5 rounded-xl border-2 transition-all duration-300 group
                              ${isSelected
                                ? 'border-accent bg-accent/12 shadow-md'
                                : 'border-border bg-card hover:border-accent/30 hover:bg-accent/5'
                              }
                            `}
                            style={{ animationDelay: `${idx * 0.08}s` }}
                          >
                            <div className={`p-2 rounded-lg mb-1.5 transition-all duration-300 ${isSelected ? 'bg-accent/20' : 'bg-muted group-hover:bg-accent/10'}`}>
                              <Icon className={`w-5 h-5 transition-colors duration-300 ${isSelected ? 'text-accent' : 'text-muted-foreground group-hover:text-accent/70'}`} />
                            </div>
                            <span className={`text-xs font-semibold transition-colors duration-300 ${isSelected ? 'text-accent' : 'text-foreground/70'}`}>
                              {role.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {selectedRole && (
                      <p className="text-xs text-muted-foreground text-center animate-fade-in">
                        {roles.find(r => r.id === selectedRole)?.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-sm font-semibold text-foreground/80">Email</Label>
                    <Input id="login-email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-background/60 border-border/60 focus:border-accent focus:ring-accent/20 transition-all duration-300 h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-sm font-semibold text-foreground/80">Password</Label>
                    <Input id="login-password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-background/60 border-border/60 focus:border-accent focus:ring-accent/20 transition-all duration-300 h-11" />
                  </div>

                  {error && (
                    <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm font-medium animate-fade-in">{error}</div>
                  )}

                  <Button type="submit" className="w-full h-11 font-semibold text-sm tracking-wide transition-all duration-300 hover:shadow-lg" style={{ background: 'var(--gradient-primary)' }} disabled={isLoading}>
                    {isLoading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in...</>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup" className="mt-0 space-y-5">
                <form onSubmit={handleSignup} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-sm font-semibold text-foreground/80">Full Name</Label>
                    <Input id="signup-name" type="text" placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} required className="bg-background/60 border-border/60 focus:border-accent focus:ring-accent/20 transition-all duration-300 h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm font-semibold text-foreground/80">Email</Label>
                    <Input id="signup-email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-background/60 border-border/60 focus:border-accent focus:ring-accent/20 transition-all duration-300 h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm font-semibold text-foreground/80">Password</Label>
                    <Input id="signup-password" type="password" placeholder="Min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="bg-background/60 border-border/60 focus:border-accent focus:ring-accent/20 transition-all duration-300 h-11" />
                  </div>

                  {error && (
                    <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm font-medium animate-fade-in">{error}</div>
                  )}
                  {success && (
                    <div className="p-3 rounded-xl bg-success/10 text-success text-sm font-medium animate-fade-in">{success}</div>
                  )}

                  <Button type="submit" className="w-full h-11 font-semibold text-sm tracking-wide transition-all duration-300 hover:shadow-lg" style={{ background: 'var(--gradient-primary)' }} disabled={isLoading}>
                    {isLoading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account...</>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          Multi-Portal VMS • Amazon • Flipkart • Meesho • FirstCry • Blinkit
        </p>
      </div>
    </div>
  );
}
