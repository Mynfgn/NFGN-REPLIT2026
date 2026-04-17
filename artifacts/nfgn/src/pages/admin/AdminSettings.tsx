import { useState, useEffect } from "react";
import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Globe,
  CreditCard,
  Truck,
  Package,
  DollarSign,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Phone,
  Mail,
  Megaphone,
  Save,
  Shield,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

/* ── Section wrapper ────────────────────────────────────────────── */
function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-card border rounded-xl p-6 space-y-5">
      <h2 className="text-base font-bold flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </h2>
      {children}
    </div>
  );
}

/* ── Field row ──────────────────────────────────────────────────── */
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-sm font-medium">{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

/* ── Payment method toggle ──────────────────────────────────────── */
const ALL_PAYMENT_METHODS = [
  { id: "authorize_net", label: "Credit / Debit Card", sub: "Authorize.net" },
  { id: "cash_app", label: "Cash App", sub: "$CashTag payments" },
  { id: "paypal", label: "PayPal", sub: "Friends & Family" },
  { id: "cod", label: "Cash on Delivery", sub: "By approval only" },
];

/* ── Commission level display ───────────────────────────────────── */
const DEFAULT_LEVELS = [
  { level: 1, rate: 10 }, { level: 2, rate: 20 }, { level: 3, rate: 5 },
  { level: 4, rate: 5 }, { level: 5, rate: 5 }, { level: 6, rate: 5 },
  { level: 7, rate: 5 }, { level: 8, rate: 5 }, { level: 9, rate: 5 },
];

