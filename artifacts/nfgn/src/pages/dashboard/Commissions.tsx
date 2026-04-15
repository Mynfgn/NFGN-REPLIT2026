import { useListCommissions, useGetCommissionRules } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Users, TrendingUp, DollarSign } from "lucide-react";
import { commissionTypeLabel, commissionTypeBadgeClass, commissionStatusBadgeVariant } from "@/lib/labels";

export function CommissionsPage() {
  const { data, isLoading } = useListCommissions({ page: 1, limit: 50 });
  const { data: rules } = useGetCommissionRules();

  const commissions = data?.commissions ?? [];
  const totalPending = commissions.filter((c: any) => c.status === "pending").reduce((s: number, c: any) => s + c.commissionAmount, 0);
  const totalApproved = commissions.filter((c: any) => c.status === "approved").reduce((s: number, c: any) => s + c.commissionAmount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">Commissions</h1>
        <p className="text-muted-foreground">Your referral, sales, and level commission earnings</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><DollarSign className="h-4 w-4 text-green-600" /> Approved</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">${totalApproved.toFixed(2)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pending Review</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-yellow-600">${totalPending.toFixed(2)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Total</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{commissions.length} entries</div></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="history">
        <TabsList>
          <TabsTrigger value="history">Commission History</TabsTrigger>
          <TabsTrigger value="structure">Compensation Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : commissions.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">No commissions yet. Start enrolling members to earn!</p>
              ) : (
                <div className="space-y-3">
                  {commissions.map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between border-b pb-3 last:border-0 gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{c.fromUserName}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${commissionTypeBadgeClass(c.type)}`}>
                            {commissionTypeLabel(c.type)}
                          </span>
                          <span className="text-xs text-muted-foreground">Order #{c.orderNumber}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{new Date(c.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-green-600">+${c.commissionAmount.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{c.rate}% of ${c.saleAmount.toFixed(2)}</p>
                        <Badge variant={commissionStatusBadgeVariant(c.status)} className="mt-1 text-xs">
                          {c.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="structure">
          <div className="space-y-4">
            {/* Referral Commission */}
            <Card className="border-l-4 border-l-blue-400">
              <CardHeader className="pb-3">
                <CardTitle className="font-serif text-lg flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded border font-medium bg-blue-100 text-blue-800 border-blue-200">Referral Commission</span>
                  <span className="text-muted-foreground font-normal text-sm">— All Members</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Every Member earns a Referral Commission when their personally sponsored Member makes ANY purchase.
                  This is paid to your direct sponsor on your very first purchase and every purchase thereafter.
                </p>
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">1</div>
                  <div className="flex-1">
                    <div className="font-medium">Direct Sponsor — Level 1</div>
                    <div className="text-xs text-muted-foreground">Paid on every purchase by your personally enrolled member</div>
                  </div>
                  <div className="font-bold text-lg text-blue-700">10%</div>
                </div>
              </CardContent>
            </Card>

            {/* Sales Commission */}
            <Card className="border-l-4 border-l-green-400">
              <CardHeader className="pb-3">
                <CardTitle className="font-serif text-lg flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded border font-medium bg-green-100 text-green-800 border-green-200">Sales Commission</span>
                  <span className="text-muted-foreground font-normal text-sm">— Pro Members Only</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Pro Members earn a Sales Commission on regular product purchases made by their direct downline.
                  This is earned in addition to the Referral Commission on direct referrals.
                </p>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="h-8 w-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold">1</div>
                  <div className="flex-1">
                    <div className="font-medium">Direct Downline — Level 1</div>
                    <div className="text-xs text-muted-foreground">Paid on regular product purchases (Pro Members only)</div>
                  </div>
                  <div className="font-bold text-lg text-green-700">10%</div>
                </div>
              </CardContent>
            </Card>

            {/* Level Commission */}
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <CardTitle className="font-serif text-lg flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded border font-medium bg-amber-100 text-amber-800 border-amber-200">Level Commission</span>
                  <span className="text-muted-foreground font-normal text-sm">— Pro Members Only · Pro Package Purchases</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Level Commissions are generated ONLY from Pro Member Registration Package purchases.
                  Paid across 2 levels to qualifying Pro Members. Your direct referral earns you Level 1
                  in addition to your Referral Commission.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</div>
                    <div className="flex-1">
                      <div className="font-medium">Level 1 — Direct Sponsor</div>
                      <div className="text-xs text-muted-foreground">Must be a Pro Member. Earned on top of Referral Commission.</div>
                    </div>
                    <div className="font-bold text-lg text-primary">10%</div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg border border-primary/30">
                    <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</div>
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        Level 2 — Power Level
                        <Badge className="text-xs">Power Bonus</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">Must be a Pro Member. 2× the Level 1 rate.</div>
                    </div>
                    <div className="font-bold text-lg text-primary">20%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
