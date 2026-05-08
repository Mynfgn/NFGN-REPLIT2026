import { useState } from "react";
import { useUpdateOrderStatus } from "@workspace/api-client-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { customFetch } from "@/lib/custom-fetch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Receipt, RefreshCw, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ReceiptModal } from "@/components/orders/ReceiptModal";

export function AdminOrdersPage() {
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [receiptOrder, setReceiptOrder] = useState<any | null>(null);
  const [refundOrder, setRefundOrder] = useState<any | null>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundNote, setRefundNote] = useState("");
  const [fullRefund, setFullRefund] = useState(false);
  const { toast } = useToast();

  const statusParam = status !== "all" ? `&status=${status}` : "";
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/orders", page, status],
    queryFn: () =>
      customFetch(`/api/admin/orders?page=${page}&limit=20${statusParam}`).then((r: any) => r.json()),
  });
  const updateStatus = useUpdateOrderStatus();

  const refundMutation = useMutation({
    mutationFn: async ({ orderId, amount, note, full }: { orderId: number; amount: number; note: string; full: boolean }) => {
      const res = await customFetch(`/api/orders/${orderId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refundAmount: amount, refundNote: note, fullRefund: full }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Refund issued successfully!" });
      setRefundOrder(null);
      setRefundAmount("");
      setRefundNote("");
      setFullRefund(false);
      refetch();
    },
    onError: (e: any) => toast({ variant: "destructive", title: "Refund failed", description: e.message }),
  });

  const orders = data?.orders ?? [];

  function handleStatusChange(orderId: number, newStatus: string) {
    updateStatus.mutate(
      { id: orderId, data: { status: newStatus } },
      {
        onSuccess: () => { toast({ title: "Order updated" }); refetch(); },
        onError: (e: any) =>
          toast({ variant: "destructive", title: "Error", description: e.message }),
      }
    );
  }

  function openRefund(order: any) {
    setRefundOrder(order);
    setRefundAmount(order.total.toFixed(2));
    setRefundNote("");
    setFullRefund(false);
  }

  function handleRefundSubmit() {
    if (!refundOrder) return;
    const amount = parseFloat(refundAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ variant: "destructive", title: "Invalid amount" });
      return;
    }
    refundMutation.mutate({ orderId: refundOrder.id, amount, note: refundNote, full: fullRefund });
  }

  const statusOptions = ["pending", "approved", "processing", "completed", "cancelled"];

  const PAYMENT_STATUS_LABELS: Record<string, string> = {
    paid: "Paid",
    not_received: "COD: Not Received",
    collected: "COD: Collected",
    payment_received: "COD: Payment Received",
    demo_paid: "Demo Paid",
    pending: "Pending",
    refunded: "Refunded",
  };

  const COD_PAYMENT_OPTIONS = [
    { value: "not_received", label: "Not Received" },
    { value: "collected", label: "Collected" },
    { value: "payment_received", label: "Payment Received" },
  ];

  function handlePaymentStatusChange(orderId: number, newPaymentStatus: string) {
    customFetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus: newPaymentStatus }),
    }).then((res: any) => {
      if (res.ok) { toast({ title: "Payment status updated" }); refetch(); }
      else toast({ variant: "destructive", title: "Update failed" });
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold">Orders</h1>
          <p className="text-muted-foreground">{data?.total ?? 0} total orders</p>
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {statusOptions.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : orders.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No orders found.</p>
          ) : (
            <>
              <div className="space-y-3">
                {orders.map((order: any) => (
                  <div
                    key={order.id}
                    className="border rounded-lg p-4 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-mono font-bold text-sm">
                            {order.orderNumber}
                          </span>
                          <Badge
                            variant={
                              order.status === "completed"
                                ? "default"
                                : order.status === "cancelled" || order.status === "refunded"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {order.status}
                          </Badge>
                          <Badge
                            variant={
                              order.paymentStatus === "paid" || order.paymentStatus === "demo_paid" || order.paymentStatus === "collected" || order.paymentStatus === "payment_received"
                                ? "default"
                                : order.paymentStatus === "not_received"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus?.replace(/_/g, " ")}
                          </Badge>
                          {(order.refundAmount ?? 0) > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              Refunded ${order.refundAmount.toFixed(2)}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {order.userName} • {order.paymentMethod}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleString()}
                        </p>
                        {order.shippingAddress && (
                          <p className="text-xs text-muted-foreground mt-1">
                            📍 {order.shippingAddress}
                          </p>
                        )}
                        {order.items?.length > 0 && (
                          <div className="mt-2 space-y-0.5">
                            {order.items.map((item: any) => (
                              <p key={item.id} className="text-xs text-muted-foreground">
                                {item.productName} × {item.quantity} — ${item.total.toFixed(2)}
                                {(item.cvTotal ?? 0) > 0 && (
                                  <span className="ml-1 text-blue-700 font-semibold">{item.cvTotal} CV</span>
                                )}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
                        <div>
                          <p className="font-bold text-lg">${order.total.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">
                            Subtotal ${order.subtotal.toFixed(2)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/60"
                          onClick={() => setReceiptOrder(order)}
                        >
                          <Receipt className="h-3.5 w-3.5" />
                          View Receipt
                        </Button>
                        {order.status !== "refunded" && order.status !== "cancelled" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1.5 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400"
                            onClick={() => openRefund(order)}
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Refund
                          </Button>
                        )}
                        <Select
                          value={order.status}
                          onValueChange={(s) => handleStatusChange(order.id, s)}
                        >
                          <SelectTrigger className="w-32 h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((s) => (
                              <SelectItem key={s} value={s} className="capitalize text-xs">
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {order.paymentMethod === "cod" && (
                          <Select
                            value={order.paymentStatus}
                            onValueChange={(s) => handlePaymentStatusChange(order.id, s)}
                          >
                            <SelectTrigger className="w-40 h-7 text-xs border-amber-300 text-amber-800">
                              <SelectValue placeholder="COD Status" />
                            </SelectTrigger>
                            <SelectContent>
                              {COD_PAYMENT_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {data && data.totalPages > 1 && (
                <div className="flex justify-between items-center mt-6 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {data.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= data.totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <ReceiptModal
        order={receiptOrder}
        open={!!receiptOrder}
        onClose={() => setReceiptOrder(null)}
        allowResign
      />

      {/* Refund Modal */}
      <Dialog open={!!refundOrder} onOpenChange={() => setRefundOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Issue Refund
            </DialogTitle>
          </DialogHeader>
          {refundOrder && (
            <div className="space-y-4">
              <div className="bg-muted/40 rounded-lg p-3 text-sm">
                <p className="font-mono font-bold">{refundOrder.orderNumber}</p>
                <p className="text-muted-foreground">{refundOrder.userName}</p>
                <p className="font-bold text-base mt-1">${refundOrder.total.toFixed(2)}</p>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="fullRefund"
                  checked={fullRefund}
                  onCheckedChange={(checked) => {
                    setFullRefund(!!checked);
                    if (checked) setRefundAmount(refundOrder.total.toFixed(2));
                  }}
                />
                <Label htmlFor="fullRefund" className="text-sm cursor-pointer">
                  Full refund (${refundOrder.total.toFixed(2)}) — marks order as Refunded
                </Label>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="refundAmount">Refund Amount ($)</Label>
                <Input
                  id="refundAmount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={refundOrder.total}
                  value={refundAmount}
                  onChange={e => { setRefundAmount(e.target.value); setFullRefund(false); }}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="refundNote">Reason / Note</Label>
                <Textarea
                  id="refundNote"
                  placeholder="Optional reason for refund..."
                  rows={3}
                  value={refundNote}
                  onChange={e => setRefundNote(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setRefundOrder(null)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 gap-1.5"
                  onClick={handleRefundSubmit}
                  disabled={refundMutation.isPending}
                >
                  {refundMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Issue Refund
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
