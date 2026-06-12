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
  ChevronDown, ChevronRight, ShieldCheck, Link2, Sparkles,
  CreditCard, Zap, Store, CalendarDays, Heart, RefreshCw, Calculator, Leaf,
  BookMarked, Pen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { roleLabel, tierLabel } from "@/lib/labels";
import { NotificationBell } from "@/components/dashboard/NotificationBell";

const GOLD = "#C9A84C";
const DARK = "#0a0a0a";

// ── Tier system ────────────────────────────────────────────────────────────────
export type MemberTier = "retail_member" | "referring_retail_member" | "retail_community_builder" | "associate_pro_member" | "pro_member";
const TIER_ORDER: MemberTier[] = ["retail_member", "referring_retail_member", "retail_community_builder", "associate_pro_member", "pro_member"];

export function getEffectiveTier(user: any): MemberTier {
  if (!user) return "retail_member";
  if (["super_admin", "admin", "store_admin", "pro_member"].includes(user.role)) return "pro_member";
  return (user.memberTier ?? "retail_member") as MemberTier;
}

export function tierAtLeast(userTier: MemberTier, minTier: MemberTier): boolean {
  return TIER_ORDER.indexOf(userTier) >= TIER_ORDER.indexOf(minTier);
}

// ── Nav types ─────────────────────────────────────────────────────────────────
type NavChild = { name: string; href: string; minTier?: MemberTier };
type NavItem =
  | { name: string; href: string; icon: any; exact?: boolean; minTier?: MemberTier; group?: never; children?: never; badge?: string }
  | { name: string; href?: never; icon: any; group: string; children: NavChild[]; minTier?: MemberTier; exact?: never; badge?: string };

