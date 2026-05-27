import React, { useEffect, useState } from "react";
import {
  Leaf, Users, TrendingUp, Trophy, Sparkles, CalendarDays,
  Globe, Zap, Heart, ArrowRight, CheckCircle2, Star,
  MapPin, Phone, Mail, Menu, X, Quote
} from "lucide-react";

const G = "#2D6A4F";
const GOLD = "#C9A84C";
const I = "/__mockup/images/";

const PILLAR_COLORS = [
  "#16a34a","#0284c7","#d97706","#059669","#db2777","#ea580c","#0891b2","#7c3aed","#e11d48"
];

const PILLARS = [
  { n:"01", title:"Naturopathic Wellness", desc:"Health products, workshops & holistic services", img:`${I}offer-wellness.png` },
  { n:"02", title:"Book-A-Professional", desc:"Certified wellness experts & naturopaths", img:`${I}consultation.png` },
  { n:"03", title:"Community Commerce", desc:"Referral rewards & member benefits", img:`${I}community-event.png` },
  { n:"04", title:"NFGN Sports", desc:"Youth athletics, teams & community leagues", img:`${I}offer-sports.png` },
  { n:"05", title:"Handmade Products", desc:"Artisan soaps, candles & natural beauty", img:`${I}offer-soaps.png` },
  { n:"06", title:"Special Events", desc:"Community gatherings & pop-up markets", img:`${I}pillar-events.png` },
  { n:"07", title:"Travel & Retreats", desc:"Member-exclusive trips & group getaways", img:`${I}pillar-travel.png` },
  { n:"08", title:"Workshops & Training", desc:"Financial literacy & professional growth", img:`${I}offer-training.png` },
  { n:"09", title:"Gifts & Giving Back", desc:"Support churches, nonprofits & communities", img:`${I}pillar-faith.png` },
];

