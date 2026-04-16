import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Leaf, Users, TrendingUp, Star, Phone, Mail, MapPin,
  Quote, ArrowRight, Award, BookOpen, Lightbulb, DollarSign,
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
                  network marketing, empowering thousands of members to take control of both their 
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
                entrepreneurship, and financial innovation. As a <strong className="text-foreground">Naturopathic Practitioner</strong>, 
                he brings decades of expertise in holistic health to every product and service NFGN offers.
              </p>
              <p>
                As an <strong className="text-foreground">Author and Coach</strong>, Joe has guided countless individuals 
                toward a healthier, more prosperous life — teaching not just wellness principles, but the 
                mindset and business acumen required to thrive in the modern economy.
              </p>
              <p>
                His most celebrated achievement is the invention and development of the 
                <strong className="text-foreground"> NFGN "2 Down By Infinity" Compensation Plan</strong> — a revolutionary 
                approach to network marketing that Joe conceived, engineered, and solely developed. 
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
              The "2 Down By Infinity" Plan
            </h2>
            <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
              Invented, designed, and solely developed by Joe Marcelino — a multi-point payment grid 
              built to reward effort at every level, from your very first referral to your deepest generation.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: Users,
                color: "#3B82F6",
                title: "Referral Commission",
                subtitle: "All Members",
                desc: "Earn 10% every time your personally sponsored member makes any purchase — from their very first order to every order thereafter.",
                rate: "10%",
              },
              {
                icon: TrendingUp,
                color: BRAND_GREEN,
                title: "Sales Commission",
                subtitle: "Pro Members Only",
                desc: "Pro Members earn an additional 10% on regular product purchases made by their direct downline, stacked on top of the referral commission.",
                rate: "10%",
              },
              {
                icon: Award,
                color: BRAND_GOLD,
                title: "Level 2 Power Bonus",
                subtitle: "Pro Members Only",
                desc: "The crown jewel of the plan. Earn 20% on Pro Package purchases made at your second level — twice the rate of Level 1.",
                rate: "20%",
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

      {/* Money Circulation */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              {[
                { icon: Leaf, color: BRAND_GREEN, label: "Naturopathic Products", desc: "Premium supplements, herbal cleanses, and wellness solutions." },
                { icon: DollarSign, color: BRAND_GOLD, label: "Money Circulation", desc: "A system engineered to keep money flowing between members, communities, and families." },
                { icon: Star, color: "#7C3AED", label: "Book-A-Professional", desc: "Connect with certified naturopathic practitioners for personalized health guidance." },
                { icon: Users, color: "#0EA5E9", label: "Community Network", desc: "A global family of wellness entrepreneurs supporting each other's growth." },
              ].map(({ icon: Icon, color, label, desc }) => (
                <div key={label} className="flex gap-4 p-4 rounded-xl border bg-card">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}15`, color }}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{label}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <Badge variant="outline" className="mb-4 text-xs tracking-widest uppercase px-4 py-1.5">What We Do</Badge>
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
                More Than Wellness — We Circulate <span className="text-primary">Money</span>
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  NFGN is not just a wellness company. In addition to our line of naturopathic 
                  products and professional health services, we specialize in <strong className="text-foreground">money circulation</strong> — 
                  creating a closed-loop economic ecosystem where every purchase, every referral, 
                  and every enrollment puts money back into the hands of our members.
                </p>
                <p>
                  This philosophy — that a community's collective economic activity should enrich 
                  that same community — is woven into every aspect of how NFGN operates, from our 
                  compensation plan to our product pricing and our member support systems.
                </p>
              </div>
              <Button asChild className="mt-8 gap-2">
                <Link href="/join">
                  Join the Network <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <Badge variant="outline" className="mb-4 text-xs tracking-widest uppercase px-4 py-1.5">
            Get in Touch
          </Badge>
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Contact Us</h2>
          <p className="text-muted-foreground mb-10">
            Whether you have questions about our products, our compensation plan, or how to 
            get started — we're here for you.
          </p>

          <div className="grid sm:grid-cols-3 gap-6 mb-10">
            <Card>
              <CardContent className="pt-6 pb-5 text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Email</p>
                  <a href="mailto:newfaceglobalnetwork@gmail.com" className="text-xs text-primary hover:underline break-all">
                    newfaceglobalnetwork@gmail.com
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 pb-5 text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Phone</p>
                  <a href="tel:+16789099974" className="text-xs text-primary hover:underline">
                    (678) 909-9974
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 pb-5 text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Headquarters</p>
                  <p className="text-xs text-muted-foreground">New Orleans, Louisiana</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="gap-2">
              <a href="mailto:newfaceglobalnetwork@gmail.com">
                <Mail className="h-4 w-4" />
                Send an Email
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <a href="tel:+16789099974">
                <Phone className="h-4 w-4" />
                Call Us
              </a>
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
}
