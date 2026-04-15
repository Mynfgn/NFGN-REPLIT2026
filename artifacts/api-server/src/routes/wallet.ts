import { Router, type IRouter } from "express";
import { db, walletsTable, walletTransactionsTable, payoutsTable, usersTable } from "@workspace/db";
import { eq, desc, count } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth";

const router: IRouter = Router();

router.get("/wallet", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { user: typeof usersTable.$inferSelect }).user.id;
  const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.userId, userId));
  if (!wallet) {
    const [w] = await db.insert(walletsTable).values({ userId }).returning();
    res.json({ id: w.id, userId: w.userId, balance: 0, pendingBalance: 0, totalEarned: 0, totalWithdrawn: 0, currency: "USD" });
    return;
  }
  res.json({
    id: wallet.id,
    userId: wallet.userId,
    balance: parseFloat(wallet.balance),
    pendingBalance: parseFloat(wallet.pendingBalance),
    totalEarned: parseFloat(wallet.totalEarned),
    totalWithdrawn: parseFloat(wallet.totalWithdrawn),
    currency: wallet.currency,
  });
});

router.get("/wallet/transactions", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { user: typeof usersTable.$inferSelect }).user.id;
  const page = parseInt(String(req.query.page ?? "1"));
  const limit = parseInt(String(req.query.limit ?? "20"));
  const offset = (page - 1) * limit;

  const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.userId, userId));
  if (!wallet) { res.json({ transactions: [], total: 0, page: 1, totalPages: 0 }); return; }

  const txns = await db.select().from(walletTransactionsTable)
    .where(eq(walletTransactionsTable.walletId, wallet.id))
    .orderBy(desc(walletTransactionsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ value: total }] = await db.select({ value: count() }).from(walletTransactionsTable).where(eq(walletTransactionsTable.walletId, wallet.id));

  res.json({
    transactions: txns.map(t => ({
      id: t.id,
      walletId: t.walletId,
      type: t.type,
      amount: parseFloat(t.amount),
      balance: parseFloat(t.balance),
      description: t.description,
      reference: t.reference ?? null,
      createdAt: t.createdAt.toISOString(),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});

router.post("/wallet/adjust", requireAdmin, async (req, res): Promise<void> => {
  const { userId, amount, type, description } = req.body;
  if (!userId || amount == null || !type || !description) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  let [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.userId, userId));
  if (!wallet) {
    [wallet] = await db.insert(walletsTable).values({ userId }).returning();
  }

  const newBalance = parseFloat(wallet.balance) + parseFloat(String(amount));
  await db.update(walletsTable).set({ balance: String(newBalance) }).where(eq(walletsTable.id, wallet.id));
  await db.insert(walletTransactionsTable).values({
    walletId: wallet.id,
    type,
    amount: String(amount),
    balance: String(newBalance),
    description,
  });

  const [updated] = await db.select().from(walletsTable).where(eq(walletsTable.id, wallet.id));
  res.json({
    id: updated!.id,
    userId: updated!.userId,
    balance: parseFloat(updated!.balance),
    pendingBalance: parseFloat(updated!.pendingBalance),
    totalEarned: parseFloat(updated!.totalEarned),
    totalWithdrawn: parseFloat(updated!.totalWithdrawn),
    currency: updated!.currency,
  });
});

router.get("/payouts", requireAuth, async (req, res): Promise<void> => {
  const currentUser = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const isAdmin = ["super_admin", "admin"].includes(currentUser.role);
  const page = parseInt(String(req.query.page ?? "1"));
  const limit = parseInt(String(req.query.limit ?? "20"));
  const offset = (page - 1) * limit;

  const targetUserId = isAdmin && req.query.userId ? parseInt(String(req.query.userId)) : isAdmin ? undefined : currentUser.id;

  const rows = await db.select({
    payout: payoutsTable,
    user: usersTable,
  }).from(payoutsTable)
    .leftJoin(usersTable, eq(payoutsTable.userId, usersTable.id))
    .where(targetUserId ? eq(payoutsTable.userId, targetUserId) : undefined)
    .orderBy(desc(payoutsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ value: total }] = await db.select({ value: count() }).from(payoutsTable);

  res.json({
    payouts: rows.map(r => ({
      id: r.payout.id,
      userId: r.payout.userId,
      userName: r.user ? `${r.user.firstName} ${r.user.lastName}` : "Unknown",
      amount: parseFloat(r.payout.amount),
      method: r.payout.method,
      status: r.payout.status,
      reference: r.payout.reference ?? null,
      notes: r.payout.notes ?? null,
      processedAt: r.payout.processedAt?.toISOString() ?? null,
      createdAt: r.payout.createdAt.toISOString(),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});

router.post("/payouts", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { user: typeof usersTable.$inferSelect }).user.id;
  const { amount, method, notes } = req.body;

  const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.userId, userId));
  if (!wallet || parseFloat(wallet.balance) < parseFloat(String(amount))) {
    res.status(400).json({ error: "Insufficient balance" });
    return;
  }

  const [payout] = await db.insert(payoutsTable).values({
    userId,
    amount: String(amount),
    method,
    status: "pending",
    notes: notes ?? undefined,
  }).returning();

  const newBalance = parseFloat(wallet.balance) - parseFloat(String(amount));
  const newWithdrawn = parseFloat(wallet.totalWithdrawn) + parseFloat(String(amount));
  await db.update(walletsTable).set({ balance: String(newBalance), totalWithdrawn: String(newWithdrawn) }).where(eq(walletsTable.id, wallet.id));

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  res.status(201).json({
    id: payout.id,
    userId: payout.userId,
    userName: user ? `${user.firstName} ${user.lastName}` : "Unknown",
    amount: parseFloat(payout.amount),
    method: payout.method,
    status: payout.status,
    reference: null,
    notes: payout.notes ?? null,
    processedAt: null,
    createdAt: payout.createdAt.toISOString(),
  });
});

router.post("/payouts/:id/process", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const [payout] = await db.update(payoutsTable).set({ status: "processed", processedAt: new Date() }).where(eq(payoutsTable.id, id)).returning();
  if (!payout) { res.status(404).json({ error: "Not found" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payout.userId));
  res.json({
    id: payout.id,
    userId: payout.userId,
    userName: user ? `${user.firstName} ${user.lastName}` : "Unknown",
    amount: parseFloat(payout.amount),
    method: payout.method,
    status: payout.status,
    reference: payout.reference ?? null,
    notes: payout.notes ?? null,
    processedAt: payout.processedAt?.toISOString() ?? null,
    createdAt: payout.createdAt.toISOString(),
  });
});

export default router;
