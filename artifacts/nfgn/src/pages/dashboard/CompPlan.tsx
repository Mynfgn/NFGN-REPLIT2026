import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign, TrendingUp, Users, Star, Award, Home,
  ChevronRight, CheckCircle2, Info, Zap, ArrowRight,
} from "lucide-react";

const GOLD = "#C9A84C";
const GREEN = "#2D6A4F";
const BLACK = "#0a0a0a";

const SECTIONS = [
  { id: "overview",   label: "Overview",                icon: Zap },
  { id: "rc",         label: "Referral Commission",     icon: DollarSign },
  { id: "psc",        label: "Product Sales Comm.",     icon: TrendingUp },
  { id: "pmrc",       label: "Multi-Level Retail",      icon: Users },
  { id: "psb",        label: "Power Squad Bonuses",     icon: Star },
  { id: "bpp",        label: "Bill Payer Program",      icon: Home },
];

function SectionNav({ active, onChange }: { active: string; onChange: (s: string) => void }) {
  return (
    <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
      {SECTIONS.map(s => (
        <button
          key={s.id}
          onClick={() => onChange(s.id)}
          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap text-left w-full
            ${active === s.id ? "text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
          style={active === s.id ? { background: GOLD } : {}}
        >
          <s.icon className="h-4 w-4 flex-shrink-0" />
          {s.label}
        </button>
      ))}
    </nav>
  );
}

function RateRow({ level, pct, on100, note }: { level: string; pct: string; on100?: string; note?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-0 gap-4">
      <div className="flex-1">
        <span className="text-sm font-medium text-foreground">{level}</span>
        {note && <p className="text-xs text-muted-foreground mt-0.5">{note}</p>}
      </div>
      <span className="text-sm font-bold text-primary">{pct}</span>
      {on100 && <span className="text-xs text-muted-foreground w-16 text-right">${on100} / $100</span>}
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 items-start text-sm text-muted-foreground">
      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

function InfoBox({ children, color = "amber" }: { children: React.ReactNode; color?: "amber" | "blue" | "green" }) {
  const colors = {
    amber: "bg-amber-50 border-amber-200 text-amber-900",
    blue: "bg-blue-50 border-blue-200 text-blue-900",
    green: "bg-green-50 border-green-200 text-green-900",
  };
  return (
    <div className={`rounded-xl border p-4 text-sm space-y-1 ${colors[color]}`}>
      {children}
    </div>
  );
}

// ── OVERVIEW ──────────────────────────────────────────────────────────────────
function OverviewSection() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl p-6 text-white" style={{ background: `linear-gradient(135deg, ${BLACK}, #1a1a1a)` }}>
        <h2 className="text-2xl font-serif font-bold mb-1">Five Income Streams</h2>
        <p className="text-white/70 text-sm mb-5">NFGN members can earn through five distinct income streams — three commission types and two bonus programs.</p>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {[
            { label: "Referral Commission", abbr: "RC", color: "#3b82f6" },
            { label: "Product Sales Commission", abbr: "PSC", color: GOLD },
            { label: "Pro Member Retail Comm.", abbr: "PMRC", color: GREEN },
            { label: "Power Squad Bonuses", abbr: "PSB", color: "#f59e0b" },
            { label: "Bill Payer Program", abbr: "BPP", color: "#ec4899" },
          ].map(s => (
            <div key={s.abbr} className="rounded-xl p-3 text-center" style={{ background: `${s.color}20`, border: `1px solid ${s.color}40` }}>
              <p className="text-xs font-bold" style={{ color: s.color }}>{s.abbr}</p>
              <p className="text-white/80 text-[10px] leading-snug mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-blue-200 bg-blue-50/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-800 flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Referral Commission (RC)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-blue-900 space-y-1">
            <p><strong>Rate:</strong> 10% flat on all direct referral orders</p>
            <p><strong>Who earns:</strong> All active members (customer or Pro)</p>
            <p><strong>Trigger:</strong> Any time your direct referral places an order</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-yellow-800 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Product Sales Commission (PSC)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-yellow-900 space-y-1">
            <p><strong>Rate:</strong> Up to 24% across 9 generations</p>
            <p><strong>Who earns:</strong> Pro Members only</p>
            <p><strong>Trigger:</strong> Any product purchase in your downline</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-800 flex items-center gap-2">
              <Users className="h-4 w-4" /> Pro Member Retail Commission (PMRC)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-green-900 space-y-1">
            <p><strong>Rate:</strong> Up to 22% across 5 generations</p>
            <p><strong>Who earns:</strong> Pro Members only</p>
            <p><strong>Trigger:</strong> When someone in your downline registers as Pro Member</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-orange-800 flex items-center gap-2">
              <Star className="h-4 w-4" /> Power Squad Bonuses
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-orange-900 space-y-1">
            <p><strong>CLB:</strong> $100 one-time when 9 qualified L1 Pro Members join</p>
            <p><strong>MCB:</strong> $200 recurring every 7 new L2 Pro Members</p>
            <p><strong>Who earns:</strong> Pro Members who meet qualification thresholds</p>
          </CardContent>
        </Card>

        <Card className="border-pink-200 bg-pink-50/40 sm:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-pink-800 flex items-center gap-2">
              <Home className="h-4 w-4" /> Bill Payer Program (BPP)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-pink-900 space-y-1">
            <p><strong>5 Group Volume Bonuses</strong> — one for each major monthly living expense.</p>
            <p><strong>Who earns:</strong> Qualified Pro Members (150+ PV/month) whose team reaches each GV threshold.</p>
            <p><strong>Payout:</strong> End-of-month directly to your NFGN E-Wallet.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" /> Illustrative Monthly Income Scenario
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="rounded-xl bg-muted p-4 space-y-2">
            {[
              { label: "RC — 10% on $3,000 direct referral sales", val: "$300" },
              { label: "PSC — 9-level team product sales ($8,000 volume)", val: "$960" },
              { label: "PMRC — 3 new Pro Members across L1–L3", val: "$440" },
              { label: "MCB — 1 cycle of 7 L2 Pro Members", val: "$200" },
              { label: "BPP — 2 Group Volume Bonuses met", val: "$400" },
            ].map(r => (
              <div key={r.label} className="flex justify-between items-center text-xs border-b last:border-0 pb-2 last:pb-0">
                <span className="text-muted-foreground">{r.label}</span>
                <span className="font-bold text-foreground">{r.val}</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-2 border-t-2">
              <span className="font-bold text-sm">Illustrative Total</span>
              <span className="font-black text-base" style={{ color: GOLD }}>$2,300+/month</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground italic">This is an illustrative example only. Actual earnings depend on individual performance, team activity, and qualification. NFGN does not guarantee income.</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ── REFERRAL COMMISSION ──────────────────────────────────────────────────────
function RCSection() {
  return (
    <div className="space-y-5">
      <div className="rounded-xl p-5 text-white" style={{ background: `linear-gradient(135deg, #1d4ed8, #2563eb)` }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-xl">Referral Commission (RC)</h2>
            <p className="text-white/70 text-xs">Earn 10% every time your direct referrals shop</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="rounded-lg bg-white/10 p-3 text-center">
            <p className="text-2xl font-black">10%</p>
            <p className="text-white/70 text-[10px] uppercase tracking-wide mt-0.5">Flat Rate</p>
          </div>
          <div className="rounded-lg bg-white/10 p-3 text-center">
            <p className="text-2xl font-black">L1</p>
            <p className="text-white/70 text-[10px] uppercase tracking-wide mt-0.5">Direct Only</p>
          </div>
          <div className="rounded-lg bg-white/10 p-3 text-center">
            <p className="text-2xl font-black">All</p>
            <p className="text-white/70 text-[10px] uppercase tracking-wide mt-0.5">Members Eligible</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">How It Works</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Bullet>Share your unique referral link with anyone — friends, family, social media followers.</Bullet>
          <Bullet>When someone clicks your link and places an order, you earn 10% of their order total.</Bullet>
          <Bullet>This applies to products, services, and Pro Member packages purchased by your direct referral.</Bullet>
          <Bullet>No special rank or Pro Member status required — all active members earn RC.</Bullet>
          <Bullet>Commissions are credited to your NFGN E-Wallet and paid according to the payout schedule.</Bullet>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Example Earnings</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-xl bg-muted p-4 space-y-2 text-sm">
            {[
              { desc: "Referral purchases $50 product", earn: "$5.00" },
              { desc: "Referral purchases $150 product bundle", earn: "$15.00" },
              { desc: "Referral purchases $200 Pro Package", earn: "$20.00" },
              { desc: "Referral places $500 monthly order", earn: "$50.00" },
            ].map(e => (
              <div key={e.desc} className="flex justify-between border-b last:border-0 pb-2 last:pb-0">
                <span className="text-muted-foreground text-xs">{e.desc}</span>
                <span className="font-bold text-foreground text-xs">{e.earn}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <InfoBox color="blue">
        <p className="font-semibold">Key Rules</p>
        <p>RC applies only to your <strong>direct (Level 1)</strong> referrals' purchases. Purchases by their downline are covered by PSC (for Pro Members).</p>
      </InfoBox>
    </div>
  );
}

// ── PRODUCT SALES COMMISSION ─────────────────────────────────────────────────
function PSCSection() {
  const rates = [
    { level: "Level 1 (Direct)", pct: "12%", on100: "12.00" },
    { level: "Level 2", pct: "24%", on100: "24.00", note: "Highest rate — reward for team building" },
    { level: "Level 3", pct: "8%",  on100: "8.00" },
    { level: "Level 4", pct: "7%",  on100: "7.00" },
    { level: "Level 5", pct: "6%",  on100: "6.00" },
    { level: "Level 6", pct: "5%",  on100: "5.00" },
    { level: "Level 7", pct: "4%",  on100: "4.00" },
    { level: "Level 8", pct: "3%",  on100: "3.00" },
    { level: "Level 9", pct: "2%",  on100: "2.00" },
  ];
  return (
    <div className="space-y-5">
      <div className="rounded-xl p-5 text-white" style={{ background: `linear-gradient(135deg, ${BLACK}, #1a1a1a)` }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: `${GOLD}30` }}>
            <TrendingUp className="h-5 w-5" style={{ color: GOLD }} />
          </div>
          <div>
            <h2 className="font-serif font-bold text-xl">Product Sales Commission (PSC)</h2>
            <p className="text-white/70 text-xs">Up to 24% across 9 levels of your product sales team</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="rounded-lg p-3 text-center" style={{ background: `${GOLD}20`, border: `1px solid ${GOLD}40` }}>
            <p className="text-2xl font-black" style={{ color: GOLD }}>24%</p>
            <p className="text-white/70 text-[10px] uppercase tracking-wide mt-0.5">L2 Peak Rate</p>
          </div>
          <div className="rounded-lg p-3 text-center" style={{ background: `${GOLD}20`, border: `1px solid ${GOLD}40` }}>
            <p className="text-2xl font-black" style={{ color: GOLD }}>9</p>
            <p className="text-white/70 text-[10px] uppercase tracking-wide mt-0.5">Levels Deep</p>
          </div>
          <div className="rounded-lg p-3 text-center" style={{ background: `${GOLD}20`, border: `1px solid ${GOLD}40` }}>
            <p className="text-2xl font-black" style={{ color: GOLD }}>Pro</p>
            <p className="text-white/70 text-[10px] uppercase tracking-wide mt-0.5">Members Only</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Rate Table — 9 Levels</CardTitle></CardHeader>
        <CardContent>
          {rates.map(r => <RateRow key={r.level} {...r} />)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">How Levels Are Counted</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Bullet>Level 1 = people you personally referred (your direct recruits)</Bullet>
          <Bullet>Level 2 = people your Level 1s referred</Bullet>
          <Bullet>Level 3–9 = each subsequent generation, up to 9 levels deep</Bullet>
          <Bullet>PSC is earned on product orders — not on Pro registration packages (those use PMRC)</Bullet>
          <Bullet>You must be an active Pro Member to earn PSC</Bullet>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Scenario: $100 Order at Each Level</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-xl bg-muted p-4 text-xs space-y-1.5">
            {rates.map((r, i) => (
              <div key={r.level} className={`flex items-center gap-2 ${i === 1 ? "font-bold" : ""}`}>
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ background: i === 1 ? GOLD : "#94a3b8" }}>
                  {i + 1}
                </span>
                <span className="flex-1 text-muted-foreground">{r.level}</span>
                <span className="font-semibold text-foreground">{r.pct}</span>
                <span className="text-muted-foreground">${rates[i].on100}</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2 flex justify-between font-bold">
              <span>Total on $100 across all 9 levels</span>
              <span style={{ color: GOLD }}>$71.00</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <InfoBox color="amber">
        <p className="font-semibold">Pro Tip: Level 2 is Key</p>
        <p>Level 2 pays <strong>24%</strong> — double the L1 rate. Help your direct recruits recruit others and you earn the highest PSC rate on their team's activity.</p>
      </InfoBox>
    </div>
  );
}

// ── PMRC ────────────────────────────────────────────────────────────────────
function PMRCSection() {
  const rates = [
    { level: "Level 1 (Direct)", pct: "12%", on150: "18.00" },
    { level: "Level 2", pct: "22%", on150: "33.00", note: "Highest rate — build your second tier" },
    { level: "Level 3", pct: "8%",  on150: "12.00" },
    { level: "Level 4", pct: "7%",  on150: "10.50" },
    { level: "Level 5", pct: "7%",  on150: "10.50" },
  ];
  return (
    <div className="space-y-5">
      <div className="rounded-xl p-5 text-white" style={{ background: `linear-gradient(135deg, ${GREEN}, #1a3a2a)` }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-xl">Pro Member Retail Commission (PMRC)</h2>
            <p className="text-white/70 text-xs">Earn when your network upgrades to Pro — 5 levels deep</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="rounded-lg bg-white/10 p-3 text-center">
            <p className="text-2xl font-black">22%</p>
            <p className="text-white/70 text-[10px] uppercase tracking-wide mt-0.5">L2 Peak Rate</p>
          </div>
          <div className="rounded-lg bg-white/10 p-3 text-center">
            <p className="text-2xl font-black">5</p>
            <p className="text-white/70 text-[10px] uppercase tracking-wide mt-0.5">Levels Deep</p>
          </div>
          <div className="rounded-lg bg-white/10 p-3 text-center">
            <p className="text-2xl font-black">Pro</p>
            <p className="text-white/70 text-[10px] uppercase tracking-wide mt-0.5">Registration</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Rate Table — 5 Levels</CardTitle></CardHeader>
        <CardContent>
          {rates.map(r => (
            <div key={r.level} className="flex items-center justify-between py-2.5 border-b last:border-0 gap-4">
              <div className="flex-1">
                <span className="text-sm font-medium text-foreground">{r.level}</span>
                {r.note && <p className="text-xs text-muted-foreground mt-0.5">{r.note}</p>}
              </div>
              <span className="text-sm font-bold text-primary">{r.pct}</span>
              <span className="text-xs text-muted-foreground w-28 text-right">${r.on150} on $150 pkg</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">What Triggers PMRC</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Bullet>Anytime someone in your network purchases a Pro Member Registration Package</Bullet>
          <Bullet>This is separate from PSC — PMRC is specifically for Pro registration purchases</Bullet>
          <Bullet>You must be an active Pro Member to earn PMRC</Bullet>
          <Bullet>L1 earns 12%, L2 earns 22% — support your direct recruits to help them recruit Pro Members</Bullet>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Scenario: $150 Pro Package Across 5 Levels</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-xl bg-muted p-4 text-xs space-y-1.5">
            {rates.map((r, i) => (
              <div key={r.level} className={`flex items-center gap-2 ${i === 1 ? "font-bold" : ""}`}>
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ background: i === 1 ? GREEN : "#94a3b8" }}>
                  {i + 1}
                </span>
                <span className="flex-1 text-muted-foreground">{r.level}</span>
                <span className="font-semibold text-foreground">{r.pct}</span>
                <span className="text-muted-foreground">${r.on150}</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2 flex justify-between font-bold">
              <span>Total earned on one $150 package through all 5 levels</span>
              <span style={{ color: GREEN }}>$84.00</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <InfoBox color="green">
        <p className="font-semibold">PMRC + PSC Together</p>
        <p>When someone in your downline registers as a Pro Member and then buys products, you earn <strong>PMRC</strong> on their registration AND <strong>PSC</strong> on their product purchases — two separate commission streams from the same person.</p>
      </InfoBox>
    </div>
  );
}

// ── POWER SQUAD BONUSES ──────────────────────────────────────────────────────
function PSBSection() {
  return (
    <div className="space-y-5">
      <div className="rounded-xl p-5 text-white" style={{ background: `linear-gradient(135deg, #92400e, #b45309)` }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
            <Star className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-xl">Power Squad Bonuses</h2>
            <p className="text-white/70 text-xs">Two milestone bonuses for team-building achievement</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="rounded-xl bg-white/10 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-white/60 mb-1">Core Leadership Bonus</p>
            <p className="text-3xl font-black text-white">$100</p>
            <p className="text-white/70 text-xs mt-1">One-time bonus</p>
          </div>
          <div className="rounded-xl bg-white/10 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-white/60 mb-1">Money Circulation Bonus</p>
            <p className="text-3xl font-black text-white">$200</p>
            <p className="text-white/70 text-xs mt-1">Recurring, unlimited cycles</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <Card className="border-amber-200 bg-amber-50/40">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-amber-800">Core Leadership Bonus (CLB)</CardTitle>
              <Badge className="bg-amber-600 text-white text-xs">$100 One-Time</Badge>
            </div>
          </CardHeader>
          <CardContent className="text-xs text-amber-900 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-white border border-amber-200 p-2.5">
                <p className="font-bold text-amber-700">Trigger</p>
                <p>9 qualified L1 Pro Members</p>
              </div>
              <div className="rounded-lg bg-white border border-amber-200 p-2.5">
                <p className="font-bold text-amber-700">Window</p>
                <p>90-day enrollment period</p>
              </div>
              <div className="rounded-lg bg-white border border-amber-200 p-2.5">
                <p className="font-bold text-amber-700">Amount</p>
                <p>$100 flat, one-time</p>
              </div>
              <div className="rounded-lg bg-white border border-amber-200 p-2.5">
                <p className="font-bold text-amber-700">Cycles</p>
                <p>One per member lifetime</p>
              </div>
            </div>
            <div className="rounded-lg bg-amber-100 border border-amber-300 p-3 space-y-1">
              <p className="font-semibold text-amber-800">What counts as "qualified"?</p>
              <p>A Level 1 Pro Member is qualified when their cumulative order volume reaches <strong>150 CV</strong> or more. Pro Members with less than 150 CV are counted as <strong>Unqualified Pro Members (UPM)</strong> and do not count toward your CLB trigger.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/40">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-orange-800">Money Circulation Bonus (MCB)</CardTitle>
              <Badge className="bg-orange-600 text-white text-xs">$200 Recurring</Badge>
            </div>
          </CardHeader>
          <CardContent className="text-xs text-orange-900 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-white border border-orange-200 p-2.5">
                <p className="font-bold text-orange-700">Trigger</p>
                <p>Every 7 new L2 Pro Members</p>
              </div>
              <div className="rounded-lg bg-white border border-orange-200 p-2.5">
                <p className="font-bold text-orange-700">Amount</p>
                <p>$200 per cycle</p>
              </div>
              <div className="rounded-lg bg-white border border-orange-200 p-2.5">
                <p className="font-bold text-orange-700">Cycles</p>
                <p>Unlimited</p>
              </div>
              <div className="rounded-lg bg-white border border-orange-200 p-2.5">
                <p className="font-bold text-orange-700">Requirement</p>
                <p>CLB must be unlocked first</p>
              </div>
            </div>
            <div className="rounded-lg bg-orange-100 border border-orange-300 p-3">
              <p className="font-semibold text-orange-800">Unlimited Earning Potential</p>
              <p>Every 7 Level 2 Pro Members = $200. No cap on cycles. 70 L2 Pro Members = $2,000 in MCB alone.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Unqualified Pro Member (UPM) Policy</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-3">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-red-50 border border-red-200 p-4">
              <p className="font-semibold text-red-800 text-xs uppercase tracking-wide mb-2">Unqualified (UPM)</p>
              <ul className="text-xs text-red-900 space-y-1">
                <li className="flex gap-1"><span>•</span><span>Pro Member status active</span></li>
                <li className="flex gap-1"><span>•</span><span>Cumulative purchase CV &lt; 150</span></li>
                <li className="flex gap-1"><span>•</span><span>Does NOT count toward your CLB trigger</span></li>
                <li className="flex gap-1"><span>•</span><span>Shown as amber slot in Power Squad tracker</span></li>
              </ul>
            </div>
            <div className="rounded-xl bg-green-50 border border-green-200 p-4">
              <p className="font-semibold text-green-800 text-xs uppercase tracking-wide mb-2">Qualified</p>
              <ul className="text-xs text-green-900 space-y-1">
                <li className="flex gap-1"><span>•</span><span>Pro Member status active</span></li>
                <li className="flex gap-1"><span>•</span><span>Cumulative purchase CV ≥ 150</span></li>
                <li className="flex gap-1"><span>•</span><span>Counts toward your CLB trigger</span></li>
                <li className="flex gap-1"><span>•</span><span>Shown as blue slot in Power Squad tracker</span></li>
              </ul>
            </div>
          </div>
          <InfoBox color="amber">
            <p>The 150 CV qualifying threshold is set by admin and may be adjusted. Check your dashboard Power Squad tracker for current status of each L1 Pro Member.</p>
          </InfoBox>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Power Squad Growth Scenario</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2 text-xs">
            {[
              { stage: "9 qualified L1 Pro Members join", bonus: "CLB unlocked — $100 one-time", color: GOLD },
              { stage: "First 7 L2 Pro Members join", bonus: "MCB Cycle 1 — $200", color: "#f59e0b" },
              { stage: "Next 7 L2 Pro Members (14 total)", bonus: "MCB Cycle 2 — $200", color: "#f59e0b" },
              { stage: "Next 7 L2 Pro Members (21 total)", bonus: "MCB Cycle 3 — $200", color: "#f59e0b" },
              { stage: "Continue indefinitely...", bonus: "$200 every 7 new L2 Pro Members", color: GREEN },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg bg-muted p-2.5">
                <ArrowRight className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                <span className="flex-1 text-muted-foreground">{s.stage}</span>
                <span className="font-bold" style={{ color: s.color }}>{s.bonus}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── BILL PAYER PROGRAM ───────────────────────────────────────────────────────
function BPPSection() {
  const bonuses = [
    { name: "Grocery Bonus", desc: "Help cover monthly grocery costs for your family", gv: "~$1,500 GV", pv: "150 PV" },
    { name: "Utilities Bonus", desc: "Cover monthly utility bills — electric, gas, water", gv: "~$3,000 GV", pv: "150 PV" },
    { name: "Car Note Bonus", desc: "Cover monthly vehicle payment expenses", gv: "~$5,000 GV", pv: "150 PV" },
    { name: "Mortgage Bonus", desc: "Help offset housing costs — rent or mortgage", gv: "~$8,000 GV", pv: "150 PV" },
    { name: "Dream Life Bonus", desc: "The ultimate BPP tier for top team builders", gv: "~$15,000 GV", pv: "150 PV" },
  ];
  return (
    <div className="space-y-5">
      <div className="rounded-xl p-5 text-white" style={{ background: `linear-gradient(135deg, #831843, #be185d)` }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
            <Home className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-xl">Bill Payer Program (BPP)</h2>
            <p className="text-white/70 text-xs">5 Group Volume Bonuses designed to cover your real-life monthly expenses</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="rounded-lg bg-white/10 p-3 text-center">
            <p className="text-2xl font-black">5</p>
            <p className="text-white/70 text-[10px] uppercase tracking-wide mt-0.5">Bonus Tiers</p>
          </div>
          <div className="rounded-lg bg-white/10 p-3 text-center">
            <p className="text-2xl font-black">150</p>
            <p className="text-white/70 text-[10px] uppercase tracking-wide mt-0.5">PV Required</p>
          </div>
          <div className="rounded-lg bg-white/10 p-3 text-center">
            <p className="text-2xl font-black">GV</p>
            <p className="text-white/70 text-[10px] uppercase tracking-wide mt-0.5">Group Volume</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">The 5 Group Volume Bonuses</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {bonuses.map((b, i) => (
            <div key={b.name} className="rounded-xl border p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: "#be185d" }}>{i + 1}</span>
                  <p className="font-semibold text-sm text-foreground">{b.name}</p>
                </div>
                <Badge variant="outline" className="text-xs flex-shrink-0">{b.gv}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{b.desc}</p>
              <p className="text-xs text-muted-foreground">Personal Volume required: <strong className="text-foreground">{b.pv}/month</strong></p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Qualification Requirements</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Bullet>You must be an active <strong>Pro Member</strong> to qualify for any BPP tier.</Bullet>
          <Bullet>You must maintain a minimum of <strong>150 PV</strong> per month through your own product and service purchases.</Bullet>
          <Bullet>Your team must reach the Group Volume (GV) threshold for each bonus tier.</Bullet>
          <Bullet>Note: Your Pro Member Registration Package PV <strong>activates eligibility</strong> but may not fully satisfy the 150 PV requirement on its own — additional purchases may be needed.</Bullet>
          <Bullet>Bonuses are reviewed and paid at end of each calendar month directly to your NFGN E-Wallet.</Bullet>
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-amber-800 flex items-center gap-2">
            <Info className="h-4 w-4" /> PV vs Registration Package
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-amber-900 space-y-2">
          <p>Purchasing a Pro Member Registration Package upgrades you to Pro Member status and makes you <strong>eligible</strong> to earn BPP bonuses.</p>
          <p>However, if your registration package provides less than 150 PV, you still need additional product purchases to reach the monthly PV requirement.</p>
          <div className="rounded-lg bg-white border border-amber-200 p-3 space-y-1">
            <p className="font-semibold text-amber-800">Example</p>
            <p>You purchase a 50 PV Pro Package → You become a Pro Member ✓</p>
            <p>But you still need <strong>100 more PV</strong> in product purchases to qualify for BPP bonuses that month.</p>
          </div>
        </CardContent>
      </Card>

      <InfoBox color="blue">
        <p className="font-semibold">The Story Behind BPP</p>
        <p>The Bill Payer Program was created by Mr. Marcelino to help qualifying Pro Members offset real monthly living expenses — groceries, utilities, car payments, and more. It is one of the most unique features of the NFGN compensation structure.</p>
      </InfoBox>
    </div>
  );
}

// ── MAIN PAGE ────────────────────────────────────────────────────────────────
export function CompPlanPage() {
  const [loc] = useLocation();
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const initial = params.get("s") ?? "overview";
  const [active, setActive] = useState(initial);

  useEffect(() => {
    const syncSection = () => {
      const s = new URLSearchParams(window.location.search).get("s");
      if (s && SECTIONS.some(sec => sec.id === s)) setActive(s);
    };
    syncSection();
    window.addEventListener("nfgn:nav", syncSection);
    window.addEventListener("popstate", syncSection);
    return () => {
      window.removeEventListener("nfgn:nav", syncSection);
      window.removeEventListener("popstate", syncSection);
    };
  }, [loc]);

  const handleChange = (s: string) => {
    setActive(s);
    const url = new URL(window.location.href);
    url.searchParams.set("s", s);
    window.history.replaceState({}, "", url.toString());
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl p-6 text-white" style={{ background: `linear-gradient(135deg, ${BLACK}, #1a1a1a)` }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: `${GOLD}30` }}>
            <Award className="h-5 w-5" style={{ color: GOLD }} />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold">NFGN Compensation Plan</h1>
            <p className="text-white/60 text-sm">The complete guide to all five income streams</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {["RC", "PSC", "PMRC", "Power Squad Bonuses", "Bill Payer Program"].map(b => (
            <Badge key={b} className="text-xs" style={{ background: `${GOLD}25`, color: GOLD, border: `1px solid ${GOLD}40` }}>{b}</Badge>
          ))}
        </div>
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        <aside className="lg:w-52 flex-shrink-0">
          <SectionNav active={active} onChange={handleChange} />
        </aside>

        <div className="flex-1 min-w-0">
          {active === "overview" && <OverviewSection />}
          {active === "rc"       && <RCSection />}
          {active === "psc"      && <PSCSection />}
          {active === "pmrc"     && <PMRCSection />}
          {active === "psb"      && <PSBSection />}
          {active === "bpp"      && <BPPSection />}
        </div>
      </div>
    </div>
  );
}
