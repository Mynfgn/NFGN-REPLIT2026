import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useGetMe } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen, Target, DollarSign, Zap, TrendingUp, Award,
  Users, Star, ChevronDown, ChevronRight, CheckCircle2,
  Flame, Home, Clock, Lightbulb, MessageCircle, Leaf,
  BarChart3, Shield, Phone, Heart, GraduationCap, FileText,
  CreditCard, RefreshCw, AlertTriangle, ShieldCheck,
} from "lucide-react";
import { TrainingQuiz } from "@/components/training/TrainingQuiz";
import {
  gettingStartedQuiz,
  compPlanQuiz,
  incomeplanQuiz,
  bppQuiz,
  ninetyDayQuiz,
  igniteQuiz,
  bigBonusesQuiz,
  additionalTrainingQuiz,
} from "@/data/trainingQuizzes";

const GOLD = "#C9A84C";
const GREEN = "#2D6A4F";

function SectionHeader({ icon: Icon, title, subtitle, color = GOLD }: {
  icon: any; title: string; subtitle?: string; color?: string;
}) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
        <Icon className="h-6 w-6" style={{ color }} />
      </div>
      <div>
        <h2 className="text-xl font-serif font-bold text-foreground">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: GOLD }}>
        {number}
      </div>
      <div className="flex-1 pb-6">
        <p className="font-semibold text-foreground mb-1">{title}</p>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-1">{children}</div>
      </div>
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 items-start text-sm text-muted-foreground">
      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

function AccordionItem({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left font-semibold text-sm hover:bg-muted/40 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <span>{title}</span>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed space-y-3 border-t bg-muted/20">
          <div className="pt-4">{children}</div>
        </div>
      )}
    </div>
  );
}

function CompRow({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`flex justify-between items-center py-3 border-b last:border-0 ${highlight ? "bg-primary/5 px-3 rounded-lg" : ""}`}>
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
      <span className="text-sm font-bold" style={{ color: highlight ? GOLD : undefined }}>{value}</span>
    </div>
  );
}

const SECTIONS = [
  { id: "getting-started",  label: "Getting Started",        icon: BookOpen },
  { id: "terminology",      label: "Terminology & Glossary", icon: GraduationCap },
  { id: "comp-plan",        label: "Comp Plan",              icon: DollarSign },
  { id: "2500-plan",        label: "$3,500/Month Plan",      icon: Target },
  { id: "bpp",              label: "Bill Payer Program",     icon: Home },
  { id: "90-day",           label: "90-Day $3,500 Plan",    icon: TrendingUp },
  { id: "ignite",           label: "IGNITE Training",        icon: Flame },
  { id: "big-bonuses",      label: "Earn Big Bonuses",       icon: Award },
  { id: "additional",       label: "Additional Training",    icon: Lightbulb },
  { id: "app-setup",        label: "Add App to Phone",       icon: Phone },
  { id: "policies",         label: "Policies & Terms",       icon: FileText },
];

