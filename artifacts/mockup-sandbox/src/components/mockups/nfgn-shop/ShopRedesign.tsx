import { useState } from "react";
import {
  ShoppingCart, Star, BadgeCheck, Leaf, Sparkles, Flame, BookOpen,
  ChevronRight, Users, TrendingUp, Shield, Gift, Zap, ArrowRight,
  Package, Check,
} from "lucide-react";

const GOLD = "#C9A84C";
const GREEN = "#2D6A4F";
const GREEN_DARK = "#1e4d38";
const GREEN_LIGHT = "#52b788";

const PRO_PACKAGES = [
  {
    id: 1, name: "NFGN Starter Pack", price: 197.94, originalPrice: 249.00,
    badge: "Most Popular", badgeColor: GOLD,
    perks: ["Full Pro Membership", "Commission Eligible", "Network Access", "Training Materials"],
    highlight: true,
  },
  {
    id: 2, name: "NFGN Builder Pack", price: 395.87, originalPrice: 499.00,
    badge: "Best Value", badgeColor: GREEN_LIGHT,
    perks: ["Everything in Starter", "2x Product Bundle", "Priority Support", "Marketing Kit"],
    highlight: false,
  },
  {
    id: 3, name: "NFGN Elite Pack", price: 597.00, originalPrice: 749.00,
    badge: "Elite", badgeColor: "#c77dff",
    perks: ["Everything in Builder", "3x Product Bundle", "1-on-1 Coaching", "VIP Events Access"],
    highlight: false,
  },
];

const SPECIALS = [
  { label: "Summer Cleanse Kit", off: "20% OFF", tag: "Limited Time", icon: <Leaf className="h-5 w-5" /> },
  { label: "Soap & Lotion Bundle", off: "Buy 2 Get 1", tag: "This Week Only", icon: <Sparkles className="h-5 w-5" /> },
  { label: "Aromatherapy Set", off: "15% OFF", tag: "New Arrivals", icon: <Flame className="h-5 w-5" /> },
];

const CATEGORIES = [
  {
    key: "herbal", label: "Herbal Products", icon: <Leaf className="h-5 w-5" />, accentColor: GREEN,
    description: "Naturopathic herbal formulations — cleanses, gut health & holistic wellness.",
    products: [
      { id: 10, name: "NFGN Total Body Cleanse", price: 49.99, compare: 64.99, sale: true, tag: "Best Seller" },
      { id: 11, name: "Gut Restore Formula", price: 44.95, compare: null, sale: false, tag: null },
      { id: 12, name: "Appetite Support Plus", price: 39.99, compare: 49.99, sale: true, tag: "Sale" },
      { id: 13, name: "Herbal Immune Boost", price: 54.99, compare: null, sale: false, tag: "New" },
    ],
  },
  {
    key: "soaps", label: "Soaps & Lotions", icon: <Sparkles className="h-5 w-5" />, accentColor: "#8B5CF6",
    description: "Handmade natural soaps, body lotions, and nourishing skin-care oils.",
    products: [
      { id: 20, name: "Shea Butter Luxury Soap", price: 12.99, compare: null, sale: false, tag: null },
      { id: 21, name: "Lavender Body Lotion", price: 24.99, compare: 29.99, sale: true, tag: "Sale" },
      { id: 22, name: "Coconut Oil Body Scrub", price: 18.95, compare: null, sale: false, tag: "New" },
      { id: 23, name: "Tea Tree Cleansing Bar", price: 9.99, compare: null, sale: false, tag: null },
    ],
  },
  {
    key: "candles", label: "Aromatherapy Candles", icon: <Flame className="h-5 w-5" />, accentColor: "#E07B54",
    description: "Therapeutic aromatics and hand-poured candles for calm and healing spaces.",
    products: [
      { id: 30, name: "Eucalyptus Calm Candle", price: 22.99, compare: null, sale: false, tag: "Best Seller" },
      { id: 31, name: "Sage & Cedar Set", price: 34.99, compare: 44.99, sale: true, tag: "Sale" },
      { id: 32, name: "Stress Relief Blend", price: 19.95, compare: null, sale: false, tag: null },
      { id: 33, name: "Focus & Clarity Candle", price: 24.99, compare: null, sale: false, tag: "New" },
    ],
  },
  {
    key: "books", label: "Books & Education", icon: <BookOpen className="h-5 w-5" />, accentColor: "#3B82F6",
    description: "Naturopathic education, wellness guides, and professional service packages.",
    products: [
      { id: 40, name: "Naturopathic Living Guide", price: 29.99, compare: null, sale: false, tag: null },
      { id: 41, name: "NFGN Business Blueprint", price: 49.99, compare: 69.99, sale: true, tag: "Sale" },
      { id: 42, name: "Holistic Health Cookbook", price: 24.95, compare: null, sale: false, tag: "New" },
      { id: 43, name: "Wellness Starter Course", price: 79.99, compare: 99.99, sale: true, tag: "Hot" },
    ],
  },
];

