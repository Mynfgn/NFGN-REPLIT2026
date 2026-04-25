/**
 * ═══════════════════════════════════════════════════════
 *  BILL PAYER PROGRAM (BPP) — API Routes
 * ═══════════════════════════════════════════════════════
 *
 *  Admin routes (requireAdmin):
 *    GET    /api/bpp/settings               — program settings
 *    PUT    /api/bpp/settings               — update settings
 *    GET    /api/bpp/funds                  — list all funds
 *    PUT    /api/bpp/funds/:id              — update a fund
 *    GET    /api/bpp/qualifications         — list all qualifications
 *    PUT    /api/bpp/qualifications/:id     — approve / deny / pay
 *    POST   /api/bpp/run-qualification      — manually run monthly qualification
 *    GET    /api/bpp/admin-stats            — admin dashboard KPIs
 *
 *  Member routes (requireAuth):
 *    GET    /api/bpp/dashboard              — member BPP overview + history
 * ═══════════════════════════════════════════════════════
 */

import { Router, type IRouter } from "express";
import {
  db, usersTable, ordersTable, orderItemsTable,
  walletsTable, walletTransactionsTable,
  bppFundsTable, bppProgramSettingsTable,
  bppMemberQualificationsTable, bppPayoutTransactionsTable,
  compensationSettingsAuditLogTable,
} from "@workspace/db";
import { eq, and, desc, count, sum, inArray, gte, ne } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// ─── Default seed data ────────────────────────────────────────────────────────
const DEFAULT_FUNDS = [
  {
    name: "Rent / Mortgage Fund",
    slug: "rent-mortgage",
    description: "Helps qualifying Pro Members offset housing costs — rent or mortgage.",
    payoutMode: "percentage" as const,
    payoutPercentage: "12",
    flatAmount: "0",
    gvRequirement: "18000",
    pvRequirement: "150",
    maxCap: "1500",
    isActive: true,
    displayOrder: 1,
    memberFacingCopy: "Help your group reach 18,000 GV while maintaining 150 PV to qualify for up to $1,500 toward your rent or mortgage.",
    disclaimerText: "Fund cap and requirements may be changed at company discretion.",
  },
  {
    name: "Car Fund",
    slug: "car",
    description: "Helps qualifying Pro Members offset their monthly vehicle payment.",
    payoutMode: "percentage" as const,
    payoutPercentage: "8",
    flatAmount: "0",
    gvRequirement: "15000",
    pvRequirement: "150",
    maxCap: "600",
    isActive: true,
    displayOrder: 2,
    memberFacingCopy: "Reach 15,000 GV with 150 PV to qualify for up to $600 toward your car payment.",
    disclaimerText: "Fund cap and requirements may be changed at company discretion.",
  },
  {
    name: "Utilities Fund",
    slug: "utilities",
    description: "Helps qualifying Pro Members offset monthly utility bills — electric, gas, water.",
    payoutMode: "percentage" as const,
    payoutPercentage: "6",
    flatAmount: "0",
    gvRequirement: "12000",
    pvRequirement: "150",
    maxCap: "450",
    isActive: true,
    displayOrder: 3,
    memberFacingCopy: "Reach 12,000 GV with 150 PV to qualify for up to $450 toward your utility bills.",
    disclaimerText: "Fund cap and requirements may be changed at company discretion.",
  },
  {
    name: "Medical Fund",
    slug: "medical",
    description: "Helps qualifying Pro Members offset medical and health-related expenses.",
    payoutMode: "percentage" as const,
    payoutPercentage: "5",
    flatAmount: "0",
    gvRequirement: "10000",
    pvRequirement: "150",
    maxCap: "350",
    isActive: true,
    displayOrder: 4,
    memberFacingCopy: "Reach 10,000 GV with 150 PV to qualify for up to $350 toward medical expenses.",
    disclaimerText: "Fund cap and requirements may be changed at company discretion.",
  },
  {
    name: "Phone / Internet Fund",
    slug: "phone-internet",
    description: "Helps qualifying Pro Members offset their monthly phone and internet bill.",
    payoutMode: "percentage" as const,
    payoutPercentage: "4",
    flatAmount: "0",
    gvRequirement: "8000",
    pvRequirement: "150",
    maxCap: "185",
    isActive: true,
    displayOrder: 5,
    memberFacingCopy: "Reach 8,000 GV with 150 PV to qualify for up to $185 toward your phone and internet bill.",
    disclaimerText: "Fund cap and requirements may be changed at company discretion.",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Ensure BPP funds and settings exist (seed on first access) */
async function ensureBppSeeded() {
  const existingFunds = await db.select({ id: bppFundsTable.id }).from(bppFundsTable).limit(1);
  if (existingFunds.length === 0) {
    await db.insert(bppFundsTable).values(DEFAULT_FUNDS);
    logger.info("BPP funds seeded with defaults");
  }

  const existingSettings = await db.select({ id: bppProgramSettingsTable.id }).from(bppProgramSettingsTable).limit(1);
  if (existingSettings.length === 0) {
    await db.insert(bppProgramSettingsTable).values({});
    logger.info("BPP program settings seeded with defaults");
  }
}

/** Get the current month's start date */
function getMonthStart(year?: number, month?: number): Date {
  const now = new Date();
  return new Date(year ?? now.getFullYear(), (month ?? (now.getMonth() + 1)) - 1, 1);
}

/** Get all downline user IDs (up to maxDepth levels) */
async function getDownlineIds(userId: number, maxDepth = 9): Promise<number[]> {
  const ids: number[] = [];
  const queue: { id: number; depth: number }[] = [{ id: userId, depth: 0 }];
  const visited = new Set<number>();

  while (queue.length > 0) {
    const { id: currentId, depth } = queue.shift()!;
    if (visited.has(currentId) || depth >= maxDepth) continue;
    visited.add(currentId);

    const children = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.sponsorId, currentId));

    for (const child of children) {
      if (!visited.has(child.id)) {
        ids.push(child.id);
        queue.push({ id: child.id, depth: depth + 1 });
      }
    }
  }
  return ids;
}

