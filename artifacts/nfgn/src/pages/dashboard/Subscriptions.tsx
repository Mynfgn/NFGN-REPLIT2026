import { useState, useEffect, useCallback } from "react";
import { customFetch } from "@/lib/custom-fetch";
import { useToast } from "@/hooks/use-toast";
import { useCartStore } from "@/hooks/use-cart-store";
import { resolveImageSrc } from "@/lib/image";
import {
  RefreshCw, Pause, Play, X, ShoppingCart, PackageCheck,
  Loader2, CalendarClock, Tag, RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const GOLD = "#C9A84C";
const DARK = "#0a0a0a";

type Subscription = {
  id: number;
  productId: number;
  productName: string;
  productImage: string | null;
  quantity: number;
  frequency: string;
  frequencyLabel: string;
  unitPrice: number;
  discountPct: number;
  discountedPrice: number;
  status: "active" | "paused" | "cancelled";
  nextOrderAt: string;
  shippingAddress: string | null;
  createdAt: string;
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  paused: "bg-amber-100 text-amber-800",
  cancelled: "bg-red-100 text-red-800",
};

function NextDate({ iso }: { iso: string }) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / 86400000);
  const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <CalendarClock className="h-3.5 w-3.5" />
      Next: {label}
      {diffDays <= 3 && diffDays >= 0 && (
        <Badge className="ml-1 bg-amber-500 text-white text-[10px] py-0">Due soon</Badge>
      )}
    </span>
  );
}

