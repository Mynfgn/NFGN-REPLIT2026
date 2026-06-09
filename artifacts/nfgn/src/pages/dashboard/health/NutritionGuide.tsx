import { useState, useEffect } from "react";
import { Apple, Sparkles, RefreshCw, AlertTriangle, CheckCircle, XCircle, Leaf, Zap } from "lucide-react";
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

interface NutritionPlan {
  headline: string;
  intro: string;
  eatMore: string[];
  eatLess: string[];
  herbs: string[];
  mealTips: string[];
  gutTips: string;
}

interface Profile {
  bloodType: string | null;
  bodyType: string | null;
  gutBiome: string | null;
  primaryGoal: string | null;
  activityLevel: string | null;
}

const BLOOD_TYPE_LABELS: Record<string, string> = {
  "O+": "Type O+", "O-": "Type O−", "A+": "Type A+", "A-": "Type A−",
  "B+": "Type B+", "B-": "Type B−", "AB+": "Type AB+", "AB-": "Type AB−",
};
const BODY_TYPE_LABELS: Record<string, string> = {
  ectomorph:      "Ectomorph",
  mesomorph:      "Mesomorph",
  endomorph:      "Endomorph",
  ecto_mesomorph: "Ecto-Mesomorph",
  meso_ectomorph: "Meso-Ectomorph",
  meso_endomorph: "Meso-Endomorph",
  endo_mesomorph: "Endo-Mesomorph",
  ecto_endomorph: "Ecto-Endomorph",
  endo_ectomorph: "Endo-Ectomorph",
  balanced:       "Balanced (Triple Blend)",
};
const GUT_BIOME_LABELS: Record<string, string> = {
  diverse: "Diverse & Balanced", low_diversity: "Low Diversity", dysbiotic: "Dysbiotic",
  candida_dominant: "Candida Dominant", inflammatory: "Inflammatory",
};
const GOAL_LABELS: Record<string, string> = {
  weight_loss: "Weight Loss", muscle_gain: "Muscle Gain", maintenance: "Maintenance",
  detox: "Detox", energy: "Energy", sleep: "Sleep", hormonal: "Hormonal Balance",
};

function ProfileChip({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: GREEN_M, border: `1px solid ${GREEN}44`, borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: GREEN_D }}>
      <span style={{ color: "#888", fontWeight: 600 }}>{label}:</span> {value}
    </div>
  );
}

function Shimmer() {
  return (
    <div style={{ padding: "40px 0", textAlign: "center" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16 }}>
        <Sparkles size={20} color={GREEN} />
        <span style={{ fontSize: 14, fontWeight: 700, color: GREEN }}>Generating your personalized nutrition plan…</span>
      </div>
      <div style={{ fontSize: 12, color: "#888", marginBottom: 24 }}>Tailoring to your blood type, body type & gut biome</div>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      {[90, 75, 85, 60, 80].map((w, i) => (
        <div key={i} style={{ height: 12, borderRadius: 8, background: "linear-gradient(90deg,#e5e7eb 25%,#d1d5db 50%,#e5e7eb 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite", width: `${w}%`, margin: "0 auto 10px" }} />
      ))}
    </div>
  );
}