/**
 * Calculate BPP qualification for a single member for a given month.
 * Returns qualification records to insert (one per qualifying fund).
 */
async function calculateMemberBppQualification(
  memberId: number,
  year: number,
  month: number,
  funds: typeof bppFundsTable.$inferSelect[],
): Promise<Array<{
  fundId: number;
  memberPv: number;
  memberGv: number;
  qualifiedAmount: number;
}>> {
  const monthStart = getMonthStart(year, month);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

  // ── Personal Volume (PV) ────────────────────────────────────────────────────
  const myOrders = await db
    .select({ id: ordersTable.id })
    .from(ordersTable)
    .where(and(eq(ordersTable.userId, memberId), gte(ordersTable.createdAt, monthStart)));

  let personalVolume = 0;
  if (myOrders.length > 0) {
    const [{ pvSum }] = await db
      .select({ pvSum: sum(orderItemsTable.cvTotal) })
      .from(orderItemsTable)
      .where(inArray(orderItemsTable.orderId, myOrders.map(o => o.id)));
    personalVolume = parseFloat(pvSum ?? "0");
  }
  // Include manual PV adjustment
  const [memberRecord] = await db.select({ pvAdjustment: usersTable.pvAdjustment }).from(usersTable).where(eq(usersTable.id, memberId));
  personalVolume += memberRecord?.pvAdjustment ?? 0;

  // ── Group Volume (GV) ────────────────────────────────────────────────────────
  const downlineIds = await getDownlineIds(memberId);
  let groupVolume = 0;
  if (downlineIds.length > 0) {
    const communityOrders = await db
      .select({ id: ordersTable.id })
      .from(ordersTable)
      .where(and(
        inArray(ordersTable.userId, downlineIds),
        gte(ordersTable.createdAt, monthStart),
      ));

    if (communityOrders.length > 0) {
      const [{ gvSum }] = await db
        .select({ gvSum: sum(orderItemsTable.cvTotal) })
        .from(orderItemsTable)
        .where(inArray(orderItemsTable.orderId, communityOrders.map(o => o.id)));
      groupVolume = parseFloat(gvSum ?? "0");
    }
    // Include manual GV adjustments from downline members
    const downlineAdjustments = await db
      .select({ gvAdjustment: usersTable.gvAdjustment })
      .from(usersTable)
      .where(inArray(usersTable.id, downlineIds));
    groupVolume += downlineAdjustments.reduce((s, u) => s + (u.gvAdjustment ?? 0), 0);
  }

  const results = [];

  for (const fund of funds) {
    if (!fund.isActive) continue;

    const gvReq = parseFloat(fund.gvRequirement);
    const pvReq = parseFloat(fund.pvRequirement);
    const maxCap = parseFloat(fund.maxCap);

    // Both GV and PV must meet requirements
    if (groupVolume < gvReq || personalVolume < pvReq) continue;

    let qualifiedAmount: number;
    if (fund.payoutMode === "flat") {
      qualifiedAmount = parseFloat(fund.flatAmount);
    } else {
      // percentage mode: min(GV × pct%, maxCap)
      const pct = parseFloat(fund.payoutPercentage) / 100;
      qualifiedAmount = Math.min(groupVolume * pct, maxCap);
    }

    qualifiedAmount = Math.round(qualifiedAmount * 100) / 100;
    if (qualifiedAmount <= 0) continue;

    results.push({ fundId: fund.id, memberPv: personalVolume, memberGv: groupVolume, qualifiedAmount });
  }

  return results;
}

