import { useState, useEffect, useCallback } from "react";
import { customFetch } from "@/lib/custom-fetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Tag, Plus, Trash2, RefreshCw, Save, CheckCircle2,
  XCircle, Loader2, AlertCircle, BarChart2, Calendar,
  ToggleLeft, ToggleRight, Copy, Percent, DollarSign,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PromoCode {
  id: number;
  code: string;
  discountType: "percentage" | "flat";
  discountValue: number;
  minOrderAmount: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

const EMPTY_FORM = {
  code: "",
  discountType: "percentage" as "percentage" | "flat",
  discountValue: "",
  minOrderAmount: "",
  maxUses: "",
  expiresAt: "",
};

function StatusBadge({ isActive, expired, maxed }: { isActive: boolean; expired: boolean; maxed: boolean }) {
  if (!isActive) return <Badge variant="secondary" className="text-xs">Disabled</Badge>;
  if (expired) return <Badge variant="destructive" className="text-xs">Expired</Badge>;
  if (maxed) return <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">Limit Reached</Badge>;
  return <Badge className="text-xs bg-green-600 hover:bg-green-700">Active</Badge>;
}

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const prefix = ["NFGN", "SAVE", "DEAL", "PROMO", "DISC"][Math.floor(Math.random() * 5)];
  const suffix = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${prefix}${suffix}`;
}

export function AdminPromoCodesPage() {
  const { toast } = useToast();
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  function setField<K extends keyof typeof EMPTY_FORM>(key: K, val: string) {
    setForm(f => ({ ...f, [key]: val }));
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customFetch("/api/promos");
      if (res.ok) setPromos(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createPromo() {
    const value = parseFloat(form.discountValue);
    if (!form.code.trim()) { toast({ title: "Code is required", variant: "destructive" }); return; }
    if (isNaN(value) || value <= 0) { toast({ title: "Enter a valid discount value", variant: "destructive" }); return; }
    if (form.discountType === "percentage" && value > 100) { toast({ title: "Percentage cannot exceed 100%", variant: "destructive" }); return; }

    setSaving(true);
    try {
      const res = await customFetch("/api/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code.trim().toUpperCase(),
          discountType: form.discountType,
          discountValue: value,
          minOrderAmount: parseFloat(form.minOrderAmount) || 0,
          maxUses: form.maxUses ? parseInt(form.maxUses) : null,
          expiresAt: form.expiresAt || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create promo code");
      toast({ title: `Promo code "${data.code}" created` });
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(promo: PromoCode) {
    setTogglingId(promo.id);
    try {
      const res = await customFetch(`/api/promos/${promo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !promo.isActive }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setPromos(ps => ps.map(p => p.id === promo.id ? { ...p, isActive: !p.isActive } : p));
      toast({ title: `"${promo.code}" ${!promo.isActive ? "activated" : "disabled"}` });
    } catch {
      toast({ title: "Failed to toggle promo code", variant: "destructive" });
    } finally {
      setTogglingId(null);
    }
  }

  async function deletePromo(promo: PromoCode) {
    if (!confirm(`Delete promo code "${promo.code}"? This cannot be undone.`)) return;
    setDeletingId(promo.id);
    try {
      const res = await customFetch(`/api/promos/${promo.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setPromos(ps => ps.filter(p => p.id !== promo.id));
      toast({ title: `"${promo.code}" deleted` });
    } catch {
      toast({ title: "Failed to delete promo code", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code).then(() => toast({ title: "Copied to clipboard" }));
  }

  const now = new Date();
  const activeCount = promos.filter(p => p.isActive && (!p.expiresAt || new Date(p.expiresAt) > now)).length;
  const totalUses = promos.reduce((s, p) => s + p.usedCount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold flex items-center gap-2">
            <Tag className="h-7 w-7 text-primary" />
            Promo Codes
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create and manage discount codes for the storefront checkout.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button size="sm" onClick={() => setShowForm(s => !s)}>
            <Plus className="h-4 w-4 mr-1.5" /> {showForm ? "Cancel" : "New Code"}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Codes", value: promos.length, icon: Tag, color: "text-primary" },
          { label: "Active Codes", value: activeCount, icon: CheckCircle2, color: "text-green-600" },
          { label: "Disabled / Expired", value: promos.length - activeCount, icon: XCircle, color: "text-muted-foreground" },
          { label: "Total Uses", value: totalUses, icon: BarChart2, color: "text-blue-600" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <s.icon className={`h-7 w-7 ${s.color} flex-shrink-0`} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Form */}
      {showForm && (
        <Card className="border-primary/30 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-base flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" /> Create New Promo Code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Code */}
            <div className="space-y-1">
              <Label>Promo Code</Label>
              <div className="flex gap-2">
                <Input
                  value={form.code}
                  onChange={e => setField("code", e.target.value.toUpperCase())}
                  placeholder="e.g. SAVE20, NFGNSUMMER"
                  className="font-mono tracking-widest uppercase"
                  maxLength={20}
                />
                <Button type="button" variant="outline" onClick={() => setField("code", generateCode())}>
                  Generate
                </Button>
              </div>
            </div>

            {/* Discount Type + Value */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Discount Type</Label>
                <Select value={form.discountType} onValueChange={v => setField("discountType", v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">
                      <div className="flex items-center gap-2"><Percent className="h-4 w-4" /> Percentage Off (%)</div>
                    </SelectItem>
                    <SelectItem value="flat">
                      <div className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Flat Dollar Off ($)</div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Discount Value</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    {form.discountType === "percentage" ? "%" : "$"}
                  </span>
                  <Input
                    type="number"
                    min={0}
                    max={form.discountType === "percentage" ? 100 : undefined}
                    step={form.discountType === "percentage" ? 1 : 0.01}
                    value={form.discountValue}
                    onChange={e => setField("discountValue", e.target.value)}
                    className="pl-8"
                    placeholder={form.discountType === "percentage" ? "e.g. 20" : "e.g. 15.00"}
                  />
                </div>
              </div>
            </div>

            {/* Constraints */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Min Order Amount ($)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.minOrderAmount}
                  onChange={e => setField("minOrderAmount", e.target.value)}
                  placeholder="0.00 (no minimum)"
                />
                <p className="text-xs text-muted-foreground">Leave blank for no minimum</p>
              </div>
              <div className="space-y-1">
                <Label>Max Uses</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.maxUses}
                  onChange={e => setField("maxUses", e.target.value)}
                  placeholder="Unlimited"
                />
                <p className="text-xs text-muted-foreground">Leave blank for unlimited</p>
              </div>
              <div className="space-y-1">
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={form.expiresAt}
                  onChange={e => setField("expiresAt", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Leave blank for no expiry</p>
              </div>
            </div>

            {/* Preview */}
            {form.code && form.discountValue && (
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-sm flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary flex-shrink-0" />
                <span>
                  Code <strong className="font-mono">{form.code}</strong> gives{" "}
                  <strong>
                    {form.discountType === "percentage"
                      ? `${form.discountValue}% off`
                      : `$${parseFloat(form.discountValue || "0").toFixed(2)} off`}
                  </strong>
                  {form.minOrderAmount && parseFloat(form.minOrderAmount) > 0
                    ? ` on orders $${parseFloat(form.minOrderAmount).toFixed(2)}+`
                    : " on any order"}
                  {form.maxUses ? ` · max ${form.maxUses} uses` : ""}
                  {form.expiresAt ? ` · expires ${new Date(form.expiresAt).toLocaleDateString()}` : ""}
                </span>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setForm(EMPTY_FORM); setShowForm(false); }}>
                Cancel
              </Button>
              <Button onClick={createPromo} disabled={saving}>
                {saving ? <><RefreshCw className="h-4 w-4 mr-1.5 animate-spin" /> Creating…</> : <><Save className="h-4 w-4 mr-1.5" /> Create Code</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Promo Code Table */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : promos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <Tag className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-sm">No promo codes yet</p>
              <p className="text-xs text-muted-foreground mt-1">Create your first promo code to start offering discounts.</p>
            </div>
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Create First Code
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-3 font-medium">Code</th>
                  <th className="text-left px-4 py-3 font-medium">Discount</th>
                  <th className="text-left px-4 py-3 font-medium">Min Order</th>
                  <th className="text-center px-4 py-3 font-medium">Uses</th>
                  <th className="text-left px-4 py-3 font-medium">Expires</th>
                  <th className="text-center px-4 py-3 font-medium">Status</th>
                  <th className="text-center px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {promos.map(promo => {
                  const expired = !!promo.expiresAt && new Date(promo.expiresAt) < now;
                  const maxed = promo.maxUses !== null && promo.usedCount >= promo.maxUses;

                  return (
                    <tr key={promo.id} className="border-b hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-base tracking-wider">{promo.code}</span>
                          <button
                            onClick={() => copyCode(promo.code)}
                            className="text-muted-foreground hover:text-primary transition-colors"
                            title="Copy code"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Created {new Date(promo.createdAt).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {promo.discountType === "percentage"
                            ? <><Percent className="h-3.5 w-3.5 text-green-600" /><span className="font-bold text-green-600">{promo.discountValue}% off</span></>
                            : <><DollarSign className="h-3.5 w-3.5 text-green-600" /><span className="font-bold text-green-600">${promo.discountValue.toFixed(2)} off</span></>
                          }
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {promo.minOrderAmount > 0 ? `$${promo.minOrderAmount.toFixed(2)}+` : <span className="text-xs italic">None</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-medium ${maxed ? "text-amber-600" : ""}`}>{promo.usedCount}</span>
                        {promo.maxUses !== null && (
                          <span className="text-muted-foreground text-xs"> / {promo.maxUses}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {promo.expiresAt ? (
                          <div className={`flex items-center gap-1 text-xs ${expired ? "text-destructive" : "text-muted-foreground"}`}>
                            <Calendar className="h-3 w-3" />
                            {new Date(promo.expiresAt).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Never</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge isActive={promo.isActive} expired={expired} maxed={maxed} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {/* Toggle Active */}
                          <button
                            onClick={() => toggleActive(promo)}
                            disabled={togglingId === promo.id}
                            title={promo.isActive ? "Disable code" : "Enable code"}
                            className={`flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors ${
                              promo.isActive
                                ? "text-amber-700 border-amber-200 hover:bg-amber-50"
                                : "text-green-700 border-green-200 hover:bg-green-50"
                            }`}
                          >
                            {togglingId === promo.id
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : promo.isActive
                              ? <><ToggleLeft className="h-3.5 w-3.5" /> Disable</>
                              : <><ToggleRight className="h-3.5 w-3.5" /> Enable</>
                            }
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => deletePromo(promo)}
                            disabled={deletingId === promo.id}
                            title="Delete code"
                            className="flex items-center gap-1 text-xs px-2 py-1 rounded border text-red-700 border-red-200 hover:bg-red-50 transition-colors"
                          >
                            {deletingId === promo.id
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : <><Trash2 className="h-3.5 w-3.5" /> Delete</>
                            }
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* How it works callout */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="pt-5 pb-4">
          <div className="flex gap-3 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-primary" />
            <div className="space-y-1.5">
              <p className="font-medium text-foreground">How promo codes work</p>
              <ul className="space-y-1 list-disc list-inside text-xs">
                <li>Codes are applied at checkout. Customers enter the code in the promo code field before placing their order.</li>
                <li><strong>Percentage</strong> codes deduct a % of the cart subtotal. <strong>Flat</strong> codes deduct a fixed dollar amount.</li>
                <li>Expired or usage-limit-reached codes are automatically rejected at checkout.</li>
                <li>Use the <strong>Enable / Disable</strong> toggle to pause a code without deleting it.</li>
                <li>Codes are case-insensitive — customers can type them in any case.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
