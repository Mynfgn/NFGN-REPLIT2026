import React, { useEffect, useState } from "react";
import {
  Leaf, Users, TrendingUp, Trophy, Sparkles, CalendarDays,
  Globe, Zap, Heart, ArrowRight, CheckCircle2, Star,
  MapPin, Phone, Mail, Menu, X, Quote
} from "lucide-react";

const G = "#2D6A4F";
const GOLD = "#C9A84C";
const I = "/__mockup/images/";

const PILLARS = [
  { n:"01", title:"Naturopathic Wellness", desc:"World-class health products, workshops & holistic services including medical benefit packages", img:`${I}offer-wellness.png`, accent:"#16a34a" },
  { n:"02", title:"Book-A-Professional", desc:"Connect with certified naturopaths, coaches & wellness consultants for personalized sessions", img:`${I}consultation.png`, accent:"#0284c7" },
  { n:"03", title:"Community Commerce", desc:"Member referral rewards & community benefits that grow as your network grows", img:`${I}community-event.png`, accent:"#d97706" },
  { n:"04", title:"NFGN Sports", desc:"Youth athletics, school teams, community leagues & sports camps that build character", img:`${I}offer-sports.png`, accent:"#059669" },
  { n:"05", title:"Handmade Natural Products", desc:"Artisan soaps, candles, lotions & beauty goods crafted with love and natural ingredients", img:`${I}offer-soaps.png`, accent:"#db2777" },
  { n:"06", title:"Special Events", desc:"Community celebrations, pop-up markets & NFGN gatherings that connect our members", img:`${I}pillar-events.png`, accent:"#ea580c" },
  { n:"07", title:"Travel & Retreats", desc:"Members-only travel discounts, group retreats & global getaway experiences", img:`${I}pillar-travel.png`, accent:"#0891b2" },
  { n:"08", title:"Workshops & Training", desc:"Financial literacy, professional development & skill-building sessions for every member", img:`${I}offer-training.png`, accent:"#7c3aed" },
  { n:"09", title:"Gifts & Charitable Giving", desc:"Support churches, nonprofits & community organizations through our giving platform", img:`${I}pillar-faith.png`, accent:"#e11d48" },
];

