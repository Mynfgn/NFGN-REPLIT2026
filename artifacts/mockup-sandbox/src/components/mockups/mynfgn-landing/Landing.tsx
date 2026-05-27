import React, { useEffect, useState } from "react";
import {
  Leaf, Trophy, Heart, Briefcase, GraduationCap, Plane,
  Star, ShoppingCart, ArrowRight, CheckCircle2, Users, DollarSign,
  MapPin, Phone, Mail, Instagram, Facebook, Twitter, Menu, X,
  Building2, HeartHandshake
} from "lucide-react";

const IMAGES = {
  hero: "/__mockup/images/hero-community.png",
  productIgnite: "/__mockup/images/product-ignite.png",
  productSoap: "/__mockup/images/offer-soaps.png",
  productCandles: "/__mockup/images/offer-candles.png",
  productLotion: "/__mockup/images/product-lotion.png",
  serviceSports: "/__mockup/images/offer-sports.png",
  serviceConsult: "/__mockup/images/consultation.png",
  serviceTraining: "/__mockup/images/offer-training.png",
  community: "/__mockup/images/community-event.png",
};

const products = [
  {
    name: "IGNITE Herbal Gut Cleanse",
    desc: "Premium herbal formula for a healthier, revitalized digestive system",
    price: "$59.99", original: "$99.99",
    badge: "Best Seller", badgeColor: "bg-amber-500",
    img: IMAGES.productIgnite, rating: 5,
  },
  {
    name: "Marcelino's RENEW Soap Collection",
    desc: "Artisan soaps in Patchouli Rose, Earl Grey Tea Tree, and Lemongrass",
    price: "$12.99", original: null,
    badge: "Handmade", badgeColor: "bg-[#2D6A4F]",
    img: IMAGES.productSoap, rating: 5,
  },
  {
    name: "Elegant Fragrance Candles",
    desc: "16oz luxury candles in Coco-Lavender, Vanilla Baby, and Joy's scents",
    price: "$24.99", original: "$29.99",
    badge: "Premium", badgeColor: "bg-purple-600",
    img: IMAGES.productCandles, rating: 5,
  },
  {
    name: "RENEW Natural Lotions",
    desc: "All-natural body lotions in Vanilla Bean, Lavender, and Cucumber",
    price: "$24.99", original: null,
    badge: "New", badgeColor: "bg-[#16a34a]",
    img: IMAGES.productLotion, rating: 5,
  },
];

const largeServices = [
  {
    title: "NFGN Sports",
    desc: "Community competitions, youth programs, school teams, local leagues, and sports-focused events including basketball camps and skills labs.",
    icon: <Trophy className="w-5 h-5" />, iconBg: "bg-amber-100 text-amber-600",
    img: IMAGES.serviceSports,
  },
  {
    title: "Naturopathic Consultations",
    desc: "Book sessions with certified naturopaths for 60-minute wellness consultations. Natural approaches to health and healing.",
    icon: <Heart className="w-5 h-5" />, iconBg: "bg-pink-100 text-pink-600",
    img: IMAGES.serviceConsult,
  },
  {
    title: "Business Consultation & Training",
    desc: "Professional development sessions, business coaching, and skill-building workshops to help you build lasting financial opportunity.",
    icon: <Briefcase className="w-5 h-5" />, iconBg: "bg-blue-100 text-blue-600",
    img: IMAGES.serviceTraining,
  },
];

const smallServices = [
  {
    title: "Workshops & Education",
    desc: "Health & wellness workshops, financial literacy classes, and educational events for adults and children.",
    icon: <GraduationCap className="w-5 h-5" />, iconBg: "bg-indigo-100 text-indigo-600",
  },
  {
    title: "Travel & Events",
    desc: "Member trips, group retreats, travel discounts, and special event assistance for weddings and celebrations.",
    icon: <Plane className="w-5 h-5" />, iconBg: "bg-sky-100 text-sky-600",
  },
  {
    title: "Charitable Giving",
    desc: "Direct church and non-profit giving portals supporting community organizations while building your legacy.",
    icon: <HeartHandshake className="w-5 h-5" />, iconBg: "bg-rose-100 text-rose-600",
  },
];

const proPerks = [
  "20% Referral Commission on sponsored purchases",
  "Access to exclusive Pro Member store",
  "Member trips, retreats & travel discounts",
  "Medical benefit packages & naturopathic care",
  "Your own replicated business website",
  "Financial literacy & business coaching",
];

