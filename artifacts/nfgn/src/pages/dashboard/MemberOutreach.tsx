import { useState } from "react";
import { useGetMe } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Users, Clock, Star, CheckCircle2, MessageCircle, Phone,
  Zap, Target, TrendingUp, Gift, BookOpen, Heart, Trophy,
  CalendarDays, Lightbulb, ArrowRight, Copy, ChevronDown, ChevronUp,
  AlertCircle, Flame, Share2, DollarSign,
} from "lucide-react";

type TabId = "72h" | "7d" | "14d" | "21d" | "30d" | "scripts" | "commissions";

const TABS: { id: TabId; label: string; short: string; icon: any; color: string }[] = [
  { id: "72h",        label: "First 72 Hours",   short: "72 Hrs",    icon: Zap,         color: "text-red-600"    },
  { id: "7d",         label: "Days 4–7",          short: "Wk 1",      icon: Star,        color: "text-amber-600"  },
  { id: "14d",        label: "Days 8–14",         short: "Wk 2",      icon: TrendingUp,  color: "text-green-600"  },
  { id: "21d",        label: "Days 15–21",        short: "Wk 3",      icon: Target,      color: "text-blue-600"   },
  { id: "30d",        label: "Days 22–30",        short: "Wk 4",      icon: Trophy,      color: "text-purple-600" },
  { id: "scripts",    label: "Welcome Scripts",   short: "Scripts",   icon: MessageCircle, color: "text-teal-600" },
  { id: "commissions", label: "First Commission", short: "$$",        icon: DollarSign,  color: "text-emerald-600" },
];

function CheckItem({ text, sub }: { text: string; sub?: string }) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium">{text}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{sub}</p>}
      </div>
    </div>
  );
}

function AlertItem({ text, sub }: { text: string; sub?: string }) {
  return (
    <div className="flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium">{text}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{sub}</p>}
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, color = "text-primary", children }: { title: string; icon?: any; color?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {Icon && <Icon className={`h-5 w-5 flex-shrink-0 ${color}`} />}
        <h3 className="font-serif font-bold text-base">{title}</h3>
      </div>
      <div className="space-y-2 pl-1">{children}</div>
    </div>
  );
}

