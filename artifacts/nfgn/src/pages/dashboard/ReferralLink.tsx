import { useState } from "react";
import { useGetMe } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from "qrcode.react";
import {
  Link2, Copy, Check, ExternalLink, Users, Gift,
  Info, ArrowRight, CreditCard, Star, Share2,
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

  function shareWhatsApp() {
    const text = encodeURIComponent(`Check out my NFGN wellness store! Shop products or join my team here: ${affiliateUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  }
  function shareFacebook() {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(affiliateUrl)}`, "_blank", "noopener,noreferrer");
  }
  function shareSms() {
    window.location.href = `sms:?body=${encodeURIComponent(`Check out my NFGN wellness store! ${affiliateUrl}`)}`;
  }

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

          {/* Social share row */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Share2 className="h-3.5 w-3.5" /> Share directly:
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={shareWhatsApp}
                disabled={!affiliateUrl}
                className="gap-1.5 text-xs font-semibold text-white border-0"
                style={{ background: "#25D366" }}
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </Button>
              <Button
                size="sm"
                onClick={shareFacebook}
                disabled={!affiliateUrl}
                className="gap-1.5 text-xs font-semibold text-white border-0"
                style={{ background: "#1877F2" }}
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Facebook
              </Button>
              <Button
                size="sm"
                onClick={shareSms}
                disabled={!affiliateUrl}
                variant="outline"
                className="gap-1.5 text-xs font-semibold"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                SMS
              </Button>
            </div>
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
