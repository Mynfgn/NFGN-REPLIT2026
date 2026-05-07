import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useCartStore } from "@/hooks/use-cart-store";
import { useGetCart } from "@workspace/api-client-react";
import { ShoppingCart, Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { CartDrawer } from "@/components/cart/CartDrawer";

export function PublicLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { cartOpen, setCartOpen } = useCartStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [location] = useLocation();
  const aboutRef = useRef<HTMLDivElement>(null);

  const { data: cart } = useGetCart({ query: { enabled: isAuthenticated } as any });
  const itemCount = cart?.itemCount ?? 0;

  const navLinks = [
    { name: "Store", href: "/shop" },
    { name: "Book-A-Pro", href: "/book" },
    { name: "Churches & Non-Profits", href: "/give" },
    { name: "Join Us", href: "/join" },
  ];

  const aboutLinks = [
    { name: "About Us", href: "/about" },
    { name: "Contact Us", href: "/contact" },
  ];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (aboutRef.current && !aboutRef.current.contains(e.target as Node)) {
        setAboutOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isAboutActive = location === "/about" || location === "/contact";

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-serif text-2xl font-bold tracking-tighter text-primary">NFGN</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    location === link.href ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {link.name}
                </Link>
              ))}

              {/* About dropdown */}
              <div ref={aboutRef} style={{ position: "relative" }}>
                <button
                  onClick={() => setAboutOpen((o) => !o)}
                  className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-1 ${
                    isAboutActive ? "text-primary" : "text-muted-foreground"
                  }`}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  About
                  <ChevronDown
                    size={13}
                    style={{
                      transition: "transform 0.18s",
                      transform: aboutOpen ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  />
                </button>

                {aboutOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 10px)",
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "#0a0a0a",
                      border: "1px solid rgba(201,168,76,0.25)",
                      borderRadius: 10,
                      minWidth: 160,
                      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                      overflow: "hidden",
                      zIndex: 100,
                    }}
                  >
                    {aboutLinks.map((link, i) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setAboutOpen(false)}
                        style={{
                          display: "block",
                          padding: "11px 18px",
                          fontSize: 13,
                          fontWeight: 500,
                          color: location === link.href ? "#C9A84C" : "#ccc",
                          borderBottom: i < aboutLinks.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                          transition: "color 0.15s, background 0.15s",
                          textDecoration: "none",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.color = "#C9A84C";
                          (e.currentTarget as HTMLElement).style.background = "rgba(201,168,76,0.07)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.color = location === link.href ? "#C9A84C" : "#ccc";
                          (e.currentTarget as HTMLElement).style.background = "transparent";
                        }}
                      >
                        {link.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* Cart icon with badge */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setCartOpen(!cartOpen)}
            >
              <ShoppingCart className="h-5 w-5" />
              {isAuthenticated && itemCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center leading-none">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Button>

            <div className="hidden md:flex items-center gap-2">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">Member Dashboard</Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button variant="default">Sign In</Button>
                </Link>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b bg-background px-4 py-4 space-y-4">
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium ${
                    location === link.href ? "text-primary" : "text-foreground"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              {aboutLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium ${
                    location === link.href ? "text-primary" : "text-foreground"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-4 border-t flex flex-col gap-2">
                {isAuthenticated ? (
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full" variant="outline">Member Dashboard</Button>
                  </Link>
                ) : (
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full">Sign In</Button>
                  </Link>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* Cart drawer — mounted globally in the layout */}
      <CartDrawer />

      <footer className="bg-foreground text-background py-12 mt-auto">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <span className="font-serif text-2xl font-bold tracking-tighter text-primary block mb-4">NFGN</span>
            <p className="text-sm text-gray-400">Where health meets wealth. Premium naturopathic wellness and community commerce.</p>
          </div>
          <div>
            <h4 className="font-bold mb-4 uppercase tracking-wider text-sm text-primary">Shop</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/shop" className="hover:text-white transition-colors">All Products</Link></li>
              <li><Link href="/book" className="hover:text-white transition-colors">Book A Pro</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 uppercase tracking-wider text-sm text-primary">Company</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/join" className="hover:text-white transition-colors">Join NFGN</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 uppercase tracking-wider text-sm text-primary">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/policies" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/policies" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-12 pt-8 border-t border-white/10 text-sm text-gray-500 flex flex-col md:flex-row justify-between items-center">
          <p>&copy; {new Date().getFullYear()} New Face Global Network. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
