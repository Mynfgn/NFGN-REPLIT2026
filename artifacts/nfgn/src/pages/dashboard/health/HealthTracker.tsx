import { useState, useEffect } from "react";
import { Scale, Droplets, Plus, TrendingDown, TrendingUp, Minus, AlertTriangle } from "lucide-react";
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

      <div style={{ background: "#f9f9f9", border: "1px solid #e0e0e0", borderRadius: 12, padding: "14px 18px", fontSize: 11, color: "#777", lineHeight: 1.7 }}>
        <AlertTriangle size={13} style={{ display: "inline", marginRight: 5, color: GOLD }} />
        <strong>Tip:</strong> Your water goal is calculated as half your body weight in ounces. Log your current weight first to get a personalized water target.
      </div>
    </div>
  );
}
