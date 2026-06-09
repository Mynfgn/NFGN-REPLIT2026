import { useState, useEffect, useCallback } from "react";
import { Search, Leaf, ChevronRight, X, ExternalLink, AlertTriangle, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const GREEN = "#2D6A4F";
const GREEN_D = "#1A4032";
const GREEN_M = "#c8e6d4";
const GOLD = "#C9A84C";
const DARK = "#0a0a0a";

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string; label: string }> = {
  herb:    { bg: "#d4edda", border: "#2D6A4F", text: "#1A4032", label: "Herb" },
  mineral: { bg: "#d0eaf9", border: "#1d6fa4", text: "#0d3a5c", label: "Mineral" },
  vitamin: { bg: "#FBF5DC", border: "#C9A84C", text: "#7A6010", label: "Vitamin" },
};

const CATEGORIES = [
  "Anxiety/stress/sleep",
  "Appetite/fiber",
  "Blood pressure/heart",
  "Blood sugar/diabetes support",
  "Brain/focus",
  "Energy/fatigue/adaptogen",
  "Gut cleansing/digestion",
  "Headaches",
  "Immune/cancer-support research",
  "Inflammation/joints",
  "Kidney/urinary",
  "Men/libido/ED",
  "Weight loss/metabolic",
  "Women/PCOS/hormone",
];

interface Reference {
  id: number;
  type: string;
  name: string;
  botanicalName: string | null;
  category: string;
  description: string;
  cautions: string | null;
  commonForms: string | null;
  sourceUrl: string | null;
}