// ─── Admin: Get BPP settings ──────────────────────────────────────────────────
router.get("/bpp/settings", requireAdmin, async (req, res): Promise<void> => {
  await ensureBppSeeded();
  const [settings] = await db.select().from(bppProgramSettingsTable).limit(1);
  res.json(settings);
});

// ─── Admin: Update BPP settings ──────────────────────────────────────────────
router.put("/bpp/settings", requireAdmin, async (req, res): Promise<void> => {
  const currentUser = (req as any).user;
  const { isEnabled, autoApprove, autoPay, payoutDelayMessage, cycleClosingDay } = req.body;

  await ensureBppSeeded();
  const [existing] = await db.select().from(bppProgramSettingsTable).limit(1);

  const updates: Record<string, unknown> = {};
  if (typeof isEnabled === "boolean") updates.isEnabled = isEnabled;
  if (typeof autoApprove === "boolean") updates.autoApprove = autoApprove;
  if (typeof autoPay === "boolean") updates.autoPay = autoPay;
  if (typeof payoutDelayMessage === "string") updates.payoutDelayMessage = payoutDelayMessage;
  if (typeof cycleClosingDay === "number") updates.cycleClosingDay = cycleClosingDay;

  // Audit log each changed field
  for (const [key, newVal] of Object.entries(updates)) {
    await db.insert(compensationSettingsAuditLogTable).values({
      adminUserId: currentUser.id,
      settingGroup: "bpp_program",
      settingKey: key,
      oldValue: String((existing as any)[key] ?? ""),
      newValue: String(newVal),
    });
  }

  const [updated] = await db
    .update(bppProgramSettingsTable)
    .set(updates as any)
    .where(eq(bppProgramSettingsTable.id, existing!.id))
    .returning();

  res.json(updated);
});

// ─── Public: Get BPP funds (members see active only, admin sees all) ──────────
router.get("/bpp/funds", requireAuth, async (req, res): Promise<void> => {
  const currentUser = (req as any).user;
  const isAdmin = ["super_admin", "admin"].includes(currentUser.role);

  await ensureBppSeeded();

  const funds = await db
    .select()
    .from(bppFundsTable)
    .orderBy(bppFundsTable.displayOrder, bppFundsTable.id);

  const result = isAdmin ? funds : funds.filter(f => f.isActive);
  res.json(result);
});

