import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useGetMe, useListProducts } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { resolveImageSrc } from "@/lib/image";
import { BAP_CATEGORIES } from "@/lib/bapCategories";
import {
  Star, Loader2, UserPlus, CheckCircle, Package,
  Truck, Smartphone, DollarSign, CreditCard,
  AlertTriangle, RotateCcw, UserCheck, Lock,
} from "lucide-react";

const schema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  organizationName: z.string().optional(),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  phone: z.string().optional(),
  referralCode: z.string().min(1, "Sponsor referral code is required"),
  address1: z.string().min(3, "Street address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zip: z.string().min(4, "ZIP code is required"),
  paymentMethod: z.enum(["cod", "cashapp", "paypal", "special"], { required_error: "Select a payment method" }),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof schema>;

const PAYMENT_METHODS = [
  { value: "cod",     label: "Cash on Delivery (COD)",  icon: Truck,       desc: "Pay when their package arrives" },
  { value: "cashapp", label: "CashApp",                  icon: Smartphone,  desc: "Send payment via CashApp" },
  { value: "paypal",  label: "PayPal",                   icon: DollarSign,  desc: "Send payment via PayPal" },
  { value: "special", label: "Special Arrangement",      icon: CreditCard,  desc: "Contact admin to arrange payment" },
];

type SuccessData = { firstName: string; lastName: string; email: string; orderNumber: string };

export function RegisterNewProMemberPage() {
  const { data: me } = useGetMe();
  const { data: productsData, isLoading: productsLoading } = useListProducts({ isProPackage: true });
  const { toast } = useToast();

  const proPackages = productsData?.products?.filter((p: any) => p.isProPackage) ?? [];
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<SuccessData | null>(null);

  const [isBAPProvider, setIsBAPProvider] = useState(false);
  const [bapCategory, setBapCategory] = useState("");
  const [bapSubServices, setBapSubServices] = useState<string[]>([]);
  const [bapCustomService, setBapCustomService] = useState("");
  const [bapBio, setBapBio] = useState("");

  const bapCategoryOptions = BAP_CATEGORIES[bapCategory] ?? [];
  const toggleBapService = (s: string) =>
    setBapSubServices(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const addBapCustom = () => {
    const s = bapCustomService.trim();
    if (s && !bapSubServices.includes(s)) setBapSubServices(prev => [...prev, s]);
    setBapCustomService("");
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "", lastName: "", organizationName: "", email: "",
      password: "", confirmPassword: "", phone: "",
      referralCode: me?.referralCode ?? "",
      address1: "", city: "", state: "", zip: "",
      paymentMethod: "cod",
    },
  });

  useEffect(() => {
    if (me?.referralCode) {
      form.setValue("referralCode", me.referralCode);
    }
  }, [me?.referralCode]);

  useEffect(() => {
    if (proPackages.length > 0 && !selectedProductId) {
      setSelectedProductId(String(proPackages[0].id));
    }
  }, [proPackages.length]);

  const selectedProduct = proPackages.find((p: any) => String(p.id) === selectedProductId);

  function resetForm() {
    form.reset({
      firstName: "", lastName: "", organizationName: "", email: "",
      password: "", confirmPassword: "", phone: "",
      referralCode: me?.referralCode ?? "",
      address1: "", city: "", state: "", zip: "",
      paymentMethod: "cod",
    });
    if (proPackages.length > 0) setSelectedProductId(String(proPackages[0].id));
    setIsBAPProvider(false);
    setBapCategory("");
    setBapSubServices([]);
    setBapBio("");
    setSuccess(null);
  }

  async function onSubmit(data: FormValues) {
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
      setSuccess({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        orderNumber: result.orderNumber,
      });
    } catch {
      toast({ variant: "destructive", title: "Network error", description: "Please check your connection and try again." });
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-2xl">
        <div className="rounded-2xl border-2 overflow-hidden" style={{ borderColor: "#C9A84C" }}>
          <div className="p-8 text-center space-y-5" style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #1a0f00 100%)" }}>
            <div
              className="h-20 w-20 rounded-full mx-auto flex items-center justify-center"
              style={{ border: "2px solid #C9A84C", background: "#C9A84C22" }}
            >
              <UserCheck className="h-10 w-10" style={{ color: "#C9A84C" }} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#C9A84C" }}>Registration Complete</p>
              <h2 className="text-3xl font-serif font-bold text-white mb-2">
                {success.firstName} {success.lastName} is registered!
              </h2>
              <p className="text-white/60 text-sm">
                Their Pro Member account has been created and their order is now pending admin approval.
              </p>
            </div>
            <div className="rounded-xl border p-4 text-left space-y-2" style={{ borderColor: "#C9A84C44", background: "#C9A84C11" }}>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: "#C9A84C99" }}>Name</span>
                <span className="font-semibold text-white">{success.firstName} {success.lastName}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: "#C9A84C99" }}>Email</span>
                <span className="font-semibold text-white">{success.email}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: "#C9A84C99" }}>Order #</span>
                <span className="font-semibold text-white">{success.orderNumber}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: "#C9A84C99" }}>Sponsor</span>
                <span className="font-semibold text-white">{me?.firstName} {me?.lastName}</span>
              </div>
            </div>
            <div className="rounded-lg border p-3 text-sm text-left" style={{ borderColor: "#C9A84C44", background: "#C9A84C0D" }}>
              <p className="text-white/80 leading-relaxed">
                <strong style={{ color: "#C9A84C" }}>Next step:</strong> {success.firstName} should log in at{" "}
                <span className="font-mono text-white">{window.location.origin}/login</span> using the email and password they just set up.
                Their order is pending — commissions will activate once admin approves it.
              </p>
            </div>
          </div>
          <div className="h-0.5" style={{ background: `linear-gradient(to right, transparent, #C9A84C, transparent)` }} />
          <div className="p-5 bg-background flex gap-3">
            <Button onClick={resetForm} className="flex-1 gap-2" style={{ background: "#C9A84C", color: "#0a0a0a" }}>
              <RotateCcw className="h-4 w-4" />
              Register Another Person
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-serif font-bold flex items-center gap-3">
          <UserPlus className="h-7 w-7 text-primary" />
          Register A New Pro Member
        </h1>
        <p className="text-muted-foreground mt-1">
          Use this form to register someone in your presence as a new Pro Member. Your sponsor referral code is pre-filled.
        </p>
      </div>

      {/* Duplicate Account Warning */}
      <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-bold text-amber-800 mb-1">Important — No Duplicate or Multiple Accounts</p>
            <p className="text-sm text-amber-700 leading-relaxed">
              Each person may only have <strong>one account</strong> on the NFGN platform. Before registering, confirm that
              the person in front of you does NOT already have an existing NFGN account with any email address.
              Creating duplicate accounts is a violation of NFGN policy and may result in account suspension.
            </p>
          </div>
        </div>
      </div>

      {/* Sponsor Badge */}
      {me?.referralCode && (
        <div className="flex items-center gap-3 rounded-xl border px-5 py-3 bg-primary/5 border-primary/30">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Star className="h-4 w-4 text-primary fill-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Registering under sponsor</p>
            <p className="font-bold text-sm">{me.firstName} {me.lastName} <span className="font-mono text-primary ml-1">({me.referralCode})</span></p>
          </div>
          <Lock className="h-4 w-4 text-muted-foreground ml-auto" />
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

          {/* Step 1: Package */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center flex-shrink-0">1</div>
              <h2 className="text-xl font-serif font-bold">Select Pro Registration Package</h2>
            </div>
            {productsLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground py-6">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading packages…
              </div>
            ) : proPackages.length === 0 ? (
              <div className="border rounded-lg p-6 text-center text-muted-foreground">
                No Pro Registration Packages available. Please contact admin.
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
                      {resolveImageSrc(pkg.image) ? (
                        <div className="aspect-video rounded-t-lg overflow-hidden">
                          <img src={resolveImageSrc(pkg.image)!} alt={pkg.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
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
              <h2 className="text-xl font-serif font-bold">New Member's Account Information</h2>
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
                  <FormLabel>Company / Non-Profit <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                  <FormControl><Input placeholder="e.g. Rivers Wellness LLC" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" placeholder="they@example.com" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="Min. 8 characters" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                  <FormItem><FormLabel>Confirm Password</FormLabel><FormControl><Input type="password" placeholder="Repeat password" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Phone <span className="text-muted-foreground font-normal">(optional)</span></FormLabel><FormControl><Input type="tel" placeholder="(555) 000-0000" {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              {/* Sponsor code — locked to logged-in member's code */}
              <FormField control={form.control} name="referralCode" render={({ field }) => (
                <FormItem>
                  <FormLabel>Sponsor Referral Code</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        className="pr-10 bg-primary/5 border-primary/30 font-mono font-bold"
                        readOnly={!!me?.referralCode}
                      />
                      {me?.referralCode && (
                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/50" />
                      )}
                    </div>
                  </FormControl>
                  <p className="text-xs text-muted-foreground">Auto-filled with your referral code. This links the new member to your team.</p>
                  <FormMessage />
                </FormItem>
              )} />
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
                <FormItem><FormLabel>Street Address</FormLabel><FormControl><Input placeholder="123 Main Street" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="Atlanta" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="state" render={({ field }) => (
                  <FormItem><FormLabel>State</FormLabel><FormControl><Input placeholder="GA" maxLength={2} className="uppercase" {...field} /></FormControl><FormMessage /></FormItem>
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
                <FormControl>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {PAYMENT_METHODS.map(pm => {
                      const Icon = pm.icon;
                      const isSelected = field.value === pm.value;
                      return (
                        <button
                          key={pm.value}
                          type="button"
                          onClick={() => field.onChange(pm.value)}
                          className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                            isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/40"
                          }`}
                        >
                          <div className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 ${isSelected ? "bg-primary" : "bg-muted"}`}>
                            <Icon className={`h-4 w-4 ${isSelected ? "text-primary-foreground" : "text-muted-foreground"}`} />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{pm.label}</p>
                            <p className="text-xs text-muted-foreground">{pm.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </section>

          {/* Step 5: Book A Pro (optional) */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center flex-shrink-0">5</div>
              <h2 className="text-xl font-serif font-bold">Book A Pro Provider <span className="text-base font-normal text-muted-foreground">(optional)</span></h2>
            </div>
            <Card className="border-primary/20">
              <CardContent className="pt-5 pb-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">Register as a Book A Pro service provider?</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      If this member offers professional services (wellness, coaching, consulting, etc.), enable this to list them in our directory.
                    </p>
                  </div>
                  <Switch checked={isBAPProvider} onCheckedChange={setIsBAPProvider} />
                </div>

                {isBAPProvider && (
                  <div className="space-y-4 pt-2 border-t">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Service Category</label>
                      <Select value={bapCategory} onValueChange={v => { setBapCategory(v); setBapSubServices([]); }}>
                        <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                        <SelectContent>
                          {Object.keys(BAP_CATEGORIES).map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {bapCategory && bapCategoryOptions.length > 0 && (
                      <div>
                        <label className="text-sm font-medium mb-2 block">Services Offered</label>
                        <div className="grid grid-cols-2 gap-2">
                          {bapCategoryOptions.map((s: string) => (
                            <label key={s} className="flex items-center gap-2 cursor-pointer text-sm">
                              <Checkbox
                                checked={bapSubServices.includes(s)}
                                onCheckedChange={() => toggleBapService(s)}
                              />
                              {s}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Add Custom Service</label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="e.g. IV Therapy, Reiki..."
                          value={bapCustomService}
                          onChange={e => setBapCustomService(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addBapCustom(); } }}
                        />
                        <Button type="button" variant="outline" onClick={addBapCustom}>Add</Button>
                      </div>
                      {bapSubServices.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {bapSubServices.map(s => (
                            <Badge key={s} variant="secondary" className="gap-1 cursor-pointer" onClick={() => toggleBapService(s)}>
                              {s} ✕
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Professional Bio <span className="text-muted-foreground font-normal">(optional)</span></label>
                      <Textarea
                        placeholder="Brief description of their services, experience, and expertise..."
                        rows={3}
                        value={bapBio}
                        onChange={e => setBapBio(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Order Summary + Submit */}
          {selectedProduct && (
            <div className="rounded-xl border-2 border-primary bg-primary/5 p-5 space-y-4">
              <h3 className="font-serif font-bold text-lg">Order Summary</h3>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{selectedProduct.name}</span>
                <span className="font-bold text-primary text-lg">${Number(selectedProduct.price).toFixed(2)}</span>
              </div>
              <div className="text-xs text-muted-foreground border-t pt-3">
                This order will be placed on behalf of the new member. Once admin approves, their Pro Member status will be activated and commissions will process.
              </div>
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            disabled={submitting || !selectedProductId}
            className="w-full gap-2 text-base h-13 font-bold"
            style={{ background: "#C9A84C", color: "#0a0a0a" }}
          >
            {submitting ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Registering…</>
            ) : (
              <><UserPlus className="h-5 w-5" /> Complete Pro Member Registration</>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
