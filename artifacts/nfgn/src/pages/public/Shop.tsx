import { useListProducts, useAddToCart } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { resolveImageSrc } from "@/lib/image";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShoppingCart, Loader2, Leaf, Sparkles, Flame, BookOpen,
  Star, ChevronRight, Package, BadgeCheck,
} from "lucide-react";
import { useCartStore } from "@/hooks/use-cart-store";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";

const GOLD = "#C9A84C";
const GOLD_LIGHT = "rgba(201,168,76,0.10)";
const GOLD_MED = "rgba(201,168,76,0.22)";
const GREEN = "#2D6A4F";
const DARK = "#0a0a0a";
const DARK2 = "#111111";
const DARK3 = "#1a1a1a";

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

const CATEGORY_GROUPS: {
  key: string;
  label: string;
  icon: React.ReactNode;
  accent: string;
  description: string;
  slugs: string[];
}[] = [
  {
    key: "herbal",
    label: "Herbal Products",
    icon: <Leaf className="h-6 w-6" />,
    accent: GREEN,
    description: "Naturopathic herbal formulations — cleanses, gut health, appetite support & holistic wellness.",
    slugs: ["cleanses", "appetite-support", "herbal-wellness"],
  },
  {
    key: "soaps",
    label: "Soaps & Lotions",
    icon: <Sparkles className="h-6 w-6" />,
    accent: GOLD,
    description: "Handmade natural soaps, body lotions, and nourishing skin-care oils crafted with love.",
    slugs: ["soaps-body-care", "lotions-oils"],
  },
  {
    key: "candles",
    label: "Aromatherapy Candles",
    icon: <Flame className="h-6 w-6" />,
    accent: "#E07B54",
    description: "Therapeutic aromatics and hand-poured candles to create calm, focus, and healing spaces.",
    slugs: ["candles-aromatics"],
  },
  {
    key: "books",
    label: "Books & Media",
    icon: <BookOpen className="h-6 w-6" />,
    accent: "#7B8FD4",
    description: "Naturopathic education, wellness books, guides, and professional service packages.",
    slugs: ["books-education", "services"],
  },
];

function categorySlugFromName(name?: string | null): string {
  if (!name) return "";
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function ProductCard({ product, onAdd, adding }: {
  product: Product;
  onAdd: (e: React.MouseEvent, id: number) => void;
  adding: boolean;
}) {
  const img = resolveImageSrc(product.image);
  const outOfStock = product.stock === 0;

  return (
    <Link href={`/product/${product.slug}`}>
      <div
        className="group relative overflow-hidden rounded-sm flex flex-col cursor-pointer h-full transition-all duration-300"
        style={{ background: DARK3, border: `1px solid rgba(255,255,255,0.07)` }}
      >
        {/* Image */}
        <div className="relative overflow-hidden" style={{ aspectRatio: "1/1", background: "#111" }}>
          {img ? (
            <img
              src={img}
              alt={product.name}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="font-serif text-3xl font-black opacity-10" style={{ color: GOLD }}>NFGN</span>
            </div>
          )}
          {/* Hover gold overlay */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: "rgba(201,168,76,0.06)" }} />

          {/* Badges */}
          {product.isProPackage && (
            <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-sm text-xs font-bold"
              style={{ background: GOLD, color: DARK }}>
              <BadgeCheck className="h-3 w-3" /> PRO
            </div>
          )}
          {outOfStock && (
            <div className="absolute inset-0 flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.65)" }}>
              <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>Out of Stock</span>
            </div>
          )}
          {product.comparePrice && product.comparePrice > product.price && !outOfStock && (
            <div className="absolute top-3 right-3 px-2 py-1 rounded-sm text-xs font-bold"
              style={{ background: "#2D6A4F", color: "#6EE7A0" }}>
              SALE
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col flex-1 p-4">
          <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: GOLD }}>
            {product.categoryName || "Wellness"}
          </p>
          <h3 className="font-bold leading-tight mb-2 flex-1 group-hover:text-[#C9A84C] transition-colors"
            style={{ color: "rgba(255,255,255,0.9)", fontSize: "0.95rem" }}>
            {product.name}
          </h3>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg font-black" style={{ color: GOLD }}>${product.price.toFixed(2)}</span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="text-sm line-through" style={{ color: "rgba(255,255,255,0.3)" }}>
                ${product.comparePrice.toFixed(2)}
              </span>
            )}
          </div>
          <Button
            className="w-full gap-2 rounded-sm font-bold text-sm"
            disabled={outOfStock || adding}
            onClick={(e) => onAdd(e, product.id)}
            style={!outOfStock ? { background: GOLD, color: DARK, border: "none" } : {}}
            variant={outOfStock ? "outline" : "default"}
          >
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
            {outOfStock ? "Out of Stock" : "Add to Cart"}
          </Button>
        </div>
      </div>
    </Link>
  );
}

