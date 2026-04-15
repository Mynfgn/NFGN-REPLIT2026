import { useState } from "react";
import { useGetWallet, useListPayouts, useRequestPayout } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Banknote, Clock, CheckCircle2, XCircle, ArrowUpRight,
  Building2, Smartphone, CreditCard, Loader2, AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

export function PayoutsPage() {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bank");
  const [accountInfo, setAccountInfo] = useState("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  const { data: wallet, isLoading: walletLoading, refetch: refetchWallet } = useGetWallet();
  const { data: payoutsData, isLoading: payoutsLoading, refetch: refetchPayouts } = useListPayouts({ page: 1, limit: 50 });
  const requestPayout = useRequestPayout();

  const balance = wallet?.balance ?? 0;
  const payouts = payoutsData?.payouts ?? [];

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
    const noteText = [accountInfo ? `Account: ${accountInfo}` : "", notes].filter(Boolean).join(" | ");
    requestPayout.mutate({ data: { amount: amt, method, notes: noteText || undefined } }, {
      onSuccess: () => {
        toast({ title: "Payout requested!", description: "Your withdrawal request has been submitted for review." });
        setOpen(false);
        setAmount("");
        setAccountInfo("");
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
          <p className="text-muted-foreground">Withdraw your earnings to an external account</p>
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

              <div>
                <Label>Withdrawal Amount</Label>
                <div className="relative mt-1">
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
                <p className="text-xs text-muted-foreground mt-1">Minimum payout: $10.00</p>
              </div>

              <div>
                <Label>Payout Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="mt-1">
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
              </div>

              <div>
                <Label>
                  {method === "bank" ? "Bank Account / Routing Info" :
                   method === "paypal" ? "PayPal Email Address" :
                   method === "cashapp" ? "Cash App $Cashtag" :
                   "Mailing Address"}
                </Label>
                <Input
                  className="mt-1"
                  placeholder={
                    method === "bank" ? "Account #, Routing #" :
                    method === "paypal" ? "you@email.com" :
                    method === "cashapp" ? "$YourCashtag" :
                    "Full mailing address"
                  }
                  value={accountInfo}
                  onChange={e => setAccountInfo(e.target.value)}
                />
              </div>

              <div>
                <Label>Notes (optional)</Label>
                <Textarea
                  className="mt-1 resize-none"
                  placeholder="Any additional instructions..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>Payouts are reviewed and processed within 3–5 business days. The amount will be deducted from your balance immediately upon request.</span>
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
              ${payouts.filter((p: any) => p.status === "pending").reduce((s: number, p: any) => s + p.amount, 0).toFixed(2)}
            </div>
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

      {/* Processing Time Notice */}
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
              <p className="text-sm mt-1">Once you have earnings in your wallet, click "Request Withdrawal" to cash out.</p>
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
                        {p.notes && <div className="text-xs text-muted-foreground">{p.notes}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-bold text-base">${p.amount.toFixed(2)}</div>
                        {p.processedAt && (
                          <div className="text-xs text-muted-foreground">Processed {new Date(p.processedAt).toLocaleDateString()}</div>
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
