import { useState, useEffect } from "react";
import { Dumbbell, Sparkles, RefreshCw, AlertTriangle, Play, Clock, Flame, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const GREEN = "#2D6A4F";
const GREEN_D = "#1A4032";
const GREEN_M = "#c8e6d4";
const GOLD = "#C9A84C";
const PURPLE = "#4A3580";
const PURPLE_M = "#ede8ff";
const DARK = "#0a0a0a";

function apiFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem("nfgn_token");
  return fetch(path, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(opts?.headers ?? {}) },
  }).then(r => r.json());
}

interface Exercise { name: string; sets: string; reps: string; tip: string }
interface ExercisePlan {
  headline: string;
  intro: string;
  warmup: string[];
  mainWorkout: Exercise[];
  cooldown: string[];
  weeklySchedule: string;
  recoveryTips: string;
}

interface Profile { primaryGoal: string | null; activityLevel: string | null; bodyType: string | null }

const GOAL_LABELS: Record<string, string> = {
  weight_loss: "Weight Loss", muscle_gain: "Muscle Gain", maintenance: "Maintenance",
  detox: "Detox", energy: "Energy", sleep: "Sleep", hormonal: "Hormonal Balance",
};
const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: "Sedentary", light: "Light", moderate: "Moderate", active: "Active", athlete: "Athlete",
};

function Shimmer() {
  return (
    <div style={{ padding: "40px 0", textAlign: "center" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16 }}>
        <Sparkles size={20} color={PURPLE} />
        <span style={{ fontSize: 14, fontWeight: 700, color: PURPLE }}>Building your exercise plan…</span>
      </div>
      <div style={{ fontSize: 12, color: "#888", marginBottom: 24 }}>Tailoring workouts to your goal & activity level</div>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      {[90, 75, 85, 60, 80].map((w, i) => (
        <div key={i} style={{ height: 12, borderRadius: 8, background: "linear-gradient(90deg,#e5e7eb 25%,#d1d5db 50%,#e5e7eb 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite", width: `${w}%`, margin: "0 auto 10px" }} />
      ))}
    </div>
  );
}

function AccordionSection({ title, icon, color, children, defaultOpen = false }: { title: string; icon: React.ReactNode; color: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: "#fff", border: `1.5px solid ${color}33`, borderRadius: 14, overflow: "hidden", marginBottom: 14 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: "100%", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", border: "none", background: open ? `${color}0d` : "#fff", textAlign: "left" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ color }}>{icon}</span>
          <span style={{ fontWeight: 800, fontSize: 14, color: DARK }}>{title}</span>
        </div>
        {open ? <ChevronUp size={16} color={color} /> : <ChevronDown size={16} color={color} />}
      </button>
      {open && <div style={{ padding: "0 18px 18px" }}>{children}</div>}
    </div>
  );
}

