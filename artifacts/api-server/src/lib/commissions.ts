import { db, usersTable, commissionsTable, walletsTable, walletTransactionsTable, commissionRulesTable, ordersTable, orderItemsTable } from "@workspace/db";
import { eq, and, count, sum, inArray } from "drizzle-orm";
import { logger } from "./logger";

/**
 * ═══════════════════════════════════════════════════════
 *  NFGN Compensation Plan
 * ═══════════════════════════════════════════════════════
 *
 *  1. REFERRAL COMMISSION (type: "referral")
 *     ‣ WHO earns: ALL Members (any role) — the Personal Sponsor
 *     ‣ WHEN:      Their personally referred member makes ANY purchase
 *     ‣ RATE:      Configurable via admin (default 10%)
 *     ‣ NOTE:      Fires on EVERY single purchase by the referred member
 *
 *  2. SALES COMMISSION / PSC (type: "sales")
 *     ‣ WHO earns: Pro Members ONLY
 *     ‣ WHEN:      Regular (non-Pro-Package) product purchases by downline
 *     ‣ RATE:      Configurable per-level via admin (default L1 = 10%)
 *     ‣ NOTE:      Paid IN ADDITION to the Referral Commission on Level 1
 *
 *  3. PRO REGISTRATION COMMISSION / PMRC (type: "level")
 *     ‣ WHO earns: Pro Members ONLY
 *     ‣ WHEN:      A Pro Member Registration Package is purchased OR renewed
 *                  anywhere in the configured PMRC levels of their upline
 *     ‣ RATE:      Configurable per-level via admin (default L1=10%, L2=20%)
 *     ‣ NOTE:      Direct sponsor also earns Referral Commission on top
 *
 *  4. CLB — Core Leadership Bonus (type: "power_squad_bonus", level: 1)
 *     ‣ WHO earns: Pro Members ONLY
 *     ‣ WHEN:      ONE-TIME — when the first N (default 9) new PMRPs are purchased
 *                  on the sponsor's Level 1, within the sponsor's first 90 days
 *                  as a Pro Member. Never awarded again after that.
 *     ‣ AMOUNT:    Configurable via admin (default $200)
 *     ‣ QUALIFY:   Must be Pro Member; sponsor must be within 90-day CLB window
 *
 *  5. MCB — Money Circulation Bonus (type: "power_squad_bonus", level: 2)
 *     ‣ WHO earns: Qualifying Upline Sponsor — a Pro Member on Level 2 who has
 *                  at least N active Level 1 Pro Members (Core Leadership Group)
 *     ‣ WHEN:      RECURRING — every N (default 9) PMRP purchases on Level 2.
 *                  Fires at 9, 18, 27, 36… purchases each month.
 *     ‣ AMOUNT:    Configurable via admin (default $200)
 *     ‣ NOTE:      Counts all Level 2 PMRP purchases (initial + renewals)
 * ═══════════════════════════════════════════════════════
 */

const DEFAULT_REFERRAL_RATE = 10;
const DEFAULT_PRC_LEVELS = [
  { level: 1, rate: 10 },
  { level: 2, rate: 20 },
];
const DEFAULT_SALES_LEVELS = [
  { level: 1, rate: 10 },
];

interface LevelRate {
  level: number;
  rate: number;
}

interface CompensationRules {
  referralRate: number;
  referralRateMode: "global" | "per_product";
  prcLevels: LevelRate[];
  salesLevels: LevelRate[];
  // MCB settings
  powerBonusEnabled: boolean;
  powerBonusAmount: number;
  powerBonusTrigger: number;
  // CLB settings
  clbEnabled: boolean;
  clbAmount: number;
  clbTrigger: number;
  clbWindowDays: number;
  // UPM — Qualifying CV: minimum PCV for a Pro Member to count as "active" toward CLB/MCB/BPP
  qualifyingCv: number;
}

async function loadRules(): Promise<CompensationRules> {
  const [rules] = await db.select().from(commissionRulesTable).limit(1);
  return {
    referralRate: parseFloat(rules?.referralRate ?? String(DEFAULT_REFERRAL_RATE)),
    referralRateMode: (rules?.referralRateMode as "global" | "per_product") ?? "global",
    prcLevels: (rules?.levels as LevelRate[] | null) ?? DEFAULT_PRC_LEVELS,
    salesLevels: (rules?.salesLevels as LevelRate[] | null) ?? DEFAULT_SALES_LEVELS,
    powerBonusEnabled: rules?.powerBonusEnabled ?? true,
    powerBonusAmount: parseFloat(rules?.powerBonusAmount ?? "200"),
    powerBonusTrigger: rules?.powerBonusTrigger ?? 7,
    clbEnabled: rules?.clbEnabled ?? true,
    clbAmount: parseFloat(rules?.clbAmount ?? "100"),
    clbTrigger: rules?.clbTrigger ?? 7,
    clbWindowDays: rules?.clbWindowDays ?? 90,
    qualifyingCv: rules?.qualifyingCv ?? 150,
  };
}

