import React, { useEffect, useState } from "react";
import { 
  HeartPulse, Activity, Droplet, Leaf, Flame, Briefcase, 
  ArrowRight, CheckCircle2, ShoppingBag, Menu, X, 
  MapPin, Phone, Mail, Instagram, Facebook, Twitter, ShieldCheck, Users, TrendingUp, Star, ArrowUpRight
} from "lucide-react";

export function Landing() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap";
    document.head.appendChild(link);
    return () => {
      // Cleanup if unmounted, though not strictly necessary for this mockup
      document.head.removeChild(link);
    };
  }, []);

  const theme = {
    forest: "#2D6A4F",
    bright: "#16a34a",
    gold: "#C9A84C",
    yellow: "#fbbf24",
    black: "#0a0a0a",
    light: "#f3f4f6",
    white: "#ffffff"
  };

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", backgroundColor: theme.white, color: theme.black }} className="min-h-screen overflow-x-hidden selection:bg-[#16a34a] selection:text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2D6A4F] to-[#16a34a] flex items-center justify-center text-white font-black text-xl shadow-lg shadow-green-500/20">
                N
              </div>
              <span className="font-bold text-2xl tracking-tight">NFGN</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#about" className="text-gray-600 hover:text-[#16a34a] font-medium transition-colors">About</a>
              <a href="#shop" className="text-gray-600 hover:text-[#16a34a] font-medium transition-colors">Shop</a>
              <a href="#sports" className="text-gray-600 hover:text-[#16a34a] font-medium transition-colors">Sports</a>
              <a href="#pro" className="text-gray-600 hover:text-[#16a34a] font-medium transition-colors">Book A Pro</a>
              <button className="bg-[#fbbf24] hover:bg-[#C9A84C] text-black px-6 py-2.5 rounded-full font-bold transition-all transform hover:-translate-y-0.5 shadow-lg shadow-yellow-500/20">
                Join Now
              </button>
            </div>

            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-900">
                {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-100 absolute w-full px-4 pt-2 pb-6 space-y-2 shadow-xl">
            <a href="#about" className="block px-3 py-3 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50">About</a>
            <a href="#shop" className="block px-3 py-3 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50">Shop</a>
            <a href="#sports" className="block px-3 py-3 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50">Sports</a>
            <a href="#pro" className="block px-3 py-3 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50">Book A Pro</a>
            <button className="w-full mt-4 bg-[#fbbf24] text-black px-6 py-3 rounded-xl font-bold shadow-lg shadow-yellow-500/20">
              Join Now
            </button>
          </div>
        )}
      </nav>

      {/* 1. HERO */}
      <section className="relative pt-20 pb-32 lg:pt-32 lg:pb-48 overflow-hidden">
        {/* Abstract Blobs */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-[#16a34a]/10 blur-3xl mix-blend-multiply animate-blob"></div>
        <div className="absolute top-40 left-0 -ml-20 w-72 h-72 rounded-full bg-[#fbbf24]/20 blur-3xl mix-blend-multiply animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-[#2D6A4F]/10 blur-3xl mix-blend-multiply animate-blob animation-delay-4000"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-100 mb-6">
                <span className="flex h-2 w-2 rounded-full bg-[#16a34a]"></span>
                <span className="text-sm font-semibold text-[#2D6A4F]">Welcome to the Movement</span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6">
                More Than A Network. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2D6A4F] to-[#16a34a]">
                  A Movement.
                </span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed font-medium">
                Empowering individuals through teamwork, holistic health, and shared wealth. Join a global community dedicated to growing together and building a sustainable future.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-[#fbbf24] hover:bg-[#C9A84C] text-black px-8 py-4 rounded-full font-bold text-lg transition-all transform hover:-translate-y-1 shadow-xl shadow-yellow-500/20 flex items-center justify-center gap-2 group">
                  Become a Member
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="bg-white border-2 border-[#16a34a] text-[#2D6A4F] hover:bg-green-50 px-8 py-4 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Shop Products
                </button>
              </div>
              <div className="mt-10 flex items-center gap-4 text-sm font-semibold text-gray-500">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="Member" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <div>
                  <span className="text-[#0a0a0a] font-bold">5,000+</span> members worldwide
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#16a34a]/20 to-transparent rounded-[2.5rem] transform rotate-3 translate-x-4 translate-y-4"></div>
              <img 
                src="/__mockup/images/hero-community.png" 
                alt="Community Group" 
                className="relative rounded-[2.5rem] shadow-2xl object-cover w-full h-[600px] border-4 border-white"
              />
              {/* Floating badges */}
              <div className="absolute top-10 -left-10 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-4 animate-bounce-slow">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-[#16a34a]">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Growth</p>
                  <p className="font-bold text-[#0a0a0a]">Exponential</p>
                </div>
              </div>
              <div className="absolute bottom-20 -right-10 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-4 animate-bounce-slow animation-delay-2000">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-[#fbbf24]">
                  <Star className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Community</p>
                  <p className="font-bold text-[#0a0a0a]">Top Rated</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. WHAT WE OFFER */}
      <section className="py-24 bg-gray-50 relative" id="about">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-black mb-4">What We Offer</h2>
            <p className="text-gray-600 text-lg font-medium">A holistic ecosystem designed to support your physical, financial, and personal growth.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "Health & Wellness", desc: "Naturopathic consultations & holistic care", icon: <HeartPulse />, color: "border-[#16a34a]", bg: "bg-green-50", text: "text-[#16a34a]", img: "/__mockup/images/offer-wellness.png", badge: "NFGN" },
              { title: "NFGN Sports", desc: "Youth programs & athletic development", icon: <Activity />, color: "border-[#fbbf24]", bg: "bg-yellow-50", text: "text-[#d97706]", img: "/__mockup/images/offer-sports.png", badge: "NFGN Sports" },
              { title: "Handmade Soaps", desc: "Artisan soaps with natural ingredients", icon: <Droplet />, color: "border-pink-400", bg: "bg-pink-50", text: "text-pink-500", img: "/__mockup/images/offer-soaps.png", badge: "MARCELINO" },
              { title: "Herbal Products", desc: "Tinctures, supplements & remedies", icon: <Leaf />, color: "border-[#2D6A4F]", bg: "bg-emerald-50", text: "text-[#2D6A4F]", img: "/__mockup/images/offer-herbal.png", badge: "RENEW" },
              { title: "Candles", desc: "Soy candles for aromatherapy & self-care", icon: <Flame />, color: "border-amber-500", bg: "bg-amber-50", text: "text-amber-600", img: "/__mockup/images/offer-candles.png", badge: "IGNITE" },
              { title: "Business Training", desc: "Workshops, mentorship & consultation", icon: <Briefcase />, color: "border-teal-500", bg: "bg-teal-50", text: "text-teal-600", img: "/__mockup/images/offer-training.png", badge: "NFGN" }
            ].map((feature, idx) => (
              <div key={idx} className={`bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-t-4 ${feature.color} group`}>
                {/* Card image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={feature.img}
                    alt={feature.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Brand badge overlay */}
                  <div className="absolute top-3 left-3">
                    <span className="bg-black/70 backdrop-blur-sm text-white text-xs font-black tracking-widest uppercase px-3 py-1 rounded-full" style={{ letterSpacing: "0.15em" }}>
                      {feature.badge}
                    </span>
                  </div>
                </div>
                {/* Card body */}
                <div className="p-6">
                  <div className={`w-11 h-11 rounded-xl ${feature.bg} ${feature.text} flex items-center justify-center mb-4`}>
                    {React.cloneElement(feature.icon as React.ReactElement, { size: 22 })}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-600 font-medium text-sm leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. COMMUNITY & TEAMWORK */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative group">
              <div className="absolute inset-0 bg-[#fbbf24]/20 transform -rotate-3 rounded-3xl transition-transform group-hover:rotate-0 duration-500"></div>
              <img src="/__mockup/images/teamwork.png" alt="Teamwork" className="relative rounded-3xl shadow-xl w-full h-[500px] object-cover transition-transform group-hover:-translate-y-2 duration-500" />
            </div>
            <div>
              <h2 className="text-4xl lg:text-5xl font-black mb-6 leading-tight">
                Build Together. <br/>
                <span className="text-[#2D6A4F]">Grow Together.</span>
              </h2>
              <p className="text-lg text-gray-600 mb-8 font-medium leading-relaxed">
                At NFGN, we believe that true wealth is built collectively. Our network is designed to empower every member through shared knowledge, collaborative opportunities, and a supportive community that celebrates your wins as our own.
              </p>
              <ul className="space-y-4">
                {[
                  "Global network of driven individuals",
                  "Mentorship from experienced professionals",
                  "Collaborative business opportunities",
                  "Shared success and recognition programs"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-1">
                      <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />
                    </div>
                    <span className="text-lg font-semibold text-gray-800">{item}</span>
                  </li>
                ))}
              </ul>
              <button className="mt-10 bg-black text-white px-8 py-4 rounded-full font-bold hover:bg-gray-800 transition-colors shadow-lg">
                Discover Our Community
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. NFGN SPORTS */}
      <section className="py-24 relative overflow-hidden" id="sports">
        <div className="absolute inset-0 bg-[#0a0a0a]"></div>
        <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        {/* Diagonal Accent */}
        <div className="absolute top-1/2 left-0 right-0 h-96 bg-gradient-to-r from-[#2D6A4F] to-[#16a34a] transform -skew-y-6 -translate-y-1/2 opacity-20"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-block bg-[#fbbf24] text-black font-black px-4 py-1.5 rounded-md mb-6 uppercase tracking-widest text-sm">
                NFGN Sports Division
              </div>
              <h2 className="text-4xl lg:text-5xl font-black text-white mb-6 leading-tight">
                We don't just support athletes — <br/>
                <span className="text-[#fbbf24]">we build them.</span>
              </h2>
              <p className="text-lg text-gray-300 mb-10 font-medium leading-relaxed">
                Dedicated to youth development and athletic excellence. Through sponsorships, training camps, and community leagues, we're shaping the next generation of leaders on and off the field.
              </p>
              
              <div className="grid grid-cols-3 gap-6 border-t border-gray-800 pt-8">
                <div>
                  <div className="text-3xl font-black text-[#16a34a] mb-1">500+</div>
                  <div className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Athletes</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-[#fbbf24] mb-1">12</div>
                  <div className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Teams</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-white mb-1">3</div>
                  <div className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Sports</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-[#fbbf24] to-[#16a34a] rounded-3xl blur-xl opacity-30"></div>
              <img src="/__mockup/images/offer-sports.png" alt="NFGN Sports Team" className="relative rounded-3xl shadow-2xl border-4 border-gray-800 w-full h-[500px] object-cover hover:scale-105 transition-all duration-700" />
            </div>
          </div>
        </div>
      </section>

      {/* 5. HEALTH & WELLNESS PRODUCTS */}
      <section className="py-24 bg-gray-50" id="shop">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-black mb-4">Holistic Health & Wellness</h2>
            <p className="text-gray-600 text-lg font-medium">Crafted with care, powered by nature. Discover our premium line of natural products designed for your well-being.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Handmade Soaps", tag: "Artisan & Natural", img: "/__mockup/images/herbal-soaps.png" },
              { title: "Herbal Products", tag: "Tinctures & Supplements", img: "/__mockup/images/herbal-products.png" },
              { title: "Aromatherapy Candles", tag: "Soy & Essential Oils", img: "/__mockup/images/candles.png" }
            ].map((cat, idx) => (
              <div key={idx} className="group cursor-pointer">
                <div className="relative overflow-hidden rounded-[2rem] mb-6 shadow-md transition-shadow group-hover:shadow-2xl">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10 duration-500"></div>
                  <img src={cat.img} alt={cat.title} className="w-full h-80 object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out" />
                  <div className="absolute bottom-6 left-6 z-20">
                    <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-full text-sm font-bold text-[#0a0a0a] shadow-lg inline-flex items-center gap-2 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      Shop Category <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-1 group-hover:text-[#16a34a] transition-colors">{cat.title}</h3>
                <p className="text-gray-500 font-semibold">{cat.tag}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. WORKSHOPS & CONSULTATION */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="relative h-[600px] w-full">
                <img src="/__mockup/images/workshop.png" alt="Workshop" className="absolute top-0 right-0 w-4/5 h-[400px] object-cover rounded-3xl shadow-2xl z-10" />
                <img src="/__mockup/images/consultation.png" alt="Consultation" className="absolute bottom-0 left-0 w-3/4 h-[350px] object-cover rounded-3xl shadow-2xl z-20 border-8 border-white" />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-4xl lg:text-5xl font-black mb-6 leading-tight">
                Grow Your Mind. <br/>
                <span className="text-[#C9A84C]">Grow Your Business.</span>
              </h2>
              <p className="text-lg text-gray-600 mb-10 font-medium leading-relaxed">
                Unlock your potential with expert-led training, wellness consultations, and leadership development. We provide the tools you need to succeed in business and in life.
              </p>
              
              <div className="space-y-6">
                {[
                  { title: "Naturopathic Consultations", color: "bg-[#16a34a]" },
                  { title: "Business Consulting & Training", color: "bg-[#C9A84C]" },
                  { title: "Leadership Workshops", color: "bg-[#2D6A4F]" },
                  { title: "Wellness Seminars", color: "bg-pink-500" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl hover:bg-gray-100 transition-colors cursor-pointer">
                    <div className={`w-3 h-3 rounded-full ${item.color} shadow-sm`}></div>
                    <span className="text-lg font-bold text-gray-900">{item.title}</span>
                    <ArrowRight className="w-5 h-5 ml-auto text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FEATURED PRODUCTS */}
      <section className="py-24 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-black mb-2">Featured Products</h2>
              <p className="text-gray-500 font-medium">Top picks from our community</p>
            </div>
            <a href="#" className="hidden md:flex items-center gap-2 font-bold text-[#16a34a] hover:text-[#2D6A4F] transition-colors">
              View All <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "Lavender Clarity Soap Bar", price: 18, desc: "Pure handcrafted soap with lavender + chamomile", cat: "Herbal Soaps", icon: "🫧", color: "bg-purple-100" },
              { name: "Immune Boost Herbal Tincture", price: 34, desc: "All-natural immune support blend", cat: "Herbal Products", icon: "🌿", color: "bg-green-100" },
              { name: "Zen Garden Soy Candle", price: 28, desc: "Hand-poured aromatherapy candle", cat: "Candles", icon: "🕯️", color: "bg-amber-100" },
              { name: "NFGN Sports Recovery Kit", price: 55, desc: "Post-workout natural recovery bundle", cat: "NFGN Sports", icon: "💪", color: "bg-blue-100" }
            ].map((prod, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group flex flex-col h-full">
                <div className={`w-full h-48 rounded-xl ${prod.color} flex items-center justify-center text-6xl mb-4 group-hover:scale-[1.02] transition-transform`}>
                  {prod.icon}
                </div>
                <div className="flex flex-col flex-grow">
                  <span className="text-xs font-bold text-[#16a34a] uppercase tracking-wider mb-2">{prod.cat}</span>
                  <h4 className="text-lg font-bold mb-2 leading-tight">{prod.name}</h4>
                  <p className="text-sm text-gray-500 font-medium mb-4 flex-grow">{prod.desc}</p>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                    <span className="text-xl font-black text-[#C9A84C]">${prod.price}</span>
                    <button className="bg-black hover:bg-gray-800 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors">
                      <ShoppingBag className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center md:hidden">
             <button className="bg-white border-2 border-gray-200 text-gray-800 px-6 py-3 rounded-full font-bold w-full">
                View All Products
             </button>
          </div>
        </div>
      </section>

      {/* 8. BECOME A MEMBER CTA */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2D6A4F] to-[#0a0a0a]"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-8 backdrop-blur-sm text-white">
            <ShieldCheck className="w-4 h-4 text-[#fbbf24]" />
            <span className="text-sm font-semibold tracking-wide uppercase">Join The Movement</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
            Ready to change your life?
          </h2>
          <p className="text-xl text-gray-300 mb-12 font-medium leading-relaxed max-w-2xl mx-auto">
            Become a Member today and unlock exclusive products, earn commissions, build your network, and make a difference in your community.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button className="w-full sm:w-auto bg-[#fbbf24] hover:bg-[#C9A84C] text-black px-10 py-5 rounded-full font-black text-lg transition-all transform hover:-translate-y-1 shadow-[0_0_40px_rgba(251,191,36,0.3)]">
              Become a Member
            </button>
            <button className="w-full sm:w-auto bg-transparent border-2 border-white/30 text-white hover:bg-white/10 px-10 py-5 rounded-full font-bold text-lg transition-colors">
              Learn More
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-4 md:gap-8">
            {[
              { text: "Earn Commissions", icon: <TrendingUp className="w-4 h-4" /> },
              { text: "Exclusive Products", icon: <ShoppingBag className="w-4 h-4" /> },
              { text: "Community Support", icon: <Users className="w-4 h-4" /> }
            ].map((pill, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10 text-white font-semibold">
                {pill.icon}
                {pill.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="bg-white border-t border-gray-100 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2D6A4F] to-[#16a34a] flex items-center justify-center text-white font-black text-lg">
                  N
                </div>
                <span className="font-black text-xl tracking-tight">NFGN</span>
              </div>
              <p className="text-gray-500 font-medium mb-6">
                More Than A Network. A Movement. Empowering communities through health, wealth, and teamwork.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-[#16a34a] hover:text-white transition-colors">
                  <Instagram size={18} />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-[#16a34a] hover:text-white transition-colors">
                  <Facebook size={18} />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-[#16a34a] hover:text-white transition-colors">
                  <Twitter size={18} />
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-gray-900 mb-6 uppercase tracking-wider text-sm">Quick Links</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-gray-500 hover:text-[#16a34a] font-medium transition-colors">About Us</a></li>
                <li><a href="#" className="text-gray-500 hover:text-[#16a34a] font-medium transition-colors">Shop Products</a></li>
                <li><a href="#" className="text-gray-500 hover:text-[#16a34a] font-medium transition-colors">Join The Movement</a></li>
                <li><a href="#" className="text-gray-500 hover:text-[#16a34a] font-medium transition-colors">NFGN Sports</a></li>
                <li><a href="#" className="text-gray-500 hover:text-[#16a34a] font-medium transition-colors">Book A Pro</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-6 uppercase tracking-wider text-sm">Products</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-gray-500 hover:text-[#16a34a] font-medium transition-colors">Handmade Soaps</a></li>
                <li><a href="#" className="text-gray-500 hover:text-[#16a34a] font-medium transition-colors">Herbal Products</a></li>
                <li><a href="#" className="text-gray-500 hover:text-[#16a34a] font-medium transition-colors">Soy Candles</a></li>
                <li><a href="#" className="text-gray-500 hover:text-[#16a34a] font-medium transition-colors">Sports Gear</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-6 uppercase tracking-wider text-sm">Contact</h4>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-gray-500 font-medium">
                  <MapPin size={18} className="text-[#16a34a]" />
                  123 Wellness Way, NY 10001
                </li>
                <li className="flex items-center gap-3 text-gray-500 font-medium">
                  <Phone size={18} className="text-[#16a34a]" />
                  +1 (555) 123-4567
                </li>
                <li className="flex items-center gap-3 text-gray-500 font-medium">
                  <Mail size={18} className="text-[#16a34a]" />
                  hello@mynfgn.com
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm font-medium">
              &copy; 2026 New Face Global Network. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm font-medium text-gray-400">
              <a href="#" className="hover:text-gray-900">Privacy Policy</a>
              <a href="#" className="hover:text-gray-900">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Global CSS for animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(-5%); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); }
          50% { transform: translateY(5%); animation-timing-function: cubic-bezier(0, 0, 0.2, 1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}} />
    </div>
  );
}
