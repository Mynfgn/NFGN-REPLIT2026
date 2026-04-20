import { useState, useEffect } from "react";
import { customFetch } from "@/lib/custom-fetch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Save, Plus, Trash2, CheckCircle2, DollarSign,
  Users, TrendingUp, Info, Percent,
} from "lucide-react";
import { toast } from "sonner";

interface CommissionLevel {
  level: number;
  rate: number;
}

const DEFAULT_PRC = [
  { level: 1, rate: 12 },
  { level: 2, rate: 22 },
  { level: 3, rate: 8 },
  { level: 4, rate: 7 },
  { level: 5, rate: 7 },
];

const DEFAULT_SALES = [
  { level: 1, rate: 12 },
  { level: 2, rate: 24 },
  { level: 3, rate: 8 },
  { level: 4, rate: 7 },
  { level: 5, rate: 6 },
  { level: 6, rate: 5 },
  { level: 7, rate: 4 },
  { level: 8, rate: 3 },
  { level: 9, rate: 2 },
];

function LevelEditor({
  title,
  description,
  color,
  icon: Icon,
  levels,
  onChange,
}: {
  title: string;
  description: string;
  color: string;
  icon: React.ElementType;
  levels: CommissionLevel[];
  onChange: (levels: CommissionLevel[]) => void;
}) {
  function updateRate(idx: number, val: string) {
    const next = levels.map((l, i) => i === idx ? { ...l, rate: parseFloat(val) || 0 } : l);
    onChange(next);
  }

  function addLevel() {
    onChange([...levels, { level: levels.length + 1, rate: 5 }]);
  }

  function removeLevel(idx: number) {
    if (levels.length <= 1) { toast.error("Must have at least 1 level."); return; }
    onChange(
      levels
        .filter((_, i) => i !== idx)
        .map((l, i) => ({ ...l, level: i + 1 }))
    );
  }

  const totalPaid = levels.reduce((s, l) => s + l.rate, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${color}`} />
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{description}</CardDescription>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total payout</p>
            <p className={`text-lg font-bold ${color}`}>{totalPaid.toFixed(1)}%</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {levels.map((lvl, idx) => (
            <div key={idx} className="relative flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                {lvl.level}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Level {lvl.level} Rate</p>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={lvl.rate}
                    onChange={e => updateRate(idx, e.target.value)}
                    className="h-8 text-right font-mono text-sm w-20"
                  />
                  <span className="text-muted-foreground text-sm">%</span>
                </div>
              </div>
              <button
                onClick={() => removeLevel(idx)}
                className="absolute top-1.5 right-1.5 h-5 w-5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-colors"
                title="Remove level"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}

          <button
            onClick={addLevel}
            className="flex flex-col items-center justify-center gap-1 p-3 rounded-lg border-2 border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors min-h-[80px]"
          >
            <Plus className="h-4 w-4" />
            <span className="text-xs">Add Level {levels.length + 1}</span>
          </button>
        </div>

        <div className="bg-muted/40 rounded-lg p-3 text-xs flex items-start gap-2">
          <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-muted-foreground">
            <strong>{levels.length} level{levels.length !== 1 ? "s" : ""}</strong> configured.
            Members earn from <strong>Level 1 through Level {levels.length}</strong> of their upline genealogy tree.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function CompensationSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const [referralRate, setReferralRate] = useState(20);
  const [prcLevels, setPrcLevels] = useState<CommissionLevel[]>(DEFAULT_PRC);
  const [salesLevels, setSalesLevels] = useState<CommissionLevel[]>(DEFAULT_SALES);

  useEffect(() => {
    customFetch("/api/commission-rules")
      .then(r => r.json())
      .then((data: any) => {
        setReferralRate(data.referralRate ?? 20);
        setPrcLevels(Array.isArray(data.prcLevels) && data.prcLevels.length > 0 ? data.prcLevels : DEFAULT_PRC);
        setSalesLevels(Array.isArray(data.salesLevels) && data.salesLevels.length > 0 ? data.salesLevels : DEFAULT_SALES);
      })
      .catch(() => toast.error("Failed to load compensation settings"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (prcLevels.some(l => l.rate < 0 || l.rate > 100)) {
      toast.error("PMRC rates must be between 0% and 100%");
      return;
    }
    if (salesLevels.some(l => l.rate < 0 || l.rate > 100)) {
      toast.error("PASC rates must be between 0% and 100%");
      return;
    }
    setSaving(true);
    try {
      const res = await customFetch("/api/commission-rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralRate, prcLevels, salesLevels }),
      });
      if (res.ok) {
        toast.success("Compensation settings saved!");
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 3000);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Failed to save settings");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold flex items-center gap-2">
            <Percent className="h-6 w-6 text-primary" />
            Pro Compensation Settings
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure the number of levels and percentage rates for all three commission types.
            Changes take effect immediately for new commissions.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className={`gap-2 flex-shrink-0 transition-all ${justSaved ? "bg-green-600 hover:bg-green-700" : ""}`}
        >
          {saving
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : justSaved
            ? <CheckCircle2 className="h-4 w-4" />
            : <Save className="h-4 w-4" />
          }
          {justSaved ? "Saved!" : "Save Settings"}
        </Button>
      </div>

      {justSaved && (
        <div className="bg-green-50 border border-green-300 rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-green-900">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600" />
          <span><strong>Compensation settings updated!</strong> New commission rates are now active.</span>
        </div>
      )}

      {/* Commission Type Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Referral Commission",
            desc: "All Members · Direct sponsor earns on every purchase",
            value: `${referralRate}%`,
            color: "text-blue-600",
            bg: "bg-blue-50 border-blue-200",
          },
          {
            label: "Products & Services Commissions (PASC)",
            desc: `Pro Members Only · ${salesLevels.length} level${salesLevels.length !== 1 ? "s" : ""} · Regular product purchases`,
            value: `${salesLevels.length} Level${salesLevels.length !== 1 ? "s" : ""}`,
            color: "text-green-600",
            bg: "bg-green-50 border-green-200",
          },
          {
            label: "Pro Member Registration Commission (PMRC)",
            desc: `Pro Members Only · ${prcLevels.length} level${prcLevels.length !== 1 ? "s" : ""} · Pro Package purchases only`,
            value: `${prcLevels.length} Level${prcLevels.length !== 1 ? "s" : ""}`,
            color: "text-amber-600",
            bg: "bg-amber-50 border-amber-200",
          },
        ].map(item => (
          <div key={item.label} className={`rounded-xl border p-4 ${item.bg}`}>
            <p className={`font-bold text-base ${item.color}`}>{item.value}</p>
            <p className="font-medium text-sm mt-1">{item.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Referral Commission Rate */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle className="text-base">Referral Commission Rate</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Paid to the direct sponsor on every purchase made by a personally enrolled member. Applies to all member types.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 max-w-xs">
            <Label className="text-sm font-medium whitespace-nowrap">Rate (%)</Label>
            <div className="flex items-center gap-2 flex-1">
              <Input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={referralRate}
                onChange={e => setReferralRate(parseFloat(e.target.value) || 0)}
                className="font-mono text-right max-w-[100px]"
              />
              <span className="text-muted-foreground">%</span>
            </div>
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 border">
              All Members
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Example: A member buys a $100 product → their sponsor earns <strong>${referralRate.toFixed(2)}</strong>.
          </p>
        </CardContent>
      </Card>

      {/* Sales Commission Levels */}
      <LevelEditor
        title="Products & Services Commission — PASC (Uni-Level)"
        description="Earned by Pro Members on regular product purchases within their downline genealogy tree."
        color="text-green-600"
        icon={TrendingUp}
        levels={salesLevels}
        onChange={setSalesLevels}
      />

      {/* PRC Levels */}
      <LevelEditor
        title="Pro Member Registration Commission — PMRC (Uni-Level)"
        description="Earned by Pro Members ONLY when a member in their downline purchases the Pro Registration Package."
        color="text-amber-600"
        icon={DollarSign}
        levels={prcLevels}
        onChange={setPrcLevels}
      />

      {/* Save bottom */}
      <div className="flex justify-end pb-6">
        <Button
          onClick={handleSave}
          disabled={saving}
          size="lg"
          className={`gap-2 transition-all ${justSaved ? "bg-green-600 hover:bg-green-700" : ""}`}
        >
          {saving
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
