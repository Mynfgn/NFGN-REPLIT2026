import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Leaf, ChevronRight, X, ExternalLink, AlertTriangle, Filter, Sparkles, MapPin, Globe, FlaskConical, Pill, BookOpen, HandHeart } from "lucide-react";
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
  // Rich AI-generated fields
  origin: string | null;
  culturalBackground: string | null;
  detailedDescription: string | null;
  keyBenefits: string | null;
  activeCompounds: string | null;
  howToUse: string | null;
  enrichedAt: string | null;
}

function SectionHeader({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
      <div style={{ color, flexShrink: 0 }}>{icon}</div>
      <span style={{ fontSize: 10, fontWeight: 900, color, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</span>
    </div>
  );
}

function PillList({ text, bg, textColor, border }: { text: string; bg: string; textColor: string; border: string }) {
  const items = text.split(",").map(s => s.trim()).filter(Boolean);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {items.map((item, i) => (
        <span
          key={i}
          style={{
            fontSize: 11, fontWeight: 600,
            background: bg, color: textColor,
            border: `1px solid ${border}`,
            padding: "3px 10px", borderRadius: 20,
            lineHeight: 1.4,
          }}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function EnrichingShimmer({ color }: { color: string }) {
  return (
    <div style={{ padding: "32px 0", textAlign: "center" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 14 }}>
        <Sparkles size={18} color={color} />
        <span style={{ fontSize: 13, fontWeight: 700, color }}>Generating botanical profile…</span>
      </div>
      <div style={{ fontSize: 12, color: "#888", marginBottom: 20 }}>Our AI is researching origin, compounds & usage</div>
      {[100, 80, 90, 70, 85].map((w, i) => (
        <div
          key={i}
          style={{
            height: 10, borderRadius: 8,
            background: `linear-gradient(90deg, #e5e7eb 25%, #d1d5db 50%, #e5e7eb 75%)`,
            backgroundSize: "200% 100%",
            animation: "shimmer 1.4s infinite",
            width: `${w}%`, margin: "0 auto 8px",
          }}
        />
      ))}
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </div>
  );
}

function DetailDrawer({ item, onClose, onEnriched }: {
  item: Reference;
  onClose: () => void;
  onEnriched: (enriched: Reference) => void;
}) {
  const c = TYPE_COLORS[item.type] || TYPE_COLORS.herb;
  const [enriching, setEnriching] = useState(false);
  const [data, setData] = useState<Reference>(item);
  const didEnrich = useRef(false);

  useEffect(() => {
    setData(item);
    didEnrich.current = false;
  }, [item.id]);

  useEffect(() => {
    if (didEnrich.current) return;
    if (data.enrichedAt) return;
    didEnrich.current = true;

    setEnriching(true);
    fetch(`/api/wellness/references/${data.id}/enrich`, { method: "POST" })
      .then(r => r.json())
      .then(resp => {
        if (resp.reference) {
          setData(resp.reference);
          onEnriched(resp.reference);
        }
      })
      .catch(() => {})
      .finally(() => setEnriching(false));
  }, [data.id, data.enrichedAt]);

  const isRich = !enriching && !!data.enrichedAt;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex" }}>
      <div style={{ flex: 1, background: "rgba(0,0,0,0.45)" }} onClick={onClose} />
      <div
        style={{
          width: Math.min(520, window.innerWidth),
          background: "#fff",
          overflowY: "auto",
          boxShadow: "-6px 0 32px rgba(0,0,0,0.18)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header band */}
        <div style={{ background: `linear-gradient(135deg, ${c.border} 0%, ${c.border}cc 100%)`, padding: "22px 22px 20px", color: "#fff", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 9, fontWeight: 800, background: "rgba(255,255,255,0.22)", padding: "3px 9px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                {c.label}
              </span>
              <h2 style={{ fontSize: 22, fontWeight: 900, margin: "10px 0 4px", fontFamily: "Georgia, serif", lineHeight: 1.2 }}>
                {data.name}
              </h2>
              {data.botanicalName && (
                <p style={{ fontSize: 12, opacity: 0.78, margin: 0, fontStyle: "italic" }}>{data.botanicalName}</p>
              )}
              <div style={{ marginTop: 10, display: "inline-block", fontSize: 10, fontWeight: 700, background: "rgba(255,255,255,0.18)", padding: "3px 10px", borderRadius: 20 }}>
                {data.category}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 12 }}
            >
              <X size={16} color="#fff" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "22px 22px 28px", flex: 1 }}>

          {/* AI enrichment loading state */}
          {enriching && <EnrichingShimmer color={c.border} />}

          {/* Rich AI content */}
          {isRich && (
            <>
              {/* AI badge */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20, padding: "7px 12px", background: `${c.bg}`, border: `1px solid ${c.border}33`, borderRadius: 8 }}>
                <Sparkles size={13} color={c.border} />
                <span style={{ fontSize: 11, color: c.text, fontWeight: 700 }}>AI-enriched botanical profile</span>
              </div>

              {/* Detailed description */}
              {data.detailedDescription && (
                <div style={{ marginBottom: 22 }}>
                  <SectionHeader icon={<BookOpen size={14} />} label="Overview" color={c.border} />
                  <p style={{ fontSize: 13, color: "#444", lineHeight: 1.8, margin: 0 }}>{data.detailedDescription}</p>
                </div>
              )}

              {/* Origin */}
              {data.origin && (
                <div style={{ marginBottom: 22 }}>
                  <SectionHeader icon={<MapPin size={14} />} label="Origin & Habitat" color={c.border} />
                  <p style={{ fontSize: 13, color: "#444", lineHeight: 1.8, margin: 0 }}>{data.origin}</p>
                </div>
              )}

              {/* Cultural background */}
              {data.culturalBackground && (
                <div style={{ marginBottom: 22 }}>
                  <SectionHeader icon={<Globe size={14} />} label="Cultural & Traditional History" color={c.border} />
                  <p style={{ fontSize: 13, color: "#444", lineHeight: 1.8, margin: 0 }}>{data.culturalBackground}</p>
                </div>
              )}

              {/* Key benefits */}
              {data.keyBenefits && (
                <div style={{ marginBottom: 22 }}>
                  <SectionHeader icon={<Leaf size={14} />} label="Key Benefits" color={c.border} />
                  <PillList
                    text={data.keyBenefits}
                    bg={c.bg}
                    textColor={c.text}
                    border={`${c.border}44`}
                  />
                </div>
              )}

              {/* Active compounds */}
              {data.activeCompounds && (
                <div style={{ marginBottom: 22 }}>
                  <SectionHeader icon={<FlaskConical size={14} />} label="Active Compounds & Nutrients" color={c.border} />
                  <PillList
                    text={data.activeCompounds}
                    bg="#f3f4f6"
                    textColor="#374151"
                    border="#d1d5db"
                  />
                </div>
              )}

              {/* How to use */}
              {data.howToUse && (
                <div style={{ marginBottom: 22 }}>
                  <SectionHeader icon={<HandHeart size={14} />} label="How to Use" color={c.border} />
                  <p style={{ fontSize: 13, color: "#444", lineHeight: 1.8, margin: 0 }}>{data.howToUse}</p>
                </div>
              )}
            </>
          )}

          {/* Fallback basic content (shown when not yet enriched and not loading) */}
          {!isRich && !enriching && (
            <div style={{ marginBottom: 22 }}>
              <SectionHeader icon={<BookOpen size={14} />} label="Educational Reference" color={c.border} />
              <p style={{ fontSize: 13, color: "#444", lineHeight: 1.8, margin: 0 }}>{data.description}</p>
            </div>
          )}

          {/* Common forms — always shown */}
          {data.commonForms && (
            <div style={{ marginBottom: 22 }}>
              <SectionHeader icon={<Pill size={14} />} label="Common Forms" color={c.border} />
              <PillList
                text={data.commonForms}
                bg="#f3f4f6"
                textColor="#374151"
                border="#d1d5db"
              />
            </div>
          )}

          {/* Cautions */}
          {data.cautions && (
            <div style={{ background: "#fffbea", border: "1.5px solid #C9A84C", borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                <AlertTriangle size={14} color={GOLD} />
                <span style={{ fontSize: 10, fontWeight: 900, color: "#7A6010", textTransform: "uppercase", letterSpacing: "0.07em" }}>Cautions &amp; Interactions</span>
              </div>
              <p style={{ fontSize: 13, color: "#5a4200", lineHeight: 1.75, margin: 0 }}>{data.cautions}</p>
            </div>
          )}

          {/* Source link */}
          {data.sourceUrl && (
            <div style={{ marginBottom: 20 }}>
              <a
                href={data.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: GREEN, fontWeight: 700, textDecoration: "none" }}
              >
                <ExternalLink size={13} /> View Reference Source
              </a>
            </div>
          )}

          {/* Disclaimer */}
          <div style={{ background: "#f8f8f8", border: "1px solid #e5e5e5", borderRadius: 10, padding: "12px 14px", fontSize: 11, color: "#888", lineHeight: 1.7 }}>
            <AlertTriangle size={12} style={{ display: "inline", marginRight: 5, color: GOLD }} />
            <strong style={{ color: "#666" }}>Educational use only.</strong> This profile is for informational purposes and is not a substitute for professional medical advice. Consult your healthcare provider before using any supplement.
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

  // After enrichment: patch the item in the list and in selected state
  const handleEnriched = useCallback((enriched: Reference) => {
    setItems(prev => prev.map(i => i.id === enriched.id ? { ...i, ...enriched } : i));
    setSelected(prev => prev?.id === enriched.id ? { ...prev, ...enriched } : prev);
  }, []);

  return (
    <>
      {selected && (
        <DetailDrawer
          item={selected}
          onClose={() => setSelected(null)}
          onEnriched={handleEnriched}
        />
      )}
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
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", padding: "14px 16px", background: "#f9f9f9", borderRadius: 10, border: "1px solid #e5e5e5", marginBottom: 12 }}>
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
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
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
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = c.border;
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 2px 12px ${c.border}22`;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = `${c.border}44`;
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: DARK, lineHeight: 1.3 }}>{item.name}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0, marginLeft: 6 }}>
                        {item.enrichedAt && <Sparkles size={10} color={c.border} />}
                        <span style={{ fontSize: 9, fontWeight: 800, background: c.bg, color: c.text, padding: "2px 7px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.05em" }}>{c.label}</span>
                      </div>
                    </div>
                    {item.botanicalName && <span style={{ fontSize: 11, color: "#888", fontStyle: "italic" }}>{item.botanicalName}</span>}
                    <span style={{ fontSize: 11, color: c.text, background: c.bg, padding: "2px 8px", borderRadius: 10, alignSelf: "flex-start" }}>{item.category}</span>
                    <p style={{ fontSize: 12, color: "#666", lineHeight: 1.5, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {item.description}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: c.border, fontWeight: 700, marginTop: 2 }}>
                      View full profile <ChevronRight size={12} />
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
