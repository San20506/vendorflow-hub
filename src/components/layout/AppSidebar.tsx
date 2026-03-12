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
  Wallet,
  Scissors,
  Calculator,
  ArrowUpDown,
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

interface NavSection {
  heading: string;
  groups: NavGroup[];
}

const navigationSections: NavSection[] = [
  {
    heading: 'Channel Details',
    groups: [
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
          { title: 'Profit Calculator', url: '/profit-calculator', icon: Calculator, roles: ['admin', 'vendor'] },
          { title: 'Payout Comparison', url: '/payout-comparison', icon: ArrowUpDown, roles: ['admin', 'vendor'] },
          { title: 'Finance & Tax', url: '/finance', icon: Receipt, roles: ['admin', 'vendor'] },
          { title: 'Expense Tracking', url: '/expenses', icon: Wallet, roles: ['admin', 'operations'] },
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
        label: 'Marketing',
        items: [
          { title: 'Broadcast Center', url: '/broadcast', icon: Megaphone, roles: ['admin', 'vendor'] },
          { title: 'Unified Inbox', url: '/social-insights', icon: Share2, roles: ['admin', 'vendor'] },
          { title: 'Marketing Config', url: '/marketing-config', icon: Megaphone, roles: ['admin'] },
          { title: 'Own Website', url: '/ecommerce', icon: Globe, roles: ['admin', 'vendor'] },
        ],
      },
      {
        label: 'Reports',
        items: [
          { title: 'Reports & History', url: '/reports', icon: FileText, roles: ['admin', 'vendor', 'operations'] },
          { title: 'Analytics', url: '/analytics', icon: BarChart3, roles: ['admin', 'vendor'] },
        ],
      },
    ],
  },
  {
    heading: 'Configurations & Uploads',
    groups: [
      {
        label: 'Data Management',
        items: [
          { title: 'Data Import', url: '/data-import', icon: Upload, roles: ['admin', 'operations'] },
          { title: 'Integrations', url: '/integrations', icon: Link2, roles: ['admin', 'vendor'] },
          { title: 'Video Management', url: '/video-management', icon: Camera, roles: ['admin', 'operations'] },
        ],
      },
      {
        label: 'Operations',
        items: [
          { title: 'Alerts', url: '/alerts', icon: Bell, roles: ['admin', 'vendor', 'operations'] },
          { title: 'Tasks', url: '/tasks', icon: ListTodo, roles: ['admin', 'operations'] },
          { title: 'Lead Management', url: '/leads', icon: UserPlus, roles: ['admin', 'vendor'] },
          { title: 'Customer Database', url: '/customers', icon: Contact, roles: ['admin', 'vendor', 'operations'] },
          { title: 'WhatsApp API', url: '/whatsapp', icon: MessageCircle, roles: ['admin'] },
          { title: 'Staff & Salary', url: '/staff', icon: Scissors, roles: ['admin', 'operations'] },
        ],
      },
      {
        label: 'Admin & Settings',
        items: [
          { title: 'Onboarding', url: '/onboarding', icon: Building2, roles: ['admin'] },
          { title: 'System Settings', url: '/system-settings', icon: Settings, roles: ['admin'] },
          { title: 'Permissions', url: '/permissions', icon: Shield, roles: ['admin'] },
          { title: 'API Settings', url: '/api-settings', icon: Code, roles: ['admin'] },
          { title: 'Legal & Compliance', url: '/legal-compliance', icon: Gavel, roles: ['admin'] },
          { title: 'Subscription', url: '/subscription', icon: Crown, roles: ['admin'] },
          { title: 'AI Hub', url: '/chatbot', icon: MessageSquare, roles: ['admin'] },
          { title: 'Support', url: '/support', icon: LifeBuoy, roles: ['admin', 'vendor', 'operations'] },
          { title: 'Technical Docs', url: '/technical-docs', icon: FileText, roles: ['admin'] },
        ],
      },
    ],
  },
];

export function AppSidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const [isEditingBrand, setIsEditingBrand] = useState(false);
  const [brandName, setBrandName] = useState('VendorFlow');
  const [brandSubtitle, setBrandSubtitle] = useState('v1.0 • VMS Platform');

  const filteredSections = navigationSections.map(section => ({
    ...section,
    groups: section.groups.map(group => ({
      ...group,
      items: group.items.filter(item => user && item.roles.includes(user.role)),
    })).filter(group => group.items.length > 0),
  })).filter(section => section.groups.length > 0);

  return (
    <Sidebar className="border-r border-sidebar-border backdrop-blur-xl bg-[hsl(0_0%_100%/0.75)] dark:bg-[hsl(225_25%_6%/0.75)]" collapsible="icon">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => !isCollapsed && setIsEditingBrand(!isEditingBrand)}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
            title="Click to edit branding"
          >
            <Package className="w-5 h-5 text-primary-foreground" />
          </button>
          {!isCollapsed && (
            isEditingBrand ? (
              <div className="flex flex-col gap-1">
                <input
                  className="bg-accent text-foreground text-sm font-semibold rounded-lg px-1.5 py-0.5 border border-border w-[120px]"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  onBlur={() => setIsEditingBrand(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingBrand(false)}
                  autoFocus
                />
                <input
                  className="bg-accent text-muted-foreground text-[10px] rounded-lg px-1.5 py-0.5 border border-border w-[120px]"
                  value={brandSubtitle}
                  onChange={(e) => setBrandSubtitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingBrand(false)}
                />
              </div>
            ) : (
              <div className="flex flex-col cursor-pointer" onClick={() => setIsEditingBrand(true)} title="Click to edit">
                <span className="font-bold text-sidebar-foreground">{brandName}</span>
                <span className="text-xs text-muted-foreground">{brandSubtitle}</span>
              </div>
            )
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2 scrollbar-thin">
        {filteredSections.map((section, sectionIndex) => (
          <div key={section.heading}>
            {!isCollapsed && (
              <div className={`px-3 py-2.5 ${sectionIndex > 0 ? 'mt-3 border-t border-sidebar-border pt-4' : ''}`}>
                <span className="text-[11px] font-bold text-primary uppercase tracking-widest">
                  {section.heading}
                </span>
              </div>
            )}
            {isCollapsed && sectionIndex > 0 && (
              <div className="my-2 mx-2 border-t border-sidebar-border" />
            )}
            {section.groups.map((group, index) => (
              <Collapsible key={group.label} defaultOpen={sectionIndex === 0 && index < 2} className="group/collapsible">
                <SidebarGroup className="p-0">
                  {!isCollapsed ? (
                    <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
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
                                      ? 'bg-primary text-primary-foreground font-medium shadow-sm' 
                                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
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
          </div>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