export function HomeB() {
  const [open, setOpen] = useState(false);

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
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{background:G}}>
              <Leaf className="w-5 h-5 text-white"/>
            </div>
            <div>
              <div className="font-black text-lg leading-none">NFGN</div>
              <div className="text-[10px] text-gray-400 leading-none tracking-widest uppercase">New Face Global Network</div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6">
            {["Shop","Services","Sports","Community","About"].map(n=>(
              <a key={n} href="#" className="text-sm font-semibold text-gray-500 hover:text-[#2D6A4F] transition-colors">{n}</a>
            ))}
            <a href="#" style={{background:`linear-gradient(135deg,${G},#16a34a)`}} className="text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-lg">Join the Movement</a>
          </div>
          <button className="md:hidden" onClick={()=>setOpen(o=>!o)}>{open?<X className="w-6 h-6"/>:<Menu className="w-6 h-6"/>}</button>
        </div>
      </nav>

      {/* HERO — magazine split */}
      <section className="min-h-[92vh] grid lg:grid-cols-5">
        {/* Left text — 2/5 */}
        <div className="lg:col-span-2 flex flex-col justify-center px-12 py-20 bg-white">
          <div className="inline-flex items-center gap-2 text-xs font-black tracking-widest uppercase mb-8 px-3 py-1.5 rounded-full" style={{background:"rgba(45,106,79,0.08)",color:G}}>
            <span className="w-1.5 h-1.5 rounded-full" style={{background:G}}/>Est. 2013 · New Orleans, LA
          </div>
          <h1 className="font-black leading-none mb-6" style={{fontSize:"clamp(38px,4.5vw,64px)"}}>
            Building<br/>
            <span style={{color:GOLD}}>A New</span><br/>
            Community<br/>
            <span style={{color:G}}>Of Health &</span><br/>
            Wellness
          </h1>
          <div className="w-16 h-1.5 rounded-full mb-6" style={{background:`linear-gradient(90deg,${GOLD},${G})`}}/>
          <p className="text-gray-600 leading-relaxed mb-10 max-w-sm text-[15px]">
            A faith-rooted movement built on a <strong>GOD First · Help First</strong> philosophy. Where natural wellness meets community purpose and personal growth.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <a href="#" className="inline-flex items-center justify-center gap-2 font-bold px-8 py-4 rounded-xl text-white shadow-xl" style={{background:G}}>
              Become a Member <ArrowRight className="w-4 h-4"/>
            </a>
            <a href="#" className="inline-flex items-center justify-center gap-2 font-semibold px-8 py-4 rounded-xl border-2 text-gray-700 hover:border-[#2D6A4F] transition-colors" style={{borderColor:"#e5e7eb"}}>
              Our Products
            </a>
          </div>
          {/* Vertical stats */}
          <div className="flex gap-8">
            {[{n:"10K+",l:"Members"},{n:"9",l:"Pillars"},{n:"$2M+",l:"Circulated"}].map((s,i)=>(
              <div key={i}>
                <div className="text-2xl font-black" style={{color:i===1?GOLD:G}}>{s.n}</div>
                <div className="text-xs text-gray-400 font-medium">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right photo — 3/5 */}
        <div className="lg:col-span-3 relative min-h-[50vh] lg:min-h-full overflow-hidden">
          <img src={`${I}hero-community.png`} alt="NFGN Community" className="absolute inset-0 w-full h-full object-cover"/>
          <div className="absolute inset-0" style={{background:"linear-gradient(to right,rgba(255,255,255,0.15),transparent)"}}/>
          {/* Floating badge */}
          <div className="absolute bottom-8 left-8 bg-white rounded-2xl px-6 py-4 shadow-2xl max-w-[240px]">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"/>
              <span className="text-xs font-bold text-green-700 uppercase tracking-widest">Growing Community</span>
            </div>
            <div className="text-2xl font-black text-gray-900">10,000+</div>
            <div className="text-xs text-gray-500">Members worldwide & growing</div>
          </div>
          {/* Top badge */}
          <div className="absolute top-8 right-8 bg-[#C9A84C] rounded-2xl px-5 py-4 shadow-xl text-center">
            <div className="text-2xl font-black text-white">2013</div>
            <div className="text-xs text-white/80 font-bold uppercase tracking-widest">Founded</div>
          </div>
        </div>
      </section>

      {/* PILLARS — asymmetric stagger */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-14 flex-wrap gap-6">
            <div>
              <span className="text-xs font-black tracking-widest uppercase" style={{color:G}}>Nine Pillars</span>
              <h2 className="text-4xl font-black mt-2">One Powerful Community</h2>
            </div>
            <p className="text-gray-500 max-w-sm text-sm leading-relaxed">
              Every pillar supports your health, growth, community connection, and purpose — all in one network.
            </p>
          </div>

          {/* Staggered 2-column layout */}
          <div className="space-y-6">
            {/* Row 1: big left + small right stacked */}
            {[0,3,6].map(startIdx=>(
              <div key={startIdx} className={`grid lg:grid-cols-3 gap-6 ${startIdx===3?"":"" }`}>
                {/* Big card */}
                <div className="lg:col-span-2 group relative overflow-hidden rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 h-64 cursor-pointer">
                  <img src={PILLARS[startIdx].img} alt={PILLARS[startIdx].title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                  <div className="absolute inset-0" style={{background:`linear-gradient(to top,rgba(0,0,0,0.75),rgba(0,0,0,0.1))`}}/>
                  <div className="absolute bottom-0 left-0 p-6 text-white">
                    <div className="text-xs font-black tracking-widest uppercase mb-1 opacity-60">{PILLARS[startIdx].n}</div>
                    <h3 className="text-2xl font-black mb-1">{PILLARS[startIdx].title}</h3>
                    <p className="text-sm text-white/70 max-w-xs">{PILLARS[startIdx].desc}</p>
                  </div>
                  <div className="absolute top-4 right-4 bg-white/20 backdrop-blur rounded-full p-2">
                    <ArrowRight className="w-4 h-4 text-white"/>
                  </div>
                </div>
                {/* Two small cards stacked */}
                {startIdx+1 < PILLARS.length && startIdx+2 < PILLARS.length && (
                  <div className="grid grid-rows-2 gap-6">
                    {[startIdx+1, startIdx+2].map(idx=>(
                      <div key={idx} className="group relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer" style={{minHeight:120}}>
                        <img src={PILLARS[idx].img} alt={PILLARS[idx].title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                        <div className="absolute inset-0" style={{background:`linear-gradient(to top,rgba(0,0,0,0.7),rgba(0,0,0,0.05))`}}/>
                        <div className="absolute bottom-0 left-0 p-4 text-white">
                          <div className="text-[10px] font-black tracking-widest uppercase opacity-50 mb-0.5">{PILLARS[idx].n}</div>
                          <h3 className="text-sm font-black">{PILLARS[idx].title}</h3>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SPORTS — side by side with image overlap */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-0 rounded-3xl overflow-hidden shadow-2xl">
            <div className="relative h-80 lg:h-auto">
              <img src={`${I}offer-sports.png`} alt="NFGN Sports" className="absolute inset-0 w-full h-full object-cover"/>
              <div className="absolute inset-0" style={{background:`linear-gradient(135deg,${G}80,transparent)`}}/>
              <div className="absolute top-8 left-8">
                <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-2 text-white text-xs font-black tracking-widest uppercase">Pillar 04</div>
              </div>
            </div>
            <div className="p-12 lg:p-16 flex flex-col justify-center" style={{background:`linear-gradient(135deg,${G} 0%,#1a3d2a 100%)`}}>
              <h2 className="text-4xl font-black text-white mb-4 leading-tight">
                NFGN Sports<br/><span style={{color:GOLD}}>Community Athletics</span>
              </h2>
              <p className="text-green-100 leading-relaxed mb-8">
                Youth programs, school teams, and community leagues that build character, discipline, and pride. NFGN Sports connects wellness and athletics at the community level.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {["Youth Programs","School Teams","Local Leagues","Basketball Camps","Skills Labs","Sports Nonprofits"].map(t=>(
                  <div key={t} className="flex items-center gap-2 text-white/80 text-xs font-semibold">
                    <div className="w-1.5 h-1.5 rounded-full" style={{background:GOLD}}/>{t}
                  </div>
                ))}
              </div>
              <a href="#" className="inline-flex items-center gap-2 self-start font-bold px-7 py-3.5 rounded-xl transition-all hover:-translate-y-0.5" style={{background:GOLD,color:"#0a0a0a"}}>
                Learn About NFGN Sports <ArrowRight className="w-4 h-4"/>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAITH — editorial centered */}
      <section className="py-24 relative overflow-hidden" style={{background:"linear-gradient(135deg,#fff8e6 0%,#fef3c7 50%,#fdf6e3 100%)"}}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-black tracking-widest uppercase mb-4 px-4 py-1.5 rounded-full" style={{background:"rgba(201,168,76,0.2)",color:"#92400e"}}>A Faith Based Community</span>
            <h2 className="text-4xl font-black mb-3">GOD First. Help First.</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
              Built on faith and a relentless desire to serve, New Face Global Network has been a ministry of health and community since its founding in 2013 in New Orleans, Louisiana.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            <div className="lg:col-span-1 flex flex-col gap-8">
              {[
                {emoji:"🙏",t:"GOD First Philosophy",d:"Our CEO & Founder has intentionally built a culture where faith is the foundation of every decision."},
                {emoji:"❤️",t:"Help First Culture",d:"Service to others is not a strategy — it's the core identity of every NFGN member and leader."},
              ].map((f,i)=>(
                <div key={i} className="bg-white rounded-2xl p-7 shadow-lg border border-amber-100">
                  <div className="text-4xl mb-4">{f.emoji}</div>
                  <h3 className="font-black text-lg mb-3">{f.t}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{f.d}</p>
                </div>
              ))}
            </div>
            <div className="lg:col-span-1 relative">
              <div className="rounded-3xl overflow-hidden h-full min-h-[400px] shadow-2xl">
                <img src={`${I}pillar-faith.png`} alt="Faith Community" className="w-full h-full object-cover"/>
              </div>
            </div>
            <div className="lg:col-span-1 flex flex-col gap-8">
              {[
                {emoji:"🏛️",t:"Founded 2013, New Orleans",d:"Headquartered in the heart of New Orleans, LA — the birthplace of culture, community, and resilience."},
                {emoji:"🌍",t:"Global Community Impact",d:"From local neighborhoods to international chapters, NFGN is spreading health and hope worldwide."},
              ].map((f,i)=>(
                <div key={i} className="bg-white rounded-2xl p-7 shadow-lg border border-amber-100">
                  <div className="text-4xl mb-4">{f.emoji}</div>
                  <h3 className="font-black text-lg mb-3">{f.t}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{f.d}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quote */}
          <div className="max-w-3xl mx-auto text-center">
            <Quote className="w-12 h-12 mx-auto mb-4" style={{color:GOLD}}/>
            <p className="text-2xl font-black text-gray-800 leading-snug italic mb-4">
              "A dollar spent within your community becomes two. A dollar spent outside becomes zero."
            </p>
            <p className="font-bold" style={{color:G}}>— Joe Marcelino, Founder & CEO</p>
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-xs font-black tracking-widest uppercase" style={{color:G}}>Our Products</span>
            <h2 className="text-4xl font-black mt-2 mb-3">Premium Natural Goods</h2>
            <p className="text-gray-500 text-lg max-w-lg mx-auto">100% natural, handcrafted artisan goods for body, mind, and daily wellness.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {name:"IGNITE Herbal Cleanse",price:"$59.99",old:"$99.99",badge:"Best Seller",bc:"bg-amber-500",img:`${I}product-ignite.png`},
              {name:"RENEW Soap Collection",price:"$12.99",old:null,badge:"Handmade",bc:"bg-[#2D6A4F]",img:`${I}offer-soaps.png`},
              {name:"Fragrance Candles",price:"$24.99",old:"$29.99",badge:"Premium",bc:"bg-purple-600",img:`${I}offer-candles.png`},
              {name:"RENEW Natural Lotions",price:"$24.99",old:null,badge:"New",bc:"bg-green-600",img:`${I}product-lotion.png`},
            ].map((p,i)=>(
              <div key={i} className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="relative h-52 bg-gray-50 overflow-hidden">
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
                    <button className="text-xs font-black px-3 py-1.5 rounded-full text-white" style={{background:G}}>Add</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-5xl font-black text-white mb-6 leading-tight">
              Ready to Join<br/>the Movement?
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-10">
              Become part of a faith-rooted, wellness-focused community dedicated to health, growth, and giving back.
            </p>
            <a href="#" className="inline-flex items-center gap-2 font-black px-9 py-4 rounded-full text-lg" style={{background:GOLD,color:"#0a0a0a"}}>
              Become a Member <ArrowRight className="w-5 h-5"/>
            </a>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
            <h3 className="font-black text-xl text-white mb-6">Member Benefits Include</h3>
            <ul className="space-y-4">
              {["Access to all 9 community pillars","Member pricing on natural wellness products","Participation in sports & community events","Workshops, training & professional development","Travel discounts & group retreats","Charitable giving & faith community access"].map((perk,i)=>(
                <li key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{background:GOLD}}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-white"/>
                  </div>
                  <span className="text-gray-300 text-sm font-medium">{perk}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black text-gray-500 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{background:G}}><Leaf className="w-4 h-4 text-white"/></div>
            <span className="font-black text-white">NFGN</span>
            <span className="text-gray-600 text-xs">New Face Global Network</span>
          </div>
          <div className="flex gap-8 text-xs">
            {["Shop","Services","Sports","Community","Join Us"].map(l=><a key={l} href="#" className="hover:text-white transition-colors">{l}</a>)}
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-[#C9A84C]"/>newfaceglobalnetwork@gmail.com</span>
            <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-[#C9A84C]"/>(678) 909-9974</span>
          </div>
        </div>
        <div className="text-center text-xs text-gray-700 mt-6">© 2013–2026 New Face Global Network · New Orleans, Louisiana · All rights reserved.</div>
      </footer>
    </div>
  );
}
