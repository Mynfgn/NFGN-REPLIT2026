import { useState } from "react";
import { customFetch } from "@/lib/custom-fetch";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, Legend,
} from "recharts";
import {
  DollarSign, TrendingUp, Clock, CheckCircle2, Wallet,
  Users, Award, BarChart3, RefreshCw, ShoppingBag, Star,
} from "lucide-react";

const GOLD = "#C9A84C";
const GREEN = "#2D6A4F";
const DARK = "#0a0a0a";

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  referral:          { label: "Referral Commission (RC)",   color: "bg-blue-100 text-blue-800 border-blue-200" },
  sales:             { label: "Personal Sales (PSC)",       color: "bg-green-100 text-green-800 border-green-200" },
  level:             { label: "Pro Member (PMRC)",          color: "bg-purple-100 text-purple-800 border-purple-200" },
  power_squad_bonus: { label: "Pro Member Bonus",           color: "bg-amber-100 text-amber-800 border-amber-200" },
};

const STATUS_COLORS: Record<string, string> = {
  pending:  "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  paid:     "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
};

function StatCard({ title, value, sub, icon: Icon, accent, loading }: {
  title: string; value: string; sub: string; icon: any; accent?: boolean; loading?: boolean;
}) {
  return (
    <Card className={accent ? "border-l-4 border-l-primary" : ""}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${accent ? "text-primary" : "text-muted-foreground"}`} />
      </CardHeader>
      <CardContent>
        {loading
          ? <Skeleton className="h-7 w-24" />
          : <div className="text-2xl font-bold">{value}</div>
        }
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}

function typeLabel(type: string, level?: number | null) {
  if (type === "power_squad_bonus") {
    return level === 1
      ? { label: "CLB (Level 1)", color: "bg-amber-100 text-amber-800 border-amber-200" }
      : { label: "MCB (Level 2)", color: "bg-orange-100 text-orange-800 border-orange-200" };
  }
  return TYPE_LABELS[type] ?? { label: type, color: "bg-muted text-muted-foreground" };
}

export function MemberReportsPage() {
  const [commPage, setCommPage] = useState(1);

  const { data: member, isLoading: loadingMember, refetch: refetchMember } = useQuery({
    queryKey: ["member-dashboard"],
    queryFn: async () => {
      const r = await customFetch("/api/dashboard/member");
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ["member-analytics"],
    queryFn: async () => {
      const r = await customFetch("/api/dashboard/analytics");
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  const { data: commData, isLoading: loadingComm, refetch: refetchComm } = useQuery({
    queryKey: ["member-commissions", commPage],
    queryFn: async () => {
      const r = await customFetch(`/api/commissions?page=${commPage}&limit=15`);
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  const commissions = commData?.commissions ?? [];
  const commTotal: number = commData?.total ?? 0;
  const commTotalPages: number = commData?.totalPages ?? 1;
  const earningsByMonth: any[] = member?.earningsByMonth ?? [];
  const monthlySales: any[] = analytics?.monthlySales ?? [];
  const salesByState: any[] = analytics?.salesByState ?? [];

  const loading = loadingMember;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold flex items-center gap-3">
            <BarChart3 className="h-7 w-7 text-primary" />
            My Reports
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Your personal earnings, commissions, and community performance summary.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { refetchMember(); refetchComm(); }}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Earnings"
          value={`$${(member?.totalEarnings ?? 0).toFixed(2)}`}
          sub="All-time commissions"
          icon={DollarSign}
          accent
          loading={loading}
        />
        <StatCard
          title="Pending"
          value={`$${(member?.pendingEarnings ?? 0).toFixed(2)}`}
          sub="Awaiting approval"
          icon={Clock}
          loading={loading}
        />
        <StatCard
          title="Paid Out"
          value={`$${(member?.paidEarnings ?? 0).toFixed(2)}`}
          sub="Approved & paid"
          icon={CheckCircle2}
          loading={loading}
        />
        <StatCard
          title="Wallet Balance"
          value={`$${(member?.walletBalance ?? 0).toFixed(2)}`}
          sub="Available balance"
          icon={Wallet}
          loading={loading}
        />
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Team Size</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-7 w-16" /> : <div className="text-2xl font-bold">{member?.teamSize ?? 0}</div>}
            <p className="text-xs text-muted-foreground mt-1">Personally enrolled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Pro Members</CardTitle>
            <Star className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-7 w-16" /> : <div className="text-2xl font-bold">{member?.activeProMembers ?? 0}</div>}
            <p className="text-xs text-muted-foreground mt-1">Level 1 Pro Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Retail Customers</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-7 w-16" /> : <div className="text-2xl font-bold">{member?.retailCustomers ?? 0}</div>}
            <p className="text-xs text-muted-foreground mt-1">Direct customers</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Earnings by month */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Earnings — Last 6 Months
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingMember ? (
              <Skeleton className="h-52 w-full" />
            ) : earningsByMonth.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-sm text-muted-foreground">No earnings data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={earningsByMonth} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                  <Tooltip formatter={(v: any) => [`$${Number(v).toFixed(2)}`, "Earnings"]} />
                  <Bar dataKey="amount" fill={GOLD} radius={[4, 4, 0, 0]} name="Earnings" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Community Sales by month */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Community Sales — Last 12 Months
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAnalytics ? (
              <Skeleton className="h-52 w-full" />
            ) : monthlySales.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-sm text-muted-foreground">No sales data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={monthlySales} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                  <Tooltip formatter={(v: any, name: string) => [
                    name === "totalSales" ? `$${Number(v).toFixed(2)}` : v,
                    name === "totalSales" ? "Sales" : "CV",
                  ]} />
                  <Legend formatter={n => n === "totalSales" ? "Sales ($)" : "Total CV"} />
                  <Area type="monotone" dataKey="totalSales" stroke={GREEN} fill={`${GREEN}22`} strokeWidth={2} />
                  <Area type="monotone" dataKey="totalCV" stroke={GOLD} fill={`${GOLD}22`} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Sales States */}
      {!loadingAnalytics && salesByState.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Top Sales by State / Region
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {salesByState.map((row: any, i: number) => {
                const max = salesByState[0]?.totalSales ?? 1;
                const pct = Math.round((row.totalSales / max) * 100);
                return (
                  <div key={row.state} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}.</span>
                    <span className="text-sm font-medium w-28 truncate">{row.state}</span>
                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                      <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: GOLD }} />
                    </div>
                    <span className="text-xs font-semibold text-foreground w-20 text-right">${row.totalSales.toFixed(2)}</span>
                    <span className="text-xs text-muted-foreground w-16 text-right">{row.orderCount} orders</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Commission History */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Commission History
              {commTotal > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">{commTotal} total</Badge>
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loadingComm ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : commissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Award className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No commissions yet</p>
              <p className="text-xs text-muted-foreground">Commissions will appear here as your team grows.</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground border-b">
                      <th className="text-left pb-2 font-medium">Date</th>
                      <th className="text-left pb-2 font-medium">Type</th>
                      <th className="text-left pb-2 font-medium">From</th>
                      <th className="text-left pb-2 font-medium">Order</th>
                      <th className="text-right pb-2 font-medium">Sale Amt</th>
                      <th className="text-right pb-2 font-medium">Commission</th>
                      <th className="text-center pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.map((c: any) => {
                      const tl = typeLabel(c.type, c.level);
                      return (
                        <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="py-2.5 text-xs text-muted-foreground">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-2.5">
                            <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded border font-medium ${tl.color}`}>
                              {tl.label}
                            </span>
                          </td>
                          <td className="py-2.5 text-xs">{c.fromUserName}</td>
                          <td className="py-2.5 text-xs font-mono text-muted-foreground">{c.orderNumber ?? "—"}</td>
                          <td className="py-2.5 text-right text-xs">${Number(c.saleAmount).toFixed(2)}</td>
                          <td className="py-2.5 text-right font-semibold text-green-700">${Number(c.commissionAmount).toFixed(2)}</td>
                          <td className="py-2.5 text-center">
                            <span className={`inline-flex text-xs px-2 py-0.5 rounded border font-medium capitalize ${STATUS_COLORS[c.status] ?? "bg-muted text-muted-foreground"}`}>
                              {c.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {commissions.map((c: any) => {
                  const tl = typeLabel(c.type, c.level);
                  return (
                    <div key={c.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-2 py-0.5 rounded border font-medium ${tl.color}`}>{tl.label}</span>
                        <span className={`text-xs px-2 py-0.5 rounded border font-medium capitalize ${STATUS_COLORS[c.status] ?? "bg-muted text-muted-foreground"}`}>{c.status}</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-xs text-muted-foreground">From: {c.fromUserName}</p>
                          <p className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</p>
                          {c.orderNumber && <p className="text-xs font-mono text-muted-foreground">{c.orderNumber}</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Sale: ${Number(c.saleAmount).toFixed(2)}</p>
                          <p className="text-base font-bold text-green-700">${Number(c.commissionAmount).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {commTotalPages > 1 && (
                <div className="flex justify-between items-center pt-4 border-t mt-4">
                  <Button variant="outline" size="sm" onClick={() => setCommPage(p => Math.max(1, p - 1))} disabled={commPage === 1}>
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">Page {commPage} of {commTotalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setCommPage(p => p + 1)} disabled={commPage >= commTotalPages}>
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
