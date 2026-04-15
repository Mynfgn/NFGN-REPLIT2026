import { useState } from "react";
import { useGetWallet, useListWalletTransactions, useListPayouts, useRequestPayout } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function WalletPage() {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cashapp");
  const { toast } = useToast();

  const { data: wallet, refetch: refetchWallet } = useGetWallet();
  const { data: txnData } = useListWalletTransactions({ page: 1, limit: 20 });
  const { data: payoutsData } = useListPayouts({ page: 1, limit: 20 });
  const requestPayout = useRequestPayout();

  function handlePayout() {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      toast({ variant: "destructive", title: "Invalid amount" });
      return;
    }
    if (amt > (wallet?.balance ?? 0)) {
      toast({ variant: "destructive", title: "Insufficient balance" });
      return;
    }
    requestPayout.mutate({ data: { amount: amt, method } }, {
      onSuccess: () => {
        toast({ title: "Payout requested!", description: "Your withdrawal request has been submitted." });
        setOpen(false);
        setAmount("");
        refetchWallet();
      },
      onError: (e: any) => toast({ variant: "destructive", title: "Error", description: e.message }),
    });
  }

  const transactions = txnData?.transactions ?? [];
  const payouts = payoutsData?.payouts ?? [];

  function getTxnIcon(type: string) {
    if (type.includes("commission") || type.includes("credit")) return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
    return <ArrowUpRight className="h-4 w-4 text-red-500" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold">E-Wallet</h1>
          <p className="text-muted-foreground">Manage your earnings and withdrawals</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button disabled={!wallet?.balance || wallet.balance <= 0}>Request Withdrawal</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-serif">Request Payout</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Amount (Available: ${wallet?.balance?.toFixed(2) ?? "0.00"})</Label>
                <Input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Payout Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cashapp">CashApp ($NFGN)</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handlePayout} disabled={requestPayout.isPending}>
                {requestPayout.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : "Submit Request"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Available Balance</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">${wallet?.balance?.toFixed(2) ?? "0.00"}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pending</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-yellow-600">${wallet?.pendingBalance?.toFixed(2) ?? "0.00"}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Earned</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">${wallet?.totalEarned?.toFixed(2) ?? "0.00"}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Withdrawn</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">${wallet?.totalWithdrawn?.toFixed(2) ?? "0.00"}</div></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions">
        <TabsList>
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
          <TabsTrigger value="payouts">Payout Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card>
            <CardContent className="pt-6">
              {transactions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No transactions yet.</p>
              ) : (
                <div className="space-y-3">
                  {transactions.map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">{getTxnIcon(t.type)}</div>
                        <div>
                          <p className="font-medium text-sm">{t.description}</p>
                          <p className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()} • {t.type.replace(/_/g, " ")}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${t.type.includes("commission") ? "text-green-600" : ""}`}>
                          {t.type.includes("commission") ? "+" : "-"}${Math.abs(t.amount).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">Balance: ${t.balance.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts">
          <Card>
            <CardContent className="pt-6">
              {payouts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No payout requests yet.</p>
              ) : (
                <div className="space-y-3">
                  {payouts.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div>
                        <p className="font-medium">${p.amount.toFixed(2)} via {p.method}</p>
                        <p className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</p>
                      </div>
                      <Badge variant={p.status === "processed" ? "default" : p.status === "pending" ? "secondary" : "destructive"}>
                        {p.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
