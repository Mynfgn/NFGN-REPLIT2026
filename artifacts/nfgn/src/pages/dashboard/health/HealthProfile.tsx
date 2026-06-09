import { useState, useEffect } from "react";
import { User, Save, CheckCircle2, AlertTriangle, ChevronLeft, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
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

const BLOOD_TYPES = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
const BODY_TYPE_GROUPS = [
  {
    group: "Pure Somatotypes",
    types: [
      { value: "ectomorph",     label: "Ectomorph",      desc: "Naturally lean, fast metabolism, hard to gain weight or muscle" },
      { value: "mesomorph",     label: "Mesomorph",       desc: "Athletic build, gains muscle easily, responds well to any training" },
      { value: "endomorph",     label: "Endomorph",       desc: "Broader frame, stores fat more easily, slower metabolism" },
    ],
  },
  {
    group: "Common Mixed Types",
    note: "Most people are a blend of two somatotypes",
    types: [
      { value: "ecto_mesomorph", label: "Ecto-Mesomorph", desc: "Lean and athletic — gains muscle while staying relatively lean. Common in swimmers, basketball players, and sprinters." },
      { value: "meso_ectomorph", label: "Meso-Ectomorph", desc: "Primarily muscular but with a leaner frame and faster metabolism than a typical mesomorph." },
      { value: "meso_endomorph", label: "Meso-Endomorph", desc: "Naturally muscular with a tendency to gain fat. Significant strength potential. Common in football linemen, powerlifters, wrestlers." },
      { value: "endo_mesomorph", label: "Endo-Mesomorph", desc: "Large frame with substantial muscle mass but also stores body fat readily." },
    ],
  },
  {
    group: "Less Common Mixed Types",
    types: [
      { value: "ecto_endomorph", label: "Ecto-Endomorph", desc: "Appears thin in the arms and legs but stores fat around the abdomen or hips — sometimes called \"skinny fat\"." },
      { value: "endo_ectomorph", label: "Endo-Ectomorph", desc: "Primarily endomorphic with some ectomorphic traits — long limbs but a tendency toward higher body fat." },
    ],
  },
  {
    group: "Rare Triple Blend",
    note: "Significant traits of all three body types",
    types: [
      { value: "balanced",       label: "Balanced / Triple Blend", desc: "Moderate frame, moderate muscle-building ability, moderate fat storage. Highly adaptable to different training styles." },
    ],
  },
];
const GUT_TYPES = [
  { value: "diverse", label: "Diverse & Balanced", desc: "Good variety of beneficial bacteria" },
  { value: "low_diversity", label: "Low Diversity", desc: "Limited bacterial variety, may need prebiotics" },
  { value: "dysbiotic", label: "Dysbiotic", desc: "Imbalanced gut flora, digestive issues" },
  { value: "candida_dominant", label: "Candida Dominant", desc: "Yeast overgrowth, sugar cravings" },
  { value: "inflammatory", label: "Inflammatory", desc: "Chronic gut inflammation, leaky gut signs" },
];
const ACTIVITY_LEVELS = [
  { value: "sedentary", label: "Sedentary", desc: "Little or no exercise" },
  { value: "light", label: "Lightly Active", desc: "Light exercise 1–3 days/week" },
  { value: "moderate", label: "Moderately Active", desc: "Moderate exercise 3–5 days/week" },
  { value: "active", label: "Active", desc: "Hard exercise 6–7 days/week" },
  { value: "athlete", label: "Athlete", desc: "Very hard exercise or physical job" },
];
const PRIMARY_GOALS = [
  { value: "weight_loss", label: "Weight Loss", color: "#8B3A3A" },
  { value: "muscle_gain", label: "Muscle Gain", color: "#1d6fa4" },
  { value: "maintenance", label: "Maintenance", color: GREEN },
  { value: "detox", label: "Detox & Cleanse", color: "#2D6A4F" },
  { value: "energy", label: "Boost Energy", color: "#7A6010" },
  { value: "sleep", label: "Better Sleep", color: "#4A3580" },
  { value: "hormonal", label: "Hormonal Balance", color: "#a83265" },
];
const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];
const CONDITIONS_GROUPS: { group: string; items: string[] }[] = [
  {
    group: "Metabolic & Weight-Related",
    items: ["Obesity", "Overweight", "Metabolic Syndrome", "Prediabetes", "Type 2 Diabetes", "Insulin Resistance", "Fatty Liver Disease (NAFLD)", "High Cholesterol", "High Triglycerides", "Hypoglycemia"],
  },
  {
    group: "Cardiovascular",
    items: ["High Blood Pressure (Hypertension)", "Low Blood Pressure (Hypotension)", "Coronary Artery Disease", "Congestive Heart Failure", "Atrial Fibrillation", "Peripheral Artery Disease", "Stroke Risk", "Poor Circulation"],
  },
  {
    group: "Digestive & Gut Health",
    items: ["Constipation", "Chronic Diarrhea", "Irritable Bowel Syndrome (IBS)", "Acid Reflux (GERD)", "Gastritis", "Leaky Gut Syndrome", "Gallstones", "Hemorrhoids", "Diverticulitis", "Food Sensitivities"],
  },
  {
    group: "Hormonal & Endocrine",
    items: ["Hypothyroidism", "Hyperthyroidism", "Menopause Symptoms", "Low Testosterone", "Polycystic Ovary Syndrome (PCOS)", "Adrenal Dysfunction", "Hormonal Imbalance"],
  },
  {
    group: "Kidney & Urinary",
    items: ["Kidney Stones", "Chronic Kidney Disease", "Frequent Urinary Tract Infections (UTIs)"],
  },
  {
    group: "Brain, Mood & Mental Wellness",
    items: ["Anxiety", "Depression", "Chronic Stress", "Brain Fog", "Memory Problems", "Insomnia"],
  },
  {
    group: "Musculoskeletal",
    items: ["Arthritis", "Osteoporosis", "Chronic Joint Pain", "Fibromyalgia", "Chronic Back Pain"],
  },
  {
    group: "Immune & Inflammatory",
    items: ["Chronic Inflammation", "Autoimmune Disorders", "Lupus", "Rheumatoid Arthritis", "Psoriasis", "Eczema", "Asthma", "Allergies"],
  },
  {
    group: "Additional & Specialty Conditions",
    items: ["Sleep Apnea", "Migraines", "Chronic Fatigue Syndrome", "Gout", "Erectile Dysfunction", "Low Libido", "Infertility", "Candida Overgrowth", "Parasite Concerns", "Vitamin D Deficiency", "Magnesium Deficiency", "Iron Deficiency Anemia", "Osteopenia", "Chronic Pain", "Smoking / Nicotine Dependence", "Alcohol Misuse", "Post-COVID Symptoms", "Sarcopenia (Muscle Loss)", "Pregnant", "Nursing / Breastfeeding"],
  },
];

