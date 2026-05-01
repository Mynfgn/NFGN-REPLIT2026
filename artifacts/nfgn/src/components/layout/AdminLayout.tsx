import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  LayoutDashboard, Users, ShoppingBag, FolderTree, 
  Award, Banknote, Calendar, Settings,
  MessageSquare, Tag, BarChart, LogOut, Menu, X,
  ShieldCheck, Network, Star, Percent, Gift, Home, Clock, UserCircle,
  ChevronDown, ChevronRight, Briefcase, PackageCheck, Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { roleLabel } from "@/lib/labels";
import { NotificationBell } from "@/components/dashboard/NotificationBell";

interface NavChild {
  name: string;
  href: string;
  icon: React.ElementType;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  exact?: boolean;
  children?: NavChild[];
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { data: user } = useGetMe();
  const logoutMutation = useLogout();
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isOrdersSection = location.startsWith("/admin/orders");
  const isCommissionsSection = location.startsWith("/admin/referral-commissions") || location.startsWith("/admin/bonuses") || location.startsWith("/admin/bpp") || location.startsWith("/admin/commissions") || location.startsWith("/admin/pro-booking-commissions");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Orders: isOrdersSection,
    Commissions: isCommissionsSection,
  });

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.removeQueries({ queryKey: ["/api/auth/me"] });
        queryClient.clear();
        logout();
        window.location.href = "/login";
      }
    });
  };

  const toggleGroup = (name: string) => {
    setOpenGroups(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const navItems: NavItem[] = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Products", href: "/admin/products", icon: ShoppingBag },
    {
      name: "Orders",
      href: "/admin/orders",
      icon: ShoppingBag,
      exact: true,
      children: [
        { name: "Awaiting Approval", href: "/admin/orders/awaiting", icon: Clock },
        { name: "Orders For Approval", href: "/admin/orders/approval", icon: ShieldCheck },
      ],
    },
    { name: "Categories", href: "/admin/categories", icon: FolderTree },
    { name: "Shop", href: "/shop", icon: Store },
    { name: "Registration Packages", href: "/admin/pro-packages", icon: PackageCheck },
    {
      name: "Commissions",
      href: "/admin/commissions",
      icon: Award,
      exact: true,
      children: [
        { name: "Referral Commissions", href: "/admin/referral-commissions", icon: Gift },
        { name: "Pro Member Bonuses", href: "/admin/bonuses", icon: Star },
        { name: "Bill Payer Program", href: "/admin/bpp", icon: Home },
        { name: "Pro Booking Commissions", href: "/admin/pro-booking-commissions", icon: Briefcase },
      ],
    },
    { name: "Payouts", href: "/admin/payouts", icon: Banknote },
    { name: "Bookings", href: "/admin/bookings", icon: Calendar },
    { name: "Professionals", href: "/admin/professionals", icon: Users },
    { name: "Messages", href: "/admin/messages", icon: MessageSquare },
    { name: "Promos", href: "/admin/promos", icon: Tag },
    { name: "Administrative Settings", href: "/admin/settings", icon: Settings },
    { name: "Pro Compensation Settings", href: "/admin/compensation", icon: Percent },
    { name: "Reports", href: "/admin/reports", icon: BarChart },
    { name: "Genealogy", href: "/admin/genealogy", icon: Network },
    { name: "Profile Management", href: "/admin/profile", icon: UserCircle },
  ];

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/80 md:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#0a0a0a] text-white border-r border-white/10 transform transition-transform duration-200 ease-in-out flex flex-col
        md:translate-x-0 md:static md:block
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span className="font-serif text-xl font-bold tracking-tighter text-primary">NFGN Admin</span>
          </Link>
          <div className="ml-auto flex items-center gap-1">
            <span className="hidden md:flex text-foreground"><NotificationBell align="left" /></span>
            <Button variant="ghost" size="icon" className="md:hidden text-white hover:text-white/80 hover:bg-white/10" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium leading-none">{user?.firstName} {user?.lastName}</span>
              <span className="text-xs text-white/60 mt-1">{user?.role ? roleLabel(user.role) : ""}</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = item.exact
              ? location === item.href
              : item.href === '/admin'
              ? location === '/admin'
              : location.startsWith(item.href);

            const isGroupOpen = openGroups[item.name] ?? false;
            const hasChildren = item.children && item.children.length > 0;

            return (
              <div key={item.name}>
                {hasChildren ? (
                  <>
                    {/* Parent row: clicking left side navigates, clicking chevron toggles */}
                    <div className={`
                      flex items-center rounded-md text-sm font-medium transition-colors
                      ${isActive ? "bg-primary text-primary-foreground" : "text-white/70 hover:bg-white/10 hover:text-white"}
                    `}>
                      <Link href={item.href} className="flex items-center gap-3 flex-1 px-3 py-2.5">
                        <item.icon className="flex-shrink-0 h-4 w-4" />
                        {item.name}
                      </Link>
                      <button
                        onClick={() => toggleGroup(item.name)}
                        className="px-2 py-2.5 hover:text-white transition-colors"
                        aria-label={isGroupOpen ? "Collapse" : "Expand"}
                      >
                        {isGroupOpen
                          ? <ChevronDown className="h-3.5 w-3.5" />
                          : <ChevronRight className="h-3.5 w-3.5" />
                        }
                      </button>
                    </div>

                    {/* Children */}
                    {isGroupOpen && (
                      <div className="ml-4 mt-0.5 border-l border-white/20 pl-2 space-y-0.5">
                        {item.children!.map((child) => {
                          const childActive = location === child.href || location.startsWith(child.href);
                          return (
                            <Link key={child.name} href={child.href}>
                              <span className={`
                                flex items-center gap-2.5 rounded-md text-sm font-medium transition-colors px-3 py-2
                                ${childActive
                                  ? "bg-primary/80 text-primary-foreground"
                                  : "text-white/55 hover:bg-white/10 hover:text-white"
                                }
                              `}>
                                <child.icon className="flex-shrink-0 h-3.5 w-3.5" />
                                {child.name}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <Link href={item.href}>
                    <span className={`
                      flex items-center gap-3 rounded-md text-sm font-medium transition-colors px-3 py-2.5
                      ${isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                      }
                    `}>
                      <item.icon className="flex-shrink-0 h-4 w-4" />
                      {item.name}
                    </span>
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-1">
          <a href="/dashboard" className="flex items-center gap-3 w-full rounded-md px-3 py-2.5 text-sm font-medium text-primary hover:bg-primary/20 transition-colors border border-primary/30">
            <Star className="h-4 w-4 flex-shrink-0" />
            My Member Dashboard
          </a>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10" 
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 bg-background">
        <header className="h-16 flex items-center px-4 md:px-6 border-b bg-card md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="ml-4 font-serif font-bold text-primary flex-1">Admin Panel</span>
          <NotificationBell />
        </header>
        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
