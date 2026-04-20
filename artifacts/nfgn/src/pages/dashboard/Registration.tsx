import { useAuth } from "@/hooks/use-auth";
import { useGetMe, useListProducts } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  UserPlus, Star, ShoppingBag, CheckCircle2, Gift, DollarSign,
  TrendingUp, Users, Percent, BadgeCheck, ArrowRight, Lock, Copy
} from "lucide-react";

const MEMBER_BENEFITS = [
  { icon: ShoppingBag, title: "Shop at Member Prices", desc: "Access exclusive pricing on all naturopathic wellness products." },
  { icon: Gift, title: "Free to Join", desc: "No registration fee required. Become a member at no cost." },
  { icon: DollarSign, title: "Referral Commissions", desc: "Earn 20% commission every time someone you refer makes a purchase." },
  { icon: Users, title: "Build Your Community", desc: "Invite friends and family through your personal affiliate link." },
  { icon: BadgeCheck, title: "Verified Member Status", desc: "Get your verified NFGN member badge and referral page." },
];

const PRO_BENEFITS = [
  { icon: Percent, title: "Product Sales Commission (PSC)", desc: "Earn commissions on every regular product or service purchase made within your downline group." },
  { icon: TrendingUp, title: "Level 2 Power Bonus (22%)", desc: "Earn 22% commissions on Pro Package purchases two levels deep in your team." },
  { icon: Star, title: "Priority Payout Processing", desc: "Pro Members get priority when requesting fund withdrawals." },
  { icon: Users, title: "Team Volume Bonuses", desc: "Earn on your entire community's Group Volume (GV), not just personal purchases." },
  { icon: Lock, title: "Exclusive Pro Products", desc: "Access to Pro-only wellness bundles and consultation packages." },
  { icon: Gift, title: "Pro Package Upline Bonuses", desc: "Every Pro Package you sell earns your sponsor and their upline commission." },
];

function BenefitItem({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</div>
      </div>
    </div>
  );
}

