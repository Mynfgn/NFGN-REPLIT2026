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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Loader2, CheckCircle2, XCircle, RefreshCw, ShieldCheck,
  Package, Smartphone, CreditCard, Receipt, AlertCircle,
  Clock, DollarSign, Hash, User, MapPin, FileText, ChevronDown,
  ChevronUp, BadgeCheck,
} from "lucide-react";
import type { JSX } from "react";
import { useToast } from "@/hooks/use-toast";
import { ReceiptModal } from "@/components/orders/ReceiptModal";

type PaymentTab = "all" | "cod" | "cashapp" | "paypal" | "special";

const TABS: { id: PaymentTab; label: string; icon: JSX.Element; color: string; bg: string; border: string }[] = [
  { id: "all",     label: "All Pending",   icon: <Clock className="h-3.5 w-3.5" />,       color: "text-slate-700",  bg: "bg-slate-50",   border: "border-slate-200" },
  { id: "cod",     label: "COD",           icon: <Package className="h-3.5 w-3.5" />,     color: "text-orange-700", bg: "bg-orange-50",  border: "border-orange-200" },
  { id: "cashapp", label: "CashApp",       icon: <Smartphone className="h-3.5 w-3.5" />,  color: "text-green-700",  bg: "bg-green-50",   border: "border-green-200" },
  { id: "paypal",  label: "PayPal",        icon: <DollarSign className="h-3.5 w-3.5" />,  color: "text-blue-700",   bg: "bg-blue-50",    border: "border-blue-200" },
  { id: "special", label: "Special",       icon: <CreditCard className="h-3.5 w-3.5" />,  color: "text-purple-700", bg: "bg-purple-50",  border: "border-purple-200" },
];

function paymentMethodParam(tab: PaymentTab): string {
  if (tab === "all") return "cod,cashapp,paypal,special";
  return tab;
}