// ─── Admin: Update a BPP fund ─────────────────────────────────────────────────
router.put("/bpp/funds/:id", requireAdmin, async (req, res): Promise<void> => {
  const currentUser = (req as any).user;
  const fundId = parseInt(req.params.id as string);
  const {
    name, description, payoutMode, payoutPercentage, flatAmount,
    gvRequirement, pvRequirement, maxCap, isActive, displayOrder,
    memberFacingCopy, disclaimerText,
  } = req.body;

  const [existing] = await db.select().from(bppFundsTable).where(eq(bppFundsTable.id, fundId));
  if (!existing) { res.status(404).json({ error: "Fund not found" }); return; }

  // Validate
  if (payoutPercentage !== undefined && (isNaN(Number(payoutPercentage)) || Number(payoutPercentage) < 0 || Number(payoutPercentage) > 100)) {
    res.status(400).json({ error: "Payout percentage must be between 0 and 100." });
    return;
  }
  for (const [field, val] of [["gvRequirement", gvRequirement], ["pvRequirement", pvRequirement], ["maxCap", maxCap], ["flatAmount", flatAmount]] as [string, unknown][]) {
    if (val !== undefined && (isNaN(Number(val)) || Number(val) < 0)) {
      res.status(400).json({ error: `${field} must be a non-negative number.` });
      return;
    }
  }

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (payoutMode !== undefined) updates.payoutMode = payoutMode;
  if (payoutPercentage !== undefined) updates.payoutPercentage = String(payoutPercentage);
  if (flatAmount !== undefined) updates.flatAmount = String(flatAmount);
  if (gvRequirement !== undefined) updates.gvRequirement = String(gvRequirement);
  if (pvRequirement !== undefined) updates.pvRequirement = String(pvRequirement);
  if (maxCap !== undefined) updates.maxCap = String(maxCap);
  if (typeof isActive === "boolean") updates.isActive = isActive;
  if (displayOrder !== undefined) updates.displayOrder = displayOrder;
  if (memberFacingCopy !== undefined) updates.memberFacingCopy = memberFacingCopy;
  if (disclaimerText !== undefined) updates.disclaimerText = disclaimerText;

  // Audit log
  for (const [key, newVal] of Object.entries(updates)) {
    await db.insert(compensationSettingsAuditLogTable).values({
      adminUserId: currentUser.id,
      settingGroup: `bpp_fund_${fundId}`,
      settingKey: key,
      oldValue: String((existing as any)[key] ?? ""),
      newValue: String(newVal),
    });
  }

  const [updated] = await db
    .update(bppFundsTable)
    .set(updates as any)
    .where(eq(bppFundsTable.id, fundId))
    .returning();

  res.json(updated);
});