async function recordCommission(
  userId: number,
  fromUserId: number,
  orderId: number,
  orderNumber: string,
  level: number,
  rate: number,
  saleAmount: number,
  type: string,
): Promise<void> {
  const commissionAmount = parseFloat(((saleAmount * rate) / 100).toFixed(2));

  await db.insert(commissionsTable).values({
    userId,
    fromUserId,
    orderId,
    orderNumber,
    level,
    rate: String(rate),
    saleAmount: String(saleAmount),
    commissionAmount: String(commissionAmount),
    status: "pending",
    type,
  });

  const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.userId, userId));
  if (!wallet) return;

  const newPending = parseFloat((parseFloat(wallet.pendingBalance) + commissionAmount).toFixed(2));
  const newTotalEarned = parseFloat((parseFloat(wallet.totalEarned) + commissionAmount).toFixed(2));

  await db.update(walletsTable).set({
    pendingBalance: String(newPending),
    totalEarned: String(newTotalEarned),
  }).where(eq(walletsTable.userId, userId));

  const typeLabel = type === "referral"
    ? "Referral Commission"
    : type === "level"
    ? `Pro Member Registration Commission (PMRC) — Level ${level}`
    : `Product Sales Commission (PSC) — Level ${level}`;

  await db.insert(walletTransactionsTable).values({
    walletId: wallet.id,
    type: "commission_pending",
    amount: String(commissionAmount),
    balance: String(parseFloat(wallet.balance) + newPending),
    description: `${typeLabel} from order #${orderNumber}`,
    reference: orderNumber,
  });
}

async function getSponsor(userId: number): Promise<typeof usersTable.$inferSelect | null> {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user?.sponsorId) return null;
  const [sponsor] = await db.select().from(usersTable).where(eq(usersTable.id, user.sponsorId));
  return sponsor ?? null;
}

/**
 * Count Level 1 Pro Members who are "qualified" — i.e., have cumulative PCV ≥ qualifyingCv.
 * Only qualified (active) Pro Members count toward CLB, MCB, and BPP thresholds.
 * Pro Members below the CV threshold are Unqualified Pro Members (UPM).
 */
async function countQualifiedL1Members(sponsorId: number, qualifyingCv: number): Promise<number> {
  // Get all L1 Pro Members
  const l1Members = await db.select({ id: usersTable.id })
    .from(usersTable)
    .where(and(eq(usersTable.sponsorId, sponsorId), eq(usersTable.isProMember, true)));

  if (l1Members.length === 0) return 0;

  const memberIds = l1Members.map(m => m.id);

  // For each member, get their orders
  const memberOrders = await db.select({ id: ordersTable.id, userId: ordersTable.userId })
    .from(ordersTable)
    .where(inArray(ordersTable.userId, memberIds));

  if (memberOrders.length === 0) return 0;

  // Sum CV per member
  const cvPerMember: Record<number, number> = {};
  for (const id of memberIds) cvPerMember[id] = 0;

  const orderIds = memberOrders.map(o => o.id);
  const cvRows = await db.select({ orderId: orderItemsTable.orderId, cvTotal: sum(orderItemsTable.cvTotal) })
    .from(orderItemsTable)
    .where(inArray(orderItemsTable.orderId, orderIds))
    .groupBy(orderItemsTable.orderId);

  // Map order → user
  const orderUserMap: Record<number, number> = {};
  for (const o of memberOrders) orderUserMap[o.id] = o.userId;

  for (const row of cvRows) {
    const uid = orderUserMap[row.orderId];
    if (uid !== undefined) cvPerMember[uid] = (cvPerMember[uid] ?? 0) + Number(row.cvTotal ?? 0);
  }

  return Object.values(cvPerMember).filter(cv => cv >= qualifyingCv).length;
}

/**
 * Walk up the upline tree and return the first N sponsors in order.
 * Returns an array of [Level1Sponsor, Level2Sponsor, ...] up to `maxLevels`.
 */
