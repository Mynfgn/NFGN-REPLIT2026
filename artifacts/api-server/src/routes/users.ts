import { Router, type IRouter } from "express";
import { db, usersTable, walletsTable, commissionsTable, ordersTable, genealogyNodesTable, professionalsTable } from "@workspace/db";
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
    proMemberStatus: user.proMemberStatus ?? null,
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
    isBookAProProvider: user.isBookAProProvider ?? false,
    bookAProCategory: user.bookAProCategory ?? null,
    bookAProSubServices: (user.bookAProSubServices as string[] | null) ?? [],
    bookAProBio: user.bookAProBio ?? null,
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
    users: users.map(u => formatUser(u)),
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
    proMemberStatus: "active",
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
    proMemberStatus: updated.proMemberStatus ?? null,
    createdAt: updated.createdAt.toISOString(),
  });
});

// ── Admin Reset Password (Admin only, no current password required) ────────
router.post("/users/:id/admin-reset-password", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { newPassword } = req.body;
  if (!newPassword || typeof newPassword !== "string") {
    res.status(400).json({ error: "newPassword is required" }); return;
  }
  if (newPassword.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" }); return;
  }

  const { hashPassword } = await import("../lib/auth");
  const hash = await hashPassword(newPassword);
  const [updated] = await db.update(usersTable).set({ passwordHash: hash }).where(eq(usersTable.id, id)).returning({ id: usersTable.id });
  if (!updated) { res.status(404).json({ error: "User not found" }); return; }
  res.json({ success: true });
});

// ── Change Referral Code (Admin only) ──────────────────────────────────────
router.patch("/users/:id/referral-code", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { referralCode } = req.body;
  if (!referralCode || typeof referralCode !== "string") {
    res.status(400).json({ error: "referralCode is required" }); return;
  }

  const cleaned = referralCode.trim().replace(/\s+/g, "-");
  if (cleaned.length < 4 || cleaned.length > 40) {
    res.status(400).json({ error: "Referral code must be 4–40 characters" }); return;
  }

  // Check uniqueness — exclude current user
  const [conflict] = await db.select({ id: usersTable.id })
    .from(usersTable)
    .where(and(eq(usersTable.referralCode, cleaned), sql`${usersTable.id} <> ${id}`));
  if (conflict) {
    res.status(409).json({ error: `Referral code "${cleaned}" is already in use by another member` }); return;
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!existing) { res.status(404).json({ error: "User not found" }); return; }

  const [updated] = await db.update(usersTable)
    .set({ referralCode: cleaned, updatedAt: new Date() })
    .where(eq(usersTable.id, id))
    .returning();

  let sponsorName: string | undefined;
  if (updated.sponsorId) {
    const [sponsor] = await db.select().from(usersTable).where(eq(usersTable.id, updated.sponsorId));
    if (sponsor) sponsorName = `${sponsor.firstName} ${sponsor.lastName}`;
  }
  res.json({ ...formatUser(updated, sponsorName), previousCode: existing.referralCode });
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

// ── Update Book-A-Pro Provider Settings (self or admin) ──────────────────────
router.patch("/users/me/book-a-pro", requireAuth, async (req, res): Promise<void> => {
  const currentUser = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const { isBookAProProvider, bookAProCategory, bookAProSubServices, bookAProBio } = req.body;

  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (typeof isBookAProProvider === "boolean") updates.isBookAProProvider = isBookAProProvider;
  if (bookAProCategory !== undefined) updates.bookAProCategory = bookAProCategory || null;
  if (Array.isArray(bookAProSubServices)) updates.bookAProSubServices = bookAProSubServices;
  if (bookAProBio !== undefined) updates.bookAProBio = bookAProBio || null;

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, currentUser.id)).returning();
  if (!updated) { res.status(404).json({ error: "User not found" }); return; }

  // Sync professional record if provider is active
  if (updated.isBookAProProvider && updated.bookAProCategory) {
    const [existingPro] = await db.select().from(professionalsTable).where(eq(professionalsTable.userId, currentUser.id));
    if (existingPro) {
      await db.update(professionalsTable).set({
        specialty: updated.bookAProCategory,
        services: (updated.bookAProSubServices as string[] | null) ?? [],
        bio: updated.bookAProBio ?? existingPro.bio,
        isAvailable: true,
      }).where(eq(professionalsTable.userId, currentUser.id));
    } else {
      await db.insert(professionalsTable).values({
        userId: currentUser.id,
        name: `${updated.firstName} ${updated.lastName}`,
        bio: updated.bookAProBio ?? `${updated.bookAProCategory} professional on NFGN Book-A-Pro.`,
        specialty: updated.bookAProCategory,
        hourlyRate: "0",
        services: (updated.bookAProSubServices as string[] | null) ?? [],
        isAvailable: true,
      });
    }
  } else if (updated.isBookAProProvider === false) {
    // Deactivate professional listing
    await db.update(professionalsTable).set({ isAvailable: false }).where(eq(professionalsTable.userId, currentUser.id));
  }

  let sponsorName: string | undefined;
  if (updated.sponsorId) {
    const [sponsor] = await db.select().from(usersTable).where(eq(usersTable.id, updated.sponsorId));
    if (sponsor) sponsorName = `${sponsor.firstName} ${sponsor.lastName}`;
  }
  res.json(formatUser(updated, sponsorName));
});

