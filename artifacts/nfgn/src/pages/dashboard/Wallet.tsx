import { useState, useEffect } from "react";
import { useGetWallet, useListWalletTransactions, useGetMe } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Wallet, ArrowDownLeft, ArrowUpRight, ArrowRightLeft,
  TrendingUp, DollarSign, ChevronLeft, ChevronRight,
  Gift, Clock, CheckCircle2, AlertCircle, Sparkles, Lock,
} from "lucide-react";
import { customFetch } from "@/lib/custom-fetch";
import { getEffectiveTier, tierAtLeast } from "@/components/layout/DashboardLayout";

const BRAND_GOLD = "#C9A84C";
const BRAND_GREEN = "#2D6A4F";

// ── E-Wallet tab helpers ──────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  commission_credit: "Commission Earned",
  referral_commission: "Referral Commission",
  sales_commission: "Product Sales Commission (PSC)",
  level_commission: "Level Bonus",
  payout: "Withdrawal",
  payout_request: "Withdrawal Request",
  adjustment: "Admin Adjustment",
  transfer_in: "Received Transfer",
  transfer_out: "Sent Transfer",
  refund: "Refund",
  purchase: "Purchase Deduction",
};

const TYPE_COLORS: Record<string, string> = {
  commission_credit: "text-green-600",
  referral_commission: "text-green-600",
  sales_commission: "text-green-600",
  level_commission: "text-green-600",
  payout: "text-red-500",
  payout_request: "text-red-500",
  adjustment: "text-blue-600",
  transfer_in: "text-green-600",
  transfer_out: "text-red-500",
  refund: "text-green-600",
  purchase: "text-red-500",
};

function isCredit(type: string): boolean {
  return ["commission_credit", "referral_commission", "sales_commission", "level_commission", "transfer_in", "refund", "adjustment"].includes(type);
}

function TxnIcon({ type }: { type: string }) {
  if (type === "transfer_in" || type === "transfer_out") return <ArrowRightLeft className="h-4 w-4" />;
  if (isCredit(type)) return <ArrowDownLeft className="h-4 w-4 text-green-600" />;
  return <ArrowUpRight className="h-4 w-4 text-red-500" />;
}

function txnBg(type: string): string {
  if (type === "transfer_in" || type === "transfer_out") return "bg-blue-100 text-blue-600";
  if (isCredit(type)) return "bg-green-100 text-green-600";
  return "bg-red-100 text-red-500";
}

const FILTER_OPTIONS = [
  { value: "all", label: "All Activity" },
  { value: "commissions", label: "Commissions Only" },
  { value: "transfers", label: "Transfers Only" },
  { value: "withdrawals", label: "Withdrawals Only" },
];

function matchesFilter(type: string, filter: string): boolean {
  if (filter === "all") return true;
  if (filter === "commissions") return ["commission_credit", "referral_commission", "sales_commission", "level_commission"].includes(type);
  if (filter === "transfers") return ["transfer_in", "transfer_out"].includes(type);
  if (filter === "withdrawals") return ["payout", "payout_request"].includes(type);
  return true;
}

// ── $-Credit tab helpers ──────────────────────────────────────────────────────

type CreditStatus = "pending" | "available" | "used" | "expired" | "revoked";

interface DollarCredit {
  id: number;
  amount: number;
  remainingAmount: number;
  status: CreditStatus;
  earnedAt: string;
  availableAt: string;
  expiresAt: string;
  usedAt: string | null;
  notes: string | null;
}

interface DollarCreditSummary {
  available: number;
  pending: number;
  ytdTotal: number;
  cashoutEligible: boolean;
  referredRetailCount: number;
  cashoutThreshold: number;
  nextExpiryDate: string | null;
}