export function BasicTrainingPage() {
  const [loc] = useLocation();
  const { data: me } = useGetMe();
  const isProMember = me?.role === "pro_member";

  const initialSection = (() => {
    if (typeof window === "undefined") return "getting-started";
    const s = new URLSearchParams(window.location.search).get("s");
    return s && SECTIONS.some(sec => sec.id === s) ? s : "getting-started";
  })();
  const [activeSection, setActiveSection] = useState(initialSection);

  useEffect(() => {
    const syncSection = () => {
      const s = new URLSearchParams(window.location.search).get("s");
      if (s && SECTIONS.some(sec => sec.id === s)) setActiveSection(s);
    };
    syncSection();
    window.addEventListener("nfgn:nav", syncSection);
    window.addEventListener("popstate", syncSection);
    return () => {
      window.removeEventListener("nfgn:nav", syncSection);
      window.removeEventListener("popstate", syncSection);
    };
  }, [loc]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0a0a0a] to-[#1a1a1a] rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: `${GOLD}30` }}>
            <BookOpen className="h-5 w-5" style={{ color: GOLD }} />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold">NFGN Basic Training</h1>
            <p className="text-white/60 text-sm">Your complete guide to building a thriving NFGN business</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge className="text-xs" style={{ background: `${GOLD}30`, color: GOLD, border: `1px solid ${GOLD}40` }}>Comp Plan</Badge>
          <Badge className="text-xs" style={{ background: `${GOLD}30`, color: GOLD, border: `1px solid ${GOLD}40` }}>$3,500/Month Strategy</Badge>
          <Badge className="text-xs" style={{ background: `${GOLD}30`, color: GOLD, border: `1px solid ${GOLD}40` }}>90-Day Residual Plan</Badge>
          <Badge className="text-xs" style={{ background: `${GOLD}30`, color: GOLD, border: `1px solid ${GOLD}40` }}>IGNITE Product Training</Badge>
          <Badge className="text-xs" style={{ background: `${GOLD}30`, color: GOLD, border: `1px solid ${GOLD}40` }}>Big Bonus Strategy</Badge>
        </div>
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Sidebar nav */}
        <aside className="lg:w-56 flex-shrink-0">
          <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap text-left w-full
                  ${activeSection === s.id
                    ? "text-white"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                style={activeSection === s.id ? { background: GOLD } : {}}
              >
                <s.icon className="h-4 w-4 flex-shrink-0" />
                {s.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* ── GETTING STARTED ──────────────────────────────── */}
          {activeSection === "getting-started" && (
            <Card>
              <CardContent className="pt-6 space-y-6">
                <SectionHeader icon={BookOpen} title="Getting Started With NFGN" subtitle="How to market and grow your business the right way" />

                <div className="prose prose-sm max-w-none space-y-4 text-muted-foreground">
                  <p>Welcome to New Face Global Network — a naturopathic wellness company built to help people live healthier lives while creating real financial freedom. Your success starts with three simple activities done consistently every day.</p>
                </div>

                <div className="space-y-0 border-l-2 ml-4" style={{ borderColor: GOLD }}>
                  <Step number={1} title="Know Your Story">
                    <p>People buy from people they trust. Before anything else, try the products — especially the IGNITE Herbal Gut Cleanse. Your personal experience is your most powerful marketing tool. Write 3–5 sentences about what you noticed and how you felt. Authenticity converts.</p>
                  </Step>
                  <Step number={2} title="Build Your Contact List">
                    <p>Write down 100 names — friends, family, co-workers, social media contacts. Don't pre-judge anyone. Your goal is not to convince — it's to share. Some will join immediately; others will buy products; others will come back later. Everyone deserves to see the opportunity.</p>
                  </Step>
                  <Step number={3} title="Share Daily — The 3-2-1 Method">
                    <p><strong>3</strong> product conversations every day. <strong>2</strong> business opportunity shares. <strong>1</strong> follow-up with a prospect from a previous day. This simple rhythm — done consistently — builds momentum within weeks.</p>
                  </Step>
                  <Step number={4} title="Use Your Referral Link Everywhere">
                    <p>Add it to your social media bio, your email signature, your WhatsApp status. Every post you make about wellness or lifestyle should include your referral link. Make it effortless for people to find you.</p>
                  </Step>
                  <Step number={5} title="Enroll Your First 3 Pro Members">
                    <p>Your first goal is enrolling 3 Pro Members directly under you. This qualifies your commissions, activates your CLB bonus eligibility, and creates the foundation of your residual income. Treat this as your most urgent priority in the first 30 days.</p>
                  </Step>
                </div>

                <Card className="border-0 bg-amber-50">
                  <CardContent className="pt-5 space-y-3">
                    <p className="text-sm font-semibold text-amber-900 flex items-center gap-2"><Lightbulb className="h-4 w-4" /> Pro Tips for New Members</p>
                    <div className="space-y-2">
                      {[
                        "Post your personal results and product photos on social media at least 3× per week",
                        "Lead with the product first — it's easier to sell a result than an opportunity",
                        "Use the marketing templates in the Tools section for ready-made social posts and emails",
                        "Your upline sponsor is your greatest asset — tap into their experience",
                        "Never quit before 90 days — that's when the compounding effect kicks in",
                      ].map((t, i) => <Tip key={i}>{t}</Tip>)}
                    </div>
                  </CardContent>
                </Card>

                {/* Day 1-30 Action Guide */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-6 rounded" style={{ background: GOLD }} />
                    <p className="font-serif font-bold text-base">Your First 30 Days — Day-by-Day Action Guide</p>
                  </div>
                  <p className="text-sm text-muted-foreground">This is exactly what you should be doing every single day for your first 30 days. Do not skip steps. Every action builds on the previous one.</p>

                  <div className="space-y-2">
                    {[
                      { day: "Day 1", title: "Foundation Day", tasks: ["Call or text your upline sponsor — introduce yourself and schedule a 30-minute welcome call", "Place your personal IGNITE order (this starts your BPP PCV clock and gives you a real testimonial)", "Write your 100-person contact list in a notebook or phone notes", "Add your referral link to your social media bio on every platform you use"] },
                      { day: "Day 2", title: "Know Your Story", tasks: ["Begin using IGNITE today — document how you feel in a notes app (this becomes your testimonial)", "Watch all training sections in this portal at least once", "Write your personal 3-sentence story: what you were dealing with, what you tried, what NFGN did for you", "Share your first post on social media about starting your wellness journey (no sales pitch — just authentic)"] },
                      { day: "Day 3", title: "First Conversations", tasks: ["Reach out to the first 10 people on your contact list with a personal, conversational message (not a copy-paste blast)", "Share IGNITE with 3 people specifically who talk about gut health, bloating, or weight", "Follow up with anyone from Day 1–2 who viewed your social post or responded to your message", "Review the Comp Plan training section and ask your upline any questions"] },
                      { day: "Day 4", title: "Prospect & Post", tasks: ["Reach out to 10 more contacts from your list", "Post your Day 3 wellness check-in on social media (how do you feel after 3 days of IGNITE?)", "Share the NFGN business opportunity with 2 people who you think could be great Pro Members", "Watch the IGNITE Training section — practice the 3-step selling conversation"] },
                      { day: "Day 5", title: "Virtual Info Session Prep", tasks: ["Schedule your first virtual info session for Day 7 or 8 — invite 5–10 people from your list via DM", "Reach out to 10 new contacts from your list", "Follow up with everyone you messaged on Days 3–4 who hasn't responded", "Post a social media story about what you're building with NFGN"] },
                      { day: "Day 6", title: "Social Media Blitz", tasks: ["Post a detailed product post with your referral link on Facebook, Instagram, and any other platforms you use", "Engage in 2–3 wellness Facebook groups — provide value, answer questions, and share your journey", "Reach out to 10 more contacts", "Begin preparing your virtual info session presentation or talk track with your upline"] },
                      { day: "Day 7", title: "First Customer Goal", tasks: ["Your target: close your FIRST retail customer today", "Host your first virtual info session (or reschedule to Day 8 if needed)", "Follow up with every prospect from Days 3–6", "Review your contact list — who have you not reached out to yet? Add more names if needed"] },
                      { day: "Day 8", title: "First Pro Member Push", tasks: ["Share the NFGN opportunity more directly with your 3–5 hottest prospects from your list", "Follow up with your virtual info session attendees", "Post your first weekly results update on social media (Day 7 check-in with IGNITE)", "Reach out to 10 new contacts — never stop adding new people to your outreach"] },
                      { day: "Day 9", title: "Enroll Your First Pro Member", tasks: ["Target: enroll your FIRST Pro Member today if you haven't yet", "Call (don't text) your most interested prospects — a real conversation closes faster than messages", "Reach out to 10 new contacts", "Thank your first retail customer personally and ask for a testimonial or referral"] },
                      { day: "Day 10", title: "Momentum Building", tasks: ["Post a social media update: 10 days into your wellness journey — share specific results", "Reach out to 10 new contacts", "Follow up with every prospect who hasn't responded yet (Day 3 follow-up)", "Help your first Pro Member place their first product order and share their referral link"] },
                      { day: "Day 11–13", title: "Build Your Pipeline", tasks: ["Reach out to 10–15 new contacts each day", "Follow up consistently with anyone who hasn't responded (Day 7–10 prospects)", "Post on social media every day — wellness tips, product check-ins, your journey", "Have your upline sponsor join a 3-way call with your most interested prospects if you're having trouble closing"] },
                      { day: "Day 14", title: "Two-Week Review", tasks: ["Review your numbers: How many conversations? How many interested? How many customers? How many Pro Members?", "Check in with your upline sponsor — share your progress and get coaching on your gaps", "Reach out to your Day 1–3 contacts again for a soft follow-up close", "Host or attend a team training call or webinar"] },
                      { day: "Day 15–19", title: "Accelerate Enrollment", tasks: ["Target: reach 3 enrolled Pro Members by Day 19", "Post your Day 15 results update on social media — show consistency and authenticity", "Reach out to 10–15 new contacts each day", "Begin coaching your first Pro Member — help them build their contact list and make their first sales"] },
                      { day: "Day 20", title: "Social Media Credibility Push", tasks: ["Post a comprehensive 20-day journey update — before/after feelings, product experience, team progress", "Ask your satisfied retail customers to write a short testimonial you can share (with their permission)", "Reach out to 10 new contacts", "Review the Big Bonuses training section — understand exactly what you need for CLB"] },
                      { day: "Day 21–24", title: "Team Activation", tasks: ["Hold a mini team call with your enrolled Pro Members — review their contact lists and first conversations", "Help each Pro Member send their first 10 outreach messages (show them exactly what you did)", "Reach out to 10 new contacts each day", "Post daily on social media — your story is your most powerful lead magnet"] },
                      { day: "Day 25", title: "Five Pro Member Push", tasks: ["Your target: 5 Pro Members enrolled by Day 30", "Review your pipeline — who is close to saying yes? Call them directly today", "Schedule your second virtual info session for this week — invite new people who haven't heard your story yet", "Post a social media call-to-action post with your referral link"] },
                      { day: "Day 26–29", title: "Close & Consolidate", tasks: ["Follow up with EVERY prospect who hasn't made a decision — this is your most important follow-up window", "Help your Pro Members make their first retail sales if they haven't yet", "Reach out to 10+ new contacts each day", "Post daily — share your team's wins, your results, your journey"] },
                      { day: "Day 30", title: "Month 1 Complete — Review & Reset", tasks: ["Count your results: retail customers, Pro Members enrolled, commissions earned", "Celebrate every win — no matter how small", "Call your upline sponsor for a full Month 1 debrief and Month 2 planning session", "Write your Month 2 plan: who are you helping duplicate, what are your new enrollment targets, what income do you expect?"] },
                    ].map((d, i) => (
                      <div key={i} className="border rounded-xl overflow-hidden">
                        <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 border-b">
                          <div
                            className="h-7 w-16 rounded-md flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ background: i < 7 ? GOLD : i < 14 ? GREEN : i < 21 ? "#7c3aed" : "#dc2626" }}
                          >
                            {d.day}
                          </div>
                          <p className="text-sm font-semibold">{d.title}</p>
                        </div>
                        <div className="px-4 py-3 space-y-1.5">
                          {d.tasks.map((t, ti) => (
                            <div key={ti} className="flex gap-2 text-xs text-muted-foreground">
                              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-green-600" />
                              {t}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <TrainingQuiz
                  title="Getting Started — Proficiency Quiz"
                  questions={gettingStartedQuiz}
                />
              </CardContent>
            </Card>
          )}

          {/* ── TERMINOLOGY ─────────────────────────────────── */}
          {activeSection === "terminology" && (
            <Card>
              <CardContent className="pt-6 space-y-8">
                <SectionHeader icon={GraduationCap} title="NFGN Terminology & Glossary" subtitle="Master every term before you master the income" />

                <p className="text-sm text-muted-foreground -mt-2 leading-relaxed">
                  Before sharing the opportunity with anyone, make sure you can define every term below without hesitation. The language of NFGN is the language of confidence — and confidence converts.
                </p>

                {/* ── Six Business Pillars ─────────────────── */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-0.5 w-5 rounded" style={{ background: GOLD }} />
                    <h3 className="text-xs font-extrabold uppercase tracking-[0.2em]" style={{ color: GOLD }}>The Six Business Pillars</h3>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      { abbr: "Pillar 1", term: "Naturopathic, Mental Health, & Primary Care", def: "Products, services, and Medical Benefit Packages covering naturopathic health, mental wellness, and primary care. The wellness foundation of NFGN." },
                      { abbr: "Pillar 2", term: "Book-A-Professional", def: "The booking platform connecting members with certified wellness practitioners, coaches, naturopaths, and consultants." },
                      { abbr: "Pillar 3", term: "Business Opportunities", def: "The commission income arm — powered by the 2 Down By Infinity Multi-Point Payment Grid. Open to all Pro Members." },
                      { abbr: "Pillar 4", term: "NFGN Sports", def: "The athletic division — funding youth programs, school teams, local leagues, and sports nonprofits through the NFGN money circulation grid." },
                      { abbr: "Pillar 5", term: "NFGN Products & Services", def: "Handcrafted artisan goods including handmade soaps, candles, lotions, and natural body care products made with love." },
                      { abbr: "Pillar 6", term: "Special Events, Travel, & Workshops", def: "Exclusive NFGN retreats, live training workshops, travel experiences, and member events designed to educate, connect, and inspire." },
                    ].map(t => (
                      <div key={t.term} className="rounded-xl border p-4 space-y-1.5 bg-card">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold text-sm text-foreground leading-tight">{t.term}</p>
                          <Badge variant="outline" className="text-[10px] font-bold tracking-widest flex-shrink-0">{t.abbr}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{t.def}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Member Tiers ─────────────────────────── */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-0.5 w-5 rounded" style={{ background: GREEN }} />
                    <h3 className="text-xs font-extrabold uppercase tracking-[0.2em]" style={{ color: GREEN }}>Member Tiers — Lowest to Highest</h3>
                  </div>
                  <div className="rounded-xl overflow-hidden border divide-y">
                    {[
                      { abbr: "RM", name: "Retail Member", def: "Entry-level customers with no referral relationship. No commission qualification." },
                      { abbr: "RRM", name: "Referring Retail Member", def: "A retail member who has referred at least one other customer. Earns basic referral credit but is not commission-qualified." },
                      { abbr: "RCB", name: "Retail Community Builder", def: "An active retail member building a customer base. Eligible to earn RC (Referral Commission) but not Pro Member income streams." },
                      { abbr: "PM", name: "Pro Member", def: "The full commission-qualified tier. Requires an active PRP subscription AND 150+ PCV within any rolling 30-day window. Unlocks all five income streams." },
                      { abbr: "APM", name: "Associate Pro Member", def: "A dynamic status earned automatically when a Pro Member has 9 or more active Level 1 Pro Members. Reverts to Pro Member if that count drops below 9." },
                    ].map((tier, i) => (
                      <div key={tier.abbr} className="flex items-start gap-3 p-3 bg-card">
                        <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0 mt-0.5"
                          style={{ background: i === 4 ? GOLD : i === 3 ? GREEN : "#94a3b8" }}>
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-bold text-foreground">{tier.name}</p>
                            <Badge variant="outline" className="text-[10px] font-bold">{tier.abbr}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{tier.def}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Volume Terms ─────────────────────────── */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-0.5 w-5 rounded" style={{ background: GOLD }} />
                    <h3 className="text-xs font-extrabold uppercase tracking-[0.2em]" style={{ color: GOLD }}>Volume Terms — Know Your Numbers</h3>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      { abbr: "CV", term: "Commissionable Volume", def: "A point value assigned to every NFGN product. Not a dollar amount — it is a score used to calculate all commissions across every program." },
                      { abbr: "PCV / PV", term: "Personal Commissionable Volume", def: "The CV generated by your own purchases in a rolling 30-day window. 150+ PCV is required to maintain active Pro Member status." },
                      { abbr: "GCV / GV", term: "Group Commissionable Volume", def: "The total CV from your entire downline organization. Also called Group Volume (GV). Used to qualify for BPP bonus funds." },
                      { abbr: "Zone GCV", term: "Zone of Duplication Volume", def: "GCV from Levels 2–5 only. This — not Level 1 volume — determines your BPP fund eligibility. Levels 1, 6–9 are excluded." },
                      { abbr: "Rolling 30-Day", term: "Rolling 30-Day PCV", def: "PCV is NOT calculated by calendar month. It is measured on a rolling 30-day window. If your last 150 CV of personal purchases was more than 30 days ago, your Pro Member status is at risk." },
                    ].map(t => (
                      <div key={t.term} className="rounded-xl border p-4 space-y-1.5 bg-card">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold text-sm text-foreground leading-tight">{t.term}</p>
                          <Badge variant="outline" className="text-[10px] font-bold tracking-widest flex-shrink-0">{t.abbr}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{t.def}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Income Streams ───────────────────────── */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-0.5 w-5 rounded" style={{ background: "#3b82f6" }} />
                    <h3 className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-600">Income Stream Abbreviations</h3>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      { abbr: "RC", term: "Referral Commission", def: "10% on every purchase made by your direct (Level 1) referrals. Earned by all active members — no Pro Member status required." },
                      { abbr: "PSC", term: "Product Sales Commission", def: "Up to 24% earned across 9 levels of your downline on product purchases. Pro Members only. Level 2 always pays the highest rate (24%)." },
                      { abbr: "PMRC", term: "Pro Member Retail Commission", def: "Up to 22% earned across 5 levels when someone in your downline purchases a Pro Member Registration Package. Pro Members only." },
                      { abbr: "CLB", term: "Core Leadership Bonus", def: "A one-time $100 bonus triggered when you personally enroll 9 qualified Level 1 Pro Members (each with 150+ cumulative CV)." },
                      { abbr: "MCB", term: "Money Circulation Bonus", def: "A recurring $200 bonus paid every time 7 new Level 2 Pro Members join your organization. Unlimited cycles." },
                      { abbr: "BPP", term: "Bill Payer Program", def: "Five Group Volume Bonus Funds offsetting real monthly expenses. Phone/Internet ($185), Medical ($350), Utilities ($450), Car ($600), Rent/Mortgage ($1,500). Max $3,085/month." },
                    ].map(t => (
                      <div key={t.term} className="rounded-xl border p-4 space-y-1.5 bg-card">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold text-sm text-foreground leading-tight">{t.term}</p>
                          <Badge variant="outline" className="text-[10px] font-bold tracking-widest flex-shrink-0 text-blue-600 border-blue-300">{t.abbr}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{t.def}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Structure & Platform Terms ───────────── */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-0.5 w-5 rounded" style={{ background: GREEN }} />
                    <h3 className="text-xs font-extrabold uppercase tracking-[0.2em]" style={{ color: GREEN }}>Organizational & Platform Terms</h3>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      { abbr: "PRP", term: "Pro Member Registration Package", def: "The product purchase that activates Pro Member status. Must remain active and subscription-based. PRPs do not earn Pro Member discounts." },
                      { abbr: "UPM", term: "Unqualified Pro Member", def: "A Pro Member whose cumulative CV has not yet reached 150. UPMs do not count toward your CLB trigger (amber slots in Power Squad tracker)." },
                      { abbr: "CLG", term: "Core Leadership Group", def: "Your direct Level 1 team — the people you personally recruited. Your CLG is the foundation of all income streams." },
                      { abbr: "Zone", term: "Zone of Duplication", def: "Levels 2–5 of your organization. BPP Group Volume is calculated here. The heart of the '2 Down By Infinity' leverage model." },
                      { term: "Wealth Builders Community", def: "The people within your Zone of Duplication (Levels 2–5). These members drive your BPP qualification and long-term residual income." },
                      { term: "E-Wallet", def: "The digital wallet inside your back office where commissions, bonuses, and BPP payouts are deposited. Funds can be transferred or paid out per the payout schedule." },
                      { term: "2 Down By Infinity", def: "The official name of NFGN's proprietary compensation plan invented by Joe Marcelino. '2 Down' = emphasis on Level 2. 'By Infinity' = no depth limit on earning." },
                      { term: "Referral Link", def: "Your unique personal URL. Anyone who visits NFGN through your link is attributed to you, triggering RC on their purchases." },
                    ].map(t => (
                      <div key={t.term} className="rounded-xl border p-4 space-y-1.5 bg-card">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold text-sm text-foreground leading-tight">{t.term}</p>
                          {t.abbr && <Badge variant="outline" className="text-[10px] font-bold tracking-widest flex-shrink-0">{t.abbr}</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{t.def}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Reference */}
                <div className="rounded-2xl border p-5 space-y-4" style={{ background: `rgba(201,168,76,0.05)`, borderColor: `${GOLD}30` }}>
                  <p className="text-xs font-extrabold uppercase tracking-[0.2em]" style={{ color: GOLD }}>Quick Reference — All Abbreviations</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      ["RC", "Referral Commission"], ["PSC", "Product Sales Comm."], ["PMRC", "Pro Member Retail Comm."],
                      ["CLB", "Core Leadership Bonus"], ["MCB", "Money Circulation Bonus"], ["BPP", "Bill Payer Program"],
                      ["CV", "Commissionable Volume"], ["PCV / PV", "Personal Comm. Volume"], ["GCV / GV", "Group Comm. Volume"],
                      ["PRP", "Pro Member Reg. Package"], ["UPM", "Unqualified Pro Member"], ["APM", "Associate Pro Member"],
                      ["RM", "Retail Member"], ["RRM", "Referring Retail Member"], ["RCB", "Retail Community Builder"],
                      ["CLG", "Core Leadership Group"], ["PM", "Pro Member"],
                    ].map(([abbr, full]) => (
                      <div key={abbr} className="flex items-center gap-2 text-xs">
                        <span className="font-bold flex-shrink-0" style={{ color: GOLD, minWidth: 56 }}>{abbr}</span>
                        <span className="text-muted-foreground">{full}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <TrainingQuiz
                  title="Terminology — Proficiency Quiz"
                  questions={compPlanQuiz}
                />
              </CardContent>
            </Card>
          )}

          {/* ── COMP PLAN ───────────────────────────────────── */}
          {activeSection === "comp-plan" && (
            <Card>
              <CardContent className="pt-6 space-y-6">
                <SectionHeader icon={DollarSign} title="The NFGN Compensation Plan" subtitle="Five income streams · Six business pillars · Unlimited depth" />

                {/* Plan name callout */}
                <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-primary">Our Official Pay Structure</p>
                  <p className="text-base font-serif font-bold text-foreground">"2 Down By Infinity" Pay Structure</p>
                  <p className="text-xs text-muted-foreground italic">Also known as: 2 Down By Infinity Multi-Point Payment Grid</p>
                  <p className="text-sm text-muted-foreground leading-relaxed pt-1">
                    This plan was invented and solely developed by <strong className="text-foreground">Joe Marcelino</strong> with one
                    purpose: to give the <strong className="text-foreground">average, inexperienced, and underprivileged person</strong> a
                    realistic path to success. The name "2 Down By Infinity" reflects the plan's core strategy — a primary focus on
                    <strong className="text-foreground"> Generation 2 (Level 2)</strong>, specifically designed to help
                    <strong className="text-foreground"> Generation 1 members start earning commissions as fast as possible</strong>.
                    When Level 2 grows, the payout flows back up to benefit Level 1 — and the "By Infinity" means there is no ceiling on
                    how deep the commissions can reach as your organization expands.
                  </p>
                </div>

                <p className="text-sm text-muted-foreground">NFGN pays you through five distinct income streams. Each layer is designed to reward both retail activity and team building. The more streams you activate, the more your income multiplies.</p>

                {/* CV / PCV / GCV Glossary */}
                <div className="rounded-xl border border-[#C9A84C]/40 bg-[#C9A84C]/5 p-5 space-y-4">
                  <p className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span className="text-[#C9A84C]">📖</span> Volume Glossary — Know Your Numbers
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg bg-white border border-border p-3 space-y-1">
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">CV</p>
                      <p className="text-sm font-semibold">Commissionable Volume</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">Every NFGN product carries a CV value. CV is the base unit used to track and calculate commissions across all programs. It is not a dollar amount — it is a point value assigned to each product.</p>
                    </div>
                    <div className="rounded-lg bg-white border border-blue-200 p-3 space-y-1">
                      <p className="text-xs font-bold uppercase tracking-widest text-blue-500">PCV <span className="normal-case font-normal text-muted-foreground">(also: PV)</span></p>
                      <p className="text-sm font-semibold text-blue-700">Personal Commissionable Volume</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">PCV is the total CV generated by <strong>your own purchases</strong> within any rolling 30-day window. Also called <strong>PV (Personal Volume)</strong>. Maintaining 150+ PCV in every rolling 30-day window keeps your Pro Member status active and qualifies you for BPP bonuses. This is <strong>not</strong> a calendar-month reset — it rolls continuously.</p>
                    </div>
                    <div className="rounded-lg bg-white border border-green-200 p-3 space-y-1">
                      <p className="text-xs font-bold uppercase tracking-widest text-green-600">GCV <span className="normal-case font-normal text-muted-foreground">(also: GV)</span></p>
                      <p className="text-sm font-semibold text-green-700">Group Commissionable Volume</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">GCV is the combined CV generated by <strong>your entire downline network</strong> — every purchase made by every member in your organization. Also called <strong>GV (Group Volume)</strong>. A higher GCV unlocks higher rank qualifications and larger commission pools.</p>
                      <p className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 mt-1">⚠️ Only Pro Members are eligible to earn commissions from GCV.</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground italic border-t border-border pt-3">In short: CV is on every product. Your PCV (PV) is what you personally buy. Your GCV (GV) is what your whole team buys. All commissions flow from these three numbers.</p>
                </div>

                {/* CV Deep Dive — Why It Matters */}
                <div className="rounded-xl border border-border bg-[#0a0a0a] text-white p-6 space-y-6">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#C9A84C" }}>Master This First</p>
                    <h3 className="text-base font-bold">Why Commissionable Volume (CV) Is the Engine Behind Every Dollar You Earn</h3>
                    <p className="text-xs text-white/60 leading-relaxed mt-2">
                      In the Home Based Business world, most people focus on rank, team size, or how many people they've recruited. The truth is simpler and more powerful than that: <strong className="text-white">every commission, every bonus, every rank advancement at NFGN is calculated from CV</strong>. Understanding CV — and specifically your PCV and GCV — is the single most important skill you can develop as a Home Based Business owner. It tells you exactly where your money comes from and exactly what levers to pull to earn more of it.
                    </p>
                  </div>

                  {/* PCV section */}
                  <div className="rounded-xl bg-white/5 border border-white/10 p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">P</div>
                      <div>
                        <p className="text-sm font-bold text-blue-300">Your PCV — Personal Commissionable Volume (also: PV)</p>
                        <p className="text-xs text-white/50">3 Reasons You Must Pay Attention to It</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300 text-xs font-bold mt-0.5">1</div>
                        <div>
                          <p className="text-sm font-semibold text-white">PCV determines whether you stay active — and paid</p>
                          <p className="text-xs text-white/60 leading-relaxed mt-0.5">Your Pro Member status is only maintained if you hit your monthly PCV threshold. If you fall short, you lose eligibility for all downline commissions, BPP bonuses, and rank qualifications — even if your team is on fire. One missed month of personal PCV can cost you far more in lost commissions than the cost of the products themselves. Treat your PCV target like a non-negotiable monthly bill.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300 text-xs font-bold mt-0.5">2</div>
                        <div>
                          <p className="text-sm font-semibold text-white">PCV is your proof of product — and your best sales tool</p>
                          <p className="text-xs text-white/60 leading-relaxed mt-0.5">When you personally order and use NFGN products, your PCV grows and you gain a real, authentic testimonial. People don't join or buy from someone who doesn't believe in what they sell. Your PCV activity is visible proof that you are a product of the product — and that authenticity closes more sales than any script ever could. High PCV = high credibility.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300 text-xs font-bold mt-0.5">3</div>
                        <div>
                          <p className="text-sm font-semibold text-white">PCV unlocks your BPP — your monthly bill-paying machine</p>
                          <p className="text-xs text-white/60 leading-relaxed mt-0.5">The Bill Payer Program pays you a bonus every single month you hit your PCV threshold. This is the most predictable, consistent income stream in the NFGN comp plan — and it is 100% controlled by you, not your team. No recruiting required. No downline required. Just consistently hitting your personal PCV target and NFGN writes you a check to cover a real-world bill. Over 12 months, that adds up to thousands of dollars in recovered expenses — before any team income is counted.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* GCV section */}
                  <div className="rounded-xl bg-white/5 border border-white/10 p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">G</div>
                      <div>
                        <p className="text-sm font-bold text-green-300">Your GCV — Group Commissionable Volume (also: GV)</p>
                        <p className="text-xs text-white/50">What It Is &amp; The 3 Things That Can Change Your Life</p>
                      </div>
                    </div>
                    <div className="rounded-lg bg-amber-500/20 border border-amber-400/40 px-4 py-2.5 flex items-start gap-2">
                      <span className="text-amber-300 text-sm flex-shrink-0 mt-0.5">⚠️</span>
                      <p className="text-xs text-amber-200 font-semibold leading-relaxed">
                        <strong className="text-amber-100">Pro Member status required.</strong> Only Pro Members are eligible to earn commissions from GCV. Regular members and customers accumulate GCV in the system, but cannot receive payouts from it. Upgrading to Pro Member is the single action that unlocks your right to earn from your team's volume.
                      </p>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed">
                      GCV is the sum of <em>every</em> CV generated by every person in your downline organization — all generations, every month. Unlike PCV which only you control, GCV multiplies as your team grows. It is the number that separates part-time extra income from life-changing, generational wealth. A team of 50 people each generating 100 PCV creates 5,000 GCV for you — automatically, even while you sleep. That is the compounding power of a Home Based Business, and GCV is how you measure it.
                    </p>
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-500/20 border border-green-400/40 flex items-center justify-center text-green-300 text-xs font-bold mt-0.5">1</div>
                        <div>
                          <p className="text-sm font-semibold text-white">GCV is the multiplier that turns your effort into leverage</p>
                          <p className="text-xs text-white/60 leading-relaxed mt-0.5">Every hour you spend building your team compounds into GCV that keeps accumulating long after that hour is gone. When you enroll and train a Pro Member who then enrolls three more, all of their PCV flows into your GCV. This is leverage — the ability to earn on the time and effort of others. Most careers pay you once for your time. GCV pays you every month for the culture and momentum you created. The higher your GCV climbs, the less dependent your income is on any single person — including yourself.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-500/20 border border-green-400/40 flex items-center justify-center text-green-300 text-xs font-bold mt-0.5">2</div>
                        <div>
                          <p className="text-sm font-semibold text-white">GCV unlocks ranks, pools, and commission tiers that change your pay entirely</p>
                          <p className="text-xs text-white/60 leading-relaxed mt-0.5">NFGN ranks are directly tied to GCV thresholds. As your GCV grows, you unlock higher PMRC percentages, eligibility for leadership pools, and access to deeper commission generations. At entry level, you earn commissions 2–3 generations deep. At higher GCV ranks, that window expands to 5 generations and beyond. The math is dramatic: the same downline activity that pays you $200/month at a low GCV rank can pay you $800–$1,200/month at a higher rank — with zero new people added. Growing GCV is not about working harder. It is about advancing to the rank where the comp plan pays you what your effort is actually worth.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-500/20 border border-green-400/40 flex items-center justify-center text-green-300 text-xs font-bold mt-0.5">3</div>
                        <div>
                          <p className="text-sm font-semibold text-white">GCV creates residual income — the kind you can pass down</p>
                          <p className="text-xs text-white/60 leading-relaxed mt-0.5">Residual income is income that keeps arriving after the work is done. A paycheck stops when you stop working. GCV-driven commissions do not — because your team keeps ordering, keeps enrolling, and keeps building whether you are actively working that day or not. A mature, high-GCV organization means you get paid on a Tuesday in July when you are on vacation with your family, because hundreds of people in your network made a purchase. That is freedom that a job cannot provide. Build your GCV long enough and with enough intention, and you are not just building an income — you are building an asset that can be passed to the people you love.</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg bg-[#C9A84C]/15 border border-[#C9A84C]/30 p-3 mt-2">
                      <p className="text-xs font-semibold" style={{ color: "#C9A84C" }}>The Bottom Line on GCV</p>
                      <p className="text-xs text-white/70 leading-relaxed mt-1">Track your GCV every single month. Set a GCV growth goal — not just a recruiting goal. When your GCV doubles, your commission potential more than doubles. When it grows 10x, your life changes. GCV is the scoreboard for your legacy.</p>
                      <p className="text-xs text-amber-300/90 font-semibold mt-2">Remember: GCV earnings are exclusively for Pro Members. If you are not yet a Pro Member, your GCV is accumulating — but none of it pays you until you upgrade.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* RC */}
                  <Card className="border-blue-200 bg-blue-50/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-blue-800">
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">RC</Badge>
                        Referral Commission
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-xs text-muted-foreground">Earn a percentage on every order placed by customers and members you personally refer. This is your immediate income when someone you share with makes a purchase.</p>
                      <div className="text-xs font-semibold text-blue-700">Paid on: Direct referral purchases</div>
                    </CardContent>
                  </Card>

                  {/* PSC */}
                  <Card className="border-green-200 bg-green-50/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-green-800">
                        <Badge className="bg-green-100 text-green-800 border-green-200">PSC</Badge>
                        Personal Sales Commission
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-xs text-muted-foreground">Earn a commission on every retail sale you personally make to customers. Each time a retail customer purchases through your direct selling activity, PSC is credited to you based on the CV of those sales. Note: no one earns PSC on their own personal purchases.</p>
                      <div className="text-xs font-semibold text-green-700">Paid on: Your personal retail sales to customers (CV-based)</div>
                    </CardContent>
                  </Card>

                  {/* PMRC */}
                  <Card className="border-purple-200 bg-purple-50/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-purple-800">
                        <Badge className="bg-purple-100 text-purple-800 border-purple-200">PMRC</Badge>
                        Pro Member Registration Commissions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-xs text-muted-foreground">As a Pro Member, you earn commissions on the product registrations (purchases) of Pro Members in your downline — up to 5 generations deep. No one earns PMRC on their own purchases; it is generated entirely by the activity of your enrolled team.</p>
                      <div className="text-xs font-semibold text-purple-700">Paid on: Downline Pro Member product registrations — up to 5 generations</div>
                    </CardContent>
                  </Card>

                  {/* CLB */}
                  <Card className="border-amber-200 bg-amber-50/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-amber-800">
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200">CLB</Badge>
                        Core Leadership Bonus <span className="text-xs font-normal">(ONE-TIME)</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-xs text-muted-foreground">A one-time bonus triggered when you enroll a qualifying number of Pro Members within your first 90 days as a Pro Member. This rewards you for fast-starting your team. Once earned, it is paid once.</p>
                      <div className="text-xs font-semibold text-amber-700">Paid: ONE TIME — within 90-day Pro Member window | Level 1 PMRC milestone</div>
                    </CardContent>
                  </Card>

                  {/* MCB */}
                  <Card className="border-orange-200 bg-orange-50/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-orange-800">
                        <Badge className="bg-orange-100 text-orange-800 border-orange-200">MCB</Badge>
                        Money Circulation Bonus <span className="text-xs font-normal">(RECURRING)</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-xs text-muted-foreground">A recurring bonus that fires every time your Level 2 Pro Members generate a set number of purchases — provided you maintain the required number of active Level 1 Pro Members as a Qualifying Upline Sponsor. This compounds as your team grows.</p>
                      <div className="text-xs font-semibold text-orange-700">Paid: RECURRING — every qualifying Level 2 PMRC cycle | Requires active L1 Pro Members</div>
                    </CardContent>
                  </Card>

                  {/* BPP */}
                  <Card className="border-teal-200 bg-teal-50/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-teal-800">
                        <Badge className="bg-teal-100 text-teal-800 border-teal-200">BPP</Badge>
                        Bill Payer Program
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-xs text-muted-foreground">When you reach your monthly Personal Commissionable Volume (PCV) threshold as a Pro Member, you qualify for the Bill Payer Program — a bonus that helps offset your personal bills and living expenses. Think of it as NFGN paying your utilities, phone bill, or car payment.</p>
                      <div className="text-xs font-semibold text-teal-700">Paid: Monthly — when Pro Member PCV threshold is met</div>
                    </CardContent>
                  </Card>
                </div>

                <div className="rounded-xl bg-[#0a0a0a] p-5 text-white">
                  <p className="text-sm font-semibold mb-3" style={{ color: GOLD }}>The Power of Stacking All 6 Streams</p>
                  <p className="text-xs text-white/70 leading-relaxed">Most people focus on one or two income streams. Top earners activate all six simultaneously. RC pays you immediately from referral purchases. PSC rewards your direct retail customer sales. PMRC builds deep passive income across up to 5 generations of your team. CLB gives you a fast-start bonus. MCB rewards your leadership. BPP keeps your personal bills covered. Together, they create a compounding, self-sustaining income that grows month after month.</p>
                </div>

                {/* ── Membership Tiers ──────────────────────── */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-0.5 w-5 rounded" style={{ background: GOLD }} />
                    <h3 className="text-xs font-extrabold uppercase tracking-[0.2em]" style={{ color: GOLD }}>Membership Tiers</h3>
                  </div>
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
                </div>

                {/* ── Dollar Credit Policy ──────────────────── */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-0.5 w-5 rounded" style={{ background: GREEN }} />
                    <h3 className="text-xs font-extrabold uppercase tracking-[0.2em]" style={{ color: GREEN }}>Dollar Credit ($-Credit) Policy</h3>
                    <Badge className="text-[10px] font-bold" style={{ background: GOLD, color: "#000" }}>RRM+</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Dollar Credit ($-Credit) is store credit earned by Referring Retail Members on qualifying referral purchases. It is <strong>not</strong> cash and cannot be withdrawn unless the member upgrades to Pro Member or meets the cash-out threshold.
                  </p>
                  <div className="rounded-xl border divide-y overflow-hidden">
                    {[
                      { label: "How It's Earned", desc: "Earned when a referred member makes a qualifying purchase, at the applicable referral commission rate. Only approved products are eligible." },
                      { label: "7-Day Hold", desc: "$-Credit is placed in 'pending' status for 7 days from the referral purchase date, aligning with the product refund window." },
                      { label: "30-Day Use Window", desc: "Once the hold clears, members have 30 days to use their $-Credit before it expires permanently — no exceptions." },
                      { label: "Total Expiry: 37 Days", desc: "7-day hold + 30-day use window = 37 days from the original purchase date. Expired credit is permanently forfeited." },
                      { label: "Refund Impact", desc: "If the generating purchase is refunded, the $-Credit is immediately revoked. If already spent, the balance goes negative and must be resolved on the next purchase." },
                    ].map(({ label, desc }) => (
                      <div key={label} className="p-3 bg-card space-y-0.5">
                        <p className="text-xs font-bold text-foreground">{label}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── $-Credit Cash-Out Policy ──────────────── */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-0.5 w-5 rounded" style={{ background: GOLD }} />
                    <h3 className="text-xs font-extrabold uppercase tracking-[0.2em]" style={{ color: GOLD }}>$-Credit Cash-Out Policy</h3>
                    <Badge className="text-[10px] font-bold" style={{ background: GOLD, color: "#000" }}>RRM+</Badge>
                  </div>
                  <div className="rounded-xl border p-4 bg-card space-y-2">
                    <p className="text-xs text-muted-foreground leading-relaxed">Unlock cash-out ability by referring a minimum of <strong>9 Retail Members</strong> using your referral link.</p>
                    <ul className="space-y-1.5">
                      {[
                        "Once the 9-referral threshold is met, request a cash-out through your dashboard.",
                        "Requests are processed by NFGN administration within 3–5 business days.",
                        "Paid via the payout method on file (bank transfer, PayPal, or CashApp).",
                        "NFGN reserves the right to verify referrals before approving cash-out requests.",
                      ].map(item => (
                        <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl p-4 space-y-1" style={{ background: `${GREEN}10`, border: `1px solid ${GREEN}30` }}>
                    <p className="text-xs font-bold" style={{ color: GREEN }}>Better Path:</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Upgrade to Pro Member and turn ALL future referral earnings into real cash — no 37-day clock, no $-Credit limitations. Pro Members earn cash commissions across all 9 levels, plus CLB, MCB, BPP, and more.
                    </p>
                  </div>
                </div>

                <TrainingQuiz
                  title="Compensation Plan — Proficiency Quiz"
                  questions={compPlanQuiz}
                />
              </CardContent>
            </Card>
          )}

          {/* ── $3,500/MONTH PLAN ─────────────────────────── */}
          {activeSection === "2500-plan" && (
            <div className="space-y-6">

              {/* Upline callout */}
              <Card className="border-primary/40 bg-primary/5">
                <CardContent className="pt-5 pb-5">
                  <div className="flex gap-3 items-start">
                    <Users className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-foreground">Your First Move: Contact Your Upline Sponsor</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">Before you do anything else — reach out to your upline sponsor. They have already walked this path, know what works, and are personally invested in your success because your growth directly benefits them too. Schedule a call, ask them to walk you through this 90-day plan, and stay in weekly contact. You are not doing this alone. Your upline is your most powerful resource — use them.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-6">
                  <SectionHeader icon={Target} title="How to Earn $3,500/Month in 90 Days or Less" subtitle="A detailed, income-stream-by-income-stream blueprint with daily targets" color={GREEN} />

                  {/* Income breakdown */}
                  <div className="rounded-xl border p-5 space-y-4">
                    <p className="text-sm font-bold">The $3,500/Month Income Breakdown</p>
                    <p className="text-sm text-muted-foreground">All five income streams work simultaneously. Your job is to activate each one as quickly as possible — some in Week 1, others by the end of Month 2.</p>

                    <div className="space-y-2 mt-2">
                      {[
                        { stream: "Retail Sales + RC", amount: "$800", color: "#2D6A4F", desc: "12–15 active retail customers buying 1–2 products/month each. RC fires on every purchase through your referral link." },
                        { stream: "Personal Sales Commission (PSC)", amount: "$300", color: "#1d4ed8", desc: "Earned on your direct retail sales to customers. The more customers you sell to personally, the higher your PSC. No one earns PSC on their own purchases — this is purely from customer-facing retail selling activity." },
                        { stream: "Level 1 PMRC", amount: "$900", color: "#7c3aed", desc: "6–8 personally enrolled Pro Members who are each registering products monthly. Every registration they make generates PMRC credited to you. PMRC reaches up to 5 generations deep in your team." },
                        { stream: "Level 2 MCB — Money Circulation Bonus", amount: "$800", color: "#dc2626", desc: "Your biggest recurring bonus. When your L1 Pro Members each enroll their own Pro Members (your Level 2), and those L2 members purchase, the MCB fires repeatedly. With 5 L1 × 3 L2 each = 15 Level 2 members generating orders, MCB cycles continuously." },
                        { stream: "Bill Payer Program (BPP)", amount: "$200", color: "#0891b2", desc: "Hit your personal PCV threshold each month as a Pro Member and NFGN covers your bills. This activates automatically when your monthly PCV is met." },
                        { stream: "CLB Fast-Start Bonus (Month 1)", amount: "$500+", color: GOLD, desc: "Triggered ONCE in your first 90 days when your L1 PMRC count reaches the qualifying threshold. Move fast — this bonus rewards speed." },
                      ].map((s, i) => (
                        <div key={i} className="flex gap-3 p-3 rounded-lg border bg-white items-start">
                          <div className="h-2 w-2 rounded-full flex-shrink-0 mt-2" style={{ background: s.color }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-foreground">{s.stream}</p>
                              <span className="text-base font-bold flex-shrink-0" style={{ color: s.color }}>{s.amount}/mo</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center border-t pt-4 mt-2">
                      <p className="text-sm font-bold">Combined Monthly Target</p>
                      <p className="text-2xl font-bold" style={{ color: GOLD }}>$3,500+</p>
                    </div>
                    <p className="text-xs text-muted-foreground">*CLB is one-time. Ongoing monthly run-rate after Month 1 is $3,000–$3,500 from the remaining five streams, with MCB growing as your L2 team expands.</p>
                  </div>

                  {/* Time commitment */}
                  <div className="rounded-xl bg-[#0a0a0a] p-5 text-white space-y-4">
                    <p className="text-sm font-bold flex items-center gap-2" style={{ color: GOLD }}>
                      <Clock className="h-4 w-4" /> How Many Hours Per Day?
                    </p>
                    <div className="grid sm:grid-cols-3 gap-4">
                      {[
                        { phase: "Month 1", hours: "2–3 hrs/day", label: "Full Launch Mode", items: ["1 hr: outreach & messages", "45 min: social media content", "30 min: follow-ups", "30 min: team check-in with upline"] },
                        { phase: "Month 2", hours: "1.5–2 hrs/day", label: "Build & Duplicate", items: ["45 min: new prospect outreach", "30 min: support your L1 Pro Members", "30 min: social media", "15 min: back-office review"] },
                        { phase: "Month 3", hours: "1–1.5 hrs/day", label: "Scale & Sustain", items: ["30 min: new lead outreach", "30 min: team leadership & coaching", "30 min: content & follow-ups"] },
                      ].map(p => (
                        <div key={p.phase} className="bg-white/5 rounded-lg p-4 space-y-2">
                          <p className="text-xs text-white/50">{p.phase}</p>
                          <p className="text-lg font-bold" style={{ color: GOLD }}>{p.hours}</p>
                          <p className="text-xs font-semibold text-white/80">{p.label}</p>
                          <ul className="space-y-1 mt-2">
                            {p.items.map((item, i) => (
                              <li key={i} className="text-xs text-white/60 flex gap-1.5">
                                <ChevronRight className="h-3 w-3 flex-shrink-0 mt-0.5" style={{ color: GOLD }} />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Daily customer conversations */}
                  <div className="rounded-xl border p-5 space-y-4">
                    <p className="text-sm font-bold flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-primary" /> How Many Customer Conversations Per Day?
                    </p>
                    <p className="text-sm text-muted-foreground">This is the single most important number in your business. The pipeline is the business. If you are talking to enough people every day, everything else follows.</p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {[
                        { type: "New Prospect Conversations", target: "5–7 per day", detail: "These are first-touch conversations — people you're reaching out to for the first time about the products or opportunity. This can be DMs, texts, in-person, or social media comments. 5 new conversations per day = 150/month = statistically 10–15 new customers or recruits." },
                        { type: "Warm Follow-Ups", target: "3–5 per day", detail: "People who already know about NFGN but haven't bought or joined yet. Follow-up is where most sales are actually made. 80% of sales happen after the 5th contact. Most reps quit after 1–2. Your follow-up discipline is your competitive advantage." },
                        { type: "Team Check-Ins (L1 Pro Members)", target: "1–2 per day", detail: "Call, text, or message one of your Pro Members every day. Ask how their business is going, what challenges they're facing, and who they're talking to. Their success is your MCB. Their duplication is your residual income." },
                        { type: "Social Media Engagements", target: "10–15 per day", detail: "Comment on posts in wellness groups, respond to stories, answer DMs, and reply to comments on your content. Social selling is a numbers game — the more you show up, the more you attract." },
                      ].map(c => (
                        <div key={c.type} className="border rounded-lg p-4 space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <p className="text-sm font-semibold text-foreground">{c.type}</p>
                            <Badge className="flex-shrink-0 text-xs" style={{ background: `${GOLD}20`, color: GOLD, border: `1px solid ${GOLD}40` }}>{c.target}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{c.detail}</p>
                        </div>
                      ))}
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-xs font-bold text-green-900">The Math: 5 new conversations/day × 30 days = 150 contacts. At a 10% conversion rate = 15 new customers or recruits per month. Over 90 days = 45 new people in your pipeline. That is how you build $3,500/month.</p>
                    </div>
                  </div>

                  {/* MCB deep dive */}
                  <Card className="border-red-200 bg-red-50/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-red-800">
                        <TrendingUp className="h-4 w-4" /> Level 2 MCB — Your Biggest Recurring Income Driver
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-xs text-muted-foreground leading-relaxed">The Money Circulation Bonus (MCB) is what separates a $1,000/month earner from a $3,500/month earner. It fires every time your <strong>Level 2 Pro Members</strong> hit the purchase trigger — and it fires repeatedly, with no cap, as long as you maintain your qualifying L1 count.</p>
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-foreground">How MCB Compounds Over 90 Days:</p>
                        {[
                          { wk: "Month 1", ev: "You enroll 5 L1 Pro Members. MCB is not yet active — your L1 team is just getting started." },
                          { wk: "Month 2", ev: "Your L1 Pro Members each enroll 2–3 of their own (your L2). MCB begins firing as L2 members make purchases. Each cycle = a bonus to you." },
                          { wk: "Month 3", ev: "With 10–15 L2 Pro Members ordering each month, MCB fires repeatedly. At this scale it can contribute $600–$1,000+/month in bonus income alone." },
                        ].map((r, i) => (
                          <div key={i} className="flex gap-3 text-xs">
                            <span className="font-bold text-red-700 w-16 flex-shrink-0">{r.wk}</span>
                            <span className="text-muted-foreground">{r.ev}</span>
                          </div>
                        ))}
                      </div>
                      <div className="bg-red-100 border border-red-200 rounded-lg p-3">
                        <p className="text-xs font-bold text-red-900">Action: Help every one of your L1 Pro Members enroll their first 2 Pro Members within 30 days of joining. This is the single fastest way to activate MCB and push your income past $3,500/month.</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Month-by-month plan */}
                  <div className="space-y-4">
                    <p className="font-semibold text-sm">90-Day Month-by-Month Action Plan</p>
                    <div className="space-y-0 border-l-2 ml-4" style={{ borderColor: GREEN }}>
                      <Step number={1} title="Month 1 — Launch Hard (Target: $800–$1,200 + CLB)">
                        <p><strong>Week 1:</strong> Call your upline sponsor. Review this training together. Build your contact list of 100 names. Make your first 5 product conversations that same day.</p>
                        <p><strong>Week 2:</strong> Enroll your first 3–5 retail customers (your PSC builds from their purchases). Place your personal IGNITE order (activates BPP PCV progress). Enroll your first 2 Pro Members.</p>
                        <p><strong>Week 3–4:</strong> Push to 5 enrolled Pro Members. Help each one make their first retail sale. Your CLB window is open — every L1 PMRC counts toward it. Maintain 5–7 new prospect conversations every day.</p>
                        <p><strong>Income this month:</strong> RC + PSC + early PMRC + CLB = $800–$1,500 depending on speed.</p>
                      </Step>
                      <Step number={2} title="Month 2 — Build Your L2 (Target: $1,800–$2,500)">
                        <p>Your primary job this month is helping your L1 Pro Members enroll their first 2–3 people. This builds your Level 2 and activates MCB. Hold weekly team calls. Coach your L1 daily.</p>
                        <p>Continue your own outreach (5 new convos/day). Grow retail customers to 12–15. Your PMRC L1 income is growing as your team orders. MCB starts firing as L2 members purchase.</p>
                        <p><strong>Income this month:</strong> RC + PSC + PMRC L1 + MCB (early) + BPP = $1,800–$2,500.</p>
                      </Step>
                      <Step number={3} title="Month 3 — Scale &amp; Collect (Target: $3,500+)">
                        <p>By now you have 5+ L1 Pro Members each with 2–3 of their own L2 members (10–15 Level 2 total). MCB is firing repeatedly. PMRC from both levels is compounding. BPP is locked in monthly.</p>
                        <p>Keep enrolling. The more L2 members your team builds, the more MCB fires. Every new L2 Pro Member is another MCB trigger waiting to happen.</p>
                        <p><strong>Income this month:</strong> RC + PSC + PMRC L1 + PMRC L2 + MCB (recurring) + BPP = $3,000–$3,500+.</p>
                      </Step>
                    </div>
                  </div>

                  {/* Daily non-negotiables */}
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="pt-5 space-y-3">
                      <p className="text-sm font-semibold text-green-900">Daily Non-Negotiables to Hit $3,500</p>
                      <div className="space-y-2">
                        {[
                          "Talk to 5–7 new prospects every single day — no exceptions, no days off",
                          "Follow up with 3–5 warm contacts who haven't decided yet",
                          "Post wellness/lifestyle content on at least one social platform daily",
                          "Check in with 1–2 of your L1 Pro Members — ask how their conversations are going",
                          "Review your back office daily: commissions, team activity, BPP progress",
                          "Check in with your upline sponsor at least once a week for coaching and accountability",
                          "Help at least one L1 Pro Member enroll their first new member each week",
                        ].map((t, i) => <Tip key={i}>{t}</Tip>)}
                      </div>
                    </CardContent>
                  </Card>

                </CardContent>
              </Card>

              <TrainingQuiz
                title="$3,500/Month Plan — Proficiency Quiz"
                questions={incomeplanQuiz}
              />
            </div>
          )}

          {/* ── BILL PAYER PROGRAM ────────────────────────── */}
          {activeSection === "bpp" && (
            <Card>
              <CardContent className="pt-6 space-y-6">
                <SectionHeader icon={Home} title="Bill Payer Program (BPP)" subtitle="Let NFGN cover your personal bills every month" color="#2D6A4F" />

                <div className="rounded-xl bg-[#0a0a0a] p-5 text-white space-y-2">
                  <p className="text-sm font-semibold" style={{ color: GOLD }}>What Is the BPP?</p>
                  <p className="text-xs text-white/70 leading-relaxed">The Bill Payer Program is a monthly bonus paid to Pro Members who meet their Personal Commissionable Volume (PCV, also known as PV) requirement in a given month. Once your PCV threshold is hit, NFGN credits your account with a BPP bonus — designed to cover real-world bills like utilities, phone plans, subscriptions, rent contributions, or car payments.</p>
                </div>

                <div className="space-y-4">
                  <p className="font-semibold text-sm">How to Qualify Every Month</p>
                  <div className="space-y-0 border-l-2 ml-4" style={{ borderColor: GOLD }}>
                    <Step number={1} title="Be an Active Pro Member">
                      <p>You must be enrolled as a Pro Member. If you haven't upgraded yet, do so from your Profile page — the Pro Member upgrade activates all bonus eligibility.</p>
                    </Step>
                    <Step number={2} title="Hit Your Monthly PCV Threshold">
                      <p>PCV (Personal Commissionable Volume, also known as PV) is calculated from your own product orders each month. The CV value of each product contributes to your PCV. Check the BPP page in your dashboard to see your current month's progress toward the threshold.</p>
                    </Step>
                    <Step number={3} title="Maintain Consistency">
                      <p>BPP is a monthly recurring bonus. Every month you qualify, you receive it. Set up a personal product routine — use the products yourself so your PCV stays active and your results stay authentic.</p>
                    </Step>
                  </div>
                </div>

                {/* ATTN: Zone GCV Rule (Pro Members only) */}
                {isProMember && (
                  <div className="rounded-xl border-2 border-amber-400 bg-amber-50 p-4">
                    <div className="flex gap-3 items-start">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-extrabold tracking-widest bg-amber-400 text-black uppercase flex-shrink-0 mt-0.5">
                        ATTN
                      </span>
                      <div className="space-y-1">
                        <p className="font-bold text-amber-900 text-sm">BPP GCV Qualification Rule — Pro Members</p>
                        <p className="text-sm text-amber-800 leading-relaxed">
                          Only <strong>Levels 2, 3, 4, and 5</strong> count toward your BPP Group Commissionable Volume.{" "}
                          Your <strong>Level 1 (direct referrals) does NOT count</strong>, and neither do Levels 6–9.
                          The system automatically calculates your qualifying Zone GCV from Levels 2–5 only.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Zone of Duplication */}
                <div className="rounded-2xl border border-[#C9A84C]/30 bg-[#0a0a0a] text-white p-5 space-y-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-bold mb-0.5" style={{ color: GOLD }}>Where BPP GCV Comes From</p>
                    <h4 className="text-base font-serif font-bold">The Zone of Duplication</h4>
                    <p className="text-white/50 text-xs">Levels 2 · 3 · 4 · 5</p>
                  </div>
                  <p className="text-xs text-white/75 leading-relaxed">
                    Your BPP Group Volume does <strong className="text-white">not</strong> come from Level 1. It comes from{" "}
                    <strong className="text-white">Levels 2, 3, 4, and 5</strong> — your <strong className="text-white">Zone of
                    Duplication</strong>. Inside this zone lives your <strong className="text-white">Wealth Builders Community</strong>,
                    the heart of your group's money circulation. Level 2 always pays the most — it carries a 50% commission match
                    over Level 1 (e.g., L1 = 12% → L2 = 24%).
                  </p>
                  <div className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-2">
                    <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: GOLD }}>The Purpose</p>
                    <p className="text-xs text-white/70 leading-relaxed">
                      Encourage sponsors to place new customers under their Core Leadership Group (Gen 1). This creates excitement
                      and confidence in your Level 1 leaders — and flows directly into your Zone, generating the GCV needed for BPP qualification.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: GOLD }}>Three Guiding Principles — Joe Marcelino</p>
                    {[
                      "Help Yourself By Helping Another.",
                      "If you want to be successful at building your leadership, you must first be successful at building leaders.",
                      "Communities don't build people. People build communities.",
                    ].map((q, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <span className="h-5 w-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black mt-0.5"
                          style={{ background: "rgba(201,168,76,0.2)", color: GOLD, border: "1px solid rgba(201,168,76,0.4)" }}>
                          {i + 1}
                        </span>
                        <p className="text-xs italic text-white/75 leading-relaxed">"{q}"</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                    <p className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: GOLD }}>Build Your Wealth Builders Community</p>
                    <p className="text-xs text-white/70 leading-relaxed">
                      Focus on your Core Leadership Group — then help each of them build theirs. More Core Leadership Groups at each level
                      means greater Group Volume, faster BPP maximization, and fuller access to the{" "}
                      <strong className="text-white">2 Down By Infinity Multi-Point Payment Grid</strong>.
                    </p>
                  </div>
                </div>

                <Card className="border-teal-200 bg-teal-50">
                  <CardContent className="pt-5 space-y-3">
                    <p className="text-sm font-semibold text-teal-900 flex items-center gap-2"><Shield className="h-4 w-4" /> BPP Strategy Tips</p>
                    <div className="space-y-2">
                      {[
                        "Order your personal supply early in the month — don't wait until the last few days",
                        "Track your PCV progress from the Bill Payer Program page in your dashboard",
                        "If you're close to the threshold, placing one additional product order puts you over",
                        "The BPP bonus compounds with your other income streams — it's not a replacement, it's a supplement",
                        "Encourage your Pro Members to do the same — when their BPP activates, your MCB grows too",
                      ].map((t, i) => <Tip key={i}>{t}</Tip>)}
                    </div>
                  </CardContent>
                </Card>

                <TrainingQuiz
                  title="Bill Payer Program — Proficiency Quiz"
                  questions={bppQuiz}
                />
              </CardContent>
            </Card>
          )}

          {/* ── 90-DAY $3,500 RESIDUAL PLAN ──────────────── */}
          {activeSection === "90-day" && (
            <Card>
              <CardContent className="pt-6 space-y-6">
                <SectionHeader icon={TrendingUp} title="90-Day $3,500 Residual Income Plan" subtitle="The exact roadmap to building lasting passive income" />

                <p className="text-sm text-muted-foreground">This plan is designed to get you to $3,500/month in residual (recurring) income within 90 days. It requires full commitment — treating your NFGN business like a real business, not a hobby. Follow every step.</p>

                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    { period: "Days 1–30", label: "Foundation", color: "#C9A84C", target: "Enroll 5 Pro Members", actions: ["Launch to your full contact list", "Hold 2 virtual info sessions", "Enroll 5 Pro Members personally", "Get 10+ retail customers", "Earn your CLB bonus"] },
                    { period: "Days 31–60", label: "Duplication", color: "#2D6A4F", target: "Help your team duplicate", actions: ["Help each of your 5 enroll 2 more", "Your downline grows to 10–15", "PMRC Level 1 & 2 activates", "MCB bonus starts firing", "Hit BPP threshold every month"] },
                    { period: "Days 61–90", label: "Compounding", color: "#1d4ed8", target: "$3,500+ monthly passive", actions: ["20+ Pro Members in downline", "PMRC Level 2 fully active", "MCB recurring regularly", "Your BPP locked in monthly", "Residual income compounding"] },
                  ].map(p => (
                    <Card key={p.period} className="overflow-hidden">
                      <div className="h-2" style={{ background: p.color }} />
                      <CardHeader className="pb-2 pt-4">
                        <div className="text-xs font-medium text-muted-foreground">{p.period}</div>
                        <CardTitle className="text-base">{p.label}</CardTitle>
                        <CardDescription className="text-xs">{p.target}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1.5">
                          {p.actions.map((a, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color: p.color }} />
                              {a}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="rounded-xl border p-5 space-y-4">
                  <p className="font-semibold text-sm">The Residual Income Math</p>
                  <div className="space-y-1">
                    <CompRow label="5 L1 Pro Members × PMRC avg" value="~$500" sub="Level 1 downline PMRC" />
                    <CompRow label="15 L2 Pro Members × PMRC avg" value="~$1,500" sub="Level 2 downline PMRC" />
                    <CompRow label="MCB (recurring every cycle)" value="~$500–$800" sub="Level 2 MCB fires repeatedly" />
                    <CompRow label="RC from active referrals" value="~$500" sub="Ongoing referral purchases" />
                    <CompRow label="BPP Bonus (monthly qualification)" value="~$200" sub="Personal volume milestone" highlight />
                    <CompRow label="Total Residual (Month 3 Target)" value="$3,200–$3,500+" highlight />
                  </div>
                  <p className="text-xs text-muted-foreground">*These figures are projections based on consistent activity. Results vary based on effort and team size.</p>
                </div>

                <TrainingQuiz
                  title="90-Day Residual Plan — Proficiency Quiz"
                  questions={ninetyDayQuiz}
                />
              </CardContent>
            </Card>
          )}

          {/* ── IGNITE TRAINING ───────────────────────────── */}
          {activeSection === "ignite" && (
            <Card>
              <CardContent className="pt-6 space-y-6">
                <SectionHeader icon={Flame} title="IGNITE Herbal Gut Cleanse — Product Training" subtitle="Everything you need to sell confidently and authentically" color="#dc2626" />

                <div className="grid sm:grid-cols-2 gap-4">
                  <Card className="bg-red-50 border-red-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-red-800">
                        <Leaf className="h-4 w-4" /> What Is IGNITE?
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground space-y-2">
                      <p>IGNITE is NFGN's flagship herbal gut cleanse — a naturopathic formula designed to support digestive health, detoxification, and overall gut microbiome balance.</p>
                      <p>It is made with clean, plant-based ingredients and is free from harsh synthetic laxatives. IGNITE works gently and progressively to cleanse and restore the gut lining over a recommended cleanse cycle.</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-50 border-green-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-green-800">
                        <Heart className="h-4 w-4" /> Key Benefits to Communicate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-xs text-muted-foreground space-y-1.5">
                        {[
                          "Supports healthy digestion and regularity",
                          "Reduces bloating and digestive discomfort",
                          "Promotes detoxification at the gut level",
                          "Supports energy levels and mental clarity",
                          "Herbal & naturopathic — no harsh chemicals",
                          "Easy to incorporate into a daily routine",
                        ].map((b, i) => <li key={i} className="flex gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0 mt-0.5" />{b}</li>)}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-3">
                  <p className="font-semibold text-sm">How to Sell IGNITE — The 3-Step Conversation</p>
                  <div className="space-y-0 border-l-2 ml-4" style={{ borderColor: "#dc2626" }}>
                    <Step number={1} title="Lead with a Question">
                      <p>"Have you ever dealt with bloating, sluggish digestion, or just feeling off even when you're eating well? That's usually a gut issue." — This opens the door naturally without selling anything.</p>
                    </Step>
                    <Step number={2} title="Share Your Experience (or a Testimonial)">
                      <p>"I started using IGNITE and within [X days] I noticed [specific result — more energy, less bloating, better sleep, etc.]. I wasn't expecting it to work that fast." — Make it real and personal. If you haven't used it yet, use a team member's story.</p>
                    </Step>
                    <Step number={3} title="Make a Soft Offer">
                      <p>"I'm sharing it with a few people right now. If you want to try it, I can send you my link — it comes with my personal support. No pressure, just wanted to pass it on." — Low-pressure, high-authenticity.</p>
                    </Step>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="font-semibold text-sm">Common Questions & How to Answer Them</p>
                  <div className="space-y-2">
                    <AccordionItem title="Is it safe? Are there side effects?">
                      <p>IGNITE uses herbal, naturopathic ingredients. It is generally well-tolerated. Some people experience mild detox responses (like slightly more frequent bathroom visits) in the first few days — this is normal and a sign it's working. Always encourage customers to read the label and consult their doctor if they have specific health conditions.</p>
                    </AccordionItem>
                    <AccordionItem title="How long until I see results?">
                      <p>Most customers begin noticing changes in 3–7 days — reduced bloating, improved regularity, better energy. Full cleanse results are best seen over a 15–30 day cycle. Consistency is key.</p>
                    </AccordionItem>
                    <AccordionItem title="Can I take it with other supplements or medications?">
                      <p>Encourage customers to consult their healthcare provider if they are on prescription medications. IGNITE is herbal-based, but interactions are always worth verifying with a professional for peace of mind.</p>
                    </AccordionItem>
                    <AccordionItem title="How do I take IGNITE?">
                      <p>Follow the recommended dosage on the product label. IGNITE is designed to be taken consistently — not just as a one-time cleanse. Daily use as part of a wellness routine delivers the best results.</p>
                    </AccordionItem>
                    <AccordionItem title="Is it expensive compared to other cleanses?">
                      <p>At $79.99, IGNITE is competitively priced against comparable herbal gut health products. Unlike many drugstore cleanse options, it is naturopathic and focused on long-term gut health — not just a quick fix. And through your referral link, they support your business while taking care of their health.</p>
                    </AccordionItem>
                  </div>
                </div>

                <Card className="bg-red-50 border-red-200">
                  <CardContent className="pt-5 space-y-3">
                    <p className="text-sm font-semibold text-red-900 flex items-center gap-2"><Flame className="h-4 w-4" /> Top Sales Tips for IGNITE</p>
                    <div className="space-y-2">
                      {[
                        "Post a before/after or daily check-in on your social media while on IGNITE",
                        "Offer a 'IGNITE Challenge' — get 3 friends to try it with you at the same time",
                        "Target audiences who talk about bloating, gut health, keto, fasting, or clean eating",
                        "Partner with local wellness pages, health-focused Facebook groups, and Instagram communities",
                        "Offer to answer questions personally — your personal touch closes more sales than any ad",
                      ].map((t, i) => <Tip key={i}>{t}</Tip>)}
                    </div>
                  </CardContent>
                </Card>

                <TrainingQuiz
                  title="IGNITE Product Training — Proficiency Quiz"
                  questions={igniteQuiz}
                />
              </CardContent>
            </Card>
          )}

          {/* ── BIG BONUSES ───────────────────────────────── */}
          {activeSection === "big-bonuses" && (
            <Card>
              <CardContent className="pt-6 space-y-6">
                <SectionHeader icon={Award} title="Earn Big Bonuses" subtitle="CLB, MCB, and leadership bonus strategy" />

                <p className="text-sm text-muted-foreground">NFGN's bonus structure rewards leaders who move fast and build deep. The two biggest bonuses — CLB and MCB — are activated through team-building actions, not just retail sales.</p>

                <div className="space-y-4">
                  <Card className="border-amber-300 overflow-hidden">
                    <div className="h-1.5 bg-gradient-to-r from-amber-400 to-yellow-500" />
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Star className="h-4 w-4 text-amber-600" />
                        Core Leadership Bonus (CLB) — One-Time Fast-Start Bonus
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-xs text-muted-foreground">The CLB fires exactly once — when your Level 1 team generates enough PMRC activity within your first 90 days as a Pro Member. This is designed to reward new Pro Members who move fast.</p>
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 space-y-2">
                        <p className="text-xs font-semibold text-amber-900">How to trigger the CLB:</p>
                        <div className="space-y-1.5">
                          {[
                            "Upgrade to Pro Member",
                            "Enroll enough personally sponsored Pro Members within 90 days",
                            "Ensure they are active (making purchases that generate PMRC)",
                            "The bonus fires automatically when the PMRC count threshold is met",
                          ].map((s, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-amber-800">
                              <span className="font-bold w-4 flex-shrink-0">{i + 1}.</span>
                              {s}
                            </div>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium text-amber-700">⚡ Strategy: Start fast. The 90-day window begins when you upgrade. Enroll your first Pro Members as quickly as possible to maximize your window and get your team active.</p>
                    </CardContent>
                  </Card>

                  <Card className="border-orange-300 overflow-hidden">
                    <div className="h-1.5 bg-gradient-to-r from-orange-400 to-red-400" />
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-orange-600" />
                        Money Circulation Bonus (MCB) — Recurring Leadership Bonus
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-xs text-muted-foreground">The MCB is a recurring bonus that fires every time your Level 2 Pro Members (your team's team) hit a purchase milestone — as long as you maintain the required number of active Level 1 Pro Members. This is the bonus that scales with you.</p>
                      <div className="rounded-lg bg-orange-50 border border-orange-200 p-3 space-y-2">
                        <p className="text-xs font-semibold text-orange-900">Requirements (Qualifying Upline Sponsor):</p>
                        <div className="space-y-1.5">
                          {[
                            "Maintain the required number of active L1 Pro Members",
                            "Your L2 Pro Members must generate qualifying PMRC purchases",
                            "The MCB fires each time the trigger count is reached",
                            "No cap — it fires repeatedly as your L2 team grows",
                          ].map((s, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-orange-800">
                              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-orange-600" />
                              {s}
                            </div>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-orange-700 font-medium">⚡ Strategy: Help your L1 Pro Members enroll their own Pro Members quickly. As they build Level 2, your MCB fires repeatedly — creating a bonus income stream that grows the deeper your team goes.</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="rounded-xl bg-[#0a0a0a] p-5 text-white">
                  <p className="text-sm font-semibold mb-3" style={{ color: GOLD }}>Leadership Mindset for Maximum Bonuses</p>
                  <div className="space-y-2">
                    {[
                      "Your income is determined by your team's production — invest in their success",
                      "Hold weekly team calls to train, encourage, and track progress",
                      "Recognize and celebrate your team members publicly — motivation drives activity",
                      "The faster you help your L1 enroll their first 2–3, the sooner MCB fires for you",
                      "Never stop enrolling — your personal L1 count is your MCB qualification floor",
                    ].map((t, i) => (
                      <div key={i} className="flex gap-2 text-xs text-white/70">
                        <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color: GOLD }} />
                        {t}
                      </div>
                    ))}
                  </div>
                </div>

                <TrainingQuiz
                  title="Earn Big Bonuses — Proficiency Quiz"
                  questions={bigBonusesQuiz}
                />
              </CardContent>
            </Card>
          )}

          {/* ── ADDITIONAL TRAINING ───────────────────────── */}
          {activeSection === "additional" && (
            <Card>
              <CardContent className="pt-6 space-y-6">
                <SectionHeader icon={Lightbulb} title="Additional Training" subtitle="Social media, objection handling, mindset, and growth tactics" />

                <div className="grid sm:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-primary" /> Handling Objections
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <AccordionItem title={"\"I don't have the money right now\""}>
                        <p>"I totally get that — that's actually why I joined. I was looking for something that could create extra income without a huge investment. The products are affordable, and the earning opportunity starts immediately. Would it help if I walked you through what the first month looks like financially?"</p>
                      </AccordionItem>
                      <AccordionItem title={"\"Is this an MLM? I don't want to do MLM\""}>
                        <p>"I understand the concern — there are a lot of bad MLMs out there. NFGN is a product-first company. We lead with wellness products that people actually want and use. The business side is optional, and most of our customers are just here for the products. The commission plan rewards people for sharing something they already love."</p>
                      </AccordionItem>
                      <AccordionItem title={"\"I don't have time\""}>

                        <p>"You only need 30–60 minutes a day to start. Most of it is simply sharing on social media and following up on conversations you're already having. As your team grows, the time required to earn actually decreases because residual income works while you sleep."</p>
                      </AccordionItem>
                      <AccordionItem title={"\"I tried something like this before and it didn't work\""}>

                        <p>"I hear you. A lot of people have had that experience. What made NFGN different for me is the products are real and the comp plan is transparent. I'd love to share my numbers with you after just [X weeks]. Would you be open to a 15-minute conversation?"</p>
                      </AccordionItem>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-primary" /> Social Media Growth Tactics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {[
                        { t: "Content Mix", d: "Follow the 70/20/10 rule: 70% lifestyle & wellness value, 20% product posts, 10% business opportunity. Don't over-pitch." },
                        { t: "Instagram Stories", d: "Post daily Stories with polls, Q&As, and countdowns. Stories create engagement that keeps you top-of-mind." },
                        { t: "Facebook Groups", d: "Join 3–5 wellness, fitness, or entrepreneur groups. Provide value first. Share your link when asked, never spam." },
                        { t: "TikTok / Reels", d: "Short-form video converts. Post product unboxings, results check-ins, and 'Day in the Life' wellness content." },
                        { t: "YouTube Shorts", d: "How-to gut health videos with your IGNITE experience get organic traffic for months after posting." },
                        { t: "Consistency beats perfection", d: "Posting imperfectly every day beats posting perfectly once a week. Volume builds trust and algorithm reach." },
                      ].map(item => (
                        <div key={item.t} className="text-xs space-y-0.5">
                          <p className="font-semibold text-foreground">{item.t}</p>
                          <p className="text-muted-foreground">{item.d}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary" /> Follow-Up System
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">Fortune is in the follow-up. Most people say no 2–3 times before saying yes. A simple follow-up schedule doubles your conversion rate.</p>
                      <div className="space-y-2">
                        {[
                          { day: "Day 1", action: "Initial share — send your link with a personal message" },
                          { day: "Day 3", action: "Follow-up — 'Did you get a chance to look at that link?'" },
                          { day: "Day 7", action: "Value add — share a result, testimonial, or relevant content" },
                          { day: "Day 14", action: "Soft close — 'I wanted to check in one last time — are you open to hearing more?'" },
                          { day: "Monthly", action: "Stay connected — keep posting, they'll come back when the timing is right" },
                        ].map(f => (
                          <div key={f.day} className="flex gap-3 text-xs">
                            <span className="font-bold text-primary w-14 flex-shrink-0">{f.day}</span>
                            <span className="text-muted-foreground">{f.action}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#0a0a0a] text-white">
                  <CardContent className="pt-6 space-y-3">
                    <p className="text-sm font-semibold flex items-center gap-2" style={{ color: GOLD }}><Zap className="h-4 w-4" /> Success Mindset Rules</p>
                    <div className="space-y-2">
                      {[
                        "Treat rejections as redirections — every 'no' moves you closer to a 'yes'",
                        "Invest in yourself: read, listen to podcasts, attend webinars on wellness and entrepreneurship",
                        "Your belief in the product is your best sales tool — stay on the products",
                        "Set weekly income goals, not just activity goals — measure what matters",
                        "Build community first, business second — people don't join companies, they join people",
                        "Celebrate small wins publicly — momentum is contagious",
                      ].map((t, i) => (
                        <div key={i} className="flex gap-2 text-xs text-white/70">
                          <Star className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color: GOLD }} />
                          {t}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <TrainingQuiz
                  title="Additional Training — Proficiency Quiz"
                  questions={additionalTrainingQuiz}
                />
              </CardContent>
            </Card>
          )}

          {/* ── ADD APP TO PHONE ──────────────────────────────────────── */}
          {activeSection === "app-setup" && (
            <Card>
              <CardContent className="pt-6 space-y-6">
                <SectionHeader
                  icon={Phone}
                  title="Add NFGN to Your Phone"
                  subtitle="Install the platform on your home screen — no app store required"
                  color={GREEN}
                />

                {/* What it is */}
                <div className="rounded-xl bg-[#0a0a0a] text-white p-5 space-y-3">
                  <p className="text-sm font-semibold" style={{ color: GOLD }}>What This Is</p>
                  <p className="text-sm text-white/75 leading-relaxed">
                    The NFGN platform is a <strong className="text-white">web app</strong> — which means it works on any phone
                    through your browser, without needing to download anything from an app store. You can install it directly
                    to your home screen so it opens like a regular app, full-screen, with one tap. It works on both iPhones and Android phones.
                  </p>
                </div>

                {/* iPhone Instructions */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-bold"></span>
                    </div>
                    <h3 className="font-serif font-bold text-base">iPhone Instructions (Safari)</h3>
                  </div>
                  <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                    {[
                      {
                        step: 1,
                        title: "Open Safari",
                        detail: "This only works in Safari — not Chrome or other browsers on iPhone. If you're using a different browser, switch to Safari first.",
                      },
                      {
                        step: 2,
                        title: "Go to the NFGN website",
                        detail: "Type your NFGN web address into the Safari address bar and open it. Once it's fully loaded, move to the next step.",
                      },
                      {
                        step: 3,
                        title: "Tap the Share button",
                        detail: "At the bottom center of Safari, you'll see a box with an arrow pointing up — that's the Share button. Tap it.",
                      },
                      {
                        step: 4,
                        title: 'Scroll down and tap "Add to Home Screen"',
                        detail: 'In the Share menu that slides up, scroll down until you see "Add to Home Screen." Tap it.',
                      },
                      {
                        step: 5,
                        title: 'Name it and tap "Add"',
                        detail: 'You\'ll see a screen asking you to name the shortcut. You can name it "NFGN" or leave it as-is. Then tap "Add" in the top right corner.',
                      },
                      {
                        step: 6,
                        title: "Done — find the icon on your home screen",
                        detail: "The NFGN icon will now appear on your iPhone home screen. Tap it anytime to open the platform full-screen, just like an app.",
                      },
                    ].map(s => (
                      <div key={s.step} className="flex gap-4 p-4 bg-white items-start">
                        <span className="h-7 w-7 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-black text-white mt-0.5"
                          style={{ background: "#0a0a0a" }}>
                          {s.step}
                        </span>
                        <div>
                          <p className="text-sm font-semibold">{s.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{s.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Android Instructions */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#3ddc84" }}>
                      <span className="text-white text-sm font-bold">A</span>
                    </div>
                    <h3 className="font-serif font-bold text-base">Android Instructions (Chrome)</h3>
                  </div>
                  <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                    {[
                      {
                        step: 1,
                        title: "Open Chrome",
                        detail: "On Android, use Google Chrome for the best experience. Open the Chrome browser on your phone.",
                      },
                      {
                        step: 2,
                        title: "Go to the NFGN website",
                        detail: "Type your NFGN web address into Chrome's address bar and open it. Wait for the page to fully load.",
                      },
                      {
                        step: 3,
                        title: "Tap the three dots (⋮)",
                        detail: "In the top right corner of Chrome, tap the three vertical dots to open the browser menu.",
                      },
                      {
                        step: 4,
                        title: '"Add to Home screen" or "Install App"',
                        detail: 'In the menu, look for "Add to Home screen" or "Install App." Tap it. Some Android phones may show a banner at the bottom of the screen automatically — you can tap that too.',
                      },
                      {
                        step: 5,
                        title: "Confirm and install",
                        detail: 'A prompt will appear asking you to confirm. Tap "Add" or "Install." The app icon will be placed on your home screen.',
                      },
                      {
                        step: 6,
                        title: "Done — tap the icon to open",
                        detail: "Find the NFGN icon on your Android home screen and tap it. It will open full-screen just like a native app.",
                      },
                    ].map(s => (
                      <div key={s.step} className="flex gap-4 p-4 bg-white items-start">
                        <span className="h-7 w-7 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-black text-white mt-0.5"
                          style={{ background: "#3ddc84" }}>
                          {s.step}
                        </span>
                        <div>
                          <p className="text-sm font-semibold">{s.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{s.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tips */}
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-3">
                  <p className="text-sm font-bold flex items-center gap-2">
                    <Star className="h-4 w-4 text-primary fill-primary flex-shrink-0" />
                    Pro Tips
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {[
                      "Share these same steps with every new member you enroll — the easier it is to access the platform, the more consistently they'll use it.",
                      "Once you have a permanent domain name set up, share that link instead of the temporary development link so the icon on their phone stays current.",
                      "The platform works fully offline-friendly — once opened, most pages stay usable even with a slow connection.",
                      "Android users may also see a banner that says 'Add NFGN to Home Screen' appear automatically at the bottom of Chrome — that's a one-tap install.",
                    ].map((tip, i) => (
                      <li key={i} className="flex gap-2 items-start">
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Share reminder */}
                <div className="rounded-xl bg-[#0a0a0a] text-white p-5 space-y-2">
                  <p className="text-sm font-semibold" style={{ color: GOLD }}>Teach This to Your Team</p>
                  <p className="text-sm text-white/70 leading-relaxed">
                    A member who has the platform on their phone is a member who stays engaged. Make it a habit to walk every new
                    enrollment through this setup during your welcome call — it takes less than two minutes and dramatically
                    increases how often they log in and take action.
                  </p>
                </div>

              </CardContent>
            </Card>
          )}

          {/* ── POLICIES & TERMS ─────────────────────────────── */}
          {activeSection === "policies" && (
            <Card>
              <CardContent className="pt-6 space-y-8">
                <SectionHeader icon={FileText} title="NFGN Policies & Terms" subtitle="Know the rules — protect yourself and your team" />

                <p className="text-sm text-muted-foreground -mt-2 leading-relaxed">
                  Every Pro Member is expected to understand these policies. Knowing them protects your commissions, your members, and your reputation. When a customer or recruit asks a question about refunds, credits, or payouts — you should already know the answer.
                </p>

                {/* ── Membership Tiers ── */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-0.5 w-5 rounded" style={{ background: GOLD }} />
                    <h3 className="text-xs font-extrabold uppercase tracking-[0.2em]" style={{ color: GOLD }}>Membership Tiers</h3>
                  </div>
                  <div className="rounded-xl overflow-hidden border divide-y">
                    {[
                      { tier: "Retail Member (RM)", color: "#6b7280", desc: "Entry-level customers. Access to the store, referral link, and Book-A-Pro. No commissions." },
                      { tier: "Referring Retail Member (RRM)", color: GOLD, desc: "Automatically upgraded when their first referral signs up. Earns Dollar Credit ($-Credit) on qualifying purchases — not cash." },
                      { tier: "Unqualified Pro Member (UPM)", color: "#a78bfa", desc: "Earns commissions on Levels 1 & 2 only. Must reach 150 PCV to qualify for full Pro Membership." },
                      { tier: "Pro Member (PM)", color: GREEN, desc: "Full Business Suite. All 9 commission levels, CLB, MCB, BPP participation. Requires active PRP and 150 PCV rolling 30-day." },
                    ].map(({ tier, color, desc }) => (
                      <div key={tier} className="flex items-start gap-3 p-4 bg-card" style={{ borderLeft: `3px solid ${color}` }}>
                        <div className="flex-1">
                          <p className="text-sm font-bold mb-0.5" style={{ color }}>{tier}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl p-4" style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}30` }}>
                    <p className="text-xs font-bold" style={{ color: GOLD }}>Fastest Path to Full Pro Membership:</p>
                    <p className="text-xs text-muted-foreground mt-1">Purchase an NFGN Pro Member Registration Package (PRP). It already includes the required 150 PCV — one step, fully unlocked.</p>
                  </div>
                </div>

                {/* ── Dollar Credit ── */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-0.5 w-5 rounded" style={{ background: GREEN }} />
                    <h3 className="text-xs font-extrabold uppercase tracking-[0.2em]" style={{ color: GREEN }}>Dollar Credit ($-Credit) Policy</h3>
                    <Badge className="text-[10px] font-bold" style={{ background: GOLD, color: "#000" }}>RRM+</Badge>
                  </div>
                  <div className="rounded-xl border divide-y overflow-hidden">
                    {[
                      { label: "What it is", desc: "Store credit earned by Referring Retail Members on qualifying referral purchases. It is NOT cash and cannot be withdrawn unless the member upgrades to Pro Member or meets the cash-out threshold." },
                      { label: "7-Day Hold", desc: "$-Credit is placed in 'pending' status for 7 days from the referral purchase date. This aligns with the refund window on eligible products." },
                      { label: "30-Day Use Window", desc: "Once the 7-day hold clears, members have 30 days to use their $-Credit before it expires." },
                      { label: "Total Expiry", desc: "$-Credit expires 37 days from the original purchase date (7-day hold + 30-day use window). Expired credit is permanently forfeited — no exceptions." },
                      { label: "Refund Impact", desc: "If the purchase that generated $-Credit is refunded, the $-Credit is immediately revoked. If already spent, the member's balance goes negative and must be resolved on the next purchase." },
                    ].map(({ label, desc }) => (
                      <div key={label} className="p-3 bg-card space-y-0.5">
                        <p className="text-xs font-bold text-foreground">{label}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Cash-Out Policy ── */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-0.5 w-5 rounded" style={{ background: GOLD }} />
                    <h3 className="text-xs font-extrabold uppercase tracking-[0.2em]" style={{ color: GOLD }}>$-Credit Cash-Out Policy</h3>
                    <Badge className="text-[10px] font-bold" style={{ background: GOLD, color: "#000" }}>RRM+</Badge>
                  </div>
                  <div className="rounded-xl border p-4 space-y-2 bg-card">
                    <p className="text-xs text-muted-foreground leading-relaxed">Referring Retail Members can unlock cash-out ability by meeting this threshold:</p>
                    <ul className="space-y-1.5">
                      {[
                        "Refer a minimum of 9 Retail Members (not Pro Members) using your referral link.",
                        "Once the threshold is met, request a cash-out of your available $-Credit through the dashboard.",
                        "Cash-out requests are processed within 3–5 business days.",
                        "Paid via the payout method on file (bank transfer, PayPal, or CashApp).",
                        "NFGN reserves the right to verify referrals before approving cash-out requests.",
                      ].map(item => (
                        <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: GOLD }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl p-4" style={{ background: `${GREEN}10`, border: `1px solid ${GREEN}30` }}>
                    <p className="text-xs font-bold" style={{ color: GREEN }}>Pro Tip:</p>
                    <p className="text-xs text-muted-foreground mt-1">The fastest way to turn ALL future referral earnings into direct cash with no expiration is to upgrade to Pro Member. No 37-day clock, no $-Credit — real cash commissions across all 9 levels.</p>
                  </div>
                </div>

                {/* ── Refund Policy ── */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-0.5 w-5 rounded" style={{ background: "#ef4444" }} />
                    <h3 className="text-xs font-extrabold uppercase tracking-[0.2em] text-red-600">Refund & Return Policy</h3>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="rounded-xl border p-4 space-y-2" style={{ borderLeftColor: "#ef4444", borderLeftWidth: 3 }}>
                      <p className="text-sm font-bold text-red-600">No Refund Policy</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">Consumable, personal care, and digital products. All sales are final. No exceptions. Customers confirm at checkout: <em>"I understand and agree that this is a nonrefundable product."</em></p>
                    </div>
                    <div className="rounded-xl border p-4 space-y-2" style={{ borderLeftColor: GREEN, borderLeftWidth: 3 }}>
                      <p className="text-sm font-bold" style={{ color: GREEN }}>7-Day Return Policy</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">Selected products only. Must be <strong>unopened and unused</strong> in original packaging within 7 days. Customer pays return shipping unless product is defective.</p>
                    </div>
                  </div>
                  <div className="rounded-xl border p-4 space-y-1 bg-card">
                    <p className="text-xs font-bold text-foreground">Return Process</p>
                    <ul className="space-y-1.5 mt-1">
                      {[
                        "Contact NFGN support within the 7-day window with your order number and reason.",
                        "Approved returns are refunded to the original payment method within 5–7 business days.",
                        "Pro Member Registration Packages and digital training products are non-refundable once activated.",
                      ].map(item => (
                        <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: GREEN }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* ── Comp Plan Summary ── */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-0.5 w-5 rounded" style={{ background: "#3b82f6" }} />
                    <h3 className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-600">Compensation Plan Summary</h3>
                    <Badge className="text-[10px] font-bold bg-blue-600 text-white">Pro Member</Badge>
                  </div>
                  <div className="rounded-xl border divide-y overflow-hidden">
                    {[
                      { name: "Referral Commission (RC)", tier: "RRM+", desc: "Earned when a referred member makes a purchase. Paid as $-Credit to RRMs; as real cash to Pro Members." },
                      { name: "Product Sales Commission (PSC)", tier: "UPM+", desc: "Earned on product sales in your downline. Levels 1–2 for UPMs; all 9 levels for full Pro Members." },
                      { name: "Pro Registration Commission (PMRC)", tier: "UPM+", desc: "Earned when someone in your downline purchases a Pro Registration Package." },
                      { name: "Power Squad Bonuses (CLB + MCB)", tier: "PM Only", desc: "Core Leadership Bonus ($100 one-time) and Money Circulation Bonus ($200 recurring). Pro Members only." },
                      { name: "Bill Payer Program (BPP)", tier: "PM Only", desc: "Up to $3,085/month toward real bills. Phone, Medical, Utilities, Car, Rent/Mortgage. Pro Members only." },
                    ].map(({ name, tier, desc }) => (
                      <div key={name} className="p-3 flex gap-3 bg-card">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <p className="text-xs font-bold text-foreground">{name}</p>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: GOLD, color: "#000" }}>{tier}</span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── General Terms ── */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-0.5 w-5 rounded" style={{ background: "#94a3b8" }} />
                    <h3 className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-500">General Terms Every Member Must Know</h3>
                  </div>
                  <div className="rounded-xl border p-4 bg-card">
                    <ul className="space-y-2">
                      {[
                        "All members must be at least 18 years of age to participate in the compensation program.",
                        "NFGN reserves the right to modify, suspend, or terminate any membership for violation of these terms.",
                        "Income representations are not guarantees of earnings. Actual results depend on individual effort.",
                        "$-Credit and commissions are calculated in USD. International members are responsible for currency conversion fees.",
                        "NFGN is not responsible for delays caused by third-party payment processors.",
                        "These policies are subject to change. Members will be notified via their registered email address.",
                        "By participating in the NFGN program, you agree to be bound by all policies in their entirety.",
                      ].map(item => (
                        <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0 bg-slate-400" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    For the full Policies & Terms document, visit the{" "}
                    <a href="/policies" className="font-semibold underline" style={{ color: GOLD }}>NFGN Policies & Terms page</a>.
                  </p>
                </div>

              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
