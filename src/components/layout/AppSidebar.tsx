import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BoxIcon,
  RotateCcw,
  CreditCard,
  Users,
  Bell,
  BarChart3,
  ListTodo,
  Globe,
  MessageSquare,
  ChevronDown,
  Warehouse,
  Settings,
  Activity,
  FileSpreadsheet,
  Link2,
  Scale,
  Upload,
  Share2,
  Crown,
  LifeBuoy,
  Shield,
  FileText,
  IndianRupee,
  Receipt,
  Code,
  Camera,
  Gavel,
  UserPlus,
  MessageCircle,
  Building2,
  Contact,
  PieChart,
  Megaphone,
} from 'lucide-react';

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  roles: UserRole[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navigationGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'vendor', 'operations'] },
      { title: 'Insights', url: '/insights', icon: PieChart, roles: ['admin', 'vendor', 'operations'] },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { title: 'Products', url: '/products', icon: Package, roles: ['admin', 'vendor'] },
      { title: 'Catalog Manager', url: '/catalog-manager', icon: FileSpreadsheet, roles: ['admin'] },
      { title: 'Product Health', url: '/product-health', icon: Activity, roles: ['admin', 'vendor', 'operations'] },
      { title: 'SKU Mapping', url: '/sku-mapping', icon: Link2, roles: ['admin', 'vendor'] },
    ],
  },
  {
    label: 'Inventory & Orders',
    items: [
      { title: 'Inventory', url: '/inventory', icon: BoxIcon, roles: ['admin', 'vendor', 'operations'] },
      { title: 'Orders', url: '/orders', icon: ShoppingCart, roles: ['admin', 'vendor', 'operations'] },
      { title: 'Consolidated Orders', url: '/consolidated-orders', icon: FileSpreadsheet, roles: ['admin', 'operations'] },
      { title: 'Returns & Claims', url: '/returns', icon: RotateCcw, roles: ['admin', 'operations'] },
    ],
  },
  {
    label: 'Finance',
    items: [
      { title: 'Settlements', url: '/settlements', icon: CreditCard, roles: ['admin', 'vendor'] },
      { title: 'Reconciliation', url: '/reconciliation', icon: Scale, roles: ['admin', 'operations'] },
      { title: 'Price & Payout', url: '/price-payout', icon: IndianRupee, roles: ['admin', 'vendor'] },
      { title: 'Finance & Tax', url: '/finance', icon: Receipt, roles: ['admin', 'vendor'] },
    ],
  },
  {
    label: 'Vendors',
    items: [
      { title: 'Vendor List', url: '/vendors', icon: Users, roles: ['admin'] },
      { title: 'Warehouses', url: '/warehouses', icon: Warehouse, roles: ['admin', 'operations'] },
    ],
  },
  {
    label: 'Operations',
    items: [
      { title: 'Data Import', url: '/data-import', icon: Upload, roles: ['admin', 'operations'] },
      { title: 'Video Management', url: '/video-management', icon: Camera, roles: ['admin', 'operations'] },
      { title: 'Alerts', url: '/alerts', icon: Bell, roles: ['admin', 'vendor', 'operations'] },
      { title: 'Tasks', url: '/tasks', icon: ListTodo, roles: ['admin', 'operations'] },
      { title: 'Analytics', url: '/analytics', icon: BarChart3, roles: ['admin', 'vendor'] },
      { title: 'Lead Management', url: '/leads', icon: UserPlus, roles: ['admin', 'vendor'] },
      { title: 'Customer Database', url: '/customers', icon: Contact, roles: ['admin', 'vendor', 'operations'] },
      { title: 'WhatsApp API', url: '/whatsapp', icon: MessageCircle, roles: ['admin'] },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { title: 'Unified Inbox', url: '/social-insights', icon: Share2, roles: ['admin', 'vendor'] },
      { title: 'Marketing Config', url: '/marketing-config', icon: Megaphone, roles: ['admin'] },
      { title: 'Own Website', url: '/ecommerce', icon: Globe, roles: ['admin', 'vendor'] },
    ],
  },
  {
    label: 'Reports',
    items: [
      { title: 'Reports & History', url: '/reports', icon: FileText, roles: ['admin', 'vendor', 'operations'] },
    ],
  },
  {
    label: 'Admin',
    items: [
      { title: 'Onboarding', url: '/onboarding', icon: Building2, roles: ['admin'] },
      { title: 'System Settings', url: '/system-settings', icon: Settings, roles: ['admin'] },
      { title: 'Permissions', url: '/permissions', icon: Shield, roles: ['admin'] },
      { title: 'API Settings', url: '/api-settings', icon: Code, roles: ['admin'] },
      { title: 'Legal & Compliance', url: '/legal-compliance', icon: Gavel, roles: ['admin'] },
      { title: 'Subscription', url: '/subscription', icon: Crown, roles: ['admin'] },
      { title: 'AI Hub', url: '/chatbot', icon: MessageSquare, roles: ['admin'] },
      { title: 'Support', url: '/support', icon: LifeBuoy, roles: ['admin', 'vendor', 'operations'] },
    ],
  },
];

export function AppSidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const filteredGroups = navigationGroups.map(group => ({
    ...group,
    items: group.items.filter(item => user && item.roles.includes(user.role)),
  })).filter(group => group.items.length > 0);

  return (
    <Sidebar className="border-r-0" collapsible="icon">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-sidebar-primary">
            <Package className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sidebar-foreground">VendorFlow</span>
              <span className="text-xs text-sidebar-foreground/60">v1.0 • VMS Platform</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2 scrollbar-thin">
        {filteredGroups.map((group, index) => (
          <Collapsible key={group.label} defaultOpen={index === 0} className="group/collapsible">
            <SidebarGroup className="p-0">
              {!isCollapsed ? (
                <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider hover:text-sidebar-foreground/80 transition-colors">
                  {group.label}
                  <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200 group-data-[state=closed]/collapsible:rotate-[-90deg]" />
                </CollapsibleTrigger>
              ) : null}
              <CollapsibleContent className="transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden">
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const isActive = location.pathname === item.url;
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            tooltip={item.title}
                          >
                            <a
                              href={item.url}
                              onClick={(e) => {
                                e.preventDefault();
                                navigate(item.url);
                              }}
                              className={`
                                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                                ${isActive 
                                  ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium' 
                                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                                }
                              `}
                            >
                              <item.icon className="w-4 h-4 shrink-0" />
                              {!isCollapsed && <span>{item.title}</span>}
                            </a>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
