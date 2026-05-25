import { useListProducts, useAddToCart } from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearch } from "wouter";
import { resolveImageSrc } from "@/lib/image";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShoppingCart, Loader2, Leaf, Sparkles, Flame, BookOpen,
  ChevronRight, Package, BadgeCheck, Check, ArrowRight,
  Users, TrendingUp, Star, Gift, Shield, Zap, ArrowLeft,
  Trophy, Ticket, Award, Utensils, Dumbbell, Heart, Gem,
  HandHeart, Coins, Church, Flower2, Sun, Snowflake, PartyPopper,
  Lock, Plane, Stethoscope, Brain, Pill, Tag, Crown, Gauge,
  AlertTriangle, Link2, ALargeSmall,
} from "lucide-react";
import { useCartStore } from "@/hooks/use-cart-store";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { customFetch } from "@/lib/custom-fetch";
import { TickerBar } from "@/components/ticker-bar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const GOLD = "#C9A84C";
const GOLD_MUTED = "rgba(201,168,76,0.75)";
const WHITE = "#ffffff";
const GREY_50 = "#f9f9f9";
const GREY_100 = "#f0f0f0";
const GREY_200 = "#e2e2e2";
const GREY_400 = "#a0a0a0";
const GREY_600 = "#6b7280";
const GREY_800 = "#2a2a2a";
const GREY_900 = "#1a1a1a";

type Product = {
  id: number;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number | null;
  image?: string | null;
  images?: string[] | null;
  categoryName?: string | null;
  isProPackage?: boolean | null;
  isSports?: boolean | null;
  isNonProfit?: boolean | null;
  isWeddingRegistry?: boolean | null;
  weddingRegistryCategory?: string | null;
  isHolidayRegistry?: boolean | null;
  holidayCategory?: string | null;
  isProExclusive?: boolean | null;
  proExclusiveCategory?: string | null;
  isDonation?: boolean | null;
  isChurchDonation?: boolean | null;
  donationMinAmount?: number | null;
  donationRecipientType?: string | null;
  donationRecipientName?: string | null;
  churchName?: string | null;
  giftCharityPercent?: string | number | null;
  stock?: number | null;
  description?: string | null;
};

const CATEGORY_GROUPS = [
  {
    key: "herbal",
    label: "Herbal Products",
    icon: <Leaf className="h-5 w-5" />,
    accentColor: GOLD,
    description: "Naturopathic herbal formulations — cleanses, gut health, appetite support & holistic wellness.",
    slugs: ["cleanses", "appetite-support", "herbal-wellness"],
  },
  {
    key: "soaps",
    label: "Soaps & Lotions",
    icon: <Sparkles className="h-5 w-5" />,
    accentColor: "#9ca3af",
    description: "Handmade natural soaps, body lotions, and nourishing skin-care oils crafted with love.",
    slugs: ["soaps-body-care", "lotions-oils"],
  },
  {
    key: "candles",
    label: "Aromatherapy Candles",
    icon: <Flame className="h-5 w-5" />,
    accentColor: "#a0a0a0",
    description: "Therapeutic aromatics and hand-poured candles to create calm, focus, and healing spaces.",
    slugs: ["candles-aromatics"],
  },
  {
    key: "books",
    label: "Books & Education",
    icon: <BookOpen className="h-5 w-5" />,
    accentColor: "#6b7280",
    description: "Naturopathic education, wellness books, guides, and professional service packages.",
    slugs: ["books-education", "services"],
  },
  {
    key: "sports",
    label: "NFGN Sports",
    icon: <Trophy className="h-5 w-5" />,
    accentColor: "#C9A84C",
    description: "Tournaments, entry fees, coaching, skills training, concessions, and more — all powered by NFGN.",
    slugs: [],
  },
];

type ProPackage = {
  id: number;
  name: string;
  price: number;
  originalPrice: number;
  badge: string;
  badgeColor: string;
  perks: string[];
  sortOrder: number;
  productId: number | null;
  productName: string | null;
  productSlug: string | null;
};

function categorySlugFromName(name?: string | null): string {
  if (!name) return "";
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const ADMIN_ROLES = new Set(["super_admin", "admin", "store_admin"]);

function parseJwtRole(token: string | null): string | null {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return decoded.role ?? null;
  } catch {
    return null;
  }
}

const TICKER_SPEED_LABELS: Record<string, string> = { slow: "Slow", medium: "Medium", fast: "Fast" };
const TICKER_FONT_SIZE_LABELS: Record<string, string> = { small: "Small", medium: "Medium", large: "Large" };

function ShopTickerBar() {
  const { token } = useAuth();
  const { data: banners } = useQuery<{ id: number; message: string }[]>({
    queryKey: ["/api/banners"],
    queryFn: () => customFetch("/api/banners").then(r => r.json()),
    staleTime: 60000,
  });
  const { data: settings } = useQuery<{ tickerSpeed?: string; tickerFontSize?: string; tickerFontWeight?: string; tickerPlaceholder?: string }>({
    queryKey: ["/api/settings"],
    queryFn: () => customFetch("/api/settings").then(r => r.json()),
    staleTime: 60000,
  });

  if (!banners) return null;

  const placeholder = settings?.tickerPlaceholder?.trim() || "Check back soon for our latest news and promotions!";
  const messages = banners.length > 0
    ? banners.map(b => b.message)
    : [placeholder];

  const speed = banners.length > 0 ? settings?.tickerSpeed : "slow";
  const fontSizePx: Record<string, number> = { small: 14, medium: 20, large: 28 };
  const fontSize = fontSizePx[settings?.tickerFontSize ?? "medium"] ?? 20;
  const fontWeight = (settings?.tickerFontWeight ?? "bold") as "bold" | "regular";
  const role = parseJwtRole(token);
  const isAdmin = role ? ADMIN_ROLES.has(role) : false;
  const speedLabel = TICKER_SPEED_LABELS[speed ?? "medium"] ?? speed;
  const fontSizeLabel = TICKER_FONT_SIZE_LABELS[settings?.tickerFontSize ?? "medium"] ?? "Medium";

  const chipStyle: React.CSSProperties = {
    background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(4px)",
    borderRadius: 6,
    padding: "3px 9px",
    fontSize: 11,
    fontWeight: 700,
    color: GOLD,
    letterSpacing: "0.05em",
    display: "flex",
    alignItems: "center",
    gap: 5,
    border: "1px solid rgba(201,168,76,0.45)",
    textDecoration: "none",
  };

  return (
    <div className="group" style={{ position: "relative" }}>
      <TickerBar messages={messages} speed={speed} fontSize={fontSize} fontWeight={fontWeight} />
      {isAdmin && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            transform: "translateY(-50%)",
            right: 12,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <a
            href="/admin/banner-messages"
            title={`Ticker font size: ${fontSizeLabel} — click to adjust in Banner Messages`}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={chipStyle}
          >
            <ALargeSmall style={{ width: 11, height: 11 }} />
            {fontSizeLabel}
          </a>
          <a
            href="/admin/banner-messages"
            title={`Ticker speed: ${speedLabel} — click to adjust in Banner Messages`}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={chipStyle}
          >
            <Gauge style={{ width: 11, height: 11 }} />
            {speedLabel}
          </a>
        </div>
      )}
    </div>
  );
}

function ProductCard({
  product,
  accentColor,
  onAdd,
  adding,
}: {
  product: Product;
  accentColor: string;
  onAdd: (e: React.MouseEvent, id: number) => void;
  adding: boolean;
}) {
  const [hover, setHover] = useState(false);
  const img = resolveImageSrc(product.image);
  const outOfStock = product.stock === 0;
  const onSale = product.comparePrice && product.comparePrice > product.price;

  return (
    <Link href={`/product/${product.slug}`}>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          background: hover ? GREY_50 : WHITE,
          border: `1.5px solid ${hover ? accentColor : GREY_200}`,
          borderRadius: 10,
          overflow: "hidden",
          boxShadow: hover ? `0 8px 28px rgba(0,0,0,0.10)` : "0 2px 6px rgba(0,0,0,0.04)",
          transition: "all 0.22s ease",
          cursor: "pointer",
          transform: hover ? "translateY(-3px)" : "none",
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        {/* Image */}
        <div
          style={{
            background: img ? "#f3f4f6" : `linear-gradient(135deg, ${accentColor}15, ${accentColor}08)`,
            height: 150,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {img ? (
            <img
              src={img}
              alt={product.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transition: "transform 0.5s ease",
                transform: hover ? "scale(1.05)" : "scale(1)",
              }}
            />
          ) : (
            <span style={{ fontSize: 36, opacity: 0.15, color: accentColor, fontWeight: 900, fontFamily: "serif" }}>
              NFGN
            </span>
          )}
          {onSale && !outOfStock && (
            <span
              style={{
                position: "absolute",
                top: 10,
                left: 10,
                background: GOLD,
                color: "#000",
                fontSize: 10,
                fontWeight: 900,
                padding: "3px 8px",
                borderRadius: 99,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              SALE
            </span>
          )}
          {outOfStock && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.55)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ color: "rgba(255,255,255,0.8)", fontWeight: 600, fontSize: 13 }}>Out of Stock</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: "14px 14px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: accentColor, letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>
            {product.categoryName || "Wellness"}
          </p>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.3, flex: 1, margin: 0 }}>
            {product.name}
          </h4>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: 17, fontWeight: 900, color: "#1a1a1a" }}>${product.price.toFixed(2)}</span>
            {onSale && (
              <span style={{ fontSize: 13, color: GREY_400, textDecoration: "line-through" }}>
                ${product.comparePrice!.toFixed(2)}
              </span>
            )}
          </div>
          <button
            disabled={outOfStock || adding}
            onClick={(e) => onAdd(e, product.id)}
            style={{
              marginTop: 8,
              width: "100%",
              padding: "9px 0",
              background: hover && !outOfStock ? accentColor : "transparent",
              color: outOfStock ? GREY_400 : hover ? "#fff" : accentColor,
              border: `1.5px solid ${outOfStock ? GREY_200 : accentColor}`,
              borderRadius: 7,
              fontWeight: 700,
              fontSize: 13,
              cursor: outOfStock ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              transition: "all 0.18s ease",
            }}
          >
            {adding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShoppingCart size={14} />
            )}
            {outOfStock ? "Out of Stock" : "Add to Cart"}
          </button>
        </div>
      </div>
    </Link>
  );
}

