import { db, usersTable, commissionsTable, walletsTable, walletTransactionsTable, commissionRulesTable, genealogyNodesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { logger } from "./logger";

const DEFAULT_LEVELS = [
  { level: 1, rate: 10, description: "Direct referral" },
  { level: 2, rate: 20, description: "Power level (2x)" },
  { level: 3, rate: 10, description: "Generation 3" },
  { level: 4, rate: 5, description: "Generation 4" },
  { level: 5, rate: 5, description: "Generation 5" },
  { level: 6, rate: 5, description: "Generation 6" },
  { level: 7, rate: 5, description: "Generation 7" },
  { level: 8, rate: 5, description: "Generation 8" },
  { level: 9, rate: 5, description: "Generation 9" },
];

export async function processCommissions(orderId: number, orderNumber: string, saleAmount: number, buyerId: number): Promise<void> {
  try {
    const [rules] = await db.select().from(commissionRulesTable).limit(1);
    const levels = (rules?.levels as typeof DEFAULT_LEVELS) ?? DEFAULT_LEVELS;

    let currentUserId = buyerId;
    let generation = 0;

    while (generation < 9) {
      const [buyer] = await db.select().from(usersTable).where(eq(usersTable.id, currentUserId));
      if (!buyer || !buyer.sponsorId) break;

      const [sponsor] = await db.select().from(usersTable).where(eq(usersTable.id, buyer.sponsorId));
      if (!sponsor) break;

      generation++;

      if (sponsor.isProMember) {
        const levelConfig = levels.find(l => l.level === generation);
        if (!levelConfig) break;

        const commissionAmount = (saleAmount * levelConfig.rate) / 100;

        await db.insert(commissionsTable).values({
          userId: sponsor.id,
          fromUserId: buyerId,
          orderId,
          orderNumber,
          level: generation,
          rate: String(levelConfig.rate),
          saleAmount: String(saleAmount),
          commissionAmount: String(commissionAmount),
          status: "pending",
          type: "sales",
        });

        const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.userId, sponsor.id));
        if (wallet) {
          const newPending = parseFloat(wallet.pendingBalance) + commissionAmount;
          const newTotalEarned = parseFloat(wallet.totalEarned) + commissionAmount;
          await db.update(walletsTable).set({
            pendingBalance: String(newPending),
            totalEarned: String(newTotalEarned),
          }).where(eq(walletsTable.userId, sponsor.id));

          await db.insert(walletTransactionsTable).values({
            walletId: wallet.id,
            type: "commission_pending",
            amount: String(commissionAmount),
            balance: String(parseFloat(wallet.balance) + newPending),
            description: `Level ${generation} commission from order #${orderNumber}`,
            reference: orderNumber,
          });
        }
      }

      if (!buyer.sponsorId) break;
      currentUserId = buyer.sponsorId;
    }
  } catch (err) {
    logger.error({ err, orderId }, "Failed to process commissions");
  }
}
