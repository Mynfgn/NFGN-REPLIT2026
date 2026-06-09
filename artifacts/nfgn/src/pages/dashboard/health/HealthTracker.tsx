import { useState, useEffect } from "react";
import { Scale, Droplets, Plus, TrendingDown, TrendingUp, Minus, AlertTriangle, ChevronDown, ChevronUp, BookOpen, Zap, Wind, Leaf, Flame, Clock, Heart, Brain } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const GREEN = "#2D6A4F";
const GREEN_D = "#1A4032";
const GREEN_M = "#c8e6d4";
const GOLD = "#C9A84C";
const BLUE = "#1d6fa4";
const BLUE_M = "#d0eaf9";
const DARK = "#0a0a0a";

interface WeightLog { id: number; weightLbs: number; note: string | null; loggedAt: string }
interface WaterLog  { id: number; ozAmount: number; loggedAt: string }

async function apiFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem("nfgn_token");
  const res = await fetch(path, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(opts?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function groupWaterByDay(logs: WaterLog[]): { date: string; oz: number }[] {
  const map = new Map<string, number>();
  for (const l of logs) {
    const d = new Date(l.loggedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    map.set(d, (map.get(d) ?? 0) + l.ozAmount);
  }
  return Array.from(map.entries()).map(([date, oz]) => ({ date, oz: Math.round(oz) })).reverse();
}

export function HealthTracker() {
  const { toast } = useToast();
  const [days, setDays] = useState(30);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [weightInput, setWeightInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [waterInput, setWaterInput] = useState("");
  const [savingW, setSavingW] = useState(false);
  const [savingWater, setSavingWater] = useState(false);

  async function loadTrackers() {
    setLoading(true);
    try {
      const d = await apiFetch(`/api/wellness/trackers?days=${days}`);
      setWeightLogs(d.weightLogs);
      setWaterLogs(d.waterLogs);
    } catch { }
    finally { setLoading(false); }
  }

  useEffect(() => { loadTrackers(); }, [days]);

  async function logWeight() {
    const w = parseFloat(weightInput);
    if (!w || w <= 0) { toast({ title: "Enter a valid weight", variant: "destructive" }); return; }
    setSavingW(true);
    try {
      await apiFetch("/api/wellness/trackers/weight", { method: "POST", body: JSON.stringify({ weightLbs: w, note: noteInput || undefined }) });
      setWeightInput(""); setNoteInput("");
      toast({ title: "Weight logged!" });
      loadTrackers();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setSavingW(false); }
  }

  async function logWater() {
    const oz = parseFloat(waterInput);
    if (!oz || oz <= 0) { toast({ title: "Enter a valid amount", variant: "destructive" }); return; }
    setSavingWater(true);
    try {
      await apiFetch("/api/wellness/trackers/water", { method: "POST", body: JSON.stringify({ ozAmount: oz }) });
      setWaterInput("");
      toast({ title: "Water intake logged!" });
      loadTrackers();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setSavingWater(false); }
  }

  // Derived stats
  const weightChart = [...weightLogs].reverse().map(w => ({ date: formatDate(w.loggedAt), weight: w.weightLbs }));
  const waterChart = groupWaterByDay(waterLogs);
  const latestWeight = weightLogs[0]?.weightLbs ?? null;
  const prevWeight = weightLogs[1]?.weightLbs ?? null;
  const weightDelta = latestWeight && prevWeight ? latestWeight - prevWeight : null;
  const todayOz = waterLogs.filter(w => new Date(w.loggedAt).toDateString() === new Date().toDateString()).reduce((s, w) => s + w.ozAmount, 0);
  const waterGoal = latestWeight ? Math.round(latestWeight / 2) : 64;

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: "28px 20px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: GREEN_M, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Scale size={22} color={GREEN} />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: DARK, fontFamily: "Georgia, serif", margin: 0 }}>Weight &amp; Water Tracker</h1>
            <p style={{ fontSize: 12, color: "#666", margin: 0 }}>Log daily — watch your progress build</p>
          </div>
        </div>
        <div style={{ height: 2, background: `linear-gradient(to right, ${GREEN}, transparent)`, borderRadius: 2 }} />
      </div>

      {/* Time range */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[7, 14, 30, 60].map(d => (
          <button
            key={d}
            onClick={() => setDays(d)}
            style={{ padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${days === d ? GREEN : "#d0d0d0"}`, background: days === d ? GREEN : "#fff", color: days === d ? "#fff" : "#555", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
          >
            {d}d
          </button>
        ))}
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 28 }}>
        <div style={{ background: GREEN_M, border: `1.5px solid ${GREEN}`, borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: GREEN_D, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Current Weight</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: GREEN_D }}>{latestWeight ? `${latestWeight} lbs` : "—"}</div>
          {weightDelta !== null && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: weightDelta < 0 ? GREEN : "#b91c1c", marginTop: 4 }}>
              {weightDelta < 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
              {Math.abs(weightDelta).toFixed(1)} lbs since last
            </div>
          )}
        </div>
        <div style={{ background: BLUE_M, border: `1.5px solid ${BLUE}`, borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#0d3a5c", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Today's Water</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#0d3a5c" }}>{Math.round(todayOz)} oz</div>
          <div style={{ fontSize: 11, color: "#1d6fa4", marginTop: 4, fontWeight: 600 }}>Goal: {waterGoal} oz/day</div>
          <div style={{ height: 5, background: "#b0d4f1", borderRadius: 3, marginTop: 6 }}>
            <div style={{ height: "100%", width: `${Math.min(100, (todayOz / waterGoal) * 100)}%`, background: BLUE, borderRadius: 3 }} />
          </div>
        </div>
        <div style={{ background: "#FBF5DC", border: `1.5px solid ${GOLD}`, borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#7A6010", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Logs This Period</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#7A6010" }}>{weightLogs.length}</div>
          <div style={{ fontSize: 11, color: "#7A6010", marginTop: 4, fontWeight: 600 }}>weight entries</div>
        </div>
      </div>

      {/* Log inputs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 32 }}>
        {/* Weight */}
        <div style={{ background: "#fff", border: `2px solid ${GREEN}44`, borderRadius: 14, padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Scale size={18} color={GREEN} />
            <span style={{ fontWeight: 800, fontSize: 14, color: DARK }}>Log Weight</span>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Input
                type="number"
                value={weightInput}
                onChange={e => setWeightInput(e.target.value)}
                placeholder="e.g. 185.5"
                style={{ paddingRight: 36 }}
              />
              <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#999", fontWeight: 600 }}>lbs</span>
            </div>
          </div>
          <Input
            value={noteInput}
            onChange={e => setNoteInput(e.target.value)}
            placeholder="Optional note (e.g. after workout)"
            style={{ marginBottom: 12, fontSize: 13 }}
          />
          <Button
            onClick={logWeight}
            disabled={savingW || !weightInput}
            style={{ background: GREEN, color: "#fff", fontWeight: 700, width: "100%", borderRadius: 8 }}
          >
            <Plus size={15} style={{ marginRight: 6 }} /> Log Weight
          </Button>
        </div>

        {/* Water */}
        <div style={{ background: "#fff", border: `2px solid ${BLUE}44`, borderRadius: 14, padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Droplets size={18} color={BLUE} />
            <span style={{ fontWeight: 800, fontSize: 14, color: DARK }}>Log Water Intake</span>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Input
                type="number"
                value={waterInput}
                onChange={e => setWaterInput(e.target.value)}
                placeholder="e.g. 16"
                style={{ paddingRight: 36 }}
              />
              <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#999", fontWeight: 600 }}>oz</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            {[8, 12, 16, 24, 32].map(oz => (
              <button
                key={oz}
                onClick={() => setWaterInput(String(oz))}
                style={{ padding: "4px 10px", borderRadius: 16, border: `1px solid ${BLUE}44`, background: BLUE_M, color: "#0d3a5c", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                {oz} oz
              </button>
            ))}
          </div>
          <Button
            onClick={logWater}
            disabled={savingWater || !waterInput}
            style={{ background: BLUE, color: "#fff", fontWeight: 700, width: "100%", borderRadius: 8 }}
          >
            <Plus size={15} style={{ marginRight: 6 }} /> Log Water
          </Button>
        </div>
      </div>

      {/* Charts */}
      {weightChart.length > 1 && (
        <div style={{ background: "#fff", border: `1.5px solid ${GREEN}33`, borderRadius: 14, padding: "18px 20px", marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: DARK, marginBottom: 16 }}>Weight Progress</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weightChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={["auto", "auto"]} />
              <Tooltip formatter={(v: any) => [`${v} lbs`, "Weight"]} />
              <Line type="monotone" dataKey="weight" stroke={GREEN} strokeWidth={2.5} dot={{ r: 3, fill: GREEN }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {waterChart.length > 0 && (
        <div style={{ background: "#fff", border: `1.5px solid ${BLUE}33`, borderRadius: 14, padding: "18px 20px", marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: DARK, marginBottom: 16 }}>Daily Water Intake</h3>
          <div style={{ fontSize: 11, color: "#888", marginBottom: 12 }}>Dashed line = your daily goal ({waterGoal} oz)</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={waterChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: any) => [`${v} oz`, "Water"]} />
              <Bar dataKey="oz" fill={BLUE} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {!loading && weightLogs.length === 0 && waterLogs.length === 0 && (
        <div style={{ textAlign: "center", padding: "32px 0", color: "#aaa", fontSize: 14 }}>
          <Scale size={40} color="#ddd" style={{ margin: "0 auto 12px", display: "block" }} />
          No logs yet. Start by logging your weight and water intake above.
        </div>
      )}

      <div style={{ background: "#f9f9f9", border: "1px solid #e0e0e0", borderRadius: 12, padding: "14px 18px", fontSize: 11, color: "#777", lineHeight: 1.7, marginBottom: 40 }}>
        <AlertTriangle size={13} style={{ display: "inline", marginRight: 5, color: GOLD }} />
        <strong>Tip:</strong> Your water goal is calculated as half your body weight in ounces. Log your current weight first to get a personalized water target.
      </div>

      {/* ─────────────────── WATER EDUCATION GUIDE ─────────────────── */}
      <WaterGuide />

      {/* ─────────────────── FASTING GUIDE ─────────────────── */}
      <FastingGuide />

      <div style={{ background: "#fdeaea", border: "1px solid #8B3A3A44", borderRadius: 12, padding: "14px 18px", fontSize: 11, color: "#8B3A3A", lineHeight: 1.7, marginTop: 12 }}>
        <AlertTriangle size={13} style={{ display: "inline", marginRight: 5 }} />
        <strong>Medical Disclaimer:</strong> The educational content on water types and fasting is for informational purposes only and is not intended to diagnose, treat, cure, or prevent any disease. Always consult a qualified healthcare professional before beginning any fasting protocol, especially extended or water fasting.
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   WATER TYPES GUIDE
═══════════════════════════════════════════════════ */

const WATER_TYPES = [
  {
    key: "alkaline",
    name: "Alkaline Water",
    tag: "pH 8.5 – 9.5+",
    color: "#2D6A4F",
    bg: "#c8e6d4",
    icon: "🌿",
    timing: ["Morning on empty stomach", "30 min before meals", "During & after exercise"],
    what: "Water with a pH above 7 — either naturally sourced from alkaline springs or artificially raised through ionization or added minerals (calcium, magnesium, potassium bicarbonate).",
    purpose: "To neutralize excess acidity in the body caused by poor diet, stress, and environmental toxins. Modern diets (processed foods, sugar, meat, coffee, alcohol) create an acidic internal environment that stresses every organ system.",
    benefits: [
      "Neutralizes acid reflux and GERD symptoms",
      "Supports bone density by reducing acid-driven calcium loss",
      "Improves hydration at the cellular level",
      "Antioxidant properties help fight free radical damage",
      "May support healthy blood pressure and blood sugar",
      "Reduces lactic acid buildup after exercise",
    ],
    cleanse: "Alkaline water creates an environment where harmful bacteria, viruses, and candida struggle to thrive. It flushes acidic waste products from tissues and supports the kidneys in excreting metabolic byproducts. Promotes healthy gut microbiome balance by reducing the acidic environment pathogens prefer.",
    weightLoss: "An alkaline internal environment supports fat metabolism. Fat cells store toxins and acids — as you alkalize, the body releases stored fat more readily. Reduces inflammation-driven water retention. Slight metabolic boost from improved enzyme function.",
    energy: "Acid-buffering reduces the energy your body wastes fighting pH imbalance. Better cellular hydration = more ATP (energy) production at the mitochondrial level.",
    illness: "Chronic acidity suppresses the immune system. Alkaline water helps shift the terrain away from disease. Inflammation is dramatically reduced in an alkaline environment — a key factor in most chronic diseases.",
    fasting: "The top choice for extended fasting. During a fast, the body produces ketones and metabolic acids. Alkaline water continuously buffers these, making fasting more comfortable, reducing \"keto flu\" symptoms, and supporting cellular repair.",
  },
  {
    key: "spring",
    name: "Spring Water",
    tag: "Natural & Mineral-Rich",
    color: "#1d6fa4",
    bg: "#d0eaf9",
    icon: "💧",
    timing: ["Throughout the day", "With meals", "Upon waking"],
    what: "Collected directly from underground springs where water naturally rises to the surface. Contains naturally occurring minerals — calcium, magnesium, potassium, silica — absorbed as it flows through rock layers.",
    purpose: "To provide balanced, naturally mineralized hydration as nature intended. The closest thing to the water humans evolved drinking.",
    benefits: [
      "Natural electrolytes support hydration without additives",
      "Calcium and magnesium support bone and cardiovascular health",
      "Silica supports skin elasticity, hair, and nail growth",
      "Supports healthy digestion and gut motility",
      "Immune function support via trace minerals",
      "Better taste encourages consistent drinking",
    ],
    cleanse: "Natural minerals act as cofactors for hundreds of detox enzymes in the liver. Magnesium is essential for phase II liver detoxification. Potassium supports kidney function and helps flush sodium-driven water retention.",
    weightLoss: "Consistent mineral intake supports metabolic enzyme function. Magnesium directly regulates insulin sensitivity and blood sugar — the root of most weight gain. Potassium reduces bloating and water retention.",
    energy: "Electrolytes are essential for nerve conduction and muscle contraction. Mineral-rich spring water prevents the fatigue and brain fog of electrolyte depletion.",
    illness: "Trace minerals like zinc, selenium, and silica have immune-boosting and anti-inflammatory properties. Spring water also avoids the gut-disrupting chlorine in tap water.",
    fasting: "Excellent for all intermittent fasting protocols. During 16:8 or 18:6 fasts, spring water prevents electrolyte headaches and muscle cramps. Also the best choice for breaking a water fast gently.",
  },
  {
    key: "ionized",
    name: "Ionized Water",
    tag: "Electrolyzed Reduced Water",
    color: "#7B2D8B",
    bg: "#f0d9f9",
    icon: "⚡",
    timing: ["Morning — first thing", "Pre-workout (30 min before)", "During illness or inflammation"],
    what: "Produced by a water ionizer (electrolysis machine) that splits water into two streams: alkaline ionized water (for drinking) and acidic water (for skin/cleaning). The alkaline stream has a negative ORP (oxidation-reduction potential) — meaning it donates electrons and acts as a powerful antioxidant.",
    purpose: "To deliver the most antioxidant-rich, deeply hydrating form of water. The negatively charged molecules neutralize positively charged free radicals in the body — the same free radicals that drive aging, cancer, and inflammation.",
    benefits: [
      "Most powerful antioxidant water available",
      "Negative ORP (-200 to -800 mV) neutralizes free radicals on contact",
      "Micro-clustered molecules penetrate cells more deeply",
      "Superior hydration compared to regular water",
      "Anti-inflammatory — reduces CRP and inflammatory cytokines",
      "Supports liver and kidney detox pathways",
      "Boosts energy and mental clarity",
    ],
    cleanse: "Ionized water performs deep cellular detoxification. Its antioxidant charge neutralizes free radicals inside cells, reducing oxidative stress. It supports the liver's glutathione production — the body's master antioxidant and detox molecule. The micro-clustering allows it to flush toxins from hard-to-reach cellular compartments.",
    weightLoss: "Reduces inflammation — a key driver of obesity and metabolic syndrome. Improves mitochondrial function, increasing the energy cells extract from food. Supports liver health, which is central to fat metabolism.",
    energy: "The electron-donating property of ionized water directly supports mitochondrial ATP production. Many users report significant, sustained energy increases within days of switching.",
    illness: "Powerful tool against chronic inflammation, oxidative stress, autoimmune flares, and recovery from illness. Studies show benefits for diabetes, hypertension, liver disease, and cancer support.",
    fasting: "One of the best fasting waters. During a water fast, ionized water's antioxidant properties accelerate autophagy (cellular self-cleaning), neutralize the acids and toxins released during fat burning, and reduce the oxidative stress of the healing process. Start with lower levels (Level 1) and work up.",
  },
  {
    key: "mineral",
    name: "Mineral Water",
    tag: "Calcium · Magnesium · Potassium · Silica",
    color: "#B5651D",
    bg: "#fdebd0",
    icon: "🏔️",
    timing: ["With meals", "After exercise", "When breaking a fast"],
    what: "Water that contains a consistent, measurable level of dissolved minerals and trace elements from its underground source. Different brands have dramatically different mineral profiles — some rich in magnesium, others in calcium or sodium.",
    purpose: "To replenish the specific mineral electrolytes the body needs for cellular function, nerve transmission, muscle contraction, and pH regulation.",
    benefits: [
      "Magnesium reduces anxiety, improves sleep, regulates blood sugar",
      "Calcium supports bone density and cardiovascular rhythm",
      "Potassium and sodium regulate fluid balance and blood pressure",
      "Silica supports skin, connective tissue, and arterial elasticity",
      "Naturally carbonated mineral water aids digestion",
      "Reduces risk of kidney stones (magnesium-rich varieties)",
    ],
    cleanse: "Magnesium is a critical cofactor for over 300 enzymatic reactions including detoxification. It acts as a gentle laxative at higher amounts, supporting bowel regularity and colon cleansing. Potassium helps the kidneys flush excess sodium and water, reducing bloating.",
    weightLoss: "Magnesium deficiency is linked to insulin resistance and weight gain. Mineral water helps correct this deficiency through daily consumption. Electrolyte balance reduces false hunger signals triggered by mineral depletion.",
    energy: "Magnesium is directly involved in converting food into ATP energy. Iron-containing mineral waters help oxygen delivery to muscles. Athletes report better performance and endurance with consistent mineral water intake.",
    illness: "High-magnesium mineral water reduces blood pressure, supports the heart, and calms the nervous system. Naturally carbonated varieties can ease nausea and digestive discomfort during illness.",
    fasting: "The most important water for extended fasting. As you fast, electrolytes are rapidly excreted. Mineral water prevents the dangerous mineral depletion (especially sodium, potassium, and magnesium) that causes fasting headaches, cramps, heart palpitations, and weakness. Always have mineral water on hand during any fast longer than 24 hours.",
  },
  {
    key: "distilled",
    name: "Distilled Water",
    tag: "Zero TDS · Purest Form",
    color: "#555",
    bg: "#f3f4f6",
    icon: "🧪",
    timing: ["Short-term cleanses only", "Not for daily use", "During supervised detox protocols"],
    what: "Water that has been converted to steam through boiling and then re-condensed — leaving behind 100% of dissolved minerals, heavy metals, bacteria, viruses, pharmaceuticals, and chemicals. The result is the purest possible water with a TDS (total dissolved solids) of 0.",
    purpose: "Short-term deep detox and cleansing. Distilled water acts like a powerful magnet inside the body — its lack of minerals creates an osmotic pull that draws toxins, heavy metals, and metabolic waste from tissues into the water for excretion.",
    benefits: [
      "Most powerful short-term detox effect",
      "Draws heavy metals (mercury, lead, arsenic) from tissues",
      "Removes chemical residues from cells",
      "Completely pathogen-free — safest for immunocompromised individuals",
      "Commonly used in 7–21 day cleanse protocols",
    ],
    cleanse: "The chelation effect of distilled water is its primary value. Toxins stored in fat cells and soft tissues are mobilized and excreted through urine and sweat. Particularly effective for heavy metal detox and environmental toxin clearing. Many naturopathic doctors recommend 7–30 day distilled water cleanses for this reason.",
    weightLoss: "Toxins stored in fat cells prevent the body from releasing that fat. Distilled water helps mobilize those toxin-laden fat stores, supporting true fat loss (not just water weight). Best combined with a clean diet during the cleanse period.",
    energy: "Initially, as toxins are released, you may feel worse (a 'healing crisis') — then significantly better as the toxic burden is reduced. Many people report dramatically increased energy after a 7-day distilled water cleanse.",
    illness: "Short-term use during illness can accelerate recovery by pulling pathogens and their toxins from tissues. Not for ongoing use — add trace mineral drops if using for more than 2 weeks.",
    fasting: "Used in many medically supervised extended fasting programs. The detox-drawing effect is amplified during a fast when the digestive system is at rest. Always supplement with a quality trace mineral electrolyte during distilled water fasts longer than 3 days.",
  },
  {
    key: "deionized",
    name: "Deionized Water",
    tag: "Ion-Exchange Purified",
    color: "#374151",
    bg: "#f9fafb",
    icon: "🔬",
    timing: ["Short-term detox protocols only", "Not for daily or long-term use"],
    what: "Water purified through ion-exchange resins that swap mineral ions (calcium, magnesium, sodium, chloride) for hydrogen and hydroxyl ions, resulting in ultra-pure water. Similar to distilled but produced without heat.",
    purpose: "Laboratory-grade purity for specific short-term detox or clinical protocols. Like distilled water, it creates a pulling effect on dissolved substances in the body.",
    benefits: [
      "Ultra-pure water, similar to distilled",
      "May assist in heavy metal and ion clearing",
      "Used in specific clinical and naturopathic protocols",
    ],
    cleanse: "The mineral-free nature creates osmotic pressure that pulls dissolved ions from tissues — a short-term detox mechanism. Not as well-studied for internal use as distilled water.",
    weightLoss: "Limited direct role. The detox effect may assist weight loss indirectly by reducing toxic load.",
    energy: "No direct benefit — can actually reduce energy by depleting minerals if used long-term.",
    illness: "Not typically recommended during illness; the mineral depletion risk outweighs benefits.",
    fasting: "Not recommended for water fasting. The mineral-stripping effect becomes dangerous during a fast when the body is already conserving electrolytes. Use mineral water or alkaline water instead.",
  },
  {
    key: "filtered",
    name: "Filtered Water",
    tag: "Carbon · Reverse Osmosis · UV",
    color: "#0369a1",
    bg: "#e0f2fe",
    icon: "🌊",
    timing: ["All day, every day", "Best everyday drinking water", "With meals and supplements"],
    what: "Tap water passed through filtration systems — carbon block filters remove chlorine and chloramines; reverse osmosis (RO) removes heavy metals, nitrates, fluoride, and most contaminants; UV filtration kills pathogens. RO water is similar to distilled but slightly less pure.",
    purpose: "To eliminate the chronic low-grade toxic exposure from municipal tap water (chlorine, chloramines, fluoride, pharmaceutical residues, microplastics) while maintaining affordable, convenient hydration.",
    benefits: [
      "Removes chlorine that kills beneficial gut bacteria",
      "Eliminates fluoride associated with thyroid and neurological concerns",
      "Removes heavy metals and pharmaceutical residues",
      "Better taste encourages proper hydration",
      "Protects gut microbiome from chloramine damage",
      "More affordable than buying bottled water",
    ],
    cleanse: "By eliminating ongoing chemical exposure from tap water, filtered water gives your liver and gut a chance to heal and rebalance. Chlorine in tap water disrupts the gut microbiome — removing it allows beneficial bacteria to flourish, improving digestion, immunity, and mental health.",
    weightLoss: "Clean water without endocrine-disrupting chemicals (like atrazine in tap water) supports thyroid and hormonal function — critical for healthy metabolism. Proper hydration with clean water alone can improve metabolism by 24–30% temporarily.",
    energy: "Eliminating chlorine and chemical exposure reduces the liver's detox burden, freeing energy for cellular processes. Many people report better sleep and energy within weeks of switching to filtered water.",
    illness: "Removes pathogen risk and chemical irritants that chronically stress the immune system. Best daily water for those with autoimmune conditions, gut dysbiosis, or chemical sensitivities.",
    fasting: "The safe, reliable choice for all fasting protocols. If ionized or alkaline water is not available, quality filtered water is the standard recommendation for any intermittent or extended fast.",
  },
  {
    key: "structured",
    name: "Structured Water",
    tag: "Hexagonal · Vortex · Coherent",
    color: "#6D28D9",
    bg: "#ede9fe",
    icon: "❄️",
    timing: ["Morning upon waking", "Before meditation or focused work", "During spiritual fasting practices"],
    what: "Water whose molecules are arranged in a structured hexagonal lattice — similar to the water found inside living cells (intracellular water) and in glacier melt and mountain spring water. Created through vortexing, exposure to sunlight or infrared light, or passage through specialized devices. Also called EZ water (Exclusion Zone water) based on Dr. Gerald Pollack's research.",
    purpose: "To consume water in a form the body can immediately use at the cellular level without expending energy to restructure it. Every cell in your body maintains an internal structured water matrix — consuming pre-structured water may reduce the energy cost of cellular hydration.",
    benefits: [
      "Deeper cellular hydration and nutrient delivery",
      "Supports mitochondrial energy production",
      "Enhanced mental clarity and focus",
      "May support DNA integrity and cellular repair",
      "Reduces the energy cost of intracellular water structuring",
      "Used in longevity and biohacking protocols",
    ],
    cleanse: "Structured water may improve the cell's ability to expel waste and absorb nutrients simultaneously — the fundamental mechanism of cellular cleansing. EZ water in the cells acts as a battery, holding charge that drives cellular processes including waste removal.",
    weightLoss: "Improved mitochondrial function means more energy extracted from food and less stored as fat. Better cellular hydration reduces false hunger signals. Supports lymphatic drainage — the primary route for fat and toxin removal.",
    energy: "The structured water matrix inside cells is directly tied to mitochondrial ATP production. Drinking pre-structured water may reduce the energy 'tax' the body pays to organize incoming water molecules.",
    illness: "During illness, the body's structured water matrix deteriorates. Consuming structured water may support faster recovery. Sunlight exposure also naturally structures water in the body — a likely mechanism behind heliotherapy (sun healing).",
    fasting: "Increasingly popular in extended and spiritual fasting traditions. The structured water is believed to support the meditative and regenerative aspects of fasting, and its superior cellular hydration may make longer fasts more sustainable.",
  },
];

const FASTING_TYPES = [
  {
    key: "if",
    name: "Intermittent Fasting (IF)",
    tag: "16:8 · 18:6 · 5:2",
    color: "#2D6A4F",
    bg: "#c8e6d4",
    icon: "🕐",
    description: "The most popular and beginner-friendly form of fasting. Alternates between defined eating windows and fasting periods — no restriction on what you eat, only when.",
    protocols: [
      { name: "16:8", detail: "Fast 16 hours, eat within an 8-hour window (e.g., 12pm–8pm). The most sustainable daily practice." },
      { name: "18:6", detail: "Fast 18 hours, eat within 6 hours. More aggressive fat burning and autophagy than 16:8." },
      { name: "5:2", detail: "Eat normally 5 days per week; restrict to 500–600 calories on 2 non-consecutive days." },
      { name: "20:4 (Warrior Diet)", detail: "One 4-hour eating window in the evening. Deep autophagy daily." },
    ],
    benefits: [
      "Reduces insulin levels dramatically, unlocking fat burning",
      "Triggers autophagy (cellular self-cleaning) after 16–18 hours",
      "Improves insulin sensitivity and blood sugar regulation",
      "Reduces inflammation markers (CRP, IL-6)",
      "Supports weight loss: 0.5–1 lb per week on average",
      "Improves mental clarity and focus during the fasting window",
      "Supports gut microbiome diversity through digestive rest",
      "May extend lifespan via mTOR pathway regulation",
    ],
    water: "Drink freely during the fasting window. Best choices: alkaline water in the morning, filtered or spring water throughout the day. Add a pinch of Himalayan salt if feeling light-headed. Black coffee and plain tea are also acceptable in most IF protocols.",
    weightLoss: "Works primarily by reducing total calorie intake naturally and dramatically lowering insulin — the fat-storage hormone. When insulin is low, the body burns stored fat for fuel. Most people lose 1–2% of body weight per month consistently.",
    cleanse: "Each fasting window gives the digestive system complete rest. The gut lining repairs itself; the microbiome rebalances. After 12 hours, the liver shifts from processing food to deep detoxification.",
  },
  {
    key: "omad",
    name: "OMAD — One Meal A Day",
    tag: "23:1 Fast",
    color: "#B5651D",
    bg: "#fdebd0",
    icon: "🍽️",
    description: "The most extreme form of intermittent fasting — one eating window per day, typically 1 hour, with a 23-hour fast. A powerful tool for accelerated fat loss and maximum daily autophagy.",
    protocols: [
      { name: "Standard OMAD", detail: "One meal per day, same time each day. The meal should be nutritionally complete — protein, healthy fats, vegetables, complex carbs." },
      { name: "Dirty OMAD", detail: "One meal with no dietary restrictions. Effective for weight loss but less so for cellular health." },
    ],
    benefits: [
      "Deepest daily autophagy of any IF protocol",
      "Accelerated fat loss — many report 1–2 lbs/week",
      "Dramatically simplifies meal planning and food decisions",
      "Powerful insulin sensitivity reset",
      "Mental clarity throughout the day without food distractions",
      "Reduces chronic inflammation significantly",
      "Supports human growth hormone (HGH) production",
    ],
    water: "Drink 80–100 oz of water throughout the 23-hour fast. Best choices: alkaline water in the morning and afternoon, mineral water with electrolytes in the late afternoon to prevent cramping. Herbal teas and black coffee are acceptable.",
    weightLoss: "The single most effective daily fasting protocol for weight loss. The 23-hour fast keeps insulin suppressed almost all day, maximizing fat oxidation. Many people find OMAD eliminates overeating automatically.",
    cleanse: "23 hours of daily gut rest produces significant gut healing. The intestinal lining completely regenerates during the fasting period. Liver detox is maximized. Lymphatic drainage is enhanced when not diverted to digestion.",
  },
  {
    key: "extended",
    name: "Extended Fasting",
    tag: "24 – 72 Hours",
    color: "#7B2D8B",
    bg: "#f0d9f9",
    icon: "🌙",
    description: "Fasting periods of 24 to 72 hours without food. Requires more preparation and electrolyte management than intermittent fasting, but produces dramatically deeper healing effects.",
    protocols: [
      { name: "24-Hour Fast", detail: "Dinner to dinner (e.g., 6pm Monday to 6pm Tuesday). Powerful gut rest and autophagy trigger." },
      { name: "48-Hour Fast", detail: "Two full days. Significant immune reset begins. Stem cell activation reported after 48 hours." },
      { name: "72-Hour Fast", detail: "Three days. Immune system regeneration documented in research. Dramatic autophagy and cancer cell apoptosis. Requires electrolyte management." },
    ],
    benefits: [
      "Deep, whole-body autophagy — the body cleans out damaged cells",
      "Immune system regeneration (stem cell activation after 48–72h)",
      "Complete gut microbiome reset",
      "Significant reduction in systemic inflammation",
      "Insulin drops to baseline — deep metabolic reset",
      "Ketosis typically achieved by hour 24–36",
      "Human Growth Hormone surges up to 5x baseline",
      "May support cancer prevention via damaged-cell elimination",
    ],
    water: "Hydration is critical. Drink 80–120 oz per day of water. Alternate between alkaline water, mineral water (with electrolytes), and filtered water. Add sodium, potassium, and magnesium if going beyond 36 hours. Bone broth is acceptable in some extended fast protocols.",
    weightLoss: "Expect 1–2 lbs per day of scale weight loss (combination of true fat loss, glycogen depletion, and water). Most of the true fat loss occurs from 36 hours onward as ketosis deepens.",
    cleanse: "The most profound cleanse available without medical intervention. The gut is completely rested and repairs the mucosal lining. The liver deeply detoxifies. The lymphatic system clears backed-up cellular waste. Fat-soluble toxins are released as fat is burned.",
  },
  {
    key: "water_fast",
    name: "Water Fasting",
    tag: "Water Only · The Master Cleanse Protocol",
    color: "#1d6fa4",
    bg: "#d0eaf9",
    icon: "💧",
    description: "Consuming only water — no food, no juice, no broth — for a defined period. The oldest, most powerful healing protocol in human history, used across virtually every culture and healing tradition. Medically supervised water fasts of 7–21 days have produced remarkable documented results for chronic disease reversal.",
    protocols: [
      { name: "1-Day Water Fast", detail: "24-hour water fast. Excellent starting point. Gives the body a complete digestive rest and triggers meaningful autophagy." },
      { name: "3-Day Water Fast", detail: "72 hours. The immune system begins regenerating. Gut lining substantially healed. Ketosis is deep. Most people describe a profound clarity by day 3." },
      { name: "5-7 Day Water Fast", detail: "Requires preparation, electrolyte monitoring, and ideally medical supervision. Documented reversal of Type 2 diabetes, hypertension, and autoimmune conditions in some protocols." },
      { name: "Extended (10–21+ Days)", detail: "Medically supervised only. Used in clinics around the world for treatment-resistant chronic disease. Not for beginners." },
    ],
    benefits: [
      "The most aggressive autophagy possible — body consumes damaged cells, tumors, and cellular debris",
      "Complete gut rest — the intestinal lining fully heals and restores",
      "Immune system regeneration — new stem cells produced after 72+ hours",
      "Ketosis burns fat and produces ketones that feed the brain",
      "Blood pressure normalizes dramatically within 3–5 days",
      "Blood sugar resets — Type 2 diabetes improvement documented",
      "Inflammation markers collapse — CRP, IL-6, TNF-alpha all drop",
      "Mental clarity described as extraordinary by day 3–5",
      "Spiritual and psychological reset — deep clarity and calm",
      "Skin detoxification — blemishes, rashes, and psoriasis often improve",
    ],
    water: "WATER CHOICES MATTER:\n• Alkaline Water (pH 8.5–9.5): Best choice overall. Buffers the ketoacids produced during fat burning, making the fast more comfortable and effective.\n• Ionized Water: Amplifies autophagy through antioxidant (negative ORP) properties. Reduces oxidative stress from toxin release.\n• Mineral Water: Essential after day 2 to replenish sodium, potassium, and magnesium lost through urine. Prevents dangerous electrolyte depletion.\n• Distilled Water: Powerful detox-drawing effect but must be alternated with mineral water after day 2 to avoid mineral depletion.\n• Filtered Water: The baseline safe choice if specialty waters are unavailable.\n\nDrink 80–120 oz daily. Sip consistently — do not chug large amounts at once.",
    weightLoss: "Water fasting produces the most rapid weight loss of any protocol: typically 1–2 lbs per day on the scale. True fat loss (beyond glycogen and water) accelerates from day 2 onward. Fat-stored toxins are released and eliminated, which can trigger what naturopaths call a 'healing crisis' (temporary worsening of symptoms before improvement). Breaking the fast correctly is as important as the fast itself.",
    cleanse: "Total-body cleanse. The gut is fully rested and heals at an unprecedented rate. The liver switches entirely to detoxification mode. Kidneys increase filtration. The lymphatic system drains years of accumulated cellular waste. Fat cells release stored toxins, hormones, and heavy metals for elimination. Skin, lungs, and colon all participate in the elimination. A 3-day water fast is considered the equivalent of months of dietary detox by many naturopathic traditions.",
    breaking: "How you BREAK the fast is critical: Day 1 after fast — diluted fresh juice or watermelon water only. Day 2 — fresh juices, coconut water, broth. Day 3 — soft fruits, smoothies, steamed vegetables. Day 4+ — gradually reintroduce whole foods. Eating solid food immediately after an extended fast can cause refeeding syndrome.",
  },
  {
    key: "juice",
    name: "Juice Fasting",
    tag: "Fresh-Pressed · Micronutrient Flooding",
    color: "#D97706",
    bg: "#FEF3C7",
    icon: "🍊",
    description: "Consuming only fresh-pressed fruit and vegetable juices for a defined period. Technically a modified fast (calories are consumed) but the digestive system is largely rested. A gentler entry point than water fasting with significant detox benefits.",
    protocols: [
      { name: "3-Day Juice Cleanse", detail: "Most popular format. Typically 6 juices per day with 80+ oz of water. Liver and gut focused." },
      { name: "7-Day Juice Fast", detail: "Full week of juices. Profound skin improvement, gut healing, and weight loss. Requires preparation." },
      { name: "21-Day Juice Fast", detail: "Advanced protocol. Many people report complete remission of chronic conditions. Requires medical guidance." },
    ],
    benefits: [
      "Floods the body with vitamins, minerals, and phytonutrients",
      "Liver cleansing — green juices support glutathione production",
      "Gut microbiome reset and improved gut motility",
      "Skin detox — many report dramatic improvements in acne and eczema",
      "Weight loss: 1–2 lbs per day",
      "More gentle than water fasting — easier for beginners",
      "Reduces sugar cravings and resets taste preferences",
    ],
    water: "Supplement with 60–80 oz of filtered or distilled water between juices. Distilled water enhances the detox pull effect during a juice fast. Herbal teas (dandelion, milk thistle) support the liver during the cleanse.",
    weightLoss: "Juice fasting produces significant weight loss — primarily from gut content clearing, reduced calorie intake, improved metabolism, and true fat loss from ketosis (if calories are low enough). 3–7 days is the sweet spot for sustainable results.",
    cleanse: "The plant compounds in fresh juices (chlorophyll, flavonoids, enzymes) directly support liver Phase I and Phase II detoxification. Green juices (kale, spinach, parsley, cucumber) are especially powerful liver cleansers. Beet juice supports bile flow and liver fat breakdown.",
  },
  {
    key: "bone_broth",
    name: "Bone Broth Fasting",
    tag: "Gut Healing · Beginner Friendly",
    color: "#92400E",
    bg: "#FEF3C7",
    icon: "🍲",
    description: "Consuming only bone broth (and water) for a defined period. The gentlest form of fasting — excellent for gut healing, collagen replenishment, and as an introductory fast for beginners. The broth provides amino acids, electrolytes, and collagen precursors while keeping the digestive system nearly at rest.",
    protocols: [
      { name: "1–3 Day Bone Broth Fast", detail: "4–6 cups of high-quality bone broth per day plus 80 oz water. Best beginner fast." },
    ],
    benefits: [
      "Gut lining repair — gelatin and collagen seal intestinal permeability ('leaky gut')",
      "Electrolyte replenishment (sodium, potassium, magnesium) — no supplementation needed",
      "Joint and connective tissue healing from collagen and glycine",
      "Supports weight loss through calorie restriction and gut healing",
      "Gentle immune system support",
      "Reduces inflammation from glycine and proline content",
      "Excellent bridge into more intensive fasting protocols",
    ],
    water: "Drink 80 oz of water alongside the broth — alkaline or filtered. The combination of broth electrolytes and clean water provides excellent hydration.",
    weightLoss: "Modest but consistent weight loss of 0.5–1 lb/day. More importantly, gut healing from bone broth fasting dramatically improves long-term weight management by restoring proper digestion, nutrient absorption, and appetite signaling.",
    cleanse: "The glycine in bone broth is a critical cofactor for liver detoxification (Phase II conjugation). Gut healing from the gelatin reduces the chronic toxin leakage from a compromised gut lining — one of the most significant sources of systemic toxicity.",
  },
  {
    key: "dry",
    name: "Dry Fasting",
    tag: "No Food · No Water · Advanced Only",
    color: "#8B3A3A",
    bg: "#fdeaea",
    icon: "🔥",
    description: "Abstaining from both food AND water for a defined period. The most extreme and most powerful fasting method — 1 hour of dry fasting is believed to equal 3 hours of water fasting in terms of autophagy and healing effect. Practiced in many religious and spiritual traditions (Ramadan, Yom Kippur, Eastern Orthodox fasting). Requires experience and caution.",
    protocols: [
      { name: "Soft Dry Fast", detail: "No food or water consumed, but external water contact (showering, brushing teeth) is permitted." },
      { name: "Hard Dry Fast", detail: "No food, water, or external water contact. Used in advanced protocols and some religious traditions." },
      { name: "Safe Duration", detail: "Beginners: 12–16 hours maximum (overnight). Experienced: up to 36 hours with extreme caution. Beyond 36 hours: medical supervision only." },
    ],
    benefits: [
      "Hyper-accelerated autophagy — the most powerful cellular cleaning possible",
      "The body burns internal fat to produce metabolic water — a survival adaptation",
      "Pathogen destruction — viruses and bacteria struggle in the body's dry environment",
      "Rapid reduction of edema (water retention) and inflammation",
      "Deep spiritual and mental clarity in shorter periods than water fasting",
      "Accelerates healing from injuries and inflammation",
    ],
    water: "By definition, no water is consumed during a dry fast. REHYDRATION after the fast is critical: break with small sips of mineral or alkaline water, then gradually increase over 1–2 hours before eating. Never break a dry fast with large amounts of water at once.",
    weightLoss: "The most rapid weight loss of any protocol — but much is water weight that returns upon rehydration. True fat loss is accelerated because the body burns fat to produce metabolic water. Best used strategically alongside other fasting protocols.",
    cleanse: "The dry environment inside the body during a dry fast forces pathogens, damaged cells, and metabolic waste to be consumed as fuel. The body essentially eats its own toxin-laden waste in a process even more aggressive than standard autophagy.",
    warning: "⚠️ Not for beginners. Not for anyone with kidney disease, cardiovascular conditions, or low body weight. Always consult a healthcare professional before attempting dry fasting beyond 16 hours.",
  },
];

function AccordionCard({
  title, tag, colorText, bg, icon, children, open, onToggle,
}: {
  title: string; tag: string; colorText: string; bg: string; icon: string;
  children: React.ReactNode; open: boolean; onToggle: () => void;
}) {
  return (
    <div style={{
      border: `1.5px solid ${colorText}33`, borderRadius: 12, marginBottom: 10, overflow: "hidden",
      background: open ? "#fff" : "#fafafa", transition: "all .15s",
    }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 18px", background: open ? bg : "transparent", border: "none", cursor: "pointer",
          textAlign: "left", gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>{icon}</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: colorText }}>{title}</div>
            <div style={{ fontSize: 11, color: "#777", fontWeight: 600 }}>{tag}</div>
          </div>
        </div>
        {open ? <ChevronUp size={16} color={colorText} /> : <ChevronDown size={16} color="#aaa" />}
      </button>
      {open && <div style={{ padding: "0 18px 18px" }}>{children}</div>}
    </div>
  );
}

function InfoBlock({ label, text, color }: { label: string; text: string; color: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 900, color, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 12.5, color: "#444", lineHeight: 1.65, whiteSpace: "pre-line" }}>{text}</div>
    </div>
  );
}

function BulletList({ items, color }: { items: string[]; color: string }) {
  return (
    <ul style={{ margin: 0, paddingLeft: 18 }}>
      {items.map((item, i) => (
        <li key={i} style={{ fontSize: 12.5, color: "#444", lineHeight: 1.65, marginBottom: 3 }}>
          <span style={{ color }}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function TimingBadges({ times, color }: { times: string[]; color: string }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
      {times.map(t => (
        <span key={t} style={{
          background: `${color}15`, border: `1px solid ${color}44`, color,
          borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700,
          display: "flex", alignItems: "center", gap: 4,
        }}>
          <Clock size={10} /> {t}
        </span>
      ))}
    </div>
  );
}

function WaterGuide() {
  const [open, setOpen] = useState<string | null>(null);
  const [sectionOpen, setSectionOpen] = useState(true);

  return (
    <div style={{ marginBottom: 40 }}>
      {/* Section header */}
      <button
        type="button"
        onClick={() => setSectionOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          background: `${BLUE}10`, border: `2px solid ${BLUE}44`, borderRadius: 14,
          padding: "16px 20px", cursor: "pointer", marginBottom: sectionOpen ? 16 : 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: BLUE_M, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Droplets size={20} color={BLUE} />
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: DARK }}>Understanding Water Types</div>
            <div style={{ fontSize: 11, color: "#666" }}>Purpose · Benefits · Best Timing · Cleansing · Fasting</div>
          </div>
        </div>
        {sectionOpen ? <ChevronUp size={18} color={BLUE} /> : <ChevronDown size={18} color="#aaa" />}
      </button>

      {sectionOpen && (
        <>
          <div style={{ fontSize: 13, color: "#555", lineHeight: 1.7, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px 16px", marginBottom: 18 }}>
            Not all water is the same. The type of water you drink — and <em>when</em> you drink it — profoundly affects your hydration, detoxification, energy, gut health, and ability to lose weight. Each water type interacts differently with your body chemistry. Understanding these differences is one of the most underrated tools in a wellness journey.
          </div>

          {WATER_TYPES.map(w => (
            <AccordionCard
              key={w.key}
              title={w.name}
              tag={w.tag}
              colorText={w.color}
              bg={w.bg}
              icon={w.icon}
              open={open === w.key}
              onToggle={() => setOpen(open === w.key ? null : w.key)}
            >
              <div style={{ borderTop: `1px solid ${w.color}22`, paddingTop: 16 }}>
                <InfoBlock label="What Is It?" text={w.what} color={w.color} />

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 900, color: w.color, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5, display: "flex", alignItems: "center", gap: 5 }}>
                    <Clock size={12} /> Best Time to Drink
                  </div>
                  <TimingBadges times={w.timing} color={w.color} />
                </div>

                <InfoBlock label="Purpose & Role" text={w.purpose} color={w.color} />

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 900, color: w.color, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                    <Heart size={12} /> Key Benefits
                  </div>
                  <BulletList items={w.benefits} color={w.color} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginTop: 14 }}>
                  <div style={{ background: "#f9fafb", border: `1px solid ${w.color}22`, borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 11, fontWeight: 900, color: w.color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                      <Leaf size={11} /> Cleansing Effect
                    </div>
                    <div style={{ fontSize: 12, color: "#555", lineHeight: 1.6 }}>{w.cleanse}</div>
                  </div>
                  <div style={{ background: "#f9fafb", border: `1px solid ${w.color}22`, borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 11, fontWeight: 900, color: w.color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                      <Zap size={11} /> Energy & Illness
                    </div>
                    <div style={{ fontSize: 12, color: "#555", lineHeight: 1.6 }}>{w.energy}</div>
                  </div>
                  <div style={{ background: "#f9fafb", border: `1px solid ${w.color}22`, borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 11, fontWeight: 900, color: w.color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                      <TrendingDown size={11} /> Weight Loss Role
                    </div>
                    <div style={{ fontSize: 12, color: "#555", lineHeight: 1.6 }}>{w.weightLoss}</div>
                  </div>
                  <div style={{ background: `${BLUE_M}`, border: `1px solid ${BLUE}44`, borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 11, fontWeight: 900, color: "#0d3a5c", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                      <Wind size={11} /> During Fasting
                    </div>
                    <div style={{ fontSize: 12, color: "#0d3a5c", lineHeight: 1.6 }}>{w.fasting}</div>
                  </div>
                </div>
                {w.key === "deionized" && (
                  <div style={{ marginTop: 12, background: "#fdeaea", border: "1px solid #8B3A3A44", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#8B3A3A", lineHeight: 1.6 }}>
                    ⚠️ <strong>Caution:</strong> Deionized and distilled water should not replace your primary drinking water long-term. The absence of minerals can lead to electrolyte imbalances. Always add trace mineral drops or alternate with mineral water when using either of these for more than 2 weeks.
                  </div>
                )}
              </div>
            </AccordionCard>
          ))}
        </>
      )}
    </div>
  );
}

function FastingGuide() {
  const [open, setOpen] = useState<string | null>(null);
  const [sectionOpen, setSectionOpen] = useState(true);

  return (
    <div style={{ marginBottom: 32 }}>
      <button
        type="button"
        onClick={() => setSectionOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          background: `${GREEN}10`, border: `2px solid ${GREEN}44`, borderRadius: 14,
          padding: "16px 20px", cursor: "pointer", marginBottom: sectionOpen ? 16 : 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: GREEN_M, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Flame size={20} color={GREEN} />
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: DARK }}>Fasting Guide</div>
            <div style={{ fontSize: 11, color: "#666" }}>Types · Benefits · Water Strategy · Weight Loss · Full Body Cleanse</div>
          </div>
        </div>
        {sectionOpen ? <ChevronUp size={18} color={GREEN} /> : <ChevronDown size={18} color="#aaa" />}
      </button>

      {sectionOpen && (
        <>
          <div style={{ fontSize: 13, color: "#555", lineHeight: 1.7, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px 16px", marginBottom: 18 }}>
            Fasting is the deliberate, temporary abstinence from food (and sometimes water) for a defined period. It is the oldest healing practice known to humanity — used in every culture, religion, and medical tradition throughout history. Modern science is now confirming what ancient healers understood: giving the body a complete break from digestion unlocks extraordinary healing, fat loss, and cellular renewal.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 20 }}>
            {[
              { icon: "🔄", label: "Autophagy", desc: "Body consumes damaged cells and debris" },
              { icon: "🧠", label: "Brain Clarity", desc: "Ketones fuel the brain cleaner than glucose" },
              { icon: "🦠", label: "Immune Reset", desc: "Stem cell activation after 48–72 hours" },
              { icon: "🔥", label: "Fat Burning", desc: "Insulin drops, stored fat burns for fuel" },
              { icon: "🌱", label: "Gut Healing", desc: "Mucosal lining repairs during digestive rest" },
              { icon: "💊", label: "Inflammation", desc: "CRP and inflammatory markers plummet" },
            ].map(b => (
              <div key={b.label} style={{ background: GREEN_M, border: `1px solid ${GREEN}44`, borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{b.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 900, color: GREEN_D }}>{b.label}</div>
                <div style={{ fontSize: 10, color: "#555", marginTop: 3, lineHeight: 1.4 }}>{b.desc}</div>
              </div>
            ))}
          </div>

          {FASTING_TYPES.map(f => (
            <AccordionCard
              key={f.key}
              title={f.name}
              tag={f.tag}
              colorText={f.color}
              bg={f.bg}
              icon={f.icon}
              open={open === f.key}
              onToggle={() => setOpen(open === f.key ? null : f.key)}
            >
              <div style={{ borderTop: `1px solid ${f.color}22`, paddingTop: 16 }}>
                <InfoBlock label="Overview" text={f.description} color={f.color} />

                {f.protocols && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 900, color: f.color, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Protocols</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {f.protocols.map(p => (
                        <div key={p.name} style={{ background: `${f.color}0C`, border: `1px solid ${f.color}30`, borderRadius: 8, padding: "8px 12px" }}>
                          <div style={{ fontSize: 12, fontWeight: 800, color: f.color, marginBottom: 2 }}>{p.name}</div>
                          <div style={{ fontSize: 12, color: "#555", lineHeight: 1.55 }}>{p.detail}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 900, color: f.color, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                    <Heart size={12} /> Benefits
                  </div>
                  <BulletList items={f.benefits} color={f.color} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginTop: 14 }}>
                  <div style={{ background: "#f0f9ff", border: `1px solid ${BLUE}33`, borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 11, fontWeight: 900, color: BLUE, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                      <Droplets size={11} /> Water Strategy
                    </div>
                    <div style={{ fontSize: 12, color: "#0d3a5c", lineHeight: 1.65, whiteSpace: "pre-line" }}>{f.water}</div>
                  </div>
                  <div style={{ background: "#f0fdf4", border: `1px solid ${GREEN}33`, borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 11, fontWeight: 900, color: GREEN, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                      <Leaf size={11} /> Gut & Body Cleanse
                    </div>
                    <div style={{ fontSize: 12, color: "#1A4032", lineHeight: 1.65 }}>{f.cleanse}</div>
                  </div>
                  <div style={{ background: "#fefce8", border: `1px solid ${GOLD}44`, borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 11, fontWeight: 900, color: "#7A6010", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                      <TrendingDown size={11} /> Weight Loss
                    </div>
                    <div style={{ fontSize: 12, color: "#7A6010", lineHeight: 1.65 }}>{f.weightLoss}</div>
                  </div>
                  {f.breaking && (
                    <div style={{ background: "#fdeaea", border: "1px solid #8B3A3A44", borderRadius: 10, padding: "12px 14px" }}>
                      <div style={{ fontSize: 11, fontWeight: 900, color: "#8B3A3A", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                        <AlertTriangle size={11} /> Breaking the Fast
                      </div>
                      <div style={{ fontSize: 12, color: "#8B3A3A", lineHeight: 1.65 }}>{f.breaking}</div>
                    </div>
                  )}
                </div>
                {f.warning && (
                  <div style={{ marginTop: 12, background: "#fdeaea", border: "1px solid #8B3A3A44", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#8B3A3A", lineHeight: 1.6 }}>
                    {f.warning}
                  </div>
                )}
              </div>
            </AccordionCard>
          ))}
        </>
      )}
    </div>
  );
}
