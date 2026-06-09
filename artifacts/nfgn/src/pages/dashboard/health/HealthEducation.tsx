import { useState } from "react";
import { Flame, Scale, Droplets, Moon, Activity, AlertTriangle, ChevronDown, ChevronUp, Leaf } from "lucide-react";

const GREEN = "#2D6A4F";
const GREEN_D = "#1A4032";
const GREEN_M = "#c8e6d4";
const GOLD = "#C9A84C";
const DARK = "#0a0a0a";
const CREAM = "#fffdf5";

function AccordionItem({ title, children, defaultOpen = false, color = GREEN }: { title: string; children: React.ReactNode; defaultOpen?: boolean; color?: string }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: `1.5px solid ${color}33`, borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: "100%", background: open ? `${color}11` : "#fff", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", border: "none", textAlign: "left" }}
      >
        <span style={{ fontWeight: 800, fontSize: 14, color: DARK }}>{title}</span>
        {open ? <ChevronUp size={16} color={color} /> : <ChevronDown size={16} color={color} />}
      </button>
      {open && <div style={{ padding: "0 18px 16px", background: "#fff" }}>{children}</div>}
    </div>
  );
}

function Stat({ value, label, color = GREEN }: { value: string; label: string; color?: string }) {
  return (
    <div style={{ textAlign: "center", padding: "16px 12px", background: `${color}11`, borderRadius: 12, border: `1.5px solid ${color}33` }}>
      <div style={{ fontSize: 26, fontWeight: 900, color, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: "#555", fontWeight: 600, lineHeight: 1.4 }}>{label}</div>
    </div>
  );
}

