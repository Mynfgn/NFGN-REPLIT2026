import { useState, useEffect, useCallback } from "react";
import { customFetch } from "@/lib/custom-fetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Home, Car, Zap, Heart, Phone, Star, Settings, Users,
  DollarSign, TrendingUp, CheckCircle2, XCircle, Clock,
  AlertCircle, RefreshCw, Save, Play, ChevronDown, ChevronUp,
  Loader2, Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const FUND_ICONS: Record<string, React.ElementType> = {
  "rent-mortgage": Home,
  car: Car,
  utilities: Zap,
  medical: Heart,
  "phone-internet": Phone,
};

interface BppFund {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  payoutMode: string;
  payoutPercentage: string;
  flatAmount: string;
  gvRequirement: string;
  pvRequirement: string;
  maxCap: string;
  isActive: boolean;
  displayOrder: number;
  memberFacingCopy: string | null;
  disclaimerText: string | null;
}

interface BppSettings {
  id: number;
  isEnabled: boolean;
  autoApprove: boolean;
  autoPay: boolean;
  payoutDelayMessage: string;
  cycleClosingDay: number;
}

interface AdminStats {
  month: number;
  year: number;
  totalPaidThisMonth: number;
  totalQualifiers: number;
  pendingCount: number;
  approvedCount: number;
  deniedCount: number;
  fundStats: { fundId: number; fundName: string; qualifiers: number; totalPaid: number }[];
}

interface Qualification {
  id: number;
  memberId: number;
  memberName: string;
  memberEmail: string;
  fundId: number;
  fundName: string;
  qualificationMonth: number;
  qualificationYear: number;
  memberPv: number;
  memberGv: number;
  qualifiedAmount: number;
  status: string;
  paidAt: string | null;
  createdAt: string;
}

// ── Status badge helper ───────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending:  { label: "Pending",  variant: "secondary" },
    approved: { label: "Approved", variant: "default" },
    paid:     { label: "Paid",     variant: "default" },
    denied:   { label: "Denied",   variant: "destructive" },
    inactive: { label: "Inactive", variant: "outline" },
  };
  const cfg = map[status] ?? { label: status, variant: "outline" };
  return <Badge variant={cfg.variant} className="capitalize text-xs">{cfg.label}</Badge>;
}

