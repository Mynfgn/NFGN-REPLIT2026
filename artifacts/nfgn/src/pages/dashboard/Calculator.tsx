import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { customFetch } from "@/lib/custom-fetch";
import {
  Calculator, Search, TrendingUp, Target,
  DollarSign, Users, Award, Loader2,
  Package, AlertCircle, Plus, X,
} from "lucide-react";

// ── Palette ───────────────────────────────────────────────────────────────────
const WHITE    = "#ffffff";
const GREEN    = "#16a34a";
const GREEN_D  = "#14532d";
const GREEN_M  = "#86efac";
const YELLOW   = "#a16207";
const YELLOW_B = "#fbbf24";
const YELLOW_M = "#fde68a";
const ORANGE   = "#c2410c";
const ORANGE_B = "#f97316";
const ORANGE_M = "#fed7aa";
const DARK     = "#111827";
const BLUE_M   = "#dbeafe";
const BLUE_B   = "#3b82f6";
const BLUE_D   = "#1e3a8a";

// PSC default rates per level (overridden by live /api/commission-rules fetch)
const DEFAULT_PSC_RATES = [10, 20, 5, 5, 5, 5, 5, 5, 5]; // % per level L1-L9

function fmtId(id: number)  { return `NFGN-${String(id).padStart(5, "0")}`; }
function fmtUsd(n: number)  { return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtNum(n: number)  { return n.toLocaleString("en-US"); }

interface CalcProduct { id: number; name: string; price: number; cv: number; isProPackage: boolean; commissionRate: number; commissionType: string; commissionAmount: number; }

type LevelRow = { level: number; size: number; monthlyUnits: number; gv: number; yourComm: number; orgComm: number; label: string; };

function parseProductId(raw: string): number | null {
  const c = raw.trim().replace(/^nfgn-0*/i, "").replace(/^0+/, "") || "0";
  const n = parseInt(c);
  return isNaN(n) || n <= 0 ? null : n;
}

// Commission model:
//   RC (flat $)   = earned on YOUR OWN personal sales only
//   PSC (Uni-Lvl) = % of CV earned per level from downline purchases (all 9 levels)
//   GV            = size × avgPurchases × totalCV  (per level)
function buildLevels(
  l1Size: number,
  mults: number[],
  avgPurchases: number,
  totalCV: number,
  totalRC: number,
  pscRates: number[], // per-level % as integers e.g. [10, 20, 5, 5, ...]
): LevelRow[] {
  const rows: LevelRow[] = [];
  for (let i = 1; i <= 9; i++) {
    const size            = i === 1 ? l1Size : Math.round(rows[i - 2].size * (mults[i - 2] ?? 1));
    const monthlyUnits    = size * avgPurchases;
    const gv              = monthlyUnits * totalCV;
    const ratePct         = pscRates[i - 1] ?? 0;          // e.g. 10, 20, 5
    const yourCommPerUnit = totalCV * ratePct / 100;        // $ per unit at this level
    const yourComm        = monthlyUnits * yourCommPerUnit;
    // orgComm = all commissions generated from this level's purchases (RC + PSC)
    const orgComm  = monthlyUnits * (totalRC + yourCommPerUnit);
    const label    = i === 1 ? "Direct Referrals" : i === 2 ? "Their Referrals" : `Generation ${i}`;
    rows.push({ level: i, size, monthlyUnits, gv, yourComm, orgComm, label });
  }
  return rows;
}

export function CalculatorPage() {
  // ── PSC rates from admin settings ─────────────────────────────────────────
  const [pscRates, setPscRates] = useState<number[]>(DEFAULT_PSC_RATES);
  useEffect(() => {
    customFetch("/api/commission-rules")
      .then(r => r.ok ? r.json() : null)
      .then((d: { salesLevels?: { level: number; rate: number }[] } | null) => {
        if (d?.salesLevels?.length) {
          const sorted = [...d.salesLevels].sort((a, b) => a.level - b.level);
          setPscRates(Array.from({ length: 9 }, (_, i) => sorted[i]?.rate ?? 0));
        }
      })
      .catch(() => {/* keep defaults */});
  }, []);

  // ── Product slots (up to 3) ────────────────────────────────────────────────
  const [productSlots,    setProductSlots]    = useState<(CalcProduct | null)[]>([null, null, null]);
  const [idInputs,        setIdInputs]        = useState(["", "", ""]);
  const [lookupErrors,    setLookupErrors]    = useState(["", "", ""]);
  const [lookupLoadings,  setLookupLoadings]  = useState([false, false, false]);
  const [slotCount,       setSlotCount]       = useState(1);

  // ── Builder state ──────────────────────────────────────────────────────────
  const [personalSales, setPersonalSales] = useState(5);
  const [l1Size,        setL1Size]        = useState(7);
  const [levelMults,    setLevelMults]    = useState<number[]>([3, 3, 3, 3, 3, 3, 3, 3]);
  const [avgPurchases,  setAvgPurchases]  = useState(1);
  const [targetIncome,  setTargetIncome]  = useState(4500);

  async function lookupProduct(slot: number) {
    const id = parseProductId(idInputs[slot]);
    if (!id) {
      setLookupErrors(prev => { const n = [...prev]; n[slot] = "Enter a valid Product ID — e.g. NFGN-00001 or just 1"; return n; });
      return;
    }
    setLookupLoadings(prev => { const n = [...prev]; n[slot] = true; return n; });
    setLookupErrors(prev => { const n = [...prev]; n[slot] = ""; return n; });
    try {
      const res = await customFetch(`/api/products/${id}`);
      if (!res.ok) {
        setLookupErrors(prev => { const n = [...prev]; n[slot] = `Product "${idInputs[slot].trim()}" not found.`; return n; });
        setProductSlots(prev => { const n = [...prev]; n[slot] = null; return n; });
        return;
      }
      const d = await res.json();
      const p: CalcProduct = { id: d.id, name: d.name, price: parseFloat(d.price), cv: d.cv ?? 0, isProPackage: !!d.isProPackage, commissionRate: parseFloat(d.commissionRate) || 10, commissionType: d.commissionType ?? "flat", commissionAmount: parseFloat(d.commissionAmount) || 0 };
      setProductSlots(prev => { const n = [...prev]; n[slot] = p; return n; });
    } catch {
      setLookupErrors(prev => { const n = [...prev]; n[slot] = "Failed to load product. Please try again."; return n; });
    } finally {
      setLookupLoadings(prev => { const n = [...prev]; n[slot] = false; return n; });
    }
  }

  function clearSlot(slot: number) {
    setProductSlots(prev => { const n = [...prev]; n[slot] = null; return n; });
    setIdInputs(prev => { const n = [...prev]; n[slot] = ""; return n; });
    setLookupErrors(prev => { const n = [...prev]; n[slot] = ""; return n; });
  }

  // ── Combined derived values ────────────────────────────────────────────────
  const loadedProducts    = productSlots.slice(0, slotCount).filter((p): p is CalcProduct => p !== null);
  const hasAny            = loadedProducts.length > 0;
  const totalCV           = loadedProducts.reduce((s, p) => s + p.cv,               0);
  const totalRC           = loadedProducts.reduce((s, p) => s + p.commissionAmount, 0);
  const hasProPkg         = loadedProducts.some(p => p.isProPackage);
  const l1RatePct         = pscRates[0] ?? 10;                      // e.g. 10
  const l1DollarPerUnit   = totalCV * l1RatePct / 100;              // $ per L1 purchase
  const l2DollarPerUnit   = totalCV * (pscRates[1] ?? 20) / 100;   // $ per L2 purchase
  const commPerDirectSale = totalRC + l1DollarPerUnit;              // display-only combined

  // ── Level builder ──────────────────────────────────────────────────────────
  const levels = hasAny ? buildLevels(l1Size, levelMults, avgPurchases, totalCV, totalRC, pscRates) : [];

  // ── Earnings ───────────────────────────────────────────────────────────────
  const myPersonalRC    = personalSales * totalRC;                  // RC on own sales
  const myL1Earnings    = levels[0]?.yourComm ?? 0;                 // PSC L1
  const myL2Earnings    = levels[1]?.yourComm ?? 0;                 // PSC L2
  const myL3to9Earnings = levels.slice(2).reduce((s, l) => s + l.yourComm, 0); // PSC L3-L9
  const myPscTotal      = levels.reduce((s, l) => s + l.yourComm, 0);
  const myCommTotal     = myPersonalRC + myPscTotal;
  const clbEarned       = l1Size >= 7 ? 100 : 0;
  const l2Total         = levels[1] ? levels[1].size * avgPurchases : 0;
  const mcbCount        = hasProPkg ? Math.floor(l2Total / 7) : 0;
  const mcbEarned       = mcbCount * 200;
  const totalWithBonus  = myCommTotal + clbEarned + mcbEarned;

  // GV totals
  const personalGV    = personalSales * totalCV;
  const totalOrgGV    = personalGV + levels.reduce((s, l) => s + l.gv, 0);
  const orgCollective = levels.reduce((s, l) => s + l.orgComm, 0);

  // ── Income Goal ────────────────────────────────────────────────────────────
  const goalPersonalOnly  = totalRC > 0 ? Math.ceil(targetIncome / totalRC) : 0;
  const earningsFrom5     = 5 * totalRC;
  const l1Needed          = l1DollarPerUnit > 0 ? Math.ceil(Math.max(0, targetIncome - earningsFrom5) / l1DollarPerUnit) : 0;
  const l1WithBonusNeeded = l1DollarPerUnit > 0 ? Math.ceil(Math.max(0, targetIncome - 100 - earningsFrom5) / l1DollarPerUnit) : 0;
  const l2Needed          = hasProPkg && l2DollarPerUnit > 0 ? Math.ceil(targetIncome / l2DollarPerUnit) : null;

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px 56px" }}>

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div style={{
        marginBottom: 28, padding: "22px 26px", borderRadius: 18,
        background: `linear-gradient(135deg, ${GREEN_D} 0%, #166534 100%)`,
        border: `3px solid ${GREEN}`,
        display: "flex", alignItems: "center", gap: 16,
        boxShadow: `0 6px 28px rgba(22,163,74,0.4)`,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14, flexShrink: 0,
          background: `linear-gradient(135deg, ${YELLOW_B}, ${ORANGE_B})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 20px rgba(251,191,36,0.6)`,
        }}>
          <Calculator size={28} style={{ color: GREEN_D }} />
        </div>
        <div>
          <h1 style={{ fontFamily: "'Georgia',serif", fontSize: 22, fontWeight: 900, margin: 0, color: WHITE }}>
            Products, Services &amp; Commissions Calculator
          </h1>
          <p style={{ fontSize: 13, color: YELLOW_B, margin: "4px 0 0" }}>
            Load up to 3 products — CVs combine for total GV and commission projections across 9 generations.
          </p>
        </div>
      </div>

      {/* ── STEP 1: Product Lookup (up to 3 slots) ───────────────────────── */}
      <SectionCard borderColor={GREEN} topColor={GREEN}>
        <StepHeader n={1} title="Product Lookup (1–3 Products)" />
        <p style={{ fontSize: 13, color: "#444", marginBottom: 16, lineHeight: 1.7 }}>
          Load up to 3 products. Their CV and RC values combine — giving you a total GV and combined commission per direct sale.
        </p>

        {/* Product slots */}
        {Array.from({ length: slotCount }).map((_, slot) => (
          <div key={slot} style={{ marginBottom: 16, padding: "16px 18px", background: slot === 0 ? GREEN_M + "40" : slot === 1 ? YELLOW_M + "60" : ORANGE_M + "60", border: `2px solid ${slot === 0 ? GREEN : slot === 1 ? YELLOW_B : ORANGE_B}`, borderRadius: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 900, color: slot === 0 ? GREEN_D : slot === 1 ? YELLOW : ORANGE, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Product {slot + 1}{slot > 0 ? " (optional)" : ""}
              </span>
              {slot > 0 && (
                <button onClick={() => { clearSlot(slot); setSlotCount(s => s - 1); }} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 2 }}>
                  <X size={14} />
                </button>
              )}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
              <Input
                value={idInputs[slot]}
                onChange={e => setIdInputs(prev => { const n = [...prev]; n[slot] = e.target.value; return n; })}
                onKeyDown={e => e.key === "Enter" && lookupProduct(slot)}
                placeholder="NFGN-00001  or just  1"
                style={{ width: 220, fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.05em", border: `2px solid ${slot === 0 ? GREEN : slot === 1 ? YELLOW_B : ORANGE_B}`, background: WHITE }}
              />
              <Button
                onClick={() => lookupProduct(slot)}
                disabled={lookupLoadings[slot] || !idInputs[slot].trim()}
                style={{ background: `linear-gradient(135deg, ${ORANGE_B}, #fb923c)`, color: WHITE, fontWeight: 800, gap: 6, border: "none", boxShadow: `0 3px 12px rgba(249,115,22,0.5)` }}
              >
                {lookupLoadings[slot] ? <><Loader2 size={14} className="animate-spin" /> Loading…</> : <><Search size={14} /> Load</>}
              </Button>
              {productSlots[slot] && (
                <button onClick={() => clearSlot(slot)} style={{ padding: "6px 12px", borderRadius: 8, border: `2px solid #e5e7eb`, background: WHITE, cursor: "pointer", fontSize: 12, color: "#6b7280", fontWeight: 700 }}>
                  Clear
                </button>
              )}
            </div>
            {lookupErrors[slot] && (
              <div style={{ display: "flex", gap: 6, alignItems: "center", color: "#dc2626", fontSize: 13, padding: "8px 12px", background: "#fef2f2", borderRadius: 8, border: "2px solid #fca5a5", marginBottom: 6 }}>
                <AlertCircle size={14} /> {lookupErrors[slot]}
              </div>
            )}
            {productSlots[slot] && (() => {
              const p = productSlots[slot]!;
              return (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 900, color: WHITE, background: GREEN, padding: "3px 10px", borderRadius: 6 }}>{fmtId(p.id)}</span>
                      {p.isProPackage && <span style={{ fontSize: 10, fontWeight: 900, color: WHITE, background: ORANGE_B, padding: "3px 10px", borderRadius: 6 }}>⭐ PRO PKG</span>}
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: DARK }}>{p.name}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {[
                      { label: "Price",   value: fmtUsd(p.price),              bg: GREEN_D,  text: YELLOW_B },
                      { label: "CV",      value: String(p.cv),                 bg: YELLOW_B, text: GREEN_D  },
                      { label: "RC/unit", value: fmtUsd(p.commissionAmount),   bg: ORANGE_B, text: WHITE    },
                    ].map(s => (
                      <div key={s.label} style={{ textAlign: "center", background: s.bg, borderRadius: 10, padding: "7px 14px", minWidth: 68 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: s.text + "aa", textTransform: "uppercase", letterSpacing: "0.07em" }}>{s.label}</div>
                        <div style={{ fontSize: 16, fontWeight: 900, color: s.text }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        ))}

        {/* Add product slot button */}
        {slotCount < 3 && (
          <button
            onClick={() => setSlotCount(s => s + 1)}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", border: `2px dashed ${GREEN}`, borderRadius: 10, background: GREEN_M + "30", color: GREEN_D, fontWeight: 700, fontSize: 13, cursor: "pointer", marginBottom: 16 }}
          >
            <Plus size={15} /> Add Product {slotCount + 1}
          </button>
        )}

        {/* Combined summary */}
        {hasAny && (
          <div style={{ marginTop: 4, padding: "18px 20px", background: GREEN_M + "50", border: `2px solid ${GREEN}`, borderRadius: 14 }}>
            {/* Combined CV / RC totals */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
              {[
                { label: "Combined CV (GV basis)",  value: String(totalCV),           bg: YELLOW_B, text: GREEN_D  },
                { label: "Combined RC / unit",      value: fmtUsd(totalRC),           bg: ORANGE_B, text: WHITE    },
                { label: `L1 PSC (${l1RatePct}%) / unit`, value: fmtUsd(l1DollarPerUnit), bg: GREEN_D, text: YELLOW_B },
                { label: "Total Per Direct Sale",   value: fmtUsd(commPerDirectSale), bg: GREEN,    text: WHITE    },
              ].map(s => (
                <div key={s.label} style={{ textAlign: "center", background: s.bg, borderRadius: 12, padding: "10px 16px", minWidth: 90 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: s.text + "bb", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: s.text }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Per-sale breakdown tiles */}
            <div style={{ borderTop: `2px solid ${GREEN}`, paddingTop: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: ORANGE, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
                💰 Your Commission Breakdown (as a Pro Member)
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {[
                  { label: "RC — on Your Own Sales",         pct: fmtUsd(totalRC) + " flat",          amt: totalRC,   sub: "Fixed dollar RC earned per unit you personally sell",             bg: GREEN_M,  border: GREEN,    val: GREEN_D },
                  { label: `L1 PSC (${l1RatePct}%)`, pct: `${l1RatePct}% of CV`, amt: l1DollarPerUnit, sub: `${l1RatePct}% × ${totalCV} combined CV per L1 purchase`, bg: YELLOW_M, border: YELLOW_B, val: YELLOW },
                  { label: "Total Per Direct Sale",  pct: `RC + ${l1RatePct}% CV`, amt: commPerDirectSale, sub: `RC flat + ${l1RatePct}% × ${totalCV} CV`, bg: GREEN, border: GREEN_D, val: WHITE, bold: true },
                  ...(hasProPkg ? [{ label: `L2 PSC (${pscRates[1] ?? 20}%)`, pct: `${pscRates[1] ?? 20}% of CV`, amt: l2DollarPerUnit, sub: `${pscRates[1] ?? 20}% × ${totalCV} CV per L2 purchase`, bg: ORANGE_M, border: ORANGE_B, val: ORANGE }] : []),
                ].map(item => (
                  <div key={item.label} style={{ flex: "1 1 140px", padding: "12px 14px", background: item.bg, borderRadius: 12, border: `2px solid ${item.border}` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: (item as any).bold ? "rgba(255,255,255,0.75)" : "#555", marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: item.val }}>
                      {fmtUsd(item.amt)} <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.65 }}>({item.pct})</span>
                    </div>
                    <div style={{ fontSize: 11, color: (item as any).bold ? "rgba(255,255,255,0.65)" : "#666", marginTop: 2 }}>{item.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!hasAny && (
          <div style={{ marginTop: 4, padding: "28px", background: GREEN_M + "70", borderRadius: 12, border: `2px dashed ${GREEN}`, textAlign: "center" }}>
            <Package size={32} style={{ margin: "0 auto 10px", color: GREEN }} />
            <div style={{ fontSize: 13, color: GREEN_D, fontWeight: 600 }}>Load a product to see commission details and activate the calculators below.</div>
          </div>
        )}
      </SectionCard>

      {/* ── STEP 2: 9-Level Organization Builder ─────────────────────────── */}
      <SectionCard borderColor={YELLOW_B} topColor={YELLOW_B} disabled={!hasAny}>
        <StepHeader n={2} title="9-Level Organization Builder" />
        <p style={{ fontSize: 13, color: "#444", marginBottom: 20, lineHeight: 1.7 }}>
          Set your Level 1 team size, then enter a multiplier for each level (L2–L9). Each level's team size = previous level × its multiplier.
          <br /><span style={{ color: GREEN_D, fontWeight: 700 }}>GV = Team Size × Avg Purchases × Combined CV.</span>
        </p>

        {/* Top inputs — personalSales is always ≤ l1Size (can't purchase without registering) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 20 }}>
          {/* Personal Sales */}
          <div style={{ background: GREEN_M, borderRadius: 12, border: `2px solid ${GREEN}`, padding: "12px 14px" }}>
            <Label style={{ fontSize: 11, fontWeight: 900, color: GREEN_D, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Your Personal Sales / Month</Label>
            <Input
              type="number"
              min={0}
              max={l1Size}
              value={personalSales}
              onChange={e => {
                const v = Math.max(0, parseInt(e.target.value) || 0);
                setPersonalSales(Math.min(v, l1Size));
              }}
              style={{ fontWeight: 800, fontSize: 18, border: `2px solid ${GREEN}`, background: WHITE }}
            />
            <div style={{ fontSize: 11, color: GREEN_D, marginTop: 5, fontWeight: 700 }}>
              {hasAny ? `RC earnings: ${fmtUsd(personalSales * totalRC)}/mo` : "Load a product first"}
            </div>
            <div style={{ fontSize: 10, color: GREEN_D + "aa", marginTop: 3, fontWeight: 600 }}>
              {personalSales === l1Size && l1Size > 0 ? `All ${l1Size} members purchased` : `${personalSales} of ${l1Size} members purchased`}
            </div>
            {personalSales === l1Size && l1Size > 0 && (
              <div style={{ fontSize: 10, color: ORANGE, marginTop: 2, fontWeight: 700 }}>⚠ Max: cannot exceed L1 Team Size</div>
            )}
          </div>

          {/* L1 Team Size */}
          <div style={{ background: YELLOW_M, borderRadius: 12, border: `2px solid ${YELLOW_B}`, padding: "12px 14px" }}>
            <Label style={{ fontSize: 11, fontWeight: 900, color: YELLOW, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Level 1 Team Size (Registered)</Label>
            <Input
              type="number"
              min={0}
              value={l1Size}
              onChange={e => {
                const v = Math.max(0, parseInt(e.target.value) || 0);
                setL1Size(v);
                if (v < personalSales) setPersonalSales(v);
              }}
              style={{ fontWeight: 800, fontSize: 18, border: `2px solid ${YELLOW_B}`, background: WHITE }}
            />
            <div style={{ fontSize: 11, color: YELLOW, marginTop: 5, fontWeight: 700 }}>
              {l1Size >= 7 ? "✓ CLB eligible!" : `${7 - l1Size} more needed for CLB`}
            </div>
            <div style={{ fontSize: 10, color: YELLOW + "cc", marginTop: 3, fontWeight: 600 }}>
              Always ≥ personal sales (register first, then purchase)
            </div>
          </div>

          {/* Avg Purchases */}
          <div style={{ background: GREEN_M, borderRadius: 12, border: `2px solid ${GREEN}`, padding: "12px 14px" }}>
            <Label style={{ fontSize: 11, fontWeight: 900, color: GREEN_D, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Avg Purchases / Person / Month</Label>
            <Input
              type="number"
              min={1}
              value={avgPurchases}
              onChange={e => setAvgPurchases(Math.max(1, parseInt(e.target.value) || 1))}
              style={{ fontWeight: 800, fontSize: 18, border: `2px solid ${GREEN}`, background: WHITE }}
            />
            <div style={{ fontSize: 11, color: GREEN_D, marginTop: 5, fontWeight: 700 }}>Units each person buys/month</div>
          </div>
        </div>

        {/* 9-Level table — 8 columns (no "Flows To You?" to prevent overflow) */}
        <div style={{ overflowX: "auto", marginBottom: 22, borderRadius: 14, border: `2px solid ${GREEN}` }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 700 }}>
            <thead>
              <tr style={{ background: `linear-gradient(135deg, ${GREEN_D}, #166534)` }}>
                {[
                  { h: "Level / Description",  w: "14%"  },
                  { h: "Comm %",               w: "8%"   },
                  { h: "× Multiplier",         w: "12%"  },
                  { h: "Team Size",            w: "8%"   },
                  { h: "Mo. Units",            w: "8%"   },
                  { h: "Monthly GV",           w: "11%"  },
                  { h: "Your Commission",      w: "20%"  },
                  { h: "Org Collective (RC+PSC)", w: "19%" },
                ].map(({ h, w }) => (
                  <th key={h} style={{ padding: "11px 10px", textAlign: "left", fontSize: 9, fontWeight: 900, color: YELLOW_B, letterSpacing: "0.06em", whiteSpace: "nowrap", textTransform: "uppercase", width: w }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* You — personal sales row */}
              <tr style={{ background: GREEN_M, borderBottom: `2px solid ${GREEN}` }}>
                {/* Level + Description merged */}
                <td style={{ padding: "10px 10px" }}>
                  <div style={{ fontWeight: 900, color: GREEN_D, fontSize: 14 }}>You</div>
                  <div style={{ fontSize: 10, color: GREEN_D, fontWeight: 600, marginTop: 1 }}>Personal Sales</div>
                </td>
                {/* Comm % */}
                <td style={{ padding: "10px 10px" }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: WHITE, background: ORANGE_B, padding: "2px 7px", borderRadius: 5 }}>RC flat</span>
                </td>
                <td style={{ padding: "10px 10px", color: "#aaa", fontSize: 12 }}>—</td>
                <td style={{ padding: "10px 10px", color: "#aaa", fontSize: 12 }}>—</td>
                <td style={{ padding: "10px 10px", fontWeight: 800, color: ORANGE }}>{personalSales}</td>
                <td style={{ padding: "10px 10px" }}>
                  <span style={{ fontWeight: 800, color: BLUE_D, background: BLUE_M, padding: "2px 8px", borderRadius: 6, fontSize: 11 }}>{fmtNum(personalGV)} GV</span>
                </td>
                <td style={{ padding: "10px 10px" }}>
                  <div style={{ fontWeight: 900, color: GREEN_D, fontSize: 14 }}>{fmtUsd(myPersonalRC)}</div>
                  <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>{personalSales} × {fmtUsd(totalRC)} RC</div>
                </td>
                <td style={{ padding: "10px 10px", color: "#9ca3af", fontSize: 12 }}>—</td>
              </tr>

              {/* L1–L9 rows */}
              {levels.map((lv, i) => {
                const isYours       = lv.yourComm > 0;
                const prevSize      = i === 0 ? l1Size : levels[i - 1].size;
                const ratePct       = pscRates[lv.level - 1] ?? 0;
                const dollarPerUnit = totalCV * ratePct / 100;
                const rateColor     = ratePct >= 20 ? ORANGE_B : ratePct > 0 ? GREEN : "#d1d5db";
                // Org breakdown sub-text
                const orgRC  = lv.monthlyUnits * totalRC;
                const orgPSC = lv.monthlyUnits * dollarPerUnit;
                return (
                  <tr key={lv.level} style={{ background: isYours ? GREEN_M + "80" : (i % 2 === 0 ? "#f9fafb" : WHITE), borderBottom: `1px solid ${isYours ? GREEN : "#e5e7eb"}` }}>
                    {/* Level + Description merged */}
                    <td style={{ padding: "9px 10px" }}>
                      <div style={{ fontWeight: 900, color: isYours ? GREEN_D : "#9ca3af", fontSize: 13 }}>L{lv.level}</div>
                      <div style={{ fontSize: 10, color: isYours ? "#555" : "#c4c4c4", marginTop: 1 }}>{lv.label}</div>
                    </td>
                    {/* Comm % — rate badge + dollar per unit */}
                    <td style={{ padding: "9px 10px" }}>
                      {ratePct > 0 ? (
                        <div>
                          <span style={{ fontSize: 10, fontWeight: 800, color: WHITE, background: rateColor, padding: "2px 7px", borderRadius: 5 }}>
                            {ratePct}% PSC
                          </span>
                          <div style={{ fontSize: 10, color: "#6b7280", marginTop: 3 }}>
                            {fmtUsd(dollarPerUnit)}/unit
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: "#d1d5db", fontSize: 12 }}>—</span>
                      )}
                    </td>
                    {/* × Multiplier */}
                    <td style={{ padding: "9px 8px" }}>
                      {lv.level === 1 ? (
                        <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>Base</span>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <span style={{ fontSize: 10, color: ORANGE, fontWeight: 700 }}>{fmtNum(prevSize)}×</span>
                          <input
                            type="number"
                            min={1}
                            step={1}
                            value={levelMults[lv.level - 2]}
                            onChange={e => {
                              const v = Math.max(1, parseInt(e.target.value) || 1);
                              setLevelMults(prev => { const next = [...prev]; next[lv.level - 2] = v; return next; });
                            }}
                            style={{
                              width: 46, fontWeight: 800, fontSize: 12, textAlign: "center",
                              border: `2px solid ${ORANGE_B}`, borderRadius: 6, padding: "2px 3px",
                              background: ORANGE_M, color: ORANGE, outline: "none",
                            }}
                          />
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "9px 10px", fontWeight: 700, color: isYours ? ORANGE : "#9ca3af" }}>{fmtNum(lv.size)}</td>
                    <td style={{ padding: "9px 10px", color: isYours ? DARK : "#9ca3af" }}>{fmtNum(lv.monthlyUnits)}</td>
                    <td style={{ padding: "9px 10px" }}>
                      <span style={{ fontWeight: 700, color: BLUE_D, background: BLUE_M, padding: "2px 7px", borderRadius: 6, fontSize: 11 }}>{fmtNum(lv.gv)} GV</span>
                    </td>
                    {/* Your Commission + calculation sub-text */}
                    <td style={{ padding: "9px 10px" }}>
                      {isYours ? (
                        <>
                          <div style={{ fontWeight: 900, color: GREEN_D, fontSize: 14 }}>{fmtUsd(lv.yourComm)}</div>
                          <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>
                            {lv.monthlyUnits} × {fmtUsd(dollarPerUnit)} = {fmtUsd(lv.yourComm)}
                          </div>
                        </>
                      ) : (
                        <span style={{ color: "#d1d5db", fontSize: 12 }}>—</span>
                      )}
                    </td>
                    {/* Org Collective + RC + PSC breakdown */}
                    <td style={{ padding: "9px 10px" }}>
                      <div style={{ fontWeight: 700, color: "#374151", fontSize: 13 }}>{fmtUsd(lv.orgComm)}</div>
                      <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>
                        RC {fmtUsd(orgRC)} + PSC {fmtUsd(orgPSC)}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Total GV footer row */}
              {hasAny && (
                <tr style={{ background: BLUE_M, borderTop: `2px solid ${BLUE_B}` }}>
                  <td colSpan={4} style={{ padding: "9px 10px", fontWeight: 900, color: BLUE_D, fontSize: 12, textAlign: "right" }}>
                    TOTAL ORG GV →
                  </td>
                  <td style={{ padding: "9px 10px" }}>
                    <span style={{ fontWeight: 900, color: WHITE, background: BLUE_B, padding: "3px 10px", borderRadius: 8, fontSize: 13 }}>
                      {fmtNum(totalOrgGV)} GV
                    </span>
                  </td>
                  <td colSpan={3} style={{ padding: "9px 10px", fontSize: 10, color: BLUE_D, fontWeight: 600 }}>
                    Personal {fmtNum(personalGV)} GV + Org {fmtNum(totalOrgGV - personalGV)} GV
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Earnings summary */}
        <div style={{ background: `linear-gradient(135deg, ${GREEN_D} 0%, #166534 100%)`, borderRadius: 16, padding: "22px 26px", border: `3px solid ${GREEN}`, boxShadow: `0 4px 24px rgba(22,163,74,0.35)` }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: YELLOW_B, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <TrendingUp size={14} /> Monthly Earnings Summary
          </div>
          {[
            { label: "Personal Sales — RC",                    amount: myPersonalRC,    desc: `${personalSales} personal sales × ${fmtUsd(totalRC)} RC/unit`,                                                                      color: GREEN_M  },
            { label: `L1 PSC (${pscRates[0] ?? 10}%)`,        amount: myL1Earnings,    desc: `${fmtNum(l1Size)} members × ${avgPurchases} purchase × ${fmtUsd(l1DollarPerUnit)}/unit`,                                           color: YELLOW_B },
            { label: `L2 PSC (${pscRates[1] ?? 20}%)`,        amount: myL2Earnings,    desc: `${fmtNum(levels[1]?.size ?? 0)} members × ${avgPurchases} purchases × ${fmtUsd(l2DollarPerUnit)}/unit`,                            color: ORANGE_B },
            { label: `L3–L9 PSC (${pscRates[2] ?? 5}% each)`, amount: myL3to9Earnings, desc: `${fmtNum(levels.slice(2).reduce((s,l)=>s+l.size,0))} members across 7 levels × ${avgPurchases} purchases`,                        color: "#fdba74" },
            { label: "CLB Bonus",                              amount: clbEarned,       desc: l1Size >= 7 ? "✓ 7+ qualified L1 Pro Members" : `Need ${7 - l1Size} more L1 to qualify`,                                           color: ORANGE_B },
            ...(hasProPkg ? [{ label: `MCB Bonus (${mcbCount}× at $200)`, amount: mcbEarned, desc: `${fmtNum(l2Total)} L2 purchases ÷ 7 = ${mcbCount} payments`, color: "#fdba74" }] : []),
          ].map(row => (
            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              <div>
                <div style={{ fontSize: 13, color: "#d1fae5" }}>{row.label}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>{row.desc}</div>
              </div>
              <div style={{ fontSize: 17, fontWeight: 900, color: row.amount > 0 ? row.color : "rgba(255,255,255,0.2)", minWidth: 100, textAlign: "right" }}>{fmtUsd(row.amount)}</div>
            </div>
          ))}
          {/* Total GV in summary */}
          <div style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, color: "#bfdbfe" }}>Total Organization GV</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>Personal + all 9 levels combined</div>
            </div>
            <div style={{ fontSize: 17, fontWeight: 900, color: BLUE_M, minWidth: 100, textAlign: "right" }}>{fmtNum(totalOrgGV)} GV</div>
          </div>
          <div style={{ borderTop: `2px solid ${YELLOW_B}60`, marginTop: 16, paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: WHITE }}>Your Total Monthly Income</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                Org collective SC: <span style={{ color: GREEN_M, fontWeight: 700 }}>{fmtUsd(orgCollective)}/mo</span> throughout your network
              </div>
            </div>
            <div style={{ fontSize: 38, fontWeight: 900, color: YELLOW_B, textShadow: `0 0 20px rgba(251,191,36,0.7)` }}>{fmtUsd(totalWithBonus)}</div>
          </div>
        </div>
      </SectionCard>

      {/* ── STEP 3: Income Goal Calculator ───────────────────────────────── */}
      <SectionCard borderColor={ORANGE_B} topColor={ORANGE_B} disabled={!hasAny}>
        <StepHeader n={3} title="Income Goal Calculator" />
        <p style={{ fontSize: 13, color: "#444", marginBottom: 20, lineHeight: 1.7 }}>
          How much do you want to earn per month? Choose a target and see exactly what it takes.
        </p>

        {/* Target input */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 24, padding: "16px 20px", background: ORANGE_M, borderRadius: 14, border: `2px solid ${ORANGE_B}` }}>
          <Label style={{ fontWeight: 900, fontSize: 14, whiteSpace: "nowrap", color: ORANGE }}>🎯 Target Monthly Income:</Label>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontWeight: 900, fontSize: 24, color: ORANGE }}>$</span>
            <Input
              type="number"
              min={0}
              value={targetIncome}
              onChange={e => setTargetIncome(Math.max(0, parseInt(e.target.value) || 0))}
              style={{ width: 150, fontWeight: 900, fontSize: 20, border: `2px solid ${ORANGE_B}`, background: WHITE }}
            />
            <span style={{ color: ORANGE, fontSize: 14, fontWeight: 700 }}>/mo</span>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[500, 1000, 2500, 4500, 10000].map(amt => (
              <button
                key={amt}
                onClick={() => setTargetIncome(amt)}
                style={{
                  padding: "7px 14px", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 800, transition: "all 0.15s",
                  border: `2px solid ${targetIncome === amt ? ORANGE_B : "#d1d5db"}`,
                  background: targetIncome === amt ? `linear-gradient(135deg, ${ORANGE_B}, #fb923c)` : WHITE,
                  color: targetIncome === amt ? WHITE : ORANGE,
                  boxShadow: targetIncome === amt ? `0 2px 10px rgba(249,115,22,0.5)` : "none",
                }}
              >
                ${amt.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {hasAny ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>

            {/* Scenario A */}
            <div style={{ background: GREEN_M, borderRadius: 14, border: `3px solid ${GREEN}`, padding: "20px" }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: GREEN_D, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Scenario A</div>
              <div style={{ fontWeight: 800, fontSize: 15, color: GREEN_D, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                <DollarSign size={16} style={{ color: GREEN }} /> Personal Sales Only (RC)
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: GREEN_D, marginBottom: 6 }}>
                {fmtNum(goalPersonalOnly)} <span style={{ fontSize: 14, fontWeight: 600, color: "#6b7280" }}>sales/mo</span>
              </div>
              <div style={{ fontSize: 13, color: GREEN_D, lineHeight: 1.6, marginBottom: 10 }}>
                You personally sell {fmtNum(goalPersonalOnly)} units every month (RC only).
              </div>
              <div style={{ fontSize: 12, color: GREEN_D, padding: "8px 12px", background: WHITE, borderRadius: 8, fontWeight: 700, border: `2px solid ${GREEN}` }}>
                {fmtNum(goalPersonalOnly)} × {fmtUsd(totalRC)} RC = {fmtUsd(goalPersonalOnly * totalRC)}/mo
              </div>
            </div>

            {/* Scenario B */}
            <div style={{ background: YELLOW_M, borderRadius: 14, border: `3px solid ${YELLOW_B}`, padding: "20px" }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: YELLOW, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Scenario B</div>
              <div style={{ fontWeight: 800, fontSize: 15, color: YELLOW, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                <Users size={16} style={{ color: YELLOW }} /> You + Level 1 Team
              </div>
              <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 12 }}>
                <div style={{ textAlign: "center", background: WHITE, borderRadius: 10, padding: "10px 16px", border: `2px solid ${GREEN}` }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: GREEN_D }}>5</div>
                  <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>Your sales</div>
                </div>
                <div style={{ fontSize: 24, color: YELLOW, fontWeight: 900 }}>+</div>
                <div style={{ textAlign: "center", background: WHITE, borderRadius: 10, padding: "10px 16px", border: `2px solid ${YELLOW_B}` }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: YELLOW }}>{fmtNum(Math.max(0, l1Needed))}</div>
                  <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>L1 members</div>
                </div>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.6, fontWeight: l1Needed <= 0 ? 700 : 400, color: l1Needed <= 0 ? GREEN_D : YELLOW }}>
                {l1Needed <= 0 ? "✓ 5 personal sales already covers this goal!" : `Recruit ${l1Needed} direct referrals who each buy 1 unit/month.`}
              </div>
            </div>

            {/* Scenario C */}
            <div style={{ background: ORANGE_M, borderRadius: 14, border: `3px solid ${ORANGE_B}`, padding: "20px" }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: ORANGE, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Scenario C</div>
              <div style={{ fontWeight: 800, fontSize: 15, color: ORANGE, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                <Award size={16} style={{ color: ORANGE_B }} /> With Power Squad Bonuses
              </div>
              <div style={{ fontSize: 13, color: ORANGE, lineHeight: 1.8, marginBottom: 10 }}>
                Qualify for <strong style={{ color: GREEN_D }}>CLB ($100)</strong> with 7 qualified L1 Pro Members in 90 days. Reduces target to <strong style={{ color: GREEN_D }}>{fmtUsd(Math.max(0, targetIncome - 100))}</strong>.
              </div>
              <div style={{ fontSize: 13, color: ORANGE, lineHeight: 1.8, marginBottom: 10 }}>
                CLB + 5 personal sales → need <strong style={{ color: ORANGE_B }}>{fmtNum(Math.max(0, l1WithBonusNeeded))} L1 members</strong>.
              </div>
              {hasProPkg && l2Needed !== null && (
                <div style={{ fontSize: 13, color: ORANGE, lineHeight: 1.8, padding: "10px 12px", background: WHITE, borderRadius: 8, border: `2px solid ${ORANGE_B}` }}>
                  OR: <strong style={{ color: ORANGE_B }}>{fmtNum(l2Needed)} L2 members</strong> buying 1 Pro Package/mo → L2 ({pscRates[1] ?? 20}%) earns {fmtUsd(l2Needed * l2DollarPerUnit)}/mo.
                </div>
              )}
              {!hasProPkg && (
                <div style={{ fontSize: 12, color: ORANGE, padding: "8px 10px", background: WHITE, borderRadius: 8, border: `1px solid ${ORANGE_B}`, fontWeight: 600 }}>
                  💡 Pro Package products also unlock Level 2 commissions and MCB bonuses.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "32px", background: ORANGE_M, borderRadius: 14, border: `2px dashed ${ORANGE_B}` }}>
            <Target size={30} style={{ margin: "0 auto 10px", color: ORANGE_B }} />
            <div style={{ fontSize: 14, color: ORANGE, fontWeight: 600 }}>Load a product in Step 1 to activate this calculator.</div>
          </div>
        )}
      </SectionCard>

      {/* ── Disclaimer ──────────────────────────────────────────────────── */}
      <div style={{ marginTop: 16, padding: "12px 18px", background: "#f9fafb", borderRadius: 10, border: "2px solid #e5e7eb", fontSize: 12, color: "#6b7280", lineHeight: 1.7 }}>
        <strong style={{ color: "#374151" }}>Disclaimer:</strong> This calculator is for illustrative and educational purposes based on the NFGN compensation plan. Actual results vary. No income is guaranteed. Refer to the official NFGN Compensation Plan for authoritative rules.
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function SectionCard({ children, borderColor, topColor, disabled }: { children: React.ReactNode; borderColor: string; topColor: string; disabled?: boolean; }) {
  return (
    <div style={{
      background: WHITE, borderRadius: 18, marginBottom: 20,
      border: `3px solid ${borderColor}`,
      borderTop: `6px solid ${topColor}`,
      padding: "24px",
      opacity: disabled ? 0.45 : 1,
      pointerEvents: disabled ? "none" : "auto",
      transition: "opacity 0.2s",
      boxShadow: `0 4px 20px ${borderColor}25`,
    }}>
      {children}
    </div>
  );
}

function StepHeader({ n, title }: { n: number; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
      <div style={{
        width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
        background: `linear-gradient(135deg, ${GREEN}, ${GREEN_D})`,
        color: WHITE, fontSize: 17, fontWeight: 900,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 3px 12px rgba(22,163,74,0.5)`,
      }}>
        {n}
      </div>
      <h2 style={{ fontWeight: 900, fontSize: 19, margin: 0, color: DARK }}>{title}</h2>
    </div>
  );
}
