import { useState } from "react";
import { useListUsers, useUpgradeToPro } from "@workspace/api-client-react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Loader2, Star, Users, SlidersHorizontal, Link2, AlertCircle, CheckCircle2, KeyRound, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { roleLabel } from "@/lib/labels";
import { customFetch } from "@/lib/custom-fetch";

const roleColors: Record<string, string> = {
  super_admin: "destructive",
  admin: "destructive",
  store_admin: "secondary",
  pro_member: "default",
  affiliate: "secondary",
  customer: "outline",
};

export function UsersPage() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [page, setPage] = useState(1);
  const [adjustUser, setAdjustUser] = useState<any | null>(null);
  const [pvAdj, setPvAdj] = useState("0");
  const [gvAdj, setGvAdj] = useState("0");
  const [refCodeUser, setRefCodeUser] = useState<any | null>(null);
  const [newRefCode, setNewRefCode] = useState("");
  const [refCodeError, setRefCodeError] = useState("");
  const [pwdUser, setPwdUser] = useState<any | null>(null);
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const { toast } = useToast();

  const { data, isLoading, refetch } = useListUsers({ page, limit: 20, search: search || undefined, role: role !== "all" ? role : undefined });
  const upgradePro = useUpgradeToPro();

  const volumeAdjMutation = useMutation({
    mutationFn: async ({ userId, pv, gv }: { userId: number; pv: number; gv: number }) => {
      const res = await customFetch(`/api/users/${userId}/volume-adjustment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pvAdjustment: pv, gvAdjustment: gv }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (_, vars) => {
      toast({ title: `Volume adjustments saved for user.` });
      setAdjustUser(null);
      refetch();
    },
    onError: (e: any) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const pwdMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: number; newPassword: string }) => {
      const res = await customFetch(`/api/users/${userId}/admin-reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to reset password");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Password changed", description: "The member's password has been updated successfully." });
      closePwdModal();
    },
    onError: (e: any) => setPwdError(e.message),
  });

  function closePwdModal() {
    setPwdUser(null);
    setNewPwd("");
    setConfirmPwd("");
    setPwdError("");
    setShowNewPwd(false);
    setShowConfirmPwd(false);
  }

  function handlePwdSubmit() {
    if (newPwd.length < 8) { setPwdError("Password must be at least 8 characters."); return; }
    if (newPwd !== confirmPwd) { setPwdError("Passwords do not match."); return; }
    setPwdError("");
    pwdMutation.mutate({ userId: pwdUser.id, newPassword: newPwd });
  }

  const refCodeMutation = useMutation({
    mutationFn: async ({ userId, referralCode }: { userId: number; referralCode: string }) => {
      const res = await customFetch(`/api/users/${userId}/referral-code`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralCode }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to update referral code");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Referral code updated", description: `New code: ${data.referralCode}` });
      setRefCodeUser(null);
      setNewRefCode("");
      setRefCodeError("");
      refetch();
    },
    onError: (e: any) => {
      setRefCodeError(e.message);
    },
  });

  const users = data?.users ?? [];

  function handleUpgrade(userId: number, name: string) {
    upgradePro.mutate({ id: userId }, {
      onSuccess: () => { toast({ title: `${name} upgraded to Pro Member!` }); refetch(); },
      onError: (e: any) => toast({ variant: "destructive", title: "Error", description: e.message }),
    });
  }

  function openAdjust(user: any) {
    setAdjustUser(user);
    setPvAdj(String(user.pvAdjustment ?? 0));
    setGvAdj(String(user.gvAdjustment ?? 0));
  }

  function handleAdjustSubmit() {
    if (!adjustUser) return;
    const pv = parseInt(pvAdj);
    const gv = parseInt(gvAdj);
    if (isNaN(pv) || isNaN(gv)) {
      toast({ variant: "destructive", title: "Invalid values. Enter whole numbers." });
      return;
    }
    volumeAdjMutation.mutate({ userId: adjustUser.id, pv, gv });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold">Users</h1>
          <p className="text-muted-foreground">{data?.total ?? 0} total users</p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search users..." className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={role} onValueChange={v => { setRole(v); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="store_admin">Store Admin</SelectItem>
            <SelectItem value="pro_member">Pro Member</SelectItem>
            <SelectItem value="affiliate">Affiliate</SelectItem>
            <SelectItem value="customer">Member</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <>
              <div className="space-y-2">
                {users.map((user: any) => (
                  <div key={user.id} className="flex items-center gap-4 p-3 border rounded-lg hover:border-primary/30 transition-colors">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
                      {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">{user.firstName} {user.lastName}</span>
                        {user.isProMember && <Star className="h-3 w-3 text-primary fill-primary" />}
                        <Badge variant={(roleColors[user.role] ?? "secondary") as any} className="text-xs">{roleLabel(user.role)}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      <p className="text-xs text-muted-foreground">Ref: {user.referralCode} • Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                      {((user.pvAdjustment ?? 0) !== 0 || (user.gvAdjustment ?? 0) !== 0) && (
                        <p className="text-xs text-blue-700 font-medium mt-0.5">
                          Adj: PCV +{user.pvAdjustment ?? 0} / GCV +{user.gvAdjustment ?? 0}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-sm flex-shrink-0 flex flex-col items-end gap-1">
                      <Badge variant={user.status === "active" ? "default" : "destructive"}>{user.status}</Badge>
                      {!user.isProMember && ["customer", "affiliate"].includes(user.role) && (
                        <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => handleUpgrade(user.id, `${user.firstName} ${user.lastName}`)}>
                          <Star className="h-3 w-3 mr-1" /> Upgrade Pro
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="text-xs h-7 gap-1 border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => openAdjust(user)}>
                        <SlidersHorizontal className="h-3 w-3" /> Adjust PCV/GCV
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs h-7 gap-1 border-amber-200 text-amber-700 hover:bg-amber-50" onClick={() => { setRefCodeUser(user); setNewRefCode(user.referralCode ?? ""); setRefCodeError(""); }}>
                        <Link2 className="h-3 w-3" /> Change Ref Code
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs h-7 gap-1 border-red-200 text-red-700 hover:bg-red-50" onClick={() => { setPwdUser(user); setNewPwd(""); setConfirmPwd(""); setPwdError(""); }}>
                        <KeyRound className="h-3 w-3" /> Change Password
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {data && data.totalPages > 1 && (
                <div className="flex justify-between items-center mt-6 pt-4 border-t">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                  <span className="text-sm text-muted-foreground">Page {page} of {data.totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= data.totalPages}>Next</Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Change Referral Code Modal */}
      <Dialog open={!!refCodeUser} onOpenChange={() => { setRefCodeUser(null); setRefCodeError(""); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-amber-600" />
              Change Sponsor Referral Code
            </DialogTitle>
          </DialogHeader>
          {refCodeUser && (
            <div className="space-y-4">
              <div className="bg-muted/40 rounded-lg p-3 text-sm">
                <p className="font-bold">{refCodeUser.firstName} {refCodeUser.lastName}</p>
                <p className="text-muted-foreground text-xs">{refCodeUser.email}</p>
                <p className="text-xs mt-1">Current code: <span className="font-mono font-semibold text-amber-700">{refCodeUser.referralCode}</span></p>
              </div>

              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 space-y-1">
                <p className="font-semibold text-amber-800">Important</p>
                <ul className="list-disc list-inside space-y-0.5 leading-relaxed">
                  <li>The old code will stop working immediately after saving.</li>
                  <li>Any existing affiliate links using the old code will break.</li>
                  <li>Codes must be 4–40 characters. Spaces become hyphens.</li>
                  <li>Codes must be unique across all members.</li>
                </ul>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="newRefCode" className="text-sm font-semibold text-amber-700">New Referral Code</Label>
                <Input
                  id="newRefCode"
                  value={newRefCode}
                  onChange={e => { setNewRefCode(e.target.value); setRefCodeError(""); }}
                  placeholder="e.g. jmarcelino-NFGN99"
                  className={refCodeError ? "border-red-400 focus-visible:ring-red-400" : ""}
                  onKeyDown={e => { if (e.key === "Enter") refCodeMutation.mutate({ userId: refCodeUser.id, referralCode: newRefCode }); }}
                />
                {refCodeError && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {refCodeError}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground">Letters, numbers, and hyphens recommended. Case-sensitive.</p>
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => { setRefCodeUser(null); setRefCodeError(""); }}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={() => refCodeMutation.mutate({ userId: refCodeUser.id, referralCode: newRefCode })}
                  disabled={refCodeMutation.isPending || !newRefCode.trim() || newRefCode.trim() === refCodeUser.referralCode}
                >
                  {refCodeMutation.isPending
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <CheckCircle2 className="h-4 w-4" />}
                  Save New Code
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Change Password Modal */}
      <Dialog open={!!pwdUser} onOpenChange={closePwdModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-red-600" />
              Change Member Password
            </DialogTitle>
          </DialogHeader>
          {pwdUser && (
            <div className="space-y-4">
              <div className="bg-muted/40 rounded-lg p-3 text-sm">
                <p className="font-bold">{pwdUser.firstName} {pwdUser.lastName}</p>
                <p className="text-muted-foreground text-xs">{pwdUser.email}</p>
              </div>

              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-900 space-y-1">
                <p className="font-semibold text-red-800">Admin action — use responsibly</p>
                <ul className="list-disc list-inside space-y-0.5 leading-relaxed">
                  <li>The new password takes effect immediately.</li>
                  <li>The member will need to use this new password on their next login.</li>
                  <li>Minimum 8 characters required.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="newPwd" className="text-sm font-semibold text-red-700">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPwd"
                      type={showNewPwd ? "text" : "password"}
                      value={newPwd}
                      onChange={e => { setNewPwd(e.target.value); setPwdError(""); }}
                      placeholder="Min 8 characters"
                      className={`pr-9 ${pwdError ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                      onKeyDown={e => { if (e.key === "Enter") handlePwdSubmit(); }}
                    />
                    <button
                      type="button"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowNewPwd(v => !v)}
                      tabIndex={-1}
                    >
                      {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPwd" className="text-sm font-semibold text-red-700">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPwd"
                      type={showConfirmPwd ? "text" : "password"}
                      value={confirmPwd}
                      onChange={e => { setConfirmPwd(e.target.value); setPwdError(""); }}
                      placeholder="Re-enter new password"
                      className={`pr-9 ${pwdError ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                      onKeyDown={e => { if (e.key === "Enter") handlePwdSubmit(); }}
                    />
                    <button
                      type="button"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowConfirmPwd(v => !v)}
                      tabIndex={-1}
                    >
                      {showConfirmPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {pwdError && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" /> {pwdError}
                  </p>
                )}

                {confirmPwd && newPwd === confirmPwd && newPwd.length >= 8 && (
                  <p className="text-xs text-green-700 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Passwords match
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={closePwdModal}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 gap-1.5 bg-red-600 hover:bg-red-700 text-white"
                  onClick={handlePwdSubmit}
                  disabled={pwdMutation.isPending || !newPwd || !confirmPwd}
                >
                  {pwdMutation.isPending
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <KeyRound className="h-4 w-4" />}
                  Set New Password
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Volume Adjustment Modal */}
      <Dialog open={!!adjustUser} onOpenChange={() => setAdjustUser(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-blue-600" />
              Manual Volume Adjustment
            </DialogTitle>
          </DialogHeader>
          {adjustUser && (
            <div className="space-y-4">
              <div className="bg-muted/40 rounded-lg p-3 text-sm">
                <p className="font-bold">{adjustUser.firstName} {adjustUser.lastName}</p>
                <p className="text-muted-foreground text-xs">{adjustUser.email}</p>
                <p className="text-xs text-blue-700 font-medium mt-1">
                  Current adjustments — PCV: +{adjustUser.pvAdjustment ?? 0} / GCV: +{adjustUser.gvAdjustment ?? 0}
                </p>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                These values are added on top of the member's order-based volume for the current month's BPP qualification. Use positive or negative whole numbers.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="pvAdj" className="text-sm font-semibold text-blue-700">PCV Adjustment</Label>
                  <Input
                    id="pvAdj"
                    type="number"
                    step="1"
                    value={pvAdj}
                    onChange={e => setPvAdj(e.target.value)}
                    placeholder="0"
                  />
                  <p className="text-[10px] text-muted-foreground">Personal Commissionable Volume</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="gvAdj" className="text-sm font-semibold text-blue-700">GCV Adjustment</Label>
                  <Input
                    id="gvAdj"
                    type="number"
                    step="1"
                    value={gvAdj}
                    onChange={e => setGvAdj(e.target.value)}
                    placeholder="0"
                  />
                  <p className="text-[10px] text-muted-foreground">Group Commissionable Volume</p>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setAdjustUser(null)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 gap-1.5"
                  onClick={handleAdjustSubmit}
                  disabled={volumeAdjMutation.isPending}
                >
                  {volumeAdjMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SlidersHorizontal className="h-4 w-4" />}
                  Save Adjustments
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
