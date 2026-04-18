import { useState } from "react";
import { useListOrders, useUpdateOrderStatus } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ReceiptModal } from "@/components/orders/ReceiptModal";

export function AdminOrdersPage() {
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [receiptOrder, setReceiptOrder] = useState<any | null>(null);
  const { toast } = useToast();

  const { data, isLoading, refetch } = useListOrders({
    page,
    limit: 20,
    status: status !== "all" ? status : undefined,
  });
  const updateStatus = useUpdateOrderStatus();

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

  const statusOptions = ["pending", "processing", "completed", "cancelled"];

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
                                : order.status === "cancelled"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {order.status}
                          </Badge>
                          <Badge
                            variant={
                              order.paymentStatus === "demo_paid" ? "default" : "secondary"
                            }
                          >
                            {order.paymentStatus?.replace("_", " ")}
                          </Badge>
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
      />
    </div>
  );
}