const FT_OPTIONS = Array.from({ length: 5 }, (_, i) => i + 4); // 4ft – 8ft
const IN_OPTIONS = Array.from({ length: 12 }, (_, i) => i); // 0–11 inches

interface Profile {
  age: number | null;
  weightLbs: string | null;
  heightIn: number | null;
  gender: string | null;
  bloodType: string | null;
  bodyType: string | null;
  gutBiome: string | null;
  primaryGoal: string | null;
  activityLevel: string | null;
  conditions: string | null;
}

function completionPct(p: Profile): number {
  const fields = [p.age, p.gender, p.heightIn, p.weightLbs, p.bloodType, p.bodyType, p.gutBiome, p.activityLevel, p.primaryGoal];
  const filled = fields.filter(f => f !== null && f !== undefined && f !== "").length;
  return Math.round((filled / fields.length) * 100);
}

function SelectCard({
  value, selected, label, desc, color = GREEN,
  onClick,
}: { value: string; selected: boolean; label: string; desc?: string; color?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: selected ? `${color}18` : "#fff",
        border: `2px solid ${selected ? color : "#e5e7eb"}`,
        borderRadius: 10, padding: "10px 14px", cursor: "pointer", textAlign: "left",
        transition: "all .15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 16, height: 16, borderRadius: "50%",
          border: `2px solid ${selected ? color : "#ccc"}`,
          background: selected ? color : "transparent",
          flexShrink: 0,
        }} />
        <span style={{ fontSize: 13, fontWeight: 800, color: selected ? color : DARK }}>{label}</span>
      </div>
      {desc && <p style={{ fontSize: 11, color: "#777", margin: "4px 0 0 24px", lineHeight: 1.4 }}>{desc}</p>}
    </button>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 900, color: GREEN, textTransform: "uppercase", letterSpacing: "0.08em" }}>{title}</div>
      {subtitle && <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{subtitle}</div>}
    </div>
  );
}

