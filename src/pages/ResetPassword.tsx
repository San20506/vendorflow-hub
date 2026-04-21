import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, KeyRound, CheckCircle2 } from 'lucide-react';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setError('Invalid or expired password reset link. Please request a new one.');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setError('');
      } else if (event === 'SIGNED_OUT') {
        setError('Session expired. Please request a new password reset link.');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4 bg-gradient-to-br from-slate-100 via-purple-50 to-slate-100">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-32 -right-32 w-[400px] h-[400px] rounded-full blur-[100px] animate-float"
          style={{ background: 'rgba(197, 157, 217, 0.3)' }}
        />
        <div
          className="absolute -bottom-40 -left-32 w-[500px] h-[500px] rounded-full blur-[120px] animate-float"
          style={{ background: 'rgba(122, 63, 145, 0.2)', animationDelay: '3s' }}
        />
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[350px] h-[350px] rounded-full blur-[80px] animate-float"
          style={{ background: 'rgba(43, 13, 62, 0.08)', animationDelay: '1.5s' }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div
          className="rounded-2xl overflow-hidden p-8 text-center animate-fade-in"
          style={{
            background: 'var(--glass-bg-card)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid var(--glass-border-strong)',
            boxShadow: 'var(--shadow-xl), var(--shadow-glow)',
          }}
        >
          <div className="inline-flex items-center justify-center rounded-2xl mb-6 w-[72px] h-[72px] bg-gradient-to-br from-purple-400 to-purple-700 shadow-lg shadow-purple-500/50">
            <KeyRound className="w-9 h-9 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-foreground mb-2">Reset Password</h2>
          
          {success ? (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col items-center justify-center space-y-4 py-4">
                <div className="rounded-full bg-emerald-100 p-3">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <p className="text-emerald-700 font-medium">Password updated successfully!</p>
                <p className="text-sm text-muted-foreground">Redirecting to login...</p>
              </div>
              <Button 
                onClick={() => navigate('/login')} 
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Go to Login
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-muted-foreground text-sm">
                Enter your new password below.
              </p>

              <form onSubmit={handleResetPassword} className="space-y-5 text-left">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-sm font-semibold text-foreground/80">New Password</Label>
                  <Input 
                    id="new-password" 
                    type="password" 
                    placeholder="Min 6 characters" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    minLength={6} 
                    className="h-11" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-sm font-semibold text-foreground/80">Confirm Password</Label>
                  <Input 
                    id="confirm-password" 
                    type="password" 
                    placeholder="Confirm new password" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    required 
                    minLength={6} 
                    className="h-11" 
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-xl text-sm font-medium animate-fade-in bg-destructive/10 text-destructive">
                    {error}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-11 font-semibold text-sm tracking-wide bg-purple-600 hover:bg-purple-700" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Updating Password...</>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
