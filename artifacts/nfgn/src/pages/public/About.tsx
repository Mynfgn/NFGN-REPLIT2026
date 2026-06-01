import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Leaf, Users, TrendingUp, Star, Phone, Mail, MapPin,
  Quote, ArrowRight, Award, BookOpen, Lightbulb, DollarSign,
  Heart, GraduationCap, Globe, Zap, Trophy,
} from "lucide-react";

const BRAND_GOLD = "#C9A84C";
const BRAND_GREEN = "#2D6A4F";

export function About() {
  return (
    <div className="flex flex-col w-full">

      {/* Hero */}
      <section className="relative bg-foreground text-background overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary via-foreground to-foreground" />
        <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
          <Badge className="mb-6 text-xs tracking-widest uppercase px-4 py-1.5 bg-primary/20 text-primary border border-primary/30">
            Our Story
          </Badge>
          <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tighter leading-tight mb-6">
            New Face <span className="text-primary italic">Global Network</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Born in the heart of New Orleans. Built on the principles of naturopathic wellness, 
            financial empowerment, and community-driven prosperity.
          </p>
        </div>
      </section>

      {/* Founded In Banner */}
      <div className="bg-primary text-primary-foreground py-5">
        <div className="container mx-auto px-4 flex flex-wrap items-center justify-center gap-8 text-center">
          {[
            { label: "Founded", value: "2013" },
            { label: "Hometown", value: "New Orleans, LA" },
            { label: "Founder & CEO", value: "Joe Marcelino" },
            { label: "Specialty", value: "Wellness + Wealth" },
          ].map((item) => (
            <div key={item.label}>
              <div className="text-2xl font-bold font-serif">{item.value}</div>
              <div className="text-xs uppercase tracking-wider opacity-80">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Our Story */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
                Where It All Began
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  In 2013, in the vibrant city of New Orleans, Louisiana, a vision was born. 
                  Joe Marcelino — Naturopathic Practitioner, Entrepreneur, Author, Coach, and 
                  Compensation Plan Specialist — founded <strong className="text-foreground">New Face Global Network</strong> with 
                  a single, bold mission: to unite natural wellness with real, lasting financial opportunity.
                </p>
                <p>
                  What began as a passionate idea grew into a thriving global network of wellness 
                  entrepreneurs, health seekers, and community builders — all united by shared values 
                  of health, wealth, and purpose.
                </p>
                <p>
                  Today, NFGN stands as a pioneer in the intersection of naturopathic living and 
                  the Home Based Business industry, empowering thousands of members to take control of both their 
                  bodies and their financial futures.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { icon: Leaf, color: BRAND_GREEN, title: "Naturopathic Excellence", desc: "Premium natural wellness products rooted in science and tradition." },
                { icon: TrendingUp, color: BRAND_GOLD, title: "Financial Empowerment", desc: "A generous, transparent compensation plan designed to reward every level of effort." },
                { icon: Users, color: "#3B82F6", title: "Community First", desc: "A global network of passionate entrepreneurs helping each other grow." },
              ].map(({ icon: Icon, color, title, desc }) => (
                <div key={title} className="flex gap-4 p-4 rounded-xl border bg-card">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}18`, color }}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CEO Bio */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 text-xs tracking-widest uppercase px-4 py-1.5">
              Meet the Founder
            </Badge>
            <h2 className="text-3xl md:text-4xl font-serif font-bold">Joe Marcelino</h2>
            <p className="text-muted-foreground mt-2">CEO & Founder, New Face Global Network</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-start">
            <div className="md:col-span-1 flex flex-col items-center">
              <div className="h-36 w-36 rounded-full bg-foreground text-background flex items-center justify-center text-5xl font-serif font-bold border-4 border-primary shadow-lg">
                JM
              </div>
              <div className="mt-6 w-full space-y-2">
                {[
                  { icon: Leaf, label: "Naturopathic Practitioner" },
                  { icon: TrendingUp, label: "Entrepreneur" },
                  { icon: BookOpen, label: "Author" },
                  { icon: Star, label: "Coach" },
                  { icon: Lightbulb, label: "Compensation Plan Specialist" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 text-sm bg-card border rounded-lg px-3 py-2">
                    <Icon className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 space-y-5 text-muted-foreground leading-relaxed">
              <div className="relative">
                <Quote className="h-8 w-8 text-primary/20 absolute -top-2 -left-2" />
                <p className="pl-6 italic text-foreground text-lg font-serif leading-relaxed">
                  "True wellness is holistic — it encompasses your health, your wealth, and the legacy you build for those around you."
                </p>
              </div>
              <p>
                Joe Marcelino is a multi-faceted visionary whose life's work spans natural medicine, 
                entrepreneurship, and financial innovation. As a <strong className="text-foreground">Traditional Naturopathic Practitioner</strong>, 
                he brings decades of experience and knowledge in holistic health and wellness to every product, service, and program offered through NFGN. Originally from the Caribbean, he was raised with a deep appreciation for the healing power of nature and understands the value of natural foods, herbs, roots, minerals, and vitamins in supporting overall health and well-being.
              </p>
              <p>
                His passion is helping individuals improve their quality of life through education, lifestyle changes, proper nutrition, and natural wellness solutions. Drawing upon traditional naturopathic principles and years of practical experience, he is committed to empowering others to take a proactive approach to their health while embracing the benefits that nature has to offer.
              </p>
              <p>
                Through NFGN, his mission is to provide high-quality products, wellness education, and supportive services designed to help individuals transform their mind, body, and spirit while pursuing healthier, more fulfilling lives.
              </p>
              <p>
                As an <strong className="text-foreground">Author and Coach</strong>, Joe has guided countless individuals 
                toward a healthier, more prosperous life — teaching not just wellness principles, but the 
                mindset and business acumen required to thrive in the modern economy.
              </p>
              <p>
                His most celebrated achievement is the invention and development of the 
                <strong className="text-foreground"> NFGN "2 Down By Infinity" Compensation Plan</strong> — a revolutionary 
                approach to Home Based Business that Joe conceived, engineered, and solely developed. 
                This plan forms the backbone of NFGN's financial opportunity and has transformed the 
                livelihoods of members across the globe.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2 Down By Infinity Plan */}
      <section className="py-20 bg-foreground text-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 text-xs tracking-widest uppercase px-4 py-1.5 bg-primary/20 text-primary border border-primary/30">
              Our Compensation Plan
            </Badge>
            <h2 className="text-3xl md:text-4xl font-serif font-bold">
              The "2 Down By Infinity" Pay Structure
            </h2>
            <p className="text-xs text-gray-500 mt-2 italic">Also known as: 2 Down By Infinity Multi-Point Payment Grid</p>
            <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
              Invented, designed, and solely developed by Joe Marcelino — built specifically for the
              average, the inexperienced, and the underprivileged person who deserves a real shot at success.
            </p>
          </div>

          {/* Why it's called "2 Down" */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 mb-10 space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-center" style={{ color: BRAND_GOLD }}>The Story Behind the Name</p>
            <p className="text-gray-300 text-sm leading-relaxed text-center max-w-3xl mx-auto">
              The plan is called <strong className="text-white">"2 Down By Infinity"</strong> because of its key design principle:
              a <strong className="text-white">primary focus on Generation 2 (Level 2)</strong> — not Level 1. This is intentional.
              By concentrating earnings activity at the second level, the plan is specifically engineered to help
              <strong className="text-white"> Generation 1 (Level 1) members start earning commissions as fast as possible</strong>.
            </p>
            <div className="grid md:grid-cols-2 gap-4 pt-2">
              <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2">
                <p className="text-xs font-bold text-primary uppercase tracking-widest">2 Down</p>
                <p className="text-sm text-gray-300 leading-relaxed">
                  When your Level 2 grows and generates activity, the payout flows back up — directly benefiting your Level 1.
                  No one gets left behind waiting to earn. The person closest to you starts making money faster because of what happens two levels below them.
                </p>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2">
                <p className="text-xs font-bold text-primary uppercase tracking-widest">By Infinity</p>
                <p className="text-sm text-gray-300 leading-relaxed">
                  There is no ceiling on depth. Commissions can travel through generations indefinitely — the deeper your organization grows,
                  the more payment points activate across your grid, creating unlimited compounding potential.
                </p>
              </div>
            </div>
            <div className="rounded-lg border-l-4 border-primary px-4 py-3 bg-white/5 mt-2">
              <p className="text-sm italic text-gray-300 leading-relaxed">
                "Our goal is to help people start making money as soon as possible — that is the entire reason this pay structure was built."
              </p>
              <p className="text-xs text-gray-500 mt-1">— The NFGN Philosophy</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: Users,
                color: "#3B82F6",
                title: "Referral Commission",
                subtitle: "All Members",
                desc: "Earn 20% every time your personally sponsored member makes any purchase — from their very first order to every order thereafter.",
                rate: "20%",
              },
              {
                icon: TrendingUp,
                color: BRAND_GREEN,
                title: "Sales Commission",
                subtitle: "Pro Members Only",
                desc: "Pro Members earn an additional 12% on regular product purchases made by their direct downline, stacked on top of the referral commission.",
                rate: "12%",
              },
              {
                icon: Award,
                color: BRAND_GOLD,
                title: "Level 2 Power Bonus",
                subtitle: "Pro Members Only",
                desc: "The crown jewel of the plan. Earn 22% on Pro Package purchases made at your second level — nearly double the Level 1 rate.",
                rate: "22%",
              },
            ].map(({ icon: Icon, color, title, subtitle, desc, rate }) => (
              <Card key={title} className="bg-white/5 border-white/10 text-background">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: `${color}25`, color }}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-3xl font-bold font-serif" style={{ color }}>{rate}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="text-xs text-gray-400">{subtitle}</p>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-primary/10 border border-primary/30 rounded-xl p-6 text-center">
            <DollarSign className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="text-xl font-serif font-bold mb-2">Multi-Point Payment Grid</h3>
            <p className="text-gray-300 max-w-2xl mx-auto text-sm leading-relaxed">
              The "2 Down By Infinity" multi-point payment grid ensures that commissions flow through 
              multiple points in your organization simultaneously — creating compounding income potential 
              that grows with your team. The deeper your network, the more payment points activate across 
              your grid, rewarding both depth and breadth of community building.
            </p>
          </div>
        </div>
      </section>

      {/* Money Circulation — Core Specialty */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 text-xs tracking-widest uppercase px-4 py-1.5">
              Our Core Specialty
            </Badge>
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
              We Specialize in <span className="text-primary">Money Circulation</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-base leading-relaxed">
              Money Circulation is central to everything we do at NFGN. In addition to our premium 
              naturopathic products and professional health services, we have built an entire economic 
              ecosystem designed to keep money flowing between members, families, and communities.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-10 items-start mb-14">
            <div className="space-y-4">
              {[
                { icon: Leaf, color: BRAND_GREEN, label: "Naturopathic Products", desc: "Premium supplements, herbal cleanses, and naturopathic wellness solutions." },
                { icon: DollarSign, color: BRAND_GOLD, label: "Money Circulation", desc: "A system engineered to keep money flowing between members, communities, and families — this is our signature." },
                { icon: Star, color: "#7C3AED", label: "Book-A-Professional", desc: "Connect with certified naturopathic practitioners for personalized health guidance." },
                { icon: Users, color: "#0EA5E9", label: "Global Network", desc: "A worldwide family of wellness entrepreneurs supporting each other's growth and success." },
              ].map(({ icon: Icon, color, label, desc }) => (
                <div key={label} className="flex gap-4 p-4 rounded-xl border bg-card">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}15`, color }}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{label}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-foreground text-background rounded-2xl p-8 space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <span className="text-xs uppercase tracking-widest text-primary font-semibold">Why Money Circulation Matters</span>
              </div>
              <p className="text-gray-300 leading-relaxed text-sm">
                True financial empowerment happens when money stays within a community and continues 
                to circulate — creating jobs, opportunities, and prosperity for everyone involved.
              </p>
              <p className="text-gray-300 leading-relaxed text-sm">
                At NFGN, every product purchase, every referral commission, and every network 
                enrollment is designed to circulate wealth back into the hands of our members. 
                This is not just a business model — it is a <strong className="text-white">philosophy of economic justice.</strong>
              </p>
              <p className="text-gray-300 leading-relaxed text-sm">
                Our "2 Down By Infinity" compensation plan and multi-point payment grid are the 
                mechanical engines behind this circulation — ensuring that money flows to those 
                who drive value at every level of the network.
              </p>
              <Button asChild className="gap-2 mt-2">
                <Link href="/join">
                  Join the Circulation <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Keeping The Money Within Your Community Program */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 text-xs tracking-widest uppercase px-4 py-1.5 bg-white/20 text-white border border-white/30">
              Community Program
            </Badge>
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
              "Keeping The Money Within Your Own Community"
            </h2>
            <p className="text-primary-foreground/80 max-w-2xl mx-auto text-base leading-relaxed">
              One of our most important and beloved initiatives — a real-world educational and economic 
              program designed to transform how communities think about, spend, and grow their money.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            <Card className="bg-white/10 border-white/20 text-primary-foreground">
              <CardContent className="pt-6 space-y-3">
                <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">For Adults & Children Alike</h3>
                <p className="text-sm text-primary-foreground/75 leading-relaxed">
                  Our program is designed to educate both adults and children on the power of 
                  keeping money circulating within their own communities — building generational wealth from the ground up.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 text-primary-foreground">
              <CardContent className="pt-6 space-y-3">
                <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Globe className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">Across Various Cities</h3>
                <p className="text-sm text-primary-foreground/75 leading-relaxed">
                  We are bringing this program to cities across the country — creating local chapters 
                  and community leaders who champion economic self-sufficiency and community-first spending.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 text-primary-foreground">
              <CardContent className="pt-6 space-y-3">
                <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Heart className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">Economic Empowerment</h3>
                <p className="text-sm text-primary-foreground/75 leading-relaxed">
                  When a community spends money within itself, that money multiplies locally — 
                  creating more businesses, more jobs, and more opportunity for every person 
                  who participates in the ecosystem.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-white/10 border border-white/20 rounded-xl p-6 text-center">
            <p className="text-primary-foreground/90 text-base leading-relaxed max-w-3xl mx-auto">
              <strong className="text-white">"A dollar spent within your community becomes two. A dollar spent outside becomes zero."</strong>{" "}
              This is the principle that drives our community money circulation program — and it is 
              why NFGN is so much more than a wellness company.
            </p>
          </div>
        </div>
      </section>

      {/* NFGN SPORTS */}
      <section className="py-20 bg-foreground text-background overflow-hidden relative">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent" />
        <div className="container mx-auto px-4 max-w-5xl relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-5 text-xs tracking-widest uppercase px-4 py-1.5 bg-primary/20 text-primary border border-primary/30">
                Introducing
              </Badge>
              <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 leading-tight">
                NFGN <span className="text-primary">SPORTS</span>
              </h2>
              <p className="text-xl text-gray-300 font-light mb-4 italic">
                The next big thing in communities around the world.
              </p>
              <div className="space-y-4 text-gray-400 leading-relaxed text-sm">
                <p>
                  We are proud to introduce <strong className="text-white">NFGN SPORTS</strong> — a 
                  bold new initiative that extends the NFGN mission beyond wellness and wealth 
                  into the exciting world of community sports and athletics.
                </p>
                <p>
                  NFGN SPORTS is being built to unite communities through the power of competition, 
                  teamwork, and shared purpose — creating new opportunities for athletes, coaches, 
                  families, and entrepreneurs everywhere.
                </p>
                <p>
                  Whether you're a seasoned athlete or a passionate community organizer, 
                  NFGN SPORTS will have a place for you. Stay tuned for more details as we 
                  roll out this groundbreaking program city by city, community by community.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { icon: Trophy, color: BRAND_GOLD, title: "Community Competitions", desc: "Organized leagues, tournaments, and events bringing communities together through sport." },
                { icon: Users, color: "#3B82F6", title: "For All Ages", desc: "Programs designed for youth, adults, and families — everyone belongs in NFGN SPORTS." },
                { icon: Globe, color: BRAND_GREEN, title: "Global Reach", desc: "Launching in communities across the country and expanding worldwide." },
                { icon: Zap, color: "#7C3AED", title: "The Next Big Thing", desc: "NFGN SPORTS is poised to become a cornerstone of community life — watch this space." },
              ].map(({ icon: Icon, color, title, desc }) => (
                <div key={title} className="flex gap-4 p-4 rounded-xl border border-white/10 bg-white/5">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}20`, color }}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-white">{title}</h3>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}

              <div className="p-4 rounded-xl border border-primary/30 bg-primary/10 text-center">
                <p className="text-primary font-semibold text-sm">🏆 Coming Soon to Your Community</p>
                <p className="text-xs text-gray-400 mt-1">Join NFGN today to be the first to know when NFGN SPORTS launches near you.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <h2 className="text-2xl md:text-3xl font-serif font-bold mb-4">Ready to Be Part of Something Bigger?</h2>
          <p className="text-muted-foreground mb-8">
            Join the New Face Global Network — and become part of a community built on health, wealth, and purpose.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="gap-2">
              <Link href="/join">
                Join NFGN Today <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link href="/contact">
                <Mail className="h-4 w-4" />
                Contact Us
              </Link>
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
}
