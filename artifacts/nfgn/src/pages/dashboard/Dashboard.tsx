import { useState, useEffect } from "react";
import { useGetMemberDashboard, useGetMemberAnalytics, useGetMe } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Wallet, Users, ShoppingBag, ArrowUpRight, TrendingUp, MapPin, Star, CheckCircle2, AlertCircle, BarChart3, Link2, Copy, Check, ExternalLink, DollarSign, Sparkles, ShoppingCart } from "lucide-react";
import { MemberMapCard } from "@/components/dashboard/MemberMapCard";
import { customFetch } from "@/lib/custom-fetch";
import { resolveImageSrc } from "@/lib/image";
import { Link } from "wouter";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";
import { commissionTypeLabel } from "@/lib/labels";

const BRAND_GOLD = "#C9A84C";
const BRAND_GREEN = "#2D6A4F";

type StatCardColor = "gold" | "green-dark" | "green-light" | "default";

const STAT_CARD_STYLES: Record<StatCardColor, {
  border: string; bg: string; iconColor: string; valueColor: string; subColor: string;
}> = {
  "green-dark": {
    border: "border-l-4",
    bg: "bg-gradient-to-br from-[#1a4a36] to-[#2D6A4F]",
    iconColor: "text-[#74c69d]",
    valueColor: "text-white",
    subColor: "text-[#b7e4c7]",
  },
  "green-light": {
    border: "border-l-4 border-l-[#52b788]",
    bg: "bg-gradient-to-br from-[#d8f3dc] to-[#b7e4c7]",
    iconColor: "text-[#2D6A4F]",
    valueColor: "text-[#1b4332]",
    subColor: "text-[#40916c]",
  },
  gold: {
    border: "border-l-4 border-l-primary",
    bg: "",
    iconColor: "text-primary",
    valueColor: "text-foreground",
    subColor: "text-muted-foreground",
  },
  default: {
    border: "",
    bg: "",
    iconColor: "text-muted-foreground",
    valueColor: "text-foreground",
    subColor: "text-muted-foreground",
  },
};