export function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap";
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif" }} className="min-h-screen bg-white text-gray-900 overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-9 h-9 rounded-xl bg-[#2D6A4F] flex items-center justify-center shadow-md">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-xl tracking-tight">MyNFGN</span>
            </div>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-7">
              {["Products", "Services", "Community", "Contact"].map(nav => (
                <a key={nav} href={`#${nav.toLowerCase()}`}
                   className="text-gray-600 hover:text-[#2D6A4F] font-medium text-sm transition-colors">
                  {nav}
                </a>
              ))}
              <a href="#" className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 font-medium text-sm border border-gray-200 hover:border-gray-400 px-3.5 py-1.5 rounded-full transition-all">
                <Building2 className="w-3.5 h-3.5" /> Back Office
              </a>
              <a href="#join"
                 className="bg-[#2D6A4F] hover:bg-[#1e4d39] text-white px-5 py-2.5 rounded-full font-semibold text-sm transition-colors shadow-md shadow-green-900/20">
                Become a Member
              </a>
            </div>

            {/* Mobile toggle */}
            <button className="md:hidden p-2" onClick={() => setMenuOpen(o => !o)}>
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-6 py-5 space-y-3">
            {["Products", "Services", "Community", "Contact"].map(nav => (
              <a key={nav} href={`#${nav.toLowerCase()}`}
                 className="block text-gray-700 font-medium py-1.5" onClick={() => setMenuOpen(false)}>
                {nav}
              </a>
            ))}
            <a href="#join"
               className="block mt-3 bg-[#2D6A4F] text-white text-center py-3 rounded-full font-semibold"
               onClick={() => setMenuOpen(false)}>
              Become a Member
            </a>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 min-h-[calc(100vh-4rem)] items-center">

            {/* Text side */}
            <div className="py-20 lg:py-24 lg:pr-12">
              <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-[#2D6A4F] text-xs font-semibold px-4 py-2 rounded-full mb-8">
                <span className="w-2 h-2 rounded-full bg-[#2D6A4F] animate-pulse"></span>
                More Than A Network. A Movement.
              </div>

              <h1 className="text-5xl lg:text-[3.75rem] font-black leading-[1.1] mb-6 tracking-tight">
                Where <span className="text-[#2D6A4F]">Health</span> Meets
                <br />
                <span className="text-[#C9A84C]">Wealth</span>
              </h1>

              <p className="text-gray-600 text-lg leading-relaxed mb-10 max-w-[480px]">
                Premium naturopathic wellness and community commerce. Handmade soaps, herbal products, candles, sports programs, and more — all united by one powerful mission.
              </p>

              <div className="flex flex-wrap gap-4 mb-12">
                <a href="#join"
                   className="inline-flex items-center gap-2 bg-[#2D6A4F] hover:bg-[#1e4d39] text-white px-8 py-3.5 rounded-full font-bold text-base transition-all shadow-xl shadow-green-900/20">
                  Become a Member <ArrowRight className="w-4 h-4" />
                </a>
                <a href="#products"
                   className="inline-flex items-center gap-2 border-2 border-gray-200 hover:border-[#2D6A4F] text-gray-700 hover:text-[#2D6A4F] px-8 py-3.5 rounded-full font-semibold text-base transition-all">
                  Explore Products
                </a>
              </div>

              <div className="flex flex-wrap gap-6 text-sm text-gray-500">
                <span className="flex items-center gap-2"><Users className="w-4 h-4 text-[#2D6A4F]" /><strong className="text-gray-800">10,000+</strong> Active Members</span>
                <span className="flex items-center gap-2"><Leaf className="w-4 h-4 text-[#2D6A4F]" /><strong className="text-gray-800">100%</strong> Natural Products</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#2D6A4F]" />Founded <strong className="text-gray-800">2013</strong></span>
              </div>
            </div>

            {/* Photo side */}
            <div className="hidden lg:block relative -mr-8 h-full min-h-[600px]">
              <img src={IMAGES.hero} alt="NFGN Community"
                   className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-transparent to-transparent"></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section className="bg-white border-y border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: <Users className="w-6 h-6" />, bg: "bg-green-100 text-[#2D6A4F]", stat: "10,000+", label: "Active Members" },
              { icon: <DollarSign className="w-6 h-6" />, bg: "bg-amber-100 text-amber-600", stat: "$2M+", label: "Circulated Annually" },
              { icon: <MapPin className="w-6 h-6" />, bg: "bg-blue-100 text-blue-600", stat: "New Orleans", label: "Headquarters" },
              { icon: <Leaf className="w-6 h-6" />, bg: "bg-rose-100 text-rose-500", stat: "100%", label: "Natural Products" },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                  {s.icon}
                </div>
                <div>
                  <div className="text-2xl font-black leading-tight">{s.stat}</div>
                  <div className="text-sm text-gray-500 font-medium">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUCTS ── */}
      <section className="py-24 bg-gray-50" id="products">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block bg-green-100 text-[#2D6A4F] text-xs font-bold px-4 py-1.5 rounded-full mb-4 tracking-widest uppercase">
              Our Products
            </span>
            <h2 className="text-4xl font-black mb-3">Premium Natural Wellness</h2>
            <p className="text-gray-500 text-lg max-w-lg mx-auto">
              100% natural, handcrafted artisan goods for body, mind, and wellness.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p, i) => (
              <div key={i}
                   className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 group cursor-pointer">
                <div className="relative h-52 overflow-hidden bg-gray-100">
                  <img src={p.img} alt={p.name}
                       className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-3 left-3">
                    <span className={`${p.badgeColor} text-white text-xs font-bold px-2.5 py-1 rounded-full shadow`}>
                      {p.badge}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex gap-0.5 mb-2">
                    {Array.from({ length: p.rating }).map((_, si) => (
                      <Star key={si} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <h3 className="font-bold text-sm leading-tight mb-2">{p.name}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed mb-4 line-clamp-2">{p.desc}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-black">{p.price}</span>
                      {p.original && (
                        <span className="text-xs text-gray-400 line-through">{p.original}</span>
                      )}
                    </div>
                    <button
                      className="w-8 h-8 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center hover:bg-[#1e4d39] transition-colors shadow">
                      <ShoppingCart className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <a href="#"
               className="inline-flex items-center gap-2 border-2 border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#2D6A4F] hover:text-white px-9 py-3.5 rounded-full font-semibold transition-all">
              View All Products <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section className="py-24 bg-white" id="services">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3">Wellness. Elevated.</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              From sports to spirituality, from business to body care — we serve the whole community.
            </p>
          </div>

          {/* 3 large photo cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            {largeServices.map((s, i) => (
              <div key={i} className="rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 group cursor-pointer">
                <div className="relative h-52 overflow-hidden bg-gray-200">
                  <img src={s.img} alt={s.title}
                       className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-b-2xl p-6">
                  <div className={`w-10 h-10 rounded-xl ${s.iconBg} flex items-center justify-center mb-3`}>
                    {s.icon}
                  </div>
                  <h3 className="font-bold text-base mb-2">{s.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 3 smaller icon cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {smallServices.map((s, i) => (
              <div key={i} className="bg-gray-50 border border-gray-100 hover:border-gray-200 hover:shadow-md rounded-2xl p-6 transition-all duration-200 cursor-pointer">
                <div className={`w-10 h-10 rounded-xl ${s.iconBg} flex items-center justify-center mb-3`}>
                  {s.icon}
                </div>
                <h3 className="font-bold text-base mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMUNITY ── */}
      <section className="py-24 bg-gray-50" id="community">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left: photo + quote */}
            <div className="relative">
              <div className="rounded-3xl overflow-hidden h-[480px]">
                <img src={IMAGES.community} alt="Community Day" className="w-full h-full object-cover" />
              </div>
              <div className="absolute bottom-6 right-4 left-12 bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-gray-100">
                <div className="text-4xl leading-none font-black text-[#C9A84C] mb-2">"</div>
                <p className="text-gray-800 text-sm font-medium leading-relaxed italic">
                  A dollar spent within your community becomes two. A dollar spent outside becomes zero.
                </p>
                <p className="text-gray-400 text-xs mt-3 font-semibold">— Joe Marcelino, Founder</p>
              </div>
            </div>

            {/* Right: text */}
            <div>
              <span className="inline-block bg-green-100 text-[#2D6A4F] text-xs font-bold px-4 py-1.5 rounded-full mb-6 tracking-widest uppercase">
                Our Community
              </span>
              <h2 className="text-4xl font-black leading-tight mb-5">
                Building Economic Justice<br />Through Unity
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4 text-[15px]">
                Founded in 2013 in New Orleans, Louisiana, New Face Global Network pioneers the intersection of naturopathic living and the Home Based Business industry. Our mission is to unite natural wellness with real, lasting financial opportunity.
              </p>
              <p className="text-gray-600 leading-relaxed mb-8 text-[15px]">
                Through our unique <strong className="text-[#2D6A4F]">Money Circulation</strong> philosophy, we engineer a system to keep money flowing directly between members, communities, and families — creating economic self-sufficiency and local multiplication of wealth.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { title: "Financial Literacy", desc: "Education for adults & children" },
                  { title: "Local Chapters", desc: "Across multiple cities" },
                  { title: "Pro Membership", desc: "Exclusive perks & benefits" },
                  { title: "Referral Rewards", desc: "Earn as your network grows" },
                ].map((f, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 hover:border-green-200 transition-colors">
                    <div className="font-bold text-sm mb-1">{f.title}</div>
                    <div className="text-xs text-gray-500">{f.desc}</div>
                  </div>
                ))}
              </div>

              <a href="#"
                 className="inline-flex items-center gap-2 text-[#2D6A4F] font-semibold text-sm hover:gap-3 transition-all">
                Learn more about our mission <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── JOIN CTA ── */}
      <section className="py-24 bg-[#2D6A4F] relative overflow-hidden" id="join">
        {/* decorative blobs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full"></div>
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-white/5 rounded-full"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left */}
            <div>
              <h2 className="text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
                Ready to Join<br />the Movement?
              </h2>
              <p className="text-green-100 text-lg leading-relaxed mb-10 max-w-md">
                Become a member today and unlock premium wellness products, earning opportunities, and a community that invests in your success.
              </p>
              <a href="#"
                 className="inline-flex items-center gap-2 bg-[#C9A84C] hover:bg-[#b8923c] text-white px-9 py-4 rounded-full font-bold text-lg shadow-xl transition-all">
                Become a Member <ArrowRight className="w-5 h-5" />
              </a>
            </div>

            {/* Pro Benefits Card */}
            <div className="bg-white rounded-3xl p-8 shadow-2xl">
              <h3 className="font-black text-xl mb-7 text-gray-900">Pro Member Benefits</h3>
              <ul className="space-y-4">
                {proPerks.map((perk, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#C9A84C] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-gray-700 text-sm font-medium leading-relaxed">{perk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-900 text-gray-400 pt-16 pb-8" id="contact">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">

            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-9 h-9 rounded-xl bg-[#2D6A4F] flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-white" />
                </div>
                <span className="font-extrabold text-xl text-white">MyNFGN</span>
              </div>
              <p className="text-sm leading-relaxed mb-6">
                New Face Global Network — Where health meets wealth. Premium naturopathic wellness and community commerce since 2013.
              </p>
              <div className="flex gap-3">
                {[Instagram, Facebook, Twitter].map((Icon, i) => (
                  <a key={i} href="#"
                     className="w-9 h-9 rounded-full bg-gray-800 hover:bg-[#2D6A4F] flex items-center justify-center transition-colors">
                    <Icon className="w-4 h-4 text-gray-300" />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-bold mb-5">Quick Links</h4>
              <ul className="space-y-3 text-sm">
                {["Products", "Services", "Community", "Visit MyNFGN.com"].map(link => (
                  <li key={link}>
                    <a href="#" className="hover:text-white transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Top Products */}
            <div>
              <h4 className="text-white font-bold mb-5">Top Products</h4>
              <ul className="space-y-3 text-sm">
                {[
                  "IGNITE Herbal Gut Cleanse",
                  "RENEW Soap Collection",
                  "Elegant Fragrance Candles",
                  "RENEW Natural Lotions",
                  "Immune Boost Tea Blend",
                ].map(p => (
                  <li key={p}>
                    <a href="#" className="hover:text-white transition-colors">{p}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-bold mb-5">Contact Us</h4>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-[#C9A84C] mt-0.5 flex-shrink-0" />
                  <span>newfaceglobalnetwork@gmail.com</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-[#C9A84C] flex-shrink-0" />
                  <span>(678) 909-9974</span>
                </li>
                <li className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-[#C9A84C] flex-shrink-0" />
                  <span>New Orleans, Louisiana</span>
                </li>
              </ul>
              <p className="text-xs text-gray-600 mt-6">Response within 24 hours, 7 days a week</p>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-gray-600">
            <span>© 2013–2026 New Face Global Network. All rights reserved.</span>
            <span>Response within 24 hours, 7 days a week</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
