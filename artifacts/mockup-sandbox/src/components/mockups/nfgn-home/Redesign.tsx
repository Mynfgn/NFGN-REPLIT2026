import { ArrowRight, Leaf, Users, TrendingUp, Trophy, Globe, Zap, Star, ChevronRight, Play, Shield, DollarSign, Heart, Building2, Activity, Network } from "lucide-react";

const GOLD = "#C9A84C";
const GOLD_LIGHT = "rgba(201,168,76,0.12)";
const GOLD_MED = "rgba(201,168,76,0.25)";
const GREEN = "#2D6A4F";
const DARK = "#0a0a0a";
const DARK2 = "#111111";
const DARK3 = "#1a1a1a";

function Nav() {
  return (
    <nav style={{ background: "rgba(10,10,10,0.96)", borderBottom: `1px solid rgba(201,168,76,0.2)` }}
      className="w-full flex items-center justify-between px-8 py-4 sticky top-0 z-50 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <span className="text-2xl font-serif font-black" style={{ color: GOLD }}>NFGN</span>
        <span className="text-xs text-white/40 hidden sm:block tracking-[0.2em] uppercase mt-1">New Face Global Network</span>
      </div>
      <div className="hidden md:flex items-center gap-8">
        {["Shop", "Book-A-Pro", "Sports", "Business"].map(item => (
          <a key={item} className="text-sm text-white/60 hover:text-white transition-colors cursor-pointer">{item}</a>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button className="text-sm text-white/70 hover:text-white px-4 py-2 transition-colors">Sign In</button>
        <button className="text-sm font-semibold px-5 py-2 rounded-sm"
          style={{ background: GOLD, color: DARK }}>Join Network</button>
      </div>
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden" style={{ background: DARK, minHeight: "92vh" }}>
      {/* Background grid */}
      <div className="absolute inset-0" style={{
        backgroundImage: `linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px)`,
        backgroundSize: "60px 60px"
      }} />

      {/* Glowing orbs */}
      <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full opacity-10" style={{ background: `radial-gradient(circle, ${GOLD} 0%, transparent 70%)`, filter: "blur(60px)" }} />
      <div className="absolute bottom-20 right-1/4 w-64 h-64 rounded-full opacity-8" style={{ background: `radial-gradient(circle, ${GREEN} 0%, transparent 70%)`, filter: "blur(80px)" }} />

      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-24" style={{ minHeight: "92vh" }}>
        {/* Eyebrow */}
        <div className="flex items-center gap-2 mb-6 px-4 py-2 rounded-full" style={{ background: GOLD_LIGHT, border: `1px solid ${GOLD_MED}` }}>
          <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: GOLD }} />
          <span className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: GOLD }}>Community · Wellness · Wealth · Sports</span>
        </div>

        {/* Main headline */}
        <h1 className="font-serif font-black leading-none mb-6" style={{ fontSize: "clamp(48px, 8vw, 96px)", color: "#fff" }}>
          More Than<br />
          <span style={{ color: GOLD, fontStyle: "italic" }}>A Network.</span><br />
          <span style={{ color: "rgba(255,255,255,0.85)" }}>A Movement.</span>
        </h1>

        <p className="text-lg md:text-xl mb-4 max-w-2xl leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
          New Face Global Network unites naturopathic wellness, professional booking, business opportunity, and sports — powered by the industry's most innovative money circulation system.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {["Naturopathic Products", "Book-A-Professional", "Business Opportunity", "NFGN Sports"].map((f, i) => (
            <span key={i} className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: DARK3, border: `1px solid rgba(255,255,255,0.1)`, color: "rgba(255,255,255,0.6)" }}>
              {f}
            </span>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <button className="flex items-center gap-2 px-8 py-4 text-base font-bold rounded-sm" style={{ background: GOLD, color: DARK }}>
            Join The Network <ArrowRight className="h-5 w-5" />
          </button>
          <button className="flex items-center gap-2 px-8 py-4 text-base font-semibold rounded-sm" style={{ border: `1px solid rgba(255,255,255,0.2)`, color: "rgba(255,255,255,0.8)", background: "transparent" }}>
            <Play className="h-4 w-4" style={{ color: GOLD }} /> Watch Overview
          </button>
        </div>

        {/* Stats bar */}
        <div className="w-full max-w-3xl grid grid-cols-3 gap-0" style={{ border: `1px solid rgba(201,168,76,0.2)`, background: "rgba(255,255,255,0.02)" }}>
          {[
            { num: "10K+", label: "Active Members" },
            { num: "$2M+", label: "Circulated Annually" },
            { num: "4", label: "Business Verticals" },
          ].map((s, i) => (
            <div key={i} className="text-center py-6 px-4" style={{ borderRight: i < 2 ? `1px solid rgba(201,168,76,0.15)` : "none" }}>
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
      title: "Naturopathic Products & Services",
      desc: "World-class natural health products, supplements, and wellness services formulated for optimal vitality. Shop our curated collection and invest in your health.",
      cta: "Shop Collection",
      accent: GOLD,
    },
    {
      icon: <Users className="h-7 w-7" />,
      number: "02",
      title: "Book-A-Professional",
      desc: "Connect with certified wellness professionals, naturopaths, coaches, and consultants. Book one-on-one sessions directly through our integrated platform.",
      cta: "Browse Professionals",
      accent: GREEN,
    },
    {
      icon: <TrendingUp className="h-7 w-7" />,
      number: "03",
      title: "Business Opportunities",
      desc: "Join the most innovative compensation network in the industry. Build your business, grow your community, and participate in real money circulation.",
      cta: "Explore Opportunity",
      accent: GOLD,
    },
    {
      icon: <Trophy className="h-7 w-7" />,
      number: "04",
      title: "NFGN Sports",
      desc: "Where athletics meets community building. Support local sports organizations, schools, and teams through our network — wellness meets competition.",
      cta: "See NFGN Sports",
      accent: GREEN,
    },
  ];

  return (
    <section style={{ background: DARK2 }} className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs font-bold tracking-[0.25em] uppercase" style={{ color: GOLD }}>What We Do</span>
          <h2 className="text-4xl md:text-5xl font-serif font-black text-white mt-3 mb-4">Four Pillars.<br />One Powerful Network.</h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.45)" }}>
            Every arm of NFGN is designed to create value — for your health, your community, and your wallet.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {pillars.map((p, i) => (
            <div key={i} className="group relative overflow-hidden p-10 cursor-pointer transition-all duration-300"
              style={{
                border: `1px solid rgba(255,255,255,0.06)`,
                background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "rgba(255,255,255,0.02)",
              }}>
              {/* Hover glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: `radial-gradient(circle at 20% 50%, ${p.accent}10, transparent 70%)` }} />

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
          ))}
        </div>
      </div>
    </section>
  );
}

function PaymentGridSection() {
  return (
    <section className="py-24 px-6 relative overflow-hidden" style={{ background: DARK }}>
      {/* Gold gradient backdrop */}
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 50% 100%, ${GREEN}20, transparent 60%)` }} />

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
                { icon: <Globe className="h-4 w-4" />, text: "US & International money circulation" },
                { icon: <Building2 className="h-4 w-4" />, text: "Supports schools, nonprofits & local businesses" },
                { icon: <Network className="h-4 w-4" />, text: "Infinite depth — no earning ceiling" },
                { icon: <Shield className="h-4 w-4" />, text: "Transparent, trackable compensation" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-sm flex items-center justify-center flex-shrink-0" style={{ background: GOLD_LIGHT, color: GOLD }}>
                    {item.icon}
                  </div>
                  <span style={{ color: "rgba(255,255,255,0.7)" }}>{item.text}</span>
                </div>
              ))}
            </div>
            <button className="flex items-center gap-2 px-7 py-3.5 font-bold text-sm rounded-sm" style={{ background: GOLD, color: DARK }}>
              Learn How It Works <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Right: Grid diagram */}
          <div className="relative">
            <div className="rounded-sm p-8" style={{ background: DARK3, border: `1px solid rgba(201,168,76,0.2)` }}>
              <div className="text-center mb-6">
                <span className="text-xs font-bold tracking-widest uppercase" style={{ color: GOLD }}>Your Grid Structure</span>
              </div>

              {/* Root node */}
              <div className="flex justify-center mb-4">
                <div className="h-14 w-14 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: GOLD, color: DARK }}>
                  YOU
                </div>
              </div>

              {/* Connecting line */}
              <div className="flex justify-center mb-2">
                <div className="w-px h-6" style={{ background: `${GOLD}50` }} />
              </div>

              {/* Level 1 */}
              <div className="flex justify-center gap-12 mb-2">
                {[1, 2].map(n => (
                  <div key={n} className="flex flex-col items-center">
                    <div className="h-11 w-11 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: `${GREEN}40`, border: `1px solid ${GREEN}80`, color: GREEN }}>
                      L1
                    </div>
                  </div>
                ))}
              </div>

              {/* L1 arrows */}
              <div className="flex justify-center gap-12 mb-2">
                {[1, 2].map(n => <div key={n} className="w-px h-5" style={{ background: `${GREEN}50` }} />)}
              </div>

              {/* Level 2 — 4 nodes */}
              <div className="flex justify-center gap-5 mb-2">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "rgba(255,255,255,0.05)", border: `1px solid rgba(255,255,255,0.15)`, color: "rgba(255,255,255,0.6)" }}>
                    L2
                  </div>
                ))}
              </div>

              {/* Infinity dots */}
              <div className="flex justify-center mt-3">
                <div className="flex items-center gap-2">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="rounded-full" style={{ width: 4, height: 4, background: `rgba(201,168,76,${0.1 + i * 0.08})`, marginTop: i % 2 === 0 ? 2 : 0 }} />
                  ))}
                </div>
              </div>
              <div className="text-center mt-3">
                <span className="text-xl font-serif font-black" style={{ color: `${GOLD}80` }}>∞</span>
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>Infinite depth, infinite potential</p>
              </div>

              {/* Arrow legend */}
              <div className="mt-6 pt-5 grid grid-cols-2 gap-3" style={{ borderTop: `1px solid rgba(255,255,255,0.06)` }}>
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
    { icon: <Building2 className="h-6 w-6" />, title: "Local Businesses", desc: "Plug into the NFGN ecosystem and expand your customer base organically." },
    { icon: <Globe className="h-6 w-6" />, title: "International", desc: "Global reach — the money circulation crosses US borders seamlessly." },
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

        <div className="grid grid-cols-2 md:grid-cols-3 gap-0">
          {communities.map((c, i) => (
            <div key={i} className="group p-8 text-center" style={{ border: `1px solid rgba(255,255,255,0.05)` }}>
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
      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${GREEN}15, transparent 60%)` }} />
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="rounded-sm overflow-hidden" style={{ border: `1px solid ${GREEN}40`, background: `${GREEN}08` }}>
          <div className="p-12 md:p-16 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-sm flex items-center justify-center" style={{ background: GREEN, color: "#fff" }}>
                  <Trophy className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: GREEN }}>Now Launching</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-serif font-black text-white mb-4 leading-tight">
                NFGN<br /><span style={{ color: "#6EE7A0" }}>Sports</span>
              </h2>
              <p className="text-lg leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.55)" }}>
                Where health, community, and athletics converge. NFGN Sports supports local teams, school programs, and youth athletics while embedding them into our money circulation ecosystem.
              </p>
              <div className="flex flex-wrap gap-3">
                {["Youth Programs", "School Teams", "Local Leagues", "Sports Nonprofits"].map((tag, i) => (
                  <span key={i} className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ background: `${GREEN}20`, color: "#6EE7A0", border: `1px solid ${GREEN}40` }}>
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
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-5 rounded-sm" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid rgba(255,255,255,0.06)` }}>
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
      {/* Gold glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full opacity-15" style={{ background: `radial-gradient(ellipse, ${GOLD}, transparent 70%)`, filter: "blur(60px)" }} />

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
          <button className="flex items-center justify-center gap-2 px-10 py-4 text-base font-black rounded-sm" style={{ background: GOLD, color: DARK }}>
            Start Your Journey <ArrowRight className="h-5 w-5" />
          </button>
          <button className="flex items-center justify-center gap-2 px-10 py-4 text-base font-semibold rounded-sm" style={{ border: `1px solid rgba(255,255,255,0.15)`, color: "rgba(255,255,255,0.7)", background: "transparent" }}>
            View Business Plan
          </button>
        </div>
        <p className="mt-6 text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>No obligation. No pressure. Just opportunity.</p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="px-8 py-12" style={{ background: "#050505", borderTop: `1px solid rgba(201,168,76,0.15)` }}>
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="text-xl font-serif font-black mb-1" style={{ color: GOLD }}>NFGN</div>
          <div className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>New Face Global Network</div>
        </div>
        <div className="flex gap-8">
          {["Shop", "Book-A-Pro", "Join", "About", "Contact"].map(link => (
            <a key={link} className="text-xs cursor-pointer hover:opacity-80" style={{ color: "rgba(255,255,255,0.4)" }}>{link}</a>
          ))}
        </div>
        <div className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>© 2025 NFGN. All rights reserved.</div>
      </div>
    </footer>
  );
}

export function Redesign() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", background: DARK }}>
      <Nav />
      <HeroSection />
      <PillarsSection />
      <PaymentGridSection />
      <CommunitySection />
      <SportsSection />
      <CtaSection />
      <Footer />
    </div>
  );
}
