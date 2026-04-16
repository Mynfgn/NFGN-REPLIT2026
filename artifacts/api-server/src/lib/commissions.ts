import { db, usersTable, commissionsTable, walletsTable, walletTransactionsTable, commissionRulesTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import { logger } from "./logger";

/**
 * ═══════════════════════════════════════════════════════
 *  NFGN Compensation Plan
 * ═══════════════════════════════════════════════════════
 *
 *  1. REFERRAL COMMISSION (type: "referral")
 *     ‣ WHO earns: ALL Members (any role)
 *     ‣ WHEN:      Their DIRECT personal referral makes any purchase
 *     ‣ RATE:      REFERRAL_RATE (default 10%)
 *
 *  2. SALES COMMISSION (type: "sales")
 *     ‣ WHO earns: Pro Members ONLY
 *     ‣ WHEN:      Their direct referral buys regular products
 *     ‣ RATE:      SALES_RATE (default 10%)
 *     ‣ NOTE:      Paid IN ADDITION to the Referral Commission
 *
 *  3. LEVEL COMMISSION (type: "level")
 *     ‣ WHO earns: Pro Members ONLY
 *     ‣ WHEN:      A Pro Member Registration Package is purchased anywhere
 *                  in their first 2 upline levels
 *     ‣ RATE:      Level 1 = 10%, Level 2 = 20%
 *     ‣ NOTE:      Direct sponsor also earns Referral Commission on top
 * ═══════════════════════════════════════════════════════
 */

const REFERRAL_RATE = 10; // % — direct sponsor, all members, every purchase
const SALES_RATE = 10;    // % — direct Pro Member sponsor, regular products only

const DEFAULT_LEVEL_RATES = [
  { level: 1, rate: 10, description: "Level 1 Commission (Pro Package)" },
  { level: 2, rate: 20, description: "Level 2 Commission (Pro Package)" },
];

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
    ? `Level ${level} Commission`
    : "Sales Commission";

  await db.insert(walletTransactionsTable).values({
    walletId: wallet.id,
    type: "commission_pending",
    amount: String(commissionAmount),
    balance: String(parseFloat(wallet.balance) + newPending),
    description: `${typeLabel} from order #${orderNumber}`,
    reference: orderNumber,
  });
}

async function getUplineMember(userId: number): Promise<typeof usersTable.$inferSelect | null> {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user?.sponsorId) return null;
  const [sponsor] = await db.select().from(usersTable).where(eq(usersTable.id, user.sponsorId));
  return sponsor ?? null;
}

/**
 * ═══════════════════════════════════════════════════════
 *  POWER SQUAD BONUS
 * ═══════════════════════════════════════════════════════
 *  TRIGGER:  Every N (default 9) Pro Member Package purchases
 *            that generate a Level 2 commission for this user
 *  QUALIFY:  User must have N (default 9) personally sponsored
 *            Level 1 Pro Members at the time the bonus is earned
 *  AMOUNT:   Configurable via admin (default $200)
 * ═══════════════════════════════════════════════════════
 */
