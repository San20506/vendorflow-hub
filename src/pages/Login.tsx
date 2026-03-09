import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Package, Shield, Settings } from 'lucide-react';

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

  // Navigate to dashboard once auth state is confirmed
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

      // Small delay to let auth state change process
      await new Promise(resolve => setTimeout(resolve, 100));

      // Validate selected role matches database role
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
      // Navigation handled by useEffect once authUser is set
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
            <Package className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">VendorPro</h1>
          <p className="text-muted-foreground mt-1">Multi-Portal E-Commerce Management</p>
        </div>

        <Card className="shadow-lg border-border">
          <Tabs defaultValue="login">
            <CardHeader className="space-y-1 pb-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              {/* Login Tab */}
              <TabsContent value="login" className="mt-0">
                <form onSubmit={handleLogin} className="space-y-4">
                  {/* Role Selection */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Select Role</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {roles.map((role) => {
                        const Icon = role.icon;
                        const isSelected = selectedRole === role.id;
                        return (
                          <button
                            key={role.id}
                            type="button"
                            onClick={() => setSelectedRole(role.id)}
                            className={`
                              relative flex flex-col items-center p-3 rounded-lg border-2 transition-all duration-200
                              ${isSelected
                                ? 'border-accent bg-accent/10 text-accent'
                                : 'border-border bg-card hover:border-muted-foreground/30'
                              }
                            `}
                          >
                            <Icon className={`w-5 h-5 mb-1 ${isSelected ? 'text-accent' : 'text-muted-foreground'}`} />
                            <span className={`text-xs font-medium ${isSelected ? 'text-accent' : 'text-foreground'}`}>
                              {role.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {selectedRole && (
                      <p className="text-xs text-muted-foreground text-center">
                        {roles.find(r => r.id === selectedRole)?.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-background"
                    />
                  </div>

                  {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in...</>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup" className="mt-0">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Min 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="bg-background"
                    />
                  </div>

                  {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
                  )}
                  {success && (
                    <div className="p-3 rounded-lg bg-primary/10 text-primary text-sm">{success}</div>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
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

        <p className="text-center text-xs text-muted-foreground mt-6">
          Multi-Portal VMS • Amazon • Flipkart • Meesho • FirstCry • Blinkit
        </p>
      </div>
    </div>
  );
}