async function getUplineChain(
  buyerId: number,
  maxLevels: number,
): Promise<Array<typeof usersTable.$inferSelect>> {
  const chain: Array<typeof usersTable.$inferSelect> = [];
  let currentId = buyerId;

  for (let i = 0; i < maxLevels; i++) {
    const sponsor = await getSponsor(currentId);
    if (!sponsor) break;
    chain.push(sponsor);
    currentId = sponsor.id;
  }

  return chain;
}

/**
 * ═══════════════════════════════════════════════════════
 *  CLB — Core Leadership Bonus (ONE-TIME)
 * ═══════════════════════════════════════════════════════
 *
 *  Awards the CLB exactly ONCE to a qualifying Pro Member sponsor when
 *  their cumulative Level 1 PMRC count reaches the trigger (default 9).
 *
 *  Qualification:
 *   1. clbEnabled must be true
 *   2. Sponsor must be a Pro Member
 *   3. Sponsor's `proMemberSince` must be within the CLB window (default 90 days)
 *   4. Sponsor must NOT have already received a CLB (count of existing CLB records == 0)
 *   5. Sponsor's Level 1 PMRC count must equal exactly the trigger (not a multiple)
 */
async function awardCLB(
  sponsor: typeof usersTable.$inferSelect,
  orderId: number,
  orderNumber: string,
  rules: CompensationRules,
): Promise<void> {
  if (!rules.clbEnabled) return;
  if (!sponsor.isProMember) return;

  // Check 90-day window from proMemberSince
  if (!sponsor.proMemberSince) return;
  const windowMs = rules.clbWindowDays * 24 * 60 * 60 * 1000;
  const elapsedMs = Date.now() - new Date(sponsor.proMemberSince).getTime();
  if (elapsedMs > windowMs) {
    logger.info({ userId: sponsor.id, elapsedDays: Math.floor(elapsedMs / 86400000), window: rules.clbWindowDays },
      "CLB not awarded — Pro Member is outside the CLB qualification window");
    return;
  }

  // Check if CLB was already awarded (one-time only)
  const [{ existingClb }] = await db
    .select({ existingClb: count() })
    .from(commissionsTable)
    .where(and(
      eq(commissionsTable.userId, sponsor.id),
      eq(commissionsTable.type, "power_squad_bonus"),
      eq(commissionsTable.level, 1),
    ));

  if (Number(existingClb) > 0) {
    logger.info({ userId: sponsor.id }, "CLB already awarded — one-time bonus");
    return;
  }

  // Count qualified Level 1 Pro Members (PCV ≥ qualifyingCv) — only these count toward CLB
  const qualifiedL1Count = await countQualifiedL1Members(sponsor.id, rules.qualifyingCv);

  // CLB fires when qualified L1 count first reaches the trigger
  if (qualifiedL1Count < rules.clbTrigger) {
    logger.info(
      { userId: sponsor.id, qualifiedL1Count, required: rules.clbTrigger, qualifyingCv: rules.qualifyingCv },
      "CLB not awarded — insufficient qualified Level 1 Pro Members (some may be UPM)",
    );
    return;
  }

  // Award CLB
  await db.insert(commissionsTable).values({
    userId: sponsor.id,
    fromUserId: sponsor.id,
    orderId,
    orderNumber,
    level: 1,
    rate: "0",
    saleAmount: "0",
    commissionAmount: String(rules.clbAmount),
    status: "approved",
    type: "power_squad_bonus",
    notes: `CLB (Core Leadership Bonus) — ONE-TIME — ${qualifiedL1Count} qualified Level 1 Pro Members (≥${rules.qualifyingCv} PCV each) within ${rules.clbWindowDays}-day window. Award: $${rules.clbAmount}`,
  });

  const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.userId, sponsor.id));
  if (!wallet) return;

  const newBalance = parseFloat((parseFloat(wallet.balance) + rules.clbAmount).toFixed(2));
  const newTotalEarned = parseFloat((parseFloat(wallet.totalEarned) + rules.clbAmount).toFixed(2));

  await db.update(walletsTable).set({
    balance: String(newBalance),
    totalEarned: String(newTotalEarned),
  }).where(eq(walletsTable.userId, sponsor.id));

  await db.insert(walletTransactionsTable).values({
    walletId: wallet.id,
    type: "commission_credit",
    amount: String(rules.clbAmount),
    balance: String(newBalance),
    description: `CLB (Core Leadership Bonus) — ONE-TIME — $${rules.clbAmount} (${total} Level 1 PMRPs)`,
    reference: orderNumber,
  });

  logger.info({ userId: sponsor.id, total, clbAmount: rules.clbAmount }, "CLB (Core Leadership Bonus) awarded — one-time");
}