// ─── Admin: Get all qualifications ────────────────────────────────────────────
router.get("/bpp/qualifications", requireAdmin, async (req, res): Promise<void> => {
  const status = req.query.status as string | undefined;
  const fundId = req.query.fundId ? parseInt(String(req.query.fundId)) : undefined;
  const month = req.query.month ? parseInt(String(req.query.month)) : undefined;
  const year = req.query.year ? parseInt(String(req.query.year)) : undefined;
  const page = parseInt(String(req.query.page ?? "1"));
  const limit = parseInt(String(req.query.limit ?? "25"));
  const offset = (page - 1) * limit;

  const filters = [];
  if (status) filters.push(eq(bppMemberQualificationsTable.status, status));
  if (fundId) filters.push(eq(bppMemberQualificationsTable.fundId, fundId));
  if (month) filters.push(eq(bppMemberQualificationsTable.qualificationMonth, month));
  if (year) filters.push(eq(bppMemberQualificationsTable.qualificationYear, year));

  const rows = await db
    .select({
      q: bppMemberQualificationsTable,
      member: usersTable,
      fund: bppFundsTable,
    })
    .from(bppMemberQualificationsTable)
    .leftJoin(usersTable, eq(bppMemberQualificationsTable.memberId, usersTable.id))
    .leftJoin(bppFundsTable, eq(bppMemberQualificationsTable.fundId, bppFundsTable.id))
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(desc(bppMemberQualificationsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db.select({ total: count() }).from(bppMemberQualificationsTable);

  res.json({
    qualifications: rows.map(r => ({
      ...r.q,
      memberPv: parseFloat(r.q.memberPv),
      memberGv: parseFloat(r.q.memberGv),
      qualifiedAmount: parseFloat(r.q.qualifiedAmount),
      memberName: r.member ? `${r.member.firstName} ${r.member.lastName}` : "Unknown",
      memberEmail: r.member?.email ?? "",
      fundName: r.fund?.name ?? "Unknown",
    })),
    total: Number(total),
    page,
    totalPages: Math.ceil(Number(total) / limit),
  });
});

// ─── Admin: Approve / deny / pay a qualification ──────────────────────────────
router.put("/bpp/qualifications/:id", requireAdmin, async (req, res): Promise<void> => {
  const qualId = parseInt(req.params.id as string);
  const { action, notes } = req.body; // action: "approve" | "deny" | "pay"

  const [qual] = await db
    .select()
    .from(bppMemberQualificationsTable)
    .where(eq(bppMemberQualificationsTable.id, qualId));

  if (!qual) { res.status(404).json({ error: "Qualification not found" }); return; }

  if (action === "approve") {
    const [updated] = await db
      .update(bppMemberQualificationsTable)
      .set({ status: "approved", approvedAt: new Date(), notes: notes ?? qual.notes })
      .where(eq(bppMemberQualificationsTable.id, qualId))
      .returning();
    res.json(updated);
    return;
  }

  if (action === "deny") {
    const [updated] = await db
      .update(bppMemberQualificationsTable)
      .set({ status: "denied", notes: notes ?? qual.notes })
      .where(eq(bppMemberQualificationsTable.id, qualId))
      .returning();
    res.json(updated);
    return;
  }

  if (action === "pay") {
    if (qual.status !== "approved") {
      res.status(400).json({ error: "Qualification must be approved before paying." });
      return;
    }

    const [fund] = await db.select().from(bppFundsTable).where(eq(bppFundsTable.id, qual.fundId));
    const amount = parseFloat(qual.qualifiedAmount);

    // Deposit into wallet
    const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.userId, qual.memberId));
    if (!wallet) { res.status(400).json({ error: "Member wallet not found." }); return; }

    const newBalance = parseFloat((parseFloat(wallet.balance) + amount).toFixed(2));
    const newTotalEarned = parseFloat((parseFloat(wallet.totalEarned) + amount).toFixed(2));

    await db.update(walletsTable).set({
      balance: String(newBalance),
      totalEarned: String(newTotalEarned),
    }).where(eq(walletsTable.userId, qual.memberId));

    await db.insert(walletTransactionsTable).values({
      walletId: wallet.id,
      type: "bpp_bonus",
      amount: String(amount),
      balance: String(newBalance),
      description: `Bill Payer Program Bonus – ${fund?.name ?? "BPP Fund"}`,
      reference: `BPP-${qual.qualificationYear}-${String(qual.qualificationMonth).padStart(2, "0")}`,
    });

    // Create payout transaction record
    await db.insert(bppPayoutTransactionsTable).values({
      memberId: qual.memberId,
      fundId: qual.fundId,
      qualificationId: qual.id,
      amount: String(amount),
      payoutMonth: qual.qualificationMonth,
      payoutYear: qual.qualificationYear,
      paymentStatus: "paid",
      paymentReference: `BPP-${qual.qualificationYear}-${String(qual.qualificationMonth).padStart(2, "0")}-${qual.memberId}-${qual.fundId}`,
    });

    // Mark qualification as paid
    const [updated] = await db
      .update(bppMemberQualificationsTable)
      .set({ status: "paid", paidAt: new Date() })
      .where(eq(bppMemberQualificationsTable.id, qualId))
      .returning();

    res.json(updated);
    return;
  }

  res.status(400).json({ error: "Invalid action. Use: approve, deny, pay" });
});

