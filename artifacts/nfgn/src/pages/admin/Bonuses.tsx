import { useState, useEffect } from "react";
import { customFetch } from "@/lib/custom-fetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Star, Save, RefreshCw, Users, DollarSign, Repeat2, AlertCircle, CheckCircle2, Info, Clock, TrendingUp } from "lucide-react";

interface CommissionRules {
  referralRate?: number;
  prcLevels?: { level: number; rate: number }[];
  salesLevels?: { level: number; rate: number }[];
  // MCB
  powerBonusEnabled: boolean;
  powerBonusAmount: number;
  powerBonusTrigger: number;
  // CLB
  clbEnabled: boolean;
  clbAmount: number;
  clbTrigger: number;
  clbWindowDays: number;
}

export function AdminBonusesPage() {
  const [rules, setRules] = useState<CommissionRules | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // MCB state
  const [mcbEnabled, setMcbEnabled] = useState(true);
  const [mcbAmount, setMcbAmount] = useState("200");
  const [mcbTrigger, setMcbTrigger] = useState("9");

  // CLB state
  const [clbEnabled, setClbEnabled] = useState(true);
  const [clbAmount, setClbAmount] = useState("200");
  const [clbTrigger, setClbTrigger] = useState("9");
  const [clbWindowDays, setClbWindowDays] = useState("90");

  const loadRules = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await customFetch("/api/commission-rules");
      if (!res.ok) throw new Error("Failed to load commission rules");
      const data: CommissionRules = await res.json();
      setRules(data);
      setMcbEnabled(data.powerBonusEnabled);
      setMcbAmount(String(data.powerBonusAmount));
      setMcbTrigger(String(data.powerBonusTrigger));
      setClbEnabled(data.clbEnabled);
      setClbAmount(String(data.clbAmount));
      setClbTrigger(String(data.clbTrigger));
      setClbWindowDays(String(data.clbWindowDays));
    } catch (err: any) {
      setError(err.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRules(); }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const mcbAmountN = parseFloat(mcbAmount);
      const mcbTriggerN = parseInt(mcbTrigger, 10);
      const clbAmountN = parseFloat(clbAmount);
      const clbTriggerN = parseInt(clbTrigger, 10);
      const clbWindowN = parseInt(clbWindowDays, 10);

      if (isNaN(mcbAmountN) || mcbAmountN <= 0) throw new Error("MCB Bonus Amount must be a positive number.");
      if (isNaN(mcbTriggerN) || mcbTriggerN < 1) throw new Error("MCB Trigger Count must be at least 1.");
      if (isNaN(clbAmountN) || clbAmountN <= 0) throw new Error("CLB Bonus Amount must be a positive number.");
      if (isNaN(clbTriggerN) || clbTriggerN < 1) throw new Error("CLB Trigger Count must be at least 1.");
      if (isNaN(clbWindowN) || clbWindowN < 1) throw new Error("CLB Qualification Window must be at least 1 day.");

      const res = await customFetch("/api/commission-rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referralRate: rules?.referralRate,
          prcLevels: rules?.prcLevels,
          salesLevels: rules?.salesLevels,
          powerBonusEnabled: mcbEnabled,
          powerBonusAmount: mcbAmountN,
          powerBonusTrigger: mcbTriggerN,
          clbEnabled,
          clbAmount: clbAmountN,
          clbTrigger: clbTriggerN,
          clbWindowDays: clbWindowN,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save");
      }
      const updated: CommissionRules = await res.json();
      setRules(updated);
      setMcbEnabled(updated.powerBonusEnabled);
      setMcbAmount(String(updated.powerBonusAmount));
      setMcbTrigger(String(updated.powerBonusTrigger));
      setClbEnabled(updated.clbEnabled);
      setClbAmount(String(updated.clbAmount));
      setClbTrigger(String(updated.clbTrigger));
      setClbWindowDays(String(updated.clbWindowDays));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message ?? "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  const isDirty = rules
    ? rules.powerBonusEnabled !== mcbEnabled ||
      String(rules.powerBonusAmount) !== mcbAmount ||
      String(rules.powerBonusTrigger) !== mcbTrigger ||
      rules.clbEnabled !== clbEnabled ||
      String(rules.clbAmount) !== clbAmount ||
      String(rules.clbTrigger) !== clbTrigger ||
      String(rules.clbWindowDays) !== clbWindowDays
    : false;

  const mcbAmountN = parseFloat(mcbAmount);
  const mcbTriggerN = parseInt(mcbTrigger, 10);
  const clbAmountN = parseFloat(clbAmount);
  const clbTriggerN = parseInt(clbTrigger, 10);
  const clbWindowN = parseInt(clbWindowDays, 10);

  const validMcbAmount = !isNaN(mcbAmountN) && mcbAmountN > 0;
  const validMcbTrigger = !isNaN(mcbTriggerN) && mcbTriggerN >= 1;
  const validClbAmount = !isNaN(clbAmountN) && clbAmountN > 0;
  const validClbTrigger = !isNaN(clbTriggerN) && clbTriggerN >= 1;
  const validClbWindow = !isNaN(clbWindowN) && clbWindowN >= 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold">Pro Member Bonuses</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure the Core Leadership Bonus (CLB) and Money Circulation Bonus (MCB) for Pro Members.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadRules} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Overview banner */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-5 pb-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm space-y-2">
              <p className="font-semibold text-foreground">CLB vs MCB — Key Difference</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900 space-y-1">
                  <p className="font-semibold text-blue-800">CLB — Core Leadership Bonus</p>
                  <p><strong>ONE-TIME ONLY.</strong> Paid once when a Pro Member's first {validClbTrigger ? clbTriggerN : "N"} new PMRP purchases are completed on their Level 1, within their first {validClbWindow ? clbWindowN : "N"} days as a Pro Member.</p>
                  <p className="text-blue-700">Level 1 bonus · First {validClbTrigger ? clbTriggerN : "N"} new PMRPs only · Never repeats</p>
                </div>
                <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 text-xs text-purple-900 space-y-1">
                  <p className="font-semibold text-purple-800">MCB — Money Circulation Bonus</p>
                  <p><strong>RECURRING.</strong> Paid to the Qualifying Upline Sponsor every time {validMcbTrigger ? mcbTriggerN : "N"} PMRP purchases accumulate on their Level 2. Repeats at {validMcbTrigger ? mcbTriggerN : "N"}, {validMcbTrigger ? mcbTriggerN * 2 : "2N"}, {validMcbTrigger ? mcbTriggerN * 3 : "3N"}… continuously.</p>
                  <p className="text-purple-700">Level 2 bonus · Requires {validMcbTrigger ? mcbTriggerN : "N"} active Level 1 Pro Members · Repeats monthly</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading settings…</p>
      ) : (
        <>
          {/* ── CLB SECTION ── */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2 flex-wrap">
                <Users className="h-5 w-5 text-blue-600" />
                Level 1 — Core Leadership Bonus (CLB)
                <Badge variant={clbEnabled ? "default" : "secondary"} className="ml-2 bg-blue-600">
                  {clbEnabled ? "Active" : "Disabled"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900 space-y-1">
                <p className="font-semibold text-blue-800">One-Time Bonus — Level 1 PMRP Purchases</p>
                <p>A Pro Member earns the CLB exactly <strong>once</strong> when their first {validClbTrigger ? clbTriggerN : "N"} new Pro Member Registration Products are purchased on their Level 1, within their first {validClbWindow ? clbWindowN : "N"} days as a Pro Member. If the trigger is not reached within the qualification window, the bonus is forfeited.</p>
              </div>

              {/* Enable CLB */}
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${clbEnabled ? "bg-blue-100" : "bg-muted"}`}>
                    <Users className={`h-4 w-4 ${clbEnabled ? "text-blue-600" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Enable Core Leadership Bonus (CLB)</p>
                    <p className="text-xs text-muted-foreground">When disabled, no CLB is awarded to any Pro Member.</p>
                  </div>
                </div>
                <Switch checked={clbEnabled} onCheckedChange={setClbEnabled} />
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* CLB Amount */}
                <div className="space-y-2">
                  <Label htmlFor="clb-amount" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                    Bonus Amount (USD)
                  </Label>
                  <Input
                    id="clb-amount"
                    type="number"
                    min={1}
                    step={1}
                    value={clbAmount}
                    onChange={e => setClbAmount(e.target.value)}
                    placeholder="200"
                    disabled={!clbEnabled}
                  />
                  <p className="text-xs text-muted-foreground">One-time cash bonus credited to the Pro Member's e-wallet.</p>
                </div>

                {/* CLB Trigger */}
                <div className="space-y-2">
                  <Label htmlFor="clb-trigger" className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    Trigger Count (Level 1 PMRPs)
                  </Label>
                  <Input
                    id="clb-trigger"
                    type="number"
                    min={1}
                    step={1}
                    value={clbTrigger}
                    onChange={e => setClbTrigger(e.target.value)}
                    placeholder="9"
                    disabled={!clbEnabled}
                  />
                  <p className="text-xs text-muted-foreground">Number of new Level 1 PMRP purchases required to earn the one-time CLB.</p>
                </div>

                {/* CLB Window */}
                <div className="space-y-2">
                  <Label htmlFor="clb-window" className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    Qualification Window (Days)
                  </Label>
                  <Input
                    id="clb-window"
                    type="number"
                    min={1}
                    step={1}
                    value={clbWindowDays}
                    onChange={e => setClbWindowDays(e.target.value)}
                    placeholder="90"
                    disabled={!clbEnabled}
                  />
                  <p className="text-xs text-muted-foreground">Days from Pro Member activation date to complete the CLB requirement.</p>
                </div>
              </div>

              {/* CLB Qualification Summary */}
              <div className="p-4 rounded-lg bg-muted/50 border">
                <p className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  CLB Qualification Summary (current settings)
                </p>
                <ul className="text-sm text-muted-foreground space-y-1.5">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                    Bonus type:&nbsp;<strong className="text-foreground">ONE-TIME — never repeats</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                    Bonus amount:&nbsp;
                    <strong className="text-foreground">{validClbAmount ? `$${clbAmountN.toFixed(2)}` : "—"}</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                    Trigger:&nbsp;
                    <strong className="text-foreground">{validClbTrigger ? `First ${clbTriggerN} new Level 1 PMRP purchases` : "—"}</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                    Qualification window:&nbsp;
                    <strong className="text-foreground">{validClbWindow ? `Within first ${clbWindowN} days of Pro Member activation` : "—"}</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                    Min. Level 1 Pro Members required:&nbsp;<strong className="text-foreground">None</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                    Status:&nbsp;<strong className="text-foreground">{clbEnabled ? "Active — CLBs are being awarded" : "Disabled — CLBs are paused"}</strong>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* ── MCB SECTION ── */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2 flex-wrap">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Level 2 — Money Circulation Bonus (MCB)
                <Badge variant={mcbEnabled ? "default" : "secondary"} className="ml-2 bg-purple-700">
                  {mcbEnabled ? "Active" : "Disabled"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 text-xs text-purple-900 space-y-1">
                <p className="font-semibold text-purple-800">Recurring Bonus — Level 2 PMRP Purchases · Qualifying Upline Sponsor</p>
                <p>
                  The MCB is awarded to the <strong>Qualifying Upline Sponsor</strong> — the Pro Member who sits at Level 2 above the buyer in the genealogy tree, and who has at least {validMcbTrigger ? mcbTriggerN : "N"} active Level 1 Pro Members (their Core Leadership Group). 
                  The MCB fires every time {validMcbTrigger ? mcbTriggerN : "N"} PMRP purchases accumulate on their Level 2, including renewals.
                  It repeats indefinitely at {validMcbTrigger ? mcbTriggerN : "N"}, {validMcbTrigger ? mcbTriggerN * 2 : "2N"}, {validMcbTrigger ? mcbTriggerN * 3 : "3N"}… purchases.
                </p>
              </div>

              {/* Enable MCB */}
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${mcbEnabled ? "bg-purple-100" : "bg-muted"}`}>
                    <TrendingUp className={`h-4 w-4 ${mcbEnabled ? "text-purple-600" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Enable Money Circulation Bonus (MCB)</p>
                    <p className="text-xs text-muted-foreground">When disabled, no MCBs are awarded to any qualifying upline sponsor.</p>
                  </div>
                </div>
                <Switch checked={mcbEnabled} onCheckedChange={setMcbEnabled} />
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* MCB Amount */}
                <div className="space-y-2">
                  <Label htmlFor="mcb-amount" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-purple-600" />
                    Bonus Amount (USD)
                  </Label>
                  <Input
                    id="mcb-amount"
                    type="number"
                    min={1}
                    step={1}
                    value={mcbAmount}
                    onChange={e => setMcbAmount(e.target.value)}
                    placeholder="200"
                    disabled={!mcbEnabled}
                  />
                  <p className="text-xs text-muted-foreground">
                    Cash bonus credited to the Qualifying Upline Sponsor's e-wallet each time the trigger is reached.
                  </p>
                </div>

                {/* MCB Trigger */}
                <div className="space-y-2">
                  <Label htmlFor="mcb-trigger" className="flex items-center gap-2">
                    <Repeat2 className="h-4 w-4 text-purple-600" />
                    Trigger Count (Level 2 Pro Package purchases)
                  </Label>
                  <Input
                    id="mcb-trigger"
                    type="number"
                    min={1}
                    step={1}
                    value={mcbTrigger}
                    onChange={e => setMcbTrigger(e.target.value)}
                    placeholder="9"
                    disabled={!mcbEnabled}
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of Level 2 PMRP purchases required per MCB cycle. Also sets the minimum Level 1 Pro Members required to qualify.
                  </p>
                </div>
              </div>

              {/* MCB Qualification Summary */}
              <div className="p-4 rounded-lg bg-muted/50 border">
                <p className="text-sm font-medium mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  MCB Qualification Summary (current settings)
                </p>
                <ul className="text-sm text-muted-foreground space-y-1.5">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
                    Bonus type:&nbsp;<strong className="text-foreground">RECURRING — repeats at every increment of {validMcbTrigger ? mcbTriggerN : "N"}</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
                    Bonus amount per cycle:&nbsp;
                    <strong className="text-foreground">{validMcbAmount ? `$${mcbAmountN.toFixed(2)}` : "—"}</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
                    Trigger:&nbsp;
                    <strong className="text-foreground">{validMcbTrigger ? `Every ${mcbTriggerN} Level 2 PMRP purchases (initial + renewals)` : "—"}</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
                    Fires at purchase counts:&nbsp;
                    <strong className="text-foreground">
                      {validMcbTrigger
                        ? [1, 2, 3, 4, 5].map(n => n * mcbTriggerN).join(", ") + "…"
                        : "—"}
                    </strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
                    Min. active Level 1 Pro Members (Core Leadership Group) required:&nbsp;
                    <strong className="text-foreground">{validMcbTrigger ? mcbTriggerN : "—"}</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
                    Status:&nbsp;<strong className="text-foreground">{mcbEnabled ? "Active — MCBs are being awarded" : "Disabled — MCBs are paused"}</strong>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Error / success feedback */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              CLB &amp; MCB settings saved successfully.
            </div>
          )}

          {/* Save button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving || !isDirty}>
              {saving ? (
                <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Saving…</>
              ) : (
                <><Save className="h-4 w-4 mr-2" /> Save Settings</>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