// ── Change Upline Sponsor (Admin only, 72h window, no downline) ─────────────
router.post("/users/:id/change-sponsor", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { newSponsorId } = req.body;
  if (!newSponsorId) { res.status(400).json({ error: "newSponsorId is required" }); return; }
  const newSponsorIdInt = parseInt(String(newSponsorId));
  if (isNaN(newSponsorIdInt)) { res.status(400).json({ error: "newSponsorId must be a number" }); return; }

  const [member] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!member) { res.status(404).json({ error: "Member not found" }); return; }

  // ── 72-hour window check ──
  const hoursSinceJoining = (Date.now() - member.createdAt.getTime()) / (1000 * 60 * 60);
  if (hoursSinceJoining > 72) {
    res.status(400).json({
      error: `Sponsor change is only allowed within 72 hours of joining. ${member.firstName} joined ${Math.floor(hoursSinceJoining)} hours ago.`,
    });
    return;
  }

  // ── No downline check ──
  const [{ value: downlineCount }] = await db.select({ value: count() }).from(usersTable).where(eq(usersTable.sponsorId, id));
  if (downlineCount > 0) {
    res.status(400).json({
      error: `Sponsor cannot be changed because ${member.firstName} already has ${downlineCount} member(s) under them.`,
    });
    return;
  }

  // ── Validate new sponsor exists ──
  const [newSponsor] = await db.select().from(usersTable).where(eq(usersTable.id, newSponsorIdInt));
  if (!newSponsor) { res.status(404).json({ error: "New sponsor not found" }); return; }
  if (newSponsorIdInt === id) { res.status(400).json({ error: "A member cannot be their own sponsor" }); return; }

  // ── Update user sponsorId ──
  await db.update(usersTable).set({ sponsorId: newSponsorIdInt }).where(eq(usersTable.id, id));

  // ── Update genealogy node ──
  const [memberNode] = await db.select().from(genealogyNodesTable).where(eq(genealogyNodesTable.userId, id));
  const [newSponsorNode] = await db.select().from(genealogyNodesTable).where(eq(genealogyNodesTable.userId, newSponsorIdInt));

  if (memberNode && newSponsorNode) {
    const newGeneration = newSponsorNode.generation + 1;
    const newPath = newSponsorNode.path
      ? `${newSponsorNode.path}/${newSponsorNode.id}`
      : `${newSponsorNode.id}`;
    await db.update(genealogyNodesTable)
      .set({ parentId: newSponsorNode.id, generation: newGeneration, path: newPath })
      .where(eq(genealogyNodesTable.id, memberNode.id));
  } else if (!memberNode) {
    // Create genealogy node if missing
    const newGeneration = newSponsorNode ? newSponsorNode.generation + 1 : 1;
    const newPath = newSponsorNode
      ? (newSponsorNode.path ? `${newSponsorNode.path}/${newSponsorNode.id}` : `${newSponsorNode.id}`)
      : "";
    await db.insert(genealogyNodesTable).values({
      userId: id,
      parentId: newSponsorNode?.id ?? undefined,
      generation: newGeneration,
      path: newPath,
    });
  }

  const [updatedMember] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  res.json({
    success: true,
    member: formatUser(updatedMember, `${newSponsor.firstName} ${newSponsor.lastName}`),
    newSponsor: { id: newSponsor.id, name: `${newSponsor.firstName} ${newSponsor.lastName}`, referralCode: newSponsor.referralCode },
  });
});

export default router;
