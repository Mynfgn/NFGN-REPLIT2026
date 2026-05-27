import React, { useEffect, useState } from "react";
import {
  Leaf, Users, TrendingUp, Trophy, Sparkles, CalendarDays,
  Globe, Zap, Network, Heart, ArrowRight, CheckCircle2,
  MapPin, Phone, Mail, Menu, X, Quote, Star
} from "lucide-react";

const G = "#2D6A4F";
const GOLD = "#C9A84C";
const I = "/__mockup/images/";

const PILLARS = [
  { n:"01", title:"Naturopathic Wellness", desc:"World-class health products & holistic services", img:`${I}offer-wellness.png`, color:"from-emerald-500 to-green-600", light:"bg-emerald-50 text-emerald-700", icon:<Leaf className="w-5 h-5"/> },
  { n:"02", title:"Book-A-Professional", desc:"Connect with certified wellness experts & naturopaths", img:`${I}consultation.png`, color:"from-sky-500 to-blue-600", light:"bg-sky-50 text-sky-700", icon:<Users className="w-5 h-5"/> },
  { n:"03", title:"Community Commerce", desc:"Member rewards & referral benefits that grow with you", img:`${I}community-event.png`, color:"from-amber-500 to-orange-500", light:"bg-amber-50 text-amber-700", icon:<TrendingUp className="w-5 h-5"/> },
  { n:"04", title:"NFGN Sports", desc:"Youth athletics, school teams & community leagues", img:`${I}offer-sports.png`, color:"from-green-500 to-teal-600", light:"bg-green-50 text-green-700", icon:<Trophy className="w-5 h-5"/> },
  { n:"05", title:"Handmade Products", desc:"Artisan soaps, lotions, candles & natural beauty", img:`${I}offer-soaps.png`, color:"from-pink-500 to-rose-500", light:"bg-pink-50 text-pink-700", icon:<Sparkles className="w-5 h-5"/> },
  { n:"06", title:"Special Events", desc:"Live gatherings, pop-ups & community celebrations", img:`${I}pillar-events.png`, color:"from-orange-500 to-red-500", light:"bg-orange-50 text-orange-700", icon:<CalendarDays className="w-5 h-5"/> },
  { n:"07", title:"Travel & Retreats", desc:"Member-exclusive trips, group getaways & travel savings", img:`${I}pillar-travel.png`, color:"from-cyan-500 to-sky-600", light:"bg-cyan-50 text-cyan-700", icon:<Globe className="w-5 h-5"/> },
  { n:"08", title:"Workshops & Training", desc:"Financial literacy, business skills & professional growth", img:`${I}offer-training.png`, color:"from-violet-500 to-purple-600", light:"bg-violet-50 text-violet-700", icon:<Zap className="w-5 h-5"/> },
  { n:"09", title:"Gifts & Giving Back", desc:"Support churches, nonprofits & community organizations", img:`${I}pillar-faith.png`, color:"from-rose-500 to-pink-600", light:"bg-rose-50 text-rose-700", icon:<Heart className="w-5 h-5"/> },
];

