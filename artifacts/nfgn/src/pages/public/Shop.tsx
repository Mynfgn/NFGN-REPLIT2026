import { useListProducts, useAddToCart } from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearch } from "wouter";
import { resolveImageSrc } from "@/lib/image";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShoppingCart, Loader2, Leaf, Sparkles, Flame, BookOpen,
  ChevronRight, Package, BadgeCheck, Check, ArrowRight,
  Users, TrendingUp, Star, Gift, Shield, Zap, ArrowLeft,
} from "lucide-react";
import { useCartStore } from "@/hooks/use-cart-store";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { customFetch } from "@/lib/custom-fetch";

const GOLD = "#C9A84C";
const GOLD_MUTED = "rgba(201,168,76,0.75)";

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
    accentColor: "#8B5CF6",
    description: "Handmade natural soaps, body lotions, and nourishing skin-care oils crafted with love.",
    slugs: ["soaps-body-care", "lotions-oils"],
  },
  {
    key: "candles",
    label: "Aromatherapy Candles",
    icon: <Flame className="h-5 w-5" />,
    accentColor: "#E07B54",
    description: "Therapeutic aromatics and hand-poured candles to create calm, focus, and healing spaces.",
    slugs: ["candles-aromatics"],
  },
  {
    key: "books",
    label: "Books & Education",
    icon: <BookOpen className="h-5 w-5" />,
    accentColor: "#3B82F6",
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
          background: hover ? "#f8f9fa" : "#fff",
          border: `1.5px solid ${hover ? accentColor : "#e5e7eb"}`,
          borderRadius: 10,
          overflow: "hidden",
          boxShadow: hover ? `0 8px 28px rgba(0,0,0,0.10)` : "0 2px 8px rgba(0,0,0,0.05)",
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
          <h4 style={{ fontSize: 14, fontWeight: 700, color: "#111", lineHeight: 1.3, flex: 1, margin: 0 }}>
            {product.name}
          </h4>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: 17, fontWeight: 900, color: "#111" }}>${product.price.toFixed(2)}</span>
            {onSale && (
              <span style={{ fontSize: 13, color: "#9ca3af", textDecoration: "line-through" }}>
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
              color: outOfStock ? "#9ca3af" : hover ? "#fff" : accentColor,
              border: `1.5px solid ${outOfStock ? "#e5e7eb" : accentColor}`,
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
        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, textDecoration: "line-through" }}>
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
            <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>{perk}</span>
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
          borderBottom: "2px solid #f3f4f6",
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
          <h3 style={{ color: "#111", fontSize: 22, fontWeight: 900, margin: 0, fontFamily: "serif" }}>
            {group.label}
          </h3>
          <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>{group.description}</p>
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
        qc.invalidateQueries({ queryKey: ["getCart"] });
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
  const regularProducts = products.filter((p) => !p.isProPackage);

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
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "64px 32px 72px", textAlign: "center" }}>
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
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 18, maxWidth: 500, margin: "0 auto 32px" }}>
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
      <div style={{ background: "#0a0a0a", padding: "64px 0 80px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
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

      {/* ── ZONE 2: WHITE — All Products ─────────────────── */}
      <div id="products" style={{ background: "#fff", padding: "72px 0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <p style={{ color: GOLD, fontSize: 12, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>
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
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: "#111", marginBottom: 8 }}>No products yet</h3>
                  <p style={{ color: "#6b7280" }}>Check back soon — the marketplace is being stocked.</p>
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
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 32px", textAlign: "center", position: "relative" }}>
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
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 17, marginBottom: 32, lineHeight: 1.6 }}>
            Earn commissions, access exclusive products, build your network, and transform lives — including your own.
          </p>
          <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap", marginBottom: 36 }}>
            {["Commission Eligible", "Network Access", "Pro Pricing", "Training Included"].map((b) => (
              <div key={b} style={{ display: "flex", alignItems: "center", gap: 6, color: "#fff", fontSize: 14 }}>
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
      <div style={{ background: "#0a0a0a", padding: "28px 32px", borderTop: "1px solid rgba(201,168,76,0.2)" }}>
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
              <div style={{ color: "#fff", fontSize: 22, fontWeight: 900 }}>{s.stat}</div>
              <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
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
        background: hover ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.07)",
        border: `1.5px solid ${hover ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.12)"}`,
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
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 3px" }}>
          On Sale Now
        </p>
        <h4 style={{ color: "#fff", fontSize: 14, fontWeight: 800, margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
      <ChevronRight size={18} color="rgba(255,255,255,0.4)" />
    </div>
  );
}