export function HealthProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [heightFt, setHeightFt] = useState(5);
  const [heightIn, setHeightIn] = useState(7);
  const [weight, setWeight] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [bodyType, setBodyType] = useState("");
  const [gutBiome, setGutBiome] = useState("");
  const [activityLevel, setActivityLevel] = useState("");
  const [primaryGoals, setPrimaryGoals] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);

  useEffect(() => {
    apiFetch("/api/wellness/profile").then(d => {
      const p: Profile = d.profile;
      if (p) {
        if (p.age) setAge(String(p.age));
        if (p.gender) setGender(p.gender);
        if (p.heightIn) { setHeightFt(Math.floor(p.heightIn / 12)); setHeightIn(p.heightIn % 12); }
        if (p.weightLbs) setWeight(String(parseFloat(p.weightLbs)));
        if (p.bloodType) setBloodType(p.bloodType);
        if (p.bodyType) setBodyType(p.bodyType);
        if (p.gutBiome) setGutBiome(p.gutBiome);
        if (p.activityLevel) setActivityLevel(p.activityLevel);
        if (p.primaryGoal) setPrimaryGoals(p.primaryGoal.split(",").map((s: string) => s.trim()).filter(Boolean));
        if (p.conditions) setConditions(p.conditions.split(",").map((s: string) => s.trim()).filter(Boolean));
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  function toggleCondition(c: string) {
    setConditions(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const totalIn = heightFt * 12 + heightIn;
      const body: Record<string, unknown> = {
        ...(age ? { age: parseInt(age) } : {}),
        ...(gender ? { gender } : {}),
        heightIn: totalIn,
        ...(weight ? { weightLbs: parseFloat(weight) } : {}),
        ...(bloodType ? { bloodType } : {}),
        ...(bodyType ? { bodyType } : {}),
        ...(gutBiome ? { gutBiome } : {}),
        ...(activityLevel ? { activityLevel } : {}),
        ...(primaryGoals.length > 0 ? { primaryGoal: primaryGoals.join(", ") } : {}),
        conditions: conditions.join(", "),
      };
      const d = await apiFetch("/api/wellness/profile", { method: "POST", body: JSON.stringify(body) });
      if (d.error) { setError(d.error); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const pct = completionPct({
    age: age ? parseInt(age) : null,
    gender: gender || null,
    heightIn: heightFt * 12 + heightIn || null,
    weightLbs: weight || null,
    bloodType: bloodType || null,
    bodyType: bodyType || null,
    gutBiome: gutBiome || null,
    primaryGoal: primaryGoals.length > 0 ? primaryGoals[0] : null,
    activityLevel: activityLevel || null,
    conditions: null,
  });

  if (loading) return (
    <div style={{ padding: 40, textAlign: "center", color: "#888" }}>
      <Leaf size={24} color={GREEN} style={{ marginBottom: 8 }} />
      <div>Loading your health profile…</div>
    </div>
  );

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 20px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Link href="/dashboard/health">
          <button style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: "#888", fontSize: 12, marginBottom: 12, padding: 0 }}>
            <ChevronLeft size={14} /> Back to Wellness Hub
          </button>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: GREEN_M, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <User size={22} color={GREEN} />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: DARK, fontFamily: "Georgia, serif", margin: 0 }}>Health Profile</h1>
            <p style={{ fontSize: 12, color: "#666", margin: 0 }}>Your personal health data powers all AI recommendations</p>
          </div>
        </div>
        <div style={{ height: 2, background: `linear-gradient(to right, ${GREEN}, transparent)`, borderRadius: 2 }} />
      </div>

      {/* Completion bar */}
      <div style={{ background: pct === 100 ? `${GREEN}18` : "#fffbea", border: `1.5px solid ${pct === 100 ? GREEN : GOLD}`, borderRadius: 12, padding: "14px 18px", marginBottom: 28, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: pct === 100 ? GREEN_D : "#7A6010" }}>
              {pct === 100 ? "✓ Profile Complete" : `Profile ${pct}% Complete`}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#888" }}>{pct}%</span>
          </div>
          <div style={{ height: 6, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? GREEN : GOLD, borderRadius: 4, transition: "width .4s" }} />
          </div>
        </div>
        {pct < 100 && (
          <div style={{ fontSize: 11, color: "#7a6010", maxWidth: 180, lineHeight: 1.4 }}>
            Complete your profile to unlock personalized AI health recommendations
          </div>
        )}
      </div>

      {/* SECTION 1: Basic Info */}
      <div style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 14, padding: "22px 24px", marginBottom: 20 }}>
        <SectionHeader title="Basic Information" subtitle="Used to calculate your BMI and personalize recommendations" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>

          {/* Age */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 6 }}>Age</label>
            <input
              type="number" min={10} max={120} value={age}
              onChange={e => setAge(e.target.value)}
              placeholder="e.g. 34"
              style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {/* Gender */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 6 }}>Gender</label>
            <select
              value={gender} onChange={e => setGender(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 14, background: "#fff", outline: "none", boxSizing: "border-box" }}
            >
              <option value="">Select gender</option>
              {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>

          {/* Height */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 6 }}>Height</label>
            <div style={{ display: "flex", gap: 8 }}>
              <select
                value={heightFt} onChange={e => setHeightFt(parseInt(e.target.value))}
                style={{ flex: 1, padding: "9px 10px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 14, background: "#fff", outline: "none" }}
              >
                {FT_OPTIONS.map(f => <option key={f} value={f}>{f} ft</option>)}
              </select>
              <select
                value={heightIn} onChange={e => setHeightIn(parseInt(e.target.value))}
                style={{ flex: 1, padding: "9px 10px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 14, background: "#fff", outline: "none" }}
              >
                {IN_OPTIONS.map(i => <option key={i} value={i}>{i} in</option>)}
              </select>
            </div>
          </div>

          {/* Weight */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 6 }}>Weight (lbs)</label>
            <input
              type="number" min={50} max={600} value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder="e.g. 165"
              style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }}
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: Blood Type */}
      <div style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 14, padding: "22px 24px", marginBottom: 20 }}>
        <SectionHeader title="Blood Type" subtitle="Your blood type influences which foods and herbs work best for you" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 10 }}>
          {BLOOD_TYPES.map(bt => (
            <button
              key={bt} type="button" onClick={() => setBloodType(bt === bloodType ? "" : bt)}
              style={{
                padding: "12px 8px", borderRadius: 10, border: `2px solid ${bloodType === bt ? "#8B3A3A" : "#e5e7eb"}`,
                background: bloodType === bt ? "#fdeaea" : "#fff", cursor: "pointer",
                fontWeight: 900, fontSize: 15, color: bloodType === bt ? "#8B3A3A" : "#555",
              }}
            >
              {bt}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 3: Body Type */}
      <div style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 14, padding: "22px 24px", marginBottom: 20 }}>
        <SectionHeader title="Body Type (Somatotype)" subtitle="Most people are a blend — choose the type that best describes you" />
        <div style={{ fontSize: 11, color: "#888", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 12px", marginBottom: 14, lineHeight: 1.5 }}>
          Pure somatotypes (Ecto, Meso, Endo) are relatively rare. Most people are a <strong>hybrid of two types</strong>. Read each description and pick the one that feels most accurate.
        </div>
        {BODY_TYPE_GROUPS.map(group => (
          <div key={group.group} style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 900, color: GREEN, textTransform: "uppercase", letterSpacing: "0.07em" }}>{group.group}</span>
              {group.note && (
                <span style={{ fontSize: 10, color: "#999", fontStyle: "italic" }}>— {group.note}</span>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 }}>
              {group.types.map(bt => (
                <SelectCard
                  key={bt.value} value={bt.value} label={bt.label} desc={bt.desc}
                  selected={bodyType === bt.value} color={GREEN}
                  onClick={() => setBodyType(bodyType === bt.value ? "" : bt.value)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* SECTION 4: Gut Biome */}
      <div style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 14, padding: "22px 24px", marginBottom: 20 }}>
        <SectionHeader title="Gut Biome Status" subtitle="Your gut health affects nutrient absorption, immunity, and mood" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
          {GUT_TYPES.map(g => (
            <SelectCard
              key={g.value} value={g.value} label={g.label} desc={g.desc}
              selected={gutBiome === g.value} color="#1d6fa4"
              onClick={() => setGutBiome(gutBiome === g.value ? "" : g.value)}
            />
          ))}
        </div>
      </div>

      {/* SECTION 5: Activity Level */}
      <div style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 14, padding: "22px 24px", marginBottom: 20 }}>
        <SectionHeader title="Activity Level" subtitle="Used to calculate your total daily energy expenditure (TDEE)" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
          {ACTIVITY_LEVELS.map(a => (
            <SelectCard
              key={a.value} value={a.value} label={a.label} desc={a.desc}
              selected={activityLevel === a.value} color="#4A3580"
              onClick={() => setActivityLevel(activityLevel === a.value ? "" : a.value)}
            />
          ))}
        </div>
      </div>

      {/* SECTION 6: Primary Goal */}
      <div style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 14, padding: "22px 24px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <SectionHeader title="Primary Wellness Goal" subtitle="AI recommendations focus on your selected goals" />
          <span style={{
            fontSize: 11, fontWeight: 900, padding: "3px 10px", borderRadius: 10,
            background: primaryGoals.length === 3 ? `${GREEN}18` : "#f3f4f6",
            color: primaryGoals.length === 3 ? GREEN_D : "#888",
            border: `1px solid ${primaryGoals.length === 3 ? GREEN : "#e5e7eb"}`,
          }}>
            {primaryGoals.length} / 3 selected
          </span>
        </div>
        {primaryGoals.length === 3 && (
          <div style={{ fontSize: 11, color: "#7A6010", background: "#fffbea", border: "1px solid #C9A84C44", borderRadius: 8, padding: "6px 12px", marginBottom: 12 }}>
            Maximum 3 goals selected. Deselect one to change your choices.
          </div>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {PRIMARY_GOALS.map(g => {
            const sel = primaryGoals.includes(g.value);
            const maxed = !sel && primaryGoals.length >= 3;
            return (
              <button
                key={g.value} type="button"
                onClick={() => {
                  if (sel) setPrimaryGoals(prev => prev.filter(x => x !== g.value));
                  else if (primaryGoals.length < 3) setPrimaryGoals(prev => [...prev, g.value]);
                }}
                disabled={maxed}
                style={{
                  padding: "10px 18px", borderRadius: 20,
                  border: `2px solid ${sel ? g.color : "#e5e7eb"}`,
                  background: sel ? `${g.color}18` : maxed ? "#f9f9f9" : "#fff",
                  color: sel ? g.color : maxed ? "#bbb" : "#555",
                  fontWeight: 800, fontSize: 13,
                  cursor: maxed ? "not-allowed" : "pointer",
                  transition: "all .15s",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                {sel && <span style={{ fontSize: 12 }}>✓</span>}
                {g.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 7: Health Conditions */}
      <div style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 14, padding: "22px 24px", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <SectionHeader title="Health Conditions" subtitle="Helps the AI personalize and avoid contraindicated recommendations (optional)" />
          {conditions.length > 0 && (
            <span style={{ fontSize: 11, fontWeight: 900, padding: "3px 10px", borderRadius: 10, background: "#fdeaea", color: "#8B3A3A", border: "1px solid #8B3A3A44" }}>
              {conditions.length} selected
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: "#888", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 12px", marginBottom: 16, lineHeight: 1.5 }}>
          ⚠️ Selecting a condition does not constitute a medical diagnosis. This information is used only to tailor educational wellness content. Always consult a qualified healthcare professional for medical advice.
        </div>
        {CONDITIONS_GROUPS.map(group => (
          <div key={group.group} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: "#555", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid #f0f0f0" }}>
              {group.group}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {group.items.map(c => {
                const sel = conditions.includes(c);
                return (
                  <button
                    key={c} type="button" onClick={() => toggleCondition(c)}
                    style={{
                      padding: "6px 13px", borderRadius: 20, border: `1.5px solid ${sel ? "#8B3A3A" : "#e5e7eb"}`,
                      background: sel ? "#fdeaea" : "#f9f9f9",
                      color: sel ? "#8B3A3A" : "#555", fontWeight: sel ? 800 : 600, fontSize: 12, cursor: "pointer",
                      transition: "all .12s",
                    }}
                  >
                    {sel && "✓ "}{c}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Save button */}
      {error && (
        <div style={{ background: "#fdeaea", border: "1.5px solid #8B3A3A", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <AlertTriangle size={14} color="#8B3A3A" />
          <span style={{ fontSize: 13, color: "#8B3A3A" }}>{error}</span>
        </div>
      )}
      {saved && (
        <div style={{ background: `${GREEN}18`, border: `1.5px solid ${GREEN}`, borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle2 size={14} color={GREEN} />
          <span style={{ fontSize: 13, color: GREEN_D, fontWeight: 700 }}>Health profile saved! Your AI recommendations will now be personalized.</span>
        </div>
      )}
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Button
          onClick={handleSave} disabled={saving}
          style={{ background: GREEN, color: "#fff", fontWeight: 800, fontSize: 14, padding: "12px 28px", borderRadius: 10, display: "flex", alignItems: "center", gap: 8, border: "none", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}
        >
          <Save size={16} />
          {saving ? "Saving…" : "Save Health Profile"}
        </Button>
        <span style={{ fontSize: 12, color: "#888" }}>Your data is private and only used to personalize your wellness experience.</span>
      </div>
    </div>
  );
}
