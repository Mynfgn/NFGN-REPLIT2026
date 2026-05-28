import { Link } from "wouter";
import { useEffect, useState } from "react";
import {
  ArrowRight, Leaf, Users, TrendingUp, Trophy, Zap,
  Network, Sparkles, CalendarDays, ChevronRight, Star,
  ShieldCheck, Heart, Plane, Package,
} from "lucide-react";

const ORANGE = "#E8700A";
const YELLOW = "#F5C100";
const BLACK = "#0a0a0a";
const DARK = "#1a1a1a";
const GRAY = "#f5f5f5";
const GRAY2 = "#e8e8e8";
const GRAY3 = "#9ca3af";
const WHITE = "#ffffff";
const I = "/images/";

const pillars = [
  {
    icon: <Leaf className="h-5 w-5" />,
    number: "01",
    title: "IGNITE — Naturopathic Products",
    desc: "IGNITE Herbal Gut Cleanse, IGNITE XL Appetite Suppressant, The Prophetic Diet, and our full line of wellness supplements — crafted from all-natural ingredients.",
    cta: "Shop Products",
    href: "/shop",
    img: `${I}ignite-products.png`,
    imgClass: "object-contain bg-white",
  },
  {
    icon: <Users className="h-5 w-5" />,
    number: "02",
    title: "Book-A-Professional",
    desc: "Connect with certified wellness professionals, naturopaths, health coaches, and consultants for one-on-one sessions through our integrated booking platform.",
    cta: "Browse Professionals",
    href: "/book",
    img: `${I}book-a-pro-hero.png`,
    imgClass: "object-cover",
  },
  {
    icon: <TrendingUp className="h-5 w-5" />,
    number: "03",
    title: "Business Opportunity",
    desc: "Join the most innovative money circulation network in the industry. Build your business, grow your community, and create real, lasting wealth.",
    cta: "Join The Network",
    href: "/join",
    img: `${I}community-money-circulation.png`,
    imgClass: "object-cover",
  },
  {
    icon: <Trophy className="h-5 w-5" />,
    number: "04",
    title: "NFGN Sports",
    desc: "Where athletics meets community. NFGN Elite supports local youth sports organizations, schools, and teams — building character on and off the court.",
    cta: "Learn More",
    href: "/about",
    img: `${I}nfgn-elite-championship.png`,
    imgClass: "object-cover",
  },
  {
    icon: <Sparkles className="h-5 w-5" />,
    number: "05",
    title: "Handmade Soaps, Lotions & Candles",
    desc: "Handcrafted with all-natural ingredients — our artisan soaps, luxurious lotions, and aromatherapy candles bring wellness into your daily self-care routine.",
    cta: "Shop Artisan Goods",
    href: "/shop",
    img: `${I}marcelino-soaps-lotions-candles.png`,
    imgClass: "object-cover",
  },
  {
    icon: <CalendarDays className="h-5 w-5" />,
    number: "06",
    title: "Special Events",
    desc: "Exclusive NFGN live events, community gatherings, pop-ups, and celebrations. Connect face-to-face, grow together, and experience the movement in person.",
    cta: "View Events",
    href: "/about",
    img: `${I}pillar-events.png`,
    imgClass: "object-cover",
  },
  {
    icon: <Plane className="h-5 w-5" />,
    number: "07",
    title: "NFGN Travel & Packages",
    desc: "Members-only travel deals, group retreats, and exclusive getaways. Save on flights, hotels, and curated travel experiences while building community worldwide.",
    cta: "Explore Travel",
    href: "/about",
    img: `${I}nfgn-travel-hero.png`,
    imgClass: "object-cover",
  },
  {
    icon: <Zap className="h-5 w-5" />,
    number: "08",
    title: "Workshops & Training",
    desc: "Ongoing professional development workshops, wellness education, and business skill-building sessions designed to elevate every member personally and professionally.",
    cta: "View Workshops",
    href: "/about",
    img: `${I}workshop.png`,
    imgClass: "object-cover",
  },
  {
    icon: <Network className="h-5 w-5" />,
    number: "09",
    title: "Money Circulation & Community",
    desc: "The heartbeat of NFGN — our proprietary money circulation system keeps wealth flowing within our community. Build together, earn together, lift every member higher.",
    cta: "Join The Network",
    href: "/join",
    img: `${I}teamwork.png`,
    imgClass: "object-cover",
  },
];

