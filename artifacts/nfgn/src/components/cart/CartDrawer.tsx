import { useState, useEffect } from "react";
import {
  useGetCart,
  useUpdateCartItem,
  useRemoveCartItem,
  useCreateOrder,
  useGetMe,
  useRegister,
  useLogin,
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
  User,
  UserPlus,
  LogIn,
  Star,
  AlertTriangle,
  Info,
  Shield,
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

type RegForm = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  sponsorCode: string;
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
    sub: "Powered by Authorize.net — Secure & Encrypted",
    color: "bg-blue-50",
    border: "border-blue-400",
    icon: <CreditCard className="h-6 w-6 text-blue-600" />,
  },
  {
    id: "cash_app",
    label: "Cash App",
    sub: "Send payment to $NewFaceGlobalNetwork",
    color: "bg-green-50",
    border: "border-green-500",
    icon: (
      <svg viewBox="0 0 32 32" className="h-6 w-6">
        <rect width="32" height="32" rx="8" fill="#00D64F" />
        <text x="16" y="23" textAnchor="middle" fill="white" fontSize="18" fontWeight="900" fontFamily="system-ui">$</text>
      </svg>
    ),
  },
  {
    id: "paypal",
    label: "PayPal",
    sub: "Send Friends & Family to NFGN PayPal",
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
    sub: "By approval only — see eligibility requirements",
    color: "bg-amber-50",
    border: "border-amber-400",
    icon: <Truck className="h-6 w-6 text-amber-600" />,
  },
];

/* ── Helpers ────────────────────────────────────────────────────── */
function fmtCard(val: string) {
  return val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}
function fmtExpiry(val: string) {
  const d = val.replace(/\D/g, "").slice(0, 4);
  return d.length >= 3 ? d.slice(0, 2) + "/" + d.slice(2) : d;
}