// ── Single Fund Editor Card ───────────────────────────────────────────────────
function FundEditor({ fund, onSaved }: { fund: BppFund; onSaved: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...fund });

  function set(field: keyof typeof form, value: unknown) {
    setForm(f => ({ ...f, [field]: value }));
  }

  const pctVal = parseFloat(form.payoutPercentage as string);
  const gvVal = parseFloat(form.gvRequirement as string);
  const capVal = parseFloat(form.maxCap as string);
  const estimatedPct = !isNaN(pctVal) && !isNaN(gvVal)
    ? Math.min(gvVal * (pctVal / 100), !isNaN(capVal) ? capVal : Infinity)
    : null;
  const estimatedFlat = parseFloat(form.flatAmount as string);

  const isDirty = JSON.stringify(form) !== JSON.stringify(fund);
  const Icon = FUND_ICONS[fund.slug] ?? Star;

  async function save() {
    setSaving(true);
    try {
      const res = await customFetch(`/api/bpp/funds/${fund.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          payoutPercentage: parseFloat(form.payoutPercentage as string),
          flatAmount: parseFloat(form.flatAmount as string),
          gvRequirement: parseFloat(form.gvRequirement as string),
          pvRequirement: parseFloat(form.pvRequirement as string),
          maxCap: parseFloat(form.maxCap as string),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save");
      }
      toast({ title: `${fund.name} saved` });
      onSaved();
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className={`border-l-4 ${form.isActive ? "border-l-primary" : "border-l-muted"}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${form.isActive ? "bg-primary/10" : "bg-muted"}`}>
              <Icon className={`h-5 w-5 ${form.isActive ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <div>
              <p className="font-semibold">{form.name}</p>
              <p className="text-xs text-muted-foreground">Max cap: ${parseFloat(form.maxCap as string).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={form.isActive}
              onCheckedChange={v => set("isActive", v)}
            />
            <span className="text-xs text-muted-foreground">{form.isActive ? "Active" : "Inactive"}</span>
            <Button variant="ghost" size="sm" onClick={() => setOpen(o => !o)}>
              {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {open && (
        <CardContent className="space-y-5">
          <Separator />

          {/* Name & Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Fund Name</Label>
              <Input value={form.name} onChange={e => set("name", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Display Order</Label>
              <Input type="number" value={form.displayOrder} onChange={e => set("displayOrder", parseInt(e.target.value) || 0)} />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Description (admin)</Label>
            <Textarea rows={2} value={form.description ?? ""} onChange={e => set("description", e.target.value)} />
          </div>

          {/* Payout Mode */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              Payout Mode
              <span className="text-xs text-muted-foreground font-normal">(how the payout is calculated)</span>
            </Label>
            <Select value={form.payoutMode} onValueChange={v => set("payoutMode", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage-Based (% of GV, capped at Max Cap)</SelectItem>
                <SelectItem value="flat">Flat Amount (fixed payout when GV + PV met)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Qualification thresholds */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Required GV</Label>
              <Input type="number" min={0} value={form.gvRequirement} onChange={e => set("gvRequirement", e.target.value)} />
              <p className="text-xs text-muted-foreground">Group Volume</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Required PV</Label>
              <Input type="number" min={0} value={form.pvRequirement} onChange={e => set("pvRequirement", e.target.value)} />
              <p className="text-xs text-muted-foreground">Personal Volume</p>
            </div>
            {form.payoutMode === "percentage" ? (
              <div className="space-y-1">
                <Label className="text-xs">Payout %</Label>
                <Input type="number" min={0} max={100} step={0.1} value={form.payoutPercentage} onChange={e => set("payoutPercentage", e.target.value)} />
                <p className="text-xs text-muted-foreground">% of qualifying GV</p>
              </div>
            ) : (
              <div className="space-y-1">
                <Label className="text-xs">Flat Amount ($)</Label>
                <Input type="number" min={0} value={form.flatAmount} onChange={e => set("flatAmount", e.target.value)} />
                <p className="text-xs text-muted-foreground">Fixed payout</p>
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-xs">Max Cap ($)</Label>
              <Input type="number" min={0} value={form.maxCap} onChange={e => set("maxCap", e.target.value)} />
              <p className="text-xs text-muted-foreground">Upper limit</p>
            </div>
          </div>

          {/* Payout Preview */}
          <div className="rounded-lg bg-muted/50 border p-4 text-sm space-y-1">
            <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-2">Effective Payout Preview</p>
            {form.payoutMode === "percentage" ? (
              <>
                <p>At Required GV ({parseFloat(form.gvRequirement as string).toLocaleString()}): <strong>${estimatedPct !== null ? estimatedPct.toFixed(2) : "—"}</strong></p>
                <p className="text-xs text-muted-foreground">Formula: min(GV × {form.payoutPercentage}%, ${parseFloat(form.maxCap as string).toFixed(0)} cap)</p>
              </>
            ) : (
              <>
                <p>Fixed payout when qualified: <strong>${isNaN(estimatedFlat) ? "—" : estimatedFlat.toFixed(2)}</strong></p>
                <p className="text-xs text-muted-foreground">Requires GV ≥ {parseFloat(form.gvRequirement as string).toLocaleString()} and PV ≥ {form.pvRequirement}</p>
              </>
            )}
          </div>

          {/* Member-facing copy */}
          <div className="space-y-1">
            <Label>Member-Facing Description</Label>
            <Textarea rows={2} value={form.memberFacingCopy ?? ""} onChange={e => set("memberFacingCopy", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Disclaimer Text (shown to members)</Label>
            <Textarea rows={2} value={form.disclaimerText ?? ""} onChange={e => set("disclaimerText", e.target.value)} />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setForm({ ...fund })} disabled={!isDirty || saving}>
              Reset
            </Button>
            <Button size="sm" onClick={save} disabled={!isDirty || saving}>
              {saving ? <><RefreshCw className="h-4 w-4 mr-1.5 animate-spin" /> Saving…</> : <><Save className="h-4 w-4 mr-1.5" /> Save Fund</>}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export function AdminBPPPage() {
  const { toast } = useToast();
  const [funds, setFunds] = useState<BppFund[]>([]);
  const [settings, setSettings] = useState<BppSettings | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [qualifications, setQualifications] = useState<Qualification[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningQual, setRunningQual] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [qualPage, setQualPage] = useState(1);
  const [qualTotal, setQualTotal] = useState(0);
  const [qualFilter, setQualFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [fundsRes, settingsRes, statsRes] = await Promise.all([
        customFetch("/api/bpp/funds"),
        customFetch("/api/bpp/settings"),
        customFetch("/api/bpp/admin-stats"),
      ]);
      if (fundsRes.ok) setFunds(await fundsRes.json());
      if (settingsRes.ok) setSettings(await settingsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } finally {
      setLoading(false);
    }
  }, []);

  const loadQuals = useCallback(async () => {
    const params = new URLSearchParams({ page: String(qualPage), limit: "15" });
    if (qualFilter !== "all") params.set("status", qualFilter);
    const res = await customFetch(`/api/bpp/qualifications?${params}`);
    if (res.ok) {
      const data = await res.json();
      setQualifications(data.qualifications);
      setQualTotal(data.total);
    }
  }, [qualPage, qualFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadQuals(); }, [loadQuals]);

  async function saveSettings() {
    if (!settings) return;
    setSavingSettings(true);
    try {
      const res = await customFetch("/api/bpp/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      toast({ title: "BPP program settings saved" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSavingSettings(false);
    }
  }

  async function runQualification() {
    setRunningQual(true);
    try {
      const now = new Date();
      const res = await customFetch("/api/bpp/run-qualification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: now.getMonth() + 1, year: now.getFullYear() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to run qualification");
      toast({ title: "Qualification complete", description: `${data.newQualifications} new qualifications found.` });
      load();
      loadQuals();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setRunningQual(false);
    }
  }

  async function qualAction(id: number, action: "approve" | "deny" | "pay") {
    const res = await customFetch(`/api/bpp/qualifications/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      toast({ title: `Qualification ${action}d` });
      loadQuals();
      load();
    } else {
      const d = await res.json().catch(() => ({}));
      toast({ title: "Error", description: d.error ?? "Failed", variant: "destructive" });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const now = new Date();
  const monthLabel = MONTH_NAMES[now.getMonth()];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold">Bill Payer Program (BPP)</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Pro Consultant Commissions · Pro Members Only
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh
          </Button>
          <Button size="sm" onClick={runQualification} disabled={runningQual}>
            {runningQual
              ? <><RefreshCw className="h-4 w-4 mr-1.5 animate-spin" /> Running…</>
              : <><Play className="h-4 w-4 mr-1.5" /> Run Monthly Qualification</>}
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: `Total Paid — ${monthLabel}`, value: `$${stats.totalPaidThisMonth.toFixed(2)}`, icon: DollarSign, color: "text-green-600" },
            { label: "Total Qualifiers", value: stats.totalQualifiers, icon: Users, color: "text-blue-600" },
            { label: "Pending Approval", value: stats.pendingCount, icon: Clock, color: "text-yellow-600" },
            { label: "Approved", value: stats.approvedCount, icon: CheckCircle2, color: "text-green-600" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="pt-5 pb-4 flex items-center gap-3">
                <s.icon className={`h-8 w-8 ${s.color} flex-shrink-0`} />
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs defaultValue="funds">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="funds">Manage Funds</TabsTrigger>
          <TabsTrigger value="qualifications">Qualifications</TabsTrigger>
          <TabsTrigger value="settings">Program Settings</TabsTrigger>
        </TabsList>

        {/* ── Funds Tab ── */}
        <TabsContent value="funds" className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">Click the chevron on any fund card to expand and edit its configuration.</p>
          {funds.map(fund => (
            <FundEditor key={fund.id} fund={fund} onSaved={load} />
          ))}
        </TabsContent>

        {/* ── Qualifications Tab ── */}
        <TabsContent value="qualifications" className="space-y-4 mt-4">
          <div className="flex items-center gap-3">
            <Select value={qualFilter} onValueChange={v => { setQualFilter(v); setQualPage(1); }}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="denied">Denied</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">{qualTotal} records</span>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-4 py-3 font-medium">Member</th>
                    <th className="text-left px-4 py-3 font-medium">Fund</th>
                    <th className="text-left px-4 py-3 font-medium">Period</th>
                    <th className="text-right px-4 py-3 font-medium">GV</th>
                    <th className="text-right px-4 py-3 font-medium">PV</th>
                    <th className="text-right px-4 py-3 font-medium">Amount</th>
                    <th className="text-center px-4 py-3 font-medium">Status</th>
                    <th className="text-center px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {qualifications.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-muted-foreground">
                        No qualifications found. Run the monthly qualification to generate records.
                      </td>
                    </tr>
                  ) : qualifications.map(q => (
                    <tr key={q.id} className="border-b hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium">{q.memberName}</p>
                        <p className="text-xs text-muted-foreground">{q.memberEmail}</p>
                      </td>
                      <td className="px-4 py-3">{q.fundName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{MONTH_NAMES[q.qualificationMonth - 1]} {q.qualificationYear}</td>
                      <td className="px-4 py-3 text-right font-mono">{q.memberGv.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono">{q.memberPv.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-semibold text-green-600">${q.qualifiedAmount.toFixed(2)}</td>
                      <td className="px-4 py-3 text-center"><StatusBadge status={q.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {q.status === "pending" && (
                            <>
                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-green-700 border-green-200 hover:bg-green-50" onClick={() => qualAction(q.id, "approve")}>
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-red-700 border-red-200 hover:bg-red-50" onClick={() => qualAction(q.id, "deny")}>
                                <XCircle className="h-3 w-3 mr-1" /> Deny
                              </Button>
                            </>
                          )}
                          {q.status === "approved" && (
                            <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-blue-700 border-blue-200 hover:bg-blue-50" onClick={() => qualAction(q.id, "pay")}>
                              <DollarSign className="h-3 w-3 mr-1" /> Pay Now
                            </Button>
                          )}
                          {q.status === "paid" && (
                            <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Paid</span>
                          )}
                          {q.status === "denied" && (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {qualTotal > 15 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <span className="text-sm text-muted-foreground">Page {qualPage} of {Math.ceil(qualTotal / 15)}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setQualPage(p => Math.max(1, p - 1))} disabled={qualPage === 1}>Prev</Button>
                  <Button variant="outline" size="sm" onClick={() => setQualPage(p => p + 1)} disabled={qualPage >= Math.ceil(qualTotal / 15)}>Next</Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ── Settings Tab ── */}
        <TabsContent value="settings" className="space-y-4 mt-4">
          {settings && (
            <Card>
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" /> Program Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Enable/disable */}
                <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                  <div>
                    <p className="font-medium text-sm">Enable Bill Payer Program globally</p>
                    <p className="text-xs text-muted-foreground">When disabled, members cannot see or qualify for BPP bonuses.</p>
                  </div>
                  <Switch checked={settings.isEnabled} onCheckedChange={v => setSettings(s => s ? { ...s, isEnabled: v } : s)} />
                </div>

                <Separator />

                {/* Auto settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                    <div>
                      <p className="font-medium text-sm">Auto-Approve Qualifications</p>
                      <p className="text-xs text-muted-foreground">Automatically approve qualified members without manual review.</p>
                    </div>
                    <Switch checked={settings.autoApprove} onCheckedChange={v => setSettings(s => s ? { ...s, autoApprove: v } : s)} />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                    <div>
                      <p className="font-medium text-sm">Auto-Pay Approved Bonuses</p>
                      <p className="text-xs text-muted-foreground">Automatically deposit wallet bonus after approval (requires Auto-Approve on).</p>
                    </div>
                    <Switch checked={settings.autoPay} onCheckedChange={v => setSettings(s => s ? { ...s, autoPay: v } : s)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Monthly Cycle Closing Day</Label>
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      value={settings.cycleClosingDay}
                      onChange={e => setSettings(s => s ? { ...s, cycleClosingDay: parseInt(e.target.value) || 28 } : s)}
                    />
                    <p className="text-xs text-muted-foreground">Day of month when the qualification cycle closes.</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Payout Delay Message (shown to members)</Label>
                  <Textarea
                    rows={2}
                    value={settings.payoutDelayMessage}
                    onChange={e => setSettings(s => s ? { ...s, payoutDelayMessage: e.target.value } : s)}
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={saveSettings} disabled={savingSettings}>
                    {savingSettings ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Saving…</> : <><Save className="h-4 w-4 mr-2" /> Save Settings</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fund stats summary */}
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-primary" /> Fund Performance — {monthLabel} {stats.year}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.fundStats.map(f => (
                    <div key={f.fundId} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="text-sm font-medium">{f.fundName}</span>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span><strong className="text-foreground">{f.qualifiers}</strong> qualifiers</span>
                        <span className="font-medium text-green-600">${f.totalPaid.toFixed(2)} paid</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
