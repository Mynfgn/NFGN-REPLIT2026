import { useListCommissions } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, TrendingUp, Gift, Star, DollarSign, Lock } from "lucide-react";
import { useGetMe } from "@workspace/api-client-react";
import { commissionTypeLabel, commissionTypeBadgeClass, commissionStatusBadgeVariant } from "@/lib/labels";

function BonusRow({ c }: { c: any }) {
  return (
    <div className="flex items-center justify-between border-b pb-3 last:border-0 gap-4">
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate text-sm">{c.fromUserName ?? "System"}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${commissionTypeBadgeClass(c.type)}`}>
            {commissionTypeLabel(c.type)}
          </span>
          {c.level && (
            <Badge variant="secondary" className="text-xs">
              {c.level === 1 ? "CLB — Level 1" : "MCB — Level 2"}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{new Date(c.createdAt).toLocaleDateString()}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-bold text-green-600">+${Number(c.commissionAmount).toFixed(2)}</p>
        <Badge variant={commissionStatusBadgeVariant(c.status)} className="mt-1 text-xs">{c.status}</Badge>
      </div>
    </div>
  );
}

export function ProMemberBonusesPage() {
  const { data: user } = useGetMe();
  const { data, isLoading } = useListCommissions({ page: 1, limit: 100 });
  const commissions: any[] = data?.commissions ?? [];
  const bonusCommissions = commissions.filter(c => c.type === "power_squad_bonus");

  const totalEarned = bonusCommissions.filter(c => c.status === "approved").reduce((s, c) => s + Number(c.commissionAmount), 0);

  const isProMember = user?.role === "pro_member" || user?.role === "admin" || user?.role === "super_admin";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">PMB — Pro Member Bonuses</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Core Leadership Bonus (CLB) &amp; Money Circulation Bonus (MCB)
        </p>
      </div>

      {!isProMember && (
        <Card className="border-l-4 border-l-amber-400">
          <CardContent className="pt-5 pb-4">
            <div className="flex gap-3">
              <Lock className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Pro Members Only</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Pro Member Bonuses are available exclusively to NFGN Pro Members.
                  Upgrade your membership to qualify for CLB and MCB bonuses earned through your team's growth.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Total Earned</p>
              <p className="text-xl font-bold text-green-600">${totalEarned.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">approved bonuses</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <Star className="h-8 w-8 text-purple-600 flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Total Bonuses</p>
              <p className="text-xl font-bold text-purple-600">{bonusCommissions.length}</p>
              <p className="text-xs text-muted-foreground">lifetime</p>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 md:col-span-1">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <Gift className="h-8 w-8 text-blue-600 flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Income Stream</p>
              <p className="text-sm font-bold text-blue-600">Separate from PSC &amp; PMRC</p>
              <p className="text-xs text-muted-foreground">triggered by PMRP sales</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* What are Pro Member Bonuses */}
      <Card className="bg-gradient-to-br from-purple-50 to-purple-100/40 border-purple-200">
        <CardContent className="pt-5 pb-5 space-y-3">
          <div className="flex gap-3">
            <Star className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5 fill-purple-200" />
            <div className="space-y-2">
              <p className="font-semibold text-foreground">What are Pro Member Bonuses?</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Pro Member Bonuses are a completely separate income stream from your Product Sales Commissions 
                (PSC) and Pro Member Registration Commissions (PMRC). They are triggered when you and your 
                <strong className="text-foreground"> Core Leaders</strong> sell{" "}
                <strong className="text-foreground">Pro Member Registration Products (PMRP)</strong> in increments of 9.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Think of it this way:</strong> When you look at your online NFGN business 
                as a store, registering a <em>standard member</em> is like gaining a new customer. But registering a{" "}
                <strong className="text-foreground">Pro Member</strong> is like selling someone a{" "}
                <strong className="text-foreground">franchise store</strong> — they are now a business partner opening their 
                own store in another region or city, selling the same products and services from the same warehouse.
                The Pro Member's mission is to help you move massive volumes of products and services.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Pro Member Bonuses are your <strong className="text-foreground">regional and national store bonuses</strong>. 
                The more franchise stores (Pro Members) you and your Core Leaders open on Levels 1 and 2 — in increments 
                of 9 — the more bonuses you earn.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CLB */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <CardTitle className="font-serif text-lg">
            Core Leadership Bonus (CLB)
          </CardTitle>
          <div className="flex flex-wrap gap-1 mt-1">
            {["Core 9 Bonus (C9B)", "Super Team Bonus (STB)", "Generation 1 Bonus (G1B)", "Gen 1 Bonus"].map(alias => (
              <Badge key={alias} variant="outline" className="text-xs text-blue-700 border-blue-200 bg-blue-50">{alias}</Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 space-y-2">
            <p className="font-semibold text-blue-900 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Trigger: Every 9 PMRPs on Level 1 — initial purchases AND monthly renewals
            </p>
            <p className="text-sm text-blue-700 leading-relaxed">
              Every time 9 PMRP purchases or subscription renewals accumulate on your <strong>Level 1</strong>, 
              you earn a CLB. The counter is <strong>cumulative and never resets</strong> — at 9, 18, 27, 36 
              and beyond, for as long as your team keeps their subscriptions active.
            </p>
          </div>
          <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-xs text-green-900 space-y-1">
            <p className="font-medium text-green-800">Monthly Renewal Example</p>
            <p className="leading-relaxed">
              If 9 Level 1 members each have an active PMRP subscription, every month those 9 renewals 
              increment your counter by 9 — awarding you a CLB bonus every single month, automatically.
            </p>
          </div>
          <div className="rounded-lg bg-white border p-3 text-sm text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Store Analogy</p>
            <p className="text-xs leading-relaxed">
              Level 1 is your direct regional market. Every 9 franchise renewals (active partner stores) in that 
              market earns you a regional leadership bonus — rewards you for keeping your team active, not just 
              recruiting new ones.
            </p>
          </div>
          <p className="text-xs text-muted-foreground italic">
            Must be a Pro Member to qualify for CLB. No minimum team size required.
          </p>
        </CardContent>
      </Card>

      {/* MCB */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader className="pb-3">
          <CardTitle className="font-serif text-lg">
            Money Circulation Bonus (MCB)
          </CardTitle>
          <div className="flex flex-wrap gap-1 mt-1">
            {["Super 9 Bonus", "Level 2 Power Team Bonus", "Super Group Bonus", "Generation 2 Bonus (Gen-2)"].map(alias => (
              <Badge key={alias} variant="outline" className="text-xs text-purple-700 border-purple-200 bg-purple-50">{alias}</Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg bg-purple-50 border border-purple-200 p-4 space-y-2">
            <p className="font-semibold text-purple-900 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              Trigger: Every 9 PMRPs on Level 2 — initial purchases AND monthly renewals
            </p>
            <p className="text-sm text-purple-700 leading-relaxed">
              Every time 9 PMRP purchases or subscription renewals accumulate on your <strong>Level 2</strong>, 
              you earn an MCB. The counter is <strong>cumulative and never resets</strong> — it continues at 
              9, 18, 27, 36, 45… indefinitely for as long as active subscriptions flow through Level 2.
            </p>
          </div>
          <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-xs text-green-900 space-y-1">
            <p className="font-medium text-green-800">Monthly Renewal Example</p>
            <p className="leading-relaxed">
              If 18 Level 2 members purchase PMRP in March, your counter hits 18 — MCBs #1 and #2 are awarded. 
              Those same 18 members renew in April, counter reaches 36 — MCBs #3 and #4 awarded. Fully automatic, 
              every month they stay subscribed.
            </p>
          </div>
          <div className="rounded-lg bg-white border p-3 text-sm text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Store Analogy</p>
            <p className="text-xs leading-relaxed">
              Level 2 is your national market. Your franchise partners (Level 1 Pro Members) have their own 
              franchise partners (Level 2). Every 9 of those Level 2 active subscriptions earns you a national 
              growth bonus — rewarding you for building a sustainable, recurring revenue network.
            </p>
          </div>
          <p className="text-xs text-muted-foreground italic">
            Must be a Pro Member with at least 9 personally sponsored Level 1 Pro Members to qualify for MCB.
          </p>
        </CardContent>
      </Card>

      {/* Income Stream Note */}
      <Card className="border border-amber-200 bg-amber-50/40">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm text-amber-900 leading-relaxed">
            <strong className="text-amber-800">Important:</strong> Pro Member Bonuses (CLB &amp; MCB) are completely 
            separate from your Product Sales Commissions (PSC) and Pro Member Registration Commissions (PMRC). 
            They are their own income stream connected only to the sale of{" "}
            <strong className="text-amber-800">Pro Member Registration Products (PMRP)</strong>. The more PMRPs 
            your team sells and the more requirements you meet, the more bonuses you earn.
          </p>
        </CardContent>
      </Card>

      {/* Bonus History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-purple-500" />
            Pro Member Bonus History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : bonusCommissions.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Gift className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">No Pro Member Bonuses earned yet.</p>
              <p className="text-sm text-muted-foreground">
                Bonuses are awarded every 9 Pro Member Registrations on Levels 1 &amp; 2.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {bonusCommissions.map(c => <BonusRow key={c.id} c={c} />)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
