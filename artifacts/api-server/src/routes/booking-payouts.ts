import { Router, type IRouter } from "express";
import { db, bookingPayoutsTable, usersTable, walletsTable, walletTransactionsTable } from "@workspace/db";
import { eq, desc, count } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth";

const router: IRouter = Router();

function fmt(p: typeof bookingPayoutsTable.$inferSelect) {
  return {
    id: p.id,
    bookingId: p.bookingId,
    professionalId: p.professionalId,
    professionalUserId: p.professionalUserId ?? null,
    professionalName: p.professionalName,
    memberName: p.memberName,
    serviceType: p.serviceType,
    bookingAmount: parseFloat(p.bookingAmount),
    payoutAmount: parseFloat(p.payoutAmount),
    commissionPool: parseFloat(p.commissionPool),
    productSalesCommission: parseFloat(p.productSalesCommission),
    referralCommission: parseFloat(p.referralCommission),
    nfgnFees: parseFloat(p.nfgnFees),
    status: p.status,
    notes: p.notes ?? null,
    approvedAt: p.approvedAt?.toISOString() ?? null,
    rejectedAt: p.rejectedAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/my-booking-earnings", requireAuth, async (req, res): Promise<void> => {
  const currentUser = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const rows = await db.select().from(bookingPayoutsTable)
    .where(eq(bookingPayoutsTable.professionalUserId, currentUser.id))
    .orderBy(desc(bookingPayoutsTable.createdAt));
  res.json({ payouts: rows.map(fmt) });
});

router.get("/booking-payouts", requireAdmin, async (req, res): Promise<void> => {
  const page = parseInt(String(req.query.page ?? "1"));
  const limit = parseInt(String(req.query.limit ?? "30"));
  const offset = (page - 1) * limit;
  const status = req.query.status as string | undefined;

  const rows = await db.select().from(bookingPayoutsTable)
    .where(status ? eq(bookingPayoutsTable.status, status) : undefined)
    .orderBy(desc(bookingPayoutsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ value: total }] = await db.select({ value: count() }).from(bookingPayoutsTable)
    .where(status ? eq(bookingPayoutsTable.status, status) : undefined);

  res.json({ payouts: rows.map(fmt), total, page, totalPages: Math.ceil(total / limit) });
});

router.post("/booking-payouts/:id/approve", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const [payout] = await db.select().from(bookingPayoutsTable).where(eq(bookingPayoutsTable.id, id));
  if (!payout) { res.status(404).json({ error: "Not found" }); return; }
  if (payout.status !== "pending") { res.status(400).json({ error: "Payout is not pending" }); return; }

  const [updated] = await db.update(bookingPayoutsTable)
    .set({ status: "approved", approvedAt: new Date() })
    .where(eq(bookingPayoutsTable.id, id))
    .returning();

  const amount = parseFloat(payout.payoutAmount);

  if (payout.professionalUserId) {
    let [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.userId, payout.professionalUserId));
    if (!wallet) {
      [wallet] = await db.insert(walletsTable).values({ userId: payout.professionalUserId }).returning();
    }
    const newBalance = parseFloat(wallet.balance) + amount;
    const newPending = Math.max(0, parseFloat(wallet.pendingBalance) - amount);
    await db.update(walletsTable)
      .set({ balance: String(newBalance), pendingBalance: String(newPending), totalEarned: String(parseFloat(wallet.totalEarned) + amount) })
      .where(eq(walletsTable.id, wallet.id));
    await db.insert(walletTransactionsTable).values({
      walletId: wallet.id,
      type: "booking_payout_approved",
      amount: String(amount),
      balance: String(newBalance),
      description: `Book-A-Pro payout approved — Booking #${payout.bookingId} (${payout.serviceType})`,
      reference: String(payout.bookingId),
    });
  }

  res.json(fmt(updated!));
});

router.post("/booking-payouts/:id/reject", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const { notes } = req.body;
  const [payout] = await db.select().from(bookingPayoutsTable).where(eq(bookingPayoutsTable.id, id));
  if (!payout) { res.status(404).json({ error: "Not found" }); return; }

  const [updated] = await db.update(bookingPayoutsTable)
    .set({ status: "rejected", rejectedAt: new Date(), notes: notes ?? payout.notes })
    .where(eq(bookingPayoutsTable.id, id))
    .returning();

  res.json(fmt(updated!));
});

export default router;