/* ── Member status banner (inside checkout) ─────────────────────── */
function MemberBanner({ user }: { user: any }) {
  return (
    <div className={`rounded-lg p-3 border flex items-center gap-3 ${user.isProMember ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200"}`}>
      <div className={`h-10 w-10 rounded-full flex items-center justify-center text-base font-bold text-white flex-shrink-0 ${user.isProMember ? "bg-amber-500" : "bg-blue-500"}`}>
        {user.firstName?.[0] ?? "?"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{user.firstName} {user.lastName}</p>
        <div className="flex items-center gap-1">
          {user.isProMember
            ? <><Star className="h-3 w-3 text-amber-500" /><span className="text-xs text-amber-700 font-medium">Pro Member</span></>
            : <><User className="h-3 w-3 text-blue-500" /><span className="text-xs text-blue-700 font-medium">NFGN Member</span></>
          }
        </div>
      </div>
      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
    </div>
  );
}

/* ── Unauthenticated: member check section ──────────────────────── */
function MemberCheckSection({ onSignedIn }: { onSignedIn: () => void }) {
  const [mode, setMode] = useState<"ask" | "signin" | "register">("ask");
  const { login: saveToken } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [regForm, setRegForm] = useState<RegForm>({
    firstName: "", lastName: "", email: "", password: "", sponsorCode: "",
  });

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data: any) => {
        saveToken(data.token);
        qc.invalidateQueries({ queryKey: ["getCart"] });
        onSignedIn();
      },
      onError: () => toast({ title: "Sign in failed", description: "Check your email and password.", variant: "destructive" }),
    },
  });

  const registerMutation = useRegister({
    mutation: {
      onSuccess: (data: any) => {
        saveToken(data.token);
        qc.invalidateQueries({ queryKey: ["getCart"] });
        onSignedIn();
        toast({ title: "Welcome to NFGN!", description: "Your account has been created. You can now complete your purchase." });
      },
      onError: (err: any) => toast({ title: "Registration failed", description: err?.message ?? "Please try again.", variant: "destructive" }),
    },
  });

  if (mode === "ask") {
    return (
      <div className="bg-foreground/5 border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <h3 className="font-bold text-base">Are you an NFGN Member?</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Sign in to your NFGN account to complete your purchase and earn commission credit on your order.
        </p>
        <div className="flex flex-col gap-2">
          <Button className="w-full gap-2" onClick={() => setMode("signin")}>
            <LogIn className="h-4 w-4" /> Sign In to My Account
          </Button>
          <Button variant="outline" className="w-full gap-2" onClick={() => setMode("register")}>
            <UserPlus className="h-4 w-4" /> Register as New NFGN Member
          </Button>
        </div>
        <p className="text-xs text-center text-muted-foreground">
          A membership account is required to complete your purchase.
        </p>
      </div>
    );
  }

  if (mode === "signin") {
    return (
      <div className="bg-foreground/5 border border-border rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <button onClick={() => setMode("ask")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h3 className="font-bold text-base flex items-center gap-2"><LogIn className="h-4 w-4 text-primary" /> Sign In</h3>
        </div>
        <div>
          <Label className="text-xs">Email</Label>
          <Input
            type="email"
            placeholder="you@example.com"
            value={loginForm.email}
            onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs">Password</Label>
          <Input
            type="password"
            placeholder="••••••••"
            value={loginForm.password}
            onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
            className="mt-1"
          />
        </div>
        <Button
          className="w-full"
          disabled={loginMutation.isPending}
          onClick={() => loginMutation.mutate({ data: { email: loginForm.email, password: loginForm.password } } as any)}
        >
          {loginMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          Not a member?{" "}
          <button onClick={() => setMode("register")} className="text-primary underline underline-offset-2">Register here</button>
        </p>
      </div>
    );
  }

  if (mode === "register") {
    return (
      <div className="bg-foreground/5 border border-border rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <button onClick={() => setMode("ask")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h3 className="font-bold text-base flex items-center gap-2"><UserPlus className="h-4 w-4 text-primary" /> Join NFGN</h3>
        </div>

        {/* Sponsor — shown prominently */}
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 space-y-2">
          <Label className="text-xs font-bold text-primary">Personal Sponsor Referral Code *</Label>
          <Input
            placeholder="e.g. ljackson-PRO3 or store-ADMIN"
            value={regForm.sponsorCode}
            onChange={e => setRegForm(f => ({ ...f, sponsorCode: e.target.value }))}
            className="border-primary/40 focus:border-primary bg-white"
          />
          {/* Where to find it */}
          <div className="bg-white border border-primary/20 rounded-lg p-2.5 space-y-1.5">
            <p className="text-xs font-bold text-foreground">Where do I find my Sponsor's referral code?</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your <strong>Personal Sponsor</strong> is the NFGN member who introduced you to NFGN. Their referral code was given to you when they invited you. Here's how to get it:
            </p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li className="flex gap-1.5">
                <span className="text-primary font-bold flex-shrink-0">1.</span>
                <span><strong>Invite link:</strong> If your sponsor sent you a link like <em>nfgn.com/join?ref=...</em> — the code is everything after <code className="bg-muted px-1 rounded">?ref=</code></span>
              </li>
              <li className="flex gap-1.5">
                <span className="text-primary font-bold flex-shrink-0">2.</span>
                <span><strong>Ask your sponsor:</strong> They can find their personal code in their NFGN dashboard under <em>Profile Management → Referral Code</em> and copy it for you.</span>
              </li>
              <li className="flex gap-1.5">
                <span className="text-primary font-bold flex-shrink-0">3.</span>
                <span><strong>Met NFGN at an event?</strong> The host or presenter can provide you with their referral code in person.</span>
              </li>
            </ul>
            <div className="border-t border-primary/20 pt-1.5 mt-1.5">
              <p className="text-xs text-muted-foreground">
                No sponsor code? Call NFGN directly: <strong className="text-foreground">(678) 909-9974</strong> or email <strong className="text-foreground">newfaceglobalnetwork@gmail.com</strong> — an official will link you to the right sponsor.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">First Name *</Label>
            <Input placeholder="Jane" value={regForm.firstName} onChange={e => setRegForm(f => ({ ...f, firstName: e.target.value }))} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Last Name *</Label>
            <Input placeholder="Smith" value={regForm.lastName} onChange={e => setRegForm(f => ({ ...f, lastName: e.target.value }))} className="mt-1" />
          </div>
        </div>
        <div>
          <Label className="text-xs">Email *</Label>
          <Input type="email" placeholder="jane@example.com" value={regForm.email} onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Password *</Label>
          <Input type="password" placeholder="Choose a strong password" value={regForm.password} onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))} className="mt-1" />
        </div>

        <Button
          className="w-full"
          disabled={registerMutation.isPending || !regForm.sponsorCode.trim()}
          onClick={() => {
            if (!regForm.sponsorCode.trim()) {
              return;
            }
            registerMutation.mutate({
              data: {
                firstName: regForm.firstName,
                lastName: regForm.lastName,
                email: regForm.email,
                password: regForm.password,
                referralCode: regForm.sponsorCode.trim(),
              },
            } as any);
          }}
        >
          {registerMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create My NFGN Account"}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Already a member?{" "}
          <button onClick={() => setMode("signin")} className="text-primary underline underline-offset-2">Sign in</button>
        </p>
      </div>
    );
  }

  return null;
}