async function checkAndAwardPowerSquadBonus(
  userId: number,
  orderId: number,
  orderNumber: string,
): Promise<void> {
  try {
    const [rules] = await db.select().from(commissionRulesTable).limit(1);
    if (!rules?.powerBonusEnabled) return;

    const bonusAmount = parseFloat(rules.powerBonusAmount ?? "200");
    const trigger = rules.powerBonusTrigger ?? 9;

    // Count total Level 2 commissions ever earned by this user from Pro Package purchases
    const [{ l2Count }] = await db
      .select({ l2Count: count() })
      .from(commissionsTable)
      .where(and(
        eq(commissionsTable.userId, userId),
        eq(commissionsTable.level, 2),
        eq(commissionsTable.type, "level"),
      ));

    const totalL2 = Number(l2Count);

    // Check if this purchase pushed us to a new multiple of the trigger
    if (totalL2 === 0 || totalL2 % trigger !== 0) return;

    // Qualification check: user must have 'trigger' personally sponsored Level 1 Pro Members
    const [{ l1Count }] = await db
      .select({ l1Count: count() })
      .from(usersTable)
      .where(and(
        eq(usersTable.sponsorId, userId),
        eq(usersTable.isProMember, true),
      ));

    const level1ProCount = Number(l1Count);
    if (level1ProCount < trigger) {
      logger.info(
        { userId, totalL2, level1ProCount, trigger },
        "Power Squad Bonus not awarded — insufficient Level 1 Pro Members",
      );
      return;
    }

    // Award the bonus
    const bonusNum = totalL2 / trigger; // which bonus cycle this is

    await db.insert(commissionsTable).values({
      userId,
      fromUserId: userId,
      orderId,
      orderNumber,
      level: 2,
      rate: "0",
      saleAmount: "0",
      commissionAmount: String(bonusAmount),
      status: "approved", // Power Squad Bonuses auto-approve
      type: "power_squad_bonus",
      notes: `Power Squad Bonus #${bonusNum} — ${totalL2} Level 2 Pro Package sales reached (every ${trigger} = $${bonusAmount})`,
    });

    const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.userId, userId));
    if (!wallet) return;

    const newBalance = parseFloat((parseFloat(wallet.balance) + bonusAmount).toFixed(2));
    const newTotalEarned = parseFloat((parseFloat(wallet.totalEarned) + bonusAmount).toFixed(2));

    await db.update(walletsTable).set({
      balance: String(newBalance),
      totalEarned: String(newTotalEarned),
    }).where(eq(walletsTable.userId, userId));

    await db.insert(walletTransactionsTable).values({
      walletId: wallet.id,
      type: "commission_credit",
      amount: String(bonusAmount),
      balance: String(newBalance),
      description: `Power Squad Bonus #${bonusNum} — $${bonusAmount} (${totalL2} Level 2 Pro Package sales)`,
      reference: orderNumber,
    });

    logger.info({ userId, totalL2, bonusAmount, bonusNum }, "Power Squad Bonus awarded");
  } catch (err) {
    logger.error({ err, userId, orderId }, "Failed to process Power Squad Bonus");
  }
}

/**
 * Process all commissions for a completed order.
 *
 * @param orderId             DB order ID
 * @param orderNumber         Human-readable order number
 * @param saleAmount          Total order amount (after discount)
 * @param buyerId             User who placed the order
 * @param containsProPackage  True when the order includes a Pro Member Package
 */
export async function processCommissions(
  orderId: number,
  orderNumber: string,
  saleAmount: number,
  buyerId: number,
  containsProPackage = false,
): Promise<void> {
  try {
    // Load level commission rates from DB (admins can change these)
    const [rules] = await db.select().from(commissionRulesTable).limit(1);
    const levelRates: Array<{ level: number; rate: number }> =
      (rules?.levels as Array<{ level: number; rate: number }>) ?? DEFAULT_LEVEL_RATES;

    // Resolve direct sponsor (Level 1)
    const level1Sponsor = await getUplineMember(buyerId);
    if (!level1Sponsor) return; // Buyer has no sponsor → no commissions

    // ── 1. REFERRAL COMMISSION ───────────────────────────────────────────────
    //    Paid to direct sponsor for EVERY purchase, regardless of their role.
    await recordCommission(
      level1Sponsor.id,
      buyerId,
      orderId,
      orderNumber,
      1,
      REFERRAL_RATE,
      saleAmount,
      "referral",
    );

    if (containsProPackage) {
      // ── 3. LEVEL COMMISSIONS — Pro Package purchase only ─────────────────
      //    Level 1: direct sponsor must be Pro Member
      if (level1Sponsor.isProMember) {
        const l1Rate = levelRates.find(l => l.level === 1)?.rate ?? 10;
        await recordCommission(
          level1Sponsor.id,
          buyerId,
          orderId,
          orderNumber,
          1,
          l1Rate,
          saleAmount,
          "level",
        );
      }

      //    Level 2: resolve second-level sponsor, must be Pro Member
      const level2Sponsor = await getUplineMember(level1Sponsor.id);
      if (level2Sponsor?.isProMember) {
        const l2Rate = levelRates.find(l => l.level === 2)?.rate ?? 20;
        await recordCommission(
          level2Sponsor.id,
          buyerId,
          orderId,
          orderNumber,
          2,
          l2Rate,
          saleAmount,
          "level",
        );
        // Check if Level 2 sponsor has earned a Power Squad Bonus
        await checkAndAwardPowerSquadBonus(level2Sponsor.id, orderId, orderNumber);
      }
    } else {
      // ── 2. SALES COMMISSION — regular products, Pro Members only ─────────
      if (level1Sponsor.isProMember) {
        await recordCommission(
          level1Sponsor.id,
          buyerId,
          orderId,
          orderNumber,
          1,
          SALES_RATE,
          saleAmount,
          "sales",
        );
      }
    }
  } catch (err) {
    logger.error({ err, orderId }, "Failed to process commissions");
  }
}