export function Home() {
  const [hoveredPillar, setHoveredPillar] = useState<number | null>(null);

  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap";
    document.head.appendChild(l);
    return () => { document.head.removeChild(l); };
  }, []);

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", background: WHITE, color: DARK }} className="overflow-x-hidden">

      {/* ── IGNITE HERO ──────────────────────────────────────────────── */}
      <section style={{ background: WHITE }} className="w-full">
        <div className="max-w-6xl mx-auto px-6 pt-10 pb-4">
          <img
            src={`${I}ignite-products.png`}
            alt="IGNITE — Cleanse. Control. Transform."
            className="w-full h-auto"
            style={{ maxHeight: 520, objectFit: "contain" }}
          />
        </div>

        {/* Orange accent divider */}
        <div className="w-full h-1" style={{ background: `linear-gradient(to right, ${ORANGE}, ${YELLOW}, ${ORANGE})` }} />
      </section>

      {/* ── WELCOME TITLE ────────────────────────────────────────────── */}
      <section className="py-16 px-6 text-center" style={{ background: GRAY }}>
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-6 px-5 py-2 rounded-full text-xs font-bold tracking-widest uppercase" style={{ background: ORANGE + "15", border: `1px solid ${ORANGE}40`, color: ORANGE }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: ORANGE }} />
            New Orleans, Louisiana · Founded 2013
          </div>

          <h1 className="font-black leading-tight mb-5" style={{ fontSize: "clamp(36px, 5vw, 68px)", color: BLACK }}>
            Welcome To The{" "}
            <span style={{ color: ORANGE }}>NFGN</span>{" "}
            Community
          </h1>
          <h2 className="font-semibold mb-6" style={{ fontSize: "clamp(20px, 3vw, 36px)", color: DARK }}>
            Of Health &amp; Wellness
          </h2>

          <div className="w-20 h-1 mx-auto mb-7 rounded-full" style={{ background: `linear-gradient(to right, ${ORANGE}, ${YELLOW})` }} />

          <p className="text-lg max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: "#444" }}>
            A faith-rooted, naturopathic movement guided by{" "}
            <strong style={{ color: ORANGE }}>GOD First · Help First</strong> — uniting wellness, community, sports, and opportunity under one powerful network.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/join" className="inline-flex items-center gap-2 font-black px-9 py-4 rounded-full text-base shadow-lg transition-all hover:brightness-110 hover:-translate-y-0.5" style={{ background: ORANGE, color: WHITE }}>
              Become A Member <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/shop" className="inline-flex items-center gap-2 font-bold px-9 py-4 rounded-full text-base border-2 transition-all hover:bg-black/5" style={{ borderColor: BLACK, color: BLACK }}>
              Shop Now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────────────── */}
      <section className="grid grid-cols-4" style={{ background: BLACK }}>
        {[
          { num: "10K+", label: "Active Members" },
          { num: "$2M+", label: "Community Circulated" },
          { num: "9", label: "Business Pillars" },
          { num: "2013", label: "Year Founded" },
        ].map((s, i) => (
          <div key={s.label} className="flex flex-col items-center justify-center py-7 px-4 text-center" style={{ borderRight: i < 3 ? "1px solid rgba(255,255,255,0.1)" : "none" }}>
            <span className="text-3xl font-black" style={{ color: YELLOW }}>{s.num}</span>
            <span className="text-xs font-semibold tracking-widest uppercase mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>{s.label}</span>
          </div>
        ))}
      </section>

      {/* ── NINE PILLARS ─────────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: WHITE }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-black tracking-[0.25em] uppercase" style={{ color: ORANGE }}>What We Offer</span>
            <h2 className="font-black mt-3 mb-4" style={{ fontSize: "clamp(28px, 4vw, 48px)", color: BLACK }}>
              Nine Pillars. One Powerful Network.
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: GRAY3 }}>
              Every arm of NFGN creates real value — for your health, community, wallet, and lifestyle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3" style={{ border: `1px solid ${GRAY2}` }}>
            {pillars.map((p, i) => (
              <div
                key={p.number}
                className="group cursor-pointer bg-white transition-all duration-300 overflow-hidden"
                style={{
                  borderRight: (i % 3 < 2) ? `1px solid ${GRAY2}` : "none",
                  borderBottom: i < 6 ? `1px solid ${GRAY2}` : "none",
                  boxShadow: hoveredPillar === i ? "0 8px 32px rgba(232,112,10,0.12)" : "none",
                  transform: hoveredPillar === i ? "translateY(-2px)" : "none",
                  zIndex: hoveredPillar === i ? 2 : 1,
                  position: "relative",
                }}
                onMouseEnter={() => setHoveredPillar(i)}
                onMouseLeave={() => setHoveredPillar(null)}
              >
                {/* Image */}
                <div className="relative overflow-hidden" style={{ height: 180 }}>
                  <img
                    src={p.img}
                    alt={p.title}
                    className={`w-full h-full transition-transform duration-500 group-hover:scale-105 ${p.imgClass}`}
                  />
                  {/* Orange overlay on hover */}
                  <div className="absolute inset-0 transition-opacity duration-300" style={{ background: `linear-gradient(to top, ${ORANGE}55, transparent)`, opacity: hoveredPillar === i ? 1 : 0 }} />
                  {/* Number badge */}
                  <div className="absolute top-3 left-3 w-8 h-8 flex items-center justify-center font-black text-xs rounded-full" style={{ background: hoveredPillar === i ? ORANGE : BLACK, color: WHITE }}>
                    {p.number}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-9 w-9 flex items-center justify-center rounded-full flex-shrink-0 transition-colors duration-300" style={{ background: hoveredPillar === i ? ORANGE : GRAY, color: hoveredPillar === i ? WHITE : ORANGE }}>
                      {p.icon}
                    </div>
                    <h3 className="font-black text-sm leading-tight" style={{ color: BLACK }}>{p.title}</h3>
                  </div>
                  <p className="text-xs leading-relaxed mb-4" style={{ color: GRAY3 }}>{p.desc}</p>
                  <Link href={p.href} className="inline-flex items-center gap-1.5 text-xs font-bold transition-all group-hover:gap-2.5" style={{ color: ORANGE }}>
                    {p.cta} <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NFGN SPORTS ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: BLACK, minHeight: 480 }}>
        <div className="absolute inset-0">
          <img src={`${I}nfgn-elite-championship.png`} alt="NFGN Elite Championship" className="w-full h-full object-cover" style={{ objectPosition: "center 30%" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.85) 40%, rgba(0,0,0,0.3) 100%)" }} />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-8 py-20 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase" style={{ background: ORANGE + "20", border: `1px solid ${ORANGE}50`, color: ORANGE }}>
              <Trophy className="h-3.5 w-3.5" /> NFGN Sports Program
            </div>
            <h2 className="font-black leading-tight mb-5 text-white" style={{ fontSize: "clamp(32px, 4vw, 56px)" }}>
              NFGN Elite —<br />
              <span style={{ color: YELLOW }}>Championship</span> Culture
            </h2>
            <p className="leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.7)", maxWidth: 440 }}>
              The NFGN Elite squad embodies the spirit of our network — teamwork, discipline, and community pride. From youth leagues to championship courts, we build winners on and off the floor.
            </p>
            <div className="flex flex-wrap gap-3 mb-8">
              {["Youth Programs", "NFGN Elite Team", "Skills Camps", "School Partnerships"].map((t) => (
                <span key={t} className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: "rgba(245,193,0,0.12)", border: `1px solid ${YELLOW}40`, color: YELLOW }}>
                  {t}
                </span>
              ))}
            </div>
            <Link href="/about" className="inline-flex items-center gap-2 font-black px-7 py-3.5 rounded-full transition-all hover:brightness-110" style={{ background: ORANGE, color: WHITE }}>
              Learn About NFGN Sports <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── MONEY CIRCULATION ────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: GRAY }}>
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-14 items-center">
          <div className="rounded-2xl overflow-hidden shadow-xl order-2 md:order-1" style={{ border: `3px solid ${ORANGE}30` }}>
            <img src={`${I}community-money-circulation.png`} alt="Community Money Circulation" className="w-full h-72 md:h-96 object-cover" />
          </div>
          <div className="order-1 md:order-2">
            <span className="text-xs font-black tracking-[0.25em] uppercase" style={{ color: ORANGE }}>The NFGN Difference</span>
            <h2 className="font-black mt-3 mb-5 leading-tight" style={{ fontSize: "clamp(28px, 3.5vw, 44px)", color: BLACK }}>
              Money Circulation &amp; Community Building
            </h2>
            <p className="leading-relaxed mb-5 text-base" style={{ color: "#444" }}>
              <strong style={{ color: ORANGE }}>"A dollar spent within your community becomes two."</strong> — Joe Marcelino, Founder &amp; CEO
            </p>
            <p className="leading-relaxed mb-8 text-sm" style={{ color: "#666" }}>
              NFGN's proprietary money circulation model keeps wealth flowing within our community. Every purchase, every referral, every connection strengthens the entire network. When one wins, we all win.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {[
                { icon: <Heart className="h-4 w-4" />, t: "Faith-Centered" },
                { icon: <Network className="h-4 w-4" />, t: "9-Level Network" },
                { icon: <ShieldCheck className="h-4 w-4" />, t: "Transparent Plan" },
                { icon: <Users className="h-4 w-4" />, t: "Community First" },
              ].map((f) => (
                <div key={f.t} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: WHITE, border: `1px solid ${GRAY2}` }}>
                  <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full" style={{ background: ORANGE + "15", color: ORANGE }}>
                    {f.icon}
                  </div>
                  <span className="text-sm font-bold" style={{ color: DARK }}>{f.t}</span>
                </div>
              ))}
            </div>
            <Link href="/join" className="inline-flex items-center gap-2 font-black px-7 py-3.5 rounded-full transition-all hover:brightness-110 shadow-md" style={{ background: ORANGE, color: WHITE }}>
              Join The Network <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── BOOK A PROFESSIONAL ──────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: WHITE }}>
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-14 items-center">
          <div>
            <span className="text-xs font-black tracking-[0.25em] uppercase" style={{ color: ORANGE }}>Professional Services</span>
            <h2 className="font-black mt-3 mb-5 leading-tight" style={{ fontSize: "clamp(28px, 3.5vw, 44px)", color: BLACK }}>
              Book A Professional
            </h2>
            <p className="leading-relaxed mb-6 text-sm" style={{ color: "#666" }}>
              Access our certified network of naturopaths, wellness coaches, health consultants, fitness professionals, and more. Book one-on-one appointments directly through the NFGN platform — real experts, real results.
            </p>

            <div className="space-y-3 mb-8">
              {[
                { title: "Naturopathic Consultants", sub: "Holistic health & natural medicine" },
                { title: "Wellness Coaches", sub: "Lifestyle, nutrition & fitness guidance" },
                { title: "Health & Business Coaches", sub: "Personal development & growth" },
                { title: "Medical Benefit Packages", sub: "Comprehensive health programs" },
              ].map((s, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-xl transition-all hover:shadow-sm" style={{ border: `1px solid ${GRAY2}`, background: GRAY }}>
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-black text-xs" style={{ background: ORANGE, color: WHITE }}>
                    {i + 1}
                  </div>
                  <div>
                    <div className="font-bold text-sm" style={{ color: BLACK }}>{s.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: GRAY3 }}>{s.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            <Link href="/book" className="inline-flex items-center gap-2 font-black px-7 py-3.5 rounded-full border-2 transition-all hover:bg-black/5" style={{ borderColor: BLACK, color: BLACK }}>
              Browse Professionals <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-2xl overflow-hidden shadow-xl" style={{ border: `3px solid ${ORANGE}30` }}>
            <img src={`${I}book-a-pro-hero.png`} alt="Book A Professional" className="w-full h-[480px] object-cover" />
          </div>
        </div>
      </section>

      {/* ── IGNITE NATUROPATHIC CALLOUT ───────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: BLACK }}>
        <div className="max-w-6xl mx-auto text-center">
          <span className="text-xs font-black tracking-[0.25em] uppercase" style={{ color: YELLOW }}>Featured Product Line</span>
          <h2 className="font-black mt-3 mb-4 text-white" style={{ fontSize: "clamp(28px, 4vw, 48px)" }}>
            The IGNITE Wellness System
          </h2>
          <p className="text-base max-w-xl mx-auto mb-10" style={{ color: "rgba(255,255,255,0.65)" }}>
            Cleanse. Control. Transform. — IGNITE Herbal Gut Cleanse, IGNITE XL Appetite Suppressant, and The Prophetic Diet by Joe Marcelino. All-natural. Faith-based. Proven.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-10">
            {[
              { e: "🌿", t: "Natural Ingredients" },
              { e: "🫁", t: "Gut Cleanse" },
              { e: "🔥", t: "Supports Metabolism" },
              { e: "🍃", t: "Appetite Control" },
              { e: "⚖️", t: "Weight Management" },
              { e: "🛡️", t: "Overall Wellness" },
            ].map((f) => (
              <div key={f.t} className="flex flex-col items-center gap-2 py-5 px-3 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span className="text-2xl">{f.e}</span>
                <span className="text-xs font-bold tracking-wide text-center" style={{ color: "rgba(255,255,255,0.7)" }}>{f.t}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/shop" className="inline-flex items-center gap-2 font-black px-8 py-4 rounded-full transition-all hover:brightness-110" style={{ background: ORANGE, color: WHITE }}>
              Shop IGNITE Products <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/join" className="inline-flex items-center gap-2 font-bold px-8 py-4 rounded-full border transition-all hover:bg-white/5" style={{ borderColor: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.8)" }}>
              Member Pricing Available
            </Link>
          </div>
        </div>
      </section>

      {/* ── TRAVEL & MEMBER PACKAGES ─────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: GRAY }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-black tracking-[0.25em] uppercase" style={{ color: ORANGE }}>Exclusive Member Benefits</span>
            <h2 className="font-black mt-3 mb-3" style={{ fontSize: "clamp(28px, 4vw, 48px)", color: BLACK }}>
              NFGN Travel &amp; Member Packages
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: GRAY3 }}>
              Membership unlocks exclusive travel discounts, curated packages, and lifestyle benefits that grow with your network.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${GRAY2}` }}>
              <img src={`${I}nfgn-travel-hero.png`} alt="NFGN Travel" className="w-full h-52 object-cover" />
              <div className="p-7" style={{ background: WHITE }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 flex items-center justify-center rounded-full" style={{ background: ORANGE + "15", color: ORANGE }}>
                    <Plane className="h-5 w-5" />
                  </div>
                  <h3 className="font-black text-lg" style={{ color: BLACK }}>NFGN Travel Program</h3>
                </div>
                <p className="text-sm mb-5 leading-relaxed" style={{ color: GRAY3 }}>
                  Exclusive member travel discounts, group retreats, international experiences, and community trips. See the world while building your network.
                </p>
                <ul className="space-y-2 mb-6">
                  {["Members-only hotel & flight rates", "Group wellness retreats", "International community trips", "Annual NFGN conference travel"].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm" style={{ color: DARK }}>
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: ORANGE }} />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/about" className="inline-flex items-center gap-2 font-bold text-sm" style={{ color: ORANGE }}>
                  Learn More <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${GRAY2}` }}>
              <img src={`${I}offer-training.png`} alt="Member Packages" className="w-full h-52 object-cover" />
              <div className="p-7" style={{ background: WHITE }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 flex items-center justify-center rounded-full" style={{ background: ORANGE + "15", color: ORANGE }}>
                    <Package className="h-5 w-5" />
                  </div>
                  <h3 className="font-black text-lg" style={{ color: BLACK }}>Member Packages</h3>
                </div>
                <p className="text-sm mb-5 leading-relaxed" style={{ color: GRAY3 }}>
                  Pro Member packages unlock the full NFGN compensation plan, priority product pricing, and access to all nine pillars of the network.
                </p>
                <ul className="space-y-2 mb-6">
                  {["Pro Member compensation plan", "Medical Benefit Packages", "Priority product pricing", "VIP event access & community tools"].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm" style={{ color: DARK }}>
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: YELLOW }} />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/join" className="inline-flex items-center gap-2 font-bold text-sm" style={{ color: ORANGE }}>
                  Become A Member <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── NATUROPATHIC SOAPS & WELLNESS ────────────────────────────── */}
      <section className="py-0" style={{ background: WHITE }}>
        <div className="grid lg:grid-cols-2">
          <div className="relative overflow-hidden" style={{ minHeight: 360 }}>
            <img src={`${I}herbal-soaps.png`} alt="NFGN Artisan Soaps & Lotions" className="w-full h-full object-cover" style={{ minHeight: 360 }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to right, transparent 50%, rgba(245,245,245,0.2))" }} />
          </div>
          <div className="px-12 py-16 flex flex-col justify-center" style={{ background: GRAY }}>
            <span className="text-xs font-black tracking-[0.25em] uppercase mb-4" style={{ color: ORANGE }}>Natural Wellness Products</span>
            <h2 className="font-black mb-4 leading-tight" style={{ fontSize: "clamp(24px, 3vw, 40px)", color: BLACK }}>
              Handmade Soaps, Lotions &amp; Candles
            </h2>
            <p className="leading-relaxed mb-6 text-sm" style={{ color: "#666" }}>
              Crafted with all-natural, plant-based ingredients — our artisan soap bars, nourishing body lotions, and aromatherapy candles bring naturopathic care into your daily routine. No chemicals, no compromise.
            </p>
            <div className="flex flex-wrap gap-2 mb-8">
              {["All-Natural", "Handcrafted", "No Harsh Chemicals", "Aromatherapy", "Moisturizing"].map((t) => (
                <span key={t} className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: ORANGE + "12", border: `1px solid ${ORANGE}30`, color: ORANGE }}>
                  {t}
                </span>
              ))}
            </div>
            <div className="flex gap-4">
              <Link href="/shop" className="inline-flex items-center gap-2 font-black px-6 py-3.5 rounded-full transition-all hover:brightness-110" style={{ background: ORANGE, color: WHITE }}>
                Shop Now <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/join" className="inline-flex items-center gap-2 font-bold px-6 py-3.5 rounded-full border-2 transition-all hover:bg-black/5" style={{ borderColor: BLACK, color: BLACK }}>
                Member Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────── */}
      <section className="py-24 px-6 text-center" style={{ background: WHITE }}>
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-center gap-1 mb-6">
            {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5" style={{ color: YELLOW, fill: YELLOW }} />)}
          </div>
          <h2 className="font-black mb-5 leading-tight" style={{ fontSize: "clamp(28px, 4vw, 52px)", color: BLACK }}>
            Ready to Join the<br />
            <span style={{ color: ORANGE }}>NFGN Movement?</span>
          </h2>
          <p className="text-lg mb-10" style={{ color: GRAY3 }}>
            A faith-rooted, wellness-focused community that builds health, wealth, and lasting connections — together.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/join" className="inline-flex items-center gap-2 font-black px-10 py-4 rounded-full text-lg shadow-xl transition-all hover:brightness-110 hover:-translate-y-0.5" style={{ background: ORANGE, color: WHITE }}>
              Become A Member <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/shop" className="inline-flex items-center gap-2 font-bold px-10 py-4 rounded-full text-lg border-2 transition-all hover:bg-gray-50" style={{ borderColor: ORANGE, color: ORANGE }}>
              Shop Now
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
