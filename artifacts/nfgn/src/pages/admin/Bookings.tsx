import { useState, useEffect } from "react";
import { customFetch } from "@/lib/custom-fetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Search, RefreshCw, CheckCircle2, XCircle, Clock, User, DollarSign, Filter } from "lucide-react";

interface Booking {
  id: number;
  userId: number;
  userName: string;
  professionalId: number;
  professionalName: string;
  serviceType: string;
  scheduledAt: string;
  duration: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  amount: number;
  notes: string | null;
  createdAt: string;
  serviceRenderedAt: string | null;
  digitalSignature: string | null;
  digitalSignedAt: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-blue-100 text-blue-800 border-blue-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  "no-show": "bg-gray-100 text-gray-700 border-gray-200",
  "payment_declined": "bg-rose-100 text-rose-800 border-rose-200",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  "no-show": "No Show",
  "payment_declined": "Payment Not Received",
};

const STATUS_OPTIONS = ["pending", "confirmed", "completed", "cancelled", "no-show", "payment_declined"];

function BookingDetailModal({ booking, onClose, onUpdated }: { booking: Booking; onClose: () => void; onUpdated: () => void }) {
  const [status, setStatus] = useState(booking.status);
  const [saving, setSaving] = useState(false);
  const [markingRendered, setMarkingRendered] = useState(false);

  const handleUpdate = async () => {
    setSaving(true);
    const res = await customFetch(`/api/bookings/${booking.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setSaving(false);
    if (res.ok) { onUpdated(); onClose(); }
  };

  const handleMarkRendered = async () => {
    setMarkingRendered(true);
    const res = await customFetch(`/api/bookings/${booking.id}/service-rendered`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
    });
    setMarkingRendered(false);
    if (res.ok) { onUpdated(); onClose(); }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Booking Details #{booking.id}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Member</p>
              <p className="font-medium">{booking.userName}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Professional</p>
              <p className="font-medium">{booking.professionalName}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Service</p>
              <p className="font-medium">{booking.serviceType}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Duration</p>
              <p className="font-medium">{booking.duration} minutes</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Date & Time</p>
              <p className="font-medium">
                {new Date(booking.scheduledAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                {" "}at{" "}
                {new Date(booking.scheduledAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Amount</p>
              <p className="font-bold text-primary">${booking.amount.toFixed(2)}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Payment</p>
              {booking.paymentStatus === "declined" || booking.status === "payment_declined" ? (
                <p className="font-medium text-rose-700">
                  <span className="capitalize">{booking.paymentMethod}</span> — <span className="font-semibold">Declined</span>
                </p>
              ) : (
                <p className="font-medium capitalize">{booking.paymentMethod} — <span className="capitalize">{booking.paymentStatus}</span></p>
              )}
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Booked On</p>
              <p className="font-medium">{new Date(booking.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          {booking.notes && (
            <div className="p-3 rounded-lg bg-muted text-sm">
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Notes</p>
              <p>{booking.notes}</p>
            </div>
          )}

          {/* Service rendered + digital signature status */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Service Rendered</p>
              {booking.serviceRenderedAt ? (
                <p className="font-medium text-green-700 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {new Date(booking.serviceRenderedAt).toLocaleDateString()}
                </p>
              ) : (
                <p className="text-muted-foreground italic text-xs">Not yet marked</p>
              )}
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Digital Signature</p>
              {booking.digitalSignature ? (
                <div>
                  <p className="font-medium text-green-700 flex items-center gap-1 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Signed
                  </p>
                  {booking.digitalSignedAt && (
                    <p className="text-xs text-muted-foreground">{new Date(booking.digitalSignedAt).toLocaleDateString()}</p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground italic text-xs">Not yet signed</p>
              )}
            </div>
          </div>

          {!booking.serviceRenderedAt && (
            <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-sm">
              <p className="font-medium text-amber-800 mb-2">Service Not Yet Marked as Rendered</p>
              <p className="text-amber-700 text-xs mb-3">
                Once the professional has delivered the service, click below to notify the member to sign their receipt.
                This will also mark the booking as completed.
              </p>
              <Button
                size="sm"
                onClick={handleMarkRendered}
                disabled={markingRendered}
                className="w-full"
                style={{ background: "#C9A84C", color: "#000" }}
              >
                {markingRendered ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Marking…</> : "Mark Service as Rendered"}
              </Button>
            </div>
          )}

          {booking.digitalSignature && (
            <div className="space-y-1">
              <p className="text-xs font-medium">Member's Signature</p>
              <img src={booking.digitalSignature} alt="Signature" className="border rounded-lg p-2 bg-gray-50 max-h-20 object-contain w-full" />
            </div>
          )}

          <div>
            <p className="text-sm font-medium mb-2">Update Status</p>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(s => (
                  <SelectItem key={s} value={s}>{STATUS_LABELS[s] ?? s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handleUpdate} disabled={saving || status === booking.status}>
            {saving ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Saving…</> : "Update Status"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await customFetch("/api/bookings?limit=50");
    if (res.ok) {
      const data = await res.json();
      setBookings(data.bookings);
      setTotal(data.total);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = bookings.filter(b => {
    const matchStatus = statusFilter === "all" || b.status === statusFilter;
    const matchSearch = !search ||
      b.userName.toLowerCase().includes(search.toLowerCase()) ||
      b.professionalName.toLowerCase().includes(search.toLowerCase()) ||
      b.serviceType.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === "pending").length,
    confirmed: bookings.filter(b => b.status === "confirmed").length,
    completed: bookings.filter(b => b.status === "completed").length,
    revenue: bookings.filter(b => b.status === "completed").reduce((s, b) => s + b.amount, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold">Manage Bookings</h1>
          <p className="text-muted-foreground text-sm mt-1">All Book-A-Professional appointment requests.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Bookings", value: stats.total, icon: Calendar, color: "text-primary" },
          { label: "Pending Review", value: stats.pending, icon: Clock, color: "text-yellow-600" },
          { label: "Confirmed", value: stats.confirmed, icon: CheckCircle2, color: "text-green-600" },
          { label: "Revenue (Completed)", value: `$${stats.revenue.toFixed(2)}`, icon: DollarSign, color: "text-primary" },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="pt-5 pb-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search member, professional, service…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{STATUS_LABELS[s] ?? s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No bookings found{search || statusFilter !== "all" ? " matching your filters" : ""}.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">#</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Member</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Professional</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Service</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Amount</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map(b => (
                    <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{b.id}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                            {b.userName[0]}
                          </div>
                          <span className="font-medium">{b.userName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{b.professionalName}</td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{b.serviceType}</td>
                      <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                        {new Date(b.scheduledAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3 font-bold text-primary">${b.amount.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <Badge className={`text-xs border ${STATUS_COLORS[b.status] ?? "bg-gray-100 text-gray-700"}`} variant="outline">
                          {STATUS_LABELS[b.status] ?? b.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Button size="sm" variant="outline" onClick={() => setSelectedBooking(b)}>View</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t text-xs text-muted-foreground">
              Showing {filtered.length} of {stats.total} bookings
            </div>
          </CardContent>
        </Card>
      )}

      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onUpdated={load}
        />
      )}
    </div>
  );
}