// ─── Admin: Run monthly BPP qualification for all Pro Members ─────────────────
router.post("/bpp/run-qualification", requireAdmin, async (req, res): Promise<void> => {
  const now = new Date();
  const month = parseInt(String(req.body.month ?? (now.getMonth() + 1)));
  const year = parseInt(String(req.body.year ?? now.getFullYear()));

  await ensureBppSeeded();

  const [settings] = await db.select().from(bppProgramSettingsTable).limit(1);
  if (!settings?.isEnabled) {
    res.status(400).json({ error: "BPP program is currently disabled." });
    return;
  }

  const funds = await db.select().from(bppFundsTable).where(eq(bppFundsTable.isActive, true)).orderBy(bppFundsTable.displayOrder);
  const proMembers = await db.select().from(usersTable).where(eq(usersTable.isProMember, true));

  let newQualifications = 0;
  let autoApproved = 0;

  for (const member of proMembers) {
    const qualResults = await calculateMemberBppQualification(member.id, year, month, funds);

    for (const result of qualResults) {
      // Prevent duplicate for same fund+month+year+member
      const [existing] = await db
        .select()
        .from(bppMemberQualificationsTable)
        .where(and(
          eq(bppMemberQualificationsTable.memberId, member.id),
          eq(bppMemberQualificationsTable.fundId, result.fundId),
          eq(bppMemberQualificationsTable.qualificationMonth, month),
          eq(bppMemberQualificationsTable.qualificationYear, year),
          ne(bppMemberQualificationsTable.status, "denied"),
        ))
        .limit(1);

      if (existing) continue;

      const status = settings.autoApprove ? "approved" : "pending";
      await db.insert(bppMemberQualificationsTable).values({
        memberId: member.id,
        fundId: result.fundId,
        qualificationMonth: month,
        qualificationYear: year,
        memberPv: String(result.memberPv),
        memberGv: String(result.memberGv),
        qualifiedAmount: String(result.qualifiedAmount),
        status,
        qualifiedAt: new Date(),
        approvedAt: settings.autoApprove ? new Date() : undefined,
      });

      newQualifications++;
      if (settings.autoApprove) autoApproved++;

      // Auto-pay if both flags enabled
      if (settings.autoApprove && settings.autoPay) {
        const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.userId, member.id));
        if (wallet) {
          const [fund] = await db.select().from(bppFundsTable).where(eq(bppFundsTable.id, result.fundId));
          const amount = result.qualifiedAmount;
          const newBalance = parseFloat((parseFloat(wallet.balance) + amount).toFixed(2));
          const newTotalEarned = parseFloat((parseFloat(wallet.totalEarned) + amount).toFixed(2));

          await db.update(walletsTable).set({
            balance: String(newBalance),
            totalEarned: String(newTotalEarned),
          }).where(eq(walletsTable.userId, member.id));

          await db.insert(walletTransactionsTable).values({
            walletId: wallet.id,
            type: "bpp_bonus",
            amount: String(amount),
            balance: String(newBalance),
            description: `Bill Payer Program Bonus – ${fund?.name ?? "BPP Fund"}`,
            reference: `BPP-${year}-${String(month).padStart(2, "0")}`,
          });
        }
      }
    }
  }

  logger.info({ month, year, newQualifications, autoApproved }, "BPP monthly qualification run complete");
  res.json({ month, year, newQualifications, autoApproved });
});

