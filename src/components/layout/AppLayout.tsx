import { ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Bell, Search, LogOut, Settings, User, Smartphone } from 'lucide-react';
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

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
