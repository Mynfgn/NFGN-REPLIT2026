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
  PenLine,
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
  accentColor: string;
  activeBg: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "square",
    label: "Credit / Debit Card",
    sub: "Powered by Square — Secure & Encrypted",
    accentColor: "#C9A84C",
    activeBg: "#1a1200",
    icon: (
      <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0a0a0a, #1a1200)", border: "1px solid #C9A84C" }}>
        <CreditCard className="h-5 w-5" style={{ color: "#C9A84C" }} />
      </div>
    ),
  },
  {
    id: "cash_app",
    label: "Cash App",
    sub: "Send payment to $NewFaceGlobalNetwork",
    accentColor: "#C9A84C",
    activeBg: "#1a1200",
    icon: (
      <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0a0a0a, #1a1200)", border: "1px solid #C9A84C" }}>
        <span className="font-black text-xl leading-none" style={{ color: "#C9A84C" }}>$</span>
      </div>
    ),
  },
  {
    id: "paypal",
    label: "PayPal",
    sub: "Send Friends & Family to NFGN PayPal",
    accentColor: "#C9A84C",
    activeBg: "#1a1200",
    icon: (
      <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0a0a0a, #1a1200)", border: "1px solid #C9A84C" }}>
        <svg viewBox="0 0 24 24" className="h-5 w-5" style={{ fill: "#C9A84C" }}>
          <path d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944 3.217a.641.641 0 01.634-.541h7.78c2.628 0 4.466.613 5.46 1.822.47.572.77 1.186.903 1.826.14.68.1 1.49-.117 2.41v.004c-.676 2.847-2.814 4.292-6.353 4.292H11.29a.77.77 0 00-.761.65l-.855 5.397-.042.267a.641.641 0 01-.633.541H7.076zm10.86-13.8c-.023.15-.05.3-.083.454C16.44 12.3 13.99 13.5 11.027 13.5H9.99l-.938 5.935h2.098l.71-4.492h1.388c2.898 0 5.065-1.178 5.714-4.59.282-1.443.122-2.65-.626-3.566z" />
        </svg>
      </div>
    ),
  },
  {
    id: "cod",
    label: "Cash on Delivery",
    sub: "By approval only — see eligibility requirements",
    accentColor: "#C9A84C",
    activeBg: "#1a1200",
    icon: (
      <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0a0a0a, #1a1200)", border: "1px solid #C9A84C" }}>
        <Truck className="h-5 w-5" style={{ color: "#C9A84C" }} />
      </div>
    ),
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
    <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: "linear-gradient(135deg, #1a1200, #0a0a0a)", border: "1.5px solid #C9A84C" }}>
      <div className="h-10 w-10 rounded-full flex items-center justify-center text-base font-black flex-shrink-0" style={{ background: "linear-gradient(135deg, #C9A84C, #e8c96a)", color: "#000" }}>
        {user.firstName?.[0] ?? "?"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-white">{user.firstName} {user.lastName}</p>
        <div className="flex items-center gap-1">
          {user.isProMember
            ? <><Star className="h-3 w-3 fill-current" style={{ color: "#C9A84C" }} /><span className="text-xs font-bold" style={{ color: "#C9A84C" }}>Pro Member</span></>
            : <><User className="h-3 w-3" style={{ color: "#C9A84C" }} /><span className="text-xs font-medium" style={{ color: "rgba(201,168,76,0.8)" }}>NFGN Member</span></>
          }
        </div>
      </div>
      <CheckCircle2 className="h-5 w-5 flex-shrink-0" style={{ color: "#C9A84C" }} />
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

  /* "cart" | "checkout" | "sign" | "confirm" */
  const [view, setView] = useState<"cart" | "checkout" | "sign" | "confirm">("cart");
  const sigCanvasRef = useRef<HTMLCanvasElement>(null);
  const [sigDrawing, setSigDrawing] = useState(false);
  const [sigEmpty, setSigEmpty] = useState(true);
  const [sigAgreed, setSigAgreed] = useState(false);
  const [sigSubmitting, setSigSubmitting] = useState(false);
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
  const squareInitializingRef = useRef(false);
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
  const [isPickup, setIsPickup] = useState(false);
  const [estimatedBreakdown, setEstimatedBreakdown] = useState<{
    subtotal: number; discount: number; tax: number; shipping: number;
    handlingFee: number; total: number; walletDeduction: number; finalDue: number;
    isFreeShipping: boolean; isPickup: boolean;
  } | null>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

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
        setSigEmpty(true);
        setSigAgreed(false);
        setSigDrawing(false);
        const ctx = sigCanvasRef.current?.getContext("2d");
        if (ctx && sigCanvasRef.current) ctx.clearRect(0, 0, sigCanvasRef.current.width, sigCanvasRef.current.height);
        setView("sign");
        qc.invalidateQueries({ queryKey: ["/api/cart"] });
        qc.invalidateQueries({ queryKey: ["/api/orders"] });
      },
      onError: (err: any) =>
        toast({ title: "Order failed", description: err?.message ?? "Please try again.", variant: "destructive" }),
    },
  });

  function handleOpenChange(open: boolean) {
    setCartOpen(open);
    if (!open) {
      if (squareCard) {
        squareCard.destroy?.();
        setSquareCard(null);
        setSquareReady(false);
        squareInitializingRef.current = false;
      }
      setTimeout(() => {
        setView("cart");
        setPromoCode("");
        setPromoApplied(null);
        setPromoError(null);
        setLastOrder(null);
        setOptimisticQtys({});
        setWalletInput("");
        setWalletError(null);
        setIsPickup(false);
        setEstimatedBreakdown(null);
        setSignatureDataUrl(null);
        setSigEmpty(true);
        setSigAgreed(false);
        setSigDrawing(false);
        setSigSubmitting(false);
        setSquareError(null);
        setPaymentProcessing(false);
      }, 300);
    }
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
    if (squareCard || squareInitializingRef.current) return;
    squareInitializingRef.current = true;
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
      const card = await payments.card();
      await card.attach("#square-card-container");
      setSquareCard(card);
      setSquarePayments(payments);
      setSquareReady(true);
      setSquareError(null);
    } catch (err: any) {
      squareInitializingRef.current = false;
      console.error("Square card init error:", err);
      setSquareError("Could not load payment form. Tap Retry below.");
    }
  }, [squareCard]);

  useEffect(() => {
    if (view === "checkout" && paymentMethod === "square" && !squareCard) {
      // Wait for the Sheet slide-in animation (~300ms) to finish before
      // attaching the Square card form — otherwise the container has zero
      // dimensions and Square throws ElementNotFoundError.
      const t = setTimeout(() => {
        if (cardContainerRef.current && !squareCard) {
          initSquare();
        }
      }, 350);
      return () => clearTimeout(t);
    }
    return () => {
      if (view !== "checkout" && squareCard) {
        squareCard.destroy?.();
        setSquareCard(null);
        setSquareReady(false);
        squareInitializingRef.current = false;
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

  /* ── Fetch server-side order estimate (tax + shipping) when entering checkout ── */
  useEffect(() => {
    if (view === "checkout" && isAuthenticated) {
      fetchEstimate();
    } else if (view !== "checkout") {
      setEstimatedBreakdown(null);
    }
  }, [view, promoApplied, walletInput, isAuthenticated]);

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
          style: { layout: "vertical", color: "gold", shape: "rect", label: "pay" },
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
            if (!res.ok) {
              // Account restriction — fall back to manual payment flow
              const isRestricted = Array.isArray(data?.details) && data.details.some((d: any) => d.issue === "PAYEE_ACCOUNT_RESTRICTED");
              if (isRestricted) {
                setPaypalSection("manual");
                toast({ title: "Use manual PayPal transfer", description: "Our PayPal checkout is temporarily unavailable. Please send payment manually to the address shown below." });
                throw new Error("Account restricted — manual flow shown");
              }
              throw new Error(data.error ?? "Could not create PayPal order");
            }
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
          onError: (_err: any) => {
            // If we already switched to manual (e.g. account restriction), suppress the generic error
            setPaypalError(prev => prev ?? "PayPal encountered an error. Please try again or use the manual transfer option below.");
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
    if (isPickup) return !!shipping.fullName.trim();
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

  async function fetchEstimate() {
    if (!isAuthenticated) return;
    try {
      const res = await customFetch("/api/orders/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promoCode: promoApplied?.code || promoCode || undefined,
          walletAmount: parseFloat(walletInput) || 0,
          isPickup,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setEstimatedBreakdown(data);
      }
    } catch (_) {
      // Non-fatal: fall back to client-computed values
    }
  }

  async function placeOrder() {
    if (!shippingValid()) {
      const msg = isPickup ? "Please enter your name for pick-up." : "Please fill in your shipping address.";
      toast({ title: "Missing information", description: msg, variant: "destructive" });
      return;
    }
    const addr = isPickup
      ? `PICKUP — ${shipping.fullName}${shipping.phone ? " | " + shipping.phone : ""}`
      : `${shipping.fullName}, ${shipping.address}, ${shipping.city}, ${shipping.state} ${shipping.zip}${shipping.phone ? " | " + shipping.phone : ""}`;

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
            amount: realFinalDue,
            note: `NFGN Order — ${shipping.fullName}`,
          }),
        });
        const payData = await payRes.json();
        if (!payRes.ok) {
          toast({ title: "Payment declined", description: payData.error ?? "Please try a different card.", variant: "destructive" });
          setPaymentProcessing(false);
          return;
        }
        createOrder.mutate({ data: { paymentMethod: "square", shippingAddress: addr, promoCode: promoApplied?.code || promoCode || undefined, squarePaymentId: payData.paymentId, walletAmount: walletApplied, isPickup } } as any);
      } catch (err: any) {
        toast({ title: "Payment error", description: err?.message ?? "Something went wrong. Please try again.", variant: "destructive" });
        setPaymentProcessing(false);
      }
      return;
    }

    createOrder.mutate({ data: { paymentMethod, shippingAddress: addr, promoCode: promoApplied?.code || promoCode || undefined, walletAmount: walletApplied, isPickup } } as any);
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
  const walletCoversAll = estimatedBreakdown ? estimatedBreakdown.finalDue <= 0 : walletApplied >= discountedTotal;
  const realFinalDue = estimatedBreakdown?.finalDue ?? finalDue;

  discountedTotalRef.current = realFinalDue;

  return (
    <Sheet open={cartOpen} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[460px] p-0 flex flex-col overflow-hidden bg-white">

        {/* ════════ CART VIEW ════════ */}
        {view === "cart" && (
          <>
            <SheetHeader className="px-5 py-5 flex-shrink-0" style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #1c1200 100%)" }}>
              <SheetTitle className="flex items-center gap-2.5 font-serif text-xl text-white">
                <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: "rgba(201,168,76,0.2)", border: "1px solid rgba(201,168,76,0.4)" }}>
                  <ShoppingCart className="h-4 w-4" style={{ color: "#C9A84C" }} />
                </div>
                Your Cart
                {isAuthenticated && itemCount > 0 && (
                  <Badge className="ml-1 font-bold text-black text-xs" style={{ background: "#C9A84C" }}>{itemCount} item{itemCount !== 1 ? "s" : ""}</Badge>
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
              <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center gap-5">
                <div className="h-28 w-28 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.15), rgba(45,106,79,0.15))", border: "2px dashed rgba(201,168,76,0.4)" }}>
                  <Package className="h-12 w-12" style={{ color: "#C9A84C", opacity: 0.7 }} />
                </div>
                <div>
                  <p className="font-serif font-bold text-2xl">Your cart is empty</p>
                  <p className="text-muted-foreground text-sm mt-1">Discover our premium naturopathic wellness collection.</p>
                </div>
                <Link href="/shop" onClick={() => setCartOpen(false)}>
                  <Button className="gap-2 font-bold px-6" style={{ background: "linear-gradient(135deg, #C9A84C, #a8893e)", color: "#000" }}>
                    <ShoppingCart className="h-4 w-4" /> Browse Products
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                  {items.map((item: any) => {
                    const isRemoving = removingId === item.id;
                    const displayQty = optimisticQtys[item.id] ?? item.quantity;
                    const displayLineTotal = item.price * displayQty;
                    const isDonationItem = item.isDonation;
                    const donationBelowMin = isDonationItem && item.donationMinAmount != null && item.price < item.donationMinAmount;
                    return (
                    <div key={item.id} className={`flex flex-col gap-2 transition-opacity ${isRemoving ? "opacity-40 pointer-events-none" : ""}`}>
                      <div className="flex gap-3 p-3 rounded-xl" style={{ background: "#faf8f3", border: `1px solid ${donationBelowMin ? "#fca5a5" : "#e8dfc8"}` }}>
                        <div className="h-[76px] w-[68px] flex-shrink-0 rounded-lg overflow-hidden" style={{ background: "linear-gradient(135deg, #f5f0e8, #ede5d0)", border: "2px solid #e0d4b8" }}>
                          {resolveImageSrc(item.productImage) ? (
                            <img src={resolveImageSrc(item.productImage)!} alt={item.productName} className="h-full w-full object-contain" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center font-black text-xs" style={{ color: "#C9A84C" }}>NFGN</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm leading-snug">{item.productName}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="font-bold text-sm" style={{ color: "#C9A84C" }}>${item.price.toFixed(2)}</p>
                            {isDonationItem && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(201,168,76,0.12)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.25)" }}>
                                Gift / Donation
                              </span>
                            )}
                            {(item.cvPerUnit ?? 0) > 0 && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(201,168,76,0.12)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.25)" }}>
                                {item.cvPerUnit} CV
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            {!isDonationItem && (
                              <>
                                <button
                                  onClick={() => handleQty(item.id, -1, item.quantity)}
                                  disabled={isRemoving || displayQty <= 1}
                                  className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-bold"
                                  style={{ background: "#fff", border: "1.5px solid #C9A84C", color: "#C9A84C" }}
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="text-sm font-bold w-6 text-center">{displayQty}</span>
                                <button
                                  onClick={() => handleQty(item.id, 1, item.quantity)}
                                  disabled={isRemoving}
                                  className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-bold"
                                  style={{ background: "#C9A84C", color: "#000" }}
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </>
                            )}
                            <span className={`${isDonationItem ? "" : "ml-auto"} text-sm font-bold`} style={{ color: "#0a0a0a" }}>${displayLineTotal.toFixed(2)}</span>
                            <button
                              onClick={() => handleRemove(item.id)}
                              disabled={isRemoving}
                              className="ml-auto text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              {isRemoving
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <Trash2 className="h-4 w-4" />
                              }
                            </button>
                          </div>
                        </div>
                      </div>
                      {donationBelowMin && (
                        <div className="flex items-start gap-2 rounded-lg px-3 py-2 text-xs" style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.25)", color: "#dc2626" }}>
                          <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                          <span>
                            <strong>Minimum donation of ${item.donationMinAmount.toFixed(2)} required.</strong> Please return to the product page to update your gift amount before checking out.
                          </span>
                        </div>
                      )}
                    </div>
                  );})}
                </div>
                <div className="flex-shrink-0 px-5 py-4 space-y-3" style={{ background: "linear-gradient(180deg, #0d0d0d 0%, #111 100%)", borderTop: "3px solid #C9A84C" }}>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "rgba(255,255,255,0.65)" }}>Subtotal</span>
                    <span className="font-bold text-white">${subtotal.toFixed(2)}</span>
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
                        <div className="flex justify-between text-sm font-semibold" style={{ color: "#C9A84C" }}>
                          <span className="flex items-center gap-1">
                            <Zap className="h-3.5 w-3.5" />PV from this order
                          </span>
                          <span>{cartPv} PV</span>
                        </div>
                        {isProMemberCart && (
                          <div className="rounded-lg px-3 py-2 text-xs border flex items-start gap-2" style={cartPv >= 150 ? { background: "rgba(201,168,76,0.12)", borderColor: "#C9A84C", color: "#C9A84C" } : { background: "rgba(201,168,76,0.06)", borderColor: "rgba(201,168,76,0.4)", color: "rgba(201,168,76,0.8)" }}>
                            <Star className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 fill-current" />
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
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>Shipping & taxes calculated at checkout</p>
                  <Button
                    className="w-full gap-2 font-bold text-base h-12"
                    size="lg"
                    onClick={() => setView("checkout")}
                    style={{ background: "linear-gradient(135deg, #C9A84C 0%, #e8c96a 50%, #C9A84C 100%)", color: "#000", boxShadow: "0 4px 20px rgba(201,168,76,0.4)" }}
                  >
                    Proceed to Checkout <ArrowRight className="h-5 w-5" />
                  </Button>
                </div>
              </>
            )}
          </>
        )}

        {/* ════════ CHECKOUT VIEW ════════ */}
        {view === "checkout" && (
          <>
            <SheetHeader className="px-5 py-5 flex-shrink-0" style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #1c1200 100%)" }}>
              <SheetTitle className="flex items-center gap-2.5 font-serif text-xl text-white">
                <button onClick={() => setView("cart")} className="mr-1 rounded-full h-7 w-7 flex items-center justify-center transition-colors hover:bg-white/10" style={{ color: "#C9A84C" }}>
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <CreditCard className="h-5 w-5" style={{ color: "#C9A84C" }} />
                Checkout
              </SheetTitle>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">

              {/* ── STEP 1: NFGN Member Identification ── */}
              <section>
                <h3 className="font-bold text-xs uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: "#C9A84C" }}>
                  <span className="h-4 w-1 rounded-full inline-block" style={{ background: "#C9A84C" }} />
                  <User className="h-3.5 w-3.5" /> NFGN Member Status
                </h3>
                {isAuthenticated && me ? (
                  <MemberBanner user={me} />
                ) : (
                  <MemberCheckSection onSignedIn={handleSignedIn} />
                )}
              </section>

              {/* ── STEP 2: Delivery or Pick-up ── */}
              <section>
                <h3 className="font-bold text-xs uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: "#C9A84C" }}>
                  <span className="h-4 w-1 rounded-full inline-block" style={{ background: "#C9A84C" }} />
                  <Truck className="h-3.5 w-3.5" /> Delivery / Pick-up
                </h3>

                {/* Pickup toggle */}
                <div className="grid grid-cols-2 gap-2 mb-4 p-1 rounded-xl" style={{ background: "#f0ece3" }}>
                  <button
                    type="button"
                    onClick={() => { setIsPickup(false); setTimeout(fetchEstimate, 0); }}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all"
                    style={!isPickup
                      ? { background: "#C9A84C", color: "#000", boxShadow: "0 2px 8px rgba(201,168,76,0.4)" }
                      : { background: "transparent", color: "#666" }}
                  >
                    <Truck className="h-4 w-4" /> Ship to Me
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsPickup(true); setTimeout(fetchEstimate, 0); }}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all"
                    style={isPickup
                      ? { background: "#C9A84C", color: "#000", boxShadow: "0 2px 8px rgba(201,168,76,0.4)" }
                      : { background: "transparent", color: "#666" }}
                  >
                    🏪 Pick-up Order
                  </button>
                </div>

                {isPickup ? (
                  <div className="space-y-3">
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                      <strong>Pick-up selected:</strong> Shipping is waived. A per-product handling fee applies. Enter your name and phone so we can prepare your order.
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <Label className="text-xs">Full Name *</Label>
                        <Input placeholder="Jane Smith" value={shipping.fullName} onChange={e => setShipping(s => ({ ...s, fullName: e.target.value }))} className="mt-1" />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Phone (recommended)</Label>
                        <Input placeholder="(678) 000-0000" value={shipping.phone} onChange={e => setShipping(s => ({ ...s, phone: e.target.value }))} className="mt-1" />
                      </div>
                    </div>
                  </div>
                ) : (
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
                )}
              </section>

              {/* ── STEP 3: Payment Method ── */}
              <section>
                <h3 className="font-bold text-xs uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: "#C9A84C" }}>
                  <span className="h-4 w-1 rounded-full inline-block" style={{ background: "#C9A84C" }} />
                  <CreditCard className="h-3.5 w-3.5" /> Payment Method
                  {walletApplied > 0 && !walletCoversAll && (
                    <span className="ml-1 normal-case font-normal" style={{ color: "#C9A84C" }}>(remaining ${realFinalDue.toFixed(2)})</span>
                  )}
                </h3>
                {walletCoversAll && (
                  <div className="flex items-center gap-2 p-3 rounded-xl mb-3 text-sm font-bold" style={{ background: "linear-gradient(135deg, #1a1200, #0d0d0d)", border: "1.5px solid #C9A84C", color: "#C9A84C" }}>
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    Your E-Wallet fully covers this order — no extra payment needed!
                  </div>
                )}
                <div className="space-y-2">
                  {PAYMENT_METHODS.filter(pm => {
                    if (pm.id !== "cod") return true;
                    const role = (me as any)?.role ?? "";
                    const isAdmin = role === "admin" || role === "super_admin";
                    const isApproved = (me as any)?.canAcceptCod === true;
                    return isAdmin || isApproved;
                  }).map(pm => (
                    <button
                      key={pm.id}
                      onClick={() => setPaymentMethod(pm.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                      style={paymentMethod === pm.id
                        ? { border: `2px solid ${pm.accentColor}`, background: pm.activeBg, boxShadow: `0 0 0 3px ${pm.accentColor}22` }
                        : { border: "2px solid #e5e7eb", background: "#fff" }}
                    >
                      <div className="flex-shrink-0">{pm.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{pm.label}</p>
                        <p className="text-xs text-muted-foreground">{pm.sub}</p>
                      </div>
                      {paymentMethod === pm.id
                        ? <CheckCircle2 className="ml-auto h-5 w-5 flex-shrink-0" style={{ color: pm.accentColor }} />
                        : <div className="ml-auto h-5 w-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                      }
                    </button>
                  ))}
                </div>
              </section>

              {/* ── STEP 4: Payment Details (per method) ── */}

              {/* Square Card */}
              {paymentMethod === "square" && (
                <section className="rounded-xl p-4 space-y-4" style={{ background: "linear-gradient(135deg, #1a1200, #0d0d0d)", border: "1.5px solid #C9A84C" }}>
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: "#C9A84C" }} />
                    <div>
                      <p className="font-semibold text-sm text-white">Secure Card Payment — Powered by Square</p>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(201,168,76,0.75)" }}>
                        Your card details are entered directly into Square's secure, encrypted payment form. Card data never touches NFGN's servers — fully PCI-DSS compliant.
                      </p>
                    </div>
                  </div>
                  <hr style={{ borderColor: "rgba(201,168,76,0.2)" }} />
                  {squareError ? (
                    <div className="space-y-2">
                      <div className="rounded-lg p-3 text-xs" style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.4)", color: "#fca5a5" }}>{squareError}</div>
                      <button
                        onClick={() => { setSquareError(null); squareInitializingRef.current = false; setTimeout(initSquare, 100); }}
                        className="w-full rounded-lg py-2 text-xs font-bold"
                        style={{ background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.4)", color: "#C9A84C" }}
                      >
                        ↻ Retry Loading Card Form
                      </button>
                    </div>
                  ) : !squareReady ? (
                    <div className="flex items-center gap-2 text-xs py-2" style={{ color: "#C9A84C" }}>
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading secure payment form…
                    </div>
                  ) : null}
                  <div
                    ref={cardContainerRef}
                    id="square-card-container"
                    style={{ minHeight: "90px", background: "#ffffff", borderRadius: "8px", padding: "4px" }}
                  />
                  <p className="text-[10px] flex items-center gap-1" style={{ color: "rgba(201,168,76,0.6)" }}>
                    <Shield className="h-3 w-3" /> Visa · Mastercard · Amex · Discover · CashApp Pay all accepted
                  </p>
                </section>
              )}

              {/* Cash App */}
              {paymentMethod === "cash_app" && (
                <section className="rounded-xl p-4 space-y-4" style={{ background: "linear-gradient(135deg, #1a1200, #0d0d0d)", border: "1.5px solid #C9A84C" }}>
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-white">Cash App Payment</p>
                    <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #C9A84C, #e8c96a)" }}>
                      <span className="font-black text-xl leading-none text-black">$</span>
                    </div>
                  </div>

                  {/* Toggle */}
                  <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid rgba(201,168,76,0.4)", background: "rgba(0,0,0,0.3)" }}>
                    <button
                      onClick={() => setCashAppSection("button")}
                      className="flex-1 py-2 text-xs font-semibold transition-colors"
                      style={cashAppSection === "button" ? { background: "#C9A84C", color: "#000" } : { color: "rgba(201,168,76,0.7)" }}
                    >
                      ⚡ Pay Instantly
                    </button>
                    <button
                      onClick={() => setCashAppSection("manual")}
                      className="flex-1 py-2 text-xs font-semibold transition-colors"
                      style={cashAppSection === "manual" ? { background: "#C9A84C", color: "#000" } : { color: "rgba(201,168,76,0.7)" }}
                    >
                      Send Manually
                    </button>
                  </div>

                  {/* Instant CashApp Pay button (Square SDK) */}
                  {cashAppSection === "button" && (
                    <div className="space-y-3">
                      <p className="text-xs text-center" style={{ color: "rgba(201,168,76,0.8)" }}>
                        Tap the button — Cash App opens and handles your payment. Order confirms <strong>instantly</strong>.
                      </p>
                      {!cashAppPayReady && (
                        <div className="flex items-center justify-center gap-2 text-xs py-3" style={{ color: "#C9A84C" }}>
                          <Loader2 className="h-4 w-4 animate-spin" /> Loading Cash App Pay…
                        </div>
                      )}
                      <div ref={cashAppContainerRef} id="cash-app-pay-container" className="min-h-[48px]" />
                      <div className="rounded-lg p-3 space-y-1" style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)" }}>
                        <p className="text-xs font-semibold" style={{ color: "#C9A84C" }}>How it works:</p>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>1. Tap the button — Cash App opens on your device.</p>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>2. Approve <strong style={{ color: "#C9A84C" }}>${realFinalDue.toFixed(2)}</strong> in your Cash App.</p>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>3. Return here — your order confirms automatically, no waiting.</p>
                      </div>
                      <p className="text-center text-xs" style={{ color: "rgba(201,168,76,0.6)" }}>
                        Don't have Cash App?{" "}
                        <button onClick={() => setCashAppSection("manual")} className="underline font-medium" style={{ color: "#C9A84C" }}>Send manually instead</button>
                      </p>
                    </div>
                  )}

                  {/* Manual $cashtag fallback */}
                  {cashAppSection === "manual" && (
                    <div className="space-y-3">
                      <div className="rounded-xl p-4 text-center" style={{ background: "rgba(201,168,76,0.06)", border: "2px solid #C9A84C" }}>
                        <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(201,168,76,0.7)" }}>NFGN Official Cash App</p>
                        <p className="text-2xl font-black" style={{ color: "#C9A84C" }}>$NewFaceGlobalNetwork</p>
                        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>Send exactly <strong style={{ color: "#fff" }}>${realFinalDue.toFixed(2)}</strong> to this $cashtag</p>
                      </div>
                      <div className="rounded-lg p-3 space-y-1.5" style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)" }}>
                        <p className="text-xs font-bold flex items-center gap-1" style={{ color: "#C9A84C" }}><Info className="h-3 w-3" /> How to send via Cash App:</p>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>1. Open Cash App and tap the <strong>$</strong> icon.</p>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>2. Type amount: <strong style={{ color: "#fff" }}>${realFinalDue.toFixed(2)}</strong></p>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>3. Tap <strong>"Pay"</strong>, search <strong>$NewFaceGlobalNetwork</strong>.</p>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>4. Add your name and order info in the <strong>For</strong> field.</p>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>5. Confirm & send — then click <strong>"Place Order"</strong> below.</p>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>6. We confirm within <strong>24 hours</strong> and ship your order.</p>
                      </div>
                      <p className="text-xs rounded p-2" style={{ color: "rgba(201,168,76,0.8)", background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)" }}>
                        ⚠️ Only send to the official <strong>$NewFaceGlobalNetwork</strong> cashtag. NFGN will never ask you to send to a personal account.
                      </p>
                    </div>
                  )}
                </section>
              )}

              {/* PayPal */}
              {paymentMethod === "paypal" && (
                <section className="rounded-xl p-4 space-y-4" style={{ background: "linear-gradient(135deg, #1a1200, #0d0d0d)", border: "1.5px solid #C9A84C" }}>
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-white">PayPal Payment</p>
                    <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #C9A84C, #e8c96a)" }}>
                      <span className="font-black text-sm text-black">PP</span>
                    </div>
                  </div>

                  {/* Toggle */}
                  <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid rgba(201,168,76,0.4)", background: "rgba(0,0,0,0.3)" }}>
                    <button
                      onClick={() => setPaypalSection("button")}
                      className="flex-1 py-2 text-xs font-semibold transition-colors"
                      style={paypalSection === "button" ? { background: "#C9A84C", color: "#000" } : { color: "rgba(201,168,76,0.7)" }}
                    >
                      ⚡ Pay with PayPal
                    </button>
                    <button
                      onClick={() => setPaypalSection("manual")}
                      className="flex-1 py-2 text-xs font-semibold transition-colors"
                      style={paypalSection === "manual" ? { background: "#C9A84C", color: "#000" } : { color: "rgba(201,168,76,0.7)" }}
                    >
                      Send Manually
                    </button>
                  </div>

                  {/* Live PayPal button */}
                  {paypalSection === "button" && (
                    <div className="space-y-3">
                      <p className="text-xs text-center" style={{ color: "rgba(201,168,76,0.8)" }}>
                        Click the button — the PayPal window opens. Log in, approve, and your order confirms <strong>instantly</strong>.
                      </p>
                      {paypalLoading && (
                        <div className="flex items-center justify-center gap-2 text-xs py-3" style={{ color: "#C9A84C" }}>
                          <Loader2 className="h-4 w-4 animate-spin" /> Loading PayPal…
                        </div>
                      )}
                      {paypalError && (
                        <div className="rounded-lg p-3 text-xs" style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.4)", color: "#fca5a5" }}>{paypalError}</div>
                      )}
                      <div id="paypal-button-container" className="min-h-[48px]" />
                      <p className="text-center text-xs" style={{ color: "rgba(201,168,76,0.6)" }}>
                        Don't want to use PayPal?{" "}
                        <button onClick={() => setPaypalSection("manual")} className="underline font-medium" style={{ color: "#C9A84C" }}>Send manually instead</button>
                      </p>
                    </div>
                  )}

                  {/* Manual fallback */}
                  {paypalSection === "manual" && (
                    <div className="space-y-3">
                      <div className="rounded-xl p-4 text-center" style={{ background: "rgba(201,168,76,0.06)", border: "2px solid #C9A84C" }}>
                        <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(201,168,76,0.7)" }}>NFGN Official PayPal</p>
                        <p className="text-lg font-bold" style={{ color: "#C9A84C" }}>newfaceglobalnetwork@gmail.com</p>
                        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>Send exactly <strong style={{ color: "#fff" }}>${realFinalDue.toFixed(2)}</strong> to this PayPal account</p>
                      </div>
                      <div className="rounded-lg p-3 space-y-1.5" style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)" }}>
                        <p className="text-xs font-bold flex items-center gap-1" style={{ color: "#C9A84C" }}><Info className="h-3 w-3" /> How to send via PayPal:</p>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>1. Log into <strong>PayPal.com</strong> or open the PayPal app.</p>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>2. Click <strong>"Send & Request"</strong> → <strong>"Send Money"</strong>.</p>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>3. Enter <strong>newfaceglobalnetwork@gmail.com</strong> as the recipient.</p>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>4. Amount: <strong style={{ color: "#fff" }}>${realFinalDue.toFixed(2)}</strong></p>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>5. Choose <strong>"Friends & Family"</strong> to avoid extra fees.</p>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>6. Add your name and order info, confirm & send.</p>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>7. Click <strong>"Place Order"</strong> below — we confirm within <strong>24 hours</strong>.</p>
                      </div>
                      <p className="text-xs rounded p-2" style={{ color: "rgba(201,168,76,0.8)", background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)" }}>
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
                  <div className="rounded-xl p-4 space-y-2" style={{ background: "linear-gradient(135deg, #1a1200, #0d0d0d)", border: "2px solid #C9A84C" }}>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: "#C9A84C" }} />
                      <div>
                        <p className="font-bold text-sm text-white">COD — By Approval Only</p>
                        <p className="text-xs mt-1" style={{ color: "rgba(201,168,76,0.75)" }}>
                          Cash on Delivery is a <strong>restricted payment option</strong> available exclusively for:
                        </p>
                      </div>
                    </div>
                    <ul className="text-xs space-y-1 pl-7 list-disc" style={{ color: "rgba(201,168,76,0.8)" }}>
                      <li><strong>Pre-approved orders</strong> granted by an NFGN official in advance</li>
                      <li><strong>NFGN special events</strong> and in-person distribution arrangements</li>
                      <li><strong>Orders with written special approval</strong> from an official NFGN representative</li>
                    </ul>
                    <div className="rounded-lg p-2 mt-1" style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)" }}>
                      <p className="text-xs font-semibold" style={{ color: "#C9A84C" }}>To request COD approval, contact NFGN directly:</p>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.75)" }}>📞 <strong>(678) 909-9974</strong></p>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.75)" }}>✉️ <strong>newfaceglobalnetwork@gmail.com</strong></p>
                    </div>
                  </div>

                  <div className="rounded-xl p-4 space-y-2" style={{ background: "#faf8f3", border: "1px solid #e8dfc8" }}>
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4" style={{ color: "#C9A84C" }} />
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
                <h3 className="font-bold text-xs uppercase tracking-widest mb-2 flex items-center gap-2" style={{ color: "#C9A84C" }}>
                  <span className="h-4 w-1 rounded-full inline-block" style={{ background: "#C9A84C" }} />
                  <Tag className="h-3.5 w-3.5" /> Promo Code
                </h3>
                {promoApplied ? (
                  <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: "linear-gradient(135deg, #1a1200, #0d0d0d)", border: "1.5px solid #C9A84C" }}>
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: "#C9A84C" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono font-black" style={{ color: "#C9A84C" }}>{promoApplied.code}</p>
                      <p className="text-xs" style={{ color: "rgba(201,168,76,0.75)" }}>
                        {promoApplied.discountType === "percentage"
                          ? `${promoApplied.discountValue}% off applied`
                          : `$${promoApplied.discountValue.toFixed(2)} off applied`}
                        {" — "}<span className="font-semibold text-white">−${promoDiscount.toFixed(2)}</span>
                      </p>
                    </div>
                    <button onClick={clearPromo} className="text-xs underline ml-1 flex-shrink-0" style={{ color: "rgba(201,168,76,0.7)" }}>
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
                  <h3 className="font-bold text-xs uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: "#C9A84C" }}>
                    <span className="h-4 w-1 rounded-full inline-block" style={{ background: "#C9A84C" }} />
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
                          <span style={{ color: "#C9A84C" }}>
                            {walletCoversAll ? "✓ $0.00 — Fully covered!" : `$${realFinalDue.toFixed(2)}`}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* ── Order Summary ── */}
              <section className="rounded-xl p-4 space-y-2" style={{ background: "linear-gradient(135deg, #faf8f3, #f5f0e8)", border: "1.5px solid #e0d4b8" }}>
                <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: "#0a0a0a" }}>
                  <Package className="h-4 w-4" style={{ color: "#C9A84C" }} /> Order Summary
                </h3>
                {items.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground truncate mr-2">{item.productName} × {item.quantity}</span>
                    <span className="flex-shrink-0 font-medium">${item.lineTotal.toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold pt-2 mt-1" style={{ borderTop: "1px solid #d4c4a0" }}>
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {promoDiscount > 0 && (
                  <div className="flex justify-between text-sm font-semibold" style={{ color: "#C9A84C" }}>
                    <span className="flex items-center gap-1"><Tag className="h-3 w-3" /> Promo ({promoApplied!.code})</span>
                    <span>−${promoDiscount.toFixed(2)}</span>
                  </div>
                )}
                {estimatedBreakdown ? (
                  <>
                    {estimatedBreakdown.isPickup ? (
                      <>
                        <div className="flex justify-between text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                          <span>🏪 Pick-up Order</span>
                          <span style={{ color: "#C9A84C" }}>Shipping waived</span>
                        </div>
                        {estimatedBreakdown.handlingFee > 0 && (
                          <div className="flex justify-between text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                            <span>Handling Fee</span>
                            <span>${estimatedBreakdown.handlingFee.toFixed(2)}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex justify-between text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                        <span>Shipping</span>
                        <span>{estimatedBreakdown.isFreeShipping ? <span style={{ color: "#C9A84C" }}>Free</span> : `$${estimatedBreakdown.shipping.toFixed(2)}`}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                      <span>Tax</span>
                      <span>${estimatedBreakdown.tax.toFixed(2)}</span>
                    </div>
                    {walletApplied > 0 && (
                      <div className="flex justify-between text-sm font-semibold" style={{ color: "#C9A84C" }}>
                        <span className="flex items-center gap-1"><Wallet className="h-3 w-3" /> E-Wallet credit</span>
                        <span>−${estimatedBreakdown.walletDeduction.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-base pt-2 mt-1" style={{ borderTop: "2px solid #C9A84C", color: "#C9A84C" }}>
                      <span>Total Due</span>
                      <span>{estimatedBreakdown.finalDue <= 0 ? "✓ Covered by Wallet" : `$${estimatedBreakdown.finalDue.toFixed(2)}`}</span>
                    </div>
                  </>
                ) : (
                  <>
                    {walletApplied > 0 && (
                      <div className="flex justify-between text-sm font-semibold" style={{ color: "#C9A84C" }}>
                        <span className="flex items-center gap-1"><Wallet className="h-3 w-3" /> E-Wallet credit</span>
                        <span>−${walletApplied.toFixed(2)}</span>
                      </div>
                    )}
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>+ shipping &amp; taxes calculated on order</p>
                  </>
                )}
              </section>
            </div>

            <div className="flex-shrink-0 px-5 py-4" style={{ background: "linear-gradient(180deg, #0d0d0d 0%, #111 100%)", borderTop: "3px solid #C9A84C" }}>
              {paymentMethod === "cash_app" && cashAppSection === "button" ? (
                <p className="text-xs text-center font-semibold py-1" style={{ color: "#00C853" }}>
                  Use the <strong>Cash App Pay</strong> button above to complete your order.
                </p>
              ) : paymentMethod === "paypal" && paypalSection === "button" ? (
                <p className="text-xs text-center font-semibold py-1" style={{ color: "#009cde" }}>
                  Use the <strong>PayPal</strong> button above to complete your order.
                </p>
              ) : (
                <Button
                  className="w-full gap-2 font-bold text-base h-12"
                  size="lg"
                  onClick={placeOrder}
                  disabled={createOrder.isPending || paymentProcessing || !isAuthenticated || !!walletError}
                  style={{ background: "linear-gradient(135deg, #C9A84C 0%, #e8c96a 50%, #C9A84C 100%)", color: "#000", boxShadow: "0 4px 20px rgba(201,168,76,0.4)" }}
                >
                  {createOrder.isPending || paymentProcessing
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> {paymentProcessing ? "Processing Payment…" : "Placing Order…"}</>
                    : walletCoversAll
                      ? <>Place Order · Covered by Wallet <ArrowRight className="h-4 w-4" /></>
                      : <>Place Order · ${realFinalDue.toFixed(2)} <ArrowRight className="h-4 w-4" /></>
                  }
                </Button>
              )}
              {!isAuthenticated && (
                <p className="text-xs text-center mt-2" style={{ color: "rgba(255,255,255,0.5)" }}>Sign in above to place your order.</p>
              )}
            </div>
          </>
        )}

        {/* ════════ SIGNATURE VIEW ════════ */}
        {view === "sign" && (
          <div className="flex-1 flex flex-col px-6 py-6 gap-4 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(201,168,76,0.15)", border: "1.5px solid rgba(201,168,76,0.4)" }}>
                <PenLine className="h-5 w-5" style={{ color: "#C9A84C" }} />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg leading-tight" style={{ color: "#fff" }}>Proof of Purchase</h3>
                <p className="text-xs" style={{ color: "#a0a0a0" }}>Sign below to confirm you placed this order</p>
              </div>
            </div>

            {/* Legal notice */}
            <div className="rounded-lg p-3 text-xs space-y-1" style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.25)" }}>
              <p className="font-bold uppercase tracking-wide" style={{ color: "#C9A84C" }}>Important — Please Read</p>
              <p style={{ color: "#a0a0a0" }}>
                Your signature serves as legal confirmation that you personally authorised this purchase. It is recorded with a timestamp and linked to your order as proof of presence at the time of purchase. All sales are final — this product is non-refundable and cannot be returned.
              </p>
            </div>

            {/* Order summary */}
            {lastOrder && (
              <div className="rounded-lg p-3 text-sm space-y-1.5" style={{ background: "#1a1a1a", border: "1.5px solid #2a2a2a" }}>
                <div className="flex justify-between">
                  <span style={{ color: "#6b7280" }}>Order #</span>
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded" style={{ background: "#0a0a0a", color: "#C9A84C" }}>{lastOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "#6b7280" }}>Payment</span>
                  <span className="font-semibold capitalize" style={{ color: "#fff" }}>{PAYMENT_METHODS.find(p => p.id === lastOrder.paymentMethod)?.label ?? lastOrder.paymentMethod}</span>
                </div>
                <div className="flex justify-between border-t pt-1.5" style={{ borderColor: "#2a2a2a" }}>
                  <span className="font-bold" style={{ color: "#fff" }}>Total</span>
                  <span className="font-black" style={{ color: "#C9A84C" }}>${lastOrder.total?.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Canvas pad */}
            <div>
              <p className="text-sm font-medium mb-2" style={{ color: "#e2e2e2" }}>Sign with your finger or mouse:</p>
              <div
                className="relative rounded-lg overflow-hidden"
                style={{ border: "2px dashed #2a2a2a", background: "#f9f9f9", touchAction: "none" }}
              >
                <canvas
                  ref={sigCanvasRef}
                  width={480}
                  height={140}
                  className="w-full cursor-crosshair"
                  onMouseDown={(e) => {
                    const ctx = sigCanvasRef.current?.getContext("2d");
                    if (!ctx) return;
                    setSigDrawing(true);
                    setSigEmpty(false);
                    const rect = sigCanvasRef.current!.getBoundingClientRect();
                    ctx.beginPath();
                    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
                  }}
                  onMouseMove={(e) => {
                    if (!sigDrawing) return;
                    const ctx = sigCanvasRef.current?.getContext("2d");
                    if (!ctx || !sigCanvasRef.current) return;
                    const rect = sigCanvasRef.current.getBoundingClientRect();
                    const scaleX = sigCanvasRef.current.width / rect.width;
                    const scaleY = sigCanvasRef.current.height / rect.height;
                    ctx.lineTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
                    ctx.strokeStyle = "#0a0a0a";
                    ctx.lineWidth = 2;
                    ctx.lineCap = "round";
                    ctx.lineJoin = "round";
                    ctx.stroke();
                  }}
                  onMouseUp={() => setSigDrawing(false)}
                  onMouseLeave={() => setSigDrawing(false)}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    const ctx = sigCanvasRef.current?.getContext("2d");
                    if (!ctx) return;
                    setSigDrawing(true);
                    setSigEmpty(false);
                    const rect = sigCanvasRef.current!.getBoundingClientRect();
                    ctx.beginPath();
                    ctx.moveTo(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
                  }}
                  onTouchMove={(e) => {
                    e.preventDefault();
                    if (!sigDrawing) return;
                    const ctx = sigCanvasRef.current?.getContext("2d");
                    if (!ctx || !sigCanvasRef.current) return;
                    const rect = sigCanvasRef.current.getBoundingClientRect();
                    const scaleX = sigCanvasRef.current.width / rect.width;
                    const scaleY = sigCanvasRef.current.height / rect.height;
                    ctx.lineTo((e.touches[0].clientX - rect.left) * scaleX, (e.touches[0].clientY - rect.top) * scaleY);
                    ctx.strokeStyle = "#0a0a0a";
                    ctx.lineWidth = 2;
                    ctx.lineCap = "round";
                    ctx.lineJoin = "round";
                    ctx.stroke();
                  }}
                  onTouchEnd={() => setSigDrawing(false)}
                />
                {sigEmpty && (
                  <p className="absolute inset-0 flex items-center justify-center text-sm pointer-events-none" style={{ color: "#9ca3af" }}>
                    Draw your signature here
                  </p>
                )}
              </div>
              <button
                className="mt-1 text-xs"
                style={{ color: "#6b7280", background: "none", border: "none", cursor: "pointer", padding: "2px 0" }}
                onClick={() => {
                  const ctx = sigCanvasRef.current?.getContext("2d");
                  if (ctx && sigCanvasRef.current) ctx.clearRect(0, 0, sigCanvasRef.current.width, sigCanvasRef.current.height);
                  setSigEmpty(true);
                }}
              >
                Clear
              </button>
            </div>

            {/* Consent checkbox */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sigAgreed}
                onChange={e => setSigAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded"
                style={{ accentColor: "#C9A84C" }}
              />
              <span className="text-xs leading-relaxed" style={{ color: "#a0a0a0" }}>
                I confirm that I personally authorised this purchase and am the account holder. I understand this digital signature is timestamped and serves as my official proof of purchase. I acknowledge that all sales are final — this product is non-refundable and cannot be returned.
              </span>
            </label>

            {/* Submit button */}
            <Button
              disabled={sigEmpty || !sigAgreed || sigSubmitting}
              className="w-full font-bold mt-auto"
              style={{ background: (!sigEmpty && sigAgreed) ? "linear-gradient(135deg,#C9A84C,#e8c96a)" : "#2a2a2a", color: (!sigEmpty && sigAgreed) ? "#000" : "#6b7280", border: "none", transition: "all 0.2s" }}
              onClick={async () => {
                if (!lastOrder?.id || !sigCanvasRef.current) return;
                setSigSubmitting(true);
                try {
                  const signature = sigCanvasRef.current.toDataURL("image/png");
                  const signRes = await customFetch(`/api/orders/${lastOrder.id}/sign`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ signature }),
                  });
                  if (!signRes.ok) {
                    const errBody = await signRes.json().catch(() => ({}));
                    throw new Error((errBody as any)?.error ?? `Server error ${signRes.status}`);
                  }
                  setSignatureDataUrl(signature);
                  qc.invalidateQueries({ queryKey: ["/api/orders"] });
                  setView("confirm");
                } catch (_) {
                  toast({ title: "Signature not saved", description: "Could not save your signature. Please try again.", variant: "destructive" });
                } finally {
                  setSigSubmitting(false);
                }
              }}
            >
              {sigSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><PenLine className="h-4 w-4 mr-2" />Sign & Confirm Purchase</>}
            </Button>
          </div>
        )}

        {/* ════════ CONFIRMATION VIEW ════════ */}
        {view === "confirm" && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center gap-5">
            {/* Celebration badge */}
            <div className="relative">
              <div className="h-24 w-24 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #C9A84C, #e8c96a)", boxShadow: "0 8px 32px rgba(201,168,76,0.5)" }}>
                <CheckCircle2 className="h-12 w-12 text-black" />
              </div>
              <div className="absolute -top-1 -right-1 h-7 w-7 rounded-full flex items-center justify-center text-sm" style={{ background: "#0a0a0a", border: "2px solid #C9A84C" }}>
                🎉
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-serif font-bold mb-1" style={{ color: "#C9A84C" }}>
                Order Placed!
              </h2>
              <p className="text-muted-foreground text-sm">Thank you for shopping with NFGN. A confirmation email is on its way.</p>
            </div>

            {lastOrder && (
              <div className="rounded-xl p-4 w-full text-left space-y-2.5 text-sm" style={{ background: "linear-gradient(135deg, #faf8f3, #f5f0e8)", border: "1.5px solid #C9A84C" }}>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Order #</span>
                  <span className="font-mono font-bold text-xs px-2 py-1 rounded" style={{ background: "#0a0a0a", color: "#C9A84C" }}>{lastOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment</span>
                  <span className="font-semibold capitalize">{PAYMENT_METHODS.find(p => p.id === lastOrder.paymentMethod)?.label ?? lastOrder.paymentMethod}</span>
                </div>
                <div className="flex justify-between border-t pt-2" style={{ borderColor: "#d4c4a0" }}>
                  <span className="font-bold">Total</span>
                  <span className="font-black text-base" style={{ color: "#C9A84C" }}>${lastOrder.total?.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Digital signature confirmation */}
            {signatureDataUrl && (
              <div className="w-full rounded-xl overflow-hidden text-left" style={{ border: "1.5px solid #C9A84C", background: "#faf8f3" }}>
                <div className="px-4 pt-3 pb-1">
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#C9A84C" }}>Your Digital Signature</p>
                  <p className="text-xs mt-0.5" style={{ color: "#888" }}>Signed at {new Date().toLocaleString()}</p>
                </div>
                <div className="mx-4 mb-3 rounded-lg overflow-hidden border" style={{ borderColor: "#d4c4a0", background: "#fff" }}>
                  <img src={signatureDataUrl} alt="Your signature" className="w-full" style={{ maxHeight: 80, objectFit: "contain" }} />
                </div>
                <div className="px-4 pb-3">
                  <p className="text-xs rounded-lg px-3 py-2 leading-relaxed" style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.25)", color: "#666" }}>
                    <span className="font-bold" style={{ color: "#C9A84C" }}>Agreement confirmed: </span>
                    I confirm that I personally authorised this purchase and am the account holder. I understand this digital signature is timestamped and serves as my official proof of purchase. I acknowledge that all sales are final — this product is non-refundable and cannot be returned.
                  </p>
                </div>
              </div>
            )}

            {(paymentMethod === "cash_app" || paymentMethod === "paypal") && !walletCoversAll && (
              <div className="rounded-xl p-4 text-sm w-full text-left" style={{ background: "linear-gradient(135deg, #1a1200, #0d0d0d)", border: "2px solid #C9A84C" }}>
                <p className="font-bold mb-1.5 flex items-center gap-1.5" style={{ color: "#C9A84C" }}>
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" /> Action Required — Send Payment Now
                </p>
                {paymentMethod === "cash_app" && (
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.75)" }}>Send <strong style={{ color: "#C9A84C" }}>${realFinalDue.toFixed(2)}</strong> to <strong style={{ color: "#fff" }}>$NewFaceGlobalNetwork</strong> on Cash App. Include your order number in the note.</p>
                )}
                {paymentMethod === "paypal" && (
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.75)" }}>Send <strong style={{ color: "#C9A84C" }}>${realFinalDue.toFixed(2)}</strong> via PayPal Friends & Family to <strong style={{ color: "#fff" }}>newfaceglobalnetwork@gmail.com</strong>. Include your order number in the note.</p>
                )}
              </div>
            )}

            {paymentMethod === "cod" && (
              <div className="rounded-xl p-4 text-sm w-full text-left" style={{ background: "linear-gradient(135deg, #1a1200, #0d0d0d)", border: "1.5px solid #C9A84C" }}>
                <p className="font-bold mb-1" style={{ color: "#C9A84C" }}>COD Order Submitted</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.75)" }}>An NFGN representative will review your COD request and contact you at the phone number provided. Unapproved COD orders will be cancelled.</p>
              </div>
            )}

            <div className="flex flex-col gap-2.5 w-full">
              <Link href="/dashboard/orders" onClick={() => setCartOpen(false)} className="w-full">
                <Button className="w-full font-semibold" variant="outline" style={{ borderColor: "#C9A84C", color: "#C9A84C" }}>
                  View My Orders
                </Button>
              </Link>
              <Button
                className="w-full font-bold"
                onClick={() => { setView("cart"); setCartOpen(false); }}
                style={{ background: "linear-gradient(135deg, #C9A84C 0%, #e8c96a 50%, #C9A84C 100%)", color: "#000", boxShadow: "0 4px 16px rgba(201,168,76,0.35)" }}
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
