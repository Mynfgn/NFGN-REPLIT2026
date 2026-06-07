import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useGetMe } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign, TrendingUp, Users, Star, Award, Home,
  ChevronRight, CheckCircle2, Info, Zap, ArrowRight, BookOpen,
  Leaf, CalendarDays, Sparkles, Trophy, Shield, CreditCard,
  Heart, AlertTriangle, Ban, ThumbsUp,
} from "lucide-react";

const GOLD = "#C9A84C";
const GREEN = "#2D6A4F";
const BLACK = "#0a0a0a";

const SECTIONS = [
  { id: "terminology", label: "Terminology & Glossary", icon: BookOpen },
  { id: "overview",    label: "Overview",               icon: Zap },
  { id: "rc",          label: "Referral Commission",    icon: DollarSign },
  { id: "psc",         label: "Product Sales Comm.",    icon: TrendingUp },
  { id: "pmrc",        label: "Multi-Level Retail",     icon: Users },
  { id: "psb",         label: "Power Squad Bonuses",    icon: Star },
  { id: "bpp",         label: "Bill Payer Program",     icon: Home },
  { id: "donations",   label: "Gifts & Donations",      icon: Heart },
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

// ── TERMINOLOGY ───────────────────────────────────────────────────────────────
function TermCell({ term, abbr, def }: { term: string; abbr?: string; def: string }) {
  return (
    <div className="rounded-xl border p-4 space-y-1.5 bg-card">
      <div className="flex items-start justify-between gap-2">
        <p className="font-bold text-sm text-foreground leading-tight">{term}</p>
        {abbr && <Badge variant="outline" className="text-[10px] font-bold tracking-widest flex-shrink-0">{abbr}</Badge>}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{def}</p>
    </div>
  );
}

function TermGroup({ title, color = GOLD, children }: { title: string; color?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-0.5 w-5 rounded" style={{ background: color }} />
        <h3 className="text-xs font-extrabold uppercase tracking-[0.2em]" style={{ color }}>{title}</h3>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function TerminologySection() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-2xl p-6 text-white" style={{ background: `linear-gradient(135deg, #1a1100, #0a0a0a)`, border: `1px solid ${GOLD}30` }}>
        <div className="flex items-start gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: `${GOLD}25`, border: `1px solid ${GOLD}50` }}>
            <BookOpen className="h-5 w-5" style={{ color: GOLD }} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold mb-0.5" style={{ color: GOLD }}>Master Your Language</p>
            <h2 className="text-xl font-serif font-bold">NFGN Terminology & Glossary</h2>
            <p className="text-white/50 text-xs mt-0.5">Every term used in the compensation plan, explained clearly</p>
          </div>
        </div>
        <p className="text-sm text-white/70 leading-relaxed">
          Understanding the language of NFGN is the first step to mastering the income opportunity. Every term below is used throughout your back office, commission reports, and training materials. Study these until they become second nature.
        </p>
      </div>

      {/* ── Six Business Pillars ─────────────────────────────── */}
      <TermGroup title="The Six Business Pillars">
        <TermCell term="Naturopathic, Mental Health, & Primary Care" abbr="Pillar 1" def="Products, services, and Medical Benefit Packages covering naturopathic health, mental wellness, and primary care. The core of NFGN's wellness mission." />
        <TermCell term="Book-A-Professional" abbr="Pillar 2" def="The professional booking platform connecting members with certified wellness practitioners, coaches, naturopaths, and consultants for one-on-one sessions." />
        <TermCell term="Business Opportunities" abbr="Pillar 3" def="The commission-based income arm of NFGN — powered by the 2 Down By Infinity Multi-Point Payment Grid. Open to all Pro Members." />
        <TermCell term="NFGN Sports" abbr="Pillar 4" def="The athletic community division — funding youth programs, school teams, local leagues, and sports nonprofits through the NFGN money circulation grid." />
        <TermCell term="NFGN Products & Services" abbr="Pillar 5" def="Handcrafted artisan goods including handmade soaps, candles, lotions, and other natural body care products made with love and sold through the NFGN platform." />
        <TermCell term="Special Events, Travel, & Workshops" abbr="Pillar 6" def="Exclusive NFGN retreats, live training workshops, travel experiences, and member events. Designed to educate, connect, and inspire the community." />
      </TermGroup>

      {/* ── Member Tiers ─────────────────────────────────────── */}
      <TermGroup title="Member Tiers (Lowest → Highest)" color={GREEN}>
        <TermCell term="Retail Member" abbr="RM" def="The entry-level tier. Customers who purchase products without a referral or business relationship. No commission qualification." />
        <TermCell term="Referring Retail Member" abbr="RRM" def="A retail member who has referred at least one other customer to NFGN. Earns basic referral credit but is not commission-qualified." />
        <TermCell term="Retail Community Builder" abbr="RCB" def="An active retail member building a customer base. Eligible to earn referral commissions (RC) but does not yet hold Pro Member status." />
        <TermCell term="Associate Pro Member" abbr="APM" def="A dynamic status earned when a Pro Member has 9 or more active Level 1 Pro Members. Automatically promoted when the threshold is met; reverts to Pro Member if the count drops below 9." />
        <TermCell term="Pro Member" abbr="PM" def="The full commission-qualified tier. Requires an active Pro Member Registration Package (PRP) AND a minimum of 150 PCV in any rolling 30-day window. Unlocks all five income streams." />
      </TermGroup>

      {/* ── Volume Terms ─────────────────────────────────────── */}
      <TermGroup title="Volume Terms">
        <TermCell term="Commissionable Volume" abbr="CV" def="A point value assigned to every NFGN product. CV is the base unit used to calculate all commissions across all programs. It is not a dollar amount — it is a score." />
        <TermCell term="Personal Commissionable Volume" abbr="PCV / PV" def="The total CV generated by your own purchases within a rolling 30-day window. Also called Personal Volume (PV). Maintaining 150+ PCV keeps Pro Member status active." />
        <TermCell term="Group Commissionable Volume" abbr="GCV / GV" def="The total CV generated by your entire downline organization — all levels combined. Also called Group Volume (GV). Used to unlock BPP bonus funds." />
        <TermCell term="Zone GCV" abbr="Zone GV" def="GCV from Levels 2, 3, 4, and 5 only (the Zone of Duplication). This — NOT your Level 1 volume — determines your BPP qualification. Level 1 and Levels 6–9 are excluded from Zone GCV." />
        <TermCell term="Rolling 30-Day PCV" def="PCV is evaluated on a rolling 30-day basis, not a calendar month. If your last 150 CV of personal purchases was more than 30 days ago, your Pro Member maintenance status is at risk." />
      </TermGroup>

      {/* ── Income Stream Abbreviations ─────────────────────── */}
      <TermGroup title="Income Streams & Abbreviations" color="#3b82f6">
        <TermCell term="Referral Commission" abbr="RC" def="A fixed dollar amount earned per unit sold, set individually per product by administration (e.g. $6.00 per unit). It does not change based on the sale price. Check the product listing or Da' Money Calculator for the exact RC amount on any product. Earned by all active members — no Pro Member status required." />
        <TermCell term="Product Sales Commission" abbr="PSC" def="Up to 24% earned across 9 levels of your downline on product purchases. Pro Members only. Level 2 always pays the highest rate (24%) — double the Level 1 rate of 12%." />
        <TermCell term="Pro Member Retail Commission" abbr="PMRC" def="Up to 22% earned across 5 levels when someone in your downline purchases a Pro Member Registration Package. Pro Members only. Separate from PSC." />
        <TermCell term="Core Leadership Bonus" abbr="CLB" def="A one-time $100 bonus triggered when you personally enroll 9 qualified Level 1 Pro Members (each with 150+ cumulative CV). A fast-start milestone reward." />
        <TermCell term="Money Circulation Bonus" abbr="MCB" def="A recurring $200 bonus paid every time 7 new Level 2 Pro Members join your organization. Unlimited cycles — no cap on how many times it can fire." />
        <TermCell term="Bill Payer Program" abbr="BPP" def="Five Group Volume Bonus Funds designed to offset real monthly expenses: Phone/Internet ($185), Medical ($350), Utilities ($450), Car ($600), Rent/Mortgage ($1,500). Max $3,085/month." />
      </TermGroup>

      {/* ── Organizational Terms ─────────────────────────────── */}
      <TermGroup title="Organizational Structure" color={GREEN}>
        <TermCell term="Downline" def="Every member in your network below you — across all levels. Your downline's purchases and enrollments generate your commissions." />
        <TermCell term="Upline" def="Every member above you in the network — your sponsor, their sponsor, and so on. Your upline earns commissions from your activity." />
        <TermCell term="Level / Generation" def="Two words for the same thing. Level 1 = people you personally referred. Level 2 = people they referred. Each subsequent layer adds one level." />
        <TermCell term="Core Leadership Group" abbr="CLG" def="Your direct Level 1 team — the people you personally recruited. Building a strong CLG is the foundation of all income streams." />
        <TermCell term="Zone of Duplication" def="Levels 2 through 5 of your organization. This is where BPP Group Volume is calculated and where the '2 Down By Infinity' structure creates the most leverage." />
        <TermCell term="Wealth Builders Community" def="The people within your Zone of Duplication (Levels 2–5). These members are the engine of your BPP qualification and long-term residual income." />
      </TermGroup>

      {/* ── Plan & Platform Terms ─────────────────────────────── */}
      <TermGroup title="Plan & Platform Terms">
        <TermCell term="2 Down By Infinity" def="The official name of NFGN's proprietary compensation plan, invented by Joe Marcelino. The '2 Down' refers to the emphasis on Level 2; 'By Infinity' means there is no depth limit on earning." />
        <TermCell term="Multi-Point Payment Grid" def="The alternative (expanded) name for the 2 Down By Infinity plan. Reflects that money circulates through multiple points in the network, not just to the top." />
        <TermCell term="Pro Member Registration Package" abbr="PRP" def="The required product purchase that activates Pro Member status. Must remain active (not lapsed) for commission qualification. PRPs are isProPackage=true and are tracked separately from regular product orders." />
        <TermCell term="Unqualified Pro Member" abbr="UPM" def="A Pro Member whose cumulative CV has not yet reached 150. UPMs do not count toward your CLB trigger and are shown as amber slots in the Power Squad tracker." />
        <TermCell term="NFGN E-Wallet" def="The digital wallet inside your back office where commissions, bonuses, and BPP payouts are deposited. Funds can be transferred or paid out per the payout schedule." />
        <TermCell term="Dollar Credit" def="A credit applied to your account — may be earned through specific promotions or programs. Check your wallet for any dollar credit balances." />
        <TermCell term="Back Office" def="Your personal member dashboard — the platform you are using right now. Contains your commission reports, genealogy, wallet, training, tools, and team management." />
        <TermCell term="Referral Link" def="Your unique personal URL tied to your account. Anyone who visits NFGN through your link is attributed to you as a referral, triggering RC on their purchases." />
      </TermGroup>

      {/* Quick Reference Card */}
      <div className="rounded-2xl border p-6 space-y-4" style={{ background: `${GOLD}08`, borderColor: `${GOLD}30` }}>
        <p className="text-xs font-extrabold uppercase tracking-[0.2em]" style={{ color: GOLD }}>Quick Abbreviation Reference</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            ["RC", "Referral Commission"],
            ["PSC", "Product Sales Commission"],
            ["PMRC", "Pro Member Retail Comm."],
            ["CLB", "Core Leadership Bonus"],
            ["MCB", "Money Circulation Bonus"],
            ["BPP", "Bill Payer Program"],
            ["CV", "Commissionable Volume"],
            ["PCV / PV", "Personal Comm. Volume"],
            ["GCV / GV", "Group Comm. Volume"],
            ["PRP", "Pro Member Reg. Package"],
            ["UPM", "Unqualified Pro Member"],
            ["APM", "Associate Pro Member"],
            ["RM", "Retail Member"],
            ["RRM", "Referring Retail Member"],
            ["RCB", "Retail Community Builder"],
            ["CLG", "Core Leadership Group"],
            ["PM", "Pro Member"],
          ].map(([abbr, full]) => (
            <div key={abbr} className="flex items-center gap-2 text-xs">
              <span className="font-bold flex-shrink-0" style={{ color: GOLD, minWidth: 56 }}>{abbr}</span>
              <span className="text-muted-foreground">{full}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── OVERVIEW ──────────────────────────────────────────────────────────────────
function OverviewSection() {
  return (
    <div className="space-y-6">

      {/* ── 2 Down By Infinity — Hero Card ───────────────────────── */}
      <div className="rounded-2xl p-6 text-white space-y-4" style={{ background: `linear-gradient(135deg, #1a1100, #0a0a0a)`, border: `1px solid ${GOLD}30` }}>
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: `${GOLD}25`, border: `1px solid ${GOLD}50` }}>
            <Award className="h-5 w-5" style={{ color: GOLD }} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold mb-0.5" style={{ color: GOLD }}>Official Name of Our Compensation Plan</p>
            <h2 className="text-xl font-serif font-bold leading-tight">"2 Down By Infinity" Pay Structure</h2>
            <p className="text-white/50 text-xs mt-0.5">Also known as: <span className="text-white/70 italic">2 Down By Infinity Multi-Point Payment Grid</span></p>
          </div>
        </div>

        <p className="text-sm text-white/75 leading-relaxed">
          Invented, designed, and solely developed by <strong className="text-white">Joe Marcelino</strong>, the "2 Down By Infinity" Pay Structure
          was intentionally built for the <strong className="text-white">average person, the inexperienced person, and the underprivileged person</strong>.
          Mr. Marcelino's vision was clear: create a compensation system where anyone — regardless of background, sales experience, or financial
          starting point — could genuinely succeed.
        </p>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>Why Is It Called "2 Down By Infinity"?</p>
          <p className="text-sm text-white/75 leading-relaxed">
            The name comes from the plan's key design principle: there is a <strong className="text-white">primary focus on the second level (Generation 2)</strong>.
            This is not an accident — it is a deliberate strategy to help your <strong className="text-white">Generation 1 members start earning commissions
            as quickly as possible</strong>.
          </p>
          <p className="text-sm text-white/75 leading-relaxed">
            In the standard model, most commissions go to the person at the top. In the 2 Down By Infinity structure, the emphasis is
            placed two levels down — so when your Level 2 grows, the payout flows <em>back up</em> to help your Level 1 members get paid.
            This creates a system where your team's growth directly benefits the people closest to you, getting everyone into income
            as fast as possible.
          </p>
          <div className="flex items-start gap-2 pt-1">
            <ArrowRight className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: GOLD }} />
            <p className="text-xs text-white/60 leading-relaxed">
              "By Infinity" refers to the unlimited depth of the plan — commissions can travel down through generations indefinitely as
              your organization grows, with no artificial ceiling on how deep your earning potential can reach.
            </p>
          </div>
        </div>

        <div className="rounded-lg border-l-4 px-4 py-3" style={{ borderColor: GOLD, background: `${GOLD}10` }}>
          <p className="text-sm italic text-white/80 leading-relaxed">
            "Our goal is to help people start making money as soon as possible — that is the entire reason this pay structure was built."
          </p>
          <p className="text-xs text-white/40 mt-1">— The NFGN Philosophy</p>
        </div>
      </div>

      {/* ── Five Income Streams ───────────────────────────────────── */}
      <div className="rounded-2xl p-6 text-white" style={{ background: `linear-gradient(135deg, ${BLACK}, #1a1a1a)` }}>
        <h2 className="text-2xl font-serif font-bold mb-1">Five Income Streams</h2>
        <p className="text-white/70 text-sm mb-5">NFGN members can earn through five distinct income streams — three commission types and two bonus programs — spanning six business pillars.</p>
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
            <p><strong>Amount:</strong> Fixed $ per unit sold — set per product by admin</p>
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
            <p><strong>5 Group Volume Bonus Funds</strong> — Phone/Internet ($185), Medical ($350), Utilities ($450), Car ($600), Rent/Mortgage ($1,500).</p>
            <p><strong>GV thresholds:</strong> 8,000 / 10,000 / 12,000 / 15,000 / 18,000 GV respectively.</p>
            <p><strong>Who earns:</strong> Qualified Pro Members maintaining 150+ PV/month whose team GV meets each fund's threshold.</p>
            <p><strong>Payout:</strong> End-of-month directly to your NFGN E-Wallet. Up to $3,085/month if all 5 funds are unlocked.</p>
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
              { label: "RC — referral commissions on $3,000 in direct referral sales", val: "$300" },
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

      {/* ── Membership Tiers ──────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" /> Membership Tiers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-xl overflow-hidden border divide-y">
            {[
              { tier: "Retail Member (RM)", color: "#6b7280", desc: "Entry-level customers. Store access, referral link, and Book-A-Pro. No commission qualification." },
              { tier: "Referring Retail Member (RRM)", color: GOLD, desc: "Automatically upgraded when their first referral signs up. Earns Dollar Credit ($-Credit) on qualifying purchases — not cash." },
              { tier: "Unqualified Pro Member (UPM)", color: "#a78bfa", desc: "Earns commissions on Levels 1 & 2 only. Must reach 150 PCV (rolling 30-day) to qualify for full Pro Membership." },
              { tier: "Pro Member (PM)", color: GREEN, desc: "Full Business Suite. All 9 commission levels, CLB, MCB, BPP participation. Requires an active PRP subscription and 150+ PCV in every rolling 30-day window." },
            ].map(({ tier, color, desc }) => (
              <div key={tier} className="flex items-start gap-3 p-4 bg-card" style={{ borderLeft: `3px solid ${color}` }}>
                <div className="flex-1">
                  <p className="text-sm font-bold mb-0.5" style={{ color }}>{tier}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-xl p-4 space-y-1" style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}30` }}>
            <p className="text-xs font-bold" style={{ color: GOLD }}>Easiest Path to Full Pro Membership:</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Purchase an NFGN <strong>Pro Member Registration Package (PRP)</strong>. It already includes the required 150 PCV — one step, fully unlocked. If you cannot purchase a PRP at this time, you may accumulate 150 PCV through product purchases or reach the Unqualified Pro Member threshold by referring 9 Pro Members.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Dollar Credit Policy ──────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" /> Dollar Credit ($-Credit) Policy
            <Badge className="text-[10px] font-bold ml-1" style={{ background: GOLD, color: "#000" }}>RRM+</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Dollar Credit — also referred to as <strong>$-Credit</strong> or <strong>DC</strong> — is a store-credit reward earned by Referring Retail Members on qualifying referral purchases. It is <strong>not</strong> cash and cannot be withdrawn unless the member upgrades to Pro Member status or meets the cash-out threshold.
          </p>
          <div className="rounded-xl border divide-y overflow-hidden">
            {[
              { label: "How It's Earned", desc: "A Referring Retail Member earns $-Credit when a referred member makes a qualifying purchase, calculated at the applicable referral commission rate." },
              { label: "7-Day Hold", desc: "$-Credit is placed in 'pending' status for 7 days from the referral purchase date. This aligns with the 7-day refund window on eligible products." },
              { label: "30-Day Use Window", desc: "Once the hold clears, members have 30 days to use their $-Credit before it expires." },
              { label: "Total Expiry (37 Days)", desc: "$-Credit expires 37 days from the original referral purchase date (7-day hold + 30-day use window). Expired credit is permanently forfeited — no exceptions." },
              { label: "Refund Impact", desc: "If the purchase that generated $-Credit is refunded, that $-Credit is immediately revoked. If already spent, the member's balance goes negative and must be resolved on their next purchase." },
              { label: "Redemption", desc: "$-Credit can only be applied to products designated as '$-Credit Eligible.' At checkout it is applied first, reducing the amount owed." },
            ].map(({ label, desc }) => (
              <div key={label} className="p-3 bg-card space-y-0.5">
                <p className="text-xs font-bold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── $-Credit Cash-Out Policy ──────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Star className="h-4 w-4 text-muted-foreground" /> $-Credit Cash-Out Policy
            <Badge className="text-[10px] font-bold ml-1" style={{ background: GOLD, color: "#000" }}>RRM+</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Referring Retail Members can unlock the ability to convert their $-Credit into a cash payout by meeting the following threshold:
          </p>
          <div className="rounded-xl border p-4 bg-card space-y-2">
            {[
              "Refer a minimum of 9 Retail Members (not Pro Members) who sign up using your referral link.",
              "Once the threshold is met, request a cash-out of your available $-Credit balance through the dashboard.",
              "Cash-out requests are processed by NFGN administration within 3–5 business days.",
              "Paid via the payout method on file (bank transfer, PayPal, or CashApp).",
              "NFGN reserves the right to verify referrals before approving cash-out requests.",
            ].map(item => (
              <div key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                {item}
              </div>
            ))}
          </div>
          <InfoBox color="amber">
            <p className="font-bold">Pro Tip — The Better Path:</p>
            <p>The easiest way to turn ALL future referral earnings into direct cash — with no expiration, no 37-day clock — is to upgrade to Pro Member. As a Pro Member you earn real cash commissions across all 9 levels, plus CLB, MCB, BPP, and more.</p>
          </InfoBox>
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
            <p className="text-white/70 text-xs">Earn a fixed dollar amount per unit sold — set per product by administration</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="rounded-lg bg-white/10 p-3 text-center">
            <p className="text-2xl font-black">$ Flat</p>
            <p className="text-white/70 text-[10px] uppercase tracking-wide mt-0.5">Per Unit Sold</p>
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
          <Bullet>When your direct referral buys a product, you earn the fixed RC dollar amount assigned to that product — regardless of any discount or sale price.</Bullet>
          <Bullet>Every product has its own RC dollar amount set by administration. The exact amount is shown on each product listing and in the Da' Money Calculator.</Bullet>
          <Bullet>This applies to products, services, and Pro Member packages purchased by your direct referral.</Bullet>
          <Bullet>No special rank or Pro Member status required — all active members earn RC.</Bullet>
          <Bullet>Commissions are credited to your NFGN E-Wallet and paid according to the payout schedule.</Bullet>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Example Earnings</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            RC is a fixed dollar amount — not a percentage of the price. You earn the same RC dollar amount every time a unit sells, regardless of discounts or promotions:
          </p>
          <div className="rounded-xl bg-muted p-4 space-y-2 text-sm">
            {[
              { desc: "Product A — RC set at $6.00/unit",      earn: "$6.00",  sub: "You earn $6.00 per unit regardless of sale price" },
              { desc: "Product B — RC set at $1.50/unit (×3)", earn: "$4.50",  sub: "3 units × $1.50 flat RC = $4.50" },
              { desc: "Pro Package — RC set at $20.00/unit",   earn: "$20.00", sub: "Fixed RC on Pro Package regardless of price" },
              { desc: "Mixed order: 2 different products",     earn: "$7.50",  sub: "$6.00 + $1.50 — each product's flat RC added together" },
            ].map(e => (
              <div key={e.desc} className="border-b last:border-0 pb-2 last:pb-0">
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">{e.desc}</span>
                  <span className="font-bold text-foreground text-xs">{e.earn}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 italic">{e.sub}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900">
            <p className="font-semibold mb-1">How to find a product's RC amount</p>
            <p>Each product detail page shows its RC amount in the compensation code. Use the <strong>Da' Money Calculator</strong> in your dashboard — enter any Product ID to instantly see the exact RC dollar amount per unit sold.</p>
          </div>
        </CardContent>
      </Card>

      <InfoBox color="blue">
        <p className="font-semibold">Key Rules</p>
        <p>RC applies only to your <strong>direct (Level 1)</strong> referrals' purchases. You earn the fixed dollar RC amount set on each product — it does not change with price or discounts. Purchases by their downline are covered by PSC (for Pro Members).</p>
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
  const { data: me } = useGetMe();
  const isProMember = me?.role === "pro_member";

  const funds = [
    {
      name: "Phone / Internet Fund",
      desc: "Helps qualifying Pro Members offset their monthly phone and internet bill.",
      gv: "8,000 GV",
      pv: "150 PV",
      cap: "Up to $185/mo",
      color: "#8B5CF6",
    },
    {
      name: "Medical Fund",
      desc: "Helps qualifying Pro Members offset medical and health-related expenses.",
      gv: "10,000 GV",
      pv: "150 PV",
      cap: "Up to $350/mo",
      color: "#EC4899",
    },
    {
      name: "Utilities Fund",
      desc: "Helps qualifying Pro Members offset monthly utility bills — electric, gas, water.",
      gv: "12,000 GV",
      pv: "150 PV",
      cap: "Up to $450/mo",
      color: "#10B981",
    },
    {
      name: "Car Fund",
      desc: "Helps qualifying Pro Members offset their monthly vehicle payment.",
      gv: "15,000 GV",
      pv: "150 PV",
      cap: "Up to $600/mo",
      color: "#F59E0B",
    },
    {
      name: "Rent / Mortgage Fund",
      desc: "Helps qualifying Pro Members offset their monthly rent or mortgage payment.",
      gv: "18,000 GV",
      pv: "150 PV",
      cap: "Up to $1,500/mo",
      color: "#3B82F6",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Hero header */}
      <div className="rounded-xl p-5 text-white" style={{ background: `linear-gradient(135deg, #1a0a2e, #2d1b69)` }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
            <Home className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-xl">Bill Payer Program (BPP)</h2>
            <p className="text-white/70 text-xs">5 Group Volume Bonus Funds — each designed to cover a real monthly expense</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="rounded-lg bg-white/10 p-3 text-center">
            <p className="text-2xl font-black">5</p>
            <p className="text-white/70 text-[10px] uppercase tracking-wide mt-0.5">Bonus Funds</p>
          </div>
          <div className="rounded-lg bg-white/10 p-3 text-center">
            <p className="text-2xl font-black">150</p>
            <p className="text-white/70 text-[10px] uppercase tracking-wide mt-0.5">PV Required</p>
          </div>
          <div className="rounded-lg bg-white/10 p-3 text-center">
            <p className="text-2xl font-black text-[#C9A84C]">$3,085</p>
            <p className="text-white/70 text-[10px] uppercase tracking-wide mt-0.5">Max Monthly (all 5)</p>
          </div>
        </div>
      </div>

      {/* ── ATTN: Zone GCV Rule (Pro Members only) ──────────────── */}
      {isProMember && (
        <div className="rounded-xl border-2 border-amber-400 bg-amber-50 p-4">
          <div className="flex gap-3 items-start">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-extrabold tracking-widest bg-amber-400 text-black uppercase flex-shrink-0 mt-0.5">
              ATTN
            </span>
            <div className="space-y-1">
              <p className="font-bold text-amber-900 text-sm">BPP GCV Qualification Rule — Pro Members</p>
              <p className="text-sm text-amber-800 leading-relaxed">
                Your BPP Group Commissionable Volume (GCV) is calculated <strong>only from Levels 2, 3, 4, and 5</strong> — your Zone of Duplication.{" "}
                Volume from your <strong>Level 1 (direct referrals)</strong> does <strong>NOT</strong> count toward BPP qualification.
                Neither does volume from Levels 6 through 9. Only Zone GCV (Levels 2–5) determines your BPP fund eligibility.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Zone of Duplication ─────────────────────────────────── */}
      <div className="rounded-2xl border border-[#C9A84C]/30 bg-[#0a0a0a] text-white p-6 space-y-5">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: GOLD }}>How BPP GCV Works</p>
          <h3 className="text-lg font-serif font-bold">The Zone of Duplication</h3>
          <p className="text-white/60 text-xs mt-0.5">Levels 2 · 3 · 4 · 5 — where your BPP volume is generated</p>
        </div>

        <p className="text-sm text-white/75 leading-relaxed">
          The GCV that counts toward your BPP bonuses does <strong className="text-white">not</strong> come from Level 1.
          It comes from <strong className="text-white">Levels 2, 3, 4, and 5</strong> — an area of your organization known
          as your <strong className="text-white">Zone of Duplication</strong>. This is where your{" "}
          <strong className="text-white">Wealth Builders Community</strong> lives, and it is the heart of your group's
          money circulation.
        </p>

        {/* Level 2 highlight */}
        <div className="rounded-xl bg-white/5 border border-[#C9A84C]/30 p-4 space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>Level 2 Always Pays the Most</p>
          <p className="text-sm text-white/75 leading-relaxed">
            Level 2 is the most powerful level in your entire organization. It generally carries a{" "}
            <strong className="text-white">50% commission match</strong> of your Level 1 percentage — meaning if your
            Level 1 commission rate is <strong className="text-white">12%</strong>, your Level 2 rate is{" "}
            <strong className="text-white">24%</strong>. No other level pays more.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="rounded-lg bg-white/10 p-3 text-center">
              <p className="text-xs text-white/50 uppercase tracking-widest mb-1">Level 1</p>
              <p className="text-2xl font-black" style={{ color: GOLD }}>12%</p>
              <p className="text-[10px] text-white/40">Base rate</p>
            </div>
            <div className="rounded-lg p-3 text-center" style={{ background: `${GOLD}20`, border: `1px solid ${GOLD}50` }}>
              <p className="text-xs text-white/50 uppercase tracking-widest mb-1">Level 2</p>
              <p className="text-2xl font-black" style={{ color: GOLD }}>24%</p>
              <p className="text-[10px] text-white/40">50% match — always highest</p>
            </div>
          </div>
        </div>

        {/* Purpose */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>The Purpose</p>
          <p className="text-sm text-white/75 leading-relaxed">
            This structure was intentionally designed to encourage upline sponsors to{" "}
            <strong className="text-white">place new members and customers under their Core Leadership Group</strong>{" "}
            (Generation 1). When a new customer is placed on someone in your Level 1 who needs financial help, it creates
            excitement and builds confidence — and that activity flows directly into your Zone of Duplication, generating
            GCV that qualifies you for BPP bonuses.
          </p>
          <p className="text-sm text-white/75 leading-relaxed">
            This simple wealth-building concept — when combined with good training, powerful words of wisdom and affirmation,
            a clear understanding of your <em className="text-white">Why</em> and vision, and putting the work behind the
            faith — will always produce a positive, efficient, and productive culture.
          </p>
        </div>

        {/* Three quotes */}
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>Three Guiding Principles — Joe Marcelino</p>
          {[
            "Help Yourself By Helping Another.",
            "If you want to be successful at building your leadership, you must first be successful at building leaders.",
            "Communities don't build people. People build communities.",
          ].map((quote, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span
                className="h-6 w-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black mt-0.5"
                style={{ background: `${GOLD}25`, color: GOLD, border: `1px solid ${GOLD}50` }}
              >
                {i + 1}
              </span>
              <p className="text-sm italic text-white/80 leading-relaxed">"{quote}"</p>
            </div>
          ))}
        </div>

        {/* How to build */}
        <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>Building Your Wealth Builders Community</p>
          <p className="text-sm text-white/75 leading-relaxed">
            To maximize your BPP, take focused time to build your{" "}
            <strong className="text-white">Core Leadership Group</strong> — and then help each of those leaders build
            their own Core Leadership Groups. The more Core Leadership Groups you have at each level, the greater your
            group volume. The greater your group volume, the faster you arrive at maximizing the Bill Payer Program
            and unlocking the full benefits of the{" "}
            <strong className="text-white">2 Down By Infinity Multi-Point Payment Grid</strong>.
          </p>
        </div>
      </div>

      {/* Fund list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">The 5 BPP Funds</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {funds.map((f, i) => (
            <div key={f.name} className="rounded-xl border p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: f.color }}
                  >
                    {i + 1}
                  </span>
                  <p className="font-semibold text-sm text-foreground">{f.name}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge className="text-xs text-white" style={{ background: f.color }}>{f.cap}</Badge>
                  <Badge variant="outline" className="text-xs">{f.gv}</Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-1">{f.desc}</p>
              <p className="text-xs text-muted-foreground">Personal Volume required: <strong className="text-foreground">{f.pv}/month</strong></p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Qualification Requirements */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Qualification Requirements</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Bullet>You must be an active <strong>Pro Member</strong> to qualify for any BPP fund.</Bullet>
          <Bullet>You must maintain a minimum of <strong>150 PCV</strong> within any rolling 30-day window — this is evaluated on a rolling basis, not a calendar month.</Bullet>
          <Bullet>Your team's Group Volume (GV) must reach each fund's threshold to unlock that fund's bonus.</Bullet>
          <Bullet>You may qualify for multiple funds in the same month — each fund is evaluated independently.</Bullet>
          <Bullet>Your Pro Member Registration Package <strong>activates eligibility</strong> but may not fully satisfy the 150 PV requirement on its own — additional product purchases may be needed.</Bullet>
          <Bullet>Bonuses are reviewed and paid at end of each calendar month directly to your NFGN E-Wallet.</Bullet>
        </CardContent>
      </Card>

      {/* PV clarification */}
      <Card className="border-amber-200 bg-amber-50/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-amber-800 flex items-center gap-2">
            <Info className="h-4 w-4" /> PV vs Registration Package
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-amber-900 space-y-2">
          <p>Purchasing a Pro Member Registration Package upgrades you to Pro Member status and makes you <strong>eligible</strong> to earn BPP bonuses.</p>
          <p>However, if your registration package provides less than 150 PV, you still need additional product purchases to reach the monthly PV requirement for each fund.</p>
          <div className="rounded-lg bg-white border border-amber-200 p-3 space-y-1">
            <p className="font-semibold text-amber-800">Example</p>
            <p>You purchase a 50 PV Pro Package → You become a Pro Member ✓</p>
            <p>But you still need <strong>100 more PV</strong> in product purchases to qualify for BPP bonuses that month.</p>
          </div>
        </CardContent>
      </Card>

      {/* Story */}
      <InfoBox color="blue">
        <p className="font-semibold">The Story Behind BPP</p>
        <p>The Bill Payer Program was born from a real experience Mr. Marcelino witnessed in Houston in 2014 — a dedicated leader who was simultaneously hit with a utility shutoff, a repossession, and an eviction. He created the BPP so that qualifying Pro Members who are building their teams would never have to face that kind of hardship alone. Each fund is named after a real monthly expense because that is exactly what it is designed to cover.</p>
      </InfoBox>
    </div>
  );
}

// ── GIFTS & DONATIONS COMPLIANCE ─────────────────────────────────────────────
function DonationsComplianceSection() {
  return (
    <div className="space-y-6">

      {/* Hero */}
      <div className="rounded-2xl p-6 text-white space-y-4" style={{ background: "linear-gradient(135deg, #1a0a00, #0a0a0a)", border: `1px solid ${GOLD}30` }}>
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: `${GOLD}25`, border: `1px solid ${GOLD}50` }}>
            <Heart className="h-5 w-5" style={{ color: GOLD }} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold mb-0.5" style={{ color: GOLD }}>Compliance & Education</p>
            <h2 className="text-xl font-serif font-bold">Gifts, Donations & Charitable Giving</h2>
            <p className="text-white/50 text-xs mt-0.5">What they are, how they work, and the language you must use</p>
          </div>
        </div>
        <p className="text-sm text-white/75 leading-relaxed">
          NFGN facilitates charitable fundraising for churches, non-profits, and community causes. When a donation flows through the NFGN platform,
          a portion is distributed to participating members — but this distribution is classified as a <strong className="text-white">Gift Acknowledgment</strong>,
          not a commission or bonus. Understanding this distinction is both a legal and ethical requirement for all NFGN members.
        </p>
      </div>

      {/* Critical Compliance Notice */}
      <div className="rounded-2xl border-2 border-red-300 bg-red-50 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="font-bold text-red-800 text-sm uppercase tracking-wide">Required Compliance Notice — Read Before Receiving Any Gift Distribution</p>
        </div>
        <div className="rounded-xl bg-white border border-red-200 p-4 text-sm text-red-900 space-y-2 leading-relaxed">
          <p><strong>IMPORTANT:</strong> Funds received from donation and charitable giving programs through NFGN are classified as <strong>GIFT ACKNOWLEDGMENTS</strong> under NFGN policy and applicable law.</p>
          <p>These funds are <strong>NOT</strong> commissions, bonuses, compensation, or payment for services rendered. They are a voluntary distribution of gratitude extended to participating members who facilitated a charitable giving program.</p>
          <p>NFGN makes <strong>no representation</strong> regarding the tax treatment of gift acknowledgment funds. Members are solely responsible for understanding and complying with all applicable federal, state, and local tax laws. <strong>Consult a qualified tax professional.</strong></p>
          <p className="font-semibold text-red-800">By accepting any gift distribution, you confirm your understanding and agreement with this notice in full.</p>
        </div>
      </div>

      {/* What It Is */}
      <div className="rounded-2xl border p-6 space-y-4" style={{ background: `${GOLD}06`, borderColor: `${GOLD}25` }}>
        <p className="text-xs font-extrabold uppercase tracking-[0.2em]" style={{ color: GOLD }}>What Are Gifts & Donations in NFGN?</p>
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>NFGN hosts three types of giving programs: <strong className="text-foreground">Church Giving</strong>, <strong className="text-foreground">Non-Profit Giving</strong>, and <strong className="text-foreground">Fundraiser Campaigns</strong>. In each case, a supporter makes a donation through the NFGN platform in support of a designated recipient (a church, a non-profit, an individual, or a cause).</p>
          <p>When the donation is processed, the funds are split between:</p>
          <div className="grid sm:grid-cols-2 gap-3 not-prose">
            <div className="rounded-xl border p-4" style={{ borderLeft: `3px solid ${GOLD}` }}>
              <p className="font-bold text-sm text-foreground">Charity / Recipient Share</p>
              <p className="text-xs mt-1">The configured percentage (default 80%) goes directly to the designated church, non-profit, or cause. This is the primary purpose of the donation.</p>
            </div>
            <div className="rounded-xl border p-4" style={{ borderLeft: "3px solid #6b7280" }}>
              <p className="font-bold text-sm text-foreground">Facilitation Gift Share</p>
              <p className="text-xs mt-1">The remaining percentage (default 20%) is distributed through the participating member network as a gift acknowledgment for facilitating the fundraiser.</p>
            </div>
          </div>
          <p>The split percentage is configurable per campaign by NFGN administration. The default is <strong className="text-foreground">80% to the recipient / 20% to the facilitation network</strong>.</p>
        </div>
      </div>

      {/* What It Is NOT */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-3">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-amber-800">This Is NOT a Commission — Critical Distinction</p>
        <div className="space-y-2 text-sm text-amber-900 leading-relaxed">
          <p>The word <strong>"commission"</strong> implies payment earned in exchange for a sale or service. A gift acknowledgment is fundamentally different:</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="font-bold text-xs text-red-800 mb-1.5 flex items-center gap-1.5"><Ban className="h-3.5 w-3.5" /> A Commission is:</p>
              <ul className="text-xs text-red-700 space-y-1">
                <li>• Earned income from a sale or service</li>
                <li>• Taxable ordinary income</li>
                <li>• Triggered by a commercial transaction</li>
                <li>• Part of a for-profit compensation plan</li>
              </ul>
            </div>
            <div className="rounded-lg bg-green-50 border border-green-200 p-3">
              <p className="font-bold text-xs text-green-800 mb-1.5 flex items-center gap-1.5"><ThumbsUp className="h-3.5 w-3.5" /> A Gift Acknowledgment is:</p>
              <ul className="text-xs text-green-700 space-y-1">
                <li>• A voluntary expression of gratitude</li>
                <li>• Not payment for a sale</li>
                <li>• Not part of a for-profit compensation plan</li>
                <li>• Not a bonus or earned reward</li>
              </ul>
            </div>
          </div>
          <p className="text-xs text-amber-800">Misrepresenting a gift acknowledgment as a "commission" or "bonus" is a violation of NFGN policy and may expose members to legal and regulatory risk. Use the correct language at all times.</p>
        </div>
      </div>

      {/* Language Guide */}
      <div className="rounded-2xl border p-6 space-y-4">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em]" style={{ color: GOLD }}>Approved Language Guide — What You Can & Cannot Say</p>
        <p className="text-sm text-muted-foreground">When discussing NFGN donation programs with prospects, church partners, or the public, you must use the correct language. Below is your guide.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs font-bold text-green-700 uppercase tracking-wide flex items-center gap-1.5"><ThumbsUp className="h-3.5 w-3.5" /> You CAN Say</p>
            {[
              "\"A portion of every donation is shared with participating members as a gift acknowledgment for facilitating the fundraiser.\"",
              "\"When someone donates through our network, the member who helped make it happen receives a gift share — not a commission.\"",
              "\"Our giving programs count toward your Group Volume for qualification purposes.\"",
              "\"NFGN's donation programs support churches and non-profits while gifting participating members for their facilitation role.\"",
              "\"The gift share from donations appears in your wallet as a Gift Distribution, separate from your commission earnings.\"",
            ].map((s, i) => (
              <div key={i} className="flex gap-2 items-start text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="italic">{s}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold text-red-700 uppercase tracking-wide flex items-center gap-1.5"><Ban className="h-3.5 w-3.5" /> You CANNOT Say</p>
            {[
              "\"I earn commissions when donations are made to churches.\"",
              "\"My church fundraiser pays me a bonus.\"",
              "\"I get a commission on every donation in my downline.\"",
              "\"Our giving program is a commission-generating income stream.\"",
              "\"Donations to non-profits are commissionable.\"",
              "\"I get paid when people donate to charity through my link.\"",
            ].map((s, i) => (
              <div key={i} className="flex gap-2 items-start text-xs text-muted-foreground">
                <div className="h-3.5 w-3.5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-[8px] font-bold">✕</span>
                </div>
                <span className="italic">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GV/PV Impact */}
      <div className="rounded-2xl border p-6 space-y-3" style={{ background: `${GOLD}06`, borderColor: `${GOLD}25` }}>
        <p className="text-xs font-extrabold uppercase tracking-[0.2em]" style={{ color: GOLD }}>Does It Count Toward GV / PV?</p>
        <div className="rounded-xl bg-white border p-4 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <p className="font-bold text-sm text-foreground">Yes — Donations Count Toward Group Volume and Personal Volume</p>
            <p className="text-sm text-muted-foreground leading-relaxed">Each donation product has a CV (Commissionable Volume) value assigned by administration. When a donation is processed, the CV associated with that product is credited toward the facilitating member's PV and flows through the downline for GV calculation purposes.</p>
            <p className="text-sm text-muted-foreground leading-relaxed">This means donation activity can help members maintain Pro Member qualification thresholds and contribute to BPP Group Volume targets — even though the monetary distribution from that activity is classified as a Gift, not a Commission.</p>
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-bold text-amber-800 mb-1">Important Distinction</p>
          <p className="text-xs text-amber-700 leading-relaxed">The <em>volume</em> (CV/PV/GV) counts. The <em>money</em> received is a Gift Distribution, not commission income. These are separate concepts. The volume helps you qualify; the gift share is a separate, non-commission distribution.</p>
        </div>
      </div>

      {/* Where Funds Go & Timeline */}
      <div className="rounded-2xl border p-6 space-y-4">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em]" style={{ color: GOLD }}>Where Do the Funds Go & How Long Does It Take?</p>
        <div className="space-y-3">
          {[
            {
              label: "Charity / Church / Non-Profit Share",
              color: GOLD,
              steps: [
                "The designated recipient's share (default 80%) is held by NFGN and disbursed directly to the organization per the payout arrangement established at enrollment.",
                "Recipients can check their disbursement status by contacting NFGN Support or through their designated organizational account.",
                "Disbursement timing: typically within 5–10 business days of the donation clearing.",
              ],
            },
            {
              label: "Your Gift Distribution (Facilitation Share)",
              color: "#6b7280",
              steps: [
                "Your gift share appears in your NFGN E-Wallet as a PENDING \"Gift Distribution\" transaction within 24–72 hours of the donation being processed.",
                "NFGN administration reviews all gift distributions. Typical review period: 3–5 business days.",
                "Once cleared, the gift distribution becomes part of your available wallet balance.",
                "You can check the status in your dashboard under Wallet → Transaction History. Look for the \"Gift Distribution\" transaction type.",
                "Once available, funds can be withdrawn via the standard payout request process: Dashboard → Wallet → Request Payout.",
              ],
            },
          ].map(item => (
            <div key={item.label} className="rounded-xl border p-4 space-y-2" style={{ borderLeft: `3px solid ${item.color}` }}>
              <p className="font-bold text-sm text-foreground">{item.label}</p>
              {item.steps.map((s, i) => (
                <div key={i} className="flex gap-2 items-start text-xs text-muted-foreground">
                  <span className="font-bold flex-shrink-0 mt-0.5" style={{ color: item.color }}>{i + 1}.</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Tax Information */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-700 flex-shrink-0" />
          <p className="font-bold text-blue-900 text-sm uppercase tracking-wide">Tax Information — For US Members</p>
        </div>
        <div className="rounded-xl bg-white border border-blue-200 p-4 text-xs text-blue-900 space-y-2">
          <p className="font-bold text-blue-800 text-sm">⚠ NFGN is NOT a tax advisor. The following is for general informational purposes only. Always consult a qualified tax professional.</p>
        </div>
        <div className="space-y-3 text-sm text-blue-900">
          {[
            {
              q: "Are gift distributions I receive taxable?",
              a: "Under US tax law, gifts received are generally NOT taxable income to the recipient, provided they fall within IRS annual gift exclusion thresholds (currently $18,000 per donor per year as of 2024). However, whether your specific gift distribution qualifies for this exclusion depends on the nature of the transaction, the total amount received, and other factors specific to your situation. Consult a tax professional.",
            },
            {
              q: "Will NFGN issue me a 1099 for gift distributions?",
              a: "If your total payments (commissions, gift distributions, and other wallet earnings combined) exceed IRS reporting thresholds in a calendar year, NFGN may be required to issue a Form 1099-NEC or 1099-MISC. NFGN will comply with all applicable IRS reporting requirements. It is your responsibility to track and report all income and receipts appropriately.",
            },
            {
              q: "Are donations I MAKE through NFGN tax-deductible?",
              a: "Donations to registered IRS 501(c)(3) organizations are generally tax-deductible for the donor. However, NFGN cannot guarantee the 501(c)(3) status of any specific church or non-profit on the platform. Members and donors should independently verify the tax-exempt status of any organization they donate to. NFGN does not provide donation tax receipts — donors should obtain receipts directly from the recipient organization.",
            },
            {
              q: "What records should I keep?",
              a: "Keep records of all gift distributions received (visible in your Wallet transaction history), all donations made, and all commission earnings. NFGN's dashboard provides a transaction history you can export. Your tax professional will advise on specific record-keeping requirements.",
            },
          ].map((item, i) => (
            <div key={i} className="rounded-xl bg-white border border-blue-100 p-4 space-y-1.5">
              <p className="font-semibold text-blue-900 text-xs">{item.q}</p>
              <p className="text-blue-800 text-xs leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Book-A-Pro Distinction */}
      <div className="rounded-2xl border p-5 space-y-3 bg-muted/20">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em]" style={{ color: GOLD }}>How Is This Different From Book-A-Professional?</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Book-A-Professional operates on a similar payout split structure, but the nature of the transaction is entirely different. When a member books a professional, they are paying for a <strong className="text-foreground">service rendered</strong>. The professional's share is <strong className="text-foreground">service income</strong>; the facilitation pool is a standard commission arrangement. Both are for-profit and subject to standard income tax treatment.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-xl border p-4" style={{ borderLeft: `3px solid ${GOLD}` }}>
            <p className="font-bold text-xs text-foreground mb-1">Book-A-Professional</p>
            <p className="text-xs text-muted-foreground">Payment for a professional service. The member split is a service commission. Fully taxable as ordinary income. Say: "I earn a commission when clients book wellness professionals through my network."</p>
          </div>
          <div className="rounded-xl border p-4" style={{ borderLeft: "3px solid #ec4899" }}>
            <p className="font-bold text-xs text-foreground mb-1">Church / Non-Profit / Fundraiser Giving</p>
            <p className="text-xs text-muted-foreground">A charitable donation. The member share is a gift acknowledgment, not a commission. Consult a tax professional for treatment. Say: "I receive a gift acknowledgment for helping facilitate this giving program."</p>
          </div>
        </div>
      </div>

      {/* Summary Box */}
      <div className="rounded-2xl border p-5 space-y-3" style={{ background: `${GOLD}08`, borderColor: `${GOLD}30` }}>
        <p className="text-xs font-extrabold uppercase tracking-[0.2em]" style={{ color: GOLD }}>Quick Reference Summary</p>
        <div className="grid sm:grid-cols-2 gap-2 text-xs">
          {[
            ["Is it a commission?", "NO — it is a Gift Acknowledgment"],
            ["Does it count toward GV/PV?", "YES — CV is applied per donation"],
            ["Where does it appear?", "Wallet → Gift Distribution (Pending)"],
            ["When does it clear?", "3–5 business days after admin review"],
            ["Is it taxable?", "Consult your tax professional"],
            ["Can I withdraw it?", "Yes — via standard Payout Request once cleared"],
            ["Do I need to report it?", "Consult your tax professional"],
            ["Can I say I earn commissions on donations?", "NO — this is a policy violation"],
          ].map(([q, a]) => (
            <div key={q} className="rounded-lg border bg-white p-3 space-y-0.5">
              <p className="font-semibold text-foreground">{q}</p>
              <p className="text-muted-foreground">{a}</p>
            </div>
          ))}
        </div>
      </div>

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
            <p className="text-white/60 text-sm">Five income streams · Six business pillars · Unlimited depth</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {["Terminology", "RC", "PSC", "PMRC", "Power Squad Bonuses", "Bill Payer Program"].map(b => (
            <Badge key={b} className="text-xs" style={{ background: `${GOLD}25`, color: GOLD, border: `1px solid ${GOLD}40` }}>{b}</Badge>
          ))}
        </div>
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        <aside className="lg:w-52 flex-shrink-0">
          <SectionNav active={active} onChange={handleChange} />
        </aside>

        <div className="flex-1 min-w-0">
          {active === "terminology" && <TerminologySection />}
          {active === "overview"    && <OverviewSection />}
          {active === "rc"          && <RCSection />}
          {active === "psc"         && <PSCSection />}
          {active === "pmrc"        && <PMRCSection />}
          {active === "psb"         && <PSBSection />}
          {active === "bpp"         && <BPPSection />}
          {active === "donations"   && <DonationsComplianceSection />}
        </div>
      </div>
    </div>
  );
}
