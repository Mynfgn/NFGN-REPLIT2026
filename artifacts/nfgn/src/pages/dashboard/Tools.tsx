import { useState } from "react";
import { useGetMe } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Link2, Copy, Check, ExternalLink, Share2, Mail, MessageSquare,
  Facebook, Instagram, QrCode, Package, ChevronRight, Sparkles,
  TrendingUp, Users, Star, DollarSign, Award, Zap, BarChart3,
  CheckCircle2, ArrowRight, Gift, Shield,
} from "lucide-react";

const BRAND_GOLD = "#C9A84C";
const BASE_URL = window.location.origin;

const PRODUCTS = [
  { name: "IGNITE Herbal Cleanse", slug: "ignite-herbal-cleanse", price: "$79.99", cv: 80 },
  { name: "IGNITE XL", slug: "ignite-xl", price: "$64.99", cv: 65 },
  { name: "NFGN Pro Pack", slug: "nfgn-pro-pack", price: "$149.99", cv: 150 },
];

const EMAIL_TEMPLATE = (name: string, refLink: string) => `Subject: Discover NFGN — Naturopathic Wellness That Pays

Hi [First Name],

I've been using New Face Global Network's wellness products and I'm loving the results.

They have a complete line of naturopathic supplements designed for real people — and they offer a generous referral program so you can earn while you share.

👉 Shop & Join here: ${refLink}

Use my personal link and I'll personally help you get started.

Looking forward to connecting!

${name}`;

const FB_TEMPLATE = (refLink: string) => `🌿 Excited to share something that's been a game-changer for my health journey!

I've been using @NFGN's naturopathic wellness products and the results speak for themselves. Clean ingredients, real results.

And the best part? You can earn while you share! ✨

🔗 Check it out: ${refLink}

Drop a 🌱 below if you're curious!`;

const IG_TEMPLATE = (refLink: string) => `Wellness that works — naturally 🌿

I've been on my NFGN journey and couldn't be happier. If you're looking for clean, naturopathic supplements backed by a generous rewards program, this is it.

Link in bio 👆 or visit: ${refLink}

#NFGN #NaturopathicWellness #HealthyLiving #WellnessJourney #CleanSupplements #EarnWhileYouShare`;

const SMS_TEMPLATE = (refLink: string) => `Hey! Check out NFGN — naturopathic wellness products I've been loving. You can also earn by sharing! Here's my link: ${refLink}`;

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="gap-1"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied!" : "Copy"}
    </Button>
  );
}

function TemplateCard({ title, icon: Icon, content, color }: { title: string; icon: any; content: string; color: string }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <div className="h-7 w-7 rounded-md flex items-center justify-center" style={{ background: `${color}18`, color }}>
            <Icon className="h-4 w-4" />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <pre className="text-xs bg-muted p-3 rounded-lg whitespace-pre-wrap break-words leading-relaxed font-sans border max-h-48 overflow-y-auto">
          {content}
        </pre>
        <CopyBtn text={content} />
      </CardContent>
    </Card>
  );
}