function StatCard({ title, value, sub, icon: Icon, accent, color = "default" }: {
  title: string; value: string; sub: string; icon: any; accent?: boolean; color?: StatCardColor;
}) {
  const scheme = accent && color === "default" ? STAT_CARD_STYLES["gold"] : STAT_CARD_STYLES[color];
  return (
    <Card className={`${scheme.border} ${scheme.bg} overflow-hidden`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className={`text-sm font-medium ${color === "green-dark" ? "text-[#b7e4c7]" : "text-muted-foreground"}`}>{title}</CardTitle>
        <Icon className={`h-4 w-4 ${scheme.iconColor}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${scheme.valueColor}`}>{value}</div>
        <p className={`text-xs mt-1 ${scheme.subColor}`}>{sub}</p>
      </CardContent>
    </Card>
  );
}

function CVCard({ pv, gv, required }: { pv: number; gv: number; required: number }) {
  const pvPercent = Math.min(100, Math.round((pv / required) * 100));
  const maintained = pv >= required;

  return (
    <Card className="border-l-4 border-l-green-500">
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-green-600" />
          Volume This Month
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-xl font-bold text-primary">{pv} PCV</div>
            <div className="text-xs text-muted-foreground">PCV — Personal Commissionable Volume</div>
            <div className="text-xs text-muted-foreground mt-0.5">Also known as PV</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-xl font-bold text-green-600">{gv} GCV</div>
            <div className="text-xs text-muted-foreground">GCV — Group Commissionable Volume</div>
            <div className="text-xs text-muted-foreground mt-0.5">Also known as GV</div>
            <div className="text-xs font-semibold text-amber-600 mt-1.5">⭐ Pro Members only earn from GCV</div>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Monthly maintenance ({required} PCV required)</span>
            <span className={maintained ? "text-green-600 font-semibold" : "text-yellow-600 font-semibold"}>
              {pv} / {required} PCV
            </span>
          </div>
          <Progress value={pvPercent} className="h-2" />
          <p className={`text-xs mt-1.5 flex items-center gap-1 ${maintained ? "text-green-600" : "text-yellow-600"}`}>
            {maintained
              ? <><CheckCircle2 className="h-3 w-3" /> Pro Member status maintained</>
              : <><AlertCircle className="h-3 w-3" /> Need {required - pv} more PCV to maintain Pro status</>
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function PowerSquadBonusCard({ bonus }: { bonus: any }) {
  if (!bonus) return null;

  const {
    bonusTrigger,
    bonusAmount,
    bonusEnabled,
    level1ProMembers,
    level1Required,
    level1Qualified,
    level1Needed,
    level2Commissions,
    bonusesEarned,
    nextBonusAt,
    toNextBonus,
  } = bonus;

  const l1Percent = Math.min(100, Math.round((level1ProMembers / Math.max(level1Required, 1)) * 100));
  const l2Percent = Math.min(100, Math.round(((level2Commissions % bonusTrigger || (level2Commissions > 0 && level2Commissions % bonusTrigger === 0 ? bonusTrigger : 0)) / bonusTrigger) * 100));

  if (!bonusEnabled) {
    return (
      <Card className="border-l-4 border-l-muted-foreground">
        <CardHeader className="pb-3">
          <CardTitle className="font-serif text-base flex items-center gap-2">
            <Star className="h-4 w-4 text-muted-foreground" />
            Power Squad Bonus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">The Power Squad Bonus is currently disabled by admin.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-base flex items-center gap-2">
          <Star className="h-4 w-4 text-primary fill-primary" />
          Power Squad Bonus
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Earn <strong className="text-foreground">${bonusAmount}</strong> for every {bonusTrigger} Level 2 Pro Package purchases — requires {bonusTrigger} personally sponsored Level 1 Pro Members to qualify.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-2 bg-muted rounded-lg">
            <div className={`text-lg font-bold ${level1Qualified ? "text-green-600" : "text-primary"}`}>
              {level1ProMembers} / {level1Required}
            </div>
            <div className="text-xs text-muted-foreground">Level 1 Pro Members</div>
          </div>
          <div className="p-2 bg-muted rounded-lg">
            <div className="text-lg font-bold text-amber-600">{level2Commissions}</div>
            <div className="text-xs text-muted-foreground">Level 2 Pro Packages</div>
          </div>
          <div className="p-2 bg-muted rounded-lg">
            <div className="text-lg font-bold text-purple-600">{bonusesEarned}</div>
            <div className="text-xs text-muted-foreground">Bonuses Earned</div>
          </div>
        </div>

        {/* Level 1 Qualification */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Level 1 qualification ({level1Required} Pro Members required)</span>
            <span className={`font-semibold ${level1Qualified ? "text-green-600" : "text-amber-600"}`}>
              {level1ProMembers} / {level1Required}
            </span>
          </div>
          <Progress value={l1Percent} className="h-2" />
        </div>

        {/* Level 2 progress (only show if qualified) */}
        {level1Qualified && (
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">Level 2 Pro Packages toward next bonus</span>
              <span className="font-semibold">{level2Commissions % bonusTrigger || (level2Commissions > 0 && level2Commissions % bonusTrigger === 0 ? bonusTrigger : 0)} / {bonusTrigger}</span>
            </div>
            <Progress value={l2Percent} className="h-2" />
          </div>
        )}

        {/* Status message */}
        {!level1Qualified ? (
          <div className="p-3 rounded-lg border bg-amber-50 border-amber-200 text-amber-800 text-sm">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <strong>
                  {level1Needed === 1
                    ? "1 more Level 1 Pro Member needed to qualify"
                    : `${level1Needed} more Level 1 Pro Members needed to qualify`}
                </strong>
                <div className="text-xs mt-0.5">
                  Personally sponsor {level1Required} Pro Members to unlock the Power Squad Bonus.
                </div>
              </div>
            </div>
          </div>
        ) : toNextBonus === 0 ? (
          <div className="p-3 rounded-lg border bg-green-50 border-green-200 text-green-800 text-sm flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span><strong>Power Squad Bonus earned!</strong> Bonus #{bonusesEarned} of ${bonusAmount} has been credited to your wallet.</span>
          </div>
        ) : (
          <div className="p-3 rounded-lg border bg-green-50 border-green-200 text-green-800 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Qualified! {toNextBonus} more Level 2 Pro Package {toNextBonus === 1 ? "sale" : "sales"} until your next ${bonusAmount} bonus.</strong>
                {bonusesEarned > 0 && (
                  <div className="text-xs mt-0.5">You've earned {bonusesEarned} Power Squad {bonusesEarned === 1 ? "Bonus" : "Bonuses"} so far.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PowerSquadBonusTracker({ bonus }: { bonus: any }) {
  const [showCongrats, setShowCongrats] = useState(false);
  const [congratsShown, setCongratsShown] = useState(() => {
    try { return sessionStorage.getItem("clb_congrats_shown") === "1"; } catch { return false; }
  });

  const clbTrigger: number       = bonus?.clbTrigger ?? 9;
  const clbAmount: number        = bonus?.clbAmount ?? 100;
  const clbEnabled: boolean      = bonus?.clbEnabled ?? true;
  const clbEarned: number        = bonus?.clbEarned ?? 0;
  const mcbTrigger: number       = bonus?.mcbTrigger ?? 9;
  const mcbAmount: number        = bonus?.mcbAmount ?? 200;
  const mcbEnabled: boolean      = bonus?.mcbEnabled ?? true;
  const mcbEarned: number        = bonus?.mcbEarned ?? 0;
  const level1ProMembers: number = bonus?.level1ProMembers ?? 0;
  const level2Commissions: number = bonus?.level2Commissions ?? 0;
  const toNextMcb: number        = bonus?.toNextMcb ?? mcbTrigger;

  // MCB is only qualified when L1 requirement is fully met
  const mcbQualified: boolean = level1ProMembers >= mcbTrigger;

  useEffect(() => {
    if (!congratsShown && clbEarned > 0) {
      setShowCongrats(true);
      setCongratsShown(true);
      try { sessionStorage.setItem("clb_congrats_shown", "1"); } catch {}
    }
  }, [clbEarned, congratsShown]);

  if (!bonus || (!clbEnabled && !mcbEnabled)) return null;

  const iconUrl = `${import.meta.env.BASE_URL}pro-member-icon.jpeg`;
  const l1Filled = Math.min(level1ProMembers, clbTrigger);
  const remaining = Math.max(0, clbTrigger - l1Filled);
  const l2Progress = level2Commissions % mcbTrigger;
  const l2BarFill = mcbQualified
    ? (l2Progress === 0 && level2Commissions > 0 ? mcbTrigger : l2Progress)
    : 0;
  const l1NeedForMcb = Math.max(0, mcbTrigger - level1ProMembers);

  return (
    <>
      <Card className="border-2 border-blue-200 overflow-hidden">
        {/* Dual-tone header band */}
        <div className="h-1 w-full" style={{ background: "linear-gradient(to right, #3b82f6 50%, #f59e0b 50%)" }} />

        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="font-serif text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              Power Squad Bonus Tracker
              <Star className="h-4 w-4 text-amber-400 fill-amber-300" />
            </CardTitle>
            <div className="flex gap-1.5">
              {clbEarned > 0 && (
                <Badge className="bg-blue-500 hover:bg-blue-600 text-white text-xs">CLB Earned ✓</Badge>
              )}
              {mcbEarned > 0 && (
                <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-xs">
                  {mcbEarned} MCB {mcbEarned === 1 ? "Cycle" : "Cycles"}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 pt-0">

          {/* ── LEVEL 1 — CLB ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-blue-700 flex items-center gap-1">
                <Users className="h-3 w-3" />
                Level 1 — Core Leadership Bonus
              </span>
              <span className="font-bold text-blue-600">{l1Filled} / {clbTrigger}</span>
            </div>
            <div className="grid gap-1 w-full" style={{ gridTemplateColumns: `repeat(${clbTrigger}, 1fr)` }}>
              {Array.from({ length: clbTrigger }, (_, i) => {
                const filled = i < l1Filled;
                return (
                  <div
                    key={i}
                    className={`flex flex-col items-center justify-center aspect-square rounded-lg border-2 transition-all duration-500 overflow-hidden ${
                      filled
                        ? "border-blue-400 bg-white shadow-sm shadow-blue-100"
                        : "border-dashed border-gray-200 bg-gray-50"
                    }`}
                  >
                    {filled ? (
                      <img src={iconUrl} alt="Pro Member" className="w-[75%] h-[75%] object-contain drop-shadow-sm" />
                    ) : (
                      <div className="flex flex-col items-center gap-0.5 opacity-25 w-full h-full justify-center">
                        <div className="w-[35%] aspect-square rounded-full bg-gray-400" />
                        <div className="w-[45%] h-[40%] rounded-t-full bg-gray-400" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {clbEarned > 0 ? (
                <span className="text-green-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 inline" /> CLB earned — ${clbAmount.toLocaleString()} credited to your wallet!
                </span>
              ) : remaining > 0 ? (
                <><strong className="text-blue-700">{remaining}</strong> more personally sponsored Pro {remaining === 1 ? "Member" : "Members"} to earn your <strong className="text-green-700">${clbAmount.toLocaleString()} CLB</strong></>
              ) : (
                <span className="text-green-700 font-semibold">CLB threshold reached — bonus pending.</span>
              )}
            </p>
          </div>

          {/* Divider with MCB lock state */}
          <div className="flex items-center gap-2">
            <div className="flex-1 border-t border-dashed" />
            {mcbQualified ? (
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 flex items-center gap-1">
                <CheckCircle2 className="h-2.5 w-2.5" /> MCB Activated
              </span>
            ) : (
              <span className="text-[10px] font-bold text-gray-400 bg-gray-100 border border-gray-200 rounded-full px-2 py-0.5 flex items-center gap-1">
                🔒 MCB Locked — {l1NeedForMcb} more L1 needed
              </span>
            )}
            <div className="flex-1 border-t border-dashed" />
          </div>

          {/* ── LEVEL 2 — MCB ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className={`font-semibold flex items-center gap-1 ${mcbQualified ? "text-amber-700" : "text-muted-foreground"}`}>
                <Star className="h-3 w-3 fill-current" />
                Level 2 — Money Circulation Bonus
              </span>
              <span className={`font-bold ${mcbQualified ? "text-amber-600" : "text-muted-foreground"}`}>
                {mcbQualified ? `${l2BarFill} / ${mcbTrigger}` : "Locked"}
              </span>
            </div>
            <div className={`grid gap-1 w-full ${!mcbQualified ? "opacity-35" : ""}`} style={{ gridTemplateColumns: `repeat(${mcbTrigger}, 1fr)` }}>
              {Array.from({ length: mcbTrigger }, (_, i) => {
                const filled = mcbQualified && i < l2BarFill;
                return (
                  <div
                    key={i}
                    className={`flex flex-col items-center justify-center aspect-square rounded-lg border-2 transition-all duration-500 overflow-hidden ${
                      filled
                        ? "border-amber-400 bg-amber-50 shadow-sm shadow-amber-100"
                        : "border-dashed border-gray-200 bg-gray-50"
                    }`}
                  >
                    {filled ? (
                      <img src={iconUrl} alt="L2 Sale" className="w-[75%] h-[75%] object-contain drop-shadow-sm" style={{ filter: "sepia(0.35) saturate(1.3)" }} />
                    ) : (
                      <div className="flex flex-col items-center gap-0.5 opacity-20 w-full h-full justify-center">
                        <div className="w-[35%] aspect-square rounded-full bg-gray-400" />
                        <div className="w-[45%] h-[40%] rounded-t-full bg-gray-400" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {!mcbQualified ? (
                <>Sponsor <strong className="text-blue-700">{l1NeedForMcb} more</strong> Level 1 Pro {l1NeedForMcb === 1 ? "Member" : "Members"} to unlock a <strong className="text-amber-700">${mcbAmount.toLocaleString()} recurring MCB</strong> per {mcbTrigger} Level 2 Pro Package sales.</>
              ) : toNextMcb === 0 ? (
                <span className="text-green-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 inline" /> MCB cycle complete — ${mcbAmount} credited! Next cycle starting.
                </span>
              ) : (
                <><strong className="text-amber-700">{toNextMcb}</strong> more Level 2 Pro Package {toNextMcb === 1 ? "sale" : "sales"} to earn your next <strong className="text-amber-700">${mcbAmount} MCB</strong>{mcbEarned > 0 && ` — ${mcbEarned} ${mcbEarned === 1 ? "cycle" : "cycles"} earned so far`}.</>
              )}
            </p>
          </div>

        </CardContent>
      </Card>

      {/* Congratulations Dialog */}
      <Dialog open={showCongrats} onOpenChange={setShowCongrats}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <div className="flex justify-center mb-3">
              <div className="grid grid-cols-3 gap-1.5">
                {Array.from({ length: clbTrigger }, (_, i) => (
                  <img key={i} src={iconUrl} alt="" className="h-10 w-10 object-contain" />
                ))}
              </div>
            </div>
            <DialogTitle className="text-2xl font-serif text-center">Congratulations! 🎉</DialogTitle>
            <DialogDescription className="text-center text-base text-foreground mt-2 leading-relaxed">
              You've personally sponsored{" "}
              <strong>{clbTrigger} Pro Members</strong> and earned your{" "}
              <strong className="text-green-700 text-lg">${clbAmount.toLocaleString()} Core Leadership Bonus!</strong>
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mt-1">
            Your CLB has been credited to your NFGN wallet. Keep growing your team — every {mcbTrigger} Level 2 Pro Package sales will now earn you a recurring ${mcbAmount} Money Circulation Bonus!
          </p>
          <Button
            onClick={() => setShowCongrats(false)}
            className="w-full mt-3 font-bold text-base text-black"
            style={{ background: "#C9A84C" }}
          >
            Keep Going! 💪
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

function FeaturedProductCard({ referralCode }: { referralCode: string }) {
  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    customFetch("/api/products?featured=true")
      .then(r => r.json())
      .then((data: any) => {
        const items: any[] = Array.isArray(data) ? data : (data?.products ?? []);
        const picks = items.filter(p => !p.isProPackage && p.status === "active");
        if (picks.length > 0) setProduct(picks[0]);
      })
      .catch(() => {});
  }, []);

  if (!product) return null;

  const shopHref = referralCode
    ? `/shop/${product.slug}?ref=${referralCode}`
    : `/shop/${product.slug}`;

  return (
    <div className="rounded-2xl overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-[#0a0a0a] via-[#1a1a0a] to-[#0a1a0a] text-white shadow-xl relative">
      {/* Glow accents */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-green-800/20 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row gap-0">
        {/* Product image */}
        {resolveImageSrc(product.image) ? (
          <div className="sm:w-64 h-52 sm:h-auto flex-shrink-0 overflow-hidden">
            <img
              src={resolveImageSrc(product.image)!}
              alt={product.name}
              className="w-full h-full object-cover opacity-90"
            />
          </div>
        ) : (
          <div className="sm:w-64 h-52 sm:h-auto flex-shrink-0 bg-primary/10 flex items-center justify-center">
            <ShoppingCart className="h-16 w-16 text-primary/40" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-6 flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Featured Product</span>
            </div>
            <h3 className="text-xl font-serif font-bold leading-tight text-white mb-2">{product.name}</h3>
            {product.description && (
              <p className="text-sm text-gray-300 line-clamp-3 leading-relaxed">{product.description}</p>
            )}
          </div>

          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-primary">${parseFloat(product.price).toFixed(2)}</span>
                {product.comparePrice && parseFloat(product.comparePrice) > parseFloat(product.price) && (
                  <span className="text-sm text-gray-400 line-through">${parseFloat(product.comparePrice).toFixed(2)}</span>
                )}
              </div>
              {product.cv > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">{product.cv} CV per unit</p>
              )}
            </div>
            <Link href={shopHref}>
              <Button
                className="font-bold px-6 py-2.5 rounded-xl text-black shadow-lg hover:shadow-primary/30 transition-all"
                style={{ background: "#C9A84C" }}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Shop Now
              </Button>
            </Link>
          </div>

          {referralCode && (
            <p className="text-[10px] text-gray-500 leading-relaxed">
              Your referral code <strong className="text-primary">{referralCode}</strong> is pre-attached — anyone who purchases earns you a Referral Commission.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function MonthlySalesChart({ data }: { data: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Community Monthly Sales
        </CardTitle>
        <p className="text-xs text-muted-foreground">Sales $ and Commissionable Volume (CV / GCV) — last 12 months</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="sales" orientation="left" tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
            <YAxis yAxisId="cv" orientation="right" tick={{ fontSize: 11 }} tickFormatter={v => `${v} GCV`} />
            <Tooltip
              formatter={(value: any, name: string) => [
                name === "totalSales" ? `$${Number(value).toFixed(2)}` : `${value} GCV`,
                name === "totalSales" ? "Sales" : "GCV",
              ]}
            />
            <Legend formatter={v => v === "totalSales" ? "Sales ($)" : "GCV (Group Commissionable Volume)"} />
            <Bar yAxisId="sales" dataKey="totalSales" fill={BRAND_GOLD} radius={[3, 3, 0, 0]} />
            <Bar yAxisId="cv" dataKey="totalCV" fill={BRAND_GREEN} radius={[3, 3, 0, 0]} opacity={0.8} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function SalesByStateChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          Sales by Location
        </CardTitle>
        <p className="text-xs text-muted-foreground">Top states by community purchase volume</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart layout="vertical" data={data.slice(0, 8)} margin={{ top: 0, right: 30, bottom: 0, left: 60 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
            <YAxis type="category" dataKey="state" tick={{ fontSize: 11 }} width={55} />
            <Tooltip formatter={(v: any) => [`$${Number(v).toFixed(2)}`, "Sales"]} />
            <Bar dataKey="totalSales" fill={BRAND_GOLD} radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function AffiliateLinkCard({ referralLink, referralCode: codeFromData }: { referralLink: string; referralCode?: string }) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const affiliateUrl = (() => {
    try {
      const parsed = new URL(referralLink);
      return `${window.location.origin}${parsed.pathname}${parsed.search}`;
    } catch {
      return referralLink;
    }
  })();

  /* Use prop code if provided; otherwise extract from path /rep/CODE or ?ref= param */
  const referralCode = (codeFromData && codeFromData.trim()) ? codeFromData : (() => {
    try {
      const parsed = new URL(affiliateUrl);
      const fromParam = parsed.searchParams.get("ref");
      if (fromParam) return fromParam;
      const match = parsed.pathname.match(/\/rep\/(.+)/);
      return match?.[1] ?? "";
    } catch {
      return "";
    }
  })();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(affiliateUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    });
  };

  return (
    <Card className="border border-primary/30 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-base flex items-center gap-2">
          <Link2 className="h-4 w-4 text-primary" />
          Your Referral Tools
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">
          Share your code or link with prospects. When they join or shop through either, you earn commissions automatically.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Sponsor Referral Code — highlighted primary box ── */}
        {referralCode && (
          <div className="rounded-xl border-2 border-primary/40 bg-primary/8 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-black text-primary-foreground">#</span>
              </div>
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-wider">Your Sponsor Referral Code</p>
                <p className="text-xs text-muted-foreground">Give this code to anyone you personally sponsor</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xl font-black font-mono tracking-widest text-foreground bg-background border border-primary/30 rounded-lg px-4 py-2.5 select-all">
                {referralCode}
              </code>
              <Button
                size="sm"
                variant={copiedCode ? "default" : "outline"}
                className={`flex-shrink-0 gap-1.5 transition-all h-11 px-4 ${copiedCode ? "bg-green-600 hover:bg-green-700 border-green-600 text-white" : ""}`}
                onClick={handleCopyCode}
              >
                {copiedCode ? <><Check className="h-3.5 w-3.5" /> Copied!</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              New members enter this code in the <strong>"Personal Sponsor Referral Code"</strong> field when signing up.
            </p>
          </div>
        )}

        {/* ── Affiliate Page Preview ── */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Affiliate Page Preview</p>

          {/* Live iframe preview */}
          <div className="relative rounded-xl overflow-hidden border-2 border-primary/20 bg-muted" style={{ height: 240 }}>
            {/* Non-interactive scaled iframe */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "200%",
                height: "200%",
                transform: "scale(0.5)",
                transformOrigin: "top left",
                pointerEvents: "none",
              }}
            >
              <iframe
                src={`${import.meta.env.BASE_URL}rep/${referralCode}`}
                title="Affiliate page preview"
                style={{ width: "100%", height: "100%", border: "none", display: "block" }}
                scrolling="no"
              />
            </div>

            {/* Gradient fade at the bottom */}
            <div className="absolute inset-x-0 bottom-0 h-16 pointer-events-none" style={{ background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.92))" }} />

            {/* Open button overlay */}
            <div className="absolute bottom-2.5 right-2.5">
              <a href={affiliateUrl} target="_blank" rel="noopener noreferrer">
                <Button
                  size="sm"
                  className="gap-1.5 text-xs font-bold shadow-md text-black"
                  style={{ background: "#C9A84C" }}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open full page
                </Button>
              </a>
            </div>
          </div>

          {/* Link row + copy */}
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted border border-border/60">
            <span className="flex-1 text-xs font-mono text-foreground truncate select-all" title={affiliateUrl}>
              {affiliateUrl}
            </span>
            <Button
              size="sm"
              variant={copiedLink ? "default" : "outline"}
              className={`flex-shrink-0 gap-1.5 transition-all ${copiedLink ? "bg-green-600 hover:bg-green-700 border-green-600 text-white" : ""}`}
              onClick={handleCopyLink}
            >
              {copiedLink ? <><Check className="h-3.5 w-3.5" /> Copied!</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-1">
          {[
            { label: "Share on social media", sub: "Post your link on Facebook, Instagram & more" },
            { label: "Send via text or email", sub: "Message it directly to people you know" },
            { label: "Add to your bio", sub: "Put it in your profile link on any platform" },
          ].map(tip => (
            <div key={tip.label} className="p-2.5 rounded-md bg-background border border-border/40 text-center">
              <div className="text-xs font-semibold text-foreground">{tip.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5 leading-tight">{tip.sub}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function EarningsLineChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-green-600" />
          Monthly Commission Earnings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
            <Tooltip formatter={(v: any) => [`$${Number(v).toFixed(2)}`, "Commissions"]} />
            <Line type="monotone" dataKey="amount" stroke={BRAND_GOLD} strokeWidth={2} dot={{ r: 3, fill: BRAND_GOLD }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  const { data, isLoading } = useGetMemberDashboard();
  const { data: analytics, isLoading: analyticsLoading } = useGetMemberAnalytics();
  const { data: me } = useGetMe();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-serif font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (<Skeleton key={i} className="h-32 w-full" />))}
        </div>
      </div>
    );
  }

  const monthlySales = analytics?.monthlySales ?? [];
  const salesByState = analytics?.salesByState ?? [];
  const pv = analytics?.personalVolume ?? 0;
  const gv = analytics?.groupVolume ?? 0;
  const required = analytics?.cvMaintenanceRequired ?? 100;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Welcome Back{me?.firstName ? `, ${me.firstName}` : ""}!</h1>
          <p className="text-muted-foreground">Let's make some money together. Here's your business at a glance.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Wallet Balance" value={`$${(data?.walletBalance ?? 0).toFixed(2)}`} sub="Available for withdrawal" icon={Wallet} color="green-dark" />
        <StatCard title="Total Earnings" value={`$${(data?.totalEarnings ?? 0).toFixed(2)}`} sub="Lifetime commissions" icon={ArrowUpRight} color="green-light" />
        <StatCard title="Team Size" value={String(data?.teamSize ?? 0)} sub={`${data?.personallyEnrolled ?? 0} personally enrolled`} icon={Users} />
        <StatCard title="Members" value={String(data?.retailCustomers ?? 0)} sub="Active buyers" icon={ShoppingBag} />
      </div>

      {/* Referral Tools — placed above trackers */}
      {data?.referralLink && (
        <div className="space-y-2">
          <h2 className="text-lg font-serif font-bold text-foreground flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Your Referral Tools
          </h2>
          <AffiliateLinkCard referralLink={data.referralLink} referralCode={(data as any)?.referralCode ?? ""} />
        </div>
      )}

      {/* Power Squad Bonus Tracker — CLB + MCB combined */}
      <PowerSquadBonusTracker bonus={analytics?.powerSquadBonus} />

      {/* Featured Product */}
      <FeaturedProductCard referralCode={(data as any)?.referralCode ?? ""} />

      {/* Community World Map */}
      <MemberMapCard title="Your Community Map" />

      {/* PV/GV Volume + Power Squad Bonus */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CVCard pv={pv} gv={gv} required={required} />
        <PowerSquadBonusCard bonus={analytics?.powerSquadBonus} />
      </div>

      {/* Monthly Sales Chart + Earnings Line Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlySalesChart data={monthlySales} />
        <EarningsLineChart data={data?.earningsByMonth ?? []} />
      </div>

      {/* Sales by Location */}
      {salesByState.length > 0 && (
        <SalesByStateChart data={salesByState} />
      )}

      {/* Recent Orders + Commissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.recentOrders && data.recentOrders.length > 0 ? (
              <div className="space-y-4">
                {data.recentOrders.map(order => (
                  <div key={order.id} className="flex justify-between items-center border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <div className="font-medium">{order.orderNumber}</div>
                      <div className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">${order.total.toFixed(2)}</div>
                      <div className={`text-xs capitalize ${order.status === "completed" ? "text-green-600" : "text-primary"}`}>{order.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent orders.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Recent Commissions</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.recentCommissions && data.recentCommissions.length > 0 ? (
              <div className="space-y-4">
                {data.recentCommissions.map(comm => (
                  <div key={comm.id} className="flex justify-between items-center border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <div className="font-medium">{comm.fromUserName}</div>
                      <div className="text-sm text-muted-foreground">{commissionTypeLabel(comm.type ?? "referral")}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">+${comm.commissionAmount.toFixed(2)}</div>
                      <Badge variant={comm.status === "approved" ? "default" : "secondary"} className="text-xs">
                        {comm.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent commissions.</p>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
