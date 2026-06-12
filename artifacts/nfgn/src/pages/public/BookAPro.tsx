import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Star, Calendar, Clock, DollarSign, Loader2, Trophy,
  ChevronDown, Users, Filter, X, CheckCircle, MapPin, Globe,
} from "lucide-react";
import { BAP_MAIN_CATEGORIES, getCategoryLabel, getCategoryInfo } from "@/lib/bapCategories";
import { customFetch } from "@/lib/custom-fetch";

const GOLD = "#C9A84C";
const BLACK = "#0a0a0a";

const ALL_OPTION = "all";

const SPORTS_SUBCATEGORIES = [
  "Sports Coaches", "Physical Trainers", "Team Coaches",
  "Private Lessons", "Skills Trainers", "Sports Camps", "Athletic Performance Coaches",
];

function BookingModal({ pro, onClose }: { pro: any; onClose: () => void }) {
  const [, navigate] = useLocation();
  const token = localStorage.getItem("nfgn_token");

  const [serviceType, setServiceType] = useState(pro.services?.[0] ?? "Consultation");
  const [scheduledAt, setScheduledAt] = useState("");
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  if (!token) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
        <div style={{ background: "#fff", borderRadius: 16, padding: 40, maxWidth: 420, width: "100%", textAlign: "center" }} onClick={e => e.stopPropagation()}>
          <Calendar size={40} color={GOLD} style={{ margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: 22, fontWeight: 900, color: BLACK, margin: "0 0 10px" }}>Sign In to Book</h2>
          <p style={{ color: "#6b7280", marginBottom: 24 }}>You need to be logged in to book a session with {pro.name}.</p>
          <button
            onClick={() => navigate("/login")}
            style={{ background: BLACK, color: "#fff", border: "none", borderRadius: 8, padding: "12px 28px", fontWeight: 800, fontSize: 14, cursor: "pointer", width: "100%" }}
          >
            Sign In
          </button>
          <button onClick={onClose} style={{ marginTop: 12, background: "none", border: "none", color: "#9ca3af", fontSize: 13, cursor: "pointer" }}>Cancel</button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
        <div style={{ background: "#fff", borderRadius: 16, padding: 40, maxWidth: 420, width: "100%", textAlign: "center" }} onClick={e => e.stopPropagation()}>
          <CheckCircle size={48} color="#16a34a" style={{ margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: 22, fontWeight: 900, color: BLACK, margin: "0 0 10px" }}>Booking Requested!</h2>
          <p style={{ color: "#6b7280", marginBottom: 24 }}>Your session with <strong>{pro.name}</strong> has been submitted. You'll receive a confirmation shortly.</p>
          <button
            onClick={() => navigate("/dashboard/bookings")}
            style={{ background: BLACK, color: "#fff", border: "none", borderRadius: 8, padding: "12px 28px", fontWeight: 800, fontSize: 14, cursor: "pointer", width: "100%", marginBottom: 10 }}
          >
            View My Bookings
          </button>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#9ca3af", fontSize: 13, cursor: "pointer" }}>Close</button>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!scheduledAt) { setError("Please select a date and time."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          professionalId: pro.id,
          serviceType,
          scheduledAt: new Date(scheduledAt).toISOString(),
          duration,
          paymentMethod: "card",
          walletAmount: 0,
          amount: pro.hourlyRate * (duration / 60),
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Booking failed. Please try again."); return; }
      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const minDateTime = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16);
  const estimatedCost = (pro.hourlyRate * (duration / 60)).toFixed(2);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, overflowY: "auto" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 0, maxWidth: 500, width: "100%", overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.3)" }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ background: BLACK, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ color: GOLD, fontSize: 10, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", margin: "0 0 4px" }}>Book A Session</p>
            <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 900, margin: 0 }}>{pro.name}</h2>
            <p style={{ color: "#a0a0a0", fontSize: 12, margin: "2px 0 0" }}>{pro.specialty}</p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={16} color="#fff" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Service Type */}
          {pro.services?.length > 0 && (
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Service Type</label>
              <select
                value={serviceType}
                onChange={e => setServiceType(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 14, color: BLACK, background: "#fff", outline: "none" }}
              >
                {pro.services.map((s: string) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          {/* Date & Time */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Preferred Date & Time</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              min={minDateTime}
              onChange={e => setScheduledAt(e.target.value)}
              required
              style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 14, color: BLACK, background: "#fff", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {/* Duration */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Session Duration</label>
            <div style={{ display: "flex", gap: 10 }}>
              {[60, 90].map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  style={{
                    flex: 1, padding: "10px 0", border: `1.5px solid ${duration === d ? GOLD : "#e5e7eb"}`,
                    borderRadius: 8, background: duration === d ? "rgba(201,168,76,0.08)" : "#fff",
                    color: duration === d ? "#92700a" : "#6b7280",
                    fontWeight: duration === d ? 800 : 600, fontSize: 13, cursor: "pointer",
                  }}
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Notes <span style={{ fontWeight: 400, color: "#9ca3af" }}>(optional)</span></label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Describe your goals or any special requests..."
              style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 13, color: BLACK, resize: "vertical", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {/* Cost summary */}
          <div style={{ background: "#f9f9f9", border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>Estimated Cost</span>
            <span style={{ fontSize: 18, fontWeight: 900, color: BLACK }}>${estimatedCost}</span>
          </div>

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#dc2626" }}>{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{ background: BLACK, color: "#fff", border: "none", borderRadius: 8, padding: "13px 0", fontWeight: 800, fontSize: 15, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            {submitting ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Submitting...</> : <><Calendar size={16} /> Confirm Booking</>}
          </button>
        </form>
      </div>
    </div>
  );
}

function ProCard({ pro, onBook }: { pro: any; onBook: (pro: any) => void }) {
  const isSports = pro.category === "nfgn-sports" || pro.specialty === "NFGN SPORTS Professionals";
  const displayCategory = pro.category ? getCategoryLabel(pro.category) : pro.specialty;

  return (
    <div
      style={{
        background: isSports ? "linear-gradient(135deg, #0d0d0d, #141414)" : "#fff",
        border: `1.5px solid ${isSports ? "rgba(201,168,76,0.35)" : "#e5e7eb"}`,
        borderRadius: 14,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: isSports ? "0 4px 20px rgba(201,168,76,0.12)" : "0 2px 8px rgba(0,0,0,0.06)",
        transition: "all 0.2s ease",
      }}
    >
      {isSports && (
        <div style={{ background: `linear-gradient(90deg, ${GOLD}, rgba(201,168,76,0.7))`, padding: "5px 14px", display: "flex", alignItems: "center", gap: 6 }}>
          <Trophy size={11} color="#000" />
          <span style={{ fontSize: 10, fontWeight: 900, color: "#000", letterSpacing: "0.14em", textTransform: "uppercase" }}>
            NFGN SPORTS PROFESSIONAL
          </span>
        </div>
      )}

      <div style={{ padding: "20px 20px 0" }}>
        <div style={{ display: "flex", gap: 14, marginBottom: 12 }}>
          {pro.avatar ? (
            <img
              src={pro.avatar}
              alt={pro.name}
              style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `2px solid ${isSports ? GOLD : "#e5e7eb"}` }}
            />
          ) : (
            <div style={{
              width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
              background: isSports ? `linear-gradient(135deg, ${GOLD}, rgba(201,168,76,0.6))` : "linear-gradient(135deg, #f3f4f6, #e5e7eb)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, fontWeight: 800, color: isSports ? "#000" : "#6b7280",
              border: `2px solid ${isSports ? GOLD : "#e5e7eb"}`,
            }}>
              {pro.name.charAt(0)}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: isSports ? "#fff" : "#1a1a1a", margin: "0 0 4px", lineHeight: 1.2 }}>
              {pro.name}
            </h3>
            <span style={{
              display: "inline-block",
              fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
              color: isSports ? GOLD : "#6b7280",
              background: isSports ? "rgba(201,168,76,0.12)" : "#f3f4f6",
              border: `1px solid ${isSports ? "rgba(201,168,76,0.3)" : "#e5e7eb"}`,
              padding: "2px 8px", borderRadius: 99,
            }}>
              {pro.subcategory ?? displayCategory}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
              {[1, 2, 3, 4, 5].map(n => (
                <Star key={n} size={11} style={{ fill: n <= Math.round(pro.rating) ? "#facc15" : "none", color: n <= Math.round(pro.rating) ? "#facc15" : "#d1d5db" }} />
              ))}
              <span style={{ fontSize: 11, color: isSports ? "#a0a0a0" : "#9ca3af", marginLeft: 2 }}>
                {pro.rating} ({pro.reviewCount})
              </span>
            </div>
          </div>
        </div>

        {pro.bio && (
          <p style={{ fontSize: 13, color: isSports ? "#9ca3af" : "#6b7280", lineHeight: 1.6, margin: "0 0 12px", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {pro.bio}
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: isSports ? "#a0a0a0" : "#6b7280" }}>
            <DollarSign size={14} color={GOLD} />
            <span style={{ fontWeight: 700, color: isSports ? GOLD : "#1a1a1a" }}>${pro.hourlyRate}/hr</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: isSports ? "#a0a0a0" : "#6b7280" }}>
            <Clock size={14} color={isSports ? GOLD : "#9ca3af"} />
            <span>60–90 min sessions</span>
          </div>
        </div>

        {pro.services?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
            {pro.services.slice(0, 4).map((s: string) => (
              <span key={s} style={{
                fontSize: 10, fontWeight: 700,
                background: isSports ? "rgba(201,168,76,0.10)" : "#f3f4f6",
                color: isSports ? GOLD : "#374151",
                border: `1px solid ${isSports ? "rgba(201,168,76,0.25)" : "#e5e7eb"}`,
                padding: "3px 8px", borderRadius: 99,
              }}>
                {s}
              </span>
            ))}
            {pro.services.length > 4 && (
              <span style={{ fontSize: 10, color: isSports ? "#a0a0a0" : "#9ca3af", padding: "3px 4px" }}>
                +{pro.services.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      <div style={{ padding: "0 20px 20px", marginTop: "auto" }}>
        {pro.isAvailable ? (
          <button
            onClick={() => onBook(pro)}
            style={{
              width: "100%", padding: "11px 0",
              background: isSports ? GOLD : BLACK,
              color: isSports ? "#000" : "#fff",
              border: "none", borderRadius: 8,
              fontWeight: 800, fontSize: 14, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              transition: "opacity 0.15s",
            }}
          >
            <Calendar size={15} /> Book Session
          </button>
        ) : (
          <button disabled style={{
            width: "100%", padding: "11px 0",
            background: isSports ? "rgba(201,168,76,0.08)" : "#f3f4f6",
            color: isSports ? "rgba(201,168,76,0.4)" : "#9ca3af",
            border: `1px solid ${isSports ? "rgba(201,168,76,0.15)" : "#e5e7eb"}`,
            borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "not-allowed",
          }}>
            Currently Unavailable
          </button>
        )}
      </div>
    </div>
  );
}

export function BookAPro() {
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_OPTION);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bookingPro, setBookingPro] = useState<any>(null);
  const [allPros, setAllPros] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const params = new URLSearchParams({ status: "approved" });
    if (selectedCategory !== ALL_OPTION) params.set("cat", selectedCategory);
    customFetch(`/api/professionals?${params}`)
      .then(r => r.ok ? r.json() : [])
      .then((data: any[]) => { setAllPros(data); setIsLoading(false); })
      .catch(() => { setAllPros([]); setIsLoading(false); });
  }, [selectedCategory]);

  const catInfo = getCategoryInfo(selectedCategory);
  const isNfgnSports = selectedCategory === "nfgn-sports";
  const sportsPros = allPros.filter(p => p.category === "nfgn-sports" || p.specialty === "NFGN SPORTS Professionals");
  const otherPros = allPros.filter(p => p.category !== "nfgn-sports" && p.specialty !== "NFGN SPORTS Professionals");

  const showSportsBanner = selectedCategory === ALL_OPTION || isNfgnSports;
  const showSportsSection = showSportsBanner && sportsPros.length > 0;

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", minHeight: "100vh", background: "#fff" }}>
      {bookingPro && <BookingModal pro={bookingPro} onClose={() => setBookingPro(null)} />}

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div style={{ background: BLACK, borderBottom: "2px solid #1a1a1a" }}>
        <div style={{
          backgroundImage: `linear-gradient(rgba(201,168,76,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.05) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 24px 72px", textAlign: "center" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 20, background: "rgba(201,168,76,0.10)", border: "1px solid rgba(201,168,76,0.25)", padding: "7px 18px", borderRadius: 99 }}>
              <Users size={13} color={GOLD} />
              <span style={{ color: GOLD, fontSize: 12, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase" }}>Book A Professional</span>
            </div>
            <h1 style={{ color: "#fff", fontSize: "clamp(34px, 6vw, 58px)", fontWeight: 900, lineHeight: 1.1, margin: "0 0 16px", fontFamily: "'Playfair Display',serif" }}>
              Connect With <span style={{ color: GOLD }}>NFGN Experts</span>
            </h1>
            <p style={{ color: "#a0a0a0", fontSize: 18, maxWidth: 520, margin: "0 auto 32px" }}>
              Schedule sessions with certified naturopaths, coaches, sports professionals, ministers, and more.
            </p>

            {/* ── Category Filter Dropdown ─── */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setDropdownOpen(o => !o)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 10,
                    background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(201,168,76,0.4)",
                    color: "#fff", padding: "12px 20px", borderRadius: 10,
                    fontWeight: 700, fontSize: 14, cursor: "pointer",
                    minWidth: 280, justifyContent: "space-between",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Filter size={15} color={GOLD} />
                    {selectedCategory === ALL_OPTION ? "Filter by Category" : getCategoryLabel(selectedCategory)}
                  </span>
                  <ChevronDown size={15} color={GOLD} style={{ transform: dropdownOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                </button>

                {dropdownOpen && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)",
                    width: 320,
                    background: "#1a1a1a", border: "1px solid rgba(201,168,76,0.25)",
                    borderRadius: 10, boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
                    zIndex: 50, overflow: "hidden", maxHeight: 380, overflowY: "auto",
                  }}>
                    <button
                      onClick={() => { setSelectedCategory(ALL_OPTION); setDropdownOpen(false); }}
                      style={{
                        width: "100%", textAlign: "left", padding: "11px 16px",
                        background: selectedCategory === ALL_OPTION ? "rgba(201,168,76,0.15)" : "transparent",
                        color: selectedCategory === ALL_OPTION ? GOLD : "#d1d5db",
                        fontWeight: selectedCategory === ALL_OPTION ? 800 : 500,
                        fontSize: 13, cursor: "pointer", border: "none",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      All Categories
                    </button>
                    {BAP_MAIN_CATEGORIES.map((cat, idx) => {
                      const isSelected = selectedCategory === cat.key;
                      const isSports = cat.key === "nfgn-sports";
                      return (
                        <button
                          key={cat.key}
                          onClick={() => { setSelectedCategory(cat.key); setDropdownOpen(false); }}
                          style={{
                            width: "100%", textAlign: "left",
                            padding: "11px 16px",
                            display: "flex", alignItems: "center", gap: 9,
                            background: isSelected ? "rgba(201,168,76,0.15)" : isSports ? "rgba(201,168,76,0.06)" : "transparent",
                            color: isSelected ? GOLD : isSports ? GOLD : "#d1d5db",
                            fontWeight: isSelected || isSports ? 800 : 500,
                            fontSize: 13, cursor: "pointer", border: "none",
                            borderBottom: idx < BAP_MAIN_CATEGORIES.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                          }}
                        >
                          {isSports && <Trophy size={13} color={GOLD} />}
                          {cat.label}
                          {isSports && (
                            <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 900, background: GOLD, color: "#000", padding: "2px 6px", borderRadius: 99, letterSpacing: "0.1em" }}>
                              SPORTS
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── NFGN SPORTS Professionals Banner (when viewing All or Sports) ── */}
      {showSportsBanner && (
        <div style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #111 50%, #0d0d0d 100%)", padding: "48px 24px", borderBottom: `3px solid ${GOLD}`, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(201,168,76,0.03) 39px, rgba(201,168,76,0.03) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(201,168,76,0.03) 39px, rgba(201,168,76,0.03) 40px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: -60, right: "6%", width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.10), transparent 70%)", pointerEvents: "none" }} />

          <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 12, background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.35)", padding: "5px 14px", borderRadius: 99 }}>
                  <Trophy size={12} color={GOLD} />
                  <span style={{ color: GOLD, fontSize: 10, fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase" }}>NFGN SPORTS PROFESSIONALS</span>
                </div>
                <h2 style={{ color: "#fff", fontSize: "clamp(22px, 4vw, 34px)", fontWeight: 900, margin: "0 0 10px", fontFamily: "serif", lineHeight: 1.1 }}>
                  Elite Sports Pros. <span style={{ color: GOLD }}>Ready to Train.</span>
                </h2>
                <p style={{ color: "#a0a0a0", fontSize: 15, maxWidth: 480, margin: "0 0 20px" }}>
                  Coaches, trainers, speakers, and medical sports professionals — all powered by the NFGN Sports network.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {SPORTS_SUBCATEGORIES.map(label => (
                    <span key={label} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.22)", color: GOLD, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 99 }}>
                      {label}
                    </span>
                  ))}
                </div>
              </div>
              {selectedCategory !== "nfgn-sports" && (
                <button
                  onClick={() => setSelectedCategory("nfgn-sports")}
                  style={{ background: GOLD, color: "#000", border: "none", borderRadius: 8, padding: "12px 22px", fontWeight: 800, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", flexShrink: 0 }}
                >
                  <Trophy size={14} /> View Sports Pros
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Professional Listings ──────────────────────────── */}
      <div style={{ background: "#f9f9f9", padding: "60px 24px 80px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>

          {/* Category description banner */}
          {catInfo && (
            <div style={{ background: "linear-gradient(135deg, #0a0a0a, #111)", borderRadius: 12, padding: "20px 24px", marginBottom: 28, border: "1px solid rgba(201,168,76,0.2)" }}>
              <p style={{ color: GOLD, fontSize: 10, fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 6px" }}>{catInfo.label}</p>
              <p style={{ color: "#d1d5db", fontSize: 14, margin: "0 0 4px", lineHeight: 1.5 }}>{catInfo.description}</p>
              <p style={{ color: "#9ca3af", fontSize: 12, margin: 0 }}>For: {catInfo.forWhom}</p>
            </div>
          )}

          {/* Section heading */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
            <div>
              <p style={{ color: GOLD, fontSize: 11, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 4px" }}>
                {selectedCategory === ALL_OPTION ? "All Professionals" : getCategoryLabel(selectedCategory)}
              </p>
              <h2 style={{ color: "#1a1a1a", fontSize: 26, fontWeight: 900, margin: 0, fontFamily: "serif" }}>
                {selectedCategory === ALL_OPTION ? "Find Your Professional" : getCategoryLabel(selectedCategory)}
              </h2>
            </div>
            {!isLoading && allPros.length > 0 && (
              <span style={{ background: "rgba(201,168,76,0.10)", border: "1px solid rgba(201,168,76,0.25)", color: GOLD, fontSize: 12, fontWeight: 700, padding: "5px 14px", borderRadius: 99 }}>
                {allPros.length} {allPros.length === 1 ? "professional" : "professionals"}
              </span>
            )}
          </div>

          {isLoading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 14, padding: 20, height: 280, opacity: 0.5, animation: "pulse 1.5s ease-in-out infinite" }} />
              ))}
            </div>
          ) : allPros.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.15, color: GOLD }}>✦</div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", marginBottom: 8 }}>No professionals found</h3>
              <p style={{ color: "#6b7280" }}>
                {selectedCategory !== ALL_OPTION ? `No professionals registered under "${selectedCategory}" yet.` : "Check back soon — professionals are being onboarded."}
              </p>
              {selectedCategory !== ALL_OPTION && (
                <button
                  onClick={() => setSelectedCategory(ALL_OPTION)}
                  style={{ marginTop: 16, background: GOLD, color: "#000", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 800, fontSize: 13, cursor: "pointer" }}
                >
                  View All Professionals
                </button>
              )}
            </div>
          ) : (
            <>
              {/* SPORTS PROS first when viewing "All" */}
              {showSportsSection && (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(201,168,76,0.10)", border: "1px solid rgba(201,168,76,0.25)", padding: "4px 12px", borderRadius: 99 }}>
                      <Trophy size={11} color={GOLD} />
                      <span style={{ color: GOLD, fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>NFGN SPORTS Professionals</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" style={{ marginBottom: 48 }}>
                    {sportsPros.map(pro => <ProCard key={pro.id} pro={pro} onBook={setBookingPro} />)}
                  </div>
                  {otherPros.length > 0 && (
                    <div style={{ marginBottom: 20, paddingTop: 8, borderTop: "2px solid #e5e7eb" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#f3f4f6", border: "1px solid #e5e7eb", padding: "4px 12px", borderRadius: 99, marginTop: 20 }}>
                        <Users size={11} color="#6b7280" />
                        <span style={{ color: "#6b7280", fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>All Other Professionals</span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Regular pros (or all if filtered to a non-sports category) */}
              {(showSportsSection ? otherPros : allPros).length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {(showSportsSection ? otherPros : allPros).map(pro => <ProCard key={pro.id} pro={pro} onBook={setBookingPro} />)}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
