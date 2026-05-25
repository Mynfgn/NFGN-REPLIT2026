import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRegister, useListProducts } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Star, Users, TrendingUp, Loader2, UserCircle2, Church, HandHeart } from "lucide-react";

const GOLD = "#C9A84C";

const registerSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  organizationName: z.string().optional(),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  phone: z.string().optional(),
  referralCode: z.string().min(1, "A sponsor referral code is required to join NFGN"),
}).refine(d => d.password === d.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] });

type RegisterFormValues = z.infer<typeof registerSchema>;

type SponsorInfo = { name: string; label: string } | null;

export function Join() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const registerMutation = useRegister();
  const { data: productsData } = useListProducts({ isProPackage: true });

  const proPackage = productsData?.products?.find((p: any) => p.isProPackage);

  const searchParams = new URLSearchParams(window.location.search);
  const refCode = searchParams.get("ref") ?? "";

  const [sponsorInfo, setSponsorInfo] = useState<SponsorInfo>(null);
  const [sponsorLoading, setSponsorLoading] = useState(false);

  // Nonprofit toggle state
  const [isNonprofit, setIsNonprofit] = useState(false);
  const [npOrgName, setNpOrgName] = useState("");
  const [npOrgType, setNpOrgType] = useState<"church" | "nonprofit">("nonprofit");
  const [npEin, setNpEin] = useState("");
  const [npWebsite, setNpWebsite] = useState("");
  const [npDescription, setNpDescription] = useState("");
  const [npSubmitting, setNpSubmitting] = useState(false);

  async function lookupSponsor(code: string) {
    if (!code.trim()) { setSponsorInfo(null); return; }
    setSponsorLoading(true);
    try {
      const res = await fetch(`/api/auth/sponsor-lookup?ref=${encodeURIComponent(code.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setSponsorInfo(data);
      } else {
        setSponsorInfo(null);
      }
    } catch {
      setSponsorInfo(null);
    } finally {
      setSponsorLoading(false);
    }
  }

  useEffect(() => {
    if (refCode) lookupSponsor(refCode);
  }, [refCode]);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: "", lastName: "", organizationName: "", email: "", password: "", confirmPassword: "", phone: "", referralCode: refCode },
  });

  async function submitNonprofitRequest(token: string) {
    if (!npOrgName.trim()) return;
    setNpSubmitting(true);
    try {
      await fetch("/api/nonprofit-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          orgName: npOrgName.trim(),
          orgType: npOrgType,
          ein: npEin.trim() || null,
          website: npWebsite.trim() || null,
          description: npDescription.trim() || null,
        }),
      });
    } finally {
      setNpSubmitting(false);
    }
  }

  function onSubmit(data: RegisterFormValues) {
    registerMutation.mutate({ data: { ...data, role: "customer" } }, {
      onSuccess: async (response) => {
        login(response.token);

        if (isNonprofit && npOrgName.trim()) {
          await submitNonprofitRequest(response.token);
          toast({
            title: "Welcome to NFGN!",
            description: "Your account has been created and your nonprofit application has been submitted for review. We'll be in touch soon!",
          });
        } else {
          toast({ title: "Welcome to NFGN!", description: "Your account has been created." });
        }

        if (response.user.role === "customer") setLocation("/");
        else setLocation("/dashboard");
      },
      onError: (error: any) => {
        toast({ variant: "destructive", title: "Registration failed", description: error.message || "Please try again." });
      },
    });
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
            <span className="text-muted-foreground hidden sm:inline">is inviting you to join the family</span>
          </div>
        </div>
      )}
      {sponsorLoading && (
        <div className="bg-muted/40 border-b py-3 px-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Looking up your sponsor...</span>
          </div>
        </div>
      )}

      <section className="bg-foreground text-background py-20 px-4 text-center">
        <span className="text-primary text-sm font-semibold tracking-widest uppercase mb-4 block">Join The Family</span>
        <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4">Start Your Wellness Journey</h1>
        <p className="text-gray-400 max-w-xl mx-auto text-lg">
          Join thousands of wellness entrepreneurs building health and wealth with NFGN.
        </p>
        <div className="mt-6 inline-flex items-center gap-3 bg-primary/20 border border-primary/40 rounded-xl px-5 py-3 text-sm">
          <Star className="h-4 w-4 text-primary fill-primary flex-shrink-0" />
          <span className="text-gray-300">Want to join as a Pro Member right away?</span>
          <Link href={refCode ? `/join/pro?ref=${refCode}` : "/join/pro"} className="text-primary font-bold hover:underline whitespace-nowrap">
            Pro Member Registration →
          </Link>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Registration Form */}
          <div>
            <h2 className="text-2xl font-serif font-bold mb-6">Create Your Account</h2>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="firstName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl><Input placeholder="Jordan" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="lastName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl><Input placeholder="Rivers" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="organizationName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company or Organization Name <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <FormControl><Input placeholder="e.g. Rivers Wellness LLC" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (optional)</FormLabel>
                    <FormControl><Input placeholder="+1 (555) 000-0000" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl><Input type="password" placeholder="Min 8 characters" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl><Input type="password" placeholder="Repeat password" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="referralCode" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sponsor Referral Code <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. jrivers-GOLD1"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          lookupSponsor(e.target.value);
                        }}
                      />
                    </FormControl>
                    {sponsorInfo && (
                      <p className="text-xs text-primary font-medium flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Sponsored by {sponsorInfo.name} · {sponsorInfo.label}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">You must have a sponsor referral code to join NFGN.</p>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* ── Nonprofit / Church Toggle ─────────────────── */}
                <div
                  style={{
                    border: `1.5px solid ${isNonprofit ? GOLD : "rgba(201,168,76,0.25)"}`,
                    borderRadius: 12,
                    padding: "16px 18px",
                    background: isNonprofit ? "rgba(201,168,76,0.06)" : "transparent",
                    transition: "all 0.2s ease",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setIsNonprofit(!isNonprofit)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                      background: "none", border: "none", cursor: "pointer", padding: 0,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 8,
                        background: isNonprofit ? GOLD : "rgba(201,168,76,0.12)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "background 0.2s",
                      }}>
                        {npOrgType === "church"
                          ? <Church size={18} color={isNonprofit ? "#000" : GOLD} />
                          : <HandHeart size={18} color={isNonprofit ? "#000" : GOLD} />}
                      </div>
                      <div style={{ textAlign: "left" }}>
                        <p style={{ color: "#fff", fontSize: 14, fontWeight: 700, margin: 0 }}>
                          I represent a church or non-profit
                        </p>
                        <p style={{ color: "#888", fontSize: 12, margin: 0 }}>
                          Request to be listed on the Gifts & Donations page
                        </p>
                      </div>
                    </div>
                    {/* Toggle pill */}
                    <div style={{
                      width: 44, height: 24, borderRadius: 99, flexShrink: 0,
                      background: isNonprofit ? GOLD : "rgba(255,255,255,0.12)",
                      position: "relative", transition: "background 0.2s",
                    }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: "50%", background: "#fff",
                        position: "absolute", top: 3,
                        left: isNonprofit ? 23 : 3,
                        transition: "left 0.2s",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
                      }} />
                    </div>
                  </button>

                  {/* Expanded nonprofit fields */}
                  {isNonprofit && (
                    <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 14 }}>
                      <div>
                        <label style={{ color: "#888", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
                          Organization Type <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <div style={{ display: "flex", gap: 8 }}>
                          {(["nonprofit", "church"] as const).map(type => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setNpOrgType(type)}
                              style={{
                                flex: 1, padding: "10px 0", borderRadius: 8, fontSize: 13, fontWeight: 700,
                                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                background: npOrgType === type ? GOLD : "rgba(255,255,255,0.05)",
                                color: npOrgType === type ? "#000" : "#aaa",
                                border: `1.5px solid ${npOrgType === type ? GOLD : "rgba(255,255,255,0.12)"}`,
                                transition: "all 0.18s",
                              }}
                            >
                              {type === "church" ? <Church size={14} /> : <HandHeart size={14} />}
                              {type === "church" ? "Church" : "Non-Profit"}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label style={{ color: "#888", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
                          Organization Name <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                          type="text"
                          value={npOrgName}
                          onChange={e => setNpOrgName(e.target.value)}
                          placeholder="e.g. New Life Community Church"
                          required={isNonprofit}
                          style={{ width: "100%", padding: "10px 12px", background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                        />
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div>
                          <label style={{ color: "#888", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
                            EIN / Tax ID <span style={{ color: "#555", fontWeight: 400, textTransform: "none" }}>(optional)</span>
                          </label>
                          <input
                            type="text"
                            value={npEin}
                            onChange={e => setNpEin(e.target.value)}
                            placeholder="12-3456789"
                            style={{ width: "100%", padding: "10px 12px", background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                          />
                        </div>
                        <div>
                          <label style={{ color: "#888", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
                            Website <span style={{ color: "#555", fontWeight: 400, textTransform: "none" }}>(optional)</span>
                          </label>
                          <input
                            type="url"
                            value={npWebsite}
                            onChange={e => setNpWebsite(e.target.value)}
                            placeholder="https://yourorg.org"
                            style={{ width: "100%", padding: "10px 12px", background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ color: "#888", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>
                          Brief Description <span style={{ color: "#555", fontWeight: 400, textTransform: "none" }}>(optional)</span>
                        </label>
                        <textarea
                          value={npDescription}
                          onChange={e => setNpDescription(e.target.value)}
                          placeholder="Tell us about your organization and the community you serve..."
                          rows={3}
                          style={{ width: "100%", padding: "10px 12px", background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#fff", fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box" }}
                        />
                      </div>

                      <div style={{ padding: "12px 14px", background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.22)", borderRadius: 8 }}>
                        <p style={{ color: GOLD, fontSize: 12, fontWeight: 700, margin: "0 0 4px" }}>📋 What happens next?</p>
                        <p style={{ color: "#888", fontSize: 12, margin: 0, lineHeight: 1.6 }}>
                          After registration, your application will be reviewed by the NFGN team. Once approved, your organization will be listed on the <strong style={{ color: "#ccc" }}>Gifts & Donations</strong> page and a QR code will be generated for member donations. <strong style={{ color: "#ccc" }}>No Pro Membership is required</strong> — this listing is completely free.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12"
                  disabled={registerMutation.isPending || npSubmitting || (isNonprofit && !npOrgName.trim())}
                >
                  {(registerMutation.isPending || npSubmitting)
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account...</>
                    : isNonprofit ? "Create Account & Submit Application" : "Create Free Account"
                  }
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account? <Link href="/login" className="text-primary hover:underline">Sign in</Link>
                </p>
              </form>
            </Form>
          </div>

          {/* Benefits */}
          <div className="space-y-6">
            {proPackage && (
              <Card className="border-primary/50 bg-primary/5">
                <CardHeader>
                  <Badge className="w-fit mb-2">Become a Pro Member</Badge>
                  <CardTitle className="font-serif text-xl">{proPackage.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm mb-4">{proPackage.description.substring(0, 200)}...</p>
                  <div className="text-3xl font-bold mb-4">${proPackage.price}<span className="text-sm text-muted-foreground line-through ml-2">${proPackage.comparePrice}</span></div>
                  <Link href="/shop">
                    <Button variant="outline" className="w-full">View Pro Package</Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Nonprofit listing callout */}
            <div style={{ borderRadius: 12, border: `1.5px solid rgba(201,168,76,0.3)`, background: "rgba(201,168,76,0.05)", padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <HandHeart className="h-5 w-5 text-primary flex-shrink-0" />
                <h4 className="font-bold text-sm">Church or Non-Profit?</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Register your organization for <strong className="text-foreground">free</strong> and get listed on our Gifts & Donations page. Members of the NFGN network can donate directly to your cause. No Pro Membership required.
              </p>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {[
                  "Free listing — no fees, no Pro upgrade needed",
                  "80% of every gift goes directly to your cause",
                  "Unique QR code for easy donation sharing",
                  "Corporate approval required (usually within 48 hrs)",
                ].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* UPM Policy notice */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm space-y-1.5">
              <p className="font-semibold text-amber-800 flex items-center gap-1.5">
                <span className="text-base">⚡</span> Pro Member Activation Requirement (UPM Policy)
              </p>
              <p className="text-amber-900 leading-relaxed text-xs">
                New Pro Members must accumulate a minimum of <strong>150 CV</strong> in product purchases to become
                a <strong>Qualified Pro Member</strong>. Pro Members below this threshold are classified as{" "}
                <strong>Unqualified Pro Members (UPM)</strong> and do not count toward your sponsor's CLB (Core Leadership
                Bonus) or MCB (Money Circulation Bonus) until they reach 150 CV.
                UPMs can top up their CV at any time by purchasing additional products.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-serif font-bold text-lg">Why Join NFGN?</h3>
              {[
                { icon: Star, title: "Premium Wellness Products", desc: "Access curated naturopathic formulas, soaps, candles, and educational resources." },
                { icon: TrendingUp, title: "3-Type Commission Plan", desc: "Earn Referral, Sales, and Level Commissions. Pro Members earn up to 22% via the multi-level power structure." },
                { icon: Users, title: "Thriving Community", desc: "Join a network of health-conscious entrepreneurs supporting each other's growth." },
                { icon: CheckCircle, title: "Your Own Store", desc: "Get a personalized replicated website to share with family and friends." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-4">
                  <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{title}</h4>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
