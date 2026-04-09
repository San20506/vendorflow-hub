import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { UserRole } from '@/types/database';
import { Session } from '@supabase/supabase-js';

export type { UserRole };

export interface AppUser {
  id: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextType {
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function buildAppUser(session: Session): Promise<AppUser | null> {
  const supaUser = session.user;

  const { data: userProfile } = await supabase
    .from('users')
    .select('id, email, role, avatar')
    .eq('id', supaUser.id)
    .single();

  if (!userProfile) {
    return null;
  }

  return {
    id: userProfile.id,
    email: userProfile.email,
    role: userProfile.role as UserRole,
    avatar: userProfile.avatar || undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          try {
            const appUser = await buildAppUser(session);
            setUser(appUser);
            setError(null);
          } catch (err) {
            setUser(null);
            setError(err instanceof Error ? err.message : 'Failed to load user');
          }
        } else {
          setUser(null);
          setError(null);
        }
        setIsLoading(false);
      }
    );

    // Check existing session
    supabase.auth.getSession().then(async ({ data: { session }, error: sessionError }) => {
      if (sessionError) {
        setError(sessionError.message);
        setIsLoading(false);
        return;
      }

      if (session) {
        try {
          const appUser = await buildAppUser(session);
          setUser(appUser);
          setError(null);
        } catch (err) {
          setUser(null);
          setError(err instanceof Error ? err.message : 'Failed to load user');
        }
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw authError;
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, role: UserRole = 'vendor') => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Create user profile
      const { error: profileError } = await supabase.from('users').insert({
        id: authData.user.id,
        email,
        password_hash: '', // Managed by Supabase Auth
        role,
      });
      if (profileError) throw profileError;
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      setUser(null);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Logout failed';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Password reset failed';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    signup,
    logout,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
