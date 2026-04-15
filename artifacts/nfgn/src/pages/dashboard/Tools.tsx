import { useState } from "react";
import { useGetMe } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Link2, Copy, Check, ExternalLink, Share2, Mail, MessageSquare,
  Facebook, Instagram, QrCode, Package, ChevronRight, Sparkles,
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
          <p className="text-sm text-muted-foreground">Share individual product links with your referral code pre-attached. Anyone who clicks and purchases earns you a commission.</p>
          {PRODUCTS.map((p) => {
            const productLink = `${BASE_URL}/shop?ref=${refCode}`;
            return (
              <Card key={p.slug}>
                <CardContent className="pt-5 flex items-center gap-4">
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
                  <div className="flex gap-2 flex-shrink-0">
                    <CopyBtn text={productLink} />
                    <Button variant="ghost" size="sm" onClick={() => window.open(productLink, "_blank")}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
