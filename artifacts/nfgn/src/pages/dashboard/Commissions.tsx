import { useListCommissions, useGetCommissionRules } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

export function CommissionsPage() {
  const { data, isLoading } = useListCommissions({ page: 1, limit: 50 });
  const { data: rules } = useGetCommissionRules();

  const commissions = data?.commissions ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">Commissions</h1>
        <p className="text-muted-foreground">Track your earnings across all 9 generations</p>
      </div>

      <Tabs defaultValue="history">
        <TabsList>
          <TabsTrigger value="history">Commission History</TabsTrigger>
          <TabsTrigger value="structure">Pay Structure</TabsTrigger>
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
                    <div key={c.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div>
                        <p className="font-medium">{c.fromUserName}</p>
                        <p className="text-sm text-muted-foreground">Level {c.level} • Order #{c.orderNumber}</p>
                        <p className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">+${c.commissionAmount.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{c.rate}% of ${c.saleAmount.toFixed(2)}</p>
                        <Badge variant={c.status === "approved" ? "default" : c.status === "pending" ? "secondary" : "destructive"} className="mt-1">
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
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">2 Down By Infinity Pay Structure</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6 text-sm">
                As a Pro Member, you earn commissions on every sale made within your 9-generation downline.
                Level 2 is the "Power Level" with a 2x commission rate.
              </p>
              <div className="space-y-2">
                {(rules?.levels ?? []).map((level: any) => (
                  <div key={level.level} className={`flex items-center justify-between p-3 rounded-lg border ${level.level === 2 ? "border-primary bg-primary/5" : "border-border"}`}>
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${level.level === 2 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                        {level.level}
                      </div>
                      <div>
                        <span className="font-medium">Generation {level.level}</span>
                        {level.level === 2 && <Badge className="ml-2 text-xs">Power Level</Badge>}
                        {level.description && <p className="text-xs text-muted-foreground">{level.description}</p>}
                      </div>
                    </div>
                    <span className={`font-bold text-lg ${level.level === 2 ? "text-primary" : ""}`}>{level.rate}%</span>
                  </div>
                ))}
              </div>
              {rules?.powerBonusEnabled && (
                <div className="mt-6 p-4 bg-primary/10 border border-primary/30 rounded-lg">
                  <h4 className="font-bold text-primary mb-1">Power Bonus</h4>
                  <p className="text-sm text-muted-foreground">
                    Earn an additional ${rules.powerBonusAmount} bonus when you complete {rules.powerBonusTrigger} enrollments across any generation!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
