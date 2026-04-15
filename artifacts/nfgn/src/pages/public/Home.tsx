import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Star, Shield, TrendingUp, Users } from "lucide-react";

export function Home() {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative w-full bg-foreground text-background overflow-hidden min-h-[90vh] flex items-center">
        <div className="absolute inset-0 z-0 opacity-20">
          {/* We would put a generated hero image here. Using a placeholder pattern for now. */}
          <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/40 via-foreground to-foreground"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">
          <span className="inline-block py-1 px-3 rounded-full bg-primary/20 text-primary border border-primary/30 text-sm font-semibold tracking-wider uppercase mb-6">
            Elevate Your Wellness & Wealth
          </span>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold tracking-tighter max-w-4xl leading-tight mb-8">
            Naturopathic living meets <span className="text-primary italic">limitless potential.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed">
            New Face Global Network is the premium destination for wellness entrepreneurs. Access world-class naturopathic products, book professional services, and build your own thriving community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/shop" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 py-2">
              Shop Collection
            </Link>
            <Link href="/join" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-white/20 bg-transparent hover:bg-white/10 hover:text-white h-12 px-8 py-2">
              Join The Network <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6">The NFGN Advantage</h2>
            <p className="text-muted-foreground text-lg">We've built an ecosystem designed to support both your health journey and your entrepreneurial ambitions.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card border p-8 hover:border-primary/50 transition-colors group">
              <div className="h-12 w-12 bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Star className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Premium Products</h3>
              <p className="text-muted-foreground leading-relaxed">
                Meticulously formulated naturopathic supplements and wellness packages designed for optimal vitality.
              </p>
            </div>
            
            <div className="bg-card border p-8 hover:border-primary/50 transition-colors group">
              <div className="h-12 w-12 bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Lucrative Rewards</h3>
              <p className="text-muted-foreground leading-relaxed">
                A powerful, transparent compensation plan that rewards your efforts in building and supporting a community.
              </p>
            </div>

            <div className="bg-card border p-8 hover:border-primary/50 transition-colors group">
              <div className="h-12 w-12 bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Expert Guidance</h3>
              <p className="text-muted-foreground leading-relaxed">
                Book one-on-one sessions with certified wellness professionals directly through our integrated platform.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-6xl font-serif font-bold mb-6 max-w-3xl mx-auto">Ready to transform your lifestyle?</h2>
          <p className="text-xl text-secondary-foreground/80 mb-10 max-w-2xl mx-auto">
            Join thousands of others who have discovered the power of aligning their physical wellness with their financial goals.
          </p>
          <Link href="/join" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-10 py-3 text-lg shadow-lg hover:shadow-xl">
            Start Your Journey Today
          </Link>
        </div>
      </section>
    </div>
  );
}