export function ExercisePlan() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [plan, setPlan] = useState<ExercisePlan | null>(null);
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
    setLoading(true); setError("");
    try {
      const d = await apiFetch("/api/wellness/plan", { method: "POST", body: JSON.stringify({ section: "exercise" }) });
      if (d.error) { setError(d.error); return; }
      setPlan(d.plan);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  if (profileLoading) return <div style={{ padding: 40, textAlign: "center", color: "#888" }}>Loading…</div>;

  const hasProfile = profile && (profile.primaryGoal || profile.activityLevel);

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "28px 20px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: PURPLE_M, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Dumbbell size={22} color={PURPLE} />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: DARK, fontFamily: "Georgia, serif", margin: 0 }}>Home Exercise Plan</h1>
            <p style={{ fontSize: 12, color: "#666", margin: 0 }}>Personalized workouts for your goal & fitness level</p>
          </div>
        </div>
        <div style={{ height: 2, background: `linear-gradient(to right, ${PURPLE}, transparent)`, borderRadius: 2 }} />
      </div>

      {/* No profile CTA */}
      {!hasProfile && (
        <div style={{ background: "#fffbea", border: `1.5px solid ${GOLD}`, borderRadius: 14, padding: "20px 22px", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <AlertTriangle size={16} color={GOLD} />
            <span style={{ fontWeight: 800, fontSize: 14, color: "#7A6010" }}>Health Profile Required</span>
          </div>
          <p style={{ fontSize: 13, color: "#5a4200", lineHeight: 1.7, margin: "0 0 14px" }}>
            To generate your personalized exercise plan, we need your primary goal and activity level from your health profile.
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
            {profile?.primaryGoal && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: PURPLE_M, border: `1px solid ${PURPLE}44`, borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: PURPLE }}>
                <span style={{ color: "#888", fontWeight: 600 }}>Goal:</span> {GOAL_LABELS[profile.primaryGoal] ?? profile.primaryGoal}
              </div>
            )}
            {profile?.activityLevel && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: PURPLE_M, border: `1px solid ${PURPLE}44`, borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: PURPLE }}>
                <span style={{ color: "#888", fontWeight: 600 }}>Level:</span> {ACTIVITY_LABELS[profile.activityLevel] ?? profile.activityLevel}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Generate button */}
      {hasProfile && !plan && !loading && (
        <div style={{ textAlign: "center", padding: "40px 20px", background: "#f9f9f9", borderRadius: 14, border: "1px solid #e5e5e5", marginBottom: 24 }}>
          <Dumbbell size={32} color={PURPLE} style={{ marginBottom: 12, display: "block", margin: "0 auto 12px" }} />
          <h3 style={{ fontSize: 16, fontWeight: 800, color: DARK, marginBottom: 8 }}>Ready to generate your workout</h3>
          <p style={{ fontSize: 13, color: "#666", marginBottom: 20, lineHeight: 1.6 }}>Our AI will create a personalized home workout plan based on your fitness goal, current activity level, and body type — no gym required.</p>
          <Button onClick={generate} style={{ background: PURPLE, color: "#fff", fontWeight: 700, borderRadius: 8, padding: "10px 28px" }}>
            <Sparkles size={15} style={{ marginRight: 8 }} /> Generate My Workout Plan
          </Button>
        </div>
      )}

      {loading && <Shimmer />}

      {error && (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 10, padding: "14px 16px", marginBottom: 20, fontSize: 13, color: "#b91c1c" }}>
          {error === "Health profile not set up" ? "Please set up your health profile first." : `Error: ${error}`}
        </div>
      )}

      {plan && !loading && (
        <>
          {/* Hero */}
          <div style={{ background: `linear-gradient(135deg, ${PURPLE} 0%, #2a1f6e 100%)`, borderRadius: 14, padding: "20px 22px", marginBottom: 24, color: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Sparkles size={14} color={PURPLE_M} />
              <span style={{ fontSize: 10, fontWeight: 800, color: PURPLE_M, textTransform: "uppercase", letterSpacing: "0.06em" }}>AI-Personalized</span>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 900, fontFamily: "Georgia, serif", margin: "0 0 10px" }}>{plan.headline}</h2>
            <p style={{ fontSize: 13, lineHeight: 1.7, opacity: 0.9, margin: 0 }}>{plan.intro}</p>
            {plan.weeklySchedule && (
              <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(255,255,255,0.12)", borderRadius: 8, fontSize: 12, color: PURPLE_M, fontWeight: 600 }}>
                <Clock size={12} style={{ display: "inline", marginRight: 6 }} />
                {plan.weeklySchedule}
              </div>
            )}
          </div>

          {/* Warm-up */}
          <AccordionSection title="Warm-Up (5–10 min)" icon={<Flame size={16} />} color="#f97316" defaultOpen>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
              {(plan.warmup ?? []).map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#fff7ed", borderRadius: 8, border: "1px solid #fed7aa" }}>
                  <span style={{ background: "#f97316", color: "#fff", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: 13, color: "#431407", fontWeight: 600 }}>{item}</span>
                </div>
              ))}
            </div>
          </AccordionSection>

          {/* Main workout */}
          <AccordionSection title="Main Workout" icon={<Dumbbell size={16} />} color={PURPLE} defaultOpen>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
              {(plan.mainWorkout ?? []).map((ex, i) => (
                <div key={i} style={{ background: PURPLE_M, border: `1.5px solid ${PURPLE}33`, borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ background: PURPLE, color: "#fff", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, flexShrink: 0 }}>{i + 1}</div>
                      <span style={{ fontWeight: 800, fontSize: 14, color: PURPLE }}>{ex.name}</span>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <span style={{ background: PURPLE, color: "#fff", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700 }}>{ex.sets} sets</span>
                      <span style={{ background: "#fff", color: PURPLE, border: `1px solid ${PURPLE}`, borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700 }}>{ex.reps}</span>
                    </div>
                  </div>
                  {ex.tip && (
                    <div style={{ fontSize: 12, color: "#5b21b6", background: "rgba(255,255,255,0.6)", borderRadius: 6, padding: "6px 10px" }}>
                      <Play size={10} style={{ display: "inline", marginRight: 5 }} />{ex.tip}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </AccordionSection>

          {/* Cool-down */}
          <AccordionSection title="Cool-Down & Stretching" icon={<Clock size={16} />} color={GREEN} defaultOpen>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
              {(plan.cooldown ?? []).map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: GREEN_M, borderRadius: 8 }}>
                  <span style={{ background: GREEN, color: "#fff", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: 13, color: GREEN_D, fontWeight: 600 }}>{item}</span>
                </div>
              ))}
            </div>
          </AccordionSection>

          {/* Recovery tips */}
          {plan.recoveryTips && (
            <div style={{ background: GREEN_M, border: `1.5px solid ${GREEN}44`, borderRadius: 14, padding: "16px 18px", marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: GREEN, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Naturopathic Recovery</div>
              <p style={{ fontSize: 13, color: GREEN_D, lineHeight: 1.75, margin: 0 }}>{plan.recoveryTips}</p>
            </div>
          )}

          {/* Regenerate */}
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <button
              onClick={generate}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", background: "#fff", border: `1.5px solid ${PURPLE}`, borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: 700, color: PURPLE }}
            >
              <RefreshCw size={13} /> Regenerate Plan
            </button>
          </div>
        </>
      )}

      <div style={{ background: "#f9f9f9", border: "1px solid #e0e0e0", borderRadius: 12, padding: "14px 18px", fontSize: 11, color: "#777", lineHeight: 1.7 }}>
        <AlertTriangle size={13} style={{ display: "inline", marginRight: 5, color: GOLD }} />
        <strong>Educational Use Only.</strong> This exercise plan is AI-generated for informational purposes. Consult your physician before starting any new exercise program, especially if you have pre-existing health conditions.
      </div>
    </div>
  );
}