function ProductQRCard({ p, productLink, qrUrl, qrDownload, refCode }: {
  p: { name: string; slug: string; price: string; cv: number };
  productLink: string;
  qrUrl: string;
  qrDownload: string;
  refCode: string;
}) {
  const [showQR, setShowQR] = useState(false);
  return (
    <Card>
      <CardContent className="pt-5 flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{p.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground">{p.price}</span>
              <Badge variant="outline" className="text-xs">{p.cv} CV</Badge>
            </div>
            <p className="text-xs font-mono text-muted-foreground truncate mt-1">{productLink}</p>
          </div>
          <div className="flex gap-1.5 flex-shrink-0 flex-wrap justify-end">
            <CopyBtn text={productLink} />
            <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => setShowQR(s => !s)}>
              <QrCode className="h-3.5 w-3.5" />
              {showQR ? "Hide QR" : "QR Code"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => window.open(productLink, "_blank")}>
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {showQR && (
          <div className="border-t pt-4 flex flex-col sm:flex-row items-center gap-6">
            <div className="border rounded-xl p-3 bg-white shadow-sm flex-shrink-0">
              <img src={qrUrl} alt={`QR code for ${p.name}`} width={160} height={160} className="rounded" />
            </div>
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <p className="font-semibold text-sm">{p.name} — Product QR Code</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                When scanned, this QR code takes customers directly to the shop with your referral code <code className="font-mono bg-muted px-1 rounded">{refCode}</code> pre-attached. Perfect for flyers, business cards, in-person demos, or social posts.
              </p>
              <div className="flex gap-2 flex-wrap justify-center sm:justify-start">
                <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => window.open(qrDownload, "_blank")}>
                  <ExternalLink className="h-3 w-3" /> Download Full Size
                </Button>
                <CopyBtn text={productLink} />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ToolsPage() {
  const { data: user } = useGetMe();
  const refCode = user?.referralCode ?? "";
  const refLink = `${BASE_URL}/join?ref=${refCode}`;
  const displayName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">Tools</h1>
        <p className="text-muted-foreground">Marketing tools and resources to grow your network</p>
      </div>

      <Tabs defaultValue="link">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="link">Affiliate Link</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="email">Email Templates</TabsTrigger>
          <TabsTrigger value="products">Product Links</TabsTrigger>
          <TabsTrigger value="comp-plan">Comp Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="link" className="space-y-4">
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <Link2 className="h-5 w-5 text-primary" />
                Your Referral Link
              </CardTitle>
              <CardDescription>Share this link to earn commissions when people join or shop</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border">
                <span className="text-sm flex-1 break-all font-mono">{refLink}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <CopyBtn text={refLink} />
                <Button variant="outline" size="sm" className="gap-1" onClick={() => window.open(refLink, "_blank")}>
                  <ExternalLink className="h-3.5 w-3.5" />
                  Preview
                </Button>
                {navigator.share && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => navigator.share({ title: "Join NFGN", url: refLink })}
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Share
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <QrCode className="h-5 w-5 text-primary" />
                QR Code
              </CardTitle>
              <CardDescription>Print or share this QR code for in-person events</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="border rounded-xl p-4 bg-white">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(refLink)}&color=0a0a0a&bgcolor=ffffff`}
                  alt="Referral QR Code"
                  width={200}
                  height={200}
                  className="rounded"
                />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium">Scan to join via {displayName}</p>
                <p className="text-xs text-muted-foreground font-mono">Ref: {refCode}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => window.open(`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(refLink)}`, "_blank")}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Download Full Size
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Sharing Tips</p>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1.5 list-none">
                    <li className="flex items-start gap-2"><ChevronRight className="h-3.5 w-3.5 mt-0.5 text-primary flex-shrink-0" />Add your referral link to your social media bio</li>
                    <li className="flex items-start gap-2"><ChevronRight className="h-3.5 w-3.5 mt-0.5 text-primary flex-shrink-0" />Share personal results and testimonials — authenticity converts</li>
                    <li className="flex items-start gap-2"><ChevronRight className="h-3.5 w-3.5 mt-0.5 text-primary flex-shrink-0" />Print the QR code for business cards, flyers, and events</li>
                    <li className="flex items-start gap-2"><ChevronRight className="h-3.5 w-3.5 mt-0.5 text-primary flex-shrink-0" />Follow up within 24 hours of sharing for best results</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-4">
          <TemplateCard
            title="Facebook Post"
            icon={Facebook}
            color="#1877F2"
            content={FB_TEMPLATE(refLink)}
          />
          <TemplateCard
            title="Instagram Caption"
            icon={Instagram}
            color="#E1306C"
            content={IG_TEMPLATE(refLink)}
          />
          <TemplateCard
            title="SMS / Text Message"
            icon={MessageSquare}
            color="#22C55E"
            content={SMS_TEMPLATE(refLink)}
          />
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <TemplateCard
            title="Recruitment Email"
            icon={Mail}
            color={BRAND_GOLD}
            content={EMAIL_TEMPLATE(displayName, refLink)}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Email Best Practices</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                {[
                  "Personalize the greeting — use the recipient's real first name",
                  "Share your personal story or results in 1–2 sentences",
                  "Keep it short — under 150 words for best open rates",
                  "Follow up once after 3 days if no response",
                  "Never spam — only send to people you know",
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Badge variant="outline" className="text-xs mt-0.5 flex-shrink-0">{i + 1}</Badge>
                    {tip}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <p className="text-sm text-muted-foreground">Share individual product links or QR codes with your referral code pre-attached. Anyone who clicks or scans and purchases earns you a commission.</p>
          {PRODUCTS.map((p) => {
            const productLink = `${BASE_URL}/shop?ref=${refCode}&product=${p.slug}`;
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(productLink)}&color=0a0a0a&bgcolor=ffffff`;
            const qrDownload = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(productLink)}`;
            return (
              <ProductQRCard key={p.slug} p={p} productLink={productLink} qrUrl={qrUrl} qrDownload={qrDownload} refCode={refCode} />
            );
          })}
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="pt-4 pb-4 text-center text-sm text-muted-foreground">
              <Package className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              More products are available in your storefront. These are the most commonly promoted items.
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── COMP PLAN TAB ── */}
        <TabsContent value="comp-plan" className="space-y-6">

          {/* Hero Banner */}
          <div
            className="rounded-2xl p-6 text-white relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 60%, #2d1a00 100%)" }}
          >
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 50%, #C9A84C 0%, transparent 60%)" }} />
            <div className="relative z-10 space-y-3">
              <div className="flex items-center gap-2">
                <Award className="h-6 w-6" style={{ color: "#C9A84C" }} />
                <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#C9A84C" }}>NFGN Pro Compensation Plan</span>
              </div>
              <h2 className="text-2xl font-serif font-bold leading-tight">Three Income Streams.<br />Unlimited Earning Potential.</h2>
              <p className="text-sm text-gray-300 leading-relaxed max-w-lg">
                NFGN's compensation plan rewards you at every stage — whether you're just sharing a product or building a national network.
                Every purchase by your team earns you income on multiple levels.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge className="bg-white/10 text-white border-white/20 hover:bg-white/20">Referral Commission</Badge>
                <Badge className="bg-white/10 text-white border-white/20 hover:bg-white/20">Product Sales Commission</Badge>
                <Badge className="bg-white/10 text-white border-white/20 hover:bg-white/20">PMRC Multi-Level</Badge>
                <Badge className="bg-white/10 text-white border-white/20 hover:bg-white/20">CLB Bonus</Badge>
                <Badge className="bg-white/10 text-white border-white/20 hover:bg-white/20">MCB Bonus</Badge>
              </div>
            </div>
          </div>

          {/* 3-Stream Overview Cards */}
          <div>
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              3 Core Commission Streams
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  label: "Referral Commission",
                  abbr: "RC",
                  who: "All Members",
                  trigger: "Any purchase by a directly sponsored member",
                  highlight: "10% of purchase value",
                  color: "blue",
                  icon: Link2,
                  border: "border-blue-200",
                  bg: "bg-blue-50",
                  badge: "bg-blue-100 text-blue-800",
                  iconColor: "text-blue-600",
                },
                {
                  label: "Product Sales Commission",
                  abbr: "PSC",
                  who: "Pro Members Only",
                  trigger: "Regular products purchased in your multi-level downline",
                  highlight: "Up to 9 levels deep",
                  color: "green",
                  icon: TrendingUp,
                  border: "border-green-200",
                  bg: "bg-green-50",
                  badge: "bg-green-100 text-green-800",
                  iconColor: "text-green-600",
                },
                {
                  label: "Pro Reg. Commission",
                  abbr: "PMRC",
                  who: "Pro Members Only",
                  trigger: "Pro Package purchased anywhere in your downline",
                  highlight: "Up to 5 levels deep",
                  color: "amber",
                  icon: Star,
                  border: "border-amber-200",
                  bg: "bg-amber-50",
                  badge: "bg-amber-100 text-amber-800",
                  iconColor: "text-amber-600",
                },
              ].map(s => (
                <Card key={s.abbr} className={`border ${s.border} ${s.bg}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <s.icon className={`h-5 w-5 ${s.iconColor}`} />
                      <Badge className={`text-[10px] ${s.badge} border-0`}>{s.who}</Badge>
                    </div>
                    <CardTitle className="text-sm font-semibold mt-2">{s.label}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    <p className="text-xs text-muted-foreground leading-relaxed">{s.trigger}</p>
                    <p className={`text-xs font-bold ${s.iconColor}`}>{s.highlight}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Referral Commission Detail */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Link2 className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Referral Commission (RC)</CardTitle>
                  <CardDescription className="text-xs">Available to ALL members — free and Pro</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="font-bold text-blue-900 text-lg">10%</p>
                    <p className="text-xs text-blue-700">of every purchase made by your direct referrals</p>
                  </div>
                  <Badge className="bg-blue-600 text-white text-xs">Direct sponsor only</Badge>
                </div>
              </div>
              <div className="text-sm text-muted-foreground space-y-1.5">
                <div className="flex items-start gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-green-600 mt-0.5 flex-shrink-0" /><span>Paid on <strong>every order</strong> — products, Pro Packages, and renewals</span></div>
                <div className="flex items-start gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-green-600 mt-0.5 flex-shrink-0" /><span>Available immediately upon joining — no upgrade required</span></div>
                <div className="flex items-start gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-green-600 mt-0.5 flex-shrink-0" /><span>Example: Your referral buys $100 in products → you earn <strong>$10</strong></span></div>
              </div>
            </CardContent>
          </Card>

          {/* PSC Rate Table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Product Sales Commission (PSC)</CardTitle>
                  <CardDescription className="text-xs">Pro Members only · Uni-level on regular product purchases</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-green-50 border border-green-200">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-green-800">Level</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-green-800">Relationship</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-green-800">Rate</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-green-800">Earn on $100</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { level: 1, rel: "Your direct referrals", rate: 12 },
                      { level: 2, rel: "Their referrals", rate: 24 },
                      { level: 3, rel: "3rd generation", rate: 8 },
                      { level: 4, rel: "4th generation", rate: 7 },
                      { level: 5, rel: "5th generation", rate: 6 },
                      { level: 6, rel: "6th generation", rate: 5 },
                      { level: 7, rel: "7th generation", rate: 4 },
                      { level: 8, rel: "8th generation", rate: 3 },
                      { level: 9, rel: "9th generation", rate: 2 },
                    ].map((r, i) => (
                      <tr key={r.level} className={`border-b border-green-100 ${i % 2 === 0 ? "bg-white" : "bg-green-50/40"}`}>
                        <td className="px-3 py-2 font-bold text-green-700">L{r.level}</td>
                        <td className="px-3 py-2 text-muted-foreground text-xs">{r.rel}</td>
                        <td className="px-3 py-2 text-right font-semibold text-green-800">{r.rate}%</td>
                        <td className="px-3 py-2 text-right text-green-700 font-mono text-xs">${r.rate.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-green-100 border border-green-300">
                      <td colSpan={2} className="px-3 py-2 font-bold text-green-900 text-xs">Total potential (9-level, $100 purchase)</td>
                      <td className="px-3 py-2 text-right font-bold text-green-900">71%</td>
                      <td className="px-3 py-2 text-right font-bold text-green-900 font-mono text-xs">$71.00</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <p className="text-xs text-muted-foreground">Rates shown are defaults and may be adjusted by admin. Commissions are earned on each qualifying purchase by downline members at the corresponding level.</p>
            </CardContent>
          </Card>

          {/* PMRC Rate Table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                  <Star className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Pro Member Registration Commission (PMRC)</CardTitle>
                  <CardDescription className="text-xs">Pro Members only · Earned when anyone in your downline purchases a Pro Package</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-amber-50 border border-amber-200">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-amber-800">Level</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-amber-800">Relationship</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-amber-800">Rate</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-amber-800">Earn on $150 Pack</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { level: 1, rel: "Your direct referrals", rate: 12 },
                      { level: 2, rel: "Their referrals", rate: 22 },
                      { level: 3, rel: "3rd generation", rate: 8 },
                      { level: 4, rel: "4th generation", rate: 7 },
                      { level: 5, rel: "5th generation", rate: 7 },
                    ].map((r, i) => (
                      <tr key={r.level} className={`border-b border-amber-100 ${i % 2 === 0 ? "bg-white" : "bg-amber-50/40"}`}>
                        <td className="px-3 py-2 font-bold text-amber-700">L{r.level}</td>
                        <td className="px-3 py-2 text-muted-foreground text-xs">{r.rel}</td>
                        <td className="px-3 py-2 text-right font-semibold text-amber-800">{r.rate}%</td>
                        <td className="px-3 py-2 text-right text-amber-700 font-mono text-xs">${(r.rate * 1.5).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-amber-100 border border-amber-300">
                      <td colSpan={2} className="px-3 py-2 font-bold text-amber-900 text-xs">Total potential (5-level, $150 Pro Pack)</td>
                      <td className="px-3 py-2 text-right font-bold text-amber-900">56%</td>
                      <td className="px-3 py-2 text-right font-bold text-amber-900 font-mono text-xs">$84.00</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <p className="text-xs text-muted-foreground">PMRC fires on initial registration AND recurring monthly renewals of any Pro Package. Build a team that renews monthly and earn passive income every cycle.</p>
            </CardContent>
          </Card>

          {/* Power Squad Bonuses — CLB + MCB */}
          <div>
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Power Squad Bonuses
            </h3>

            {/* CLB */}
            <Card className="border-l-4 border-l-blue-500 mb-3">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-base">Core Leadership Bonus (CLB)</CardTitle>
                  </div>
                  <div className="flex gap-1.5">
                    <Badge className="bg-blue-600 text-white text-xs">ONE-TIME</Badge>
                    <Badge className="bg-green-600 text-white text-xs font-bold">$100</Badge>
                  </div>
                </div>
                <CardDescription className="text-xs">Awarded when 7 qualified Level 1 Pro Members are reached within 90 days</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                    <p className="text-xl font-bold text-blue-700">7</p>
                    <p className="text-xs text-blue-600">Qualified L1 Members</p>
                  </div>
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                    <p className="text-xl font-bold text-blue-700">90</p>
                    <p className="text-xs text-blue-600">Day Window</p>
                  </div>
                  <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                    <p className="text-xl font-bold text-green-700">$100</p>
                    <p className="text-xs text-green-600">One-Time Bonus</p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex items-start gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-blue-500 mt-0.5 flex-shrink-0" /><span>Fires exactly once — when 7 qualified L1 Pro Members are reached</span></div>
                  <div className="flex items-start gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-blue-500 mt-0.5 flex-shrink-0" /><span>Each L1 member must have ≥ 150 PCV to be "qualified" (UPMs don't count)</span></div>
                  <div className="flex items-start gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-blue-500 mt-0.5 flex-shrink-0" /><span>Also unlocks recurring MCB eligibility</span></div>
                </div>
              </CardContent>
            </Card>

            {/* MCB */}
            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-amber-600" />
                    <CardTitle className="text-base">Money Circulation Bonus (MCB)</CardTitle>
                  </div>
                  <div className="flex gap-1.5">
                    <Badge className="bg-amber-500 text-white text-xs">RECURRING</Badge>
                    <Badge className="bg-green-600 text-white text-xs font-bold">$200</Badge>
                  </div>
                </div>
                <CardDescription className="text-xs">Paid every 7 Level 2 PMRP purchases — counts initial + renewals — requires 7 qualified L1 members</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                    <p className="text-xl font-bold text-amber-700">7</p>
                    <p className="text-xs text-amber-600">L2 Packages/Cycle</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                    <p className="text-xl font-bold text-amber-700">∞</p>
                    <p className="text-xs text-amber-600">Cycles (No Limit)</p>
                  </div>
                  <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                    <p className="text-xl font-bold text-green-700">$200</p>
                    <p className="text-xs text-green-600">Per Cycle</p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex items-start gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" /><span>Fires at 7, 14, 21, 28 L2 packages… repeats forever</span></div>
                  <div className="flex items-start gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" /><span>Monthly renewals count — earn passively from existing members</span></div>
                  <div className="flex items-start gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" /><span>Requires ≥ 7 qualified L1 Pro Members to unlock</span></div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* UPM Policy */}
          <Card className="border-l-4 border-l-orange-400 bg-orange-50/40">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-orange-600" />
                <CardTitle className="text-base text-orange-800">UPM Policy — Qualifying CV Requirement</CardTitle>
                <Badge className="bg-orange-500 text-white text-xs">Important</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-orange-900 leading-relaxed">
                A Pro Member who has not yet accumulated <strong>150 CV</strong> in total product purchases is classified
                as an <strong>Unqualified Pro Member (UPM)</strong>. UPMs count as Pro Members in the network but
                do <strong>not</strong> contribute to their sponsor's CLB or MCB headcount until they reach 150 CV.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="rounded-lg bg-orange-100 border border-orange-200 p-3">
                  <p className="text-xs font-semibold text-orange-800 mb-1">Unqualified Pro Member (UPM)</p>
                  <p className="text-xs text-orange-700">isProMember = true, total PCV &lt; 150 CV</p>
                  <p className="text-xs text-orange-600 mt-1">Does NOT count toward CLB/MCB headcount</p>
                </div>
                <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                  <p className="text-xs font-semibold text-green-800 mb-1">Qualified Pro Member</p>
                  <p className="text-xs text-green-700">isProMember = true, total PCV ≥ 150 CV</p>
                  <p className="text-xs text-green-600 mt-1">Counts toward CLB/MCB headcount ✓</p>
                </div>
              </div>
              <p className="text-xs text-orange-700">UPMs can top up their PCV at any time by purchasing additional products.</p>
            </CardContent>
          </Card>

          {/* Income Scenario */}
          <Card className="border-2" style={{ borderColor: "#C9A84C40" }}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5" style={{ color: BRAND_GOLD }} />
                <CardTitle className="text-base">Illustrative Income Scenario</CardTitle>
              </div>
              <CardDescription className="text-xs">Example — assumes all members purchase monthly and meet qualification requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {[
                  { label: "10 direct referrals × $100/mo → RC (10%)", amount: 100, color: "blue" },
                  { label: "10 direct referrals × $100/mo → PSC L1 (12%)", amount: 120, color: "green" },
                  { label: "50 L2 members × $100/mo → PSC L2 (24%)", amount: 1200, color: "green" },
                  { label: "10 direct referrals × $150 Pro Pack → PMRC L1 (12%)", amount: 180, color: "amber" },
                  { label: "CLB — one-time when 7 qualified L1 reached", amount: 100, color: "blue", oneTime: true },
                  { label: "MCB — every 7 L2 Pro Package sales", amount: 200, color: "amber" },
                ].map((row, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <ArrowRight className={`h-3.5 w-3.5 flex-shrink-0 ${
                      row.color === "blue" ? "text-blue-500" : row.color === "green" ? "text-green-500" : "text-amber-500"
                    }`} />
                    <span className="text-xs text-muted-foreground flex-1">{row.label}</span>
                    <span className={`text-xs font-bold font-mono ${
                      row.color === "blue" ? "text-blue-700" : row.color === "green" ? "text-green-700" : "text-amber-700"
                    }`}>
                      +${row.amount.toLocaleString()}{row.oneTime ? "*" : ""}
                    </span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-1 flex items-center justify-between">
                  <span className="text-sm font-bold">Illustrated Monthly Total</span>
                  <span className="text-lg font-bold font-serif" style={{ color: BRAND_GOLD }}>$1,900+</span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground border-t pt-2">
                * This is an illustration only. Actual earnings depend on team activity, purchase amounts, and qualification status.
                Commission rates are set by admin and may vary. NFGN does not guarantee any income.
              </p>
            </CardContent>
          </Card>

          {/* CTA */}
          <Card className="text-center" style={{ background: "linear-gradient(135deg, #0a0a0a, #1a1a1a)" }}>
            <CardContent className="pt-6 pb-6 space-y-3">
              <Star className="h-8 w-8 mx-auto fill-current" style={{ color: BRAND_GOLD }} />
              <p className="text-white font-serif text-lg font-bold">Ready to Start Earning?</p>
              <p className="text-gray-400 text-sm">Share your referral link to start building your team today.</p>
              <Button
                variant="outline"
                size="sm"
                className="border-primary text-primary hover:bg-primary/10"
                onClick={() => { const el = document.querySelector('[data-value="link"]') as HTMLElement; el?.click(); }}
              >
                Get Your Referral Link <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </CardContent>
          </Card>

        </TabsContent>
      </Tabs>
    </div>
  );
}