export function NutritionGuide() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/api/wellness/profile").then(d => {
      setProfile(d.profile);
      setProfileLoading(false);
    }).catch(() => setProfileLoading(false));
  }, []);

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const d = await apiFetch("/api/wellness/plan", { method: "POST", body: JSON.stringify({ section: "nutrition" }) });
      if (d.error) { setError(d.error); return; }
      setPlan(d.plan);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (profileLoading) return <div style={{ padding: 40, textAlign: "center", color: "#888" }}>Loading…</div>;

  const hasProfile = profile && (profile.bloodType || profile.bodyType || profile.gutBiome || profile.primaryGoal);

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "28px 20px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "#fdeaea", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Apple size={22} color="#8B3A3A" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: DARK, fontFamily: "Georgia, serif", margin: 0 }}>Personalized Nutrition Guide</h1>
            <p style={{ fontSize: 12, color: "#666", margin: 0 }}>Blood-type, body-type & gut-biome tailored food guidance</p>
          </div>
        </div>
        <div style={{ height: 2, background: "linear-gradient(to right, #8B3A3A, transparent)", borderRadius: 2 }} />
      </div>

      {/* No profile CTA */}
      {!hasProfile && (
        <div style={{ background: "#fffbea", border: `1.5px solid ${GOLD}`, borderRadius: 14, padding: "20px 22px", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <AlertTriangle size={16} color={GOLD} />
            <span style={{ fontWeight: 800, fontSize: 14, color: "#7A6010" }}>Health Profile Required</span>
          </div>
          <p style={{ fontSize: 13, color: "#5a4200", lineHeight: 1.7, margin: "0 0 14px" }}>
            To generate your personalized nutrition guide, please complete your health profile first. We need your blood type, body type, and gut biome to tailor recommendations to you.
          </p>
          <Link href="/dashboard/health/profile">
            <Button style={{ background: GOLD, color: "#fff", fontWeight: 700, borderRadius: 8 }}>Set Up Health Profile →</Button>
          </Link>
        </div>
      )}

      {/* Profile chips */}
      {hasProfile && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Your Profile</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {profile?.bloodType && <ProfileChip label="Blood" value={BLOOD_TYPE_LABELS[profile.bloodType] ?? profile.bloodType} />}
            {profile?.bodyType && <ProfileChip label="Body" value={BODY_TYPE_LABELS[profile.bodyType] ?? profile.bodyType} />}
            {profile?.gutBiome && <ProfileChip label="Gut" value={GUT_BIOME_LABELS[profile.gutBiome] ?? profile.gutBiome} />}
            {profile?.primaryGoal && profile.primaryGoal.split(",").map((g: string) => g.trim()).filter(Boolean).map((g: string) => (
              <ProfileChip key={g} label="Goal" value={GOAL_LABELS[g] ?? g} />
            ))}
          </div>
        </div>
      )}

      {/* Generate button */}
      {hasProfile && !plan && !loading && (
        <div style={{ textAlign: "center", padding: "40px 20px", background: "#f9f9f9", borderRadius: 14, border: "1px solid #e5e5e5", marginBottom: 24 }}>
          <Sparkles size={32} color={GREEN} style={{ marginBottom: 12, display: "block", margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: 16, fontWeight: 800, color: DARK, marginBottom: 8 }}>Ready to generate your plan</h3>
          <p style={{ fontSize: 13, color: "#666", marginBottom: 20, lineHeight: 1.6 }}>Our AI will create a personalized nutrition guide based on your blood type, body type, gut biome, and wellness goals.</p>
          <Button onClick={generate} style={{ background: GREEN, color: "#fff", fontWeight: 700, borderRadius: 8, padding: "10px 28px" }}>
            <Sparkles size={15} style={{ marginRight: 8 }} /> Generate My Nutrition Plan
          </Button>
        </div>
      )}

      {/* Loading shimmer */}
      {loading && <Shimmer />}

      {/* Error */}
      {error && (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 10, padding: "14px 16px", marginBottom: 20, fontSize: 13, color: "#b91c1c" }}>
          {error === "Health profile not set up" ? "Please set up your health profile first." : `Error: ${error}`}
        </div>
      )}

      {/* Plan output */}
      {plan && !loading && (
        <>
          {/* Headline */}
          <div style={{ background: `linear-gradient(135deg, ${GREEN}, ${GREEN_D})`, borderRadius: 14, padding: "20px 22px", marginBottom: 24, color: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Sparkles size={14} color={GREEN_M} />
              <span style={{ fontSize: 10, fontWeight: 800, color: GREEN_M, textTransform: "uppercase", letterSpacing: "0.06em" }}>AI-Personalized</span>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 900, fontFamily: "Georgia, serif", margin: "0 0 10px" }}>{plan.headline}</h2>
            <p style={{ fontSize: 13, lineHeight: 1.7, opacity: 0.9, margin: 0 }}>{plan.intro}</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginBottom: 20 }}>
            {/* Eat More */}
            <div style={{ background: "#fff", border: `1.5px solid ${GREEN}44`, borderRadius: 14, padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <CheckCircle size={16} color={GREEN} />
                <span style={{ fontWeight: 800, fontSize: 14, color: GREEN_D }}>Eat More</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(plan.eatMore ?? []).map((food, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: GREEN_M, borderRadius: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: GREEN, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: GREEN_D, fontWeight: 600 }}>{food}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Eat Less */}
            <div style={{ background: "#fff", border: "1.5px solid #fca5a544", borderRadius: 14, padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <XCircle size={16} color="#dc2626" />
                <span style={{ fontWeight: 800, fontSize: 14, color: "#7f1d1d" }}>Minimize or Avoid</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(plan.eatLess ?? []).map((food, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "#fee2e2", borderRadius: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#dc2626", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "#7f1d1d", fontWeight: 600 }}>{food}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Herbs & supplements */}
          {plan.herbs?.length > 0 && (
            <div style={{ background: "#fff", border: `1.5px solid ${GREEN}33`, borderRadius: 14, padding: "18px 20px", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Leaf size={16} color={GREEN} />
                <span style={{ fontWeight: 800, fontSize: 14, color: GREEN_D }}>Recommended Herbs & Supplements</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
                {plan.herbs.map((herb, i) => {
                  const [name, ...rest] = herb.split(" - ");
                  return (
                    <div key={i} style={{ background: GREEN_M, borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ fontWeight: 800, fontSize: 13, color: GREEN_D }}>{name}</div>
                      {rest.length > 0 && <div style={{ fontSize: 11, color: "#2D6A4F", marginTop: 3 }}>{rest.join(" - ")}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Meal tips */}
          {plan.mealTips?.length > 0 && (
            <div style={{ background: "#fff", border: `1.5px solid ${GOLD}44`, borderRadius: 14, padding: "18px 20px", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Zap size={16} color={GOLD} />
                <span style={{ fontWeight: 800, fontSize: 14, color: "#7A6010" }}>Holistic Meal Tips</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {plan.mealTips.map((tip, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ background: GOLD, color: "#fff", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                    <p style={{ fontSize: 13, color: "#444", lineHeight: 1.7, margin: 0 }}>{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gut tips */}
          {plan.gutTips && (
            <div style={{ background: "#f3f0ff", border: "1.5px solid #7c3aed44", borderRadius: 14, padding: "16px 18px", marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#4A3580", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Gut Biome Support</div>
              <p style={{ fontSize: 13, color: "#3b0764", lineHeight: 1.75, margin: 0 }}>{plan.gutTips}</p>
            </div>
          )}

          {/* Regenerate */}
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <button
              onClick={generate}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", background: "#fff", border: `1.5px solid ${GREEN}`, borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: 700, color: GREEN }}
            >
              <RefreshCw size={13} /> Regenerate Plan
            </button>
          </div>
        </>
      )}

      <div style={{ background: "#f9f9f9", border: "1px solid #e0e0e0", borderRadius: 12, padding: "14px 18px", fontSize: 11, color: "#777", lineHeight: 1.7 }}>
        <AlertTriangle size={13} style={{ display: "inline", marginRight: 5, color: GOLD }} />
        <strong>Educational Use Only.</strong> This nutrition guide is AI-generated based on your profile and is for informational purposes only. It is not a substitute for professional dietary or medical advice. Always consult your healthcare provider before making significant changes to your diet.
      </div>
    </div>
  );
}
