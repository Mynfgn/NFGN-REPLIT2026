import { useState, useEffect } from "react";
import { useGetMe } from "@workspace/api-client-react";
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
  Eye, EyeOff,
} from "lucide-react";
import { customFetch } from "@/lib/custom-fetch";
import { roleLabel } from "@/lib/labels";

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

export function ProfilePage() {
  const { data: user, refetch } = useGetMe();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold flex-shrink-0">
              {initials || <UserCircle className="h-8 w-8" />}
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
            To update your membership package or sponsorship placement, please contact NFGN Support at{" "}
            <a href="tel:6789099974" className="font-medium text-foreground underline underline-offset-2">(678) 909-9974</a>{" "}
            or email{" "}
            <a href="mailto:newfaceglobalnetwork@gmail.com" className="font-medium text-foreground underline underline-offset-2">
              newfaceglobalnetwork@gmail.com
            </a>.
          </div>
        </CardContent>
      </Card>

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
