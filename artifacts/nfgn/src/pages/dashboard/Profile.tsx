import { useState, useEffect, useRef } from "react";
import { useGetMe, useGetSettings, useGetProduct, useAddToCart } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  UserCircle, Shield, Key, Copy, Check, Loader2, Save,
  AlertCircle, CheckCircle2, Star, Calendar, Phone, Mail,
  Building2, CreditCard, Wallet, Users, Award, ChevronRight,
  Eye, EyeOff, Sparkles, ArrowRight, Crown, Zap, TrendingUp, Lock, Camera,
  Briefcase, QrCode, ExternalLink, Smartphone, Trophy, Upload, ShieldCheck, MapPin,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { BAP_CATEGORIES } from "@/lib/bapCategories";
import { customFetch } from "@/lib/custom-fetch";
import { roleLabel } from "@/lib/labels";
import { useCartStore } from "@/hooks/use-cart-store";
import { resolveImageSrc } from "@/lib/image";
import { useToast } from "@/hooks/use-toast";

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="h-7 gap-1 px-2"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
}

function ReadOnlyField({ label, value, masked }: { label: string; value: string | null | undefined; masked?: boolean }) {
  const [show, setShow] = useState(false);
  const display = value || "—";
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground uppercase tracking-wide">{label}</Label>
      <div className="flex items-center gap-2">
        <div className="flex-1 px-3 py-2 rounded-md border bg-muted text-sm font-medium min-h-9 flex items-center">
          {masked && !show
            ? <span className="tracking-widest text-muted-foreground">{"•".repeat(Math.min(display.length, 12))}</span>
            : display}
        </div>
        {masked && value && (
          <Button variant="ghost" size="sm" onClick={() => setShow(s => !s)} className="h-9 w-9 p-0">
            {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </Button>
        )}
      </div>
    </div>
  );
}

