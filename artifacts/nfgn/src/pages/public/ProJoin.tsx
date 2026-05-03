import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useListProducts, useGetMe } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CheckCircle, Star, Loader2, UserCircle2, Briefcase,
  CreditCard, Truck, Smartphone, DollarSign, Package,
  ShoppingCart, ArrowRight, LogIn, UserPlus, HelpCircle,
  Trophy, Upload,
} from "lucide-react";
import { BAP_CATEGORIES } from "@/lib/bapCategories";
import { resolveImageSrc } from "@/lib/image";

const proJoinSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  organizationName: z.string().optional(),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  phone: z.string().optional(),
  referralCode: z.string().min(1, "A sponsor referral code is required"),
  address1: z.string().min(3, "Street address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zip: z.string().min(4, "ZIP code is required"),
  paymentMethod: z.enum(["cod", "cashapp", "paypal", "special"], { required_error: "Select a payment method" }),
}).refine(d => d.password === d.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] });

type ProJoinFormValues = z.infer<typeof proJoinSchema>;
type SponsorInfo = { name: string; label: string } | null;

const PAYMENT_METHODS = [
  { value: "cod", label: "Cash on Delivery (COD)", icon: Truck, desc: "Pay when your package arrives" },
  { value: "cashapp", label: "CashApp", icon: Smartphone, desc: "Send payment via CashApp" },
  { value: "paypal", label: "PayPal", icon: DollarSign, desc: "Send payment via PayPal" },
  { value: "special", label: "Special Arrangement", icon: CreditCard, desc: "Contact admin to arrange payment" },
];

