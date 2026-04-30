import { useListCommissions, useGetMemberAnalytics, useGetWallet } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, TrendingUp, DollarSign, Award, Users, Star, Clock, Briefcase } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { commissionTypeLabel, commissionStatusBadgeVariant } from "@/lib/labels";

const BRAND_GOLD = "#C9A84C";
const BRAND_GREEN = "#2D6A4F";
const PIE_COLORS = [BRAND_GOLD, BRAND_GREEN, "#7C3AED", "#0EA5E9"];

const TYPE_COLORS: Record<string, string> = {
  referral: "#3B82F6",
  sales: "#22C55E",
  level: BRAND_GOLD,
};

export function EarningsPage() {
  const { data: commissionsData, isLoading: loadingC } = useListCommissions({ page: 1, limit: 200 });
  const { data: analytics, isLoading: loadingA } = useGetMemberAnalytics();
  const { data: wallet } = useGetWallet();
  const { data: bookingEarningsData, isLoading: loadingBE } = useQuery({
    queryKey: ["my-booking-earnings"],
    queryFn: async () => {
      const r = await fetch("/api/my-booking-earnings", { credentials: "include" });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  const commissions = commissionsData?.commissions ?? [];

  const totalApproved = commissions
    .filter((c: any) => c.status === "approved")
    .reduce((s: number, c: any) => s + Number(c.commissionAmount), 0);
  const totalPending = commissions
    .filter((c: any) => c.status === "pending")
    .reduce((s: number, c: any) => s + Number(c.commissionAmount), 0);

  const now = new Date();
  const thisMonth = now.toLocaleString("default", { month: "long", year: "numeric" });
  const thisMonthEarnings = commissions
    .filter((c: any) => {
      const d = new Date(c.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s: number, c: any) => s + Number(c.commissionAmount), 0);

  const byType: Record<string, number> = {};
  for (const c of commissions) {
    if (c.status === "approved") {
      byType[c.type] = (byType[c.type] ?? 0) + Number(c.commissionAmount);
    }
  }
  const pieData = Object.entries(byType).map(([name, value]) => ({
    name: commissionTypeLabel(name),
    value: parseFloat(value.toFixed(2)),
    type: name,
  }));

  const monthly = (analytics?.monthlySales ?? []).map((m: any) => ({
    month: m.month,
    earnings: parseFloat(m.commissions?.toFixed(2) ?? "0"),
    sales: parseFloat(m.sales?.toFixed(2) ?? "0"),
  }));

  const walletBalance = wallet?.balance ?? 0;
  const lifetimeEarned = wallet?.totalEarned ?? 0;

  const bookingPayouts: any[] = bookingEarningsData?.payouts ?? [];
  const bookingPendingTotal = bookingPayouts.filter(p => p.status === "pending").reduce((s, p) => s + p.payoutAmount, 0);
  const bookingApprovedTotal = bookingPayouts.filter(p => p.status === "approved").reduce((s, p) => s + p.payoutAmount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">User Earnings</h1>
        <p className="text-muted-foreground">Your complete commission and earnings breakdown</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5 text-green-600" /> Available Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${walletBalance.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready to withdraw</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-primary" /> This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">${thisMonthEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">{thisMonth}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-yellow-600" /> Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">${totalPending.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <Star className="h-3.5 w-3.5" /> Lifetime Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${lifetimeEarned.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">All-time total</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="history">
        <TabsList>
          <TabsTrigger value="history">Commission History</TabsTrigger>
          <TabsTrigger value="chart">Monthly Earnings</TabsTrigger>
          <TabsTrigger value="breakdown">Earnings Breakdown</TabsTrigger>
          <TabsTrigger value="booking" className="gap-1.5">
            <Briefcase className="h-3.5 w-3.5" />
            Booking Earnings
            {bookingPayouts.filter(p => p.status === "pending").length > 0 && (
              <span className="bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">
                {bookingPayouts.filter(p => p.status === "pending").length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">All Commissions</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingC ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : commissions.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Award className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">No commissions yet</p>
                  <p className="text-sm mt-1">Start referring members to earn commissions!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {commissions.map((c: any) => {
                    const color = TYPE_COLORS[c.type] ?? BRAND_GOLD;
                    return (
                      <div key={c.id} className="flex items-center justify-between border-b pb-3 last:border-0 gap-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${color}18`, color }}>
                            <Award className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{c.fromUserName}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-xs px-1.5 py-0.5 rounded border font-medium"
                                style={{ background: `${color}12`, color, borderColor: `${color}40` }}>
                                {commissionTypeLabel(c.type)}
                              </span>
                              <span className="text-xs text-muted-foreground">Order #{c.orderNumber}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{new Date(c.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-green-600">+${Number(c.commissionAmount).toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">{c.rate}% of ${Number(c.saleAmount).toFixed(2)}</p>
                          <Badge variant={commissionStatusBadgeVariant(c.status)} className="mt-1 text-xs">
                            {c.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Monthly Earnings Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingA ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : monthly.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">No earnings data yet.</p>
              ) : (
                <div className="space-y-8">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={monthly} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                      <Tooltip formatter={(val: number) => [`$${val.toFixed(2)}`, ""]} />
                      <Legend />
                      <Bar dataKey="earnings" name="Commissions" fill={BRAND_GOLD} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="sales" name="Sales" fill={BRAND_GREEN} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Earnings by Type</CardTitle>
              </CardHeader>
              <CardContent>
                {pieData.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">No approved earnings yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {pieData.map((entry, idx) => (
                          <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: number) => [`$${val.toFixed(2)}`, ""]} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Breakdown Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: "referral", label: "Referral Commissions", icon: Users, color: "#3B82F6" },
                  { key: "sales", label: "Product Sales Commissions (PSC)", icon: TrendingUp, color: "#22C55E" },
                  { key: "level", label: "Level / Power Bonus", icon: Star, color: BRAND_GOLD },
                ].map(({ key, label, icon: Icon, color }) => {
                  const amount = commissions
                    .filter((c: any) => c.type === key && c.status === "approved")
                    .reduce((s: number, c: any) => s + Number(c.commissionAmount), 0);
                  const count = commissions.filter((c: any) => c.type === key).length;
                  return (
                    <div key={key} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full flex items-center justify-center" style={{ background: `${color}18`, color }}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{label}</p>
                          <p className="text-xs text-muted-foreground">{count} transaction{count !== 1 ? "s" : ""}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold" style={{ color }}>${amount.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">approved</p>
                      </div>
                    </div>
                  );
                })}

                <div className="border-t pt-3 flex items-center justify-between">
                  <span className="font-semibold">Total Approved</span>
                  <span className="font-bold text-green-600 text-lg">${totalApproved.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="booking">
          {loadingBE ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : bookingPayouts.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">No booking sessions found</p>
                <p className="text-sm mt-1">Your 80% service earnings will appear here once you are registered as a professional and members start booking your services.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Card className="border-l-4 border-l-amber-400">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Pending Approval</p>
                    <p className="text-2xl font-bold text-amber-600">${bookingPendingTotal.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Awaiting admin release</p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Approved & In Wallet</p>
                    <p className="text-2xl font-bold text-green-600">${bookingApprovedTotal.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Available to cash out</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Briefcase className="h-4 w-4" style={{ color: BRAND_GOLD }} />
                    My Booking Sessions (80% Earnings)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {bookingPayouts.map((p: any) => (
                    <div key={p.id} className="flex items-start justify-between border-b pb-3 last:border-0 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: `${BRAND_GOLD}18`, color: BRAND_GOLD }}>
                          <Briefcase className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{p.serviceType}</p>
                          <p className="text-xs text-muted-foreground">Booked by {p.memberName} · Booking #{p.bookingId}</p>
                          <p className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-green-600">+${p.payoutAmount.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">80% of ${p.bookingAmount.toFixed(2)}</p>
                        {p.status === "pending" && (
                          <Badge className="mt-1 text-xs bg-amber-100 text-amber-800 border-amber-300">Pending Approval</Badge>
                        )}
                        {p.status === "approved" && (
                          <Badge className="mt-1 text-xs bg-green-100 text-green-800 border-green-300">Approved — In Wallet</Badge>
                        )}
                        {p.status === "rejected" && (
                          <Badge variant="destructive" className="mt-1 text-xs">Rejected</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
