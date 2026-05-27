import { Link } from "wouter";
import { useEffect, useState } from "react";
import {
  ArrowRight, Leaf, Users, TrendingUp, Trophy, Globe, Zap,
  Network, Sparkles, CalendarDays, ChevronRight, Star,
  MapPin, Phone, Mail,
} from "lucide-react";

const GOLD = "#C9A84C";
const BLACK = "#0a0a0a";
const GRAY = "#f5f5f5";
const GRAY2 = "#e8e8e8";
const DARK_TEXT = "#1a1a1a";
const MID_TEXT = "#555555";
const I = "/images/";

const pillars = [
  {
    icon: <Leaf className="h-6 w-6" />,
    number: "01",
    title: "Naturopathic Workshops, Products & Services",
    desc: "World-class naturopathic health products, workshops, and wellness services — including Medical Benefit Packages. Invest in your whole-body health with our curated offerings.",
    cta: "Shop Collection",
    href: "/shop",
    img: `${I}offer-wellness.png`,
  },
  {
    icon: <Users className="h-6 w-6" />,
    number: "02",
    title: "Book-A-Professional",
    desc: "Connect with certified wellness professionals, naturopaths, coaches, and consultants. Book one-on-one sessions directly through our integrated platform.",
    cta: "Browse Professionals",
    href: "/book",
    img: `${I}consultation.png`,
  },
  {
    icon: <TrendingUp className="h-6 w-6" />,
    number: "03",
    title: "Business Opportunity",
    desc: "Join the most innovative compensation network in the industry. Build your business, grow your community, and participate in real money circulation.",
    cta: "Explore Opportunity",
    href: "/join",
    img: `${I}offer-training.png`,
  },
  {
    icon: <Trophy className="h-6 w-6" />,
    number: "04",
    title: "NFGN Sports",
    desc: "Where athletics meets community building. Support local sports organizations, schools, and teams through our network — wellness meets competition.",
    cta: "Learn More",
    href: "/about",
    img: `${I}offer-sports.png`,
  },
  {
    icon: <Sparkles className="h-6 w-6" />,
    number: "05",
    title: "NFGN Handmade Soaps, Lotions & Candles",
    desc: "Handcrafted with love — our curated line of handmade soaps, candles, lotions, and artisan goods. Natural ingredients, beautiful results, and small-business heart at the core.",
    cta: "Browse Products",
    href: "/shop",
    img: `${I}offer-soaps.png`,
  },
  {
    icon: <CalendarDays className="h-6 w-6" />,
    number: "06",
    title: "Special Events",
    desc: "Exclusive NFGN live events, community gatherings, and pop-ups. Connect face-to-face with the network, celebrate milestones, and grow together in person.",
    cta: "View Events",
    href: "/about",
    img: `${I}pillar-events.png`,
  },
  {
    icon: <Globe className="h-6 w-6" />,
    number: "07",
    title: "Travel Discounts, Events & More",
    desc: "Members-only travel deals, group retreats, and exclusive getaways. Save on flights, hotels, and experiences while building lasting connections around the world.",
    cta: "Explore Travel",
    href: "/about",
    img: `${I}pillar-travel.png`,
  },
  {
    icon: <Zap className="h-6 w-6" />,
    number: "08",
    title: "Workshops & Training",
    desc: "Ongoing education, professional development workshops, and skill-building training sessions designed to elevate every member personally and professionally.",
    cta: "View Workshops",
    href: "/about",
    img: `${I}offer-training.png`,
  },
  {
    icon: <Network className="h-6 w-6" />,
    number: "09",
    title: "Money Circulation & Community Building",
    desc: "The heartbeat of NFGN — our proprietary money circulation system keeps wealth flowing within our community. Build together, earn together, and lift every member higher.",
    cta: "Join The Network",
    href: "/join",
    img: `${I}community-event.png`,
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
    <div style={{ fontFamily: "'Poppins', sans-serif", background: "#fff", color: DARK_TEXT }} className="overflow-x-hidden">

      {/* HERO — CSS background-image fills full viewport, no extra divs needed */}
      <section
        className="relative flex items-center justify-center"
        style={{
          minHeight: "calc(100vh - 4rem)",
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.25) 45%, rgba(0,0,0,0.55) 100%), url(${I}hero-community-diverse.png)`,
          backgroundSize: "cover",
          backgroundPosition: "center 30%",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Thin gold bottom trim */}
        <div className="absolute bottom-0 left-0 right-0 h-1 z-10" style={{ background: GOLD }} />

        {/* Hero content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center w-full px-6 py-12">

          {/* Single unified heading block — first, so it sits over any dark sky */}
          <h1 className="font-black text-center leading-[1.05] mb-5" style={{ fontSize: "clamp(44px, 6.5vw, 90px)", letterSpacing: "-0.02em" }}>
            <span className="block text-white">Building A New</span>
            <span className="block" style={{ color: GOLD }}>Community</span>
            <span className="block text-white" style={{ fontSize: "clamp(32px, 4.5vw, 64px)", fontWeight: 700, letterSpacing: 0 }}>
              Of Health &amp; Wellness
            </span>
          </h1>

          {/* Location pill — sits over the faces, below the heading */}
          <div className="inline-flex items-center gap-2 mb-6 px-5 py-2 rounded-full border text-white text-xs font-bold tracking-[0.18em] uppercase" style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(10px)", borderColor: "rgba(255,255,255,0.2)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: GOLD }} />
            New Orleans, Louisiana · Founded 2013
          </div>

          {/* Divider */}
          <div className="w-16 h-0.5 mx-auto mb-6" style={{ background: GOLD }} />

          <p className="text-center text-lg max-w-xl mx-auto mb-10 leading-relaxed" style={{ color: "rgba(255,255,255,0.8)" }}>
            A faith-rooted movement guided by a <strong className="text-white">GOD First · Help First</strong> philosophy — uniting wellness, community, and opportunity.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/join" className="inline-flex items-center justify-center gap-2 font-black px-9 py-4 text-base shadow-2xl transition-all hover:brightness-110" style={{ background: GOLD, color: BLACK, borderRadius: 4 }}>
              Become a Member <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/shop" className="inline-flex items-center justify-center gap-2 font-semibold px-9 py-4 text-base text-white border transition-all hover:bg-white/10" style={{ borderColor: "rgba(255,255,255,0.35)", borderRadius: 4, backdropFilter: "blur(4px)" }}>
              Shop Products <ArrowRight className="h-4 w-4 opacity-70" />
            </Link>
          </div>

        </div>
      </section>

      {/* STATS BAR — clean white strip between hero and pillars */}
      <section className="grid grid-cols-4" style={{ background: "#fff", borderBottom: `3px solid ${GOLD}` }}>
        {[
          { num: "10K+", label: "Active Members" },
          { num: "$2M+", label: "Community Circulated" },
          { num: "9", label: "Business Pillars" },
          { num: "2013", label: "Year Founded" },
        ].map((s, i) => (
          <div key={s.label} className="flex flex-col items-center justify-center py-8 px-4 text-center" style={{ borderRight: i < 3 ? `1px solid ${GRAY2}` : "none" }}>
            <span className="text-3xl font-black" style={{ color: BLACK }}>{s.num}</span>
            <span className="text-xs font-bold tracking-widest uppercase mt-1" style={{ color: GOLD }}>{s.label}</span>
          </div>
        ))}
      </section>

      {/* PILLARS */}
      <section style={{ background: GRAY }} className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-black tracking-[0.25em] uppercase" style={{ color: GOLD }}>What We Do</span>
            <h2 className="text-4xl md:text-5xl font-black mt-3 mb-4" style={{ color: BLACK }}>
              Nine Pillars.<br />One Powerful Network.
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: MID_TEXT }}>
              Every arm of NFGN is designed to create value — for your health, your community, your wallet, and your lifestyle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3">
            {pillars.map((p, i) => (
              <div
                key={p.number}
                className="group relative overflow-hidden cursor-pointer transition-all duration-300 bg-white"
                style={{
                  border: "1px solid #e0e0e0",
                  boxShadow: hoveredPillar === i ? "0 12px 40px rgba(0,0,0,0.12)" : "none",
                  transform: hoveredPillar === i ? "translateY(-4px)" : "none",
                }}
                onMouseEnter={() => setHoveredPillar(i)}
                onMouseLeave={() => setHoveredPillar(null)}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={p.img}
                    alt={p.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div
                    className="absolute inset-0 transition-opacity duration-300"
                    style={{
                      background: "linear-gradient(to top, rgba(201,168,76,0.5), transparent)",
                      opacity: hoveredPillar === i ? 1 : 0,
                    }}
                  />
                  <div
                    className="absolute top-3 right-3 w-9 h-9 rounded-sm flex items-center justify-center font-black text-sm"
                    style={{ background: BLACK, color: GOLD }}
                  >
                    {p.number}
                  </div>
                </div>

                <div className="p-7">
                  <div
                    className="h-12 w-12 flex items-center justify-center rounded-sm mb-5 transition-colors duration-300"
                    style={{
                      background: hoveredPillar === i ? GOLD : GRAY2,
                      color: hoveredPillar === i ? BLACK : GOLD,
                    }}
                  >
                    {p.icon}
                  </div>

                  <h3 className="text-base font-black mb-3" style={{ color: BLACK }}>{p.title}</h3>
                  <p className="text-sm leading-relaxed mb-5" style={{ color: MID_TEXT }}>{p.desc}</p>

                  <Link
                    href={p.href}
                    className="flex items-center gap-2 font-bold text-sm group-hover:gap-3 transition-all"
                    style={{ color: GOLD }}
                  >
                    {p.cta} <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAITH COMMUNITY */}
      <section className="py-24 px-6" style={{ background: "#fff" }}>
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-xs font-black tracking-[0.25em] uppercase" style={{ color: GOLD }}>A Faith Based Community</span>
            <h2 className="text-4xl font-black mt-3 mb-5 leading-tight" style={{ color: BLACK }}>
              GOD First.<br />Help First.
            </h2>
            <p className="text-base leading-relaxed mb-5" style={{ color: MID_TEXT }}>
              Founded in 2013 in New Orleans, Louisiana, New Face Global Network was built on a simple but powerful principle: when we put God first and serve others first, everything else follows.
            </p>
            <p className="text-base leading-relaxed mb-8" style={{ color: MID_TEXT }}>
              Our CEO &amp; Founder Joe Marcelino has intentionally cultivated a culture that places service, integrity, and faith at the center of every decision — from local neighborhoods to international communities.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { emoji: "🙏", t: "Faith-Centered" },
                { emoji: "❤️", t: "Service-First" },
                { emoji: "🏛️", t: "New Orleans, 2013" },
                { emoji: "🌍", t: "Global Impact" },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-sm border" style={{ borderColor: GRAY2, background: GRAY }}>
                  <span className="text-xl">{f.emoji}</span>
                  <span className="font-bold text-sm" style={{ color: BLACK }}>{f.t}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="rounded-sm overflow-hidden h-[420px] shadow-xl" style={{ border: `3px solid ${GOLD}` }}>
              <img src={`${I}pillar-faith.png`} alt="Faith Community" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-5 -left-5 p-5 rounded-sm shadow-xl max-w-[260px]" style={{ background: BLACK }}>
              <p className="text-sm font-medium leading-relaxed italic mb-2" style={{ color: "#fff" }}>
                "A dollar spent within your community becomes two."
              </p>
              <p className="text-xs font-bold" style={{ color: GOLD }}>— Joe Marcelino, Founder &amp; CEO</p>
            </div>
          </div>
        </div>
      </section>

      {/* SPORTS */}
      <section className="py-0" style={{ background: GRAY }}>
        <div className="grid lg:grid-cols-2">
          <div className="relative h-72 lg:h-auto overflow-hidden">
            <img src={`${I}offer-sports.png`} alt="NFGN Sports" className="w-full h-full object-cover" />
          </div>
          <div className="px-12 py-16 flex flex-col justify-center" style={{ background: BLACK }}>
            <span className="text-xs font-black tracking-[0.2em] uppercase mb-4" style={{ color: GOLD }}>Community Athletics</span>
            <h2 className="text-4xl font-black mb-4 leading-tight" style={{ color: "#fff" }}>
              NFGN Sports
            </h2>
            <p className="leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.65)" }}>
              NFGN Sports empowers youth athletes, school teams, and community leagues — building character, discipline, and community pride on and off the field.
            </p>
            <div className="flex flex-wrap gap-3 mb-8">
              {["Youth Programs", "School Teams", "Community Leagues", "Skills Camps"].map((t) => (
                <span key={t} className="text-xs px-3 py-1.5 rounded-full font-bold border" style={{ borderColor: GOLD + "50", color: GOLD, background: GOLD + "10" }}>
                  {t}
                </span>
              ))}
            </div>
            <Link href="/about" className="inline-flex items-center gap-2 self-start font-bold px-7 py-3.5 rounded-sm transition-all hover:opacity-90" style={{ background: GOLD, color: BLACK }}>
              Explore Sports <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center" style={{ background: "#fff" }}>
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-center gap-1 mb-6">
            {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5" style={{ color: GOLD, fill: GOLD }} />)}
          </div>
          <h2 className="text-4xl md:text-5xl font-black mb-5 leading-tight" style={{ color: BLACK }}>
            Ready to Join the<br />
            <span style={{ color: GOLD }}>New Face Movement?</span>
          </h2>
          <p className="text-lg mb-10" style={{ color: MID_TEXT }}>
            Become a member of a faith-rooted, wellness-focused community that grows together.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/join" className="inline-flex items-center gap-2 font-black px-9 py-4 rounded-sm text-lg shadow-lg hover:-translate-y-0.5 transition-all" style={{ background: BLACK, color: "#fff" }}>
              Become a Member <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/shop" className="inline-flex items-center gap-2 font-bold px-9 py-4 rounded-sm text-lg border-2 hover:bg-gray-50 transition-all" style={{ borderColor: GOLD, color: GOLD }}>
              Shop Products
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
