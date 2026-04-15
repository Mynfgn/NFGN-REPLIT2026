import { useState } from "react";
import { useGetWallet, useListWalletTransactions } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowRightLeft, Users, Building2, Smartphone, CreditCard, Loader2, CheckCircle2, AlertCircle, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

async function callTransferFunds(data: { recipientIdentifier: string; amount: number; note?: string }) {
  const token = localStorage.getItem("nfgn_token");
  const res = await fetch("/api/wallet/transfer", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "Transfer failed");
  }
  return res.json();
}

function MemberTransferTab({ balance, onSuccess }: { balance: number; onSuccess: () => void }) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<null | { recipientName: string; amount: number; newBalance: number }>(null);
  const { toast } = useToast();

  async function handleTransfer() {
    const amt = parseFloat(amount);
    if (!recipient.trim()) { toast({ variant: "destructive", title: "Recipient is required." }); return; }
    if (isNaN(amt) || amt < 1) { toast({ variant: "destructive", title: "Minimum transfer is $1.00" }); return; }
    if (amt > balance) { toast({ variant: "destructive", title: "Insufficient balance", description: `Available: $${balance.toFixed(2)}` }); return; }

    setLoading(true);
    try {
      const result = await callTransferFunds({ recipientIdentifier: recipient.trim(), amount: amt, note: note.trim() || undefined });
      setSuccess({ recipientName: result.recipientName, amount: result.amount, newBalance: result.senderBalance });
      onSuccess();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Transfer failed", description: e.message });
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setSuccess(null);
    setRecipient("");
    setAmount("");
    setNote("");
  }

  if (success) {
    return (
      <div className="text-center py-10 space-y-4">
        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <p className="text-xl font-bold">${success.amount.toFixed(2)} sent!</p>
          <p className="text-muted-foreground">Successfully transferred to <strong>{success.recipientName}</strong></p>
          <p className="text-sm text-muted-foreground mt-1">Your new balance: <span className="font-semibold">${success.newBalance.toFixed(2)}</span></p>
        </div>
        <Button onClick={reset} variant="outline">Make Another Transfer</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="p-4 rounded-lg bg-muted flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Available Balance</span>
        <span className="text-xl font-bold text-green-600">${balance.toFixed(2)}</span>
      </div>

      <div>
        <Label>Recipient (Email or Referral Code)</Label>
        <Input
          className="mt-1"
          placeholder="member@email.com or jdoe-CODE1"
          value={recipient}
          onChange={e => setRecipient(e.target.value)}
        />
        <p className="text-xs text-muted-foreground mt-1">Enter the recipient's registered email address or their NFGN referral code.</p>
      </div>

      <div>
        <Label>Amount</Label>
        <div className="relative mt-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          <Input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="pl-7"
            min="1"
            max={balance}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">Minimum: $1.00 | Available: ${balance.toFixed(2)}</p>
      </div>

      <div>
        <Label>Note / Message (optional)</Label>
        <Textarea
          className="mt-1 resize-none"
          placeholder="What is this transfer for?"
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={2}
        />
      </div>

      <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
        <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <span>Member-to-member transfers are instant and cannot be reversed. Please verify the recipient before sending.</span>
      </div>

      <Button className="w-full gap-2" onClick={handleTransfer} disabled={loading}>
        {loading
          ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
          : <><ArrowRightLeft className="h-4 w-4" /> Send ${parseFloat(amount || "0").toFixed(2)} to Member</>
        }
      </Button>
    </div>
  );
}

function ExternalTransferTab({ balance }: { balance: number }) {
  return (
    <div className="space-y-5">
      <div className="p-4 rounded-lg bg-muted flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Available Balance</span>
        <span className="text-xl font-bold text-green-600">${balance.toFixed(2)}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { id: "bank", icon: Building2, label: "Bank Transfer (ACH)", time: "3–5 business days", color: "text-blue-600" },
          { id: "paypal", icon: CreditCard, label: "PayPal", time: "1–2 business days", color: "text-indigo-600" },
          { id: "cashapp", icon: Smartphone, label: "Cash App", time: "1–2 business days", color: "text-green-600" },
        ].map(({ id, icon: Icon, label, time, color }) => (
          <a key={id} href="/dashboard/payouts">
            <Card className="border hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardContent className="pt-5 pb-5 text-center space-y-2">
                <div className={`h-10 w-10 rounded-full bg-muted flex items-center justify-center mx-auto`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-xs text-muted-foreground">{time}</p>
                <Badge variant="outline" className="text-xs">Go to Payouts →</Badge>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>

      <div className="p-4 rounded-lg bg-muted/60 border text-sm text-muted-foreground">
        External transfers (to bank accounts, PayPal, and Cash App) are processed as <strong>Payout Requests</strong>. 
        Head to the <a href="/dashboard/payouts" className="text-primary underline font-medium">Payouts tab</a> to request a withdrawal to your external accounts.
      </div>
    </div>
  );
}

function RecentTransfers({ transactions }: { transactions: any[] }) {
  const transfers = transactions.filter((t: any) => t.type === "transfer_in" || t.type === "transfer_out");
  if (transfers.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-base">Recent Transfers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {transfers.slice(0, 10).map((t: any) => (
            <div key={t.id} className="flex items-center justify-between py-3 first:pt-0">
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${t.type === "transfer_in" ? "bg-green-100" : "bg-red-100"}`}>
                  {t.type === "transfer_in"
                    ? <ArrowDownLeft className="h-4 w-4 text-green-600" />
                    : <ArrowUpRight className="h-4 w-4 text-red-600" />
                  }
                </div>
                <div>
                  <p className="font-medium text-sm">{t.description}</p>
                  <p className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold ${t.type === "transfer_in" ? "text-green-600" : "text-red-600"}`}>
                  {t.type === "transfer_in" ? "+" : "-"}${Math.abs(t.amount).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">Bal: ${t.balance.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function TransferFundsPage() {
  const { data: wallet, refetch: refetchWallet } = useGetWallet();
  const { data: txnData, refetch: refetchTxns } = useListWalletTransactions({ page: 1, limit: 50 });
  const balance = wallet?.balance ?? 0;
  const transactions = txnData?.transactions ?? [];

  function onTransferSuccess() {
    refetchWallet();
    refetchTxns();
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-serif font-bold flex items-center gap-2">
          <ArrowRightLeft className="h-7 w-7" />
          Transfer Funds
        </h1>
        <p className="text-muted-foreground mt-1">Send money to other NFGN members or move funds to an external account.</p>
      </div>

      <Tabs defaultValue="member">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="member" className="gap-2">
            <Users className="h-4 w-4" /> To a Member
          </TabsTrigger>
          <TabsTrigger value="external" className="gap-2">
            <Building2 className="h-4 w-4" /> To External Account
          </TabsTrigger>
        </TabsList>

        <TabsContent value="member">
          <Card>
            <CardContent className="pt-6">
              <MemberTransferTab balance={balance} onSuccess={onTransferSuccess} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="external">
          <Card>
            <CardContent className="pt-6">
              <ExternalTransferTab balance={balance} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <RecentTransfers transactions={transactions} />
    </div>
  );
}
