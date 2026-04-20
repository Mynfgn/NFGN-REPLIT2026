import { useListCommissions, useGetCommissionRules } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, DollarSign, TrendingUp, Users, Gift } from "lucide-react";
import { commissionTypeLabel, commissionTypeBadgeClass, commissionStatusBadgeVariant } from "@/lib/labels";

function CommissionRow({ c }: { c: any }) {
  return (
    <div className="flex items-center justify-between border-b pb-3 last:border-0 gap-4">
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate text-sm">{c.fromUserName}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${commissionTypeBadgeClass(c.type)}`}>
            {commissionTypeLabel(c.type)}
          </span>
          {c.type === "level" && (
            <Badge variant="secondary" className="text-xs">Level {c.level}</Badge>
          )}
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
  );
}

export function CommissionsPage() {
  const { data, isLoading } = useListCommissions({ page: 1, limit: 100 });
  const { data: rules } = useGetCommissionRules();

  const commissions: any[] = data?.commissions ?? [];

  const referralCommissions = commissions.filter(c => c.type === "referral");
  const salesCommissions = commissions.filter(c => c.type === "sales");
  const prcCommissions = commissions.filter(c => c.type === "level");
  const bonusCommissions = commissions.filter(c => c.type === "power_squad_bonus");

  const totalApproved = commissions.filter(c => c.status === "approved").reduce((s, c) => s + c.commissionAmount, 0);
  const totalPending = commissions.filter(c => c.status === "pending").reduce((s, c) => s + c.commissionAmount, 0);
  const referralApproved = referralCommissions.filter(c => c.status === "approved").reduce((s, c) => s + c.commissionAmount, 0);
  const referralPending = referralCommissions.filter(c => c.status === "pending").reduce((s, c) => s + c.commissionAmount, 0);

  const prcLevels: { level: number; rate: number }[] = Array.isArray((rules as any)?.prcLevels)
    ? (rules as any).prcLevels
    : [{ level: 1, rate: 12 }, { level: 2, rate: 22 }, { level: 3, rate: 8 }, { level: 4, rate: 7 }, { level: 5, rate: 7 }];
  const salesLevels: { level: number; rate: number }[] = Array.isArray((rules as any)?.salesLevels)
    ? (rules as any).salesLevels
    : [{ level: 1, rate: 12 }, { level: 2, rate: 24 }, { level: 3, rate: 8 }, { level: 4, rate: 7 }, { level: 5, rate: 6 }, { level: 6, rate: 5 }, { level: 7, rate: 4 }, { level: 8, rate: 3 }, { level: 9, rate: 2 }];
  const referralRate = (rules as any)?.referralRate ?? 20;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">Commissions</h1>
        <p className="text-muted-foreground">Your referral, sales, and Pro Registration Commission earnings</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" /> Approved
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">${totalApproved.toFixed(2)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pending Review</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-yellow-600">${totalPending.toFixed(2)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Gift className="h-4 w-4 text-blue-600" /> Referral Earned
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-600">${referralApproved.toFixed(2)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Total Records
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{commissions.length}</div></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="referral">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="referral" className="gap-1.5">
            Referral Commissions
            {referralCommissions.length > 0 && (
              <span className="text-xs bg-blue-500 text-white rounded-full px-1.5 py-0 font-mono">{referralCommissions.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="sales" className="gap-1.5">
            Sales Commissions
            {salesCommissions.length > 0 && (
              <span className="text-xs bg-green-600 text-white rounded-full px-1.5 py-0 font-mono">{salesCommissions.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="prc" className="gap-1.5">
            PRC
            {prcCommissions.length > 0 && (
              <span className="text-xs bg-amber-500 text-white rounded-full px-1.5 py-0 font-mono">{prcCommissions.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">All History</TabsTrigger>
          <TabsTrigger value="structure">Comp Plan</TabsTrigger>
        </TabsList>

        {/* ── Referral Commissions Tab ── */}
        <TabsContent value="referral">
          <div className="space-y-4">
            {/* Referral summary card */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-blue-700 font-medium">Approved Referral Earnings</p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">${referralApproved.toFixed(2)}</p>
                  <p className="text-xs text-blue-600 mt-0.5">{referralCommissions.filter(c => c.status === "approved").length} commissions</p>
                </CardContent>
              </Card>
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-yellow-700 font-medium">Pending Referral</p>
                  <p className="text-2xl font-bold text-yellow-700 mt-1">${referralPending.toFixed(2)}</p>
                  <p className="text-xs text-yellow-600 mt-0.5">{referralCommissions.filter(c => c.status === "pending").length} awaiting approval</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full bg-blue-500" />
                  Referral Commission History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : referralCommissions.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <Users className="h-10 w-10 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground">No referral commissions yet.</p>
                    <p className="text-sm text-muted-foreground">Refer members and earn a Referral Commission on every purchase they make. Rates vary by product.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {referralCommissions.map(c => <CommissionRow key={c.id} c={c} />)}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Sales Commissions Tab ── */}
        <TabsContent value="sales">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-green-500" />
                Sales Commission History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : salesCommissions.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">No sales commissions yet. Pro Members earn on downline purchases.</p>
              ) : (
                <div className="space-y-3">
                  {salesCommissions.map(c => <CommissionRow key={c.id} c={c} />)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── PRC Tab ── */}
        <TabsContent value="prc">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-amber-500" />
                Pro Registration Commission (PRC) History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : prcCommissions.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">No PRC earnings yet. Earned when your downline purchases the Pro Registration Package.</p>
              ) : (
                <div className="space-y-3">
                  {prcCommissions.map(c => <CommissionRow key={c.id} c={c} />)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── All History Tab ── */}
        <TabsContent value="all">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Complete Commission History</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : commissions.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">No commissions yet. Start enrolling members to earn!</p>
              ) : (
                <div className="space-y-3">
                  {commissions.map(c => <CommissionRow key={c.id} c={c} />)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Comp Plan Tab ── */}
        <TabsContent value="structure">
          <div className="space-y-4">
            {/* Referral Commission */}
            <Card className="border-l-4 border-l-blue-400">
              <CardHeader className="pb-3">
                <CardTitle className="font-serif text-lg flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded border font-medium bg-blue-100 text-blue-800 border-blue-200">
                    Referral Commission (RC)
                  </span>
                  <span className="text-muted-foreground font-normal text-sm">— All Members &amp; Community Builders</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Every Member — whether a standard Member or a Pro Member — earns a <strong className="text-foreground">Referral Commission (RC)</strong> when 
                  someone they personally referred makes a purchase. Referral Commissions are available to all members, including 
                  <strong className="text-foreground"> Community Builders</strong> (members who have made at least one referral).
                </p>
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">RC</div>
                    <div className="flex-1">
                      <div className="font-semibold text-blue-900">Direct Sponsor — Level 1 Only</div>
                      <div className="text-xs text-blue-700 mt-1 leading-relaxed">
                        Paid when your personally enrolled member makes any purchase. The commission rate is 
                        <strong> not a fixed percentage</strong> — every product and service has its own Referral Commission amount, 
                        which may be a percentage of the sale price or a specified flat dollar amount.
                      </div>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900 space-y-1">
                  <p className="font-semibold text-amber-800">Important: RC is Product-Specific</p>
                  <p className="text-xs leading-relaxed">
                    Referral Commissions vary by product. Each item in the NFGN catalog carries its own commission rate or dollar 
                    amount set by the company. For example, one product might pay a 10% RC while another pays a flat $20 — both 
                    for the same referral relationship. Always check the individual product details for the exact RC amount.
                  </p>
                  <p className="text-xs leading-relaxed">
                    <strong>Example:</strong> If a product costs $179.99 and its RC is $20, and you refer 9 members who each purchase 
                    that product, you earn $180 total in Referral Commissions — making your own purchase of that product effectively 
                    $0 out of pocket.
                  </p>
                </div>
                <p className="text-xs text-muted-foreground italic">
                  Referral Commissions are the only commissions available to standard Members and Community Builders. Pro Members earn 
                  RC in addition to Sales Commissions and Pro Registration Commissions.
                </p>
              </CardContent>
            </Card>

            {/* Sales Commission */}
            <Card className="border-l-4 border-l-green-400">
              <CardHeader className="pb-3">
                <CardTitle className="font-serif text-lg flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded border font-medium bg-green-100 text-green-800 border-green-200">
                    Sales Commission
                  </span>
                  <span className="text-muted-foreground font-normal text-sm">— Pro Members Only</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Pro Members earn a Sales Commission on regular product purchases made within their downline genealogy tree.
                </p>
                <div className="space-y-2">
                  {salesLevels.map(l => (
                    <div key={l.level} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="h-8 w-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold">{l.level}</div>
                      <div className="flex-1">
                        <div className="font-medium">Level {l.level}</div>
                        <div className="text-xs text-muted-foreground">Paid on regular product purchases by downline at Level {l.level}</div>
                      </div>
                      <div className="font-bold text-lg text-green-700">{l.rate}%</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* PRC */}
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <CardTitle className="font-serif text-lg flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded border font-medium bg-amber-100 text-amber-800 border-amber-200">
                    Pro Registration Commission (PRC)
                  </span>
                  <span className="text-muted-foreground font-normal text-sm">— Pro Members Only · Pro Package Purchases</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  PRCs are generated ONLY from Pro Member Registration Package purchases across your upline.
                </p>
                <div className="space-y-2">
                  {prcLevels.map(l => (
                    <div key={l.level} className={`flex items-center gap-3 p-3 rounded-lg border ${l.level === 1 ? "bg-amber-50 border-amber-200" : "bg-primary/10 border-primary/30"}`}>
                      <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">{l.level}</div>
                      <div className="flex-1">
                        <div className="font-medium">
                          Level {l.level} — {l.level === 1 ? "Direct Sponsor" : l.level === 2 ? "Power Level" : `Upline Level ${l.level}`}
                          {l.level === 2 && <Badge className="text-xs ml-2">Power Bonus</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground">Must be a Pro Member. Earned on Pro Registration Package purchases.</div>
                      </div>
                      <div className="font-bold text-lg text-primary">{l.rate}%</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
