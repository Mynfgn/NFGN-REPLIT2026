import { ArrowRight, Leaf, Users, TrendingUp, Trophy, Globe, Zap, Star, ChevronRight, Play, Shield, Building2, Network, DollarSign, Heart, Sparkles, CalendarDays, ShoppingCart, Flame, BookOpen } from "lucide-react";

const GOLD = "#C9A84C";
const GOLD_LIGHT = "rgba(201,168,76,0.12)";
const GOLD_MED = "rgba(201,168,76,0.25)";
const GREEN = "#2D6A4F";
const DARK = "#0a0a0a";
const DARK2 = "#111111";
const DARK3 = "#1a1a1a";

export function Dark() {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: DARK, minHeight: "100vh" }}>

      {/* NAV */}
      <nav style={{ background: DARK, borderBottom: "1px solid rgba(201,168,76,0.15)", padding: "0 40px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <span style={{ color: GOLD, fontFamily: "Georgia, serif", fontWeight: 900, fontSize: 22, letterSpacing: "0.05em" }}>NFGN</span>
        <div style={{ display: "flex", gap: 32, fontSize: 13, fontWeight: 500 }}>
          {["Shop", "Book-A-Pro", "Join NFGN", "About"].map(l => (
            <span key={l} style={{ color: "rgba(255,255,255,0.65)", cursor: "pointer" }}>{l}</span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, cursor: "pointer" }}>Sign In</span>
          <button style={{ background: GOLD, color: DARK, padding: "8px 20px", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer" }}>Join Now</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background: DARK, minHeight: "90vh", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 40px" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />
        <div style={{ position: "absolute", top: 80, left: "25%", width: 380, height: 380, borderRadius: "50%", background: `radial-gradient(circle, ${GOLD}, transparent 70%)`, filter: "blur(60px)", opacity: 0.1 }} />
        <div style={{ position: "absolute", bottom: 80, right: "25%", width: 260, height: 260, borderRadius: "50%", background: `radial-gradient(circle, ${GREEN}, transparent 70%)`, filter: "blur(80px)", opacity: 0.1 }} />

        <div style={{ position: "relative", zIndex: 10, textAlign: "center", maxWidth: 800 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 24, padding: "8px 16px", borderRadius: 99, background: GOLD_LIGHT, border: `1px solid ${GOLD_MED}` }}>
            <span style={{ height: 6, width: 6, borderRadius: "50%", background: GOLD, display: "inline-block" }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD }}>Community · Wellness · Wealth · Sports</span>
          </div>

          <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 900, fontSize: 80, lineHeight: 1, color: "#fff", margin: "0 0 24px" }}>
            More Than<br />
            <em style={{ color: GOLD }}>A Network.</em><br />
            <span style={{ color: "rgba(255,255,255,0.85)" }}>A Movement.</span>
          </h1>

          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.55)", maxWidth: 520, margin: "0 auto 48px", lineHeight: 1.7 }}>
            New Face Global Network unites naturopathic wellness, professional booking, business opportunity, and sports — powered by the industry's most innovative money circulation system.
          </p>

          <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 64 }}>
            <button style={{ background: GOLD, color: DARK, padding: "16px 32px", fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              Join The Network <ArrowRight size={18} />
            </button>
            <button style={{ background: "transparent", color: "rgba(255,255,255,0.8)", padding: "16px 32px", fontSize: 15, fontWeight: 600, border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              <Play size={16} style={{ color: GOLD }} /> Shop Collection
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", border: `1px solid rgba(201,168,76,0.2)`, background: "rgba(255,255,255,0.02)", maxWidth: 600, margin: "0 auto" }}>
            {[{ num: "10K+", label: "Active Members" }, { num: "$2M+", label: "Circulated Annually" }, { num: "9", label: "Business Pillars" }].map((s, i) => (
              <div key={s.label} style={{ textAlign: "center", padding: "24px 16px", borderRight: i < 2 ? "1px solid rgba(201,168,76,0.15)" : "none" }}>
                <div style={{ fontSize: 28, fontFamily: "Georgia, serif", fontWeight: 900, color: GOLD, marginBottom: 4 }}>{s.num}</div>
                <div style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SHOP PREVIEW */}
      <section style={{ background: DARK2, padding: "80px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 40 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: GOLD }}>NFGN Marketplace</span>
              <h2 style={{ fontFamily: "Georgia, serif", fontWeight: 900, fontSize: 40, color: "#fff", margin: "8px 0 0" }}>Our Products</h2>
            </div>
            <span style={{ fontSize: 13, color: GOLD, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>View All <ChevronRight size={16} /></span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {[
              { name: "Herbal Products", icon: <Leaf size={24} />, accent: GREEN, price: "From $28", tag: "BESTSELLER" },
              { name: "Soaps & Lotions", icon: <Sparkles size={24} />, accent: GOLD, price: "From $14", tag: "HANDMADE" },
              { name: "Aromatherapy", icon: <Flame size={24} />, accent: "#E07B54", price: "From $18", tag: "WELLNESS" },
              { name: "Books & Media", icon: <BookOpen size={24} />, accent: "#7B8FD4", price: "From $22", tag: "EDUCATION" },
            ].map((cat) => (
              <div key={cat.name} style={{ background: DARK3, border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden", cursor: "pointer" }}>
                <div style={{ height: 160, background: `linear-gradient(135deg, ${cat.accent}20, ${cat.accent}08)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ color: cat.accent, opacity: 0.8 }}>{cat.icon}</div>
                </div>
                <div style={{ padding: "16px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: cat.accent, marginBottom: 6 }}>{cat.tag}</div>
                  <div style={{ fontWeight: 700, color: "#fff", marginBottom: 4, fontSize: 14 }}>{cat.name}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{cat.price}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PILLARS PREVIEW */}
      <section style={{ background: DARK2, padding: "0 40px 80px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: GOLD }}>What We Do</span>
            <h2 style={{ fontFamily: "Georgia, serif", fontWeight: 900, fontSize: 44, color: "#fff", margin: "12px 0 0" }}>Nine Pillars. One Powerful Network.</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
            {[
              { icon: <Leaf size={24} />, n: "01", title: "Naturopathic Products", accent: GOLD },
              { icon: <Users size={24} />, n: "02", title: "Book-A-Professional", accent: GREEN },
              { icon: <TrendingUp size={24} />, n: "03", title: "Business Opportunity", accent: GOLD },
              { icon: <Trophy size={24} />, n: "04", title: "NFGN Sports", accent: GREEN },
              { icon: <Sparkles size={24} />, n: "05", title: "Handmade Goods", accent: GOLD },
              { icon: <Globe size={24} />, n: "06", title: "Travel & Events", accent: GREEN },
            ].map((p, i) => (
              <div key={p.n} style={{ padding: "32px", border: "1px solid rgba(255,255,255,0.06)", background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "rgba(255,255,255,0.02)", cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                  <div style={{ height: 48, width: 48, display: "flex", alignItems: "center", justifyContent: "center", background: `${p.accent}15`, color: p.accent, border: `1px solid ${p.accent}30` }}>
                    {p.icon}
                  </div>
                  <span style={{ fontFamily: "Georgia, serif", fontWeight: 900, fontSize: 44, color: "rgba(255,255,255,0.04)" }}>{p.n}</span>
                </div>
                <div style={{ fontWeight: 700, color: "#fff", fontSize: 16, marginBottom: 8 }}>{p.title}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: p.accent, fontSize: 13, fontWeight: 600 }}>Learn More <ChevronRight size={14} /></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section style={{ background: DARK, padding: "80px 40px", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          {[...Array(5)].map((_, i) => <Star key={i} size={20} style={{ color: GOLD }} fill={GOLD} />)}
        </div>
        <h2 style={{ fontFamily: "Georgia, serif", fontWeight: 900, fontSize: 52, color: "#fff", margin: "0 0 16px" }}>
          Ready to join the<br /><em style={{ color: GOLD }}>New Face Movement?</em>
        </h2>
        <p style={{ fontSize: 18, color: "rgba(255,255,255,0.5)", marginBottom: 40 }}>Start your journey. Build your network. Earn your future.</p>
        <button style={{ background: GOLD, color: DARK, padding: "18px 48px", fontSize: 16, fontWeight: 700, border: "none", cursor: "pointer" }}>Join NFGN Today</button>
      </section>
    </div>
  );
}
