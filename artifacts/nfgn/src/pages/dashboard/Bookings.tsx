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
import { Calendar, Star, Clock, CreditCard, CheckCircle2, AlertCircle, Search, Wallet, User, DollarSign, Smartphone } from "lucide-react";

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

const PAYMENT_OPTIONS = [
  { value: "card",      label: "Credit / Debit Card",  icon: CreditCard },
  { value: "paypal",    label: "PayPal",                icon: DollarSign },
  { value: "cashapp",   label: "Cash App Pay",          icon: Smartphone },
  { value: "cash",      label: "Cash / In-Person",      icon: Wallet },
];

const PAYMENT_INSTRUCTIONS: Record<string, string> = {
  paypal:  "You will receive an invoice to your PayPal email. Complete payment within 24 hours to confirm your booking.",
  cashapp: "Send payment to $NFGNetwork on Cash App. Include your booking reference number in the note.",
  cash:    "Pay in person at your scheduled session. Bring exact change or check made out to NFGN.",
  card:    "A secure checkout link will be generated for you to complete card payment right after booking.",
};

const PAYMENT_SUCCESS_STEPS: Record<string, { title: string; steps: string[] }> = {
  card:    { title: "Pay by Card", steps: ["Click the gold \"Pay Now\" button above.", "Enter your card details on the secure checkout page.", "Your booking will be confirmed once payment clears."] },
  paypal:  { title: "Pay via PayPal", steps: ["Check your PayPal email for an invoice.", "Complete the payment within 24 hours.", "Your booking will be confirmed once payment clears."] },
  cashapp: { title: "Pay via Cash App", steps: ["Open Cash App and send your payment to $NFGNetwork.", "Add your booking reference # in the note.", "Your booking will be confirmed once payment is verified."] },
  cash:    { title: "Pay In Person", steps: ["Bring exact change or a check made out to NFGN.", "Pay at the start of your scheduled session.", "Your booking is reserved — no upfront payment needed."] },
  wallet:  { title: "Paid with E-Wallet", steps: ["Your E-Wallet balance covered the full session cost.", "No additional payment is required.", "Your booking is confirmed!"] },
};

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
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [walletInput, setWalletInput] = useState("");
  const [walletError, setWalletError] = useState<string | null>(null);
  const [bookedResult, setBookedResult] = useState<{ id: number; paymentMethod: string; amount: number; walletApplied: number; service: string; scheduledAt: string; paymentLink?: string | null } | null>(null);

  const amount = (parseFloat(duration) / 60) * professional.hourlyRate;

  const parsedWallet = parseFloat(walletInput) || 0;
  const walletApplied = Math.min(Math.max(0, parsedWallet), walletBalance, amount);
  const remainingDue = Math.max(0, amount - walletApplied);
  const walletCoversAll = walletApplied >= amount;

  const handleWalletInput = (val: string) => {
    setWalletInput(val);
    setWalletError(null);
    const n = parseFloat(val) || 0;
    if (n > walletBalance) {
      setWalletError(`Max available: $${walletBalance.toFixed(2)}`);
    } else if (n > amount) {
      setWalletError(`Cannot exceed session total ($${amount.toFixed(2)})`);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    if (!date) { setError("Please select a date."); return; }
    if (!service) { setError("Please select a service."); return; }
    if (walletError) { setError(walletError); return; }
    if (!walletCoversAll && !paymentMethod) {
      setError("Please select a payment method for the remaining balance."); return;
    }

    const scheduledAt = new Date(`${date}T${time}:00`).toISOString();
    const finalPaymentMethod = walletCoversAll ? "wallet" : (walletApplied > 0 ? `wallet+${paymentMethod}` : paymentMethod);
    const capturedService = service;
    const capturedScheduledAt = scheduledAt;
    const capturedAmount = amount;
    const capturedWallet = walletApplied;
    const capturedPayment = walletCoversAll ? "wallet" : paymentMethod;

    createBooking.mutate(
      { data: {
        professionalId: professional.id,
        serviceType: service,
        scheduledAt,
        duration: parseInt(duration),
        paymentMethod: finalPaymentMethod,
        walletAmount: walletApplied,
        amount,
        notes: notes || undefined,
      }},
      {
        onSuccess: (res: any) => {
          setBookedResult({
            id: res.id,
            paymentMethod: capturedPayment,
            amount: capturedAmount,
            walletApplied: capturedWallet,
            service: capturedService,
            scheduledAt: capturedScheduledAt,
            paymentLink: res.paymentLink ?? null,
          });
          // Don't call onBooked() here — let the confirmation screen show first
        },
        onError: (err: any) => setError(err?.message ?? "Failed to book. Please try again."),
      },
    );
  };

  const today = new Date().toISOString().split("T")[0];

  // ── Success confirmation screen ──────────────────────────────────────────
  if (bookedResult) {
    const successInfo = PAYMENT_SUCCESS_STEPS[bookedResult.paymentMethod] ?? PAYMENT_SUCCESS_STEPS.card;
    const remaining = Math.max(0, bookedResult.amount - bookedResult.walletApplied);
    const isFullyPaid = bookedResult.paymentMethod === "wallet" || remaining === 0;
    const handleDone = () => { onBooked(); onClose(); };
    return (
      <Dialog open onOpenChange={handleDone}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              Booking Confirmed!
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-green-50 border border-green-200 space-y-1">
              <p className="font-semibold text-green-800 text-sm">{bookedResult.service} with {professional.name}</p>
              <p className="text-xs text-green-700">{new Date(bookedResult.scheduledAt).toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })}</p>
              <p className="text-xs text-green-700">Booking Reference: <strong>#{bookedResult.id}</strong></p>
            </div>

            <div className="p-4 rounded-lg border bg-muted/40 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Session Total</span>
                <span className="font-semibold">${bookedResult.amount.toFixed(2)}</span>
              </div>
              {bookedResult.walletApplied > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>E-Wallet Applied</span>
                  <span className="font-medium">− ${bookedResult.walletApplied.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-1 mt-1">
                <span className="font-semibold">Remaining Due</span>
                <span className="font-bold" style={{ color: isFullyPaid ? "#2D6A4F" : "#C9A84C" }}>
                  {isFullyPaid ? "✓ $0.00 (Paid)" : `$${remaining.toFixed(2)}`}
                </span>
              </div>
            </div>

            {!isFullyPaid && (
              <div className="space-y-3">
                {/* Card payment — Square checkout link */}
                {bookedResult.paymentMethod === "card" ? (
                  bookedResult.paymentLink ? (
                    <>
                      <a
                        href={bookedResult.paymentLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full rounded-lg py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
                        style={{ background: "#C9A84C" }}
                      >
                        <CreditCard className="h-4 w-4" />
                        Pay ${remaining.toFixed(2)} Now — Secure Card Checkout
                      </a>
                      <p className="text-xs text-muted-foreground text-center">
                        Opens Square's secure checkout in a new tab. Your booking is saved — complete payment at any time.
                      </p>
                    </>
                  ) : (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm space-y-1">
                      <p className="font-semibold flex items-center gap-1.5"><CreditCard className="h-4 w-4" /> Complete Your Card Payment</p>
                      <p>Your booking is confirmed. Please contact NFGN directly to complete your card payment of <strong>${remaining.toFixed(2)}</strong>, referencing Booking <strong>#{bookedResult.id}</strong>.</p>
                    </div>
                  )
                ) : (
                  <>
                    <p className="text-sm font-semibold flex items-center gap-1.5">
                      <CreditCard className="h-4 w-4 text-primary" />
                      {successInfo.title} — Next Steps
                    </p>
                    <ol className="space-y-2">
                      {successInfo.steps.map((step, i) => (
                        <li key={i} className="flex gap-3 text-sm">
                          <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                          <span className="text-muted-foreground">{step.replace("#", `#${bookedResult.id}`)}</span>
                        </li>
                      ))}
                    </ol>
                  </>
                )}
              </div>
            )}

            {isFullyPaid && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                Your E-Wallet balance fully covered this session. No additional payment needed.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={handleDone} className="w-full">Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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

          {/* ── Session Total Summary ── */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-sm font-medium">Session Total</span>
              <span className="text-lg font-bold" style={{ color: BRAND_GOLD }}>${amount.toFixed(2)}</span>
            </div>

            {/* E-Wallet Credit */}
            {walletBalance > 0 && (
              <div className="border-t border-primary/10 px-4 py-3 space-y-2">
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  <Wallet className="h-3.5 w-3.5 text-primary" />
                  <span>E-Wallet Credit</span>
                  <span className="font-normal text-muted-foreground ml-1">(${walletBalance.toFixed(2)} available)</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className={`flex items-center border rounded-md overflow-hidden flex-1 ${walletError ? "border-red-400" : "border-border"}`}>
                    <span className="px-2 text-muted-foreground text-sm select-none bg-muted border-r py-1.5">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={walletInput}
                      onChange={(e) => handleWalletInput(e.target.value)}
                      placeholder="0.00"
                      className="flex-1 px-2 py-1.5 text-sm bg-transparent outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleWalletInput(String(Math.min(walletBalance, amount).toFixed(2)))}
                    className="text-xs px-2 py-1.5 rounded border border-primary/40 text-primary hover:bg-primary/10 transition-colors whitespace-nowrap"
                  >
                    Apply max
                  </button>
                  {walletInput && (
                    <button
                      type="button"
                      onClick={() => { setWalletInput(""); setWalletError(null); }}
                      className="text-xs px-2 py-1.5 rounded border border-border text-muted-foreground hover:bg-muted transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {walletError && (
                  <p className="text-xs text-red-600">{walletError}</p>
                )}

                {walletApplied > 0 && !walletError && (
                  <div className="text-xs space-y-0.5 text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Wallet applied:</span>
                      <span className="text-green-600 font-medium">− ${walletApplied.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-sm text-foreground">
                      <span>Remaining due:</span>
                      <span style={{ color: remainingDue === 0 ? "#2D6A4F" : BRAND_GOLD }}>
                        {remainingDue === 0 ? "✓ $0.00" : `$${remainingDue.toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Payment Method (shown when remaining > $0) ── */}
          {!walletCoversAll && (
            <div className="space-y-2">
              <Label>Payment Method {walletApplied > 0 && remainingDue > 0 && <span className="text-muted-foreground font-normal">(for remaining ${remainingDue.toFixed(2)})</span>}</Label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_OPTIONS.map(opt => {
                  const Icon = opt.icon;
                  const selected = paymentMethod === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPaymentMethod(opt.value)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background hover:border-primary/40 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              {paymentMethod && PAYMENT_INSTRUCTIONS[paymentMethod] && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs flex gap-2">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                  {PAYMENT_INSTRUCTIONS[paymentMethod]}
                </div>
              )}
            </div>
          )}

          {walletCoversAll && walletApplied > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              Your E-Wallet balance fully covers this session. No additional payment needed.
            </div>
          )}

          <div>
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="Any specific concerns, health goals, or questions for the consultant…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
            />
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
            {createBooking.isPending ? "Processing…" : `Book & Pay →`}
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