export function HealthEducation() {
  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "28px 20px" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: GREEN_M, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Flame size={22} color={GREEN} />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: DARK, fontFamily: "Georgia, serif", margin: 0 }}>Calorie &amp; Nutrition Education</h1>
            <p style={{ fontSize: 12, color: "#666", margin: 0 }}>Holistic fat-loss fundamentals — naturopathic approach</p>
          </div>
        </div>
        <div style={{ height: 2, background: `linear-gradient(to right, ${GREEN}, transparent)`, borderRadius: 2 }} />
      </div>

      {/* Key stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 28 }}>
        <Stat value="3,500" label="Calories = 1 lb of fat" color={GREEN} />
        <Stat value="500 cal" label="Daily deficit = 1 lb/week" color="#1d6fa4" />
        <Stat value="750 cal" label="Daily deficit = ~1 lb/5 days" color="#7A6010" />
        <Stat value="1,000 cal" label="Daily deficit = 1 lb / 3.5 days" color="#8B3A3A" />
      </div>

      {/* Sections */}
      <AccordionItem title="🔥 What Is a Calorie?" defaultOpen color={GREEN}>
        <p style={{ fontSize: 13, color: "#444", lineHeight: 1.75, marginTop: 12 }}>
          A <strong>calorie</strong> is a unit of energy. In nutrition, it measures how much energy your body gets from food and drink. Your body burns calories constantly — even while you sleep — to power your heart, lungs, brain, and every cell.
        </p>
        <p style={{ fontSize: 13, color: "#444", lineHeight: 1.75 }}>
          When you consume <strong>more calories than you burn</strong>, the excess is stored as body fat. When you consume <strong>fewer calories than you burn</strong>, your body taps into those fat stores for energy — and you lose weight.
        </p>
        <div style={{ background: GREEN_M, borderRadius: 10, padding: "14px 16px", marginTop: 10, fontSize: 13, color: GREEN_D, fontWeight: 700 }}>
          💡 Holistic Note: Not all calories are equal. 200 calories of leafy greens nourish your body very differently than 200 calories of refined sugar. Quality always matters alongside quantity.
        </div>
      </AccordionItem>

      <AccordionItem title="⚖️ The 3,500 Calorie Rule — How Fat Loss Actually Works" color={GREEN}>
        <p style={{ fontSize: 13, color: "#444", lineHeight: 1.75, marginTop: 12 }}>
          One pound of body fat contains approximately <strong>3,500 calories</strong> of stored energy. To lose one pound of fat, you need to create a total calorie deficit of 3,500 calories — either through eating less, moving more, or a combination of both.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginTop: 14 }}>
          {[
            { deficit: "−500 cal/day", result: "1 lb lost per 7 days", pace: "Sustainable", color: GREEN },
            { deficit: "−750 cal/day", result: "1 lb lost per 4–5 days", pace: "Moderate", color: "#1d6fa4" },
            { deficit: "−1,000 cal/day", result: "1 lb lost per 3.5 days", pace: "Aggressive", color: "#7A6010" },
          ].map(r => (
            <div key={r.deficit} style={{ background: `${r.color}11`, border: `1.5px solid ${r.color}44`, borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: r.color }}>{r.deficit}</div>
              <div style={{ fontSize: 12, color: "#444", marginTop: 4 }}>{r.result}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: r.color, marginTop: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>{r.pace} Pace</div>
            </div>
          ))}
        </div>
        <div style={{ background: "#fffbea", border: `1.5px solid ${GOLD}`, borderRadius: 10, padding: "14px 16px", marginTop: 14, fontSize: 13, color: "#5a4200", lineHeight: 1.65 }}>
          <AlertTriangle size={14} style={{ display: "inline", marginRight: 6, color: GOLD }} />
          <strong>Holistic Caution:</strong> Deficits greater than 1,000 cal/day can stress the adrenals, slow metabolism, disrupt hormones, and cause muscle loss. For sustainable results, stay in the 500–750 range and support your body with proper hydration, sleep, and herbs.
        </div>
      </AccordionItem>

      <AccordionItem title="🩸 Blood Type & Nutrition — Why It Matters" color="#8B3A3A">
        <p style={{ fontSize: 13, color: "#444", lineHeight: 1.75, marginTop: 12 }}>
          According to naturopathic blood type dietary theory (popularized by Dr. Peter D'Adamo), your blood type influences how your body processes certain foods, your metabolic rate, and your predisposition to certain conditions.
        </p>
        {[
          { type: "Type O", label: "Hunter", diet: "High protein (lean meats, fish), limited grains and legumes. Best with intense physical exercise.", color: "#8B3A3A" },
          { type: "Type A", label: "Agrarian", diet: "Plant-based, whole grains, tofu, seafood. Thrives on calming exercises like yoga.", color: GREEN },
          { type: "Type B", label: "Nomad", diet: "Balanced omnivore — dairy, meat (no chicken), leafy greens. Moderate exercise.", color: "#1d6fa4" },
          { type: "Type AB", label: "Enigma", diet: "Mixed: tofu, seafood, dairy, green vegetables. Calming and moderate activities.", color: "#4A3580" },
        ].map(b => (
          <div key={b.type} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid #eee", alignItems: "flex-start" }}>
            <div style={{ minWidth: 80, textAlign: "center", background: `${b.color}15`, borderRadius: 8, padding: "8px 4px" }}>
              <div style={{ fontWeight: 900, fontSize: 14, color: b.color }}>{b.type}</div>
              <div style={{ fontSize: 10, color: "#888" }}>{b.label}</div>
            </div>
            <p style={{ fontSize: 12, color: "#555", lineHeight: 1.65, margin: 0 }}>{b.diet}</p>
          </div>
        ))}
        <p style={{ fontSize: 11, color: "#999", fontStyle: "italic", marginTop: 10 }}>Note: Personalized blood type protocols will be available in Phase 2 of this health app.</p>
      </AccordionItem>

      <AccordionItem title="🦠 What Is the Gut Biome?" color="#4A3580">
        <p style={{ fontSize: 13, color: "#444", lineHeight: 1.75, marginTop: 12 }}>
          Your <strong>gut microbiome</strong> is a complex ecosystem of trillions of bacteria, fungi, and other microorganisms living in your digestive tract. It plays a central role in digestion, immunity, weight management, mood regulation, and even hormonal balance.
        </p>
        <p style={{ fontSize: 13, color: "#444", lineHeight: 1.75 }}>
          A <strong>diverse, balanced microbiome</strong> efficiently breaks down food, produces essential vitamins (B12, K2), regulates inflammation, and communicates with your brain via the gut-brain axis. An <strong>imbalanced microbiome</strong> (dysbiosis) has been linked to weight gain, bloating, fatigue, anxiety, and chronic disease.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
          {[
            { label: "Diverse & Balanced", desc: "Ideal: wide variety of beneficial bacteria. Supports weight management and immunity.", color: GREEN },
            { label: "Low Diversity", desc: "Limited bacterial variety — common with processed food diets. Linked to weight gain.", color: "#1d6fa4" },
            { label: "Dysbiotic", desc: "Harmful bacteria overgrowth. Causes bloating, irregular digestion, inflammation.", color: "#7A6010" },
            { label: "Candida Dominant", desc: "Yeast overgrowth — sugar cravings, fatigue, brain fog, skin issues.", color: "#8B3A3A" },
            { label: "Inflammatory", desc: "Chronic low-grade inflammation from food sensitivities or leaky gut syndrome.", color: "#4A3580" },
          ].map(g => (
            <div key={g.label} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px", background: `${g.color}0d`, borderLeft: `3px solid ${g.color}`, borderRadius: "0 8px 8px 0" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: g.color }}>{g.label}</div>
                <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{g.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: GREEN_M, borderRadius: 10, padding: "12px 14px", marginTop: 14, fontSize: 13, color: GREEN_D }}>
          <strong>Support your gut biome holistically</strong> with fermented foods (kimchi, kefir, sauerkraut), prebiotic fibers (garlic, onion, bananas), and gut-cleansing herbs like ginger, licorice root, and slippery elm.
        </div>
      </AccordionItem>

      <AccordionItem title="💧 Hydration — The Foundation of Fat Loss" color="#1d6fa4">
        <p style={{ fontSize: 13, color: "#444", lineHeight: 1.75, marginTop: 12 }}>
          Water is involved in nearly every metabolic process in your body — including fat oxidation. Proper hydration keeps your metabolism running efficiently, helps curb hunger (thirst is often mistaken for hunger), and supports kidney and liver detoxification.
        </p>
        <div style={{ background: "#d0eaf9", border: "1.5px solid #1d6fa455", borderRadius: 10, padding: "14px 16px", marginTop: 10, fontSize: 13, color: "#0d3a5c" }}>
          <strong>General guideline:</strong> Drink at least <strong>half your body weight in ounces per day</strong>. If you weigh 200 lbs, aim for 100 oz of water daily. Add 16 oz for every 30 minutes of exercise.
        </div>
      </AccordionItem>

      <AccordionItem title="🌙 Sleep & Weight Loss — Why Rest Is Non-Negotiable" color="#4A3580">
        <p style={{ fontSize: 13, color: "#444", lineHeight: 1.75, marginTop: 12 }}>
          During deep sleep, your body releases <strong>human growth hormone (HGH)</strong> — the primary hormone responsible for fat burning and muscle repair. Chronic sleep deprivation elevates <strong>cortisol</strong> (the stress hormone), which promotes abdominal fat storage and triggers sugar cravings.
        </p>
        <p style={{ fontSize: 13, color: "#444", lineHeight: 1.75 }}>
          Adults should aim for <strong>7–9 hours of quality sleep</strong> per night. Herbs like valerian root, passionflower, and ashwagandha can support healthy sleep naturally.
        </p>
      </AccordionItem>

      {/* Disclaimer */}
      <div style={{ background: "#f9f9f9", border: "1px solid #e0e0e0", borderRadius: 12, padding: "14px 18px", fontSize: 11, color: "#777", lineHeight: 1.7, marginTop: 8 }}>
        <AlertTriangle size={13} style={{ display: "inline", marginRight: 5, color: GOLD }} />
        <strong>Educational Use Only.</strong> This content is not medical advice and is not intended to diagnose, treat, cure, or prevent any disease. Always consult your physician or licensed healthcare provider before making changes to your diet or supplement routine.
      </div>
    </div>
  );
}
