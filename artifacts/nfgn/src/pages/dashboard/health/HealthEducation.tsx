import { useState, useEffect, useMemo } from "react";
import { Flame, Search, Plus, Trash2, Apple, Leaf, ChevronLeft, X, BookOpen, ClipboardList } from "lucide-react";
import { Link } from "wouter";

const GREEN = "#2D6A4F";
const GREEN_D = "#1A4032";
const GREEN_M = "#c8e6d4";
const GOLD = "#C9A84C";
const DARK = "#0a0a0a";

function apiFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem("nfgn_token");
  return fetch(path, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(opts?.headers ?? {}) },
  }).then(r => r.json());
}

// ── Comprehensive Food Database ──────────────────────────────────────────────
interface FoodItem {
  name: string;
  category: "fruit" | "vegetable";
  cal100g: number;
  serving: string;
  calServing: number;
  emoji: string;
  notes?: string;
}

const FOOD_DB: FoodItem[] = [
  // ── FRUITS ──
  { name: "Apple", category: "fruit", cal100g: 52, serving: "1 medium (182g)", calServing: 95, emoji: "🍎", notes: "High in fiber & antioxidants" },
  { name: "Banana", category: "fruit", cal100g: 89, serving: "1 medium (118g)", calServing: 105, emoji: "🍌", notes: "Rich in potassium & B6" },
  { name: "Orange", category: "fruit", cal100g: 47, serving: "1 medium (131g)", calServing: 62, emoji: "🍊", notes: "Excellent Vitamin C source" },
  { name: "Mango", category: "fruit", cal100g: 60, serving: "1 cup sliced (165g)", calServing: 99, emoji: "🥭", notes: "High in Vitamin A & C" },
  { name: "Pineapple", category: "fruit", cal100g: 50, serving: "1 cup chunks (165g)", calServing: 83, emoji: "🍍", notes: "Contains bromelain enzyme" },
  { name: "Grapes", category: "fruit", cal100g: 69, serving: "1 cup (92g)", calServing: 63, emoji: "🍇", notes: "Rich in resveratrol" },
  { name: "Strawberries", category: "fruit", cal100g: 32, serving: "1 cup (152g)", calServing: 49, emoji: "🍓", notes: "Very low calorie, high Vitamin C" },
  { name: "Blueberries", category: "fruit", cal100g: 57, serving: "1 cup (148g)", calServing: 84, emoji: "🫐", notes: "Powerful antioxidant superfood" },
  { name: "Watermelon", category: "fruit", cal100g: 30, serving: "1 cup diced (154g)", calServing: 46, emoji: "🍉", notes: "95% water, very hydrating" },
  { name: "Peach", category: "fruit", cal100g: 39, serving: "1 medium (150g)", calServing: 59, emoji: "🍑", notes: "Rich in Vitamins A & C" },
  { name: "Pear", category: "fruit", cal100g: 57, serving: "1 medium (178g)", calServing: 101, emoji: "🍐", notes: "High in soluble fiber" },
  { name: "Kiwi", category: "fruit", cal100g: 61, serving: "1 medium (76g)", calServing: 46, emoji: "🥝", notes: "High Vitamin C, aids digestion" },
  { name: "Papaya", category: "fruit", cal100g: 43, serving: "1 cup cubed (145g)", calServing: 62, emoji: "🍈", notes: "Contains papain enzyme" },
  { name: "Avocado", category: "fruit", cal100g: 160, serving: "½ medium (100g)", calServing: 160, emoji: "🥑", notes: "Healthy fats, potassium" },
  { name: "Grapefruit", category: "fruit", cal100g: 42, serving: "½ medium (154g)", calServing: 65, emoji: "🍊", notes: "Supports metabolism" },
  { name: "Cherries", category: "fruit", cal100g: 63, serving: "1 cup (154g)", calServing: 97, emoji: "🍒", notes: "Anti-inflammatory, aids sleep" },
  { name: "Raspberries", category: "fruit", cal100g: 52, serving: "1 cup (123g)", calServing: 64, emoji: "🍓", notes: "Very high in fiber" },
  { name: "Blackberries", category: "fruit", cal100g: 43, serving: "1 cup (144g)", calServing: 62, emoji: "🍇", notes: "High in Vitamin K" },
  { name: "Pomegranate", category: "fruit", cal100g: 83, serving: "½ cup seeds (87g)", calServing: 72, emoji: "🍎", notes: "Powerful antioxidant" },
  { name: "Cantaloupe", category: "fruit", cal100g: 34, serving: "1 cup diced (160g)", calServing: 54, emoji: "🍈", notes: "High Vitamin A, hydrating" },
  { name: "Honeydew", category: "fruit", cal100g: 36, serving: "1 cup diced (170g)", calServing: 61, emoji: "🍈", notes: "Good source of B vitamins" },
  { name: "Plum", category: "fruit", cal100g: 46, serving: "1 medium (66g)", calServing: 30, emoji: "🍑", notes: "Supports digestive health" },
  { name: "Fig", category: "fruit", cal100g: 74, serving: "1 medium (50g)", calServing: 37, emoji: "🫐", notes: "High in fiber & calcium" },
  { name: "Guava", category: "fruit", cal100g: 68, serving: "1 medium (90g)", calServing: 61, emoji: "🍐", notes: "Extremely high Vitamin C" },
  { name: "Lychee", category: "fruit", cal100g: 66, serving: "10 fruits (100g)", calServing: 66, emoji: "🍇", notes: "High in Vitamin C & B2" },
  { name: "Dragon Fruit", category: "fruit", cal100g: 60, serving: "1 cup (227g)", calServing: 136, emoji: "🐉", notes: "High in fiber & iron" },
  { name: "Passion Fruit", category: "fruit", cal100g: 97, serving: "1 medium (18g)", calServing: 17, emoji: "🍋", notes: "High in fiber & iron" },
  { name: "Tangerine", category: "fruit", cal100g: 53, serving: "1 medium (88g)", calServing: 47, emoji: "🍊", notes: "High in Vitamins A & C" },
  { name: "Nectarine", category: "fruit", cal100g: 44, serving: "1 medium (142g)", calServing: 62, emoji: "🍑", notes: "Good source of Vitamin C" },
  { name: "Apricot", category: "fruit", cal100g: 48, serving: "1 medium (35g)", calServing: 17, emoji: "🍑", notes: "High in beta-carotene" },
  { name: "Coconut Meat", category: "fruit", cal100g: 354, serving: "1 oz (28g)", calServing: 99, emoji: "🥥", notes: "High in healthy MCT fats" },
  { name: "Jackfruit", category: "fruit", cal100g: 95, serving: "1 cup (165g)", calServing: 157, emoji: "🍈", notes: "High protein for a fruit" },
  { name: "Lemon", category: "fruit", cal100g: 29, serving: "juice of 1 (47ml)", calServing: 11, emoji: "🍋", notes: "Alkalizing, detox support" },
  { name: "Lime", category: "fruit", cal100g: 30, serving: "juice of 1 (44ml)", calServing: 11, emoji: "🍋", notes: "Aids digestion & immunity" },

  // ── VEGETABLES ──
  { name: "Spinach", category: "vegetable", cal100g: 23, serving: "1 cup raw (30g)", calServing: 7, emoji: "🥬", notes: "Iron, folate, Vitamin K" },
  { name: "Broccoli", category: "vegetable", cal100g: 34, serving: "1 cup chopped (91g)", calServing: 31, emoji: "🥦", notes: "Anti-cancer sulforaphane" },
  { name: "Carrot", category: "vegetable", cal100g: 41, serving: "1 medium (61g)", calServing: 25, emoji: "🥕", notes: "Very high in beta-carotene" },
  { name: "Tomato", category: "vegetable", cal100g: 18, serving: "1 medium (123g)", calServing: 22, emoji: "🍅", notes: "Lycopene antioxidant" },
  { name: "Cucumber", category: "vegetable", cal100g: 15, serving: "1 cup sliced (119g)", calServing: 18, emoji: "🥒", notes: "96% water, very hydrating" },
  { name: "Bell Pepper", category: "vegetable", cal100g: 31, serving: "1 medium (119g)", calServing: 37, emoji: "🫑", notes: "Highest Vitamin C of any veg" },
  { name: "Onion", category: "vegetable", cal100g: 40, serving: "1 medium (110g)", calServing: 44, emoji: "🧅", notes: "Prebiotic, immune support" },
  { name: "Garlic", category: "vegetable", cal100g: 149, serving: "1 clove (3g)", calServing: 4, emoji: "🧄", notes: "Powerful anti-microbial" },
  { name: "Sweet Potato", category: "vegetable", cal100g: 86, serving: "1 medium (130g)", calServing: 112, emoji: "🍠", notes: "Very high Vitamin A" },
  { name: "White Potato", category: "vegetable", cal100g: 77, serving: "1 medium (213g)", calServing: 164, emoji: "🥔", notes: "High potassium & Vitamin C" },
  { name: "Kale", category: "vegetable", cal100g: 49, serving: "1 cup raw (67g)", calServing: 33, emoji: "🥬", notes: "Calcium, Vitamins A/C/K" },
  { name: "Cabbage", category: "vegetable", cal100g: 25, serving: "1 cup shredded (89g)", calServing: 22, emoji: "🥬", notes: "Supports gut & liver health" },
  { name: "Romaine Lettuce", category: "vegetable", cal100g: 17, serving: "1 cup shredded (47g)", calServing: 8, emoji: "🥗", notes: "Folate, Vitamin K" },
  { name: "Celery", category: "vegetable", cal100g: 16, serving: "1 stalk (40g)", calServing: 6, emoji: "🥬", notes: "Anti-inflammatory, diuretic" },
  { name: "Beets", category: "vegetable", cal100g: 43, serving: "1 medium (82g)", calServing: 35, emoji: "🫛", notes: "Boosts nitric oxide" },
  { name: "Asparagus", category: "vegetable", cal100g: 20, serving: "5 spears (75g)", calServing: 15, emoji: "🥦", notes: "Folate, natural diuretic" },
  { name: "Corn", category: "vegetable", cal100g: 86, serving: "1 ear (90g edible)", calServing: 77, emoji: "🌽", notes: "Fiber, B vitamins" },
  { name: "Green Peas", category: "vegetable", cal100g: 81, serving: "1 cup (145g)", calServing: 117, emoji: "🫛", notes: "High protein for a vegetable" },
  { name: "Green Beans", category: "vegetable", cal100g: 31, serving: "1 cup (100g)", calServing: 31, emoji: "🫛", notes: "Vitamins C & K, folate" },
  { name: "Zucchini", category: "vegetable", cal100g: 17, serving: "1 medium (196g)", calServing: 33, emoji: "🥒", notes: "Very low calorie, Vitamin C" },
  { name: "Eggplant", category: "vegetable", cal100g: 25, serving: "1 cup cubed (82g)", calServing: 20, emoji: "🍆", notes: "Antioxidants, fiber" },
  { name: "Cauliflower", category: "vegetable", cal100g: 25, serving: "1 cup (107g)", calServing: 27, emoji: "🥦", notes: "Sulforaphane, Vitamin C" },
  { name: "Brussels Sprouts", category: "vegetable", cal100g: 43, serving: "1 cup (88g)", calServing: 38, emoji: "🥦", notes: "Glucosinolates, anti-cancer" },
  { name: "Artichoke", category: "vegetable", cal100g: 47, serving: "1 medium heart (128g)", calServing: 60, emoji: "🥦", notes: "Liver detox, high fiber" },
  { name: "Mushroom", category: "vegetable", cal100g: 22, serving: "1 cup whole (96g)", calServing: 21, emoji: "🍄", notes: "Immune support, Vitamin D" },
  { name: "Butternut Squash", category: "vegetable", cal100g: 45, serving: "1 cup cubed (140g)", calServing: 63, emoji: "🎃", notes: "Beta-carotene, Vitamin E" },
  { name: "Arugula", category: "vegetable", cal100g: 25, serving: "1 cup (20g)", calServing: 5, emoji: "🥗", notes: "Glucosinolates, liver support" },
  { name: "Bok Choy", category: "vegetable", cal100g: 13, serving: "1 cup shredded (70g)", calServing: 9, emoji: "🥬", notes: "Calcium, Vitamins A & C" },
  { name: "Swiss Chard", category: "vegetable", cal100g: 19, serving: "1 cup raw (36g)", calServing: 7, emoji: "🥬", notes: "High magnesium & potassium" },
  { name: "Fennel", category: "vegetable", cal100g: 31, serving: "1 cup sliced (87g)", calServing: 27, emoji: "🌿", notes: "Digestive aid, anti-bloat" },
  { name: "Jicama", category: "vegetable", cal100g: 38, serving: "1 cup sliced (120g)", calServing: 46, emoji: "🥔", notes: "Prebiotic fiber, Vitamin C" },
  { name: "Kohlrabi", category: "vegetable", cal100g: 27, serving: "1 cup sliced (135g)", calServing: 36, emoji: "🥦", notes: "High Vitamin C, fiber" },
  { name: "Leek", category: "vegetable", cal100g: 61, serving: "1 medium (89g)", calServing: 54, emoji: "🧅", notes: "Prebiotic, iron, Vitamin K" },
  { name: "Parsnip", category: "vegetable", cal100g: 75, serving: "1 medium (90g)", calServing: 68, emoji: "🥕", notes: "High fiber, folate" },
  { name: "Okra", category: "vegetable", cal100g: 33, serving: "1 cup (100g)", calServing: 33, emoji: "🫛", notes: "Mucilage soothes gut" },
  { name: "Radish", category: "vegetable", cal100g: 16, serving: "1 cup sliced (116g)", calServing: 19, emoji: "🌶️", notes: "Detox, liver support" },
  { name: "Turnip", category: "vegetable", cal100g: 28, serving: "1 cup cubed (130g)", calServing: 36, emoji: "🥔", notes: "Vitamin C, glucosinolates" },
  { name: "Collard Greens", category: "vegetable", cal100g: 32, serving: "1 cup raw (36g)", calServing: 12, emoji: "🥬", notes: "Calcium, Vitamins A/K/C" },
  { name: "Watercress", category: "vegetable", cal100g: 11, serving: "1 cup (34g)", calServing: 4, emoji: "🥗", notes: "One of the most nutrient-dense foods" },
  { name: "Endive", category: "vegetable", cal100g: 17, serving: "1 cup (50g)", calServing: 9, emoji: "🥗", notes: "Bitter greens support bile flow" },
];

