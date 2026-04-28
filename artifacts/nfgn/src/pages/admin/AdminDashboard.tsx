import { useState } from "react";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import {
  DollarSign, ShoppingCart, Users, UserCheck, TrendingUp, BarChart3,
  LayoutDashboard, AlertTriangle, Package, Clock, CreditCard,
  ArrowRight, Calendar, CheckCircle2, Zap, Star, Activity,
  ChevronRight, ExternalLink, Truck, CalendarClock,
} from "lucide-react";
import { roleLabel } from "@/lib/labels";
import { MemberMapCard } from "@/components/dashboard/MemberMapCard";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
} from "recharts";

const GOLD = "#C9A84C";
const GREEN = "#2D6A4F";
const DARK = "#0a0a0a";

type Period = "today" | "week" | "month" | "alltime";

const PERIOD_LABELS: Record<Period, string> = {
  today: "Today",
  week: "This Week",
  month: "This Month",
  alltime: "All Time",
};

function UrgentCard({
  label, count, sub, icon, href, color, pulse,
}: {
  label: string; count: number; sub?: string; icon: React.ReactNode;
  href: string; color: string; pulse?: boolean;
}) {
  return (
    <Link href={href}>
      <div
        className={`relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 group ${
          count > 0 ? `border-${color}-400 bg-${color}-50` : "border-border bg-card"
        }`}
        style={count > 0 ? {
          borderColor: color === "red" ? "#f87171" : color === "amber" ? "#fbbf24" : color === "blue" ? "#60a5fa" : "#6ee7b7",
          background: color === "red" ? "#fff1f2" : color === "amber" ? "#fffbeb" : color === "blue" ? "#eff6ff" : "#f0fdf4",
        } : {}}
      >
        {pulse && count > 0 && (
          <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75`}
              style={{ background: color === "red" ? "#ef4444" : color === "amber" ? "#f59e0b" : "#3b82f6" }} />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5"
              style={{ background: color === "red" ? "#ef4444" : color === "amber" ? "#f59e0b" : "#3b82f6" }} />
          </span>
        )}
        <div
          className="h-11 w-11 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: count > 0
              ? (color === "red" ? "#fecaca" : color === "amber" ? "#fde68a" : color === "blue" ? "#bfdbfe" : "#bbf7d0")
              : "#f1f5f9",
            color: count > 0
              ? (color === "red" ? "#dc2626" : color === "amber" ? "#d97706" : color === "blue" ? "#2563eb" : "#059669")
              : "#94a3b8",
          }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold leading-tight"
            style={{ color: count > 0 ? (color === "red" ? "#dc2626" : color === "amber" ? "#d97706" : color === "blue" ? "#2563eb" : "#059669") : "#0f172a" }}>
            {count}
          </p>
          {sub && <p className="text-xs text-muted-foreground truncate">{sub}</p>}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
      </div>
    </Link>
  );
}

function MetricCard({
  label, value, icon, trend, sub, gold,
}: {
  label: string; value: string; icon: React.ReactNode; trend?: string; sub?: string; gold?: boolean;
}) {
  return (
    <Card className="relative overflow-hidden border-0 shadow-sm" style={{ background: gold ? `linear-gradient(135deg, ${GOLD}20, ${GOLD}05)` : "" }}>
      <div className="absolute top-0 right-0 h-16 w-16 opacity-5" style={{ background: gold ? GOLD : GREEN, borderRadius: "0 0 0 100%" }} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: gold ? `${GOLD}25` : `${GREEN}15`, color: gold ? GOLD : GREEN }}>
            {icon}
          </div>
        </div>
        {trend && (
          <div className="flex items-center gap-1 mt-3 text-xs font-medium text-green-600">
            <TrendingUp className="h-3 w-3" />
            {trend}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OrderRow({ order }: { order: any }) {
  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    processing: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    refunded: "bg-slate-100 text-slate-700",
  };
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/40 last:border-0 group">
      <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
        style={{ background: `linear-gradient(135deg, ${GOLD}, ${GREEN})` }}>
        {order.userName?.[0] ?? "?"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{order.userName}</p>
        <p className="text-xs text-muted-foreground">#{order.orderNumber} · {new Date(order.createdAt).toLocaleDateString()}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-semibold">${order.total.toFixed(2)}</p>
        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${statusColors[order.paymentStatus] ?? "bg-slate-100 text-slate-700"}`}>
          {order.paymentStatus}
        </span>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const { data, isLoading } = useGetDashboardSummary();
  const [period, setPeriod] = useState<Period>("month");

  const d = data as any;

  const periodRevenue = period === "today" ? d?.revenueToday
    : period === "week" ? d?.revenueThisWeek
    : period === "month" ? d?.revenueThisMonth
    : d?.totalSales;

  const periodOrders = period === "today" ? d?.ordersToday
    : period === "week" ? d?.ordersThisWeek
    : period === "month" ? d?.ordersThisMonth
    : d?.totalOrders;

  const periodMembers = period === "today" ? d?.newMembersToday
    : period === "week" ? d?.newMembersThisWeek
    : period === "month" ? d?.newMembersThisMonth
    : d?.activeMembers;

  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";

  const totalUrgent = (d?.pendingOrdersCount ?? 0) + (d?.processingOrdersCount ?? 0) + (d?.pendingBookingsCount ?? 0) + (d?.pendingPayoutsCount ?? 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{greeting} · {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
          <h1 className="text-2xl font-serif font-bold" style={{ color: GOLD }}>
            Command Center
            {totalUrgent > 0 && (
              <span className="ml-3 inline-flex items-center gap-1 text-sm bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold animate-pulse">
                <AlertTriangle className="h-3.5 w-3.5" /> {totalUrgent} need attention
              </span>
            )}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10 text-xs">
              <LayoutDashboard className="h-3.5 w-3.5" /> My Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* ── URGENT ACTIONS ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-amber-500" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Needs Immediate Attention</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <UrgentCard
            label="Orders to Approve"
            count={d?.pendingOrdersCount ?? 0}
            sub={d?.pendingOrdersCount > 0 ? "Manual payments pending verification" : "All caught up!"}
            icon={<CheckCircle2 className="h-5 w-5" />}
            href="/admin/orders-for-approval"
            color="red"
            pulse
          />
          <UrgentCard
            label="Ready to Ship"
            count={d?.processingOrdersCount ?? 0}
            sub={d?.processingOrdersCount > 0 ? "Orders approved & awaiting shipment" : "No orders queued"}
            icon={<Truck className="h-5 w-5" />}
            href="/admin/orders"
            color="amber"
            pulse
          />
          <UrgentCard
            label="Pending Bookings"
            count={d?.pendingBookingsCount ?? 0}
            sub={d?.pendingBookingsCount > 0 ? "Sessions awaiting payment" : "All sessions paid"}
            icon={<CalendarClock className="h-5 w-5" />}
            href="/admin/bookings"
            color="blue"
            pulse
          />
          <UrgentCard
            label="Payout Requests"
            count={d?.pendingPayoutsCount ?? 0}
            sub={d?.pendingPayoutsCount > 0 ? `$${(d?.pendingPayouts ?? 0).toFixed(2)} total requested` : "No pending requests"}
            icon={<DollarSign className="h-5 w-5" />}
            href="/admin/payouts"
            color="green"
            pulse
          />
        </div>
      </div>

      {/* ── PERIOD SELECTOR + METRICS ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" style={{ color: GOLD }} />
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Performance</h2>
          </div>
          <div className="flex items-center bg-muted rounded-lg p-1 gap-0.5">
            {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                  period === p
                    ? "text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                style={period === p ? { background: GOLD } : {}}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard
            label="Revenue"
            value={`$${(periodRevenue ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={<DollarSign className="h-4 w-4" />}
            sub={PERIOD_LABELS[period]}
            gold
          />
          <MetricCard
            label="Orders"
            value={String(periodOrders ?? 0)}
            icon={<ShoppingCart className="h-4 w-4" />}
            sub={PERIOD_LABELS[period]}
          />
          <MetricCard
            label={period === "alltime" ? "Active Members" : "New Members"}
            value={String(periodMembers ?? 0)}
            icon={<Users className="h-4 w-4" />}
            sub={PERIOD_LABELS[period]}
          />
          <MetricCard
            label="Pro Members"
            value={String(d?.proMembers ?? 0)}
            icon={<UserCheck className="h-4 w-4" />}
            sub="All time"
          />
        </div>

        {/* Secondary metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
          <Card className="border-l-4 border-l-blue-400 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">GCV This Month</p>
                <p className="text-xl font-bold text-blue-600">{(d?.platformGCVThisMonth ?? 0).toLocaleString()} <span className="text-sm font-semibold text-blue-400">GCV</span></p>
              </div>
              <BarChart3 className="h-5 w-5 text-blue-400" />
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-400 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">GCV All Time</p>
                <p className="text-xl font-bold text-green-600">{(d?.platformGCV ?? 0).toLocaleString()} <span className="text-sm font-semibold text-green-400">GCV</span></p>
              </div>
              <TrendingUp className="h-5 w-5 text-green-400" />
            </CardContent>
          </Card>
          <Card className="border-l-4 shadow-sm" style={{ borderLeftColor: GOLD }}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Pending Commissions</p>
                <p className="text-xl font-bold" style={{ color: GOLD }}>${(d?.pendingCommissions ?? 0).toFixed(2)}</p>
              </div>
              <CreditCard className="h-5 w-5" style={{ color: GOLD }} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── REVENUE CHART ── */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="font-serif text-base">Revenue Trend — Last 6 Months</CardTitle>
          <Link href="/admin/reports">
            <Button variant="ghost" size="sm" className="text-xs gap-1 h-7">
              Full Report <ExternalLink className="h-3 w-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={d?.salesByMonth ?? []} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={GOLD} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={GOLD} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                tickFormatter={v => v === 0 ? "$0" : `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v: number) => [`$${v.toFixed(2)}`, "Revenue"]}
                contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
              />
              <Area type="monotone" dataKey="sales" stroke={GOLD} strokeWidth={2.5} fill="url(#goldGrad)" dot={{ fill: GOLD, r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── PENDING ORDERS + RECENT REGISTRATIONS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Pending Orders */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-red-100 flex items-center justify-center">
                <Clock className="h-4 w-4 text-red-600" />
              </div>
              <CardTitle className="font-serif text-base">Pending Orders</CardTitle>
              {(d?.pendingOrdersCount ?? 0) > 0 && (
                <Badge className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full ml-1">
                  {d.pendingOrdersCount}
                </Badge>
              )}
            </div>
            <Link href="/admin/orders-for-approval">
              <Button variant="outline" size="sm" className="text-xs gap-1 h-7 border-red-200 text-red-600 hover:bg-red-50">
                View All <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {d?.pendingOrders && d.pendingOrders.length > 0 ? (
              <div>
                {d.pendingOrders.slice(0, 6).map((order: any) => (
                  <OrderRow key={order.id} order={order} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 text-green-400 mb-2" />
                <p className="text-sm font-medium text-green-700">All orders are approved!</p>
                <p className="text-xs">No pending orders require your attention.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Registrations */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: `${GREEN}20` }}>
                <Users className="h-4 w-4" style={{ color: GREEN }} />
              </div>
              <CardTitle className="font-serif text-base">Recent Registrations</CardTitle>
            </div>
            <Link href="/admin/users">
              <Button variant="outline" size="sm" className="text-xs gap-1 h-7">
                All Users <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {d?.recentRegistrations && d.recentRegistrations.length > 0 ? (
              <div className="space-y-0">
                {d.recentRegistrations.slice(0, 7).map((user: any) => (
                  <div key={user.id} className="flex items-center gap-3 py-2.5 border-b border-border/40 last:border-0">
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="h-8 w-8 rounded-full object-cover flex-shrink-0 border border-border" />
                    ) : (
                      <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${GOLD}, ${GREEN})` }}>
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs px-1.5 py-0.5 rounded font-semibold uppercase" style={{
                        background: user.isProMember ? `${GOLD}20` : "#f1f5f9",
                        color: user.isProMember ? GOLD : "#64748b",
                      }}>
                        {roleLabel(user.role)}
                      </span>
                      <p className="text-xs text-muted-foreground mt-0.5">{new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">No recent registrations.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── TOP PRODUCTS ── */}
      {d?.topProducts && d.topProducts.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: `${GOLD}20` }}>
                <Star className="h-4 w-4" style={{ color: GOLD }} />
              </div>
              <CardTitle className="font-serif text-base">Top Products</CardTitle>
            </div>
            <Link href="/admin/products">
              <Button variant="outline" size="sm" className="text-xs gap-1 h-7">
                Manage <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {d.topProducts.map((p: any, i: number) => (
                <div key={p.productId} className="flex items-center gap-3">
                  <span className="text-xs font-bold w-5 text-center text-muted-foreground">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-medium truncate">{p.productName}</span>
                      <span className="text-sm font-bold ml-2 flex-shrink-0">${p.revenue.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full" style={{
                          width: `${Math.round((p.totalSold / (d.topProducts[0]?.totalSold || 1)) * 100)}%`,
                          background: `linear-gradient(90deg, ${GOLD}, ${GREEN})`,
                        }} />
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">{p.totalSold} sold</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── QUICK ACTIONS ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4" style={{ color: GOLD }} />
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { label: "All Orders", icon: <ShoppingCart className="h-4 w-4" />, href: "/admin/orders" },
            { label: "Approve Orders", icon: <CheckCircle2 className="h-4 w-4" />, href: "/admin/orders-for-approval" },
            { label: "Users", icon: <Users className="h-4 w-4" />, href: "/admin/users" },
            { label: "Products", icon: <Package className="h-4 w-4" />, href: "/admin/products" },
            { label: "Payouts", icon: <DollarSign className="h-4 w-4" />, href: "/admin/payouts" },
            { label: "Bookings", icon: <Calendar className="h-4 w-4" />, href: "/admin/bookings" },
          ].map(action => (
            <Link key={action.href} href={action.href}>
              <div className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-all text-center group">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors"
                  style={{ background: "#f8fafc" }}>
                  {action.icon}
                </div>
                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors leading-tight">{action.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── MEMBER MAP ── */}
      <MemberMapCard title="Global Member Distribution" />

    </div>
  );
}
