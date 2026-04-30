import { useState } from "react";
import { useListOrders } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingBag, Receipt } from "lucide-react";
import { ReceiptModal } from "@/components/orders/ReceiptModal";
import { customFetch } from "@/lib/custom-fetch";

const statusColors: Record<string, string> = {
  pending: "secondary",
  processing: "secondary",
  completed: "default",
  cancelled: "destructive",
  refunded: "destructive",
};

export function OrdersPage() {
  const [receiptOrder, setReceiptOrder] = useState<any | null>(null);

  const { data: me } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: () => customFetch("/api/auth/me").then(r => r.json()),
    staleTime: 60_000,
  });

  // Always scope orders to the current user's ID so admins viewing their
  // member dashboard don't accidentally see every member's orders.
  const { data, isLoading } = useListOrders(
    { page: 1, limit: 20, userId: me?.id },
    { query: { enabled: !!me?.id } },
  );
  const orders = data?.orders ?? [];

  const { data: bppData } = useQuery({
    queryKey: ["/api/bpp/dashboard"],
    queryFn: () => customFetch("/api/bpp/dashboard").then(r => r.ok ? r.json() : null),
    staleTime: 60_000,
    enabled: !!me?.isProMember,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">My Orders</h1>
        <p className="text-muted-foreground">Track and manage your purchases</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-serif text-xl font-bold mb-2">No orders yet</h3>
              <p className="text-muted-foreground">When you place orders, they'll show up here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order: any) => (
                <div
                  key={order.id}
                  className="border rounded-lg p-4 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold font-mono text-sm">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">${order.total.toFixed(2)}</p>
                      <Badge variant={(statusColors[order.status] ?? "secondary") as any}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                  {order.items?.length > 0 && (
                    <div className="mb-3 space-y-0.5">
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
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
                      onClick={() => setReceiptOrder(order)}
                    >
                      <Receipt className="h-3.5 w-3.5" />
                      View Receipt
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ReceiptModal
        order={receiptOrder}
        open={!!receiptOrder}
        onClose={() => setReceiptOrder(null)}
        isProMember={!!me?.isProMember}
        currentMonthPv={bppData?.personalVolume ?? 0}
      />
    </div>
  );
}
