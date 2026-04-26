import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useGetMe } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Phone, CheckCircle2, Star, Smartphone, Share2,
  Users, Download, Globe, Wifi, Lock, Zap, Copy, Check,
} from "lucide-react";

const GOLD = "#C9A84C";
const GREEN = "#2D6A4F";

function StepRow({
  step,
  title,
  detail,
  color = "#0a0a0a",
}: {
  step: number;
  title: string;
  detail: string;
  color?: string;
}) {
  return (
    <div className="flex gap-4 p-4 bg-white items-start border-b last:border-b-0">
      <span
        className="h-7 w-7 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-black text-white mt-0.5"
        style={{ background: color }}
      >
        {step}
      </span>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{detail}</p>
      </div>
    </div>
  );
}

export function GetTheAppPage() {
  const { data: me } = useGetMe();
  const isProMember = me?.role === "pro_member";

  const appUrl = typeof window !== "undefined" ? window.location.origin : "https://nfgn.app";
  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(appUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="rounded-2xl p-6 text-white" style={{ background: "linear-gradient(135deg, #0a0a0a, #1a1a2e)" }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: `${GOLD}25`, border: `1px solid ${GOLD}40` }}>
            <Smartphone className="h-5 w-5" style={{ color: GOLD }} />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold">Get the NFGN App</h1>
            <p className="text-white/60 text-sm">Install the platform on any phone — no app store needed</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge className="text-xs" style={{ background: `${GOLD}30`, color: GOLD, border: `1px solid ${GOLD}40` }}>iPhone</Badge>
          <Badge className="text-xs" style={{ background: `${GOLD}30`, color: GOLD, border: `1px solid ${GOLD}40` }}>Android</Badge>
          <Badge className="text-xs" style={{ background: `${GOLD}30`, color: GOLD, border: `1px solid ${GOLD}40` }}>No App Store Required</Badge>
          <Badge className="text-xs" style={{ background: `${GOLD}30`, color: GOLD, border: `1px solid ${GOLD}40` }}>Free</Badge>
        </div>
      </div>

      {/* What it is */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-5 pb-5">
          <div className="flex gap-3 items-start">
            <Globe className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-sm">What Is This?</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The NFGN platform is a <strong className="text-foreground">web app</strong> — it runs entirely in your phone's
                browser, meaning there's nothing to download from an app store. By following the steps below, you can install
                it directly to your home screen where it will open full-screen, just like a regular app. It works on
                <strong className="text-foreground"> iPhones and Android phones</strong>, and it's completely free.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Section */}
      <Card className="border-2" style={{ borderColor: `${GOLD}60` }}>
        <CardHeader className="pb-2">
          <CardTitle className="font-serif text-base flex items-center gap-2">
            <Download className="h-4 w-4 text-primary" />
            Scan to Open on Your Phone
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Point your phone's camera at this QR code — it will open the NFGN platform in your mobile browser instantly.
            Then follow the steps below to add it to your home screen.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
            {/* QR Code */}
            <div className="flex-shrink-0">
              <div className="p-4 rounded-2xl bg-white border-2 shadow-sm inline-block" style={{ borderColor: `${GOLD}40` }}>
                <QRCodeSVG
                  value={appUrl}
                  size={180}
                  bgColor="#ffffff"
                  fgColor="#0a0a0a"
                  level="H"
                  imageSettings={{
                    src: "",
                    x: undefined,
                    y: undefined,
                    height: 0,
                    width: 0,
                    excavate: false,
                  }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-2 font-medium tracking-wide uppercase">Scan with any phone camera</p>
            </div>

            {/* Link + Copy */}
            <div className="flex-1 space-y-4 w-full">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Or copy the link directly</p>
                <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2.5">
                  <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs font-mono text-muted-foreground flex-1 break-all">{appUrl}</span>
                  <button
                    onClick={copyLink}
                    className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors"
                    style={{ background: copied ? GREEN : GOLD, color: "white" }}
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-1.5">
                <p className="text-xs font-semibold text-amber-800 flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  How to use the QR code
                </p>
                <ul className="space-y-1 text-xs text-amber-700">
                  <li className="flex gap-1.5 items-start"><span className="font-bold">1.</span> Open your phone's camera app</li>
                  <li className="flex gap-1.5 items-start"><span className="font-bold">2.</span> Point it at the QR code above — no button needed</li>
                  <li className="flex gap-1.5 items-start"><span className="font-bold">3.</span> Tap the link that appears at the top of your screen</li>
                  <li className="flex gap-1.5 items-start"><span className="font-bold">4.</span> The platform opens in your browser — then follow the install steps below</li>
                </ul>
              </div>

              <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                <p className="text-xs font-semibold text-foreground">Share this QR code with your team</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Screenshot this QR code and send it in a group chat, text, or email to any new member you enroll. They can scan it
                  directly from their screen — no typing a URL required.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* iPhone Instructions */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-slate-900 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-base"></span>
          </div>
          <div>
            <h2 className="font-serif font-bold text-base">iPhone — Add to Home Screen</h2>
            <p className="text-xs text-muted-foreground">Must use Safari (not Chrome or Firefox on iPhone)</p>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
          {[
            {
              title: "Open Safari",
              detail: "On iPhone, this only works through Safari. If you're in Chrome or another browser, switch to Safari first by opening it from your home screen.",
            },
            {
              title: "Navigate to the NFGN platform",
              detail: "Scan the QR code above or type the link into Safari's address bar. Wait for the page to fully load before continuing.",
            },
            {
              title: "Tap the Share button at the bottom",
              detail: "At the bottom center of Safari you'll see a box with an upward arrow — that's the Share button. Tap it once.",
            },
            {
              title: "Scroll down and tap \"Add to Home Screen\"",
              detail: "The Share menu slides up from the bottom. Scroll down the list of options until you see \"Add to Home Screen\" — tap it.",
            },
            {
              title: "Name it \"NFGN\" and tap Add",
              detail: "A screen appears letting you name the shortcut. Type \"NFGN\" or leave it as-is, then tap \"Add\" in the top right corner.",
            },
            {
              title: "Done — find the icon on your home screen",
              detail: "The NFGN icon now appears on your iPhone home screen. Tap it any time to open the platform full-screen, just like a native app.",
            },
          ].map((s, i) => (
            <StepRow key={i} step={i + 1} title={s.title} detail={s.detail} color="#0a0a0a" />
          ))}
        </div>
      </div>

      {/* Android Instructions */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#3ddc84" }}>
            <span className="text-white font-bold text-base">A</span>
          </div>
          <div>
            <h2 className="font-serif font-bold text-base">Android — Add to Home Screen</h2>
            <p className="text-xs text-muted-foreground">Works best in Google Chrome</p>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
          {[
            {
              title: "Open Google Chrome",
              detail: "Use Chrome on Android for the best experience. Open it from your app drawer or home screen.",
            },
            {
              title: "Navigate to the NFGN platform",
              detail: "Scan the QR code above or type the link into Chrome's address bar. Let the page fully load.",
            },
            {
              title: "Tap the three dots (⋮) in the top right",
              detail: "In the upper right corner of Chrome, you'll see three vertical dots — tap them to open the browser menu.",
            },
            {
              title: "Tap \"Add to Home screen\" or \"Install App\"",
              detail: "Look for \"Add to Home screen\" or \"Install App\" in the menu. Some Android phones also show a banner at the bottom of the screen — you can tap that too.",
            },
            {
              title: "Confirm and install",
              detail: "A pop-up appears asking you to confirm. Tap \"Add\" or \"Install.\" The app icon will appear on your home screen.",
            },
            {
              title: "Done — open the app from your home screen",
              detail: "Find the NFGN icon on your Android home screen and tap it. It opens full-screen, just like a native app.",
            },
          ].map((s, i) => (
            <StepRow key={i} step={i + 1} title={s.title} detail={s.detail} color="#3ddc84" />
          ))}
        </div>
      </div>

      {/* Member section */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-serif flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            For Members
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Once the NFGN platform is on your home screen, here's what you have access to as a member:
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            {[
              { icon: Smartphone, label: "Your dashboard", detail: "Track your orders, wallet, and commissions from anywhere." },
              { icon: Globe, label: "Your referral link", detail: "Share your personal link directly from your phone — no desktop needed." },
              { icon: Wifi, label: "Works offline-friendly", detail: "Loaded pages stay usable even with a slow or unstable connection." },
              { icon: Lock, label: "Your account is secure", detail: "Your login session stays active so you don't need to sign in every time." },
              { icon: Zap, label: "Instant notifications", detail: "Stay up to date on orders, commissions, and messages the moment they arrive." },
              { icon: Share2, label: "Easy sharing", detail: "Copy and share your referral link, QR code, or product links directly from your phone." },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-2 p-3 rounded-lg border bg-muted/20">
                <item.icon className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold">{item.label}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pro Member section */}
      <Card className="border-l-4" style={{ borderLeftColor: GOLD }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-serif flex items-center gap-2">
            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
            For Pro Members
            {isProMember && (
              <Badge className="text-[10px] ml-1" style={{ background: `${GOLD}25`, color: GOLD, border: `1px solid ${GOLD}50` }}>
                That's You
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            As a Pro Member, having the platform on your phone isn't just convenient — it's a <strong className="text-foreground">business tool</strong>.
            Here's what becomes possible when you run your NFGN business from your pocket:
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            {[
              { label: "Enroll new members on the spot", detail: "At events, meetups, or family gatherings — pull up your referral link instantly and walk someone through joining right there." },
              { label: "Monitor your BPP qualification", detail: "Check your Zone GCV progress and PCV in real time from anywhere. No need to wait until you're at a computer." },
              { label: "Respond to your team instantly", detail: "Check your Mailbox and reply to downline members the moment they reach out — fast response builds trust." },
              { label: "Share your referral QR code", detail: "Your referral page has its own shareable link. Open it from your phone and screenshot it for events or group chats." },
              { label: "Track your Bill Payer bonuses", detail: "See exactly where you stand on each of the 5 BPP funds — Phone, Medical, Utilities, Car, Rent — without opening a laptop." },
              { label: "Present the business professionally", detail: "Open the platform in your browser, walk someone through the comp plan or training, and enroll them — all from your phone." },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-2 p-3 rounded-lg border bg-amber-50/50 border-amber-100">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: GOLD }} />
                <div>
                  <p className="text-xs font-semibold">{item.label}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-[#0a0a0a] text-white p-4 space-y-2 mt-2">
            <p className="text-sm font-semibold" style={{ color: GOLD }}>Make This Part of Your Enrollment Process</p>
            <p className="text-sm text-white/70 leading-relaxed">
              Every time you enroll a new member or Pro Member, take two minutes during your welcome call to walk them through
              adding NFGN to their home screen. A member with the platform on their phone is significantly more likely to stay
              active, place orders, and engage with their team. It's the fastest way to reduce drop-off after enrollment.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Tips & Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2.5">
            {[
              "iPhone users must use Safari — the \"Add to Home Screen\" option is not available in Chrome or Firefox on iOS.",
              "Android users may see a blue \"Install App\" banner appear automatically at the bottom of Chrome — tap it for a one-step install.",
              "The QR code on this page is tied to the current web address. Once your custom domain is connected, visit this page again to get an updated QR code reflecting your permanent link.",
              "Screenshot the QR code on this page and drop it into your team group chat — anyone can scan it directly from their screen.",
              "The app does not require any app store account, payment, or permission — it's a free, instant install.",
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                {tip}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
