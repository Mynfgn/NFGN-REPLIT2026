import { useState } from "react";
import { useGetMemberDashboard, useGetMemberAnalytics } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Wallet, Users, ShoppingBag, ArrowUpRight, TrendingUp, MapPin, Star, CheckCircle2, AlertCircle, BarChart3, Link2, Copy, Check, ExternalLink } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";
import { commissionTypeLabel } from "@/lib/labels";

const BRAND_GOLD = "#C9A84C";
const BRAND_GREEN = "#2D6A4F";

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

function CVCard({ pv, gv, required }: { pv: number; gv: number; required: number }) {
  const pvPercent = Math.min(100, Math.round((pv / required) * 100));
  const maintained = pv >= required;

  return (
    <Card className="border-l-4 border-l-green-500">
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-green-600" />
          Volume This Month
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-xl font-bold text-primary">{pv} CV</div>
            <div className="text-xs text-muted-foreground">Personal Volume (PV)</div>
            <div className="text-xs text-muted-foreground mt-0.5">Your purchases</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-xl font-bold text-green-600">{gv} CV</div>
            <div className="text-xs text-muted-foreground">Group Volume (GV)</div>
            <div className="text-xs text-muted-foreground mt-0.5">Entire community</div>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Monthly maintenance ({required} CV required)</span>
            <span className={maintained ? "text-green-600 font-semibold" : "text-yellow-600 font-semibold"}>
              {pv} / {required} CV
            </span>
          </div>
          <Progress value={pvPercent} className="h-2" />
          <p className={`text-xs mt-1.5 flex items-center gap-1 ${maintained ? "text-green-600" : "text-yellow-600"}`}>
            {maintained
              ? <><CheckCircle2 className="h-3 w-3" /> Pro Member status maintained</>
              : <><AlertCircle className="h-3 w-3" /> Need {required - pv} more CV to maintain Pro status</>
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function PowerSquadBonusCard({ bonus }: { bonus: any }) {
  if (!bonus) return null;

  const {
    bonusTrigger,
    bonusAmount,
    bonusEnabled,
    level1ProMembers,
    level1Required,
    level1Qualified,
    level1Needed,
    level2Commissions,
    bonusesEarned,
    nextBonusAt,
    toNextBonus,
  } = bonus;

  const l1Percent = Math.min(100, Math.round((level1ProMembers / Math.max(level1Required, 1)) * 100));
  const l2Percent = Math.min(100, Math.round(((level2Commissions % bonusTrigger || (level2Commissions > 0 && level2Commissions % bonusTrigger === 0 ? bonusTrigger : 0)) / bonusTrigger) * 100));

  if (!bonusEnabled) {
    return (
      <Card className="border-l-4 border-l-muted-foreground">
        <CardHeader className="pb-3">
          <CardTitle className="font-serif text-base flex items-center gap-2">
            <Star className="h-4 w-4 text-muted-foreground" />
            Power Squad Bonus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">The Power Squad Bonus is currently disabled by admin.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-base flex items-center gap-2">
          <Star className="h-4 w-4 text-primary fill-primary" />
          Power Squad Bonus
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Earn <strong className="text-foreground">${bonusAmount}</strong> for every {bonusTrigger} Level 2 Pro Package purchases — requires {bonusTrigger} personally sponsored Level 1 Pro Members to qualify.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-2 bg-muted rounded-lg">
            <div className={`text-lg font-bold ${level1Qualified ? "text-green-600" : "text-primary"}`}>
              {level1ProMembers} / {level1Required}
            </div>
            <div className="text-xs text-muted-foreground">Level 1 Pro Members</div>
          </div>
          <div className="p-2 bg-muted rounded-lg">
            <div className="text-lg font-bold text-amber-600">{level2Commissions}</div>
            <div className="text-xs text-muted-foreground">Level 2 Pro Packages</div>
          </div>
          <div className="p-2 bg-muted rounded-lg">
            <div className="text-lg font-bold text-purple-600">{bonusesEarned}</div>
            <div className="text-xs text-muted-foreground">Bonuses Earned</div>
          </div>
        </div>

        {/* Level 1 Qualification */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Level 1 qualification ({level1Required} Pro Members required)</span>
            <span className={`font-semibold ${level1Qualified ? "text-green-600" : "text-amber-600"}`}>
              {level1ProMembers} / {level1Required}
            </span>
          </div>
          <Progress value={l1Percent} className="h-2" />
        </div>

        {/* Level 2 progress (only show if qualified) */}
        {level1Qualified && (
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">Level 2 Pro Packages toward next bonus</span>
              <span className="font-semibold">{level2Commissions % bonusTrigger || (level2Commissions > 0 && level2Commissions % bonusTrigger === 0 ? bonusTrigger : 0)} / {bonusTrigger}</span>
            </div>
            <Progress value={l2Percent} className="h-2" />
          </div>
        )}

        {/* Status message */}
        {!level1Qualified ? (
          <div className="p-3 rounded-lg border bg-amber-50 border-amber-200 text-amber-800 text-sm">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <strong>
                  {level1Needed === 1
                    ? "1 more Level 1 Pro Member needed to qualify"
                    : `${level1Needed} more Level 1 Pro Members needed to qualify`}
                </strong>
                <div className="text-xs mt-0.5">
                  Personally sponsor {level1Required} Pro Members to unlock the Power Squad Bonus.
                </div>
              </div>
            </div>
          </div>
        ) : toNextBonus === 0 ? (
          <div className="p-3 rounded-lg border bg-green-50 border-green-200 text-green-800 text-sm flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span><strong>Power Squad Bonus earned!</strong> Bonus #{bonusesEarned} of ${bonusAmount} has been credited to your wallet.</span>
          </div>
        ) : (
          <div className="p-3 rounded-lg border bg-green-50 border-green-200 text-green-800 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Qualified! {toNextBonus} more Level 2 Pro Package {toNextBonus === 1 ? "sale" : "sales"} until your next ${bonusAmount} bonus.</strong>
                {bonusesEarned > 0 && (
                  <div className="text-xs mt-0.5">You've earned {bonusesEarned} Power Squad {bonusesEarned === 1 ? "Bonus" : "Bonuses"} so far.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MonthlySalesChart({ data }: { data: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Community Monthly Sales
        </CardTitle>
        <p className="text-xs text-muted-foreground">Sales $ and Commissionable Volume (CV) — last 12 months</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="sales" orientation="left" tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
            <YAxis yAxisId="cv" orientation="right" tick={{ fontSize: 11 }} tickFormatter={v => `${v}cv`} />
            <Tooltip
              formatter={(value: any, name: string) => [
                name === "totalSales" ? `$${Number(value).toFixed(2)}` : `${value} CV`,
                name === "totalSales" ? "Sales" : "CV",
              ]}
            />
            <Legend formatter={v => v === "totalSales" ? "Sales ($)" : "Group CV"} />
            <Bar yAxisId="sales" dataKey="totalSales" fill={BRAND_GOLD} radius={[3, 3, 0, 0]} />
            <Bar yAxisId="cv" dataKey="totalCV" fill={BRAND_GREEN} radius={[3, 3, 0, 0]} opacity={0.8} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function SalesByStateChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          Sales by Location
        </CardTitle>
        <p className="text-xs text-muted-foreground">Top states by community purchase volume</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart layout="vertical" data={data.slice(0, 8)} margin={{ top: 0, right: 30, bottom: 0, left: 60 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
            <YAxis type="category" dataKey="state" tick={{ fontSize: 11 }} width={55} />
            <Tooltip formatter={(v: any) => [`$${Number(v).toFixed(2)}`, "Sales"]} />
            <Bar dataKey="totalSales" fill={BRAND_GOLD} radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function AffiliateLinkCard({ referralLink }: { referralLink: string }) {
  const [copied, setCopied] = useState(false);

  const affiliateUrl = (() => {
    try {
      const parsed = new URL(referralLink);
      return `${window.location.origin}${parsed.pathname}`;
    } catch {
      return referralLink;
    }
  })();

  const handleCopy = () => {
    navigator.clipboard.writeText(affiliateUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <Card className="border border-primary/30 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-base flex items-center gap-2">
          <Link2 className="h-4 w-4 text-primary" />
          Your Personal Affiliate Link
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">
          Share this link with friends and family. When they join or shop through it, you earn commissions automatically.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted border border-border/60">
          <span className="flex-1 text-sm font-mono text-foreground truncate select-all" title={affiliateUrl}>
            {affiliateUrl}
          </span>
          <Button
            size="sm"
            variant={copied ? "default" : "outline"}
            className={`flex-shrink-0 gap-1.5 transition-all ${copied ? "bg-green-600 hover:bg-green-700 border-green-600 text-white" : ""}`}
            onClick={handleCopy}
          >
            {copied ? (
              <><Check className="h-3.5 w-3.5" /> Copied!</>
            ) : (
              <><Copy className="h-3.5 w-3.5" /> Copy</>
            )}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={affiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Preview your affiliate page
          </a>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-1">
          {[
            { label: "Share on social media", sub: "Post your link on Facebook, Instagram & more" },
            { label: "Send via text or email", sub: "Message it directly to people you know" },
            { label: "Add to your bio", sub: "Put it in your profile link on any platform" },
          ].map(tip => (
            <div key={tip.label} className="p-2.5 rounded-md bg-background border border-border/40 text-center">
              <div className="text-xs font-semibold text-foreground">{tip.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5 leading-tight">{tip.sub}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function EarningsLineChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-green-600" />
          Monthly Commission Earnings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
            <Tooltip formatter={(v: any) => [`$${Number(v).toFixed(2)}`, "Commissions"]} />
            <Line type="monotone" dataKey="amount" stroke={BRAND_GOLD} strokeWidth={2} dot={{ r: 3, fill: BRAND_GOLD }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  const { data, isLoading } = useGetMemberDashboard();
  const { data: analytics, isLoading: analyticsLoading } = useGetMemberAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-serif font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (<Skeleton key={i} className="h-32 w-full" />))}
        </div>
      </div>
    );
  }

  const monthlySales = analytics?.monthlySales ?? [];
  const salesByState = analytics?.salesByState ?? [];
  const pv = analytics?.personalVolume ?? 0;
  const gv = analytics?.groupVolume ?? 0;
  const required = analytics?.cvMaintenanceRequired ?? 100;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Welcome Back</h1>
          <p className="text-muted-foreground">Here's your business at a glance.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Wallet Balance" value={`$${(data?.walletBalance ?? 0).toFixed(2)}`} sub="Available for withdrawal" icon={Wallet} accent />
        <StatCard title="Total Earnings" value={`$${(data?.totalEarnings ?? 0).toFixed(2)}`} sub="Lifetime commissions" icon={ArrowUpRight} />
        <StatCard title="Team Size" value={String(data?.teamSize ?? 0)} sub={`${data?.personallyEnrolled ?? 0} personally enrolled`} icon={Users} />
        <StatCard title="Members" value={String(data?.retailCustomers ?? 0)} sub="Active buyers" icon={ShoppingBag} />
      </div>

      {/* Affiliate Link */}
      {data?.referralLink && (
        <AffiliateLinkCard referralLink={data.referralLink} />
      )}

      {/* PV/GV Volume + Power Squad Bonus */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CVCard pv={pv} gv={gv} required={required} />
        <PowerSquadBonusCard bonus={analytics?.powerSquadBonus} />
      </div>

      {/* Monthly Sales Chart + Earnings Line Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlySalesChart data={monthlySales} />
        <EarningsLineChart data={data?.earningsByMonth ?? []} />
      </div>

      {/* Sales by Location */}
      {salesByState.length > 0 && (
        <SalesByStateChart data={salesByState} />
      )}

      {/* Recent Orders + Commissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.recentOrders && data.recentOrders.length > 0 ? (
              <div className="space-y-4">
                {data.recentOrders.map(order => (
                  <div key={order.id} className="flex justify-between items-center border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <div className="font-medium">{order.orderNumber}</div>
                      <div className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">${order.total.toFixed(2)}</div>
                      <div className={`text-xs capitalize ${order.status === "completed" ? "text-green-600" : "text-primary"}`}>{order.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent orders.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Recent Commissions</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.recentCommissions && data.recentCommissions.length > 0 ? (
              <div className="space-y-4">
                {data.recentCommissions.map(comm => (
                  <div key={comm.id} className="flex justify-between items-center border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <div className="font-medium">{comm.fromUserName}</div>
                      <div className="text-sm text-muted-foreground">{commissionTypeLabel(comm.type ?? "referral")}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">+${comm.commissionAmount.toFixed(2)}</div>
                      <Badge variant={comm.status === "approved" ? "default" : "secondary"} className="text-xs">
                        {comm.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent commissions.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
