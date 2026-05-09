import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useAddToCart, useGetMe } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCartStore } from "@/hooks/use-cart-store";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { customFetch } from "@/lib/custom-fetch";
import { resolveImageSrc } from "@/lib/image";
import {
  ShoppingCart, ArrowLeft, Star, Package, Leaf,
  CheckCircle2, Loader2, ChevronRight, ThumbsUp,
  Church, Heart, HandHeart, AlertCircle,
} from "lucide-react";

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  comparePrice: number | null;
  image: string | null;
  images: string[];
  categoryId: number | null;
  categoryName: string | null;
  stock: number;
  featured: boolean;
  isProPackage: boolean;
  status: string;
  commissionRate: number;
  cv: number;
  ingredients: string | null;
  benefits: string | null;
  relatedProducts: Product[];
  createdAt: string;
  // Donation / church giving fields
  isDonation: boolean;
  isChurchDonation: boolean;
  donationRecipientType: string | null;
  donationRecipientName: string | null;
  donationMinAmount: number;
  churchName: string | null;
  giftCharityPercent: string | null;
}

interface Review {
  id: number;
  name: string;
  rating: number;
  title: string;
  body: string;
  isVerified: boolean;
  createdAt: string;
}

export function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const { setCartOpen } = useCartStore();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [donationAmount, setDonationAmount] = useState<string>("");

  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    customFetch(`/api/products/slug/${encodeURIComponent(slug ?? "")}`)
      .then(async res => {
        if (!res.ok) throw new Error("Product not found");
        const data = await res.json();
        setProduct(data);
        const imgs = data.images?.length ? data.images : (data.image ? [data.image] : []);
        setActiveImage(imgs[0] ?? null);
        const isGift = data.isDonation || data.isChurchDonation;
        if (isGift && data.donationMinAmount) {
          setDonationAmount(String(data.donationMinAmount));
        }
      })
      .catch(e => setError(e.message ?? "Could not load product"))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!product) return;
    setReviewsLoading(true);
    customFetch(`/api/products/${product.id}/reviews`)
      .then(async res => {
        if (!res.ok) return;
        const data = await res.json();
        setReviews(data.reviews ?? []);
        setAvgRating(data.avgRating ?? null);
        setTotalReviews(data.totalReviews ?? 0);
      })
      .catch(() => {})
      .finally(() => setReviewsLoading(false));
  }, [product?.id]);

  const addToCart = useAddToCart({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/api/cart"] });
        setCartOpen(true);
        setAdding(false);
      },
      onError: () => {
        toast({ title: "Could not add to cart", variant: "destructive" });
        setAdding(false);
      },
    },
  });

  function handleAddToCart() {
    if (!isAuthenticated) {
      toast({ title: "Sign in required", description: "Please sign in to add items to your cart." });
      return;
    }
    if (!product) return;

    const isGift = product.isDonation || product.isChurchDonation;
    if (isGift) {
      const amt = parseFloat(donationAmount);
      const min = product.donationMinAmount ?? 0;
      const orgName = product.churchName ?? product.donationRecipientName ?? "the recipient";
      if (isNaN(amt) || amt < min) {
        toast({
          title: "Minimum Donation Required",
          description: `A minimum donation of $${min.toFixed(2)} is required for this gift. This ensures that after corporate and credit card processing fees are covered, your full intended gift amount reaches ${orgName}. Please enter $${min.toFixed(2)} or more to continue.`,
          variant: "destructive",
          duration: 8000,
        });
        return;
      }
      setAdding(true);
      addToCart.mutate({ data: { productId: product.id, quantity: 1, customPrice: amt } } as any);
      return;
    }

    setAdding(true);
    addToCart.mutate({ data: { productId: product.id, quantity: 1 } });
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-12 w-full mt-6" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Package className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-serif font-bold">Product Not Found</h2>
          <p className="text-muted-foreground">{error ?? "This product doesn't exist or has been removed."}</p>
          <Link href="/shop">
            <Button><ArrowLeft className="h-4 w-4 mr-2" /> Back to Shop</Button>
          </Link>
        </div>
      </div>
    );
  }

  const allImages = product.images?.length ? product.images : (product.image ? [product.image] : []);
  const savings = product.comparePrice && product.comparePrice > product.price
    ? product.comparePrice - product.price
    : null;
  const savingsPct = savings && product.comparePrice
    ? Math.round((savings / product.comparePrice) * 100)
    : null;

  const isGiftProduct = !!(product.isDonation || product.isChurchDonation);
  const orgName = product.churchName ?? product.donationRecipientName ?? product.donationRecipientType ?? "Organisation";
  const charityPct = isGiftProduct ? Math.round(parseFloat(String(product.giftCharityPercent ?? "80")) || 80) : 0;
  const memberPct = 100 - charityPct;

  const benefitsList = product.benefits
    ? product.benefits.split(/\n|;/).map(b => b.trim()).filter(Boolean)
    : [];
  const ingredientsList = product.ingredients
    ? product.ingredients.split(/\n|;|,/).map(i => i.trim()).filter(Boolean)
    : [];

  const displayRating = avgRating ?? 4.9;
  const displayCount = totalReviews > 0 ? totalReviews : null;

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-8">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/shop" className="hover:text-foreground transition-colors">Our Products</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium truncate">{product.name}</span>
      </nav>

      {/* Main Product Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
        {/* Image Column */}
        <div className="space-y-3">
          <div className="aspect-square rounded-2xl overflow-hidden bg-muted border border-border/50 relative">
            {resolveImageSrc(activeImage) ? (
              <img
                src={resolveImageSrc(activeImage)!}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground font-serif text-4xl opacity-20">
                NFGN
              </div>
            )}
            {product.isProPackage && (
              <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                PRO PACKAGE
              </div>
            )}
            {isGiftProduct && (
              <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                {product.isChurchDonation ? <Church className="h-3 w-3" /> : <Heart className="h-3 w-3" />}
                {product.isChurchDonation ? "Church Giving" : "Gift / Donation"}
              </div>
            )}
            {!isGiftProduct && savingsPct && (
              <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                SAVE {savingsPct}%
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {allImages.length > 1 && (
            <div className="flex gap-2">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(img)}
                  className={`h-16 w-16 rounded-lg overflow-hidden border-2 transition-colors flex-shrink-0 ${
                    activeImage === img ? "border-primary" : "border-border/50 hover:border-primary/50"
                  }`}
                >
                  {resolveImageSrc(img) ? (
                    <img src={resolveImageSrc(img)!} alt={`View ${i + 1}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info Column */}
        <div className="flex flex-col gap-5">
          {/* Category */}
          {product.categoryName && (
            <div className="text-xs font-semibold tracking-widest uppercase text-primary">
              {product.categoryName}
            </div>
          )}

          {/* Name */}
          <h1 className="text-3xl md:text-4xl font-serif font-bold leading-tight">{product.name}</h1>

          {/* Ratings */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            {[1,2,3,4,5].map(s => (
              <Star
                key={s}
                className={`h-4 w-4 ${s <= Math.round(displayRating) ? "fill-primary text-primary" : "fill-muted text-muted-foreground"}`}
              />
            ))}
            <span className="font-medium ml-1 text-foreground">{displayRating.toFixed(1)}</span>
            {displayCount !== null && (
              <span>· {displayCount} {displayCount === 1 ? "review" : "reviews"}</span>
            )}
          </div>

          {/* Price / Donation Amount */}
          {isGiftProduct ? (
            <div className="space-y-3">
              {/* Org name */}
              <div className="flex items-center gap-2 text-sm font-semibold">
                {product.isChurchDonation ? <Church className="h-4 w-4 text-primary" /> : <HandHeart className="h-4 w-4 text-primary" />}
                <span className="text-foreground">Recipient: <strong>{orgName}</strong></span>
              </div>

              {/* Donation amount input */}
              <div className="rounded-xl border p-4 space-y-3" style={{ background: "rgba(201,168,76,0.05)", borderColor: "rgba(201,168,76,0.3)" }}>
                <p className="text-xs font-bold tracking-widest uppercase text-primary">Your Donation Amount</p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground font-bold text-lg">$</span>
                  <Input
                    type="number"
                    min={product.donationMinAmount}
                    step="0.01"
                    value={donationAmount}
                    onChange={e => setDonationAmount(e.target.value)}
                    className="pl-7 text-lg font-bold h-12"
                    style={{ borderColor: (() => { const v = parseFloat(donationAmount); return isNaN(v) || v < product.donationMinAmount ? "#ef4444" : "rgba(201,168,76,0.6)"; })() }}
                    placeholder={product.donationMinAmount.toFixed(2)}
                  />
                </div>
                {(() => {
                  const v = parseFloat(donationAmount);
                  const min = product.donationMinAmount;
                  if (isNaN(v) || v < min) {
                    return (
                      <div className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", color: "#dc2626" }}>
                        <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>Minimum of ${min.toFixed(2)} required.</strong> This minimum ensures that after corporate and credit card processing fees are covered, your full gift amount reaches {orgName}.
                        </span>
                      </div>
                    );
                  }
                  return (
                    <p className="text-xs text-muted-foreground">
                      Your gift of <strong className="text-foreground">${v.toFixed(2)}</strong> is above the minimum — thank you for your generosity!
                    </p>
                  );
                })()}
                <p className="text-[10px] text-muted-foreground">Minimum donation: <strong className="text-foreground">${product.donationMinAmount.toFixed(2)}</strong> · Enter any amount at or above this threshold.</p>
              </div>

              {/* Gift split bar */}
              <div className="rounded-xl border p-4 space-y-2" style={{ background: "rgba(201,168,76,0.03)", borderColor: "rgba(201,168,76,0.2)" }}>
                <p className="text-xs font-bold tracking-wide text-primary">🎁 HOW YOUR GIFT IS DISTRIBUTED</p>
                <div className="flex rounded-full overflow-hidden h-3.5 border" style={{ borderColor: "rgba(201,168,76,0.3)" }}>
                  <div style={{ width: `${charityPct}%`, background: "#C9A84C", transition: "width 0.2s" }} />
                  <div style={{ flex: 1, background: "rgba(255,255,255,0.08)" }} />
                </div>
                <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                  <span className="text-primary">{product.isChurchDonation ? "⛪" : "🤝"} {charityPct}% → {orgName}</span>
                  <span>🔗 {memberPct}% → Network</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The <strong className="text-foreground">{charityPct}%</strong> goes directly to {orgName}. The remaining {memberPct}% funds NFGN referral rewards and platform operations.
                </p>
              </div>

              {/* Gift notice */}
              <div className="rounded-lg border px-4 py-3 text-xs leading-relaxed" style={{ background: "rgba(253,224,71,0.06)", borderColor: "rgba(253,224,71,0.25)", color: "#92400e" }}>
                <strong>Gift Notice:</strong> This is a <strong>personal gift</strong> — not a purchase or taxable transaction. Gifts are generally not considered taxable income for recipients. Consult your tax adviser for specific guidance.
              </div>
            </div>
          ) : (
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-foreground">${product.price.toFixed(2)}</span>
              {product.comparePrice && product.comparePrice > product.price && (
                <>
                  <span className="text-xl text-muted-foreground line-through">${product.comparePrice.toFixed(2)}</span>
                  {savings && (
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-sm px-2">
                      Save ${savings.toFixed(2)}
                    </Badge>
                  )}
                </>
              )}
            </div>
          )}

          {/* CV */}
          {!isGiftProduct && product.cv > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Leaf className="h-4 w-4 text-primary" />
              <span><strong className="text-foreground">{product.cv} CV</strong> earned with this purchase</span>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <p className="text-muted-foreground leading-relaxed">{product.description}</p>
          )}

          {/* Benefits */}
          {benefitsList.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Key Benefits</h3>
              <ul className="space-y-1.5">
                {benefitsList.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Add to Cart / Give Now */}
          <div className="pt-2 space-y-3">
            {product.stock === 0 ? (
              <Button className="w-full" size="lg" disabled>Out of Stock</Button>
            ) : (
              <Button
                className="w-full gap-2"
                size="lg"
                onClick={handleAddToCart}
                disabled={adding}
              >
                {adding
                  ? <><Loader2 className="h-5 w-5 animate-spin" /> Adding…</>
                  : isGiftProduct
                    ? <>{product.isChurchDonation ? <Church className="h-5 w-5" /> : <Heart className="h-5 w-5" />} Give Now</>
                    : <><ShoppingCart className="h-5 w-5" /> Add to Cart</>
                }
              </Button>
            )}
            <Link href="/shop">
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground">
                <ArrowLeft className="h-4 w-4 mr-1.5" /> Continue Shopping
              </Button>
            </Link>
          </div>

          {/* Trust badges — vary by product type */}
          {isGiftProduct ? (
            <div className="grid grid-cols-3 gap-3 pt-2 border-t text-center text-xs text-muted-foreground">
              <div className="flex flex-col items-center gap-1">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span>Gift — Not Taxable</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Heart className="h-5 w-5 text-primary" />
                <span>{charityPct}% to Org</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <HandHeart className="h-5 w-5 text-primary" />
                <span>Community Impact</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 pt-2 border-t text-center text-xs text-muted-foreground">
              <div className="flex flex-col items-center gap-1">
                <Leaf className="h-5 w-5 text-primary" />
                <span>All Natural</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span>Quality Tested</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Package className="h-5 w-5 text-primary" />
                <span>Fast Shipping</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ingredients */}
      {ingredientsList.length > 0 && (
        <div className="mt-14">
          <h2 className="text-2xl font-serif font-bold mb-4">Ingredients</h2>
          <div className="flex flex-wrap gap-2">
            {ingredientsList.map((ing, i) => (
              <Badge key={i} variant="secondary" className="text-sm px-3 py-1">
                <Leaf className="h-3 w-3 mr-1.5 text-primary" />{ing}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Reviews Section */}
      <div className="mt-14">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-serif font-bold">Customer Reviews</h2>
          {totalReviews > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className={`h-4 w-4 ${s <= Math.round(displayRating) ? "fill-primary text-primary" : "fill-muted text-muted"}`} />
                ))}
              </div>
              <span className="font-semibold text-foreground">{displayRating.toFixed(1)}</span>
              <span>out of 5 · {totalReviews} {totalReviews === 1 ? "review" : "reviews"}</span>
            </div>
          )}
        </div>

        {reviewsLoading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground border rounded-xl bg-muted/20">
            <ThumbsUp className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No reviews yet. Be the first!</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {reviews.map(review => (
              <div key={review.id} className="rounded-xl border bg-card p-5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex gap-0.5 mb-1">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`h-3.5 w-3.5 ${s <= review.rating ? "fill-primary text-primary" : "fill-muted text-muted"}`} />
                      ))}
                    </div>
                    <p className="font-semibold text-sm leading-tight">{review.title}</p>
                  </div>
                  {review.isVerified && (
                    <Badge variant="outline" className="text-xs whitespace-nowrap border-primary/30 text-primary flex-shrink-0">
                      ✓ Verified
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{review.body}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 border-t">
                  <span className="font-medium text-foreground">{review.name}</span>
                  <span>·</span>
                  <span>{new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Related Products */}
      {product.relatedProducts?.length > 0 && (
        <div className="mt-14">
          <h2 className="text-2xl font-serif font-bold mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {product.relatedProducts.slice(0, 4).map(rel => (
              <Link key={rel.id} href={`/product/${rel.slug}`}>
                <div className="group cursor-pointer space-y-2">
                  <div className="aspect-square rounded-xl overflow-hidden bg-muted border border-border/50 group-hover:border-primary/50 transition-colors">
                    {resolveImageSrc(rel.image) ? (
                      <img
                        src={resolveImageSrc(rel.image)!}
                        alt={rel.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground opacity-20 font-serif">NFGN</div>
                    )}
                  </div>
                  <p className="text-sm font-semibold leading-tight group-hover:text-primary transition-colors">{rel.name}</p>
                  <p className="text-sm font-bold">${rel.price.toFixed(2)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
