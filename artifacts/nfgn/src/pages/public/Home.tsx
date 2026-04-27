import { Link } from "wouter";
import {
  ArrowRight, Leaf, Users, TrendingUp, Trophy, Globe, Zap,
  Star, ChevronRight, Play, Shield, Building2, Activity, Network,
  DollarSign, Heart, Sparkles, CalendarDays,
} from "lucide-react";

const GOLD = "#C9A84C";
const GOLD_LIGHT = "rgba(201,168,76,0.12)";
const GOLD_MED = "rgba(201,168,76,0.25)";
const GREEN = "#2D6A4F";
const DARK = "#0a0a0a";
const DARK2 = "#111111";
const DARK3 = "#1a1a1a";

function HeroSection() {
  return (
    <section className="relative overflow-hidden" style={{ background: DARK, minHeight: "90vh" }}>
      {/* Background grid */}
      <div className="absolute inset-0" style={{
        backgroundImage: `linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
      }} />

      {/* Glowing orbs */}
      <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full opacity-10 pointer-events-none" style={{ background: `radial-gradient(circle, ${GOLD} 0%, transparent 70%)`, filter: "blur(60px)" }} />
      <div className="absolute bottom-20 right-1/4 w-64 h-64 rounded-full opacity-10 pointer-events-none" style={{ background: `radial-gradient(circle, ${GREEN} 0%, transparent 70%)`, filter: "blur(80px)" }} />

      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-28" style={{ minHeight: "90vh" }}>
        {/* Eyebrow */}
        <div className="flex items-center gap-2 mb-6 px-4 py-2 rounded-full" style={{ background: GOLD_LIGHT, border: `1px solid ${GOLD_MED}` }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: GOLD }} />
          <span className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: GOLD }}>Community · Wellness · Wealth · Sports</span>
        </div>

        {/* Main headline */}
        <h1 className="font-serif font-black leading-none mb-6" style={{ fontSize: "clamp(48px, 8vw, 96px)", color: "#fff" }}>
          More Than<br />
          <span style={{ color: GOLD, fontStyle: "italic" }}>A Network.</span><br />
          <span style={{ color: "rgba(255,255,255,0.85)" }}>A Movement.</span>
        </h1>

        <p className="text-sm md:text-base mb-18 max-w-lg leading-relaxed text-center mx-auto" style={{ color: "rgba(255,255,255,0.55)" }}>
          New Face Global Network unites naturopathic wellness, professional booking, business opportunity, and sports — powered by the industry's most innovative money circulation system.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <Link href="/join" className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold rounded-sm" style={{ background: GOLD, color: DARK }}>
            Join The Network <ArrowRight className="h-5 w-5" />
          </Link>
          <Link href="/shop" className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold rounded-sm" style={{ border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.8)", background: "transparent" }}>
            <Play className="h-4 w-4" style={{ color: GOLD }} /> Shop Collection
          </Link>
        </div>

        {/* Stats bar */}
        <div className="w-full max-w-3xl grid grid-cols-3" style={{ border: "1px solid rgba(201,168,76,0.2)", background: "rgba(255,255,255,0.02)" }}>
          {[
            { num: "10K+", label: "Active Members" },
            { num: "$2M+", label: "Circulated Annually" },
            { num: "9", label: "Business Pillars" },
          ].map((s, i) => (
            <div key={s.label} className="text-center py-6 px-4" style={{ borderRight: i < 2 ? "1px solid rgba(201,168,76,0.15)" : "none" }}>
              <div className="text-3xl font-serif font-black mb-1" style={{ color: GOLD }}>{s.num}</div>
              <div className="text-xs tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PillarsSection() {
  const pillars = [
    {
      icon: <Leaf className="h-7 w-7" />,
      number: "01",
      title: "Naturopathic Workshops, Products & Services",
      desc: "World-class naturopathic health products, workshops, and wellness services — including Medical Benefit Packages. Invest in your whole-body health with our curated offerings.",
      cta: "Shop Collection",
      href: "/shop",
      accent: GOLD,
    },
    {
      icon: <Users className="h-7 w-7" />,
      number: "02",
      title: "Book-A-Professional",
      desc: "Connect with certified wellness professionals, naturopaths, coaches, and consultants. Book one-on-one sessions directly through our integrated platform.",
      cta: "Browse Professionals",
      href: "/book",
      accent: GREEN,
    },
    {
      icon: <TrendingUp className="h-7 w-7" />,
      number: "03",
      title: "Business Opportunity",
      desc: "Join the most innovative compensation network in the industry. Build your business, grow your community, and participate in real money circulation.",
      cta: "Explore Opportunity",
      href: "/join",
      accent: GOLD,
    },
    {
      icon: <Trophy className="h-7 w-7" />,
      number: "04",
      title: "NFGN Sports",
      desc: "Where athletics meets community building. Support local sports organizations, schools, and teams through our network — wellness meets competition.",
      cta: "Learn More",
      href: "/about",
      accent: GREEN,
    },
    {
      icon: <Sparkles className="h-7 w-7" />,
      number: "05",
      title: "NFGN Handmade Soaps, Lotions & Candles",
      desc: "Handcrafted with love — our curated line of handmade soaps, candles, lotions, and artisan goods. Natural ingredients, beautiful results, and small-business heart at the core.",
      cta: "Browse Products",
      href: "/shop",
      accent: GOLD,
    },
    {
      icon: <CalendarDays className="h-7 w-7" />,
      number: "06",
      title: "Special Events",
      desc: "Exclusive NFGN live events, community gatherings, and pop-ups. Connect face-to-face with the network, celebrate milestones, and grow together in person.",
      cta: "View Events",
      href: "/about",
      accent: GREEN,
    },
    {
      icon: <Globe className="h-7 w-7" />,
      number: "07",
      title: "Travel Discounts, Events & More",
      desc: "Members-only travel deals, group retreats, and exclusive getaways. Save on flights, hotels, and experiences while building lasting connections around the world.",
      cta: "Explore Travel",
      href: "/about",
      accent: GOLD,
    },
    {
      icon: <Zap className="h-7 w-7" />,
      number: "08",
      title: "Workshops & Training",
      desc: "Ongoing education, professional development workshops, and skill-building training sessions designed to elevate every member personally and professionally.",
      cta: "View Workshops",
      href: "/about",
      accent: GREEN,
    },
    {
      icon: <Network className="h-7 w-7" />,
      number: "09",
      title: "Money Circulation & Community Building",
      desc: "The heartbeat of NFGN — our proprietary money circulation system keeps wealth flowing within our community. Build together, earn together, and lift every member higher.",
      cta: "Join The Network",
      href: "/join",
      accent: GOLD,
    },
  ];

  return (
    <section style={{ background: DARK2 }} className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs font-bold tracking-[0.25em] uppercase" style={{ color: GOLD }}>What We Do</span>
          <h2 className="text-4xl md:text-5xl font-serif font-black text-white mt-3 mb-4">Nine Pillars.<br />One Powerful Network.</h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.45)" }}>
            Every arm of NFGN is designed to create value — for your health, your community, your wallet, and your lifestyle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3">
          {pillars.map((p, i) => (
            <Link key={p.number} href={p.href}>
              <div className="group relative overflow-hidden p-8 cursor-pointer transition-all duration-300 h-full"
                style={{
                  border: "1px solid rgba(255,255,255,0.06)",
                  background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "rgba(255,255,255,0.02)",
                }}>
                {/* Hover glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `radial-gradient(circle at 20% 50%, ${p.accent}12, transparent 70%)` }} />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-8">
                    <div className="h-14 w-14 flex items-center justify-center rounded-sm" style={{ background: `${p.accent}15`, color: p.accent, border: `1px solid ${p.accent}30` }}>
                      {p.icon}
                    </div>
                    <span className="font-serif font-black text-5xl" style={{ color: "rgba(255,255,255,0.04)" }}>{p.number}</span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3">{p.title}</h3>
                  <p className="leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>{p.desc}</p>

                  <div className="flex items-center gap-2 font-semibold text-sm group-hover:gap-3 transition-all" style={{ color: p.accent }}>
                    {p.cta} <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function PaymentGridSection() {
  return (
    <section className="py-24 px-6 relative overflow-hidden" style={{ background: DARK }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 100%, ${GREEN}18, transparent 60%)` }} />

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Left copy */}
          <div>
            <span className="text-xs font-bold tracking-[0.25em] uppercase" style={{ color: GOLD }}>Our Flagship Feature</span>
            <h2 className="text-4xl md:text-5xl font-serif font-black text-white mt-3 mb-6 leading-tight">
              2-Down By Infinity<br />
              <span style={{ color: GOLD }}>Multi Point Payment Grid</span>
            </h2>
            <p className="text-lg leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.55)" }}>
              The financial engine behind NFGN. Our revolutionary grid system creates real money circulation that benefits individuals, schools, nonprofits, sports organizations, and local businesses — both in the United States and abroad.
            </p>
            <div className="space-y-4 mb-8">
              {[
                { icon: <Globe className="h-4 w-4" />, text: "US & international money circulation" },
                { icon: <Building2 className="h-4 w-4" />, text: "Supports schools, nonprofits & local businesses" },
                { icon: <Network className="h-4 w-4" />, text: "Infinite depth — no earning ceiling" },
                { icon: <Shield className="h-4 w-4" />, text: "Transparent, trackable compensation" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-sm flex items-center justify-center flex-shrink-0" style={{ background: GOLD_LIGHT, color: GOLD }}>
                    {item.icon}
                  </div>
                  <span style={{ color: "rgba(255,255,255,0.7)" }}>{item.text}</span>
                </div>
              ))}
            </div>
            <Link href="/join" className="inline-flex items-center gap-2 px-7 py-3.5 font-bold text-sm rounded-sm" style={{ background: GOLD, color: DARK }}>
              Learn How It Works <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Right: Grid diagram */}
          <div className="relative">
            <div className="rounded-sm p-8" style={{ background: DARK3, border: "1px solid rgba(201,168,76,0.2)" }}>
              <div className="text-center mb-4">
                <span className="text-xs font-bold tracking-widest uppercase" style={{ color: GOLD }}>Your Grid Structure</span>
              </div>

              {/* Radial SVG diagram */}
              <div className="flex justify-center">
                <svg viewBox="0 0 340 340" width="100%" style={{ maxWidth: 320 }} aria-label="Grid structure diagram">
                  {/* Orbital rings */}
                  <circle cx="170" cy="170" r="75" fill="none" stroke={`${GOLD}18`} strokeWidth="1" strokeDasharray="4 4" />
                  <circle cx="170" cy="170" r="138" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 4" />

                  {/* Spoke lines — YOU to L1 (4 nodes at 0°, 90°, 180°, 270°) */}
                  {[[170,95],[245,170],[170,245],[95,170]].map(([x,y], i) => (
                    <line key={`sl1-${i}`} x1="170" y1="170" x2={x} y2={y}
                      stroke={`${GOLD}35`} strokeWidth="1.5" />
                  ))}

                  {/* Spoke lines — YOU to L2 (6 nodes at 0°,60°,120°,180°,240°,300°) */}
                  {[0,60,120,180,240,300].map((deg, i) => {
                    const rad = (deg * Math.PI) / 180;
                    const x = 170 + 138 * Math.cos(rad);
                    const y = 170 + 138 * Math.sin(rad);
                    return <line key={`sl2-${i}`} x1="170" y1="170" x2={x} y2={y}
                      stroke="rgba(255,255,255,0.08)" strokeWidth="1" />;
                  })}

                  {/* L1 nodes — 4 at cardinal positions, radius 75 */}
                  {[[170,95],[245,170],[170,245],[95,170]].map(([x,y], i) => (
                    <g key={`l1-${i}`}>
                      <circle cx={x} cy={y} r="22" fill={`${GREEN}35`} stroke={`${GREEN}90`} strokeWidth="1.5" />
                      <text x={x} y={y+1} textAnchor="middle" dominantBaseline="middle"
                        fontSize="10" fontWeight="700" fill="#6EE7A0">L1</text>
                    </g>
                  ))}

                  {/* L2 nodes — 6 at 60° intervals, radius 138 */}
                  {[0,60,120,180,240,300].map((deg, i) => {
                    const rad = (deg * Math.PI) / 180;
                    const x = 170 + 138 * Math.cos(rad);
                    const y = 170 + 138 * Math.sin(rad);
                    return (
                      <g key={`l2-${i}`}>
                        <circle cx={x} cy={y} r="18" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
                        <text x={x} y={y+1} textAnchor="middle" dominantBaseline="middle"
                          fontSize="9" fontWeight="600" fill="rgba(255,255,255,0.6)">L2</text>
                      </g>
                    );
                  })}

                  {/* Center — YOU */}
                  <circle cx="170" cy="170" r="32" fill={GOLD} />
                  <text x="170" y="171" textAnchor="middle" dominantBaseline="middle"
                    fontSize="11" fontWeight="800" fill={DARK}>YOU</text>
                </svg>
              </div>

              {/* Counts + infinity */}
              <div className="flex justify-center gap-6 mt-2 mb-3">
                <div className="text-center">
                  <div className="text-lg font-serif font-black" style={{ color: "#6EE7A0" }}>4</div>
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Level 1</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-serif font-black" style={{ color: "rgba(255,255,255,0.5)" }}>6</div>
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Level 2</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-serif font-black" style={{ color: `${GOLD}90` }}>∞</div>
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Depth</div>
                </div>
              </div>
              <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Infinite depth, infinite potential</p>

              {/* Legend */}
              <div className="mt-5 pt-4 grid grid-cols-2 gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ background: GOLD }} />
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>You earn commissions</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ background: GREEN }} />
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Money circulates</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CommunitySection() {
  const communities = [
    { icon: <Users className="h-6 w-6" />, title: "Individuals", desc: "Build real income by sharing products and services you believe in." },
    { icon: <Building2 className="h-6 w-6" />, title: "Schools", desc: "Fundraise and create sustainable revenue streams for educational programs." },
    { icon: <Heart className="h-6 w-6" />, title: "Nonprofits", desc: "Access ongoing funding and community support through the NFGN grid." },
    { icon: <Trophy className="h-6 w-6" />, title: "Sports Orgs", desc: "Fund teams, leagues, and athletic programs across the country and beyond." },
    { icon: <DollarSign className="h-6 w-6" />, title: "Local Businesses", desc: "Plug into the NFGN ecosystem and expand your customer base organically." },
    { icon: <Globe className="h-6 w-6" />, title: "International", desc: "Global reach — money circulation crosses US borders seamlessly." },
  ];

  return (
    <section className="py-24 px-6" style={{ background: DARK2 }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs font-bold tracking-[0.25em] uppercase" style={{ color: GOLD }}>Who Benefits</span>
          <h2 className="text-4xl md:text-5xl font-serif font-black text-white mt-3 mb-4">Money Circulation<br />For Everyone</h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.45)" }}>
            NFGN isn't just for entrepreneurs. Our grid creates wealth pathways for entire communities.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3">
          {communities.map((c) => (
            <div key={c.title} className="group p-8 text-center" style={{ border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="h-12 w-12 rounded-sm flex items-center justify-center mx-auto mb-4 transition-all group-hover:scale-110 duration-300" style={{ background: GOLD_LIGHT, color: GOLD }}>
                {c.icon}
              </div>
              <h3 className="font-bold text-white mb-2">{c.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SportsSection() {
  return (
    <section className="py-24 px-6 relative overflow-hidden" style={{ background: DARK }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(135deg, ${GREEN}12, transparent 60%)` }} />
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="rounded-sm overflow-hidden" style={{ border: `1px solid ${GREEN}40`, background: `${GREEN}08` }}>
          <div className="p-12 md:p-16 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-sm flex items-center justify-center" style={{ background: GREEN, color: "#fff" }}>
                  <Trophy className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: "#6EE7A0" }}>Now Launching</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-serif font-black text-white mb-4 leading-tight">
                NFGN<br /><span style={{ color: "#6EE7A0" }}>Sports</span>
              </h2>
              <p className="text-lg leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.55)" }}>
                Where health, community, and athletics converge. NFGN Sports supports local teams, school programs, and youth athletics while embedding them into our money circulation ecosystem.
              </p>
              <div className="flex flex-wrap gap-3">
                {["Youth Programs", "School Teams", "Local Leagues", "Sports Nonprofits"].map((tag) => (
                  <span key={tag} className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ background: `${GREEN}20`, color: "#6EE7A0", border: `1px solid ${GREEN}40` }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-4">
              {[
                { icon: <Activity className="h-5 w-5" />, title: "Athlete Support Programs", desc: "Fund training, equipment, and travel for athletes at every level." },
                { icon: <Users className="h-5 w-5" />, title: "Team Fundraising Grid", desc: "Teams plug into NFGN's payment grid and generate ongoing income." },
                { icon: <Zap className="h-5 w-5" />, title: "Wellness Integration", desc: "Athletes access NFGN naturopathic products at member pricing." },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4 p-5 rounded-sm" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="h-10 w-10 rounded-sm flex items-center justify-center flex-shrink-0" style={{ background: `${GREEN}25`, color: "#6EE7A0" }}>
                    {item.icon}
                  </div>
                  <div>
                    <div className="font-bold text-white mb-1 text-sm">{item.title}</div>
                    <div className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="py-28 px-6 relative overflow-hidden" style={{ background: DARK }}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full opacity-15 pointer-events-none" style={{ background: `radial-gradient(ellipse, ${GOLD}, transparent 70%)`, filter: "blur(60px)" }} />

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <div className="flex justify-center mb-6">
          <div className="flex">
            {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5" style={{ color: GOLD }} fill={GOLD} />)}
          </div>
        </div>
        <h2 className="text-4xl md:text-6xl font-serif font-black text-white mb-6 leading-tight">
          Ready to join the<br /><span style={{ color: GOLD, fontStyle: "italic" }}>New Face Movement?</span>
        </h2>
        <p className="text-xl mb-10" style={{ color: "rgba(255,255,255,0.5)" }}>
          Join thousands of members building health, wealth, and community through the most innovative network in the industry.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/join" className="inline-flex items-center justify-center gap-2 px-10 py-4 text-base font-black rounded-sm" style={{ background: GOLD, color: DARK }}>
            Start Your Journey <ArrowRight className="h-5 w-5" />
          </Link>
          <Link href="/about" className="inline-flex items-center justify-center gap-2 px-10 py-4 text-base font-semibold rounded-sm" style={{ border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)", background: "transparent" }}>
            View Business Plan
          </Link>
        </div>
        <p className="mt-6 text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>No obligation. No pressure. Just opportunity.</p>
      </div>
    </section>
  );
}

export function Home() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      <HeroSection />
      <PillarsSection />
      <PaymentGridSection />
      <CommunitySection />
      <SportsSection />
      <CtaSection />
    </div>
  );
}