export function HomeA() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<number|null>(null);

  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap";
    document.head.appendChild(l);
    return () => { document.head.removeChild(l); };
  }, []);

  return (
    <div style={{ fontFamily:"'Poppins',sans-serif" }} className="bg-white text-gray-900 overflow-x-hidden">

      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg" style={{background:`linear-gradient(135deg,${G},#16a34a)`}}>
              <Leaf className="w-5 h-5 text-white"/>
            </div>
            <span className="font-black text-xl">NFGN</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {["Shop","Services","Community","Sports","About"].map(n=>(
              <a key={n} href="#" className="text-sm font-semibold text-gray-600 hover:text-green-700 transition-colors">{n}</a>
            ))}
            <a href="#" className="bg-[#2D6A4F] text-white px-5 py-2 rounded-full font-bold text-sm shadow-lg hover:bg-green-800 transition-colors">Join Us</a>
          </div>
          <button className="md:hidden" onClick={()=>setOpen(o=>!o)}>{open?<X className="w-6 h-6"/>:<Menu className="w-6 h-6"/>}</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-0">
          <img src={`${I}hero-community.png`} alt="Community" className="w-full h-full object-cover opacity-20"/>
          <div className="absolute inset-0" style={{background:`linear-gradient(135deg,rgba(45,106,79,0.95) 0%,rgba(45,106,79,0.7) 40%,rgba(255,255,255,0.1) 100%)`}}/>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-28 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur border border-white/30 text-white text-xs font-bold px-4 py-2 rounded-full mb-8 tracking-widest uppercase">
              <span className="w-2 h-2 rounded-full bg-[#C9A84C] animate-pulse"/>
              New Orleans, Louisiana · Est. 2013
            </div>
            <h1 className="text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
              Building A New<br/>
              <span style={{color:GOLD}}>Community</span> Of<br/>
              Health & Wellness
            </h1>
            <p className="text-white/80 text-lg leading-relaxed mb-10 max-w-lg">
              New Face Global Network is a faith-rooted movement uniting natural wellness, community connection, and personal growth — guided by a <strong className="text-white">GOD First · Help First</strong> philosophy.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#" className="inline-flex items-center gap-2 font-bold px-8 py-4 rounded-full shadow-xl transition-all hover:-translate-y-1" style={{background:GOLD,color:"#0a0a0a"}}>
                Become a Member <ArrowRight className="w-4 h-4"/>
              </a>
              <a href="#" className="inline-flex items-center gap-2 font-semibold px-8 py-4 rounded-full border-2 border-white/40 text-white hover:bg-white/10 transition-all">
                Explore Products
              </a>
            </div>
          </div>
          {/* Floating stat cards */}
          <div className="hidden lg:grid grid-cols-2 gap-4">
            {[
              {stat:"10K+",label:"Active Members",color:"bg-white",text:"text-green-700",sub:"Growing every day"},
              {stat:"2013",label:"Founded",color:"bg-[#C9A84C]",text:"text-white",sub:"New Orleans, LA"},
              {stat:"9",label:"Community Pillars",color:`bg-[#2D6A4F]`,text:"text-white",sub:"One vision"},
              {stat:"100%",label:"Natural Products",color:"bg-white",text:"text-green-700",sub:"Pure & handcrafted"},
            ].map((s,i)=>(
              <div key={i} className={`${s.color} rounded-2xl p-6 shadow-xl backdrop-blur`}>
                <div className={`text-3xl font-black ${s.text} mb-1`}>{s.stat}</div>
                <div className={`font-bold text-sm ${s.text} opacity-90`}>{s.label}</div>
                <div className="text-xs text-gray-500 mt-1">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MISSION STRIP */}
      <section className="py-6 bg-[#C9A84C]">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center gap-8 text-[#0a0a0a] text-sm font-bold tracking-widest uppercase">
          {["Community Building","Natural Wellness","NFGN Sports","Faith & Giving","Personal Growth"].map(t=>(
            <span key={t} className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F]"/>{t}</span>
          ))}
        </div>
      </section>

      {/* 9 PILLARS */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="inline-block bg-green-100 text-green-700 text-xs font-black px-4 py-1.5 rounded-full mb-4 tracking-widest uppercase">What We Offer</span>
            <h2 className="text-4xl font-black mb-4">Nine Pillars of Community</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">Every arm of NFGN is designed to support your health, connection, growth, and purpose.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PILLARS.map((p,i)=>(
              <div key={i}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-400 hover:-translate-y-2 cursor-pointer"
                onMouseEnter={()=>setActive(i)} onMouseLeave={()=>setActive(null)}>
                <div className="relative h-48 overflow-hidden">
                  <img src={p.img} alt={p.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"/>
                  <div className={`absolute inset-0 bg-gradient-to-t ${p.color} opacity-0 group-hover:opacity-60 transition-opacity duration-300`}/>
                  <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm text-white text-xs font-black px-3 py-1 rounded-full tracking-widest">
                    {p.n}
                  </div>
                </div>
                <div className="p-6">
                  <div className={`inline-flex items-center gap-2 ${p.light} text-xs font-bold px-3 py-1 rounded-full mb-3`}>
                    {p.icon} {p.title}
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{p.desc}</p>
                  <div className={`flex items-center gap-1 mt-4 text-xs font-bold transition-all ${active===i?"gap-2":""}`} style={{color:G}}>
                    Learn more <ArrowRight className="w-3 h-3"/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SPORTS SPOTLIGHT */}
      <section className="relative overflow-hidden py-0">
        <div className="grid lg:grid-cols-2">
          <div className="relative h-80 lg:h-auto overflow-hidden">
            <img src={`${I}offer-sports.png`} alt="NFGN Sports" className="w-full h-full object-cover"/>
            <div className="absolute inset-0" style={{background:"linear-gradient(to right,transparent,rgba(45,106,79,0.4))"}}/>
          </div>
          <div className="bg-[#2D6A4F] px-12 py-16 flex flex-col justify-center">
            <span className="text-green-200 text-xs font-black tracking-widest uppercase mb-4">Community Athletics</span>
            <h2 className="text-4xl font-black text-white mb-4 leading-tight">
              NFGN Sports:<br/>
              <span style={{color:GOLD}}>Where Community</span><br/>
              Meets Competition
            </h2>
            <p className="text-green-100 leading-relaxed mb-8">
              NFGN Sports empowers youth athletes, school teams, and community leagues. We connect the spirit of wellness with the energy of athletics — building character, discipline, and community pride on and off the field.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {["Youth Programs","School Teams","Community Leagues","Skills Camps"].map(t=>(
                <div key={t} className="flex items-center gap-2 text-white/80 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4 text-[#C9A84C] flex-shrink-0"/>{t}
                </div>
              ))}
            </div>
            <a href="#" className="inline-flex items-center gap-2 self-start font-bold px-7 py-3.5 rounded-full transition-all hover:-translate-y-0.5" style={{background:GOLD,color:"#0a0a0a"}}>
              Explore Sports <ArrowRight className="w-4 h-4"/>
            </a>
          </div>
        </div>
      </section>

      {/* FAITH-BASED COMMUNITY */}
      <section className="py-24 bg-amber-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block bg-amber-200 text-amber-800 text-xs font-black px-4 py-1.5 rounded-full mb-6 tracking-widest uppercase">A Faith Based Community</span>
              <h2 className="text-4xl font-black mb-5 leading-tight">
                GOD First.<br/>
                <span style={{color:G}}>Help First.</span>
              </h2>
              <p className="text-gray-700 leading-relaxed mb-6 text-[15px]">
                Founded in 2013 in New Orleans, Louisiana, New Face Global Network was built on a simple but powerful principle: when we put God first and serve others first, everything else follows. Our CEO & Founder Joe Marcelino has intentionally cultivated a culture that places service, integrity, and faith at the center of every decision.
              </p>
              <p className="text-gray-700 leading-relaxed mb-8 text-[15px]">
                From day one, NFGN has been more than a wellness company — it's been a ministry of health, a channel of giving, and a vehicle for lifting entire communities. Churches, nonprofits, schools, and families are all welcome at this table.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  {icon:"🙏",t:"Faith-Centered Leadership"},
                  {icon:"❤️",t:"Service-First Culture"},
                  {icon:"🏠",t:"Founded 2013, New Orleans LA"},
                  {icon:"🌍",t:"Global Community Impact"},
                ].map((f,i)=>(
                  <div key={i} className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm border border-amber-100">
                    <span className="text-2xl">{f.icon}</span>
                    <span className="font-semibold text-sm text-gray-800">{f.t}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="rounded-3xl overflow-hidden h-[480px] shadow-2xl">
                <img src={`${I}pillar-faith.png`} alt="Faith Community" className="w-full h-full object-cover"/>
              </div>
              <div className="absolute -bottom-6 -left-6 bg-[#2D6A4F] text-white rounded-2xl p-6 shadow-xl max-w-[280px]">
                <Quote className="w-6 h-6 text-[#C9A84C] mb-2"/>
                <p className="text-sm font-medium leading-relaxed italic">"A dollar spent within your community becomes two. A dollar spent outside becomes zero."</p>
                <p className="text-xs text-green-200 mt-3 font-bold">— Joe Marcelino, Founder & CEO</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="inline-block bg-green-100 text-green-700 text-xs font-black px-4 py-1.5 rounded-full mb-4 tracking-widest uppercase">Our Products</span>
            <h2 className="text-4xl font-black mb-3">Premium Natural Goods</h2>
            <p className="text-gray-500 text-lg max-w-lg mx-auto">Handcrafted with natural ingredients — for your body, home, and daily wellness ritual.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {name:"IGNITE Herbal Cleanse",price:"$59.99",old:"$99.99",badge:"Best Seller",bc:"bg-amber-500",img:`${I}product-ignite.png`},
              {name:"RENEW Soap Collection",price:"$12.99",old:null,badge:"Handmade",bc:"bg-[#2D6A4F]",img:`${I}offer-soaps.png`},
              {name:"Fragrance Candles",price:"$24.99",old:"$29.99",badge:"Premium",bc:"bg-purple-600",img:`${I}offer-candles.png`},
              {name:"RENEW Natural Lotions",price:"$24.99",old:null,badge:"New",bc:"bg-[#16a34a]",img:`${I}product-lotion.png`},
            ].map((p,i)=>(
              <div key={i} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 border border-gray-100">
                <div className="relative h-52 overflow-hidden bg-gray-100">
                  <img src={p.img} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                  <span className={`absolute top-3 left-3 ${p.bc} text-white text-xs font-bold px-2.5 py-1 rounded-full`}>{p.badge}</span>
                </div>
                <div className="p-5">
                  <div className="flex gap-0.5 mb-2">{[...Array(5)].map((_,si)=><Star key={si} className="w-3 h-3 fill-amber-400 text-amber-400"/>)}</div>
                  <h3 className="font-bold text-sm mb-3">{p.name}</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-black">{p.price}</span>
                      {p.old&&<span className="text-xs text-gray-400 line-through">{p.old}</span>}
                    </div>
                    <button className="w-8 h-8 rounded-full text-white flex items-center justify-center shadow text-xs font-bold transition-colors" style={{background:G}}>+</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <a href="#" className="inline-flex items-center gap-2 border-2 border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#2D6A4F] hover:text-white px-9 py-3.5 rounded-full font-bold transition-all">
              View All Products <ArrowRight className="w-4 h-4"/>
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative overflow-hidden" style={{background:`linear-gradient(135deg,${G} 0%,#1e4d39 100%)`}}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3"/>
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <div className="flex justify-center gap-1 mb-6">{[...Array(5)].map((_,i)=><Star key={i} className="w-5 h-5 fill-[#C9A84C] text-[#C9A84C]"/>)}</div>
          <h2 className="text-5xl font-black text-white mb-6 leading-tight">
            Ready to Join the<br/><span style={{color:GOLD}}>New Face Movement?</span>
          </h2>
          <p className="text-green-100 text-xl mb-10 max-w-xl mx-auto leading-relaxed">
            Become a member of a faith-rooted, wellness-focused community that grows together.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="#" className="inline-flex items-center gap-2 font-black px-9 py-4 rounded-full text-lg shadow-xl hover:-translate-y-1 transition-all" style={{background:GOLD,color:"#0a0a0a"}}>
              Become a Member <ArrowRight className="w-5 h-5"/>
            </a>
            <a href="#" className="inline-flex items-center gap-2 font-bold px-9 py-4 rounded-full text-lg border-2 border-white/30 text-white hover:bg-white/10 transition-all">
              Shop Products
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 pt-14 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:G}}><Leaf className="w-4 h-4 text-white"/></div>
                <span className="font-black text-white text-lg">NFGN</span>
              </div>
              <p className="text-sm leading-relaxed mb-5">New Face Global Network — Building a new community of health, wellness, and purpose since 2013.</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Shop</h4>
              <ul className="space-y-2 text-sm">{["IGNITE Products","RENEW Soaps","Candles","All Products"].map(l=><li key={l}><a href="#" className="hover:text-white transition-colors">{l}</a></li>)}</ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Community</h4>
              <ul className="space-y-2 text-sm">{["Join Us","NFGN Sports","Book-A-Pro","Events"].map(l=><li key={l}><a href="#" className="hover:text-white transition-colors">{l}</a></li>)}</ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Contact</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-[#C9A84C]"/>newfaceglobalnetwork@gmail.com</li>
                <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-[#C9A84C]"/>(678) 909-9974</li>
                <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#C9A84C]"/>New Orleans, Louisiana</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-xs text-gray-600 text-center">
            © 2013–2026 New Face Global Network. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
