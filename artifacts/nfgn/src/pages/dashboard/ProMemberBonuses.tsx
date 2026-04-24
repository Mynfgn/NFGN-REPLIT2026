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
                (PSC) and Pro Member Registration Commissions (PMRC). There are two bonuses — CLB and MCB — 
                and they have <strong className="text-foreground">very different rules</strong>. CLB is one-time. 
                MCB is recurring. Both are triggered by <strong className="text-foreground">Pro Member Registration Products (PMRP)</strong>.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Think of it this way:</strong> Registering a{" "}
                <strong className="text-foreground">Pro Member</strong> is like selling someone a{" "}
                <strong className="text-foreground">franchise store</strong> — they are now a business partner opening their 
                own store in another region or city. The CLB rewards you for opening your first 9 qualified franchise stores. 
                The MCB rewards you continuously every time your franchise partners' stores collectively hit 7 new registrations on Level 2.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* UPM Policy */}
      <Card className="border-l-4 border-l-amber-400 bg-amber-50/40">
        <CardHeader className="pb-2">
          <CardTitle className="font-serif text-base flex items-center gap-2 text-amber-800">
            Unqualified Pro Member (UPM) Policy
            <Badge className="bg-amber-500 text-white text-xs">IMPORTANT</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-amber-900 leading-relaxed">
          <p>
            A <strong>Pro Member</strong> who has not yet reached <strong>150 CV</strong> in cumulative Product CV 
            (PCV) is classified as an <strong>Unqualified Pro Member (UPM)</strong>. UPMs are recognized as Pro 
            Members and can participate in the NFGN network, but they do <strong>not</strong> count toward the CLB, 
            MCB, or Business Performance Package (BPP) thresholds.
          </p>
          <p>
            To become a <strong>Qualified Pro Member</strong>, a member must accumulate a minimum of{" "}
            <strong>150 CV</strong> in total product purchases. UPMs can top up their CV at any time by purchasing 
            additional NFGN products.
          </p>
          <div className="rounded-lg bg-white/70 border border-amber-200 p-3 text-xs space-y-1">
            <p className="font-semibold text-amber-800">Summary</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>UPM = Pro Member with total PCV &lt; 150 CV</li>
              <li>UPMs do NOT count toward your CLB or MCB headcount</li>
              <li>To qualify: accumulate ≥ 150 PCV through product purchases (can be spread across multiple orders)</li>
              <li>Your dashboard tracker will show UPM slots in amber — upgrade them by purchasing products</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* CLB */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            Core Leadership Bonus (CLB)
            <Badge className="bg-blue-600 text-white text-xs">ONE-TIME</Badge>
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
              Trigger: First 9 qualified Level 1 Pro Members — within your first 90 days as a Pro Member
            </p>
            <p className="text-sm text-blue-700 leading-relaxed">
              The CLB is paid <strong>exactly once</strong>. It is awarded when you have 9 <strong>qualified</strong> Level 1 
              Pro Members (each with ≥ 150 PCV) within the first 90 days of your own Pro Member activation date.{" "}
              <strong>Unqualified Pro Members (UPM) do not count.</strong> If you do not reach 9 qualified Level 1 
              members within that 90-day window, the CLB opportunity is forfeited.{" "}
              <strong>There is no second chance and no recurring payout for CLB.</strong>
            </p>
          </div>
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 space-y-1">
            <p className="font-medium text-amber-800">Important — One-Time Only</p>
            <p className="leading-relaxed">
              CLB is NOT a recurring bonus. It fires once when 9 qualified Level 1 Pro Members are reached and never again. 
              Once you have received your CLB, focus on building your Core Leadership Group (9 qualified Level 1 Pro Members) 
              to qualify for the recurring MCB.
            </p>
          </div>
          <div className="rounded-lg bg-white border p-3 text-sm text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Store Analogy</p>
            <p className="text-xs leading-relaxed">
              The CLB is your grand opening bonus. When you open your first 9 fully operational franchise partner stores 
              (qualified Level 1 Pro Members with ≥ 150 PCV) within your first 90 days, NFGN rewards you with a one-time 
              cash bonus for establishing your Core Leadership Group. After that, the recurring MCB takes over.
            </p>
          </div>
          <p className="text-xs text-muted-foreground italic">
            Qualification: Must be a Pro Member. Must have 9 qualified Level 1 Pro Members (each ≥ 150 PCV cumulative) 
            within 90 days of your Pro Member activation date. UPMs do not count.
          </p>
        </CardContent>
      </Card>

      {/* MCB */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader className="pb-3">
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            Money Circulation Bonus (MCB)
            <Badge className="bg-purple-600 text-white text-xs">RECURRING</Badge>
          </CardTitle>
          <div className="flex flex-wrap gap-1 mt-1">
            {["Super 7 Bonus", "Level 2 Power Team Bonus", "Super Group Bonus", "Generation 2 Bonus (Gen-2)"].map(alias => (
              <Badge key={alias} variant="outline" className="text-xs text-purple-700 border-purple-200 bg-purple-50">{alias}</Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg bg-purple-50 border border-purple-200 p-4 space-y-2">
            <p className="font-semibold text-purple-900 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              Trigger: Every 7 PMRP purchases on Level 2 — recurring monthly — counts initial + renewals
            </p>
            <p className="text-sm text-purple-700 leading-relaxed">
              The MCB is a <strong>recurring bonus</strong> paid to the <strong>Qualifying Upline Sponsor</strong> — 
              you, the Level 2 upline Pro Member — every time 7 PMRP purchases (initial registrations or monthly 
              subscription renewals) accumulate on your Level 2. It fires at 7, 14, 21, 28, 35… and continues 
              indefinitely for as long as your team keeps purchasing.
            </p>
          </div>

          {/* Qualifying Upline Sponsor explanation */}
          <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-3 text-xs text-indigo-900 space-y-1">
            <p className="font-medium text-indigo-800">Who is the Qualifying Upline Sponsor?</p>
            <p className="leading-relaxed">
              The <strong>Qualifying Upline Sponsor</strong> is the Pro Member who sits two levels above the 
              buyer in the NFGN genealogy tree — i.e., the sponsor of the buyer's direct sponsor. To qualify 
              for MCB, this upline Pro Member must have at least <strong>9 qualified Level 1 Pro Members</strong>{" "}
              (each with ≥ 150 PCV) as their Core Leadership Group.{" "}
              <strong>UPMs do not count toward this requirement.</strong> If they do not have 9 qualified Level 1 
              Pro Members, the MCB is not awarded even if the Level 2 PMRP count reaches the trigger.
            </p>
          </div>

          <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-xs text-green-900 space-y-1">
            <p className="font-medium text-green-800">Recurring Monthly Example</p>
            <p className="leading-relaxed">
              March: 7 Level 2 members buy PMRP → MCB #1 awarded. April: those same 7 members renew → 
              MCB #2 awarded. May: 7 more new members join on Level 2 → MCB #3 awarded. The counter is 
              cumulative and never resets. Every qualifying purchase or renewal on Level 2 moves the counter forward.
            </p>
          </div>
          <div className="rounded-lg bg-white border p-3 text-sm text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Store Analogy</p>
            <p className="text-xs leading-relaxed">
              Level 2 is your national expansion market. Your franchise partners (Level 1 Pro Members) are opening 
              their own franchise partner stores (Level 2). Every 7 new registrations or renewals at Level 2 earns 
              you a national growth bonus — rewarding you for building a sustainable, active network across two levels.
            </p>
          </div>
          <p className="text-xs text-muted-foreground italic">
            Qualification: Must be a Pro Member (Qualifying Upline Sponsor) with at least 9 qualified Level 1 
            Pro Members (each ≥ 150 PCV — UPMs do not count). MCB is issued once per qualifying increment of 7 Level 2 purchases.
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
                Bonuses are awarded at 9 qualified Level 1 (CLB) and every 7 Level 2 Pro Package sales (MCB).
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