/* ── CartDrawer ─────────────────────────────────────────────────── */
export function CartDrawer() {
  const { cartOpen, setCartOpen } = useCartStore();
  const { isAuthenticated: baseAuth } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(baseAuth);
  const { toast } = useToast();
  const qc = useQueryClient();

  /* Sync whenever the base auth value changes (e.g. external login/logout) */
  useEffect(() => {
    setIsAuthenticated(baseAuth);
  }, [baseAuth]);

  function handleSignedIn() {
    setIsAuthenticated(true);
    qc.invalidateQueries({ queryKey: ["getCart"] });
  }

  /* "cart" | "checkout" | "confirm" */
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

  const { data: cart, isLoading: cartLoading } = useGetCart({
    query: { enabled: isAuthenticated && cartOpen },
  });
  const { data: me } = useGetMe({
    query: { enabled: isAuthenticated },
  });

  const updateItem = useUpdateCartItem({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: ["getCart"] }) },
  });
  const removeItem = useRemoveCartItem({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: ["getCart"] }) },
  });
  const createOrder = useCreateOrder({
    mutation: {
      onSuccess: (order) => {
        setLastOrder(order);
        setView("confirm");
        qc.invalidateQueries({ queryKey: ["getCart"] });
        qc.invalidateQueries({ queryKey: ["getOrders"] });
      },
      onError: (err: any) =>
        toast({ title: "Order failed", description: err?.message ?? "Please try again.", variant: "destructive" }),
    },
  });

  function handleOpenChange(open: boolean) {
    setCartOpen(open);
    if (!open) setTimeout(() => { setView("cart"); setPromoCode(""); setLastOrder(null); }, 300);
  }

  function handleQty(itemId: number, delta: number, current: number) {
    const next = current + delta;
    if (next < 1) removeItem.mutate({ itemId });
    else updateItem.mutate({ itemId, data: { quantity: next } });
  }

  function shippingValid() {
    return shipping.fullName.trim() && shipping.address.trim() && shipping.city.trim() && shipping.state.trim() && shipping.zip.trim();
  }

  function cardValid() {
    if (paymentMethod !== "authorize_net") return true;
    return card.nameOnCard.trim() && card.cardNumber.replace(/\s/g, "").length === 16 && card.expiry.length === 5 && card.cvv.length >= 3;
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
    const addr = `${shipping.fullName}, ${shipping.address}, ${shipping.city}, ${shipping.state} ${shipping.zip}${shipping.phone ? " | " + shipping.phone : ""}`;
    createOrder.mutate({ data: { paymentMethod, shippingAddress: addr, promoCode: promoCode || undefined } } as any);
  }

  const items = cart?.items ?? [];
  const subtotal = cart?.subtotal ?? 0;
  const itemCount = cart?.itemCount ?? 0;

  return (
    <Sheet open={cartOpen} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[460px] p-0 flex flex-col overflow-hidden">

        {/* ════════ CART VIEW ════════ */}
        {view === "cart" && (
          <>
            <SheetHeader className="px-5 py-4 border-b flex-shrink-0">
              <SheetTitle className="flex items-center gap-2 font-serif text-xl">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Your Cart
                {isAuthenticated && itemCount > 0 && (
                  <Badge className="ml-1 bg-primary text-primary-foreground">{itemCount}</Badge>
                )}
              </SheetTitle>
            </SheetHeader>

            {/* Member check for unauthenticated users */}
            {!isAuthenticated ? (
              <div className="flex-1 overflow-y-auto px-5 py-5">
                <MemberCheckSection onSignedIn={handleSignedIn} />
              </div>
            ) : cartLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center gap-4">
                <Package className="h-16 w-16 text-muted-foreground/20" />
                <p className="font-semibold text-lg">Your cart is empty</p>
                <p className="text-muted-foreground text-sm">Browse our naturopathic wellness products and add something you love.</p>
                <Link href="/shop" onClick={() => setCartOpen(false)}>
                  <Button variant="outline">Browse The Apothecary</Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                  {items.map((item: any) => (
                    <div key={item.id} className="flex gap-3 pb-4 border-b last:border-0">
                      <div className="h-[72px] w-16 flex-shrink-0 rounded-md bg-muted overflow-hidden">
                        {item.productImage ? (
                          <img src={item.productImage} alt={item.productName} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs font-bold">NFGN</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm leading-snug">{item.productName}</p>
                        <p className="text-primary font-bold text-sm mt-0.5">${item.price.toFixed(2)}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => handleQty(item.id, -1, item.quantity)} className="h-7 w-7 rounded border flex items-center justify-center hover:bg-muted transition-colors">
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                          <button onClick={() => handleQty(item.id, 1, item.quantity)} className="h-7 w-7 rounded border flex items-center justify-center hover:bg-muted transition-colors">
                            <Plus className="h-3 w-3" />
                          </button>
                          <span className="ml-auto text-sm font-semibold">${item.lineTotal.toFixed(2)}</span>
                          <button onClick={() => removeItem.mutate({ itemId: item.id })} className="text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t px-5 py-4 space-y-3 bg-background flex-shrink-0">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-bold">${subtotal.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Shipping & taxes calculated at checkout</p>
                  <Button className="w-full gap-2" size="lg" onClick={() => setView("checkout")}>
                    Proceed to Checkout <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </>
        )}

        {/* ════════ CHECKOUT VIEW ════════ */}
        {view === "checkout" && (
          <>
            <SheetHeader className="px-5 py-4 border-b flex-shrink-0">
              <SheetTitle className="flex items-center gap-2 font-serif text-xl">
                <button onClick={() => setView("cart")} className="mr-1 text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                Checkout
              </SheetTitle>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">

              {/* ── STEP 1: NFGN Member Identification ── */}
              <section>
                <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1">
                  <User className="h-3.5 w-3.5" /> NFGN Member Status
                </h3>
                {isAuthenticated && me ? (
                  <MemberBanner user={me} />
                ) : (
                  <MemberCheckSection onSignedIn={handleSignedIn} />
                )}
              </section>

              {/* ── STEP 2: Shipping Address ── */}
              <section>
                <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3">
                  Shipping Address
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label className="text-xs">Full Name *</Label>
                    <Input placeholder="Jane Smith" value={shipping.fullName} onChange={e => setShipping(s => ({ ...s, fullName: e.target.value }))} className="mt-1" />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Street Address *</Label>
                    <Input placeholder="123 Wellness Ave" value={shipping.address} onChange={e => setShipping(s => ({ ...s, address: e.target.value }))} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">City *</Label>
                    <Input placeholder="New Orleans" value={shipping.city} onChange={e => setShipping(s => ({ ...s, city: e.target.value }))} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">State *</Label>
                    <Input placeholder="LA" value={shipping.state} onChange={e => setShipping(s => ({ ...s, state: e.target.value }))} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">ZIP Code *</Label>
                    <Input placeholder="70112" value={shipping.zip} onChange={e => setShipping(s => ({ ...s, zip: e.target.value }))} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Phone</Label>
                    <Input placeholder="(678) 000-0000" value={shipping.phone} onChange={e => setShipping(s => ({ ...s, phone: e.target.value }))} className="mt-1" />
                  </div>
                </div>
              </section>

              {/* ── STEP 3: Payment Method ── */}
              <section>
                <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3">
                  Payment Method
                </h3>
                <div className="space-y-2">
                  {PAYMENT_METHODS.map(pm => (
                    <button
                      key={pm.id}
                      onClick={() => setPaymentMethod(pm.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 text-left transition-all ${paymentMethod === pm.id ? `${pm.border} ${pm.color}` : "border-border hover:border-muted-foreground/40"}`}
                    >
                      <div className="flex-shrink-0">{pm.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{pm.label}</p>
                        <p className="text-xs text-muted-foreground">{pm.sub}</p>
                      </div>
                      {paymentMethod === pm.id && <CheckCircle2 className="ml-auto h-5 w-5 text-primary flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </section>

              {/* ── STEP 4: Payment Details (per method) ── */}

              {/* Authorize.net */}
              {paymentMethod === "authorize_net" && (
                <section className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-4">
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm text-blue-900">Secure Card Payment via Authorize.net</p>
                      <p className="text-xs text-blue-700 mt-0.5">
                        NFGN uses Authorize.net — the industry-leading payment gateway — to securely process all credit and debit card transactions. Your card data is encrypted end-to-end and never stored on our servers.
                      </p>
                    </div>
                  </div>
                  <hr className="border-blue-200" />
                  <div>
                    <Label className="text-xs">Name on Card *</Label>
                    <Input placeholder="Jane Smith" value={card.nameOnCard} onChange={e => setCard(c => ({ ...c, nameOnCard: e.target.value }))} className="mt-1 bg-white" />
                  </div>
                  <div>
                    <Label className="text-xs">Card Number *</Label>
                    <Input placeholder="1234 5678 9012 3456" value={card.cardNumber} onChange={e => setCard(c => ({ ...c, cardNumber: fmtCard(e.target.value) }))} className="mt-1 bg-white font-mono tracking-widest" maxLength={19} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Expiry (MM/YY) *</Label>
                      <Input placeholder="08/28" value={card.expiry} onChange={e => setCard(c => ({ ...c, expiry: fmtExpiry(e.target.value) }))} className="mt-1 bg-white font-mono" maxLength={5} />
                    </div>
                    <div>
                      <Label className="text-xs">CVV *</Label>
                      <Input placeholder="•••" value={card.cvv} onChange={e => setCard(c => ({ ...c, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))} className="mt-1 bg-white font-mono" maxLength={4} type="password" />
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-200 space-y-1">
                    <p className="text-xs font-semibold text-blue-800 flex items-center gap-1"><Info className="h-3 w-3" /> How to connect your card:</p>
                    <p className="text-xs text-blue-700">1. Enter your card number, expiration date, and CVV exactly as they appear on your card.</p>
                    <p className="text-xs text-blue-700">2. Your bank may send a one-time verification code — have your phone ready.</p>
                    <p className="text-xs text-blue-700">3. All transactions are processed via Authorize.net's secure payment gateway (PCI-DSS compliant).</p>
                    <p className="text-xs text-blue-700">4. NFGN Merchant ID: <strong>available upon request from admin</strong>.</p>
                  </div>
                </section>
              )}

              {/* Cash App */}
              {paymentMethod === "cash_app" && (
                <section className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-lg text-green-800">Cash App Payment</p>
                    <div className="h-10 w-10 rounded-xl bg-green-500 flex items-center justify-center">
                      <span className="text-white font-black text-xl">$</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border-2 border-green-400 p-4 text-center">
                    <p className="text-xs text-green-600 font-medium uppercase tracking-wider mb-1">NFGN Official Cash App</p>
                    <p className="text-2xl font-black text-green-700">$NewFaceGlobalNetwork</p>
                    <p className="text-xs text-muted-foreground mt-1">Send exactly <strong>${subtotal.toFixed(2)}</strong> to this $cashtag</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-green-200 space-y-1.5">
                    <p className="text-xs font-bold text-green-800 flex items-center gap-1"><Info className="h-3 w-3" /> How to send via Cash App:</p>
                    <p className="text-xs text-green-700">1. Open the <strong>Cash App</strong> on your phone and tap the <strong>$</strong> icon at the bottom.</p>
                    <p className="text-xs text-green-700">2. Type the amount: <strong>${subtotal.toFixed(2)}</strong></p>
                    <p className="text-xs text-green-700">3. Tap <strong>"Pay"</strong>, then search for <strong>$NewFaceGlobalNetwork</strong>.</p>
                    <p className="text-xs text-green-700">4. In the <strong>For</strong> field, write your name and order description.</p>
                    <p className="text-xs text-green-700">5. Confirm and send — then click <strong>"Place Order"</strong> below.</p>
                    <p className="text-xs text-green-700">6. We will confirm your payment within <strong>24 hours</strong> and ship your order.</p>
                  </div>
                  <p className="text-xs text-green-600 bg-green-100 rounded p-2">
                    ⚠️ Only send to the official <strong>$NewFaceGlobalNetwork</strong> cashtag. NFGN will never ask you to send to a personal account.
                  </p>
                </section>
              )}

              {/* PayPal */}
              {paymentMethod === "paypal" && (
                <section className="bg-sky-50 border border-sky-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-lg text-sky-800">PayPal Payment</p>
                    <div className="h-10 w-10 rounded-xl bg-sky-600 flex items-center justify-center">
                      <span className="text-white font-black text-sm">PP</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border-2 border-sky-400 p-4 text-center">
                    <p className="text-xs text-sky-600 font-medium uppercase tracking-wider mb-1">NFGN Official PayPal</p>
                    <p className="text-lg font-bold text-sky-800">newfaceglobalnetwork@gmail.com</p>
                    <p className="text-xs text-muted-foreground mt-1">Send exactly <strong>${subtotal.toFixed(2)}</strong> to this PayPal account</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-sky-200 space-y-1.5">
                    <p className="text-xs font-bold text-sky-800 flex items-center gap-1"><Info className="h-3 w-3" /> How to send via PayPal:</p>
                    <p className="text-xs text-sky-700">1. Log into <strong>PayPal.com</strong> or open the PayPal app.</p>
                    <p className="text-xs text-sky-700">2. Click <strong>"Send & Request"</strong>, then <strong>"Send Money"</strong>.</p>
                    <p className="text-xs text-sky-700">3. Enter <strong>newfaceglobalnetwork@gmail.com</strong> as the recipient.</p>
                    <p className="text-xs text-sky-700">4. Enter the amount: <strong>${subtotal.toFixed(2)}</strong></p>
                    <p className="text-xs text-sky-700">5. Choose <strong>"Sending to a friend"</strong> (Friends & Family) to avoid extra fees.</p>
                    <p className="text-xs text-sky-700">6. Add a note with your name and order description.</p>
                    <p className="text-xs text-sky-700">7. Click <strong>"Place Order"</strong> below — we confirm within <strong>24 hours</strong>.</p>
                  </div>
                  <p className="text-xs text-sky-700 bg-sky-100 rounded p-2">
                    ⚠️ Only send to <strong>newfaceglobalnetwork@gmail.com</strong>. NFGN will never ask you to send PayPal to a personal email.
                  </p>
                </section>
              )}

              {/* Cash on Delivery */}
              {paymentMethod === "cod" && (
                <section className="space-y-3">
                  {/* Eligibility warning */}
                  <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-4 space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-sm text-amber-900">COD — By Approval Only</p>
                        <p className="text-xs text-amber-800 mt-1">
                          Cash on Delivery is a <strong>restricted payment option</strong> available exclusively for:
                        </p>
                      </div>
                    </div>
                    <ul className="text-xs text-amber-800 space-y-1 pl-7 list-disc">
                      <li><strong>Pre-approved orders</strong> granted by an NFGN official in advance</li>
                      <li><strong>NFGN special events</strong> and in-person distribution arrangements</li>
                      <li><strong>Orders with written special approval</strong> from an official NFGN representative</li>
                    </ul>
                    <div className="bg-amber-100 rounded-lg p-2 mt-1">
                      <p className="text-xs text-amber-900 font-semibold">To request COD approval, contact NFGN directly:</p>
                      <p className="text-xs text-amber-800">📞 <strong>(678) 909-9974</strong></p>
                      <p className="text-xs text-amber-800">✉️ <strong>newfaceglobalnetwork@gmail.com</strong></p>
                    </div>
                  </div>

                  <div className="bg-white border border-border rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-amber-600" />
                      <p className="font-semibold text-sm">COD Terms</p>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Have the <strong>exact payment amount</strong> ready at delivery — change may not be available</li>
                      <li>• An NFGN representative will contact you with your delivery window</li>
                      <li>• Unapproved COD orders <strong>will not be processed</strong> and may be cancelled</li>
                      <li>• By submitting, you confirm you have received official COD authorization</li>
                    </ul>
                  </div>
                </section>
              )}

              {/* ── Promo Code ── */}
              <section>
                <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2">Promo Code</h3>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Enter promo code"
                    value={promoCode}
                    onChange={e => setPromoCode(e.target.value.toUpperCase())}
                    className="pl-9 font-mono tracking-widest uppercase"
                  />
                </div>
              </section>

              {/* ── Order Summary ── */}
              <section className="bg-muted/40 rounded-xl p-4 space-y-2">
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

            <div className="border-t px-5 py-4 bg-background flex-shrink-0">
              <Button className="w-full gap-2" size="lg" onClick={placeOrder} disabled={createOrder.isPending || !isAuthenticated}>
                {createOrder.isPending
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Placing Order…</>
                  : <>Place Order · ${subtotal.toFixed(2)} <ArrowRight className="h-4 w-4" /></>
                }
              </Button>
              {!isAuthenticated && (
                <p className="text-xs text-center text-muted-foreground mt-2">Sign in above to place your order.</p>
              )}
            </div>
          </>
        )}

        {/* ════════ CONFIRMATION VIEW ════════ */}
        {view === "confirm" && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center gap-5">
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-serif font-bold mb-1">Order Placed!</h2>
              <p className="text-muted-foreground text-sm">Thank you for your purchase. You'll receive a confirmation shortly.</p>
            </div>

            {lastOrder && (
              <div className="bg-muted/40 rounded-xl p-4 w-full text-left space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order #</span>
                  <span className="font-mono font-semibold text-xs">{lastOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment</span>
                  <span className="font-medium capitalize">{PAYMENT_METHODS.find(p => p.id === lastOrder.paymentMethod)?.label ?? lastOrder.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-bold text-green-600">${lastOrder.total?.toFixed(2)}</span>
                </div>
              </div>
            )}

            {(paymentMethod === "cash_app" || paymentMethod === "paypal") && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-900 w-full text-left">
                <p className="font-bold mb-1">⚠️ Action Required — Send Payment Now</p>
                {paymentMethod === "cash_app" && (
                  <p className="text-xs">Send <strong>${lastOrder?.total?.toFixed(2)}</strong> to <strong>$NewFaceGlobalNetwork</strong> on Cash App. Include your order number in the note.</p>
                )}
                {paymentMethod === "paypal" && (
                  <p className="text-xs">Send <strong>${lastOrder?.total?.toFixed(2)}</strong> via PayPal Friends & Family to <strong>newfaceglobalnetwork@gmail.com</strong>. Include your order number in the note.</p>
                )}
              </div>
            )}

            {paymentMethod === "cod" && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-900 w-full text-left">
                <p className="font-bold mb-1">COD Order Submitted</p>
                <p className="text-xs">An NFGN representative will review your COD request and contact you at the phone number provided. Unapproved COD orders will be cancelled.</p>
              </div>
            )}

            <div className="flex flex-col gap-2 w-full">
              <Link href="/dashboard/orders" onClick={() => setCartOpen(false)}>
                <Button className="w-full" variant="outline">View My Orders</Button>
              </Link>
              <Button className="w-full" onClick={() => { setView("cart"); setCartOpen(false); }}>
                Continue Shopping
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
