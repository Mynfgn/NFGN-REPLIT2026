import { useState, useEffect, useCallback } from "react";
import { customFetch } from "@/lib/custom-fetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Loader2, Search, RefreshCw, DollarSign, Users, TrendingUp, Clock,
} from "lucide-react";
import { commissionStatusBadgeVariant } from "@/lib/labels";
import { toast } from "sonner";

interface ReferralCommission {
  id: number;
  userId: number;
  userName: string;
  fromUserId: number;
  fromUserName: string;
  orderId: number;
  orderNumber: string;
  level: number;
  rate: number;
  saleAmount: number;
  commissionAmount: number;
  status: string;
  createdAt: string;
}

export function ReferralCommissionsPage() {
  const [commissions, setCommissions] = useState<ReferralCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customFetch(`/api/commissions/referral?limit=200`);
      if (res.ok) {
        const data = await res.json();
        setCommissions(data.commissions ?? []);
      } else {
        toast.error("Failed to load referral commissions");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = commissions.filter(c => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (search) {
      const hay = `${c.userName} ${c.fromUserName} ${c.orderNumber}`.toLowerCase();
      if (!hay.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const totalApproved = commissions.filter(c => c.status === "approved").reduce((s, c) => s + c.commissionAmount, 0);
  const totalPending = commissions.filter(c => c.status === "pending").reduce((s, c) => s + c.commissionAmount, 0);
  const uniqueEarners = new Set(commissions.map(c => c.userId)).size;

  const STATUS_TABS = [
    { value: "all", label: "All", count: commissions.length },
    { value: "pending", label: "Pending", count: commissions.filter(c => c.status === "pending").length },
    { value: "approved", label: "Approved", count: commissions.filter(c => c.status === "approved").length },
    { value: "rejected", label: "Rejected", count: commissions.filter(c => c.status === "rejected").length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">Referral Commissions</h1>
          <p className="text-muted-foreground text-sm mt-1">
            All referral commissions earned by members when their personally sponsored members make purchases.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Approved",
            value: `$${totalApproved.toFixed(2)}`,
            icon: DollarSign,
            color: "text-green-600",
          },
          {
            label: "Pending Amount",
            value: `$${totalPending.toFixed(2)}`,
            icon: Clock,
            color: "text-yellow-600",
          },
          {
            label: "Unique Earners",
            value: uniqueEarners,
            icon: Users,
            color: "text-blue-600",
          },
          {
            label: "Total Records",
            value: commissions.length,
            icon: TrendingUp,
            color: "text-primary",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <div className={`h-9 w-9 rounded-lg bg-muted flex items-center justify-center ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-bold">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search member, buyer, or order #..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                statusFilter === tab.value
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              <span className={`text-xs rounded-full px-1.5 py-0 font-mono ${
                statusFilter === tab.value ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Referral Commission Records{" "}
            <span className="text-muted-foreground font-normal text-sm">({filtered.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member (Earner)</TableHead>
                  <TableHead>Purchased By</TableHead>
                  <TableHead>Order #</TableHead>
                  <TableHead>Sale Amount</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-muted rounded animate-pulse w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      {search || statusFilter !== "all"
                        ? "No commissions match your filter."
                        : "No referral commissions found yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(c => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{c.userName}</p>
                          <p className="text-xs text-muted-foreground">ID #{c.userId}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{c.fromUserName}</p>
                          <p className="text-xs text-muted-foreground">ID #{c.fromUserId}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">#{c.orderNumber}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">${c.saleAmount.toFixed(2)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">{c.rate}%</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-green-600">
                          +${c.commissionAmount.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={commissionStatusBadgeVariant(c.status)} className="capitalize text-xs">
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
