import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MapPin, Clock, DollarSign, Zap, AlertCircle, CheckCircle2, Star, ChevronRight } from "lucide-react";
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