// ─── Admin: KPI stats ─────────────────────────────────────────────────────────
router.get("/bpp/admin-stats", requireAdmin, async (req, res): Promise<void> => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  await ensureBppSeeded();

  const thisMonthFilter = and(
    eq(bppMemberQualificationsTable.qualificationMonth, currentMonth),
    eq(bppMemberQualificationsTable.qualificationYear, currentYear),
  );

  const [{ totalPaidAmt }] = await db
    .select({ totalPaidAmt: sum(bppMemberQualificationsTable.qualifiedAmount) })
    .from(bppMemberQualificationsTable)
    .where(and(thisMonthFilter!, eq(bppMemberQualificationsTable.status, "paid")));

  const [{ totalQualifiers }] = await db
    .select({ totalQualifiers: count() })
    .from(bppMemberQualificationsTable)
    .where(thisMonthFilter!);

  const [{ pendingCount }] = await db
    .select({ pendingCount: count() })
    .from(bppMemberQualificationsTable)
    .where(and(thisMonthFilter!, eq(bppMemberQualificationsTable.status, "pending")));

  const [{ approvedCount }] = await db
    .select({ approvedCount: count() })
    .from(bppMemberQualificationsTable)
    .where(and(thisMonthFilter!, eq(bppMemberQualificationsTable.status, "approved")));

  const [{ deniedCount }] = await db
    .select({ deniedCount: count() })
    .from(bppMemberQualificationsTable)
    .where(and(thisMonthFilter!, eq(bppMemberQualificationsTable.status, "denied")));

  // Qualifiers per fund this month
  const funds = await db.select().from(bppFundsTable).orderBy(bppFundsTable.displayOrder);
  const fundStats = await Promise.all(funds.map(async fund => {
    const [{ cnt }] = await db
      .select({ cnt: count() })
      .from(bppMemberQualificationsTable)
      .where(and(thisMonthFilter!, eq(bppMemberQualificationsTable.fundId, fund.id)));
    const [{ paidAmt }] = await db
      .select({ paidAmt: sum(bppMemberQualificationsTable.qualifiedAmount) })
      .from(bppMemberQualificationsTable)
      .where(and(thisMonthFilter!, eq(bppMemberQualificationsTable.fundId, fund.id), eq(bppMemberQualificationsTable.status, "paid")));
    return {
      fundId: fund.id,
      fundName: fund.name,
      qualifiers: Number(cnt),
      totalPaid: parseFloat(paidAmt ?? "0"),
    };
  }));

  res.json({
    month: currentMonth,
    year: currentYear,
    totalPaidThisMonth: parseFloat(totalPaidAmt ?? "0"),
    totalQualifiers: Number(totalQualifiers),
    pendingCount: Number(pendingCount),
    approvedCount: Number(approvedCount),
    deniedCount: Number(deniedCount),
    fundStats,
  });
});

