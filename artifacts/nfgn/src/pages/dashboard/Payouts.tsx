import { useState, useEffect } from "react";
import { useGetWallet, useListPayouts, useRequestPayout, useGetMe } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Banknote, Clock, CheckCircle2, XCircle, ArrowUpRight,
  Building2, Smartphone, CreditCard, Loader2, AlertCircle,
  Settings, ChevronRight, Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const METHOD_ICONS: Record<string, any> = {
  bank: Building2,
  paypal: CreditCard,
  cashapp: Smartphone,
  check: Banknote,
};

const METHOD_LABELS: Record<string, string> = {
  bank: "Bank Transfer (ACH)",
  paypal: "PayPal",
  cashapp: "Cash App",
  check: "Check by Mail",
};

const METHOD_TIMES: Record<string, string> = {
  bank: "3–5 business days",
  paypal: "1–2 business days",
  cashapp: "1–2 business days",
  check: "7–10 business days",
};

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "processed" || status === "approved") return "default";
  if (status === "pending") return "secondary";
  if (status === "rejected") return "destructive";
  return "outline";
}

function statusIcon(status: string) {
  if (status === "processed" || status === "approved") return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  if (status === "pending") return <Clock className="h-4 w-4 text-yellow-500" />;
  return <XCircle className="h-4 w-4 text-red-500" />;
}

function SavedDestinationBadge({ user, method }: { user: any; method: string }) {
  if (method === "paypal" && user?.payoutPaypalEmail) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-sm dark:bg-blue-950 dark:border-blue-800">
        <CreditCard className="h-4 w-4 text-blue-600 flex-shrink-0" />
        <div>
          <span className="text-blue-700 font-medium dark:text-blue-300">Sending to PayPal: </span>
          <span className="font-mono font-semibold">{user.payoutPaypalEmail}</span>
        </div>
      </div>
    );
  }
  if (method === "cashapp" && user?.payoutCashAppHandle) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm dark:bg-green-950 dark:border-green-800">
        <Smartphone className="h-4 w-4 text-green-600 flex-shrink-0" />
        <div>
          <span className="text-green-700 font-medium dark:text-green-300">Sending to Cash App: </span>
          <span className="font-mono font-semibold">${user.payoutCashAppHandle}</span>
        </div>
      </div>
    );
  }
  if (method === "bank" && user?.bankName) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-muted border px-3 py-2 text-sm">
        <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <div>
          <span className="text-muted-foreground">Direct deposit to: </span>
          <span className="font-semibold">{user.bankName}{user.bankAccountType ? ` (${user.bankAccountType})` : ""}</span>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
      <span>
        No {METHOD_LABELS[method] ?? method} destination saved on file.{" "}
        <Link href="/dashboard/profile" className="underline underline-offset-2 font-medium">
          Update your payout settings
        </Link>
        {" "}before requesting.
      </span>
    </div>
  );
}

