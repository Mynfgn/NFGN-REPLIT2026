import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@/lib/custom-fetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, CalendarDays, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BRAND_GOLD = "#C9A84C";
const BRAND_GREEN = "#2D6A4F";

function getDays(n = 30) {
  const days: Date[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function fmt(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

interface Slot { id: number; availableDate: string; startTime: string; endTime: string; }
interface BookingInfo { id: number; scheduledAt: string; duration: number; status: string; }

export function ProAvailabilityPage() {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["/api/professionals/my-availability"],
    queryFn: () => customFetch("/api/professionals/my-availability").then((r: any) => r.json()),
  });

  const slots: Slot[] = data?.slots ?? [];
  const bookings: BookingInfo[] = data?.bookings ?? [];

  const addSlot = useMutation({
    mutationFn: (body: { availableDate: string; startTime: string; endTime: string }) =>
      customFetch("/api/professionals/my-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r: any) => { if (!r.ok) throw new Error(); return r.json(); }),
    onSuccess: () => {
      toast({ title: "Time slot added" });
      qc.invalidateQueries({ queryKey: ["/api/professionals/my-availability"] });
      setAddOpen(false);
    },
    onError: () => toast({ variant: "destructive", title: "Failed to add slot" }),
  });

  const removeSlot = useMutation({
    mutationFn: (id: number) =>
      customFetch(`/api/professionals/my-availability/${id}`, { method: "DELETE" }).then((r: any) => {
        if (!r.ok) throw new Error();
        return r.json();
      }),
    onSuccess: () => {
      toast({ title: "Slot removed" });
      qc.invalidateQueries({ queryKey: ["/api/professionals/my-availability"] });
    },
    onError: () => toast({ variant: "destructive", title: "Failed to remove slot" }),
  });

  const days = getDays(30);

  function slotsByDay(dateStr: string) {
    return slots.filter(s => s.availableDate === dateStr);
  }

  function bookingsByDay(dateStr: string) {
    return bookings.filter(b => b.scheduledAt.slice(0, 10) === dateStr && b.status !== "cancelled");
  }

  function openAdd(dateStr: string) {
    setSelectedDay(dateStr);
    setStartTime("09:00");
    setEndTime("17:00");
    setAddOpen(true);
  }

  function handleAdd() {
    if (!selectedDay) return;
    if (startTime >= endTime) {
      toast({ variant: "destructive", title: "End time must be after start time" });
      return;
    }
    addSlot.mutate({ availableDate: selectedDay, startTime, endTime });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">Manage My Availability</h1>
        <p className="text-muted-foreground mt-1">
          Set the dates and times you are available for appointments over the next 30 days.
          Clients can only book you during slots you have marked as available.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {isLoading
          ? Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-28 rounded-lg bg-gray-100 animate-pulse" />
            ))
          : days.map((day) => {
              const dateStr = toDateStr(day);
              const daySlots = slotsByDay(dateStr);
              const dayBookings = bookingsByDay(dateStr);
              const isToday = dateStr === toDateStr(new Date());

              return (
                <Card
                  key={dateStr}
                  className={`border transition-all ${isToday ? "ring-2" : ""}`}
                  style={{ borderColor: isToday ? BRAND_GOLD : undefined, outline: isToday ? `2px solid ${BRAND_GOLD}` : undefined }}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          {isToday ? "Today" : day.toLocaleDateString("en-US", { weekday: "short" })}
                        </p>
                        <p className="text-sm font-bold">
                          {day.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0"
                        onClick={() => openAdd(dateStr)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {dayBookings.length > 0 && (
                      <div className="mb-1.5 space-y-1">
                        {dayBookings.map(b => (
                          <div
                            key={b.id}
                            className="flex items-center gap-1.5 text-xs rounded px-2 py-1"
                            style={{ background: "#fef3c7", color: "#92400e" }}
                          >
                            <AlertCircle className="h-3 w-3 flex-shrink-0" />
                            <span>Booked {new Date(b.scheduledAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {daySlots.length === 0 && dayBookings.length === 0 && (
                      <p className="text-xs text-muted-foreground italic">No slots set</p>
                    )}

                    <div className="space-y-1">
                      {daySlots.map(slot => (
                        <div
                          key={slot.id}
                          className="flex items-center justify-between rounded px-2 py-1 text-xs"
                          style={{ background: "#dcfce7", color: "#166534" }}
                        >
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                            <span>{slot.startTime} – {slot.endTime}</span>
                          </div>
                          <button
                            onClick={() => removeSlot.mutate(slot.id)}
                            className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" style={{ color: BRAND_GOLD }} />
              Add Available Slot
            </DialogTitle>
          </DialogHeader>
          {selectedDay && (
            <p className="text-sm text-muted-foreground -mt-2 mb-2">
              {fmt(new Date(selectedDay + "T00:00:00"))}
            </p>
          )}
          <div className="space-y-4">
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              onClick={handleAdd}
              disabled={addSlot.isPending}
              style={{ background: BRAND_GOLD, color: "#000" }}
            >
              {addSlot.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Slot"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