function ProPackageCard({
  pkg,
  matchedProduct,
  resolutionMethod,
  onAdd,
  adding,
  isAdmin,
  onFixLink,
}: {
  pkg: ProPackage;
  matchedProduct: Product | null;
  resolutionMethod: "direct" | "fuzzy" | null;
  onAdd: (e: React.MouseEvent, id: number) => void;
  adding: boolean;
  isAdmin: boolean;
  onFixLink?: () => void;
}) {
  const [hover, setHover] = useState(false);
  const savings = pkg.originalPrice - pkg.price;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? GREY_900 : "#111",
        border: `1.5px solid ${hover ? GOLD : GREY_800}`,
        borderRadius: 12,
        padding: "28px 24px 32px",
        transition: "all 0.22s ease",
        transform: hover ? "translateY(-4px)" : "none",
        boxShadow: hover ? `0 16px 40px rgba(201,168,76,0.15)` : "0 2px 12px rgba(0,0,0,0.3)",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top corner glow */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 120,
          height: 120,
          background: `radial-gradient(circle, ${GOLD}12, transparent 70%)`,
          borderRadius: "0 12px 0 100%",
        }}
      />
      {/* Badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 18,
          background: `${pkg.badgeColor}18`,
          border: `1px solid ${pkg.badgeColor}40`,
          padding: "4px 12px",
          borderRadius: 99,
          width: "fit-content",
        }}
      >
        <BadgeCheck size={12} color={pkg.badgeColor} />
        <span style={{ color: pkg.badgeColor, fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {pkg.badge}
        </span>
      </div>
      {/* Name */}
      <h3 style={{ color: "#fff", fontSize: 20, fontWeight: 800, margin: "0 0 6px", lineHeight: 1.2 }}>
        {pkg.name}
      </h3>
      {/* Price */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
        <span style={{ color: GOLD, fontSize: 32, fontWeight: 900 }}>${pkg.price.toFixed(2)}</span>
        <span style={{ color: GREY_600, fontSize: 14, textDecoration: "line-through" }}>
          ${pkg.originalPrice.toFixed(2)}
        </span>
      </div>
      <p style={{ color: GOLD_MUTED, fontSize: 12, fontWeight: 700, margin: "0 0 22px" }}>
        You save ${savings.toFixed(2)}
      </p>
      {/* Perks */}
      <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 26, flex: 1 }}>
        {pkg.perks.map((perk) => (
          <div key={perk} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "rgba(201,168,76,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Check size={11} color={GOLD} />
            </div>
            <span style={{ color: GREY_400, fontSize: 13 }}>{perk}</span>
          </div>
        ))}
      </div>
      {/* Product link indicator */}
      {resolutionMethod === "direct" && pkg.productName && (
        <Link href={`/product/${pkg.productSlug}`}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 14,
              background: "rgba(201,168,76,0.08)",
              border: "1px solid rgba(201,168,76,0.22)",
              padding: "5px 10px",
              borderRadius: 6,
              cursor: "pointer",
              transition: "border-color 0.15s",
              width: "fit-content",
            }}
          >
            <Package size={11} color={GOLD_MUTED} />
            <span style={{ color: GOLD_MUTED, fontSize: 11, fontWeight: 600 }}>
              Viewing product:{" "}
              <span style={{ color: GOLD, fontWeight: 700 }}>{pkg.productName}</span>
            </span>
          </div>
        </Link>
      )}
      {resolutionMethod === "fuzzy" && matchedProduct && isAdmin && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 14,
            background: "rgba(107,114,128,0.10)",
            border: "1px solid rgba(107,114,128,0.25)",
            padding: "5px 10px",
            borderRadius: 6,
            width: "fit-content",
          }}
        >
          <Package size={11} color={GREY_600} />
          <span style={{ color: GREY_600, fontSize: 11, fontWeight: 600 }}>
            Fuzzy match:{" "}
            <span style={{ color: GREY_400, fontWeight: 700 }}>{matchedProduct.name}</span>
          </span>
        </div>
      )}
      {/* Stale link indicator — admin only */}
      {isAdmin && pkg.productId != null && !pkg.productName && (
        <button
          onClick={(e) => { e.stopPropagation(); onFixLink?.(); }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 14,
            background: "rgba(245,158,11,0.10)",
            border: "1px solid rgba(245,158,11,0.35)",
            padding: "5px 10px",
            borderRadius: 6,
            cursor: "pointer",
            width: "fit-content",
            transition: "background 0.15s, border-color 0.15s",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(245,158,11,0.18)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(245,158,11,0.55)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(245,158,11,0.10)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(245,158,11,0.35)";
          }}
        >
          <AlertTriangle size={11} color="#f59e0b" />
          <span style={{ color: "#f59e0b", fontSize: 11, fontWeight: 700 }}>
            Stale link
          </span>
          <Link2 size={10} color="#f59e0b" />
          <span style={{ color: "#f59e0b", fontSize: 11, fontWeight: 700 }}>Fix</span>
        </button>
      )}
      {/* CTA */}
      {matchedProduct ? (
        <button
          disabled={adding}
          onClick={(e) => onAdd(e, matchedProduct.id)}
          style={{
            width: "100%",
            padding: "13px 0",
            background: hover ? GOLD : "transparent",
            color: hover ? "#000" : GOLD,
            border: `1.5px solid ${GOLD}`,
            borderRadius: 8,
            fontWeight: 800,
            fontSize: 14,
            cursor: adding ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "all 0.2s ease",
          }}
        >
          {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart size={15} />}
          Add to Cart
        </button>
      ) : (
        <Link href="/join/pro">
          <button
            style={{
              width: "100%",
              padding: "13px 0",
              background: hover ? GOLD : "transparent",
              color: hover ? "#000" : GOLD,
              border: `1.5px solid ${GOLD}`,
              borderRadius: 8,
              fontWeight: 800,
              fontSize: 14,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 0.2s ease",
            }}
          >
            <ShoppingCart size={15} /> Add to Cart
          </button>
        </Link>
      )}
    </div>
  );
}

function CategorySection({
  group,
  products,
  onAdd,
  addingId,
}: {
  group: (typeof CATEGORY_GROUPS)[0];
  products: Product[];
  onAdd: (e: React.MouseEvent, id: number) => void;
  addingId: number | null;
}) {
  if (products.length === 0) return null;
  return (
    <section style={{ marginBottom: 60 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 24,
          paddingBottom: 18,
          borderBottom: `2px solid ${GREY_200}`,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: `${group.accentColor}12`,
            border: `1.5px solid ${group.accentColor}30`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: group.accentColor,
            flexShrink: 0,
          }}
        >
          {group.icon}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ color: "#1a1a1a", fontSize: 22, fontWeight: 900, margin: 0, fontFamily: "serif" }}>
            {group.label}
          </h3>
          <p style={{ color: GREY_600, fontSize: 13, margin: 0 }}>{group.description}</p>
        </div>
        <span
          style={{
            background: `${group.accentColor}10`,
            border: `1px solid ${group.accentColor}25`,
            color: group.accentColor,
            fontSize: 12,
            fontWeight: 700,
            padding: "4px 12px",
            borderRadius: 99,
          }}
        >
          {products.length} {products.length === 1 ? "item" : "items"}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            accentColor={group.accentColor}
            onAdd={onAdd}
            adding={addingId === p.id}
          />
        ))}
      </div>
    </section>
  );
}

const PRO_STORE_SECTIONS = [
  {
    key: "NFGN Member Trips",
    slug: "member-trips",
    emoji: "✈️",
    label: "Member Trips",
    color: "#38bdf8",
    colorDim: "rgba(56,189,248,0.14)",
    colorBorder: "rgba(56,189,248,0.35)",
    gradient: "linear-gradient(135deg, #020f1a 0%, #04192a 55%, #020c14 100%)",
    topBorder: "#38bdf8",
    description: "Exclusive travel experiences, curated destination retreats, and group excursions organized for NFGN Pro Members. Travel the world with your network.",
    tags: ["Destination Retreats", "Group Trips", "Member Getaways", "VIP Experiences"],
  },
  {
    key: "Medical Benefits & Packages",
    slug: "medical-benefits",
    emoji: "🏥",
    label: "Medical Benefits",
    color: "#60a5fa",
    colorDim: "rgba(96,165,250,0.14)",
    colorBorder: "rgba(96,165,250,0.35)",
    gradient: "linear-gradient(135deg, #020918 0%, #041225 55%, #020714 100%)",
    topBorder: "#60a5fa",
    description: "Comprehensive medical benefit packages, supplemental health coverage, and doctor-curated wellness programs available exclusively to NFGN Pro Members.",
    tags: ["Health Coverage", "Medical Packages", "Wellness Programs", "Family Plans"],
  },
  {
    key: "Naturopathic & Herbal",
    slug: "naturopathic-herbal",
    emoji: "🌿",
    label: "Naturopathic",
    color: "#2dd4bf",
    colorDim: "rgba(45,212,191,0.14)",
    colorBorder: "rgba(45,212,191,0.35)",
    gradient: "linear-gradient(135deg, #020f0e 0%, #04201e 55%, #020c0b 100%)",
    topBorder: "#2dd4bf",
    description: "Premium naturopathic remedies, herbal supplements, and holistic health solutions sourced from trusted practitioners — curated for NFGN Pro Members.",
    tags: ["Herbal Supplements", "Natural Remedies", "Holistic Health", "Pro Formulas"],
  },
  {
    key: "Mental Health & Primary Care",
    slug: "mental-health",
    emoji: "🧠",
    label: "Mental Health",
    color: "#c084fc",
    colorDim: "rgba(192,132,252,0.14)",
    colorBorder: "rgba(192,132,252,0.35)",
    gradient: "linear-gradient(135deg, #0c0218 0%, #160328 55%, #0a0115 100%)",
    topBorder: "#c084fc",
    description: "Mental wellness services, primary care packages, therapy resources, and stress management programs to support your complete health as a Pro Member.",
    tags: ["Therapy Resources", "Primary Care", "Stress Management", "Wellness Support"],
  },
  {
    key: "Health & Wellness",
    slug: "health-wellness",
    emoji: "💊",
    label: "Health & Wellness",
    color: "#fb923c",
    colorDim: "rgba(251,146,60,0.14)",
    colorBorder: "rgba(251,146,60,0.35)",
    gradient: "linear-gradient(135deg, #180a02 0%, #271103 55%, #150802 100%)",
    topBorder: "#fb923c",
    description: "Curated health products, premium supplements, fitness programs, and lifestyle solutions to help Pro Members live and perform at their absolute best.",
    tags: ["Premium Supplements", "Fitness Programs", "Lifestyle Products", "Vitality"],
  },
  {
    key: "Exclusive Member Discounts",
    slug: "member-discounts",
    emoji: "💸",
    label: "Discounts",
    color: "#C9A84C",
    colorDim: "rgba(201,168,76,0.14)",
    colorBorder: "rgba(201,168,76,0.35)",
    gradient: "linear-gradient(135deg, #130d00 0%, #1e1500 55%, #100b00 100%)",
    topBorder: "#C9A84C",
    description: "Special pricing, exclusive discounts, and Pro Member-only deals on premium products and services across the NFGN network. Save more. Earn more.",
    tags: ["Member Pricing", "Exclusive Deals", "VIP Discounts", "Partner Savings"],
  },
  {
    key: "NFGN Sports",
    slug: "nfgn-sports",
    emoji: "🏆",
    label: "NFGN Sports",
    color: "#f97316",
    colorDim: "rgba(249,115,22,0.14)",
    colorBorder: "rgba(249,115,22,0.35)",
    gradient: "linear-gradient(135deg, #130500 0%, #200900 55%, #100400 100%)",
    topBorder: "#f97316",
    description: "Pro Member-exclusive sports products, athlete packages, team sponsorships, and performance gear curated for the active NFGN community.",
    tags: ["Athlete Packages", "Team Sponsorships", "Performance Gear", "Sports Events"],
  },
  {
    key: "General Exclusive",
    slug: "general-exclusive",
    emoji: "🔒",
    label: "General Exclusive",
    color: "#a78bfa",
    colorDim: "rgba(167,139,250,0.14)",
    colorBorder: "rgba(167,139,250,0.35)",
    gradient: "linear-gradient(135deg, #0a0412 0%, #0f0820 55%, #080310 100%)",
    topBorder: "#a78bfa",
    description: "A curated selection of premium products, limited releases, and exclusive offerings available only to verified NFGN Pro Members.",
    tags: ["Limited Releases", "Premium Picks", "Pro Only", "Curated Selection"],
  },
] as const;

