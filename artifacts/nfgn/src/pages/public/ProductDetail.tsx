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
import { customFetch } from "@/lib/custom-fetch";
import { resolveImageSrc } from "@/lib/image";
import {
  ShoppingCart, ArrowLeft, Star, Package, Leaf,
  CheckCircle2, Loader2, ChevronRight,
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
      })
      .catch(e => setError(e.message ?? "Could not load product"))
      .finally(() => setLoading(false));
  }, [slug]);

  const addToCart = useAddToCart({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["getCart"] });
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

  const benefitsList = product.benefits
    ? product.benefits.split(/\n|;/).map(b => b.trim()).filter(Boolean)
    : [];
  const ingredientsList = product.ingredients
    ? product.ingredients.split(/\n|;|,/).map(i => i.trim()).filter(Boolean)
    : [];

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-8">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/shop" className="hover:text-foreground transition-colors">The Apothecary</Link>
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
            {savingsPct && (
              <div className="absolute top-3 left-3 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
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

          {/* Ratings placeholder */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            {[1,2,3,4,5].map(s => <Star key={s} className="h-4 w-4 fill-primary text-primary" />)}
            <span className="font-medium ml-1 text-foreground">4.9</span>
            <span>· Premium Formula</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-foreground">${product.price.toFixed(2)}</span>
            {product.comparePrice && product.comparePrice > product.price && (
              <>
                <span className="text-xl text-muted-foreground line-through">${product.comparePrice.toFixed(2)}</span>
                {savings && (
                  <Badge className="bg-green-100 text-green-700 border-green-200 text-sm px-2">
                    Save ${savings.toFixed(2)}
                  </Badge>
                )}
              </>
            )}
          </div>

          {/* CV */}
          {product.cv > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Leaf className="h-4 w-4 text-green-600" />
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
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Add to Cart */}
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

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 pt-2 border-t text-center text-xs text-muted-foreground">
            <div className="flex flex-col items-center gap-1">
              <Leaf className="h-5 w-5 text-green-600" />
              <span>All Natural</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span>Quality Tested</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Package className="h-5 w-5 text-blue-500" />
              <span>Fast Shipping</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ingredients */}
      {ingredientsList.length > 0 && (
        <div className="mt-14">
          <h2 className="text-2xl font-serif font-bold mb-4">Ingredients</h2>
          <div className="flex flex-wrap gap-2">
            {ingredientsList.map((ing, i) => (
              <Badge key={i} variant="secondary" className="text-sm px-3 py-1">
                <Leaf className="h-3 w-3 mr-1.5 text-green-600" />{ing}
              </Badge>
            ))}
          </div>
        </div>
      )}

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