// ── Nav sections ──────────────────────────────────────────────────────────────
const NAV_SECTIONS: { label?: string; items: NavItem[]; minTier?: MemberTier }[] = [
  {
    items: [
      { name: "Overview",           href: "/dashboard",           icon: LayoutDashboard, exact: true },
      { name: "Profile Management", href: "/dashboard/profile",   icon: UserCircle },
      { name: "Genealogy",          href: "/dashboard/genealogy", icon: Users, minTier: "retail_community_builder" },
      {
        name: "Registration", icon: UserPlus, group: "registration", minTier: "retail_community_builder",
        children: [
          { name: "Register New Member",          href: "/dashboard/registration" },
          { name: "Registration Hub",             href: "/dashboard/registration" },
          { name: "Register A New Pro Member",    href: "/dashboard/register-new-pro" },
          { name: "New Member Registration List", href: "/dashboard/member-outreach" },
        ],
      },
    ],
  },
  {
    label: "E-Commerce",
    items: [
      { name: "Shop",               href: "/shop",                    icon: Store },
      { name: "Bookings",           href: "/dashboard/bookings",      icon: Calendar },
      { name: "Pay As You Go",      href: "/dashboard/payg-bookings", icon: Zap },
      { name: "Send A Gift/Donation", href: "/shop?section=giving",   icon: Heart },
      {
        name: "NFGN Books",
        icon: BookOpen, group: "bookstore",
        children: [
          { name: "Browse Books",   href: "/dashboard/bookstore" },
          { name: "My Library",     href: "/dashboard/library" },
          { name: "Become an Author",   href: "/dashboard/author/apply" },
        ],
      },
    ],
  },
  {
    label: "My Account",
    items: [
      { name: "Orders",               href: "/dashboard/orders",            icon: ShoppingBag },
      { name: "Subscriptions",        href: "/dashboard/subscriptions",     icon: RefreshCw },
      { name: "Mailbox",              href: "/dashboard/mailbox",           icon: Inbox },
      { name: "My Referral Link",     href: "/dashboard/referral",          icon: Link2 },
      { name: "Get the App",          href: "/dashboard/tools/get-the-app", icon: Home },
      {
        name: "Commissions", icon: Award, group: "commissions-sub", minTier: "retail_community_builder",
        children: [
          { name: "Commissions",      href: "/dashboard/commissions" },
          { name: "User Earnings",    href: "/dashboard/earnings" },
          { name: "E-Wallet",         href: "/dashboard/wallet" },
          { name: "Transfer Funds",   href: "/dashboard/transfer" },
          { name: "Payouts",          href: "/dashboard/payouts" },
          { name: "Pro Member Bonus", href: "/dashboard/pro-member-bonuses" },
        ],
      },
    ],
  },
  {
    label: "Services",
    items: [
      {
        name: "NFGN Health & Wellness",
        icon: Leaf, group: "health",
        children: [
          { name: "Wellness Hub",              href: "/dashboard/health" },
          { name: "My Health Profile",         href: "/dashboard/health/profile" },
          { name: "Herb & Supplement Library", href: "/dashboard/health/library" },
          { name: "Weight & Water Tracker",    href: "/dashboard/health/tracker" },
          { name: "Calorie Tracker",           href: "/dashboard/health/education" },
          { name: "Nutrition Guide",           href: "/dashboard/health/nutrition" },
          { name: "Exercise Plans",            href: "/dashboard/health/exercise" },
          { name: "AI Health Assistant",       href: "/dashboard/health/ai-assistant" },
        ],
      },
      {
        name: "NFGN Basic Training",
        icon: BookOpen, group: "training", minTier: "retail_community_builder",
        children: [
          { name: "Getting Started",     href: "/dashboard/tools/training?s=getting-started" },
          { name: "Comp Plan",           href: "/dashboard/tools/training?s=comp-plan" },
          { name: "$3,500/Month Plan",   href: "/dashboard/tools/training?s=2500-plan" },
          { name: "Bill Payer Program",  href: "/dashboard/tools/training?s=bpp" },
          { name: "90-Day Plan",         href: "/dashboard/tools/training?s=90-day" },
          { name: "IGNITE Training",     href: "/dashboard/tools/training?s=ignite" },
          { name: "Earn Big Bonuses",    href: "/dashboard/tools/training?s=big-bonuses" },
          { name: "Additional Training", href: "/dashboard/tools/training?s=additional" },
          { name: "Add App to Phone",    href: "/dashboard/tools/training?s=app-setup" },
        ],
      },
    ],
  },
  {
    label: "Dollar Credit ($-Credit)",
    minTier: "referring_retail_member",
    items: [
      { name: "My $-Credit Wallet", href: "/dashboard/wallet", icon: CreditCard, minTier: "referring_retail_member" },
    ],
  },
  {
    label: "Resources",
    items: [
      {
        name: "Comp Plan",
        icon: DollarSign, group: "comp-plan", minTier: "pro_member",
        children: [
          { name: "Overview",            href: "/dashboard/comp-plan?s=overview" },
          { name: "Referral Commission", href: "/dashboard/comp-plan?s=rc" },
          { name: "Product Sales Comm.", href: "/dashboard/comp-plan?s=psc" },
          { name: "Multi-Level Retail",  href: "/dashboard/comp-plan?s=pmrc" },
          { name: "Power Squad Bonuses", href: "/dashboard/comp-plan?s=psb" },
          { name: "Bill Payer Program",  href: "/dashboard/comp-plan?s=bpp" },
        ],
      },
      {
        name: "Tools",
        icon: Wrench, group: "tools", minTier: "pro_member",
        children: [
          { name: "Tools Overview",              href: "/dashboard/tools" },
          { name: "Vision Goals & Dreams Sheet", href: "/dashboard/tools/vision-goals" },
          { name: "Da' Money Calculator",        href: "/dashboard/calculator" },
        ],
      },
      { name: "Bill Payer Program", href: "/dashboard/bpp",     icon: Home,     minTier: "pro_member" },
      { name: "Reports",            href: "/dashboard/reports", icon: BarChart3, minTier: "pro_member" },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function isGroupOpen(group: string, location: string): boolean {
  if (group === "comp-plan")       return location.startsWith("/dashboard/comp-plan");
  if (group === "training")        return location.startsWith("/dashboard/tools/training");
  if (group === "registration")    return location.startsWith("/dashboard/registration") || location.startsWith("/dashboard/register-new-pro") || location.startsWith("/dashboard/member-outreach");
  if (group === "commissions-sub") return location.startsWith("/dashboard/commissions") || location.startsWith("/dashboard/earnings") || location.startsWith("/dashboard/wallet") || location.startsWith("/dashboard/transfer") || location.startsWith("/dashboard/payouts") || location.startsWith("/dashboard/pro-member-bonuses");
  if (group === "tools")           return location.startsWith("/dashboard/tools") || location.startsWith("/dashboard/calculator");
  if (group === "health")          return location.startsWith("/dashboard/health");
  if (group === "bookstore")       return location.startsWith("/dashboard/bookstore") || location.startsWith("/dashboard/library") || location.startsWith("/dashboard/read") || location.startsWith("/dashboard/author");
  return false;
}

// ── Sub-components ────────────────────────────────────────────────────────────
function SidebarSectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 pt-5 pb-1">
      <span className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: `${GOLD}70` }}>{label}</span>
      <span className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${GOLD}30, transparent)` }} />
    </div>
  );
}

function NavGroupItem({
  item, location, openGroups, toggleGroup, navigate, closeSidebar,
}: {
  item: Extract<NavItem, { group: string }>;
  location: string;
  openGroups: Record<string, boolean>;
  toggleGroup: (g: string) => void;
  navigate: (href: string) => void;
  closeSidebar: () => void;
}) {
  const open = openGroups[item.group] ?? false;
  const anyChildActive = item.children.some(c => location.startsWith(c.href.split("?")[0]));

  return (
    <div>
      <button
        onClick={() => toggleGroup(item.group)}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150 group relative"
        style={{
          color: anyChildActive ? GOLD : "rgba(255,255,255,0.55)",
          background: anyChildActive ? `${GOLD}12` : "transparent",
          borderLeft: anyChildActive ? `2px solid ${GOLD}` : "2px solid transparent",
        }}
      >
        <item.icon className="h-4 w-4 flex-shrink-0" style={{ color: anyChildActive ? GOLD : "rgba(255,255,255,0.4)" }} />
        <span className="flex-1 text-left">{item.name}</span>
        {open
          ? <ChevronDown className="h-3.5 w-3.5 opacity-50" />
          : <ChevronRight className="h-3.5 w-3.5 opacity-30" />
        }
      </button>

      {open && (
        <div className="ml-4 mt-0.5 border-l pl-3 space-y-0.5" style={{ borderColor: `${GOLD}25` }}>
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
                  closeSidebar();
                }}
                className="w-full flex items-center gap-2.5 px-2 py-1.5 text-xs font-medium transition-all text-left"
                style={{
                  color: isChildActive ? GOLD : "rgba(255,255,255,0.45)",
                  background: isChildActive ? `${GOLD}15` : "transparent",
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full flex-shrink-0 transition-all"
                  style={{ background: isChildActive ? GOLD : "rgba(255,255,255,0.25)" }}
                />
                {child.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Upgrade nudge shown at the bottom of the sidebar for non-pro members */
function UpgradeNudge({ tier }: { tier: MemberTier }) {
  if (tier === "pro_member") return null;
  return (
    <div
      className="mx-3 mb-3 rounded-xl p-3 cursor-pointer"
      style={{
        background: `linear-gradient(135deg, ${GOLD}20, ${GOLD}08)`,
        border: `1px solid ${GOLD}40`,
      }}
      onClick={() => window.location.href = "/pro-join"}
    >
      <div className="flex items-center gap-2 mb-1">
        <Zap className="h-3.5 w-3.5 flex-shrink-0" style={{ color: GOLD }} />
        <span className="text-xs font-bold" style={{ color: GOLD }}>Upgrade to Pro Member</span>
      </div>
      <p className="text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
        Unlock commissions, bonuses, the full Business Suite, and the ability to cash out your $-Credit.
      </p>
    </div>
  );
}

// ── Main layout ───────────────────────────────────────────────────────────────
export function DashboardLayout({ children }: { children: ReactNode }) {
  const [location, navigate] = useLocation();
  const { data: user } = useGetMe();
  const logoutMutation = useLogout();
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const effectiveTier = getEffectiveTier(user);

  const allNavItems = NAV_SECTIONS.flatMap(s => s.items);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    allNavItems.forEach(item => {
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

  const initials = `${user?.firstName?.charAt(0) ?? ""}${user?.lastName?.charAt(0) ?? ""}`;

  // Filter section/item visibility by tier
  const visibleSections = NAV_SECTIONS
    .filter(section => !section.minTier || tierAtLeast(effectiveTier, section.minTier))
    .map(section => ({
      ...section,
      items: section.items.filter(item => !item.minTier || tierAtLeast(effectiveTier, item.minTier)),
    }))
    .filter(section => section.items.length > 0);

  // Inject provider-only availability section for Book-A-Pro providers
  if ((user as any)?.isBookAProProvider) {
    const hasProviderSection = visibleSections.some(s => s.label === "My Professional Services");
    if (!hasProviderSection) {
      visibleSections.push({
        label: "My Professional Services",
        items: [
          { name: "Manage Availability", href: "/dashboard/pro-availability", icon: CalendarDays },
          { name: "Pay As You Go Back-Office", href: "/dashboard/payg-provider", icon: Zap },
        ],
      });
    }
  }
  // Any pro member can access PAYG provider tools (not just Book-A-Pro providers)
  if (user?.role === "pro_member" && !(user as any)?.isBookAProProvider) {
    const hasPaygSection = visibleSections.some(s => s.label === "Pay As You Go");
    if (!hasPaygSection) {
      visibleSections.push({
        label: "Pay As You Go",
        items: [{ name: "PAYG Back-Office", href: "/dashboard/payg-provider", icon: Zap }],
      });
    }
  }

  // Display label for member tier
  const displayLabel = (() => {
    if (!user) return "";
    if ((user as any).proMemberStatus === "pending_approval") return null;
    if (["super_admin", "admin", "store_admin"].includes(user.role)) return roleLabel(user.role);
    if (user.role === "pro_member") return "Pro Member";
    return tierLabel((user as any).memberTier ?? "retail_member");
  })();

  return (
    <div className="min-h-screen flex" style={{ background: "#f4f3f0" }}>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 flex flex-col
          transform transition-transform duration-300 ease-in-out
          md:translate-x-0 md:static md:block
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{
          background: "linear-gradient(180deg, #111111 0%, #0a0a0a 100%)",
          borderRight: `1px solid rgba(201,168,76,0.15)`,
        }}
      >
        {/* Logo row */}
        <div
          className="h-16 flex items-center px-5 flex-shrink-0"
          style={{ borderBottom: `1px solid rgba(201,168,76,0.15)` }}
        >
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex flex-col leading-none">
              <span
                className="font-serif text-2xl font-black tracking-tighter transition-colors"
                style={{ color: GOLD }}
              >
                NFGN
              </span>
              <span className="text-[8px] font-bold tracking-[0.25em] uppercase" style={{ color: `${GOLD}60` }}>
                Global Network
              </span>
            </div>
          </Link>

          <div className="ml-auto flex items-center gap-1">
            <div className="hidden md:flex" style={{ color: "rgba(255,255,255,0.7)" }}>
              <NotificationBell align="left" />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-white/60 hover:text-white hover:bg-white/10"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* User profile */}
        <div className="px-4 py-4 flex-shrink-0" style={{ borderBottom: `1px solid rgba(201,168,76,0.1)` }}>
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-black"
                style={{
                  background: `linear-gradient(135deg, ${GOLD}40, ${GOLD}20)`,
                  border: `2px solid ${GOLD}`,
                  color: GOLD,
                  boxShadow: `0 0 12px ${GOLD}40`,
                }}
              >
                {initials || "?"}
              </div>
              <span
                className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2"
                style={{ background: "#22c55e", borderColor: DARK }}
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-white/90 truncate leading-none">
                {user?.firstName} {user?.lastName}
              </span>
              {(user as any)?.proMemberStatus === "pending_approval" ? (
                <span className="text-[10px] font-bold mt-1 flex items-center gap-1" style={{ color: GOLD }}>
                  <span>⏳</span> Awaiting Approval
                </span>
              ) : (
                <span className="text-[11px] mt-1 font-medium" style={{ color: `${GOLD}80` }}>
                  {displayLabel}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 space-y-0.5 sidebar-scroll">
          {visibleSections.map((section, si) => (
            <div key={si}>
              {section.label && <SidebarSectionLabel label={section.label} />}
              {section.items.map(item => {
                if (item.group) {
                  return (
                    <NavGroupItem
                      key={item.group}
                      item={item as Extract<NavItem, { group: string }>}
                      location={location}
                      openGroups={openGroups}
                      toggleGroup={toggleGroup}
                      navigate={navigate}
                      closeSidebar={() => setSidebarOpen(false)}
                    />
                  );
                }

                const isActive = item.exact
                  ? location === item.href
                  : location === item.href || location.startsWith(`${item.href}/`);

                return (
                  <Link key={item.name} href={item.href!}>
                    <span
                      onClick={() => setSidebarOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer"
                      style={{
                        color: isActive ? GOLD : "rgba(255,255,255,0.55)",
                        background: isActive ? `${GOLD}12` : "transparent",
                        borderLeft: isActive ? `2px solid ${GOLD}` : "2px solid transparent",
                      }}
                    >
                      <item.icon
                        className="h-4 w-4 flex-shrink-0 transition-colors"
                        style={{ color: isActive ? GOLD : "rgba(255,255,255,0.35)" }}
                      />
                      {item.name}
                      {item.badge && (
                        <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: GOLD, color: "#000" }}>
                          {item.badge}
                        </span>
                      )}
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Upgrade nudge for non-PM */}
        <UpgradeNudge tier={effectiveTier} />

        {/* Logout */}
        <div className="flex-shrink-0 px-3 py-4" style={{ borderTop: `1px solid rgba(201,168,76,0.12)` }}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded transition-all duration-150 group"
            style={{ color: "rgba(255,255,255,0.4)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header
          className="h-16 flex items-center px-4 md:hidden flex-shrink-0"
          style={{
            background: DARK,
            borderBottom: `1px solid rgba(201,168,76,0.2)`,
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center justify-center h-9 w-9 rounded transition-colors"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="ml-4 font-serif font-bold flex-1" style={{ color: GOLD }}>
            NFGN
          </span>
          <div style={{ color: "rgba(255,255,255,0.7)" }}>
            <NotificationBell />
          </div>
        </header>

        {/* Admin banner */}
        {user && ["super_admin", "admin", "store_admin"].includes(user.role) && (
          <div
            className="px-5 py-2.5 flex items-center gap-3 text-sm flex-shrink-0"
            style={{
              background: "linear-gradient(90deg, #0a0a0a, #1a0f00, #0a0a0a)",
              borderBottom: `1px solid ${GOLD}30`,
            }}
          >
            <ShieldCheck className="h-4 w-4 flex-shrink-0" style={{ color: GOLD }} />
            <span style={{ color: "rgba(255,255,255,0.6)" }}>
              Viewing your{" "}
              <span className="font-semibold" style={{ color: GOLD }}>
                Member Dashboard
              </span>{" "}
              as admin
            </span>
            <a
              href="/admin"
              className="ml-auto flex-shrink-0 flex items-center gap-1.5 font-semibold text-sm transition-colors"
              style={{ color: GOLD }}
            >
              ← Admin Panel
            </a>
          </div>
        )}

        {/* Page content */}
        <div
          className="flex-1 overflow-auto"
          style={{ background: "linear-gradient(160deg, #f7f6f3 0%, #f1f0ec 100%)" }}
        >
          <div className="p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