// ─── Member: BPP dashboard ────────────────────────────────────────────────────
router.get("/bpp/dashboard", requireAuth, async (req, res): Promise<void> => {
  const currentUser = (req as any).user;
  const userId = currentUser.id;

  await ensureBppSeeded();

  const [settings] = await db.select().from(bppProgramSettingsTable).limit(1);
  const funds = await db.select().from(bppFundsTable).where(eq(bppFundsTable.isActive, true)).orderBy(bppFundsTable.displayOrder);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const monthStart = new Date(year, month - 1, 1);

  // ── Current month PV ───────────────────────────────────────────────────────
  const myOrders = await db.select({ id: ordersTable.id }).from(ordersTable)
    .where(and(eq(ordersTable.userId, userId), gte(ordersTable.createdAt, monthStart)));

  let personalVolume = 0;
  if (myOrders.length > 0) {
    const [{ pvSum }] = await db.select({ pvSum: sum(orderItemsTable.cvTotal) }).from(orderItemsTable)
      .where(inArray(orderItemsTable.orderId, myOrders.map(o => o.id)));
    personalVolume = parseFloat(pvSum ?? "0");
  }
  // Include manual PV adjustment
  personalVolume += currentUser.pvAdjustment ?? 0;

  // ── Current month GV ───────────────────────────────────────────────────────
  const downlineIds = await getDownlineIds(userId);
  let groupVolume = 0;
  if (downlineIds.length > 0) {
    const communityOrders = await db.select({ id: ordersTable.id }).from(ordersTable)
      .where(and(inArray(ordersTable.userId, downlineIds), gte(ordersTable.createdAt, monthStart)));
    if (communityOrders.length > 0) {
      const [{ gvSum }] = await db.select({ gvSum: sum(orderItemsTable.cvTotal) }).from(orderItemsTable)
        .where(inArray(orderItemsTable.orderId, communityOrders.map(o => o.id)));
      groupVolume = parseFloat(gvSum ?? "0");
    }
    // Include manual GV adjustments from downline members
    const downlineAdjRows = await db.select({ gvAdjustment: usersTable.gvAdjustment }).from(usersTable)
      .where(inArray(usersTable.id, downlineIds));
    groupVolume += downlineAdjRows.reduce((s, u) => s + (u.gvAdjustment ?? 0), 0);
  }

  // ── This month's qualification status per fund ─────────────────────────────
  const thisMonthQuals = await db.select().from(bppMemberQualificationsTable)
    .where(and(
      eq(bppMemberQualificationsTable.memberId, userId),
      eq(bppMemberQualificationsTable.qualificationMonth, month),
      eq(bppMemberQualificationsTable.qualificationYear, year),
    ));

  const fundStatusMap: Record<number, { status: string; amount: number; paidAt: Date | null }> = {};
  for (const q of thisMonthQuals) {
    fundStatusMap[q.fundId] = {
      status: q.status,
      amount: parseFloat(q.qualifiedAmount),
      paidAt: q.paidAt,
    };
  }

  // ── Build fund cards with member's progress ────────────────────────────────
  const fundCards = funds.map(fund => {
    const gvReq = parseFloat(fund.gvRequirement);
    const pvReq = parseFloat(fund.pvRequirement);
    const maxCap = parseFloat(fund.maxCap);
    const pct = parseFloat(fund.payoutPercentage) / 100;

    const gvProgress = Math.min((groupVolume / gvReq) * 100, 100);
    const pvProgress = Math.min((personalVolume / pvReq) * 100, 100);
    const meetsGv = groupVolume >= gvReq;
    const meetsPv = personalVolume >= pvReq;

    let estimatedPayout = 0;
    if (meetsGv && meetsPv) {
      estimatedPayout = fund.payoutMode === "flat"
        ? parseFloat(fund.flatAmount)
        : Math.min(groupVolume * pct, maxCap);
    }

    const qual = fundStatusMap[fund.id];
    let status: string;
    if (!fund.isActive) {
      status = "inactive";
    } else if (qual) {
      status = qual.status;
    } else if (!meetsGv || !meetsPv) {
      status = "in_progress";
    } else {
      status = "qualified";
    }

    return {
      id: fund.id,
      name: fund.name,
      slug: fund.slug,
      description: fund.description,
      memberFacingCopy: fund.memberFacingCopy,
      disclaimerText: fund.disclaimerText,
      payoutMode: fund.payoutMode,
      payoutPercentage: parseFloat(fund.payoutPercentage),
      gvRequirement: gvReq,
      pvRequirement: pvReq,
      maxCap,
      status,
      gvProgress,
      pvProgress,
      meetsGv,
      meetsPv,
      estimatedPayout: Math.round(estimatedPayout * 100) / 100,
      paidThisMonth: qual?.status === "paid",
      paidAmount: qual?.amount ?? 0,
      paidAt: qual?.paidAt ?? null,
    };
  });

  // ── Historical qualifications ──────────────────────────────────────────────
  const history = await db
    .select({
      q: bppMemberQualificationsTable,
      fund: bppFundsTable,
    })
    .from(bppMemberQualificationsTable)
    .leftJoin(bppFundsTable, eq(bppMemberQualificationsTable.fundId, bppFundsTable.id))
    .where(eq(bppMemberQualificationsTable.memberId, userId))
    .orderBy(
      desc(bppMemberQualificationsTable.qualificationYear),
      desc(bppMemberQualificationsTable.qualificationMonth),
    )
    .limit(50);

  res.json({
    isProMember: currentUser.isProMember,
    programEnabled: settings?.isEnabled ?? true,
    payoutDelayMessage: settings?.payoutDelayMessage ?? "Payouts are typically deposited within 1 to 5 business days after approval.",
    currentMonth: month,
    currentYear: year,
    personalVolume,
    groupVolume,
    pvAdjustment: currentUser.pvAdjustment ?? 0,
    gvAdjustment: currentUser.gvAdjustment ?? 0,
    funds: fundCards,
    history: history.map(r => ({
      id: r.q.id,
      fundId: r.q.fundId,
      fundName: r.fund?.name ?? "Unknown",
      month: r.q.qualificationMonth,
      year: r.q.qualificationYear,
      memberPv: parseFloat(r.q.memberPv),
      memberGv: parseFloat(r.q.memberGv),
      qualifiedAmount: parseFloat(r.q.qualifiedAmount),
      status: r.q.status,
      paidAt: r.q.paidAt?.toISOString() ?? null,
      createdAt: r.q.createdAt.toISOString(),
    })),
  });
});

export default router;
