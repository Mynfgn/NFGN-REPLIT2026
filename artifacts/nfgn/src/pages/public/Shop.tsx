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
  HandHeart, Coins, Church, Flower2,
} from "lucide-react";
import { useCartStore } from "@/hooks/use-cart-store";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { customFetch } from "@/lib/custom-fetch";

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
  isDonation?: boolean | null;
  isChurchDonation?: boolean | null;
  donationMinAmount?: number | null;
  donationRecipientType?: string | null;
  donationRecipientName?: string | null;
  churchName?: string | null;
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
};

function categorySlugFromName(name?: string | null): string {
  if (!name) return "";
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const FALLBACK_BANNER_ITEMS = [
  "Find out how you can \"GET PAID TO LOSE WEIGHT!\"",
  "Become A Member For FREE!",
  "SALE!! 1 Month Free Pro Membership with the purchase of IGNITE PRO XL.",
];

function TickerBar() {
  const { data: banners } = useQuery<{ id: number; message: string }[]>({
    queryKey: ["/api/banners"],
    queryFn: () => customFetch("/api/banners").then(r => r.json()),
    staleTime: 60000,
  });

  const items = banners && banners.length > 0
    ? banners.map(b => b.message)
    : FALLBACK_BANNER_ITEMS;

  return (
    <div style={{ background: GOLD, overflow: "hidden", padding: "20px 0" }}>
      <div
        style={{
          display: "flex",
          gap: 72,
          whiteSpace: "nowrap",
          animation: "ticker 24s linear infinite",
        }}
      >
        {[...items, ...items].map((item, i) => (
          <span
            key={i}
            style={{
              color: "#fff",
              fontSize: 20,
              fontWeight: 800,
              display: "inline-flex",
              alignItems: "center",
              gap: 16,
              textShadow: "0 1px 4px rgba(0,0,0,0.3)",
            }}
          >
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>✦</span> {item}
          </span>
        ))}
      </div>
      <style>{`@keyframes ticker { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
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
  onAdd,
  adding,
}: {
  pkg: ProPackage;
  matchedProduct: Product | null;
  onAdd: (e: React.MouseEvent, id: number) => void;
  adding: boolean;
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
        <Link href="/join">
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
            <Shield size={15} /> Get Started
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

export function Shop() {
  const search = useSearch();
  const fromAdmin = new URLSearchParams(search).get("from") === "admin";

  const { data, isLoading } = useListProducts({ limit: 100 });
  const { setCartOpen } = useCartStore();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const [addingId, setAddingId] = useState<number | null>(null);
  const [proPackages, setProPackages] = useState<ProPackage[]>([]);
  const [proPackagesLoading, setProPackagesLoading] = useState(true);

  useEffect(() => {
    setProPackagesLoading(true);
    fetch("/api/pro-packages")
      .then((r) => r.json())
      .then((data: ProPackage[]) => setProPackages(Array.isArray(data) ? data : []))
      .catch(() => setProPackages([]))
      .finally(() => setProPackagesLoading(false));
  }, []);

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
  const churchDonationProducts = products.filter((p) => p.isChurchDonation && !p.isProPackage);
  const regularProducts = products.filter((p) => !p.isProPackage && !p.isSports && !p.isNonProfit && !p.isWeddingRegistry && !p.isChurchDonation);

  // Resolve which real product to use for a package card's "Add to Cart" button.
  // Prefer the admin-configured direct product link (productId); fall back to
  // fuzzy price matching (within 25% tolerance) when no link is set.
  function resolveProProduct(pkg: ProPackage): Product | null {
    if (pkg.productId != null) {
      const direct = products.find((p) => p.id === pkg.productId);
      if (direct) return direct;
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
    return best;
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
                const matched = resolveProProduct(pkg);
                return (
                  <ProPackageCard
                    key={pkg.id}
                    pkg={pkg}
                    matchedProduct={matched}
                    onAdd={handleAddToCart}
                    adding={addingId === matched?.id}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── ZONE 3: GOLD — Ticker ────────────────────────── */}
      <TickerBar />

      {/* ── Specials ─────────────────────────────────────── */}
      {saleProducts.length > 0 && (
        <div style={{ background: "linear-gradient(135deg, #1a1200, #0a0a0a)", padding: "56px 0", borderTop: "1px solid rgba(201,168,76,0.25)" }}>
          <div className="px-4 md:px-8" style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32, flexWrap: "wrap" }}>
              <Zap size={22} color={GOLD} />
              <h2 style={{ color: "#fff", fontSize: 28, fontWeight: 900, margin: 0, fontFamily: "serif" }}>
                Current Specials & Sales
              </h2>
              <span
                style={{
                  background: GOLD,
                  color: "#000",
                  fontSize: 11,
                  fontWeight: 800,
                  padding: "4px 12px",
                  borderRadius: 99,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
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
          {/* Background field pattern */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(201,168,76,0.04) 39px, rgba(201,168,76,0.04) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(201,168,76,0.04) 39px, rgba(201,168,76,0.04) 40px)", pointerEvents: "none" }} />
          {/* Glow orbs */}
          <div style={{ position: "absolute", top: -80, left: "10%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.12), transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -60, right: "8%", width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.08), transparent 70%)", pointerEvents: "none" }} />

          <div className="px-4 md:px-8" style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
            {/* Section header */}
            <div style={{ marginBottom: 48 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 16, background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.35)", padding: "6px 16px", borderRadius: 99 }}>
                <Trophy size={13} color={GOLD} />
                <span style={{ color: GOLD, fontSize: 11, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase" }}>NFGN SPORTS</span>
              </div>
              <h2 style={{ color: "#fff", fontSize: "clamp(30px, 5vw, 46px)", fontWeight: 900, margin: "0 0 12px", fontFamily: "serif", lineHeight: 1.1 }}>
                Game On. <span style={{ color: GOLD }}>Compete. Win.</span>
              </h2>
              <p style={{ color: "#a0a0a0", fontSize: 16, maxWidth: 560, margin: 0 }}>
                Tournaments, entry fees, sponsorships, concessions, skills camps, personal training, and more — all powered by NFGN.
              </p>
              {/* Sports category pills */}
              <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
                {[
                  { icon: <Ticket size={11} />, label: "Tournament Tickets" },
                  { icon: <Trophy size={11} />, label: "Entry Fees" },
                  { icon: <Award size={11} />, label: "Sponsorships" },
                  { icon: <Utensils size={11} />, label: "Concessions & Food" },
                  { icon: <Dumbbell size={11} />, label: "Skills & Training" },
                ].map(tag => (
                  <span key={tag.label} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", color: GOLD, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 99, letterSpacing: "0.04em" }}>
                    {tag.icon} {tag.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Sports product grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {sportsProducts.map(p => (
                <SportsProductCard
                  key={p.id}
                  product={p}
                  onAdd={handleAddToCart}
                  adding={addingId === p.id}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── NON-PROFIT ORGANIZATIONS ──────────────────────── */}
      {nonProfitProducts.length > 0 && (
        <div style={{ background: "linear-gradient(135deg, #0d0d1a 0%, #111128 50%, #0d0d1f 100%)", padding: "72px 0", borderTop: "3px solid #6366f1", borderBottom: "3px solid #6366f1", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(99,102,241,0.04) 39px, rgba(99,102,241,0.04) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(99,102,241,0.04) 39px, rgba(99,102,241,0.04) 40px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: -80, right: "8%", width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -60, left: "6%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.09), transparent 70%)", pointerEvents: "none" }} />

          <div className="px-4 md:px-8" style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
            <div style={{ marginBottom: 48 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 16, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.35)", padding: "6px 16px", borderRadius: 99 }}>
                <HandHeart size={13} color="#6366f1" />
                <span style={{ color: "#6366f1", fontSize: 11, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase" }}>NON-PROFIT ORGANIZATIONS</span>
              </div>
              <h2 style={{ color: "#fff", fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 900, margin: "0 0 12px", fontFamily: "serif", lineHeight: 1.1 }}>
                Give Back. <span style={{ color: "#6366f1" }}>Support. Unite.</span>
              </h2>
              <p style={{ color: "#a0a0a0", fontSize: 16, maxWidth: 560, margin: 0 }}>
                Products, events, and services that support non-profit causes — every purchase makes a difference in the community.
              </p>
              <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
                {[
                  { icon: <Heart size={11} />, label: "Community Support" },
                  { icon: <HandHeart size={11} />, label: "Charitable Events" },
                  { icon: <Users size={11} />, label: "Organization Fundraisers" },
                  { icon: <Coins size={11} />, label: "Donation Drives" },
                ].map(tag => (
                  <span key={tag.label} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(99,102,241,0.10)", border: "1px solid rgba(99,102,241,0.25)", color: "#6366f1", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 99, letterSpacing: "0.04em" }}>
                    {tag.icon} {tag.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {nonProfitProducts.map(p => (
                <NonProfitProductCard
                  key={p.id}
                  product={p}
                  onAdd={handleAddToCart}
                  adding={addingId === p.id}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── CHURCH GIVING ──────────────────────────────────── */}
      {churchDonationProducts.length > 0 && (
        <div style={{ background: "linear-gradient(135deg, #0f0b04 0%, #161208 50%, #120e05 100%)", padding: "72px 0", borderTop: `3px solid ${GOLD}`, borderBottom: `3px solid ${GOLD}`, position: "relative", overflow: "hidden" }}>
          {/* Cross pattern overlay */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(201,168,76,0.04) 39px, rgba(201,168,76,0.04) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(201,168,76,0.04) 39px, rgba(201,168,76,0.04) 40px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: -90, right: "6%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.12), transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -60, left: "8%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(180,83,9,0.10), transparent 70%)", pointerEvents: "none" }} />

          <div className="px-4 md:px-8" style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
            <div style={{ marginBottom: 48 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 16, background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.35)", padding: "6px 16px", borderRadius: 99 }}>
                <Church size={13} color={GOLD} />
                <span style={{ color: GOLD, fontSize: 11, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase" }}>Church Giving</span>
              </div>
              <h2 style={{ color: "#fff", fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 900, margin: "0 0 12px", fontFamily: "serif", lineHeight: 1.1 }}>
                Give to Your <span style={{ color: GOLD }}>Church.</span>
              </h2>
              <p style={{ color: "#9a9a9a", fontSize: 16, maxWidth: 580, margin: 0, lineHeight: 1.6 }}>
                Support your church community directly through your NFGN account. Choose any amount at or above the minimum — every dollar goes straight to your house of worship.
              </p>
              <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
                {[
                  { icon: <Church size={11} />, label: "Direct Church Giving" },
                  { icon: <Heart size={11} />, label: "Community Support" },
                  { icon: <HandHeart size={11} />, label: "Choose Your Amount" },
                  { icon: <Shield size={11} />, label: "Members Only" },
                ].map(tag => (
                  <span key={tag.label} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(201,168,76,0.10)", border: "1px solid rgba(201,168,76,0.28)", color: GOLD, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 99, letterSpacing: "0.04em" }}>
                    {tag.icon} {tag.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {churchDonationProducts.map(p => (
                <ChurchDonationCard
                  key={p.id}
                  product={p}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── WEDDING REGISTRY ──────────────────────────────── */}
      {weddingProducts.length > 0 && (
        <div style={{ background: "linear-gradient(135deg, #fff7fb 0%, #fdf2f8 50%, #fff5fa 100%)", padding: "72px 0", borderTop: "3px solid #e11d7a", borderBottom: "3px solid #e11d7a", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(225,29,122,0.03) 39px, rgba(225,29,122,0.03) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(225,29,122,0.03) 39px, rgba(225,29,122,0.03) 40px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: -60, left: "12%", width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(225,29,122,0.10), transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -50, right: "10%", width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(225,29,122,0.07), transparent 70%)", pointerEvents: "none" }} />

          <div className="px-4 md:px-8" style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
            <div style={{ marginBottom: 48 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 16, background: "rgba(225,29,122,0.09)", border: "1px solid rgba(225,29,122,0.30)", padding: "6px 16px", borderRadius: 99 }}>
                <Gem size={13} color="#e11d7a" />
                <span style={{ color: "#e11d7a", fontSize: 11, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase" }}>WEDDING REGISTRY</span>
              </div>
              <h2 style={{ color: "#1a1a1a", fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 900, margin: "0 0 12px", fontFamily: "serif", lineHeight: 1.1 }}>
                Celebrate Love. <span style={{ color: "#e11d7a" }}>Gift Perfectly.</span>
              </h2>
              <p style={{ color: "#6b7280", fontSize: 16, maxWidth: 560, margin: 0 }}>
                Curated wedding registry products and services — thoughtful gifts and wellness experiences for life's most special day.
              </p>
              <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
                {[
                  { icon: <Heart size={11} />, label: "Gift Ideas" },
                  { icon: <Gem size={11} />, label: "Luxury Items" },
                  { icon: <Flower2 size={11} />, label: "Wellness Gifts" },
                  { icon: <Church size={11} />, label: "Ceremony Services" },
                ].map(tag => (
                  <span key={tag.label} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(225,29,122,0.07)", border: "1px solid rgba(225,29,122,0.22)", color: "#e11d7a", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 99, letterSpacing: "0.04em" }}>
                    {tag.icon} {tag.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {weddingProducts.map(p => (
                <WeddingProductCard
                  key={p.id}
                  product={p}
                  onAdd={handleAddToCart}
                  adding={addingId === p.id}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ZONE 2: WHITE — All Products ─────────────────── */}
      <div id="products" style={{ background: GREY_50, padding: "72px 0" }}>
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
            <>
              {grouped.map(({ group, products: gProducts }) => (
                <CategorySection
                  key={group.key}
                  group={group}
                  products={gProducts}
                  onAdd={handleAddToCart}
                  addingId={addingId}
                />
              ))}

              {uncategorized.length > 0 && (
                <CategorySection
                  group={{
                    key: "other",
                    label: "More Products",
                    icon: <Sparkles className="h-5 w-5" />,
                    accentColor: GOLD,
                    description: "Additional wellness offerings from NFGN.",
                    slugs: [],
                  }}
                  products={uncategorized}
                  onAdd={handleAddToCart}
                  addingId={addingId}
                />
              )}

              {products.length === 0 && (
                <div style={{ textAlign: "center", padding: "80px 0" }}>
                  <div style={{ fontSize: 56, marginBottom: 16, opacity: 0.2, color: GOLD }}>✦</div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", marginBottom: 8 }}>No products yet</h3>
                  <p style={{ color: GREY_600 }}>Check back soon — the marketplace is being stocked.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

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
    </div>
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
  const INDIGO = "#6366f1";
  const INDIGO_DIM = "rgba(99,102,241,0.18)";

  return (
    <Link href={`/product/${product.slug}`}>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          background: hover ? "#1a1a2e" : "#13131f",
          border: `1.5px solid ${hover ? INDIGO : "rgba(99,102,241,0.28)"}`,
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: hover ? `0 12px 36px rgba(99,102,241,0.22)` : "0 2px 12px rgba(0,0,0,0.4)",
          transition: "all 0.22s ease",
          cursor: "pointer",
          transform: hover ? "translateY(-4px)" : "none",
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <div style={{ background: img ? "#1a1a1a" : `linear-gradient(135deg, ${INDIGO_DIM}, rgba(99,102,241,0.05))`, height: 160, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
          {img ? (
            <img src={img} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease", transform: hover ? "scale(1.06)" : "scale(1)" }} />
          ) : (
            <HandHeart size={40} color={INDIGO} style={{ opacity: 0.4 }} />
          )}
          <span style={{ position: "absolute", top: 10, left: 10, background: INDIGO, color: "#fff", fontSize: 9, fontWeight: 900, padding: "3px 8px", borderRadius: 99, letterSpacing: "0.12em", textTransform: "uppercase" }}>
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
          <p style={{ fontSize: 10, fontWeight: 800, color: INDIGO, letterSpacing: "0.15em", textTransform: "uppercase", margin: 0 }}>
            {product.categoryName || "Non-Profit"}
          </p>
          <h4 style={{ fontSize: 15, fontWeight: 800, color: "#fff", lineHeight: 1.3, flex: 1, margin: 0 }}>
            {product.name}
          </h4>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: INDIGO }}>${product.price.toFixed(2)}</span>
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
              background: hover && !outOfStock ? INDIGO : "transparent",
              color: outOfStock ? "#555" : hover ? "#fff" : INDIGO,
              border: `1.5px solid ${outOfStock ? "#333" : INDIGO}`,
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
            💍 REGISTRY
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
            {product.categoryName || "Wedding Registry"}
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
