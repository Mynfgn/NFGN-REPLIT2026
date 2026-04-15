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

export function ProfilePage() {
  const { data: user, refetch } = useGetMe();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? "");
      setLastName(user.lastName ?? "");
      setPhone(user.phone ?? "");
    }
  }, [user]);

  async function handleSaveProfile() {
    if (!user) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await customFetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, phone }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSaveMsg({ type: "error", text: err.error ?? "Failed to save." });
      } else {
        setSaveMsg({ type: "success", text: "Profile updated successfully." });
        refetch();
      }
    } catch {
      setSaveMsg({ type: "error", text: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
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
    } finally {
      setPwSaving(false);
    }
  }

  const initials = `${user?.firstName?.charAt(0) ?? ""}${user?.lastName?.charAt(0) ?? ""}`;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-serif font-bold">Profile Management</h1>
        <p className="text-muted-foreground">Manage your account information and security settings</p>
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
                <h2 className="text-lg font-semibold">{user?.firstName} {user?.lastName}</h2>
                {user?.isProMember && (
                  <Badge className="gap-1 text-xs">
                    <Star className="h-3 w-3" />
                    Pro Member
                  </Badge>
                )}
                {user?.role && (
                  <Badge variant="outline" className="text-xs">{roleLabel(user.role)}</Badge>
                )}
              </div>
              <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                {user?.email}
              </div>
              <div className="flex items-center gap-1 mt-0.5 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral Info */}
      <Card className="border-primary/20 bg-primary/3">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Account Identifiers
          </CardTitle>
          <CardDescription>Share your referral code to earn commissions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Your Referral Code</Label>
            <div className="flex items-center gap-2 mt-1">
              <code className="text-sm font-mono bg-muted px-3 py-1.5 rounded border flex-1">{user?.referralCode ?? "—"}</code>
              {user?.referralCode && <CopyBtn text={user.referralCode} />}
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Your Referral Link</Label>
            <div className="flex items-center gap-2 mt-1">
              <code className="text-xs font-mono bg-muted px-3 py-1.5 rounded border flex-1 truncate">
                {window.location.origin}/join?ref={user?.referralCode}
              </code>
              {user?.referralCode && <CopyBtn text={`${window.location.origin}/join?ref=${user.referralCode}`} />}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserCircle className="h-4 w-4" />
            Personal Information
          </CardTitle>
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
              <Input value={user?.email ?? ""} disabled className="bg-muted" />
              <Badge variant="secondary" className="text-xs whitespace-nowrap">Read-only</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Contact support to change your email address.</p>
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" /> Phone Number
            </Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" type="tel" />
          </div>

          {saveMsg && (
            <div className={`flex items-center gap-2 text-sm ${saveMsg.type === "success" ? "text-green-600" : "text-destructive"}`}>
              {saveMsg.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {saveMsg.text}
            </div>
          )}

          <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
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

          {pwMsg && (
            <div className={`flex items-center gap-2 text-sm ${pwMsg.type === "success" ? "text-green-600" : "text-destructive"}`}>
              {pwMsg.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {pwMsg.text}
            </div>
          )}

          <Button onClick={handleChangePassword} disabled={pwSaving} variant="outline" className="gap-2">
            {pwSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
            Update Password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
