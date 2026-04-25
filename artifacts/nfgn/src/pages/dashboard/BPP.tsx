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

// ── BPP Progression Box ───────────────────────────────────────────────────────
function BPPProgressionBox({ data }: { data: BppDashboard }) {
  const activeFunds = data.funds.filter(f => f.status !== "inactive");

  const colorMap: Record<string, { bg: string; text: string; border: string; bar: string; lightBg: string }> = {
    blue:    { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200",   bar: "bg-blue-500",   lightBg: "bg-blue-50" },
    amber:   { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200",  bar: "bg-amber-500",  lightBg: "bg-amber-50" },
    green:   { bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200",  bar: "bg-green-500",  lightBg: "bg-green-50" },
    red:     { bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200",    bar: "bg-red-500",    lightBg: "bg-red-50" },
    purple:  { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", bar: "bg-purple-500", lightBg: "bg-purple-50" },
    primary: { bg: "bg-primary/5", text: "text-primary",    border: "border-primary/20", bar: "bg-primary",    lightBg: "bg-primary/5" },
  };

  return (
    <Card className="border-2 border-primary/25 overflow-hidden">
      {/* Accent bar */}
      <div className="h-1 w-full" style={{ background: "linear-gradient(to right, #3b82f6, #C9A84C, #2D6A4F)" }} />

      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          BPP Bonus Progression
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          How much more Personal Commissionable Volume (PCV) and Group Commissionable Volume (GCV) you need toward each BPP bonus this month.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">

        {/* Current totals banner */}
        <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/40 border p-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{data.personalVolume.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground font-medium">Your PCV This Month</div>
            <div className="text-[10px] text-muted-foreground">Personal Commissionable Volume</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{data.groupVolume.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground font-medium">Your GCV This Month</div>
            <div className="text-[10px] text-muted-foreground">Group Commissionable Volume</div>
          </div>
        </div>

        {/* Per-fund progress rows */}
        <div className="space-y-3">
          {activeFunds.map(fund => {
            const Icon = FUND_ICONS[fund.slug] ?? Star;
            const color = FUND_COLORS[fund.slug] ?? "primary";
            const c = colorMap[color];

            const pvNeeded = Math.max(0, fund.pvRequirement - data.personalVolume);
            const gvNeeded = Math.max(0, fund.gvRequirement - data.groupVolume);
            const pvPct = Math.min(100, (data.personalVolume / Math.max(fund.pvRequirement, 1)) * 100);
            const gvPct = Math.min(100, (data.groupVolume / Math.max(fund.gvRequirement, 1)) * 100);
            const qualified = fund.meetsGv && fund.meetsPv;
            const paidOut = fund.paidThisMonth;

            return (
              <div
                key={fund.id}
                className={`rounded-xl border p-3 space-y-2.5 transition-colors ${
                  paidOut
                    ? "bg-emerald-50 border-emerald-200"
                    : qualified
                    ? "bg-green-50/60 border-green-200"
                    : "bg-background border-border"
                }`}
              >
                {/* Fund header */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${c.bg} ${c.border} border`}>
                      <Icon className={`h-3.5 w-3.5 ${c.text}`} />
                    </div>
                    <div>
                      <span className="font-semibold text-sm">{fund.name}</span>
                      <span className={`ml-2 text-xs font-medium ${c.text}`}>up to ${fund.maxCap.toLocaleString()}/mo</span>
                    </div>
                  </div>
                  {paidOut ? (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Paid ${fund.paidAmount.toFixed(2)}
                    </span>
                  ) : qualified ? (
                    <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Qualified ✓
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> In Progress
                    </span>
                  )}
                </div>

                {/* PCV row */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs flex-wrap gap-1">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" /> Personal Volume (PCV)
                    </span>
                    {fund.meetsPv ? (
                      <span className="text-green-600 font-semibold">
                        ✓ {data.personalVolume.toLocaleString()} / {fund.pvRequirement.toLocaleString()} — Met
                      </span>
                    ) : (
                      <span className="text-amber-700 font-semibold">
                        {data.personalVolume.toLocaleString()} / {fund.pvRequirement.toLocaleString()} —{" "}
                        <strong>{pvNeeded.toLocaleString()} more needed</strong>
                      </span>
                    )}
                  </div>
                  <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${fund.meetsPv ? "bg-green-500" : c.bar}`}
                      style={{ width: `${pvPct}%` }}
                    />
                  </div>
                </div>

                {/* GCV row */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs flex-wrap gap-1">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> Group Volume (GCV)
                    </span>
                    {fund.meetsGv ? (
                      <span className="text-green-600 font-semibold">
                        ✓ {data.groupVolume.toLocaleString()} / {fund.gvRequirement.toLocaleString()} — Met
                      </span>
                    ) : (
                      <span className="text-amber-700 font-semibold">
                        {data.groupVolume.toLocaleString()} / {fund.gvRequirement.toLocaleString()} —{" "}
                        <strong>{gvNeeded.toLocaleString()} more needed</strong>
                      </span>
                    )}
                  </div>
                  <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${fund.meetsGv ? "bg-green-500" : c.bar}`}
                      style={{ width: `${gvPct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground">
          PCV and GCV volumes reset each calendar month. Qualifications are reviewed at month end and bonuses are deposited to your NFGN wallet.
        </p>
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
                  The Bill Payer Program pays out <strong className="text-foreground">Money Circulation Bonuses</strong> — also called{" "}
                  <strong className="text-foreground">Group Volume Bonuses (GVB)</strong>. There are 5 total, each covering a real monthly 
                  expense (housing, car, utilities, medical, phone/internet). This program is available exclusively to NFGN Pro Members. 
                  Upgrade your membership to unlock the ability to earn these monthly bonuses through your group's collective volume.
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
          Money Circulation Bonuses (Group Volume Bonuses) · {monthName} {data.currentYear}
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
                The Bill Payer Program (BPP) pays out what are called <strong className="text-foreground">Money Circulation Bonuses</strong> — 
                also referred to as <strong className="text-foreground">Group Volume Bonuses (GVB)</strong>. These bonuses are designed to help 
                qualified NFGN Pro Members offset real monthly expenses such as housing, transportation, utilities, medical, and phone/internet 
                bills. There are <strong className="text-foreground">5 Group Volume Bonuses</strong> in total, each with its own Group Volume 
                requirement and a standard Personal Volume requirement of 150 PV.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                These bonuses are called "Group Volume Bonuses" because they are primarily generated when a Pro Member's group reaches the 
                required Group Volume (GV) threshold for each bonus level. Pro Members meet the Personal Volume requirement by personally 
                purchasing NFGN products and services. However, only <strong className="text-foreground">Pro Member Registration Packages</strong>{" "}
                activate your eligibility to earn these bonuses. For example, if you purchase a Pro Member Registration item worth 50 PV, 
                you will be upgraded to Pro Member status — but you will still need an additional 100 PV in products or services to meet 
                the 150 PV Personal Volume requirement.
              </p>
              {/* The Origin Story */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                <p className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Star className="h-4 w-4 text-primary fill-primary flex-shrink-0" />
                  The Story Behind the Bill Payer Program
                </p>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  The origin of the BPP begins in <strong className="text-foreground">Houston, Texas</strong>, many years ago — during the
                  earliest stages of what we now call New Face Global Network. In the <strong className="text-foreground">summer of 2014</strong>,
                  Mr. Marcelino flew from New Orleans to Houston to deliver a presentation. He traveled alongside members of his Core
                  Leadership Group, and during that trip they decided to visit one of his top leaders — a close friend who happened to
                  also be a single mother.
                </p>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  When they arrived, the woman was overjoyed and surprised to see them. She welcomed them warmly into her home. But as
                  Mr. Marcelino went to sit down on the couch, something happened that no one expected —{" "}
                  <strong className="text-foreground">her lights and gas were shut off right then and there.</strong> The woman was
                  deeply embarrassed and heartbroken. The very next day brought more devastation: her car was repossessed. And
                  approximately a month later, she was evicted from her home.
                </p>

                {/* Pull quote */}
                <div className="rounded-lg border-l-4 border-primary bg-white/70 px-4 py-3">
                  <p className="text-sm text-foreground italic leading-relaxed">
                    "This is when Mr. Marcelino did what he does best — he began to pray and asked GOD for guidance and a solution
                    that could fix this woman's problems and prevent this from ever happening again to someone in his network."
                  </p>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  It was in that moment of prayer and reflection that the concept of the modern{" "}
                  <strong className="text-foreground">NFGN Bill Payer Program</strong> and{" "}
                  <strong className="text-foreground">Builder's Pay</strong> was born. GOD showed Mr. Marcelino a truth that would
                  shape the entire compensation philosophy of NFGN:{" "}
                  <em className="text-foreground">not everyone is gifted at selling products</em> — but many people are deeply loyal
                  to the company and possess excellent management, networking, influence, and communication skills. Some are
                  outstanding information specialists or connectors who work behind the scenes to hold the network together.
                </p>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  This insight makes the BPP one of the most inclusive programs in network marketing. It is designed not just for the
                  top sellers, but for{" "}
                  <strong className="text-foreground">anyone who contributes meaningfully to the growth of the network</strong> — even
                  those who cannot work at times due to unforeseen or unexpected circumstances but still need a steady, reliable
                  income to cover their essential monthly expenses.
                </p>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  The Bill Payer Program stands as one of the most unique and compassionate features of the NFGN compensation
                  structure — a living reminder that this company was built not just for profit, but for <strong className="text-foreground">people</strong>.
                </p>
              </div>
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
          { label: "Your Monthly PCV", value: data.personalVolume.toLocaleString(), sub: "Personal Commissionable Volume (also: PV)", icon: Users, color: "text-blue-600" },
          { label: "Your Monthly GCV", value: data.groupVolume.toLocaleString(), sub: "Group Commissionable Volume (also: GV)", icon: TrendingUp, color: "text-purple-600" },
          { label: "Bonuses Qualified", value: qualifiedFunds, sub: "this month", icon: CheckCircle2, color: "text-green-600" },
          { label: "Paid This Month", value: `$${totalEarnedThisMonth.toFixed(2)}`, sub: `${paidFunds} bonus${paidFunds !== 1 ? "es" : ""}`, icon: DollarSign, color: "text-emerald-600" },
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

      {/* BPP Progression Box */}
      <BPPProgressionBox data={data} />

      <Tabs defaultValue="funds">
        <TabsList>
          <TabsTrigger value="funds">My GV Bonuses</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="comp">Comp Plan</TabsTrigger>
        </TabsList>

        {/* ── GV Bonuses Tab ── */}
        <TabsContent value="funds" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.funds.map(fund => (
              <FundCard key={fund.id} fund={fund} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4 px-1">
            GV and PV figures reflect the current billing month ({monthName} {data.currentYear}).
            Qualifications are reviewed at month end. Bonus caps and requirements may be updated at company discretion.
          </p>
        </TabsContent>

        {/* ── History Tab ── */}
        <TabsContent value="history" className="mt-4">
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-4 py-3 font-medium">Bonus</th>
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
                        No qualification history yet. Keep growing your group to qualify for your first Group Volume Bonus!
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

        {/* ── Comp Plan Tab ── */}
        <TabsContent value="comp" className="mt-4 space-y-5">
          {/* Overview */}
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Money Circulation Bonuses
                <Badge className="text-xs ml-1">Also called Group Volume Bonuses (GVB)</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p className="leading-relaxed">
                The Bill Payer Program pays out <strong className="text-foreground">Money Circulation Bonuses</strong> — commonly referred to as 
                <strong className="text-foreground"> Group Volume Bonuses (GVB)</strong>. There are a total of 
                <strong className="text-foreground"> 5 Group Volume Bonuses</strong>, each designed to help Pro Members offset a specific 
                monthly living expense.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded-lg bg-background border p-3 space-y-1">
                  <p className="font-semibold text-foreground text-xs uppercase tracking-wide">Who Qualifies</p>
                  <p>Pro Members only. You must have purchased a Pro Member Registration Package, which activates your eligibility to earn these bonuses.</p>
                </div>
                <div className="rounded-lg bg-background border p-3 space-y-1">
                  <p className="font-semibold text-foreground text-xs uppercase tracking-wide">How PV Is Counted</p>
                  <p>Your Personal Volume is generated through your own product and service purchases. The system recognizes Pro Member Registration Packages first to activate eligibility — then you must also reach the PV requirement through additional purchases.</p>
                </div>
                <div className="rounded-lg bg-background border p-3 space-y-1">
                  <p className="font-semibold text-foreground text-xs uppercase tracking-wide">Standard PV Requirement</p>
                  <p>Generally <strong className="text-foreground">150 PV</strong> per bonus (+/−). This may vary per bonus but is typically kept uniform to keep the program easy to understand.</p>
                </div>
                <div className="rounded-lg bg-background border p-3 space-y-1">
                  <p className="font-semibold text-foreground text-xs uppercase tracking-wide">When Bonuses Pay Out</p>
                  <p>Bonuses are reviewed and paid at the end of each calendar month after both the GV and PV requirements are confirmed. Amounts are deposited directly into your NFGN E-Wallet.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PV Activation Example */}
          <Card className="border-amber-200 bg-amber-50/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-amber-800">
                <Info className="h-4 w-4 flex-shrink-0" />
                Important: Pro Member Registration &amp; PV Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-amber-900 space-y-2">
              <p className="leading-relaxed">
                Purchasing a Pro Member Registration Package upgrades you to Pro Member status and activates your ability to earn 
                Group Volume Bonuses. However, the Registration Package PV alone may not satisfy the full Personal Volume requirement.
              </p>
              <div className="rounded-lg bg-white border border-amber-200 p-3 space-y-1">
                <p className="font-semibold text-amber-800">Example</p>
                <p>If you purchase a 50 PV Pro Member Registration Package → You become a Pro Member ✓</p>
                <p>But the standard 150 PV requirement means you still need an additional <strong>100 PV</strong> in other product or service purchases to fully qualify for each bonus.</p>
              </div>
              <p className="text-xs italic text-amber-700">
                The PV requirement for each bonus is tracked independently each month. Meeting it consistently ensures you remain eligible every month.
              </p>
            </CardContent>
          </Card>

          {/* 5 GVB Breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-serif">The 5 Group Volume Bonuses (GVB)</CardTitle>
              <p className="text-sm text-muted-foreground">Each bonus covers a real monthly living expense and has its own Group Volume threshold.</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    num: 1, name: "Rent / Mortgage Bonus", slug: "rent-mortgage", icon: Home,
                    color: "blue", desc: "Helps offset your monthly housing costs.",
                    gvReq: data.funds.find(f => f.slug === "rent-mortgage")?.gvRequirement,
                    pvReq: data.funds.find(f => f.slug === "rent-mortgage")?.pvRequirement,
                    cap: data.funds.find(f => f.slug === "rent-mortgage")?.maxCap,
                  },
                  {
                    num: 2, name: "Car Payment Bonus", slug: "car", icon: Car,
                    color: "amber", desc: "Helps offset your monthly vehicle payment.",
                    gvReq: data.funds.find(f => f.slug === "car")?.gvRequirement,
                    pvReq: data.funds.find(f => f.slug === "car")?.pvRequirement,
                    cap: data.funds.find(f => f.slug === "car")?.maxCap,
                  },
                  {
                    num: 3, name: "Utilities Bonus", slug: "utilities", icon: Zap,
                    color: "green", desc: "Helps offset electricity, gas, and water bills.",
                    gvReq: data.funds.find(f => f.slug === "utilities")?.gvRequirement,
                    pvReq: data.funds.find(f => f.slug === "utilities")?.pvRequirement,
                    cap: data.funds.find(f => f.slug === "utilities")?.maxCap,
                  },
                  {
                    num: 4, name: "Medical Bonus", slug: "medical", icon: Heart,
                    color: "red", desc: "Helps offset healthcare and medical expenses.",
                    gvReq: data.funds.find(f => f.slug === "medical")?.gvRequirement,
                    pvReq: data.funds.find(f => f.slug === "medical")?.pvRequirement,
                    cap: data.funds.find(f => f.slug === "medical")?.maxCap,
                  },
                  {
                    num: 5, name: "Phone & Internet Bonus", slug: "phone-internet", icon: Phone,
                    color: "purple", desc: "Helps offset your monthly phone and internet bills.",
                    gvReq: data.funds.find(f => f.slug === "phone-internet")?.gvRequirement,
                    pvReq: data.funds.find(f => f.slug === "phone-internet")?.pvRequirement,
                    cap: data.funds.find(f => f.slug === "phone-internet")?.maxCap,
                  },
                ].map(b => {
                  const colorMap: Record<string, { bg: string; text: string; border: string; dot: string }> = {
                    blue:   { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200",   dot: "bg-blue-500" },
                    amber:  { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200",  dot: "bg-amber-500" },
                    green:  { bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200",  dot: "bg-green-500" },
                    red:    { bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200",    dot: "bg-red-500" },
                    purple: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-500" },
                  };
                  const c = colorMap[b.color];
                  const Icon = b.icon;
                  return (
                    <div key={b.num} className={`flex gap-4 p-4 rounded-xl ${c.bg} border ${c.border}`}>
                      <div className={`h-10 w-10 rounded-full ${c.dot} text-white flex items-center justify-center flex-shrink-0`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-semibold text-sm ${c.text}`}>GVB #{b.num} — {b.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{b.desc}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs flex-wrap">
                          <span className={`font-medium ${c.text}`}>
                            GV Required: <strong>{b.gvReq ? b.gvReq.toLocaleString() : "—"}</strong>
                          </span>
                          <span className={`font-medium ${c.text}`}>
                            PV Required: <strong>{b.pvReq ? `${b.pvReq} PV` : "150 PV (standard)"}</strong>
                          </span>
                          {b.cap && (
                            <span className={`font-medium ${c.text}`}>
                              Max Payout: <strong>${b.cap.toLocaleString()}/mo</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-4 italic">
                GV and PV requirements shown are the current configured values and may be adjusted by company administration. 
                All 5 bonuses use the same standard PV requirement unless otherwise specified.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