export function HomeC() {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<number|null>(null);

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
      <nav className="sticky top-0 z-50" style={{background:"rgba(255,255,255,0.97)",backdropFilter:"blur(12px)",borderBottom:"1px solid #f0f0f0"}}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{background:`linear-gradient(135deg,${G} 0%,#16a34a 100%)`}}>
              <Leaf className="w-5 h-5 text-white"/>
            </div>
            <span className="font-black text-xl tracking-tight">NFGN</span>
          </div>
          <div className="hidden md:flex items-center gap-7">
            {["Shop","Services","Sports","Community","About"].map(n=>(
              <a key={n} href="#" className="text-[13px] font-semibold text-gray-500 hover:text-[#2D6A4F] transition-colors">{n}</a>
            ))}
            <div className="w-px h-4 bg-gray-200"/>
            <a href="#" className="text-[13px] font-semibold text-gray-400 hover:text-gray-700">Sign In</a>
            <a href="#" className="text-white text-[13px] font-bold px-5 py-2.5 rounded-full shadow-lg transition-all hover:-translate-y-0.5" style={{background:`linear-gradient(135deg,${G},#16a34a)`}}>
              Join Free →
            </a>
          </div>
          <button className="md:hidden" onClick={()=>setOpen(o=>!o)}>{open?<X className="w-6 h-6"/>:<Menu className="w-6 h-6"/>}</button>
        </div>
      </nav>

      {/* HERO — full-bleed with centered overlay */}
      <section className="relative min-h-screen flex flex-col">
        {/* Background */}
        <div className="absolute inset-0">
          <img src={`${I}hero-community.png`} alt="Community" className="w-full h-full object-cover"/>
          <div className="absolute inset-0" style={{background:"linear-gradient(to bottom,rgba(0,0,0,0.3) 0%,rgba(0,0,0,0.55) 50%,rgba(0,0,0,0.75) 100%)"}}/>
        </div>

        {/* Centered hero text */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 pt-20 pb-16">
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur border border-white/20 text-white text-xs font-bold px-5 py-2.5 rounded-full mb-10 tracking-widest">
            <span className="w-2 h-2 rounded-full bg-[#C9A84C] animate-pulse"/>
            NEW ORLEANS, LOUISIANA · FOUNDED 2013
          </div>

          <h1 className="text-white font-black leading-none mb-4" style={{fontSize:"clamp(48px,7vw,96px)"}}>
            Building A New
          </h1>
          <h1 className="font-black leading-none mb-4" style={{fontSize:"clamp(48px,7vw,96px)",color:GOLD}}>
            Community
          </h1>
          <h1 className="text-white font-black leading-none mb-8" style={{fontSize:"clamp(36px,5vw,72px)"}}>
            Of Health &amp; Wellness
          </h1>

          <p className="text-white/75 text-xl max-w-2xl mb-12 leading-relaxed">
            A faith-rooted movement guided by a <strong className="text-white">GOD First · Help First</strong> philosophy — uniting naturopathic wellness, community connection, and personal growth.
          </p>

          <div className="flex flex-wrap justify-center gap-5">
            <a href="#" className="inline-flex items-center gap-3 font-black px-10 py-5 rounded-full text-lg shadow-2xl hover:-translate-y-1 transition-all" style={{background:GOLD,color:"#0a0a0a"}}>
              Become a Member <ArrowRight className="w-5 h-5"/>
            </a>
            <a href="#" className="inline-flex items-center gap-3 font-bold px-10 py-5 rounded-full text-lg border-2 border-white/30 text-white backdrop-blur hover:bg-white/10 transition-all">
              Shop Now <ArrowRight className="w-5 h-5"/>
            </a>
          </div>
        </div>

        {/* Stats bar at bottom */}
        <div className="relative z-10 bg-white/10 backdrop-blur-md border-t border-white/20">
          <div className="max-w-5xl mx-auto px-6 grid grid-cols-4 divide-x divide-white/20">
            {[
              {n:"10K+",l:"Active Members"},
              {n:"$2M+",l:"Community Circulated"},
              {n:"9",l:"Business Pillars"},
              {n:"2013",l:"Year Founded"},
            ].map((s,i)=>(
              <div key={i} className="text-center py-6 px-4">
                <div className="text-3xl font-black text-white mb-1">{s.n}</div>
                <div className="text-xs text-white/50 tracking-widest uppercase">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COLORED BAND */}
      <section className="overflow-hidden" style={{background:`linear-gradient(135deg,${G} 0%,#1e4d39 100%)`}}>
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-6">
          <div className="text-white">
            <div className="text-xs font-black tracking-widest uppercase opacity-60 mb-1">Our Mission</div>
            <div className="text-xl font-black">GOD First · Help First · Community Always</div>
          </div>
          <a href="#" className="inline-flex items-center gap-2 font-bold px-7 py-3 rounded-full transition-all hover:-translate-y-0.5" style={{background:GOLD,color:"#0a0a0a"}}>
            Learn Our Story <ArrowRight className="w-4 h-4"/>
          </a>
        </div>
      </section>

      {/* 9 PILLARS — colorful interactive grid */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-black tracking-widest uppercase px-4 py-1.5 rounded-full mb-4" style={{background:"rgba(45,106,79,0.08)",color:G}}>
              What We Offer
            </span>
            <h2 className="text-4xl font-black mb-3">Nine Pillars. One Vision.</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Every pillar of NFGN exists to serve your whole self — your health, community, purpose, and growth.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PILLARS.map((p,i)=>(
              <div
                key={i}
                className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-2"
                style={{height:280, boxShadow: hovered===i ? `0 20px 60px ${PILLAR_COLORS[i]}40` : "0 2px 12px rgba(0,0,0,0.06)"}}
                onMouseEnter={()=>setHovered(i)}
                onMouseLeave={()=>setHovered(null)}
              >
                {/* Photo */}
                <img src={p.img} alt={p.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"/>
                {/* Default overlay */}
                <div className="absolute inset-0 transition-opacity duration-300" style={{background:`linear-gradient(to top,rgba(0,0,0,0.75) 0%,rgba(0,0,0,0.15) 60%,transparent 100%)`}}/>
                {/* Hover colored overlay */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-70 transition-opacity duration-300" style={{background:`linear-gradient(135deg,${PILLAR_COLORS[i]}dd,${PILLAR_COLORS[i]}99)`}}/>

                {/* Number badge */}
                <div className="absolute top-4 left-4 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white" style={{background:PILLAR_COLORS[i]}}>
                  {i+1}
                </div>

                {/* Bottom content — always visible */}
                <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                  <h3 className="text-lg font-black mb-1 group-hover:mb-2 transition-all">{p.title}</h3>
                  <p className="text-xs text-white/70 leading-relaxed max-h-0 overflow-hidden group-hover:max-h-20 transition-all duration-300">{p.desc}</p>
                  <div className="flex items-center gap-1 text-xs font-bold mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Explore <ArrowRight className="w-3 h-3"/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SPORTS — full bleed */}
      <section className="relative overflow-hidden" style={{minHeight:480}}>
        <img src={`${I}offer-sports.png`} alt="NFGN Sports" className="absolute inset-0 w-full h-full object-cover"/>
        <div className="absolute inset-0" style={{background:`linear-gradient(135deg,rgba(45,106,79,0.95) 0%,rgba(45,106,79,0.7) 50%,rgba(0,0,0,0.4) 100%)`}}/>
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur text-white text-xs font-black px-4 py-2 rounded-full mb-6 tracking-widest uppercase">
              <Trophy className="w-4 h-4 text-[#C9A84C]"/> Pillar 04
            </div>
            <h2 className="text-5xl font-black text-white mb-4 leading-tight">
              NFGN Sports
            </h2>
            <p className="text-xl font-light text-white/80 mb-8 leading-relaxed">
              Youth programs, school teams, and community leagues where health meets athletic excellence. Building character on and off the field.
            </p>
            <div className="flex flex-wrap gap-3 mb-8">
              {["Youth Programs","School Teams","Local Leagues","Basketball Camps","Skills Labs"].map(t=>(
                <span key={t} className="text-xs font-bold px-4 py-2 rounded-full text-white/90" style={{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.25)"}}>
                  {t}
                </span>
              ))}
            </div>
            <a href="#" className="inline-flex items-center gap-2 font-black px-8 py-4 rounded-full hover:-translate-y-0.5 transition-all" style={{background:GOLD,color:"#0a0a0a"}}>
              NFGN Sports Details <ArrowRight className="w-4 h-4"/>
            </a>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              {n:"500+",l:"Youth Athletes Served"},
              {n:"20+",l:"Community Teams"},
              {n:"5",l:"Cities & Growing"},
              {n:"100%",l:"Community Funded"},
            ].map((s,i)=>(
              <div key={i} className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 text-center">
                <div className="text-3xl font-black text-white mb-1">{s.n}</div>
                <div className="text-xs text-white/60 font-medium">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAITH + FOUNDER */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
            <div className="relative">
              <div className="rounded-3xl overflow-hidden h-[500px] shadow-2xl">
                <img src={`${I}pillar-faith.png`} alt="Faith Community" className="w-full h-full object-cover"/>
              </div>
              <div className="absolute -top-5 -right-5 rounded-2xl p-5 shadow-xl" style={{background:`linear-gradient(135deg,${G},#1e4d39)`}}>
                <div className="text-3xl font-black text-white">2013</div>
                <div className="text-xs text-green-200 font-bold uppercase tracking-widest">Founded</div>
                <div className="text-xs text-green-300 mt-1">New Orleans, LA</div>
              </div>
            </div>
            <div>
              <span className="inline-block text-xs font-black tracking-widest uppercase px-4 py-1.5 rounded-full mb-6" style={{background:"rgba(201,168,76,0.15)",color:"#92400e"}}>
                A Faith Based Community
              </span>
              <h2 className="text-4xl font-black mb-6 leading-tight">
                GOD First.<br/>
                <span style={{color:G}}>Help First.</span>
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6 text-[15px]">
                Since 2013, New Face Global Network has been headquartered in New Orleans, Louisiana — built on a foundation of faith, community service, and natural wellness.
              </p>
              <p className="text-gray-600 leading-relaxed mb-8 text-[15px]">
                Our CEO & Founder Joe Marcelino has gone out of his way to develop a culture that's deeply rooted in a <strong style={{color:G}}>GOD First · Help First</strong> philosophy. This isn't just a mission statement — it's lived out daily in how we serve members, support communities, and operate as a company.
              </p>
              <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
                <Quote className="w-8 h-8 mb-3" style={{color:GOLD}}/>
                <p className="text-gray-800 font-medium italic leading-relaxed mb-4">
                  "A dollar spent within your community becomes two. A dollar spent outside becomes zero. Our mission is to keep wealth circulating where it matters most — within the community."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm" style={{background:G}}>JM</div>
                  <div>
                    <div className="font-bold text-sm">Joe Marcelino</div>
                    <div className="text-xs text-gray-500">Founder & CEO, NFGN</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Faith feature grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {emoji:"🙏",t:"Faith-Centered Leadership",d:"Every decision made through prayer and purpose"},
              {emoji:"❤️",t:"Service-First Culture",d:"Helping others before helping yourself is our DNA"},
              {emoji:"🏛️",t:"New Orleans HQ",d:"Proudly rooted in the culture capital of America"},
              {emoji:"🌱",t:"Growing Since 2013",d:"Over a decade of community health and wellness"},
            ].map((f,i)=>(
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow group">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform inline-block">{f.emoji}</div>
                <h3 className="font-black text-base mb-2">{f.t}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-black tracking-widest uppercase px-4 py-1.5 rounded-full mb-4" style={{background:"rgba(45,106,79,0.08)",color:G}}>
              Our Products
            </span>
            <h2 className="text-4xl font-black mb-3">Premium Natural Goods</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {name:"IGNITE Herbal Cleanse",price:"$59.99",old:"$99.99",badge:"Best Seller",bc:GOLD,img:`${I}product-ignite.png`},
              {name:"RENEW Soap Collection",price:"$12.99",old:null,badge:"Handmade",bc:G,img:`${I}offer-soaps.png`},
              {name:"Fragrance Candles",price:"$24.99",old:"$29.99",badge:"Premium",bc:"#7c3aed",img:`${I}offer-candles.png`},
              {name:"RENEW Natural Lotions",price:"$24.99",old:null,badge:"New",bc:"#16a34a",img:`${I}product-lotion.png`},
            ].map((p,i)=>(
              <div key={i} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-400 hover:-translate-y-2 border border-gray-100">
                <div className="relative h-52 overflow-hidden">
                  <img src={p.img} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
                  <span className="absolute top-3 left-3 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg" style={{background:p.bc}}>{p.badge}</span>
                </div>
                <div className="p-5">
                  <div className="flex gap-0.5 mb-2">{[...Array(5)].map((_,si)=><Star key={si} className="w-3 h-3 fill-amber-400 text-amber-400"/>)}</div>
                  <h3 className="font-bold text-sm mb-3">{p.name}</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-black">{p.price}</span>
                      {p.old&&<span className="text-xs text-gray-400 line-through">{p.old}</span>}
                    </div>
                    <button className="w-8 h-8 rounded-full text-white flex items-center justify-center shadow-md transition-transform hover:scale-110" style={{background:G}}>+</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <a href="#" className="inline-flex items-center gap-2 font-bold px-9 py-3.5 rounded-full border-2 transition-all hover:text-white" style={{borderColor:G,color:G}} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background=G}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background="transparent"}}>
              View All Products <ArrowRight className="w-4 h-4"/>
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative overflow-hidden" style={{background:`linear-gradient(135deg,${G} 0%,#1a3d2a 50%,#0f2419 100%)`}}>
        <div className="absolute inset-0 pointer-events-none" style={{backgroundImage:"radial-gradient(circle at 1px 1px,rgba(255,255,255,0.05) 1px,transparent 0)",backgroundSize:"40px 40px"}}/>
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-white text-xs font-black px-4 py-2 rounded-full mb-8 tracking-widest">
            <Leaf className="w-3.5 h-3.5 text-[#C9A84C]"/> GOD FIRST · HELP FIRST
          </div>
          <h2 className="text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
            Ready to Join the<br/>
            <span style={{color:GOLD}}>New Face Movement?</span>
          </h2>
          <p className="text-green-200 text-xl mb-12 max-w-xl mx-auto leading-relaxed">
            Become part of a faith-rooted, wellness-focused community that truly invests in your growth and your community.
          </p>
          <div className="flex flex-wrap justify-center gap-5">
            <a href="#" className="inline-flex items-center gap-2 font-black px-10 py-5 rounded-full text-lg shadow-2xl hover:-translate-y-1 transition-all" style={{background:GOLD,color:"#0a0a0a"}}>
              Become a Member <ArrowRight className="w-5 h-5"/>
            </a>
            <a href="#" className="inline-flex items-center gap-2 font-bold px-10 py-5 rounded-full text-lg border-2 border-white/30 text-white hover:bg-white/10 transition-all">
              Explore Products
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-950 text-gray-500 pt-14 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:`linear-gradient(135deg,${G},#16a34a)`}}><Leaf className="w-5 h-5 text-white"/></div>
                <span className="font-black text-white text-xl">NFGN</span>
              </div>
              <p className="text-sm leading-relaxed mb-4 text-gray-500">New Face Global Network — Where health meets community. Faith-rooted since 2013.</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 text-sm">Products</h4>
              <ul className="space-y-2 text-sm">{["IGNITE Line","RENEW Soaps","Candles","All Products"].map(l=><li key={l}><a href="#" className="hover:text-white transition-colors">{l}</a></li>)}</ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 text-sm">Community</h4>
              <ul className="space-y-2 text-sm">{["Join Us","NFGN Sports","Book-A-Pro","Events","Giving"].map(l=><li key={l}><a href="#" className="hover:text-white transition-colors">{l}</a></li>)}</ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 text-sm">Contact</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2"><Mail className="w-4 h-4" style={{color:GOLD}}/>newfaceglobalnetwork@gmail.com</li>
                <li className="flex items-center gap-2"><Phone className="w-4 h-4" style={{color:GOLD}}/>(678) 909-9974</li>
                <li className="flex items-center gap-2"><MapPin className="w-4 h-4" style={{color:GOLD}}/>New Orleans, Louisiana</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-xs text-gray-700 text-center">
            © 2013–2026 New Face Global Network · All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
