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

// ── Palette: white · green · yellow · orange ──────────────────────────────────
const WHITE   = "#ffffff";
const GREEN   = "#16a34a";   // vibrant green
const GREEN_D = "#14532d";   // deep green (headers)
const GREEN_L = "#dcfce7";   // light green tint
const YELLOW  = "#ca8a04";   // rich yellow (readable on white)
const YELLOW2 = "#fde047";   // bright yellow (decorative)
const YELLOW_L= "#fefce8";   // light yellow tint
const ORANGE  = "#ea580c";   // vivid orange (CTAs, bonuses)
const ORANGE2 = "#fb923c";   // lighter orange
const ORANGE_L= "#fff7ed";   // light orange tint
const DARK    = "#111827";   // near-black text

// ── Comp plan rates ───────────────────────────────────────────────────────────
const RC  = 0.10;
const SC  = 0.10;
const L1C = 0.10;
const L2C = 0.20;

function fmtId(id: number) { return `NFGN-${String(id).padStart(5, "0")}`; }
function fmtUsd(n: number)  { return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtNum(n: number)  { return n.toLocaleString("en-US"); }

interface CalcProduct { id: number; name: string; price: number; cv: number; isProPackage: boolean; }

function parseProductId(raw: string): number | null {
  const cleaned = raw.trim().replace(/^nfgn-0*/i, "").replace(/^0+/, "") || "0";
  const n = parseInt(cleaned);
  return isNaN(n) || n <= 0 ? null : n;
}

function buildLevels(l1Size: number, dupFactor: number, avgPurchases: number, price: number, isProPkg: boolean) {
  const levels: { level: number; size: number; monthlyUnits: number; yourComm: number; orgComm: number; label: string; }[] = [];
  for (let i = 1; i <= 9; i++) {
    const size = i === 1 ? l1Size : (levels[i - 2].size * dupFactor);
    const monthlyUnits = size * avgPurchases;
    const rateForYou  = i === 1 ? (RC + (isProPkg ? L1C : SC)) : (i === 2 && isProPkg) ? L2C : 0;
    const yourComm    = monthlyUnits * price * rateForYou;
    const orgComm     = monthlyUnits * price * (RC + (isProPkg ? L1C : SC));
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
      setProduct({ id: d.id, name: d.name, price: parseFloat(d.price), cv: d.cv ?? 0, isProPackage: !!d.isProPackage });
    } catch { setLookupError("Failed to load product. Please try again."); }
    finally   { setLookupLoading(false); }
  }

  const price    = product?.price ?? 0;
  const isProPkg = product?.isProPackage ?? false;
  const commPerSalePersonal = price * (RC + (isProPkg ? L1C : SC));
  const commL2PerSale       = isProPkg ? price * L2C : 0;
  const levels = product ? buildLevels(l1Size, dupFactor, avgPurchases, price, isProPkg) : [];

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

  const goalPersonalOnly    = commPerSalePersonal > 0 ? Math.ceil(targetIncome / commPerSalePersonal) : 0;
  const earningsFrom5       = 5 * commPerSalePersonal;
  const l1Needed            = commPerSalePersonal > 0 ? Math.ceil(Math.max(0, targetIncome - earningsFrom5) / commPerSalePersonal) : 0;
  const l1WithBonusNeeded   = commPerSalePersonal > 0 ? Math.ceil(Math.max(0, targetIncome - 100 - earningsFrom5) / commPerSalePersonal) : 0;
  const l2Needed            = isProPkg && commL2PerSale > 0 ? Math.ceil(targetIncome / commL2PerSale) : null;

  return (
    <div style={{ maxWidth: 940, margin: "0 auto", padding: "24px 16px 56px" }}>

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div style={{
        marginBottom: 28, padding: "22px 26px", borderRadius: 18,
        background: `linear-gradient(135deg, ${GREEN_D} 0%, #1a5c2a 50%, #1e3a1e 100%)`,
        border: `2px solid ${GREEN}`,
        display: "flex", alignItems: "center", gap: 16,
        boxShadow: `0 4px 24px ${GREEN}40`,
      }}>
        <div style={{
          width: 54, height: 54, borderRadius: 14, flexShrink: 0,
          background: `linear-gradient(135deg, ${YELLOW2}, ${ORANGE2})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 18px ${YELLOW2}80`,
        }}>
          <Calculator size={28} style={{ color: GREEN_D }} />
        </div>
        <div>
          <h1 style={{ fontFamily: "'Georgia',serif", fontSize: 22, fontWeight: 900, margin: 0, color: WHITE, lineHeight: 1.2 }}>
            Products, Services & Commissions Calculator
          </h1>
          <p style={{ fontSize: 13, color: `${YELLOW2}cc`, margin: "4px 0 0" }}>
            Enter any NFGN Product ID to calculate your earning potential across 9 generations.
          </p>
        </div>
      </div>

      {/* ── STEP 1: Product Lookup ───────────────────────────────────────── */}
      <div style={{ background: WHITE, borderRadius: 18, border: `2px solid ${GREEN}30`, padding: "24px", marginBottom: 20, boxShadow: `0 2px 16px ${GREEN}10` }}>
        <StepHeader n={1} title="Product Lookup" />
        <p style={{ fontSize: 13, color: "#555", marginBottom: 16, lineHeight: 1.7 }}>
          Enter the Product ID displayed on any product in the shop. The system loads price, PV/CV, and commission type automatically.
        </p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
          <Input
            value={idInput}
            onChange={e => setIdInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && lookupProduct()}
            placeholder="NFGN-00001  or just  1"
            style={{ width: 240, fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.05em", borderColor: `${GREEN}50`, background: GREEN_L }}
          />
          <Button
            onClick={lookupProduct}
            disabled={lookupLoading || !idInput.trim()}
            style={{ background: `linear-gradient(135deg, ${ORANGE}, ${ORANGE2})`, color: WHITE, fontWeight: 800, gap: 6, border: "none", boxShadow: `0 2px 10px ${ORANGE}50` }}
          >
            {lookupLoading
              ? <><Loader2 size={14} className="animate-spin" /> Loading…</>
              : <><Search size={14} /> Load Product</>}
          </Button>
        </div>

        {lookupError && (
          <div style={{ display: "flex", gap: 6, alignItems: "center", color: "#dc2626", fontSize: 13, padding: "8px 12px", background: "#fef2f2", borderRadius: 8, border: "1px solid #fecaca" }}>
            <AlertCircle size={14} /> {lookupError}
          </div>
        )}

        {product && (
          <div style={{ marginTop: 16, padding: "20px 22px", background: `linear-gradient(135deg, ${GREEN_L}, ${YELLOW_L})`, border: `2px solid ${GREEN}40`, borderRadius: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 900, color: WHITE, background: `linear-gradient(135deg, ${GREEN}, ${GREEN_D})`, padding: "4px 12px", borderRadius: 8, letterSpacing: "0.06em", boxShadow: `0 2px 8px ${GREEN}50` }}>
                    {fmtId(product.id)}
                  </span>
                  {isProPkg && (
                    <span style={{ fontSize: 11, fontWeight: 900, color: WHITE, background: `linear-gradient(135deg, ${ORANGE}, ${ORANGE2})`, padding: "4px 12px", borderRadius: 8, letterSpacing: "0.04em", boxShadow: `0 2px 8px ${ORANGE}50` }}>
                      ⭐ PRO PACKAGE
                    </span>
                  )}
                </div>
                <div style={{ fontWeight: 800, fontSize: 20, color: DARK }}>{product.name}</div>
                <div style={{ fontSize: 13, color: "#666", marginTop: 3 }}>
                  {isProPkg ? "Pro Package — generates Level 1 & Level 2 commissions" : "Regular product — generates Referral + Sales commissions"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
                {[
                  { label: "Price",     value: fmtUsd(product.price), bg: GREEN_D,  text: YELLOW2 },
                  { label: "PV / CV",   value: String(product.cv),    bg: YELLOW,   text: WHITE   },
                  { label: "RC / sale", value: fmtUsd(price * RC),    bg: ORANGE,   text: WHITE   },
                ].map(stat => (
                  <div key={stat.label} style={{ textAlign: "center", background: stat.bg, borderRadius: 12, padding: "10px 18px", minWidth: 80 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: `${stat.text}90`, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>{stat.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: stat.text }}>{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ borderTop: `2px solid ${GREEN}25`, paddingTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: ORANGE, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
                💰 Your Commission Per Sale (as a Pro Member)
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {[
                  { label: "Referral Commission (RC)", pct: "10%", amt: price * RC, sub: "On every direct purchase", bg: GREEN_L, border: `2px solid ${GREEN}40`, val: GREEN },
                  { label: isProPkg ? "Level 1 Commission" : "Sales Commission", pct: "10%", amt: price * (isProPkg ? L1C : SC), sub: isProPkg ? "Your L1 buys Pro Package" : "Regular product sale", bg: YELLOW_L, border: `2px solid ${YELLOW}60`, val: YELLOW },
                  { label: "Your Total Per Direct Sale", pct: "20%", amt: commPerSalePersonal, sub: "Combined", bg: `linear-gradient(135deg, ${ORANGE}, ${ORANGE2})`, border: "none", val: WHITE, bold: true },
                  ...(isProPkg ? [{ label: "Level 2 Commission", pct: "20%", amt: commL2PerSale, sub: "Your L2 buys Pro Package", bg: ORANGE_L, border: `2px solid ${ORANGE}40`, val: ORANGE }] : []),
                ].map(item => (
                  <div key={item.label} style={{ flex: "1 1 150px", padding: "14px 16px", background: item.bg as string, borderRadius: 12, border: item.border as string }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: item.bold ? `rgba(255,255,255,0.8)` : "#666", marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: item.val }}>
                      {fmtUsd(item.amt)} <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.6 }}>({item.pct})</span>
                    </div>
                    <div style={{ fontSize: 11, color: item.bold ? "rgba(255,255,255,0.7)" : "#777", marginTop: 2 }}>{item.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!product && (
          <div style={{ marginTop: 12, padding: "28px", background: GREEN_L, borderRadius: 12, border: `2px dashed ${GREEN}40`, textAlign: "center" }}>
            <Package size={32} style={{ margin: "0 auto 10px", color: GREEN, opacity: 0.5 }} />
            <div style={{ fontSize: 13, color: "#666" }}>Load a product to see commission details and activate the calculators below.</div>
          </div>
        )}
      </div>

      {/* ── STEP 2: Organization Builder ────────────────────────────────── */}
      <div style={{ background: WHITE, borderRadius: 18, border: `2px solid ${GREEN}25`, padding: "24px", marginBottom: 20, opacity: product ? 1 : 0.45, pointerEvents: product ? "auto" : "none", transition: "opacity 0.2s", boxShadow: `0 2px 16px ${GREEN}08` }}>
        <StepHeader n={2} title="9-Level Organization Builder" />
        <p style={{ fontSize: 13, color: "#555", marginBottom: 20, lineHeight: 1.7 }}>
          Set your personal sales, Level 1 team size, duplication factor, and monthly purchases. Projects earnings through all 9 generations based on the NFGN comp plan.
        </p>

        {/* Input grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
          {[
            { label: "Your Personal Sales / Month",    value: personalSales, setter: setPersonalSales, min: 0, hint: price > 0 ? `Earns ${fmtUsd(personalSales * commPerSalePersonal)}/mo` : "Load a product first", bg: GREEN_L, border: GREEN, color: GREEN },
            { label: "Level 1 Team Size",              value: l1Size,        setter: setL1Size,        min: 0, hint: l1Size >= 7 ? "✓ CLB eligible!" : `${7 - l1Size} more needed for CLB`, bg: YELLOW_L, border: YELLOW, color: YELLOW },
            { label: "Duplication Factor (L2–L9)",     value: dupFactor,     setter: setDupFactor,     min: 1, hint: "Recruits per member per level", bg: ORANGE_L, border: ORANGE, color: ORANGE },
            { label: "Avg Purchases / Person / Month", value: avgPurchases,  setter: setAvgPurchases,  min: 1, hint: "Units each person buys/month", bg: GREEN_L, border: GREEN, color: GREEN },
          ].map(row => (
            <div key={row.label} style={{ background: row.bg, borderRadius: 12, border: `2px solid ${row.border}40`, padding: "12px 14px" }}>
              <Label style={{ fontSize: 11, fontWeight: 900, color: row.color, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{row.label}</Label>
              <Input
                type="number"
                min={row.min}
                value={row.value}
                onChange={e => row.setter(Math.max(row.min, parseInt(e.target.value) || 0))}
                style={{ fontWeight: 800, fontSize: 18, border: `2px solid ${row.border}50`, background: WHITE }}
              />
              <div style={{ fontSize: 11, color: row.color, marginTop: 5, fontWeight: 700 }}>{row.hint}</div>
            </div>
          ))}
        </div>

        {/* 9-Level table */}
        <div style={{ overflowX: "auto", marginBottom: 22, borderRadius: 14, border: `2px solid ${GREEN}40`, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: `linear-gradient(135deg, ${GREEN_D} 0%, #1e5c2a 100%)` }}>
                {["Level", "Description", "Team Size", "Monthly Units", "Your Commission", "Org Collective", "Flows To You?"].map(h => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, fontWeight: 900, color: YELLOW2, letterSpacing: "0.07em", whiteSpace: "nowrap", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Personal row */}
              <tr style={{ background: `linear-gradient(90deg, ${GREEN_L}, ${YELLOW_L})`, borderBottom: `2px solid ${GREEN}30` }}>
                <td style={{ padding: "11px 14px", fontWeight: 900, color: GREEN, fontSize: 15 }}>You</td>
                <td style={{ padding: "11px 14px", color: DARK, fontWeight: 600 }}>Personal Sales</td>
                <td style={{ padding: "11px 14px", fontWeight: 700 }}>—</td>
                <td style={{ padding: "11px 14px", fontWeight: 800, color: ORANGE }}>{personalSales}</td>
                <td style={{ padding: "11px 14px", fontWeight: 900, color: GREEN, fontSize: 15 }}>{fmtUsd(myPersonalEarnings)}</td>
                <td style={{ padding: "11px 14px", color: "#bbb" }}>—</td>
                <td style={{ padding: "11px 14px" }}>
                  <span style={{ color: WHITE, fontWeight: 900, fontSize: 11, background: GREEN, padding: "3px 10px", borderRadius: 6 }}>✓ YOURS</span>
                </td>
              </tr>
              {levels.map((lv, i) => {
                const isYours = lv.yourComm > 0;
                return (
                  <tr key={lv.level} style={{ background: isYours ? `linear-gradient(90deg, ${GREEN_L}, ${WHITE})` : (i % 2 === 0 ? "#fafafa" : WHITE), borderBottom: `1px solid ${isYours ? GREEN + "30" : "#f0f0f0"}` }}>
                    <td style={{ padding: "10px 14px", fontWeight: 900, color: isYours ? GREEN : "#ccc", fontSize: 14 }}>L{lv.level}</td>
                    <td style={{ padding: "10px 14px", color: "#555" }}>{lv.label}</td>
                    <td style={{ padding: "10px 14px", fontWeight: 700, color: isYours ? ORANGE : "#888" }}>{fmtNum(lv.size)}</td>
                    <td style={{ padding: "10px 14px", color: isYours ? DARK : "#999" }}>{fmtNum(lv.monthlyUnits)}</td>
                    <td style={{ padding: "10px 14px", fontWeight: isYours ? 900 : 400, color: isYours ? GREEN : "#ccc", fontSize: isYours ? 15 : 13 }}>
                      {isYours ? fmtUsd(lv.yourComm) : "—"}
                    </td>
                    <td style={{ padding: "10px 14px", color: "#888" }}>{fmtUsd(lv.orgComm)}</td>
                    <td style={{ padding: "10px 14px" }}>
                      {isYours
                        ? <span style={{ color: WHITE, fontWeight: 900, fontSize: 11, background: GREEN, padding: "3px 10px", borderRadius: 6 }}>✓ YOURS</span>
                        : <span style={{ color: "#ccc", fontSize: 12 }}>Their sponsors</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Earnings summary card */}
        <div style={{ background: `linear-gradient(135deg, ${GREEN_D} 0%, #1e4d1e 50%, #2d3b0e 100%)`, borderRadius: 16, padding: "22px 26px", border: `2px solid ${GREEN}60`, boxShadow: `0 4px 28px ${GREEN}30` }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: YELLOW2, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <TrendingUp size={14} /> Monthly Earnings Summary
          </div>
          {[
            { label: "Personal Sales Commission",             amount: myPersonalEarnings, desc: `${personalSales} sales × ${fmtUsd(commPerSalePersonal)}/sale`, color: "#86efac" },
            { label: "Level 1 Commission",                    amount: myL1Earnings,       desc: `${fmtNum(l1Size)} members × ${avgPurchases} × ${fmtUsd(commPerSalePersonal)}`, color: YELLOW2 },
            ...(isProPkg ? [{ label: "Level 2 Commission (Pro Pkg)", amount: myL2Earnings, desc: `${fmtNum(levels[1]?.size ?? 0)} members × ${avgPurchases} × ${fmtUsd(commL2PerSale)}`, color: ORANGE2 }] : []),
            { label: "CLB Bonus",                             amount: clbEarned,          desc: l1Size >= 7 ? "✓ 7+ qualified L1 Pro Members" : `Need ${7 - l1Size} more L1 to qualify`, color: ORANGE2 },
            ...(isProPkg ? [{ label: `MCB Bonus (${mcbCount}× at $200)`, amount: mcbEarned, desc: `${fmtNum(l2Total)} L2 purchases ÷ 7 = ${mcbCount} payments`, color: "#fdba74" }] : []),
          ].map(row => (
            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <div>
                <div style={{ fontSize: 13, color: "#d1fae5" }}>{row.label}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{row.desc}</div>
              </div>
              <div style={{ fontSize: 17, fontWeight: 900, color: row.amount > 0 ? row.color : "rgba(255,255,255,0.2)", minWidth: 100, textAlign: "right" }}>{fmtUsd(row.amount)}</div>
            </div>
          ))}

          <div style={{ borderTop: `2px solid ${YELLOW2}30`, marginTop: 16, paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: WHITE }}>Your Total Monthly Income</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
                Org collective: <span style={{ color: "#86efac", fontWeight: 700 }}>{fmtUsd(orgCollective)}/mo</span> flowing through your network
              </div>
            </div>
            <div style={{ fontSize: 38, fontWeight: 900, color: YELLOW2, textShadow: `0 0 20px ${YELLOW2}80` }}>{fmtUsd(totalWithBonus)}</div>
          </div>
        </div>
      </div>

      {/* ── STEP 3: Income Goal Calculator ──────────────────────────────── */}
      <div style={{ background: WHITE, borderRadius: 18, border: `2px solid ${GREEN}25`, padding: "24px", opacity: product ? 1 : 0.45, pointerEvents: product ? "auto" : "none", transition: "opacity 0.2s", boxShadow: `0 2px 16px ${GREEN}08` }}>
        <StepHeader n={3} title="Income Goal Calculator" />
        <p style={{ fontSize: 13, color: "#555", marginBottom: 20, lineHeight: 1.7 }}>
          How much do you want to earn per month? Choose a target and see exactly what it takes — selling <strong style={{ color: GREEN }}>{product?.name ?? "this product"}</strong>.
        </p>

        {/* Target input */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 24, padding: "16px 20px", background: `linear-gradient(135deg, ${GREEN_L}, ${YELLOW_L})`, borderRadius: 14, border: `2px solid ${GREEN}30` }}>
          <Label style={{ fontWeight: 900, fontSize: 14, whiteSpace: "nowrap", color: GREEN_D }}>🎯 Target Monthly Income:</Label>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontWeight: 900, fontSize: 24, color: GREEN }}>$</span>
            <Input
              type="number"
              min={0}
              value={targetIncome}
              onChange={e => setTargetIncome(Math.max(0, parseInt(e.target.value) || 0))}
              style={{ width: 150, fontWeight: 900, fontSize: 20, borderColor: `${GREEN}50`, background: WHITE }}
            />
            <span style={{ color: "#666", fontSize: 14, fontWeight: 700 }}>/mo</span>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[500, 1000, 2500, 4500, 10000].map(amt => (
              <button
                key={amt}
                onClick={() => setTargetIncome(amt)}
                style={{
                  padding: "7px 14px", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 800, transition: "all 0.15s",
                  border: `2px solid ${targetIncome === amt ? ORANGE : "#ddd"}`,
                  background: targetIncome === amt ? `linear-gradient(135deg, ${ORANGE}, ${ORANGE2})` : WHITE,
                  color: targetIncome === amt ? WHITE : "#666",
                  boxShadow: targetIncome === amt ? `0 2px 8px ${ORANGE}50` : "none",
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
            <div style={{ background: `linear-gradient(135deg, ${GREEN_L}, ${WHITE})`, borderRadius: 14, border: `2px solid ${GREEN}50`, padding: "20px" }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: GREEN, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Scenario A</div>
              <div style={{ fontWeight: 800, fontSize: 15, color: DARK, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                <DollarSign size={16} style={{ color: GREEN }} /> Personal Sales Only
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: GREEN, marginBottom: 6 }}>
                {fmtNum(goalPersonalOnly)} <span style={{ fontSize: 14, fontWeight: 600, color: "#6b7280" }}>sales/mo</span>
              </div>
              <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, marginBottom: 10 }}>
                You personally sell {fmtNum(goalPersonalOnly)} units every month.
              </div>
              <div style={{ fontSize: 12, color: GREEN_D, padding: "8px 12px", background: GREEN_L, borderRadius: 8, fontWeight: 700, border: `1px solid ${GREEN}30` }}>
                {fmtNum(goalPersonalOnly)} × {fmtUsd(commPerSalePersonal)} = {fmtUsd(goalPersonalOnly * commPerSalePersonal)}/mo
              </div>
            </div>

            {/* Scenario B — Yellow */}
            <div style={{ background: `linear-gradient(135deg, ${YELLOW_L}, ${WHITE})`, borderRadius: 14, border: `2px solid ${YELLOW}60`, padding: "20px" }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: YELLOW, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Scenario B</div>
              <div style={{ fontWeight: 800, fontSize: 15, color: DARK, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                <Users size={16} style={{ color: YELLOW }} /> You + Level 1 Team
              </div>
              <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 12 }}>
                <div style={{ textAlign: "center", background: WHITE, borderRadius: 10, padding: "10px 16px", border: `2px solid ${GREEN}30` }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: GREEN }}>5</div>
                  <div style={{ fontSize: 11, color: "#888", fontWeight: 600 }}>Your sales</div>
                </div>
                <div style={{ fontSize: 24, color: YELLOW, fontWeight: 900 }}>+</div>
                <div style={{ textAlign: "center", background: WHITE, borderRadius: 10, padding: "10px 16px", border: `2px solid ${YELLOW}50` }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: YELLOW }}>{fmtNum(Math.max(0, l1Needed))}</div>
                  <div style={{ fontSize: 11, color: "#888", fontWeight: 600 }}>L1 members</div>
                </div>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.6, fontWeight: l1Needed <= 0 ? 700 : 400, color: l1Needed <= 0 ? GREEN : "#444" }}>
                {l1Needed <= 0 ? "✓ 5 personal sales already covers this goal!" : `Recruit ${l1Needed} direct referrals who each buy 1 unit/month.`}
              </div>
            </div>

            {/* Scenario C — Orange */}
            <div style={{ background: `linear-gradient(135deg, ${ORANGE_L}, ${WHITE})`, borderRadius: 14, border: `2px solid ${ORANGE}50`, padding: "20px" }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: ORANGE, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Scenario C</div>
              <div style={{ fontWeight: 800, fontSize: 15, color: DARK, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                <Award size={16} style={{ color: ORANGE }} /> With Power Squad Bonuses
              </div>
              <div style={{ fontSize: 13, color: "#444", lineHeight: 1.8, marginBottom: 10 }}>
                Qualify for <strong style={{ color: GREEN }}>CLB ($100)</strong> with 7 qualified L1 Pro Members in 90 days. Reduces your target to <strong style={{ color: GREEN }}>{fmtUsd(Math.max(0, targetIncome - 100))}</strong>.
              </div>
              <div style={{ fontSize: 13, color: "#444", lineHeight: 1.8, marginBottom: 10 }}>
                CLB + 5 personal sales → need <strong style={{ color: ORANGE }}>{fmtNum(Math.max(0, l1WithBonusNeeded))} L1 members</strong>.
              </div>
              {isProPkg && l2Needed !== null && (
                <div style={{ fontSize: 13, color: "#444", lineHeight: 1.8, padding: "10px 12px", background: ORANGE_L, borderRadius: 8, border: `1.5px solid ${ORANGE}30` }}>
                  OR: <strong style={{ color: ORANGE }}>{fmtNum(l2Needed)} L2 members</strong> each buying 1 Pro Package → <strong style={{ color: GREEN }}>Level 2 (20%)</strong> earns {fmtUsd(l2Needed * commL2PerSale)}/mo.
                </div>
              )}
              {!isProPkg && (
                <div style={{ fontSize: 12, color: "#888", padding: "8px 10px", background: ORANGE_L, borderRadius: 8, border: `1px solid ${ORANGE}20` }}>
                  💡 Pro Package products also unlock Level 2 commissions and MCB bonuses.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "32px", background: GREEN_L, borderRadius: 14, border: `2px dashed ${GREEN}40` }}>
            <Target size={30} style={{ margin: "0 auto 10px", color: GREEN, opacity: 0.5 }} />
            <div style={{ fontSize: 14, color: "#555" }}>Load a product in Step 1 to activate this calculator.</div>
          </div>
        )}
      </div>

      {/* ── Disclaimer ──────────────────────────────────────────────────── */}
      <div style={{ marginTop: 16, padding: "12px 18px", background: "#f9fafb", borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 12, color: "#9ca3af", lineHeight: 1.7 }}>
        <strong style={{ color: "#6b7280" }}>Disclaimer:</strong> This calculator is for illustrative and educational purposes based on the NFGN compensation plan. Actual results vary. No income is guaranteed. Refer to the official NFGN Compensation Plan for authoritative rules.
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function StepHeader({ n, title }: { n: number; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
      <div style={{
        width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
        background: `linear-gradient(135deg, ${GREEN}, ${GREEN_D})`,
        color: WHITE, fontSize: 16, fontWeight: 900,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 2px 10px ${GREEN}50`,
      }}>
        {n}
      </div>
      <h2 style={{ fontWeight: 900, fontSize: 18, margin: 0, color: DARK }}>{title}</h2>
    </div>
  );
}
