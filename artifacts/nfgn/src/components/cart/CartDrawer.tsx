import { useState, useEffect, useRef, useCallback } from "react";
import {
  useGetCart,
  useUpdateCartItem,
  useRemoveCartItem,
  useCreateOrder,
  useGetMe,
  useGetWallet,
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
  Zap,
  Wallet,
} from "lucide-react";
import { Link } from "wouter";
import { customFetch } from "@/lib/custom-fetch";
import { resolveImageSrc } from "@/lib/image";

/* ── Types ─────────────────────────────────────────────────────── */
type PaymentMethod = "square" | "cash_app" | "paypal" | "cod";

type ShippingForm = {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
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
    id: "square",
    label: "Credit / Debit Card",
    sub: "Powered by Square — Secure & Encrypted",
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
        qc.invalidateQueries({ queryKey: ["/api/cart"] });
        onSignedIn();
      },
      onError: () => toast({ title: "Sign in failed", description: "Check your email and password.", variant: "destructive" }),
    },
  });

  const registerMutation = useRegister({
    mutation: {
      onSuccess: (data: any) => {
        saveToken(data.token);
        qc.invalidateQueries({ queryKey: ["/api/cart"] });
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
    qc.invalidateQueries({ queryKey: ["/api/cart"] });
  }

  /* "cart" | "checkout" | "confirm" */
  const [view, setView] = useState<"cart" | "checkout" | "confirm">("cart");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("square");
  const [promoCode, setPromoCode] = useState("");
  const [promoValidating, setPromoValidating] = useState(false);
  const [promoApplied, setPromoApplied] = useState<{ discountType: string; discountValue: number; code: string } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [optimisticQtys, setOptimisticQtys] = useState<Record<number, number>>({});
  const [shipping, setShipping] = useState<ShippingForm>({
    fullName: "", phone: "", address: "", city: "", state: "", zip: "",
  });
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [squareCard, setSquareCard] = useState<any>(null);
  const [squarePayments, setSquarePayments] = useState<any>(null);
  const [squareReady, setSquareReady] = useState(false);
  const [squareError, setSquareError] = useState<string | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const [cashAppSection, setCashAppSection] = useState<"button" | "manual">("button");
  const [cashAppPay, setCashAppPay] = useState<any>(null);
  const [cashAppPayReady, setCashAppPayReady] = useState(false);
  const cashAppContainerRef = useRef<HTMLDivElement>(null);
  const discountedTotalRef = useRef<number>(0);
  const [paypalSection, setPaypalSection] = useState<"button" | "manual">("button");
  const [paypalLoading, setPaypalLoading] = useState(false);
  const [paypalError, setPaypalError] = useState<string | null>(null);
  const paypalButtonsRef = useRef<any>(null);
  const [walletInput, setWalletInput] = useState("");
  const [walletError, setWalletError] = useState<string | null>(null);

  const { data: cart, isLoading: cartLoading } = useGetCart({
    query: { enabled: isAuthenticated && cartOpen } as any,
  });
  const { data: me } = useGetMe({
    query: { enabled: isAuthenticated } as any,
  });
  const { data: walletData } = useGetWallet({
    query: { enabled: isAuthenticated } as any,
  });

  const updateItem = useUpdateCartItem({
    mutation: {
      onSuccess: (_data: any, vars: any) => {
        // Keep the optimistic value displayed — it IS the correct value.
        // Just refresh the server cache in the background.
        qc.invalidateQueries({ queryKey: ["/api/cart"] });
      },
      onError: (_err: any, vars: any) => {
        // API failed: revert the optimistic display back to server value
        setOptimisticQtys(q => { const copy = { ...q }; delete copy[vars.itemId]; return copy; });
      },
    },
  });
  const removeItem = useRemoveCartItem({
    mutation: {
      onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/cart"] }); setRemovingId(null); },
      onError: () => setRemovingId(null),
    },
  });
  const createOrder = useCreateOrder({
    mutation: {
      onSuccess: (order) => {
        setLastOrder(order);
        setView("confirm");
        qc.invalidateQueries({ queryKey: ["/api/cart"] });
        qc.invalidateQueries({ queryKey: ["/api/orders"] });
      },
      onError: (err: any) =>
        toast({ title: "Order failed", description: err?.message ?? "Please try again.", variant: "destructive" }),
    },
  });

  function handleOpenChange(open: boolean) {
    setCartOpen(open);
    if (!open) setTimeout(() => {
      setView("cart");
      setPromoCode("");
      setPromoApplied(null);
      setPromoError(null);
      setLastOrder(null);
      setOptimisticQtys({});
      setWalletInput("");
      setWalletError(null);
    }, 300);
  }

  function handleQty(itemId: number, delta: number, serverQty: number) {
    if (removingId === itemId) return;
    const current = optimisticQtys[itemId] ?? serverQty;
    const next = current + delta;
    if (next < 1) {
      setRemovingId(itemId);
      setOptimisticQtys(q => { const copy = { ...q }; delete copy[itemId]; return copy; });
      removeItem.mutate({ itemId });
    } else {
      setOptimisticQtys(q => ({ ...q, [itemId]: next }));
      updateItem.mutate({ itemId, data: { quantity: next } });
    }
  }

  function handleRemove(itemId: number) {
    if (removingId === itemId) return;
    setRemovingId(itemId);
    setOptimisticQtys(q => { const copy = { ...q }; delete copy[itemId]; return copy; });
    removeItem.mutate({ itemId });
  }

  /* ── Square Web Payments SDK init ─────────────────────────────── */
  const initSquare = useCallback(async () => {
    if (squareCard) return;
    try {
      if (!(window as any).Square) {
        const script = document.createElement("script");
        script.src = "https://web.squarecdn.com/v1/square.js";
        script.async = true;
        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Square SDK"));
          document.head.appendChild(script);
        });
      }
      const configRes = await customFetch("/api/payments/square/config");
      const config = await configRes.json();
      const payments = (window as any).Square.payments(config.applicationId, config.locationId);
      setSquarePayments(payments);
      const card = await payments.card({ style: {
        input: { fontSize: "14px", color: "#1a1a1a" },
        ".input-container": { borderRadius: "8px", borderColor: "#e2e8f0" },
        ".input-container.is-focus": { borderColor: "#C9A84C" },
      }});
      await card.attach("#square-card-container");
      setSquareCard(card);
      setSquareReady(true);
      setSquareError(null);
    } catch (err: any) {
      setSquareError("Could not load payment form. Please refresh and try again.");
    }
  }, [squareCard]);

  useEffect(() => {
    if (view === "checkout" && paymentMethod === "square" && cardContainerRef.current && !squareCard) {
      initSquare();
    }
    return () => {
      if (view !== "checkout" && squareCard) {
        squareCard.destroy?.();
        setSquareCard(null);
        setSquareReady(false);
      }
    };
  }, [view, paymentMethod]);

  /* ── Square CashApp Pay init ───────────────────────────────────── */
  const initCashAppPay = useCallback(async () => {
    if (cashAppPay) return;
    try {
      if (!(window as any).Square) {
        const script = document.createElement("script");
        script.src = "https://web.squarecdn.com/v1/square.js";
        script.async = true;
        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Square SDK"));
          document.head.appendChild(script);
        });
      }
      let payments = squarePayments;
      if (!payments) {
        const configRes = await customFetch("/api/payments/square/config");
        const config = await configRes.json();
        payments = (window as any).Square.payments(config.applicationId, config.locationId);
        setSquarePayments(payments);
      }
      const paymentRequest = payments.paymentRequest({
        countryCode: "US",
        currencyCode: "USD",
        total: { amount: String(Math.round(discountedTotalRef.current * 100)), label: "NFGN Order" },
      });
      const cap = await payments.cashAppPay(paymentRequest, {
        redirectURL: window.location.href,
        referenceId: `nfgn-${Date.now()}`,
      });
      cap.addEventListener("ontokenization", async (event: any) => {
        const { tokenResult } = event.detail;
        if (tokenResult?.status === "OK") {
          await handleCashAppPayment(tokenResult.token);
        } else {
          const msg = tokenResult?.errors?.[0]?.message ?? "Cash App payment failed. Please try again.";
          toast({ title: "Payment failed", description: msg, variant: "destructive" });
          setPaymentProcessing(false);
        }
      });
      await cap.attach("#cash-app-pay-container");
      setCashAppPay(cap);
      setCashAppPayReady(true);
    } catch (err: any) {
      console.error("CashApp Pay init error:", err);
    }
  }, [cashAppPay, squarePayments]);

  async function handleCashAppPayment(token: string) {
    if (!shippingValid()) {
      toast({ title: "Missing information", description: "Please fill in your shipping address before paying.", variant: "destructive" });
      return;
    }
    const addr = `${shipping.fullName}, ${shipping.address}, ${shipping.city}, ${shipping.state} ${shipping.zip}${shipping.phone ? " | " + shipping.phone : ""}`;
    setPaymentProcessing(true);
    try {
      const payRes = await customFetch("/api/payments/square/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: token,
          amount: discountedTotalRef.current,
          note: `NFGN Order (Cash App Pay) — ${shipping.fullName}`,
        }),
      });
      const payData = await payRes.json();
      if (!payRes.ok) {
        toast({ title: "Payment declined", description: payData.error ?? "Please try again.", variant: "destructive" });
        setPaymentProcessing(false);
        return;
      }
      createOrder.mutate({ data: { paymentMethod: "cash_app", shippingAddress: addr, promoCode: promoApplied?.code || promoCode || undefined, squarePaymentId: payData.paymentId, walletAmount: walletApplied } } as any);
    } catch (err: any) {
      toast({ title: "Payment error", description: err?.message ?? "Something went wrong. Please try again.", variant: "destructive" });
      setPaymentProcessing(false);
    }
  }

  useEffect(() => {
    if (view === "checkout" && paymentMethod === "cash_app" && cashAppSection === "button" && cashAppContainerRef.current && !cashAppPay) {
      initCashAppPay();
    }
    return () => {
      if ((view !== "checkout" || paymentMethod !== "cash_app") && cashAppPay) {
        cashAppPay.destroy?.();
        setCashAppPay(null);
        setCashAppPayReady(false);
      }
    };
  }, [view, paymentMethod, cashAppSection]);

  /* ── PayPal SDK init ───────────────────────────────────────────── */
  useEffect(() => {
    if (view !== "checkout" || paymentMethod !== "paypal" || paypalSection !== "button") return;
    if (paypalButtonsRef.current) return;

    setPaypalLoading(true);
    setPaypalError(null);

    const scriptId = "paypal-sdk-script";
    const load = async () => {
      try {
        const configRes = await customFetch("/api/payments/paypal/config");
        const { clientId } = await configRes.json();

        if (!document.getElementById(scriptId)) {
          await new Promise<void>((resolve, reject) => {
            const s = document.createElement("script");
            s.id = scriptId;
            s.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture`;
            s.onload = () => resolve();
            s.onerror = () => reject(new Error("Failed to load PayPal SDK"));
            document.head.appendChild(s);
          });
        }

        const pp = (window as any).paypal;
        if (!pp) throw new Error("PayPal SDK not available");

        const buttons = pp.Buttons({
          style: { layout: "vertical", color: "blue", shape: "rect", label: "pay" },
          createOrder: async () => {
            if (!shippingValid()) {
              toast({ title: "Missing information", description: "Please fill in your shipping address first.", variant: "destructive" });
              throw new Error("Missing shipping info");
            }
            const res = await customFetch("/api/payments/paypal/create-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ amount: discountedTotalRef.current }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Could not create PayPal order");
            return data.id;
          },
          onApprove: async (data: any) => {
            setPaymentProcessing(true);
            const res = await customFetch("/api/payments/paypal/capture-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId: data.orderID }),
            });
            const result = await res.json();
            if (!res.ok) {
              toast({ title: "Payment failed", description: result.error ?? "Please try again.", variant: "destructive" });
              setPaymentProcessing(false);
              return;
            }
            const addr = `${shipping.fullName}, ${shipping.address}, ${shipping.city}, ${shipping.state} ${shipping.zip}${shipping.phone ? " | " + shipping.phone : ""}`;
            createOrder.mutate({ data: { paymentMethod: "paypal", shippingAddress: addr, promoCode: promoApplied?.code || promoCode || undefined, squarePaymentId: result.captureId, walletAmount: walletApplied } } as any);
          },
          onError: (err: any) => {
            setPaypalError("PayPal encountered an error. Please try again or use a different payment method.");
            console.error("PayPal error", err);
          },
          onCancel: () => {
            toast({ title: "Payment cancelled", description: "Your PayPal payment was cancelled. You can try again anytime." });
          },
        });

        if (buttons.isEligible()) {
          await buttons.render("#paypal-button-container");
          paypalButtonsRef.current = buttons;
        } else {
          setPaypalError("PayPal is not available in your region. Please use a different payment method.");
        }
      } catch (err: any) {
        setPaypalError("Could not load PayPal. Please try again or use a different payment method.");
        console.error("PayPal init error:", err);
      } finally {
        setPaypalLoading(false);
      }
    };

    load();

    return () => {
      if (paypalButtonsRef.current) {
        paypalButtonsRef.current.close?.();
        paypalButtonsRef.current = null;
      }
    };
  }, [view, paymentMethod, paypalSection]);

  function shippingValid() {
    return shipping.fullName.trim() && shipping.address.trim() && shipping.city.trim() && shipping.state.trim() && shipping.zip.trim();
  }

  function cardValid() {
    if (paymentMethod !== "square") return true;
    return squareReady;
  }

  async function applyPromoCode() {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;
    setPromoValidating(true);
    setPromoError(null);
    setPromoApplied(null);
    try {
      const res = await customFetch("/api/promos/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, orderAmount: subtotal }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPromoError(data.error ?? data.message ?? "Invalid or expired promo code.");
      } else {
        setPromoApplied({ code: data.code ?? code, discountType: data.discountType, discountValue: data.discountValue });
        toast({ title: `Promo code "${data.code ?? code}" applied!` });
      }
    } catch {
      setPromoError("Could not validate promo code. Please try again.");
    } finally {
      setPromoValidating(false);
    }
  }

  function clearPromo() {
    setPromoCode("");
    setPromoApplied(null);
    setPromoError(null);
  }

  async function placeOrder() {
    if (!shippingValid()) {
      toast({ title: "Missing information", description: "Please fill in your shipping address.", variant: "destructive" });
      return;
    }
    const addr = `${shipping.fullName}, ${shipping.address}, ${shipping.city}, ${shipping.state} ${shipping.zip}${shipping.phone ? " | " + shipping.phone : ""}`;

    if (paymentMethod === "square") {
      if (!squareCard || !squareReady) {
        toast({ title: "Payment form not ready", description: "Please wait for the card form to load.", variant: "destructive" });
        return;
      }
      setPaymentProcessing(true);
      try {
        const result = await squareCard.tokenize();
        if (result.status !== "OK") {
          const msg = result.errors?.[0]?.message ?? "Card details are invalid. Please check and try again.";
          toast({ title: "Card error", description: msg, variant: "destructive" });
          setPaymentProcessing(false);
          return;
        }
        const payRes = await customFetch("/api/payments/square/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceId: result.token,
            amount: finalDue,
            note: `NFGN Order — ${shipping.fullName}`,
          }),
        });
        const payData = await payRes.json();
        if (!payRes.ok) {
          toast({ title: "Payment declined", description: payData.error ?? "Please try a different card.", variant: "destructive" });
          setPaymentProcessing(false);
          return;
        }
        createOrder.mutate({ data: { paymentMethod: "square", shippingAddress: addr, promoCode: promoApplied?.code || promoCode || undefined, squarePaymentId: payData.paymentId, walletAmount: walletApplied } } as any);
      } catch (err: any) {
        toast({ title: "Payment error", description: err?.message ?? "Something went wrong. Please try again.", variant: "destructive" });
        setPaymentProcessing(false);
      }
      return;
    }

    createOrder.mutate({ data: { paymentMethod, shippingAddress: addr, promoCode: promoApplied?.code || promoCode || undefined, walletAmount: walletApplied } } as any);
  }

  const items = cart?.items ?? [];
  const serverSubtotal = cart?.subtotal ?? 0;
  const itemCount = cart?.itemCount ?? 0;

  // Recompute subtotal using optimistic quantities for instant feedback
  const subtotal = Object.keys(optimisticQtys).length > 0
    ? items.reduce((sum: number, item: any) => {
        const qty = optimisticQtys[item.id] ?? item.quantity;
        return sum + item.price * qty;
      }, 0)
    : serverSubtotal;

  const promoDiscount = promoApplied
    ? promoApplied.discountType === "percentage"
      ? subtotal * promoApplied.discountValue / 100
      : Math.min(promoApplied.discountValue, subtotal)
    : 0;
  const discountedTotal = subtotal - promoDiscount;

  const walletBalance = parseFloat(String(walletData?.balance ?? "0"));
  const rawWalletInput = parseFloat(walletInput) || 0;
  const walletApplied = Math.min(walletBalance, Math.max(0, rawWalletInput), discountedTotal);
  const finalDue = Math.max(0, discountedTotal - walletApplied);
  const walletCoversAll = walletApplied >= discountedTotal;

  discountedTotalRef.current = finalDue;

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
                  <Button variant="outline">Browse Our Products</Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                  {items.map((item: any) => {
                    const isRemoving = removingId === item.id;
                    const displayQty = optimisticQtys[item.id] ?? item.quantity;
                    const displayLineTotal = item.price * displayQty;
                    return (
                    <div key={item.id} className={`flex gap-3 pb-4 border-b last:border-0 transition-opacity ${isRemoving ? "opacity-40 pointer-events-none" : ""}`}>
                      <div className="h-[72px] w-16 flex-shrink-0 rounded-md bg-muted overflow-hidden">
                        {resolveImageSrc(item.productImage) ? (
                          <img src={resolveImageSrc(item.productImage)!} alt={item.productName} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs font-bold">NFGN</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm leading-snug">{item.productName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-primary font-bold text-sm">${item.price.toFixed(2)}</p>
                          {(item.cvPerUnit ?? 0) > 0 && (
                            <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">
                              {item.cvPerUnit} CV/ea
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => handleQty(item.id, -1, item.quantity)}
                            disabled={isRemoving || displayQty <= 1}
                            className="h-7 w-7 rounded border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-sm font-semibold w-6 text-center">{displayQty}</span>
                          <button
                            onClick={() => handleQty(item.id, 1, item.quantity)}
                            disabled={isRemoving}
                            className="h-7 w-7 rounded border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <span className="ml-auto text-sm font-semibold">${displayLineTotal.toFixed(2)}</span>
                          <button
                            onClick={() => handleRemove(item.id)}
                            disabled={isRemoving}
                            className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {isRemoving
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <Trash2 className="h-4 w-4" />
                            }
                          </button>
                        </div>
                      </div>
                    </div>
                  );})}
                </div>
                <div className="border-t px-5 py-4 space-y-3 bg-background flex-shrink-0">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-bold">${subtotal.toFixed(2)}</span>
                  </div>
                  {/* PV Summary */}
                  {(() => {
                    const cartPv = items.reduce((s: number, item: any) => {
                      const qty = optimisticQtys[item.id] ?? item.quantity;
                      return s + ((item.cvPerUnit ?? 0) * qty);
                    }, 0);
                    if (cartPv <= 0) return null;
                    const isProMemberCart = !!(me as any)?.isProMember;
                    const pvNeeded = Math.max(0, 150 - cartPv);
                    return (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-sm font-semibold text-blue-700">
                          <span className="flex items-center gap-1">
                            <Zap className="h-3.5 w-3.5" />PV from this order
                          </span>
                          <span>{cartPv} PV</span>
                        </div>
                        {isProMemberCart && (
                          <div className={`rounded-lg px-3 py-2 text-xs border flex items-start gap-2 ${cartPv >= 150 ? "bg-green-50 border-green-200 text-green-800" : "bg-amber-50 border-amber-200 text-amber-800"}`}>
                            <Star className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                            <span>
                              {cartPv >= 150
                                ? `This order (${cartPv} PV) meets the 150 PV/month BPP requirement!`
                                : `Need ${pvNeeded} more PV this month for BPP qualification (150 PV required).`}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
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
                  {walletApplied > 0 && !walletCoversAll && (
                    <span className="ml-2 text-primary normal-case font-normal">(for remaining ${finalDue.toFixed(2)})</span>
                  )}
                </h3>
                {walletCoversAll && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm mb-3">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    Your E-Wallet balance fully covers this order — no additional payment required.
                  </div>
                )}
                <div className="space-y-2">
                  {PAYMENT_METHODS.filter(pm => {
                    if (pm.id !== "cod") return true;
                    // COD is only available to admins or members explicitly approved by admin
                    const role = (me as any)?.role ?? "";
                    const isAdmin = role === "admin" || role === "super_admin";
                    const isApproved = (me as any)?.canAcceptCod === true;
                    return isAdmin || isApproved;
                  }).map(pm => (
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

              {/* Square Card */}
              {paymentMethod === "square" && (
                <section className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-4">
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm text-blue-900">Secure Card Payment — Powered by Square</p>
                      <p className="text-xs text-blue-700 mt-0.5">
                        Your card details are entered directly into Square's secure, encrypted payment form. Card data never touches NFGN's servers — it's fully PCI-DSS compliant.
                      </p>
                    </div>
                  </div>
                  <hr className="border-blue-200" />
                  {squareError ? (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">{squareError}</div>
                  ) : !squareReady ? (
                    <div className="flex items-center gap-2 text-xs text-blue-700 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading secure payment form…
                    </div>
                  ) : null}
                  <div ref={cardContainerRef} id="square-card-container" className="min-h-[90px]" />
                  <p className="text-[10px] text-blue-600 flex items-center gap-1">
                    <Shield className="h-3 w-3" /> Visa · Mastercard · Amex · Discover · CashApp Pay all accepted
                  </p>
                </section>
              )}

              {/* Cash App */}
              {paymentMethod === "cash_app" && (
                <section className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-green-800">Cash App Payment</p>
                    <div className="h-9 w-9 rounded-xl bg-green-500 flex items-center justify-center">
                      <span className="text-white font-black text-lg">$</span>
                    </div>
                  </div>

                  {/* Toggle */}
                  <div className="flex rounded-xl overflow-hidden border border-green-300 bg-green-100">
                    <button
                      onClick={() => setCashAppSection("button")}
                      className={`flex-1 py-2 text-xs font-semibold transition-colors ${cashAppSection === "button" ? "bg-green-600 text-white" : "text-green-700 hover:bg-green-200"}`}
                    >
                      ⚡ Pay Instantly
                    </button>
                    <button
                      onClick={() => setCashAppSection("manual")}
                      className={`flex-1 py-2 text-xs font-semibold transition-colors ${cashAppSection === "manual" ? "bg-green-600 text-white" : "text-green-700 hover:bg-green-200"}`}
                    >
                      Send Manually
                    </button>
                  </div>

                  {/* Instant CashApp Pay button (Square SDK) */}
                  {cashAppSection === "button" && (
                    <div className="space-y-3">
                      <p className="text-xs text-green-700 text-center">
                        Tap the button — Cash App opens and handles your payment. Order confirms <strong>instantly</strong>.
                      </p>
                      {!cashAppPayReady && (
                        <div className="flex items-center justify-center gap-2 text-xs text-green-700 py-3">
                          <Loader2 className="h-4 w-4 animate-spin" /> Loading Cash App Pay…
                        </div>
                      )}
                      <div ref={cashAppContainerRef} id="cash-app-pay-container" className="min-h-[48px]" />
                      <div className="bg-green-100 rounded-lg p-3 space-y-1">
                        <p className="text-xs font-semibold text-green-800">How it works:</p>
                        <p className="text-xs text-green-700">1. Tap the button — Cash App opens on your device.</p>
                        <p className="text-xs text-green-700">2. Approve <strong>${finalDue.toFixed(2)}</strong> in your Cash App.</p>
                        <p className="text-xs text-green-700">3. Return here — your order confirms automatically, no waiting.</p>
                      </div>
                      <p className="text-center text-xs text-green-600">
                        Don't have Cash App?{" "}
                        <button onClick={() => setCashAppSection("manual")} className="underline font-medium">Send manually instead</button>
                      </p>
                    </div>
                  )}

                  {/* Manual $cashtag fallback */}
                  {cashAppSection === "manual" && (
                    <div className="space-y-3">
                      <div className="bg-white rounded-xl border-2 border-green-400 p-4 text-center">
                        <p className="text-xs text-green-600 font-medium uppercase tracking-wider mb-1">NFGN Official Cash App</p>
                        <p className="text-2xl font-black text-green-700">$NewFaceGlobalNetwork</p>
                        <p className="text-xs text-muted-foreground mt-1">Send exactly <strong>${finalDue.toFixed(2)}</strong> to this $cashtag</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-green-200 space-y-1.5">
                        <p className="text-xs font-bold text-green-800 flex items-center gap-1"><Info className="h-3 w-3" /> How to send via Cash App:</p>
                        <p className="text-xs text-green-700">1. Open Cash App and tap the <strong>$</strong> icon.</p>
                        <p className="text-xs text-green-700">2. Type amount: <strong>${finalDue.toFixed(2)}</strong></p>
                        <p className="text-xs text-green-700">3. Tap <strong>"Pay"</strong>, search <strong>$NewFaceGlobalNetwork</strong>.</p>
                        <p className="text-xs text-green-700">4. Add your name and order info in the <strong>For</strong> field.</p>
                        <p className="text-xs text-green-700">5. Confirm & send — then click <strong>"Place Order"</strong> below.</p>
                        <p className="text-xs text-green-700">6. We confirm within <strong>24 hours</strong> and ship your order.</p>
                      </div>
                      <p className="text-xs text-green-600 bg-green-100 rounded p-2">
                        ⚠️ Only send to the official <strong>$NewFaceGlobalNetwork</strong> cashtag. NFGN will never ask you to send to a personal account.
                      </p>
                    </div>
                  )}
                </section>
              )}

              {/* PayPal */}
              {paymentMethod === "paypal" && (
                <section className="bg-sky-50 border border-sky-200 rounded-xl p-4 space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-sky-800">PayPal Payment</p>
                    <div className="h-9 w-9 rounded-xl bg-[#003087] flex items-center justify-center">
                      <span className="text-white font-black text-sm">PP</span>
                    </div>
                  </div>

                  {/* Toggle */}
                  <div className="flex rounded-xl overflow-hidden border border-sky-300 bg-sky-100">
                    <button
                      onClick={() => setPaypalSection("button")}
                      className={`flex-1 py-2 text-xs font-semibold transition-colors ${paypalSection === "button" ? "bg-[#003087] text-white" : "text-sky-700 hover:bg-sky-200"}`}
                    >
                      ⚡ Pay with PayPal
                    </button>
                    <button
                      onClick={() => setPaypalSection("manual")}
                      className={`flex-1 py-2 text-xs font-semibold transition-colors ${paypalSection === "manual" ? "bg-[#003087] text-white" : "text-sky-700 hover:bg-sky-200"}`}
                    >
                      Send Manually
                    </button>
                  </div>

                  {/* Live PayPal button */}
                  {paypalSection === "button" && (
                    <div className="space-y-3">
                      <p className="text-xs text-sky-700 text-center">
                        Click the button — the PayPal window opens. Log in, approve, and your order confirms <strong>instantly</strong>.
                      </p>
                      {paypalLoading && (
                        <div className="flex items-center justify-center gap-2 text-xs text-sky-700 py-3">
                          <Loader2 className="h-4 w-4 animate-spin" /> Loading PayPal…
                        </div>
                      )}
                      {paypalError && (
                        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">{paypalError}</div>
                      )}
                      <div id="paypal-button-container" className="min-h-[48px]" />
                      <p className="text-center text-xs text-sky-500">
                        Don't want to use PayPal?{" "}
                        <button onClick={() => setPaypalSection("manual")} className="underline font-medium text-sky-600">Send manually instead</button>
                      </p>
                    </div>
                  )}

                  {/* Manual fallback */}
                  {paypalSection === "manual" && (
                    <div className="space-y-3">
                      <div className="bg-white rounded-xl border-2 border-sky-400 p-4 text-center">
                        <p className="text-xs text-sky-600 font-medium uppercase tracking-wider mb-1">NFGN Official PayPal</p>
                        <p className="text-lg font-bold text-sky-800">newfaceglobalnetwork@gmail.com</p>
                        <p className="text-xs text-muted-foreground mt-1">Send exactly <strong>${finalDue.toFixed(2)}</strong> to this PayPal account</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-sky-200 space-y-1.5">
                        <p className="text-xs font-bold text-sky-800 flex items-center gap-1"><Info className="h-3 w-3" /> How to send via PayPal:</p>
                        <p className="text-xs text-sky-700">1. Log into <strong>PayPal.com</strong> or open the PayPal app.</p>
                        <p className="text-xs text-sky-700">2. Click <strong>"Send & Request"</strong> → <strong>"Send Money"</strong>.</p>
                        <p className="text-xs text-sky-700">3. Enter <strong>newfaceglobalnetwork@gmail.com</strong> as the recipient.</p>
                        <p className="text-xs text-sky-700">4. Amount: <strong>${finalDue.toFixed(2)}</strong></p>
                        <p className="text-xs text-sky-700">5. Choose <strong>"Friends & Family"</strong> to avoid extra fees.</p>
                        <p className="text-xs text-sky-700">6. Add your name and order info, confirm & send.</p>
                        <p className="text-xs text-sky-700">7. Click <strong>"Place Order"</strong> below — we confirm within <strong>24 hours</strong>.</p>
                      </div>
                      <p className="text-xs text-sky-700 bg-sky-100 rounded p-2">
                        ⚠️ Only send to <strong>newfaceglobalnetwork@gmail.com</strong>. NFGN will never ask you to send to a personal email.
                      </p>
                    </div>
                  )}
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
                {promoApplied ? (
                  <div className="flex items-center gap-2 rounded-lg border border-green-300 bg-green-50 px-3 py-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono font-bold text-green-700">{promoApplied.code}</p>
                      <p className="text-xs text-green-600">
                        {promoApplied.discountType === "percentage"
                          ? `${promoApplied.discountValue}% off applied`
                          : `$${promoApplied.discountValue.toFixed(2)} off applied`}
                        {" — "}<span className="font-semibold">−${promoDiscount.toFixed(2)}</span>
                      </p>
                    </div>
                    <button onClick={clearPromo} className="text-green-600 hover:text-green-800 text-xs underline ml-1 flex-shrink-0">
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Enter promo code"
                          value={promoCode}
                          onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoError(null); }}
                          onKeyDown={e => e.key === "Enter" && applyPromoCode()}
                          className="pl-9 font-mono tracking-widest uppercase"
                          disabled={promoValidating}
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={applyPromoCode}
                        disabled={!promoCode.trim() || promoValidating}
                        className="flex-shrink-0"
                      >
                        {promoValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                      </Button>
                    </div>
                    {promoError && (
                      <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 flex-shrink-0" /> {promoError}
                      </p>
                    )}
                  </>
                )}
              </section>

              {/* ── E-Wallet Credit ── */}
              {isAuthenticated && walletBalance > 0 && (
                <section>
                  <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                    <Wallet className="h-3.5 w-3.5" /> E-Wallet Credit
                  </h3>
                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Available balance</span>
                      <span className="font-bold text-primary">${walletBalance.toFixed(2)}</span>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        Apply toward order total (enter any amount up to ${Math.min(walletBalance, discountedTotal).toFixed(2)})
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">$</span>
                        <Input
                          type="number"
                          min="0"
                          max={Math.min(walletBalance, discountedTotal).toFixed(2)}
                          step="0.01"
                          placeholder={`0.00 – ${Math.min(walletBalance, discountedTotal).toFixed(2)}`}
                          value={walletInput}
                          onChange={e => {
                            setWalletInput(e.target.value);
                            setWalletError(null);
                            const val = parseFloat(e.target.value) || 0;
                            if (val > walletBalance) {
                              setWalletError(`Maximum available is $${walletBalance.toFixed(2)}`);
                            } else if (val > discountedTotal) {
                              setWalletError(`Cannot exceed order total of $${discountedTotal.toFixed(2)}`);
                            }
                          }}
                          className="pl-7"
                        />
                      </div>
                      {walletError && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 flex-shrink-0" /> {walletError}
                        </p>
                      )}
                      <div className="flex gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => { setWalletInput(Math.min(walletBalance, discountedTotal).toFixed(2)); setWalletError(null); }}
                          className="text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium"
                        >
                          Apply max (${Math.min(walletBalance, discountedTotal).toFixed(2)})
                        </button>
                        {walletInput && (
                          <button
                            type="button"
                            onClick={() => { setWalletInput(""); setWalletError(null); }}
                            className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                    {walletApplied > 0 && (
                      <div className="border-t border-primary/20 pt-2 space-y-1">
                        <div className="flex justify-between text-sm text-green-700 font-medium">
                          <span>Wallet credit applied</span>
                          <span>−${walletApplied.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold">
                          <span>Remaining due</span>
                          <span style={{ color: walletCoversAll ? "#2D6A4F" : "#C9A84C" }}>
                            {walletCoversAll ? "✓ $0.00 — Fully covered!" : `$${finalDue.toFixed(2)}`}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

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
                {promoDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 font-medium">
                    <span className="flex items-center gap-1"><Tag className="h-3 w-3" /> Promo ({promoApplied!.code})</span>
                    <span>−${promoDiscount.toFixed(2)}</span>
                  </div>
                )}
                {promoDiscount > 0 && (
                  <div className="flex justify-between text-sm font-bold border-t pt-1.5">
                    <span>After Discount</span>
                    <span className="text-green-700">${discountedTotal.toFixed(2)}</span>
                  </div>
                )}
                {walletApplied > 0 && (
                  <div className="flex justify-between text-sm text-primary font-medium">
                    <span className="flex items-center gap-1"><Wallet className="h-3 w-3" /> E-Wallet credit</span>
                    <span>−${walletApplied.toFixed(2)}</span>
                  </div>
                )}
                {walletApplied > 0 && (
                  <div className="flex justify-between text-sm font-bold border-t pt-1.5">
                    <span>Amount due</span>
                    <span style={{ color: walletCoversAll ? "#2D6A4F" : "#C9A84C" }}>
                      {walletCoversAll ? "✓ $0.00" : `$${finalDue.toFixed(2)}`}
                    </span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">+ shipping & taxes calculated on order</p>
              </section>
            </div>

            <div className="border-t px-5 py-4 bg-background flex-shrink-0">
              {paymentMethod === "cash_app" && cashAppSection === "button" ? (
                <p className="text-xs text-center text-green-700 font-medium py-1">
                  Use the <strong>Cash App Pay</strong> button above to complete your order instantly.
                </p>
              ) : paymentMethod === "paypal" && paypalSection === "button" ? (
                <p className="text-xs text-center text-sky-700 font-medium py-1">
                  Use the <strong>PayPal</strong> button above to complete your order instantly.
                </p>
              ) : (
                <Button className="w-full gap-2" size="lg" onClick={placeOrder} disabled={createOrder.isPending || paymentProcessing || !isAuthenticated || !!walletError}>
                  {createOrder.isPending || paymentProcessing
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> {paymentProcessing ? "Processing Payment…" : "Placing Order…"}</>
                    : walletCoversAll
                      ? <>Place Order · Covered by Wallet <ArrowRight className="h-4 w-4" /></>
                      : <>Place Order · ${finalDue.toFixed(2)} <ArrowRight className="h-4 w-4" /></>
                  }
                </Button>
              )}
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

            {(paymentMethod === "cash_app" || paymentMethod === "paypal") && !walletCoversAll && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-900 w-full text-left">
                <p className="font-bold mb-1">⚠️ Action Required — Send Payment Now</p>
                {paymentMethod === "cash_app" && (
                  <p className="text-xs">Send <strong>${finalDue.toFixed(2)}</strong> to <strong>$NewFaceGlobalNetwork</strong> on Cash App. Include your order number in the note.</p>
                )}
                {paymentMethod === "paypal" && (
                  <p className="text-xs">Send <strong>${finalDue.toFixed(2)}</strong> via PayPal Friends & Family to <strong>newfaceglobalnetwork@gmail.com</strong>. Include your order number in the note.</p>
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
