import { Router, type IRouter } from "express";
import { db, usersTable, walletsTable, commissionsTable, ordersTable, genealogyNodesTable } from "@workspace/db";
import { eq, like, and, or, sql, count } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth";

const router: IRouter = Router();

function formatUser(user: typeof usersTable.$inferSelect, sponsorName?: string) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    status: user.status,
    referralCode: user.referralCode,
    sponsorId: user.sponsorId,
    sponsorName: sponsorName ?? null,
    avatar: user.avatar,
    phone: user.phone,
    isProMember: user.isProMember,
    proMemberSince: user.proMemberSince?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    gender: user.gender ?? null,
    dateOfBirth: user.dateOfBirth ?? null,
    registrationPackage: user.registrationPackage ?? "free",
    bankName: user.bankName ?? null,
    bankAccountNumber: user.bankAccountNumber ?? null,
    bankRoutingNumber: user.bankRoutingNumber ?? null,
    bankAccountType: user.bankAccountType ?? null,
    payoutMethod: user.payoutMethod ?? "bank",
    payoutPaypalEmail: user.payoutPaypalEmail ?? null,
    payoutCashAppHandle: user.payoutCashAppHandle ?? null,
    pvAdjustment: user.pvAdjustment ?? 0,
    gvAdjustment: user.gvAdjustment ?? 0,
  };
}

router.get("/users", requireAdmin, async (req, res): Promise<void> => {
  const page = parseInt(String(req.query.page ?? "1"));
  const limit = parseInt(String(req.query.limit ?? "20"));
  const offset = (page - 1) * limit;
  const role = req.query.role as string | undefined;
  const search = req.query.search as string | undefined;

  let query = db.select().from(usersTable);
  const conditions = [];
  if (role) conditions.push(eq(usersTable.role, role));
  if (search) conditions.push(or(
    like(usersTable.email, `%${search}%`),
    like(usersTable.firstName, `%${search}%`),
    like(usersTable.lastName, `%${search}%`)
  ));

  const users = await (conditions.length
    ? db.select().from(usersTable).where(and(...conditions)).limit(limit).offset(offset).orderBy(usersTable.createdAt)
    : db.select().from(usersTable).limit(limit).offset(offset).orderBy(usersTable.createdAt)
  );

  const [{ value: total }] = await db.select({ value: count() }).from(usersTable);

  res.json({
    users: users.map(formatUser),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});

router.get("/users/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) { res.status(404).json({ error: "Not found" }); return; }

  const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.userId, id));
  const [{ value: ordersCount }] = await db.select({ value: count() }).from(ordersTable).where(eq(ordersTable.userId, id));
  const [{ value: teamSize }] = await db.select({ value: count() }).from(usersTable).where(eq(usersTable.sponsorId, id));

  res.json({
    ...formatUser(user),
    totalEarnings: parseFloat(wallet?.totalEarned ?? "0"),
    teamSize,
    ordersCount,
  });
});

router.patch("/users/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const {
    firstName, lastName, phone, avatar, role, status,
    gender, dateOfBirth,
    bankName, bankAccountNumber, bankRoutingNumber, bankAccountType,
    payoutMethod, payoutPaypalEmail, payoutCashAppHandle,
  } = req.body;
  const currentUser = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;

  if (currentUser.id !== id && !["super_admin", "admin"].includes(currentUser.role)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const updateData: Partial<typeof usersTable.$inferInsert> = {};
  if (firstName) updateData.firstName = firstName;
  if (lastName) updateData.lastName = lastName;
  if (phone !== undefined) updateData.phone = phone;
  if (avatar !== undefined) updateData.avatar = avatar;
  if (role && ["super_admin", "admin"].includes(currentUser.role)) updateData.role = role;
  if (status && ["super_admin", "admin"].includes(currentUser.role)) updateData.status = status;

  if (gender !== undefined) updateData.gender = gender;
  if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
  if (bankName !== undefined) updateData.bankName = bankName;
  if (bankAccountNumber !== undefined) updateData.bankAccountNumber = bankAccountNumber;
  if (bankRoutingNumber !== undefined) updateData.bankRoutingNumber = bankRoutingNumber;
  if (bankAccountType !== undefined) updateData.bankAccountType = bankAccountType;
  if (payoutMethod !== undefined) updateData.payoutMethod = payoutMethod;
  if (payoutPaypalEmail !== undefined) updateData.payoutPaypalEmail = payoutPaypalEmail;
  if (payoutCashAppHandle !== undefined) updateData.payoutCashAppHandle = payoutCashAppHandle;

  const [updated] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }

  let sponsorName: string | undefined;
  if (updated.sponsorId) {
    const [sponsor] = await db.select().from(usersTable).where(eq(usersTable.id, updated.sponsorId));
    if (sponsor) sponsorName = `${sponsor.firstName} ${sponsor.lastName}`;
  }
  res.json(formatUser(updated, sponsorName));
});

router.delete("/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.sendStatus(204);
});

router.post("/users/:id/upgrade-pro", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [updated] = await db.update(usersTable).set({
    isProMember: true,
    role: "pro_member",
    proMemberSince: new Date(),
  }).where(eq(usersTable.id, id)).returning();

  if (!updated) { res.status(404).json({ error: "Not found" }); return; }

  res.json({
    id: updated.id,
    email: updated.email,
    firstName: updated.firstName,
    lastName: updated.lastName,
    role: updated.role,
    status: updated.status,
    referralCode: updated.referralCode,
    sponsorId: updated.sponsorId,
    avatar: updated.avatar,
    phone: updated.phone,
    isProMember: updated.isProMember,
    createdAt: updated.createdAt.toISOString(),
  });
});

// ── Manual PV / GV Adjustment (Admin only) ─────────────────────────────────
router.post("/users/:id/volume-adjustment", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { pvAdjustment, gvAdjustment } = req.body;

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!existing) { res.status(404).json({ error: "User not found" }); return; }

  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (pvAdjustment !== undefined) updates.pvAdjustment = parseInt(String(pvAdjustment));
  if (gvAdjustment !== undefined) updates.gvAdjustment = parseInt(String(gvAdjustment));

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }

  let sponsorName: string | undefined;
  if (updated.sponsorId) {
    const [sponsor] = await db.select().from(usersTable).where(eq(usersTable.id, updated.sponsorId));
    if (sponsor) sponsorName = `${sponsor.firstName} ${sponsor.lastName}`;
  }
  res.json(formatUser(updated, sponsorName));
});

export default router;
