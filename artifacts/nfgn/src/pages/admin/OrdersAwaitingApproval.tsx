import { useState } from "react";
import { customFetch } from "@/lib/custom-fetch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Loader2, CheckCircle2, XCircle, RefreshCw, Clock,
  CreditCard, Smartphone, Package, Receipt, AlertCircle, Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ReceiptModal } from "@/components/orders/ReceiptModal";

const PAYMENT_METHOD_LABELS: Record<string, { label: string; icon: JSX.Element; color: string }> = {
  cod: { label: "Cash on Delivery (COD)", icon: <Package className="h-3.5 w-3.5" />, color: "text-orange-700 bg-orange-50 border-orange-200" },
  cashapp: { label: "CashApp", icon: <Smartphone className="h-3.5 w-3.5" />, color: "text-green-700 bg-green-50 border-green-200" },
  special: { label: "Special Order", icon: <CreditCard className="h-3.5 w-3.5" />, color: "text-purple-700 bg-purple-50 border-purple-200" },
};

function paymentMethodBadge(method: string) {
  const m = PAYMENT_METHOD_LABELS[method];
  if (m) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border font-medium ${m.color}`}>
        {m.icon} {m.label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border font-medium text-muted-foreground bg-muted">
      <CreditCard className="h-3.5 w-3.5" /> {method}
    </span>
  );
}

async function fetchPendingOrders(page: number) {
  const res = await customFetch(`/api/orders?paymentStatus=pending&page=${page}&limit=25`);
  if (!res.ok) throw new Error("Failed to fetch orders");
  return res.json();
}

async function updateOrder(orderId: number, status: string, paymentStatus: string, notes?: string) {
  const res = await customFetch(`/api/orders/${orderId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, paymentStatus, notes }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function OrdersAwaitingApprovalPage() {
  const [page, setPage] = useState(1);
  const [receiptOrder, setReceiptOrder] = useState<any | null>(null);
  const [approveOrder, setApproveOrder] = useState<any | null>(null);
  const [rejectOrder, setRejectOrder] = useState<any | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [fundsReceived, setFundsReceived] = useState(false);
  const [fundsLocation, setFundsLocation] = useState("");
  const [fundsReceivedBy, setFundsReceivedBy] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["orders-awaiting", page],
    queryFn: () => fetchPendingOrders(page),
  });

  const buildApprovalNote = () => {
    const parts: string[] = [];
    const isManualPayment = approveOrder && ["cod", "cashapp"].includes(approveOrder.paymentMethod);
    if (isManualPayment) {
      parts.push(`Funds received: ${fundsReceived ? "Yes" : "No"}`);
      if (fundsLocation) parts.push(`Received at/via: ${fundsLocation}`);
      if (fundsReceivedBy) parts.push(`Received by: ${fundsReceivedBy}`);
    }
    if (actionNote) parts.push(actionNote);
    return parts.join(" | ");
  };

  const approveMutation = useMutation({
    mutationFn: ({ orderId, note }: { orderId: number; note: string }) =>
      updateOrder(orderId, "processing", "paid", note || undefined),
    onSuccess: () => {
      toast({ title: "Order approved", description: "Payment confirmed and order moved to Processing." });
      setApproveOrder(null);
      setActionNote("");
      setFundsReceived(false);
      setFundsLocation("");
      setFundsReceivedBy("");
      queryClient.invalidateQueries({ queryKey: ["orders-awaiting"] });
      refetch();
    },
    onError: (e: any) => toast({ variant: "destructive", title: "Approval failed", description: e.message }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ orderId, note }: { orderId: number; note: string }) =>
      updateOrder(orderId, "cancelled", "failed", note || undefined),
    onSuccess: () => {
      toast({ title: "Order rejected", description: "Order has been cancelled." });
      setRejectOrder(null);
      setActionNote("");
      queryClient.invalidateQueries({ queryKey: ["orders-awaiting"] });
      refetch();
    },
    onError: (e: any) => toast({ variant: "destructive", title: "Rejection failed", description: e.message }),
  });

  const orders: any[] = data?.orders ?? [];
  const total: number = data?.total ?? 0;
  const totalPages: number = data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold flex items-center gap-3">
            <Clock className="h-7 w-7 text-amber-600" />
            Awaiting Approval
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Orders pending payment verification — COD, CashApp, special orders, and other manual payment methods.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-base px-3 py-1">
            {total} pending
          </Badge>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Info banner */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="pt-4 pb-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900 space-y-1">
              <p className="font-semibold">What appears here?</p>
              <p className="text-xs leading-relaxed">
                All orders placed with a manual payment method (COD, CashApp, special orders, or any method requiring 
                manual verification) appear here with <strong>Pending</strong> payment status. Review each order, 
                confirm receipt of payment, and either <strong className="text-green-700">Approve</strong> (moves to Processing) 
                or <strong className="text-red-600">Reject</strong> (cancels the order).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-600" />
            Pending Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="text-lg font-semibold text-foreground">All caught up!</p>
              <p className="text-sm text-muted-foreground">No orders are currently awaiting approval.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order: any) => (
                <div
                  key={order.id}
                  className="border rounded-xl p-4 hover:border-amber-300 transition-colors bg-white"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Order number + badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-sm text-foreground">
                          {order.orderNumber}
                        </span>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {order.status}
                        </Badge>
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border font-medium text-amber-700 bg-amber-50 border-amber-200">
                          <Clock className="h-3 w-3" /> payment pending
                        </span>
                        {paymentMethodBadge(order.paymentMethod)}
                      </div>

                      {/* Customer */}
                      <p className="text-sm font-medium text-foreground">{order.userName}</p>
                      <p className="text-xs text-muted-foreground">
                        Placed: {new Date(order.createdAt).toLocaleString()}
                      </p>

                      {/* Shipping address */}
                      {order.shippingAddress && (
                        <p className="text-xs text-muted-foreground">
                          📍 {order.shippingAddress}
                        </p>
                      )}

                      {/* Notes */}
                      {order.notes && (
                        <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1 border">
                          <span className="font-medium text-foreground">Note: </span>{order.notes}
                        </div>
                      )}

                      {/* Line items */}
                      {order.items?.length > 0 && (
                        <div className="space-y-0.5 mt-1">
                          {order.items.map((item: any) => (
                            <p key={item.id} className="text-xs text-muted-foreground">
                              {item.productName} × {item.quantity}
                              <span className="text-foreground font-medium ml-1">${item.total.toFixed(2)}</span>
                              {(item.cvTotal ?? 0) > 0 && (
                                <span className="ml-1 text-blue-600 font-semibold">{item.cvTotal} CV</span>
                              )}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right side — total + actions */}
                    <div className="flex-shrink-0 flex flex-col items-end gap-2 min-w-[120px]">
                      <div className="text-right">
                        <p className="text-xl font-bold text-foreground">${order.total.toFixed(2)}</p>
                        {(order.discount ?? 0) > 0 && (
                          <p className="text-xs text-green-600">−${order.discount.toFixed(2)} discount</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Tax ${order.tax.toFixed(2)} · Ship ${order.shipping.toFixed(2)}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1.5 w-full"
                        onClick={() => setReceiptOrder(order)}
                      >
                        <Receipt className="h-3.5 w-3.5" />
                        View Receipt
                      </Button>

                      <Button
                        size="sm"
                        className="h-8 text-xs gap-1.5 w-full bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => {
                          setApproveOrder(order);
                          setActionNote("");
                          setFundsReceived(false);
                          setFundsLocation("");
                          setFundsReceivedBy("");
                        }}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Approve
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1.5 w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400"
                        onClick={() => { setRejectOrder(order); setActionNote(""); }}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center pt-4 border-t">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Receipt modal */}
      <ReceiptModal order={receiptOrder} open={!!receiptOrder} onClose={() => setReceiptOrder(null)} />

      {/* Approve dialog */}
      <Dialog open={!!approveOrder} onOpenChange={() => { setApproveOrder(null); setFundsReceived(false); setFundsLocation(""); setFundsReceivedBy(""); setActionNote(""); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              Approve Payment
            </DialogTitle>
          </DialogHeader>
          {approveOrder && (() => {
            const isManualPayment = ["cod", "cashapp"].includes(approveOrder.paymentMethod);
            return (
              <div className="space-y-4">
                {/* Order summary */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm space-y-1">
                  <p className="font-mono font-bold text-green-900">{approveOrder.orderNumber}</p>
                  <p className="text-green-800">{approveOrder.userName}</p>
                  <p className="text-green-900 font-bold text-base">${approveOrder.total.toFixed(2)}</p>
                  <div>{paymentMethodBadge(approveOrder.paymentMethod)}</div>
                </div>

                {/* Funds verification — COD / CashApp only */}
                {isManualPayment && (
                  <div className="border rounded-lg p-4 space-y-4 bg-amber-50 border-amber-200">
                    <p className="text-xs font-semibold text-amber-900 uppercase tracking-wide">Payment Verification</p>

                    {/* Were funds received? */}
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="fundsReceived"
                        checked={fundsReceived}
                        onCheckedChange={(v) => setFundsReceived(!!v)}
                        className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                      />
                      <Label htmlFor="fundsReceived" className="text-sm font-medium cursor-pointer">
                        Funds have been received
                        <span className={`ml-2 text-xs font-bold px-1.5 py-0.5 rounded ${fundsReceived ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                          {fundsReceived ? "YES" : "NO"}
                        </span>
                      </Label>
                    </div>

                    {/* Where were funds received */}
                    <div className="space-y-1.5">
                      <Label htmlFor="fundsLocation" className="text-sm font-medium">
                        Where were the funds received?
                      </Label>
                      <Input
                        id="fundsLocation"
                        placeholder={approveOrder.paymentMethod === "cashapp"
                          ? "e.g. CashApp — $Cashtag or transaction ID"
                          : "e.g. at the door, branch office, via courier"}
                        value={fundsLocation}
                        onChange={e => setFundsLocation(e.target.value)}
                      />
                    </div>

                    {/* Who received the funds */}
                    <div className="space-y-1.5">
                      <Label htmlFor="fundsReceivedBy" className="text-sm font-medium">
                        Who received the funds?
                      </Label>
                      <Input
                        id="fundsReceivedBy"
                        placeholder="e.g. Jane Doe (Delivery Rep), Admin Name"
                        value={fundsReceivedBy}
                        onChange={e => setFundsReceivedBy(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <p className="text-sm text-muted-foreground">
                  Approving will mark this order as <strong>Paid</strong> and move it to <strong>Processing</strong>.{" "}
                  {isManualPayment
                    ? "Only approve after confirming cash or payment receipt."
                    : "Only approve after confirming payment."}
                </p>

                {/* Additional note */}
                <div className="space-y-1.5">
                  <Label htmlFor="approveNote">Additional Note (optional)</Label>
                  <Textarea
                    id="approveNote"
                    placeholder="Any extra details about this payment…"
                    rows={2}
                    value={actionNote}
                    onChange={e => setActionNote(e.target.value)}
                  />
                </div>
              </div>
            );
          })()}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setApproveOrder(null)}>Cancel</Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
              onClick={() => approveMutation.mutate({ orderId: approveOrder.id, note: buildApprovalNote() })}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={!!rejectOrder} onOpenChange={() => setRejectOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Reject Order
            </DialogTitle>
          </DialogHeader>
          {rejectOrder && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm space-y-1">
                <p className="font-mono font-bold text-red-900">{rejectOrder.orderNumber}</p>
                <p className="text-red-800">{rejectOrder.userName}</p>
                <p className="text-red-900 font-bold text-base">${rejectOrder.total.toFixed(2)}</p>
                <div>{paymentMethodBadge(rejectOrder.paymentMethod)}</div>
              </div>
              <p className="text-sm text-muted-foreground">
                Rejecting will <strong>cancel</strong> this order and mark payment as failed. 
                This action cannot be undone.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="rejectNote">Rejection Reason (optional)</Label>
                <Textarea
                  id="rejectNote"
                  placeholder="e.g. Payment not received after 3 days, unable to verify CashApp transaction"
                  rows={3}
                  value={actionNote}
                  onChange={e => setActionNote(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectOrder(null)}>Cancel</Button>
            <Button
              variant="destructive"
              className="gap-1.5"
              onClick={() => rejectMutation.mutate({ orderId: rejectOrder.id, note: actionNote })}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Reject Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