function CategorySection({ group, products, onAdd, addingId }: {
  group: typeof CATEGORY_GROUPS[0];
  products: Product[];
  onAdd: (e: React.MouseEvent, id: number) => void;
  addingId: number | null;
}) {
  if (products.length === 0) return null;
  return (
    <section className="mb-20">
      {/* Section header */}
      <div className="flex items-center gap-5 mb-8 pb-5" style={{ borderBottom: `1px solid rgba(255,255,255,0.07)` }}>
        <div className="h-14 w-14 rounded-sm flex items-center justify-center flex-shrink-0"
          style={{ background: `${group.accent}18`, color: group.accent, border: `1px solid ${group.accent}35` }}>
          {group.icon}
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-serif font-black text-white">{group.label}</h2>
          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{group.description}</p>
        </div>
        <span className="text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full"
          style={{ background: `${group.accent}15`, color: group.accent, border: `1px solid ${group.accent}25` }}>
          {products.length} {products.length === 1 ? "item" : "items"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            onAdd={onAdd}
            adding={addingId === p.id}
          />
        ))}
      </div>
    </section>
  );
}

function ProRegistrationSection({ products, onAdd, addingId }: {
  products: Product[];
  onAdd: (e: React.MouseEvent, id: number) => void;
  addingId: number | null;
}) {
  if (products.length === 0) return null;
  return (
    <section className="mb-20 rounded-sm overflow-hidden" style={{ border: `1px solid ${GOLD_MED}`, background: "rgba(201,168,76,0.04)" }}>
      {/* Banner header */}
      <div className="px-8 py-6 flex flex-col md:flex-row items-start md:items-center gap-4"
        style={{ borderBottom: `1px solid ${GOLD_MED}`, background: "rgba(201,168,76,0.06)" }}>
        <div className="h-14 w-14 rounded-sm flex items-center justify-center flex-shrink-0"
          style={{ background: GOLD, color: DARK }}>
          <Package className="h-7 w-7" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Star className="h-4 w-4" style={{ color: GOLD }} />
            <span className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: GOLD }}>Members Only</span>
          </div>
          <h2 className="text-2xl font-serif font-black text-white">Pro Registration Products</h2>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
            Official NFGN Pro Member packages — includes membership access, commissions eligibility, and full network benefits.
          </p>
        </div>
        <Link href="/join">
          <div className="flex items-center gap-1 text-sm font-semibold whitespace-nowrap"
            style={{ color: GOLD }}>
            Learn More <ChevronRight className="h-4 w-4" />
          </div>
        </Link>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onAdd={onAdd}
              adding={addingId === p.id}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function Shop() {
  const { data, isLoading } = useListProducts({ limit: 100 });
  const { setCartOpen } = useCartStore();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const [addingId, setAddingId] = useState<number | null>(null);

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
    <div style={{ background: DARK, minHeight: "100vh" }}>
      {/* Hero banner */}
      <div className="relative overflow-hidden" style={{ background: DARK2, borderBottom: `1px solid ${GOLD_MED}` }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(201,168,76,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.03) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-40 pointer-events-none"
          style={{ background: `radial-gradient(ellipse, ${GOLD}18, transparent 70%)`, filter: "blur(30px)" }} />
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-16 text-center">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full"
            style={{ background: GOLD_LIGHT, border: `1px solid ${GOLD_MED}` }}>
            <Sparkles className="h-3.5 w-3.5" style={{ color: GOLD }} />
            <span className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: GOLD }}>NFGN Marketplace</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-serif font-black text-white mb-4">Our Products</h1>
          <p className="text-base max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.5)" }}>
            Premium naturopathic formulations, handmade body care, aromatherapy, and wellness education — all in one place.
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-56 w-full rounded-sm" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-9 w-full rounded-sm" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Pro Registration — always first */}
            <ProRegistrationSection
              products={proProducts}
              onAdd={handleAddToCart}
              addingId={addingId}
            />

            {/* Category sections */}
            {grouped.map(({ group, products: gProducts }) => (
              <CategorySection
                key={group.key}
                group={group}
                products={gProducts}
                onAdd={handleAddToCart}
                addingId={addingId}
              />
            ))}

            {/* Uncategorized fallback */}
            {uncategorized.length > 0 && (
              <section className="mb-20">
                <div className="flex items-center gap-4 mb-8 pb-5" style={{ borderBottom: `1px solid rgba(255,255,255,0.07)` }}>
                  <div className="h-14 w-14 rounded-sm flex items-center justify-center" style={{ background: GOLD_LIGHT, color: GOLD }}>
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-serif font-black text-white">More Products</h2>
                    <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Additional wellness offerings from NFGN.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {uncategorized.map((p) => (
                    <ProductCard key={p.id} product={p} onAdd={handleAddToCart} adding={addingId === p.id} />
                  ))}
                </div>
              </section>
            )}

            {products.length === 0 && (
              <div className="text-center py-32">
                <div className="text-6xl mb-6 opacity-20" style={{ color: GOLD }}>✦</div>
                <h3 className="text-xl font-bold text-white mb-2">No products yet</h3>
                <p style={{ color: "rgba(255,255,255,0.4)" }}>Check back soon — the marketplace is being stocked.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
