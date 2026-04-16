import { useState } from "react";
import {
  useGetCart,
  useUpdateCartItem,
  useRemoveCartItem,
  useCreateOrder,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCartStore } from "@/hooks/use-cart-store";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ShoppingCart,
  X,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Truck,
  CheckCircle2,
  Loader2,
  Tag,
  Package,
} from "lucide-react";
import { Link } from "wouter";

/* ── Types ─────────────────────────────────────────────────────── */
type PaymentMethod = "authorize_net" | "cash_app" | "paypal" | "cod";

type ShippingForm = {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
};

type CardForm = {
  nameOnCard: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
};

/* ── Payment method config ──────────────────────────────────────── */
const PAYMENT_METHODS: {
  id: PaymentMethod;
  label: string;
  sub: string;
  color: string;
  border: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "authorize_net",
    label: "Credit / Debit Card",
    sub: "Powered by Authorize.net",
    color: "bg-blue-50",
    border: "border-blue-400",
    icon: <CreditCard className="h-6 w-6 text-blue-600" />,
  },
  {
    id: "cash_app",
    label: "Cash App",
    sub: "Pay via $CashTag",
    color: "bg-green-50",
    border: "border-green-500",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-green-600">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
      </svg>
    ),
  },
  {
    id: "paypal",
    label: "PayPal",
    sub: "Pay via PayPal",
    color: "bg-sky-50",
    border: "border-sky-500",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-sky-700">
        <path d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944 3.217a.641.641 0 01.634-.541h7.78c2.628 0 4.466.613 5.46 1.822.47.572.77 1.186.903 1.826.14.68.1 1.49-.117 2.41v.004c-.676 2.847-2.814 4.292-6.353 4.292H11.29a.77.77 0 00-.761.65l-.855 5.397-.042.267a.641.641 0 01-.633.541H7.076zm10.86-13.8c-.023.15-.05.3-.083.454C16.44 12.3 13.99 13.5 11.027 13.5H9.99l-.938 5.935h2.098l.71-4.492h1.388c2.898 0 5.065-1.178 5.714-4.59.282-1.443.122-2.65-.626-3.566z" />
      </svg>
    ),
  },
  {
    id: "cod",
    label: "Cash on Delivery",
    sub: "Pay when your order arrives",
    color: "bg-amber-50",
    border: "border-amber-400",
    icon: <Truck className="h-6 w-6 text-amber-600" />,
  },
];

