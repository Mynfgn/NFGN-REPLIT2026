import { useState, useEffect } from "react";
import { customFetch } from "@/lib/custom-fetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, Legend,
} from "recharts";
import {
  DollarSign, ShoppingBag, TrendingUp, Users, Award, RefreshCw, BarChart3, Trophy,
} from "lucide-react";

const BRAND_GOLD = "#C9A84C";
const BRAND_GREEN = "#2D6A4F";

interface SalesReport {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  data: { date: string; orders: number; revenue: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
}

interface CommissionsReport {
  totalCommissions: number;
  pendingCommissions: number;
  paidCommissions: number;
  data: { date: string; amount: number; count: number }[];
}

interface TopAffiliate {
  id: number;
  name: string;
  email: string;
  rank: number;
  teamSize: number;
  totalEarnings: number;
  isProMember: boolean;
}

function StatCard({ title, value, sub, icon: Icon, accent }: {
  title: string; value: string; sub: string; icon: any; accent?: boolean;
}) {
  return (
    <Card className={accent ? "border-l-4 border-l-primary" : ""}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${accent ? "text-primary" : "text-muted-foreground"}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}

function shortenDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function AdminReportsPage() {
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [commReport, setCommReport] = useState<CommissionsReport | null>(null);
  const [topAffiliates, setTopAffiliates] = useState<TopAffiliate[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [sr, cr, ta] = await Promise.all([
      customFetch("/api/reports/sales").then(r => r.ok ? r.json() : null),
      customFetch("/api/reports/commissions").then(r => r.ok ? r.json() : null),
      customFetch("/api/reports/top-affiliates").then(r => r.ok ? r.json() : []),
    ]);
    setSalesReport(sr);
    setCommReport(cr);
    setTopAffiliates(ta);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Merge sales + commission data for the combo chart
  const mergedData = (salesReport?.data ?? []).slice(-14).map(d => {
    const commDay = commReport?.data.find(c => c.date === d.date);
    return { date: shortenDate(d.date), revenue: d.revenue, orders: d.orders, commissions: commDay?.amount ?? 0 };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Business performance overview — last 30 days.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Revenue"
              value={`$${(salesReport?.totalRevenue ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              sub="All-time gross sales"
              icon={DollarSign}
              accent
            />
            <StatCard
              title="Total Orders"
              value={String(salesReport?.totalOrders ?? 0)}
              sub="All-time orders"
              icon={ShoppingBag}
            />
            <StatCard
              title="Avg. Order Value"
              value={`$${(salesReport?.averageOrderValue ?? 0).toFixed(2)}`}
              sub="Per transaction"
              icon={TrendingUp}
            />
            <StatCard
              title="Total Commissions"
              value={`$${(commReport?.totalCommissions ?? 0).toFixed(2)}`}
              sub={`$${(commReport?.pendingCommissions ?? 0).toFixed(2)} pending`}
              icon={Award}
            />
          </div>

          {/* Revenue & Orders Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Revenue & Commissions (Last 14 Days)
              </CardTitle>
              <p className="text-xs text-muted-foreground">Daily sales revenue and commission amounts</p>
            </CardHeader>
            <CardContent>
              {mergedData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={mergedData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={BRAND_GOLD} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={BRAND_GOLD} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="commGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={BRAND_GREEN} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={BRAND_GREEN} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                    <Tooltip formatter={(v: any, name: string) => [`$${Number(v).toFixed(2)}`, name === "revenue" ? "Revenue" : "Commissions"]} />
                    <Legend formatter={v => v === "revenue" ? "Revenue" : "Commissions"} />
                    <Area type="monotone" dataKey="revenue" stroke={BRAND_GOLD} fill="url(#revGrad)" strokeWidth={2} />
                    <Area type="monotone" dataKey="commissions" stroke={BRAND_GREEN} fill="url(#commGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                  Top Products by Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!salesReport?.topProducts?.length ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No product sales yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      layout="vertical"
                      data={salesReport.topProducts.slice(0, 7)}
                      margin={{ top: 0, right: 30, bottom: 0, left: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `$${v}`} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} />
                      <Tooltip formatter={(v: any) => [`$${Number(v).toFixed(2)}`, "Revenue"]} />
                      <Bar dataKey="revenue" fill={BRAND_GOLD} radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Commission Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  Commission Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Total Commissions Issued", value: commReport?.totalCommissions ?? 0, color: "text-foreground" },
                  { label: "Paid / Approved", value: commReport?.paidCommissions ?? 0, color: "text-green-600" },
                  { label: "Pending Approval", value: commReport?.pendingCommissions ?? 0, color: "text-yellow-600" },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm">{item.label}</span>
                    <span className={`text-lg font-bold ${item.color}`}>${item.value.toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm">Avg. Daily Commissions (30d)</span>
                  <span className="text-lg font-bold text-primary">
                    ${((commReport?.paidCommissions ?? 0) / 30).toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Affiliates */}
          {topAffiliates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  Top Affiliates by Earnings
                </CardTitle>
                <p className="text-xs text-muted-foreground">Ranked by lifetime commission earnings</p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rank</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Email</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Team Size</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Earnings</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {topAffiliates.map((a) => (
                        <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {a.rank <= 3 ? (
                                <span className={`text-lg ${a.rank === 1 ? "text-yellow-500" : a.rank === 2 ? "text-gray-400" : "text-amber-600"}`}>
                                  {a.rank === 1 ? "🥇" : a.rank === 2 ? "🥈" : "🥉"}
                                </span>
                              ) : (
                                <span className="text-muted-foreground font-mono w-6 text-center">#{a.rank}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                {a.name[0]}
                              </div>
                              <span className="font-medium">{a.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">{a.email}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{a.teamSize}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-bold text-primary">${a.totalEarnings.toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <Badge variant={a.isProMember ? "default" : "secondary"} className="text-xs">
                              {a.isProMember ? "Pro Member" : "Member"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