export function RegistrationPage() {
  const { data: me } = useGetMe();
  const { data: proProducts } = useListProducts({ limit: 10 });

  const proPackages = proProducts?.products?.filter((p: any) => p.isProPackage) ?? [];
  const referralLink = me?.referralCode
    ? `${window.location.origin}/join?ref=${me.referralCode}`
    : `${window.location.origin}/join`;

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-serif font-bold">Register a New Member</h1>
        <p className="text-muted-foreground mt-1">
          Share your affiliate link to invite new members, or send them directly to a product registration page.
          Your referral code is automatically embedded when you use your link.
        </p>
      </div>

      {/* Sponsor Code + Affiliate Link */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sponsor Referral Code */}
        <Card className="border-2 border-primary/50 bg-primary/5">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-black text-primary-foreground">#</span>
              </div>
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-wider">Your Sponsor Referral Code</p>
                <p className="text-xs text-muted-foreground">Give to prospects — required at registration</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-2xl font-black font-mono tracking-widest text-foreground bg-background border-2 border-primary/30 rounded-lg px-4 py-3 select-all">
                {me?.referralCode ?? "—"}
              </code>
              {me?.referralCode && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-shrink-0 h-12 px-4 gap-1.5"
                  onClick={() => {
                    if (me?.referralCode) navigator.clipboard.writeText(me.referralCode);
                  }}
                >
                  <Copy className="h-3.5 w-3.5" /> Copy
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              When your prospect registers at the Join page, they enter this exact code in the <strong>"Personal Sponsor Referral Code"</strong> field.
            </p>
          </CardContent>
        </Card>

        {/* Affiliate Link */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-5 pb-5 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <UserPlus className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">Your Referral Invite Link</span>
              </div>
              <code className="text-xs bg-background border rounded px-2 py-1.5 font-mono text-foreground block truncate">
                {referralLink}
              </code>
              <p className="text-xs text-muted-foreground mt-1.5">
                Your referral code is pre-filled automatically when prospects open this link.
              </p>
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => navigator.clipboard.writeText(referralLink)}
              >
                <Copy className="h-3.5 w-3.5" /> Copy Link
              </Button>
              <Button size="sm" asChild>
                <Link href="/join">Preview <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Important Note */}
      <Card className="border-amber-300 bg-amber-50">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <Lock className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <strong>Registration Required Before Checkout —</strong>{" "}
              Guest shoppers cannot complete a purchase without first registering as a Member or Pro Member. 
              Make sure your referrals register through your link before they add products to their cart.
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Member Card */}
        <Card className="border-2 border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <Users className="h-5 w-5" />
                Member
              </CardTitle>
              <Badge variant="secondary" className="text-sm font-bold">FREE</Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A <strong>Member</strong> is anyone who registers on the NFGN platform at no cost. 
              Members can shop for naturopathic wellness products, share their referral link, 
              and earn basic referral commissions when their contacts make purchases.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {MEMBER_BENEFITS.map(b => <BenefitItem key={b.title} {...b} />)}
            </div>
            <div className="pt-2 border-t space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>Referral commission: <strong>20%</strong> on any direct purchase</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>No monthly fees or maintenance requirements</span>
              </div>
            </div>
            <Button className="w-full" variant="outline" asChild>
              <a href={referralLink} target="_blank" rel="noopener noreferrer">
                <UserPlus className="mr-2 h-4 w-4" />
                Invite as Member
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Pro Member Card */}
        <Card className="border-2 border-primary shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <Star className="h-5 w-5 text-primary fill-primary" />
                Pro Member
              </CardTitle>
              <Badge className="text-sm font-bold">RECOMMENDED</Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A <strong>Pro Member</strong> (also called a Pro Consultant) is a fully activated business 
              builder who has purchased the Pro Member Registration Package. Pro Members unlock the full 
              3-tier compensation plan, team bonuses, and priority payouts.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {PRO_BENEFITS.map(b => <BenefitItem key={b.title} {...b} />)}
            </div>
            <div className="pt-2 border-t space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                <span>Requires: <strong>Pro Member Registration Package</strong></span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                <span>Maintain <strong>100 CV/month</strong> to keep Pro Member status</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pro Member Packages */}
      {proPackages.length > 0 && (
        <div>
          <h2 className="text-xl font-serif font-bold mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-primary fill-primary" />
            Pro Member Registration Products
          </h2>
          <p className="text-sm text-muted-foreground mb-5">
            To activate as a Pro Member, your referral must purchase one of these packages through your link. 
            Once purchased, they'll be automatically upgraded and you'll earn your Level Commission bonus.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {proPackages.map((p: any) => (
              <Card key={p.id} className="border border-primary/30 hover:border-primary/60 transition-colors">
                {p.image && (
                  <div className="aspect-video rounded-t-lg overflow-hidden">
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <CardContent className="pt-4 pb-4 space-y-3">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm leading-tight">{p.name}</h3>
                      <Badge variant="outline" className="text-xs flex-shrink-0 border-primary text-primary">Pro</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-bold text-primary">${p.price?.toFixed(2)}</span>
                      <span className="text-xs text-muted-foreground ml-1">{p.cv} CV</span>
                    </div>
                    <Button size="sm" asChild>
                      <Link href={`/shop`}>
                        Shop Now
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Compensation Plan Summary */}
      <Card className="bg-muted/40">
        <CardHeader className="pb-2">
          <CardTitle className="font-serif text-lg">Compensation Plan Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-semibold">Commission Type</th>
                  <th className="text-left py-2 font-semibold">Who Earns</th>
                  <th className="text-left py-2 font-semibold">Trigger</th>
                  <th className="text-right py-2 font-semibold">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y text-muted-foreground">
                <tr>
                  <td className="py-2 font-medium text-foreground">Referral</td>
                  <td className="py-2">All Members</td>
                  <td className="py-2">Any purchase by direct referral</td>
                  <td className="py-2 text-right font-bold text-green-600">20%</td>
                </tr>
                <tr>
                  <td className="py-2 font-medium text-foreground">Sales</td>
                  <td className="py-2">Pro Members only</td>
                  <td className="py-2">Regular product purchase by direct referral</td>
                  <td className="py-2 text-right font-bold text-green-600">12%</td>
                </tr>
                <tr>
                  <td className="py-2 font-medium text-foreground">Level 1 Bonus (PMRC)</td>
                  <td className="py-2">Pro Members only</td>
                  <td className="py-2">Pro Package purchased by Level 1 member</td>
                  <td className="py-2 text-right font-bold text-green-600">12%</td>
                </tr>
                <tr>
                  <td className="py-2 font-medium text-foreground">Level 2 Power Bonus (PMRC)</td>
                  <td className="py-2">Pro Members only</td>
                  <td className="py-2">Pro Package purchased by Level 2 member</td>
                  <td className="py-2 text-right font-bold text-primary text-base">22%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
