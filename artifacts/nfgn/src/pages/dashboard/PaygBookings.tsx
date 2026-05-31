import { useState, useEffect } from "react";
import { Loader2, Zap, Clock, CalendarDays, DollarSign } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const GOLD = "#C9A84C";

interface Booking {
  id: number;
  serviceName: string;
  providerName: string;
  bookingDate: string;
  startTime: string;
  numHours: number;
  totalPrice: number;
  cvGenerated: number;
  status: string;
  paymentStatus: string;
  notes: string | null;
  createdAt: string;
}

function fmt(d: string) { return new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }); }
function fmtTime(t: string) { const [h, m] = t.split(":").map(Number); return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`; }

function statusBadge(s: string) {
  const map: Record<string, { label: string; color: string }> = {
    pending:   { label: "Pending",   color: "#F59E0B" },
    approved:  { label: "Approved",  color: "#10B981" },
    completed: { label: "Completed", color: "#6366F1" },
    cancelled: { label: "Cancelled", color: "#EF4444" },
  };
  const { label, color } = map[s] ?? { label: s, color: "#888" };
  return <span style={{ background: `${color}20`, color, border: `1px solid ${color}40`, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{label}</span>;
}

function paymentBadge(s: string) {
  return s === "paid"
    ? <span style={{ background: "#d1fae5", color: "#065f46", border: "1px solid #a7f3d0", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>Paid</span>
    : <span style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>Unpaid</span>;
}

export function PaygBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/payg/my-bookings", {
      headers: { Authorization: `Bearer ${localStorage.getItem("nfgn_token")}` },
    })
      .then(r => r.json())
      .then(d => setBookings(d.bookings ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? bookings : bookings.filter(b => b.status === filter);

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === "pending").length,
    approved: bookings.filter(b => b.status === "approved").length,
    completed: bookings.filter(b => b.status === "completed").length,
    spent: bookings.filter(b => b.paymentStatus === "paid").reduce((s, b) => s + b.totalPrice, 0),
    cv: bookings.reduce((s, b) => s + b.cvGenerated, 0),
  };

  return (
    <div style={{ padding: "32px 24px", maxWidth: 860, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 28 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <Zap size={22} style={{ color: GOLD }} />
            <h1 style={{ fontFamily: "'Georgia',serif", fontSize: 26, fontWeight: 900, margin: 0 }}>My PAYG Bookings</h1>
          </div>
          <p style={{ color: "#666", fontSize: 14, margin: 0 }}>Your Pay As You Go space rental booking history.</p>
        </div>
        <Link href="/pay-as-you-go">
          <Button style={{ background: GOLD, color: "#000", fontWeight: 700 }}>
            <Zap size={14} className="mr-1" /> Book New Session
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: 28 }}>
        {[
          { label: "Total Bookings", value: stats.total, icon: <CalendarDays size={16} style={{ color: GOLD }} /> },
          { label: "Pending",        value: stats.pending, icon: <Clock size={16} style={{ color: "#F59E0B" }} /> },
          { label: "Approved",       value: stats.approved, icon: <Zap size={16} style={{ color: "#10B981" }} /> },
          { label: "Completed",      value: stats.completed, icon: <Zap size={16} style={{ color: "#6366F1" }} /> },
          { label: "CV Earned",      value: stats.cv.toFixed(1), icon: <DollarSign size={16} style={{ color: GOLD }} /> },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e5e5", padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>{s.icon}<span style={{ fontSize: 12, color: "#888" }}>{s.label}</span></div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
        {["all", "pending", "approved", "completed", "cancelled"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: "5px 14px", borderRadius: 99, border: "1px solid #e5e5e5", background: filter === f ? GOLD : "#fff", color: filter === f ? "#000" : "#555", fontWeight: 700, fontSize: 12, cursor: "pointer" }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Bookings list */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 48 }}><Loader2 className="animate-spin mx-auto" style={{ color: GOLD }} size={28} /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "56px 24px", background: "#fafafa", borderRadius: 16, border: "1px dashed #ddd" }}>
          <Zap size={36} style={{ color: "#ddd", margin: "0 auto 16px" }} />
          <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>No bookings yet</h3>
          <p style={{ color: "#888", fontSize: 14, marginBottom: 20 }}>Browse available providers and book your first Pay As You Go session.</p>
          <Link href="/pay-as-you-go">
            <Button style={{ background: GOLD, color: "#000", fontWeight: 700 }}>Browse Providers</Button>
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(bk => (
            <div key={bk.id} style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e5e5", padding: "18px 20px", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 2 }}>
                    <span style={{ fontWeight: 800, fontSize: 14, color: "#0a0a0a" }}>PAYG-{String(bk.id).padStart(4, "0")}</span>
                    {statusBadge(bk.status)}
                    {paymentBadge(bk.paymentStatus)}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{bk.serviceName}</div>
                  <div style={{ fontSize: 13, color: "#666" }}>Provider: {bk.providerName}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 900, fontSize: 18, color: GOLD }}>${bk.totalPrice.toFixed(2)}</div>
                  <div style={{ fontSize: 12, color: "#888" }}>{bk.cvGenerated.toFixed(2)} CV earned</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", borderTop: "1px solid #f0f0f0", paddingTop: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#555" }}>
                  <CalendarDays size={13} style={{ color: GOLD }} />
                  {fmt(bk.bookingDate)}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#555" }}>
                  <Clock size={13} style={{ color: GOLD }} />
                  {fmtTime(bk.startTime)} · {bk.numHours} hr{bk.numHours !== 1 ? "s" : ""}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#555" }}>
                  <DollarSign size={13} style={{ color: GOLD }} />
                  ${(bk.totalPrice / bk.numHours).toFixed(2)}/hr
                </div>
              </div>

              {bk.notes && (
                <div style={{ marginTop: 8, fontSize: 12, color: "#888", fontStyle: "italic" }}>Notes: "{bk.notes}"</div>
              )}

              {bk.status === "pending" && (
                <div style={{ marginTop: 10, padding: "8px 12px", background: "#fffbf0", borderRadius: 8, border: "1px solid rgba(201,168,76,0.3)", fontSize: 12, color: "#92400E" }}>
                  ⏳ Awaiting provider confirmation. You'll receive an email once approved.
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