function getProCatIcon(key: string, size = 18): React.ReactNode {
  const s = { size };
  switch (key) {
    case "NFGN Member Trips":           return <Plane {...s} />;
    case "Medical Benefits & Packages": return <Stethoscope {...s} />;
    case "Naturopathic & Herbal":       return <Leaf {...s} />;
    case "Mental Health & Primary Care":return <Brain {...s} />;
    case "Health & Wellness":           return <Heart {...s} />;
    case "Exclusive Member Discounts":  return <Tag {...s} />;
    case "NFGN Sports":                 return <Trophy {...s} />;
    default:                            return <Crown {...s} />;
  }
}

export function Shop() {
  const search = useSearch();
  const fromAdmin = new URLSearchParams(search).get("from") === "admin";

  const { data, isLoading } = useListProducts({ limit: 100 });
  const { setCartOpen } = useCartStore();
  const { toast } = useToast();
  const { isAuthenticated, token } = useAuth();
  const qc = useQueryClient();
  const [addingId, setAddingId] = useState<number | null>(null);

  // Fetch current user to know if they are a Pro Member
  const { data: currentUser } = useQuery<{ role: string; isProMember: boolean; firstName: string }>({
    queryKey: ["/api/auth/me"],
    queryFn: () => customFetch("/api/auth/me").then(r => r.json()),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
  const isProMember = isAuthenticated && !!currentUser && (
    currentUser.isProMember || currentUser.role === "pro_member" ||
    ["admin", "super_admin", "store_admin"].includes(currentUser.role)
  );
  const isAdminRole = isAuthenticated && !!currentUser &&
    ["admin", "super_admin", "store_admin"].includes(currentUser.role);
  const [proPackages, setProPackages] = useState<ProPackage[]>([]);
  const [proPackagesLoading, setProPackagesLoading] = useState(true);
  const [catOverrides, setCatOverrides] = useState<Record<string, { description?: string; tags?: string[] }>>({});

  const [fixLinkTarget, setFixLinkTarget] = useState<ProPackage | null>(null);
  const [fixLinkProductId, setFixLinkProductId] = useState<string>("");
  const [fixLinkSaving, setFixLinkSaving] = useState(false);

  const openFixLink = (pkg: ProPackage) => {
    setFixLinkTarget(pkg);
    setFixLinkProductId("");
  };

  const handleFixLink = async () => {
    if (!fixLinkTarget) return;
    setFixLinkSaving(true);
    try {
      const productId = fixLinkProductId !== "" && fixLinkProductId !== "none"
        ? parseInt(fixLinkProductId)
        : null;
      const res = await customFetch(`/api/pro-packages/${fixLinkTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast({ title: productId ? "Product link updated" : "Stale link cleared" });
      setFixLinkTarget(null);
      setProPackagesLoading(true);
      fetch("/api/pro-packages")
        .then((r) => r.json())
        .then((d: ProPackage[]) => setProPackages(Array.isArray(d) ? d : []))
        .catch(() => {})
        .finally(() => setProPackagesLoading(false));
    } catch {
      toast({ title: "Failed to update product link", variant: "destructive" });
    } finally {
      setFixLinkSaving(false);
    }
  };

  useEffect(() => {
    fetch("/api/categories")
      .then(r => r.json())
      .then((data: Array<{ slug: string; description: string | null; shopHeadline: string | null; shopTags: string | null }>) => {
        const overrides: Record<string, { description?: string; tags?: string[] }> = {};
        for (const cat of data) {
          overrides[cat.slug] = {
            description: cat.description ?? undefined,
            tags: cat.shopTags ? cat.shopTags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
          };
        }
        setCatOverrides(overrides);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setProPackagesLoading(true);
    fetch("/api/pro-packages")
      .then((r) => r.json())
      .then((data: ProPackage[]) => setProPackages(Array.isArray(data) ? data : []))
      .catch(() => setProPackages([]))
      .finally(() => setProPackagesLoading(false));
  }, []);

  // Scroll to giving section when ?section=giving is in the URL (e.g. from the dashboard sidebar link)
  useEffect(() => {
    if (new URLSearchParams(search).get("section") !== "giving") return;
    const timer = setTimeout(() => {
      document.getElementById("giving-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 600);
    return () => clearTimeout(timer);
  }, [search]);

  const addToCart = useAddToCart({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/api/cart"] });
        setCartOpen(true);
      },
      onError: () => {
        toast({ title: "Could not add to cart", description: "Please try again.", variant: "destructive" });
      },
      onSettled: () => setAddingId(null),
    },
  });

  const handleAddToCart = (e: React.MouseEvent, productId: number) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast({ title: "Sign in required", description: "Please sign in to add items to your cart." });
      return;
    }
    setAddingId(productId);
    addToCart.mutate({ data: { productId, quantity: 1 } });
  };

  const products: Product[] = data?.products ?? [];
  const proProducts = products.filter((p) => p.isProPackage);
  const sportsProducts = products.filter((p) => p.isSports && !p.isProPackage);
  const nonProfitProducts = products.filter((p) => p.isNonProfit && !p.isProPackage && !p.isSports && !p.isChurchDonation);
  const weddingProducts = products.filter((p) => p.isWeddingRegistry && !p.isProPackage && !p.isSports);
  const holidayProducts = products.filter((p) => p.isHolidayRegistry && !p.isProPackage && !p.isSports);
  const proExclusiveProducts = products.filter((p) => p.isProExclusive && !p.isProPackage);
  const churchDonationProducts = products.filter((p) => p.isChurchDonation && !p.isProPackage);
  const regularProducts = products.filter((p) => !p.isProPackage && !p.isSports && !p.isNonProfit && !p.isWeddingRegistry && !p.isHolidayRegistry && !p.isProExclusive && !p.isChurchDonation);

  // Resolve which real product to use for a package card's "Add to Cart" button.
  // Prefer the admin-configured direct product link (productId); fall back to
  // fuzzy price matching (within 25% tolerance) when no link is set.
  function resolveProProduct(pkg: ProPackage): { product: Product | null; method: "direct" | "fuzzy" | null } {
    if (pkg.productId != null) {
      const direct = products.find((p) => p.id === pkg.productId);
      if (direct) return { product: direct, method: "direct" };
      // productId set but product not found (stale link) — fall through to fuzzy match
    }
    const targetPrice = pkg.price;
    const tolerance = targetPrice * 0.25;
    let best: Product | null = null;
    let bestDiff = Infinity;
    for (const p of proProducts) {
      const diff = Math.abs(p.price - targetPrice);
      if (diff <= tolerance && diff < bestDiff) {
        best = p;
        bestDiff = diff;
      }
    }
    return { product: best, method: best ? "fuzzy" : null };
  }
  const saleProducts = regularProducts.filter((p) => p.comparePrice && p.comparePrice > p.price).slice(0, 3);

  const grouped = CATEGORY_GROUPS.map((group) => ({
    group,
    products: regularProducts.filter((p) => {
      const slug = categorySlugFromName(p.categoryName);
      return group.slugs.some((s) => slug.includes(s) || s.includes(slug));
    }),
  }));

  const assignedIds = new Set(grouped.flatMap((g) => g.products.map((p) => p.id)));
  const uncategorized = regularProducts.filter((p) => !assignedIds.has(p.id));
  const herbalGroup  = grouped.find(g => g.group.key === "herbal")  ?? { group: CATEGORY_GROUPS[0], products: [] as Product[] };
  const soapsGroup   = grouped.find(g => g.group.key === "soaps")   ?? { group: CATEGORY_GROUPS[1], products: [] as Product[] };
  const candlesGroup = grouped.find(g => g.group.key === "candles") ?? { group: CATEGORY_GROUPS[2], products: [] as Product[] };
  const booksGroup   = grouped.find(g => g.group.key === "books")   ?? { group: CATEGORY_GROUPS[3], products: [] as Product[] };
  const sportsGroup  = { group: CATEGORY_GROUPS[4], products: sportsProducts };

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", minHeight: "100vh", background: "#fff" }}>

      {/* ── Back To Admin bar ─────────────────────────────── */}
      {fromAdmin && (
        <div style={{ background: "#0a0a0a", borderBottom: "1px solid #C9A84C33" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "8px 24px" }}>
            <Link
              href="/admin"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                color: "#C9A84C",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                letterSpacing: "0.02em",
                opacity: 0.9,
                transition: "opacity 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "0.9")}
            >
              <ArrowLeft size={14} />
              Back to Admin
            </Link>
          </div>
        </div>
      )}

      {/* ── ZONE 1: BLACK — Hero ─────────────────────────── */}
      <div style={{ background: "#000", borderBottom: "2px solid #1a1a1a" }}>
        <div
          style={{
            backgroundImage: `linear-gradient(rgba(201,168,76,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.05) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        >
          <div className="px-4 md:px-8" style={{ maxWidth: 1200, margin: "0 auto", padding: "64px 0 72px", textAlign: "center" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 20,
                background: "rgba(201,168,76,0.10)",
                border: "1px solid rgba(201,168,76,0.25)",
                padding: "7px 18px",
                borderRadius: 99,
              }}
            >
              <Sparkles size={13} color={GOLD} />
              <span style={{ color: GOLD, fontSize: 12, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase" }}>
                NFGN Marketplace
              </span>
            </div>
            <h1
              style={{
                color: "#fff",
                fontSize: "clamp(36px, 6vw, 60px)",
                fontWeight: 900,
                lineHeight: 1.1,
                margin: "0 0 16px",
                fontFamily: "'Playfair Display',serif",
              }}
            >
              Wellness. <span style={{ color: GOLD }}>Elevated.</span>
            </h1>
            <p style={{ color: GREY_400, fontSize: 18, maxWidth: 500, margin: "0 auto 32px" }}>
              Premium naturopathic products crafted with care — for your body, mind, and business.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <a
                href="#products"
                style={{
                  background: GOLD,
                  color: "#000",
                  padding: "13px 32px",
                  borderRadius: 8,
                  fontWeight: 800,
                  fontSize: 15,
                  border: "none",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  textDecoration: "none",
                }}
              >
                <ShoppingCart size={17} /> Shop Now
              </a>
              <Link href="/join">
                <span
                  style={{
                    background: "transparent",
                    color: "#fff",
                    padding: "13px 28px",
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 15,
                    border: "1px solid rgba(255,255,255,0.2)",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  Become a Member <ArrowRight size={16} />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── ZONE 1: BLACK — Pro Registration Packages ───── */}
      <div style={{ background: GREY_900, padding: "64px 0 80px", borderBottom: `1px solid ${GREY_800}` }}>
        <div className="px-4 md:px-8" style={{ maxWidth: 1200, margin: "0 auto" }}>
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
          <p style={{ color: GREY_600, marginBottom: 40, fontSize: 15 }}>
            Start your NFGN journey — choose the package that fits your goals.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {proPackagesLoading ? (
              [1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    background: "#111",
                    border: "1.5px solid rgba(201,168,76,0.15)",
                    borderRadius: 12,
                    padding: "28px 24px 32px",
                    minHeight: 320,
                    opacity: 0.5,
                    animation: "pulse 1.5s ease-in-out infinite",
                  }}
                />
              ))
            ) : proPackages.length === 0 ? null : (
              proPackages.map((pkg) => {
                const { product: matched, method } = resolveProProduct(pkg);
                return (
                  <ProPackageCard
                    key={pkg.id}
                    pkg={pkg}
                    matchedProduct={matched}
                    resolutionMethod={method}
                    onAdd={handleAddToCart}
                    adding={addingId === matched?.id}
                    isAdmin={isAdminRole}
                    onFixLink={() => openFixLink(pkg)}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── ZONE 3: GOLD — Ticker ────────────────────────── */}
      <ShopTickerBar />

      {/* ── Our Collection — All Products ───────────────── */}
      <div id="products" style={{ background: GREY_50, paddingTop: 72, paddingBottom: isLoading ? 72 : 0 }}>
        <div className="px-4 md:px-8" style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <p style={{ color: GOLD, fontSize: 12, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>
              Our Collection
            </p>
            <h2 style={{ color: "#1a1a1a", fontSize: 38, fontWeight: 900, margin: "0 0 12px", fontFamily: "serif" }}>
              All Products
            </h2>
            <p style={{ color: GREY_600, fontSize: 16, maxWidth: 480, margin: "0 auto" }}>
              Handcrafted naturopathic formulations for every aspect of your wellness journey.
            </p>
            <div style={{ width: 60, height: 3, background: GOLD, borderRadius: 99, margin: "20px auto 0" }} />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-40 w-full rounded-lg mb-3" />
                  <Skeleton className="h-3 w-20 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-5 w-24 mb-3" />
                  <Skeleton className="h-9 w-full rounded-lg" />
                </div>
              ))}
            </div>
          ) : (
            herbalGroup.products.length > 0 && (
              <CategorySection
                group={herbalGroup.group}
                products={herbalGroup.products}
                onAdd={handleAddToCart}
                addingId={addingId}
              />
            )
          )}
        </div>
      </div>

      {/* ── SPECIAL EVENTS REGISTRY (above Soaps & Lotions) ─── */}
      {!isLoading && weddingProducts.length > 0 && (
        <div style={{ background: "linear-gradient(135deg, #fff7fb 0%, #fdf2f8 50%, #fff5fa 100%)", padding: "72px 0", borderTop: "3px solid #e11d7a", borderBottom: "3px solid #e11d7a", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(225,29,122,0.03) 39px, rgba(225,29,122,0.03) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(225,29,122,0.03) 39px, rgba(225,29,122,0.03) 40px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: -60, left: "12%", width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(225,29,122,0.10), transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -50, right: "10%", width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(225,29,122,0.07), transparent 70%)", pointerEvents: "none" }} />
          <div className="px-4 md:px-8" style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
            <div style={{ marginBottom: 48 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 16, background: "rgba(225,29,122,0.09)", border: "1px solid rgba(225,29,122,0.30)", padding: "6px 16px", borderRadius: 99 }}>
                <Gem size={13} color="#e11d7a" />
                <span style={{ color: "#e11d7a", fontSize: 11, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase" }}>SPECIAL EVENTS REGISTRY</span>
              </div>
              <h2 style={{ color: "#1a1a1a", fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 900, margin: "0 0 12px", fontFamily: "serif", lineHeight: 1.1 }}>
                Celebrate Every Milestone. <span style={{ color: "#e11d7a" }}>Gift Meaningfully.</span>
              </h2>
              <p style={{ color: "#6b7280", fontSize: 16, maxWidth: 620, margin: 0 }}>
                Gift, sponsor, or donate toward someone's special occasion — weddings, birthdays, graduations, Sweet 16s, baby showers, family reunions, and every life milestone worth celebrating.
              </p>
              <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
                {[
                  { icon: <Heart size={11} />, label: "Weddings & Honeymoons" },
                  { icon: <Gem size={11} />, label: "Birthdays & Anniversaries" },
                  { icon: <Flower2 size={11} />, label: "Graduations & Milestones" },
                  { icon: <Church size={11} />, label: "Baptisms & Sweet 16s" },
                  { icon: <Heart size={11} />, label: "Baby Showers & Gender Reveals" },
                  { icon: <Gem size={11} />, label: "Retreats & Family Reunions" },
                ].map(tag => (
                  <span key={tag.label} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(225,29,122,0.07)", border: "1px solid rgba(225,29,122,0.22)", color: "#e11d7a", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 99, letterSpacing: "0.04em" }}>
                    {tag.icon} {tag.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {weddingProducts.map(p => (
                <WeddingProductCard key={p.id} product={p} onAdd={handleAddToCart} adding={addingId === p.id} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Soaps & Lotions ──────────────────────────────── */}
      {!isLoading && soapsGroup.products.length > 0 && (
        <div style={{ background: GREY_50, paddingBottom: 8 }}>
          <div className="px-4 md:px-8" style={{ maxWidth: 1200, margin: "0 auto" }}>
            <CategorySection group={soapsGroup.group} products={soapsGroup.products} onAdd={handleAddToCart} addingId={addingId} />
          </div>
        </div>
      )}

      {/* ── HOLIDAY & SPECIAL OCCASIONS (above Aromatherapy) ─── */}
      {!isLoading && holidayProducts.length > 0 && (
        <div style={{ background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fffbeb 100%)", padding: "72px 0", borderTop: "3px solid #d97706", borderBottom: "3px solid #d97706", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(217,119,6,0.03) 39px, rgba(217,119,6,0.03) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(217,119,6,0.03) 39px, rgba(217,119,6,0.03) 40px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: -60, right: "10%", width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.15), transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -50, left: "8%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(217,119,6,0.10), transparent 70%)", pointerEvents: "none" }} />
          <div className="px-4 md:px-8" style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
            <div style={{ marginBottom: 48 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 16, background: "rgba(217,119,6,0.10)", border: "1px solid rgba(217,119,6,0.35)", padding: "6px 16px", borderRadius: 99 }}>
                <Star size={13} color="#d97706" />
                <span style={{ color: "#d97706", fontSize: 11, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase" }}>HOLIDAY &amp; SPECIAL OCCASIONS</span>
              </div>
              <h2 style={{ color: "#1a1a1a", fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 900, margin: "0 0 12px", fontFamily: "serif", lineHeight: 1.1 }}>
                Season of Giving. <span style={{ color: "#d97706" }}>Shop the Holidays.</span>
              </h2>
              <p style={{ color: "#6b7280", fontSize: 16, maxWidth: 620, margin: 0 }}>
                Curated gifts, bundles, and seasonal products for every holiday and special occasion — Christmas, Hanukkah, Kwanzaa, Valentine's Day, Mother's Day, Eid, Diwali, and more.
              </p>
              <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
                {[
                  { icon: <Snowflake size={11} />, label: "Christmas & Hanukkah" },
                  { icon: <Sun size={11} />, label: "Eid & Diwali" },
                  { icon: <Heart size={11} />, label: "Valentine's & Mother's Day" },
                  { icon: <Flower2 size={11} />, label: "Easter & Thanksgiving" },
                  { icon: <PartyPopper size={11} />, label: "Kwanzaa & New Year's" },
                  { icon: <Gift size={11} />, label: "Seasonal Gift Baskets" },
                ].map(tag => (
                  <span key={tag.label} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(217,119,6,0.08)", border: "1px solid rgba(217,119,6,0.25)", color: "#d97706", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 99, letterSpacing: "0.04em" }}>
                    {tag.icon} {tag.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {holidayProducts.map(p => (
                <HolidayProductCard key={p.id} product={p} onAdd={handleAddToCart} adding={addingId === p.id} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Aromatherapy Candles, Books & Education, More Products ── */}
      {!isLoading && (
        <div style={{ background: GREY_50, paddingBottom: 72 }}>
          <div className="px-4 md:px-8" style={{ maxWidth: 1200, margin: "0 auto" }}>
            {candlesGroup.products.length > 0 && (
              <CategorySection group={candlesGroup.group} products={candlesGroup.products} onAdd={handleAddToCart} addingId={addingId} />
            )}
            {booksGroup.products.length > 0 && (
              <CategorySection group={booksGroup.group} products={booksGroup.products} onAdd={handleAddToCart} addingId={addingId} />
            )}
            {sportsGroup.products.length > 0 && (
              <CategorySection group={sportsGroup.group} products={sportsGroup.products} onAdd={handleAddToCart} addingId={addingId} />
            )}
            {uncategorized.length > 0 && (
              <CategorySection
                group={{ key: "other", label: "More Products", icon: <Sparkles className="h-5 w-5" />, accentColor: GOLD, description: "Additional wellness offerings from NFGN.", slugs: [] }}
                products={uncategorized}
                onAdd={handleAddToCart}
                addingId={addingId}
              />
            )}
            {regularProducts.length === 0 && weddingProducts.length === 0 && holidayProducts.length === 0 && (
              <div style={{ textAlign: "center", padding: "80px 0" }}>
                <div style={{ fontSize: 56, marginBottom: 16, opacity: 0.2, color: GOLD }}>✦</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", marginBottom: 8 }}>No products yet</h3>
                <p style={{ color: GREY_600 }}>Check back soon — the marketplace is being stocked.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Specials ─────────────────────────────────────── */}
      {saleProducts.length > 0 && (
        <div style={{ background: "linear-gradient(135deg, #1a1200, #0a0a0a)", padding: "56px 0", borderTop: "1px solid rgba(201,168,76,0.25)" }}>
          <div className="px-4 md:px-8" style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32, flexWrap: "wrap" }}>
              <Zap size={22} color={GOLD} />
              <h2 style={{ color: "#fff", fontSize: 28, fontWeight: 900, margin: 0, fontFamily: "serif" }}>
                Current Specials & Sales
              </h2>
              <span style={{ background: GOLD, color: "#000", fontSize: 11, fontWeight: 800, padding: "4px 12px", borderRadius: 99, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Limited Offers
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {saleProducts.map((p) => (
                <Link key={p.id} href={`/product/${p.slug}`}>
                  <SaleCard product={p} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── NFGN SPORTS ───────────────────────────────────── */}
      {sportsProducts.length > 0 && (
        <div style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #111 50%, #0d0d0d 100%)", padding: "72px 0", borderTop: "3px solid #C9A84C", borderBottom: "3px solid #C9A84C", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(201,168,76,0.04) 39px, rgba(201,168,76,0.04) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(201,168,76,0.04) 39px, rgba(201,168,76,0.04) 40px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: -80, left: "10%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.12), transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -60, right: "8%", width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.08), transparent 70%)", pointerEvents: "none" }} />
          <div className="px-4 md:px-8" style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
            <div style={{ marginBottom: 48 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 16, background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.35)", padding: "6px 16px", borderRadius: 99 }}>
                <Trophy size={13} color={GOLD} />
                <span style={{ color: GOLD, fontSize: 11, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase" }}>NFGN SPORTS</span>
                <span style={{ color: "rgba(201,168,76,0.6)", fontSize: 10, fontWeight: 600, letterSpacing: "0.05em" }}>· Public Store</span>
              </div>
              <h2 style={{ color: "#fff", fontSize: "clamp(30px, 5vw, 46px)", fontWeight: 900, margin: "0 0 12px", fontFamily: "serif", lineHeight: 1.1 }}>
                Game On. <span style={{ color: GOLD }}>Compete. Win.</span>
              </h2>
              <p style={{ color: "#a0a0a0", fontSize: 16, maxWidth: 560, margin: 0 }}>
                Tournaments, entry fees, sponsorships, concessions, skills camps, personal training, and more — all powered by NFGN.
              </p>
              <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
                {[
                  { icon: <Ticket size={11} />, label: "Tournament Tickets" },
                  { icon: <Trophy size={11} />, label: "Entry Fees" },
                  { icon: <Dumbbell size={11} />, label: "Skills Training" },
                  { icon: <Brain size={11} />, label: "Coaching" },
                  { icon: <Utensils size={11} />, label: "Concessions & Food" },
                  { icon: <Shield size={11} />, label: "Referee / Officials" },
                  { icon: <Award size={11} />, label: "Sponsorships" },
                  { icon: <Users size={11} />, label: "Youth Development" },
                ].map(tag => (
                  <span key={tag.label} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", color: GOLD, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 99, letterSpacing: "0.04em" }}>
                    {tag.icon} {tag.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {sportsProducts.map(p => (
                <SportsProductCard key={p.id} product={p} onAdd={handleAddToCart} adding={addingId === p.id} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── CHURCH GIVING ─────────────────────────────────────── */}
      {churchDonationProducts.length > 0 && (
        <div id="giving-section" style={{ background: "linear-gradient(135deg, #0d0900 0%, #110b00 50%, #0a0800 100%)", padding: "72px 0", borderTop: "3px solid #C9A84C", borderBottom: "1px solid rgba(201,168,76,0.15)", position: "relative", overflow: "hidden" }}>
          {/* Subtle grid overlay */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(201,168,76,0.03) 39px, rgba(201,168,76,0.03) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(201,168,76,0.03) 39px, rgba(201,168,76,0.03) 40px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: -80, right: "8%", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.10), transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -60, left: "5%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.06), transparent 70%)", pointerEvents: "none" }} />

          <div className="px-4 md:px-8" style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
            {/* Section header */}
            <div style={{ marginBottom: 48 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 16, background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.35)", padding: "6px 16px", borderRadius: 99 }}>
                <Church size={13} color={GOLD} />
                <span style={{ color: GOLD, fontSize: 11, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase" }}>Church Giving</span>
              </div>
              <h2 style={{ color: "#fff", fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 900, margin: "0 0 12px", fontFamily: "serif", lineHeight: 1.1 }}>
                Give to Your Church. <span style={{ color: GOLD }}>Bless Your Community.</span>
              </h2>
              <p style={{ color: "#a0a0a0", fontSize: 16, maxWidth: 580, margin: "0 0 20px", lineHeight: 1.65 }}>
                Support your church directly through NFGN. Every gift goes where it's meant to — and your generosity rewards your referral network too.
              </p>
              {/* 80/20 split explainer */}
              <div style={{ display: "inline-flex", alignItems: "stretch", gap: 0, background: "rgba(201,168,76,0.07)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 12, overflow: "hidden", maxWidth: 480 }}>
                <div style={{ padding: "14px 18px", flex: "0 0 auto", borderRight: "1px solid rgba(201,168,76,0.18)" }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: GOLD, lineHeight: 1 }}>80%</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#8a8a8a", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 3 }}>⛪ To Church</div>
                </div>
                <div style={{ padding: "14px 18px", flex: "0 0 auto", borderRight: "1px solid rgba(201,168,76,0.18)" }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: "#fff", lineHeight: 1 }}>20%</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#8a8a8a", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 3 }}>🔗 Network Rewards</div>
                </div>
                <div style={{ padding: "14px 16px", flex: 1, display: "flex", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "#777", lineHeight: 1.45 }}>Split is admin-adjustable per gift product. The 20% funds your referral compensation plan — <strong style={{ color: "#aaa" }}>not taxable income</strong>.</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {churchDonationProducts.map(p => (
                <ChurchDonationCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── NON-PROFIT / CHARITY GIVING ───────────────────────── */}
      {nonProfitProducts.length > 0 && (
        <div style={{ background: "linear-gradient(135deg, #0a0d08 0%, #0d1009 50%, #090b07 100%)", padding: "72px 0", borderTop: "1px solid rgba(201,168,76,0.15)", borderBottom: "1px solid rgba(201,168,76,0.15)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(201,168,76,0.025) 39px, rgba(201,168,76,0.025) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(201,168,76,0.025) 39px, rgba(201,168,76,0.025) 40px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: -60, left: "10%", width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.08), transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -80, right: "6%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.06), transparent 70%)", pointerEvents: "none" }} />

          <div className="px-4 md:px-8" style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
            <div style={{ marginBottom: 48 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 16, background: "rgba(201,168,76,0.10)", border: "1px solid rgba(201,168,76,0.30)", padding: "6px 16px", borderRadius: 99 }}>
                <HandHeart size={13} color={GOLD} />
                <span style={{ color: GOLD, fontSize: 11, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase" }}>Non-Profit Giving</span>
              </div>
              <h2 style={{ color: "#fff", fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 900, margin: "0 0 12px", fontFamily: "serif", lineHeight: 1.1 }}>
                Support Causes That Matter. <span style={{ color: GOLD }}>Change Lives.</span>
              </h2>
              <p style={{ color: "#a0a0a0", fontSize: 16, maxWidth: 580, margin: "0 0 20px", lineHeight: 1.65 }}>
                Fundraisers, donation drives, and charity campaigns — curated by NFGN. Your purchase supports real organizations and rewards your network.
              </p>
              {/* 80/20 split explainer */}
              <div style={{ display: "inline-flex", alignItems: "stretch", gap: 0, background: "rgba(201,168,76,0.07)", border: "1px solid rgba(201,168,76,0.22)", borderRadius: 12, overflow: "hidden", maxWidth: 480 }}>
                <div style={{ padding: "14px 18px", flex: "0 0 auto", borderRight: "1px solid rgba(201,168,76,0.16)" }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: GOLD, lineHeight: 1 }}>80%</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#8a8a8a", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 3 }}>🤝 To Organisation</div>
                </div>
                <div style={{ padding: "14px 18px", flex: "0 0 auto", borderRight: "1px solid rgba(201,168,76,0.16)" }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: "#fff", lineHeight: 1 }}>20%</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#8a8a8a", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 3 }}>🔗 Network Rewards</div>
                </div>
                <div style={{ padding: "14px 16px", flex: 1, display: "flex", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "#777", lineHeight: 1.45 }}>Default split — admin-adjustable per product. Your gift is <strong style={{ color: "#aaa" }}>not taxable income</strong> for the member network.</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {nonProfitProducts.map(p => (
                <NonProfitProductCard key={p.id} product={p} onAdd={handleAddToCart} adding={addingId === p.id} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PRO MEMBER EXCLUSIVE STORE ────────────────────────── */}
      {isProMember && (
        <div id="pro-store">
          {/* ── HERO / CATEGORY NAV HUB ── */}
          <div style={{ background: "linear-gradient(160deg, #06020f 0%, #0d0520 50%, #050110 100%)", padding: "72px 0 60px", borderTop: "3px solid #7c3aed", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(124,58,237,0.04) 39px, rgba(124,58,237,0.04) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(124,58,237,0.04) 39px, rgba(124,58,237,0.04) 40px)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", top: -120, right: "4%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.16), transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: -60, left: "6%", width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle, rgba(56,189,248,0.08), transparent 70%)", pointerEvents: "none" }} />

            <div className="px-4 md:px-8" style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
              {/* Badge + title */}
              <div style={{ marginBottom: 40 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 18, background: "rgba(124,58,237,0.18)", border: "1px solid rgba(124,58,237,0.45)", padding: "6px 18px", borderRadius: 99 }}>
                  <Lock size={11} color="#a78bfa" />
                  <span style={{ color: "#a78bfa", fontSize: 11, fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase" }}>Pro Members Only</span>
                </div>
                <h2 style={{ color: "#fff", fontSize: "clamp(30px, 5vw, 52px)", fontWeight: 900, margin: "0 0 14px", fontFamily: "serif", lineHeight: 1.08 }}>
                  Pro Member <span style={{ color: "#a78bfa" }}>Exclusive Store</span>
                </h2>
                <p style={{ color: "#9a9a9a", fontSize: 16, maxWidth: 640, margin: 0, lineHeight: 1.65 }}>
                  Welcome back, <strong style={{ color: "#c4b5fd" }}>{currentUser?.firstName ?? "Pro Member"}</strong>. Your exclusive access unlocks 7 premium benefit categories — trips, medical packages, naturopathic care, mental wellness, and more — available only to verified NFGN Pro Members.
                </p>
              </div>

              {/* 7 category nav cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {PRO_STORE_SECTIONS.map(cat => (
                  <a
                    key={cat.key}
                    href={`#pro-${cat.slug}`}
                    onClick={e => { e.preventDefault(); document.getElementById(`pro-${cat.slug}`)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                    style={{ textDecoration: "none" }}
                  >
                    <div style={{
                      background: cat.colorDim,
                      border: `1.5px solid ${cat.colorBorder}`,
                      borderRadius: 14,
                      padding: "18px 12px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 10,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      textAlign: "center",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = cat.colorDim.replace("0.14", "0.24"); (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = cat.colorDim; (e.currentTarget as HTMLDivElement).style.transform = "none"; }}
                    >
                      <div style={{ width: 44, height: 44, borderRadius: "50%", background: `rgba(${cat.color.replace("#","").match(/.{2}/g)?.map(h=>parseInt(h,16)).join(",")},0.18)`, display: "flex", alignItems: "center", justifyContent: "center", border: `1.5px solid ${cat.colorBorder}` }}>
                        <span style={{ color: cat.color, display: "flex" }}>{getProCatIcon(cat.key, 20)}</span>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 800, color: cat.color, letterSpacing: "0.10em", textTransform: "uppercase", lineHeight: 1.3 }}>{cat.emoji} {cat.label}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* ── 7 INDIVIDUAL CATEGORY SECTIONS ── */}
          {PRO_STORE_SECTIONS.map(cat => {
            const catProducts = proExclusiveProducts.filter(p => (p.proExclusiveCategory ?? "General Exclusive") === cat.key);
            return (
              <div
                key={cat.key}
                id={`pro-${cat.slug}`}
                style={{ background: cat.gradient, padding: "72px 0", borderTop: `2px solid ${cat.colorBorder}`, position: "relative", overflow: "hidden" }}
              >
                {/* Grid overlay */}
                <div style={{ position: "absolute", inset: 0, backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 39px, ${cat.colorBorder.replace("0.35","0.04")} 39px, ${cat.colorBorder.replace("0.35","0.04")} 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, ${cat.colorBorder.replace("0.35","0.04")} 39px, ${cat.colorBorder.replace("0.35","0.04")} 40px)`, pointerEvents: "none" }} />
                <div style={{ position: "absolute", top: -80, right: "5%", width: 280, height: 280, borderRadius: "50%", background: `radial-gradient(circle, ${cat.colorDim}, transparent 70%)`, pointerEvents: "none" }} />

                <div className="px-4 md:px-8" style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
                  {/* Section header */}
                  <div style={{ marginBottom: 44 }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 16, background: cat.colorDim, border: `1px solid ${cat.colorBorder}`, padding: "6px 16px", borderRadius: 99 }}>
                      <span style={{ color: cat.color, display: "flex" }}>{getProCatIcon(cat.key, 12)}</span>
                      <span style={{ color: cat.color, fontSize: 11, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase" }}>{cat.emoji} {cat.key}</span>
                    </div>
                    <h3 style={{ color: "#fff", fontSize: "clamp(24px, 4vw, 38px)", fontWeight: 900, margin: "0 0 12px", fontFamily: "serif", lineHeight: 1.15 }}>
                      {cat.key === "NFGN Member Trips" && <>Travel the World. <span style={{ color: cat.color }}>Together.</span></>}
                      {cat.key === "Medical Benefits & Packages" && <>Your Health. <span style={{ color: cat.color }}>Covered.</span></>}
                      {cat.key === "Naturopathic & Herbal" && <>Nature's Best. <span style={{ color: cat.color }}>Curated for You.</span></>}
                      {cat.key === "Mental Health & Primary Care" && <>Mind & Body. <span style={{ color: cat.color }}>Fully Supported.</span></>}
                      {cat.key === "Health & Wellness" && <>Live Well. <span style={{ color: cat.color }}>Perform Better.</span></>}
                      {cat.key === "Exclusive Member Discounts" && <>Save More. <span style={{ color: cat.color }}>Earn More.</span></>}
                      {cat.key === "NFGN Sports" && <>Train. Compete. <span style={{ color: cat.color }}>Win Together.</span></>}
                      {cat.key === "General Exclusive" && <>Premium Access. <span style={{ color: cat.color }}>Exclusively Yours.</span></>}
                    </h3>
                    <p style={{ color: "#9a9a9a", fontSize: 15, maxWidth: 580, margin: "0 0 20px", lineHeight: 1.65 }}>
                      {catOverrides[cat.slug]?.description ?? cat.description}
                    </p>
                    {/* Tags */}
                    <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                      {(catOverrides[cat.slug]?.tags ?? cat.tags).map(tag => (
                        <span key={tag} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: cat.colorDim, border: `1px solid ${cat.colorBorder}`, color: cat.color, fontSize: 11, fontWeight: 700, padding: "4px 11px", borderRadius: 99, letterSpacing: "0.05em" }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Products or Coming Soon */}
                  {catProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                      {catProducts.map(p => (
                        <ProExclusiveCard
                          key={p.id}
                          product={p}
                          onAdd={handleAddToCart}
                          adding={addingId === p.id}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{ borderRadius: 16, height: 220, background: cat.colorDim, border: `1.5px dashed ${cat.colorBorder}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                          <div style={{ width: 52, height: 52, borderRadius: "50%", background: `rgba(${cat.color.replace("#","").match(/.{2}/g)?.map(h=>parseInt(h,16)).join(",")},0.12)`, display: "flex", alignItems: "center", justifyContent: "center", border: `1.5px solid ${cat.colorBorder}` }}>
                            <span style={{ color: cat.color, opacity: 0.5, display: "flex" }}>{getProCatIcon(cat.key, 22)}</span>
                          </div>
                          <p style={{ color: cat.color, fontWeight: 800, fontSize: 13, margin: 0, opacity: 0.7, letterSpacing: "0.05em" }}>Coming Soon</p>
                          <p style={{ color: "#6b7280", fontSize: 11, margin: 0, textAlign: "center", maxWidth: 160, lineHeight: 1.5 }}>Exclusive products are being added to this section.</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pro Member Exclusive — teaser for non-Pro visitors */}
      {!isProMember && (
        <div style={{ background: "linear-gradient(135deg, #0a0412 0%, #0f0820 60%, #080310 100%)", padding: "72px 0", borderTop: "2px solid rgba(124,58,237,0.40)", borderBottom: "2px solid rgba(124,58,237,0.40)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(2px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: -80, right: "8%", width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.12), transparent 70%)", pointerEvents: "none" }} />
          <div className="px-4 md:px-8" style={{ maxWidth: 680, margin: "0 auto", textAlign: "center", position: "relative" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 20, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.40)", padding: "7px 18px", borderRadius: 99 }}>
              <Lock size={12} color="#a78bfa" />
              <span style={{ color: "#a78bfa", fontSize: 11, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase" }}>Members Only</span>
            </div>
            <h2 style={{ color: "#fff", fontSize: "clamp(26px, 4vw, 42px)", fontWeight: 900, margin: "0 0 16px", fontFamily: "serif", lineHeight: 1.15 }}>
              Pro Member <span style={{ color: "#a78bfa" }}>Exclusive Store</span>
            </h2>
            <p style={{ color: "#9a9a9a", fontSize: 15, margin: "0 auto 28px", lineHeight: 1.65, maxWidth: 520 }}>
              Pro Members unlock a private store with exclusive access to member trips, medical benefit packages, naturopathic & herbal products, mental health care, exclusive discounts, and premium health & wellness services — not available anywhere else.
            </p>
            {/* Lock icon grid */}
            <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", marginBottom: 32 }}>
              {[
                { icon: <Plane size={14} />, label: "Member Trips" },
                { icon: <Stethoscope size={14} />, label: "Medical Packages" },
                { icon: <Pill size={14} />, label: "Naturopathic" },
                { icon: <Brain size={14} />, label: "Mental Health" },
                { icon: <Tag size={14} />, label: "Exclusive Discounts" },
                { icon: <Crown size={14} />, label: "Pro Perks" },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: "rgba(124,58,237,0.10)", border: "1px solid rgba(124,58,237,0.22)", borderRadius: 12, padding: "12px 16px", minWidth: 80 }}>
                  <span style={{ color: "#a78bfa", opacity: 0.55 }}>{item.icon}</span>
                  <Lock size={9} color="rgba(124,58,237,0.5)" />
                  <span style={{ color: "#665577", fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>{item.label}</span>
                </div>
              ))}
            </div>
            <Link href="/pro-member">
              <button style={{ background: "#7c3aed", color: "#fff", border: "none", padding: "14px 36px", borderRadius: 8, fontWeight: 800, fontSize: 15, cursor: "pointer", letterSpacing: "0.04em" }}>
                Become a Pro Member
              </button>
            </Link>
            <p style={{ color: "#554466", fontSize: 12, marginTop: 14 }}>
              Already a Pro Member? <Link href="/login"><span style={{ color: "#a78bfa", cursor: "pointer" }}>Log in</span></Link> to unlock your exclusive store.
            </p>
          </div>
        </div>
      )}

      {/* ── ZONE 3: BLACK/GOLD — Become a Member CTA ─────────── */}
      <div
        style={{
          background: `linear-gradient(135deg, #1a1200 0%, #0a0a0a 100%)`,
          padding: "72px 0",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "rgba(201,168,76,0.08)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -60,
            left: -60,
            width: 220,
            height: 220,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.04)",
          }}
        />
        <div className="px-4 md:px-8" style={{ maxWidth: 800, margin: "0 auto", textAlign: "center", position: "relative" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 20,
              background: "rgba(201,168,76,0.15)",
              border: "1px solid rgba(201,168,76,0.3)",
              padding: "7px 18px",
              borderRadius: 99,
            }}
          >
            <Users size={13} color={GOLD} />
            <span style={{ color: GOLD, fontSize: 11, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase" }}>
              Join the Network
            </span>
          </div>
          <h2
            style={{
              color: "#fff",
              fontSize: "clamp(28px, 5vw, 42px)",
              fontWeight: 900,
              margin: "0 0 16px",
              fontFamily: "serif",
              lineHeight: 1.2,
            }}
          >
            Become an NFGN<br />Pro Member Today
          </h2>
          <p style={{ color: GREY_400, fontSize: 17, marginBottom: 32, lineHeight: 1.6 }}>
            Earn commissions, access exclusive products, build your network, and transform lives — including your own.
          </p>
          <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap", marginBottom: 36 }}>
            {["Commission Eligible", "Network Access", "Pro Pricing", "Training Included"].map((b) => (
              <div key={b} style={{ display: "flex", alignItems: "center", gap: 6, color: GREY_100, fontSize: 14 }}>
                <Check size={16} color={GOLD} /> {b}
              </div>
            ))}
          </div>
          <Link href="/join">
            <span
              style={{
                background: GOLD,
                color: "#000",
                padding: "16px 40px",
                borderRadius: 10,
                fontWeight: 800,
                fontSize: 16,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                boxShadow: "0 8px 30px rgba(201,168,76,0.35)",
                textDecoration: "none",
              }}
            >
              <Shield size={19} /> Get Started — Join Now
            </span>
          </Link>
        </div>
      </div>

      {/* ── Trust / Stats Strip ──────────────────────────── */}
      <div className="px-4 md:px-8" style={{ background: "#0a0a0a", padding: "28px 0", borderTop: "1px solid rgba(201,168,76,0.2)" }}>
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 24,
          }}
          className="sm:grid-cols-4"
        >
          {[
            { icon: <Users size={20} />, stat: "500+", label: "Pro Members" },
            { icon: <TrendingUp size={20} />, stat: "$2M+", label: "Paid in Commissions" },
            { icon: <Star size={20} />, stat: "4.9★", label: "Customer Rating" },
            { icon: <Gift size={20} />, stat: "100+", label: "Products Available" },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ color: GOLD }}>{s.icon}</div>
              <div style={{ color: WHITE, fontSize: 22, fontWeight: 900 }}>{s.stat}</div>
              <div style={{ color: GREY_400, fontSize: 12 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Fix Link Dialog — admin only ─────────────────── */}
      <Dialog open={!!fixLinkTarget} onOpenChange={(o) => !o && setFixLinkTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-blue-600" />
              Fix Stale Product Link
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              The product previously linked to{" "}
              <span className="font-semibold text-foreground">{fixLinkTarget?.name}</span>{" "}
              no longer exists. Select a replacement or clear the link.
            </p>
            <div className="space-y-1.5">
              <Label>Linked Shop Product</Label>
              <Select
                value={fixLinkProductId !== "" ? fixLinkProductId : "none"}
                onValueChange={(val) => setFixLinkProductId(val === "none" ? "" : val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a product…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Clear link (use price matching)</SelectItem>
                  {(data?.products ?? []).map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name} (${Number(p.price).toFixed(2)}){p.isProPackage ? " ★" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFixLinkTarget(null)} disabled={fixLinkSaving}>
              Cancel
            </Button>
            <Button onClick={handleFixLink} disabled={fixLinkSaving}>
              {fixLinkSaving ? (
                <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Saving…</>
              ) : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProExclusiveCard({
  product,
  onAdd,
  adding,
}: {
  product: Product;
  onAdd: (e: React.MouseEvent, id: number) => void;
  adding: boolean;
}) {
  const [hover, setHover] = useState(false);
  const img = resolveImageSrc(product.image);
  const outOfStock = product.stock === 0;
  const onSale = product.comparePrice && product.comparePrice > product.price;
  const PURPLE = "#7c3aed";
  const PURPLE_LIGHT = "#a78bfa";

  return (
    <Link href={`/product/${product.slug}`}>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          background: hover ? "#140d22" : "#0f0820",
          border: `1.5px solid ${hover ? PURPLE_LIGHT : "rgba(124,58,237,0.35)"}`,
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: hover ? `0 16px 48px rgba(124,58,237,0.30)` : "0 2px 16px rgba(0,0,0,0.50)",
          transition: "all 0.24s ease",
          cursor: "pointer",
          transform: hover ? "translateY(-5px)" : "none",
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        {/* Image */}
        <div style={{ background: img ? "#1a1a1a" : `linear-gradient(135deg, rgba(124,58,237,0.20), rgba(124,58,237,0.06))`, height: 170, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
          {img ? (
            <img src={img} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease", transform: hover ? "scale(1.08)" : "scale(1)" }} />
          ) : (
            <Crown size={44} color={PURPLE_LIGHT} style={{ opacity: 0.38 }} />
          )}
          <span style={{ position: "absolute", top: 10, left: 10, background: PURPLE, color: "#fff", fontSize: 9, fontWeight: 900, padding: "3px 9px", borderRadius: 99, letterSpacing: "0.12em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 4 }}>
            <Lock size={8} /> Pro Exclusive
          </span>
          {onSale && !outOfStock && (
            <span style={{ position: "absolute", top: 10, right: 10, background: PURPLE_LIGHT, color: "#000", fontSize: 9, fontWeight: 900, padding: "3px 8px", borderRadius: 99 }}>SALE</span>
          )}
          {outOfStock && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: 13 }}>Sold Out</span>
            </div>
          )}
        </div>
        {/* Info */}
        <div style={{ padding: "16px 16px 18px", flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
          <p style={{ fontSize: 10, fontWeight: 800, color: PURPLE_LIGHT, letterSpacing: "0.15em", textTransform: "uppercase", margin: 0 }}>
            {product.proExclusiveCategory || "Exclusive"}
          </p>
          <h4 style={{ fontSize: 15, fontWeight: 800, color: "#fff", lineHeight: 1.3, flex: 1, margin: 0 }}>
            {product.name}
          </h4>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: PURPLE_LIGHT }}>${product.price.toFixed(2)}</span>
            {onSale && (
              <span style={{ fontSize: 13, color: "#666", textDecoration: "line-through" }}>
                ${product.comparePrice!.toFixed(2)}
              </span>
            )}
          </div>
          <button
            disabled={outOfStock || adding}
            onClick={(e) => onAdd(e, product.id)}
            style={{
              marginTop: 8,
              width: "100%",
              padding: "10px 0",
              background: hover && !outOfStock ? PURPLE : "transparent",
              color: outOfStock ? "#555" : hover ? "#fff" : PURPLE_LIGHT,
              border: `1.5px solid ${outOfStock ? "#333" : PURPLE}`,
              borderRadius: 8,
              fontWeight: 800,
              fontSize: 13,
              cursor: outOfStock ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              transition: "all 0.18s ease",
            }}
          >
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart size={14} />}
            {outOfStock ? "Sold Out" : "Add to Cart"}
          </button>
        </div>
      </div>
    </Link>
  );
}

function ChurchDonationCard({
  product,
}: {
  product: Product;
}) {
  const [hover, setHover] = useState(false);
  const img = resolveImageSrc(product.image);
  const AMBER = "#b45309";
  const AMBER_LIGHT = "#C9A84C";
  const minAmount = product.donationMinAmount ?? 1;

  return (
    <Link href={`/product/${product.slug}`}>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          background: hover ? "#1c1509" : "#161208",
          border: `1.5px solid ${hover ? AMBER_LIGHT : "rgba(201,168,76,0.30)"}`,
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: hover ? `0 14px 40px rgba(180,83,9,0.28)` : "0 2px 14px rgba(0,0,0,0.45)",
          transition: "all 0.24s ease",
          cursor: "pointer",
          transform: hover ? "translateY(-5px)" : "none",
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        {/* Image area */}
        <div style={{ background: img ? "#1a1a1a" : `linear-gradient(135deg, rgba(180,83,9,0.18), rgba(201,168,76,0.08))`, height: 170, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
          {img ? (
            <img src={img} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease", transform: hover ? "scale(1.07)" : "scale(1)" }} />
          ) : (
            <Church size={48} color={AMBER_LIGHT} style={{ opacity: 0.45 }} />
          )}
          {/* Church badge */}
          <span style={{ position: "absolute", top: 10, left: 10, background: AMBER_LIGHT, color: "#000", fontSize: 9, fontWeight: 900, padding: "3px 9px", borderRadius: 99, letterSpacing: "0.13em", textTransform: "uppercase" }}>
            ⛪ Church Giving
          </span>
          {/* Min donation pill */}
          <span style={{ position: "absolute", bottom: 10, right: 10, background: "rgba(0,0,0,0.72)", color: AMBER_LIGHT, fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 99, border: `1px solid rgba(201,168,76,0.4)`, backdropFilter: "blur(4px)" }}>
            Min ${minAmount.toFixed(2)}
          </span>
        </div>

        {/* Info */}
        <div style={{ padding: "16px 16px 18px", flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
          <p style={{ fontSize: 10, fontWeight: 800, color: AMBER_LIGHT, letterSpacing: "0.15em", textTransform: "uppercase", margin: 0 }}>
            {product.churchName || product.donationRecipientName || "Church Donation"}
          </p>
          <h4 style={{ fontSize: 15, fontWeight: 800, color: "#fff", lineHeight: 1.3, flex: 1, margin: 0 }}>
            {product.name}
          </h4>
          <p style={{ fontSize: 12, color: "#9a9a9a", margin: 0, lineHeight: 1.45 }}>
            Give any amount at or above the minimum — your generosity goes directly to the church.
          </p>
          {/* Gift split mini-bar */}
          {(() => {
            const charityPct = Math.round(parseFloat(String(product.giftCharityPercent ?? "80")) || 80);
            const memberPct  = 100 - charityPct;
            return (
              <div style={{ marginTop: 4 }}>
                <div style={{ display: "flex", borderRadius: 99, overflow: "hidden", height: 6, background: "rgba(255,255,255,0.08)" }}>
                  <div style={{ width: `${charityPct}%`, background: AMBER_LIGHT, transition: "width 0.2s" }} />
                  <div style={{ flex: 1, background: "rgba(255,255,255,0.15)" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3, fontSize: 9, color: "#7a7a7a", fontWeight: 700, letterSpacing: "0.05em" }}>
                  <span style={{ color: AMBER_LIGHT }}>⛪ {charityPct}% → Church</span>
                  <span>🔗 {memberPct}% → Network</span>
                </div>
              </div>
            );
          })()}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
            <span style={{ fontSize: 13, color: "#9a9a9a" }}>Starting at</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: AMBER_LIGHT }}>${minAmount.toFixed(2)}</span>
          </div>
          {/* Donate CTA */}
          <div
            style={{
              marginTop: 8,
              width: "100%",
              padding: "10px 0",
              background: hover ? AMBER_LIGHT : "transparent",
              color: hover ? "#000" : AMBER_LIGHT,
              border: `1.5px solid ${AMBER_LIGHT}`,
              borderRadius: 8,
              fontWeight: 800,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              transition: "all 0.18s ease",
            }}
          >
            <Church size={14} /> Give Now
          </div>
        </div>
      </div>
    </Link>
  );
}

function NonProfitProductCard({
  product,
  onAdd,
  adding,
}: {
  product: Product;
  onAdd: (e: React.MouseEvent, id: number) => void;
  adding: boolean;
}) {
  const [hover, setHover] = useState(false);
  const img = resolveImageSrc(product.image);
  const outOfStock = product.stock === 0;
  const onSale = product.comparePrice && product.comparePrice > product.price;
  const NP_GOLD = "#C9A84C";

  return (
    <Link href={`/product/${product.slug}`}>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          background: hover ? "#151208" : "#0f0d08",
          border: `1.5px solid ${hover ? NP_GOLD : "rgba(201,168,76,0.22)"}`,
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: hover ? `0 12px 36px rgba(201,168,76,0.18)` : "0 2px 12px rgba(0,0,0,0.4)",
          transition: "all 0.22s ease",
          cursor: "pointer",
          transform: hover ? "translateY(-4px)" : "none",
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <div style={{ background: img ? "#1a1a1a" : `linear-gradient(135deg, rgba(201,168,76,0.12), rgba(201,168,76,0.03))`, height: 160, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
          {img ? (
            <img src={img} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease", transform: hover ? "scale(1.06)" : "scale(1)" }} />
          ) : (
            <HandHeart size={40} color={NP_GOLD} style={{ opacity: 0.4 }} />
          )}
          <span style={{ position: "absolute", top: 10, left: 10, background: NP_GOLD, color: "#000", fontSize: 9, fontWeight: 900, padding: "3px 8px", borderRadius: 99, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            🤝 NON-PROFIT
          </span>
          {onSale && !outOfStock && (
            <span style={{ position: "absolute", top: 10, right: 10, background: "#fff", color: "#000", fontSize: 10, fontWeight: 900, padding: "3px 8px", borderRadius: 99 }}>
              SALE
            </span>
          )}
          {outOfStock && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: 13 }}>Sold Out</span>
            </div>
          )}
        </div>
        <div style={{ padding: "16px 16px 18px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <p style={{ fontSize: 10, fontWeight: 800, color: NP_GOLD, letterSpacing: "0.15em", textTransform: "uppercase", margin: 0 }}>
            {product.categoryName || "Non-Profit"}
          </p>
          <h4 style={{ fontSize: 15, fontWeight: 800, color: "#fff", lineHeight: 1.3, flex: 1, margin: 0 }}>
            {product.name}
          </h4>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: NP_GOLD }}>${product.price.toFixed(2)}</span>
            {onSale && (
              <span style={{ fontSize: 13, color: "#666", textDecoration: "line-through" }}>
                ${product.comparePrice!.toFixed(2)}
              </span>
            )}
          </div>
          {/* Gift split mini-bar — only for monetary gift/donation products */}
          {product.isDonation && (() => {
            const charityPct = Math.round(parseFloat(String(product.giftCharityPercent ?? "80")) || 80);
            const memberPct  = 100 - charityPct;
            return (
              <div style={{ marginTop: 4 }}>
                <div style={{ display: "flex", borderRadius: 99, overflow: "hidden", height: 5, background: "rgba(255,255,255,0.08)" }}>
                  <div style={{ width: `${charityPct}%`, background: NP_GOLD, transition: "width 0.2s" }} />
                  <div style={{ flex: 1, background: "rgba(255,255,255,0.12)" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3, fontSize: 9, color: "#7a7a7a", fontWeight: 700, letterSpacing: "0.05em" }}>
                  <span style={{ color: NP_GOLD }}>🤝 {charityPct}% → Org</span>
                  <span>🔗 {memberPct}% → Network</span>
                </div>
              </div>
            );
          })()}
          <button
            disabled={outOfStock || adding}
            onClick={(e) => onAdd(e, product.id)}
            style={{
              marginTop: 8,
              width: "100%",
              padding: "10px 0",
              background: hover && !outOfStock ? NP_GOLD : "transparent",
              color: outOfStock ? "#555" : hover ? "#000" : NP_GOLD,
              border: `1.5px solid ${outOfStock ? "#333" : NP_GOLD}`,
              borderRadius: 8,
              fontWeight: 800,
              fontSize: 13,
              cursor: outOfStock ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              transition: "all 0.18s ease",
            }}
          >
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart size={14} />}
            {outOfStock ? "Sold Out" : "Add to Cart"}
          </button>
        </div>
      </div>
    </Link>
  );
}

function WeddingProductCard({
  product,
  onAdd,
  adding,
}: {
  product: Product;
  onAdd: (e: React.MouseEvent, id: number) => void;
  adding: boolean;
}) {
  const [hover, setHover] = useState(false);
  const img = resolveImageSrc(product.image);
  const outOfStock = product.stock === 0;
  const onSale = product.comparePrice && product.comparePrice > product.price;
  const ROSE = "#e11d7a";
  const ROSE_DIM = "rgba(225,29,122,0.12)";

  return (
    <Link href={`/product/${product.slug}`}>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          background: hover ? "#fff7fb" : "#fff",
          border: `1.5px solid ${hover ? ROSE : "rgba(225,29,122,0.22)"}`,
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: hover ? `0 12px 36px rgba(225,29,122,0.14)` : "0 2px 8px rgba(0,0,0,0.07)",
          transition: "all 0.22s ease",
          cursor: "pointer",
          transform: hover ? "translateY(-4px)" : "none",
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <div style={{ background: img ? "#fdf2f8" : `linear-gradient(135deg, ${ROSE_DIM}, rgba(225,29,122,0.04))`, height: 160, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
          {img ? (
            <img src={img} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease", transform: hover ? "scale(1.06)" : "scale(1)" }} />
          ) : (
            <Gem size={40} color={ROSE} style={{ opacity: 0.35 }} />
          )}
          <span style={{ position: "absolute", top: 10, left: 10, background: ROSE, color: "#fff", fontSize: 9, fontWeight: 900, padding: "3px 8px", borderRadius: 99, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            🎉 REGISTRY
          </span>
          {onSale && !outOfStock && (
            <span style={{ position: "absolute", top: 10, right: 10, background: ROSE, color: "#fff", fontSize: 10, fontWeight: 900, padding: "3px 8px", borderRadius: 99 }}>
              SALE
            </span>
          )}
          {outOfStock && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "rgba(255,255,255,0.85)", fontWeight: 600, fontSize: 13 }}>Sold Out</span>
            </div>
          )}
        </div>
        <div style={{ padding: "16px 16px 18px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <p style={{ fontSize: 10, fontWeight: 800, color: ROSE, letterSpacing: "0.15em", textTransform: "uppercase", margin: 0 }}>
            {product.weddingRegistryCategory || product.categoryName || "Special Events Registry"}
          </p>
          <h4 style={{ fontSize: 15, fontWeight: 800, color: "#1a1a1a", lineHeight: 1.3, flex: 1, margin: 0 }}>
            {product.name}
          </h4>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: ROSE }}>${product.price.toFixed(2)}</span>
            {onSale && (
              <span style={{ fontSize: 13, color: "#aaa", textDecoration: "line-through" }}>
                ${product.comparePrice!.toFixed(2)}
              </span>
            )}
          </div>
          <button
            disabled={outOfStock || adding}
            onClick={(e) => onAdd(e, product.id)}
            style={{
              marginTop: 8,
              width: "100%",
              padding: "10px 0",
              background: hover && !outOfStock ? ROSE : "transparent",
              color: outOfStock ? "#bbb" : hover ? "#fff" : ROSE,
              border: `1.5px solid ${outOfStock ? "#e5e7eb" : ROSE}`,
              borderRadius: 8,
              fontWeight: 800,
              fontSize: 13,
              cursor: outOfStock ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              transition: "all 0.18s ease",
            }}
          >
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart size={14} />}
            {outOfStock ? "Sold Out" : "Add to Cart"}
          </button>
        </div>
      </div>
    </Link>
  );
}

function HolidayProductCard({
  product,
  onAdd,
  adding,
}: {
  product: Product;
  onAdd: (e: React.MouseEvent, id: number) => void;
  adding: boolean;
}) {
  const [hover, setHover] = useState(false);
  const img = resolveImageSrc(product.image);
  const outOfStock = product.stock === 0;
  const onSale = product.comparePrice && product.comparePrice > product.price;
  const AMBER = "#d97706";
  const AMBER_DIM = "rgba(217,119,6,0.12)";

  return (
    <Link href={`/product/${product.slug}`}>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          background: hover ? "#fffbeb" : "#fff",
          border: `1.5px solid ${hover ? AMBER : "rgba(217,119,6,0.25)"}`,
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: hover ? `0 12px 36px rgba(217,119,6,0.15)` : "0 2px 8px rgba(0,0,0,0.07)",
          transition: "all 0.22s ease",
          cursor: "pointer",
          transform: hover ? "translateY(-4px)" : "none",
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <div style={{ background: img ? "#fef3c7" : `linear-gradient(135deg, ${AMBER_DIM}, rgba(217,119,6,0.04))`, height: 160, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
          {img ? (
            <img src={img} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease", transform: hover ? "scale(1.06)" : "scale(1)" }} />
          ) : (
            <Star size={40} color={AMBER} style={{ opacity: 0.35 }} />
          )}
          <span style={{ position: "absolute", top: 10, left: 10, background: AMBER, color: "#fff", fontSize: 9, fontWeight: 900, padding: "3px 8px", borderRadius: 99, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            🎄 HOLIDAY
          </span>
          {onSale && !outOfStock && (
            <span style={{ position: "absolute", top: 10, right: 10, background: AMBER, color: "#fff", fontSize: 10, fontWeight: 900, padding: "3px 8px", borderRadius: 99 }}>
              SALE
            </span>
          )}
          {outOfStock && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "rgba(255,255,255,0.85)", fontWeight: 600, fontSize: 13 }}>Sold Out</span>
            </div>
          )}
        </div>
        <div style={{ padding: "16px 16px 18px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <p style={{ fontSize: 10, fontWeight: 800, color: AMBER, letterSpacing: "0.15em", textTransform: "uppercase", margin: 0 }}>
            {(product as any).holidayCategory || product.categoryName || "Holiday & Special Occasions"}
          </p>
          <h4 style={{ fontSize: 15, fontWeight: 800, color: "#1a1a1a", lineHeight: 1.3, flex: 1, margin: 0 }}>
            {product.name}
          </h4>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: AMBER }}>${product.price.toFixed(2)}</span>
            {onSale && (
              <span style={{ fontSize: 13, color: "#aaa", textDecoration: "line-through" }}>
                ${product.comparePrice!.toFixed(2)}
              </span>
            )}
          </div>
          <button
            disabled={outOfStock || adding}
            onClick={(e) => onAdd(e, product.id)}
            style={{
              marginTop: 8,
              width: "100%",
              padding: "10px 0",
              background: hover && !outOfStock ? AMBER : "transparent",
              color: outOfStock ? "#bbb" : hover ? "#fff" : AMBER,
              border: `1.5px solid ${outOfStock ? "#e5e7eb" : AMBER}`,
              borderRadius: 8,
              fontWeight: 800,
              fontSize: 13,
              cursor: outOfStock ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              transition: "all 0.18s ease",
            }}
          >
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart size={14} />}
            {outOfStock ? "Sold Out" : "Add to Cart"}
          </button>
        </div>
      </div>
    </Link>
  );
}

function SportsProductCard({
  product,
  onAdd,
  adding,
}: {
  product: Product;
  onAdd: (e: React.MouseEvent, id: number) => void;
  adding: boolean;
}) {
  const [hover, setHover] = useState(false);
  const img = resolveImageSrc(product.image);
  const outOfStock = product.stock === 0;
  const onSale = product.comparePrice && product.comparePrice > product.price;

  return (
    <Link href={`/product/${product.slug}`}>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          background: hover ? "#1c1c1c" : "#141414",
          border: `1.5px solid ${hover ? GOLD : "rgba(201,168,76,0.25)"}`,
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: hover ? `0 12px 36px rgba(201,168,76,0.18)` : "0 2px 12px rgba(0,0,0,0.4)",
          transition: "all 0.22s ease",
          cursor: "pointer",
          transform: hover ? "translateY(-4px)" : "none",
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        {/* Image */}
        <div style={{ background: img ? "#1a1a1a" : "linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05))", height: 160, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
          {img ? (
            <img src={img} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease", transform: hover ? "scale(1.06)" : "scale(1)" }} />
          ) : (
            <Trophy size={40} color={GOLD} style={{ opacity: 0.35 }} />
          )}
          {/* Gold SPORTS badge */}
          <span style={{ position: "absolute", top: 10, left: 10, background: GOLD, color: "#000", fontSize: 9, fontWeight: 900, padding: "3px 8px", borderRadius: 99, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            🏆 SPORTS
          </span>
          {onSale && !outOfStock && (
            <span style={{ position: "absolute", top: 10, right: 10, background: "#fff", color: "#000", fontSize: 10, fontWeight: 900, padding: "3px 8px", borderRadius: 99 }}>
              SALE
            </span>
          )}
          {outOfStock && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: 13 }}>Sold Out</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: "16px 16px 18px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <p style={{ fontSize: 10, fontWeight: 800, color: GOLD, letterSpacing: "0.15em", textTransform: "uppercase", margin: 0 }}>
            {product.categoryName || "NFGN Sports"}
          </p>
          <h4 style={{ fontSize: 15, fontWeight: 800, color: "#fff", lineHeight: 1.3, flex: 1, margin: 0 }}>
            {product.name}
          </h4>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: GOLD }}>${product.price.toFixed(2)}</span>
            {onSale && (
              <span style={{ fontSize: 13, color: "#666", textDecoration: "line-through" }}>
                ${product.comparePrice!.toFixed(2)}
              </span>
            )}
          </div>
          <button
            disabled={outOfStock || adding}
            onClick={(e) => onAdd(e, product.id)}
            style={{
              marginTop: 8,
              width: "100%",
              padding: "10px 0",
              background: hover && !outOfStock ? GOLD : "transparent",
              color: outOfStock ? "#555" : hover ? "#000" : GOLD,
              border: `1.5px solid ${outOfStock ? "#333" : GOLD}`,
              borderRadius: 8,
              fontWeight: 800,
              fontSize: 13,
              cursor: outOfStock ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              transition: "all 0.18s ease",
            }}
          >
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart size={14} />}
            {outOfStock ? "Sold Out" : "Add to Cart"}
          </button>
        </div>
      </div>
    </Link>
  );
}

function SaleCard({ product }: { product: Product }) {
  const [hover, setHover] = useState(false);
  const savings = ((product.comparePrice! - product.price) / product.comparePrice! * 100).toFixed(0);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? GREY_800 : "#1c1c1c",
        border: `1.5px solid ${hover ? GREY_600 : GREY_800}`,
        borderRadius: 12,
        padding: "20px 18px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        transform: hover ? "scale(1.02)" : "none",
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 10,
          background: "rgba(201,168,76,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: GOLD,
          flexShrink: 0,
          fontSize: 20,
          fontWeight: 900,
        }}
      >
        %
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: GREY_400, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 3px" }}>
          On Sale Now
        </p>
        <h4 style={{ color: WHITE, fontSize: 14, fontWeight: 800, margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {product.name}
        </h4>
        <span
          style={{
            background: GOLD,
            color: "#000",
            fontSize: 11,
            fontWeight: 900,
            padding: "3px 10px",
            borderRadius: 99,
          }}
        >
          {savings}% OFF
        </span>
      </div>
      <ChevronRight size={18} color={GREY_400} />
    </div>
  );
}
