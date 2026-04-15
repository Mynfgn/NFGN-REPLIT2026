import { useListOrders } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShoppingBag } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "secondary",
  processing: "secondary",
  completed: "default",
  cancelled: "destructive",
  refunded: "destructive",
};

export function OrdersPage() {
  const { data, isLoading } = useListOrders({ page: 1, limit: 20 });
  const orders = data?.orders ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">My Orders</h1>
        <p className="text-muted-foreground">Track and manage your purchases</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-serif text-xl font-bold mb-2">No orders yet</h3>
              <p className="text-muted-foreground">When you place orders, they'll show up here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order: any) => (
                <div key={order.id} className="border rounded-lg p-4 hover:border-primary/30 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold font-mono text-sm">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">${order.total.toFixed(2)}</p>
                      <Badge variant={(statusColors[order.status] ?? "secondary") as any}>{order.status}</Badge>
                    </div>
                  </div>
                  {order.items?.length > 0 && (
                    <div className="border-t pt-3 space-y-2">
                      {order.items.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{item.productName} × {item.quantity}</span>
                          <span>${item.total.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="border-t mt-3 pt-3 flex gap-4 text-xs text-muted-foreground">
                    <span>Payment: <span className="capitalize">{order.paymentMethod}</span></span>
                    <span>Status: <span className={`capitalize font-medium ${order.paymentStatus === "demo_paid" ? "text-green-600" : ""}`}>{order.paymentStatus?.replace("_", " ")}</span></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