function DetailDrawer({ item, onClose }: { item: Reference; onClose: () => void }) {
  const c = TYPE_COLORS[item.type] || TYPE_COLORS.herb;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex" }}>
      <div style={{ flex: 1, background: "rgba(0,0,0,0.4)" }} onClick={onClose} />
      <div style={{ width: Math.min(480, window.innerWidth), background: "#fff", overflowY: "auto", boxShadow: "-4px 0 20px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column" }}>
        <div style={{ background: `linear-gradient(135deg, ${c.border}, ${c.border}cc)`, padding: "20px 22px 18px", color: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ fontSize: 10, fontWeight: 800, background: "rgba(255,255,255,0.2)", padding: "3px 8px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.06em" }}>{c.label}</span>
              <h2 style={{ fontSize: 20, fontWeight: 900, margin: "8px 0 4px", fontFamily: "Georgia, serif" }}>{item.name}</h2>
              {item.botanicalName && <p style={{ fontSize: 12, opacity: 0.8, margin: 0, fontStyle: "italic" }}>{item.botanicalName}</p>}
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <X size={16} color="#fff" />
            </button>
          </div>
        </div>

        <div style={{ padding: "20px 22px", flex: 1 }}>
          <div style={{ display: "inline-block", fontSize: 11, fontWeight: 700, background: `${c.bg}`, color: c.text, border: `1px solid ${c.border}44`, padding: "4px 10px", borderRadius: 20, marginBottom: 18 }}>
            {item.category}
          </div>

          <div style={{ marginBottom: 18 }}>
            <h3 style={{ fontSize: 12, fontWeight: 900, color: c.border, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Educational Reference</h3>
            <p style={{ fontSize: 13, color: "#444", lineHeight: 1.75, margin: 0 }}>{item.description}</p>
          </div>

          {item.commonForms && (
            <div style={{ marginBottom: 18 }}>
              <h3 style={{ fontSize: 12, fontWeight: 900, color: c.border, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Common Forms</h3>
              <p style={{ fontSize: 13, color: "#444", lineHeight: 1.65, margin: 0 }}>{item.commonForms}</p>
            </div>
          )}

          {item.cautions && (
            <div style={{ background: "#fffbea", border: "1.5px solid #C9A84C", borderRadius: 10, padding: "12px 14px", marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <AlertTriangle size={13} color={GOLD} />
                <span style={{ fontSize: 11, fontWeight: 900, color: "#7A6010", textTransform: "uppercase", letterSpacing: "0.05em" }}>Cautions &amp; Interactions</span>
              </div>
              <p style={{ fontSize: 13, color: "#5a4200", lineHeight: 1.65, margin: 0 }}>{item.cautions}</p>
            </div>
          )}

          {item.sourceUrl && (
            <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: GREEN, fontWeight: 600, textDecoration: "none" }}>
              <ExternalLink size={13} /> View Reference Source
            </a>
          )}

          <div style={{ background: "#f5f5f5", borderRadius: 10, padding: "12px 14px", marginTop: 24, fontSize: 11, color: "#888", lineHeight: 1.65 }}>
            <AlertTriangle size={12} style={{ display: "inline", marginRight: 5, color: GOLD }} />
            Educational only. This is not medical advice. Consult your healthcare provider before using any herb, mineral, or vitamin supplement.
          </div>
        </div>
      </div>
    </div>
  );
}

export function HealthLibrary() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | "herb" | "mineral" | "vitamin">("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [items, setItems] = useState<Reference[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<Reference | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const LIMIT = 30;

  const load = useCallback(async (s: string, t: string, cat: string, off: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(LIMIT), offset: String(off) });
      if (s) params.set("search", s);
      if (t) params.set("type", t);
      if (cat) params.set("category", cat);
      const res = await fetch(`/api/wellness/references?${params}`);
      const data = await res.json();
      if (off === 0) setItems(data.references);
      else setItems(prev => [...prev, ...data.references]);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setOffset(0);
      load(search, typeFilter, categoryFilter, 0);
    }, 300);
    return () => clearTimeout(t);
  }, [search, typeFilter, categoryFilter, load]);

  const loadMore = () => {
    const next = offset + LIMIT;
    setOffset(next);
    load(search, typeFilter, categoryFilter, next);
  };

  return (
    <>
      {selected && <DetailDrawer item={selected} onClose={() => setSelected(null)} />}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 20px" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: GREEN_M, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Leaf size={22} color={GREEN} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: DARK, fontFamily: "Georgia, serif", margin: 0 }}>Herb &amp; Supplement Library</h1>
              <p style={{ fontSize: 12, color: "#666", margin: 0 }}>{total} entries — herbs, minerals &amp; vitamins</p>
            </div>
          </div>
          <div style={{ height: 2, background: `linear-gradient(to right, ${GREEN}, transparent)`, borderRadius: 2 }} />
        </div>

        {/* Search + filters */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#888" }} />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search herbs, minerals, vitamins…"
                style={{ paddingLeft: 36, fontSize: 14 }}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 14px", background: showFilters ? GREEN_M : "#fff", border: `1.5px solid ${showFilters ? GREEN : "#d0d0d0"}`, borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, color: showFilters ? GREEN : "#555", whiteSpace: "nowrap" }}
            >
              <Filter size={14} /> Filters
            </button>
          </div>

          {showFilters && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", padding: "14px 16px", background: "#f9f9f9", borderRadius: 10, border: "1px solid #e5e5e5" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 140 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: "0.05em" }}>Type</label>
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value as any)}
                  style={{ padding: "6px 10px", border: "1.5px solid #d0d0d0", borderRadius: 7, fontSize: 13, background: "#fff" }}
                >
                  <option value="">All Types</option>
                  <option value="herb">Herbs / Roots</option>
                  <option value="mineral">Minerals</option>
                  <option value="vitamin">Vitamins</option>
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 220 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: "0.05em" }}>Category / Condition</label>
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  style={{ padding: "6px 10px", border: "1.5px solid #d0d0d0", borderRadius: 7, fontSize: 13, background: "#fff" }}
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {(typeFilter || categoryFilter || search) && (
                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <button
                    onClick={() => { setSearch(""); setTypeFilter(""); setCategoryFilter(""); }}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#b91c1c" }}
                  >
                    <X size={12} /> Clear All
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Type pill tabs */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(["", "herb", "mineral", "vitamin"] as const).map(t => {
              const labels: Record<string, string> = { "": "All", herb: "🌿 Herbs & Roots", mineral: "💎 Minerals", vitamin: "⚡ Vitamins" };
              const active = typeFilter === t;
              return (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  style={{
                    padding: "5px 14px", borderRadius: 20, border: `1.5px solid ${active ? GREEN : "#d0d0d0"}`,
                    background: active ? GREEN : "#fff", color: active ? "#fff" : "#555",
                    fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  {labels[t]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results */}
        {loading && items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#888", fontSize: 14 }}>Loading…</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#888", fontSize: 14 }}>No results found. Try a different search or filter.</div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12, marginBottom: 20 }}>
              {items.map(item => {
                const c = TYPE_COLORS[item.type] || TYPE_COLORS.herb;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelected(item)}
                    style={{
                      background: "#fff", border: `1.5px solid ${c.border}44`, borderRadius: 12,
                      padding: "14px 16px", textAlign: "left", cursor: "pointer",
                      display: "flex", flexDirection: "column", gap: 6,
                      transition: "box-shadow 0.15s, border-color 0.15s",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = c.border; (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 2px 12px ${c.border}22`; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = `${c.border}44`; (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"; }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: DARK, lineHeight: 1.3 }}>{item.name}</span>
                      <span style={{ fontSize: 9, fontWeight: 800, background: c.bg, color: c.text, padding: "2px 7px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0, marginLeft: 6 }}>{c.label}</span>
                    </div>
                    {item.botanicalName && <span style={{ fontSize: 11, color: "#888", fontStyle: "italic" }}>{item.botanicalName}</span>}
                    <span style={{ fontSize: 11, color: c.text, background: c.bg, padding: "2px 8px", borderRadius: 10, alignSelf: "flex-start" }}>{item.category}</span>
                    <p style={{ fontSize: 12, color: "#666", lineHeight: 1.5, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {item.description}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: c.border, fontWeight: 700, marginTop: 2 }}>
                      View details <ChevronRight size={12} />
                    </div>
                  </button>
                );
              })}
            </div>

            {items.length < total && (
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <Button
                  onClick={loadMore}
                  disabled={loading}
                  style={{ background: GREEN, color: "#fff", fontWeight: 700, padding: "10px 24px", borderRadius: 8 }}
                >
                  {loading ? "Loading…" : `Load More (${total - items.length} remaining)`}
                </Button>
              </div>
            )}
          </>
        )}

        {/* Disclaimer */}
        <div style={{ background: "#f9f9f9", border: "1px solid #e0e0e0", borderRadius: 12, padding: "14px 18px", fontSize: 11, color: "#777", lineHeight: 1.7 }}>
          <AlertTriangle size={13} style={{ display: "inline", marginRight: 5, color: GOLD }} />
          <strong>Educational Use Only.</strong> This library is for informational purposes. Nothing here constitutes medical advice. Always consult your physician or licensed healthcare provider before using any supplement.
        </div>
      </div>
    </>
  );
}