export function PayoutsPage() {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bank");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  const { data: me } = useGetMe();
  const { data: wallet, isLoading: walletLoading, refetch: refetchWallet } = useGetWallet();
  const { data: payoutsData, isLoading: payoutsLoading, refetch: refetchPayouts } = useListPayouts({ page: 1, limit: 50 });
  const requestPayout = useRequestPayout();

  const user = me as any;

  useEffect(() => {
    if (user?.payoutMethod) {
      setMethod(user.payoutMethod);
    }
  }, [user?.payoutMethod]);

  const balance = wallet?.balance ?? 0;
  const payouts = payoutsData?.payouts ?? [];
  const pendingPayouts = payouts.filter((p: any) => p.status === "pending");

  function getDestinationForNotes() {
    if (method === "paypal" && user?.payoutPaypalEmail) return `PayPal: ${user.payoutPaypalEmail}`;
    if (method === "cashapp" && user?.payoutCashAppHandle) return `Cash App: $${user.payoutCashAppHandle}`;
    if (method === "bank" && user?.bankName) return `Bank: ${user.bankName} (${user.bankAccountType ?? "account"})`;
    return "";
  }

  function handlePayout() {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < 10) {
      toast({ variant: "destructive", title: "Minimum payout is $10.00" });
      return;
    }
    if (amt > balance) {
      toast({ variant: "destructive", title: "Insufficient balance", description: `Your available balance is $${balance.toFixed(2)}` });
      return;
    }
    const destination = getDestinationForNotes();
    const noteText = [destination, notes].filter(Boolean).join(" | ");
    requestPayout.mutate({ data: { amount: amt, method, notes: noteText || undefined } }, {
      onSuccess: () => {
        toast({ title: "Payout requested!", description: "Your withdrawal request has been submitted for review." });
        setOpen(false);
        setAmount("");
        setNotes("");
        refetchWallet();
        refetchPayouts();
      },
      onError: (e: any) => toast({ variant: "destructive", title: "Error", description: e.message }),
    });
  }

  if (walletLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 gap-4"><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold">Payouts</h1>
          <p className="text-muted-foreground">Withdraw your earned commissions and bonuses</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button disabled={balance < 10} className="gap-2">
              <ArrowUpRight className="h-4 w-4" />
              Request Withdrawal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-serif">Request a Payout</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="p-3 rounded-lg bg-muted flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Available Balance</span>
                <span className="text-lg font-bold text-green-600">${balance.toFixed(2)}</span>
              </div>

              <div className="space-y-1.5">
                <Label>Withdrawal Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="pl-7"
                    min="10"
                    max={balance}
                  />
                </div>
                <div className="flex gap-2">
                  {[25, 50, 100].map(v => (
                    <Button
                      key={v}
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => setAmount(String(Math.min(v, balance)))}
                      disabled={balance < v}
                    >
                      ${v}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setAmount(balance.toFixed(2))}
                  >
                    Max
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Minimum: $10.00 · Maximum: ${balance.toFixed(2)}</p>
              </div>

              <div className="space-y-1.5">
                <Label>Payout Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank">
                      <div className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Bank Transfer (ACH)</div>
                    </SelectItem>
                    <SelectItem value="paypal">
                      <div className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> PayPal</div>
                    </SelectItem>
                    <SelectItem value="cashapp">
                      <div className="flex items-center gap-2"><Smartphone className="h-4 w-4" /> Cash App</div>
                    </SelectItem>
                    <SelectItem value="check">
                      <div className="flex items-center gap-2"><Banknote className="h-4 w-4" /> Check by Mail</div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {METHOD_TIMES[method] && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Typical processing time: {METHOD_TIMES[method]}
                  </p>
                )}
              </div>

              <SavedDestinationBadge user={user} method={method} />

              <div className="space-y-1.5">
                <Label>Additional Notes (optional)</Label>
                <Textarea
                  className="resize-none"
                  placeholder="Any special instructions..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>The amount will be deducted from your wallet immediately. Payouts are reviewed and sent within 3–5 business days.</span>
              </div>

              <Button className="w-full" onClick={handlePayout} disabled={requestPayout.isPending}>
                {requestPayout.isPending
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                  : `Request $${parseFloat(amount || "0").toFixed(2)} via ${METHOD_LABELS[method] ?? method}`
                }
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Available Balance</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-primary">${balance.toFixed(2)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Pending Payouts</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              ${pendingPayouts.reduce((s: number, p: any) => s + p.amount, 0).toFixed(2)}
            </div>
            {pendingPayouts.length > 0 && <p className="text-xs text-muted-foreground">{pendingPayouts.length} pending</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Total Withdrawn</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">${(wallet?.totalWithdrawn ?? 0).toFixed(2)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Total Earned</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">${(wallet?.totalEarned ?? 0).toFixed(2)}</div></CardContent>
        </Card>
      </div>

      {/* Saved Payout Method */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Your Saved Payout Method
            </CardTitle>
            <Link href="/dashboard/profile">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-7">
                Edit <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {user?.payoutMethod ? (
            <div className="flex flex-wrap gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Preferred Method</p>
                <div className="flex items-center gap-2">
                  {(() => { const Icon = METHOD_ICONS[user.payoutMethod] ?? Banknote; return <Icon className="h-4 w-4 text-muted-foreground" />; })()}
                  <span className="font-medium">{METHOD_LABELS[user.payoutMethod] ?? user.payoutMethod}</span>
                </div>
              </div>
              {user.payoutMethod === "paypal" && user.payoutPaypalEmail && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">PayPal Email</p>
                  <span className="font-mono font-medium">{user.payoutPaypalEmail}</span>
                </div>
              )}
              {user.payoutMethod === "cashapp" && user.payoutCashAppHandle && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Cash App</p>
                  <span className="font-mono font-medium">${user.payoutCashAppHandle}</span>
                </div>
              )}
              {user.payoutMethod === "bank" && user.bankName && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Bank Account</p>
                  <span className="font-medium">{user.bankName}{user.bankAccountType ? ` — ${user.bankAccountType}` : ""}</span>
                </div>
              )}
              {user.payoutMethod === "bank" && !user.bankName && (
                <div className="flex items-center gap-2 text-sm text-amber-700">
                  <AlertCircle className="h-4 w-4" />
                  Bank details not yet filled in.{" "}
                  <Link href="/dashboard/profile" className="underline underline-offset-2">Add them in your profile</Link>.
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Info className="h-4 w-4" />
              No payout method saved.{" "}
              <Link href="/dashboard/profile" className="text-primary underline underline-offset-2 font-medium">
                Set up your payout method in your profile
              </Link>
              {" "}so we know where to send your earnings.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Times */}
      <Card className="bg-muted/40 border-border/50">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-6 text-sm">
            {[
              { method: "Bank Transfer", time: "3–5 business days", icon: Building2 },
              { method: "PayPal", time: "1–2 business days", icon: CreditCard },
              { method: "Cash App", time: "1–2 business days", icon: Smartphone },
              { method: "Check by Mail", time: "7–10 business days", icon: Banknote },
            ].map(({ method: m, time, icon: Icon }) => (
              <div key={m} className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{m}:</span>
                <span className="font-medium">{time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payout History */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif flex items-center gap-2">
            <Banknote className="h-4 w-4" />
            Payout History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payoutsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : payouts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Banknote className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No payout requests yet.</p>
              <p className="text-sm mt-1">Once you have a balance of $10 or more, click "Request Withdrawal" to cash out.</p>
            </div>
          ) : (
            <div className="divide-y">
              {payouts.map((p: any) => {
                const MethodIcon = METHOD_ICONS[p.method] ?? Banknote;
                return (
                  <div key={p.id} className="flex items-center justify-between py-4 first:pt-0">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <MethodIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{METHOD_LABELS[p.method] ?? p.method}</div>
                        <div className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                        {p.notes && (
                          <div className="text-xs text-muted-foreground max-w-xs truncate">{p.notes}</div>
                        )}
                        {p.reference && (
                          <div className="text-xs font-mono text-muted-foreground">Ref: {p.reference}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-bold text-base">${p.amount.toFixed(2)}</div>
                        {p.processedAt && (
                          <div className="text-xs text-muted-foreground">
                            {p.status === "rejected" ? "Rejected" : "Sent"} {new Date(p.processedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {statusIcon(p.status)}
                        <Badge variant={statusVariant(p.status)} className="capitalize text-xs">
                          {p.status}
                        </Badge>
                      </div>
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
