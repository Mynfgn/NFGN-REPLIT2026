import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MapPin, Clock, DollarSign, Zap, AlertCircle, CheckCircle2, Star, ChevronRight, TrendingUp, Users, Scissors, Wrench, Music, Camera, BookOpen, Heart, Dumbbell, Briefcase } from "lucide-react";
import { Link } from "wouter";

const GOLD = "#C9A84C";
const DARK = "#0a0a0a";

interface Service { id: number; name: string; description: string | null; price: number; cv: number; }
interface Slot { id: number; availableDate: string; startTime: string; endTime: string; maxChairs: number; notes: string | null; }
interface Provider { id: number; fullName: string; location: string; bookAProCategory: string | null; bookAProBio: string | null; profileImage: string | null; }

function priceBreakdown(unitPrice: number, hours: number) {
  const total = unitPrice * hours;
  return { total: parseFloat(total.toFixed(2)), cv: parseFloat((total * 0.10).toFixed(2)) };
}

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h < 12 ? "AM" : "PM";
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

export function PayAsYouGoPage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [providers, setProviders] = useState<Provider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);

  // Booking modal state
  const [bookingProvider, setBookingProvider] = useState<Provider | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [numHours, setNumHours] = useState(2);
  const [startTime, setStartTime] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/payg/providers")
      .then(r => r.json())
      .then(d => setProviders(d.providers ?? []))
      .catch(() => {})
      .finally(() => setLoadingProviders(false));
  }, []);

  async function openBooking(provider: Provider) {
    if (!isAuthenticated) {
      toast({ title: "Sign in required", description: "Please sign in or create an account to book.", variant: "destructive" });
      return;
    }
    setBookingProvider(provider);
    setStep(1);
    setSelectedService(null);
    setSelectedSlot(null);
    setNumHours(2);
    setStartTime("");
    setNotes("");
    setLoadingDetail(true);
    const [svcRes, slotRes] = await Promise.all([
      fetch(`/api/payg/providers/${provider.id}/services`),
      fetch(`/api/payg/providers/${provider.id}/availability`),
    ]);
    const svcData = await svcRes.json();
    const slotData = await slotRes.json();
    setServices(svcData.services ?? []);
    setSlots(slotData.slots ?? []);
    setLoadingDetail(false);
  }

  async function submitBooking() {
    if (!bookingProvider || !selectedService || !selectedSlot || !startTime) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/payg/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("nfgn_token")}` },
        body: JSON.stringify({
          providerId: bookingProvider.id,
          serviceId: selectedService.id,
          availabilityId: selectedSlot.id,
          bookingDate: selectedSlot.availableDate,
          startTime,
          numHours,
          notes: notes || undefined,
          paymentMethod: "card",
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast({ title: data.error ?? "Booking failed", variant: "destructive" }); return; }
      toast({ title: "Booking submitted!", description: "You'll receive a confirmation email shortly. Check your dashboard for status updates." });
      setBookingProvider(null);
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  const { total, cv } = selectedService && selectedSlot
    ? priceBreakdown(selectedService.price, numHours)
    : { total: 0, cv: 0 };

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", minHeight: "100vh", background: "#fff" }}>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section style={{ background: DARK, color: "#fff", padding: "72px 0 60px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.35)", borderRadius: 99, padding: "6px 16px", fontSize: 12, fontWeight: 700, color: GOLD, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 24 }}>
            <Zap size={13} /> Pay As You Go
          </div>
          <h1 style={{ fontFamily: "'Georgia',serif", fontSize: "clamp(32px,5vw,52px)", fontWeight: 900, lineHeight: 1.15, marginBottom: 20 }}>
            Professional Space Rental<br />
            <span style={{ color: GOLD }}>On Your Schedule</span>
          </h1>
          <p style={{ fontSize: 17, color: "#aaa", maxWidth: 620, margin: "0 auto 32px", lineHeight: 1.7 }}>
            Originally designed for salon owners renting chairs to stylists and barbers. Book professional space by the hour — minimum 2 hours, maximum 8 hours per day.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <div style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 10, padding: "14px 22px", textAlign: "center", minWidth: 130 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: GOLD }}>2 hrs</div>
              <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>Minimum rental</div>
            </div>
            <div style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 10, padding: "14px 22px", textAlign: "center", minWidth: 130 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: GOLD }}>8 hrs</div>
              <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>Max per day (1 Block)</div>
            </div>
            <div style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 10, padding: "14px 22px", textAlign: "center", minWidth: 130 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: GOLD }}>48 hrs</div>
              <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>Advance notice required</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Policy Notice ─────────────────────────────────────────────── */}
      <section style={{ background: "#fffbf0", borderBottom: "1px solid rgba(201,168,76,0.25)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "18px 24px", display: "flex", gap: 12, alignItems: "flex-start" }}>
          <AlertCircle size={18} style={{ color: "#B45309", flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 13, color: "#92400E", lineHeight: 1.6, margin: 0 }}>
            <strong>Booking Policy:</strong> All Pay As You Go bookings must be purchased at least 48 hours in advance for scheduling and payment processing purposes. Same-day bookings require corporate approval. <strong>Once paid, all purchases are non-refundable.</strong>
          </p>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────── */}
      <section style={{ padding: "56px 0", background: "#fafafa", borderBottom: "1px solid #eee" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px" }}>
          <h2 style={{ fontFamily: "'Georgia',serif", fontSize: 26, fontWeight: 800, textAlign: "center", marginBottom: 36 }}>
            How Pay As You Go Works
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
            {[
              { n: "1", title: "Choose a Provider", desc: "Browse Pro Member providers who have set up Pay As You Go availability." },
              { n: "2", title: "Select a Service", desc: "Pick from up to 4 professional services offered by that provider at their listed rate." },
              { n: "3", title: "Pick Date & Time", desc: "Select an available date and start time from the provider's calendar." },
              { n: "4", title: "Choose Hours", desc: "Minimum 2 hours, maximum 8 hours (1 Block of Time) per booking per day." },
              { n: "5", title: "Review & Book", desc: "See the full price breakdown and CV generated, then confirm your booking." },
            ].map(step => (
              <div key={step.n} style={{ background: "#fff", borderRadius: 12, padding: "20px 18px", border: "1px solid #eee", textAlign: "center" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: GOLD, color: DARK, fontWeight: 900, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>{step.n}</div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{step.title}</div>
                <div style={{ fontSize: 13, color: "#666", lineHeight: 1.5 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What Is PAYG ─────────────────────────────────────────────── */}
      <section style={{ padding: "64px 0", background: "#fff", borderBottom: "1px solid #eee" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${GOLD}15`, border: `1px solid ${GOLD}40`, borderRadius: 99, padding: "5px 14px", fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>
                <Zap size={11} /> About The Program
              </div>
              <h2 style={{ fontFamily: "'Georgia',serif", fontSize: 30, fontWeight: 900, lineHeight: 1.2, marginBottom: 16 }}>
                What Is NFGN's Pay As You Go Program?
              </h2>
              <p style={{ fontSize: 15, color: "#444", lineHeight: 1.8, marginBottom: 14 }}>
                NFGN's Pay As You Go (PAYG) Program is a unique booking and referral platform that operates within the NFGN Book-A-Professional system. PAYG was designed to <strong>connect customers with qualified service providers</strong> while creating additional income opportunities for professionals, business owners, and referring members.
              </p>
              <p style={{ fontSize: 15, color: "#444", lineHeight: 1.8 }}>
                Unlike traditional service directories, PAYG combines <strong>professional service bookings, product sales, referral commissions, and business development</strong> into one system. The goal is simple: help professionals increase their income, help customers find trusted service providers, and create additional earning opportunities throughout the NFGN network.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { icon: Users, title: "Connect Customers & Providers", desc: "PAYG bridges the gap between customers seeking trusted professionals and qualified service providers ready to serve them." },
                { icon: DollarSign, title: "Referral Commissions Built In", desc: "Every booking creates commission opportunities for referring members throughout the NFGN network." },
                { icon: TrendingUp, title: "Business Development Platform", desc: "More than a booking tool — PAYG is a complete business-building ecosystem for professionals and entrepreneurs." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} style={{ display: "flex", gap: 14, padding: "16px 18px", background: "#fafafa", borderRadius: 12, border: "1px solid #eee" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${GOLD}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={18} style={{ color: GOLD }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{title}</div>
                    <div style={{ fontSize: 13, color: "#666", lineHeight: 1.6 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Started ────────────────────────────────────────────── */}
      <section style={{ padding: "64px 0", background: DARK, color: "#fff" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${GOLD}18`, border: `1px solid ${GOLD}40`, borderRadius: 99, padding: "5px 14px", fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>
              The Origin Story
            </div>
            <h2 style={{ fontFamily: "'Georgia',serif", fontSize: 30, fontWeight: 900, color: "#fff", marginBottom: 16 }}>How It Started</h2>
            <p style={{ fontSize: 15, color: "#aaa", maxWidth: 640, margin: "0 auto", lineHeight: 1.8 }}>
              The development of the Pay As You Go Program began in <strong style={{ color: GOLD }}>November 2014</strong> by <strong style={{ color: "#fff" }}>Joe Marcelino</strong>, Founder of New Face Global Network (NFGN).
            </p>
          </div>

          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "32px 36px", marginBottom: 32 }}>
            <p style={{ fontSize: 15, color: "#ccc", lineHeight: 1.9, marginBottom: 16 }}>
              At the time, NFGN was marketing and selling hair extensions and beauty-related products. Joe noticed that many cosmetologists and hairstylists were purchasing hair bundles and products through the company, but there was <strong style={{ color: "#fff" }}>no organized system to connect those professionals with customers</strong> who needed installation and beauty services.
            </p>
            <div style={{ background: `${GOLD}12`, border: `1px solid ${GOLD}30`, borderRadius: 12, padding: "20px 24px", margin: "20px 0" }}>
              <p style={{ fontSize: 16, fontStyle: "italic", color: GOLD, margin: 0, lineHeight: 1.7, fontFamily: "'Georgia',serif" }}>
                "If a customer purchased hair extensions from NFGN, why not refer that customer to an NFGN-affiliated cosmetologist who could install the hair?"
              </p>
              <p style={{ fontSize: 12, color: "#aaa", margin: "10px 0 0", fontWeight: 600 }}>— Joe Marcelino, Founder & CEO</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
            {[
              { label: "The customer", value: "Receives professional service" },
              { label: "The cosmetologist", value: "Gains a new client" },
              { label: "The cosmetologist", value: "Sells more products" },
              { label: "The referring member", value: "Earns referral commissions" },
              { label: "NFGN", value: "Increases product movement & satisfaction" },
            ].map(({ label, value }) => (
              <div key={value} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "14px 16px", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 13, color: "#ddd", lineHeight: 1.5 }}>{value}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 14, color: "#888", textAlign: "center", marginTop: 24 }}>What began as a simple referral concept quickly evolved into a much larger business model.</p>
        </div>
      </section>

      {/* ── The Evolution ─────────────────────────────────────────────── */}
      <section style={{ padding: "64px 0", background: "#fafafa", borderBottom: "1px solid #eee" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${GOLD}15`, border: `1px solid ${GOLD}40`, borderRadius: 99, padding: "5px 14px", fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>
              The Evolution
            </div>
            <h2 style={{ fontFamily: "'Georgia',serif", fontSize: 30, fontWeight: 900, marginBottom: 14 }}>The Evolution of PAYG</h2>
            <p style={{ fontSize: 15, color: "#555", maxWidth: 620, margin: "0 auto", lineHeight: 1.8 }}>
              As the network expanded, Joe realized that the same concept could be applied to many different professions and industries. PAYG eventually expanded <strong>far beyond cosmetology and beauty services</strong> to create a complete Book-A-Professional Marketplace.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 40 }}>
            {[
              { icon: Scissors, label: "Book A Barber" },
              { icon: Wrench, label: "Book A Mechanic" },
              { icon: Wrench, label: "Book A Carpenter" },
              { icon: Heart, label: "Book A Therapist" },
              { icon: Heart, label: "Book A Massage Therapist" },
              { icon: Dumbbell, label: "Book A Personal Trainer" },
              { icon: BookOpen, label: "Book A Tutor" },
              { icon: Camera, label: "Book A Photographer" },
              { icon: Music, label: "Book A DJ" },
              { icon: Briefcase, label: "Book A Consultant" },
              { icon: Heart, label: "Book A Naturopathic Practitioner" },
              { icon: Star, label: "Book A Coach" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", borderRadius: 10, padding: "12px 14px", border: "1px solid #eee" }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: `${GOLD}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={14} style={{ color: GOLD }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>{label}</span>
              </div>
            ))}
          </div>
          <div style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}30`, borderRadius: 14, padding: "20px 24px", textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "#555", margin: 0, lineHeight: 1.7 }}>
              <strong style={{ color: DARK }}>And many other professional services.</strong> The result was the creation of a complete <strong>Book-A-Professional Marketplace</strong> where customers could locate, schedule, and purchase services from qualified professionals while supporting the entire NFGN ecosystem.
            </p>
          </div>
        </div>
      </section>

      {/* ── Why PAYG Is Powerful ──────────────────────────────────────── */}
      <section style={{ padding: "64px 0", background: "#fff", borderBottom: "1px solid #eee" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${GOLD}15`, border: `1px solid ${GOLD}40`, borderRadius: 99, padding: "5px 14px", fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>
              For Salon Owners
            </div>
            <h2 style={{ fontFamily: "'Georgia',serif", fontSize: 30, fontWeight: 900, marginBottom: 14 }}>Why PAYG Is So Powerful For Salon Owners</h2>
            <p style={{ fontSize: 15, color: "#555", maxWidth: 620, margin: "0 auto", lineHeight: 1.8 }}>
              One of the biggest challenges salon owners face is managing traditional booth rentals. Instead of relying solely on monthly agreements, PAYG offers a smarter, more flexible solution.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "start" }}>
            <div>
              <h3 style={{ fontWeight: 800, fontSize: 16, color: "#B91C1C", marginBottom: 14 }}>Traditional Booth Rental Challenges</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {["Missed payments", "Vacant chairs", "Unused space", "Long-term commitments", "Administrative headaches"].map(item => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", background: "#fff5f5", borderRadius: 8, border: "1px solid #fecaca" }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fca5a5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <AlertCircle size={11} style={{ color: "#991B1B" }} />
                    </div>
                    <span style={{ fontSize: 13, color: "#7f1d1d", fontWeight: 600 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 style={{ fontWeight: 800, fontSize: 16, color: "#166534", marginBottom: 14 }}>PAYG Advantages</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {["Monetize unused chairs", "Increase occupancy rates", "Generate revenue from empty workstations", "Reduce financial risk", "Create flexible opportunities for stylists"].map(item => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", background: "#f0fdf4", borderRadius: 8, border: "1px solid #bbf7d0" }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#86efac", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <CheckCircle2 size={11} style={{ color: "#166534" }} />
                    </div>
                    <span style={{ fontSize: 13, color: "#14532d", fontWeight: 600 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 32, background: DARK, borderRadius: 14, padding: "24px 28px", textAlign: "center" }}>
            <p style={{ fontFamily: "'Georgia',serif", fontSize: 18, fontStyle: "italic", color: "#fff", margin: "0 0 6px", lineHeight: 1.6 }}>
              "A chair that sits empty generates no revenue.<br />A chair rented through PAYG creates income immediately."
            </p>
            <p style={{ fontSize: 12, color: GOLD, fontWeight: 700, margin: 0, letterSpacing: "0.05em" }}>— THE PAYG PRINCIPLE</p>
          </div>
        </div>
      </section>

      {/* ── Reduce Overhead + Multiple Streams ───────────────────────── */}
      <section style={{ padding: "64px 0", background: "#fafafa", borderBottom: "1px solid #eee" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
            {/* Reduce Overhead */}
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${GOLD}15`, border: `1px solid ${GOLD}40`, borderRadius: 99, padding: "4px 12px", fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 14 }}>
                Reduce Overhead
              </div>
              <h3 style={{ fontFamily: "'Georgia',serif", fontSize: 22, fontWeight: 900, marginBottom: 12, lineHeight: 1.3 }}>Helping Professionals Reduce Overhead</h3>
              <p style={{ fontSize: 14, color: "#555", lineHeight: 1.8, marginBottom: 16 }}>
                A cosmetologist may not be ready to commit to a full-time booth rental. Through PAYG, they can <strong>rent space only when needed</strong>, serve their clients, and keep more of their profits.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {["Grow their clientele", "Build their brand", "Increase profitability", "Minimize unnecessary expenses", "Scale at their own pace"].map(item => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#333" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: GOLD, flexShrink: 0 }} />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Multiple Streams */}
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${GOLD}15`, border: `1px solid ${GOLD}40`, borderRadius: 99, padding: "4px 12px", fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 14 }}>
                Multiple Income Streams
              </div>
              <h3 style={{ fontFamily: "'Georgia',serif", fontSize: 22, fontWeight: 900, marginBottom: 12, lineHeight: 1.3 }}>Creating Multiple Streams of Income</h3>
              <p style={{ fontSize: 14, color: "#555", lineHeight: 1.8, marginBottom: 16 }}>
                A cosmetologist performs a hairstyle service for $50. Traditionally, the transaction ends there. Within NFGN, that same customer may also purchase:
              </p>
              <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #eee", padding: "14px 16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {["Handmade soaps", "Handmade candles", "Herbal wellness products", "Weight-loss programs", "Health consultations", "Travel services", "Educational courses", "Memberships", "Special events", "Additional services"].map(item => (
                    <div key={item} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#555" }}>
                      <CheckCircle2 size={11} style={{ color: GOLD, flexShrink: 0 }} />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <p style={{ fontSize: 13, color: "#888", marginTop: 12, lineHeight: 1.6 }}>
                This creates the opportunity for <strong style={{ color: DARK }}>long-term residual income</strong> and ongoing customer relationships — the cosmetologist earns even when no one is sitting in their chair.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Future of PAYG ────────────────────────────────────────────── */}
      <section style={{ padding: "64px 0", background: DARK, color: "#fff" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${GOLD}18`, border: `1px solid ${GOLD}40`, borderRadius: 99, padding: "5px 14px", fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 20 }}>
            <TrendingUp size={11} /> The Future
          </div>
          <h2 style={{ fontFamily: "'Georgia',serif", fontSize: 30, fontWeight: 900, color: "#fff", marginBottom: 20 }}>The Future of PAYG</h2>
          <p style={{ fontSize: 16, color: "#bbb", lineHeight: 1.9, marginBottom: 20 }}>
            Today, Pay As You Go continues to evolve as one of the most innovative components of the NFGN platform. Its purpose remains the same as it was in 2014: to connect customers with professionals, help business owners generate additional revenue, increase product movement throughout the network, reward referrals, and create opportunities for individuals to build stronger and more sustainable incomes.
          </p>
          <div style={{ background: `${GOLD}12`, border: `1px solid ${GOLD}35`, borderRadius: 14, padding: "24px 28px", marginBottom: 32 }}>
            <p style={{ fontFamily: "'Georgia',serif", fontSize: 18, color: "#fff", lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>
              "PAYG is more than a booking system. It is a business-building platform designed to help professionals, entrepreneurs, and service providers expand their reach, increase their earnings, and participate in a thriving network of products, services, and opportunities."
            </p>
          </div>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/join">
              <Button style={{ background: GOLD, color: DARK, fontWeight: 800, padding: "12px 28px" }}>
                Join as a Pro Member <ChevronRight size={14} />
              </Button>
            </Link>
            <Link href="/book">
              <Button variant="outline" style={{ borderColor: "rgba(255,255,255,0.3)", color: "#fff", padding: "12px 28px" }}>
                Browse Book-A-Pro <ChevronRight size={14} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Providers ─────────────────────────────────────────────────── */}
      <section style={{ padding: "56px 0" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px" }}>
          <h2 style={{ fontFamily: "'Georgia',serif", fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Available Providers</h2>
          <p style={{ color: "#666", marginBottom: 36, fontSize: 14 }}>Pro Members offering Pay As You Go professional space rental.</p>

          {loadingProviders ? (
            <div style={{ textAlign: "center", padding: 48 }}><Loader2 className="animate-spin mx-auto" style={{ color: GOLD }} size={32} /></div>
          ) : providers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "56px 24px", background: "#fafafa", borderRadius: 16, border: "1px solid #eee" }}>
              <Zap size={36} style={{ color: "#ddd", margin: "0 auto 16px" }} />
              <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>No Providers Yet</h3>
              <p style={{ color: "#888", fontSize: 14, marginBottom: 20 }}>Pro Members can set up Pay As You Go services from their dashboard.</p>
              {!isAuthenticated && <Link href="/join"><Button style={{ background: GOLD, color: DARK, fontWeight: 700 }}>Join as a Pro Member</Button></Link>}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
              {providers.map(p => (
                <div key={p.id} style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e5e5", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", transition: "box-shadow 0.2s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 24px rgba(0,0,0,0.10)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.05)"}
                >
                  <div style={{ background: DARK, padding: "24px 20px 20px", textAlign: "center" }}>
                    {p.profileImage
                      ? <img src={p.profileImage} alt={p.fullName} style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover", border: `3px solid ${GOLD}`, margin: "0 auto 12px" }} />
                      : <div style={{ width: 60, height: 60, borderRadius: "50%", background: `${GOLD}22`, border: `3px solid ${GOLD}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 22, fontWeight: 800, color: GOLD }}>{p.fullName.charAt(0)}</div>
                    }
                    <div style={{ fontWeight: 800, fontSize: 16, color: "#fff" }}>{p.fullName}</div>
                    {p.bookAProCategory && <div style={{ fontSize: 12, color: GOLD, marginTop: 4, fontWeight: 600 }}>{p.bookAProCategory}</div>}
                    {p.location && <div style={{ fontSize: 12, color: "#888", marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}><MapPin size={11} />{p.location}</div>}
                  </div>
                  <div style={{ padding: "16px 20px 20px" }}>
                    {p.bookAProBio && <p style={{ fontSize: 13, color: "#555", lineHeight: 1.6, marginBottom: 14 }}>{p.bookAProBio}</p>}
                    <Button
                      onClick={() => openBooking(p)}
                      style={{ width: "100%", background: GOLD, color: DARK, fontWeight: 700 }}
                    >
                      Book This Provider <ChevronRight size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pro member CTA */}
          <div style={{ marginTop: 48, background: DARK, borderRadius: 16, padding: "32px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: "#fff", marginBottom: 6 }}>Are You a Pro Member?</div>
              <div style={{ fontSize: 14, color: "#aaa" }}>Offer Pay As You Go services and earn CV from every booking.</div>
            </div>
            <Link href="/dashboard/payg-provider">
              <Button variant="outline" style={{ borderColor: GOLD, color: GOLD, fontWeight: 700 }}>Set Up My Services</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Booking Modal ─────────────────────────────────────────────── */}
      <Dialog open={!!bookingProvider} onOpenChange={open => { if (!open) setBookingProvider(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg">
              Book {bookingProvider?.fullName}
              {step > 1 && <span style={{ color: GOLD, fontSize: 13, fontWeight: 600, marginLeft: 10 }}>Step {step} of 3</span>}
            </DialogTitle>
          </DialogHeader>

          {loadingDetail ? (
            <div style={{ textAlign: "center", padding: 32 }}><Loader2 className="animate-spin mx-auto" style={{ color: GOLD }} size={28} /></div>
          ) : (
            <div className="space-y-4">

              {/* Step 1: Select service */}
              {step === 1 && (
                <div className="space-y-3">
                  <Label className="font-semibold">Select a Service</Label>
                  {services.length === 0 ? (
                    <p style={{ color: "#888", fontSize: 13 }}>This provider has no active services yet.</p>
                  ) : services.map(svc => (
                    <button key={svc.id} onClick={() => setSelectedService(svc)}
                      style={{ width: "100%", textAlign: "left", padding: "14px 16px", borderRadius: 10, border: `2px solid ${selectedService?.id === svc.id ? GOLD : "#e5e5e5"}`, background: selectedService?.id === svc.id ? `${GOLD}10` : "#fafafa", cursor: "pointer", transition: "all 0.15s" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{svc.name}</div>
                          {svc.description && <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{svc.description}</div>}
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                          <div style={{ fontWeight: 800, fontSize: 16, color: GOLD }}>${svc.price.toFixed(2)}<span style={{ fontSize: 11, fontWeight: 600, color: "#888" }}>/hr</span></div>
                          <div style={{ fontSize: 11, color: "#888" }}>{svc.cv.toFixed(2)} CV/hr</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Step 2: Select date, time, hours */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label className="font-semibold mb-2 block">Select an Available Date & Window</Label>
                    {slots.length === 0 ? (
                      <p style={{ color: "#888", fontSize: 13 }}>No availability set by this provider yet.</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 200, overflowY: "auto" }}>
                        {slots.map(slot => (
                          <button key={slot.id} onClick={() => { setSelectedSlot(slot); setStartTime(slot.startTime); }}
                            style={{ textAlign: "left", padding: "12px 14px", borderRadius: 10, border: `2px solid ${selectedSlot?.id === slot.id ? GOLD : "#e5e5e5"}`, background: selectedSlot?.id === slot.id ? `${GOLD}10` : "#fafafa", cursor: "pointer" }}
                          >
                            <div style={{ fontWeight: 700, fontSize: 13 }}>{formatDate(slot.availableDate)}</div>
                            <div style={{ fontSize: 12, color: "#666", display: "flex", gap: 8, marginTop: 2 }}>
                              <span><Clock size={11} style={{ display: "inline", marginRight: 3 }} />{formatTime(slot.startTime)} – {formatTime(slot.endTime)}</span>
                              {slot.maxChairs > 1 && <span>· {slot.maxChairs} chairs</span>}
                            </div>
                            {slot.notes && <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{slot.notes}</div>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedSlot && (
                    <div>
                      <Label className="font-semibold mb-1 block">Start Time</Label>
                      <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} min={selectedSlot.startTime} max={selectedSlot.endTime} />
                      <p style={{ fontSize: 11, color: "#888", marginTop: 4 }}>Available window: {formatTime(selectedSlot.startTime)} – {formatTime(selectedSlot.endTime)}</p>
                    </div>
                  )}

                  <div>
                    <Label className="font-semibold mb-1 block">Number of Hours <span style={{ color: "#888", fontWeight: 400 }}>(min 2 / max 8)</span></Label>
                    <Select value={String(numHours)} onValueChange={v => setNumHours(parseInt(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[2,3,4,5,6,7,8].map(h => <SelectItem key={h} value={String(h)}>{h} hour{h !== 1 ? "s" : ""}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="font-semibold mb-1 block">Notes (optional)</Label>
                    <Input placeholder="Any special requirements or notes…" value={notes} onChange={e => setNotes(e.target.value)} />
                  </div>
                </div>
              )}

              {/* Step 3: Review & confirm */}
              {step === 3 && selectedService && selectedSlot && (
                <div className="space-y-4">
                  <div style={{ background: "#fafafa", borderRadius: 10, padding: "16px" }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: DARK }}>Booking Summary</div>
                    {[
                      ["Provider", bookingProvider?.fullName ?? ""],
                      ["Service", selectedService.name],
                      ["Date", formatDate(selectedSlot.availableDate)],
                      ["Start Time", formatTime(startTime)],
                      ["Duration", `${numHours} hour${numHours !== 1 ? "s" : ""}`],
                      ["Rate", `$${selectedService.price.toFixed(2)}/hr`],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                        <span style={{ color: "#666" }}>{k}</span>
                        <span style={{ fontWeight: 600 }}>{v}</span>
                      </div>
                    ))}
                    <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: 10, marginTop: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800 }}>
                        <span>Total Due</span>
                        <span style={{ color: GOLD }}>${total.toFixed(2)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#888", marginTop: 4 }}>
                        <span>CV Generated</span>
                        <span>{cv.toFixed(2)} CV</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: "#fffbf0", border: "1px solid rgba(201,168,76,0.35)", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <AlertCircle size={14} style={{ color: "#B45309", flexShrink: 0, marginTop: 1 }} />
                      <p style={{ fontSize: 12, color: "#92400E", margin: 0, lineHeight: 1.6 }}>
                        All Pay As You Go bookings must be purchased at least <strong>48 hours in advance</strong>. Same-day bookings require corporate approval. <strong>Once paid, all purchases are non-refundable.</strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            {step === 1 && (
              <>
                <Button variant="outline" onClick={() => setBookingProvider(null)}>Cancel</Button>
                <Button disabled={!selectedService} onClick={() => setStep(2)} style={{ background: GOLD, color: DARK, fontWeight: 700 }}>
                  Next: Schedule <ChevronRight size={14} />
                </Button>
              </>
            )}
            {step === 2 && (
              <>
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button disabled={!selectedSlot || !startTime} onClick={() => setStep(3)} style={{ background: GOLD, color: DARK, fontWeight: 700 }}>
                  Next: Review <ChevronRight size={14} />
                </Button>
              </>
            )}
            {step === 3 && (
              <>
                <Button variant="outline" onClick={() => setStep(2)} disabled={submitting}>Back</Button>
                <Button onClick={submitBooking} disabled={submitting} style={{ background: GOLD, color: DARK, fontWeight: 700 }}>
                  {submitting ? <><Loader2 size={14} className="animate-spin mr-1" /> Submitting…</> : "Confirm Booking"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
