import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo
const mockUsers: Record<UserRole, User> = {
  admin: {
    id: 'admin-001',
    name: 'Sarah Johnson',
    email: 'admin@vendorpro.com',
    role: 'admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
  },
  vendor: {
    id: 'vendor-001',
    name: 'Michael Chen',
    email: 'vendor@vendorpro.com',
    role: 'vendor',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
  },
  operations: {
    id: 'ops-001',
    name: 'Emily Davis',
    email: 'ops@vendorpro.com',
    role: 'operations',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback(async (email: string, password: string, role: UserRole) => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    // Mock authentication - in production, this would call a real API
    const mockUser = mockUsers[role];
    setUser({ ...mockUser, email });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const switchRole = useCallback((role: UserRole) => {
    if (user) {
      const newUser = mockUsers[role];
      setUser({ ...newUser, email: user.email });
    }
  }, [user]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    switchRole,
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