/**
 * ═══════════════════════════════════════════════════════
 *  MCB — Money Circulation Bonus (RECURRING)
 * ═══════════════════════════════════════════════════════
 *
 *  Awards an MCB to the Qualifying Upline Sponsor every time their
 *  cumulative Level 2 PMRC count reaches a new multiple of the trigger.
 *
 *  "Qualifying Upline Sponsor" = the Level 2 upline Pro Member who has
 *  at least N (default 9) active Level 1 Pro Members (Core Leadership Group).
 *  This is the active Pro Member two levels above the buyer in the genealogy.
 *
 *  Qualification:
 *   1. powerBonusEnabled must be true
 *   2. Sponsor must be a Pro Member
 *   3. Sponsor's Level 2 PMRC count must be > 0 AND a multiple of the trigger
 *   4. Sponsor must have at least N personally sponsored active Level 1 Pro Members
 */
async function awardMCB(
  sponsor: typeof usersTable.$inferSelect,
  orderId: number,
  orderNumber: string,
  rules: CompensationRules,
): Promise<void> {
  if (!rules.powerBonusEnabled) return;
  if (!sponsor.isProMember) return;

  // Count cumulative Level 2 PMRC commissions (initial + renewals)
  const [{ pmrcCount }] = await db
    .select({ pmrcCount: count() })
    .from(commissionsTable)
    .where(and(
      eq(commissionsTable.userId, sponsor.id),
      eq(commissionsTable.level, 2),
      eq(commissionsTable.type, "level"),
    ));

  const total = Number(pmrcCount);
  if (total === 0 || total % rules.powerBonusTrigger !== 0) return;

  // MCB qualification: must have at least N qualified Level 1 Pro Members (PCV ≥ qualifyingCv)
  const qualifiedL1Count = await countQualifiedL1Members(sponsor.id, rules.qualifyingCv);

  if (qualifiedL1Count < rules.powerBonusTrigger) {
    logger.info(
      { userId: sponsor.id, total, qualifiedL1Count, required: rules.powerBonusTrigger, qualifyingCv: rules.qualifyingCv },
      "MCB not awarded — insufficient qualified Level 1 Pro Members (Core Leadership Group); some may be UPM",
    );
    return;
  }

  const bonusNum = total / rules.powerBonusTrigger;

  await db.insert(commissionsTable).values({
    userId: sponsor.id,
    fromUserId: sponsor.id,
    orderId,
    orderNumber,
    level: 2,
    rate: "0",
    saleAmount: "0",
    commissionAmount: String(rules.powerBonusAmount),
    status: "approved",
    type: "power_squad_bonus",
    notes: `MCB (Money Circulation Bonus) #${bonusNum} — RECURRING — ${total} Level 2 PMRP purchases/renewals (every ${rules.powerBonusTrigger} = $${rules.powerBonusAmount}). Sponsor has ${qualifiedL1Count} qualified L1 Pro Members (≥${rules.qualifyingCv} PCV each).`,
  });

  const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.userId, sponsor.id));
  if (!wallet) return;

  const newBalance = parseFloat((parseFloat(wallet.balance) + rules.powerBonusAmount).toFixed(2));
  const newTotalEarned = parseFloat((parseFloat(wallet.totalEarned) + rules.powerBonusAmount).toFixed(2));

  await db.update(walletsTable).set({
    balance: String(newBalance),
    totalEarned: String(newTotalEarned),
  }).where(eq(walletsTable.userId, sponsor.id));

  await db.insert(walletTransactionsTable).values({
    walletId: wallet.id,
    type: "commission_credit",
    amount: String(rules.powerBonusAmount),
    balance: String(newBalance),
    description: `MCB (Money Circulation Bonus) #${bonusNum} — RECURRING — $${rules.powerBonusAmount} (${total} Level 2 PMRP purchases/renewals)`,
    reference: orderNumber,
  });

  logger.info({ userId: sponsor.id, total, bonusNum, powerBonusAmount: rules.powerBonusAmount }, "MCB (Money Circulation Bonus) awarded — recurring");
}

export interface OrderItemForCommission {
  price: string;
  quantity: number;
  commissionRate: string;
}

