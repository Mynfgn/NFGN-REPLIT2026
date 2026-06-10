import { useState } from "react";
import { useParams, Link } from "wouter";
import { useGetReplicatedPage, useListProfessionals } from "@workspace/api-client-react";
import { resolveImageSrc } from "@/lib/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { QRCodeSVG } from "qrcode.react";
import {
  Star, ShoppingBag, Users, Leaf, Award, Phone, Mail,
  CheckCircle2, ArrowRight, UserPlus, Sparkles, Calendar,
  Smartphone, Copy, Check, MapPin,
} from "lucide-react";

const BRAND_GOLD = "#C9A84C";
const BRAND_GREEN = "#2D6A4F";
const BRAND_BLACK = "#0a0a0a";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} className={`h-4 w-4 ${n <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
      ))}
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🔍</div>
        <h1 className="text-3xl font-serif font-bold mb-3">Consultant Not Found</h1>
        <p className="text-muted-foreground mb-6">
          This affiliate link doesn't match any active NFGN consultant. Please check the link or contact the person who shared it.
        </p>
        <Link href="/">
          <Button variant="outline">Back to NFGN Home</Button>
        </Link>
      </div>
    </div>
  );
}

export function AffiliateStorefront() {
  const params = useParams<{ username: string }>();
  const username = params.username ?? "";
  const { data, isLoading, error } = useGetReplicatedPage(username);
  const { data: prosData } = useListProfessionals();
  const [copied, setCopied] = useState(false);

  const pageUrl = typeof window !== "undefined" ? window.location.href : `https://nfgn.app/rep/${username}`;

  function shareWhatsApp() {
    const text = encodeURIComponent(`Check out my NFGN wellness store! Shop products or join my team here: ${pageUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  }
  function shareFacebook() {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`, "_blank", "noopener,noreferrer");
  }
  function shareSms() {
    const text = encodeURIComponent(`Check out my NFGN wellness store! ${pageUrl}`);
    window.location.href = `sms:?body=${text}`;
  }

  function copyLink() {
    navigator.clipboard.writeText(pageUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Loading consultant page…</p>
        </div>
      </div>
    );
  }

  if (error || !data) return <NotFound />;

  const { featuredProducts, testimonials } = data;
  const consultant = data.consultant as typeof data.consultant & { city?: string | null; state?: string | null; bio?: string | null };
  const joinUrl = `/join?ref=${username}`;
  const displayName = `${consultant.firstName} ${consultant.lastName}`;
  const professionals = prosData?.slice(0, 4) ?? [];
  const location = [consultant.city, consultant.state].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-background">

      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${BRAND_BLACK} 0%, #1a1a1a 50%, ${BRAND_GREEN} 100%)` }}
      >
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }}
        />
        <div className="relative max-w-5xl mx-auto px-4 py-20 text-white text-center">
          <Badge className="mb-6 text-xs px-3 py-1 bg-primary/20 text-primary border-primary/30">
            NFGN Independent Consultant
          </Badge>

          {/* Avatar */}
          {consultant.avatar ? (
            <img src={consultant.avatar} alt={displayName} className="h-24 w-24 rounded-full object-cover border-4 border-primary/60 mx-auto mb-5" />
          ) : (
            <div className="h-24 w-24 rounded-full flex items-center justify-center text-3xl font-bold text-white mx-auto mb-5 border-4 border-primary/60"
              style={{ background: `linear-gradient(135deg, ${BRAND_GOLD}, ${BRAND_GREEN})` }}>
              {consultant.firstName[0]}{consultant.lastName[0]}
            </div>
          )}

          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-2">{displayName}</h1>
          {consultant.isProMember && (
            <div className="flex items-center justify-center gap-2 mb-2">
              <Award className="h-5 w-5 text-primary" />
              <span className="text-primary font-semibold text-sm">Pro Member — NFGN Certified Wellness Consultant</span>
            </div>
          )}
          {location && (
            <div className="flex items-center justify-center gap-1.5 text-white/50 text-sm mb-4">
              <MapPin className="h-3.5 w-3.5" />
              {location}
            </div>
          )}
          <p className="text-white/70 text-lg max-w-2xl mx-auto mb-8">
            {consultant.bio
              ? consultant.bio
              : "I'm sharing the power of NFGN's naturopathic wellness products and opportunity with my community. Join through my personal link to get started."}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
            <Link href={joinUrl}>
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8">
                <UserPlus className="h-5 w-5 mr-2" />
                Join My Team (Free)
              </Button>
            </Link>
            <Link href={`/join/pro?ref=${username}`}>
              <Button size="lg" className="px-8 font-bold" style={{ background: "#C9A84C", color: "#0a0a0a" }}>
                <Star className="h-5 w-5 mr-2 fill-current" />
                Register as Pro Member
              </Button>
            </Link>
            <Link href={`/shop?ref=${username}`}>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8">
                <ShoppingBag className="h-5 w-5 mr-2" />
                Shop Products
              </Button>
            </Link>
          </div>

          {/* Social share */}
          <div className="flex items-center justify-center gap-2 flex-wrap mt-6">
            <span className="text-white/40 text-xs font-medium">Share this page:</span>
            <button
              onClick={shareWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "#25D366" }}
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </button>
            <button
              onClick={shareFacebook}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "#1877F2" }}
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Facebook
            </button>
            <button
              onClick={shareSms}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white/80 border border-white/25 hover:border-white/50 transition-colors"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              SMS
            </button>
            <button
              onClick={copyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors"
              style={copied ? { background: BRAND_GREEN, color: "#fff", borderColor: BRAND_GREEN } : { color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.2)" }}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy Link"}
            </button>
          </div>

          {consultant.phone && (
            <div className="flex items-center justify-center gap-6 mt-6 text-white/60 text-sm">
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                {consultant.phone}
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {consultant.email}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ── WHY NFGN ── */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-serif font-bold text-center mb-3">Why Join NFGN?</h2>
          <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
            New Face Global Network is built on the principle of keeping money circulating within your own community while improving everyone's health.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Leaf, title: "Premium Naturopathic Products", desc: "Handcrafted wellness formulas, herbal cleanses, soaps, candles, and more — all natural, all effective." },
              { icon: Users, title: "True Community Wealth", desc: "Money earned circulates back into your community. Build generational wealth, not just a paycheck." },
              { icon: Award, title: "3-Type Commission Plan", desc: "Earn through referrals, sales commissions, and level-based bonuses — up to 22% on Level 2 Pro Package sales." },
              { icon: Sparkles, title: "Power Squad Bonus", desc: "Earn $200 every 9 Level 2 Pro Package sales. Repeat the cycle, repeat the bonus." },
              { icon: Calendar, title: "Book-A-Professional", desc: "Access certified naturopaths, wellness coaches, and business consultants through our exclusive pro network." },
              { icon: CheckCircle2, title: "Free to Start", desc: "Basic membership is free. Upgrade to Pro for sales commissions and advanced team bonuses anytime." },
            ].map(item => (
              <Card key={item.title} className="border-0 shadow-sm">
                <CardContent className="pt-6 space-y-3">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${BRAND_GOLD}20` }}>
                    <item.icon className="h-5 w-5" style={{ color: BRAND_GOLD }} />
                  </div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ── */}
      {featuredProducts.length > 0 && (
        <section className="py-16">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-3xl font-serif font-bold text-center mb-3">Featured Wellness Products</h2>
            <p className="text-center text-muted-foreground mb-10">
              Shop through {displayName}'s personal store and support your community.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.map(product => (
                <Card key={product.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                  <div className="aspect-[4/3] bg-muted overflow-hidden">
                    {resolveImageSrc(product.image) ? (
                      <img src={resolveImageSrc(product.image)!} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                        <Leaf className="h-12 w-12 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    {product.isProPackage && <Badge className="mb-2 text-xs" variant="secondary">Pro Package</Badge>}
                    <h3 className="font-semibold mb-1 line-clamp-1">{product.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold" style={{ color: BRAND_GOLD }}>${product.price.toFixed(2)}</span>
                        {product.comparePrice && (
                          <span className="text-xs line-through text-muted-foreground ml-2">${product.comparePrice.toFixed(2)}</span>
                        )}
                      </div>
                      <Link href={`/shop?ref=${username}`}>
                        <Button size="sm" variant="outline">Shop</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href={`/shop?ref=${username}`}>
                <Button variant="outline" className="gap-2">
                  View All Products <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── BOOK-A-PROFESSIONAL ── */}
      {professionals.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-3xl font-serif font-bold text-center mb-3">Book-A-Professional</h2>
            <p className="text-center text-muted-foreground mb-10 max-w-xl mx-auto">
              Get expert guidance from NFGN-affiliated naturopaths, coaches, and consultants.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {professionals.map(pro => (
                <Card key={pro.id} className="flex gap-4 p-5">
                  {pro.avatar ? (
                    <img src={pro.avatar} alt={pro.name} className="h-14 w-14 rounded-full object-cover flex-shrink-0 border-2 border-primary/30" />
                  ) : (
                    <div className="h-14 w-14 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0 border-2 border-primary/30"
                      style={{ background: `linear-gradient(135deg, ${BRAND_GOLD}, ${BRAND_GREEN})` }}>
                      {pro.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{pro.name}</h3>
                    <p className="text-xs text-primary mb-1">{pro.specialty}</p>
                    <StarRating rating={pro.rating} />
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-sm font-bold" style={{ color: BRAND_GOLD }}>${pro.hourlyRate}/hr</span>
                      {pro.isAvailable && <Badge variant="outline" className="text-xs text-green-600 border-green-300">Available</Badge>}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href={`/login?ref=${username}&next=/dashboard/bookings`}>
                <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Calendar className="h-4 w-4" />
                  Book a Session
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── TESTIMONIALS ── */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-serif font-bold text-center mb-10">What Our Community Says</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map(t => (
              <Card key={t.id} className="p-6">
                <div className="flex gap-0.5 mb-3">
                  {[1, 2, 3, 4, 5].map(n => (
                    <Star key={n} className={`h-4 w-4 ${n <= t.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 italic">"{t.text}"</p>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {t.name[0]}
                  </div>
                  <span className="text-sm font-semibold">{t.name}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── GET THE APP ── */}
      <section className="py-12 bg-muted/20 overflow-hidden">
        <div className="max-w-5xl mx-auto px-4">
          <div className="rounded-2xl overflow-hidden border shadow-sm">

            {/* Mobile: stacked — QR on top, steps below. Desktop: side by side */}
            <div className="flex flex-col md:grid md:grid-cols-2">

              {/* QR code panel */}
              <div
                className="flex flex-col items-center justify-center text-center py-10 px-8 text-white"
                style={{ background: `linear-gradient(135deg, ${BRAND_BLACK}, #1a1a2e)` }}
              >
                <div className="flex items-center justify-center gap-2 mb-5">
                  <Smartphone className="h-5 w-5 flex-shrink-0" style={{ color: BRAND_GOLD }} />
                  <span className="font-serif font-bold text-lg" style={{ color: BRAND_GOLD }}>
                    Get the NFGN App
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-white shadow-lg">
                  <QRCodeSVG
                    value={pageUrl}
                    size={150}
                    bgColor="#ffffff"
                    fgColor="#0a0a0a"
                    level="H"
                  />
                </div>
                <p className="text-white/60 text-xs mt-4 leading-relaxed">
                  Scan with any phone camera
                </p>
              </div>

              {/* Install steps panel */}
              <div className="p-6 md:p-8 flex flex-col justify-center bg-white space-y-5">
                <div>
                  <h3 className="text-xl font-serif font-bold mb-1">Install on Your Phone</h3>
                  <p className="text-sm text-muted-foreground">
                    No app store needed — installs directly to your home screen.
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    { phone: "iPhone", steps: "Scan → Safari opens → tap Share → \"Add to Home Screen\"" },
                    { phone: "Android", steps: "Scan → Chrome opens → tap ⋮ menu → \"Add to Home screen\"" },
                  ].map(item => (
                    <div key={item.phone} className="flex gap-3 p-3 rounded-lg bg-muted/30 border">
                      <div
                        className="h-7 w-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: BRAND_GOLD }}
                      >
                        {item.phone[0]}
                      </div>
                      <div>
                        <p className="text-xs font-semibold">{item.phone}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{item.steps}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Copy link */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5 font-medium">Or share the link directly</p>
                  <div className="flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2 min-w-0">
                    <span className="text-xs font-mono text-muted-foreground flex-1 truncate min-w-0">{pageUrl}</span>
                    <button
                      onClick={copyLink}
                      className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-white transition-colors"
                      style={{ background: copied ? BRAND_GREEN : BRAND_GOLD }}
                    >
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: BRAND_GREEN }} />
                  Free · No app store account required · Works on any iPhone or Android
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16" style={{ background: `linear-gradient(135deg, ${BRAND_BLACK}, ${BRAND_GREEN})` }}>
        <div className="max-w-2xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl font-serif font-bold mb-4">Ready to Transform Your Life?</h2>
          <p className="text-white/70 mb-8 text-lg">
            Join {displayName}'s team today. Free membership, real products, real income.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={joinUrl}>
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-10">
                <UserPlus className="h-5 w-5 mr-2" />
                Join Free Today
              </Button>
            </Link>
            <Link href={`/shop?ref=${username}`}>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-10">
                Shop Products
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
