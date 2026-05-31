import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Plus, Pencil, Trash2, CalendarDays, Zap, Clock,
  CheckCircle2, XCircle, AlertCircle, RefreshCw, DollarSign,
} from "lucide-react";

const GOLD = "#C9A84C";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Service { id: number; name: string; description: string | null; price: number; cv: number; isActive: boolean; sortOrder: number; }
interface Slot { id: number; availableDate: string; startTime: string; endTime: string; maxChairs: number; notes: string | null; isBlocked: boolean; }
interface Booking { id: number; customerId: number; bookingDate: string; startTime: string; numHours: number; serviceName: string; providerName: string; totalPrice: number; cvGenerated: number; status: string; paymentStatus: string; notes: string | null; adminNote: string | null; createdAt: string; }

function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("nfgn_token")}` };
}
function fmt(d: string) { return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
function fmtTime(t: string) { const [h, m] = t.split(":").map(Number); return `${h % 12 || 12}:${m.toString().padStart(2,"0")} ${h < 12 ? "AM" : "PM"}`; }

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

// ── Main Component ─────────────────────────────────────────────────────────────
export function PaygProviderPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<"services" | "availability" | "bookings">("services");

  // Services
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [svcDialog, setSvcDialog] = useState<null | Partial<Service>>(null);
  const [savingSvc, setSavingSvc] = useState(false);

  // Availability
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [slotDialog, setSlotDialog] = useState<boolean>(false);
  const [slotForm, setSlotForm] = useState({ availableDate: "", startTime: "09:00", endTime: "17:00", maxChairs: "1", notes: "", isBlocked: false });
  const [savingSlot, setSavingSlot] = useState(false);

  // Bookings
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [bkFilter, setBkFilter] = useState<string>("all");

  // ── Fetch ────────────────────────────────────────────────────────────────────
  function loadServices() {
    setLoadingServices(true);
    fetch("/api/payg/provider/services", { headers: authHeaders() })
      .then(r => r.json()).then(d => setServices(d.services ?? []))
      .catch(() => {}).finally(() => setLoadingServices(false));
  }
  function loadSlots() {
    setLoadingSlots(true);
    fetch("/api/payg/provider/availability", { headers: authHeaders() })
      .then(r => r.json()).then(d => setSlots(d.slots ?? []))
      .catch(() => {}).finally(() => setLoadingSlots(false));
  }
  function loadBookings() {
    setLoadingBookings(true);
    fetch("/api/payg/provider/bookings", { headers: authHeaders() })
      .then(r => r.json()).then(d => setBookings(d.bookings ?? []))
      .catch(() => {}).finally(() => setLoadingBookings(false));
  }
  useEffect(() => { loadServices(); loadSlots(); loadBookings(); }, []);

  // ── Service CRUD ─────────────────────────────────────────────────────────────
  async function saveService() {
    if (!svcDialog) return;
    const { id, name, description, price, isActive } = svcDialog;
    if (!name || price == null) { toast({ title: "Name and price required", variant: "destructive" }); return; }
    setSavingSvc(true);
    try {
      const res = await fetch(id ? `/api/payg/provider/services/${id}` : "/api/payg/provider/services", {
        method: id ? "PATCH" : "POST",
        headers: authHeaders(),
        body: JSON.stringify({ name, description, price: parseFloat(String(price)), isActive: isActive ?? true }),
      });
      const data = await res.json();
      if (!res.ok) { toast({ title: data.error ?? "Failed", variant: "destructive" }); return; }
      toast({ title: id ? "Service updated" : "Service added" });
      setSvcDialog(null);
      loadServices();
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setSavingSvc(false); }
  }

  async function deleteService(id: number) {
    if (!confirm("Delete this service?")) return;
    await fetch(`/api/payg/provider/services/${id}`, { method: "DELETE", headers: authHeaders() });
    loadServices();
    toast({ title: "Service deleted" });
  }

  // ── Availability CRUD ────────────────────────────────────────────────────────
  async function addSlot() {
    if (!slotForm.availableDate || !slotForm.startTime || !slotForm.endTime) {
      toast({ title: "Date and times required", variant: "destructive" }); return;
    }
    setSavingSlot(true);
    try {
      const res = await fetch("/api/payg/provider/availability", {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ ...slotForm, maxChairs: parseInt(slotForm.maxChairs) || 1 }),
      });
      const data = await res.json();
      if (!res.ok) { toast({ title: data.error ?? "Failed", variant: "destructive" }); return; }
      toast({ title: "Availability added" });
      setSlotDialog(false);
      setSlotForm({ availableDate: "", startTime: "09:00", endTime: "17:00", maxChairs: "1", notes: "", isBlocked: false });
      loadSlots();
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setSavingSlot(false); }
  }

  async function removeSlot(id: number) {
    if (!confirm("Remove this availability slot?")) return;
    await fetch(`/api/payg/provider/availability/${id}`, { method: "DELETE", headers: authHeaders() });
    loadSlots();
    toast({ title: "Slot removed" });
  }

  async function toggleBlock(slot: Slot) {
    await fetch(`/api/payg/provider/availability/${slot.id}`, {
      method: "PATCH", headers: authHeaders(),
      body: JSON.stringify({ isBlocked: !slot.isBlocked }),
    });
    loadSlots();
  }

  // ── Booking status update ───────────────────────────────────────────────────
  async function updateBookingStatus(id: number, status: string) {
    const res = await fetch(`/api/payg/provider/bookings/${id}`, {
      method: "PATCH", headers: authHeaders(),
      body: JSON.stringify({ status }),
    });
    if (res.ok) { toast({ title: `Booking marked as ${status}` }); loadBookings(); }
  }

  const filteredBookings = bkFilter === "all" ? bookings : bookings.filter(b => b.status === bkFilter);
  const pendingCount = bookings.filter(b => b.status === "pending").length;

  return (
    <div style={{ padding: "32px 24px", maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <Zap size={22} style={{ color: GOLD }} />
          <h1 style={{ fontFamily: "'Georgia',serif", fontSize: 26, fontWeight: 900, margin: 0 }}>Pay As You Go Back-Office</h1>
        </div>
        <p style={{ color: "#666", fontSize: 14, margin: 0 }}>Manage your services, availability, and incoming bookings.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, background: "#f4f4f4", borderRadius: 10, padding: 4, marginBottom: 28, width: "fit-content" }}>
        {(["services", "availability", "bookings"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: "8px 18px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", background: tab === t ? "#fff" : "transparent", color: tab === t ? "#0a0a0a" : "#666", boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.1)" : "none", transition: "all 0.15s", position: "relative" }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {t === "bookings" && pendingCount > 0 && (
              <span style={{ position: "absolute", top: 4, right: 4, background: GOLD, color: "#000", borderRadius: 99, width: 16, height: 16, fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── SERVICES TAB ─────────────────────────────────────────────────────── */}
      {tab === "services" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontWeight: 800, fontSize: 17, margin: 0 }}>My Services</h2>
              <p style={{ color: "#888", fontSize: 13, margin: "2px 0 0" }}>Up to 4 services. CV = Price × 0.10 (auto-calculated).</p>
            </div>
            {services.length < 4 && (
              <Button onClick={() => setSvcDialog({})} style={{ background: GOLD, color: "#000", fontWeight: 700 }}>
                <Plus size={14} className="mr-1" /> Add Service
              </Button>
            )}
          </div>

          {loadingServices ? <div style={{ padding: 40, textAlign: "center" }}><Loader2 className="animate-spin" style={{ color: GOLD }} /></div> : (
            services.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", background: "#fafafa", borderRadius: 12, border: "1px dashed #ddd" }}>
                <DollarSign size={32} style={{ color: "#ddd", margin: "0 auto 12px" }} />
                <p style={{ color: "#888", fontSize: 14 }}>No services yet. Add up to 4 services to start accepting bookings.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {services.map((svc, i) => (
                  <div key={svc.id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e5e5", padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `${GOLD}15`, color: GOLD, fontWeight: 900, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>{svc.name}</span>
                        {!svc.isActive && <Badge variant="secondary" style={{ fontSize: 10 }}>Inactive</Badge>}
                      </div>
                      {svc.description && <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{svc.description}</div>}
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 16, color: GOLD }}>${svc.price.toFixed(2)}<span style={{ fontSize: 11, color: "#888", fontWeight: 500 }}>/hr</span></div>
                      <div style={{ fontSize: 11, color: "#888" }}>{svc.cv.toFixed(2)} CV/hr</div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <Button size="sm" variant="outline" onClick={() => setSvcDialog({ ...svc })}><Pencil size={13} /></Button>
                      <Button size="sm" variant="outline" onClick={() => deleteService(svc.id)} style={{ color: "#ef4444", borderColor: "#ef444440" }}><Trash2 size={13} /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {services.length === 4 && (
            <div style={{ marginTop: 12, padding: "10px 14px", background: "#fffbf0", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 8, fontSize: 13, color: "#92400E" }}>
              <AlertCircle size={13} style={{ display: "inline", marginRight: 6 }} />
              Maximum of 4 services reached. Delete one to add another.
            </div>
          )}
        </div>
      )}

      {/* ── AVAILABILITY TAB ─────────────────────────────────────────────────── */}
      {tab === "availability" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontWeight: 800, fontSize: 17, margin: 0 }}>My Availability</h2>
              <p style={{ color: "#888", fontSize: 13, margin: "2px 0 0" }}>Set the dates and time windows when customers can book you.</p>
            </div>
            <Button onClick={() => setSlotDialog(true)} style={{ background: GOLD, color: "#000", fontWeight: 700 }}>
              <Plus size={14} className="mr-1" /> Add Date
            </Button>
          </div>

          {loadingSlots ? <div style={{ padding: 40, textAlign: "center" }}><Loader2 className="animate-spin" style={{ color: GOLD }} /></div> : (
            slots.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", background: "#fafafa", borderRadius: 12, border: "1px dashed #ddd" }}>
                <CalendarDays size={32} style={{ color: "#ddd", margin: "0 auto 12px" }} />
                <p style={{ color: "#888", fontSize: 14 }}>No availability set. Add dates to start accepting bookings.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {slots.map(slot => (
                  <div key={slot.id} style={{ background: slot.isBlocked ? "#fef2f2" : "#fff", borderRadius: 12, border: `1px solid ${slot.isBlocked ? "#fecaca" : "#e5e5e5"}`, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
                    <CalendarDays size={16} style={{ color: slot.isBlocked ? "#ef4444" : GOLD, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{fmt(slot.availableDate)}</div>
                      <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                        <Clock size={11} style={{ display: "inline", marginRight: 4 }} />
                        {fmtTime(slot.startTime)} – {fmtTime(slot.endTime)}
                        {slot.maxChairs > 1 && ` · ${slot.maxChairs} chairs`}
                        {slot.notes && ` · ${slot.notes}`}
                      </div>
                    </div>
                    {slot.isBlocked && <span style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", background: "#fee2e2", padding: "2px 8px", borderRadius: 6 }}>BLOCKED</span>}
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <Button size="sm" variant="outline" onClick={() => toggleBlock(slot)}
                        style={{ fontSize: 11, color: slot.isBlocked ? "#10b981" : "#ef4444" }}
                      >
                        {slot.isBlocked ? "Unblock" : "Block"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => removeSlot(slot.id)} style={{ color: "#ef4444", borderColor: "#ef444440" }}><Trash2 size={13} /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {/* ── BOOKINGS TAB ─────────────────────────────────────────────────────── */}
      {tab === "bookings" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <div>
              <h2 style={{ fontWeight: 800, fontSize: 17, margin: 0 }}>Received Bookings</h2>
              <p style={{ color: "#888", fontSize: 13, margin: "2px 0 0" }}>Customers who have booked your services.</p>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {["all", "pending", "approved", "completed", "cancelled"].map(f => (
                <button key={f} onClick={() => setBkFilter(f)}
                  style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid #e5e5e5", background: bkFilter === f ? GOLD : "#fff", color: bkFilter === f ? "#000" : "#555", fontWeight: 700, fontSize: 11, cursor: "pointer" }}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {loadingBookings ? <div style={{ padding: 40, textAlign: "center" }}><Loader2 className="animate-spin" style={{ color: GOLD }} /></div> : (
            filteredBookings.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", background: "#fafafa", borderRadius: 12, border: "1px dashed #ddd" }}>
                <RefreshCw size={32} style={{ color: "#ddd", margin: "0 auto 12px" }} />
                <p style={{ color: "#888", fontSize: 14 }}>No {bkFilter !== "all" ? bkFilter : ""} bookings yet.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {filteredBookings.map(bk => (
                  <div key={bk.id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e5e5", padding: "16px 18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 14 }}>PAYG-{String(bk.id).padStart(4, "0")}</span>
                          {statusBadge(bk.status)}
                        </div>
                        <div style={{ fontSize: 13, color: "#555" }}>{bk.serviceName} · {fmt(bk.bookingDate)} at {fmtTime(bk.startTime)}</div>
                        <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{bk.numHours} hrs · <strong>${bk.totalPrice.toFixed(2)}</strong> · {bk.cvGenerated.toFixed(2)} CV</div>
                        {bk.notes && <div style={{ fontSize: 12, color: "#888", marginTop: 4, fontStyle: "italic" }}>"{bk.notes}"</div>}
                      </div>
                      {bk.status === "pending" && (
                        <div style={{ display: "flex", gap: 6 }}>
                          <Button size="sm" onClick={() => updateBookingStatus(bk.id, "approved")}
                            style={{ background: "#10b981", color: "#fff", fontWeight: 700, fontSize: 12 }}>
                            <CheckCircle2 size={13} className="mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => updateBookingStatus(bk.id, "cancelled")}
                            style={{ color: "#ef4444", borderColor: "#ef444440", fontSize: 12 }}>
                            <XCircle size={13} className="mr-1" /> Decline
                          </Button>
                        </div>
                      )}
                      {bk.status === "approved" && (
                        <Button size="sm" onClick={() => updateBookingStatus(bk.id, "completed")}
                          style={{ background: "#6366f1", color: "#fff", fontWeight: 700, fontSize: 12 }}>
                          <CheckCircle2 size={13} className="mr-1" /> Mark Completed
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {/* ── Service Dialog ───────────────────────────────────────────────────── */}
      <Dialog open={!!svcDialog} onOpenChange={o => { if (!o) setSvcDialog(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{svcDialog?.id ? "Edit Service" : "Add Service"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Service Name *</Label>
              <Input value={svcDialog?.name ?? ""} onChange={e => setSvcDialog(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Chair Rental, Styling Station…" />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={svcDialog?.description ?? ""} onChange={e => setSvcDialog(p => ({ ...p, description: e.target.value }))} placeholder="Brief description of the service…" />
            </div>
            <div>
              <Label>Price Per Hour ($) *</Label>
              <Input type="number" min={1} step={0.01} value={svcDialog?.price ?? ""} onChange={e => setSvcDialog(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))} placeholder="e.g. 40" />
              {svcDialog?.price != null && svcDialog.price > 0 && (
                <p style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                  CV = ${svcDialog.price.toFixed(2)} × 0.10 = <strong>{(svcDialog.price * 0.10).toFixed(2)} CV</strong> per hour
                </p>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Switch checked={svcDialog?.isActive ?? true} onCheckedChange={v => setSvcDialog(p => ({ ...p, isActive: v }))} id="svc-active" />
              <Label htmlFor="svc-active">Active (visible to customers)</Label>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSvcDialog(null)}>Cancel</Button>
            <Button onClick={saveService} disabled={savingSvc} style={{ background: GOLD, color: "#000", fontWeight: 700 }}>
              {savingSvc ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              {svcDialog?.id ? "Save Changes" : "Add Service"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Availability Dialog ──────────────────────────────────────────────── */}
      <Dialog open={slotDialog} onOpenChange={setSlotDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Available Date</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Date *</Label>
              <Input type="date" value={slotForm.availableDate} onChange={e => setSlotForm(p => ({ ...p, availableDate: e.target.value }))} min={new Date().toISOString().split("T")[0]} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <Label>Open Time *</Label>
                <Input type="time" value={slotForm.startTime} onChange={e => setSlotForm(p => ({ ...p, startTime: e.target.value }))} />
              </div>
              <div>
                <Label>Close Time *</Label>
                <Input type="time" value={slotForm.endTime} onChange={e => setSlotForm(p => ({ ...p, endTime: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Max Chairs / Booths Available</Label>
              <Input type="number" min={1} max={20} value={slotForm.maxChairs} onChange={e => setSlotForm(p => ({ ...p, maxChairs: e.target.value }))} />
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Input value={slotForm.notes} onChange={e => setSlotForm(p => ({ ...p, notes: e.target.value }))} placeholder="e.g. Limited chairs available, bring own equipment…" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSlotDialog(false)}>Cancel</Button>
            <Button onClick={addSlot} disabled={savingSlot} style={{ background: GOLD, color: "#000", fontWeight: 700 }}>
              {savingSlot ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              Add Availability
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
