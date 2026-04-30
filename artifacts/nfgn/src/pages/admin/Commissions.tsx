import { useState } from "react";
import { useListCommissions, useApproveCommission, useRejectCommission } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { commissionTypeLabel, commissionTypeBadgeClass, commissionStatusBadgeVariant } from "@/lib/labels";

export function AdminCommissionsPage() {
  const [page, setPage] = useState(1);
  const { toast } = useToast();

  const { data, isLoading, refetch } = useListCommissions({ page, limit: 30 });
  const approve = useApproveCommission();
  const reject = useRejectCommission();

  const commissions = data?.commissions ?? [];
  const pending = commissions.filter((c: any) => c.status === "pending");
  const processed = commissions.filter((c: any) => c.status !== "pending");

  function handleApprove(id: number) {
    approve.mutate({ id }, {
      onSuccess: () => { toast({ title: "Commission approved!" }); refetch(); },
      onError: (e: any) => toast({ variant: "destructive", title: "Error", description: e.message }),
    });
  }

  function handleReject(id: number) {
    reject.mutate({ id }, {
      onSuccess: () => { toast({ title: "Commission rejected" }); refetch(); },
      onError: (e: any) => toast({ variant: "destructive", title: "Error", description: e.message }),
    });
  }

  function CommissionRow({ c }: { c: any }) {
    return (
      <div className="flex items-center justify-between border-b pb-3 last:border-0 gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{c.userName}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${commissionTypeBadgeClass(c.type)}`}>
              {commissionTypeLabel(c.type)}
            </span>
            {c.type === "level" && (
              <Badge variant="secondary" className="text-xs">Level {c.level}</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">From: {c.fromUserName} · Order #{c.orderNumber}</p>
          <p className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-green-600">${c.commissionAmount.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">{c.rate}% of ${c.saleAmount.toFixed(2)}</p>
          <Badge variant={commissionStatusBadgeVariant(c.status)} className="mt-1 text-xs">{c.status}</Badge>
        </div>
        {c.status === "pending" && (
          <div className="flex gap-2 flex-shrink-0">
            <Button size="sm" variant="default" className="h-8 w-8 p-0" onClick={() => handleApprove(c.id)} title="Approve">
              <CheckCircle className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="destructive" className="h-8 w-8 p-0" onClick={() => handleReject(c.id)} title="Reject">
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">Commissions</h1>
        <p className="text-muted-foreground">{pending.length} pending approval</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-serif font-bold mb-4 flex items-center gap-2">
                  <Badge>{pending.length} pending</Badge> commissions awaiting approval
                </h3>
                <div className="space-y-3">
                  {pending.map((c: any) => <CommissionRow key={c.id} c={c} />)}
                </div>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-serif font-bold mb-4">All Commissions</h3>
              {processed.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No processed commissions.</p>
              ) : (
                <div className="space-y-3">
                  {processed.map((c: any) => <CommissionRow key={c.id} c={c} />)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