export function SubscriptionsPage() {
  const { toast } = useToast();
  const { setCartOpen } = useCartStore();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [tab, setTab] = useState<"active" | "paused" | "cancelled">("active");
  const [editingFreq, setEditingFreq] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customFetch("/api/subscriptions");
      const data = await res.json();
      setSubs(data.subscriptions ?? []);
    } catch {
      toast({ title: "Failed to load subscriptions", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  async function changeStatus(id: number, status: "active" | "paused" | "cancelled") {
    setActionId(id);
    try {
      const res = await customFetch(`/api/subscriptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) { toast({ title: data.error ?? "Error", variant: "destructive" }); return; }
      setSubs(prev => prev.map(s => s.id === id ? data.subscription : s));
      const msgs: Record<string, string> = { active: "Subscription resumed.", paused: "Subscription paused.", cancelled: "Subscription cancelled." };
      toast({ title: msgs[status] });
      if (status !== "cancelled") setTab(status);
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    } finally {
      setActionId(null);
    }
  }

  async function changeFrequency(id: number, frequency: string) {
    setActionId(id);
    try {
      const res = await customFetch(`/api/subscriptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frequency }),
      });
      const data = await res.json();
      if (!res.ok) { toast({ title: data.error ?? "Error", variant: "destructive" }); return; }
      setSubs(prev => prev.map(s => s.id === id ? data.subscription : s));
      setEditingFreq(null);
      toast({ title: "Delivery frequency updated." });
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    } finally {
      setActionId(null);
    }
  }

  async function reorder(id: number, name: string) {
    setActionId(id);
    try {
      const res = await customFetch(`/api/subscriptions/${id}/reorder`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { toast({ title: data.error ?? "Error", variant: "destructive" }); return; }
      toast({ title: `${name} added to cart!`, description: "Discount applied automatically." });
      setCartOpen(true);
      load();
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    } finally {
      setActionId(null);
    }
  }

  const filtered = subs.filter(s => s.status === tab);

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-serif" style={{ color: DARK }}>
            My Subscriptions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Autoship products on your schedule — always at 10% off.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {(["active", "paused", "cancelled"] as const).map(s => {
          const count = subs.filter(x => x.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setTab(s)}
              className={`rounded-xl border p-3 text-left transition-all ${tab === s ? "border-[#C9A84C] bg-[#fdf8ee]" : "border-gray-200 bg-white hover:border-gray-300"}`}
            >
              <div className="text-xl font-bold" style={{ color: tab === s ? GOLD : DARK }}>{count}</div>
              <div className="text-xs text-muted-foreground capitalize">{s}</div>
            </button>
          );
        })}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: GOLD }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center">
          <PackageCheck className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          <p className="font-semibold text-gray-500">No {tab} subscriptions</p>
          {tab === "active" && (
            <p className="text-sm text-muted-foreground mt-1">
              Visit the <a href="/shop" className="underline" style={{ color: GOLD }}>Shop</a> and click "Subscribe & Save" on any product.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(sub => {
            const busy = actionId === sub.id;
            const savingsPerOrder = ((sub.unitPrice - sub.discountedPrice) * sub.quantity).toFixed(2);
            return (
              <div
                key={sub.id}
                className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm"
              >
                <div className="flex gap-4 p-4">
                  {/* Product image */}
                  <div className="w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                    {sub.productImage ? (
                      <img src={resolveImageSrc(sub.productImage)!} alt={sub.productName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PackageCheck className="h-6 w-6 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm leading-tight line-clamp-2" style={{ color: DARK }}>
                        {sub.productName}
                      </h3>
                      <Badge className={`flex-shrink-0 text-[10px] capitalize ${STATUS_COLORS[sub.status]}`}>
                        {sub.status}
                      </Badge>
                    </div>

                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                      <span className="text-sm font-bold" style={{ color: GOLD }}>
                        ${sub.discountedPrice.toFixed(2)}
                        <span className="text-xs font-normal text-muted-foreground line-through ml-1.5">
                          ${sub.unitPrice.toFixed(2)}
                        </span>
                      </span>
                      <span className="flex items-center gap-1 text-xs text-emerald-700 font-medium">
                        <Tag className="h-3 w-3" />
                        Save ${savingsPerOrder}/order
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                      <span className="text-xs text-muted-foreground">Qty: {sub.quantity}</span>
                      {editingFreq === sub.id ? (
                        <div className="flex items-center gap-1.5">
                          <Select
                            defaultValue={sub.frequency}
                            onValueChange={v => changeFrequency(sub.id, v)}
                            disabled={busy}
                          >
                            <SelectTrigger className="h-6 text-xs w-36 border-[#C9A84C]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="bimonthly">Every 2 Months</SelectItem>
                              <SelectItem value="quarterly">Quarterly</SelectItem>
                            </SelectContent>
                          </Select>
                          <button onClick={() => setEditingFreq(null)} className="text-xs text-muted-foreground hover:text-red-500">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          className="text-xs underline underline-offset-2"
                          style={{ color: GOLD }}
                          onClick={() => setEditingFreq(sub.id)}
                        >
                          {sub.frequencyLabel}
                        </button>
                      )}
                    </div>

                    {sub.status !== "cancelled" && (
                      <div className="mt-1.5">
                        <NextDate iso={sub.nextOrderAt} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Action bar */}
                {sub.status !== "cancelled" && (
                  <div className="border-t border-gray-100 px-4 py-2.5 flex flex-wrap gap-2 bg-gray-50/60">
                    <Button
                      size="sm"
                      className="h-7 text-xs font-semibold"
                      style={{ background: GOLD, color: "#000" }}
                      onClick={() => reorder(sub.id, sub.productName)}
                      disabled={busy}
                    >
                      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <ShoppingCart className="h-3.5 w-3.5 mr-1" />}
                      Order Now
                    </Button>

                    {sub.status === "active" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => changeStatus(sub.id, "paused")}
                        disabled={busy}
                      >
                        <Pause className="h-3 w-3 mr-1" /> Pause
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => changeStatus(sub.id, "active")}
                        disabled={busy}
                      >
                        <Play className="h-3 w-3 mr-1" /> Resume
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => changeStatus(sub.id, "cancelled")}
                      disabled={busy}
                    >
                      <X className="h-3 w-3 mr-1" /> Cancel
                    </Button>
                  </div>
                )}

                {sub.status === "cancelled" && (
                  <div className="border-t border-gray-100 px-4 py-2.5 bg-gray-50/60">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => changeStatus(sub.id, "active")}
                      disabled={busy}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" /> Reactivate
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
