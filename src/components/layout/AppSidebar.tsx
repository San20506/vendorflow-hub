import { useState, useMemo } from 'react';
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
import { Input } from '@/components/ui/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  LayoutDashboard, Package, ShoppingCart, BoxIcon, RotateCcw, CreditCard, Users,
  Bell, BarChart3, ListTodo, Globe, MessageSquare, ChevronDown, Search, X,
  Warehouse, Settings, Activity, FileSpreadsheet, Link2, Scale, Upload, Share2,
  Crown, LifeBuoy, Shield, FileText, IndianRupee, Receipt, Code, Camera, Gavel,
  UserPlus, MessageCircle, Building2, Contact, PieChart, Megaphone, Wallet,
  Scissors, Calculator, ArrowUpDown, MapPin, StarIcon, Mail, Video, HardDrive,
  GraduationCap, Store, Tag, Handshake, Banknote,
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
        label: 'Dashboard',
        items: [
          { title: 'Insights', url: '/insights', icon: PieChart, roles: ['admin', 'vendor', 'operations'] },
          { title: 'Channels', url: '/channels', icon: Store, roles: ['admin', 'vendor'] },
        ],
      },
      {
        label: 'Catalog',
        items: [
          { title: 'Products & Catalog', url: '/products-catalog', icon: Package, roles: ['admin', 'vendor'] },
          { title: 'Brands', url: '/brands', icon: Tag, roles: ['admin', 'vendor'] },
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
          { title: 'Settlements', url: '/settlements', icon: CreditCard, roles: ['admin', 'vendor'] },
          { title: 'Purchase & Inward', url: '/purchase', icon: Receipt, roles: ['admin', 'vendor', 'operations'] },
        ],
      },
      {
        label: 'Reconciliation',
        items: [
          { title: 'Payment Reconciliation', url: '/reconciliation', icon: Banknote, roles: ['admin', 'operations'] },
        ],
      },
      {
        label: 'Finance',
        items: [
          { title: 'Price & Payout', url: '/price-payout', icon: IndianRupee, roles: ['admin', 'vendor'] },
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
          { title: 'Email & Social Ads', url: '/email-marketing', icon: Mail, roles: ['admin', 'vendor'] },
          { title: 'Unified Inbox', url: '/social-insights', icon: Share2, roles: ['admin', 'vendor'] },
          { title: 'Marketing Config', url: '/marketing-config', icon: Megaphone, roles: ['admin'] },
          { title: 'Own Website', url: '/ecommerce', icon: Globe, roles: ['admin', 'vendor'] },
          { title: 'Google Meet & AI', url: '/google-meet', icon: Video, roles: ['admin', 'vendor'] },
        ],
      },
      {
        label: 'Reports',
        items: [
          { title: 'Reports & History', url: '/reports', icon: FileText, roles: ['admin', 'vendor', 'operations'] },
          { title: 'Analytics', url: '/analytics', icon: BarChart3, roles: ['admin', 'vendor'] },
          { title: 'Review Analytics', url: '/review-analytics', icon: StarIcon, roles: ['admin', 'vendor'] },
          { title: 'Data Intelligence', url: '/data-intelligence', icon: MapPin, roles: ['admin'] },
        ],
      },
      {
        label: 'Affiliated',
        items: [
          { title: 'Affiliated', url: '/affiliated', icon: Handshake, roles: ['admin', 'vendor'] },
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
          { title: 'Storage & Drive', url: '/storage', icon: HardDrive, roles: ['admin', 'vendor', 'operations'] },
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
          { title: 'Admin Tools', url: '/admin-tools', icon: Shield, roles: ['admin'] },
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
  const [searchQuery, setSearchQuery] = useState('');

  const roleFilteredSections = useMemo(() => navigationSections.map(section => ({
    ...section,
    groups: section.groups.map(group => ({
      ...group,
      items: group.items.filter(item => user && item.roles.includes(user.role)),
    })).filter(group => group.items.length > 0),
  })).filter(section => section.groups.length > 0), [user]);

  const allItems = useMemo(() =>
    roleFilteredSections.flatMap(s => s.groups.flatMap(g => g.items)),
    [roleFilteredSections]
  );

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allItems.filter(item => item.title.toLowerCase().includes(q));
  }, [searchQuery, allItems]);

  const filteredSections = useMemo(() => searchQuery.trim()
    ? roleFilteredSections.map(section => ({
        ...section,
        groups: section.groups.map(group => ({
          ...group,
          items: group.items.filter(item =>
            item.title.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        })).filter(group => group.items.length > 0),
      })).filter(section => section.groups.length > 0)
    : roleFilteredSections,
  [searchQuery, roleFilteredSections]);

  return (
    <Sidebar
      className="border-r border-sidebar-accent/12 bg-gradient-to-b from-sidebar to-sidebar/95 backdrop-blur-xl"
      collapsible="icon"
    >
      <SidebarHeader className="p-4 border-b border-sidebar-accent/12">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-purple-400 to-purple-700 shadow-lg shrink-0">
            <Package className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-sidebar-foreground">VendorFlow</span>
              <span className="text-xs text-sidebar-foreground/60">v1.0 • VMS Platform</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Search Bar */}
      {!isCollapsed && (
        <div className="relative px-3 pb-2 pt-2 border-b border-purple-400/8 overflow-visible">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-sidebar-foreground/50" />
            <input
              placeholder="Search tabs..."
              value={searchQuery}
              onChange={e => {
                console.log('[Sidebar] Search query changed:', e.target.value);
                setSearchQuery(e.target.value);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && searchResults.length > 0) {
                  navigate(searchResults[0].url);
                  setSearchQuery('');
                } else if (e.key === 'Escape') {
                  setSearchQuery('');
                }
              }}
              className="w-full h-8 pl-8 pr-8 text-xs rounded-xl bg-sidebar-accent border border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/60 outline-none transition-all duration-200 focus:ring-1 focus:ring-sidebar-ring"
              aria-label="Search navigation"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors text-sidebar-foreground/50 hover:text-sidebar-foreground"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {searchQuery.trim() && searchResults.length > 0 && (
            <div className="absolute left-3 right-3 top-full mt-1 rounded-xl py-1 max-h-60 overflow-y-auto z-[200] bg-sidebar border border-sidebar-accent shadow-2xl">
              {searchResults.map(item => {
                const isActive = location.pathname === item.url;
                return (
                  <button
                    key={item.url}
                    onClick={() => { navigate(item.url); setSearchQuery(''); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                        : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                    }`}
                  >
                    <item.icon className="w-4 h-4 shrink-0 text-sidebar-accent" />
                    <span>{item.title}</span>
                  </button>
                );
              })}
            </div>
          )}
          {searchQuery.trim() && searchResults.length === 0 && (
            <p className="text-xs text-center py-2 text-sidebar-foreground/40">No tabs found</p>
          )}
        </div>
      )}

      <SidebarContent className="px-2 py-2 scrollbar-thin">
        {filteredSections.map((section, sectionIndex) => (
          <div key={section.heading}>
            {!isCollapsed && (
              <div className={`px-3 py-2.5 ${sectionIndex > 0 ? 'mt-3 pt-4 border-t border-sidebar-foreground/20' : ''}`}>
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-sidebar-foreground">
                  {section.heading}
                </span>
              </div>
            )}
            {isCollapsed && sectionIndex > 0 && (
              <div className="my-2 mx-2 border-t border-sidebar-foreground/20" />
            )}
            {section.groups.map((group, index) => (
              <Collapsible key={group.label} defaultOpen={sectionIndex === 0 && index < 2} className="group/collapsible">
                <SidebarGroup className="p-0">
                  {!isCollapsed ? (
                    <CollapsibleTrigger
                      className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors text-sidebar-foreground"
                    >
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
                                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                                    isActive
                                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-md ring-1 ring-sidebar-accent/30'
                                      : 'text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                                  }`}
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
