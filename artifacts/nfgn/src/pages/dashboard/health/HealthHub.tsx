import { useState } from "react";
import { Link } from "wouter";
import { Leaf, Droplets, Scale, BookOpen, Activity, AlertTriangle, CheckCircle2, ChevronRight, Heart, Apple, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const GREEN = "#2D6A4F";
const GREEN_D = "#1A4032";
const GREEN_M = "#c8e6d4";
const GOLD = "#C9A84C";
const CREAM = "#f5f0e8";
const DARK = "#0a0a0a";

const DISCLAIMERS = [
  "This section is for educational and informational purposes only. It does not diagnose, treat, cure, or prevent any disease or medical condition.",
  "NFGN is not responsible for the misuse of any products or information found or purchased on this site.",
  "Always consult with your licensed healthcare provider or physician before beginning any supplement, herbal regimen, exercise program, or dietary change.",
  "If you have high blood pressure, diabetes, cancer, PCOS, thyroid conditions, anxiety, heart disease, or any other pre-existing condition — or if you are pregnant or nursing — professional medical guidance is essential before using any supplement.",
  "The content here is not a substitute for professional medical advice, diagnosis, or treatment.",
];

const FEATURES: { icon: React.ElementType; label: string; desc: string; href: string; color: string; bg: string; badge?: string }[] = [
  {
    icon: Leaf,
    label: "Herb & Supplement Library",
    desc: "500+ herbs, 50 minerals, 50 vitamins — each with educational descriptions, cautions, and common forms.",
    href: "/dashboard/health/library",
    color: GREEN,
    bg: GREEN_M,
  },
  {
    icon: Scale,
    label: "Weight & Water Tracker",
    desc: "Log your weight daily and track water intake. Visualize your progress over 7, 14, or 30 days.",
    href: "/dashboard/health/tracker",
    color: "#1d6fa4",
    bg: "#d0eaf9",
  },
  {
    icon: BookOpen,
    label: "Calorie & Nutrition Education",
    desc: "Understand calories, the 3,500-calorie rule, and how to holistically burn fat at your own pace.",
    href: "/dashboard/health/education",
    color: "#7A6010",
    bg: "#FBF5DC",
  },
  {
    icon: Apple,
    label: "Nutrition Guide",
    desc: "Blood-type, body-type, and gut-biome tailored nutritional guidance — AI-personalized to your profile.",
    href: "/dashboard/health/nutrition",
    color: "#8B3A3A",
    bg: "#fdeaea",
  },
  {
    icon: Dumbbell,
    label: "Home Exercise Plans",
    desc: "AI-personalized workouts based on your goal and activity level — no gym required.",
    href: "/dashboard/health/exercise",
    color: "#4A3580",
    bg: "#ede8ff",
  },
  {
    icon: Heart,
    label: "AI Health Assistant",
    desc: "Ask a naturopathic-trained AI any health, herb, or wellness question and get holistic guidance.",
    href: "/dashboard/health/ai-assistant",
    color: "#a83265",
    bg: "#fce8f0",
  },
];

export function HealthHub() {
  const [acknowledged, setAcknowledged] = useState(() => {
    return localStorage.getItem("nfgn_health_disclaimer") === "1";
  });

  function acknowledge() {
    localStorage.setItem("nfgn_health_disclaimer", "1");
    setAcknowledged(true);
  }

  if (!acknowledged) {
    return (
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: "50%", background: GREEN_M, marginBottom: 16 }}>
            <Leaf size={30} color={GREEN} />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: DARK, fontFamily: "Georgia, serif", marginBottom: 8 }}>
            NFGN Health &amp; Wellness
          </h1>
          <p style={{ fontSize: 14, color: "#555" }}>Powered by Naturopathic Principles &amp; the Prophetic Diet</p>
        </div>

        <div style={{ background: "#fffbea", border: "2px solid #C9A84C", borderRadius: 14, padding: "24px 28px", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <AlertTriangle size={20} color={GOLD} />
            <span style={{ fontWeight: 900, fontSize: 14, color: "#7A6010", textTransform: "uppercase", letterSpacing: "0.05em" }}>Important Disclaimer — Please Read</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {DISCLAIMERS.map((d, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontSize: 11, color: GOLD, fontWeight: 900, marginTop: 2, flexShrink: 0 }}>•</span>
                <p style={{ fontSize: 13, color: "#4a3800", lineHeight: 1.65, margin: 0 }}>{d}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: GREEN_M, border: `1px solid ${GREEN}`, borderRadius: 12, padding: "16px 20px", marginBottom: 28, fontSize: 13, color: GREEN_D, lineHeight: 1.65 }}>
          <strong>By entering this section</strong>, you confirm that you have read and understood the above, and that you are using this information for educational purposes only. NFGN does not replace your primary physician or healthcare practitioner.
        </div>

        <div style={{ textAlign: "center" }}>
          <Button
            onClick={acknowledge}
            style={{ background: GREEN, color: "#fff", fontWeight: 800, fontSize: 15, padding: "14px 36px", borderRadius: 10, border: "none", cursor: "pointer" }}
          >
            <CheckCircle2 size={18} style={{ marginRight: 8, display: "inline" }} />
            I Understand — Enter Health &amp; Wellness
          </Button>
          <p style={{ fontSize: 11, color: "#888", marginTop: 10 }}>You only need to acknowledge this once per device.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 20px" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: GREEN_M, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Leaf size={22} color={GREEN} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: DARK, fontFamily: "Georgia, serif", margin: 0 }}>NFGN Health &amp; Wellness</h1>
            <p style={{ fontSize: 12, color: "#666", margin: 0 }}>Holistic wellness tools powered by naturopathic principles</p>
          </div>
        </div>
        <div style={{ height: 2, background: `linear-gradient(to right, ${GREEN}, transparent)`, borderRadius: 2 }} />
      </div>

      {/* Ignite callout */}
      <div style={{ background: `linear-gradient(135deg, ${GREEN_D}, #166534)`, borderRadius: 14, padding: "20px 24px", marginBottom: 28, color: "#fff", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <Activity size={28} color={GOLD} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <p style={{ fontWeight: 900, fontSize: 16, margin: "0 0 4px" }}>Pair with IGNITE Products</p>
          <p style={{ fontSize: 13, margin: 0, opacity: 0.85 }}>This wellness hub is designed to complement your IGNITE supplement regimen and the Prophetic Diet by Joe Marcelino. Use these tools alongside your products for maximum results.</p>
        </div>
        <Link href="/shop">
          <button style={{ background: GOLD, color: DARK, fontWeight: 800, fontSize: 13, padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
            Shop IGNITE
          </button>
        </Link>
      </div>

      {/* Features grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 32 }}>
        {FEATURES.map(f => {
          const Icon = f.icon;
          const isComingSoon = !!f.badge;
          return (
            <Card key={f.label} style={{ border: `2px solid ${isComingSoon ? "#e5e5e5" : f.color + "55"}`, borderRadius: 14, opacity: isComingSoon ? 0.75 : 1 }}>
              <CardContent style={{ padding: "20px 20px 18px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: isComingSoon ? "#f0f0f0" : f.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={20} color={isComingSoon ? "#999" : f.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: isComingSoon ? "#888" : DARK }}>{f.label}</span>
                      {f.badge && (
                        <span style={{ fontSize: 9, fontWeight: 900, background: "#e0e0e0", color: "#666", padding: "2px 7px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.05em" }}>{f.badge}</span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: "#666", lineHeight: 1.55, margin: "0 0 12px" }}>{f.desc}</p>
                    {!isComingSoon ? (
                      <Link href={f.href}>
                        <button style={{ fontSize: 12, fontWeight: 700, color: f.color, background: f.bg, border: `1px solid ${f.color}44`, padding: "6px 14px", borderRadius: 7, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                          Open <ChevronRight size={13} />
                        </button>
                      </Link>
                    ) : (
                      <span style={{ fontSize: 11, color: "#aaa", fontStyle: "italic" }}>Coming soon</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Disclaimer footer */}
      <div style={{ background: "#f9f9f9", border: "1px solid #e0e0e0", borderRadius: 12, padding: "14px 18px", fontSize: 11, color: "#777", lineHeight: 1.7 }}>
        <AlertTriangle size={13} style={{ display: "inline", marginRight: 5, color: GOLD }} />
        <strong>Educational Use Only.</strong> This content is not medical advice. NFGN is not responsible for the misuse of any information or products found on this site. Always consult your healthcare provider before starting any supplement or exercise program.
      </div>
    </div>
  );
}
