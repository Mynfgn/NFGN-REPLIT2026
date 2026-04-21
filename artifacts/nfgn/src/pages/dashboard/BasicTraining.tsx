import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen, Target, DollarSign, Zap, TrendingUp, Award,
  Users, Star, ChevronDown, ChevronRight, CheckCircle2,
  Flame, Home, Clock, Lightbulb, MessageCircle, Leaf,
  BarChart3, Shield, Phone, Heart,
} from "lucide-react";

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
  { id: "comp-plan",        label: "Comp Plan",              icon: DollarSign },
  { id: "2500-plan",        label: "$2,500/Month Plan",      icon: Target },
  { id: "bpp",              label: "Bill Payer Program",     icon: Home },
  { id: "90-day",           label: "90-Day $3,500 Plan",    icon: TrendingUp },
  { id: "ignite",           label: "IGNITE Training",        icon: Flame },
  { id: "big-bonuses",      label: "Earn Big Bonuses",       icon: Award },
  { id: "additional",       label: "Additional Training",    icon: Lightbulb },
];

export function BasicTrainingPage() {
  const [activeSection, setActiveSection] = useState("getting-started");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0a0a0a] to-[#1a1a1a] rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: `${GOLD}30` }}>
            <BookOpen className="h-5 w-5" style={{ color: GOLD }} />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold">Basic Training</h1>
            <p className="text-white/60 text-sm">Your complete guide to building a thriving NFGN business</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge className="text-xs" style={{ background: `${GOLD}30`, color: GOLD, border: `1px solid ${GOLD}40` }}>Comp Plan</Badge>
          <Badge className="text-xs" style={{ background: `${GOLD}30`, color: GOLD, border: `1px solid ${GOLD}40` }}>$2,500/Month Strategy</Badge>
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
              </CardContent>
            </Card>
          )}

          {/* ── COMP PLAN ───────────────────────────────────── */}
          {activeSection === "comp-plan" && (
            <Card>
              <CardContent className="pt-6 space-y-6">
                <SectionHeader icon={DollarSign} title="The NFGN Compensation Plan" subtitle="6 ways to earn — understand every stream" />

                <p className="text-sm text-muted-foreground">NFGN pays you six distinct ways. Each layer is designed to reward both retail activity and team building. The more streams you activate, the more your income multiplies.</p>

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
                      <p className="text-xs text-muted-foreground">Earn a commission on your own personal product orders based on CV (Commission Value). The more you sell and purchase, the higher your PSC earnings.</p>
                      <div className="text-xs font-semibold text-green-700">Paid on: Your own product orders (CV-based)</div>
                    </CardContent>
                  </Card>

                  {/* PMRC */}
                  <Card className="border-purple-200 bg-purple-50/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-purple-800">
                        <Badge className="bg-purple-100 text-purple-800 border-purple-200">PMRC</Badge>
                        Pro Member Residual Commission
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-xs text-muted-foreground">As a Pro Member, you earn residual commissions on the purchases of Pro Members in your downline — up to multiple levels deep. This is the engine of your long-term passive income.</p>
                      <div className="text-xs font-semibold text-purple-700">Paid on: Downline Pro Member purchases (multi-level)</div>
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
                      <p className="text-xs text-muted-foreground">When you reach your monthly Personal Volume (PV) threshold as a Pro Member, you qualify for the Bill Payer Program — a bonus that helps offset your personal bills and living expenses. Think of it as NFGN paying your utilities, phone bill, or car payment.</p>
                      <div className="text-xs font-semibold text-teal-700">Paid: Monthly — when Pro Member PV threshold is met</div>
                    </CardContent>
                  </Card>
                </div>

                <div className="rounded-xl bg-[#0a0a0a] p-5 text-white">
                  <p className="text-sm font-semibold mb-3" style={{ color: GOLD }}>The Power of Stacking All 6 Streams</p>
                  <p className="text-xs text-white/70 leading-relaxed">Most people focus on one or two income streams. Top earners activate all six simultaneously. RC pays you immediately. PSC rewards your personal usage. PMRC creates passive monthly income. CLB gives you a fast-start bonus. MCB rewards your leadership. BPP keeps your personal bills covered. Together, they create a compounding, self-sustaining income that grows month after month.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── $2,500/MONTH PLAN ─────────────────────────── */}
          {activeSection === "2500-plan" && (
            <Card>
              <CardContent className="pt-6 space-y-6">
                <SectionHeader icon={Target} title="How to Earn $2,500/Month" subtitle="A realistic step-by-step product and sales plan" color={GREEN} />

                <div className="rounded-xl border p-5 space-y-4">
                  <p className="text-sm font-semibold">The $2,500/Month Formula</p>
                  <p className="text-sm text-muted-foreground">Achieving $2,500/month is built on three pillars working simultaneously: your personal retail sales, your referral commissions, and your growing team's PMRC.</p>

                  <div className="grid sm:grid-cols-3 gap-4 mt-4">
                    {[
                      { label: "Retail Sales", target: "$1,000", desc: "10 customers buying ~$100/mo each in product" },
                      { label: "Referral Commissions", target: "$500", desc: "RC from 20–30 active referred customers" },
                      { label: "Team PMRC", target: "$1,000", desc: "Residual from 5–8 Pro Members in your downline" },
                    ].map(p => (
                      <div key={p.label} className="rounded-lg border p-4 text-center bg-muted/30">
                        <p className="text-2xl font-bold" style={{ color: GOLD }}>{p.target}</p>
                        <p className="text-xs font-semibold mt-1">{p.label}</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{p.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="font-semibold text-sm">Month-by-Month Action Plan</p>
                  <div className="space-y-0 border-l-2 ml-4" style={{ borderColor: GREEN }}>
                    <Step number={1} title="Month 1 — Launch (Target: $500–$800)">
                      <p>Start with 5 personal retail customers. Use your own results as your pitch. Post 3× per week on social media. Enroll your first 2 Pro Members. Your RC + PSC should generate $500–$800 in your first month if you're consistent.</p>
                    </Step>
                    <Step number={2} title="Month 2 — Build (Target: $1,200–$1,800)">
                      <p>Grow your retail customer base to 10. Help your first 2 Pro Members each enroll their first customer. Your PMRC begins. Aim to enroll 1 more Pro Member. Use email and social templates from the Tools section daily.</p>
                    </Step>
                    <Step number={3} title="Month 3 — Scale (Target: $2,500+)">
                      <p>With 10+ retail customers, 5+ Pro Members, and those members starting to produce, your PMRC compounds. The CLB bonus may have already fired. MCB activates as your Level 2 team grows. You're now building passive income.</p>
                    </Step>
                  </div>
                </div>

                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-5 space-y-3">
                    <p className="text-sm font-semibold text-green-900">Daily Non-Negotiables to Hit $2,500</p>
                    <div className="space-y-2">
                      {[
                        "Share a product post or story on social media every single day",
                        "Send 3 personalized messages to prospects from your contact list",
                        "Follow up with at least 1 warm prospect from a previous conversation",
                        "Check your back office daily to track sales, commissions, and team activity",
                        "Help at least one of your Pro Members with their first sale or enrollment",
                      ].map((t, i) => <Tip key={i}>{t}</Tip>)}
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          )}

          {/* ── BILL PAYER PROGRAM ────────────────────────── */}
          {activeSection === "bpp" && (
            <Card>
              <CardContent className="pt-6 space-y-6">
                <SectionHeader icon={Home} title="Bill Payer Program (BPP)" subtitle="Let NFGN cover your personal bills every month" color="#2D6A4F" />

                <div className="rounded-xl bg-[#0a0a0a] p-5 text-white space-y-2">
                  <p className="text-sm font-semibold" style={{ color: GOLD }}>What Is the BPP?</p>
                  <p className="text-xs text-white/70 leading-relaxed">The Bill Payer Program is a monthly bonus paid to Pro Members who meet their Personal Volume (PV) requirement in a given month. Once your PV threshold is hit, NFGN credits your account with a BPP bonus — designed to cover real-world bills like utilities, phone plans, subscriptions, rent contributions, or car payments.</p>
                </div>

                <div className="space-y-4">
                  <p className="font-semibold text-sm">How to Qualify Every Month</p>
                  <div className="space-y-0 border-l-2 ml-4" style={{ borderColor: GOLD }}>
                    <Step number={1} title="Be an Active Pro Member">
                      <p>You must be enrolled as a Pro Member. If you haven't upgraded yet, do so from your Profile page — the Pro Member upgrade activates all bonus eligibility.</p>
                    </Step>
                    <Step number={2} title="Hit Your Monthly PV Threshold">
                      <p>PV (Personal Volume) is calculated from your own product orders each month. The CV value of each product contributes to your PV. Check the BPP page in your dashboard to see your current month's progress toward the threshold.</p>
                    </Step>
                    <Step number={3} title="Maintain Consistency">
                      <p>BPP is a monthly recurring bonus. Every month you qualify, you receive it. Set up a personal product routine — use the products yourself so your PV stays active and your results stay authentic.</p>
                    </Step>
                  </div>
                </div>

                <Card className="border-teal-200 bg-teal-50">
                  <CardContent className="pt-5 space-y-3">
                    <p className="text-sm font-semibold text-teal-900 flex items-center gap-2"><Shield className="h-4 w-4" /> BPP Strategy Tips</p>
                    <div className="space-y-2">
                      {[
                        "Order your personal supply early in the month — don't wait until the last few days",
                        "Track your PV progress from the Bill Payer Program page in your dashboard",
                        "If you're close to the threshold, placing one additional product order puts you over",
                        "The BPP bonus compounds with your other income streams — it's not a replacement, it's a supplement",
                        "Encourage your Pro Members to do the same — when their BPP activates, your MCB grows too",
                      ].map((t, i) => <Tip key={i}>{t}</Tip>)}
                    </div>
                  </CardContent>
                </Card>
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
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
