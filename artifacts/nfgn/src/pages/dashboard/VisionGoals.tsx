import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useGetMe } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import {
  Star, Target, Flame, Trophy, DollarSign, Heart,
  Lightbulb, Zap, TrendingUp, CheckCircle2, Save,
  Loader2, RefreshCw, Quote, Sparkles,
} from "lucide-react";

const schema = z.object({
  myWhy: z.string().optional(),
  myVision: z.string().optional(),
  goal7day: z.string().optional(),
  goal14day: z.string().optional(),
  goal30day: z.string().optional(),
  goal90day: z.string().optional(),
  goal6month: z.string().optional(),
  goal12month: z.string().optional(),
  income7day: z.string().optional(),
  income14day: z.string().optional(),
  income30day: z.string().optional(),
  income90day: z.string().optional(),
  income6month: z.string().optional(),
  income12month: z.string().optional(),
  financialProblems: z.string().optional(),
  ultimateDream: z.string().optional(),
  confidenceStatement: z.string().optional(),
  accountability: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "The only limit to your impact is your imagination and commitment.", author: "Tony Robbins" },
  { text: "Your life does not get better by chance. It gets better by change.", author: "Jim Rohn" },
  { text: "Don't wish it were easier. Wish you were better.", author: "Jim Rohn" },
  { text: "The dream is free. The hustle is sold separately.", author: "Unknown" },
  { text: "You are one decision away from a totally different life.", author: "Mark Batterson" },
];