async function fetchOrders(tab: PaymentTab, page: number) {
  const methods = paymentMethodParam(tab);
  const res = await customFetch(
    `/api/orders?paymentStatus=pending&paymentMethod=${methods}&page=${page}&limit=20`
  );
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

function PaymentBadge({ method }: { method: string }) {
  const map: Record<string, { label: string; icon: JSX.Element; cls: string }> = {
    cod:     { label: "Cash on Delivery", icon: <Package className="h-3 w-3" />,    cls: "text-orange-700 bg-orange-50 border-orange-300" },
    cashapp: { label: "CashApp",          icon: <Smartphone className="h-3 w-3" />, cls: "text-green-700 bg-green-50 border-green-300" },
    paypal:  { label: "PayPal",           icon: <DollarSign className="h-3 w-3" />, cls: "text-blue-700 bg-blue-50 border-blue-300" },
    special: { label: "Special Order",   icon: <CreditCard className="h-3 w-3" />,  cls: "text-purple-700 bg-purple-50 border-purple-300" },
  };
  const m = map[method];
  if (!m) return <Badge variant="outline" className="text-xs gap-1">{method}</Badge>;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border font-medium ${m.cls}`}>
      {m.icon} {m.label}
    </span>
  );
}

function VerificationPanel({
  method, fundsReceived, setFundsReceived,
  txId, setTxId, location, setLocation,
  receivedBy, setReceivedBy,
}: {
  method: string;
  fundsReceived: boolean; setFundsReceived: (v: boolean) => void;
  txId: string; setTxId: (v: string) => void;
  location: string; setLocation: (v: string) => void;
  receivedBy: string; setReceivedBy: (v: string) => void;
}) {
  if (method === "cashapp") return (
    <div className="border rounded-lg p-4 space-y-3 bg-green-50 border-green-200">
      <p className="text-xs font-semibold text-green-900 uppercase tracking-wide flex items-center gap-1.5">
        <Smartphone className="h-3.5 w-3.5" /> CashApp Verification
      </p>
      <div className="flex items-center gap-3">
        <Checkbox id="fr" checked={fundsReceived} onCheckedChange={v => setFundsReceived(!!v)}
          className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600" />
        <Label htmlFor="fr" className="text-sm font-medium cursor-pointer">
          Payment received in CashApp
          <span className={`ml-2 text-xs font-bold px-1.5 py-0.5 rounded ${fundsReceived ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
            {fundsReceived ? "CONFIRMED" : "UNCONFIRMED"}
          </span>
        </Label>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="txId" className="text-sm font-medium flex items-center gap-1.5"><Hash className="h-3.5 w-3.5" /> CashApp Transaction ID or $Cashtag</Label>
        <Input id="txId" placeholder="e.g. #CASHTAG or Transaction ID from CashApp" value={txId} onChange={e => setTxId(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="rb" className="text-sm font-medium flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Verified by</Label>
        <Input id="rb" placeholder="Staff member who verified the transaction" value={receivedBy} onChange={e => setReceivedBy(e.target.value)} />
      </div>
    </div>
  );

  if (method === "paypal") return (
    <div className="border rounded-lg p-4 space-y-3 bg-blue-50 border-blue-200">
      <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
        <DollarSign className="h-3.5 w-3.5" /> PayPal Verification
      </p>
      <div className="flex items-center gap-3">
        <Checkbox id="fr" checked={fundsReceived} onCheckedChange={v => setFundsReceived(!!v)}
          className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" />
        <Label htmlFor="fr" className="text-sm font-medium cursor-pointer">
          PayPal payment confirmed
          <span className={`ml-2 text-xs font-bold px-1.5 py-0.5 rounded ${fundsReceived ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-600"}`}>
            {fundsReceived ? "CONFIRMED" : "UNCONFIRMED"}
          </span>
        </Label>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="txId" className="text-sm font-medium flex items-center gap-1.5"><Hash className="h-3.5 w-3.5" /> PayPal Transaction ID</Label>
        <Input id="txId" placeholder="e.g. 5TG34567XY123456A" value={txId} onChange={e => setTxId(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="rb" className="text-sm font-medium flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Verified by</Label>
        <Input id="rb" placeholder="Staff member who verified the transaction" value={receivedBy} onChange={e => setReceivedBy(e.target.value)} />
      </div>
    </div>
  );

  if (method === "cod") return (
    <div className="border rounded-lg p-4 space-y-3 bg-orange-50 border-orange-200">
      <p className="text-xs font-semibold text-orange-900 uppercase tracking-wide flex items-center gap-1.5">
        <Package className="h-3.5 w-3.5" /> Cash on Delivery Verification
      </p>
      <div className="flex items-center gap-3">
        <Checkbox id="fr" checked={fundsReceived} onCheckedChange={v => setFundsReceived(!!v)}
          className="data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600" />
        <Label htmlFor="fr" className="text-sm font-medium cursor-pointer">
          Cash has been collected
          <span className={`ml-2 text-xs font-bold px-1.5 py-0.5 rounded ${fundsReceived ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
            {fundsReceived ? "COLLECTED" : "NOT YET"}
          </span>
        </Label>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="loc" className="text-sm font-medium flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Collection location / method</Label>
        <Input id="loc" placeholder="e.g. at the door, branch office, via courier" value={location} onChange={e => setLocation(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="rb" className="text-sm font-medium flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Collected by</Label>
        <Input id="rb" placeholder="e.g. Delivery Rep — Jane Doe" value={receivedBy} onChange={e => setReceivedBy(e.target.value)} />
      </div>
    </div>
  );

  if (method === "special") return (
    <div className="border rounded-lg p-4 space-y-3 bg-purple-50 border-purple-200">
      <p className="text-xs font-semibold text-purple-900 uppercase tracking-wide flex items-center gap-1.5">
        <CreditCard className="h-3.5 w-3.5" /> Special Order Verification
      </p>
      <div className="flex items-center gap-3">
        <Checkbox id="fr" checked={fundsReceived} onCheckedChange={v => setFundsReceived(!!v)}
          className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600" />
        <Label htmlFor="fr" className="text-sm font-medium cursor-pointer">
          Payment / arrangement confirmed
          <span className={`ml-2 text-xs font-bold px-1.5 py-0.5 rounded ${fundsReceived ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
            {fundsReceived ? "CONFIRMED" : "UNCONFIRMED"}
          </span>
        </Label>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="loc" className="text-sm font-medium flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Special arrangement details</Label>
        <Input id="loc" placeholder="e.g. Net-30 invoice, in-person payment plan" value={location} onChange={e => setLocation(e.target.value)} />
      </div>
    </div>
  );

  return null;
}

function OrderCard({
  order,
  onApprove,
  onReject,
  onViewReceipt,
}: {
  order: any;
  onApprove: (o: any) => void;
  onReject: (o: any) => void;
  onViewReceipt: (o: any) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border rounded-xl bg-white hover:shadow-sm transition-shadow">
      {/* Collapsed header — always visible */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-1 min-w-0 flex flex-wrap items-center gap-2">
          <span className="font-mono font-bold text-sm">{order.orderNumber}</span>
          <PaymentBadge method={order.paymentMethod} />
          <span className="text-xs text-muted-foreground">· {order.userName}</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            · {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="font-bold text-base">${order.total.toFixed(2)}</span>
          <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
            <Clock className="h-3 w-3" /> Pending
          </span>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t px-4 pb-4 pt-3 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Left: order info */}
            <div className="space-y-2">
              {order.shippingAddress && (
                <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                  {order.shippingAddress}
                </p>
              )}
              {order.notes && (
                <div className="text-xs bg-muted/50 border rounded px-2.5 py-1.5">
                  <span className="font-medium text-foreground">Customer note: </span>
                  {order.notes}
                </div>
              )}
              <div className="space-y-0.5">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{item.productName} × {item.quantity}</span>
                    <span className="font-medium">${item.total.toFixed(2)}
                      {(item.cvTotal ?? 0) > 0 && <span className="ml-1 text-blue-600 font-semibold">{item.cvTotal} CV</span>}
                    </span>
                  </div>
                ))}
              </div>
              <div className="pt-1 border-t text-xs space-y-0.5 text-muted-foreground">
                <div className="flex justify-between"><span>Subtotal</span><span>${order.subtotal?.toFixed(2)}</span></div>
                {(order.discount ?? 0) > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>−${order.discount.toFixed(2)}</span></div>}
                <div className="flex justify-between"><span>Tax</span><span>${order.tax.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Shipping</span><span>${order.shipping.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-foreground text-sm pt-1 border-t"><span>Total</span><span>${order.total.toFixed(2)}</span></div>
              </div>
            </div>

            {/* Right: action buttons */}
            <div className="flex flex-col gap-2 sm:items-end justify-start">
              <Button size="sm" variant="outline" className="gap-1.5 w-full sm:w-auto" onClick={() => onViewReceipt(order)}>
                <Receipt className="h-3.5 w-3.5" /> View Receipt
              </Button>
              <Button
                size="sm"
                className="gap-1.5 w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
                onClick={() => onApprove(order)}
              >
                <BadgeCheck className="h-3.5 w-3.5" /> Approve Payment
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 w-full sm:w-auto border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400"
                onClick={() => onReject(order)}
              >
                <XCircle className="h-3.5 w-3.5" /> Reject Order
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TabPanel({
  tab, onApprove, onReject, onViewReceipt,
}: {
  tab: PaymentTab;
  onApprove: (o: any) => void;
  onReject: (o: any) => void;
  onViewReceipt: (o: any) => void;
}) {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["orders-approval", tab, page],
    queryFn: () => fetchOrders(tab, page),
    refetchInterval: 60_000,
  });

  const orders: any[] = data?.orders ?? [];
  const total: number = data?.total ?? 0;
  const totalPages: number = data?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Loading…" : `${total} order${total !== 1 ? "s" : ""} awaiting approval`}
        </p>
        <Button variant="outline" size="sm" onClick={() => { refetch(); queryClient.invalidateQueries({ queryKey: ["orders-approval"] }); }} disabled={isFetching}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-400" />
          <p className="font-semibold text-lg">All cleared!</p>
          <p className="text-sm text-muted-foreground">No {tab === "all" ? "" : tab.toUpperCase() + " "}orders pending approval.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {orders.map(order => (
              <OrderCard key={order.id} order={order} onApprove={onApprove} onReject={onReject} onViewReceipt={onViewReceipt} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-between items-center pt-4 border-t">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TabBadge({ tab }: { tab: PaymentTab }) {
  const { data } = useQuery({
    queryKey: ["orders-approval-count", tab],
    queryFn: () => fetchOrders(tab, 1),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  const count = data?.total ?? 0;
  if (count === 0) return null;
  return (
    <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[10px] font-bold bg-red-500 text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function OrdersForApprovalPage() {
  const [activeTab, setActiveTab] = useState<PaymentTab>("all");
  const [receiptOrder, setReceiptOrder] = useState<any | null>(null);
  const [approveOrder, setApproveOrder] = useState<any | null>(null);
  const [rejectOrder, setRejectOrder] = useState<any | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [fundsReceived, setFundsReceived] = useState(false);
  const [txId, setTxId] = useState("");
  const [location, setLocation] = useState("");
  const [receivedBy, setReceivedBy] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const resetApproveState = () => {
    setApproveOrder(null); setActionNote(""); setFundsReceived(false);
    setTxId(""); setLocation(""); setReceivedBy("");
  };

  const buildApprovalNote = () => {
    const parts: string[] = [];
    if (approveOrder) {
      parts.push(`Funds received: ${fundsReceived ? "Yes" : "No"}`);
      if (txId) parts.push(`Transaction ID: ${txId}`);
      if (location) parts.push(`Location/method: ${location}`);
      if (receivedBy) parts.push(`Verified by: ${receivedBy}`);
    }
    if (actionNote) parts.push(actionNote);
    return parts.join(" | ");
  };

  const approveMutation = useMutation({
    mutationFn: ({ orderId, note }: { orderId: number; note: string }) =>
      updateOrder(orderId, "processing", "paid", note || undefined),
    onSuccess: () => {
      toast({ title: "Order approved", description: "Payment confirmed — order moved to Processing." });
      resetApproveState();
      queryClient.invalidateQueries({ queryKey: ["orders-approval"] });
    },
    onError: (e: any) => toast({ variant: "destructive", title: "Approval failed", description: e.message }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ orderId, note }: { orderId: number; note: string }) =>
      updateOrder(orderId, "cancelled", "failed", note || undefined),
    onSuccess: () => {
      toast({ title: "Order rejected", description: "Order has been cancelled." });
      setRejectOrder(null); setActionNote("");
      queryClient.invalidateQueries({ queryKey: ["orders-approval"] });
    },
    onError: (e: any) => toast({ variant: "destructive", title: "Rejection failed", description: e.message }),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold flex items-center gap-3">
          <ShieldCheck className="h-7 w-7 text-primary" />
          Orders For Approval
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Review and approve manual payment orders — COD, CashApp, PayPal, and Special orders.
        </p>
      </div>

      {/* Info banner */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-900 space-y-0.5">
          <p className="font-semibold">Workflow</p>
          <p className="text-xs leading-relaxed">
            These orders were placed with a manual payment method and require human verification before fulfillment.
            Verify the payment via the appropriate channel, then <strong className="text-green-700">Approve</strong> to move to Processing,
            or <strong className="text-red-600">Reject</strong> to cancel. All actions are logged with your notes.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as PaymentTab)}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1 rounded-xl">
          {TABS.map(t => (
            <TabsTrigger
              key={t.id}
              value={t.id}
              className="flex items-center gap-1.5 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-3 py-1.5"
            >
              {t.icon}
              {t.label}
              <TabBadge tab={t.id} />
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map(t => (
          <TabsContent key={t.id} value={t.id} className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className={`text-sm flex items-center gap-2 ${t.color}`}>
                  {t.icon} {t.label === "All Pending" ? "All Pending Orders" : `${t.label} Orders`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TabPanel
                  tab={t.id}
                  onApprove={o => { setApproveOrder(o); setActionNote(""); setFundsReceived(false); setTxId(""); setLocation(""); setReceivedBy(""); }}
                  onReject={o => { setRejectOrder(o); setActionNote(""); }}
                  onViewReceipt={setReceiptOrder}
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Receipt modal */}
      <ReceiptModal order={receiptOrder} open={!!receiptOrder} onClose={() => setReceiptOrder(null)} />

      {/* Approve Dialog */}
      <Dialog open={!!approveOrder} onOpenChange={open => { if (!open) resetApproveState(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-700">
              <BadgeCheck className="h-5 w-5" /> Approve Payment
            </DialogTitle>
          </DialogHeader>
          {approveOrder && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-green-900">{approveOrder.orderNumber}</span>
                  <span className="font-bold text-green-900 text-base">${approveOrder.total.toFixed(2)}</span>
                </div>
                <p className="text-green-800 text-xs">{approveOrder.userName}</p>
                <PaymentBadge method={approveOrder.paymentMethod} />
              </div>

              <VerificationPanel
                method={approveOrder.paymentMethod}
                fundsReceived={fundsReceived} setFundsReceived={setFundsReceived}
                txId={txId} setTxId={setTxId}
                location={location} setLocation={setLocation}
                receivedBy={receivedBy} setReceivedBy={setReceivedBy}
              />

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

              <p className="text-xs text-muted-foreground bg-muted rounded px-3 py-2">
                Approving marks the order as <strong>Paid</strong> and moves it to <strong>Processing</strong>. Only approve after confirming payment.
              </p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={resetApproveState}>Cancel</Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
              onClick={() => approveOrder && approveMutation.mutate({ orderId: approveOrder.id, note: buildApprovalNote() })}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectOrder} onOpenChange={open => { if (!open) { setRejectOrder(null); setActionNote(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" /> Reject Order
            </DialogTitle>
          </DialogHeader>
          {rejectOrder && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-red-900">{rejectOrder.orderNumber}</span>
                  <span className="font-bold text-red-900 text-base">${rejectOrder.total.toFixed(2)}</span>
                </div>
                <p className="text-red-800 text-xs">{rejectOrder.userName}</p>
                <PaymentBadge method={rejectOrder.paymentMethod} />
              </div>
              <p className="text-sm text-muted-foreground">
                Rejecting will <strong>cancel</strong> this order and mark the payment as failed.
                This action cannot be undone.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="rejectNote">Rejection Reason (optional but recommended)</Label>
                <Textarea
                  id="rejectNote"
                  placeholder="e.g. Payment not received after 3 days, unable to verify transaction ID, customer unreachable…"
                  rows={3}
                  value={actionNote}
                  onChange={e => setActionNote(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setRejectOrder(null); setActionNote(""); }}>Cancel</Button>
            <Button
              variant="destructive"
              className="gap-1.5"
              onClick={() => rejectOrder && rejectMutation.mutate({ orderId: rejectOrder.id, note: actionNote })}
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
