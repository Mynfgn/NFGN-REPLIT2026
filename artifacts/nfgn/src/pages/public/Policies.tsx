import { PublicLayout } from "@/components/layout/PublicLayout";
import { Badge } from "@/components/ui/badge";
import {
  FileText, ShieldCheck, CreditCard, RefreshCw,
  Users, Star, AlertTriangle, ChevronDown, ChevronRight,
} from "lucide-react";
import { useState } from "react";

const BRAND_GOLD = "#C9A84C";
const BRAND_BLACK = "#0a0a0a";
const BRAND_GREEN = "#2D6A4F";

function Section({
  id, icon: Icon, title, badge, children,
}: {
  id: string;
  icon: any;
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <section id={id} className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-6 py-5 text-left hover:bg-muted/20 transition-colors"
      >
        <div
          className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${BRAND_GOLD}18` }}
        >
          <Icon className="h-4 w-4" style={{ color: BRAND_GOLD }} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-serif font-bold text-primary">{title}</h2>
        </div>
        {badge && (
          <Badge
            className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5"
            style={{ background: BRAND_GOLD, color: "#000" }}
          >
            {badge}
          </Badge>
        )}
        {open
          ? <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          : <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        }
      </button>
      {open && (
        <div className="px-6 pb-6 prose prose-sm max-w-none text-muted-foreground space-y-3">
          {children}
        </div>
      )}
    </section>
  );
}

function Rule({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <span className="mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: BRAND_GOLD }} />
      <span>{children}</span>
    </li>
  );
}

export function PoliciesPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section
        className="py-16 text-white"
        style={{ background: `linear-gradient(135deg, ${BRAND_BLACK} 0%, #1a0f00 50%, ${BRAND_BLACK} 100%)` }}
      >
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-6"
            style={{ background: `${BRAND_GOLD}20`, border: `1px solid ${BRAND_GOLD}50`, color: BRAND_GOLD }}
          >
            <FileText className="h-4 w-4" />
            Policies &amp; Terms
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-black mb-4">
            NFGN{" "}
            <span style={{ color: BRAND_GOLD }}>Policies &amp; Terms</span>
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Everything you need to know about membership tiers, Dollar Credit, refund policies, and how our compensation program works.
          </p>
          <p className="text-white/40 text-xs mt-4">
            Last Updated: April 2026 &nbsp;·&nbsp; New Face Global Network (NFGN)
          </p>
        </div>
      </section>

      {/* Table of contents quick links */}
      <div className="bg-muted/30 border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-wrap gap-3 text-sm">
          {[
            { href: "#membership-tiers", label: "Membership Tiers" },
            { href: "#dollar-credit", label: "Dollar Credit ($-Credit)" },
            { href: "#refund-policy", label: "Refund Policy" },
            { href: "#cashout", label: "Cash-Out Policy" },
            { href: "#comp-plan", label: "Compensation Plan" },
            { href: "#general", label: "General Terms" },
          ].map(link => (
            <a
              key={link.href}
              href={link.href}
              className="font-medium transition-colors hover:underline"
              style={{ color: BRAND_GOLD }}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">

        {/* ── Membership Tiers ── */}
        <Section id="membership-tiers" icon={Users} title="Membership Tiers">
          <p>
            NFGN operates a progressive membership tier system. Each tier unlocks additional benefits, earning capabilities, and dashboard features.
          </p>

          <div className="space-y-4 not-prose">
            {[
              {
                tier: "Retail Member (RM)",
                color: "#6b7280",
                desc: "The entry-level membership. Retail Members are primarily customers who enjoy NFGN products and services.",
                perks: [
                  "Access to the NFGN online store",
                  "View orders, receipts, and purchase history",
                  "Access to discounts, specials, and promo codes",
                  "Personal affiliate/referral link and QR code",
                  "Ability to install the NFGN app",
                  "Book-A-Pro service access",
                ],
              },
              {
                tier: "Referring Retail Member (RRM)",
                color: BRAND_GOLD,
                desc: "Automatically upgraded from Retail Member the moment their first referral signs up using their affiliate link.",
                perks: [
                  "Everything included in Retail Member",
                  "Earns Dollar Credit ($-Credit) on qualifying referral purchases",
                  "$-Credit can be applied toward eligible NFGN products and services",
                  "Dashboard shows $-Credit balance, history, and year-to-date totals",
                  "Upgrade prompt: 'Turn Your Credit Into Cash — Become a Pro Member'",
                ],
              },
              {
                tier: "Unqualified Pro Member (UPM)",
                color: "#a78bfa",
                desc: "Automatically upgraded when a Referring Retail Member refers 9 Pro Members. This tier bridges the gap to full Pro Membership.",
                perks: [
                  "Everything included in Referring Retail Member",
                  "Earns referral commissions from Levels 1 & 2 only",
                  "Earns Product Sales commissions from Levels 1 & 2 only",
                  "Earns Pro Registration Sales commissions from Levels 1 & 2 only",
                  "Limited genealogy view (2 levels)",
                  "Access to NFGN Basic Training",
                  "Cannot participate in BPP, Core Leadership Bonuses, or Money Circulation Bonuses",
                  "Cannot earn commissions from Levels 3–9",
                  "Must achieve 150 PCV (Personal Commissionable Volume) to qualify for full Pro membership",
                ],
              },
              {
                tier: "Pro Member (PM)",
                color: BRAND_GREEN,
                desc: "Full membership obtained by purchasing an NFGN Pro Member Registration Package (which includes 150 PCV). Unlocks the complete Business Suite.",
                perks: [
                  "Full Pro Member Business Suite access",
                  "All commission levels (1–9)",
                  "Core Leadership Bonuses (CLB)",
                  "Money Circulation Bonuses (MCB)",
                  "Power Squad Bonuses",
                  "Bill Payer Program (BPP) participation",
                  "Full genealogy view",
                  "Complete NFGN training library",
                  "Ability to register new Pro Members",
                  "Cash-out referral commissions and past $-Credit",
                  "Priority payout processing",
                ],
              },
            ].map(({ tier, color, desc, perks }) => (
              <div key={tier} className="rounded-xl border p-4" style={{ borderLeftColor: color, borderLeftWidth: 3 }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm" style={{ color }}>{tier}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{desc}</p>
                <ul className="space-y-1">
                  {perks.map(p => <Rule key={p}>{p}</Rule>)}
                </ul>
              </div>
            ))}
          </div>

          <div className="rounded-xl p-4 not-prose" style={{ background: `${BRAND_GOLD}10`, border: `1px solid ${BRAND_GOLD}30` }}>
            <p className="text-sm font-semibold" style={{ color: BRAND_GOLD }}>
              Easiest Path to Full Pro Membership:
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Purchase an NFGN Pro Member Registration Package. This package already includes the required 150 PCV, making it the fastest and simplest way to unlock every Pro Member benefit in a single step. If you cannot purchase the registration package at this time, you may accumulate 150 PCV through product purchases or reach the Unqualified Pro Member threshold by referring 9 Pro Members.
            </p>
          </div>
        </Section>

        {/* ── Dollar Credit ── */}
        <Section id="dollar-credit" icon={CreditCard} title="Dollar Credit ($-Credit) Policy" badge="RRM+">
          <p>
            Dollar Credit — also referred to as <strong>$-Credit</strong> or <strong>DC</strong> — is a store-credit reward earned by Referring Retail Members (RRM) on qualifying referral purchases. It is <strong>not</strong> cash and cannot be withdrawn unless the member upgrades to Pro Member status or meets the cash-out threshold.
          </p>

          <h3 className="font-bold text-foreground text-sm mt-4 mb-2">How $-Credit Is Earned</h3>
          <ul className="space-y-1.5 not-prose">
            <Rule>A Referring Retail Member earns $-Credit when a referred member makes a qualifying purchase.</Rule>
            <Rule>$-Credit is calculated based on the applicable referral commission rate for the product purchased.</Rule>
            <Rule>Only products specifically approved by NFGN administration are eligible to generate $-Credit.</Rule>
          </ul>

          <h3 className="font-bold text-foreground text-sm mt-4 mb-2">Hold Period &amp; Expiration</h3>
          <ul className="space-y-1.5 not-prose">
            <Rule><strong>7-Day Hold:</strong> $-Credit is placed in "pending" status for 7 days from the date of the referral purchase. This hold aligns with the refund window on eligible products.</Rule>
            <Rule><strong>30-Day Use Window:</strong> Once the 7-day hold clears, members have 30 days to use their $-Credit before it expires.</Rule>
            <Rule><strong>Total Expiry:</strong> $-Credit expires 37 days from the original referral purchase date (7-day hold + 30-day use window).</Rule>
            <Rule>Expired $-Credit is permanently forfeited. NFGN will not reinstate expired credits under any circumstances.</Rule>
          </ul>

          <h3 className="font-bold text-foreground text-sm mt-4 mb-2">Redemption Rules</h3>
          <ul className="space-y-1.5 not-prose">
            <Rule>$-Credit can only be applied to products and services that are designated as "$-Credit Eligible" by NFGN administration.</Rule>
            <Rule>At checkout, available $-Credit is automatically applied first, reducing the amount owed. Example: $25 $-Credit on a $30 purchase = $5 due.</Rule>
            <Rule>Members must wait the full 7-day hold period before using their $-Credit.</Rule>
            <Rule>$-Credit cannot be combined with certain promotional discounts unless explicitly permitted.</Rule>
          </ul>

          <h3 className="font-bold text-foreground text-sm mt-4 mb-2">Refund Impact on $-Credit</h3>
          <ul className="space-y-1.5 not-prose">
            <Rule>If the purchase that generated $-Credit is refunded, the corresponding $-Credit will be immediately revoked and deducted from the member's balance.</Rule>
            <Rule>If $-Credit was already used toward a subsequent purchase and the original earning purchase is refunded, the $-Credit amount will be deducted from the member's wallet, potentially resulting in a negative balance that must be resolved on the next purchase.</Rule>
          </ul>

          <h3 className="font-bold text-foreground text-sm mt-4 mb-2">Year-to-Date Tracking</h3>
          <ul className="space-y-1.5 not-prose">
            <Rule>The dashboard always displays the total amount of $-Credit earned during the current calendar year for transparency and motivation.</Rule>
            <Rule>This figure represents gross $-Credit earned, not net available balance.</Rule>
          </ul>
        </Section>

        {/* ── Cash-Out Policy ── */}
        <Section id="cashout" icon={Star} title="$-Credit Cash-Out Policy" badge="RRM+">
          <p>
            Referring Retail Members can unlock the ability to convert their $-Credit into a cash payout by meeting the following threshold:
          </p>
          <ul className="space-y-1.5 not-prose mt-3">
            <Rule><strong>Threshold:</strong> Refer a minimum of <strong>9 Retail Members</strong> (not Pro Members) who sign up using your referral link.</Rule>
            <Rule>Once the threshold is met, members gain the option to request a cash-out of their available $-Credit balance through the dashboard.</Rule>
            <Rule>Cash-out requests are processed by NFGN administration within <strong>3–5 business days</strong>.</Rule>
            <Rule>Cash-out is paid via the payout method on file (bank transfer, PayPal, or CashApp).</Rule>
            <Rule>NFGN reserves the right to verify referrals before approving cash-out requests.</Rule>
          </ul>
          <div className="rounded-xl p-4 not-prose mt-3" style={{ background: `${BRAND_GOLD}10`, border: `1px solid ${BRAND_GOLD}30` }}>
            <p className="text-sm font-semibold" style={{ color: BRAND_GOLD }}>Pro Tip:</p>
            <p className="text-sm text-muted-foreground mt-1">
              The easiest way to turn ALL future referral earnings into direct cash — with no expiration — is to upgrade to Pro Member. As a Pro Member, you earn real cash commissions across all 9 levels, plus bonuses, BPP participation, and more.
            </p>
          </div>
        </Section>

        {/* ── Refund Policy ── */}
        <Section id="refund-policy" icon={RefreshCw} title="Refund &amp; Return Policy">
          <p>
            NFGN carries two types of refund policies depending on the product. The applicable policy is displayed on every product page and is confirmed by the purchaser at checkout.
          </p>

          <div className="space-y-4 not-prose mt-2">
            <div className="rounded-xl border p-4" style={{ borderLeftColor: "#ef4444", borderLeftWidth: 3 }}>
              <p className="font-bold text-sm text-red-600 mb-1">No Refund Policy</p>
              <p className="text-sm text-muted-foreground">
                Certain products — particularly consumable, personal care, and digital products — carry a strict <strong>No Refund</strong> policy. All sales are final. No exceptions.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                At checkout, purchasers must confirm: <em>"I understand and agree that this is a nonrefundable product. No exceptions."</em>
              </p>
            </div>
            <div className="rounded-xl border p-4" style={{ borderLeftColor: BRAND_GREEN, borderLeftWidth: 3 }}>
              <p className="font-bold text-sm mb-1" style={{ color: BRAND_GREEN }}>7-Day Return Policy</p>
              <p className="text-sm text-muted-foreground">
                Selected products qualify for return within <strong>7 days of purchase</strong>. Products must be <strong>unopened and unused</strong> in their original packaging. No exceptions.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                At checkout, purchasers must confirm: <em>"I understand and agree that I only have seven days to return this product unopened or unused. No exceptions."</em>
              </p>
            </div>
          </div>

          <h3 className="font-bold text-foreground text-sm mt-4 mb-2">Return Process</h3>
          <ul className="space-y-1.5 not-prose">
            <Rule>To initiate a return, contact NFGN customer support within the 7-day window with your order number and reason for return.</Rule>
            <Rule>Approved returns are refunded to the original payment method within 5–7 business days.</Rule>
            <Rule>Return shipping costs are the responsibility of the customer unless the return is due to a defective product.</Rule>
            <Rule>Pro Member Registration Packages and digital training products are <strong>non-refundable</strong> once activated.</Rule>
          </ul>
        </Section>

        {/* ── Compensation Plan Summary ── */}
        <Section id="comp-plan" icon={ShieldCheck} title="Compensation Plan Summary" badge="Pro Member">
          <p>
            The full NFGN Compensation Plan is available inside the Pro Member Business Suite dashboard. Below is a high-level summary for reference.
          </p>
          <div className="space-y-2 not-prose mt-2">
            {[
              { name: "Referral Commission (RC)", desc: "Earned when a referred member makes a purchase. Available to RRMs as $-Credit; available as cash to Pro Members.", tier: "RRM+" },
              { name: "Product Sales Commission (PSC)", desc: "Earned on product sales within your downline. Levels 1–2 for Unqualified Pro Members; all levels for full Pro Members.", tier: "UPM+" },
              { name: "Pro Registration Commission (PRC)", desc: "Earned when someone in your downline purchases a Pro Registration Package. Levels 1–2 for UPMs; all levels for PMs.", tier: "UPM+" },
              { name: "Multi-Level Retail Commission (MLRC)", desc: "Commission earned on retail product purchases across your multi-level downline.", tier: "PM Only" },
              { name: "Power Squad Bonuses (PSB)", desc: "Leadership bonuses including Core Leadership Bonus (CLB) and Money Circulation Bonus (MCB).", tier: "PM Only" },
              { name: "Bill Payer Program (BPP)", desc: "A unique NFGN program that allocates a portion of company sales volume toward members' monthly bills.", tier: "PM Only" },
            ].map(({ name, desc, tier }) => (
              <div key={name} className="flex gap-3 p-3 rounded-lg border bg-muted/20">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-bold">{name}</p>
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: BRAND_GOLD, color: "#000" }}
                    >
                      {tier}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Commission rates, volume requirements, and specific terms are detailed in the full Compensation Plan document available in the Pro Member dashboard.
          </p>
        </Section>

        {/* ── General Terms ── */}
        <Section id="general" icon={AlertTriangle} title="General Terms &amp; Conditions">
          <ul className="space-y-1.5 not-prose">
            <Rule>All members must be at least 18 years of age to participate in the NFGN compensation program.</Rule>
            <Rule>NFGN reserves the right to modify, suspend, or terminate any membership, compensation, or credit at its discretion for violation of these terms.</Rule>
            <Rule>Income representations made by NFGN members are not guarantees of earnings. Actual results depend on individual effort, market conditions, and adherence to program guidelines.</Rule>
            <Rule>$-Credit and commission calculations are performed in USD. International members are responsible for any currency conversion fees.</Rule>
            <Rule>NFGN is not responsible for any delays caused by third-party payment processors.</Rule>
            <Rule>These policies are subject to change. Members will be notified of material changes via their registered email address.</Rule>
            <Rule>By participating in the NFGN program, you agree to be bound by these policies in their entirety.</Rule>
          </ul>
          <p className="text-xs text-muted-foreground mt-4">
            For questions regarding these policies, please contact NFGN support through your member dashboard or at the Contact page.
          </p>
        </Section>

      </div>
    </PublicLayout>
  );
}
