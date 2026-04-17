import { useState, useEffect } from "react";
import { customFetch } from "@/lib/custom-fetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Home, Car, Zap, Heart, Phone, Star,
  CheckCircle2, Clock, XCircle, Lock, TrendingUp,
  DollarSign, Users, Info, Loader2, AlertCircle,
} from "lucide-react";

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const FUND_ICONS: Record<string, React.ElementType> = {
  "rent-mortgage": Home,
  car: Car,
  utilities: Zap,
  medical: Heart,
  "phone-internet": Phone,
};

const FUND_COLORS: Record<string, string> = {
  "rent-mortgage": "blue",
  car: "amber",
  utilities: "green",
  medical: "red",
  "phone-internet": "purple",
};

interface FundCard {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  memberFacingCopy: string | null;
  disclaimerText: string | null;
  payoutMode: string;
  payoutPercentage: number;
  gvRequirement: number;
  pvRequirement: number;
  maxCap: number;
  status: string;
  gvProgress: number;
  pvProgress: number;
  meetsGv: boolean;
  meetsPv: boolean;
  estimatedPayout: number;
  paidThisMonth: boolean;
  paidAmount: number;
  paidAt: string | null;
}

interface BppDashboard {
  isProMember: boolean;
  programEnabled: boolean;
  payoutDelayMessage: string;
  currentMonth: number;
  currentYear: number;
  personalVolume: number;
  groupVolume: number;
  funds: FundCard[];
  history: {
    id: number;
    fundId: number;
    fundName: string;
    month: number;
    year: number;
    memberPv: number;
    memberGv: number;
    qualifiedAmount: number;
    status: string;
    paidAt: string | null;
    createdAt: string;
  }[];
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; className: string }> = {
    inactive:   { label: "Inactive",         className: "bg-muted text-muted-foreground" },
    in_progress:{ label: "In Progress",      className: "bg-blue-100 text-blue-800" },
    qualified:  { label: "Qualified",        className: "bg-green-100 text-green-800" },
    pending:    { label: "Pending Approval", className: "bg-yellow-100 text-yellow-800" },
    approved:   { label: "Approved",         className: "bg-green-100 text-green-800" },
    paid:       { label: "Paid",             className: "bg-emerald-100 text-emerald-800" },
    denied:     { label: "Not Qualified",    className: "bg-red-100 text-red-800" },
  };
  const cfg = configs[status] ?? { label: status, className: "bg-muted text-muted-foreground" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

// ── Single Fund Card ──────────────────────────────────────────────────────────
function FundCard({ fund }: { fund: FundCard }) {
  const Icon = FUND_ICONS[fund.slug] ?? Star;
  const color = FUND_COLORS[fund.slug] ?? "primary";

  const colorMap: Record<string, { bg: string; text: string; border: string; progress: string }> = {
    blue:    { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200",   progress: "bg-blue-500" },
    amber:   { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200",  progress: "bg-amber-500" },
    green:   { bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200",  progress: "bg-green-500" },
    red:     { bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200",    progress: "bg-red-500" },
    purple:  { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", progress: "bg-purple-500" },
    primary: { bg: "bg-primary/5", text: "text-primary",    border: "border-primary/20", progress: "bg-primary" },
  };
  const c = colorMap[color];

  const isInactive = fund.status === "inactive";

  return (
    <Card className={`border ${fund.status === "paid" ? "border-emerald-200 bg-emerald-50/30" : ""} ${isInactive ? "opacity-60" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${c.bg} ${c.border} border`}>
              <Icon className={`h-5 w-5 ${c.text}`} />
            </div>
            <div>
              <h3 className="font-semibold text-base">{fund.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Up to <strong className={c.text}>${fund.maxCap.toLocaleString()}</strong> / month</p>
            </div>
          </div>
          <StatusBadge status={fund.status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {fund.memberFacingCopy && (
          <p className="text-sm text-muted-foreground">{fund.memberFacingCopy}</p>
        )}

        {!isInactive && (
          <>
            {/* Progress bars */}
            <div className="space-y-3">
              {/* GV Progress */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Group Volume (GV)
                    {fund.meetsGv && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                  </span>
                  <span className={fund.meetsGv ? "text-green-600 font-semibold" : "text-muted-foreground"}>
                    {Math.round(fund.gvProgress)}% of {fund.gvRequirement.toLocaleString()} required
                  </span>
                </div>
                <div className="relative h-2.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${fund.meetsGv ? "bg-green-500" : c.progress}`}
                    style={{ width: `${Math.min(fund.gvProgress, 100)}%` }}
                  />
                </div>
              </div>

              {/* PV Progress */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Personal Volume (PV)
                    {fund.meetsPv && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                  </span>
                  <span className={fund.meetsPv ? "text-green-600 font-semibold" : "text-muted-foreground"}>
                    {Math.round(fund.pvProgress)}% of {fund.pvRequirement.toLocaleString()} required
                  </span>
                </div>
                <div className="relative h-2.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${fund.meetsPv ? "bg-green-500" : c.progress}`}
                    style={{ width: `${Math.min(fund.pvProgress, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Payout estimate or paid badge */}
            {fund.paidThisMonth ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <span>
                  <strong>${fund.paidAmount.toFixed(2)}</strong> deposited into your wallet this month.
                  {fund.paidAt && <span className="text-xs ml-1 opacity-75">{new Date(fund.paidAt).toLocaleDateString()}</span>}
                </span>
              </div>
            ) : fund.estimatedPayout > 0 ? (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${c.bg} border ${c.border} text-sm ${c.text}`}>
                <DollarSign className="h-4 w-4 flex-shrink-0" />
                <span>Estimated payout: <strong>${fund.estimatedPayout.toFixed(2)}</strong></span>
              </div>
            ) : null}
          </>
        )}

        {fund.disclaimerText && (
          <p className="text-xs text-muted-foreground italic">{fund.disclaimerText}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export function BPPDashboardPage() {
  const [data, setData] = useState<BppDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    customFetch("/api/bpp/dashboard")
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(setData)
      .catch(() => setError("Failed to load BPP data."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
        <AlertCircle className="h-4 w-4" /> {error ?? "Unknown error"}
      </div>
    );
  }

  // Non-Pro Member gate
  if (!data.isProMember) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-serif font-bold">Bill Payer Program</h1>
          <p className="text-muted-foreground text-sm mt-1">Pro Consultant Commissions</p>
        </div>
        <Card className="border-l-4 border-l-amber-400">
          <CardContent className="pt-6 pb-5">
            <div className="flex gap-3">
              <Lock className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Pro Members Only</p>
                <p className="text-sm text-muted-foreground mt-1">
                  The Bill Payer Program is available exclusively to NFGN Pro Members.
                  Upgrade your membership to access this unique bonus program that helps you
                  offset real monthly expenses through your group's performance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Program disabled
  if (!data.programEnabled) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-serif font-bold mb-2">Bill Payer Program</h1>
        <Card>
          <CardContent className="pt-6 text-muted-foreground">
            The Bill Payer Program is temporarily paused. Please check back soon.
          </CardContent>
        </Card>
      </div>
    );
  }

  const monthName = MONTH_NAMES[data.currentMonth - 1];
  const paidFunds = data.funds.filter(f => f.paidThisMonth).length;
  const qualifiedFunds = data.funds.filter(f => f.status === "qualified" || f.status === "approved").length;
  const totalEarnedThisMonth = data.funds.filter(f => f.paidThisMonth).reduce((s, f) => s + f.paidAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold">Bill Payer Program</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Pro Consultant Commissions · {monthName} {data.currentYear}
        </p>
      </div>

      {/* Origin Story / Hero */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6 pb-5">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="font-semibold text-foreground">What is the Bill Payer Program?</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The Bill Payer Program (BPP) is a Pro Member benefit created to help qualified NFGN leaders offset real-life monthly
                expenses such as housing, transportation, utilities, medical, and phone/internet bills. Unlike programs based only on
                personal selling, the BPP rewards members for helping their group and community become productive. Once the required
                Group Volume and Personal Volume are met, qualifying bonuses may be deposited into your NFGN account.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong className="text-foreground">The story behind BPP:</strong> This program was born from the heart of Mr. Marcelino himself,
                who understood the daily financial hardships that many families face. His vision was simple but powerful — take a portion
                of the company's revenue and direct it toward qualifying Pro Members who are building teams and creating impact.
                The Bill Payer Program is one of the most unique and exciting features of the NFGN compensation structure.
              </p>
              <p className="text-xs text-muted-foreground italic">
                Funds are paid monthly, are non-transferable, and cannot be reassigned or gifted to another member.
                {data.payoutDelayMessage && <span> {data.payoutDelayMessage}</span>}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Volume summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Your Monthly PV", value: data.personalVolume.toLocaleString(), sub: "Personal Volume", icon: Users, color: "text-blue-600" },
          { label: "Your Monthly GV", value: data.groupVolume.toLocaleString(), sub: "Group Volume", icon: TrendingUp, color: "text-purple-600" },
          { label: "Funds Qualified", value: qualifiedFunds, sub: "this month", icon: CheckCircle2, color: "text-green-600" },
          { label: "Paid This Month", value: `$${totalEarnedThisMonth.toFixed(2)}`, sub: `${paidFunds} fund${paidFunds !== 1 ? "s" : ""}`, icon: DollarSign, color: "text-emerald-600" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <s.icon className={`h-8 w-8 ${s.color} flex-shrink-0`} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="funds">
        <TabsList>
          <TabsTrigger value="funds">My Funds</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* ── Funds Tab ── */}
        <TabsContent value="funds" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.funds.map(fund => (
              <FundCard key={fund.id} fund={fund} />
            ))}
          </div>

          <p className="text-xs text-muted-foreground mt-4 px-1">
            GV and PV figures reflect the current billing month ({monthName} {data.currentYear}).
            Qualifications are reviewed at month end. Fund caps and requirements may be updated at company discretion.
          </p>
        </TabsContent>

        {/* ── History Tab ── */}
        <TabsContent value="history" className="mt-4">
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-4 py-3 font-medium">Fund</th>
                    <th className="text-left px-4 py-3 font-medium">Period</th>
                    <th className="text-right px-4 py-3 font-medium">GV Achieved</th>
                    <th className="text-right px-4 py-3 font-medium">PV Achieved</th>
                    <th className="text-right px-4 py-3 font-medium">Amount</th>
                    <th className="text-center px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Paid On</th>
                  </tr>
                </thead>
                <tbody>
                  {data.history.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-muted-foreground">
                        No qualification history yet. Keep growing your group to qualify for your first BPP bonus!
                      </td>
                    </tr>
                  ) : data.history.map(h => (
                    <tr key={h.id} className="border-b hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium">{h.fundName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{MONTH_SHORT[h.month - 1]} {h.year}</td>
                      <td className="px-4 py-3 text-right font-mono">{h.memberGv.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono">{h.memberPv.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-semibold text-green-600">${h.qualifiedAmount.toFixed(2)}</td>
                      <td className="px-4 py-3 text-center"><StatusBadge status={h.status} /></td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {h.paidAt ? new Date(h.paidAt).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