/**
 * Process all commissions for a completed order.
 *
 * Commission flow:
 *  - REFERRAL: Personal sponsor (Level 1) earns on EVERY purchase, regardless of role.
 *  - PSC:      Pro Member sponsors earn across all configured Sales levels on regular purchases.
 *  - PMRC:     Pro Member sponsors earn across all configured PRC levels on Pro Package purchases.
 *  - CLB:      One-time bonus to Level 1 PMRC earner when their first N PMRPs are reached
 *              within the 90-day CLB qualification window.
 *  - MCB:      Recurring bonus to Level 2 PMRC earner (Qualifying Upline Sponsor) at every
 *              multiple of N Level 2 PMRP purchases.
 *
 * @param orderId             DB order ID
 * @param orderNumber         Human-readable order number
 * @param saleAmount          Total order amount (after discount)
 * @param buyerId             User who placed the order
 * @param containsProPackage  True when the order includes a Pro Member Registration Package
 * @param orderItems          Line items with per-product commission rates (used in per_product mode)
 */
export async function processCommissions(
  orderId: number,
  orderNumber: string,
  saleAmount: number,
  buyerId: number,
  containsProPackage = false,
  orderItems: OrderItemForCommission[] = [],
): Promise<void> {
  try {
    const rules = await loadRules();

    const maxLevels = Math.max(
      rules.prcLevels.length,
      rules.salesLevels.length,
      1,
    );

    const uplineChain = await getUplineChain(buyerId, maxLevels);
    if (uplineChain.length === 0) return;

    const directSponsor = uplineChain[0];

    // ── 1. REFERRAL COMMISSION ─────────────────────────────────────────────
    //    The Personal Sponsor (direct/Level 1 sponsor) earns a Referral Commission
    //    on EVERY single purchase made by the member they personally referred.
    //    This fires regardless of the sponsor's membership type.
    //
    //    In "global" mode: apply the single platform rate to the full order total.
    //    In "per_product" mode: compute the referral commission per line item using
    //    each product's individual commission rate, then sum the results.
    if (rules.referralRateMode === "per_product" && orderItems.length > 0) {
      // Per-product: fire one RC record per line, using the product's own rate.
      // We use a weighted effective rate so a single commission record is created.
      let totalReferralCommission = 0;
      for (const item of orderItems) {
        const lineTotal = parseFloat(item.price) * item.quantity;
        const rate = parseFloat(item.commissionRate) || 0;
        totalReferralCommission += parseFloat(((lineTotal * rate) / 100).toFixed(2));
      }
      if (saleAmount > 0 && totalReferralCommission > 0) {
        const effectiveRate = parseFloat(((totalReferralCommission / saleAmount) * 100).toFixed(4));
        await recordCommission(
          directSponsor.id,
          buyerId,
          orderId,
          orderNumber,
          1,
          effectiveRate,
          saleAmount,
          "referral",
        );
      }
    } else {
      // Global mode: single flat rate applied to the full order total.
      await recordCommission(
        directSponsor.id,
        buyerId,
        orderId,
        orderNumber,
        1,
        rules.referralRate,
        saleAmount,
        "referral",
      );
    }

    if (containsProPackage) {
      // ── 3. PRO REGISTRATION COMMISSIONS (PMRC) ────────────────────────────
      //    Paid to Pro Members across all configured PRC levels when a
      //    Pro Member Registration Package is purchased or renewed.
      for (let i = 0; i < rules.prcLevels.length; i++) {
        const sponsor = uplineChain[i];
        if (!sponsor) break;
        if (!sponsor.isProMember) continue;

        const levelConfig = rules.prcLevels[i];
        await recordCommission(
          sponsor.id,
          buyerId,
          orderId,
          orderNumber,
          levelConfig.level,
          levelConfig.rate,
          saleAmount,
          "level",
        );

        // ── 4. CLB — Level 1 sponsor, one-time, within 90-day window ─────────
        if (levelConfig.level === 1) {
          await awardCLB(sponsor, orderId, orderNumber, rules);
        }

        // ── 5. MCB — Level 2 sponsor (Qualifying Upline Sponsor), recurring ──
        if (levelConfig.level === 2) {
          await awardMCB(sponsor, orderId, orderNumber, rules);
        }
      }
    } else {
      // ── 2. SALES COMMISSIONS (PSC) ────────────────────────────────────────
      //    Paid to Pro Members across all configured Sales levels on regular
      //    (non-Pro-Package) product purchases.
      for (let i = 0; i < rules.salesLevels.length; i++) {
        const sponsor = uplineChain[i];
        if (!sponsor) break;
        if (!sponsor.isProMember) continue;

        const levelConfig = rules.salesLevels[i];
        await recordCommission(
          sponsor.id,
          buyerId,
          orderId,
          orderNumber,
          levelConfig.level,
          levelConfig.rate,
          saleAmount,
          "sales",
        );
      }
    }
  } catch (err) {
    logger.error({ err, orderId }, "Failed to process commissions");
  }
}
