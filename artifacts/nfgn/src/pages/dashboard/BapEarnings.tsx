import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Briefcase, DollarSign, CheckCircle, Clock, TrendingUp } from "lucide-react";

const GOLD = "#C9A84C";
const GREEN = "#2D6A4F";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export function BapEarningsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-booking-earnings"],
    queryFn: async () => {
      const token = localStorage.getItem("nfgn_token");
      const r = await fetch("/api/my-booking-earnings", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
      if (!r.ok) return { earnings: [], total: 0 };
      return r.json();
    },
  });

  const earnings: any[] = data?.earnings ?? [];
  const totalEarned: number = data?.total ?? earnings.reduce((s: number, e: any) => s + (e.amount ?? 0), 0);
  const completed = earnings.filter((e: any) => e.status === "completed" || e.status === "approved");
  const pending   = earnings.filter((e: any) => e.status === "pending");

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: GOLD }}>BAP Earnings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Earnings from completed Book-A-Professional bookings where a service has been rendered to the customer.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm" style={{ background: `linear-gradient(135deg, ${GOLD}18, ${GOLD}08)`, borderTop: `2px solid ${GOLD}` }}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5" style={{ color: GOLD }} />
              <div>
                <p className="text-xs text-muted-foreground">Total Earned</p>
                <p className="text-xl font-bold" style={{ color: GOLD }}>{fmt(totalEarned)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm" style={{ background: `linear-gradient(135deg, ${GREEN}18, ${GREEN}08)`, borderTop: `2px solid ${GREEN}` }}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5" style={{ color: GREEN }} />
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-xl font-bold" style={{ color: GREEN }}>{completed.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm" style={{ background: "linear-gradient(135deg, #92400e18, #92400e08)", borderTop: "2px solid #D97706" }}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-xl font-bold text-amber-600">{pending.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" style={{ color: GOLD }} />
            Booking Earnings History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: GOLD }} />
            </div>
          ) : earnings.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Briefcase className="h-10 w-10 mx-auto opacity-20" />
              <p className="text-sm text-muted-foreground">No booking earnings yet.</p>
              <p className="text-xs text-muted-foreground">
                Earnings appear here once a booking has been completed and the service has been rendered to the customer.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {earnings.map((e: any, i: number) => (
                <div key={e.id ?? i} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: `${GOLD}15` }}>
                      <Briefcase className="h-4 w-4" style={{ color: GOLD }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{e.description ?? "Booking Commission"}</p>
                      <p className="text-xs text-muted-foreground">
                        {e.createdAt ? new Date(e.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className="text-xs capitalize"
                      style={
                        (e.status === "completed" || e.status === "approved")
                          ? { borderColor: GREEN, color: GREEN }
                          : e.status === "pending"
                          ? { borderColor: "#D97706", color: "#D97706" }
                          : {}
                      }
                    >
                      {e.status ?? "pending"}
                    </Badge>
                    <span className="text-sm font-bold" style={{ color: GOLD }}>{fmt(e.amount ?? 0)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="rounded-lg p-4 text-xs text-muted-foreground" style={{ background: `${GOLD}08`, border: `1px solid ${GOLD}20` }}>
        <strong style={{ color: GOLD }}>How BAP Earnings work:</strong> When a customer completes a booking with one of your referred professionals and the service is rendered, your earnings are recorded here. These earnings also appear under <em>Commissions</em> in your account and are processed with your regular payout cycle.
      </div>
    </div>
  );
}
