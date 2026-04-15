import { useListPayouts, useProcessPayout } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AdminPayoutsPage() {
  const { toast } = useToast();
  const { data, isLoading, refetch } = useListPayouts({ page: 1, limit: 50 });
  const processPayout = useProcessPayout();

  const payouts = data?.payouts ?? [];
  const pending = payouts.filter((p: any) => p.status === "pending");
  const processed = payouts.filter((p: any) => p.status !== "pending");
  const totalPending = pending.reduce((sum: number, p: any) => sum + p.amount, 0);

  function handleProcess(id: number, name: string, amount: number) {
    processPayout.mutate({ id }, {
      onSuccess: () => { toast({ title: `Payout of $${amount.toFixed(2)} to ${name} processed!` }); refetch(); },
      onError: (e: any) => toast({ variant: "destructive", title: "Error", description: e.message }),
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">Payouts</h1>
        <p className="text-muted-foreground">${totalPending.toFixed(2)} pending approval</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-serif font-bold mb-4">{pending.length} Pending Requests</h3>
                <div className="space-y-3">
                  {pending.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div>
                        <p className="font-medium">{p.userName}</p>
                        <p className="text-sm text-muted-foreground">Via {p.method} • {new Date(p.createdAt).toLocaleDateString()}</p>
                        {p.notes && <p className="text-xs text-muted-foreground mt-1">{p.notes}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-bold text-lg">${p.amount.toFixed(2)}</p>
                          <Badge variant="secondary">pending</Badge>
                        </div>
                        <Button size="sm" onClick={() => handleProcess(p.id, p.userName, p.amount)} disabled={processPayout.isPending}>
                          <CheckCircle className="h-4 w-4 mr-1" /> Process
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6">
              <h3 className="font-serif font-bold mb-4">Processed Payouts</h3>
              {processed.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No processed payouts yet.</p>
              ) : (
                <div className="space-y-3">
                  {processed.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div>
                        <p className="font-medium">{p.userName}</p>
                        <p className="text-sm text-muted-foreground">Via {p.method}</p>
                        <p className="text-xs text-muted-foreground">{p.processedAt ? new Date(p.processedAt).toLocaleString() : new Date(p.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${p.amount.toFixed(2)}</p>
                        <Badge variant="default">processed</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
