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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, Star, Users, TrendingUp, Loader2, UserCircle2, Briefcase } from "lucide-react";
import { BAP_CATEGORIES } from "@/lib/bapCategories";

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

  // Book-A-Pro state
  const [isBAPProvider, setIsBAPProvider] = useState(false);
  const [bapCategory, setBapCategory] = useState("");
  const [bapSubServices, setBapSubServices] = useState<string[]>([]);
  const [bapCustomService, setBapCustomService] = useState("");
  const [bapBio, setBapBio] = useState("");

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

  const bapCategoryOptions = BAP_CATEGORIES[bapCategory] ?? [];
  const toggleBapService = (s: string) =>
    setBapSubServices(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const addBapCustom = () => {
    const s = bapCustomService.trim();
    if (s && !bapSubServices.includes(s)) setBapSubServices(prev => [...prev, s]);
    setBapCustomService("");
  };

  function onSubmit(data: RegisterFormValues) {
    const extraData: Record<string, any> = {
      isBookAProProvider: isBAPProvider,
    };
    if (isBAPProvider && bapCategory) {
      extraData.bookAProCategory = bapCategory;
      extraData.bookAProSubServices = bapSubServices;
      if (bapBio.trim()) extraData.bookAProBio = bapBio.trim();
    }
    registerMutation.mutate({ data: { ...data, ...extraData, role: "customer" } }, {
      onSuccess: (response) => {
        login(response.token);
        toast({ title: "Welcome to NFGN!", description: isBAPProvider ? "Your account and Book-A-Pro profile are ready!" : "Your account has been created." });
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
                    <FormLabel>Company or Non Profit Organization Name <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
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
                      <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Sponsored by {sponsorInfo.name} · {sponsorInfo.label}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">You must have a sponsor referral code to join NFGN.</p>
                    <FormMessage />
                  </FormItem>
                )} />
                {/* ── Book-A-Pro Provider Section ── */}
                <div className="rounded-xl border-2 border-dashed border-primary/30 overflow-hidden">
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
                      {/* Category */}
                      <div>
                        <label className="text-sm font-medium">Service Category *</label>
                        <Select value={bapCategory} onValueChange={v => { setBapCategory(v); setBapSubServices([]); }}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select your service category…" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(BAP_CATEGORIES).map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Sub-services */}
                      {bapCategory && (
                        <div>
                          <label className="text-sm font-medium">Your Services in <span className="text-primary">{bapCategory}</span></label>
                          <p className="text-xs text-muted-foreground mb-2">Check all that apply. You can add custom services too.</p>
                          <div className="grid grid-cols-2 gap-1.5 p-3 border rounded-lg bg-muted/10">
                            {bapCategoryOptions.map(svc => (
                              <label key={svc} className="flex items-center gap-2 cursor-pointer py-1 px-1 rounded hover:bg-muted/40 transition-colors">
                                <Checkbox
                                  checked={bapSubServices.includes(svc)}
                                  onCheckedChange={() => toggleBapService(svc)}
                                  className="h-3.5 w-3.5"
                                />
                                <span className="text-xs">{svc}</span>
                              </label>
                            ))}
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Input
                              placeholder="Add a custom service…"
                              value={bapCustomService}
                              onChange={e => setBapCustomService(e.target.value)}
                              onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addBapCustom())}
                              className="text-sm h-8"
                            />
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

                      {/* Bio */}
                      <div>
                        <label className="text-sm font-medium">Professional Bio (optional)</label>
                        <Textarea
                          className="mt-1 text-sm"
                          rows={3}
                          placeholder="Briefly describe your experience, certifications, and what makes you stand out…"
                          value={bapBio}
                          onChange={e => setBapBio(e.target.value)}
                        />
                      </div>

                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                        <strong>What happens next:</strong> Your Book-A-Pro profile will be created automatically. Members can discover and book your services through the NFGN marketplace. You can update your profile anytime from your back office.
                      </div>
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full h-12" disabled={registerMutation.isPending}>
                  {registerMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account...</> : "Create Free Account"}
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
