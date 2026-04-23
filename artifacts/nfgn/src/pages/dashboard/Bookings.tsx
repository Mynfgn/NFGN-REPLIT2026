import { useState } from "react";
import { useListProfessionals, useListBookings, useCreateBooking, useGetWallet, getListBookingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Star, Clock, CreditCard, CheckCircle2, AlertCircle, Search, Wallet, User } from "lucide-react";

const BRAND_GOLD = "#C9A84C";
const BRAND_GREEN = "#2D6A4F";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} className={`h-3.5 w-3.5 ${n <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
      ))}
    </div>
  );
}

function statusColor(status: string) {
  switch (status) {
    case "confirmed": return "bg-green-100 text-green-800 border-green-200";
    case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "completed": return "bg-blue-100 text-blue-800 border-blue-200";
    case "cancelled": return "bg-red-100 text-red-800 border-red-200";
    default: return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

interface BookingModalProps {
  professional: any;
  walletBalance: number;
  onClose: () => void;
  onBooked: () => void;
}

function BookingModal({ professional, walletBalance, onClose, onBooked }: BookingModalProps) {
  const createBooking = useCreateBooking();
  const [service, setService] = useState(professional.services?.[0] ?? "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [duration, setDuration] = useState("60");
  const [paymentMethod, setPaymentMethod] = useState("wallet");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const amount = (parseFloat(duration) / 60) * professional.hourlyRate;
  const canPayWithWallet = walletBalance >= amount;

  const handleSubmit = async () => {
    setError(null);
    if (!date) { setError("Please select a date."); return; }
    if (!service) { setError("Please select a service."); return; }
    if (paymentMethod === "wallet" && !canPayWithWallet) {
      setError(`Insufficient wallet balance. You need $${amount.toFixed(2)} but have $${walletBalance.toFixed(2)}.`);
      return;
    }

    const scheduledAt = new Date(`${date}T${time}:00`).toISOString();

    createBooking.mutate(
      { data: {
        professionalId: professional.id,
        serviceType: service,
        scheduledAt,
        duration: parseInt(duration),
        paymentMethod,
        amount,
        notes: notes || undefined,
      }},
      {
        onSuccess: () => onBooked(),
        onError: (err: any) => setError(err?.message ?? "Failed to book. Please try again."),
      },
    );
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Book a Session
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
          {professional.avatar ? (
            <img src={professional.avatar} alt={professional.name} className="h-12 w-12 rounded-full object-cover border-2 border-primary/30" />
          ) : (
            <div className="h-12 w-12 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ background: `linear-gradient(135deg, ${BRAND_GOLD}, ${BRAND_GREEN})` }}>
              {professional.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
            </div>
          )}
          <div>
            <p className="font-semibold text-sm">{professional.name}</p>
            <p className="text-xs text-muted-foreground">{professional.specialty}</p>
            <p className="text-xs font-medium text-primary">${professional.hourlyRate}/hr</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Service</Label>
            <Select value={service} onValueChange={setService}>
              <SelectTrigger>
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {(professional.services ?? []).map((s: string) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date</Label>
              <Input type="date" min={today} value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Time</Label>
              <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="90">1.5 hours</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wallet">
                  <span className="flex items-center gap-2">
                    <Wallet className="h-3.5 w-3.5" />
                    E-Wallet (Balance: ${walletBalance.toFixed(2)})
                  </span>
                </SelectItem>
                <SelectItem value="card">Credit / Debit Card</SelectItem>
              </SelectContent>
            </Select>
            {paymentMethod === "wallet" && !canPayWithWallet && (
              <p className="text-xs text-red-500 mt-1">Insufficient wallet balance for this session.</p>
            )}
          </div>

          <div>
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="Any specific concerns, health goals, or questions for the consultant…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex justify-between items-center">
            <span className="text-sm font-medium">Session Total</span>
            <span className="text-lg font-bold" style={{ color: BRAND_GOLD }}>${amount.toFixed(2)}</span>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createBooking.isPending}>
            {createBooking.isPending ? "Booking…" : "Confirm Booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function BookingsPage() {
  const queryClient = useQueryClient();
  const { data: prosData, isLoading: prosLoading } = useListProfessionals();
  const { data: bookingsData, isLoading: bookingsLoading } = useListBookings();
  const { data: wallet } = useGetWallet();

  const [search, setSearch] = useState("");
  const [selectedPro, setSelectedPro] = useState<any | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const professionals = prosData ?? [];
  const bookings = bookingsData?.bookings ?? [];
  const walletBalance = parseFloat(String(wallet?.balance ?? "0"));

  const filtered = professionals.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.specialty.toLowerCase().includes(search.toLowerCase())
  );

  const handleBooked = () => {
    setSelectedPro(null);
    setBookingSuccess(true);
    queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
    setTimeout(() => setBookingSuccess(false), 5000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">Book-A-Professional</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Schedule private sessions with NFGN-affiliated naturopaths, wellness coaches, and business consultants.
        </p>
      </div>

      {bookingSuccess && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-green-50 border border-green-200 text-green-800">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <div>
            <strong>Booking Submitted!</strong>
            <p className="text-sm mt-0.5">Your booking request has been received. The professional will confirm shortly.</p>
          </div>
        </div>
      )}

      {/* Professionals Directory */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-xl font-semibold">Our Professionals</h2>
          <div className="relative w-full sm:w-72">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or specialty…"
              className="pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {prosLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No professionals found{search ? ` for "${search}"` : ""}.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(pro => (
              <Card key={pro.id} className="overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex gap-4">
                    {pro.avatar ? (
                      <img src={pro.avatar} alt={pro.name} className="h-16 w-16 rounded-full object-cover flex-shrink-0 border-2 border-primary/30" />
                    ) : (
                      <div className="h-16 w-16 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0 border-2 border-primary/30"
                        style={{ background: `linear-gradient(135deg, ${BRAND_GOLD}, ${BRAND_GREEN})` }}>
                        {pro.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold">{pro.name}</h3>
                          <p className="text-sm text-primary mb-1">{pro.specialty}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={pro.isAvailable ? "text-green-600 border-green-300 text-xs" : "text-muted-foreground text-xs"}
                        >
                          {pro.isAvailable ? "Available" : "Busy"}
                        </Badge>
                      </div>
                      <StarRating rating={pro.rating} />
                      <p className="text-xs text-muted-foreground mt-0.5">{pro.reviewCount} reviews</p>
                    </div>
                  </div>

                  {pro.bio && (
                    <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{pro.bio}</p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(pro.services ?? []).slice(0, 3).map((s: string) => (
                      <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                    ))}
                    {(pro.services ?? []).length > 3 && (
                      <Badge variant="secondary" className="text-xs">+{pro.services.length - 3} more</Badge>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-bold text-sm" style={{ color: BRAND_GOLD }}>${pro.hourlyRate}/hr</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setSelectedPro(pro)}
                      disabled={!pro.isAvailable}
                    >
                      <Calendar className="h-3.5 w-3.5 mr-1.5" />
                      Book Session
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* My Bookings */}
      <div>
        <h2 className="text-xl font-semibold mb-4">My Bookings</h2>
        {bookingsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : bookings.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No bookings yet. Book your first session above!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {bookings.map(booking => (
              <Card key={booking.id}>
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${BRAND_GOLD}, ${BRAND_GREEN})` }}>
                      <User className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm">{booking.professionalName}</p>
                      <p className="text-xs text-muted-foreground">{booking.serviceType}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center sm:justify-end">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(booking.scheduledAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(booking.scheduledAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <span className="font-semibold text-sm" style={{ color: BRAND_GOLD }}>${booking.amount.toFixed(2)}</span>
                    <Badge className={`text-xs border ${statusColor(booking.status)}`} variant="outline">
                      {booking.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selectedPro && (
        <BookingModal
          professional={selectedPro}
          walletBalance={walletBalance}
          onClose={() => setSelectedPro(null)}
          onBooked={handleBooked}
        />
      )}
    </div>
  );
}