interface LogEntry {
  id: number;
  foodName: string;
  category: string;
  calories: number;
  servingSize: string;
  loggedAt: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  fruit: "#8B3A3A",
  vegetable: GREEN,
  other: "#4A3580",
};
const CATEGORY_BG: Record<string, string> = {
  fruit: "#fdeaea",
  vegetable: GREEN_M,
  other: "#ede8ff",
};

function CalorieBadge({ cal, bg, color }: { cal: number; bg: string; color: string }) {
  return (
    <span style={{ background: bg, color, fontWeight: 900, fontSize: 11, padding: "2px 8px", borderRadius: 10, whiteSpace: "nowrap" }}>
      {cal} cal
    </span>
  );
}

function ProgressRing({ pct, consumed, goal }: { pct: number; consumed: number; goal: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const capped = Math.min(pct, 100);
  const color = pct > 100 ? "#8B3A3A" : pct > 80 ? GOLD : GREEN;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <svg width={128} height={128} viewBox="0 0 128 128">
        <circle cx={64} cy={64} r={r} fill="none" stroke="#e5e7eb" strokeWidth={10} />
        <circle
          cx={64} cy={64} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={circ} strokeDashoffset={circ - (circ * capped) / 100}
          strokeLinecap="round" transform="rotate(-90 64 64)"
          style={{ transition: "stroke-dashoffset .5s, stroke .3s" }}
        />
        <text x={64} y={60} textAnchor="middle" fontSize={20} fontWeight={900} fill={DARK}>{consumed}</text>
        <text x={64} y={77} textAnchor="middle" fontSize={10} fill="#888">of {goal}</text>
        <text x={64} y={90} textAnchor="middle" fontSize={9} fill="#aaa">calories</text>
      </svg>
      <div style={{ fontSize: 12, fontWeight: 700, color }}>
        {pct > 100 ? `${consumed - goal} over goal` : `${goal - consumed} remaining`}
      </div>
    </div>
  );
}

