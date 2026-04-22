import { useState, useEffect, useCallback } from "react";
import { useGetMe } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@/lib/custom-fetch";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  UserCircle, Mail, Phone, Save, KeyRound, Eye, EyeOff,
  CheckCircle2, Loader2, ShieldCheck, Calendar, Hash, ImagePlus,
  AlertCircle, Search, Users, Banknote, ToggleLeft, ToggleRight,
  SlidersHorizontal, RefreshCw, X,
} from "lucide-react";
import { roleLabel } from "@/lib/labels";

/* ── helpers ────────────────────────────────────────────────── */
function Section({ title, icon: Icon, sub, children }: {
  title: string; icon: React.ElementType; sub?: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-card border rounded-xl p-6 space-y-5">
      <div>
        <h2 className="text-base font-bold flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </h2>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: {
  label: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-sm font-medium">{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

function PwdInput({ value, onChange, placeholder, show, onToggle }: {
  value: string; onChange: (v: string) => void; placeholder: string; show: boolean; onToggle: () => void;
}) {
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10"
      />
      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={onToggle}>
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function Alert({ type, children }: { type: "success" | "error" | "warn"; children: React.ReactNode }) {
  const styles = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    warn: "bg-amber-50 border-amber-200 text-amber-800",
  }[type];
  const Icon = type === "success" ? CheckCircle2 : AlertCircle;
  const iconColor = type === "success" ? "text-green-600" : type === "error" ? "text-red-600" : "text-amber-600";
  return (
    <div className={`border rounded-lg px-4 py-3 flex items-center gap-2 text-sm ${styles}`}>
      <Icon className={`h-4 w-4 flex-shrink-0 ${iconColor}`} />
      <span>{children}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ */

type Tab = "profile" | "members" | "banking";

export function AdminProfilePage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: me, isLoading } = useGetMe();
  const [tab, setTab] = useState<Tab>("profile");

  /* ── Tab: My Profile ─────────────────────────────────────── */
  const [profile, setProfile] = useState({ firstName: "", lastName: "", phone: "", avatar: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [showC, setShowC] = useState(false);
  const [showN, setShowN] = useState(false);
  const [showCo, setShowCo] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdOk, setPwdOk] = useState(false);

  useEffect(() => {
    if (!me) return;
    setProfile({
      firstName: me.firstName ?? "",
      lastName: me.lastName ?? "",
      phone: (me as any).phone ?? "",
      avatar: (me as any).avatar ?? "",
    });
  }, [me]);

  async function saveProfile() {
    if (!me) return;
    setProfileSaving(true);
    try {
      const res = await customFetch(`/api/users/${me.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: profile.firstName.trim(),
          lastName: profile.lastName.trim(),
          phone: profile.phone.trim() || null,
          avatar: profile.avatar.trim() || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Failed");
      await qc.invalidateQueries({ queryKey: ["getMe"] });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
      toast({ title: "Profile updated" });
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally { setProfileSaving(false); }
  }

  async function changePassword() {
    setPwdError(""); setPwdOk(false);
    if (!pwd.current || !pwd.next || !pwd.confirm) { setPwdError("All fields are required."); return; }
    if (pwd.next.length < 8) { setPwdError("New password must be at least 8 characters."); return; }
    if (pwd.next !== pwd.confirm) { setPwdError("Passwords do not match."); return; }
    setPwdSaving(true);
    try {
      const res = await customFetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pwd.current, newPassword: pwd.next }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Failed");
      setPwd({ current: "", next: "", confirm: "" });
      setPwdOk(true);
      setTimeout(() => setPwdOk(false), 4000);
    } catch (e: any) { setPwdError(e.message); }
    finally { setPwdSaving(false); }
  }

  const initials = me ? `${me.firstName?.charAt(0) ?? ""}${me.lastName?.charAt(0) ?? ""}`.toUpperCase() : "?";
  const memberSince = me?.createdAt
    ? new Date(me.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "—";

  /* ── Tab: Manage Members ─────────────────────────────────── */
  const [memberSearch, setMemberSearch] = useState("");
  const [memberResults, setMemberResults] = useState<any[]>([]);
  const [memberSearching, setMemberSearching] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);

  const searchMembers = useCallback(async (q: string) => {
    if (!q.trim()) { setMemberResults([]); return; }
    setMemberSearching(true);
    try {
      const res = await customFetch(`/api/users?search=${encodeURIComponent(q)}&limit=10`);
      const data = await res.json();
      setMemberResults(data.users ?? []);
    } catch { setMemberResults([]); }
    finally { setMemberSearching(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchMembers(memberSearch), 350);
    return () => clearTimeout(t);
  }, [memberSearch, searchMembers]);

  /* ── Member: username ── */
  const [uName, setUName] = useState({ firstName: "", lastName: "" });
  const [uNameSaving, setUNameSaving] = useState(false);
  const [uNameMsg, setUNameMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  /* ── Member: password reset ── */
  const [mPwd, setMPwd] = useState({ next: "", confirm: "" });
  const [showMP, setShowMP] = useState(false);
  const [showMPC, setShowMPC] = useState(false);
  const [mPwdSaving, setMPwdSaving] = useState(false);
  const [mPwdMsg, setMPwdMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  /* ── Member: referral code ── */
  const [mRef, setMRef] = useState("");
  const [mRefSaving, setMRefSaving] = useState(false);
  const [mRefMsg, setMRefMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  /* ── Member: status ── */
  const [mStatusSaving, setMStatusSaving] = useState(false);

  /* ── Member: change sponsor ── */
  const [sponsorSearch, setSponsorSearch] = useState("");
  const [sponsorResults, setSponsorResults] = useState<any[]>([]);
  const [sponsorSearching, setSponsorSearching] = useState(false);
  const [newSponsor, setNewSponsor] = useState<any | null>(null);
  const [sponsorSaving, setSponsorSaving] = useState(false);
  const [sponsorMsg, setSponsorMsg] = useState<{ type: "success" | "error" | "warn"; text: string } | null>(null);

  const searchSponsors = useCallback(async (q: string) => {
    if (!q.trim()) { setSponsorResults([]); return; }
    setSponsorSearching(true);
    try {
      const res = await customFetch(`/api/users?search=${encodeURIComponent(q)}&limit=8`);
      const data = await res.json();
      setSponsorResults(data.users ?? []);
    } catch { setSponsorResults([]); }
    finally { setSponsorSearching(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchSponsors(sponsorSearch), 350);
    return () => clearTimeout(t);
  }, [sponsorSearch, searchSponsors]);

  async function changeSponsor() {
    if (!selectedMember || !newSponsor) return;
    setSponsorSaving(true); setSponsorMsg(null);
    try {
      const res = await customFetch(`/api/users/${selectedMember.id}/change-sponsor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newSponsorId: newSponsor.id }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Failed");
      const result = await res.json();
      setSelectedMember((p: any) => ({ ...p, sponsorId: newSponsor.id }));
      setNewSponsor(null);
      setSponsorSearch("");
      setSponsorResults([]);
      setSponsorMsg({ type: "success", text: `Sponsor updated — ${selectedMember.firstName} is now under ${result.newSponsor.name}.` });
    } catch (e: any) { setSponsorMsg({ type: "error", text: e.message }); }
    finally { setSponsorSaving(false); }
  }

  /* ── Member: PV/GV ── */
  const [mPV, setMPV] = useState("");
  const [mGV, setMGV] = useState("");
  const [mVolSaving, setMVolSaving] = useState(false);
  const [mVolMsg, setMVolMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function selectMember(m: any) {
    setSelectedMember(m);
    setMemberResults([]);
    setMemberSearch("");
    setUName({ firstName: m.firstName, lastName: m.lastName });
    setMRef(m.referralCode ?? "");
    setMPV(String(m.pvAdjustment ?? 0));
    setMGV(String(m.gvAdjustment ?? 0));
    setUNameMsg(null); setMPwdMsg(null); setMRefMsg(null); setMVolMsg(null); setSponsorMsg(null);
    setMPwd({ next: "", confirm: "" });
    setNewSponsor(null); setSponsorSearch("");
  }

  async function saveMemberUsername() {
    if (!selectedMember) return;
    setUNameSaving(true); setUNameMsg(null);
    try {
      const res = await customFetch(`/api/users/${selectedMember.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: uName.firstName.trim(), lastName: uName.lastName.trim() }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Failed");
      const updated = await res.json();
      setSelectedMember((p: any) => ({ ...p, firstName: updated.firstName, lastName: updated.lastName }));
      setUNameMsg({ type: "success", text: "Username updated successfully." });
    } catch (e: any) { setUNameMsg({ type: "error", text: e.message }); }
    finally { setUNameSaving(false); }
  }

  async function resetMemberPassword() {
    setMPwdMsg(null);
    if (!mPwd.next || !mPwd.confirm) { setMPwdMsg({ type: "error", text: "Both fields are required." }); return; }
    if (mPwd.next.length < 8) { setMPwdMsg({ type: "error", text: "Password must be at least 8 characters." }); return; }
    if (mPwd.next !== mPwd.confirm) { setMPwdMsg({ type: "error", text: "Passwords do not match." }); return; }
    setMPwdSaving(true);
    try {
      const res = await customFetch(`/api/users/${selectedMember.id}/admin-reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: mPwd.next }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Failed");
      setMPwd({ next: "", confirm: "" });
      setMPwdMsg({ type: "success", text: "Password reset successfully." });
    } catch (e: any) { setMPwdMsg({ type: "error", text: e.message }); }
    finally { setMPwdSaving(false); }
  }

  async function saveMemberRefCode() {
    setMRefMsg(null);
    if (!mRef.trim()) { setMRefMsg({ type: "error", text: "Referral code cannot be empty." }); return; }
    setMRefSaving(true);
    try {
      const res = await customFetch(`/api/users/${selectedMember.id}/referral-code`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralCode: mRef.trim() }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Failed");
      const updated = await res.json();
      setSelectedMember((p: any) => ({ ...p, referralCode: updated.referralCode }));
      setMRefMsg({ type: "success", text: "Referral code updated." });
    } catch (e: any) { setMRefMsg({ type: "error", text: e.message }); }
    finally { setMRefSaving(false); }
  }

  async function toggleMemberStatus() {
    if (!selectedMember) return;
    const newStatus = selectedMember.status === "active" ? "inactive" : "active";
    setMStatusSaving(true);
    try {
      const res = await customFetch(`/api/users/${selectedMember.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Failed");
      setSelectedMember((p: any) => ({ ...p, status: newStatus }));
      toast({ title: `Account ${newStatus === "active" ? "activated" : "deactivated"}`, description: `${selectedMember.firstName}'s account is now ${newStatus}.` });
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setMStatusSaving(false); }
  }

  async function saveMemberVolume() {
    setMVolMsg(null);
    setMVolSaving(true);
    try {
      const res = await customFetch(`/api/users/${selectedMember.id}/volume-adjustment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pvAdjustment: parseInt(mPV) || 0, gvAdjustment: parseInt(mGV) || 0 }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Failed");
      const updated = await res.json();
      setSelectedMember((p: any) => ({ ...p, pvAdjustment: updated.pvAdjustment, gvAdjustment: updated.gvAdjustment }));
      setMVolMsg({ type: "success", text: `PCV set to ${updated.pvAdjustment} · GCV set to ${updated.gvAdjustment}` });
    } catch (e: any) { setMVolMsg({ type: "error", text: e.message }); }
    finally { setMVolSaving(false); }
  }

  /* ── Tab: Banking Info ───────────────────────────────────── */
  const [bank, setBank] = useState({
    bankName: "", bankAccountNumber: "", bankRoutingNumber: "",
    bankAccountType: "checking", payoutMethod: "bank",
    payoutPaypalEmail: "", payoutCashAppHandle: "",
  });
  const [bankSaving, setBankSaving] = useState(false);
  const [bankSaved, setBankSaved] = useState(false);

  useEffect(() => {
    if (!me) return;
    const m = me as any;
    setBank({
      bankName: m.bankName ?? "",
      bankAccountNumber: m.bankAccountNumber ?? "",
      bankRoutingNumber: m.bankRoutingNumber ?? "",
      bankAccountType: m.bankAccountType ?? "checking",
      payoutMethod: m.payoutMethod ?? "bank",
      payoutPaypalEmail: m.payoutPaypalEmail ?? "",
      payoutCashAppHandle: m.payoutCashAppHandle ?? "",
    });
  }, [me]);

  async function saveBank() {
    if (!me) return;
    setBankSaving(true);
    try {
      const res = await customFetch(`/api/users/${me.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName: bank.bankName.trim() || null,
          bankAccountNumber: bank.bankAccountNumber.trim() || null,
          bankRoutingNumber: bank.bankRoutingNumber.trim() || null,
          bankAccountType: bank.bankAccountType || null,
          payoutMethod: bank.payoutMethod,
          payoutPaypalEmail: bank.payoutPaypalEmail.trim() || null,
          payoutCashAppHandle: bank.payoutCashAppHandle.trim() || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Failed");
      await qc.invalidateQueries({ queryKey: ["getMe"] });
      setBankSaved(true);
      setTimeout(() => setBankSaved(false), 3000);
      toast({ title: "Banking info saved" });
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally { setBankSaving(false); }
  }

  /* ── loading ── */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "profile", label: "My Profile", icon: UserCircle },
    { key: "members", label: "Manage Members", icon: Users },
    { key: "banking", label: "Banking Info", icon: Banknote },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* ── Page header ── */}
      <div>
        <h1 className="text-2xl font-serif font-bold flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          Profile Management
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your admin account, member accounts, and payout banking details.
        </p>
      </div>

      {/* ── Identity banner ── */}
      <div className="bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] text-white rounded-xl p-5 flex items-center gap-4">
        {(me as any)?.avatar ? (
          <img src={(me as any).avatar} alt="Avatar" className="h-14 w-14 rounded-full object-cover ring-2 ring-primary/60 flex-shrink-0" />
        ) : (
          <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-lg font-bold ring-2 ring-primary/60 flex-shrink-0">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-bold truncate">{me?.firstName} {me?.lastName}</div>
          <div className="text-white/60 text-sm truncate">{me?.email}</div>
          <div className="flex flex-wrap gap-2 mt-1.5">
            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
              <ShieldCheck className="h-3 w-3 mr-1" />
              {me?.role ? roleLabel(me.role) : "Admin"}
            </Badge>
            {me?.referralCode && (
              <Badge variant="outline" className="text-white/70 border-white/20 text-xs font-mono">
                <Hash className="h-3 w-3 mr-1" />{me.referralCode}
              </Badge>
            )}
          </div>
        </div>
        <div className="hidden sm:flex flex-col items-end text-right flex-shrink-0 text-xs">
          <span className="text-white/40">Member since</span>
          <span className="text-white/70 mt-0.5">{memberSince}</span>
          <span className="text-white/30 mt-1">ID #{me?.id}</span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════ TAB: MY PROFILE ══════════════ */}
      {tab === "profile" && (
        <>
          <Section title="Personal Information" icon={UserCircle}>
            {profileSaved && <Alert type="success">Profile saved successfully!</Alert>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="First Name">
                <Input className="mt-1" value={profile.firstName} onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))} placeholder="First name" />
              </Field>
              <Field label="Last Name">
                <Input className="mt-1" value={profile.lastName} onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))} placeholder="Last name" />
              </Field>
            </div>
            <Field label="Email Address" hint="Email cannot be changed here — contact a super admin.">
              <div className="flex items-center gap-2 mt-1">
                <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Input value={me?.email ?? ""} disabled className="bg-muted cursor-not-allowed" />
              </div>
            </Field>
            <Field label="Phone Number">
              <div className="flex items-center gap-2 mt-1">
                <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="(555) 000-0000" type="tel" />
              </div>
            </Field>
            <Field label="Avatar URL" hint="Paste a direct image URL for your profile photo.">
              <div className="flex items-center gap-2 mt-1">
                <ImagePlus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Input value={profile.avatar} onChange={e => setProfile(p => ({ ...p, avatar: e.target.value }))} placeholder="https://example.com/photo.jpg" type="url" />
              </div>
              {profile.avatar && (
                <div className="mt-2 flex items-center gap-2">
                  <img src={profile.avatar} alt="preview" className="h-9 w-9 rounded-full object-cover border" onError={e => (e.currentTarget.style.display = "none")} />
                  <span className="text-xs text-muted-foreground">Preview</span>
                </div>
              )}
            </Field>
            <div className="flex justify-end pt-1">
              <Button onClick={saveProfile} disabled={profileSaving} className={`gap-2 ${profileSaved ? "bg-green-600 hover:bg-green-700" : ""}`}>
                {profileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : profileSaved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                {profileSaved ? "Saved!" : "Save Changes"}
              </Button>
            </div>
          </Section>

          <Section title="Change My Password" icon={KeyRound} sub="You must enter your current password to change it.">
            {pwdError && <Alert type="error">{pwdError}</Alert>}
            {pwdOk && <Alert type="success">Password changed successfully!</Alert>}
            <Field label="Current Password">
              <div className="mt-1">
                <PwdInput value={pwd.current} onChange={v => setPwd(p => ({ ...p, current: v }))} placeholder="Current password" show={showC} onToggle={() => setShowC(v => !v)} />
              </div>
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="New Password">
                <div className="mt-1">
                  <PwdInput value={pwd.next} onChange={v => setPwd(p => ({ ...p, next: v }))} placeholder="New password" show={showN} onToggle={() => setShowN(v => !v)} />
                </div>
              </Field>
              <Field label="Confirm New Password">
                <div className="mt-1">
                  <PwdInput value={pwd.confirm} onChange={v => setPwd(p => ({ ...p, confirm: v }))} placeholder="Confirm password" show={showCo} onToggle={() => setShowCo(v => !v)} />
                </div>
              </Field>
            </div>
            {pwd.next.length > 0 && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[8, 10, 14].map((t, i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${pwd.next.length >= t ? (i === 0 ? "bg-red-400" : i === 1 ? "bg-amber-400" : "bg-green-500") : "bg-muted"}`} />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {pwd.next.length < 8 ? "Too short" : pwd.next.length < 10 ? "Weak" : pwd.next.length < 14 ? "Moderate" : "Strong"}
                </p>
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={changePassword} disabled={pwdSaving} className="gap-2">
                {pwdSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                {pwdSaving ? "Changing…" : "Change Password"}
              </Button>
            </div>
          </Section>

          <Section title="Account Information" icon={ShieldCheck}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "Account ID", value: `#${me?.id ?? "—"}` },
                { label: "Role", value: me?.role ? roleLabel(me.role) : "—" },
                { label: "Status", value: (me as any)?.status ?? "active" },
                { label: "Member Since", value: memberSince },
                { label: "Referral Code", value: me?.referralCode ?? "—", mono: true },
              ].map(({ label, value, mono }) => (
                <div key={label} className="bg-muted/40 rounded-lg p-3 border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
                  <p className={`font-semibold text-sm break-all ${mono ? "font-mono" : ""}`}>{value}</p>
                </div>
              ))}
            </div>
          </Section>
        </>
      )}

      {/* ══════════════ TAB: MANAGE MEMBERS ══════════════ */}
      {tab === "members" && (
        <>
          {/* Search */}
          <Section title="Find a Member" icon={Search} sub="Search by name or email to select a member to manage.">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9 pr-9"
                placeholder="Type name or email…"
                value={memberSearch}
                onChange={e => setMemberSearch(e.target.value)}
              />
              {memberSearch && (
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setMemberSearch("")}>
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {memberSearching && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Searching…</div>}
            {memberResults.length > 0 && (
              <div className="border rounded-lg divide-y overflow-hidden">
                {memberResults.map(m => (
                  <button
                    key={m.id}
                    onClick={() => selectMember(m)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 text-left transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                      {m.firstName?.charAt(0)}{m.lastName?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{m.firstName} {m.lastName}</div>
                      <div className="text-xs text-muted-foreground truncate">{m.email}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant={m.status === "active" ? "default" : "secondary"} className="text-xs">{m.status}</Badge>
                      {m.isProMember && <Badge className="text-xs bg-amber-100 text-amber-800 border-amber-300">Pro</Badge>}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {memberSearch && !memberSearching && memberResults.length === 0 && (
              <p className="text-sm text-muted-foreground">No members found.</p>
            )}
          </Section>

          {/* Selected member panel */}
          {selectedMember ? (
            <>
              {/* Selected member banner */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">
                  {selectedMember.firstName?.charAt(0)}{selectedMember.lastName?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold">{selectedMember.firstName} {selectedMember.lastName}</div>
                  <div className="text-sm text-muted-foreground truncate">{selectedMember.email}</div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <Badge variant={selectedMember.status === "active" ? "default" : "destructive"} className="text-xs">
                      {selectedMember.status}
                    </Badge>
                    {selectedMember.isProMember && <Badge className="text-xs bg-amber-100 text-amber-800 border-amber-300">Pro Member</Badge>}
                    <Badge variant="outline" className="text-xs font-mono">{selectedMember.referralCode}</Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="flex-shrink-0 gap-1.5" onClick={() => setSelectedMember(null)}>
                  <X className="h-3.5 w-3.5" /> Clear
                </Button>
              </div>

              {/* ── Change Username ── */}
              <Section title="Change Username" icon={UserCircle} sub="Update this member's first and last name.">
                {uNameMsg && <Alert type={uNameMsg.type}>{uNameMsg.text}</Alert>}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="First Name">
                    <Input className="mt-1" value={uName.firstName} onChange={e => setUName(p => ({ ...p, firstName: e.target.value }))} />
                  </Field>
                  <Field label="Last Name">
                    <Input className="mt-1" value={uName.lastName} onChange={e => setUName(p => ({ ...p, lastName: e.target.value }))} />
                  </Field>
                </div>
                <div className="flex justify-end">
                  <Button onClick={saveMemberUsername} disabled={uNameSaving} className="gap-2">
                    {uNameSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Username
                  </Button>
                </div>
              </Section>

              {/* ── Reset Password ── */}
              <Section title="Reset Member Password" icon={KeyRound} sub="Set a new password for this member — no current password required.">
                {mPwdMsg && <Alert type={mPwdMsg.type}>{mPwdMsg.text}</Alert>}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="New Password">
                    <div className="mt-1">
                      <PwdInput value={mPwd.next} onChange={v => setMPwd(p => ({ ...p, next: v }))} placeholder="New password" show={showMP} onToggle={() => setShowMP(v => !v)} />
                    </div>
                  </Field>
                  <Field label="Confirm Password">
                    <div className="mt-1">
                      <PwdInput value={mPwd.confirm} onChange={v => setMPwd(p => ({ ...p, confirm: v }))} placeholder="Confirm password" show={showMPC} onToggle={() => setShowMPC(v => !v)} />
                    </div>
                  </Field>
                </div>
                <div className="flex justify-end">
                  <Button onClick={resetMemberPassword} disabled={mPwdSaving} variant="destructive" className="gap-2">
                    {mPwdSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Reset Password
                  </Button>
                </div>
              </Section>

              {/* ── Change Referral / Sponsor Code ── */}
              <Section title="Change Referral / Sponsor Code" icon={Hash} sub="Update the unique referral code for this member's affiliate link.">
                {mRefMsg && <Alert type={mRefMsg.type}>{mRefMsg.text}</Alert>}
                <Field label="Referral Code" hint="Must be 4–40 characters with no spaces. Hyphens are allowed.">
                  <Input className="mt-1 font-mono" value={mRef} onChange={e => setMRef(e.target.value)} placeholder="e.g. JOHN-SMITH" />
                </Field>
                <div className="flex justify-end">
                  <Button onClick={saveMemberRefCode} disabled={mRefSaving} className="gap-2">
                    {mRefSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Update Code
                  </Button>
                </div>
              </Section>

              {/* ── Change Upline Sponsor ── */}
              <Section title="Change Upline Sponsor" icon={Users} sub="Move this member under a different personal sponsor. Only allowed within 72 hours of joining with no downline.">
                {sponsorMsg && <Alert type={sponsorMsg.type}>{sponsorMsg.text}</Alert>}

                {/* Eligibility display */}
                {(() => {
                  const hoursElapsed = (Date.now() - new Date(selectedMember.createdAt).getTime()) / (1000 * 60 * 60);
                  const hoursLeft = Math.max(0, 72 - hoursElapsed);
                  const eligible = hoursElapsed <= 72;
                  return (
                    <div className={`rounded-lg border p-3 text-xs flex items-start gap-2 ${eligible ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
                      {eligible
                        ? <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5 text-green-600" />
                        : <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-red-600" />
                      }
                      <span>
                        {eligible
                          ? <><strong>Eligible for sponsor change.</strong> {Math.floor(hoursLeft)}h {Math.round((hoursLeft % 1) * 60)}m remaining in the 72-hour window.</>
                          : <><strong>Window closed.</strong> {selectedMember.firstName} joined {Math.floor(hoursElapsed)} hours ago — the 72-hour window has passed.</>
                        }
                      </span>
                    </div>
                  );
                })()}

                {/* New sponsor search */}
                <Field label="Search for New Sponsor" hint="Type the name or email of the member you want to reassign as this member's upline sponsor.">
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9 pr-9"
                      placeholder="Type name or email…"
                      value={sponsorSearch}
                      onChange={e => { setSponsorSearch(e.target.value); setNewSponsor(null); }}
                    />
                    {sponsorSearch && (
                      <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => { setSponsorSearch(""); setSponsorResults([]); }}>
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {sponsorSearching && <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1"><Loader2 className="h-3 w-3 animate-spin" /> Searching…</div>}
                  {sponsorResults.length > 0 && (
                    <div className="border rounded-lg divide-y overflow-hidden mt-1">
                      {sponsorResults.filter(r => r.id !== selectedMember.id).map(r => (
                        <button
                          key={r.id}
                          onClick={() => { setNewSponsor(r); setSponsorSearch(""); setSponsorResults([]); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 text-left text-sm transition-colors"
                        >
                          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                            {r.firstName?.charAt(0)}{r.lastName?.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-medium">{r.firstName} {r.lastName}</span>
                            <span className="text-xs text-muted-foreground ml-2 font-mono">{r.referralCode}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </Field>

                {/* Selected new sponsor preview */}
                {newSponsor && (
                  <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-primary/30 bg-primary/5">
                    <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs flex-shrink-0">
                      {newSponsor.firstName?.charAt(0)}{newSponsor.lastName?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{newSponsor.firstName} {newSponsor.lastName}</p>
                      <p className="text-xs text-muted-foreground font-mono">{newSponsor.referralCode} · #{newSponsor.id}</p>
                    </div>
                    <button onClick={() => setNewSponsor(null)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {newSponsor && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                    <strong>⚠ Confirm:</strong> This will move <strong>{selectedMember.firstName} {selectedMember.lastName}</strong> out from under their current sponsor and place them under <strong>{newSponsor.firstName} {newSponsor.lastName}</strong>. This action updates the genealogy tree and cannot be reversed after 72 hours.
                  </div>
                )}

                <div className="flex justify-end">
                  <Button onClick={changeSponsor} disabled={sponsorSaving || !newSponsor} className="gap-2">
                    {sponsorSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    {sponsorSaving ? "Moving…" : "Change Sponsor"}
                  </Button>
                </div>
              </Section>

              {/* ── Activate / Deactivate ── */}
              <Section title="Account Status" icon={ToggleRight} sub="Activate or deactivate this member's access to the platform.">
                <div className="flex items-center justify-between gap-4 p-4 rounded-lg border bg-muted/20">
                  <div>
                    <p className="font-medium text-sm">{selectedMember.firstName} {selectedMember.lastName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Current status: <strong className={selectedMember.status === "active" ? "text-green-600" : "text-red-600"}>{selectedMember.status}</strong>
                    </p>
                    {selectedMember.status !== "active" && (
                      <p className="text-xs text-amber-700 mt-1">⚠ Inactive members cannot log in or place orders.</p>
                    )}
                  </div>
                  <Button
                    onClick={toggleMemberStatus}
                    disabled={mStatusSaving}
                    variant={selectedMember.status === "active" ? "destructive" : "default"}
                    className="flex-shrink-0 gap-2 min-w-[140px]"
                  >
                    {mStatusSaving
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : selectedMember.status === "active"
                      ? <><ToggleLeft className="h-4 w-4" /> Deactivate</>
                      : <><ToggleRight className="h-4 w-4" /> Activate</>
                    }
                  </Button>
                </div>
              </Section>

              {/* ── PV / GV Adjustment ── */}
              <Section title="Adjust PCV / GCV" icon={SlidersHorizontal} sub="Set the manual volume adjustment for this member. PCV = Personal Commissionable Volume · GCV = Group Commissionable Volume. Use positive numbers to increase, negative to decrease.">
                {mVolMsg && <Alert type={mVolMsg.type}>{mVolMsg.text}</Alert>}

                <div className="grid grid-cols-2 gap-6 p-4 bg-muted/20 rounded-lg border">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Current PCV Adjustment</p>
                    <p className={`text-2xl font-bold font-mono ${(selectedMember.pvAdjustment ?? 0) < 0 ? "text-red-600" : "text-green-600"}`}>
                      {(selectedMember.pvAdjustment ?? 0) > 0 ? "+" : ""}{selectedMember.pvAdjustment ?? 0} PCV
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Current GCV Adjustment</p>
                    <p className={`text-2xl font-bold font-mono ${(selectedMember.gvAdjustment ?? 0) < 0 ? "text-red-600" : "text-green-600"}`}>
                      {(selectedMember.gvAdjustment ?? 0) > 0 ? "+" : ""}{selectedMember.gvAdjustment ?? 0} GCV
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="New PCV Adjustment" hint="Positive = increase PCV · Negative = decrease PCV">
                    <Input
                      className="mt-1 font-mono"
                      type="number"
                      value={mPV}
                      onChange={e => setMPV(e.target.value)}
                      placeholder="e.g. 50 or -30"
                    />
                  </Field>
                  <Field label="New GCV Adjustment" hint="Positive = increase GCV · Negative = decrease GCV">
                    <Input
                      className="mt-1 font-mono"
                      type="number"
                      value={mGV}
                      onChange={e => setMGV(e.target.value)}
                      placeholder="e.g. 100 or -50"
                    />
                  </Field>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                  <strong>Note:</strong> These adjustments are added on top of the member's actual earned volume. Entering a negative value will reduce their effective PCV or GCV accordingly.
                </div>

                <div className="flex justify-end">
                  <Button onClick={saveMemberVolume} disabled={mVolSaving} className="gap-2">
                    {mVolSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <SlidersHorizontal className="h-4 w-4" />}
                    Save Volume
                  </Button>
                </div>
              </Section>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No member selected</p>
              <p className="text-xs mt-1">Search above and click a member to manage their account.</p>
            </div>
          )}
        </>
      )}

      {/* ══════════════ TAB: BANKING INFO ══════════════ */}
      {tab === "banking" && (
        <>
          <Section title="Admin Banking Information" icon={Banknote} sub="Store your banking details for receiving payouts or transferring funds to members.">
            {bankSaved && <Alert type="success">Banking information saved successfully!</Alert>}

            <Field label="Preferred Payout Method">
              <Select value={bank.payoutMethod} onValueChange={v => setBank(p => ({ ...p, payoutMethod: v }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">Bank Transfer (ACH)</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="cash_app">Cash App</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {/* Bank Transfer fields */}
            {bank.payoutMethod === "bank" && (
              <div className="space-y-4 p-4 rounded-lg border bg-muted/20">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bank Account Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Bank Name">
                    <Input className="mt-1" value={bank.bankName} onChange={e => setBank(p => ({ ...p, bankName: e.target.value }))} placeholder="e.g. Chase, Wells Fargo" />
                  </Field>
                  <Field label="Account Type">
                    <Select value={bank.bankAccountType} onValueChange={v => setBank(p => ({ ...p, bankAccountType: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="checking">Checking</SelectItem>
                        <SelectItem value="savings">Savings</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <Field label="Account Number">
                  <Input className="mt-1 font-mono" value={bank.bankAccountNumber} onChange={e => setBank(p => ({ ...p, bankAccountNumber: e.target.value }))} placeholder="••••••••••••" type="password" />
                </Field>
                <Field label="Routing Number" hint="9-digit ABA routing number.">
                  <Input className="mt-1 font-mono" value={bank.bankRoutingNumber} onChange={e => setBank(p => ({ ...p, bankRoutingNumber: e.target.value }))} placeholder="9-digit routing number" maxLength={9} />
                </Field>
              </div>
            )}

            {/* PayPal fields */}
            {bank.payoutMethod === "paypal" && (
              <div className="space-y-4 p-4 rounded-lg border bg-blue-50/50">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">PayPal Account</p>
                <Field label="PayPal Email" hint="Funds will be sent to this PayPal email address.">
                  <Input className="mt-1" value={bank.payoutPaypalEmail} onChange={e => setBank(p => ({ ...p, payoutPaypalEmail: e.target.value }))} placeholder="you@paypal.com" type="email" />
                </Field>
              </div>
            )}

            {/* Cash App fields */}
            {bank.payoutMethod === "cash_app" && (
              <div className="space-y-4 p-4 rounded-lg border bg-green-50/50">
                <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Cash App Account</p>
                <Field label="Cash App $Cashtag" hint="Funds will be sent to this $cashtag.">
                  <Input className="mt-1 font-mono" value={bank.payoutCashAppHandle} onChange={e => setBank(p => ({ ...p, payoutCashAppHandle: e.target.value }))} placeholder="$YourCashtag" />
                </Field>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-600" />
              <span>Banking information is stored securely and used only for processing admin payouts and fund transfers within the NFGN system.</span>
            </div>

            <div className="flex justify-end">
              <Button onClick={saveBank} disabled={bankSaving} className={`gap-2 ${bankSaved ? "bg-green-600 hover:bg-green-700" : ""}`}>
                {bankSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : bankSaved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                {bankSaved ? "Saved!" : "Save Banking Info"}
              </Button>
            </div>
          </Section>

          <Section title="Transfer Funds to a Member" icon={RefreshCw} sub="Send funds directly to a member's NFGN e-wallet from the admin account.">
            <div className="text-center py-8 text-muted-foreground">
              <Banknote className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Fund transfers to members</p>
              <p className="text-xs mt-1 max-w-xs mx-auto">To send wallet credits to a member, use the <strong>Payouts</strong> section in the admin panel where you can issue manual payouts directly to any member's wallet.</p>
            </div>
          </Section>
        </>
      )}

    </div>
  );
}