function StatCard({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div className="text-center rounded-xl border bg-card p-4">
      <p className="text-3xl font-black text-primary">{value}</p>
      <p className="text-sm font-semibold mt-0.5">{label}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function GoalRow({ period, activityField, incomeField, activityLabel, incomeLabel, control, color }: any) {
  return (
    <div className={`rounded-xl border-l-4 p-4 bg-card ${color}`}>
      <div className="flex items-center gap-2 mb-3">
        <Badge variant="outline" className="text-xs font-bold">{period}</Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField control={control} name={activityField} render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs font-semibold">{activityLabel}</FormLabel>
            <FormControl>
              <Textarea rows={2} placeholder="What will you do? Who will you reach? What will you achieve?" className="text-sm resize-none" {...field} value={field.value ?? ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={control} name={incomeField} render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs font-semibold">{incomeLabel}</FormLabel>
            <FormControl>
              <Input placeholder="e.g. $100, $500, $2,000..." className="text-sm" {...field} value={field.value ?? ""} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>
    </div>
  );
}

export function VisionGoalsPage() {
  const { data: me } = useGetMe();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      myWhy: "", myVision: "",
      goal7day: "", goal14day: "", goal30day: "", goal90day: "", goal6month: "", goal12month: "",
      income7day: "", income14day: "", income30day: "", income90day: "", income6month: "", income12month: "",
      financialProblems: "", ultimateDream: "", confidenceStatement: "", accountability: "",
    },
  });

  useEffect(() => {
    fetch("/api/vision-goals", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      .then(r => r.json())
      .then(data => {
        if (data && typeof data === "object" && !data.error) {
          form.reset({
            myWhy: data.myWhy ?? "",
            myVision: data.myVision ?? "",
            goal7day: data.goal7day ?? "",
            goal14day: data.goal14day ?? "",
            goal30day: data.goal30day ?? "",
            goal90day: data.goal90day ?? "",
            goal6month: data.goal6month ?? "",
            goal12month: data.goal12month ?? "",
            income7day: data.income7day ?? "",
            income14day: data.income14day ?? "",
            income30day: data.income30day ?? "",
            income90day: data.income90day ?? "",
            income6month: data.income6month ?? "",
            income12month: data.income12month ?? "",
            financialProblems: data.financialProblems ?? "",
            ultimateDream: data.ultimateDream ?? "",
            confidenceStatement: data.confidenceStatement ?? "",
            accountability: data.accountability ?? "",
          });
          if (data.updatedAt) setLastSaved(new Date(data.updatedAt));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function onSubmit(data: FormValues) {
    setSaving(true);
    try {
      const res = await fetch("/api/vision-goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      const result = await res.json();
      setLastSaved(new Date());
      toast({ title: "Saved!", description: "Your Vision Goals & Dreams Sheet has been saved." });
    } catch {
      toast({ variant: "destructive", title: "Save failed", description: "Please try again." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div
        className="rounded-2xl p-8 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #1a0f00 60%, #2D6A4F 100%)" }}
      >
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ background: "#C9A84C22", border: "2px solid #C9A84C" }}>
              <Star className="h-6 w-6" style={{ color: "#C9A84C" }} />
            </div>
            <div>
              <Badge className="mb-1 text-xs font-bold" style={{ background: "#C9A84C", color: "#0a0a0a" }}>Personal Development Tool</Badge>
              <h1 className="text-2xl font-serif font-bold">Vision, Goals & Dreams Sheet</h1>
            </div>
          </div>
          <p className="text-white/70 text-sm leading-relaxed max-w-2xl">
            This is your personal roadmap. The people who write down their goals are <strong className="text-white">42% more likely to achieve them</strong> than those who don't.
            Be honest. Be bold. Be specific. Your future self will thank you.
          </p>
          {lastSaved && (
            <p className="text-white/40 text-xs mt-3 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" /> Last saved {lastSaved.toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* Motivational Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard value="92%" label="Goal Achievement" sub="when written down" />
        <StatCard value="42%" label="More Likely" sub="to succeed with a plan" />
        <StatCard value="10x" label="Bigger Dreams" sub="create bigger action" />
        <StatCard value="100%" label="Your Potential" sub="is waiting to be claimed" />
      </div>

      {/* Inspirational Quote */}
      <Card className="border-primary/20 bg-primary/3">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start gap-3">
            <Quote className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-base font-serif font-medium italic">"{quote.text}"</p>
              <p className="text-sm text-muted-foreground mt-1">— {quote.author}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

          {/* Section 1: My Why */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Heart className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h2 className="text-xl font-serif font-bold">My "Why"</h2>
                <p className="text-xs text-muted-foreground">The most important question in your entire NFGN journey</p>
              </div>
            </div>

            <Card className="border-red-200">
              <CardContent className="pt-5 pb-5 space-y-4">
                <div className="bg-red-50 rounded-lg p-4 text-sm text-red-800 leading-relaxed">
                  <p className="font-semibold mb-2">Why does your "Why" matter?</p>
                  <p>Your "Why" is the emotional reason behind everything you do. When things get hard — and they will — your "Why" is the only thing powerful enough to keep you moving forward. It should make you feel something. If it doesn't, dig deeper.</p>
                  <p className="mt-2 font-medium">Ask yourself: If money were no object, what would I be doing with my life? What would change for my family if I had financial freedom? What am I tolerating right now that I refuse to tolerate forever?</p>
                </div>
                <FormField control={form.control} name="myWhy" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">My "Why" — The real reason I'm building this business:</FormLabel>
                    <FormControl>
                      <Textarea rows={5} placeholder="Be raw. Be honest. Be specific. Who are you doing this for? What changes when you succeed? What does your life look like when this works? What are you running from? What are you running toward?" className="resize-none" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </CardContent>
            </Card>
          </section>

          {/* Section 2: My Vision */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <h2 className="text-xl font-serif font-bold">My Vision</h2>
                <p className="text-xs text-muted-foreground">Paint a picture of your life 12 months from today</p>
              </div>
            </div>

            <Card className="border-purple-200">
              <CardContent className="pt-5 pb-5 space-y-4">
                <div className="bg-purple-50 rounded-lg p-4 text-sm text-purple-800 leading-relaxed">
                  <p className="font-semibold mb-1">Close your eyes and imagine…</p>
                  <p>It's exactly 12 months from today. Everything has gone right. You've done the work, been consistent, and built something real. What does your day look like? Where are you living? What are you driving? How does your bank account look? What do people say about you? What have you stopped worrying about?</p>
                </div>
                <FormField control={form.control} name="myVision" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">My Vision for 12 months from today:</FormLabel>
                    <FormControl>
                      <Textarea rows={5} placeholder="Write in present tense as if it's already happened. 'I am living in... My family is... I wake up every morning to... I no longer worry about... I now have the freedom to...'" className="resize-none" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </CardContent>
            </Card>
          </section>

          {/* Section 3: Financial Problems */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <DollarSign className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-xl font-serif font-bold">Financial Problems to Solve</h2>
                <p className="text-xs text-muted-foreground">Name them. Claim them. Eliminate them.</p>
              </div>
            </div>

            <Card className="border-amber-200">
              <CardContent className="pt-5 pb-5 space-y-4">
                <div className="bg-amber-50 rounded-lg p-4 text-sm text-amber-800 leading-relaxed">
                  <p className="font-semibold mb-1">Don't look away from this.</p>
                  <p>Most people never solve their financial problems because they never name them clearly. Write down the exact debts, bills, shortfalls, and financial stresses you want NFGN to help you eliminate. Specific numbers. Specific problems. This is your battle plan, and you can't win a battle you won't name.</p>
                </div>
                <FormField control={form.control} name="financialProblems" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Financial problems I'm committed to solving with NFGN:</FormLabel>
                    <FormControl>
                      <Textarea rows={5} placeholder="Example: '$1,200/month rent stress. $8,500 credit card debt. Car payment I can't consistently cover. Can't save for my kids' future. Living paycheck to paycheck. No emergency fund. Can't afford to travel or take time off.'" className="resize-none" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </CardContent>
            </Card>
          </section>

          {/* Section 4: Goals */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-serif font-bold">My Goals — By Time Period</h2>
                <p className="text-xs text-muted-foreground">Short-term goals create the foundation for long-term results</p>
              </div>
            </div>

            <div className="rounded-xl border-blue-200 border p-4 bg-blue-50 text-sm text-blue-800">
              <p className="font-semibold mb-1">Goal-setting rules that work:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Be <strong>specific</strong> — "Sign up 3 new members" beats "grow my team"</li>
                <li>Be <strong>realistic but ambitious</strong> — stretch goals drive stretch action</li>
                <li>Include both <strong>activity goals</strong> (what you'll do) and <strong>income goals</strong> (what you'll earn)</li>
                <li>Revisit and update these every 30 days</li>
              </ul>
            </div>

            <div className="space-y-3">
              <GoalRow
                period="7 Days"
                activityField="goal7day"
                incomeField="income7day"
                activityLabel="Activity Goal — What will you do in 7 days?"
                incomeLabel="Income Goal — What will you earn in 7 days?"
                control={form.control}
                color="border-l-red-400"
              />
              <GoalRow
                period="14 Days"
                activityField="goal14day"
                incomeField="income14day"
                activityLabel="Activity Goal — What will you do in 14 days?"
                incomeLabel="Income Goal — What will you earn in 14 days?"
                control={form.control}
                color="border-l-orange-400"
              />
              <GoalRow
                period="30 Days"
                activityField="goal30day"
                incomeField="income30day"
                activityLabel="Activity Goal — What will you do in 30 days?"
                incomeLabel="Income Goal — What will you earn in 30 days?"
                control={form.control}
                color="border-l-amber-400"
              />
              <GoalRow
                period="90 Days"
                activityField="goal90day"
                incomeField="income90day"
                activityLabel="Activity Goal — What will you accomplish in 90 days?"
                incomeLabel="Income Goal — What will you earn per month by Day 90?"
                control={form.control}
                color="border-l-green-400"
              />
              <GoalRow
                period="6 Months"
                activityField="goal6month"
                incomeField="income6month"
                activityLabel="Activity Goal — Where will your business be in 6 months?"
                incomeLabel="Income Goal — What will you earn per month at 6 months?"
                control={form.control}
                color="border-l-blue-400"
              />
              <GoalRow
                period="12 Months"
                activityField="goal12month"
                incomeField="income12month"
                activityLabel="Activity Goal — What will your team and business look like in 12 months?"
                incomeLabel="Income Goal — What will you earn per month at 12 months?"
                control={form.control}
                color="border-l-purple-400"
              />
            </div>
          </section>

          {/* Section 5: Ultimate Dream */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#C9A84C22" }}>
                <Trophy className="h-5 w-5" style={{ color: "#C9A84C" }} />
              </div>
              <div>
                <h2 className="text-xl font-serif font-bold">My Ultimate Dream</h2>
                <p className="text-xs text-muted-foreground">The big, beautiful, no-limits dream</p>
              </div>
            </div>

            <Card style={{ borderColor: "#C9A84C44" }}>
              <CardContent className="pt-5 pb-5 space-y-4">
                <div className="rounded-lg p-4 text-sm leading-relaxed" style={{ background: "#C9A84C11", color: "#7a5c1a" }}>
                  <p className="font-semibold mb-1">No limits. No "buts". No "realistically speaking".</p>
                  <p>
                    What is the one dream that feels almost too big to say out loud? The house, the freedom, the travel, the generational wealth, the nonprofit you want to start, the people you want to help?
                    Write it all. There is no ceiling in this box. The only thing that limits your dream is your willingness to claim it.
                  </p>
                  <p className="mt-2 font-medium" style={{ color: "#C9A84C" }}>
                    "The size of your dream determines the size of your action." — Unknown
                  </p>
                </div>
                <FormField control={form.control} name="ultimateDream" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">My Ultimate Dream — within the next 12 months and beyond:</FormLabel>
                    <FormControl>
                      <Textarea rows={6} placeholder="Write your biggest, boldest dream. What would your life look like if NFGN succeeded beyond your expectations? What would you do, have, give, and become? Where would you go? What legacy would you leave? Who would you help?" className="resize-none" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </CardContent>
            </Card>
          </section>

          {/* Section 6: Confidence + Accountability */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <Zap className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-serif font-bold">My Commitment Declaration</h2>
                <p className="text-xs text-muted-foreground">Words have power — especially when you mean them</p>
              </div>
            </div>

            <div className="rounded-xl border border-green-200 bg-green-50 p-5">
              <p className="text-sm text-green-800 leading-relaxed font-medium mb-3">The #1 predictor of success isn't talent, or timing, or connections. It's <em>commitment</em>.</p>
              <ul className="space-y-2 text-sm text-green-700">
                {[
                  "People who write affirmations and commitments are significantly more likely to follow through.",
                  "Your brain can't tell the difference between a vivid imagination and reality — that's why visualization works.",
                  "Accountability partners double success rates. Don't try to do this alone.",
                  "The best time to start was yesterday. The next best time is right now.",
                  "Every NFGN success story started with one decision: to begin and not quit.",
                ].map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="confidenceStatement" render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">My Personal Affirmation / Power Statement</FormLabel>
                  <p className="text-xs text-muted-foreground mb-2">Write something you'll say to yourself every morning. Make it bold, personal, and in the present tense.</p>
                  <FormControl>
                    <Textarea rows={5} placeholder="Example: 'I am a confident, consistent, and coachable business builder. I attract the right people at the right time. My income grows every month because I take daily action. I am becoming the leader my team deserves.'" className="resize-none" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="accountability" render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">My Accountability Partner & Commitment</FormLabel>
                  <p className="text-xs text-muted-foreground mb-2">Who will hold you accountable? What are you committing to do every day / every week?</p>
                  <FormControl>
                    <Textarea rows={5} placeholder="Example: 'My accountability partner is [Name]. I commit to: reaching out to 3 new people daily, attending all team calls, posting on social media 3x/week, and reviewing this sheet every Monday morning. I will report my numbers to my sponsor every Sunday.'" className="resize-none" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </section>

          {/* Save Button */}
          <div className="sticky bottom-4 z-10">
            <div className="bg-background/95 backdrop-blur border rounded-xl shadow-lg p-4 flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm font-semibold">Ready to save your Vision Sheet?</p>
                {lastSaved ? (
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Saved {lastSaved.toLocaleTimeString()}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-0.5">Your answers are stored privately in your account.</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
                  <RefreshCw className="h-3.5 w-3.5" /> Print
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="gap-2 font-bold"
                  style={{ background: "#C9A84C", color: "#0a0a0a" }}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? "Saving…" : "Save My Vision Sheet"}
                </Button>
              </div>
            </div>
          </div>

        </form>
      </Form>

      {/* Bottom Message */}
      <Card className="border-2" style={{ borderColor: "#C9A84C44", background: "linear-gradient(135deg, #0a0a0a, #1a0f00)" }}>
        <CardContent className="pt-6 pb-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ border: "2px solid #C9A84C", background: "#C9A84C22" }}>
              <Flame className="h-6 w-6" style={{ color: "#C9A84C" }} />
            </div>
            <div>
              <p className="font-serif font-bold text-lg text-white">A Note from Your NFGN Family</p>
              <p className="text-white/60 text-sm mt-2 leading-relaxed">
                You didn't join NFGN by accident. Something in you knew it was time for a change. This Vision Sheet is your first act of courage — taking your dream seriously enough to write it down.
                The road ahead will challenge you. There will be days when doubt whispers louder than your "Why." On those days, come back to this sheet. Read your words. Remember who you're doing this for.
                <strong className="text-white"> We believe in you — now it's time for you to believe in yourself.</strong>
              </p>
              <p className="text-sm font-bold mt-3" style={{ color: "#C9A84C" }}>— The New Face Global Network Team</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
