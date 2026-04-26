import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react";
import { customFetch } from "@/lib/custom-fetch";
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
  Smartphone,
  Upload,
  RotateCcw,
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

/* ── Commission rules types ─────────────────────────────────────── */
interface LevelRate { level: number; rate: number }
interface LiveCommissionRules {
  referralRate: number;
  prcLevels: LevelRate[];      // PRC levels (API returns as prcLevels)
  salesLevels: LevelRate[];    // Sales commission levels
  powerBonusAmount: number;
  powerBonusTrigger: number;
  powerBonusEnabled: boolean;
}

/* ═══════════════════════════════════════════════════════════════ */
export default function AdminSettingsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [justSaved, setJustSaved] = useState(false);
  const [commissionRules, setCommissionRules] = useState<LiveCommissionRules | null>(null);

  const [iconUploading, setIconUploading] = useState(false);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: settings, isLoading } = useGetSettings();

  useEffect(() => {
    customFetch("/api/commission-rules")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setCommissionRules(data); })
      .catch(() => {});
  }, []);
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
    if ((settings as any).appIconUrl) {
      setIconPreview((settings as any).appIconUrl);
    }
  }, [settings]);

  async function handleIconUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select a PNG or JPG image.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please choose an image under 5 MB.", variant: "destructive" });
      return;
    }

    setIconUploading(true);
    try {
      const urlRes = await customFetch("/api/storage/uploads/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });
      if (!urlRes.ok) throw new Error("Could not get upload URL");
      const { uploadURL, objectPath } = await urlRes.json();

      const uploadRes = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!uploadRes.ok) throw new Error("Upload failed");

      const servingUrl = `/api/storage/objects${objectPath.replace(/^\/objects/, "")}`;

      const saveRes = await customFetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appIconUrl: servingUrl }),
      });
      if (!saveRes.ok) throw new Error("Could not save icon setting");

      setIconPreview(servingUrl);
      qc.invalidateQueries({ queryKey: ["getSettings"] });
      toast({ title: "App icon updated!", description: "The new icon will appear on all new installs." });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err?.message ?? "Please try again.", variant: "destructive" });
    } finally {
      setIconUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleResetIcon() {
    try {
      await customFetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appIconUrl: "" }),
      });
      setIconPreview(null);
      qc.invalidateQueries({ queryKey: ["getSettings"] });
      toast({ title: "Icon reset", description: "The default NFGN icon is now active." });
    } catch {
      toast({ title: "Reset failed", description: "Please try again.", variant: "destructive" });
    }
  }

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

      {/* ── 2. App Icon ── */}
      <Section title="App Icon" icon={Smartphone}>
        <p className="text-sm text-muted-foreground -mt-2">
          This icon appears on members' home screens when they install the app via the QR code. Upload a square PNG or JPG (at least 512×512 px recommended).
        </p>

        <div className="flex items-start gap-6">
          {/* Current icon preview */}
          <div className="flex-shrink-0">
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Current Icon</p>
            <div className="w-24 h-24 rounded-2xl border-2 border-border overflow-hidden bg-[#0a0a0a] shadow-md flex items-center justify-center">
              <img
                key={iconPreview ?? "default"}
                src={iconPreview ?? `/api/app-icon/192?t=${Date.now()}`}
                alt="App icon"
                className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).src = "/icons/icon-192.png"; }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1 text-center">192×192 preview</p>
          </div>

          {/* Upload controls */}
          <div className="flex-1 space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleIconUpload(f); }}
            />

            <Button
              type="button"
              variant="outline"
              className="gap-2 w-full sm:w-auto"
              disabled={iconUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {iconUploading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</>
                : <><Upload className="h-4 w-4" /> Upload New Icon</>
              }
            </Button>

            {iconPreview && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-destructive"
                onClick={handleResetIcon}
                disabled={iconUploading}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset to Default NFGN Icon
              </Button>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 space-y-1">
              <p className="font-semibold">After uploading a new icon:</p>
              <ul className="list-disc list-inside space-y-0.5 text-amber-700">
                <li>New installs via QR code will use the updated icon immediately.</li>
                <li>Members who already have the app must uninstall and reinstall to see the new icon.</li>
                <li>Square images work best — the icon is displayed as a rounded square on most devices.</li>
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* ── 3. Homepage Banner ── */}
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

      {/* ── 6. Uni-Level Commission Structure (live from commission rules) ── */}
      <Section title="Uni-Level Commission Structure" icon={DollarSign}>
        <p className="text-sm text-muted-foreground -mt-2">
          Live commission rates currently active across the system.{" "}
          <Link href="/admin/compensation" className="text-primary underline underline-offset-2 hover:opacity-80">
            Edit in Pro Compensation Settings →
          </Link>
        </p>

        {!commissionRules ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading commission rates…
          </div>
        ) : (
          <div className="space-y-4">
            {/* Referral Commission */}
            <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 space-y-2">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Referral Commission — All Members</p>
              <div className="flex items-center gap-3">
                <div className="rounded-lg border border-blue-300 bg-blue-100 px-4 py-2 text-center min-w-[72px]">
                  <p className="text-xs text-blue-600">Rate</p>
                  <p className="text-xl font-bold text-blue-700">{commissionRules.referralRate}%</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  The Personal Sponsor earns {commissionRules.referralRate}% on <strong>every purchase</strong> made by the member they referred, regardless of membership type.
                </p>
              </div>
            </div>

            {/* Sales Commission */}
            <div className="rounded-lg border p-4 space-y-2">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Product Sales Commissions (PSC) — Pro Members Only</p>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {(commissionRules.salesLevels ?? []).map(l => (
                  <div key={l.level} className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Level {l.level}</p>
                    <p className="text-lg font-bold text-primary">{l.rate}%</p>
                  </div>
                ))}
              </div>
              {(commissionRules.salesLevels ?? []).length === 0 && (
                <p className="text-xs text-muted-foreground italic">No sales commission levels configured.</p>
              )}
            </div>

            {/* PRC */}
            <div className="rounded-lg border p-4 space-y-2">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Pro Member Registration Commission (PMRC) — Pro Members Only</p>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {(commissionRules.prcLevels ?? []).map(l => (
                  <div key={l.level} className="rounded-lg border border-primary/40 bg-primary/5 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Level {l.level}</p>
                    <p className="text-lg font-bold text-primary">{l.rate}%</p>
                  </div>
                ))}
              </div>
              {(commissionRules.prcLevels ?? []).length === 0 && (
                <p className="text-xs text-muted-foreground italic">No PMRC levels configured.</p>
              )}
            </div>

            {/* Power Squad Bonus */}
            <div className="bg-muted/40 rounded-lg p-4 space-y-1.5 border">
              <div className="text-sm font-semibold flex items-center gap-2">
                Power Squad Bonus
                <Badge variant={commissionRules.powerBonusEnabled ? "default" : "secondary"} className="text-xs">
                  {commissionRules.powerBonusEnabled ? "Active" : "Disabled"}
                </Badge>
              </div>
              {commissionRules.powerBonusEnabled ? (
                <p className="text-xs text-muted-foreground">
                  Pro Members earn a{" "}
                  <strong className="text-foreground">${Number(commissionRules.powerBonusAmount).toFixed(2)} bonus</strong>
                  {" "}for every{" "}
                  <strong className="text-foreground">{commissionRules.powerBonusTrigger} Level 2 PMRC purchases</strong>.
                  Requires personally sponsoring at least{" "}
                  <strong className="text-foreground">{commissionRules.powerBonusTrigger} Level 1 Pro Members</strong> to qualify.{" "}
                  <Link href="/admin/bonuses" className="text-primary underline underline-offset-2 hover:opacity-80">
                    Edit in Pro Member Bonuses →
                  </Link>
                </p>
              ) : (
                <p className="text-xs text-muted-foreground italic">Power Squad Bonus is currently disabled.</p>
              )}
            </div>
          </div>
        )}
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
