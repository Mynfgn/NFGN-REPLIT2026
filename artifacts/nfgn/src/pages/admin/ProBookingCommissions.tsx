import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Briefcase, DollarSign, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const GOLD = "#C9A84C";

async function apiFetch(path: string, opts?: RequestInit) {
  const r = await fetch(`/api${path}`, { credentials: "include", ...opts });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

function statusBadge(status: string) {
  if (status === "pending") return <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs">Pending</Badge>;
  if (status === "approved") return <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">Approved</Badge>;
  if (status === "rejected") return <Badge variant="destructive" className="text-xs">Rejected</Badge>;
  return <Badge variant="secondary" className="text-xs">{status}</Badge>;
}

function PayoutSplitPill({ label, amount, color }: { label: string; amount: number; color: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border" style={{ borderColor: color + "40", color, background: color + "18" }}>
      {label}: ${amount.toFixed(2)}
    </span>
  );
}

export function ProBookingCommissionsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["booking-payouts"],
    queryFn: () => apiFetch("/booking-payouts?limit=50"),
  });

  const approve = useMutation({
    mutationFn: (id: number) => apiFetch(`/booking-payouts/${id}/approve`, { method: "POST" }),
    onSuccess: () => { toast({ title: "Payout approved — professional wallet credited!" }); qc.invalidateQueries({ queryKey: ["booking-payouts"] }); },
    onError: (e: any) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const reject = useMutation({
    mutationFn: (id: number) => apiFetch(`/booking-payouts/${id}/reject`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }),
    onSuccess: () => { toast({ title: "Payout rejected" }); qc.invalidateQueries({ queryKey: ["booking-payouts"] }); },
    onError: (e: any) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const payouts = data?.payouts ?? [];
  const pending = payouts.filter((p: any) => p.status === "pending");
  const processed = payouts.filter((p: any) => p.status !== "pending");
  const totalPendingAmount = pending.reduce((s: number, p: any) => s + p.payoutAmount, 0);

  function PayoutRow({ p }: { p: any }) {
    return (
      <div className="border rounded-xl p-4 space-y-3 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-semibold text-sm">{p.professionalName}</span>
              {statusBadge(p.status)}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Booked by:</span> {p.memberName} · {p.serviceType} · Booking #{p.bookingId}
            </p>
            <p className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-lg font-bold" style={{ color: "#2D6A4F" }}>${p.payoutAmount.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">80% of ${p.bookingAmount.toFixed(2)}</p>
          </div>
        </div>

        <div className="border-t pt-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">20% Commission Pool — ${p.commissionPool.toFixed(2)}</p>
          <div className="flex flex-wrap gap-1.5">
            <PayoutSplitPill label="Product Sales (60%)" amount={p.productSalesCommission} color="#2D6A4F" />
            <PayoutSplitPill label="Referral (25%)" amount={p.referralCommission} color={GOLD} />
            <PayoutSplitPill label="NFGN Fees (15%)" amount={p.nfgnFees} color="#6366f1" />
          </div>
        </div>

        {p.status === "pending" && (
          <div className="flex gap-2 pt-1">
            <Button size="sm" className="gap-1.5 h-8 text-xs" style={{ background: "#2D6A4F" }}
              onClick={() => approve.mutate(p.id)} disabled={approve.isPending}>
              <CheckCircle className="h-3.5 w-3.5" /> Approve Payout
            </Button>
            <Button size="sm" variant="destructive" className="gap-1.5 h-8 text-xs"
              onClick={() => reject.mutate(p.id)} disabled={reject.isPending}>
              <XCircle className="h-3.5 w-3.5" /> Reject
            </Button>
          </div>
        )}
        {p.status === "approved" && p.approvedAt && (
          <p className="text-xs text-green-700">Approved {new Date(p.approvedAt).toLocaleDateString("en-US", { dateStyle: "medium" })} — Credited to professional's wallet</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">Pro Booking Commissions</h1>
        <p className="text-muted-foreground">{pending.length} pending approval · 80% professional payout, 20% commission pool</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Pending Payouts</p>
              <p className="text-2xl font-bold text-amber-600">{pending.length}</p>
            </div>
            <Briefcase className="h-6 w-6 text-amber-400" />
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Amount Pending</p>
              <p className="text-2xl font-bold" style={{ color: GOLD }}>${totalPendingAmount.toFixed(2)}</p>
            </div>
            <DollarSign className="h-6 w-6" style={{ color: GOLD }} />
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Records</p>
              <p className="text-2xl font-bold text-foreground">{payouts.length}</p>
            </div>
            <TrendingUp className="h-6 w-6 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-widest text-amber-700 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                {pending.length} Awaiting Approval
              </h3>
              {pending.map((p: any) => <PayoutRow key={p.id} p={p} />)}
            </div>
          )}

          {pending.length === 0 && (
            <Card className="shadow-sm">
              <CardContent className="py-10 text-center text-muted-foreground">
                <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No pending professional payouts.</p>
              </CardContent>
            </Card>
          )}

          {processed.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Processed</h3>
              {processed.map((p: any) => <PayoutRow key={p.id} p={p} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
