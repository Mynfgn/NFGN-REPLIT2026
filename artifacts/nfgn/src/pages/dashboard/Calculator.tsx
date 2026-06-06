import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { customFetch } from "@/lib/custom-fetch";
import {
  Calculator, Search, TrendingUp, Target,
  DollarSign, Users, Award, Loader2,
  Package, AlertCircle,
} from "lucide-react";

// ── Palette ───────────────────────────────────────────────────────────────────
const WHITE    = "#ffffff";
const GREEN    = "#16a34a";
const GREEN_D  = "#14532d";
const GREEN_M  = "#86efac";   // green-300 — clearly visible tint
const YELLOW   = "#a16207";   // dark yellow — readable on white
const YELLOW_B = "#fbbf24";   // bright amber-yellow
const YELLOW_M = "#fde68a";   // amber-200 — visible yellow tint
const ORANGE   = "#c2410c";   // dark orange — readable on white
const ORANGE_B = "#f97316";   // bright orange (buttons, badges)
const ORANGE_M = "#fed7aa";   // orange-200 — visible orange tint
const DARK     = "#111827";

const RC  = 0.10;
const SC  = 0.10;
const L1C = 0.10;
const L2C = 0.20;

function fmtId(id: number)  { return `NFGN-${String(id).padStart(5, "0")}`; }
function fmtUsd(n: number)  { return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtNum(n: number)  { return n.toLocaleString("en-US"); }

interface CalcProduct { id: number; name: string; price: number; cv: number; isProPackage: boolean; commissionRate: number; commissionType: string; commissionAmount: number; }

function parseProductId(raw: string): number | null {
  const c = raw.trim().replace(/^nfgn-0*/i, "").replace(/^0+/, "") || "0";
  const n = parseInt(c);
  return isNaN(n) || n <= 0 ? null : n;
}

function buildLevels(l1Size: number, dup: number, avgPurchases: number, price: number, isProPkg: boolean, rcPerUnit: number) {
  const levels: { level: number; size: number; monthlyUnits: number; yourComm: number; orgComm: number; label: string; }[] = [];
  for (let i = 1; i <= 9; i++) {
    const size = i === 1 ? l1Size : levels[i - 2].size * dup;
    const monthlyUnits = size * avgPurchases;
    // RC is a flat dollar amount per unit; SC/L1C/L2C are still % of price
    const yourCommPerUnit = i === 1
      ? (rcPerUnit + price * (isProPkg ? L1C : SC))
      : (i === 2 && isProPkg) ? price * L2C : 0;
    const yourComm = monthlyUnits * yourCommPerUnit;
    const orgComm  = monthlyUnits * (rcPerUnit + price * (isProPkg ? L1C : SC));
    const label = i === 1 ? "Direct Referrals" : i === 2 ? "Their Referrals" : `Generation ${i}`;
    levels.push({ level: i, size, monthlyUnits, yourComm, orgComm, label });
  }
  return levels;
}

export function CalculatorPage() {
  const [idInput,       setIdInput]       = useState("");
  const [product,       setProduct]       = useState<CalcProduct | null>(null);
  const [lookupError,   setLookupError]   = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [personalSales, setPersonalSales] = useState(5);
  const [l1Size,        setL1Size]        = useState(7);
  const [dupFactor,     setDupFactor]     = useState(5);
  const [avgPurchases,  setAvgPurchases]  = useState(1);
  const [targetIncome,  setTargetIncome]  = useState(4500);

  async function lookupProduct() {
    const id = parseProductId(idInput);
    if (!id) { setLookupError("Enter a valid Product ID — e.g. NFGN-00001 or just 1"); return; }
    setLookupLoading(true); setLookupError("");
    try {
      const res = await customFetch(`/api/products/${id}`);
      if (!res.ok) { setLookupError(`Product "${idInput.trim()}" not found.`); setProduct(null); return; }
      const d = await res.json();
      setProduct({ id: d.id, name: d.name, price: parseFloat(d.price), cv: d.cv ?? 0, isProPackage: !!d.isProPackage, commissionRate: parseFloat(d.commissionRate) || 10, commissionType: d.commissionType ?? "flat", commissionAmount: parseFloat(d.commissionAmount) || 0 });
    } catch { setLookupError("Failed to load product. Please try again."); }
    finally   { setLookupLoading(false); }
  }

  const price    = product?.price ?? 0;
  const isProPkg = product?.isProPackage ?? false;
  // RC per unit: commissionRate (%) × price → dollar amount per unit sold
  const rcPerUnit = product ? price * (product.commissionRate / 100) : price * RC;
  const commPerSalePersonal = rcPerUnit + price * (isProPkg ? L1C : SC);
  const commL2PerSale       = isProPkg ? price * L2C : 0;
  const levels = product ? buildLevels(l1Size, dupFactor, avgPurchases, price, isProPkg, rcPerUnit) : [];

  const myPersonalEarnings = personalSales * commPerSalePersonal;
  const myL1Earnings       = levels[0]?.yourComm ?? 0;
  const myL2Earnings       = levels[1]?.yourComm ?? 0;
  const myCommTotal        = myPersonalEarnings + myL1Earnings + myL2Earnings;
  const clbEarned          = l1Size >= 7 ? 100 : 0;
  const l2Total            = levels[1] ? levels[1].size * avgPurchases : 0;
  const mcbCount           = isProPkg ? Math.floor(l2Total / 7) : 0;
  const mcbEarned          = mcbCount * 200;
  const totalWithBonus     = myCommTotal + clbEarned + mcbEarned;
  const orgCollective      = levels.reduce((s, l) => s + l.orgComm, 0);

  const goalPersonalOnly  = commPerSalePersonal > 0 ? Math.ceil(targetIncome / commPerSalePersonal) : 0;
  const earningsFrom5     = 5 * commPerSalePersonal;
  const l1Needed          = commPerSalePersonal > 0 ? Math.ceil(Math.max(0, targetIncome - earningsFrom5) / commPerSalePersonal) : 0;
  const l1WithBonusNeeded = commPerSalePersonal > 0 ? Math.ceil(Math.max(0, targetIncome - 100 - earningsFrom5) / commPerSalePersonal) : 0;
  const l2Needed          = isProPkg && commL2PerSale > 0 ? Math.ceil(targetIncome / commL2PerSale) : null;

  return (
    <div style={{ maxWidth: 940, margin: "0 auto", padding: "24px 16px 56px" }}>

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
            Products, Services & Commissions Calculator
          </h1>
          <p style={{ fontSize: 13, color: YELLOW_B, margin: "4px 0 0" }}>
            Enter any NFGN Product ID to calculate your earning potential across 9 generations.
          </p>
        </div>
      </div>

      {/* ── STEP 1 ──────────────────────────────────────────────────────── */}
      <SectionCard borderColor={GREEN} topColor={GREEN}>
        <StepHeader n={1} title="Product Lookup" />
        <p style={{ fontSize: 13, color: "#444", marginBottom: 16, lineHeight: 1.7 }}>
          Enter the Product ID displayed on any product in the shop. The system loads price, PV/CV, and commission type automatically.
        </p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
          <Input
            value={idInput}
            onChange={e => setIdInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && lookupProduct()}
            placeholder="NFGN-00001  or just  1"
            style={{ width: 240, fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.05em", border: `2px solid ${GREEN}`, background: GREEN_M + "60" }}
          />
          <Button
            onClick={lookupProduct}
            disabled={lookupLoading || !idInput.trim()}
            style={{ background: `linear-gradient(135deg, ${ORANGE_B}, #fb923c)`, color: WHITE, fontWeight: 800, gap: 6, border: "none", boxShadow: `0 3px 12px rgba(249,115,22,0.5)` }}
          >
            {lookupLoading ? <><Loader2 size={14} className="animate-spin" /> Loading…</> : <><Search size={14} /> Load Product</>}
          </Button>
        </div>

        {lookupError && (
          <div style={{ display: "flex", gap: 6, alignItems: "center", color: "#dc2626", fontSize: 13, padding: "8px 12px", background: "#fef2f2", borderRadius: 8, border: "2px solid #fca5a5", marginBottom: 8 }}>
            <AlertCircle size={14} /> {lookupError}
          </div>
        )}

        {product && (
          <div style={{ marginTop: 16, padding: "20px 22px", background: GREEN_M + "50", border: `2px solid ${GREEN}`, borderRadius: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 900, color: WHITE, background: GREEN, padding: "5px 14px", borderRadius: 8, letterSpacing: "0.06em" }}>
                    {fmtId(product.id)}
                  </span>
                  {isProPkg && (
                    <span style={{ fontSize: 11, fontWeight: 900, color: WHITE, background: ORANGE_B, padding: "5px 12px", borderRadius: 8, letterSpacing: "0.04em" }}>
                      ⭐ PRO PACKAGE
                    </span>
                  )}
                </div>
                <div style={{ fontWeight: 800, fontSize: 20, color: DARK }}>{product.name}</div>
                <div style={{ fontSize: 13, color: "#555", marginTop: 3 }}>
                  {isProPkg ? "Pro Package — generates Level 1 & Level 2 commissions" : "Regular product — generates Referral + Sales commissions"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, flexShrink: 0, flexWrap: "wrap" }}>
                {[
                  { label: "Price",     value: fmtUsd(product.price), bg: GREEN_D,  text: YELLOW_B },
                  { label: "PV / CV",   value: String(product.cv),    bg: YELLOW_B, text: GREEN_D  },
                  { label: "RC / unit", value: fmtUsd(rcPerUnit), bg: ORANGE_B, text: WHITE },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: "center", background: s.bg, borderRadius: 12, padding: "10px 18px", minWidth: 80 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: s.text + "bb", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: s.text }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ borderTop: `2px solid ${GREEN}`, paddingTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: ORANGE, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
                💰 Your Commission Per Sale (as a Pro Member)
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {[
                  { label: "Referral Commission (RC)", pct: `${product.commissionRate}%`, amt: rcPerUnit, sub: "% of sale price → dollar amount", bg: GREEN_M,  border: GREEN,    val: GREEN_D  },
                  { label: isProPkg ? "Level 1 Commission" : "Sales Commission", pct: "10%", amt: price * (isProPkg ? L1C : SC), sub: isProPkg ? "Your L1 buys Pro Package" : "Regular product sale", bg: YELLOW_M, border: YELLOW_B, val: YELLOW },
                  { label: "Your Total Per Direct Sale", pct: `${product.commissionRate + 10}%`, amt: commPerSalePersonal, sub: "Combined RC% + Sales/L1%",  bg: GREEN,    border: GREEN_D,  val: WHITE,  bold: true },
                  ...(isProPkg ? [{ label: "Level 2 Commission", pct: "20%", amt: commL2PerSale, sub: "Your L2 buys Pro Package", bg: ORANGE_M, border: ORANGE_B, val: ORANGE }] : []),
                ].map(item => (
                  <div key={item.label} style={{ flex: "1 1 150px", padding: "14px 16px", background: item.bg, borderRadius: 12, border: `2px solid ${item.border}` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: item.bold ? "rgba(255,255,255,0.75)" : "#555", marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: item.val }}>
                      {fmtUsd(item.amt)} <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.65 }}>({item.pct})</span>
                    </div>
                    <div style={{ fontSize: 11, color: item.bold ? "rgba(255,255,255,0.65)" : "#666", marginTop: 2 }}>{item.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!product && (
          <div style={{ marginTop: 12, padding: "28px", background: GREEN_M + "70", borderRadius: 12, border: `2px dashed ${GREEN}`, textAlign: "center" }}>
            <Package size={32} style={{ margin: "0 auto 10px", color: GREEN }} />
            <div style={{ fontSize: 13, color: GREEN_D, fontWeight: 600 }}>Load a product to see commission details and activate the calculators below.</div>
          </div>
        )}
      </SectionCard>

      {/* ── STEP 2 ──────────────────────────────────────────────────────── */}
      <SectionCard borderColor={YELLOW_B} topColor={YELLOW_B} disabled={!product}>
        <StepHeader n={2} title="9-Level Organization Builder" />
        <p style={{ fontSize: 13, color: "#444", marginBottom: 20, lineHeight: 1.7 }}>
          Set your personal sales, Level 1 team size, duplication factor, and monthly purchases. Projects earnings through all 9 generations.
        </p>

        {/* Inputs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
          {[
            { label: "Your Personal Sales / Month",    value: personalSales, setter: setPersonalSales, min: 0, hint: price > 0 ? `Earns ${fmtUsd(personalSales * commPerSalePersonal)}/mo` : "Load a product first", bg: GREEN_M,  border: GREEN,    color: GREEN_D   },
            { label: "Level 1 Team Size",              value: l1Size,        setter: setL1Size,        min: 0, hint: l1Size >= 7 ? "✓ CLB eligible!"      : `${7 - l1Size} more needed for CLB`,       bg: YELLOW_M, border: YELLOW_B, color: YELLOW  },
            { label: "Duplication Factor (L2–L9)",     value: dupFactor,     setter: setDupFactor,     min: 1, hint: "Recruits per member per level",                                                    bg: ORANGE_M, border: ORANGE_B, color: ORANGE  },
            { label: "Avg Purchases / Person / Month", value: avgPurchases,  setter: setAvgPurchases,  min: 1, hint: "Units each person buys/month",                                                     bg: GREEN_M,  border: GREEN,    color: GREEN_D   },
          ].map(row => (
            <div key={row.label} style={{ background: row.bg, borderRadius: 12, border: `2px solid ${row.border}`, padding: "12px 14px" }}>
              <Label style={{ fontSize: 11, fontWeight: 900, color: row.color, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{row.label}</Label>
              <Input
                type="number"
                min={row.min}
                value={row.value}
                onChange={e => row.setter(Math.max(row.min, parseInt(e.target.value) || 0))}
                style={{ fontWeight: 800, fontSize: 18, border: `2px solid ${row.border}`, background: WHITE }}
              />
              <div style={{ fontSize: 11, color: row.color, marginTop: 5, fontWeight: 700 }}>{row.hint}</div>
            </div>
          ))}
        </div>

        {/* 9-Level table */}
        <div style={{ overflowX: "auto", marginBottom: 22, borderRadius: 14, border: `2px solid ${GREEN}`, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: `linear-gradient(135deg, ${GREEN_D}, #166534)` }}>
                {["Level", "Description", "Team Size", "Monthly Units", "Your Commission", "Org Collective", "Flows To You?"].map(h => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, fontWeight: 900, color: YELLOW_B, letterSpacing: "0.07em", whiteSpace: "nowrap", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr style={{ background: GREEN_M, borderBottom: `2px solid ${GREEN}` }}>
                <td style={{ padding: "11px 14px", fontWeight: 900, color: GREEN_D, fontSize: 15 }}>You</td>
                <td style={{ padding: "11px 14px", color: DARK, fontWeight: 600 }}>Personal Sales</td>
                <td style={{ padding: "11px 14px", fontWeight: 700 }}>—</td>
                <td style={{ padding: "11px 14px", fontWeight: 800, color: ORANGE }}>{personalSales}</td>
                <td style={{ padding: "11px 14px", fontWeight: 900, color: GREEN_D, fontSize: 15 }}>{fmtUsd(myPersonalEarnings)}</td>
                <td style={{ padding: "11px 14px", color: "#aaa" }}>—</td>
                <td style={{ padding: "11px 14px" }}><span style={{ color: WHITE, fontWeight: 900, fontSize: 11, background: GREEN, padding: "3px 10px", borderRadius: 6 }}>✓ YOURS</span></td>
              </tr>
              {levels.map((lv, i) => {
                const isYours = lv.yourComm > 0;
                return (
                  <tr key={lv.level} style={{ background: isYours ? GREEN_M + "80" : (i % 2 === 0 ? "#f9fafb" : WHITE), borderBottom: `1px solid ${isYours ? GREEN : "#e5e7eb"}` }}>
                    <td style={{ padding: "10px 14px", fontWeight: 900, color: isYours ? GREEN_D : "#d1d5db", fontSize: 14 }}>L{lv.level}</td>
                    <td style={{ padding: "10px 14px", color: "#555" }}>{lv.label}</td>
                    <td style={{ padding: "10px 14px", fontWeight: 700, color: isYours ? ORANGE : "#9ca3af" }}>{fmtNum(lv.size)}</td>
                    <td style={{ padding: "10px 14px", color: isYours ? DARK : "#9ca3af" }}>{fmtNum(lv.monthlyUnits)}</td>
                    <td style={{ padding: "10px 14px", fontWeight: isYours ? 900 : 400, color: isYours ? GREEN_D : "#d1d5db", fontSize: isYours ? 15 : 13 }}>
                      {isYours ? fmtUsd(lv.yourComm) : "—"}
                    </td>
                    <td style={{ padding: "10px 14px", color: "#6b7280" }}>{fmtUsd(lv.orgComm)}</td>
                    <td style={{ padding: "10px 14px" }}>
                      {isYours
                        ? <span style={{ color: WHITE, fontWeight: 900, fontSize: 11, background: GREEN, padding: "3px 10px", borderRadius: 6 }}>✓ YOURS</span>
                        : <span style={{ color: "#d1d5db", fontSize: 12 }}>Their sponsors</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Earnings summary */}
        <div style={{ background: `linear-gradient(135deg, ${GREEN_D} 0%, #166534 100%)`, borderRadius: 16, padding: "22px 26px", border: `3px solid ${GREEN}`, boxShadow: `0 4px 24px rgba(22,163,74,0.35)` }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: YELLOW_B, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <TrendingUp size={14} /> Monthly Earnings Summary
          </div>
          {[
            { label: "Personal Sales Commission",             amount: myPersonalEarnings, desc: `${personalSales} sales × ${fmtUsd(commPerSalePersonal)}/sale`,                           color: GREEN_M   },
            { label: "Level 1 Commission",                    amount: myL1Earnings,       desc: `${fmtNum(l1Size)} members × ${avgPurchases} × ${fmtUsd(commPerSalePersonal)}`,            color: YELLOW_B  },
            ...(isProPkg ? [{ label: "Level 2 Commission (Pro Pkg)", amount: myL2Earnings, desc: `${fmtNum(levels[1]?.size ?? 0)} members × ${avgPurchases} × ${fmtUsd(commL2PerSale)}`, color: ORANGE_B }] : []),
            { label: "CLB Bonus",                             amount: clbEarned,          desc: l1Size >= 7 ? "✓ 7+ qualified L1 Pro Members" : `Need ${7 - l1Size} more L1 to qualify`,  color: ORANGE_B  },
            ...(isProPkg ? [{ label: `MCB Bonus (${mcbCount}× at $200)`, amount: mcbEarned, desc: `${fmtNum(l2Total)} L2 purchases ÷ 7 = ${mcbCount} payments`,                         color: "#fdba74" }] : []),
          ].map(row => (
            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              <div>
                <div style={{ fontSize: 13, color: "#d1fae5" }}>{row.label}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>{row.desc}</div>
              </div>
              <div style={{ fontSize: 17, fontWeight: 900, color: row.amount > 0 ? row.color : "rgba(255,255,255,0.2)", minWidth: 100, textAlign: "right" }}>{fmtUsd(row.amount)}</div>
            </div>
          ))}
          <div style={{ borderTop: `2px solid ${YELLOW_B}60`, marginTop: 16, paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: WHITE }}>Your Total Monthly Income</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                Org collective: <span style={{ color: GREEN_M, fontWeight: 700 }}>{fmtUsd(orgCollective)}/mo</span> throughout your network
              </div>
            </div>
            <div style={{ fontSize: 38, fontWeight: 900, color: YELLOW_B, textShadow: `0 0 20px rgba(251,191,36,0.7)` }}>{fmtUsd(totalWithBonus)}</div>
          </div>
        </div>
      </SectionCard>

      {/* ── STEP 3 ──────────────────────────────────────────────────────── */}
      <SectionCard borderColor={ORANGE_B} topColor={ORANGE_B} disabled={!product}>
        <StepHeader n={3} title="Income Goal Calculator" />
        <p style={{ fontSize: 13, color: "#444", marginBottom: 20, lineHeight: 1.7 }}>
          How much do you want to earn per month? Choose a target and see exactly what it takes — selling <strong style={{ color: GREEN }}>{product?.name ?? "this product"}</strong>.
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

        {price > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>

            {/* Scenario A — Green */}
            <div style={{ background: GREEN_M, borderRadius: 14, border: `3px solid ${GREEN}`, padding: "20px" }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: GREEN_D, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Scenario A</div>
              <div style={{ fontWeight: 800, fontSize: 15, color: GREEN_D, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                <DollarSign size={16} style={{ color: GREEN }} /> Personal Sales Only
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: GREEN_D, marginBottom: 6 }}>
                {fmtNum(goalPersonalOnly)} <span style={{ fontSize: 14, fontWeight: 600, color: "#6b7280" }}>sales/mo</span>
              </div>
              <div style={{ fontSize: 13, color: GREEN_D, lineHeight: 1.6, marginBottom: 10 }}>
                You personally sell {fmtNum(goalPersonalOnly)} units every month.
              </div>
              <div style={{ fontSize: 12, color: GREEN_D, padding: "8px 12px", background: WHITE, borderRadius: 8, fontWeight: 700, border: `2px solid ${GREEN}` }}>
                {fmtNum(goalPersonalOnly)} × {fmtUsd(commPerSalePersonal)} = {fmtUsd(goalPersonalOnly * commPerSalePersonal)}/mo
              </div>
            </div>

            {/* Scenario B — Yellow */}
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

            {/* Scenario C — Orange */}
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
              {isProPkg && l2Needed !== null && (
                <div style={{ fontSize: 13, color: ORANGE, lineHeight: 1.8, padding: "10px 12px", background: WHITE, borderRadius: 8, border: `2px solid ${ORANGE_B}` }}>
                  OR: <strong style={{ color: ORANGE_B }}>{fmtNum(l2Needed)} L2 members</strong> buying 1 Pro Package/mo → <strong style={{ color: GREEN_D }}>Level 2 (20%)</strong> earns {fmtUsd(l2Needed * commL2PerSale)}/mo.
                </div>
              )}
              {!isProPkg && (
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
