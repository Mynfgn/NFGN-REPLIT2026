import { db, usersTable, commissionsTable, walletsTable, walletTransactionsTable, commissionRulesTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
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
 *  2. SALES COMMISSION (type: "sales")
 *     ‣ WHO earns: Pro Members ONLY
 *     ‣ WHEN:      Regular (non-Pro-Package) product purchases by downline
 *     ‣ RATE:      Configurable per-level via admin (default L1 = 10%)
 *     ‣ NOTE:      Paid IN ADDITION to the Referral Commission on Level 1
 *
 *  3. PRO REGISTRATION COMMISSION / PRC (type: "level")
 *     ‣ WHO earns: Pro Members ONLY
 *     ‣ WHEN:      A Pro Member Registration Package is purchased
 *                  anywhere in the configured PRC levels of their upline
 *     ‣ RATE:      Configurable per-level via admin (default L1=10%, L2=20%)
 *     ‣ NOTE:      Direct sponsor also earns Referral Commission on top
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
  prcLevels: LevelRate[];
  salesLevels: LevelRate[];
  powerBonusEnabled: boolean;
  powerBonusAmount: number;
  powerBonusTrigger: number;
}

async function loadRules(): Promise<CompensationRules> {
  const [rules] = await db.select().from(commissionRulesTable).limit(1);
  return {
    referralRate: parseFloat(rules?.referralRate ?? String(DEFAULT_REFERRAL_RATE)),
    prcLevels: (rules?.levels as LevelRate[] | null) ?? DEFAULT_PRC_LEVELS,
    salesLevels: (rules?.salesLevels as LevelRate[] | null) ?? DEFAULT_SALES_LEVELS,
    powerBonusEnabled: rules?.powerBonusEnabled ?? true,
    powerBonusAmount: parseFloat(rules?.powerBonusAmount ?? "200"),
    powerBonusTrigger: rules?.powerBonusTrigger ?? 9,
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
    ? `Pro Registration Commission (PRC) — Level ${level}`
    : `Sales Commission — Level ${level}`;

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
 *  POWER SQUAD BONUS
 * ═══════════════════════════════════════════════════════
 *  TRIGGER:  Every N (default 9) PRC Level 2 commissions earned
 *  QUALIFY:  User must have N personally sponsored Pro Members
 *  AMOUNT:   Configurable via admin (default $200)
 * ═══════════════════════════════════════════════════════
 */
async function checkAndAwardPowerSquadBonus(
  userId: number,
  orderId: number,
  orderNumber: string,
  rules: CompensationRules,
): Promise<void> {
  try {
    if (!rules.powerBonusEnabled) return;

    const { powerBonusAmount, powerBonusTrigger } = rules;

    const [{ l2Count }] = await db
      .select({ l2Count: count() })
      .from(commissionsTable)
      .where(and(
        eq(commissionsTable.userId, userId),
        eq(commissionsTable.level, 2),
        eq(commissionsTable.type, "level"),
      ));

    const totalL2 = Number(l2Count);
    if (totalL2 === 0 || totalL2 % powerBonusTrigger !== 0) return;

    const [{ l1Count }] = await db
      .select({ l1Count: count() })
      .from(usersTable)
      .where(and(
        eq(usersTable.sponsorId, userId),
        eq(usersTable.isProMember, true),
      ));

    if (Number(l1Count) < powerBonusTrigger) {
      logger.info(
        { userId, totalL2, l1Count, powerBonusTrigger },
        "Power Squad Bonus not awarded — insufficient Level 1 Pro Members",
      );
      return;
    }

    const bonusNum = totalL2 / powerBonusTrigger;

    await db.insert(commissionsTable).values({
      userId,
      fromUserId: userId,
      orderId,
      orderNumber,
      level: 2,
      rate: "0",
      saleAmount: "0",
      commissionAmount: String(powerBonusAmount),
      status: "approved",
      type: "power_squad_bonus",
      notes: `Power Squad Bonus #${bonusNum} — ${totalL2} PRC Level 2 sales (every ${powerBonusTrigger} = $${powerBonusAmount})`,
    });

    const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.userId, userId));
    if (!wallet) return;

    const newBalance = parseFloat((parseFloat(wallet.balance) + powerBonusAmount).toFixed(2));
    const newTotalEarned = parseFloat((parseFloat(wallet.totalEarned) + powerBonusAmount).toFixed(2));

    await db.update(walletsTable).set({
      balance: String(newBalance),
      totalEarned: String(newTotalEarned),
    }).where(eq(walletsTable.userId, userId));

    await db.insert(walletTransactionsTable).values({
      walletId: wallet.id,
      type: "commission_credit",
      amount: String(powerBonusAmount),
      balance: String(newBalance),
      description: `Power Squad Bonus #${bonusNum} — $${powerBonusAmount} (${totalL2} PRC Level 2 sales)`,
      reference: orderNumber,
    });

    logger.info({ userId, totalL2, powerBonusAmount, bonusNum }, "Power Squad Bonus awarded");
  } catch (err) {
    logger.error({ err, userId, orderId }, "Failed to process Power Squad Bonus");
  }
}

/**
 * Process all commissions for a completed order.
 *
 * Commission flow:
 *  - REFERRAL: Personal sponsor (Level 1) earns on EVERY purchase, regardless of role.
 *  - SALES: Pro Member sponsors earn across all configured Sales levels on regular purchases.
 *  - PRC: Pro Member sponsors earn across all configured PRC levels on Pro Package purchases.
 *
 * @param orderId             DB order ID
 * @param orderNumber         Human-readable order number
 * @param saleAmount          Total order amount (after discount)
 * @param buyerId             User who placed the order
 * @param containsProPackage  True when the order includes a Pro Member Registration Package
 */
export async function processCommissions(
  orderId: number,
  orderNumber: string,
  saleAmount: number,
  buyerId: number,
  containsProPackage = false,
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

    if (containsProPackage) {
      // ── 3. PRO REGISTRATION COMMISSIONS (PRC) ─────────────────────────────
      //    Paid to Pro Members across all configured PRC levels when a
      //    Pro Member Registration Package is purchased.
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

        // Check Power Squad Bonus for Level 2 PRC earners
        if (levelConfig.level === 2) {
          await checkAndAwardPowerSquadBonus(sponsor.id, orderId, orderNumber, rules);
        }
      }
    } else {
      // ── 2. SALES COMMISSIONS ──────────────────────────────────────────────
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