const STATUS_BADGE: Record<CreditStatus, { label: string; className: string }> = {
  pending:   { label: "Pending (7-day hold)", className: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  available: { label: "Available",            className: "bg-green-100 text-green-700 border-green-300" },
  used:      { label: "Used",                 className: "bg-blue-100 text-blue-700 border-blue-300" },
  expired:   { label: "Expired",              className: "bg-red-100 text-red-500 border-red-200" },
  revoked:   { label: "Revoked",              className: "bg-gray-100 text-gray-500 border-gray-200" },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function DollarCreditIcon({ status }: { status: CreditStatus }) {
  if (status === "available") return <CheckCircle2 className="h-4 w-4 text-green-600" />;
  if (status === "pending") return <Clock className="h-4 w-4 text-yellow-500" />;
  if (status === "expired" || status === "revoked") return <AlertCircle className="h-4 w-4 text-red-400" />;
  return <Gift className="h-4 w-4 text-blue-500" />;
}

function creditBg(status: CreditStatus): string {
  if (status === "available") return "bg-green-100 text-green-600";
  if (status === "pending") return "bg-yellow-100 text-yellow-600";
  if (status === "expired" || status === "revoked") return "bg-red-100 text-red-400";
  return "bg-blue-100 text-blue-600";
}

// ── $-Credit Tab ─────────────────────────────────────────────────────────────

function DollarCreditTab({ tier }: { tier: string }) {
  const [credits, setCredits] = useState<DollarCredit[]>([]);
  const [summary, setSummary] = useState<DollarCreditSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [cashoutLoading, setCashoutLoading] = useState(false);
  const [cashoutMsg, setCashoutMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const canAccess = tierAtLeast(tier as any, "referring_retail_member");

  useEffect(() => {
    if (!canAccess) { setLoading(false); return; }
    Promise.all([
      customFetch("/api/wallet/dollar-credits").then(r => r.json()),
      customFetch("/api/wallet/dollar-credits/summary").then(r => r.json()),
    ]).then(([credData, sumData]) => {
      setCredits(credData.credits ?? []);
      setSummary(sumData);
    }).finally(() => setLoading(false));
  }, [canAccess]);

  const handleCashout = async () => {
    setCashoutLoading(true);
    setCashoutMsg(null);
    try {
      const r = await customFetch("/api/wallet/dollar-credits/cashout-request", { method: "POST" });
      const data = await r.json();
      if (r.ok) {
        setCashoutMsg({ ok: true, text: data.message ?? "Cash-out request submitted." });
      } else {
        setCashoutMsg({ ok: false, text: data.error ?? "Could not submit cash-out request." });
      }
    } catch {
      setCashoutMsg({ ok: false, text: "Network error. Please try again." });
    } finally {
      setCashoutLoading(false);
    }
  };

  if (!canAccess) {
    return (
      <div className="rounded-2xl overflow-hidden" style={{ border: `1.5px solid ${BRAND_GOLD}`, background: "linear-gradient(135deg, #0a0a0a 0%, #1a1000 100%)" }}>
        <div className="p-8 text-center">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(201,168,76,0.12)" }}>
            <Lock className="h-8 w-8" style={{ color: BRAND_GOLD }} />
          </div>
          <h3 className="text-xl font-serif font-bold text-white mb-2">$-Credits Locked</h3>
          <p className="text-white/60 max-w-sm mx-auto text-sm leading-relaxed">
            You unlock Dollar Credit rewards when your first referred Retail Member makes a purchase —
            automatically promoting you to <span style={{ color: BRAND_GOLD }} className="font-semibold">Referring Retail Member</span>.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "rgba(201,168,76,0.15)", color: BRAND_GOLD, border: `1px solid ${BRAND_GOLD}` }}>
            <Sparkles className="h-4 w-4" />
            Share your referral link to unlock
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const progressPct = summary ? Math.min(100, Math.round((summary.referredRetailCount / summary.cashoutThreshold) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card style={{ borderLeft: `4px solid ${BRAND_GOLD}` }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-600" /> Available Credits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: BRAND_GOLD }}>${(summary?.available ?? 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Ready to use</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3 text-yellow-500" /> Pending (7-day hold)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">${(summary?.pending ?? 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Releases after 7 days</p>
          </CardContent>
        </Card>

        <Card className="col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-600" /> Year-to-Date Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${(summary?.ytdTotal ?? 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-0.5">{new Date().getFullYear()} total</p>
          </CardContent>
        </Card>
      </div>

      {/* Cash-out eligibility card */}
      <div className="rounded-2xl p-5" style={{ border: `1.5px solid ${BRAND_GOLD}33`, background: "linear-gradient(135deg, #0a0a0a 0%, #111 100%)" }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 flex-shrink-0" style={{ color: BRAND_GOLD }} />
              <span className="text-sm font-semibold text-white">Cash-Out Eligibility</span>
              {summary?.cashoutEligible && (
                <Badge className="text-xs ml-1" style={{ background: BRAND_GREEN, color: "#fff" }}>Eligible!</Badge>
              )}
            </div>
            <p className="text-xs text-white/50 mb-3 leading-relaxed">
              Refer <strong className="text-white/80">{summary?.cashoutThreshold ?? 9} Retail Members</strong> who each make a purchase to convert your $-Credits into real cash.
              {summary?.nextExpiryDate && (
                <> &nbsp;Oldest credit expires <span className="text-yellow-400">{fmtDate(summary.nextExpiryDate)}</span>.</>
              )}
            </p>
            <div className="flex items-center gap-3">
              <Progress
                value={progressPct}
                className="h-2 flex-1"
                style={{ background: "rgba(255,255,255,0.1)" }}
              />
              <span className="text-xs font-bold flex-shrink-0" style={{ color: BRAND_GOLD }}>
                {summary?.referredRetailCount ?? 0}/{summary?.cashoutThreshold ?? 9}
              </span>
            </div>
          </div>
          <div className="flex-shrink-0">
            <Button
              size="sm"
              disabled={!summary?.cashoutEligible || (summary?.available ?? 0) <= 0 || cashoutLoading}
              onClick={handleCashout}
              className="font-semibold text-sm px-5"
              style={summary?.cashoutEligible && (summary?.available ?? 0) > 0
                ? { background: BRAND_GOLD, color: "#0a0a0a" }
                : {}}
            >
              {cashoutLoading ? "Submitting…" : summary?.cashoutEligible ? "Request Cash-Out" : "Not Yet Eligible"}
            </Button>
          </div>
        </div>

        {cashoutMsg && (
          <div className={`mt-3 p-3 rounded-lg text-sm ${cashoutMsg.ok ? "bg-green-900/40 text-green-300 border border-green-800" : "bg-red-900/40 text-red-300 border border-red-800"}`}>
            {cashoutMsg.text}
          </div>
        )}
      </div>

      {/* Credit history */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif flex items-center gap-2">
            <Gift className="h-5 w-5" style={{ color: BRAND_GOLD }} />
            $-Credit History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {credits.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Gift className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No $-Credits yet.</p>
              <p className="text-sm mt-1">You'll earn credits here as your referred members make purchases.</p>
            </div>
          ) : (
            <div className="divide-y">
              {credits.map(c => {
                const badge = STATUS_BADGE[c.status] ?? STATUS_BADGE.pending;
                return (
                  <div key={c.id} className="flex items-center justify-between py-4 first:pt-0">
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 ${creditBg(c.status)}`}>
                        <DollarCreditIcon status={c.status} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">Dollar Credit Earned</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${badge.className}`}>
                            {badge.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Earned {fmtDate(c.earnedAt)}
                          {c.status === "pending" && <> · Unlocks {fmtDate(c.availableAt)}</>}
                          {c.status === "available" && <> · Expires {fmtDate(c.expiresAt)}</>}
                          {c.status === "used" && c.usedAt && <> · Used {fmtDate(c.usedAt)}</>}
                        </p>
                        {c.notes && <p className="text-xs text-muted-foreground/70 mt-0.5 truncate max-w-xs">{c.notes}</p>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 pl-4">
                      <p className="font-bold text-base" style={{ color: BRAND_GOLD }}>${c.amount.toFixed(2)}</p>
                      {c.status === "available" && c.remainingAmount < c.amount && (
                        <p className="text-xs text-muted-foreground">${c.remainingAmount.toFixed(2)} left</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── E-Wallet Tab ─────────────────────────────────────────────────────────────

function EWalletTab() {
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 15;

  const { data: wallet, isLoading: walletLoading } = useGetWallet();
  const { data: txnData, isLoading: txnLoading } = useListWalletTransactions({ page, limit });

  const transactions = txnData?.transactions ?? [];
  const totalPages = txnData?.totalPages ?? 1;
  const filtered = transactions.filter((t: any) => matchesFilter(t.type, filter));

  if (walletLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  const balance = wallet?.balance ?? 0;
  const pending = wallet?.pendingBalance ?? 0;
  const totalEarned = wallet?.totalEarned ?? 0;
  const totalWithdrawn = wallet?.totalWithdrawn ?? 0;

  const commissionTotal = transactions
    .filter((t: any) => ["commission_credit", "referral_commission", "sales_commission", "level_commission"].includes(t.type))
    .reduce((s: number, t: any) => s + Math.abs(t.amount), 0);

  return (
    <div className="space-y-6">
      {/* Balance cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <Wallet className="h-3 w-3" /> Available Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">${balance.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Ready to use</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Commission Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${commissionTotal.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-0.5">This page range</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-3 w-3" /> Total Earned (Lifetime)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalEarned.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-0.5">All-time commissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" /> Total Withdrawn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalWithdrawn.toFixed(2)}</div>
            {pending > 0 && <p className="text-xs text-yellow-600 mt-0.5">${pending.toFixed(2)} pending</p>}
          </CardContent>
        </Card>
      </div>

      {/* Transaction list */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="font-serif">Earnings & Activity</CardTitle>
            <Select value={filter} onValueChange={v => { setFilter(v); setPage(1); }}>
              <SelectTrigger className="w-44 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FILTER_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {txnLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Wallet className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No transactions yet.</p>
              <p className="text-sm mt-1">Your earnings will appear here as you accumulate commissions.</p>
            </div>
          ) : (
            <>
              <div className="divide-y">
                {filtered.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between py-4 first:pt-0">
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 ${txnBg(t.type)}`}>
                        <TxnIcon type={t.type} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">{t.description}</p>
                          <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                            {TYPE_LABELS[t.type] ?? t.type.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(t.createdAt).toLocaleDateString("en-US", {
                            month: "long", day: "numeric", year: "numeric",
                            hour: "numeric", minute: "2-digit"
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground sm:hidden">{TYPE_LABELS[t.type] ?? t.type}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 pl-4">
                      <p className={`font-bold text-base ${TYPE_COLORS[t.type] ?? ""}`}>
                        {isCredit(t.type) ? "+" : "-"}${Math.abs(t.amount).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">Bal: ${t.balance.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next <ChevronRight className="h-4 w-4 ml-1" />
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

// ── Main WalletPage ───────────────────────────────────────────────────────────

export function WalletPage() {
  const [activeTab, setActiveTab] = useState<"wallet" | "dollar-credit">("wallet");
  const { data: me } = useGetMe();
  const tier = getEffectiveTier(me);

  const tabs = [
    { id: "wallet" as const, label: "E-Wallet", icon: <Wallet className="h-4 w-4" /> },
    { id: "dollar-credit" as const, label: "$-Credit", icon: <Gift className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-serif font-bold flex items-center gap-2">
          <Wallet className="h-7 w-7" />
          Wallet
        </h1>
        <p className="text-muted-foreground mt-1">Track your earnings, commissions, and Dollar Credit rewards.</p>
      </div>

      {/* Tab switcher */}
      <div className="flex rounded-xl overflow-hidden border border-border w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              "flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-all",
              activeTab === tab.id
                ? "text-black"
                : "text-muted-foreground hover:text-foreground bg-transparent",
            ].join(" ")}
            style={activeTab === tab.id ? { background: BRAND_GOLD } : {}}
          >
            {tab.icon}
            {tab.label}
            {tab.id === "dollar-credit" && !tierAtLeast(tier, "referring_retail_member") && (
              <Lock className="h-3 w-3 opacity-60 ml-0.5" />
            )}
          </button>
        ))}
      </div>

      {activeTab === "wallet" ? (
        <EWalletTab />
      ) : (
        <DollarCreditTab tier={tier} />
      )}
    </div>
  );
}