export function ProJoin() {
  const [, setLocation] = useLocation();
  const { login, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { data: me } = useGetMe();
  const { data: productsData, isLoading: productsLoading } = useListProducts({ isProPackage: true });

  const proPackages = productsData?.products?.filter((p: any) => p.isProPackage) ?? [];

  const searchParams = new URLSearchParams(window.location.search);
  const refCode = searchParams.get("ref") ?? "";

  const [isMember, setIsMember] = useState<null | boolean>(null);

  const [sponsorInfo, setSponsorInfo] = useState<SponsorInfo>(null);
  const [sponsorLoading, setSponsorLoading] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const [isBAPProvider, setIsBAPProvider] = useState(false);
  const [bapCategory, setBapCategory] = useState("");
  const [bapSubServices, setBapSubServices] = useState<string[]>([]);
  const [bapCustomService, setBapCustomService] = useState("");
  const [bapBio, setBapBio] = useState("");

  const [isSportsPlayer, setIsSportsPlayer] = useState(false);
  const [sportsDateOfBirth, setSportsDateOfBirth] = useState("");
  const [sportsSchool, setSportsSchool] = useState("");
  const [sportsGrade, setSportsGrade] = useState("");
  const [sportsBirthCertUrl, setSportsBirthCertUrl] = useState("");
  const [uploadingSportsCert, setUploadingSportsCert] = useState(false);
  const sportsCertInputRef = useRef<HTMLInputElement>(null);

  async function lookupSponsor(code: string) {
    if (!code.trim()) { setSponsorInfo(null); return; }
    setSponsorLoading(true);
    try {
      const res = await fetch(`/api/auth/sponsor-lookup?ref=${encodeURIComponent(code.trim())}`);
      if (res.ok) setSponsorInfo(await res.json());
      else setSponsorInfo(null);
    } catch { setSponsorInfo(null); }
    finally { setSponsorLoading(false); }
  }

  useEffect(() => {
    if (refCode) lookupSponsor(refCode);
  }, [refCode]);

  useEffect(() => {
    if (proPackages.length > 0 && !selectedProductId) {
      setSelectedProductId(String(proPackages[0].id));
    }
  }, [proPackages.length]);

  const form = useForm<ProJoinFormValues>({
    resolver: zodResolver(proJoinSchema),
    defaultValues: {
      firstName: "", lastName: "", organizationName: "", email: "",
      password: "", confirmPassword: "", phone: "",
      referralCode: refCode,
      address1: "", city: "", state: "", zip: "",
      paymentMethod: "cod",
    },
  });

  const bapCategoryOptions = BAP_CATEGORIES[bapCategory] ?? [];
  const toggleBapService = (s: string) =>
    setBapSubServices(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const addBapCustom = () => {
    const s = bapCustomService.trim();
    if (s && !bapSubServices.includes(s)) setBapSubServices(prev => [...prev, s]);
    setBapCustomService("");
  };

  const selectedProduct = proPackages.find((p: any) => String(p.id) === selectedProductId);

  if (isAuthenticated && me) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-xl w-full text-center space-y-6">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Star className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold mb-2">You Already Have an Account</h1>
            <p className="text-muted-foreground">
              Hi <strong>{me.firstName}</strong> — Pro Member Registration is for new members only.
              Since you're already registered, you can upgrade your account to Pro Member status by purchasing a Pro Registration Package.
            </p>
          </div>

          {me.isProMember ? (
            <div className="rounded-xl border-2 border-primary bg-primary/5 p-5 text-center">
              <Badge className="mb-2">Active Pro Member</Badge>
              <p className="font-semibold">You're already a Pro Member!</p>
              <p className="text-sm text-muted-foreground mt-1">
                To maintain your active status, keep your monthly PCV at or above 100. You can purchase additional products from the shop.
              </p>
              <div className="flex gap-3 justify-center mt-4">
                <Link href="/dashboard">
                  <Button>Go to My Dashboard</Button>
                </Link>
                <Link href="/shop">
                  <Button variant="outline">Shop Products</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-5">
                <p className="font-semibold text-sm mb-1">Ready to upgrade to Pro Member?</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Purchase any Pro Registration Package from the shop. Once your order is placed, your account is automatically upgraded to Pro Member status.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {!productsLoading && proPackages.map((p: any) => (
                    <Link key={p.id} href={`/product/${p.slug}`}>
                      <Button className="w-full gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        {p.name} — ${Number(p.price).toFixed(2)}
                      </Button>
                    </Link>
                  ))}
                </div>
              </div>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Back to My Dashboard
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── Gate screen: already a member? → sign in ── */
  if (isMember === true) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center space-y-3">
            <div
              className="h-20 w-20 rounded-full mx-auto flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #1a0f00 100%)", border: "2px solid #C9A84C" }}
            >
              <LogIn className="h-9 w-9" style={{ color: "#C9A84C" }} />
            </div>
            <h1 className="text-3xl font-serif font-bold">Welcome Back!</h1>
            <p className="text-muted-foreground">
              Since you're already an NFGN member, sign in to your account and upgrade to Pro Member from your dashboard.
            </p>
          </div>

          <div className="rounded-xl border bg-muted/30 p-5 space-y-3 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">How to upgrade as an existing member:</p>
            <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
              <li>Sign in to your NFGN account below</li>
              <li>Go to <strong>Dashboard → Registration</strong></li>
              <li>Select a Pro Registration Package and check out</li>
              <li>Your account upgrades to Pro Member instantly</li>
            </ol>
          </div>

          <div className="space-y-3">
            <Link href={refCode ? `/login?ref=${refCode}` : "/login"}>
              <Button className="w-full gap-2 h-12 text-base font-semibold">
                <LogIn className="h-5 w-5" /> Sign In to My Account
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="w-full text-sm text-muted-foreground"
              onClick={() => setIsMember(null)}
            >
              ← Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Gate screen: question ── */
  if (isMember === null) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Sponsor banner */}
        {sponsorInfo && (
          <div className="bg-primary/10 border-b border-primary/20 py-3 px-4 text-center">
            <div className="flex items-center justify-center gap-2 text-sm">
              <UserCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="font-semibold text-foreground">{sponsorInfo.name}</span>
              <span className="text-muted-foreground">·</span>
              <Badge variant="outline" className="text-xs border-primary/50 text-primary bg-primary/5">{sponsorInfo.label}</Badge>
              <span className="text-muted-foreground hidden sm:inline">is your sponsor — welcome to the family!</span>
            </div>
          </div>
        )}

        {/* Dark hero strip */}
        <div className="py-10 px-4 text-center" style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #1a0f00 60%, #0a0a0a 100%)" }}>
          <Badge className="mb-3 text-xs font-bold tracking-widest uppercase bg-primary text-primary-foreground">
            <Star className="h-3 w-3 mr-1 fill-current" /> Pro Member Registration
          </Badge>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-2">Join as a Pro Member</h1>
          <p className="text-gray-400 max-w-md mx-auto text-sm">
            Unlock commissions, team bonuses, and the full NFGN compensation plan.
          </p>
        </div>

        {/* Question card */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-lg w-full space-y-8">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2 mb-3">
                <HelpCircle className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-serif font-bold">Already An NFGN Member?</h2>
              <p className="text-muted-foreground text-sm">
                This helps us get you to the right place.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* YES */}
              <button
                onClick={() => setIsMember(true)}
                className="group relative rounded-2xl border-2 border-border hover:border-primary/60 bg-card p-6 text-center transition-all hover:shadow-lg hover:shadow-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <div
                  className="h-14 w-14 rounded-full mx-auto mb-4 flex items-center justify-center transition-colors group-hover:border-primary"
                  style={{ border: "2px solid #C9A84C22", background: "linear-gradient(135deg, #C9A84C22, #C9A84C11)" }}
                >
                  <LogIn className="h-7 w-7 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-xl font-black mb-1" style={{ color: "#C9A84C" }}>YES</p>
                <p className="text-xs text-muted-foreground leading-snug">I already have an NFGN account</p>
              </button>

              {/* NO */}
              <button
                onClick={() => setIsMember(false)}
                className="group relative rounded-2xl border-2 border-border hover:border-primary/60 bg-card p-6 text-center transition-all hover:shadow-lg hover:shadow-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/50"
                style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #111 100%)" }}
              >
                <div
                  className="h-14 w-14 rounded-full mx-auto mb-4 flex items-center justify-center transition-colors"
                  style={{ border: "2px solid #C9A84C44", background: "linear-gradient(135deg, #C9A84C33, #C9A84C11)" }}
                >
                  <UserPlus className="h-7 w-7 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-xl font-black text-white mb-1">NO</p>
                <p className="text-xs text-gray-400 leading-snug">I'm new — create my account</p>
              </button>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">Sign in here →</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  async function onSubmit(data: ProJoinFormValues) {
    if (!selectedProductId) {
      toast({ variant: "destructive", title: "Select a package", description: "Please select a Pro Registration Package." });
      return;
    }
    setSubmitting(true);
    try {
      const shippingAddress = `${data.address1}, ${data.city}, ${data.state} ${data.zip}`;
      const body: Record<string, any> = {
        ...data,
        selectedProductId,
        shippingAddress,
        isBookAProProvider: isBAPProvider,
      };
      if (isBAPProvider && bapCategory) {
        body.bookAProCategory = bapCategory;
        body.bookAProSubServices = bapSubServices;
        if (bapBio.trim()) body.bookAProBio = bapBio.trim();
      }
      if (isSportsPlayer) {
        body.isSportsPlayer = true;
        if (sportsDateOfBirth) body.sportsDateOfBirth = sportsDateOfBirth;
        if (sportsSchool.trim()) body.sportsSchool = sportsSchool.trim();
        if (sportsGrade) body.sportsGrade = sportsGrade;
        if (sportsBirthCertUrl) body.sportsBirthCertificateUrl = sportsBirthCertUrl;
      }

      const res = await fetch("/api/auth/register-pro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok) {
        toast({ variant: "destructive", title: "Registration failed", description: result.error || "Please try again." });
        return;
      }
      login(result.token);
      toast({
        title: "Welcome to NFGN! You're now a Pro Member!",
        description: `Your order ${result.orderNumber} has been placed. Welcome to the family!`,
      });
      window.location.href = "/dashboard";
    } catch {
      toast({ variant: "destructive", title: "Network error", description: "Please check your connection and try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sponsor Banner */}
      {sponsorInfo && (
        <div className="bg-primary/10 border-b border-primary/20 py-3 px-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm">
            <UserCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="font-semibold text-foreground">{sponsorInfo.name}</span>
            <span className="text-muted-foreground">·</span>
            <Badge variant="outline" className="text-xs border-primary/50 text-primary bg-primary/5">
              {sponsorInfo.label}
            </Badge>
            <span className="text-muted-foreground hidden sm:inline">is your sponsor — welcome to the family!</span>
          </div>
        </div>
      )}
      {sponsorLoading && (
        <div className="bg-muted/40 border-b py-2 px-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Looking up your sponsor...
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="bg-foreground text-background py-16 px-4 text-center">
        <Badge className="mb-4 text-xs font-bold tracking-widest uppercase bg-primary text-primary-foreground">
          <Star className="h-3 w-3 mr-1 fill-current" /> Pro Member Registration
        </Badge>
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-3">Join as a Pro Member</h1>
        <p className="text-gray-400 max-w-xl mx-auto">
          Register as a Pro Consultant and unlock the full NFGN compensation plan — commissions, team bonuses, and priority payouts.
        </p>
        <p className="text-sm text-gray-500 mt-3">
          Just want a free account?{" "}
          <Link href={refCode ? `/join?ref=${refCode}` : "/join"} className="text-primary hover:underline">Register as a Member instead →</Link>
        </p>
      </section>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

            {/* Step 1: Select Package */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center flex-shrink-0">1</div>
                <h2 className="text-xl font-serif font-bold">Select Your Pro Registration Package</h2>
              </div>
              {productsLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground py-6">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading packages...
                </div>
              ) : proPackages.length === 0 ? (
                <div className="border rounded-lg p-6 text-center text-muted-foreground">
                  No Pro Registration Packages available. Please contact your sponsor.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {proPackages.map((pkg: any) => {
                    const isSelected = selectedProductId === String(pkg.id);
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedProductId(String(pkg.id))}
                        className={`relative cursor-pointer rounded-xl border-2 transition-all ${
                          isSelected ? "border-primary shadow-md shadow-primary/20" : "border-border hover:border-primary/40"
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-3 right-3">
                            <CheckCircle className="h-5 w-5 text-primary fill-primary/10" />
                          </div>
                        )}
                        {resolveImageSrc(pkg.image) && (
                          <div className="aspect-video rounded-t-lg overflow-hidden">
                            <img src={resolveImageSrc(pkg.image)!} alt={pkg.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        {!resolveImageSrc(pkg.image) && (
                          <div className="aspect-video rounded-t-lg overflow-hidden bg-primary/5 flex items-center justify-center">
                            <Package className="h-12 w-12 text-primary/30" />
                          </div>
                        )}
                        <div className="p-4">
                          <div className="flex items-start gap-2 mb-1">
                            <h3 className="font-semibold leading-snug flex-1">{pkg.name}</h3>
                            <Badge variant="outline" className="text-xs border-primary text-primary flex-shrink-0">Pro</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{pkg.description}</p>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-primary">${Number(pkg.price).toFixed(2)}</span>
                            {pkg.comparePrice && <span className="text-sm text-muted-foreground line-through">${Number(pkg.comparePrice).toFixed(2)}</span>}
                            <span className="text-xs text-muted-foreground ml-auto">{pkg.cv} CV</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Step 2: Account Info */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center flex-shrink-0">2</div>
                <h2 className="text-xl font-serif font-bold">Your Account Information</h2>
              </div>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="firstName" render={({ field }) => (
                    <FormItem><FormLabel>First Name</FormLabel><FormControl><Input placeholder="Jordan" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="lastName" render={({ field }) => (
                    <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input placeholder="Rivers" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="organizationName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company or Non-Profit Organization <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <FormControl><Input placeholder="e.g. Rivers Wellness LLC" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Phone <span className="text-muted-foreground font-normal">(optional)</span></FormLabel><FormControl><Input placeholder="+1 (555) 000-0000" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="Min 8 characters" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                    <FormItem><FormLabel>Confirm Password</FormLabel><FormControl><Input type="password" placeholder="Repeat password" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>

                {/* Sponsor Code */}
                <FormField control={form.control} name="referralCode" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sponsor Referral Code <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. jrivers-GOLD1"
                        {...field}
                        onChange={(e) => { field.onChange(e); lookupSponsor(e.target.value); }}
                      />
                    </FormControl>
                    {sponsorInfo && (
                      <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Sponsored by {sponsorInfo.name} · {sponsorInfo.label}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">A sponsor referral code is required to join NFGN.</p>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* NFGN Sports Player */}
                <div className="rounded-xl border-2 border-dashed overflow-hidden" style={{ borderColor: "rgba(201,168,76,0.4)" }}>
                  <div className="flex items-center justify-between px-4 py-3" style={{ background: "rgba(201,168,76,0.06)" }}>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(201,168,76,0.15)" }}>
                        <Trophy className="h-4 w-4" style={{ color: "#C9A84C" }} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Are you an NFGN SPORTS Player?</p>
                        <p className="text-xs text-muted-foreground">Register your player profile for tournaments and eligibility verification</p>
                      </div>
                    </div>
                    <Switch
                      checked={isSportsPlayer}
                      onCheckedChange={v => { setIsSportsPlayer(v); if (!v) { setSportsDateOfBirth(""); setSportsSchool(""); setSportsGrade(""); setSportsBirthCertUrl(""); } }}
                    />
                  </div>
                  {isSportsPlayer && (
                    <div className="px-4 pb-4 pt-3 space-y-4 bg-white dark:bg-background">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">Date of Birth</label>
                          <Input
                            type="date"
                            value={sportsDateOfBirth}
                            onChange={e => setSportsDateOfBirth(e.target.value)}
                            max={new Date().toISOString().split("T")[0]}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">School or College <span className="text-muted-foreground font-normal">(if any)</span></label>
                          <Input
                            value={sportsSchool}
                            onChange={e => setSportsSchool(e.target.value)}
                            placeholder="e.g. Jefferson High School"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Grade or Year</label>
                        <select
                          value={sportsGrade}
                          onChange={e => setSportsGrade(e.target.value)}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="">— Select grade or year —</option>
                          <optgroup label="K–12">
                            {["Kindergarten","1st Grade","2nd Grade","3rd Grade","4th Grade","5th Grade","6th Grade","7th Grade","8th Grade","9th Grade (Freshman)","10th Grade (Sophomore)","11th Grade (Junior)","12th Grade (Senior)"].map(g => (
                              <option key={g} value={g}>{g}</option>
                            ))}
                          </optgroup>
                          <optgroup label="College / University">
                            {["College Freshman (Year 1)","College Sophomore (Year 2)","College Junior (Year 3)","College Senior (Year 4)","Graduate Student","Post-Graduate"].map(g => (
                              <option key={g} value={g}>{g}</option>
                            ))}
                          </optgroup>
                          <optgroup label="Other">
                            <option value="Not Currently Enrolled">Not Currently Enrolled</option>
                            <option value="Adult / Community League">Adult / Community League</option>
                          </optgroup>
                        </select>
                        <p className="text-xs text-muted-foreground">Select your current grade in school or year in college.</p>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium flex items-center gap-1.5">
                          <Upload className="h-3.5 w-3.5" style={{ color: "#C9A84C" }} />
                          Birth Certificate / Proof of Eligibility <span className="text-muted-foreground font-normal">(optional)</span>
                        </label>
                        <p className="text-xs text-muted-foreground mb-1.5">Upload a birth certificate, photo ID, or other document required for tournament eligibility. Accepted: JPG, PNG, PDF.</p>
                        <input
                          ref={sportsCertInputRef}
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploadingSportsCert(true);
                            try {
                              const formData = new FormData();
                              formData.append("file", file);
                              const res = await fetch("/api/storage/upload", { method: "POST", body: formData });
                              if (res.ok) {
                                const data = await res.json();
                                setSportsBirthCertUrl(data.objectPath ?? "");
                                toast({ title: "Document uploaded!", description: "Your eligibility document has been saved." });
                              } else {
                                toast({ variant: "destructive", title: "Upload failed", description: "Please try again." });
                              }
                            } catch {
                              toast({ variant: "destructive", title: "Upload failed", description: "Network error." });
                            } finally {
                              setUploadingSportsCert(false);
                              if (sportsCertInputRef.current) sportsCertInputRef.current.value = "";
                            }
                          }}
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => sportsCertInputRef.current?.click()}
                            disabled={uploadingSportsCert}
                            className="gap-2"
                          >
                            {uploadingSportsCert
                              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…</>
                              : <><Upload className="h-3.5 w-3.5" /> Upload Document</>}
                          </Button>
                          {sportsBirthCertUrl && (
                            <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                              <CheckCircle className="h-3.5 w-3.5" /> Document uploaded
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Book-A-Pro */}
                <div className="rounded-xl border-2 border-dashed border-primary/30 overflow-hidden">
                  <div className="px-4 pt-4 pb-1">
                    <p className="font-bold text-base" style={{ color: "#C9A84C" }}>Want To Be In Book-A-Pro?</p>
                    <p className="text-xs text-muted-foreground mt-0.5 mb-3">As a Pro Member you can list your professional services on the NFGN marketplace and start receiving bookings.</p>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 bg-primary/5">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Activate Book-A-Pro Provider Services</p>
                        <p className="text-xs text-muted-foreground">List your professional services on the NFGN marketplace</p>
                      </div>
                    </div>
                    <Switch
                      checked={isBAPProvider}
                      onCheckedChange={v => { setIsBAPProvider(v); if (!v) { setBapCategory(""); setBapSubServices([]); setBapBio(""); } }}
                    />
                  </div>
                  {isBAPProvider && (
                    <div className="px-4 pb-4 pt-3 space-y-4 bg-white dark:bg-background">
                      <div>
                        <label className="text-sm font-medium">Service Category *</label>
                        <Select value={bapCategory} onValueChange={v => { setBapCategory(v); setBapSubServices([]); }}>
                          <SelectTrigger className="mt-1"><SelectValue placeholder="Select your service category…" /></SelectTrigger>
                          <SelectContent>
                            {Object.keys(BAP_CATEGORIES).map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {bapCategory && (
                        <div>
                          <label className="text-sm font-medium">Your Services in <span className="text-primary">{bapCategory}</span></label>
                          <p className="text-xs text-muted-foreground mb-2">Check all that apply. You can add custom services too.</p>
                          <div className="grid grid-cols-2 gap-1.5 p-3 border rounded-lg bg-muted/10">
                            {bapCategoryOptions.map(svc => (
                              <label key={svc} className="flex items-center gap-2 cursor-pointer py-1 px-1 rounded hover:bg-muted/40">
                                <Checkbox checked={bapSubServices.includes(svc)} onCheckedChange={() => toggleBapService(svc)} className="h-3.5 w-3.5" />
                                <span className="text-xs">{svc}</span>
                              </label>
                            ))}
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Input placeholder="Add a custom service…" value={bapCustomService} onChange={e => setBapCustomService(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addBapCustom())} className="text-sm h-8" />
                            <Button type="button" size="sm" variant="outline" onClick={addBapCustom} className="h-8 text-xs">Add</Button>
                          </div>
                          {bapSubServices.filter(s => !bapCategoryOptions.includes(s)).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {bapSubServices.filter(s => !bapCategoryOptions.includes(s)).map(s => (
                                <Badge key={s} variant="secondary" className="text-xs cursor-pointer" onClick={() => toggleBapService(s)}>{s} ×</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium">Professional Bio (optional)</label>
                        <Textarea className="mt-1 text-sm" rows={3} placeholder="Briefly describe your experience, certifications…" value={bapBio} onChange={e => setBapBio(e.target.value)} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Step 3: Shipping Address */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center flex-shrink-0">3</div>
                <h2 className="text-xl font-serif font-bold">Shipping Address</h2>
              </div>
              <div className="grid gap-4">
                <FormField control={form.control} name="address1" render={({ field }) => (
                  <FormItem><FormLabel>Street Address</FormLabel><FormControl><Input placeholder="123 Wellness Ave" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-3 gap-4">
                  <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="Atlanta" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="state" render={({ field }) => (
                    <FormItem><FormLabel>State</FormLabel><FormControl><Input placeholder="GA" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="zip" render={({ field }) => (
                    <FormItem><FormLabel>ZIP Code</FormLabel><FormControl><Input placeholder="30301" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </div>
            </section>

            {/* Step 4: Payment */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center flex-shrink-0">4</div>
                <h2 className="text-xl font-serif font-bold">Payment Method</h2>
              </div>
              <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                <FormItem>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {PAYMENT_METHODS.map(pm => {
                      const isSelected = field.value === pm.value;
                      return (
                        <div
                          key={pm.value}
                          onClick={() => field.onChange(pm.value)}
                          className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                          }`}
                        >
                          <div className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                            <pm.icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm">{pm.label}</p>
                            <p className="text-xs text-muted-foreground">{pm.desc}</p>
                          </div>
                          {isSelected && <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )} />
            </section>

            {/* Order Summary + Submit */}
            {selectedProduct && (
              <Card className="border-primary/40 bg-primary/5">
                <CardContent className="pt-5 pb-5 space-y-3">
                  <h3 className="font-serif font-bold text-lg">Order Summary</h3>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{selectedProduct.name}</span>
                    <span className="font-bold">${Number(selectedProduct.price).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Compensation Volume</span>
                    <span>{(selectedProduct as any).cv} CV</span>
                  </div>
                  <div className="border-t pt-3 flex items-center justify-between">
                    <span className="font-semibold">You receive</span>
                    <div className="text-right">
                      <p className="font-bold text-lg text-primary">Pro Member Status</p>
                      <p className="text-xs text-muted-foreground">+ Full compensation plan access</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button type="submit" size="lg" className="w-full h-14 text-base font-bold" disabled={submitting || !selectedProductId}>
              {submitting
                ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Registering as Pro Member...</>
                : <><Star className="mr-2 h-5 w-5 fill-current" /> Complete Pro Member Registration</>
              }
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account? <Link href="/login" className="text-primary hover:underline">Sign in</Link>
            </p>
          </form>
        </Form>
      </div>
    </div>
  );
}
