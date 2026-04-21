import { useState, useEffect } from "react";
import { useGetMe } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@/lib/custom-fetch";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  UserCircle, Mail, Phone, Save, KeyRound, Eye, EyeOff,
  CheckCircle2, Loader2, ShieldCheck, Calendar, Hash, ImagePlus,
  AlertCircle,
} from "lucide-react";
import { roleLabel } from "@/lib/labels";

function Section({ title, icon: Icon, children }: {
  title: string; icon: React.ElementType; children: React.ReactNode;
}) {
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

export function AdminProfilePage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: user, isLoading } = useGetMe();

  /* ── Profile form ─────────────────────────────────────────── */
  const [profile, setProfile] = useState({
    firstName: "", lastName: "", phone: "", avatar: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  /* ── Password form ────────────────────────────────────────── */
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdError, setPwdError] = useState("");

  /* Hydrate from API */
  useEffect(() => {
    if (!user) return;
    setProfile({
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      phone: user.phone ?? "",
      avatar: user.avatar ?? "",
    });
  }, [user]);

  /* Save profile */
  async function handleSaveProfile() {
    if (!user) return;
    setProfileSaving(true);
    try {
      const res = await customFetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: profile.firstName.trim(),
          lastName: profile.lastName.trim(),
          phone: profile.phone.trim() || null,
          avatar: profile.avatar.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to save profile");
      }
      await qc.invalidateQueries({ queryKey: ["getMe"] });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
      toast({ title: "Profile updated", description: "Your profile has been saved successfully." });
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setProfileSaving(false);
    }
  }

  /* Change password */
  async function handleChangePassword() {
    setPwdError("");
    if (!pwd.current || !pwd.next || !pwd.confirm) {
      setPwdError("All password fields are required.");
      return;
    }
    if (pwd.next.length < 8) {
      setPwdError("New password must be at least 8 characters.");
      return;
    }
    if (pwd.next !== pwd.confirm) {
      setPwdError("New passwords do not match.");
      return;
    }
    setPwdSaving(true);
    try {
      const res = await customFetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pwd.current, newPassword: pwd.next }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to change password");
      }
      setPwd({ current: "", next: "", confirm: "" });
      toast({ title: "Password changed", description: "Your new password is now active." });
    } catch (e: any) {
      setPwdError(e.message);
    } finally {
      setPwdSaving(false);
    }
  }

  /* Avatar initials */
  const initials = user
    ? `${user.firstName?.charAt(0) ?? ""}${user.lastName?.charAt(0) ?? ""}`.toUpperCase()
    : "?";

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "—";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* ── Page header ── */}
      <div>
        <h1 className="text-2xl font-serif font-bold flex items-center gap-2">
          <UserCircle className="h-6 w-6 text-primary" />
          Profile Management
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Update your admin account information and security settings.
        </p>
      </div>

      {/* ── Identity card ── */}
      <div className="bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] text-white rounded-xl p-6 flex items-center gap-5">
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt="Avatar"
            className="h-16 w-16 rounded-full object-cover ring-2 ring-primary/60 flex-shrink-0"
          />
        ) : (
          <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold ring-2 ring-primary/60 flex-shrink-0">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-lg font-bold truncate">{user?.firstName} {user?.lastName}</div>
          <div className="text-white/60 text-sm truncate">{user?.email}</div>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
              <ShieldCheck className="h-3 w-3 mr-1" />
              {user?.role ? roleLabel(user.role) : "Admin"}
            </Badge>
            {user?.referralCode && (
              <Badge variant="outline" className="text-white/70 border-white/20 text-xs font-mono">
                <Hash className="h-3 w-3 mr-1" />
                {user.referralCode}
              </Badge>
            )}
          </div>
        </div>
        <div className="hidden sm:flex flex-col items-end text-right flex-shrink-0">
          <div className="flex items-center gap-1 text-xs text-white/50">
            <Calendar className="h-3.5 w-3.5" />
            Member since
          </div>
          <div className="text-sm font-medium text-white/80 mt-0.5">{memberSince}</div>
          <div className="text-xs text-white/40 mt-1">ID #{user?.id}</div>
        </div>
      </div>

      {/* ── Personal Information ── */}
      <Section title="Personal Information" icon={UserCircle}>
        {profileSaved && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center gap-2 text-sm text-green-800">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600" />
            <span><strong>Profile saved successfully!</strong></span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="First Name">
            <Input
              className="mt-1"
              value={profile.firstName}
              onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))}
              placeholder="First name"
            />
          </Field>
          <Field label="Last Name">
            <Input
              className="mt-1"
              value={profile.lastName}
              onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))}
              placeholder="Last name"
            />
          </Field>
        </div>

        <Field label="Email Address" hint="Email cannot be changed here. Contact a super admin to update.">
          <div className="flex items-center gap-2 mt-1">
            <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Input value={user?.email ?? ""} disabled className="bg-muted cursor-not-allowed" />
          </div>
        </Field>

        <Field label="Phone Number" hint="Optional — used for account recovery and contact.">
          <div className="flex items-center gap-2 mt-1">
            <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Input
              value={profile.phone}
              onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
              placeholder="(555) 000-0000"
              type="tel"
            />
          </div>
        </Field>

        <Field label="Avatar URL" hint="Paste a direct image URL to set your profile photo.">
          <div className="flex items-center gap-2 mt-1">
            <ImagePlus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Input
              value={profile.avatar}
              onChange={e => setProfile(p => ({ ...p, avatar: e.target.value }))}
              placeholder="https://example.com/photo.jpg"
              type="url"
            />
          </div>
          {profile.avatar && (
            <div className="mt-2 flex items-center gap-3">
              <img
                src={profile.avatar}
                alt="Avatar preview"
                className="h-10 w-10 rounded-full object-cover border"
                onError={e => (e.currentTarget.style.display = "none")}
              />
              <span className="text-xs text-muted-foreground">Avatar preview</span>
            </div>
          )}
        </Field>

        <div className="flex justify-end pt-2">
          <Button
            onClick={handleSaveProfile}
            disabled={profileSaving}
            className={`gap-2 transition-all ${profileSaved ? "bg-green-600 hover:bg-green-700" : ""}`}
          >
            {profileSaving
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : profileSaved
              ? <CheckCircle2 className="h-4 w-4" />
              : <Save className="h-4 w-4" />
            }
            {profileSaved ? "Saved!" : "Save Changes"}
          </Button>
        </div>
      </Section>

      {/* ── Change Password ── */}
      <Section title="Change Password" icon={KeyRound}>
        <p className="text-sm text-muted-foreground -mt-2">
          Choose a strong password at least 8 characters long.
        </p>

        {pwdError && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-2 text-sm text-red-800">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-600" />
            <span>{pwdError}</span>
          </div>
        )}

        <Field label="Current Password">
          <div className="flex items-center gap-2 mt-1">
            <div className="relative flex-1">
              <Input
                type={showCurrent ? "text" : "password"}
                value={pwd.current}
                onChange={e => setPwd(p => ({ ...p, current: e.target.value }))}
                placeholder="Enter current password"
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowCurrent(v => !v)}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="New Password">
            <div className="relative mt-1">
              <Input
                type={showNext ? "text" : "password"}
                value={pwd.next}
                onChange={e => setPwd(p => ({ ...p, next: e.target.value }))}
                placeholder="New password"
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowNext(v => !v)}
              >
                {showNext ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
          <Field label="Confirm New Password">
            <div className="relative mt-1">
              <Input
                type={showConfirm ? "text" : "password"}
                value={pwd.confirm}
                onChange={e => setPwd(p => ({ ...p, confirm: e.target.value }))}
                placeholder="Confirm new password"
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowConfirm(v => !v)}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
        </div>

        {/* Strength indicator */}
        {pwd.next.length > 0 && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[8, 10, 14].map((threshold, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    pwd.next.length >= threshold
                      ? i === 0 ? "bg-red-400" : i === 1 ? "bg-amber-400" : "bg-green-500"
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {pwd.next.length < 8
                ? "Too short — minimum 8 characters"
                : pwd.next.length < 10
                ? "Weak — consider adding numbers or symbols"
                : pwd.next.length < 14
                ? "Moderate — try making it longer"
                : "Strong password"}
            </p>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button
            onClick={handleChangePassword}
            disabled={pwdSaving}
            className="gap-2"
          >
            {pwdSaving
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <KeyRound className="h-4 w-4" />
            }
            {pwdSaving ? "Changing…" : "Change Password"}
          </Button>
        </div>
      </Section>

      {/* ── Account Info (read-only) ── */}
      <Section title="Account Information" icon={ShieldCheck}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "Account ID", value: `#${user?.id ?? "—"}` },
            { label: "Role", value: user?.role ? roleLabel(user.role) : "—" },
            { label: "Status", value: user?.status ?? "active" },
            { label: "Member Since", value: memberSince },
            { label: "Referral Code", value: user?.referralCode ?? "—", mono: true },
          ].map(({ label, value, mono }) => (
            <div key={label} className="bg-muted/40 rounded-lg p-3 border">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
              <p className={`font-semibold text-sm ${mono ? "font-mono" : ""}`}>{value}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground pt-1">
          Role, account ID, and referral code are managed by the system. Contact a super admin for changes.
        </p>
      </Section>

    </div>
  );
}
