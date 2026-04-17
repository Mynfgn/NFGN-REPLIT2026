import { useState } from "react";
import { useListPayouts } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2, CheckCircle, XCircle, Building2, CreditCard, Smartphone,
  Banknote, Clock, AlertTriangle, Search, DollarSign, Users,
  Hash, ChevronDown, ChevronUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { customFetch } from "@/lib/custom-fetch";

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
  if (status === "processed") return "default";
  if (status === "pending") return "secondary";
  if (status === "rejected") return "destructive";
  return "outline";
}

function DestinationInfo({ p }: { p: any }) {
  const dest = p.payoutDestination;
  if (!dest) return null;

  if (p.method === "paypal" && dest.paypalEmail) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
        <CreditCard className="h-3 w-3" />
        <span>PayPal: <span className="font-medium text-foreground">{dest.paypalEmail}</span></span>
      </div>
    );
  }
  if (p.method === "cashapp" && dest.cashAppHandle) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
        <Smartphone className="h-3 w-3" />
        <span>Cash App: <span className="font-medium text-foreground">${dest.cashAppHandle}</span></span>
      </div>
    );
  }
  if (p.method === "bank" && dest.bankName) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
        <Building2 className="h-3 w-3" />
        <span>{dest.bankName}{dest.bankAccountType ? ` — ${dest.bankAccountType}` : ""}</span>
      </div>
    );
  }
  return (
    <div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
      <AlertTriangle className="h-3 w-3" />
      No destination on file — check member profile
    </div>
  );
}

