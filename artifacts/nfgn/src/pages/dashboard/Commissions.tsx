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
        <p className="text-muted-foreground">Your referral, PSC, PMRC, and PMB earnings</p>
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
            PSC
            {salesCommissions.length > 0 && (
              <span className="text-xs bg-green-600 text-white rounded-full px-1.5 py-0 font-mono">{salesCommissions.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="prc" className="gap-1.5">
            PMRC
            {prcCommissions.length > 0 && (
              <span className="text-xs bg-amber-500 text-white rounded-full px-1.5 py-0 font-mono">{prcCommissions.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="bonuses" className="gap-1.5">
            PMB
            {bonusCommissions.length > 0 && (
              <span className="text-xs bg-purple-600 text-white rounded-full px-1.5 py-0 font-mono">{bonusCommissions.length}</span>
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

        {/* ── PSC Tab ── */}
        <TabsContent value="sales">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-green-500" />
                Product Sales Commission (PSC) History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : salesCommissions.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">No PSC earnings yet. Pro Members earn on regular product and service purchases within their downline.</p>
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
                Pro Member Registration Commission (PMRC) History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : prcCommissions.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">No PMRC earnings yet. Earned when your downline purchases the Pro Member Registration Package.</p>
              ) : (
                <div className="space-y-3">
                  {prcCommissions.map(c => <CommissionRow key={c.id} c={c} />)}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── PMB Tab ── */}
        <TabsContent value="bonuses">
          <div className="space-y-4">
            {/* Explainer */}
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
              <CardContent className="pt-5 pb-4">
                <div className="flex gap-3">
                  <Gift className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground">What are Pro Member Bonuses (PMB)?</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      PMB is an entirely separate income stream from PSC and PMRC. PMB are triggered when you and your 
                      Core Leaders sell <strong className="text-foreground">Pro Member Registration Products (PMRP)</strong> in increments 
                      of 9. The more stores (Pro Members) you and your team open across Levels 1 and 2, the more bonuses you earn. 
                      You must hold Pro Member status to qualify.
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      There are <strong className="text-foreground">two types</strong> of PMB:
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CLB */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-serif">
                  Core Leadership Bonus (CLB)
                  <span className="ml-2 text-xs font-normal text-muted-foreground">Also called: Core 9 Bonus (C9B) · Super Team Bonus (STB) · Generation 1 Bonus (G1B) · Gen 1 Bonus</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900 space-y-1.5">
                  <p className="flex items-center gap-2 font-semibold">
                    <Users className="h-4 w-4 text-blue-600" />
                    Trigger: Every 9 Pro Member Registrations sold on Level 1
                  </p>
                  <p className="text-blue-700 text-xs leading-relaxed">
                    When you (and your direct Core Leaders) sell Pro Member Registration Products on <strong>Level 1</strong>, 
                    every 9th sale triggers a Core Leadership Bonus. This bonus recognizes your direct leadership in opening 
                    new "franchise stores" in your immediate circle.
                  </p>
                </div>
                <p className="text-xs text-muted-foreground italic">
                  Think of Level 1 as your own direct market or region — every 9 Pro Members you personally activate in that 
                  region earns you a regional leadership bonus.
                </p>
              </CardContent>
            </Card>

            {/* MCB */}
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-serif">
                  Money Circulation Bonus (MCB)
                  <span className="ml-2 text-xs font-normal text-muted-foreground">Also called: Level 2 Power Team Bonus · Super Group Bonus · Generation 2 Bonus (Gen-2) · Super 9 Bonus</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg bg-purple-50 border border-purple-200 p-4 text-sm text-purple-900 space-y-1.5">
                  <p className="flex items-center gap-2 font-semibold">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                    Trigger: Every 9 Pro Member Registrations sold on Level 2
                  </p>
                  <p className="text-purple-700 text-xs leading-relaxed">
                    When your Level 1 Pro Members (your "franchise partners") each grow their own teams and sell Pro Member 
                    Registration Products on <strong>Level 2</strong>, every 9th collective sale triggers a Money Circulation 
                    Bonus. This is the national expansion bonus — rewarding you for the growth of your entire Pro Member network.
                  </p>
                </div>
                <p className="text-xs text-muted-foreground italic">
                  Think of Level 2 as your national or expanded market — your franchise partners are opening stores all over, 
                  and every 9 they collectively activate earns you a national growth bonus.
                </p>
              </CardContent>
            </Card>

            {/* Bonus History */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full bg-purple-500" />
                  PMB History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : bonusCommissions.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <Gift className="h-10 w-10 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground">No PMB earnings yet.</p>
                    <p className="text-sm text-muted-foreground">Bonuses are awarded every 9 Pro Member Registrations on Levels 1 &amp; 2.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bonusCommissions.map(c => <CommissionRow key={c.id} c={c} />)}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
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

            {/* ── Overview ── */}
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="font-serif text-lg">NFGN Compensation Plan Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The NFGN Compensation Plan is built around <strong className="text-foreground">five distinct income streams</strong>, 
                  each rewarding a different type of activity. No single income stream depends on another — they operate independently 
                  and stack on top of each other, allowing you to build a diverse, multi-source income.
                </p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {[
                    { code: "RC", label: "Referral Commission", color: "blue", who: "All Members", trigger: "Your referred member makes any purchase" },
                    { code: "PSC", label: "Product Sales Commissions", color: "green", who: "Pro Members Only", trigger: "Any product/service purchase in your downline (up to 9 levels)" },
                    { code: "PMRC", label: "Pro Member Registration Commission", color: "amber", who: "Pro Members Only", trigger: "Someone in your upline buys the Pro Member Registration Package" },
                    { code: "PMB", label: "Pro Member Bonuses (CLB & MCB)", color: "purple", who: "Pro Members Only", trigger: "Every 9 PMRPs sold on Level 1 (CLB) or Level 2 (MCB)" },
                    { code: "GVB", label: "Group Volume Bonuses (BPP)", color: "rose", who: "Pro Members Only", trigger: "Monthly GV/PV targets met — pays toward 5 real-life bills" },
                  ].map(item => (
                    <div key={item.code} className="flex items-start gap-3 p-3 rounded-lg border bg-background/80">
                      <div className={`text-xs font-bold px-2 py-1 rounded flex-shrink-0 ${
                        item.color === "blue" ? "bg-blue-100 text-blue-800 border border-blue-200" :
                        item.color === "green" ? "bg-green-100 text-green-800 border border-green-200" :
                        item.color === "amber" ? "bg-amber-100 text-amber-800 border border-amber-200" :
                        item.color === "purple" ? "bg-purple-100 text-purple-800 border border-purple-200" :
                        "bg-rose-100 text-rose-800 border border-rose-200"
                      }`}>{item.code}</div>
                      <div>
                        <p className="font-medium text-xs">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.who}</p>
                        <p className="text-xs text-muted-foreground italic mt-0.5">{item.trigger}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 leading-relaxed">
                  <strong className="text-amber-800">The Store Analogy:</strong> Your NFGN business is an online store sourcing wellness 
                  products from a warehouse. Standard members you register are <em>customers</em> who shop in your store. Pro Members you 
                  register are <em>franchise partners</em> — they open their own store in a new region, sell the same products from the 
                  same warehouse, and help you move massive volume. RC is your customer loyalty bonus. PSC is your franchise royalty. 
                  PMRC is your franchise fee share. PMB is your regional/national store-opening bonus. GVB is the company paying your real-life bills 
                  when you hit volume targets.
                </div>
              </CardContent>
            </Card>

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
                  RC in addition to Sales Commissions and Pro Member Registration Commissions (PMRC).
                </p>
              </CardContent>
            </Card>

            {/* PSC */}
            <Card className="border-l-4 border-l-green-400">
              <CardHeader className="pb-3">
                <CardTitle className="font-serif text-lg flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded border font-medium bg-green-100 text-green-800 border-green-200">
                    Product Sales Commissions (PSC)
                  </span>
                  <span className="text-muted-foreground font-normal text-sm">— Pro Members Only</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground space-y-3 leading-relaxed">
                  <p>
                    <strong className="text-foreground">PSC</strong> are commissions generated when NFGN members purchase products or 
                    services — including <strong className="text-foreground">recurring monthly subscriptions</strong> — within your Group 
                    or Community. The more products and services being purchased in your NFGN Community, the greater your 
                    <strong className="text-foreground"> Group Volume (GV)</strong> and your PSC earnings become.
                  </p>
                  <p>
                    <strong className="text-foreground">Think of it like a store:</strong> Your online NFGN business is a store that 
                    sells products and services sourced from a particular warehouse in a particular region. Every time you register a 
                    standard member, that's a <strong className="text-foreground">customer who shops in your store</strong>. Every purchase 
                    they make increases their personal PV and your Group GV — and because you referred them, your 
                    <strong className="text-foreground"> Referral Commission (RC)</strong> also goes up.
                  </p>
                  <p>
                    When you register a <strong className="text-foreground">Pro Member</strong>, that's like selling someone a 
                    <strong className="text-foreground"> franchise store</strong>. You're opening another store in another part of the 
                    region or country — selling the same products and services from the same warehouse. Pro Members are not just 
                    customers; they are <strong className="text-foreground">partners</strong> whose mission is to help you move big 
                    volumes of products and services out of the warehouse. This is what drives your PSC earnings exponentially.
                  </p>
                  <p>
                    PSC is separate from Referral Commissions — RC is earned on direct referral purchases, while PSC is earned across 
                    multiple levels of your downline genealogy tree (Pro Members only).
                  </p>
                </div>
                <div className="space-y-2">
                  {salesLevels.map(l => (
                    <div key={l.level} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="h-8 w-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold">{l.level}</div>
                      <div className="flex-1">
                        <div className="font-medium">Level {l.level}</div>
                        <div className="text-xs text-muted-foreground">Paid on regular product &amp; service purchases by your downline at Level {l.level}</div>
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
                    Pro Member Registration Commission (PMRC)
                  </span>
                  <span className="text-muted-foreground font-normal text-sm">— Pro Members Only · Pro Package Purchases</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  PMRCs are generated ONLY from Pro Member Registration Package purchases across your upline.
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
                        <div className="text-xs text-muted-foreground">
                          Must be a Pro Member. Earned on Pro Registration Package purchases and renewals.
                          {l.level === 1 && " · First 9 = CLB (one-time) within 90 days of becoming Pro Member."}
                          {l.level === 2 && " · Qualifying Upline Sponsor earns MCB every 9 purchases (recurring)."}
                        </div>
                      </div>
                      <div className="font-bold text-lg text-primary">{l.rate}%</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            {/* PMB — CLB & MCB */}
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-3">
                <CardTitle className="font-serif text-lg flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded border font-medium bg-purple-100 text-purple-800 border-purple-200">
                    Pro Member Bonuses (PMB) — CLB &amp; MCB
                  </span>
                  <span className="text-muted-foreground font-normal text-sm">— Pro Members Only · Separate Income Stream</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 text-sm text-purple-900 space-y-2">
                  <p className="font-semibold">Two Completely Different Bonuses — CLB is One-Time, MCB is Recurring</p>
                  <p className="text-xs leading-relaxed text-purple-800">
                    Pro Member Bonuses (CLB and MCB) are an entirely separate income stream from PSC and PMRC. 
                    <strong> CLB fires exactly once</strong>; MCB repeats every month. Both are triggered by 
                    <strong> Pro Member Registration Product (PMRP)</strong> purchases.
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-blue-900 text-sm">Core Leadership Bonus (CLB)</p>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-blue-600 text-white font-bold">ONE-TIME</span>
                    </div>
                    <p className="text-xs text-blue-700">Also called: Core 9 Bonus (C9B) · Super Team Bonus (STB) · Gen 1 Bonus (G1B)</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Users className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <span className="text-xs font-semibold text-blue-900">First 9 new PMRPs on Level 1 — within your first 90 days as Pro Member</span>
                    </div>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      Awarded exactly once when your first 9 Level 1 PMRPs are purchased within your first 90 days 
                      as a Pro Member. No second payout — ever. After CLB, the MCB takes over as your ongoing income.
                    </p>
                  </div>
                  <div className="rounded-xl bg-purple-50 border border-purple-200 p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-purple-900 text-sm">Money Circulation Bonus (MCB)</p>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-purple-600 text-white font-bold">RECURRING</span>
                    </div>
                    <p className="text-xs text-purple-700">Also called: Super 9 Bonus · Level 2 Power Team Bonus · Super Group Bonus · Gen-2 Bonus</p>
                    <div className="flex items-center gap-2 mt-2">
                      <TrendingUp className="h-4 w-4 text-purple-600 flex-shrink-0" />
                      <span className="text-xs font-semibold text-purple-900">Every 9 PMRPs on Level 2 — initial + renewals — repeats monthly</span>
                    </div>
                    <p className="text-xs text-purple-700 leading-relaxed">
                      Awarded to the <strong>Qualifying Upline Sponsor</strong> (the Level 2 upline Pro Member with 9+ 
                      active Level 1 Pro Members) every time 9 PMRP purchases accumulate on Level 2. Fires at 9, 18, 27… 
                      and repeats each month as the team renews and grows.
                    </p>
                  </div>
                </div>
                <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-3 text-xs text-indigo-900 leading-relaxed">
                  <strong className="text-indigo-800">What is a Qualifying Upline Sponsor?</strong> The Qualifying Upline 
                  Sponsor is the Pro Member two levels above the PMRP buyer in the genealogy tree (the sponsor's sponsor). 
                  To qualify for MCB, this upline Pro Member must have at least 9 active Level 1 Pro Members — their 
                  Core Leadership Group. Without the Core Leadership Group, MCB is not awarded.
                </div>
              </CardContent>
            </Card>

            {/* GVB / BPP */}
            <Card className="border-l-4 border-l-rose-500">
              <CardHeader className="pb-3">
                <CardTitle className="font-serif text-lg flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded border font-medium bg-rose-100 text-rose-800 border-rose-200">
                    Group Volume Bonuses (GVB) — Bill Payer Program
                  </span>
                  <span className="text-muted-foreground font-normal text-sm">— Pro Members Only · Monthly</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The <strong className="text-foreground">Bill Payer Program (BPP)</strong> is NFGN's most distinctive benefit — 
                  the company literally pays your real-life monthly bills for you. When you hit your monthly Group Volume (GV) 
                  and Personal Volume (PV) targets, you qualify for up to <strong className="text-foreground">five separate GV Bonuses</strong>, 
                  each earmarked for a specific life expense.
                </p>
                <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-900 space-y-1">
                  <p className="font-semibold">How it works</p>
                  <ul className="text-xs space-y-1 list-disc list-inside text-rose-800 leading-relaxed">
                    <li>You must be a <strong>Pro Member</strong> — activating your Pro Member Registration unlocks BPP eligibility.</li>
                    <li>Each month, the company pools a portion of revenue into 5 separate fund buckets.</li>
                    <li>When your monthly GV and PV meet each fund's threshold, you receive a payout from that fund — credited to your e-wallet.</li>
                    <li>Payouts are proportional to your GV relative to other qualifying members in the fund pool.</li>
                    <li>Funds reset monthly — eligibility is re-evaluated every month based on current GV/PV.</li>
                    <li>Standard PV requirement is typically <strong>150 PV</strong> for the base fund tier.</li>
                  </ul>
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {[
                    { icon: "🏠", name: "Rent / Mortgage Fund", desc: "Helps cover your monthly housing payment." },
                    { icon: "🚗", name: "Car Fund", desc: "Contributes toward your car payment or transportation cost." },
                    { icon: "⚡", name: "Utilities Fund", desc: "Covers electricity, water, gas, and household utilities." },
                    { icon: "❤️", name: "Medical Fund", desc: "Helps offset health insurance or medical expenses." },
                    { icon: "📱", name: "Phone / Internet Fund", desc: "Pays toward your phone or internet subscription." },
                  ].map(f => (
                    <div key={f.name} className="flex items-start gap-2 p-3 rounded-lg border bg-background/80">
                      <span className="text-xl flex-shrink-0">{f.icon}</span>
                      <div>
                        <p className="font-medium text-xs">{f.name}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 leading-relaxed">
                  <strong className="text-amber-800">Important:</strong> GVBs are classified as <em>Money Circulation Bonuses</em> — 
                  they are drawn from the group's collective volume activity, not fixed commission rates on individual transactions. 
                  GVBs are entirely separate from RC, PSC, PMRC, and PMB. See the <strong>Bill Payer Program</strong> page in the 
                  sidebar for your live fund status, GV/PV progress, and estimated payouts for the current month.
                </div>
              </CardContent>
            </Card>

          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