function ProductCard({ product, accent }: { product: typeof CATEGORIES[0]["products"][0]; accent: string }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? "#f8f9fa" : "#fff",
        border: `1.5px solid ${hover ? accent : "#e5e7eb"}`,
        borderRadius: 10,
        overflow: "hidden",
        boxShadow: hover ? `0 8px 28px rgba(0,0,0,0.10)` : "0 2px 8px rgba(0,0,0,0.05)",
        transition: "all 0.22s ease",
        cursor: "pointer",
        transform: hover ? "translateY(-3px)" : "none",
        display: "flex", flexDirection: "column",
      }}
    >
      {/* Image area */}
      <div style={{
        background: `linear-gradient(135deg, ${accent}15, ${accent}08)`,
        height: 130, display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative",
      }}>
        <span style={{ fontSize: 44, opacity: 0.2, color: accent, fontWeight: 900, fontFamily: "serif" }}>NFGN</span>
        {product.tag && (
          <span style={{
            position: "absolute", top: 10, left: 10,
            background: product.sale ? GREEN : accent,
            color: "#fff", fontSize: 10, fontWeight: 800,
            padding: "3px 8px", borderRadius: 99, letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}>{product.tag}</span>
        )}
      </div>
      {/* Info */}
      <div style={{ padding: "14px 14px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: accent, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Wellness
        </p>
        <h4 style={{ fontSize: 14, fontWeight: 700, color: "#111", lineHeight: 1.3, flex: 1 }}>
          {product.name}
        </h4>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
          <span style={{ fontSize: 17, fontWeight: 900, color: "#111" }}>${product.price.toFixed(2)}</span>
          {product.compare && (
            <span style={{ fontSize: 13, color: "#9ca3af", textDecoration: "line-through" }}>${product.compare.toFixed(2)}</span>
          )}
        </div>
        <button style={{
          marginTop: 6, width: "100%", padding: "9px 0",
          background: hover ? accent : "transparent",
          color: hover ? "#fff" : accent,
          border: `1.5px solid ${accent}`,
          borderRadius: 7, fontWeight: 700, fontSize: 13,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          transition: "all 0.18s ease",
        }}>
          <ShoppingCart size={14} /> Add to Cart
        </button>
      </div>
    </div>
  );
}

function TickerBar() {
  const items = ["FREE SHIPPING on Pro Packages", "LIMITED TIME: Bundle & Save 20%", "NEW: Holistic Health Cookbook just arrived", "Join 500+ Pro Members nationwide"];
  return (
    <div style={{ background: "#C9A84C", overflow: "hidden", padding: "16px 0" }}>
      <div style={{
        display: "flex", gap: 72, whiteSpace: "nowrap",
        animation: "ticker 24s linear infinite",
      }}>
        {[...items, ...items].map((item, i) => (
          <span key={i} style={{ color: "#fff", fontSize: 15, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 12, textShadow: "0 1px 3px rgba(0,0,0,0.25)" }}>
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>✦</span> {item}
          </span>
        ))}
      </div>
      <style>{`@keyframes ticker { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
    </div>
  );
}

export function ShopRedesign() {
  return (
    <div style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", minHeight: "100vh", background: "#fff" }}>

      {/* ─── ZONE 1: BLACK — Hero ───────────────────────── */}
      <div style={{ background: "#000", borderBottom: "2px solid #1a1a1a" }}>
        {/* Grid texture overlay */}
        <div style={{
          backgroundImage: `linear-gradient(rgba(201,168,76,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.05) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "64px 32px 72px", textAlign: "center" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 20,
              background: "rgba(201,168,76,0.10)", border: `1px solid rgba(201,168,76,0.25)`,
              padding: "7px 18px", borderRadius: 99,
            }}>
              <Sparkles size={13} color={GOLD} />
              <span style={{ color: GOLD, fontSize: 12, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase" }}>
                NFGN Marketplace
              </span>
            </div>
            <h1 style={{
              color: "#fff", fontSize: 60, fontWeight: 900, lineHeight: 1.1, margin: "0 0 16px",
              fontFamily: "'Playfair Display', serif",
            }}>
              Wellness. <span style={{ color: GOLD }}>Elevated.</span>
            </h1>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 18, maxWidth: 500, margin: "0 auto 32px" }}>
              Premium naturopathic products crafted with care — for your body, mind, and business.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <button style={{
                background: GOLD, color: "#000", padding: "13px 32px",
                borderRadius: 8, fontWeight: 800, fontSize: 15, border: "none",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
              }}>
                <ShoppingCart size={17} /> Shop Now
              </button>
              <button style={{
                background: "transparent", color: "#fff", padding: "13px 28px",
                borderRadius: 8, fontWeight: 700, fontSize: 15,
                border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                Become a Member <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── ZONE 1: BLACK — Pro Registration Packages ─── */}
      <div style={{ background: "#0a0a0a", padding: "64px 0 80px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
          {/* Section header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{ background: GOLD, borderRadius: 8, padding: 10 }}>
              <Package size={22} color="#000" />
            </div>
            <div>
              <p style={{ color: GOLD, fontSize: 11, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", margin: 0 }}>
                Members Only
              </p>
              <h2 style={{ color: "#fff", fontSize: 30, fontWeight: 900, margin: 0, fontFamily: "serif" }}>
                Pro Registration Packages
              </h2>
            </div>
          </div>
          <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: 40, fontSize: 15 }}>
            Start your NFGN journey — choose the package that fits your goals.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22 }}>
            {PRO_PACKAGES.map((pkg) => (
              <ProPackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        </div>
      </div>

      {/* ─── ZONE 3: GREEN — Ticker / Promotions ─────────── */}
      <TickerBar />

      {/* ─── ZONE 3: GREEN — Specials Banner ─────────────── */}
      <div style={{ background: GREEN, padding: "56px 0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
            <Zap size={22} color={GOLD} />
            <h2 style={{ color: "#fff", fontSize: 28, fontWeight: 900, margin: 0, fontFamily: "serif" }}>
              Current Specials & Sales
            </h2>
            <span style={{
              background: GOLD, color: "#000", fontSize: 11, fontWeight: 800,
              padding: "4px 12px", borderRadius: 99, letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}>Limited Offers</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
            {SPECIALS.map((s, i) => (
              <SpecialCard key={i} special={s} />
            ))}
          </div>
        </div>
      </div>

      {/* ─── ZONE 2: WHITE — Products ─────────────────────── */}
      <div style={{ background: "#fff", padding: "72px 0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
          {/* Section intro */}
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <p style={{ color: GREEN, fontSize: 12, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>
              Our Collection
            </p>
            <h2 style={{ color: "#111", fontSize: 38, fontWeight: 900, margin: "0 0 12px", fontFamily: "serif" }}>
              All Products
            </h2>
            <p style={{ color: "#6b7280", fontSize: 16, maxWidth: 480, margin: "0 auto" }}>
              Handcrafted naturopathic formulations for every aspect of your wellness journey.
            </p>
            <div style={{ width: 60, height: 3, background: GOLD, borderRadius: 99, margin: "20px auto 0" }} />
          </div>

          {/* Category sections */}
          {CATEGORIES.map((cat) => (
            <CategoryBlock key={cat.key} category={cat} />
          ))}
        </div>
      </div>

      {/* ─── ZONE 3: GREEN — Become a Member CTA ─────────── */}
      <div style={{
        background: `linear-gradient(135deg, ${GREEN} 0%, ${GREEN_DARK} 100%)`,
        padding: "72px 0", position: "relative", overflow: "hidden",
      }}>
        {/* Decorative circles */}
        <div style={{
          position: "absolute", top: -80, right: -80, width: 300, height: 300,
          borderRadius: "50%", background: "rgba(201,168,76,0.08)",
        }} />
        <div style={{
          position: "absolute", bottom: -60, left: -60, width: 220, height: 220,
          borderRadius: "50%", background: "rgba(255,255,255,0.04)",
        }} />
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 32px", textAlign: "center", position: "relative" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 20,
            background: "rgba(201,168,76,0.15)", border: `1px solid rgba(201,168,76,0.3)`,
            padding: "7px 18px", borderRadius: 99,
          }}>
            <Users size={13} color={GOLD} />
            <span style={{ color: GOLD, fontSize: 11, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase" }}>
              Join the Network
            </span>
          </div>
          <h2 style={{ color: "#fff", fontSize: 42, fontWeight: 900, margin: "0 0 16px", fontFamily: "serif", lineHeight: 1.2 }}>
            Become an NFGN<br />Pro Member Today
          </h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 17, marginBottom: 32, lineHeight: 1.6 }}>
            Earn commissions, access exclusive products, build your network, and transform lives — including your own.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginBottom: 32 }}>
            {["Commission Eligible", "Network Access", "Pro Pricing", "Training Included"].map((b) => (
              <div key={b} style={{ display: "flex", alignItems: "center", gap: 6, color: "#fff", fontSize: 14 }}>
                <Check size={16} color={GOLD} /> {b}
              </div>
            ))}
          </div>
          <button style={{
            background: GOLD, color: "#000", padding: "16px 40px",
            borderRadius: 10, fontWeight: 800, fontSize: 16, border: "none",
            cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 10,
            boxShadow: "0 8px 30px rgba(201,168,76,0.35)",
          }}>
            <Shield size={19} /> Get Started — Join Now
          </button>
        </div>
      </div>

      {/* ─── ZONE 3: GREEN — Trust / Stats Strip ─────────── */}
      <div style={{ background: GREEN_DARK, padding: "28px 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, textAlign: "center" }}>
          {[
            { icon: <Users size={20} />, stat: "500+", label: "Pro Members" },
            { icon: <TrendingUp size={20} />, stat: "$2M+", label: "Paid in Commissions" },
            { icon: <Star size={20} />, stat: "4.9★", label: "Customer Rating" },
            { icon: <Gift size={20} />, stat: "100+", label: "Products Available" },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ color: GOLD }}>{s.icon}</div>
              <div style={{ color: "#fff", fontSize: 22, fontWeight: 900 }}>{s.stat}</div>
              <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

function ProPackageCard({ pkg }: { pkg: typeof PRO_PACKAGES[0] }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? "#111" : "#0d0d0d",
        border: `1.5px solid ${hover ? GOLD : "rgba(201,168,76,0.25)"}`,
        borderRadius: 12,
        padding: "28px 24px 32px",
        transition: "all 0.22s ease",
        transform: hover ? "translateY(-4px)" : "none",
        boxShadow: hover ? `0 16px 40px rgba(201,168,76,0.12)` : "none",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top corner glow */}
      <div style={{
        position: "absolute", top: 0, right: 0, width: 120, height: 120,
        background: `radial-gradient(circle, ${GOLD}12, transparent 70%)`,
        borderRadius: "0 12px 0 100%",
      }} />

      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 18,
        background: `${pkg.badgeColor}18`, border: `1px solid ${pkg.badgeColor}40`,
        padding: "4px 12px", borderRadius: 99,
      }}>
        <BadgeCheck size={12} color={pkg.badgeColor} />
        <span style={{ color: pkg.badgeColor, fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {pkg.badge}
        </span>
      </div>

      <h3 style={{ color: "#fff", fontSize: 20, fontWeight: 800, margin: "0 0 6px", lineHeight: 1.2 }}>
        {pkg.name}
      </h3>

      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
        <span style={{ color: GOLD, fontSize: 32, fontWeight: 900 }}>${pkg.price.toFixed(2)}</span>
        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, textDecoration: "line-through" }}>
          ${pkg.originalPrice.toFixed(2)}
        </span>
      </div>
      <p style={{ color: GREEN_LIGHT, fontSize: 12, fontWeight: 700, marginBottom: 22 }}>
        You save ${(pkg.originalPrice - pkg.price).toFixed(2)}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 26 }}>
        {pkg.perks.map((perk) => (
          <div key={perk} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 18, height: 18, borderRadius: "50%",
              background: "rgba(201,168,76,0.12)", display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Check size={11} color={GOLD} />
            </div>
            <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>{perk}</span>
          </div>
        ))}
      </div>

      <button style={{
        width: "100%", padding: "12px 0",
        background: hover ? GOLD : "transparent",
        color: hover ? "#000" : GOLD,
        border: `1.5px solid ${GOLD}`,
        borderRadius: 8, fontWeight: 800, fontSize: 14,
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        transition: "all 0.2s ease",
      }}>
        <ShoppingCart size={15} /> Add to Cart
      </button>
    </div>
  );
}

function SpecialCard({ special }: { special: typeof SPECIALS[0] }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.07)",
        border: `1.5px solid ${hover ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.12)"}`,
        borderRadius: 12,
        padding: "22px 20px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        transform: hover ? "scale(1.02)" : "none",
        display: "flex", alignItems: "center", gap: 16,
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 10,
        background: "rgba(201,168,76,0.15)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: GOLD, flexShrink: 0,
      }}>
        {special.icon}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 3px" }}>
          {special.tag}
        </p>
        <h4 style={{ color: "#fff", fontSize: 15, fontWeight: 800, margin: "0 0 4px" }}>{special.label}</h4>
        <span style={{
          background: GOLD, color: "#000", fontSize: 11, fontWeight: 900,
          padding: "3px 10px", borderRadius: 99,
        }}>{special.off}</span>
      </div>
      <ChevronRight size={18} color="rgba(255,255,255,0.4)" />
    </div>
  );
}

function CategoryBlock({ category }: { category: typeof CATEGORIES[0] }) {
  return (
    <section style={{ marginBottom: 60 }}>
      {/* Category header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 14, marginBottom: 24,
        paddingBottom: 18, borderBottom: `2px solid #f3f4f6`,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: `${category.accentColor}12`,
          border: `1.5px solid ${category.accentColor}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: category.accentColor,
        }}>
          {category.icon}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ color: "#111", fontSize: 22, fontWeight: 900, margin: 0, fontFamily: "serif" }}>{category.label}</h3>
          <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>{category.description}</p>
        </div>
        <span style={{
          background: `${category.accentColor}10`,
          border: `1px solid ${category.accentColor}25`,
          color: category.accentColor,
          fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 99,
        }}>
          {category.products.length} items
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {category.products.map((p) => (
          <ProductCard key={p.id} product={p} accent={category.accentColor} />
        ))}
      </div>
    </section>
  );
}
