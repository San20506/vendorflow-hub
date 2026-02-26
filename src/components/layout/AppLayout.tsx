import { ReactNode } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Bell, Search, LogOut, Settings, User, Smartphone, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AIAccessBanner, AIAccessControl } from '@/components/AIAccessControl';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface AppLayoutProps {
  children: ReactNode;
}

// Route permission map — which roles can access which routes
const routePermissions: Record<string, UserRole[]> = {
  '/dashboard': ['admin', 'vendor', 'operations'],
  '/insights': ['admin', 'vendor', 'operations'],
  '/products': ['admin', 'vendor'],
  '/catalog-manager': ['admin'],
  '/product-health': ['admin', 'vendor', 'operations'],
  '/sku-mapping': ['admin', 'vendor'],
  '/inventory': ['admin', 'vendor', 'operations'],
  '/orders': ['admin', 'vendor', 'operations'],
  '/consolidated-orders': ['admin', 'operations'],
  '/returns': ['admin', 'operations'],
  '/settlements': ['admin', 'vendor'],
  '/reconciliation': ['admin', 'operations'],
  '/price-payout': ['admin', 'vendor'],
  '/finance': ['admin', 'vendor'],
  '/vendors': ['admin'],
  '/warehouses': ['admin', 'operations'],
  '/data-import': ['admin', 'operations'],
  '/video-management': ['admin', 'operations'],
  '/alerts': ['admin', 'vendor', 'operations'],
  '/tasks': ['admin', 'operations'],
  '/analytics': ['admin', 'vendor'],
  '/leads': ['admin', 'vendor'],
  '/customers': ['admin', 'vendor', 'operations'],
  '/whatsapp': ['admin'],
  '/social-insights': ['admin', 'vendor'],
  '/ecommerce': ['admin', 'vendor'],
  '/reports': ['admin', 'vendor', 'operations'],
  '/onboarding': ['admin'],
  '/system-settings': ['admin'],
  '/permissions': ['admin'],
  '/api-settings': ['admin'],
  '/legal-compliance': ['admin'],
  '/subscription': ['admin'],
  '/chatbot': ['admin'],
  '/support': ['admin', 'vendor', 'operations'],
  '/data-configuration': ['admin'],
  '/system-architecture': ['admin'],
};

export function AppLayout({ children }: AppLayoutProps) {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Role-based route protection
  const currentPath = location.pathname;
  const allowedRoles = routePermissions[currentPath];
  const hasAccess = !allowedRoles || (user && allowedRoles.includes(user.role));

  const lastSynced = new Date();
  lastSynced.setMinutes(lastSynced.getMinutes() - 3);
  const syncLabel = `Last synced: ${lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex-1 flex flex-col">
          {/* Top Header */}
          <header className="h-14 border-b border-border bg-card px-4 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              
              {/* Search */}
              <div className="hidden md:flex items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search orders, products, vendors..." 
                    className="w-80 pl-9 bg-background"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Last Synced */}
              <span className="text-xs text-muted-foreground hidden lg:block">
                {syncLabel}
              </span>

              {/* Mobile Ready Badge */}
              <Badge variant="outline" className="gap-1 text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hidden lg:flex">
                <Smartphone className="w-3 h-3" />
                Mobile Ready – Responsive & PWA
              </Badge>

              {/* AI Access Control */}
              <AIAccessControl />

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive">
                      3
                    </Badge>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="px-3 py-2 border-b border-border">
                    <h4 className="font-semibold text-sm">Notifications</h4>
                  </div>
                  <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-destructive" />
                      <span className="font-medium text-sm">Critical Low Stock</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Bluetooth Speaker - 5 units left</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-warning" />
                      <span className="font-medium text-sm">Settlement Delayed</span>
                    </div>
                    <span className="text-xs text-muted-foreground">FirstCry payment overdue by 7 days</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-info" />
                      <span className="font-medium text-sm">New Return Request</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Order ORD-2024-002 return initiated</span>
                  </DropdownMenuItem>
                  <div className="p-2 border-t border-border">
                    <Button variant="ghost" className="w-full text-sm">
                      View all notifications
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent transition-colors">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user?.avatar} alt={user?.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {user?.name?.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:flex flex-col text-left">
                      <span className="text-sm font-medium leading-tight">{user?.name}</span>
                      <span className="text-xs text-muted-foreground capitalize">{user?.role}</span>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/system-settings')}>
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/system-settings')}>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* AI Banner */}
          <AIAccessBanner />

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto bg-background">
            {!hasAccess ? (
              <div className="flex items-center justify-center min-h-[60vh]">
                <Alert variant="destructive" className="max-w-md">
                  <ShieldAlert className="h-5 w-5" />
                  <AlertTitle>Access Restricted</AlertTitle>
                  <AlertDescription>
                    Your role <Badge variant="outline" className="mx-1 capitalize">{user?.role}</Badge> does not have permission to access this module. Contact your administrator to request access.
                  </AlertDescription>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/dashboard')}>
                    Return to Dashboard
                  </Button>
                </Alert>
              </div>
            ) : (
              children
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
