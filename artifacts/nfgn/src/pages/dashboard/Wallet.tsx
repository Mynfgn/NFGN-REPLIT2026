import { useState } from "react";
import { useGetWallet, useListWalletTransactions } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Wallet, ArrowDownLeft, ArrowUpRight, ArrowRightLeft,
  TrendingUp, DollarSign, ChevronLeft, ChevronRight
} from "lucide-react";

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

export function WalletPage() {
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
        <Skeleton className="h-10 w-48" />
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
      <div>
        <h1 className="text-3xl font-serif font-bold flex items-center gap-2">
          <Wallet className="h-7 w-7" />
          E-Wallet
        </h1>
        <p className="text-muted-foreground mt-1">Track every dollar you earn — commissions, transfers, and withdrawals.</p>
      </div>

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

              {/* Pagination */}
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
