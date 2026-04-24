import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard, ShoppingBag, Wallet, Users,
  Award, Banknote, Calendar, Inbox, UserCircle,
  BarChart3, LogOut, Menu, X, UserPlus, ArrowRightLeft,
  TrendingUp, Wrench, Home, Star, BookOpen, DollarSign,
  ChevronDown, ChevronRight, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { roleLabel } from "@/lib/labels";
import { NotificationBell } from "@/components/dashboard/NotificationBell";

type NavChild = { name: string; href: string };

type NavItem =
  | { name: string; href: string; icon: any; exact?: boolean; group?: never; children?: never }
  | { name: string; href?: never; icon: any; group: string; children: NavChild[]; exact?: never };

const navItems: NavItem[] = [
  { name: "Overview",           href: "/dashboard",                   icon: LayoutDashboard },
  { name: "Profile Management", href: "/dashboard/profile",           icon: UserCircle },
  { name: "Genealogy",          href: "/dashboard/genealogy",         icon: Users },
  { name: "Registration",       href: "/dashboard/registration",      icon: UserPlus },
  { name: "User Earnings",      href: "/dashboard/earnings",          icon: TrendingUp },
  { name: "Orders",             href: "/dashboard/orders",            icon: ShoppingBag },
  { name: "E-Wallet",           href: "/dashboard/wallet",            icon: Wallet },
  { name: "Transfer Funds",     href: "/dashboard/transfer",          icon: ArrowRightLeft },
  { name: "Payouts",            href: "/dashboard/payouts",           icon: Banknote },
  { name: "Commissions",        href: "/dashboard/commissions",       icon: Award },
  { name: "Pro Member Bonus",   href: "/dashboard/pro-member-bonuses", icon: Star },
  { name: "Bill Payer Program", href: "/dashboard/bpp",               icon: Home },
  { name: "Bookings",           href: "/dashboard/bookings",          icon: Calendar },
  { name: "Mailbox",            href: "/dashboard/mailbox",           icon: Inbox },
  { name: "Tools",              href: "/dashboard/tools",             icon: Wrench, exact: true },
  {
    name: "Comp Plan",
    icon: DollarSign,
    group: "comp-plan",
    children: [
      { name: "Overview",                href: "/dashboard/comp-plan?s=overview" },
      { name: "Referral Commission",     href: "/dashboard/comp-plan?s=rc" },
      { name: "Product Sales Comm.",     href: "/dashboard/comp-plan?s=psc" },
      { name: "Multi-Level Retail",      href: "/dashboard/comp-plan?s=pmrc" },
      { name: "Power Squad Bonuses",     href: "/dashboard/comp-plan?s=psb" },
      { name: "Bill Payer Program",      href: "/dashboard/comp-plan?s=bpp" },
    ],
  },
  {
    name: "Basic Training",
    icon: BookOpen,
    group: "training",
    children: [
      { name: "Getting Started",    href: "/dashboard/tools/training?s=getting-started" },
      { name: "Comp Plan",          href: "/dashboard/tools/training?s=comp-plan" },
      { name: "$3,500/Month Plan",  href: "/dashboard/tools/training?s=2500-plan" },
      { name: "Bill Payer Program", href: "/dashboard/tools/training?s=bpp" },
      { name: "90-Day Plan",        href: "/dashboard/tools/training?s=90-day" },
      { name: "IGNITE Training",    href: "/dashboard/tools/training?s=ignite" },
      { name: "Earn Big Bonuses",   href: "/dashboard/tools/training?s=big-bonuses" },
      { name: "Additional Training", href: "/dashboard/tools/training?s=additional" },
    ],
  },
  { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
];

function isGroupOpen(group: string, location: string): boolean {
  if (group === "comp-plan") return location.startsWith("/dashboard/comp-plan");
  if (group === "training") return location.startsWith("/dashboard/tools/training");
  return false;
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [location, navigate] = useLocation();
  const { data: user } = useGetMe();
  const logoutMutation = useLogout();
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    navItems.forEach(item => {
      if (item.group) init[item.group] = isGroupOpen(item.group, location);
    });
    return init;
  });

  const toggleGroup = (group: string) => {
    setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.removeQueries({ queryKey: ["/api/auth/me"] });
        queryClient.clear();
        logout();
        window.location.href = "/login";
      },
    });
  };

  return (
    <div className="min-h-screen flex bg-muted/30">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/80 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-200 ease-in-out flex flex-col
        md:translate-x-0 md:static md:block
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="h-16 flex items-center px-6 border-b">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-serif text-2xl font-bold tracking-tighter text-primary">NFGN</span>
          </Link>
          <div className="ml-auto flex items-center gap-1">
            <span className="hidden md:flex"><NotificationBell align="left" /></span>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium leading-none">{user?.firstName} {user?.lastName}</span>
              {(user as any)?.proMemberStatus === "pending_approval" ? (
                <span className="text-xs font-semibold mt-1" style={{ color: "#C9A84C" }}>⏳ Pro Member — Awaiting Approval</span>
              ) : (
                <span className="text-xs text-muted-foreground mt-1">{user?.role ? roleLabel(user.role) : ""}</span>
              )}
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {navItems.map(item => {
            if (item.group) {
              const open = openGroups[item.group] ?? false;
              const anyChildActive = item.children.some(c => location.startsWith(c.href.split("?")[0]));
              return (
                <div key={item.group}>
                  <button
                    onClick={() => toggleGroup(item.group)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors
                      ${anyChildActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1 text-left">{item.name}</span>
                    {open
                      ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    }
                  </button>

                  {open && (
                    <div className="ml-3 mt-0.5 border-l border-border pl-3 space-y-0.5">
                      {item.children.map(child => {
                        const childPath = child.href.split("?")[0];
                        const childSearch = child.href.includes("?") ? child.href.split("?")[1] : "";
                        const childParam = childSearch ? new URLSearchParams(childSearch).get("s") : "";
                        const isChildActive =
                          location === childPath &&
                          (childParam
                            ? (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("s") === childParam)
                            : true);
                        return (
                          <button
                            key={child.name}
                            onClick={() => {
                              navigate(child.href);
                              window.dispatchEvent(new CustomEvent("nfgn:nav", { detail: { href: child.href } }));
                            }}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors text-left
                              ${isChildActive
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                              }`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current flex-shrink-0" />
                            {child.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const isActive = item.exact
              ? location === item.href
              : location === item.href || location.startsWith(`${item.href}/`);

            return (
              <Link key={item.name} href={item.href!}>
                <span
                  className={`flex items-center gap-3 rounded-md text-sm font-medium transition-colors px-3 py-2.5
                    ${isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center px-4 md:px-6 border-b bg-card md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="ml-4 font-serif font-bold text-primary flex-1">Member Dashboard</span>
          <NotificationBell />
        </header>
        {user && ["super_admin", "admin", "store_admin"].includes(user.role) && (
          <div className="bg-[#0a0a0a] text-white px-4 md:px-6 py-2 flex items-center gap-3 text-sm">
            <ShieldCheck className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="text-white/70">You are viewing your <span className="text-primary font-semibold">Member Dashboard</span> as an admin.</span>
            <a href="/admin" className="ml-auto flex-shrink-0 text-primary hover:text-primary/80 font-medium flex items-center gap-1.5 transition-colors">
              ← Back to Admin Panel
            </a>
          </div>
        )}
        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