function ScriptBox({ title, lines }: { title: string; lines: string[] }) {
  const [open, setOpen] = useState(false);
  const full = lines.join("\n\n");
  return (
    <Card className="border-primary/20 bg-primary/3">
      <CardHeader className="pb-2 pt-4 px-4">
        <button className="flex items-center justify-between w-full text-left" onClick={() => setOpen(o => !o)}>
          <p className="font-semibold text-sm flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-primary" /> {title}
          </p>
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
      </CardHeader>
      {open && (
        <CardContent className="pt-0 pb-4 px-4 space-y-3">
          <div className="bg-muted rounded-lg p-4 text-sm leading-relaxed space-y-2 font-mono text-muted-foreground">
            {lines.map((l, i) => <p key={i}>{l}</p>)}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs"
            onClick={() => navigator.clipboard.writeText(full)}
          >
            <Copy className="h-3 w-3" /> Copy Script
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

function Tab72h() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border-2 border-red-200 bg-red-50 p-5">
        <div className="flex items-center gap-3 mb-2">
          <Flame className="h-6 w-6 text-red-500" />
          <h3 className="font-serif font-bold text-lg text-red-800">The First 72 Hours Are Critical</h3>
        </div>
        <p className="text-sm text-red-700 leading-relaxed">
          Studies in network marketing show that <strong>new members who receive personal contact within 72 hours are 4x more likely to remain active</strong> after 90 days.
          This is your window to set the tone, build trust, and create lasting excitement. Don't let it pass.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-red-500" /> Within 1 Hour of Joining
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <CheckItem text="Send a personal welcome text or call" sub="Not a group message — something unique to them. Use their name and mention something specific from your conversation." />
            <CheckItem text="Confirm they received their login email" sub="Check that they can log in at nfgn.com. Walk them through it if needed." />
            <CheckItem text="Add them to your NFGN team group chat" sub="Group chats create community. It also exposes them to the excitement of others." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-orange-500" /> Hours 2–24
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <CheckItem text="Schedule their 15-minute Onboarding Call" sub="Video or phone call. This call is where you learn their 'why', explain the basics, and get them excited about their first 7 days." />
            <CheckItem text="Send the Getting Started Training link" sub="Dashboard → Basic Training → Getting Started. Encourage them to watch it before your onboarding call." />
            <CheckItem text="Make sure their profile is set up" sub="Help them add a photo, set up their referral code, and understand their affiliate link." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" /> Days 2–3
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <CheckItem text="Host your onboarding call" sub="Cover: their 'why', their income goal, their warm market list, and how to share their link. Keep it under 30 minutes — energy matters more than information overload." />
            <CheckItem text="Help them write a list of 20 names" sub="Friends, family, coworkers — anyone who might want better health, extra income, or both. Don't pre-judge. Write everyone down." />
            <CheckItem text="Help them make their first 3 invitations" sub="They don't have to know everything. Teach them: 'I just joined something I'm excited about. Can I show you what it is?'" />
            <CheckItem text="Introduce them to one other team leader" sub="A 3-way connection with someone already succeeding creates social proof and reduces their doubt." />
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" /> Sponsor Mindset
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <AlertItem text="Be a coach, not a babysitter" sub="Your job is to guide and inspire — not to do everything for them. Help them believe in themselves." />
            <AlertItem text="Match their energy" sub="If they're excited, amplify it. If they're scared, reassure them. Meet them where they are." />
            <AlertItem text="Ask questions more than you tell" sub="'What would you do with an extra $500 a month?' is more powerful than a 10-minute comp plan explanation." />
            <AlertItem text="Never let 72 hours go silent" sub="A new member who doesn't hear from their sponsor in 3 days starts to doubt their decision. Consistency builds belief." />
          </CardContent>
        </Card>
      </div>

      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm text-amber-800 font-medium flex items-center gap-2 mb-2">
            <Target className="h-4 w-4" /> Your 72-Hour Goal
          </p>
          <p className="text-sm text-amber-700 leading-relaxed">
            By the end of the first 3 days, your new member should: (1) be logged into their dashboard, (2) have watched Getting Started Training, (3) have their personal referral link ready to share, and (4) have 3 people on their list they plan to contact in the next 4 days.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Tab7d() {
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm leading-relaxed">
        The first week is about building momentum and establishing good habits. If they feel supported and see early activity, they become believers. This is when you turn a new sign-up into a real business builder.
      </p>

      <Section title="Daily Check-Ins (Days 4–7)" icon={Phone} color="text-amber-600">
        <CheckItem text="Send a quick daily check-in text" sub="Something encouraging: 'How's the list coming? Let me know if you have any questions!'" />
        <CheckItem text="Celebrate EVERY small win out loud" sub="They invited someone? Celebrate it. They shared their link? Celebrate it. Early wins build momentum." />
        <CheckItem text="Ask about roadblocks, not just results" sub="'What's the hardest part so far?' gives you the chance to solve real problems before they give up." />
      </Section>

      <Section title="Product Experience" icon={Gift} color="text-green-600">
        <CheckItem text="Confirm they received or ordered their product" sub="Their first personal experience is their most powerful story. They can't sell what they don't believe in." />
        <CheckItem text="Coach them to take notes as they use the products" sub="'Write down how you feel, what you notice, what changes.' That becomes their testimonial." />
        <CheckItem text="Share your own product story with them" sub="Authenticity is contagious. Your real experience gives them permission to share theirs." />
      </Section>

      <Section title="Building Their Referral Pipeline" icon={Share2} color="text-blue-600">
        <CheckItem text="Review their list of 20 and prioritize the top 5" sub="Who is most open to extra income? Who needs better health? Who is an influencer in their circle?" />
        <CheckItem text="Teach the 3-sentence invite" sub="'I found something that's helping people (with health / money / both). I think you'd like it. Can I show you real quick?'" />
        <CheckItem text="Role-play their invite conversation" sub="Practice removes fear. Do a mock invite with them as if you were the prospect. Let them practice saying it out loud." />
        <CheckItem text="Show them how to share their affiliate link" sub="Text, social media, email. Make it simple. One link = one conversation started." />
      </Section>

      <Section title="Training" icon={BookOpen} color="text-purple-600">
        <CheckItem text="Confirm they watched Getting Started Training" sub="If not, watch it together on a call. This is non-negotiable in week 1." />
        <CheckItem text="Introduce them to the Compensation Plan training" sub="Don't overwhelm them — just explain: referral commission (20%) and how to earn their first check in 7-14 days." />
        <CheckItem text="Share one motivational story from your upline or community" sub="Real success stories from real people in NFGN are the most powerful belief-builders available." />
      </Section>

      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm text-green-800 font-medium flex items-center gap-2 mb-2">
            <Trophy className="h-4 w-4" /> Week 1 Success Benchmark
          </p>
          <p className="text-sm text-green-700 leading-relaxed">
            By Day 7: They have contacted at least 5 people, have 1–2 interested prospects, and know their referral link. If they're hitting these marks, they're on track to earn their first commission within 14 days.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Tab14d() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border-2 border-green-200 bg-green-50 p-4">
        <p className="text-sm text-green-800 leading-relaxed">
          <strong>Week 2 is the tipping point.</strong> Members who earn their first commission in this window have an <strong>80%+ retention rate over 6 months</strong>.
          Your focus: get them to their first referral registration or product purchase — whatever earns them something real.
        </p>
      </div>

      <Section title="Commission Activation" icon={DollarSign} color="text-green-600">
        <CheckItem text="Review their pipeline together" sub="Who has shown interest? Who needs a follow-up? Who is ready to join or order?" />
        <CheckItem text="Help them do a 3-way call with their hottest prospect" sub="You handle the business explanation. They handle the relationship. This is the fastest path to their first commission." />
        <CheckItem text="Show them how the commission dashboard works" sub="Log into dashboard → User Earnings → Commissions. Seeing the commission system in action makes it real." />
        <CheckItem text="Set a specific 7-day income mini-goal" sub="'Let's get you $50–$100 in the next 7 days. That means getting 1 person to join or 2 people to order products.'" />
      </Section>

      <Section title="Expanding Their Network" icon={Users} color="text-blue-600">
        <CheckItem text="Ask: who has they NOT yet told about NFGN?" sub="Most people only reach out to 3-5 people from their list of 20. Gently push them to expand." />
        <CheckItem text="Teach social media posting" sub="One post per week about their NFGN journey. Not a sales pitch — a story. 'I just received my first wellness package and I'm obsessed.'" />
        <CheckItem text="Introduce them to their affiliate storefront" sub="Dashboard → Registration → View Storefront. Their personal page is a powerful tool they may not know exists." />
      </Section>

      <Section title="Training & Mindset" icon={BookOpen} color="text-purple-600">
        <CheckItem text="Encourage $3,500/Month Plan training" sub="Dashboard → Basic Training → $3,500/Month Plan. This shows a realistic roadmap to meaningful income." />
        <CheckItem text="Share a personal message about the power of consistency" sub="The difference between people who make money and people who don't is rarely talent. It's consistent daily action." />
        <CheckItem text="Ask them to listen to one success/personal development podcast this week" sub="Mindset is the foundation of everything. Recommend: 'Go-Giver', 'How to Win Friends', or any Jim Rohn content." />
      </Section>

      <Section title="Recognition & Retention" icon={Heart} color="text-red-600">
        <CheckItem text="Publicly recognize them in the team group chat" sub="'Day 10 update — [Name] has already reached out to 8 people. That's the spirit! 🔥'" />
        <CheckItem text="Send a handwritten or voice note message" sub="In a world of text, a personal voice note stands out. Tell them specifically what you appreciate about them." />
        <CheckItem text="Ask: what would make the next 14 days even better?" sub="Listening is leadership. Their answer tells you exactly how to support them going forward." />
      </Section>
    </div>
  );
}

function Tab21d() {
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm leading-relaxed">
        By week 3, patterns are forming — good and bad. This is when you double down on what's working and gently address what isn't. The goal: help them see the business working, even if imperfectly.
      </p>

      <Section title="Progress Review" icon={Target} color="text-blue-600">
        <CheckItem text="Schedule a 20-minute 'Two-Week Review' call" sub="Review: How many people contacted? How many interested? How many joined or ordered? What commission earned so far?" />
        <CheckItem text="Identify their #1 current obstacle" sub="Time? Confidence? Not sure what to say? Address it directly and help them solve it this week." />
        <CheckItem text="Update their income projection" sub="Based on their current pace, what could they earn in 60 days if they just increase their outreach by 20%? Show them the math." />
      </Section>

      <Section title="Pro Member Opportunity Introduction" icon={Star} color="text-amber-600">
        <CheckItem text="If they're not a Pro Member yet, this is the week to have the conversation" sub="'You've seen how this works now. Upgrading to Pro Member unlocks ALL the commission levels. Here's exactly what changes for you.'" />
        <CheckItem text="Show them the comp plan difference side by side" sub="Pro vs. Member commissions on a team of 10 people. The numbers are compelling. Let the math speak." />
        <CheckItem text="Share a story of someone who upgraded and immediately increased their earnings" sub="Stories beat statistics. Real examples from your team or upline are gold." />
      </Section>

      <Section title="Leadership Development" icon={TrendingUp} color="text-green-600">
        <CheckItem text="Ask who on their team might also be a great Pro Member candidate" sub="Help them think like a recruiter, not just a member. 'Who in your network is hungry for change right now?'" />
        <CheckItem text="Teach the 3-way call technique" sub="They no longer need you to do it for them — now they should be able to do one with their own contacts, looping you in as support." />
        <CheckItem text="Introduce the Power Squad Bonus concept" sub="When they understand that $200 bonuses are possible for every 9 Level 2 Pro Package sales, the business becomes very real." />
      </Section>

      <Section title="Consistency Habits" icon={CalendarDays} color="text-purple-600">
        <CheckItem text="Encourage a 'daily 3' habit" sub="Every day: (1) reach out to 1 new person, (2) follow up with 1 existing prospect, (3) share 1 piece of content. Simple. Repeatable. Powerful." />
        <CheckItem text="Discuss their 30-day review goals" sub="Set a specific target together: 'By Day 30, let's have you with 3 active referrals and your first commission posted to your wallet.'" />
      </Section>
    </div>
  );
}

function Tab30d() {
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm leading-relaxed">
        Day 30 is a milestone. It's the time to pause, celebrate, review, and re-commit. This conversation determines whether they become a long-term builder or fade away. Make it count.
      </p>

      <Section title="30-Day Celebration & Review" icon={Trophy} color="text-yellow-600">
        <CheckItem text="Host a 30-Day Check-In call or meeting" sub="This is a celebration, not a performance review. Start with wins — big and small." />
        <CheckItem text="Review key numbers together" sub="People contacted, prospects in pipeline, commissions earned, referrals registered. Celebrate every metric, even small ones." />
        <CheckItem text="Publicly recognize their first 30 days in the team community" sub="Public recognition is a powerful retention tool. It makes them feel seen and valued." />
      </Section>

      <Section title="Planning the Next 60 Days" icon={Target} color="text-blue-600">
        <CheckItem text="Set their 60-day and 90-day income targets together" sub="Don't let them go vague. Get specific: '$300/month by Day 60. $1,000/month by Day 90. What do we need to do to hit that?'" />
        <CheckItem text="Create a simple weekly action plan" sub="Weekly: 5 new contacts, 3 follow-ups, 1 social post, 1 training module. Block time on their calendar. Treat it like a job." />
        <CheckItem text="Discuss their Vision Goals & Dreams Sheet" sub="Revisit their 'why'. Have their goals changed? Have they expanded? Reconnecting to purpose is the most powerful motivator available." />
      </Section>

      <Section title="Team Building" icon={Users} color="text-green-600">
        <CheckItem text="Help them identify their first 'builder'" sub="Who among their referrals is showing the most hustle? Invest extra time in that person. Builders find builders." />
        <CheckItem text="Teach them the basics of sponsoring" sub="They are now a sponsor to someone else. Share this same outreach system with them. Duplication is the key to NFGN growth." />
        <CheckItem text="Invite them to participate in a team call or event" sub="Moving from 'member' to 'contributor' in the team culture accelerates identity shift. Let them share their 30-day story." />
      </Section>

      <Card className="border-2 border-primary bg-primary/5">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start gap-3">
            <Flame className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm mb-1">The Truth About 30 Days</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Most people in network marketing quit before Day 30. The ones who make it to Day 30 with a real sponsor, real product experience, and at least one commission are statistically far more likely to still be active at 6 months, 12 months, and beyond.
                <strong className="text-foreground"> Your consistency in these 30 days is the most valuable gift you can give your new member.</strong>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TabScripts() {
  return (
    <div className="space-y-5">
      <p className="text-muted-foreground text-sm">
        Use these scripts as starting points — customize them with your own voice. The goal is always to feel real, not rehearsed.
      </p>

      <ScriptBox title="Welcome Message (Text/DM — Hour 1)" lines={[
        "Hey [Name]! 🎉 I'm SO excited to have you in the NFGN family!",
        "Your account is all set — just log in at nfgn.com with the email you used. Your dashboard is where everything lives.",
        "I'm going to send you a couple quick links to get started. But first — how are you feeling? Excited? Nervous? Both? 😄",
        "I'm here for you every step of the way. This is going to be amazing. 🔥",
      ]} />

      <ScriptBox title="Onboarding Call Opener (Days 1–3)" lines={[
        "Hey [Name], I'm so glad we got to connect! Before I jump in, tell me — what was the thing that really made you say YES to joining NFGN?",
        "[Let them answer. Then say:]",
        "I love that. That's your 'why' — and that's the most powerful thing you have. When things get tough, that's what you come back to.",
        "Now let me show you two things: how to share your referral link, and how you earn your first commission. This is where people get excited...",
      ]} />

      <ScriptBox title="3-Way Call Introduction (Days 7–14)" lines={[
        "Hey [Prospect], my friend [Member Name] mentioned you and I wanted to jump on real quick. I'm [Your Name], one of the leaders in the NFGN community.",
        "[Member Name] is only [X days] in and already [SPECIFIC WIN — e.g., 'has 4 people interested']. I just wanted to say hi and answer any questions you might have.",
        "What have you heard about what we do so far? [Listen. Then share briefly.]",
        "We'd love to have you — and [Member Name] would be your personal sponsor. That means you'd have both of us in your corner from day one. What questions do you have?",
      ]} />

      <ScriptBox title="Follow-Up After No Response (Days 4–7)" lines={[
        "Hey [Name]! Just checking in — no pressure at all. I know life gets busy.",
        "I just wanted to share one quick thing: someone on our team just earned their first [commission amount] this week. Made me think of you.",
        "Still happy to answer any questions or do a quick walk-through whenever you're ready. I've got you. 💪",
      ]} />

      <ScriptBox title="30-Day Celebration Message" lines={[
        "THIRTY DAYS!!! 🎊 I can't believe it's already been a month since you joined the team.",
        "[Specific win — e.g., 'You've already connected with 15 people, brought in 2 members, and earned your first commission.'] That is NOT small — that is REAL.",
        "I want you to know I see how hard you've worked and how far you've come. The next 30 days are going to be even bigger.",
        "I'm proud of you. Now let's go get it. 🔥",
      ]} />
    </div>
  );
}

function TabCommissions() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border-2 border-green-200 bg-green-50 p-5">
        <div className="flex items-center gap-3 mb-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          <h3 className="font-serif font-bold text-green-800">Helping Your Member Earn in 7–14 Days</h3>
        </div>
        <p className="text-sm text-green-700 leading-relaxed">
          The fastest path to retention is a paycheck. Once your new member earns real money — even $20 — their belief transforms. Here's the fastest roadmap to their first commission.
        </p>
      </div>

      <Section title="Fastest Commission Paths" icon={Zap} color="text-amber-600">
        <CheckItem
          text="Referral Commission (20%) — Any Product Purchase"
          sub="Easiest path. If one person in their warm market buys any product through their referral link, they earn 20% immediately. Example: $50 product = $10 commission."
        />
        <CheckItem
          text="Referral Commission — New Member Signs Up & Orders"
          sub="If a referred friend signs up as a member and orders, that earns a referral commission on the purchase. No Pro Membership required."
        />
        <CheckItem
          text="Pro Member Commission — Pro Package Referral (12% + 22%)"
          sub="For Pro Members only: If they refer someone who buys a Pro Package, they earn 12% at Level 1 and 22% if purchased by a Level 2 member. This is the biggest earning opportunity."
        />
      </Section>

      <Section title="The 7-Day Commission Sprint" icon={Target} color="text-blue-600">
        <CheckItem text="Day 1–2: Identify their top 3 warm market prospects" sub="People most likely to try a product or join the business. Not the most popular — the most open." />
        <CheckItem text="Day 3–4: Send them a personal product recommendation" sub="'I'm using [product] and honestly I'm impressed. I think you'd love it.' Direct and personal beats any marketing copy." />
        <CheckItem text="Day 5–6: Follow up with an honest conversation" sub="Not a pitch — a genuine check-in. 'Did you get a chance to look at it? I'd love to hear your thoughts.'" />
        <CheckItem text="Day 7: Celebrate whatever happened" sub="If they earned — celebrate BIG. If they didn't — acknowledge the work, recalibrate the target, and keep going." />
      </Section>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "1 Product Sale", earn: "~$10–$30", note: "20% of any product order" },
          { label: "1 New Member + Order", earn: "~$10–$50", note: "20% referral on their purchase" },
          { label: "1 Pro Package Referral", earn: "~$60–$150+", note: "12% Level 1 Pro Package commission" },
        ].map(s => (
          <Card key={s.label} className="border-primary/30 text-center">
            <CardContent className="pt-5 pb-5">
              <p className="text-xs text-muted-foreground font-medium mb-1">{s.label}</p>
              <p className="text-3xl font-black text-primary mb-1">{s.earn}</p>
              <p className="text-xs text-muted-foreground">{s.note}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Section title="What to Say About Commissions" icon={MessageCircle} color="text-teal-600">
        <CheckItem text="Keep it real and humble" sub="Don't oversell. 'I earned $47 in my first two weeks — not life-changing yet, but I proved the system works. Now I'm building.' This is more believable than big income claims." />
        <CheckItem text="Show your actual dashboard if comfortable" sub="Seeing real commission numbers in a real dashboard removes all doubt. Ask your upline leader to share their screenshot if you're brand new." />
        <CheckItem text="Teach them to show their own dashboard as it grows" sub="Their growing numbers become their most powerful recruitment tool. 'Look — this just posted to my wallet.' That's a conversation-starter." />
      </Section>
    </div>
  );
}

const TAB_CONTENT: Record<TabId, React.FC> = {
  "72h": Tab72h,
  "7d": Tab7d,
  "14d": Tab14d,
  "21d": Tab21d,
  "30d": Tab30d,
  "scripts": TabScripts,
  "commissions": TabCommissions,
};

export function MemberOutreachPage() {
  const { data: me } = useGetMe();
  const [activeTab, setActiveTab] = useState<TabId>("72h");
  const TabContent = TAB_CONTENT[activeTab];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold flex items-center gap-3">
          <Users className="h-7 w-7 text-primary" />
          New Member Registration List
        </h1>
        <p className="text-muted-foreground mt-1">
          Your 30-day outreach guide for welcoming, supporting, and activating every new member on your team.
        </p>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Contact Within", value: "72 Hours", sub: "of joining", color: "border-red-200 bg-red-50" },
          { label: "Target First", value: "Commission", sub: "within 7–14 days", color: "border-green-200 bg-green-50" },
          { label: "Your Role Is", value: "Coach + Guide", sub: "not babysitter", color: "border-blue-200 bg-blue-50" },
          { label: "30-Day Goal", value: "3 Active", sub: "referrals + $50+", color: "border-purple-200 bg-purple-50" },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-3 text-center ${s.color}`}>
            <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
            <p className="text-lg font-black mt-0.5">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="flex flex-wrap gap-2">
        <Link href="/dashboard/genealogy">
          <Button variant="outline" size="sm" className="gap-2 text-xs">
            <Users className="h-3.5 w-3.5" /> View My Team (Genealogy)
          </Button>
        </Link>
        <Link href="/dashboard/register-new-pro">
          <Button variant="outline" size="sm" className="gap-2 text-xs">
            <ArrowRight className="h-3.5 w-3.5" /> Register A New Pro Member
          </Button>
        </Link>
        <Link href="/dashboard/tools/training?s=getting-started">
          <Button variant="outline" size="sm" className="gap-2 text-xs">
            <BookOpen className="h-3.5 w-3.5" /> Getting Started Training
          </Button>
        </Link>
      </div>

      {/* Tab Nav */}
      <div className="border rounded-xl overflow-hidden">
        <div className="flex overflow-x-auto bg-muted/40 border-b">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-3 text-xs font-semibold whitespace-nowrap transition-colors flex-shrink-0 border-b-2 ${
                  active
                    ? "border-primary text-primary bg-background"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${active ? "text-primary" : tab.color}`} />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.short}</span>
              </button>
            );
          })}
        </div>

        <div className="p-5 bg-background">
          <TabContent />
        </div>
      </div>

      {/* Bottom CTA */}
      <Card className="border-2 border-primary bg-primary/5">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <Heart className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="font-serif font-bold text-lg">Your Legacy Is Built One Member at a Time</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                The most successful people in NFGN aren't the ones who signed up the most people — they're the ones who supported their people the best.
                Your follow-through in these 30 days shapes not just their business, but their life. Show up for them the way you wish someone had shown up for you.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
