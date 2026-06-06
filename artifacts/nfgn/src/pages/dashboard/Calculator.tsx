import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { customFetch } from "@/lib/custom-fetch";
import {
  Calculator, Search, TrendingUp, Target,
  CheckCircle2, DollarSign, Users, Award, Zap, Loader2,
  Package, AlertCircle,
} from "lucide-react";

const GOLD = "#C9A84C";
const DARK = "#0a0a0a";
const GREEN = "#2D6A4F";

// ── Comp plan rates ──────────────────────────────────────────────────────────
const RC  = 0.10; // Referral Commission — any member, direct referral buys anything
const SC  = 0.10; // Sales Commission — Pro Member, direct referral buys regular product
const L1C = 0.10; // Level 1 — Pro Member, L1 buys Pro Package
const L2C = 0.20; // Level 2 — Pro Member, L2 buys Pro Package

function fmtId(id: number) {
  return `NFGN-${String(id).padStart(5, "0")}`;
}
function fmtUsd(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtNum(n: number) {
  return n.toLocaleString("en-US");
}

interface CalcProduct {
  id: number;
  name: string;
  price: number;
  cv: number;
  isProPackage: boolean;
}

function parseProductId(raw: string): number | null {
  const cleaned = raw.trim().replace(/^nfgn-0*/i, "").replace(/^0+/, "") || "0";
  const n = parseInt(cleaned);
  return isNaN(n) || n <= 0 ? null : n;
}

// Level data for org table
function buildLevels(l1Size: number, dupFactor: number, avgPurchases: number, price: number, isProPkg: boolean) {
  const levels: {
    level: number; size: number; monthlyUnits: number;
    yourComm: number; orgComm: number; label: string;
  }[] = [];

  for (let i = 1; i <= 9; i++) {
    const size = i === 1 ? l1Size : (levels[i - 2].size * dupFactor);
    const monthlyUnits = size * avgPurchases;
    const rateForYou =
      i === 1 ? (RC + (isProPkg ? L1C : SC)) :
      (i === 2 && isProPkg) ? L2C : 0;
    const yourComm = monthlyUnits * price * rateForYou;
    const orgComm  = monthlyUnits * price * (RC + (isProPkg ? L1C : SC));
    const label =
      i === 1 ? "Direct Referrals" :
      i === 2 ? "Their Referrals" :
      `Generation ${i}`;
    levels.push({ level: i, size, monthlyUnits, yourComm, orgComm, label });
  }
  return levels;
}

export function CalculatorPage() {
  // ── Product lookup ──────────────────────────────────────────────────────────
  const [idInput, setIdInput]         = useState("");
  const [product, setProduct]         = useState<CalcProduct | null>(null);
  const [lookupError, setLookupError] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);

  // ── Org builder inputs ──────────────────────────────────────────────────────
  const [personalSales, setPersonalSales] = useState(5);
  const [l1Size,        setL1Size]        = useState(7);
  const [dupFactor,     setDupFactor]     = useState(5);
  const [avgPurchases,  setAvgPurchases]  = useState(1);

  // ── Goal calculator ─────────────────────────────────────────────────────────
  const [targetIncome, setTargetIncome]   = useState(4500);

  // ── Lookup handler ──────────────────────────────────────────────────────────
  async function lookupProduct() {
    const id = parseProductId(idInput);
    if (!id) {
      setLookupError("Enter a valid Product ID — e.g. NFGN-00001 or just 1");
      return;
    }
    setLookupLoading(true);
    setLookupError("");
    try {
      const res = await customFetch(`/api/products/${id}`);
      if (!res.ok) {
        setLookupError(`Product "${idInput.trim()}" not found. Check the ID and try again.`);
        setProduct(null);
        return;
      }
      const d = await res.json();
      setProduct({
        id: d.id,
        name: d.name,
        price: parseFloat(d.price),
        cv: d.cv ?? 0,
        isProPackage: !!d.isProPackage,
      });
    } catch {
      setLookupError("Failed to load product. Please try again.");
    } finally {
      setLookupLoading(false);
    }
  }

  // ── Derived values ───────────────────────────────────────────────────────────
  const price    = product?.price ?? 0;
  const isProPkg = product?.isProPackage ?? false;

  const commPerSalePersonal = price * (RC + (isProPkg ? L1C : SC)); // 20%
  const commL2PerSale       = isProPkg ? price * L2C : 0;            // 20% for Pro Pkg

  const levels = product ? buildLevels(l1Size, dupFactor, avgPurchases, price, isProPkg) : [];

  const myPersonalEarnings = personalSales * commPerSalePersonal;
  const myL1Earnings       = levels[0]?.yourComm ?? 0;
  const myL2Earnings       = levels[1]?.yourComm ?? 0;
  const myCommTotal        = myPersonalEarnings + myL1Earnings + myL2Earnings;

  // Bonuses
  const clbEarned  = l1Size >= 7 ? 100 : 0;
  const l2Total    = levels[1] ? levels[1].size * avgPurchases : 0;
  const mcbCount   = isProPkg ? Math.floor(l2Total / 7) : 0;
  const mcbEarned  = mcbCount * 200;
  const totalWithBonus = myCommTotal + clbEarned + mcbEarned;

  // Total org collective
  const orgCollective = levels.reduce((s, l) => s + l.orgComm, 0);

  // ── Goal calculator ──────────────────────────────────────────────────────────
  const goalPersonalOnly = commPerSalePersonal > 0
    ? Math.ceil(targetIncome / commPerSalePersonal)
    : 0;

  const myPersonal5 = 5;
  const earningsFrom5 = myPersonal5 * commPerSalePersonal;
  const remainingAfter5 = Math.max(0, targetIncome - earningsFrom5);
  const l1Needed = commPerSalePersonal > 0
    ? Math.ceil(remainingAfter5 / commPerSalePersonal)
    : 0;

  const remainingAfterClb = Math.max(0, targetIncome - 100 - earningsFrom5);
  const l1WithBonusNeeded = commPerSalePersonal > 0
    ? Math.ceil(remainingAfterClb / commPerSalePersonal)
    : 0;

  const l2Needed = isProPkg && commL2PerSale > 0
    ? Math.ceil(targetIncome / commL2PerSale)
    : null;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: "24px 16px 48px" }}>

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: `${GOLD}18`, border: `1px solid ${GOLD}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Calculator size={22} style={{ color: GOLD }} />
          </div>
          <div>
            <h1 style={{ fontFamily: "'Georgia',serif", fontSize: 22, fontWeight: 900, margin: 0, lineHeight: 1.2 }}>
              Products, Services & Commissions Calculator
            </h1>
            <p style={{ fontSize: 13, color: "#666", margin: 0 }}>
              Enter any NFGN Product ID to calculate your earning potential across 9 generations.
            </p>
          </div>
        </div>
      </div>

      {/* ── STEP 1: Product Lookup ────────────────────────────────────── */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e5e5", padding: "24px", marginBottom: 20 }}>
        <StepHeader n={1} title="Product Lookup" />
        <p style={{ fontSize: 13, color: "#666", marginBottom: 16, lineHeight: 1.7 }}>
          Enter the Product ID displayed on any product in the shop or admin products list. The system will automatically load the product's price, PV, CV, and commission type.
        </p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
          <Input
            value={idInput}
            onChange={e => setIdInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && lookupProduct()}
            placeholder="NFGN-00001  or just  1"
            style={{ width: 240, fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.05em" }}
          />
          <Button
            onClick={lookupProduct}
            disabled={lookupLoading || !idInput.trim()}
            style={{ background: GOLD, color: DARK, fontWeight: 700, gap: 6 }}
          >
            {lookupLoading
              ? <><Loader2 size={14} className="animate-spin" /> Loading…</>
              : <><Search size={14} /> Load Product</>
            }
          </Button>
        </div>

        {lookupError && (
          <div style={{ display: "flex", gap: 6, alignItems: "center", color: "#dc2626", fontSize: 13, marginBottom: 8 }}>
            <AlertCircle size={14} /> {lookupError}
          </div>
        )}

        {product && (
          <div style={{ marginTop: 16, padding: "18px 20px", background: `${GOLD}07`, border: `1px solid ${GOLD}30`, borderRadius: 12 }}>
            {/* Product header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 800, color: GOLD, background: `${GOLD}18`, padding: "3px 10px", borderRadius: 6, border: `1px solid ${GOLD}40` }}>
                    {fmtId(product.id)}
                  </span>
                  {isProPkg && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: GREEN, padding: "3px 9px", borderRadius: 6 }}>
                      PRO PACKAGE
                    </span>
                  )}
                </div>
                <div style={{ fontWeight: 800, fontSize: 18 }}>{product.name}</div>
                <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>
                  {isProPkg
                    ? "Pro Package — generates Level 1 & Level 2 commissions"
                    : "Regular product — generates Referral + Sales commissions"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 20, flexShrink: 0 }}>
                {[
                  { label: "Price", value: fmtUsd(product.price), color: DARK },
                  { label: "PV / CV", value: String(product.cv), color: GOLD },
                  { label: "RC per sale", value: fmtUsd(price * RC), color: GREEN },
                ].map(stat => (
                  <div key={stat.label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.08em" }}>{stat.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: stat.color }}>{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Commission breakdown per sale */}
            <div style={{ borderTop: "1px solid rgba(201,168,76,0.2)", paddingTop: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                Your Commission Per Sale (as a Pro Member)
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {[
                  { label: "Referral Commission (RC)", pct: "10%", amt: price * RC, sub: "On every direct purchase" },
                  { label: isProPkg ? "Level 1 Commission" : "Sales Commission", pct: "10%", amt: price * (isProPkg ? L1C : SC), sub: isProPkg ? "Your L1 buys Pro Package" : "Your L1 buys regular product" },
                  { label: "Your Total Per Direct Sale", pct: "20%", amt: commPerSalePersonal, sub: "Combined", gold: true },
                  ...(isProPkg
                    ? [{ label: "Level 2 Commission", pct: "20%", amt: commL2PerSale, sub: "Your L2 buys Pro Package", gold: false }]
                    : []),
                ].map(item => (
                  <div key={item.label} style={{ flex: "1 1 160px", padding: "12px 14px", background: item.gold ? GOLD : "#fff", borderRadius: 10, border: item.gold ? "none" : "1px solid #eee" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: item.gold ? DARK : "#888", marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: item.gold ? DARK : GOLD }}>
                      {fmtUsd(item.amt)} <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.65 }}>({item.pct})</span>
                    </div>
                    <div style={{ fontSize: 11, color: item.gold ? `${DARK}70` : "#999" }}>{item.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!product && (
          <div style={{ marginTop: 12, padding: "20px", background: "#fafafa", borderRadius: 10, border: "1px dashed #ddd", textAlign: "center", color: "#bbb" }}>
            <Package size={28} style={{ margin: "0 auto 8px" }} />
            <div style={{ fontSize: 13 }}>Load a product to see commission details and activate the calculators below.</div>
          </div>
        )}
      </div>

      {/* ── STEP 2: Organization Builder ─────────────────────────────── */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e5e5", padding: "24px", marginBottom: 20, opacity: product ? 1 : 0.45, pointerEvents: product ? "auto" : "none", transition: "opacity 0.2s" }}>
        <StepHeader n={2} title="9-Level Organization Builder" />
        <p style={{ fontSize: 13, color: "#666", marginBottom: 20, lineHeight: 1.7 }}>
          Set your personal sales, Level 1 team size, duplication factor (how many people each member recruits), and monthly purchases. The calculator projects earnings through all 9 generations based on the NFGN comp plan.
        </p>

        {/* Inputs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
          {[
            { label: "Your Personal Sales / Month",     value: personalSales, setter: setPersonalSales, min: 0, hint: `Earns ${price > 0 ? fmtUsd(personalSales * commPerSalePersonal) : "$—"}/mo` },
            { label: "Level 1 Team Size",               value: l1Size,        setter: setL1Size,        min: 0, hint: `${l1Size >= 7 ? "✓ CLB eligible" : `${7 - l1Size} more for CLB`}` },
            { label: "Duplication Factor (L2–L9)",      value: dupFactor,     setter: setDupFactor,     min: 1, hint: "Recruits per member per level" },
            { label: "Avg Purchases / Person / Month",  value: avgPurchases,  setter: setAvgPurchases,  min: 1, hint: "Units each person buys/month" },
          ].map(row => (
            <div key={row.label}>
              <Label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 4 }}>{row.label}</Label>
              <Input
                type="number"
                min={row.min}
                value={row.value}
                onChange={e => row.setter(Math.max(row.min, parseInt(e.target.value) || 0))}
                style={{ fontWeight: 700 }}
              />
              <div style={{ fontSize: 11, color: "#888", marginTop: 3 }}>{row.hint}</div>
            </div>
          ))}
        </div>

        {/* 9-Level table */}
        <div style={{ overflowX: "auto", marginBottom: 20 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: DARK, color: "#fff" }}>
                {["Level", "Description", "Team Size", "Monthly Units", "Your Commission", "Org Collective", "Flows To You?"].map(h => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Personal row */}
              <tr style={{ background: `${GOLD}12`, borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "10px 12px", fontWeight: 900 }}>You</td>
                <td style={{ padding: "10px 12px", color: "#555" }}>Personal Sales</td>
                <td style={{ padding: "10px 12px", fontWeight: 700 }}>—</td>
                <td style={{ padding: "10px 12px", fontWeight: 700 }}>{personalSales}</td>
                <td style={{ padding: "10px 12px", fontWeight: 800, color: GREEN }}>{fmtUsd(myPersonalEarnings)}</td>
                <td style={{ padding: "10px 12px", color: "#aaa" }}>—</td>
                <td style={{ padding: "10px 12px" }}><span style={{ color: GREEN, fontWeight: 700, fontSize: 12 }}>✓ Yours</span></td>
              </tr>
              {levels.map((lv, i) => {
                const isYours = lv.yourComm > 0;
                const rowBg = i % 2 === 0 ? "#fafafa" : "#fff";
                return (
                  <tr key={lv.level} style={{ background: isYours ? `${GOLD}08` : rowBg, borderBottom: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 800, color: isYours ? GOLD : "#333" }}>L{lv.level}</td>
                    <td style={{ padding: "10px 12px", color: "#555" }}>{lv.label}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 700 }}>{fmtNum(lv.size)}</td>
                    <td style={{ padding: "10px 12px" }}>{fmtNum(lv.monthlyUnits)}</td>
                    <td style={{ padding: "10px 12px", fontWeight: isYours ? 800 : 400, color: isYours ? GREEN : "#aaa" }}>
                      {isYours ? fmtUsd(lv.yourComm) : "—"}
                    </td>
                    <td style={{ padding: "10px 12px", color: "#888" }}>{fmtUsd(lv.orgComm)}</td>
                    <td style={{ padding: "10px 12px" }}>
                      {isYours
                        ? <span style={{ color: GREEN, fontWeight: 700, fontSize: 12 }}>✓ Yours</span>
                        : <span style={{ color: "#aaa", fontSize: 12 }}>Their sponsors</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Earnings summary */}
        <div style={{ background: DARK, borderRadius: 12, padding: "20px 24px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: `${GOLD}80`, textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 14 }}>
            Monthly Earnings Summary
          </div>
          {[
            { label: "Personal Sales Commission",    amount: myPersonalEarnings, desc: `${personalSales} sales × ${fmtUsd(commPerSalePersonal)}/sale` },
            { label: "Level 1 Commission",           amount: myL1Earnings,       desc: `${fmtNum(l1Size)} members × ${avgPurchases} purchase(s) × ${fmtUsd(commPerSalePersonal)}` },
            ...(isProPkg ? [{ label: "Level 2 Commission (Pro Pkg)", amount: myL2Earnings, desc: `${fmtNum(levels[1]?.size ?? 0)} members × ${avgPurchases} × ${fmtUsd(commL2PerSale)}` }] : []),
            { label: `CLB Bonus`,                   amount: clbEarned,          desc: l1Size >= 7 ? "✓ 7+ qualified L1 Pro Members" : `Need ${7 - l1Size} more L1 members to qualify` },
            ...(isProPkg ? [{ label: `MCB Bonus (${mcbCount}× at $200)`, amount: mcbEarned, desc: `${fmtNum(l2Total)} L2 purchases ÷ 7 = ${mcbCount} bonus payments` }] : []),
          ].map(row => (
            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div>
                <div style={{ fontSize: 13, color: "#ccc" }}>{row.label}</div>
                <div style={{ fontSize: 11, color: "#555" }}>{row.desc}</div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: row.amount > 0 ? GOLD : "#444" }}>{fmtUsd(row.amount)}</div>
            </div>
          ))}

          <div style={{ borderTop: `1px solid ${GOLD}30`, marginTop: 14, paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Your Total Monthly Income</div>
              <div style={{ fontSize: 11, color: "#666" }}>
                Org collective (L1-L9): {fmtUsd(orgCollective)}/mo generating throughout your network
              </div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: GOLD }}>{fmtUsd(totalWithBonus)}</div>
          </div>
        </div>
      </div>

      {/* ── STEP 3: Income Goal Calculator ───────────────────────────── */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e5e5", padding: "24px", opacity: product ? 1 : 0.45, pointerEvents: product ? "auto" : "none", transition: "opacity 0.2s" }}>
        <StepHeader n={3} title="Income Goal Calculator" />
        <p style={{ fontSize: 13, color: "#666", marginBottom: 20, lineHeight: 1.7 }}>
          How much do you want to earn per month? Choose a target and the calculator shows exactly what you need to do — selling <strong>{product?.name ?? "this product"}</strong>.
        </p>

        {/* Target input */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 22 }}>
          <Label style={{ fontWeight: 700, fontSize: 13, whiteSpace: "nowrap" }}>Target Monthly Income:</Label>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontWeight: 800, fontSize: 18, color: "#555" }}>$</span>
            <Input
              type="number"
              min={0}
              value={targetIncome}
              onChange={e => setTargetIncome(Math.max(0, parseInt(e.target.value) || 0))}
              style={{ width: 140, fontWeight: 800, fontSize: 18 }}
            />
            <span style={{ color: "#888", fontSize: 13 }}>/mo</span>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[500, 1000, 2500, 4500, 10000].map(amt => (
              <button
                key={amt}
                onClick={() => setTargetIncome(amt)}
                style={{
                  padding: "5px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700,
                  border: `1px solid ${targetIncome === amt ? GOLD : "#ddd"}`,
                  background: targetIncome === amt ? `${GOLD}15` : "#fafafa",
                  color: targetIncome === amt ? GOLD : "#666",
                }}
              >
                ${amt.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {price > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>

            {/* Scenario A */}
            <ScenarioCard
              title="Scenario A"
              subtitle="Personal Sales Only"
              color="#fafafa"
              border="#eee"
            >
              <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 6 }}>
                {fmtNum(goalPersonalOnly)} <span style={{ fontSize: 14, fontWeight: 600, color: "#888" }}>sales/mo</span>
              </div>
              <div style={{ fontSize: 13, color: "#555", lineHeight: 1.6 }}>
                You personally sell {fmtNum(goalPersonalOnly)} units every month.
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: "#888", padding: "8px 10px", background: "#f0f0f0", borderRadius: 8 }}>
                {fmtNum(goalPersonalOnly)} × {fmtUsd(commPerSalePersonal)} = {fmtUsd(goalPersonalOnly * commPerSalePersonal)}/mo
              </div>
            </ScenarioCard>

            {/* Scenario B */}
            <ScenarioCard
              title="Scenario B"
              subtitle="You + Level 1 Team"
              color={`${GOLD}07`}
              border={`${GOLD}30`}
              accent={GOLD}
            >
              <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 900 }}>5</div>
                  <div style={{ fontSize: 11, color: "#888" }}>Your sales</div>
                </div>
                <div style={{ fontSize: 20, color: "#ccc" }}>+</div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: GOLD }}>{fmtNum(Math.max(0, l1Needed))}</div>
                  <div style={{ fontSize: 11, color: "#888" }}>L1 members (1 purchase each)</div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: "#555", lineHeight: 1.6 }}>
                {l1Needed <= 0
                  ? "✓ 5 personal sales already covers this goal!"
                  : `Recruit ${l1Needed} direct referrals who each buy 1 unit/month.`}
              </div>
              {l1Needed > 0 && (
                <div style={{ marginTop: 10, fontSize: 12, color: "#888", padding: "8px 10px", background: `${GOLD}10`, borderRadius: 8 }}>
                  5 personal + {l1Needed} L1 × {fmtUsd(commPerSalePersonal)} = {fmtUsd((5 + l1Needed) * commPerSalePersonal)}/mo
                </div>
              )}
            </ScenarioCard>

            {/* Scenario C */}
            <ScenarioCard
              title="Scenario C"
              subtitle="With Power Squad Bonuses"
              color={DARK}
              border={DARK}
              textColor="#fff"
            >
              <div style={{ fontSize: 13, color: "#ccc", lineHeight: 1.7, marginBottom: 10 }}>
                Qualify for <strong style={{ color: GOLD }}>CLB ($100)</strong> by recruiting 7 qualified L1 Pro Members within 90 days. That reduces your target to <strong style={{ color: GOLD }}>{fmtUsd(Math.max(0, targetIncome - 100))}</strong>.
              </div>
              <div style={{ fontSize: 13, color: "#ccc", lineHeight: 1.7, marginBottom: 10 }}>
                With CLB + 5 personal sales: need <strong style={{ color: GOLD }}>{fmtNum(Math.max(0, l1WithBonusNeeded))} L1 members</strong>.
              </div>
              {isProPkg && l2Needed !== null && (
                <div style={{ fontSize: 13, color: "#ccc", lineHeight: 1.7 }}>
                  OR: <strong style={{ color: GOLD }}>{fmtNum(l2Needed)} L2 members</strong> each buying 1 Pro Package/mo earns {fmtUsd(l2Needed * commL2PerSale)}/mo via <strong style={{ color: GOLD }}>Level 2 commissions (20%)</strong>.
                </div>
              )}
              {!isProPkg && (
                <div style={{ fontSize: 12, color: "#666" }}>Tip: Pro Package products also unlock Level 2 commissions and MCB bonuses.</div>
              )}
            </ScenarioCard>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "28px", color: "#ccc", fontSize: 14, background: "#fafafa", borderRadius: 12, border: "1px dashed #eee" }}>
            Load a product in Step 1 to activate this calculator.
          </div>
        )}
      </div>

      {/* ── Disclaimer ───────────────────────────────────────────────── */}
      <div style={{ marginTop: 16, padding: "12px 16px", background: "#fafafa", borderRadius: 10, border: "1px solid #eee", fontSize: 12, color: "#999", lineHeight: 1.7 }}>
        <strong style={{ color: "#666" }}>Disclaimer:</strong> This calculator is for illustrative and educational purposes based on the NFGN compensation plan. Actual results vary based on personal effort, market conditions, product selection, team activity, and qualification requirements. No income is guaranteed. Always refer to the official NFGN Compensation Plan for authoritative rules.
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function StepHeader({ n, title }: { n: number; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", background: GOLD, color: DARK, fontSize: 14, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {n}
      </div>
      <h2 style={{ fontWeight: 800, fontSize: 17, margin: 0 }}>{title}</h2>
    </div>
  );
}

function ScenarioCard({ title, subtitle, color, border, accent, textColor, children }: {
  title: string; subtitle: string; color: string; border: string;
  accent?: string; textColor?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ background: color, borderRadius: 12, border: `1px solid ${border}`, padding: "18px 20px" }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: accent ?? "#aaa", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{title}</div>
      <div style={{ fontWeight: 700, fontSize: 14, color: textColor ?? DARK, marginBottom: 12 }}>{subtitle}</div>
      <div style={{ color: textColor ?? DARK }}>{children}</div>
    </div>
  );
}