/* ── Helpers ────────────────────────────────────────────────────── */
function fmtCard(val: string) {
  return val
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function fmtExpiry(val: string) {
  const digits = val.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
  return digits;
}

/* ── CartDrawer ─────────────────────────────────────────────────── */
export function CartDrawer() {
  const { cartOpen, setCartOpen } = useCartStore();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  /* Views: "cart" | "checkout" | "confirm" */
  const [view, setView] = useState<"cart" | "checkout" | "confirm">("cart");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("authorize_net");
  const [promoCode, setPromoCode] = useState("");
  const [shipping, setShipping] = useState<ShippingForm>({
    fullName: "", phone: "", address: "", city: "", state: "", zip: "",
  });
  const [card, setCard] = useState<CardForm>({
    nameOnCard: "", cardNumber: "", expiry: "", cvv: "",
  });
  const [lastOrder, setLastOrder] = useState<any>(null);

  /* Cart data */
  const { data: cart, isLoading: cartLoading } = useGetCart({
    query: { enabled: isAuthenticated && cartOpen },
  });

  const updateItem = useUpdateCartItem({
    mutation: {
      onSuccess: () => qc.invalidateQueries({ queryKey: ["getCart"] }),
    },
  });
  const removeItem = useRemoveCartItem({
    mutation: {
      onSuccess: () => qc.invalidateQueries({ queryKey: ["getCart"] }),
    },
  });
  const createOrder = useCreateOrder({
    mutation: {
      onSuccess: (order) => {
        setLastOrder(order);
        setView("confirm");
        qc.invalidateQueries({ queryKey: ["getCart"] });
        qc.invalidateQueries({ queryKey: ["getOrders"] });
      },
      onError: (err: any) => {
        toast({ title: "Order failed", description: err?.message ?? "Please try again.", variant: "destructive" });
      },
    },
  });

  /* Reset when closing */
  function handleOpenChange(open: boolean) {
    setCartOpen(open);
    if (!open) {
      setTimeout(() => {
        setView("cart");
        setPromoCode("");
        setLastOrder(null);
      }, 300);
    }
  }

  function handleQty(itemId: number, delta: number, current: number) {
    const next = current + delta;
    if (next < 1) {
      removeItem.mutate({ itemId });
    } else {
      updateItem.mutate({ itemId, data: { quantity: next } });
    }
  }

  function shippingValid() {
    return (
      shipping.fullName.trim() &&
      shipping.address.trim() &&
      shipping.city.trim() &&
      shipping.state.trim() &&
      shipping.zip.trim()
    );
  }

  function cardValid() {
    if (paymentMethod !== "authorize_net") return true;
    return (
      card.nameOnCard.trim() &&
      card.cardNumber.replace(/\s/g, "").length === 16 &&
      card.expiry.length === 5 &&
      card.cvv.length >= 3
    );
  }

  function placeOrder() {
    if (!shippingValid()) {
      toast({ title: "Missing information", description: "Please fill in your shipping address.", variant: "destructive" });
      return;
    }
    if (!cardValid()) {
      toast({ title: "Missing card details", description: "Please complete your card information.", variant: "destructive" });
      return;
    }
    const shippingAddress = `${shipping.fullName}, ${shipping.address}, ${shipping.city}, ${shipping.state} ${shipping.zip}${shipping.phone ? " | " + shipping.phone : ""}`;
    createOrder.mutate({
      data: {
        paymentMethod,
        shippingAddress,
        promoCode: promoCode || undefined,
      },
    } as any);
  }

  const items = cart?.items ?? [];
  const subtotal = cart?.subtotal ?? 0;
  const itemCount = cart?.itemCount ?? 0;

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <Sheet open={cartOpen} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[440px] p-0 flex flex-col overflow-hidden"
      >
        {/* ── CART VIEW ─────────────────────────────────────── */}
        {view === "cart" && (
          <>
            <SheetHeader className="px-5 py-4 border-b">
              <SheetTitle className="flex items-center gap-2 font-serif text-xl">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Your Cart
                {itemCount > 0 && (
                  <Badge className="ml-1 bg-primary text-primary-foreground">{itemCount}</Badge>
                )}
              </SheetTitle>
            </SheetHeader>

            {!isAuthenticated ? (
              <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center gap-4">
                <ShoppingCart className="h-16 w-16 text-muted-foreground/30" />
                <p className="text-muted-foreground">Sign in to view your cart and checkout.</p>
                <Link href="/login" onClick={() => setCartOpen(false)}>
                  <Button className="w-full">Sign In</Button>
                </Link>
              </div>
            ) : cartLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center gap-4">
                <Package className="h-16 w-16 text-muted-foreground/20" />
                <p className="font-semibold text-lg">Your cart is empty</p>
                <p className="text-muted-foreground text-sm">Browse our wellness products and add something you love.</p>
                <Link href="/shop" onClick={() => setCartOpen(false)}>
                  <Button variant="outline">Browse The Apothecary</Button>
                </Link>
              </div>
            ) : (
              <>
                {/* Items */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                  {items.map((item: any) => (
                    <div key={item.id} className="flex gap-3 pb-4 border-b last:border-0">
                      {/* Thumbnail */}
                      <div className="h-18 w-16 flex-shrink-0 rounded-md bg-muted overflow-hidden">
                        {item.productImage ? (
                          <img src={item.productImage} alt={item.productName} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs font-bold">NFGN</div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm leading-snug">{item.productName}</p>
                        <p className="text-primary font-bold text-sm mt-0.5">${item.price.toFixed(2)}</p>

                        {/* Qty controls */}
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => handleQty(item.id, -1, item.quantity)}
                            className="h-7 w-7 rounded border flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleQty(item.id, 1, item.quantity)}
                            className="h-7 w-7 rounded border flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <span className="ml-auto text-sm font-semibold">${item.lineTotal.toFixed(2)}</span>
                          <button
                            onClick={() => removeItem.mutate({ itemId: item.id })}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="border-t px-5 py-4 space-y-3 bg-background">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-bold">${subtotal.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Shipping & taxes calculated at checkout</p>
                  <Button className="w-full gap-2" size="lg" onClick={() => setView("checkout")}>
                    Checkout <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </>
        )}

        {/* ── CHECKOUT VIEW ─────────────────────────────────── */}
        {view === "checkout" && (
          <>
            <SheetHeader className="px-5 py-4 border-b">
              <SheetTitle className="flex items-center gap-2 font-serif text-xl">
                <button
                  onClick={() => setView("cart")}
                  className="mr-1 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                Checkout
              </SheetTitle>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
              {/* ── Shipping address ─── */}
              <section>
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">
                  Shipping Address
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label htmlFor="fullName" className="text-xs">Full Name *</Label>
                      <Input
                        id="fullName"
                        placeholder="Jane Smith"
                        value={shipping.fullName}
                        onChange={e => setShipping(s => ({ ...s, fullName: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="address" className="text-xs">Street Address *</Label>
                      <Input
                        id="address"
                        placeholder="123 Wellness Ave"
                        value={shipping.address}
                        onChange={e => setShipping(s => ({ ...s, address: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city" className="text-xs">City *</Label>
                      <Input
                        id="city"
                        placeholder="New Orleans"
                        value={shipping.city}
                        onChange={e => setShipping(s => ({ ...s, city: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state" className="text-xs">State *</Label>
                      <Input
                        id="state"
                        placeholder="LA"
                        value={shipping.state}
                        onChange={e => setShipping(s => ({ ...s, state: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="zip" className="text-xs">ZIP Code *</Label>
                      <Input
                        id="zip"
                        placeholder="70112"
                        value={shipping.zip}
                        onChange={e => setShipping(s => ({ ...s, zip: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-xs">Phone</Label>
                      <Input
                        id="phone"
                        placeholder="(678) 000-0000"
                        value={shipping.phone}
                        onChange={e => setShipping(s => ({ ...s, phone: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* ── Payment method ─── */}
              <section>
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">
                  Payment Method
                </h3>
                <div className="space-y-2">
                  {PAYMENT_METHODS.map(pm => (
                    <button
                      key={pm.id}
                      onClick={() => setPaymentMethod(pm.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 text-left transition-all ${
                        paymentMethod === pm.id
                          ? `${pm.border} ${pm.color}`
                          : "border-border hover:border-muted-foreground/40"
                      }`}
                    >
                      <div className="flex-shrink-0">{pm.icon}</div>
                      <div>
                        <p className="font-semibold text-sm">{pm.label}</p>
                        <p className="text-xs text-muted-foreground">{pm.sub}</p>
                      </div>
                      {paymentMethod === pm.id && (
                        <CheckCircle2 className="ml-auto h-5 w-5 text-primary flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </section>

              {/* ── Payment details ─── */}
              {paymentMethod === "authorize_net" && (
                <section className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold text-sm text-blue-900">Card Information</span>
                    <span className="ml-auto text-xs text-blue-600">🔒 Secure via Authorize.net</span>
                  </div>
                  <div>
                    <Label className="text-xs">Name on Card *</Label>
                    <Input
                      placeholder="Jane Smith"
                      value={card.nameOnCard}
                      onChange={e => setCard(c => ({ ...c, nameOnCard: e.target.value }))}
                      className="mt-1 bg-white"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Card Number *</Label>
                    <Input
                      placeholder="1234 5678 9012 3456"
                      value={card.cardNumber}
                      onChange={e => setCard(c => ({ ...c, cardNumber: fmtCard(e.target.value) }))}
                      className="mt-1 bg-white font-mono tracking-widest"
                      maxLength={19}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Expiry (MM/YY) *</Label>
                      <Input
                        placeholder="08/28"
                        value={card.expiry}
                        onChange={e => setCard(c => ({ ...c, expiry: fmtExpiry(e.target.value) }))}
                        className="mt-1 bg-white font-mono"
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">CVV *</Label>
                      <Input
                        placeholder="123"
                        value={card.cvv}
                        onChange={e => setCard(c => ({ ...c, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                        className="mt-1 bg-white font-mono"
                        maxLength={4}
                        type="password"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-blue-600">
                    Your card information is encrypted and processed securely through Authorize.net.
                  </p>
                </section>
              )}

              {paymentMethod === "cash_app" && (
                <section className="bg-green-50 border border-green-200 rounded-lg p-4 text-center space-y-3">
                  <div className="text-4xl font-bold text-green-600">$</div>
                  <p className="font-bold text-xl text-green-800">$NewFaceGlobalNetwork</p>
                  <p className="text-sm text-green-700">Send your exact order total to the Cash App above.</p>
                  <div className="bg-white rounded-lg p-3 border border-green-200 text-left space-y-1">
                    <p className="text-xs font-semibold text-green-800">Instructions:</p>
                    <p className="text-xs text-green-700">1. Open Cash App and tap the "$" icon</p>
                    <p className="text-xs text-green-700">2. Enter the order total and send to <strong>$NewFaceGlobalNetwork</strong></p>
                    <p className="text-xs text-green-700">3. Add your order details in the note</p>
                    <p className="text-xs text-green-700">4. Click "Place Order" to submit — we'll confirm within 24h</p>
                  </div>
                </section>
              )}

              {paymentMethod === "paypal" && (
                <section className="bg-sky-50 border border-sky-200 rounded-lg p-4 text-center space-y-3">
                  <p className="font-bold text-xl text-sky-800">PayPal</p>
                  <p className="text-sm font-semibold text-sky-700">newfaceglobalnetwork@gmail.com</p>
                  <p className="text-sm text-sky-700">Send your exact order total via PayPal Friends & Family to the email above.</p>
                  <div className="bg-white rounded-lg p-3 border border-sky-200 text-left space-y-1">
                    <p className="text-xs font-semibold text-sky-800">Instructions:</p>
                    <p className="text-xs text-sky-700">1. Log into PayPal and click "Send Money"</p>
                    <p className="text-xs text-sky-700">2. Send to <strong>newfaceglobalnetwork@gmail.com</strong></p>
                    <p className="text-xs text-sky-700">3. Use "Friends & Family" to avoid fees</p>
                    <p className="text-xs text-sky-700">4. Include your name and order details in the note</p>
                    <p className="text-xs text-sky-700">5. Click "Place Order" to submit — we'll confirm within 24h</p>
                  </div>
                </section>
              )}

              {paymentMethod === "cod" && (
                <section className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-amber-600" />
                    <p className="font-semibold text-amber-800">Cash on Delivery</p>
                  </div>
                  <p className="text-sm text-amber-700">
                    Have your exact payment ready when your order arrives. Our delivery team will collect payment at your door.
                  </p>
                  <ul className="text-xs text-amber-700 space-y-1 mt-2">
                    <li>• Payment is due upon delivery</li>
                    <li>• Exact cash preferred — change may not be available</li>
                    <li>• You will receive an estimated delivery window via phone</li>
                    <li>• Available in select service areas only</li>
                  </ul>
                </section>
              )}

              {/* ── Promo code ─── */}
              <section>
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-2">
                  Promo Code
                </h3>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Enter promo code"
                      value={promoCode}
                      onChange={e => setPromoCode(e.target.value.toUpperCase())}
                      className="pl-9 font-mono tracking-widest uppercase"
                    />
                  </div>
                </div>
              </section>

              {/* ── Order summary ─── */}
              <section className="bg-muted/40 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-sm">Order Summary</h3>
                {items.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground truncate mr-2">{item.productName} × {item.quantity}</span>
                    <span className="flex-shrink-0 font-medium">${item.lineTotal.toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <p className="text-xs text-muted-foreground">+ shipping & taxes calculated on order</p>
              </section>
            </div>

            {/* Footer */}
            <div className="border-t px-5 py-4 bg-background">
              <Button
                className="w-full gap-2"
                size="lg"
                onClick={placeOrder}
                disabled={createOrder.isPending}
              >
                {createOrder.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Placing Order…</>
                ) : (
                  <>Place Order · ${subtotal.toFixed(2)} <ArrowRight className="h-4 w-4" /></>
                )}
              </Button>
            </div>
          </>
        )}

        {/* ── CONFIRMATION VIEW ─────────────────────────────── */}
        {view === "confirm" && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center gap-5">
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-serif font-bold mb-1">Order Placed!</h2>
              <p className="text-muted-foreground text-sm">
                Thank you for your order. You'll receive a confirmation shortly.
              </p>
            </div>

            {lastOrder && (
              <div className="bg-muted/40 rounded-lg p-4 w-full text-left space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order #</span>
                  <span className="font-mono font-semibold">{lastOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment</span>
                  <span className="capitalize font-medium">
                    {PAYMENT_METHODS.find(p => p.id === lastOrder.paymentMethod)?.label ?? lastOrder.paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-bold text-green-600">${lastOrder.total?.toFixed(2)}</span>
                </div>
              </div>
            )}

            {(paymentMethod === "cash_app" || paymentMethod === "paypal") && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 w-full text-left">
                <p className="font-semibold mb-1">⚠️ Payment Reminder</p>
                <p className="text-xs">
                  {paymentMethod === "cash_app"
                    ? "Please send your payment to $NewFaceGlobalNetwork on Cash App to confirm your order."
                    : "Please send your payment to newfaceglobalnetwork@gmail.com via PayPal to confirm your order."}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2 w-full">
              <Link href="/dashboard/orders" onClick={() => setCartOpen(false)}>
                <Button className="w-full" variant="outline">View My Orders</Button>
              </Link>
              <Button
                className="w-full"
                onClick={() => { setView("cart"); setCartOpen(false); }}
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