export function HealthEducation() {
  const [tab, setTab] = useState<"library" | "tracker">("library");

  // Library state
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<"all" | "fruit" | "vegetable">("all");
  const [addedId, setAddedId] = useState<string | null>(null);

  // Tracker state
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [totalCal, setTotalCal] = useState(0);
  const [logsLoading, setLogsLoading] = useState(false);
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [manualName, setManualName] = useState("");
  const [manualCal, setManualCal] = useState("");
  const [manualServing, setManualServing] = useState("");
  const [manualCat, setManualCat] = useState("other");
  const [trackerSearch, setTrackerSearch] = useState("");
  const [addingId, setAddingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function loadLogs() {
    setLogsLoading(true);
    try {
      const d = await apiFetch("/api/wellness/calories");
      if (d.logs) { setLogs(d.logs); setTotalCal(d.totalCalories ?? 0); }
    } finally { setLogsLoading(false); }
  }

  useEffect(() => {
    loadLogs();
    apiFetch("/api/wellness/profile").then(d => {
      const goals: string[] = (d.profile?.primaryGoal ?? "").split(",").map((s: string) => s.trim()).filter(Boolean);
      if (goals.includes("weight_loss")) setCalorieGoal(1500);
      else if (goals.includes("muscle_gain")) setCalorieGoal(2500);
    }).catch(() => {});
  }, []);

  async function addFood(food: FoodItem) {
    const key = food.name;
    setAddingId(key);
    try {
      const d = await apiFetch("/api/wellness/calories", {
        method: "POST",
        body: JSON.stringify({ foodName: food.name, category: food.category, calories: food.calServing, servingSize: food.serving }),
      });
      if (d.entry) {
        setLogs(prev => [{ id: d.entry.id, foodName: d.entry.foodName, category: d.entry.category, calories: d.entry.calories, servingSize: d.entry.servingSize, loggedAt: d.entry.loggedAt }, ...prev]);
        setTotalCal(prev => prev + d.entry.calories);
        setAddedId(key);
        setTimeout(() => setAddedId(null), 2000);
      }
    } finally { setAddingId(null); }
  }

  async function addManual() {
    if (!manualName || !manualCal) return;
    const cal = parseInt(manualCal);
    if (isNaN(cal) || cal < 0) return;
    const d = await apiFetch("/api/wellness/calories", {
      method: "POST",
      body: JSON.stringify({ foodName: manualName, category: manualCat, calories: cal, servingSize: manualServing || "1 serving" }),
    });
    if (d.entry) {
      setLogs(prev => [{ id: d.entry.id, foodName: d.entry.foodName, category: d.entry.category, calories: d.entry.calories, servingSize: d.entry.servingSize, loggedAt: d.entry.loggedAt }, ...prev]);
      setTotalCal(prev => prev + d.entry.calories);
      setManualName(""); setManualCal(""); setManualServing(""); setManualCat("other");
    }
  }

  async function deleteLog(id: number, cal: number) {
    setDeletingId(id);
    try {
      await apiFetch(`/api/wellness/calories/${id}`, { method: "DELETE" });
      setLogs(prev => prev.filter(l => l.id !== id));
      setTotalCal(prev => Math.max(0, prev - cal));
    } finally { setDeletingId(null); }
  }

  const filtered = useMemo(() => {
    let items = FOOD_DB;
    if (filterCat !== "all") items = items.filter(f => f.category === filterCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(f => f.name.toLowerCase().includes(q) || (f.notes ?? "").toLowerCase().includes(q));
    }
    return items;
  }, [search, filterCat]);

  const trackerFiltered = useMemo(() => {
    if (!trackerSearch.trim()) return FOOD_DB;
    const q = trackerSearch.toLowerCase();
    return FOOD_DB.filter(f => f.name.toLowerCase().includes(q));
  }, [trackerSearch]);

  const pct = Math.round((totalCal / calorieGoal) * 100);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 20px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Link href="/dashboard/health">
          <button style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: "#888", fontSize: 12, marginBottom: 12, padding: 0 }}>
            <ChevronLeft size={14} /> Back to Wellness Hub
          </button>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: GREEN_M, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Flame size={22} color={GREEN} />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: DARK, fontFamily: "Georgia, serif", margin: 0 }}>Calorie &amp; Nutrition Guide</h1>
            <p style={{ fontSize: 12, color: "#666", margin: 0 }}>Food library + daily calorie tracker — {FOOD_DB.length} whole foods catalogued</p>
          </div>
        </div>
        <div style={{ height: 2, background: `linear-gradient(to right, ${GREEN}, transparent)`, borderRadius: 2 }} />
      </div>

      {/* Tab switcher */}
      <div style={{ display: "flex", gap: 4, background: "#f3f4f6", borderRadius: 12, padding: 4, marginBottom: 28, width: "fit-content" }}>
        {([
          { key: "library", label: "Food Library", Icon: BookOpen },
          { key: "tracker", label: "Daily Tracker", Icon: ClipboardList },
        ] as const).map(({ key, label, Icon }) => (
          <button
            key={key} onClick={() => setTab(key)}
            style={{
              padding: "9px 20px", borderRadius: 9, border: "none", cursor: "pointer",
              fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", gap: 7,
              background: tab === key ? "#fff" : "transparent",
              color: tab === key ? GREEN_D : "#888",
              boxShadow: tab === key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              transition: "all .15s",
            }}
          >
            <Icon size={15} /> {label}
            {key === "tracker" && totalCal > 0 && (
              <span style={{ background: GREEN, color: "#fff", fontSize: 10, fontWeight: 900, padding: "1px 6px", borderRadius: 8 }}>
                {totalCal}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── FOOD LIBRARY TAB ── */}
      {tab === "library" && (
        <>
          {/* Search + filter */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
              <Search size={15} color="#aaa" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search fruits & vegetables…"
                style={{ width: "100%", paddingLeft: 36, padding: "10px 12px 10px 36px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }}
              />
            </div>
            {(["all", "fruit", "vegetable"] as const).map(cat => (
              <button
                key={cat} onClick={() => setFilterCat(cat)}
                style={{
                  padding: "9px 16px", borderRadius: 10, border: `1.5px solid ${filterCat === cat ? (cat === "fruit" ? "#8B3A3A" : cat === "vegetable" ? GREEN : GOLD) : "#e5e7eb"}`,
                  background: filterCat === cat ? (cat === "fruit" ? "#fdeaea" : cat === "vegetable" ? GREEN_M : "#fffbea") : "#fff",
                  color: filterCat === cat ? (cat === "fruit" ? "#8B3A3A" : cat === "vegetable" ? GREEN_D : "#7a6010") : "#666",
                  fontWeight: 800, fontSize: 12, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                {cat === "all" ? "🌿 All" : cat === "fruit" ? "🍎 Fruits" : "🥦 Vegetables"}
                <span style={{ background: "#e5e7eb", borderRadius: 8, padding: "1px 6px", fontSize: 10, color: "#666" }}>
                  {cat === "all" ? FOOD_DB.length : FOOD_DB.filter(f => f.category === cat).length}
                </span>
              </button>
            ))}
          </div>

          {/* Stats bar */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 24 }}>
            {[
              { label: "Foods catalogued", value: FOOD_DB.length, color: GREEN },
              { label: "Avg fruit (per serving)", value: `${Math.round(FOOD_DB.filter(f => f.category === "fruit").reduce((s, f) => s + f.calServing, 0) / FOOD_DB.filter(f => f.category === "fruit").length)} cal`, color: "#8B3A3A" },
              { label: "Avg vegetable (per serving)", value: `${Math.round(FOOD_DB.filter(f => f.category === "vegetable").reduce((s, f) => s + f.calServing, 0) / FOOD_DB.filter(f => f.category === "vegetable").length)} cal`, color: GREEN },
              { label: "Lowest calorie food", value: FOOD_DB.slice().sort((a, b) => a.calServing - b.calServing)[0].name, color: "#4A3580" },
            ].map(s => (
              <div key={s.label} style={{ background: `${s.color}10`, border: `1.5px solid ${s.color}33`, borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ fontSize: s.value.toString().length > 5 ? 13 : 20, fontWeight: 900, color: s.color, marginBottom: 4 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#666" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#aaa" }}>
              <Search size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
              <div>No foods found for "{search}"</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 12 }}>
              {filtered.map(food => {
                const color = CATEGORY_COLORS[food.category];
                const bg = CATEGORY_BG[food.category];
                const isAdded = addedId === food.name;
                const isAdding = addingId === food.name;
                return (
                  <div key={food.name} style={{ background: "#fff", border: `1.5px solid ${color}33`, borderRadius: 14, padding: "16px 16px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                        {food.emoji}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: 14, color: DARK, marginBottom: 2 }}>{food.name}</div>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <span style={{ background: bg, color, fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 8, textTransform: "capitalize" }}>{food.category}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <div style={{ background: "#f9fafb", borderRadius: 8, padding: "8px 10px" }}>
                        <div style={{ fontSize: 10, color: "#888", marginBottom: 2 }}>Per 100g</div>
                        <div style={{ fontWeight: 900, fontSize: 14, color: DARK }}>{food.cal100g}</div>
                        <div style={{ fontSize: 10, color: "#aaa" }}>calories</div>
                      </div>
                      <div style={{ background: bg, borderRadius: 8, padding: "8px 10px" }}>
                        <div style={{ fontSize: 10, color: "#888", marginBottom: 2 }}>Per serving</div>
                        <div style={{ fontWeight: 900, fontSize: 14, color }}>{food.calServing}</div>
                        <div style={{ fontSize: 10, color: "#888" }}>{food.serving}</div>
                      </div>
                    </div>

                    {food.notes && (
                      <p style={{ fontSize: 11, color: "#777", margin: 0, lineHeight: 1.45, fontStyle: "italic" }}>✦ {food.notes}</p>
                    )}

                    <button
                      onClick={() => { addFood(food); setTab("tracker"); }}
                      disabled={isAdding}
                      style={{
                        marginTop: 2, padding: "8px 0", borderRadius: 8, border: `1.5px solid ${isAdded ? GREEN : color}`,
                        background: isAdded ? `${GREEN}18` : `${color}10`,
                        color: isAdded ? GREEN : color, fontWeight: 800, fontSize: 12,
                        cursor: isAdding ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                        transition: "all .15s",
                      }}
                    >
                      {isAdded ? <><span>✓</span> Added to tracker</> : isAdding ? "Adding…" : <><Plus size={13} /> Add to today's log</>}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── DAILY TRACKER TAB ── */}
      {tab === "tracker" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

          {/* Left: Progress + goal + today's log */}
          <div>
            {/* Goal ring */}
            <div style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 16, padding: "22px 20px", marginBottom: 16, textAlign: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: GREEN_D, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Today's Progress</div>
              <ProgressRing pct={pct} consumed={totalCal} goal={calorieGoal} />

              {/* Goal adjuster */}
              <div style={{ marginTop: 16, borderTop: "1px solid #f0f0f0", paddingTop: 14 }}>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>Daily calorie goal</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <button onClick={() => setCalorieGoal(g => Math.max(800, g - 100))} style={{ width: 28, height: 28, borderRadius: "50%", border: "1.5px solid #e5e7eb", background: "#f9fafb", cursor: "pointer", fontWeight: 900, fontSize: 16, color: "#555" }}>−</button>
                  <span style={{ fontSize: 16, fontWeight: 900, color: DARK, minWidth: 60, textAlign: "center" }}>{calorieGoal}</span>
                  <button onClick={() => setCalorieGoal(g => Math.min(5000, g + 100))} style={{ width: 28, height: 28, borderRadius: "50%", border: "1.5px solid #e5e7eb", background: "#f9fafb", cursor: "pointer", fontWeight: 900, fontSize: 16, color: "#555" }}>+</button>
                </div>
              </div>
            </div>

            {/* Macro summary */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
              {[
                { label: "Consumed", val: totalCal, color: pct > 100 ? "#8B3A3A" : GREEN },
                { label: "Remaining", val: Math.max(0, calorieGoal - totalCal), color: GOLD },
                { label: "Goal", val: calorieGoal, color: "#4A3580" },
              ].map(s => (
                <div key={s.label} style={{ background: `${s.color}10`, border: `1.5px solid ${s.color}33`, borderRadius: 10, padding: "12px 10px", textAlign: "center" }}>
                  <div style={{ fontSize: 17, fontWeight: 900, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: 10, color: "#888" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Today's log */}
            <div style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 14, padding: "18px 16px" }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: GREEN_D, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
                Today's Food Log {logs.length > 0 && <span style={{ background: "#e5e7eb", borderRadius: 8, padding: "1px 7px", fontSize: 10, color: "#666", marginLeft: 6 }}>{logs.length}</span>}
              </div>
              {logsLoading ? (
                <div style={{ padding: "20px 0", textAlign: "center", color: "#aaa", fontSize: 13 }}>Loading…</div>
              ) : logs.length === 0 ? (
                <div style={{ padding: "20px 0", textAlign: "center" }}>
                  <Flame size={28} color="#e5e7eb" style={{ marginBottom: 8 }} />
                  <div style={{ fontSize: 13, color: "#aaa" }}>No foods logged today</div>
                  <div style={{ fontSize: 11, color: "#bbb", marginTop: 4 }}>Search the food library and tap "Add to today's log"</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {logs.map(log => {
                    const color = CATEGORY_COLORS[log.category] ?? "#555";
                    const bg = CATEGORY_BG[log.category] ?? "#f0f0f0";
                    return (
                      <div key={log.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#f9fafb", borderRadius: 10, border: "1px solid #e5e7eb" }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {log.category === "fruit" ? <Apple size={14} color={color} /> : <Leaf size={14} color={color} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: DARK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.foodName}</div>
                          <div style={{ fontSize: 11, color: "#888" }}>{log.servingSize}</div>
                        </div>
                        <CalorieBadge cal={log.calories} bg={bg} color={color} />
                        <button
                          onClick={() => deleteLog(log.id, log.calories)}
                          disabled={deletingId === log.id}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", padding: 4, display: "flex", alignItems: "center" }}
                        >
                          {deletingId === log.id ? <span style={{ fontSize: 10 }}>…</span> : <Trash2 size={14} />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: Add food */}
          <div>
            {/* Quick search from library */}
            <div style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 14, padding: "18px 16px", marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: GREEN_D, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Add from Food Library</div>
              <div style={{ position: "relative", marginBottom: 12 }}>
                <Search size={14} color="#aaa" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  value={trackerSearch} onChange={e => setTrackerSearch(e.target.value)}
                  placeholder="Search food to add…"
                  style={{ width: "100%", paddingLeft: 32, padding: "9px 12px 9px 32px", border: "1.5px solid #e5e7eb", borderRadius: 9, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
                {trackerSearch && (
                  <button onClick={() => setTrackerSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#aaa" }}>
                    <X size={13} />
                  </button>
                )}
              </div>
              <div style={{ maxHeight: 280, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                {(trackerSearch ? trackerFiltered : FOOD_DB.slice(0, 15)).map(food => {
                  const color = CATEGORY_COLORS[food.category];
                  const bg = CATEGORY_BG[food.category];
                  const isAdding = addingId === food.name;
                  return (
                    <div key={food.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "#f9fafb", borderRadius: 9, border: "1px solid #e5e7eb" }}>
                      <span style={{ fontSize: 16 }}>{food.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: DARK }}>{food.name}</div>
                        <div style={{ fontSize: 10, color: "#888" }}>{food.serving}</div>
                      </div>
                      <CalorieBadge cal={food.calServing} bg={bg} color={color} />
                      <button
                        onClick={() => addFood(food)}
                        disabled={isAdding}
                        style={{ width: 28, height: 28, borderRadius: 7, border: `1.5px solid ${color}`, background: `${color}15`, color, cursor: isAdding ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                      >
                        {isAdding ? <span style={{ fontSize: 10 }}>…</span> : <Plus size={13} />}
                      </button>
                    </div>
                  );
                })}
                {trackerSearch && trackerFiltered.length === 0 && (
                  <div style={{ padding: "14px 0", textAlign: "center", fontSize: 12, color: "#aaa" }}>No match — use manual entry below</div>
                )}
                {!trackerSearch && (
                  <div style={{ padding: "8px 0", textAlign: "center", fontSize: 11, color: "#aaa" }}>Showing first 15 — type to search all {FOOD_DB.length}</div>
                )}
              </div>
            </div>

            {/* Manual entry */}
            <div style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 14, padding: "18px 16px" }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: GREEN_D, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Manual Entry</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input
                  value={manualName} onChange={e => setManualName(e.target.value)}
                  placeholder="Food name (e.g. Brown rice, Chicken breast)"
                  style={{ padding: "9px 12px", border: "1.5px solid #e5e7eb", borderRadius: 9, fontSize: 13, outline: "none" }}
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <input
                    type="number" value={manualCal} onChange={e => setManualCal(e.target.value)}
                    placeholder="Calories"
                    style={{ padding: "9px 12px", border: "1.5px solid #e5e7eb", borderRadius: 9, fontSize: 13, outline: "none" }}
                  />
                  <input
                    value={manualServing} onChange={e => setManualServing(e.target.value)}
                    placeholder="Serving (e.g. 1 cup)"
                    style={{ padding: "9px 12px", border: "1.5px solid #e5e7eb", borderRadius: 9, fontSize: 13, outline: "none" }}
                  />
                </div>
                <select
                  value={manualCat} onChange={e => setManualCat(e.target.value)}
                  style={{ padding: "9px 12px", border: "1.5px solid #e5e7eb", borderRadius: 9, fontSize: 13, background: "#fff", outline: "none" }}
                >
                  <option value="fruit">Fruit</option>
                  <option value="vegetable">Vegetable</option>
                  <option value="other">Other / Custom</option>
                </select>
                <button
                  onClick={addManual}
                  disabled={!manualName || !manualCal}
                  style={{
                    padding: "10px 0", borderRadius: 9, border: "none",
                    background: manualName && manualCal ? GREEN : "#e5e7eb",
                    color: manualName && manualCal ? "#fff" : "#aaa",
                    fontWeight: 800, fontSize: 13, cursor: manualName && manualCal ? "pointer" : "not-allowed",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                >
                  <Plus size={14} /> Log Food
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
