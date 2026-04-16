import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MapPin, Clock, MessageSquare, CheckCircle2 } from "lucide-react";

export function Contact() {
  return (
    <div className="flex flex-col w-full">

      {/* Hero */}
      <section className="relative bg-foreground text-background overflow-hidden py-24 md:py-28">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary via-foreground to-foreground" />
        <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
          <Badge className="mb-6 text-xs tracking-widest uppercase px-4 py-1.5 bg-primary/20 text-primary border border-primary/30">
            We're Here For You
          </Badge>
          <h1 className="text-5xl md:text-6xl font-serif font-bold tracking-tighter leading-tight mb-6">
            Contact <span className="text-primary italic">Us</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-xl mx-auto leading-relaxed">
            Have a question about our products, compensation plan, or how to get started? 
            Reach out — we'd love to hear from you.
          </p>
        </div>
      </section>

      {/* 24-Hour Response Promise */}
      <div className="bg-primary text-primary-foreground py-5">
        <div className="container mx-auto px-4 flex items-center justify-center gap-3 text-center">
          <Clock className="h-5 w-5 flex-shrink-0" />
          <p className="font-semibold">
            We do our best to respond to all inquiries within <strong>24 hours.</strong>
          </p>
        </div>
      </div>

      {/* Contact Methods */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Reach Out Anytime</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Whether you prefer email or a quick call, we're ready to connect with you. 
              Our team is committed to making sure every question gets answered.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-14">
            <Card className="border-primary/20 hover:border-primary/50 transition-colors group">
              <CardContent className="pt-8 pb-7 text-center space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                  <Mail className="h-8 w-8" />
                </div>
                <div>
                  <p className="font-bold text-base mb-1">Email Us</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Send us a message anytime and we'll reply within 24 hours.
                  </p>
                  <a
                    href="mailto:newfaceglobalnetwork@gmail.com"
                    className="text-sm text-primary hover:underline font-medium break-all"
                  >
                    newfaceglobalnetwork@gmail.com
                  </a>
                </div>
                <Button asChild className="w-full gap-2" size="sm">
                  <a href="mailto:newfaceglobalnetwork@gmail.com">
                    <Mail className="h-4 w-4" />
                    Send an Email
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-primary/20 hover:border-primary/50 transition-colors group">
              <CardContent className="pt-8 pb-7 text-center space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                  <Phone className="h-8 w-8" />
                </div>
                <div>
                  <p className="font-bold text-base mb-1">Call Us</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Prefer to talk? Give us a call and we'll be happy to help.
                  </p>
                  <a
                    href="tel:+16789099974"
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    (678) 909-9974
                  </a>
                </div>
                <Button asChild variant="outline" className="w-full gap-2" size="sm">
                  <a href="tel:+16789099974">
                    <Phone className="h-4 w-4" />
                    Call Now
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-primary/20 hover:border-primary/50 transition-colors group">
              <CardContent className="pt-8 pb-7 text-center space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                  <MapPin className="h-8 w-8" />
                </div>
                <div>
                  <p className="font-bold text-base mb-1">Headquarters</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Founded and proudly headquartered in the Crescent City.
                  </p>
                  <p className="text-sm text-primary font-medium">New Orleans, Louisiana</p>
                </div>
                <Button asChild variant="outline" className="w-full gap-2" size="sm">
                  <a href="https://maps.google.com/?q=New+Orleans,+Louisiana" target="_blank" rel="noopener noreferrer">
                    <MapPin className="h-4 w-4" />
                    View on Map
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* What to expect */}
          <div className="bg-muted/40 rounded-2xl p-8 border">
            <div className="flex items-start gap-4 mb-6">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-xl mb-1">What to Expect When You Contact Us</h3>
                <p className="text-muted-foreground text-sm">We take every inquiry seriously. Here's our commitment to you:</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                "We will do our best to respond to all inquiries within 24 hours.",
                "Every question is important to us — no matter how big or small.",
                "Our team is knowledgeable about products, membership, and the compensation plan.",
                "If you're a member, please include your referral code for faster service.",
                "For urgent matters, calling during business hours is always the fastest option.",
                "We respond to emails sent to newfaceglobalnetwork@gmail.com seven days a week.",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Common Questions */}
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-center mb-10">Common Reasons to Contact Us</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { emoji: "🌿", label: "Product Questions", desc: "Learn about our naturopathic supplements and wellness services." },
              { emoji: "💰", label: "Compensation Plan", desc: "Get clarity on commissions, the 2 Down By Infinity plan, and payouts." },
              { emoji: "👥", label: "Joining NFGN", desc: "Find out how to become a Member or upgrade to Pro Member." },
              { emoji: "📦", label: "Orders & Shipping", desc: "Track your orders or get help with a delivery issue." },
              { emoji: "🏦", label: "Payouts & Wallet", desc: "Questions about your earnings, transfers, or payout requests." },
              { emoji: "🏅", label: "NFGN SPORTS", desc: "Learn about our exciting new sports initiative for communities." },
            ].map(({ emoji, label, desc }) => (
              <div key={label} className="p-4 bg-card border rounded-xl">
                <div className="text-2xl mb-2">{emoji}</div>
                <h3 className="font-semibold text-sm mb-1">{label}</h3>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
