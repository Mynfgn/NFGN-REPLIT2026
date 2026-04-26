import { useState } from "react";
import { useGetMe } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from "qrcode.react";
import {
  Link2, Copy, Check, ExternalLink, Users, Gift,
  Info, ArrowRight, CreditCard, Star,
} from "lucide-react";
import { Link } from "wouter";
import { tierLabel } from "@/lib/labels";
import { getEffectiveTier, tierAtLeast } from "@/components/layout/DashboardLayout";

const BRAND_GOLD = "#C9A84C";
const BRAND_GREEN = "#2D6A4F";
const BRAND_BLACK = "#0a0a0a";

export function ReferralLinkPage() {
  const { data: user } = useGetMe();
  const [copied, setCopied] = useState(false);

  const effectiveTier = getEffectiveTier(user);
  const isRRM = tierAtLeast(effectiveTier, "referring_retail_member");

  const referralCode = (user as any)?.referralCode ?? "";
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const affiliateUrl = referralCode ? `${baseUrl}/rep/${referralCode}` : "";

  const handleCopy = async () => {
    if (!affiliateUrl) return;
    try {
      await navigator.clipboard.writeText(affiliateUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const el = document.createElement("textarea");
      el.value = affiliateUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-primary">My Referral Link</h1>
        <p className="text-muted-foreground mt-1">
          Share your personal affiliate page to earn{" "}
          {isRRM ? "Dollar Credit ($-Credit)" : "referral rewards"} whenever someone makes a purchase.
        </p>
      </div>

      {/* Status badge */}
      <div className="flex items-center gap-2">
        <Badge
          className="text-xs font-bold px-3 py-1"
          style={{ background: BRAND_GOLD, color: "#000" }}
        >
          {tierLabel(effectiveTier)}
        </Badge>
        {!isRRM && (
          <span className="text-sm text-muted-foreground">
            — Sign up your first referral to become a <strong>Referring Retail Member</strong> and start earning $-Credit!
          </span>
        )}
        {isRRM && (
          <span className="text-sm text-muted-foreground">
            — You earn <strong>Dollar Credit ($-Credit)</strong> on every qualifying referral purchase.
          </span>
        )}
      </div>

      {/* Referral link card */}
      <Card className="border-2" style={{ borderColor: `${BRAND_GOLD}40` }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" style={{ color: BRAND_GOLD }} />
            Your Personal Affiliate Link
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* URL + copy */}
          <div className="flex items-center gap-2 rounded-xl border bg-muted/30 px-4 py-3 min-w-0">
            <span className="text-sm font-mono text-muted-foreground flex-1 truncate min-w-0">
              {affiliateUrl || "Loading..."}
            </span>
            <Button
              size="sm"
              onClick={handleCopy}
              disabled={!affiliateUrl}
              className="flex-shrink-0 gap-1.5 font-bold"
              style={{ background: copied ? BRAND_GREEN : BRAND_GOLD, color: "#000", border: "none" }}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>

          {/* Open button */}
          <a
            href={affiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold transition-colors"
            style={{ color: BRAND_GOLD }}
          >
            <ExternalLink className="h-4 w-4" />
            Preview My Affiliate Page
          </a>
        </CardContent>
      </Card>

      {/* QR Code */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM17 17h3v3h-3zM14 20h3"/>
            </svg>
            QR Code for Your Affiliate Page
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            {affiliateUrl && (
              <div
                className="p-4 rounded-2xl flex-shrink-0"
                style={{ background: BRAND_BLACK }}
              >
                <QRCodeSVG
                  value={affiliateUrl}
                  size={150}
                  bgColor="#0a0a0a"
                  fgColor="#C9A84C"
                  level="H"
                />
              </div>
            )}
            <div className="space-y-2">
              <p className="text-sm font-semibold">How to use your QR code:</p>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: BRAND_GOLD }} />
                  Screenshot it and share on social media
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: BRAND_GOLD }} />
                  Print it on business cards or flyers
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: BRAND_GOLD }} />
                  Add it to your email signature
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: BRAND_GOLD }} />
                  Show it to friends and let them scan
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Earning info */}
      <Card style={{ background: `linear-gradient(135deg, ${BRAND_BLACK}, #1a0f00)`, border: `1px solid ${BRAND_GOLD}40` }}>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Gift className="h-5 w-5 flex-shrink-0" style={{ color: BRAND_GOLD }} />
            <h3 className="font-serif font-bold text-white text-lg">How Referral Rewards Work</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                icon: Users,
                title: "Step 1: Share Your Link",
                desc: "When someone clicks your referral link and makes a purchase, you get credit for that referral.",
              },
              {
                icon: CreditCard,
                title: "Step 2: Earn $-Credit",
                desc: isRRM
                  ? "As a Referring Retail Member, you earn Dollar Credit ($-Credit) on every qualifying referral purchase."
                  : "Once you sign up your first referral, you become a Referring Retail Member and start earning $-Credit.",
              },
              {
                icon: Gift,
                title: "Step 3: Use Your $-Credit",
                desc: "$-Credit can be applied toward eligible NFGN products and services. Credits are available 7 days after the referral purchase and expire after 37 days.",
              },
              {
                icon: Star,
                title: "Step 4: Upgrade for More",
                desc: "Refer 9 Retail Members to unlock the ability to cash out your $-Credit. Or upgrade to Pro Member to earn real cash commissions on all levels.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-3">
                <div
                  className="h-8 w-8 rounded-lg flex-shrink-0 flex items-center justify-center"
                  style={{ background: `${BRAND_GOLD}20` }}
                >
                  <Icon className="h-4 w-4" style={{ color: BRAND_GOLD }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs text-white/55 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {!tierAtLeast(effectiveTier, "pro_member") && (
            <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${BRAND_GOLD}30` }}>
              <Link href="/pro-join">
                <Button
                  className="w-full font-bold"
                  style={{ background: BRAND_GOLD, color: "#000" }}
                >
                  Upgrade to Pro Member — Earn Cash, Not Just Credit
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Policies note */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground p-3 rounded-lg bg-muted/30 border">
        <Info className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: BRAND_GOLD }} />
        <span>
          $-Credit is subject to a 7-day hold before becoming available, and expires 37 days after the referral purchase date.
          For full details, see our{" "}
          <Link href="/policies" className="font-semibold underline" style={{ color: BRAND_GOLD }}>
            Policies &amp; Terms
          </Link>
          .
        </span>
      </div>
    </div>
  );
}
