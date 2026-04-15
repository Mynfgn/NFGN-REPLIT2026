import { Router, type IRouter } from "express";
import { db, commissionsTable, usersTable, walletsTable, walletTransactionsTable, commissionRulesTable } from "@workspace/db";
import { eq, and, desc, count, sql } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth";

const router: IRouter = Router();

function formatCommission(c: typeof commissionsTable.$inferSelect, userName: string, fromUserName: string) {
  return {
    id: c.id,
    userId: c.userId,
    userName,
    fromUserId: c.fromUserId,
    fromUserName,
    orderId: c.orderId,
    orderNumber: c.orderNumber,
    level: c.level,
    rate: parseFloat(c.rate),
    saleAmount: parseFloat(c.saleAmount),
    commissionAmount: parseFloat(c.commissionAmount),
    status: c.status,
    type: c.type,
    notes: c.notes ?? null,
    createdAt: c.createdAt.toISOString(),
  };
}

router.get("/commissions", requireAuth, async (req, res): Promise<void> => {
  const currentUser = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const page = parseInt(String(req.query.page ?? "1"));
  const limit = parseInt(String(req.query.limit ?? "20"));
  const offset = (page - 1) * limit;
  const status = req.query.status as string | undefined;
  const isAdmin = ["super_admin", "admin"].includes(currentUser.role);
  const userId = isAdmin && req.query.userId ? parseInt(String(req.query.userId)) : currentUser.id;

  const rows = await db.select({
    commission: commissionsTable,
    user: usersTable,
  }).from(commissionsTable)
    .leftJoin(usersTable, eq(commissionsTable.userId, usersTable.id))
    .where(and(
      isAdmin ? (req.query.userId ? eq(commissionsTable.userId, userId) : undefined) : eq(commissionsTable.userId, currentUser.id),
      status ? eq(commissionsTable.status, status) : undefined,
    ))
    .limit(limit)
    .offset(offset)
    .orderBy(desc(commissionsTable.createdAt));

  const [{ value: total }] = await db.select({ value: count() }).from(commissionsTable);

  const result = [];
  for (const row of rows) {
    const [fromUser] = await db.select().from(usersTable).where(eq(usersTable.id, row.commission.fromUserId));
    const userName = row.user ? `${row.user.firstName} ${row.user.lastName}` : "Unknown";
    const fromUserName = fromUser ? `${fromUser.firstName} ${fromUser.lastName}` : "Unknown";
    result.push(formatCommission(row.commission, userName, fromUserName));
  }

  res.json({ commissions: result, total, page, totalPages: Math.ceil(total / limit) });
});

router.post("/commissions/:id/approve", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const [commission] = await db.select().from(commissionsTable).where(eq(commissionsTable.id, id));
  if (!commission) { res.status(404).json({ error: "Not found" }); return; }

  await db.update(commissionsTable).set({ status: "approved" }).where(eq(commissionsTable.id, id));

  const amount = parseFloat(commission.commissionAmount);
  const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.userId, commission.userId));
  if (wallet) {
    const newBalance = parseFloat(wallet.balance) + amount;
    const newPending = Math.max(0, parseFloat(wallet.pendingBalance) - amount);
    await db.update(walletsTable).set({ balance: String(newBalance), pendingBalance: String(newPending) }).where(eq(walletsTable.userId, commission.userId));
    await db.insert(walletTransactionsTable).values({
      walletId: wallet.id,
      type: "commission_approved",
      amount: String(amount),
      balance: String(newBalance),
      description: `Commission approved for order #${commission.orderNumber}`,
      reference: commission.orderNumber,
    });
  }

  const [updated] = await db.select().from(commissionsTable).where(eq(commissionsTable.id, id));
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, updated!.userId));
  const [fromUser] = await db.select().from(usersTable).where(eq(usersTable.id, updated!.fromUserId));
  res.json(formatCommission(updated!, `${user?.firstName} ${user?.lastName}`, `${fromUser?.firstName} ${fromUser?.lastName}`));
});

router.post("/commissions/:id/reject", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  await db.update(commissionsTable).set({ status: "rejected" }).where(eq(commissionsTable.id, id));

  const [updated] = await db.select().from(commissionsTable).where(eq(commissionsTable.id, id));
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, updated.userId));
  const [fromUser] = await db.select().from(usersTable).where(eq(usersTable.id, updated.fromUserId));
  res.json(formatCommission(updated, `${user?.firstName} ${user?.lastName}`, `${fromUser?.firstName} ${fromUser?.lastName}`));
});

router.get("/commission-rules", async (req, res): Promise<void> => {
  const [rules] = await db.select().from(commissionRulesTable).limit(1);
  if (!rules) {
    res.json({
      levels: [
        { level: 1, rate: 10, description: "Direct referral" },
        { level: 2, rate: 20, description: "Power level" },
        { level: 3, rate: 10 }, { level: 4, rate: 5 }, { level: 5, rate: 5 },
        { level: 6, rate: 5 }, { level: 7, rate: 5 }, { level: 8, rate: 5 }, { level: 9, rate: 5 },
      ],
      powerBonusAmount: 100,
      powerBonusTrigger: 9,
      powerBonusEnabled: true,
    });
    return;
  }
  res.json({
    levels: rules.levels,
    powerBonusAmount: parseFloat(rules.powerBonusAmount),
    powerBonusTrigger: rules.powerBonusTrigger,
    powerBonusEnabled: rules.powerBonusEnabled,
  });
});

router.put("/commission-rules", requireAdmin, async (req, res): Promise<void> => {
  const { levels, powerBonusAmount, powerBonusTrigger, powerBonusEnabled } = req.body;

  const [existing] = await db.select().from(commissionRulesTable).limit(1);
  const updates = {
    levels: levels ?? existing?.levels,
    powerBonusAmount: String(powerBonusAmount ?? existing?.powerBonusAmount ?? 100),
    powerBonusTrigger: powerBonusTrigger ?? existing?.powerBonusTrigger ?? 9,
    powerBonusEnabled: powerBonusEnabled ?? existing?.powerBonusEnabled ?? true,
  };

  let result;
  if (existing) {
    [result] = await db.update(commissionRulesTable).set(updates).where(eq(commissionRulesTable.id, existing.id)).returning();
  } else {
    [result] = await db.insert(commissionRulesTable).values(updates).returning();
  }

  res.json({
    levels: result!.levels,
    powerBonusAmount: parseFloat(result!.powerBonusAmount),
    powerBonusTrigger: result!.powerBonusTrigger,
    powerBonusEnabled: result!.powerBonusEnabled,
  });
});

export default router;
