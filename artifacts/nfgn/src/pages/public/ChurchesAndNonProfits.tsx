import { useListProducts, useAddToCart } from "@workspace/api-client-react";
import { Link } from "wouter";
import { resolveImageSrc } from "@/lib/image";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Church, HandHeart, Heart, Shield, Coins, Users, ShoppingCart,
  Loader2, ArrowRight, Sparkles,
} from "lucide-react";
import { useCartStore } from "@/hooks/use-cart-store";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";

const GOLD = "#C9A84C";
const AMBER_LIGHT = "#C9A84C";

type Product = {
  id: number;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number | null;
  image?: string | null;
  categoryName?: string | null;
  isNonProfit?: boolean | null;
  isChurchDonation?: boolean | null;
  isDonation?: boolean | null;
  donationRecipientName?: string | null;
  donationMinAmount?: number | null;
  churchName?: string | null;
  giftCharityPercent?: string | number | null;
  stock?: number | null;
  description?: string | null;
};

function ChurchCard({ product }: { product: Product }) {
  const [hover, setHover] = useState(false);
  const img = resolveImageSrc(product.image);
  const minAmount = product.donationMinAmount ?? 1;
  const charityPct = Math.round(parseFloat(String(product.giftCharityPercent ?? "80")) || 80);
  const memberPct = 100 - charityPct;

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
        <div style={{ background: img ? "#1a1a1a" : `linear-gradient(135deg, rgba(180,83,9,0.18), rgba(201,168,76,0.08))`, height: 170, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
          {img ? (
            <img src={img} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease", transform: hover ? "scale(1.07)" : "scale(1)" }} />
          ) : (
            <Church size={48} color={AMBER_LIGHT} style={{ opacity: 0.45 }} />
          )}
          <span style={{ position: "absolute", top: 10, left: 10, background: AMBER_LIGHT, color: "#000", fontSize: 9, fontWeight: 900, padding: "3px 9px", borderRadius: 99, letterSpacing: "0.13em", textTransform: "uppercase" }}>
            ⛪ Church Giving
          </span>
          <span style={{ position: "absolute", bottom: 10, right: 10, background: "rgba(0,0,0,0.72)", color: AMBER_LIGHT, fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 99, border: `1px solid rgba(201,168,76,0.4)`, backdropFilter: "blur(4px)" }}>
            Min ${minAmount.toFixed(2)}
          </span>
        </div>
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
          <div style={{ marginTop: 4 }}>
            <div style={{ display: "flex", borderRadius: 99, overflow: "hidden", height: 6, background: "rgba(255,255,255,0.08)" }}>
              <div style={{ width: `${charityPct}%`, background: AMBER_LIGHT }} />
              <div style={{ flex: 1, background: "rgba(255,255,255,0.15)" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3, fontSize: 9, color: "#7a7a7a", fontWeight: 700, letterSpacing: "0.05em" }}>
              <span style={{ color: AMBER_LIGHT }}>⛪ {charityPct}% → Church</span>
              <span>🔗 {memberPct}% → Network</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
            <span style={{ fontSize: 13, color: "#9a9a9a" }}>Starting at</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: AMBER_LIGHT }}>${minAmount.toFixed(2)}</span>
          </div>
          <div
            style={{
              marginTop: 8, width: "100%", padding: "10px 0",
              background: hover ? AMBER_LIGHT : "transparent",
              color: hover ? "#000" : AMBER_LIGHT,
              border: `1.5px solid ${AMBER_LIGHT}`,
              borderRadius: 8, fontWeight: 800, fontSize: 13, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
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

function NonProfitCard({
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
  const charityPct = product.isDonation ? Math.round(parseFloat(String(product.giftCharityPercent ?? "80")) || 80) : null;
  const memberPct = charityPct != null ? 100 - charityPct : null;

  return (
    <Link href={`/product/${product.slug}`}>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          background: hover ? "#151208" : "#0f0d08",
          border: `1.5px solid ${hover ? GOLD : "rgba(201,168,76,0.22)"}`,
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
            <HandHeart size={40} color={GOLD} style={{ opacity: 0.4 }} />
          )}
          <span style={{ position: "absolute", top: 10, left: 10, background: GOLD, color: "#000", fontSize: 9, fontWeight: 900, padding: "3px 8px", borderRadius: 99, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            🤝 NON-PROFIT
          </span>
          {outOfStock && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: 13 }}>Sold Out</span>
            </div>
          )}
        </div>
        <div style={{ padding: "16px 16px 18px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <p style={{ fontSize: 10, fontWeight: 800, color: GOLD, letterSpacing: "0.15em", textTransform: "uppercase", margin: 0 }}>
            {product.donationRecipientName || product.categoryName || "Non-Profit"}
          </p>
          <h4 style={{ fontSize: 15, fontWeight: 800, color: "#fff", lineHeight: 1.3, flex: 1, margin: 0 }}>
            {product.name}
          </h4>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: GOLD }}>
              {product.isDonation ? `Starting at $${(product.donationMinAmount ?? product.price).toFixed(2)}` : `$${product.price.toFixed(2)}`}
            </span>
            {onSale && !product.isDonation && (
              <span style={{ fontSize: 13, color: "#666", textDecoration: "line-through" }}>
                ${product.comparePrice!.toFixed(2)}
              </span>
            )}
          </div>
          {product.isDonation && charityPct != null && (
            <div style={{ marginTop: 4 }}>
              <div style={{ display: "flex", borderRadius: 99, overflow: "hidden", height: 5, background: "rgba(255,255,255,0.08)" }}>
                <div style={{ width: `${charityPct}%`, background: GOLD }} />
                <div style={{ flex: 1, background: "rgba(255,255,255,0.12)" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3, fontSize: 9, color: "#7a7a7a", fontWeight: 700 }}>
                <span style={{ color: GOLD }}>🤝 {charityPct}% → Org</span>
                <span>🔗 {memberPct}% → Network</span>
              </div>
            </div>
          )}
          {product.isDonation ? (
            <div
              style={{
                marginTop: 8, width: "100%", padding: "10px 0",
                background: hover ? GOLD : "transparent",
                color: hover ? "#000" : GOLD,
                border: `1.5px solid ${GOLD}`,
                borderRadius: 8, fontWeight: 800, fontSize: 13, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                transition: "all 0.18s ease",
              }}
            >
              <Heart size={14} /> Give Now
            </div>
          ) : (
            <button
              disabled={outOfStock || adding}
              onClick={(e) => onAdd(e, product.id)}
              style={{
                marginTop: 8, width: "100%", padding: "10px 0",
                background: hover && !outOfStock ? GOLD : "transparent",
                color: outOfStock ? "#555" : hover ? "#000" : GOLD,
                border: `1.5px solid ${outOfStock ? "#333" : GOLD}`,
                borderRadius: 8, fontWeight: 800, fontSize: 13,
                cursor: outOfStock ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                transition: "all 0.18s ease",
              }}
            >
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart size={14} />}
              {outOfStock ? "Sold Out" : "Add to Cart"}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

export function ChurchesAndNonProfits() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { setCartOpen } = useCartStore();
  const [addingId, setAddingId] = useState<number | null>(null);

  const { data, isLoading } = useListProducts({ limit: 100 } as any);
  const allProducts: Product[] = (data as any)?.products ?? [];

  const churchProducts = allProducts.filter((p) => p.isChurchDonation);
  const nonProfitProducts = allProducts.filter((p) => p.isNonProfit && !p.isChurchDonation);

  const addToCart = useAddToCart({
    mutation: {
      onSuccess: () => {
        setCartOpen(true);
        toast({ title: "Added to cart" });
      },
      onSettled: () => setAddingId(null),
    },
  });

  const handleAdd = (e: React.MouseEvent, productId: number) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast({ title: "Sign in required", description: "Please sign in to add items to your cart." });
      return;
    }
    setAddingId(productId);
    addToCart.mutate({ data: { productId, quantity: 1 } });
  };

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", minHeight: "100vh", background: "#0a0a0a" }}>

      {/* ── HERO ─────────────────────────────────────────── */}
      <div
        style={{
          background: "linear-gradient(160deg, #0a0a0a 0%, #140f00 60%, #0a0a0a 100%)",
          borderBottom: `3px solid ${GOLD}`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px)`, backgroundSize: "40px 40px", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: -100, right: "8%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.10), transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -80, left: "5%", width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.06), transparent 70%)", pointerEvents: "none" }} />

        <div className="px-4 md:px-8" style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 24px 88px", position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 24, background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.35)", padding: "7px 20px", borderRadius: 99 }}>
            <Church size={13} color={GOLD} />
            <span style={{ color: GOLD, fontSize: 11, fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase" }}>NFGN Giving Hub</span>
          </div>
          <h1 style={{ color: "#fff", fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 900, margin: "0 0 20px", fontFamily: "serif", lineHeight: 1.05 }}>
            Churches &amp; <span style={{ color: GOLD }}>Non-Profits.</span>
          </h1>
          <p style={{ color: "#a0a0a0", fontSize: 18, maxWidth: 620, margin: "0 0 32px", lineHeight: 1.7 }}>
            Everything related to giving, fundraising, tithing, donations, and community support is right here in one centralized place. Give directly through your NFGN account — transparently, securely, and with purpose.
          </p>

          {/* Trust row */}
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {[
              { icon: <Church size={14} color={GOLD} />, label: "Direct Church Giving" },
              { icon: <HandHeart size={14} color={GOLD} />, label: "Non-Profit Support" },
              { icon: <Shield size={14} color={GOLD} />, label: "Secure & Transparent" },
              { icon: <Coins size={14} color={GOLD} />, label: "80% Goes to the Cause" },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {item.icon}
                <span style={{ color: "#d0d0d0", fontSize: 13, fontWeight: 600 }}>{item.label}</span>
              </div>
            ))}
          </div>

          {/* HOW IT WORKS callout */}
          <div style={{ marginTop: 40, padding: "20px 24px", background: "rgba(201,168,76,0.07)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 12, maxWidth: 640 }}>
            <p style={{ color: GOLD, fontSize: 12, fontWeight: 800, margin: "0 0 8px", letterSpacing: "0.1em" }}>🎁 HOW YOUR GIFT IS DISTRIBUTED</p>
            <p style={{ color: "#9a9a9a", fontSize: 13, margin: 0, lineHeight: 1.65 }}>
              The majority of every monetary gift (typically <strong style={{ color: "#fff" }}>80%</strong>) goes directly to the church or non-profit. The remaining 20% supports NFGN referral rewards and platform operations. Every gift is a <strong style={{ color: "#fff" }}>personal gift — not a purchase</strong>, and is not considered taxable income for recipients.
            </p>
          </div>
        </div>
      </div>

      {/* ── CHURCH GIVING ──────────────────────────────────── */}
      <div style={{ background: "linear-gradient(135deg, #0f0b04 0%, #161208 50%, #120e05 100%)", padding: "72px 0", borderBottom: `3px solid ${GOLD}`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(201,168,76,0.04) 39px, rgba(201,168,76,0.04) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(201,168,76,0.04) 39px, rgba(201,168,76,0.04) 40px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: -90, right: "6%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.12), transparent 70%)", pointerEvents: "none" }} />

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
                { icon: <Shield size={11} />, label: "Secure Platform" },
              ].map(tag => (
                <span key={tag.label} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(201,168,76,0.10)", border: "1px solid rgba(201,168,76,0.28)", color: GOLD, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 99, letterSpacing: "0.04em" }}>
                  {tag.icon} {tag.label}
                </span>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-44 w-full rounded-xl mb-3" style={{ background: "rgba(255,255,255,0.06)" }} />
                  <Skeleton className="h-3 w-24 mb-2" style={{ background: "rgba(255,255,255,0.06)" }} />
                  <Skeleton className="h-4 w-full mb-2" style={{ background: "rgba(255,255,255,0.06)" }} />
                </div>
              ))}
            </div>
          ) : churchProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {churchProducts.map(p => (
                <ChurchCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <Church size={48} color={GOLD} style={{ opacity: 0.25, margin: "0 auto 16px" }} />
              <h3 style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>No church giving options yet</h3>
              <p style={{ color: "#666", fontSize: 14 }}>Church donation products will appear here once added by the admin.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── NON-PROFIT ORGANIZATIONS ───────────────────────── */}
      <div style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #120f04 50%, #0a0a0a 100%)", padding: "72px 0", borderBottom: `3px solid ${GOLD}`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(rgba(201,168,76,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.03) 1px, transparent 1px)`, backgroundSize: "40px 40px", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: -80, right: "8%", width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.08), transparent 70%)", pointerEvents: "none" }} />

        <div className="px-4 md:px-8" style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
          <div style={{ marginBottom: 48 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 16, background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.35)", padding: "6px 16px", borderRadius: 99 }}>
              <HandHeart size={13} color={GOLD} />
              <span style={{ color: GOLD, fontSize: 11, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase" }}>Non-Profit Organizations</span>
            </div>
            <h2 style={{ color: "#fff", fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 900, margin: "0 0 12px", fontFamily: "serif", lineHeight: 1.1 }}>
              Give Back. <span style={{ color: GOLD }}>Support. Unite.</span>
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
                <span key={tag.label} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(201,168,76,0.10)", border: "1px solid rgba(201,168,76,0.28)", color: GOLD, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 99, letterSpacing: "0.04em" }}>
                  {tag.icon} {tag.label}
                </span>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-40 w-full rounded-xl mb-3" style={{ background: "rgba(255,255,255,0.06)" }} />
                  <Skeleton className="h-3 w-24 mb-2" style={{ background: "rgba(255,255,255,0.06)" }} />
                  <Skeleton className="h-4 w-full mb-2" style={{ background: "rgba(255,255,255,0.06)" }} />
                </div>
              ))}
            </div>
          ) : nonProfitProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {nonProfitProducts.map(p => (
                <NonProfitCard
                  key={p.id}
                  product={p}
                  onAdd={handleAdd}
                  adding={addingId === p.id}
                />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <HandHeart size={48} color={GOLD} style={{ opacity: 0.25, margin: "0 auto 16px" }} />
              <h3 style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>No non-profit products yet</h3>
              <p style={{ color: "#666", fontSize: 14 }}>Non-profit and donation products will appear here once added.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── FOOTER CTA ─────────────────────────────────────── */}
      <div style={{ background: "#0a0a0a", padding: "64px 0", borderTop: "1px solid rgba(201,168,76,0.15)", textAlign: "center" }}>
        <div className="px-4 md:px-8" style={{ maxWidth: 640, margin: "0 auto" }}>
          <Sparkles size={32} color={GOLD} style={{ margin: "0 auto 16px", opacity: 0.7 }} />
          <h3 style={{ color: "#fff", fontSize: 26, fontWeight: 900, fontFamily: "serif", margin: "0 0 12px" }}>
            Want to add your organization?
          </h3>
          <p style={{ color: "#888", fontSize: 15, margin: "0 0 28px", lineHeight: 1.65 }}>
            Reach out to the NFGN team to have your church or non-profit listed on this page. We welcome all faith-based and community organizations.
          </p>
          <Link href="/contact">
            <button
              style={{
                background: GOLD, color: "#000", border: "none", borderRadius: 8,
                padding: "14px 32px", fontWeight: 800, fontSize: 14, cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 8, letterSpacing: "0.03em",
              }}
            >
              Contact Us <ArrowRight size={15} />
            </button>
          </Link>
        </div>
      </div>

    </div>
  );
}