function StatusMessage({ msg }: { msg: { type: "success" | "error"; text: string } | null }) {
  if (!msg) return null;
  return (
    <div className={`flex items-center gap-2 text-sm ${msg.type === "success" ? "text-green-600" : "text-destructive"}`}>
      {msg.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
      {msg.text}
    </div>
  );
}

function UpgradeSection({ user, onUpgraded }: { user: any; onUpgraded: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const setCartOpen = useCartStore(s => s.setCartOpen);
  const [adding, setAdding] = useState(false);

  const { data: settings } = useGetSettings();
  const pkgId = (settings as any)?.registrationPackageId ?? null;

  const { data: product } = useGetProduct(pkgId ?? 0, {
    query: { enabled: !!pkgId } as any,
  });
  const addToCart = useAddToCart();

  const pkg = product as any;

  async function handleUpgrade() {
    if (!pkgId) {
      toast({ title: "No package configured", description: "The registration package has not been set up yet. Please contact support.", variant: "destructive" });
      return;
    }
    setAdding(true);
    addToCart.mutate(
      { data: { productId: pkgId, quantity: 1 } } as any,
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: ["/api/cart"] });
          setCartOpen(true);
          toast({ title: "Package added to cart!", description: "Complete your purchase in the cart to activate your Pro membership." });
          setAdding(false);
        },
        onError: () => {
          toast({ title: "Error", description: "Could not add the package to your cart. Please try again.", variant: "destructive" });
          setAdding(false);
        },
      }
    );
  }

  const benefits = [
    { icon: TrendingUp, text: "Earn higher commissions on direct sales" },
    { icon: Users,      text: "Unlock binary & matrix genealogy bonuses" },
    { icon: Zap,        text: "Access exclusive Pro Member products & pricing" },
    { icon: Crown,      text: "Priority customer support & training resources" },
    { icon: Award,      text: "Qualify for leadership rank advancement" },
    { icon: Sparkles,   text: "Invitation to NFGN Pro events & retreats" },
  ];

  return (
    <Card className="border-2 border-primary/40 bg-gradient-to-br from-primary/5 via-background to-yellow-50/30 dark:to-yellow-950/10 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-yellow-400 to-primary" />
      <CardHeader className="pb-3 relative">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="text-lg flex items-center gap-2 font-serif">
              <Crown className="h-5 w-5 text-primary" />
              Upgrade to Pro Member
            </CardTitle>
            <CardDescription className="mt-1">
              Unlock the full NFGN compensation plan — one-time registration package purchase
            </CardDescription>
          </div>
          <Badge className="bg-primary text-primary-foreground text-sm px-3 py-1 gap-1 flex-shrink-0">
            <Sparkles className="h-3.5 w-3.5" />
            {pkg ? `$${parseFloat(pkg.price).toFixed(2)}` : (settings as any)?.registrationPackagePrice ? `$${((settings as any).registrationPackagePrice).toFixed(2)}` : "One-Time Fee"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Package product preview */}
        {pkg && (
          <div className="flex items-center gap-3 rounded-lg bg-background/80 border px-4 py-3">
            {resolveImageSrc(pkg.image) && (
              <img
                src={resolveImageSrc(pkg.image)!}
                alt={pkg.name}
                className="h-12 w-12 rounded-md object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{pkg.name}</p>
              {pkg.cv != null && pkg.cv > 0 && (
                <p className="text-xs text-muted-foreground">CV: {pkg.cv} pts</p>
              )}
              {pkg.description && (
                <p className="text-xs text-muted-foreground truncate">{pkg.description}</p>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-lg font-bold text-primary">${parseFloat(pkg.price).toFixed(2)}</p>
              {pkg.comparePrice && parseFloat(pkg.comparePrice) > parseFloat(pkg.price) && (
                <p className="text-xs text-muted-foreground line-through">${parseFloat(pkg.comparePrice).toFixed(2)}</p>
              )}
            </div>
          </div>
        )}

        {/* Benefits grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {benefits.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-start gap-2 text-sm">
              <Icon className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-foreground/80">{text}</span>
            </div>
          ))}
        </div>

        <Separator />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your membership is activated instantly upon successful payment. The registration package includes physical product(s) shipped to your address.
          </p>
          <Button
            onClick={handleUpgrade}
            disabled={adding || addToCart.isPending}
            size="lg"
            className="gap-2 flex-shrink-0 w-full sm:w-auto"
          >
            {adding || addToCart.isPending
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <ShoppingCartIcon className="h-4 w-4" />
            }
            Add to Cart & Upgrade
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ShoppingCartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

export function ProfilePage() {
  const { data: user, refetch } = useGetMe();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [city, setCity]       = useState("");
  const [addrState, setAddrState] = useState("");
  const [country, setCountry] = useState("");
  const [addrSaving, setAddrSaving] = useState(false);
  const [addrMsg, setAddrMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankRoutingNumber, setBankRoutingNumber] = useState("");
  const [bankAccountType, setBankAccountType] = useState("");
  const [bankSaving, setBankSaving] = useState(false);
  const [bankMsg, setBankMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [payoutMethod, setPayoutMethod] = useState("bank");
  const [payoutPaypalEmail, setPayoutPaypalEmail] = useState("");
  const [payoutCashAppHandle, setPayoutCashAppHandle] = useState("");
  const [payoutSaving, setPayoutSaving] = useState(false);
  const [payoutMsg, setPayoutMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [avatarSaving, setAvatarSaving] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // NFGN Sports Player state
  const [isSportsPlayer, setIsSportsPlayer] = useState(false);
  const [sportsDateOfBirth, setSportsDateOfBirth] = useState("");
  const [sportsSchool, setSportsSchool] = useState("");
  const [sportsGrade, setSportsGrade] = useState("");
  const [sportsBirthCertUrl, setSportsBirthCertUrl] = useState("");
  const [sportsSaving, setSportsSaving] = useState(false);
  const [sportsMsg, setSportsMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [uploadingSportsCert, setUploadingSportsCert] = useState(false);
  const sportsCertInputRef = useRef<HTMLInputElement>(null);

  // Book-A-Pro state
  const [bapEnabled, setBapEnabled] = useState(false);
  const [bapCategory, setBapCategory] = useState("");
  const [bapSubServices, setBapSubServices] = useState<string[]>([]);
  const [bapCustomService, setBapCustomService] = useState("");
  const [bapBio, setBapBio] = useState("");
  const [bapSaving, setBapSaving] = useState(false);
  const [bapMsg, setBapMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const bapCategoryOptions = BAP_CATEGORIES[bapCategory] ?? [];
  const toggleBapService = (s: string) => setBapSubServices(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const addBapCustom = () => {
    const s = bapCustomService.trim();
    if (s && !bapSubServices.includes(s)) setBapSubServices(prev => [...prev, s]);
    setBapCustomService("");
  };

  useEffect(() => {
    if (user) {
      setFirstName((user as any).firstName ?? "");
      setLastName((user as any).lastName ?? "");
      setPhone((user as any).phone ?? "");
      setGender((user as any).gender ?? "");
      setDateOfBirth((user as any).dateOfBirth ?? "");
      setBankName((user as any).bankName ?? "");
      setBankAccountNumber((user as any).bankAccountNumber ?? "");
      setBankRoutingNumber((user as any).bankRoutingNumber ?? "");
      setBankAccountType((user as any).bankAccountType ?? "");
      setPayoutMethod((user as any).payoutMethod ?? "bank");
      setPayoutPaypalEmail((user as any).payoutPaypalEmail ?? "");
      setPayoutCashAppHandle((user as any).payoutCashAppHandle ?? "");
      setCity((user as any).city ?? "");
      setAddrState((user as any).state ?? "");
      setCountry((user as any).country ?? "");
      setBapEnabled((user as any).isBookAProProvider ?? false);
      setBapCategory((user as any).bookAProCategory ?? "");
      setBapSubServices((user as any).bookAProSubServices ?? []);
      setBapBio((user as any).bookAProBio ?? "");
      setIsSportsPlayer((user as any).isSportsPlayer ?? false);
      setSportsDateOfBirth((user as any).sportsDateOfBirth ?? "");
      setSportsSchool((user as any).sportsSchool ?? "");
      setSportsGrade((user as any).sportsGrade ?? "");
      setSportsBirthCertUrl((user as any).sportsBirthCertificateUrl ?? "");
    }
  }, [user]);

  async function patchUser(data: Record<string, unknown>) {
    if (!user) throw new Error("Not logged in");
    const res = await customFetch(`/api/users/${(user as any).id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Failed to save.");
    }
    refetch();
  }

  async function handleSaveProfile() {
    setSaving(true); setSaveMsg(null);
    try {
      await patchUser({ firstName, lastName, phone, gender, dateOfBirth: dateOfBirth || null });
      setSaveMsg({ type: "success", text: "Personal information updated successfully." });
    } catch (e: any) {
      setSaveMsg({ type: "error", text: e.message });
    } finally { setSaving(false); }
  }

  async function handleSaveAddress() {
    setAddrSaving(true); setAddrMsg(null);
    try {
      await patchUser({ city: city.trim() || null, state: addrState.trim() || null, country: country.trim() || null });
      setAddrMsg({ type: "success", text: "Mailing address saved." });
    } catch (e: any) {
      setAddrMsg({ type: "error", text: e.message });
    } finally { setAddrSaving(false); }
  }

  async function handleSaveBank() {
    setBankSaving(true); setBankMsg(null);
    try {
      await patchUser({ bankName, bankAccountNumber, bankRoutingNumber, bankAccountType });
      setBankMsg({ type: "success", text: "Bank information saved." });
    } catch (e: any) {
      setBankMsg({ type: "error", text: e.message });
    } finally { setBankSaving(false); }
  }

  async function handleSavePayout() {
    setPayoutSaving(true); setPayoutMsg(null);
    try {
      await patchUser({ payoutMethod, payoutPaypalEmail: payoutPaypalEmail || null, payoutCashAppHandle: payoutCashAppHandle || null });
      setPayoutMsg({ type: "success", text: "Payout preferences saved." });
    } catch (e: any) {
      setPayoutMsg({ type: "error", text: e.message });
    } finally { setPayoutSaving(false); }
  }

  async function handleSaveSports() {
    setSportsSaving(true); setSportsMsg(null);
    try {
      await patchUser({
        isSportsPlayer,
        sportsDateOfBirth: isSportsPlayer ? (sportsDateOfBirth || null) : null,
        sportsSchool: isSportsPlayer ? (sportsSchool || null) : null,
        sportsGrade: isSportsPlayer ? (sportsGrade || null) : null,
        sportsBirthCertificateUrl: isSportsPlayer ? (sportsBirthCertUrl || null) : null,
      });
      setSportsMsg({ type: "success", text: isSportsPlayer ? "NFGN Sports player profile saved!" : "Sports player profile deactivated." });
    } catch (e: any) {
      setSportsMsg({ type: "error", text: e.message });
    } finally { setSportsSaving(false); }
  }

  async function handleSaveBAP() {
    setBapSaving(true); setBapMsg(null);
    try {
      const res = await customFetch("/api/users/me/book-a-pro", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isBookAProProvider: bapEnabled,
          bookAProCategory: bapEnabled ? bapCategory : null,
          bookAProSubServices: bapEnabled ? bapSubServices : [],
          bookAProBio: bapEnabled ? bapBio || null : null,
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Failed to save.");
      refetch();
      setBapMsg({ type: "success", text: bapEnabled ? "Book-A-Pro provider profile saved and activated!" : "Book-A-Pro provider services deactivated." });
    } catch (e: any) { setBapMsg({ type: "error", text: e.message }); }
    finally { setBapSaving(false); }
  }

  async function handleChangePassword() {
    setPwMsg(null);
    if (!currentPw) { setPwMsg({ type: "error", text: "Current password is required." }); return; }
    if (newPw.length < 8) { setPwMsg({ type: "error", text: "New password must be at least 8 characters." }); return; }
    if (newPw !== confirmPw) { setPwMsg({ type: "error", text: "New passwords do not match." }); return; }
    setPwSaving(true);
    try {
      const res = await customFetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setPwMsg({ type: "error", text: err.error ?? "Failed to change password." });
      } else {
        setPwMsg({ type: "success", text: "Password changed successfully." });
        setCurrentPw(""); setNewPw(""); setConfirmPw("");
      }
    } catch {
      setPwMsg({ type: "error", text: "Network error. Please try again." });
    } finally { setPwSaving(false); }
  }

  async function handleAvatarUpload(file: File) {
    setAvatarSaving(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();
        reader.onload = (e) => {
          img.src = e.target?.result as string;
          img.onload = () => {
            const size = 150;
            const canvas = document.createElement("canvas");
            canvas.width = size; canvas.height = size;
            const ctx = canvas.getContext("2d")!;
            const scale = Math.max(size / img.width, size / img.height);
            const sw = img.width * scale, sh = img.height * scale;
            ctx.drawImage(img, (size - sw) / 2, (size - sh) / 2, sw, sh);
            resolve(canvas.toDataURL("image/jpeg", 0.82));
          };
          img.onerror = reject;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      await patchUser({ avatar: dataUrl });
    } catch {
      // silently ignore
    } finally {
      setAvatarSaving(false);
    }
  }

  const u = user as any;
  const initials = `${u?.firstName?.charAt(0) ?? ""}${u?.lastName?.charAt(0) ?? ""}`;
  const memberSince = u?.createdAt ? new Date(u.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—";
  const proSince = u?.proMemberSince ? new Date(u.proMemberSince).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-serif font-bold">Profile Management</h1>
        <p className="text-muted-foreground">Manage your account information, banking details, and payout preferences</p>
      </div>

      {/* Account Overview */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            {/* Avatar with upload overlay */}
            <div className="relative flex-shrink-0 group">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); e.target.value = ""; }}
              />
              <div
                className="h-16 w-16 rounded-full overflow-hidden cursor-pointer ring-2 ring-border group-hover:ring-primary transition-all"
                onClick={() => avatarInputRef.current?.click()}
              >
                {u?.avatar ? (
                  <img src={u.avatar} alt={u.firstName} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                    {initials || <UserCircle className="h-8 w-8" />}
                  </div>
                )}
              </div>
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarSaving}
                className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
                title="Upload profile photo"
              >
                {avatarSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
              </button>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-semibold">{u?.firstName} {u?.lastName}</h2>
                {u?.isProMember && (
                  <Badge className="gap-1 text-xs">
                    <Star className="h-3 w-3" />
                    Pro Member
                  </Badge>
                )}
                {u?.role && (
                  <Badge variant="outline" className="text-xs">{roleLabel(u.role)}</Badge>
                )}
              </div>
              <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                {u?.email}
              </div>
              <div className="flex items-center gap-1 mt-0.5 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                Member since {memberSince}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Membership & Account Info — Read-only */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            Membership & Account Details
          </CardTitle>
          <CardDescription>Your account classification and sponsorship information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ReadOnlyField
              label="Registration Package"
              value={u?.isProMember ? "Pro Membership" : "Free Membership"}
            />
            <ReadOnlyField
              label="Account Status"
              value={u?.status ? u.status.charAt(0).toUpperCase() + u.status.slice(1) : "Active"}
            />
            <ReadOnlyField
              label="Member Since"
              value={memberSince}
            />
            {proSince && (
              <ReadOnlyField label="Pro Member Since" value={proSince} />
            )}
            <ReadOnlyField
              label="Sponsor's Name"
              value={u?.sponsorName ?? (u?.sponsorId ? `Member #${u.sponsorId}` : "No Sponsor — Top of Tree")}
            />
            <ReadOnlyField
              label="Placement (Placed Under)"
              value={u?.sponsorName ?? (u?.sponsorId ? `Placed under Member #${u.sponsorId}` : "Root / Top Placement")}
            />
          </div>
          <div className="rounded-lg bg-muted/50 border px-4 py-3 text-xs text-muted-foreground">
            To update sponsorship placement, contact NFGN Support at{" "}
            <a href="tel:6789099974" className="font-medium text-foreground underline underline-offset-2">(678) 909-9974</a>{" "}
            or email{" "}
            <a href="mailto:newfaceglobalnetwork@gmail.com" className="font-medium text-foreground underline underline-offset-2">
              newfaceglobalnetwork@gmail.com
            </a>.
          </div>
        </CardContent>
      </Card>

      {/* Upgrade to Pro Member — only shown to non-pro members */}
      {!u?.isProMember && (
        <div className="relative">
          <UpgradeSection user={u} onUpgraded={refetch} />
        </div>
      )}

      {/* Referral & Sponsor Tools */}
      <Card className="border-2 border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Referral & Sponsor Tools
          </CardTitle>
          <CardDescription>Share your code or link — anyone who registers using them is linked to you as their sponsor</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border-2 border-primary/40 bg-background p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-black text-primary-foreground">#</span>
              </div>
              <div>
                <Label className="text-xs font-bold text-primary uppercase tracking-wider">Your Sponsor Referral Code</Label>
                <p className="text-xs text-muted-foreground">New members enter this when signing up under you</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-2xl font-black font-mono tracking-widest text-foreground bg-muted px-4 py-2.5 rounded-lg border border-primary/20 flex-1 select-all">
                {u?.referralCode ?? "—"}
              </code>
              {u?.referralCode && <CopyBtn text={u.referralCode} />}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Anyone who enters this code in the <strong>"Personal Sponsor Referral Code"</strong> field at sign-up is placed under you in the genealogy tree, and you earn commissions on their purchases.
            </p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Your Referral Invite Link</Label>
            <div className="flex items-center gap-2 mt-1">
              <code className="text-xs font-mono bg-muted px-3 py-1.5 rounded border flex-1 truncate">
                {window.location.origin}/join?ref={u?.referralCode}
              </code>
              {u?.referralCode && <CopyBtn text={`${window.location.origin}/join?ref=${u.referralCode}`} />}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Your referral code is pre-filled automatically when someone opens this link.</p>
          </div>
        </CardContent>
      </Card>

      {/* Personal Contact Card QR Code */}
      {(() => {
        const fullName = `${u?.firstName ?? ""} ${u?.lastName ?? ""}`.trim();
        const email = u?.email ?? "";
        const phone = u?.phone ?? "";
        const refCode = u?.referralCode ?? "";
        const refLink = `${window.location.origin}/join?ref=${refCode}`;
        const vcard = [
          "BEGIN:VCARD",
          "VERSION:3.0",
          `FN:${fullName}`,
          `N:${u?.lastName ?? ""};${u?.firstName ?? ""};;;`,
          phone ? `TEL;TYPE=CELL:${phone}` : "",
          email ? `EMAIL:${email}` : "",
          "ORG:New Face Global Network",
          u?.isProMember ? "TITLE:NFGN Pro Member" : "TITLE:NFGN Member",
          refCode ? `URL:${refLink}` : "",
          refCode ? `NOTE:NFGN Sponsor Code\\: ${refCode}` : "",
          "END:VCARD",
        ].filter(Boolean).join("\n");
        const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(vcard)}&color=0a0a0a&bgcolor=ffffff`;
        const qrFull = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(vcard)}`;
        return (
          <Card className="border-2 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <QrCode className="h-4 w-4 text-primary" />
                Personal Contact Card QR Code
              </CardTitle>
              <CardDescription>Share this QR code and customers can save your contact info instantly</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="border rounded-xl p-4 bg-white shadow-sm flex-shrink-0">
                  <img src={qrSrc} alt="Contact Card QR Code" width={180} height={180} className="rounded" />
                </div>
                <div className="flex-1 min-w-0 space-y-3">
                  <div>
                    <p className="font-semibold text-sm mb-1">What's encoded in this QR code?</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      This QR code is a digital business card (vCard). When someone scans it, their phone will automatically offer to save your contact information — including your name, email, phone number, and your NFGN referral link.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { icon: UserCircle, label: "Name", value: fullName || "—" },
                      { icon: Mail, label: "Email", value: email || "—" },
                      { icon: Phone, label: "Phone", value: phone || "Not set — add in Personal Info below" },
                      { icon: Smartphone, label: "Referral Link", value: refCode ? refLink : "—" },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex items-start gap-2 text-xs min-w-0">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground font-medium w-20 flex-shrink-0">{label}:</span>
                        <span className={`truncate min-w-0 flex-1 ${value.includes("Not set") ? "text-amber-600" : ""}`}>{value}</span>
                      </div>
                    ))}
                  </div>
                  {!phone && (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700 flex items-center gap-2">
                      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                      Add your phone number below to include it in this QR code.
                    </div>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => window.open(qrFull, "_blank")}>
                      <ExternalLink className="h-3.5 w-3.5" /> Download Full Size
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => navigator.share ? navigator.share({ title: `${fullName} — NFGN Contact`, url: refLink }) : navigator.clipboard.writeText(refLink)}
                    >
                      <Smartphone className="h-3.5 w-3.5" /> Share Contact Link
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Print this QR code on your business card, flyers, or name badge. Update your profile info to regenerate automatically.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserCircle className="h-4 w-4" />
            Personal Information
          </CardTitle>
          <CardDescription>Your name, contact info, and identity details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>First Name</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
            </div>
            <div className="space-y-1.5">
              <Label>Last Name</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Email Address</Label>
            <div className="flex items-center gap-2">
              <Input value={u?.email ?? ""} disabled className="bg-muted" />
              <Badge variant="secondary" className="text-xs whitespace-nowrap">Read-only</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Contact support to change your email address.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> Phone Number
              </Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" type="tel" />
            </div>
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-binary</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Date of Birth
            </Label>
            <Input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>

          <StatusMessage msg={saveMsg} />
          <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Personal Info
          </Button>
        </CardContent>
      </Card>

      {/* Mailing Address */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Mailing Address
          </CardTitle>
          <CardDescription>Your city and country appear on the Community World Map for your upline and admin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Atlanta" />
            </div>
            <div className="space-y-1.5">
              <Label>State / Province</Label>
              <Input value={addrState} onChange={(e) => setAddrState(e.target.value)} placeholder="e.g. Georgia" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Country</Label>
            <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. United States" />
          </div>
          <div className="rounded-lg bg-muted/50 border px-4 py-3 text-xs text-muted-foreground flex items-start gap-2">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-primary" />
            <span>This is used only for the Community World Map — it is never shared publicly. Your shipping address is entered separately at checkout.</span>
          </div>
          <StatusMessage msg={addrMsg} />
          <Button onClick={handleSaveAddress} disabled={addrSaving} className="gap-2">
            {addrSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Address
          </Button>
        </CardContent>
      </Card>

      {/* Bank Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Bank Information
          </CardTitle>
          <CardDescription>Where you'd like to receive direct deposit payouts. Stored securely and used only for commission disbursements.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
            <strong>Security Notice:</strong> Your banking details are encrypted and stored securely. NFGN will never sell or share your financial information. Account numbers are partially masked when displayed.
          </div>

          <div className="space-y-1.5">
            <Label>Bank Name</Label>
            <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. Wells Fargo, Bank of America" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Account Type</Label>
              <select
                value={bankAccountType}
                onChange={(e) => setBankAccountType(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Select type</option>
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
                <option value="business_checking">Business Checking</option>
                <option value="business_savings">Business Savings</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Routing Number</Label>
              <Input
                value={bankRoutingNumber}
                onChange={(e) => setBankRoutingNumber(e.target.value)}
                placeholder="9-digit routing number"
                maxLength={9}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Account Number</Label>
            <Input
              value={bankAccountNumber}
              onChange={(e) => setBankAccountNumber(e.target.value)}
              placeholder="Your account number"
              type="password"
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">Entered as masked for your protection. Re-enter to update.</p>
          </div>

          <StatusMessage msg={bankMsg} />
          <Button onClick={handleSaveBank} disabled={bankSaving} className="gap-2">
            {bankSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Bank Information
          </Button>
        </CardContent>
      </Card>

      {/* Payout Method */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Payout Method & Payment Details
          </CardTitle>
          <CardDescription>Choose how you'd like to receive your earned commissions and bonuses</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Preferred Payout Method</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { value: "bank", label: "Bank Transfer", icon: Building2, desc: "Direct deposit to bank" },
                { value: "paypal", label: "PayPal", icon: CreditCard, desc: "Sent to your PayPal" },
                { value: "cashapp", label: "Cash App", icon: Wallet, desc: "Sent to Cash App" },
              ].map(({ value, label, icon: Icon, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPayoutMethod(value)}
                  className={`flex flex-col items-start gap-1 rounded-lg border-2 p-3 text-left transition-colors ${
                    payoutMethod === value
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{label}</span>
                    {payoutMethod === value && <Check className="h-3.5 w-3.5 text-primary ml-auto" />}
                  </div>
                  <span className="text-xs text-muted-foreground">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {payoutMethod === "bank" && (
            <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4 flex-shrink-0" />
              Commissions will be sent via direct deposit to the bank account entered above. Ensure your bank information is complete and accurate.
            </div>
          )}

          {payoutMethod === "paypal" && (
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5" />
                PayPal Email Address
              </Label>
              <Input
                value={payoutPaypalEmail}
                onChange={(e) => setPayoutPaypalEmail(e.target.value)}
                placeholder="your-paypal@email.com"
                type="email"
              />
              <p className="text-xs text-muted-foreground">
                Commissions will be sent as a PayPal payment to this address. Make sure it matches your verified PayPal account.
              </p>
            </div>
          )}

          {payoutMethod === "cashapp" && (
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5" />
                Cash App $Cashtag
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">$</span>
                <Input
                  value={payoutCashAppHandle}
                  onChange={(e) => setPayoutCashAppHandle(e.target.value.replace(/^\$/, ""))}
                  placeholder="YourCashTag"
                  className="pl-7"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Enter your $Cashtag without the dollar sign. Commissions will be sent to this Cash App account.
              </p>
            </div>
          )}

          <StatusMessage msg={payoutMsg} />
          <Button onClick={handleSavePayout} disabled={payoutSaving} className="gap-2">
            {payoutSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Payout Preferences
          </Button>
        </CardContent>
      </Card>

      {/* NFGN Sports Player Profile */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                NFGN SPORTS Player Profile
              </CardTitle>
              <CardDescription className="mt-1">
                Register as an NFGN Sports player for tournament eligibility and league participation. Your profile is visible to team administrators.
              </CardDescription>
            </div>
            <Switch
              checked={isSportsPlayer}
              onCheckedChange={v => { setIsSportsPlayer(v); if (!v) { setSportsDateOfBirth(""); setSportsSchool(""); setSportsGrade(""); } }}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isSportsPlayer ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> Date of Birth
                  </Label>
                  <Input
                    type="date"
                    value={sportsDateOfBirth}
                    onChange={e => setSportsDateOfBirth(e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>School or College <span className="text-muted-foreground font-normal text-xs">(if any)</span></Label>
                  <Input
                    value={sportsSchool}
                    onChange={e => setSportsSchool(e.target.value)}
                    placeholder="e.g. Jefferson High School"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Grade in School or Year in College</Label>
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
              </div>

              <Separator />

              {/* Birth Certificate Upload */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Upload className="h-3.5 w-3.5 text-primary" />
                  Birth Certificate / Proof of Eligibility
                </Label>
                <p className="text-xs text-muted-foreground">
                  Upload a birth certificate, photo ID, or other eligibility document required for tournament entry. Accepted: JPG, PNG, PDF.
                </p>
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
                      const res = await customFetch("/api/storage/upload", { method: "POST", body: formData });
                      if (res.ok) {
                        const data = await res.json();
                        setSportsBirthCertUrl(data.objectPath ?? "");
                      }
                    } catch { /* ignore */ }
                    finally {
                      setUploadingSportsCert(false);
                      if (sportsCertInputRef.current) sportsCertInputRef.current.value = "";
                    }
                  }}
                />
                <div className="flex items-center gap-3 flex-wrap">
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
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-xs text-green-700 font-medium">Document uploaded</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-muted-foreground"
                        onClick={() => window.open(`/api/storage${sportsBirthCertUrl}`, "_blank")}
                      >
                        View
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/20 border border-dashed text-sm text-muted-foreground">
              <Trophy className="h-8 w-8 opacity-30 flex-shrink-0" />
              <span>Toggle the switch above to register as an NFGN Sports player. Your player profile will be visible to tournament administrators.</span>
            </div>
          )}
          <StatusMessage msg={sportsMsg} />
          <Button onClick={handleSaveSports} disabled={sportsSaving} className="gap-2">
            {sportsSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Sports Profile
          </Button>
        </CardContent>
      </Card>

      {/* Book-A-Pro Provider */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Book-A-Pro Provider Services
                {(user as any)?.role === "pro_member" || ["super_admin","admin","store_admin"].includes((user as any)?.role) ? (
                  <Badge className="text-xs" style={{ background: "#C9A84C20", color: "#C9A84C", border: "1px solid #C9A84C60" }}>
                    <ShieldCheck className="h-3 w-3 mr-1" /> Pro Member
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    <Lock className="h-3 w-3 mr-1" /> Pro Members Only
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-1">
                List your professional services on the NFGN marketplace. Members can discover and book you directly.
              </CardDescription>
            </div>
            {((user as any)?.role === "pro_member" || ["super_admin","admin","store_admin"].includes((user as any)?.role)) && (
              <Switch
                checked={bapEnabled}
                onCheckedChange={v => { setBapEnabled(v); if (!v) { setBapCategory(""); setBapSubServices([]); setBapBio(""); } }}
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* ── Pro Member gate ── */}
          {!((user as any)?.role === "pro_member" || ["super_admin","admin","store_admin"].includes((user as any)?.role)) ? (
            <div className="rounded-xl border-2 border-dashed p-6 text-center space-y-4" style={{ borderColor: "#C9A84C60", background: "#C9A84C08" }}>
              <div className="flex justify-center">
                <div className="h-14 w-14 rounded-full flex items-center justify-center" style={{ background: "#C9A84C20" }}>
                  <Lock className="h-7 w-7" style={{ color: "#C9A84C" }} />
                </div>
              </div>
              <div className="space-y-1.5">
                <h3 className="font-semibold text-base">Pro Member Membership Required</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  To provide <strong>Book-A-Pro services</strong> on NFGN, you must be a <strong>Pro Member</strong>. Purchase a <strong>Pro Member Registration Package</strong>, then return here to click <span className="font-semibold" style={{ color: "#C9A84C" }}>"Activate Book-A-Pro Provider Services"</span>.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <div className="flex items-start gap-2 text-xs text-left max-w-xs p-3 rounded-lg border bg-card">
                  <span className="text-lg leading-none mt-0.5">1️⃣</span>
                  <span><strong>Purchase</strong> a Pro Member Registration Package from the NFGN Shop.</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-left max-w-xs p-3 rounded-lg border bg-card">
                  <span className="text-lg leading-none mt-0.5">2️⃣</span>
                  <span><strong>Return here</strong> and click <em>"Activate Book-A-Pro Provider Services"</em> to go live on the marketplace.</span>
                </div>
              </div>
              <a href="/shop">
                <Button className="gap-2 font-semibold" style={{ background: "#C9A84C", color: "#0a0a0a" }}>
                  <Crown className="h-4 w-4" />
                  Upgrade to Pro Member
                </Button>
              </a>
            </div>
          ) : (
            <>
              {bapEnabled ? (
                <>
                  {/* Category */}
                  <div className="space-y-1.5">
                    <Label>Service Category *</Label>
                    <Select value={bapCategory} onValueChange={v => { setBapCategory(v); setBapSubServices([]); }}>
                      <SelectTrigger>
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
                    <div className="space-y-2">
                      <Label>Your Services in <span className="text-primary font-semibold">{bapCategory}</span></Label>
                      <p className="text-xs text-muted-foreground">Check all the specific services you offer.</p>
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
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a custom service…"
                          value={bapCustomService}
                          onChange={e => setBapCustomService(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addBapCustom())}
                          className="text-sm h-8"
                        />
                        <button
                          type="button"
                          onClick={addBapCustom}
                          className="px-3 h-8 text-xs border rounded-md hover:bg-muted transition-colors"
                        >Add</button>
                      </div>
                      {bapSubServices.filter(s => !bapCategoryOptions.includes(s)).length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {bapSubServices.filter(s => !bapCategoryOptions.includes(s)).map(s => (
                            <Badge
                              key={s}
                              variant="secondary"
                              className="text-xs cursor-pointer"
                              onClick={() => toggleBapService(s)}
                            >{s} ×</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label>Professional Bio (optional)</Label>
                    <Textarea
                      rows={3}
                      value={bapBio}
                      onChange={e => setBapBio(e.target.value)}
                      placeholder="Describe your background, certifications, and specialties…"
                    />
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/20 border border-dashed text-sm text-muted-foreground">
                  <Briefcase className="h-8 w-8 opacity-30 flex-shrink-0" />
                  <span>Toggle the switch above to activate your Book-A-Pro provider profile and start accepting bookings from NFGN members.</span>
                </div>
              )}

              <StatusMessage msg={bapMsg} />
              <Button
                onClick={handleSaveBAP}
                disabled={bapSaving || (bapEnabled && !bapCategory)}
                className="gap-2 font-semibold"
                style={!bapEnabled ? {} : { background: "#C9A84C", color: "#0a0a0a" }}
              >
                {bapSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {bapEnabled ? "Activate Book-A-Pro Provider Services" : "Save Book-A-Pro Settings"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-4 w-4" />
            Change Password
          </CardTitle>
          <CardDescription>Minimum 8 characters. Use a strong, unique password.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Current Password</Label>
            <Input
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              placeholder="Enter current password"
              autoComplete="current-password"
            />
          </div>
          <Separator />
          <div className="space-y-1.5">
            <Label>New Password</Label>
            <Input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Confirm New Password</Label>
            <Input
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="Repeat new password"
              autoComplete="new-password"
            />
          </div>
          <StatusMessage msg={pwMsg} />
          <Button onClick={handleChangePassword} disabled={pwSaving} variant="outline" className="gap-2">
            {pwSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
            Update Password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
