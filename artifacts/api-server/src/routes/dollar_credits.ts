import { Router, type IRouter } from "express";
import { db, dollarCreditsTable, usersTable } from "@workspace/db";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

/** Sync credit statuses (pending → available, available → expired) */
async function syncCreditStatuses(userId: number) {
  const now = new Date();
  // pending → available
  await db.update(dollarCreditsTable)
    .set({ status: "available" })
    .where(and(
      eq(dollarCreditsTable.userId, userId),
      eq(dollarCreditsTable.status, "pending"),
      lte(dollarCreditsTable.availableAt, now),
    ));
  // available → expired
  await db.update(dollarCreditsTable)
    .set({ status: "expired" })
    .where(and(
      eq(dollarCreditsTable.userId, userId),
      eq(dollarCreditsTable.status, "available"),
      lte(dollarCreditsTable.expiresAt, now),
    ));
}

/** GET /api/wallet/dollar-credits — list user's $-Credit records */
router.get("/wallet/dollar-credits", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  await syncCreditStatuses(userId);

  const credits = await db.select()
    .from(dollarCreditsTable)
    .where(eq(dollarCreditsTable.userId, userId))
    .orderBy(desc(dollarCreditsTable.earnedAt));

  res.json({
    credits: credits.map(c => ({
      id: c.id,
      amount: parseFloat(c.amount),
      remainingAmount: parseFloat(c.remainingAmount),
      status: c.status,
      earnedAt: c.earnedAt.toISOString(),
      availableAt: c.availableAt.toISOString(),
      expiresAt: c.expiresAt.toISOString(),
      usedAt: c.usedAt?.toISOString() ?? null,
      notes: c.notes ?? null,
    })),
  });
});

/** GET /api/wallet/dollar-credits/summary — totals for dashboard widget */
router.get("/wallet/dollar-credits/summary", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  await syncCreditStatuses(userId);

  const credits = await db.select()
    .from(dollarCreditsTable)
    .where(eq(dollarCreditsTable.userId, userId));

  const available = credits.filter(c => c.status === "available")
    .reduce((s, c) => s + parseFloat(c.remainingAmount), 0);
  const pending = credits.filter(c => c.status === "pending")
    .reduce((s, c) => s + parseFloat(c.amount), 0);

  // Year-to-date total (calendar year)
  const yearStart = new Date(new Date().getFullYear(), 0, 1);
  const ytd = credits
    .filter(c => c.earnedAt >= yearStart)
    .reduce((s, c) => s + parseFloat(c.amount), 0);

  // Count referred retail members (for cashout eligibility)
  const referredMembers = await db.select({ count: sql<number>`count(*)` })
    .from(usersTable)
    .where(and(
      eq(usersTable.sponsorId, userId),
      sql`${usersTable.role} NOT IN ('pro_member', 'super_admin', 'admin', 'store_admin')`,
    ));
  const referredRetailCount = Number(referredMembers[0]?.count ?? 0);
  const cashoutEligible = referredRetailCount >= 9;

  // Next expiry (oldest available credit)
  const nextExpiry = credits
    .filter(c => c.status === "available")
    .sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime())[0];

  res.json({
    available: parseFloat(available.toFixed(2)),
    pending: parseFloat(pending.toFixed(2)),
    ytdTotal: parseFloat(ytd.toFixed(2)),
    cashoutEligible,
    referredRetailCount,
    cashoutThreshold: 9,
    nextExpiryDate: nextExpiry?.expiresAt.toISOString() ?? null,
  });
});

/** POST /api/wallet/dollar-credits/cashout-request — request cash out */
router.post("/wallet/dollar-credits/cashout-request", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  await syncCreditStatuses(userId);

  // Check eligibility
  const referredMembers = await db.select({ count: sql<number>`count(*)` })
    .from(usersTable)
    .where(and(
      eq(usersTable.sponsorId, userId),
      sql`${usersTable.role} NOT IN ('pro_member', 'super_admin', 'admin', 'store_admin')`,
    ));
  const referredRetailCount = Number(referredMembers[0]?.count ?? 0);

  if (referredRetailCount < 9) {
    res.status(403).json({
      error: `You need ${9 - referredRetailCount} more Retail Member referral(s) to be eligible for cash-out. You currently have ${referredRetailCount}/9.`,
    });
    return;
  }

  const available = await db.select()
    .from(dollarCreditsTable)
    .where(and(
      eq(dollarCreditsTable.userId, userId),
      eq(dollarCreditsTable.status, "available"),
    ));

  const totalAvailable = available.reduce((s, c) => s + parseFloat(c.remainingAmount), 0);
  if (totalAvailable <= 0) {
    res.status(400).json({ error: "No available Dollar Credit balance to cash out." });
    return;
  }

  res.json({
    message: `Cash-out request submitted for $${totalAvailable.toFixed(2)}. Admin will review and process within 3-5 business days.`,
    amount: parseFloat(totalAvailable.toFixed(2)),
  });
});

export default router;
