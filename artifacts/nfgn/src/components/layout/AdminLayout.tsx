import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { 
  LayoutDashboard, Users, ShoppingBag, FolderTree, 
  Award, Banknote, Calendar, Settings,
  MessageSquare, Tag, BarChart, LogOut, Menu, X,
  ShieldCheck, Network, Star, Percent, Gift, Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { roleLabel } from "@/lib/labels";

export function AdminLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { data: user } = useGetMe();
  const logoutMutation = useLogout();
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        logout();
        window.location.href = "/login";
      }
    });
  };

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Products", href: "/admin/products", icon: ShoppingBag },
    { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
    { name: "Categories", href: "/admin/categories", icon: FolderTree },
    { name: "Commissions", href: "/admin/commissions", icon: Award },
    { name: "Referral Commissions", href: "/admin/referral-commissions", icon: Gift },
    { name: "Pro Compensation Settings", href: "/admin/compensation", icon: Percent },
    { name: "Pro Member Bonuses", href: "/admin/bonuses", icon: Star },
    { name: "Bill Payer Program", href: "/admin/bpp", icon: Home },
    { name: "Payouts", href: "/admin/payouts", icon: Banknote },
    { name: "Bookings", href: "/admin/bookings", icon: Calendar },
    { name: "Professionals", href: "/admin/professionals", icon: Users },
    { name: "Messages", href: "/admin/messages", icon: MessageSquare },
    { name: "Promos", href: "/admin/promos", icon: Tag },
    { name: "Settings", href: "/admin/settings", icon: Settings },
    { name: "Reports", href: "/admin/reports", icon: BarChart },
    { name: "Genealogy", href: "/admin/genealogy", icon: Network },
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
          <Button variant="ghost" size="icon" className="ml-auto md:hidden text-white hover:text-white/80 hover:bg-white/10" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
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

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            // Exact match for /admin to avoid highlighting it for all routes
            const isActive = item.href === '/admin' ? location === '/admin' : location.startsWith(item.href);
            return (
              <Link key={item.name} href={item.href}>
                <span className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors
                  ${isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                  }
                `}>
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
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
          <span className="ml-4 font-serif font-bold text-primary">Admin Panel</span>
        </header>
        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