function PayoutRow({ p, onRefetch }: { p: any; onRefetch: () => void }) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [processOpen, setProcessOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reference, setReference] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const MethodIcon = METHOD_ICONS[p.method] ?? Banknote;
  const isPending = p.status === "pending";

  async function handleProcess() {
    setProcessing(true);
    try {
      const res = await customFetch(`/api/payouts/${p.id}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: reference || undefined, adminNotes: adminNotes || undefined }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast({ variant: "destructive", title: "Error", description: err.error ?? "Failed to process." });
      } else {
        toast({ title: `Payout of $${p.amount.toFixed(2)} to ${p.userName} marked as processed.` });
        setProcessOpen(false);
        setReference("");
        setAdminNotes("");
        onRefetch();
      }
    } catch {
      toast({ variant: "destructive", title: "Network error" });
    } finally {
      setProcessing(false);
    }
  }

  async function handleReject() {
    setRejecting(true);
    try {
      const res = await customFetch(`/api/payouts/${p.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast({ variant: "destructive", title: "Error", description: err.error ?? "Failed to reject." });
      } else {
        toast({ title: `Payout rejected. $${p.amount.toFixed(2)} refunded to ${p.userName}'s wallet.` });
        setRejectOpen(false);
        setRejectReason("");
        onRefetch();
      }
    } catch {
      toast({ variant: "destructive", title: "Network error" });
    } finally {
      setRejecting(false);
    }
  }

  return (
    <>
      <div className="border rounded-xl overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 p-4">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <MethodIcon className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{p.userName}</span>
              {p.userEmail && (
                <span className="text-xs text-muted-foreground hidden sm:inline">({p.userEmail})</span>
              )}
              <Badge variant={statusVariant(p.status)} className="capitalize text-xs">{p.status}</Badge>
            </div>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              <span className="text-xs text-muted-foreground">{METHOD_LABELS[p.method] ?? p.method}</span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">
                {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
              {p.reference && (
                <>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs font-mono text-muted-foreground">Ref: {p.reference}</span>
                </>
              )}
            </div>
            <DestinationInfo p={p} />
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right">
              <div className="text-lg font-bold">${p.amount.toFixed(2)}</div>
              {p.processedAt && (
                <div className="text-xs text-muted-foreground">
                  {p.status === "rejected" ? "Rejected" : "Processed"} {new Date(p.processedAt).toLocaleDateString()}
                </div>
              )}
            </div>

            {isPending && (
              <div className="flex gap-2">
                <Button size="sm" variant="default" onClick={() => setProcessOpen(true)} className="gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5" /> Process
                </Button>
                <Button size="sm" variant="outline" onClick={() => setRejectOpen(true)} className="gap-1.5 text-destructive border-destructive/40 hover:bg-destructive/5">
                  <XCircle className="h-3.5 w-3.5" /> Reject
                </Button>
              </div>
            )}

            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setExpanded(e => !e)}>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="border-t bg-muted/30 px-4 py-3 text-xs space-y-2">
            {p.notes && (
              <div>
                <span className="font-medium text-muted-foreground uppercase tracking-wide">Notes: </span>
                <span>{p.notes}</span>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-muted-foreground block">Payout ID</span>
                <span className="font-mono font-medium">#{p.id}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Member ID</span>
                <span className="font-mono font-medium">#{p.userId}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Method</span>
                <span className="font-medium">{METHOD_LABELS[p.method] ?? p.method}</span>
              </div>
              {p.processedAt && (
                <div>
                  <span className="text-muted-foreground block">
                    {p.status === "rejected" ? "Rejected At" : "Processed At"}
                  </span>
                  <span className="font-medium">{new Date(p.processedAt).toLocaleString()}</span>
                </div>
              )}
            </div>
            {p.payoutDestination && (
              <div className="pt-1 border-t border-border/50">
                <span className="text-muted-foreground font-medium uppercase tracking-wide block mb-1">Saved Payout Details on File</span>
                <div className="grid grid-cols-2 gap-2">
                  {p.payoutDestination.paypalEmail && <div><span className="text-muted-foreground">PayPal: </span>{p.payoutDestination.paypalEmail}</div>}
                  {p.payoutDestination.cashAppHandle && <div><span className="text-muted-foreground">Cash App: </span>${p.payoutDestination.cashAppHandle}</div>}
                  {p.payoutDestination.bankName && <div><span className="text-muted-foreground">Bank: </span>{p.payoutDestination.bankName} ({p.payoutDestination.bankAccountType ?? "account"})</div>}
                  <div><span className="text-muted-foreground">Preferred: </span>{p.payoutDestination.preferredMethod ?? "not set"}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Process Dialog */}
      <Dialog open={processOpen} onOpenChange={setProcessOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Confirm & Process Payout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Member</span>
                <span className="font-medium">{p.userName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold text-green-600 text-base">${p.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Method</span>
                <span className="font-medium">{METHOD_LABELS[p.method] ?? p.method}</span>
              </div>
              <DestinationInfo p={p} />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5" /> Transaction / Reference Number (optional)
              </Label>
              <Input
                placeholder="e.g. ACH-20260417-00123"
                value={reference}
                onChange={e => setReference(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Enter the ACH confirmation, PayPal transaction ID, or any reference for your records.</p>
            </div>

            <div className="space-y-1.5">
              <Label>Admin Note (optional)</Label>
              <Textarea
                placeholder="Internal note for this payout..."
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProcessOpen(false)}>Cancel</Button>
            <Button onClick={handleProcess} disabled={processing} className="gap-2">
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Mark as Processed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-destructive">Reject Payout Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
              Rejecting this request will refund <strong>${p.amount.toFixed(2)}</strong> back to <strong>{p.userName}'s</strong> wallet automatically.
            </div>
            <div className="space-y-1.5">
              <Label>Rejection Reason (optional)</Label>
              <Textarea
                placeholder="e.g. Incorrect payout details, account verification required..."
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">This note will be saved on the payout record.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={rejecting} className="gap-2">
              {rejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Reject & Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function AdminPayoutsPage() {
  const { toast } = useToast();
  const { data, isLoading, refetch } = useListPayouts({ page: 1, limit: 100 });
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("pending");

  const payouts: any[] = data?.payouts ?? [];

  const filtered = payouts.filter(p => {
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      p.userName.toLowerCase().includes(q) ||
      (p.userEmail ?? "").toLowerCase().includes(q) ||
      String(p.id).includes(q);
    if (tab === "all") return matchesSearch;
    return matchesSearch && p.status === tab;
  });

  const totalPending = payouts.filter(p => p.status === "pending").reduce((s, p) => s + p.amount, 0);
  const countPending = payouts.filter(p => p.status === "pending").length;
  const totalProcessed = payouts.filter(p => p.status === "processed").reduce((s, p) => s + p.amount, 0);
  const totalRejected = payouts.filter(p => p.status === "rejected").length;

  const tabCounts: Record<string, number> = {
    pending: payouts.filter(p => p.status === "pending").length,
    processed: payouts.filter(p => p.status === "processed").length,
    rejected: payouts.filter(p => p.status === "rejected").length,
    all: payouts.length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">Payout Management</h1>
        <p className="text-muted-foreground">Review, approve, and track all member payout requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-yellow-400">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs text-muted-foreground">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{countPending}</div>
            <p className="text-xs text-muted-foreground">${totalPending.toFixed(2)} awaiting approval</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs text-muted-foreground">Total Paid Out</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalProcessed.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{payouts.filter(p => p.status === "processed").length} completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs text-muted-foreground">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(payouts.map(p => p.userId)).size}</div>
            <p className="text-xs text-muted-foreground">unique requestors</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-destructive/40">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs text-muted-foreground">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRejected}</div>
            <p className="text-xs text-muted-foreground">refunded to wallets</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Panel */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="font-serif">Payout Requests</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search member, email, ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="mb-4">
              {[
                { value: "pending", label: "Pending" },
                { value: "processed", label: "Processed" },
                { value: "rejected", label: "Rejected" },
                { value: "all", label: "All" },
              ].map(({ value, label }) => (
                <TabsTrigger key={value} value={value} className="gap-1.5">
                  {label}
                  {tabCounts[value] > 0 && (
                    <span className="rounded-full bg-primary/10 text-primary text-xs px-1.5 py-0 font-bold min-w-[1.25rem] text-center">
                      {tabCounts[value]}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {["pending", "processed", "rejected", "all"].map(tabValue => (
              <TabsContent key={tabValue} value={tabValue}>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Banknote className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No {tabValue === "all" ? "" : tabValue} payouts found.</p>
                    {search && <p className="text-sm mt-1">Try clearing the search filter.</p>}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filtered.map((p: any) => (
                      <PayoutRow key={p.id} p={p} onRefetch={refetch} />
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