/* ═══════════════════════════════════════════════════════════════ */
export default function AdminSettingsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [justSaved, setJustSaved] = useState(false);

  const { data: settings, isLoading } = useGetSettings();
  const updateSettings = useUpdateSettings({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["getSettings"] });
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 3000);
        toast({ title: "Settings saved", description: "Platform settings have been updated." });
      },
      onError: (err: any) =>
        toast({ title: "Save failed", description: err?.message ?? "Could not save settings.", variant: "destructive" }),
    },
  });

  /* local form state */
  const [form, setForm] = useState({
    companyName: "",
    contactEmail: "",
    contactPhone: "",
    companyLogo: "",
    homePageBanner: "",
    homePageBannerSubtitle: "",
    taxRate: "",
    shippingRate: "",
    freeShippingThreshold: "",
    cashAppHandle: "",
    paypalEmail: "",
    registrationPackagePrice: "",
    demoMode: false,
    paymentMethods: ["authorize_net", "cash_app", "paypal", "cod"] as string[],
  });

  /* Hydrate form when settings load */
  useEffect(() => {
    if (!settings) return;
    setForm({
      companyName: settings.companyName ?? "",
      contactEmail: settings.contactEmail ?? "",
      contactPhone: settings.contactPhone ?? "",
      companyLogo: settings.companyLogo ?? "",
      homePageBanner: settings.homePageBanner ?? "",
      homePageBannerSubtitle: settings.homePageBannerSubtitle ?? "",
      taxRate: String(settings.taxRate ?? "8.5"),
      shippingRate: String(settings.shippingRate ?? "9.99"),
      freeShippingThreshold: String(settings.freeShippingThreshold ?? "75"),
      cashAppHandle: settings.cashAppHandle ?? "",
      paypalEmail: settings.paypalEmail ?? "",
      registrationPackagePrice: String(settings.registrationPackagePrice ?? "149.99"),
      demoMode: settings.demoMode ?? false,
      paymentMethods: (settings.paymentMethods as string[]) ?? ["authorize_net", "cash_app", "paypal", "cod"],
    });
  }, [settings]);

  function set(field: keyof typeof form, value: string | boolean | string[]) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function togglePaymentMethod(id: string) {
    setForm(f => ({
      ...f,
      paymentMethods: f.paymentMethods.includes(id)
        ? f.paymentMethods.filter(m => m !== id)
        : [...f.paymentMethods, id],
    }));
  }

  function handleSave() {
    updateSettings.mutate({
      data: {
        companyName: form.companyName,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone || undefined,
        companyLogo: form.companyLogo || undefined,
        homePageBanner: form.homePageBanner || undefined,
        homePageBannerSubtitle: form.homePageBannerSubtitle || undefined,
        taxRate: parseFloat(form.taxRate) || 8.5,
        shippingRate: parseFloat(form.shippingRate) || 9.99,
        freeShippingThreshold: parseFloat(form.freeShippingThreshold) || 75,
        cashAppHandle: form.cashAppHandle || undefined,
        paypalEmail: form.paypalEmail || undefined,
        registrationPackagePrice: parseFloat(form.registrationPackagePrice) || 149.99,
        demoMode: form.demoMode,
        paymentMethods: form.paymentMethods,
      } as any,
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            System Settings
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure platform-wide settings for the NFGN store and member portal.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={updateSettings.isPending}
          className={`gap-2 flex-shrink-0 transition-all ${justSaved ? "bg-green-600 hover:bg-green-700" : ""}`}
        >
          {updateSettings.isPending
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : justSaved
            ? <CheckCircle2 className="h-4 w-4" />
            : <Save className="h-4 w-4" />
          }
          {justSaved ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      {/* Save success banner */}
      {justSaved && (
        <div role="status" className="bg-green-50 border border-green-300 rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-green-900">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600" />
          <span><strong>Settings saved successfully!</strong> All changes have been applied to the platform.</span>
        </div>
      )}

      {/* Demo mode banner */}
      {form.demoMode && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-amber-900">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span><strong>Demo Mode is ON</strong> — payments are simulated. No real transactions will be charged.</span>
        </div>
      )}

      {/* ── 1. Platform Information ── */}
      <Section title="Platform Information" icon={Globe}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Company Name" hint="Displayed across the storefront and member portal.">
            <Input value={form.companyName} onChange={e => set("companyName", e.target.value)} placeholder="New Face Global Network" className="mt-1" />
          </Field>
          <Field label="Logo URL" hint="Direct URL to your company logo image.">
            <Input value={form.companyLogo} onChange={e => set("companyLogo", e.target.value)} placeholder="https://..." className="mt-1" />
          </Field>
          <Field label="Contact Email" hint="Support email shown to customers.">
            <div className="flex items-center gap-2 mt-1">
              <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Input value={form.contactEmail} onChange={e => set("contactEmail", e.target.value)} placeholder="newfaceglobalnetwork@gmail.com" type="email" />
            </div>
          </Field>
          <Field label="Contact Phone" hint="Support phone shown to customers.">
            <div className="flex items-center gap-2 mt-1">
              <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Input value={form.contactPhone} onChange={e => set("contactPhone", e.target.value)} placeholder="(678) 909-9974" />
            </div>
          </Field>
        </div>
      </Section>

      {/* ── 2. Homepage Banner ── */}
      <Section title="Homepage Banner" icon={Megaphone}>
        <Field label="Banner Headline" hint="Large headline text shown at the top of the homepage.">
          <Input value={form.homePageBanner} onChange={e => set("homePageBanner", e.target.value)} placeholder="Elevate Your Wellness Journey" className="mt-1" />
        </Field>
        <Field label="Banner Subtitle" hint="Smaller text shown below the headline.">
          <Input value={form.homePageBannerSubtitle} onChange={e => set("homePageBannerSubtitle", e.target.value)} placeholder="Premium naturopathic products and a thriving community." className="mt-1" />
        </Field>
      </Section>

      {/* ── 3. Payment Methods ── */}
      <Section title="Payment Methods" icon={CreditCard}>
        <p className="text-sm text-muted-foreground -mt-2">
          Enable or disable payment options that customers see during checkout.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ALL_PAYMENT_METHODS.map(pm => {
            const active = form.paymentMethods.includes(pm.id);
            return (
              <button
                key={pm.id}
                onClick={() => togglePaymentMethod(pm.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 text-left transition-all ${
                  active ? "border-primary bg-primary/5" : "border-border bg-card hover:border-muted-foreground/40"
                }`}
              >
                {active
                  ? <ToggleRight className="h-5 w-5 text-primary flex-shrink-0" />
                  : <ToggleLeft className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                }
                <div>
                  <p className="font-semibold text-sm">{pm.label}</p>
                  <p className="text-xs text-muted-foreground">{pm.sub}</p>
                </div>
                <Badge variant={active ? "default" : "outline"} className="ml-auto text-xs">
                  {active ? "On" : "Off"}
                </Badge>
              </button>
            );
          })}
        </div>

        {/* Payment accounts */}
        <div className="border-t pt-4 space-y-4">
          <p className="text-sm font-medium">Payment Account Details</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Cash App $Cashtag" hint="Customers send payments to this $cashtag.">
              <Input
                value={form.cashAppHandle}
                onChange={e => set("cashAppHandle", e.target.value)}
                placeholder="$NewFaceGlobalNetwork"
                className="mt-1 font-mono"
              />
            </Field>
            <Field label="PayPal Email" hint="Customers send Friends & Family payments here.">
              <Input
                value={form.paypalEmail}
                onChange={e => set("paypalEmail", e.target.value)}
                placeholder="newfaceglobalnetwork@gmail.com"
                className="mt-1"
                type="email"
              />
            </Field>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 space-y-1">
            <p className="font-bold flex items-center gap-1"><Shield className="h-3 w-3" /> Authorize.net (Credit/Debit Card)</p>
            <p>Card payments are processed via your Authorize.net merchant account. To connect or update your Authorize.net API credentials, contact your system administrator or update the environment variables <code className="bg-blue-100 px-1 rounded">AUTHNET_LOGIN_ID</code> and <code className="bg-blue-100 px-1 rounded">AUTHNET_TRANSACTION_KEY</code> in your server environment.</p>
            <a href="https://account.authorize.net" target="_blank" rel="noopener noreferrer" className="underline text-blue-700 font-medium">Open Authorize.net Merchant Center →</a>
          </div>
        </div>
      </Section>

      {/* ── 4. Order & Pricing ── */}
      <Section title="Order & Pricing" icon={Truck}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Tax Rate (%)" hint="Applied to all taxable orders.">
            <div className="flex items-center gap-1 mt-1">
              <Input
                value={form.taxRate}
                onChange={e => set("taxRate", e.target.value)}
                placeholder="8.5"
                type="number"
                step="0.1"
                min="0"
                max="30"
                className="text-right font-mono"
              />
              <span className="text-muted-foreground text-sm">%</span>
            </div>
          </Field>
          <Field label="Standard Shipping ($)" hint="Flat rate applied when below threshold.">
            <div className="flex items-center gap-1 mt-1">
              <span className="text-muted-foreground text-sm">$</span>
              <Input
                value={form.shippingRate}
                onChange={e => set("shippingRate", e.target.value)}
                placeholder="9.99"
                type="number"
                step="0.01"
                min="0"
                className="font-mono"
              />
            </div>
          </Field>
          <Field label="Free Shipping Over ($)" hint="Orders above this amount ship free.">
            <div className="flex items-center gap-1 mt-1">
              <span className="text-muted-foreground text-sm">$</span>
              <Input
                value={form.freeShippingThreshold}
                onChange={e => set("freeShippingThreshold", e.target.value)}
                placeholder="75.00"
                type="number"
                step="1"
                min="0"
                className="font-mono"
              />
            </div>
          </Field>
        </div>
        {/* Preview */}
        <div className="bg-muted/40 rounded-lg p-3 text-xs space-y-1">
          <p className="font-medium text-sm">Current Pricing Preview</p>
          <p className="text-muted-foreground">Tax: <strong>{form.taxRate || "8.5"}%</strong> · Standard Shipping: <strong>${form.shippingRate || "9.99"}</strong> · Free over: <strong>${form.freeShippingThreshold || "75"}</strong></p>
        </div>
      </Section>

      {/* ── 5. Membership & Registration ── */}
      <Section title="Membership & Registration" icon={Package}>
        <Field
          label="Pro Member Registration Package Price ($)"
          hint="Price of the Pro Member registration package shown in The Apothecary."
        >
          <div className="flex items-center gap-1 mt-1">
            <span className="text-muted-foreground text-sm">$</span>
            <Input
              value={form.registrationPackagePrice}
              onChange={e => set("registrationPackagePrice", e.target.value)}
              placeholder="149.99"
              type="number"
              step="0.01"
              min="0"
              className="font-mono max-w-[200px]"
            />
          </div>
        </Field>
      </Section>

      {/* ── 6. Commission Structure (read-only overview) ── */}
      <Section title="Uni-Level Commission Structure" icon={DollarSign}>
        <p className="text-sm text-muted-foreground -mt-2">
          Current commission rates paid out across 9 levels of the genealogy tree. Contact your developer to update these rates via the commission rules database table.
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {DEFAULT_LEVELS.map(l => (
            <div key={l.level} className={`rounded-lg border p-3 text-center ${l.level <= 2 ? "border-primary/40 bg-primary/5" : "border-border bg-muted/30"}`}>
              <p className="text-xs text-muted-foreground">Level {l.level}</p>
              <p className={`text-lg font-bold ${l.level <= 2 ? "text-primary" : "text-foreground"}`}>{l.rate}%</p>
            </div>
          ))}
        </div>
        <div className="bg-muted/40 rounded-lg p-3 text-xs space-y-1">
          <p className="font-medium">Power Squad Bonus</p>
          <p className="text-muted-foreground">Members earn a <strong>$200 bonus</strong> for every <strong>9 personally sponsored Level 2 Pro Package sales</strong>. Requires 9 personally sponsored Level 1 Pro Members to qualify.</p>
        </div>
      </Section>

      {/* ── 7. System Mode ── */}
      <Section title="System Mode" icon={Shield}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-medium text-sm">Demo / Test Mode</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              When enabled, all payment transactions are simulated — no real charges occur. Use this for testing and demonstrations only. Turn off before going live.
            </p>
          </div>
          <button
            onClick={() => set("demoMode", !form.demoMode)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all ${
              form.demoMode
                ? "border-amber-400 bg-amber-50 text-amber-700"
                : "border-green-400 bg-green-50 text-green-700"
            }`}
          >
            {form.demoMode
              ? <><AlertTriangle className="h-4 w-4" /> Demo Mode ON</>
              : <><CheckCircle2 className="h-4 w-4" /> Live Mode</>
            }
          </button>
        </div>
      </Section>

      {/* Save button (bottom) */}
      <div className="flex justify-end pb-6">
        <Button
          onClick={handleSave}
          disabled={updateSettings.isPending}
          size="lg"
          className={`gap-2 transition-all ${justSaved ? "bg-green-600 hover:bg-green-700" : ""}`}
        >
          {updateSettings.isPending
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : justSaved
            ? <CheckCircle2 className="h-4 w-4" />
            : <Save className="h-4 w-4" />
          }
          {justSaved ? "All Settings Saved!" : "Save All Settings"}
        </Button>
      </div>
    </div>
  );
}
