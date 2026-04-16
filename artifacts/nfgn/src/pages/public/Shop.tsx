import { useListProducts, useAddToCart } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Loader2 } from "lucide-react";
import { useCartStore } from "@/hooks/use-cart-store";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";

export function Shop() {
  const { data, isLoading } = useListProducts({ limit: 50 });
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
      toast({
        title: "Sign in required",
        description: "Please sign in to add items to your cart.",
      });
      return;
    }
    setAddingId(productId);
    addToCart.mutate({ data: { productId, quantity: 1 } });
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-serif font-bold text-foreground mb-2">The Apothecary</h1>
          <p className="text-muted-foreground max-w-2xl">Premium naturopathic formulations crafted for optimal wellness and vitality.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data?.products.map((product) => (
            <Link key={product.id} href={`/product/${product.slug}`}>
              <Card className="h-full overflow-hidden border-border/50 hover:border-primary/50 transition-colors group cursor-pointer flex flex-col">
                <div className="aspect-square relative bg-muted flex items-center justify-center overflow-hidden">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="text-muted-foreground font-serif opacity-30 text-2xl">NFGN</div>
                  )}
                  {product.isProPackage && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded">
                      PRO PACKAGE
                    </div>
                  )}
                  {product.stock === 0 && (
                    <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                      <span className="text-sm font-semibold text-muted-foreground">Out of Stock</span>
                    </div>
                  )}
                </div>

                <CardContent className="p-4 flex-1">
                  <div className="text-xs text-primary font-semibold tracking-wider uppercase mb-1">
                    {product.categoryName || "Wellness"}
                  </div>
                  <h3 className="font-bold text-lg leading-tight mb-2 group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">${product.price.toFixed(2)}</span>
                    {product.comparePrice && product.comparePrice > product.price && (
                      <span className="text-muted-foreground text-sm line-through">
                        ${product.comparePrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="p-4 pt-0">
                  <Button
                    className="w-full gap-2"
                    variant={product.isProPackage ? "default" : "outline"}
                    disabled={product.stock === 0 || addingId === product.id}
                    onClick={(e) => handleAddToCart(e, product.id)}
                  >
                    {addingId === product.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ShoppingCart className="h-4 w-4" />
                    )}
                    {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                  </Button>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
