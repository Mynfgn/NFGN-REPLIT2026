import { useState, useEffect } from "react";
import { customFetch } from "@/lib/custom-fetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Star, Save, RefreshCw, Users, DollarSign, Repeat2, AlertCircle, CheckCircle2, Info } from "lucide-react";

interface LevelRate { level: number; rate: number }

interface CommissionRules {
  referralRate?: number;
  prcLevels?: LevelRate[];
  salesLevels?: LevelRate[];
  powerBonusAmount: number;
  powerBonusTrigger: number;
  powerBonusEnabled: boolean;
}

export function AdminBonusesPage() {
  const [rules, setRules] = useState<CommissionRules | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [bonusAmount, setBonusAmount] = useState<string>("200");
  const [bonusTrigger, setBonusTrigger] = useState<string>("9");
  const [bonusEnabled, setBonusEnabled] = useState(true);

  const loadRules = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await customFetch("/api/commission-rules");
      if (!res.ok) throw new Error("Failed to load commission rules");
      const data: CommissionRules = await res.json();
      setRules(data);
      setBonusAmount(String(data.powerBonusAmount));
      setBonusTrigger(String(data.powerBonusTrigger));
      setBonusEnabled(data.powerBonusEnabled);
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
      const amount = parseFloat(bonusAmount);
      const trigger = parseInt(bonusTrigger, 10);
      if (isNaN(amount) || amount <= 0) throw new Error("Bonus amount must be a positive number.");
      if (isNaN(trigger) || trigger < 1) throw new Error("Trigger count must be at least 1.");

      const res = await customFetch("/api/commission-rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Preserve all existing commission rate settings — only update bonus fields
          referralRate: rules?.referralRate,
          prcLevels: rules?.prcLevels,
          salesLevels: rules?.salesLevels,
          powerBonusAmount: amount,
          powerBonusTrigger: trigger,
          powerBonusEnabled: bonusEnabled,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save");
      }
      const updated: CommissionRules = await res.json();
      setRules(updated);
      setBonusAmount(String(updated.powerBonusAmount));
      setBonusTrigger(String(updated.powerBonusTrigger));
      setBonusEnabled(updated.powerBonusEnabled);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message ?? "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  const isDirty = rules
    ? String(rules.powerBonusAmount) !== bonusAmount ||
      String(rules.powerBonusTrigger) !== bonusTrigger ||
      rules.powerBonusEnabled !== bonusEnabled
    : false;

  const amountNum = parseFloat(bonusAmount);
  const triggerNum = parseInt(bonusTrigger, 10);
  const validAmount = !isNaN(amountNum) && amountNum > 0;
  const validTrigger = !isNaN(triggerNum) && triggerNum >= 1;

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

      {/* Info banner */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-5 pb-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-semibold text-foreground">Core Leadership Bonus (CLB) &amp; Money Circulation Bonus (MCB)</p>
              <ul className="text-muted-foreground space-y-0.5 list-disc list-inside">
                <li><strong className="text-foreground">CLB (Core 9 Bonus / Gen 1 Bonus / STB):</strong> Awarded every {validTrigger ? triggerNum : "N"} Pro Member Registration Products sold on Level 1.</li>
                <li><strong className="text-foreground">MCB (Super 9 Bonus / Gen-2 Bonus / Level 2 Power Team Bonus):</strong> Awarded every {validTrigger ? triggerNum : "N"} Pro Member Registration Products sold on Level 2.</li>
                <li>Both bonuses repeat at every increment — e.g., at {validTrigger ? triggerNum : "N"}, {validTrigger ? triggerNum * 2 : "2N"}, {validTrigger ? triggerNum * 3 : "3N"}… registrations.</li>
                <li>To qualify for MCB, the Pro Member must personally sponsor at least <strong className="text-foreground">{validTrigger ? triggerNum : "N"}</strong> Level 1 Pro Members.</li>
                <li>Bonuses are auto-approved and immediately credited to the member's e-wallet as a separate income stream.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Power Squad Bonus Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif flex items-center gap-2 flex-wrap">
            <Star className="h-5 w-5 text-primary fill-primary" />
            Pro Member Bonuses — CLB &amp; MCB Configuration
            <Badge variant={bonusEnabled ? "default" : "secondary"} className="ml-2">
              {bonusEnabled ? "Active" : "Disabled"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading settings…</p>
          ) : (
            <>
              {/* Enable / Disable */}
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${bonusEnabled ? "bg-green-100" : "bg-muted"}`}>
                    <Star className={`h-4 w-4 ${bonusEnabled ? "text-green-600 fill-green-600" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Enable Power Squad Bonus</p>
                    <p className="text-xs text-muted-foreground">When disabled, no bonuses are awarded or shown to members.</p>
                  </div>
                </div>
                <Switch
                  checked={bonusEnabled}
                  onCheckedChange={setBonusEnabled}
                />
              </div>

              <Separator />

              {/* Configuration fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Bonus Amount */}
                <div className="space-y-2">
                  <Label htmlFor="bonus-amount" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    Bonus Amount (USD)
                  </Label>
                  <Input
                    id="bonus-amount"
                    type="number"
                    min={1}
                    step={1}
                    value={bonusAmount}
                    onChange={e => setBonusAmount(e.target.value)}
                    placeholder="200"
                    disabled={!bonusEnabled}
                  />
                  <p className="text-xs text-muted-foreground">
                    Cash bonus credited to the member's e-wallet each time the trigger is reached.
                  </p>
                </div>

                {/* Trigger Count */}
                <div className="space-y-2">
                  <Label htmlFor="bonus-trigger" className="flex items-center gap-2">
                    <Repeat2 className="h-4 w-4 text-primary" />
                    Trigger Count (Pro Package purchases)
                  </Label>
                  <Input
                    id="bonus-trigger"
                    type="number"
                    min={1}
                    step={1}
                    value={bonusTrigger}
                    onChange={e => setBonusTrigger(e.target.value)}
                    placeholder="9"
                    disabled={!bonusEnabled}
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of Level 2 Pro Package purchases required to earn one bonus (also used as the minimum Level 1 Pro Members required to qualify).
                  </p>
                </div>
              </div>

              {/* Qualification Summary — updates live as inputs change */}
              <div className="p-4 rounded-lg bg-muted/50 border">
                <p className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Qualification Summary (current settings)
                </p>
                <ul className="text-sm text-muted-foreground space-y-1.5">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    Bonus per cycle:&nbsp;
                    <strong className="text-foreground">
                      {validAmount ? `$${amountNum.toFixed(2)}` : "—"}
                    </strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    Trigger every:&nbsp;
                    <strong className="text-foreground">
                      {validTrigger ? `${triggerNum} Level 2 Pro Package purchases` : "—"}
                    </strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    Minimum Level 1 Pro Members to qualify:&nbsp;
                    <strong className="text-foreground">
                      {validTrigger ? triggerNum : "—"}
                    </strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    Bonus fires at purchase counts:&nbsp;
                    <strong className="text-foreground">
                      {validTrigger
                        ? [1, 2, 3, 4, 5].map(n => n * triggerNum).join(", ") + "…"
                        : "—"}
                    </strong>
                  </li>
                </ul>
              </div>

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
                  Pro Member Bonus settings saved successfully.
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
        </CardContent>
      </Card>
    </div>
  );
}
