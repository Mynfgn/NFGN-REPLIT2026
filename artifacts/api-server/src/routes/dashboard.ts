import { Router, type IRouter } from "express";
import { db, usersTable, ordersTable, commissionsTable, payoutsTable, bookingsTable, orderItemsTable, productsTable, walletsTable, commissionRulesTable } from "@workspace/db";
import { eq, and, desc, count, sum, sql, gte, inArray } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth";

/** Recursively collects all descendant user IDs up to `maxDepth` levels. */
async function getAllDownlineIds(userId: number, maxDepth = 9): Promise<number[]> {
  const ids: number[] = [];
  async function recurse(parentId: number, depth: number) {
    if (depth > maxDepth) return;
    const children = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.sponsorId, parentId));
    for (const c of children) {
      ids.push(c.id);
      await recurse(c.id, depth + 1);
    }
  }
  await recurse(userId, 1);
  return ids;
}

const router: IRouter = Router();

function formatOrder(order: typeof ordersTable.$inferSelect, userName: string) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    userId: order.userId,
    userName,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    subtotal: parseFloat(order.subtotal),
    tax: parseFloat(order.tax),
    shipping: parseFloat(order.shipping),
    total: parseFloat(order.total),
    discount: parseFloat(order.discount),
    shippingAddress: order.shippingAddress ?? null,
    promoCode: order.promoCode ?? null,
    notes: order.notes ?? null,
    createdAt: order.createdAt.toISOString(),
    items: [],
  };
}

router.get("/dashboard/summary", requireAdmin, async (req, res): Promise<void> => {
  const [{ totalSales }] = await db.select({ totalSales: sum(ordersTable.total) }).from(ordersTable).where(eq(ordersTable.paymentStatus, "demo_paid"));
  const [{ totalOrders }] = await db.select({ totalOrders: count() }).from(ordersTable);
  const [{ activeMembers }] = await db.select({ activeMembers: count() }).from(usersTable).where(eq(usersTable.status, "active"));
  const [{ proMembers }] = await db.select({ proMembers: count() }).from(usersTable).where(eq(usersTable.isProMember, true));

  // Platform-wide GCV (total CV from all orders — all-time)
  const [{ platformGCV }] = await db.select({ platformGCV: sum(orderItemsTable.cvTotal) }).from(orderItemsTable);
  // Platform GCV this month
  const startOfThisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [{ platformGCVThisMonth }] = await db.select({ platformGCVThisMonth: sum(orderItemsTable.cvTotal) })
    .from(orderItemsTable)
    .innerJoin(ordersTable, eq(orderItemsTable.orderId, ordersTable.id))
    .where(gte(ordersTable.createdAt, startOfThisMonth));

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const [{ newCustomers }] = await db.select({ newCustomers: count() }).from(usersTable).where(
    and(eq(usersTable.role, "customer"), gte(usersTable.createdAt, thirtyDaysAgo))
  );

  const [{ pendingPayouts }] = await db.select({ pendingPayouts: sum(payoutsTable.amount) }).from(payoutsTable).where(eq(payoutsTable.status, "pending"));
  const [{ pendingCommissions }] = await db.select({ pendingCommissions: sum(commissionsTable.commissionAmount) }).from(commissionsTable).where(eq(commissionsTable.status, "pending"));
  const [{ totalBookings }] = await db.select({ totalBookings: count() }).from(bookingsTable);

  const recentOrderRows = await db.select({
    order: ordersTable,
    user: usersTable,
  }).from(ordersTable)
    .leftJoin(usersTable, eq(ordersTable.userId, usersTable.id))
    .orderBy(desc(ordersTable.createdAt))
    .limit(5);

  const recentRegistrations = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt)).limit(5);

  const salesByMonth: { month: string; sales: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthStr = date.toLocaleString("en-US", { month: "short", year: "2-digit" });
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const [{ val }] = await db.select({ val: sum(ordersTable.total) }).from(ordersTable).where(
      and(gte(ordersTable.createdAt, startOfMonth), sql`${ordersTable.createdAt} <= ${endOfMonth}`)
    );
    salesByMonth.push({ month: monthStr, sales: parseFloat(val ?? "0") });
  }

  const topProductRows = await db.select({
    productId: orderItemsTable.productId,
    productName: orderItemsTable.productName,
    totalSold: count(orderItemsTable.id),
    revenue: sum(orderItemsTable.total),
  }).from(orderItemsTable)
    .groupBy(orderItemsTable.productId, orderItemsTable.productName)
    .orderBy(desc(count(orderItemsTable.id)))
    .limit(5);

  res.json({
    totalSales: parseFloat(totalSales ?? "0"),
    totalOrders: Number(totalOrders),
    activeMembers: Number(activeMembers),
    proMembers: Number(proMembers),
    newCustomers: Number(newCustomers),
    platformGCV: parseInt(platformGCV ?? "0"),
    platformGCVThisMonth: parseInt(platformGCVThisMonth ?? "0"),
    pendingPayouts: parseFloat(pendingPayouts ?? "0"),
    pendingCommissions: parseFloat(pendingCommissions ?? "0"),
    totalBookings: Number(totalBookings),
    recentOrders: recentOrderRows.map(r => formatOrder(r.order, r.user ? `${r.user.firstName} ${r.user.lastName}` : "Unknown")),
    recentRegistrations: recentRegistrations.map(u => ({
      id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName,
      role: u.role, status: u.status, referralCode: u.referralCode, sponsorId: u.sponsorId ?? null,
      avatar: u.avatar ?? null, phone: u.phone ?? null, isProMember: u.isProMember,
      createdAt: u.createdAt.toISOString(),
    })),
    salesByMonth,
    topProducts: topProductRows.map(r => ({
      productId: r.productId,
      productName: r.productName,
      totalSold: Number(r.totalSold),
      revenue: parseFloat(r.revenue ?? "0"),
    })),
  });
});

router.get("/dashboard/member", requireAuth, async (req, res): Promise<void> => {
  const currentUser = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const userId = currentUser.id;

  const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.userId, userId));
  const [{ totalEarnings }] = await db.select({ totalEarnings: sum(commissionsTable.commissionAmount) }).from(commissionsTable).where(eq(commissionsTable.userId, userId));
  const [{ pendingEarnings }] = await db.select({ pendingEarnings: sum(commissionsTable.commissionAmount) }).from(commissionsTable).where(and(eq(commissionsTable.userId, userId), eq(commissionsTable.status, "pending")));
  const [{ paidEarnings }] = await db.select({ paidEarnings: sum(commissionsTable.commissionAmount) }).from(commissionsTable).where(and(eq(commissionsTable.userId, userId), eq(commissionsTable.status, "approved")));
  const [{ teamSize }] = await db.select({ teamSize: count() }).from(usersTable).where(eq(usersTable.sponsorId, userId));
  const [{ activeProMembers }] = await db.select({ activeProMembers: count() }).from(usersTable).where(and(eq(usersTable.sponsorId, userId), eq(usersTable.isProMember, true)));
  const [{ retailCustomers }] = await db.select({ retailCustomers: count() }).from(usersTable).where(and(eq(usersTable.sponsorId, userId), eq(usersTable.role, "customer")));

  const recentOrders = await db.select({
    order: ordersTable,
  }).from(ordersTable)
    .where(eq(ordersTable.userId, userId))
    .orderBy(desc(ordersTable.createdAt))
    .limit(5);

  const recentCommissions = await db.select().from(commissionsTable)
    .where(eq(commissionsTable.userId, userId))
    .orderBy(desc(commissionsTable.createdAt))
    .limit(5);

  const earningsByMonth: { month: string; amount: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthStr = date.toLocaleString("en-US", { month: "short", year: "2-digit" });
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const [{ val }] = await db.select({ val: sum(commissionsTable.commissionAmount) }).from(commissionsTable).where(
      and(eq(commissionsTable.userId, userId), gte(commissionsTable.createdAt, startOfMonth), sql`${commissionsTable.createdAt} <= ${endOfMonth}`)
    );
    earningsByMonth.push({ month: monthStr, amount: parseFloat(val ?? "0") });
  }

  res.json({
    totalEarnings: parseFloat(totalEarnings ?? "0"),
    pendingEarnings: parseFloat(pendingEarnings ?? "0"),
    paidEarnings: parseFloat(paidEarnings ?? "0"),
    walletBalance: parseFloat(wallet?.balance ?? "0"),
    teamSize: Number(teamSize),
    personallyEnrolled: Number(teamSize),
    activeProMembers: Number(activeProMembers),
    retailCustomers: Number(retailCustomers),
    recentOrders: recentOrders.map(r => formatOrder(r.order, `${currentUser.firstName} ${currentUser.lastName}`)),
    recentCommissions: recentCommissions.map(c => ({
      id: c.id, userId: c.userId, userName: `${currentUser.firstName} ${currentUser.lastName}`,
      fromUserId: c.fromUserId, fromUserName: "Member",
      orderId: c.orderId, orderNumber: c.orderNumber,
      level: c.level, rate: parseFloat(c.rate),
      saleAmount: parseFloat(c.saleAmount), commissionAmount: parseFloat(c.commissionAmount),
      status: c.status, type: c.type, notes: c.notes ?? null,
      createdAt: c.createdAt.toISOString(),
    })),
    earningsByMonth,
    referralLink: `https://nfgn.com/rep/${currentUser.referralCode}`,
  });
});

// ── Member Analytics Endpoint ────────────────────────────────────────────────
// Returns: monthly sales, sales by state, PV, GV, Pro Package progress
router.get("/dashboard/analytics", requireAuth, async (req, res): Promise<void> => {
  const currentUser = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const userId = currentUser.id;

  // Get all community user IDs (self + full downline)
  const downlineIds = await getAllDownlineIds(userId);
  const communityIds = [userId, ...downlineIds];

  // ── Monthly Sales (last 12 months) ────────────────────────────────────────
  const monthlySales: { month: string; year: number; totalSales: number; orderCount: number; totalCV: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - i);
    const year = date.getFullYear();
    const month = date.getMonth();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
    const monthLabel = date.toLocaleString("en-US", { month: "short", year: "2-digit" });

    const userOrders = communityIds.length > 0
      ? await db.select({ id: ordersTable.id, total: ordersTable.total })
          .from(ordersTable)
          .where(and(inArray(ordersTable.userId, communityIds), gte(ordersTable.createdAt, start), sql`${ordersTable.createdAt} <= ${end}`))
      : [];

    const orderIds = userOrders.map(o => o.id);
    let totalCV = 0;
    if (orderIds.length > 0) {
      const [{ cvSum }] = await db.select({ cvSum: sum(orderItemsTable.cvTotal) })
        .from(orderItemsTable)
        .where(inArray(orderItemsTable.orderId, orderIds));
      totalCV = parseInt(cvSum ?? "0");
    }

    monthlySales.push({
      month: monthLabel,
      year,
      totalSales: userOrders.reduce((s, o) => s + parseFloat(o.total), 0),
      orderCount: userOrders.length,
      totalCV,
    });
  }

  // ── Sales by State ─────────────────────────────────────────────────────────
  let salesByState: { state: string; totalSales: number; orderCount: number }[] = [];
  if (communityIds.length > 0) {
    const stateRows = await db.select({
      state: ordersTable.shippingState,
      totalSales: sum(ordersTable.total),
      orderCount: count(),
    }).from(ordersTable)
      .where(inArray(ordersTable.userId, communityIds))
      .groupBy(ordersTable.shippingState)
      .orderBy(desc(sum(ordersTable.total)));

    salesByState = stateRows
      .filter(r => r.state)
      .map(r => ({
        state: r.state ?? "Unknown",
        totalSales: parseFloat(r.totalSales ?? "0"),
        orderCount: Number(r.orderCount),
      }))
      .slice(0, 10);
  }

  // ── Personal Volume (PV) — this month ─────────────────────────────────────
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const myOrders = await db.select({ id: ordersTable.id })
    .from(ordersTable)
    .where(and(eq(ordersTable.userId, userId), gte(ordersTable.createdAt, monthStart)));

  let personalVolume = 0;
  if (myOrders.length > 0) {
    const [{ pvSum }] = await db.select({ pvSum: sum(orderItemsTable.cvTotal) })
      .from(orderItemsTable)
      .where(inArray(orderItemsTable.orderId, myOrders.map(o => o.id)));
    personalVolume = parseInt(pvSum ?? "0");
  }

  // ── Group Volume (GV) — this month ────────────────────────────────────────
  let groupVolume = 0;
  if (communityIds.length > 0) {
    const communityOrders = await db.select({ id: ordersTable.id })
      .from(ordersTable)
      .where(and(inArray(ordersTable.userId, communityIds), gte(ordersTable.createdAt, monthStart)));

    if (communityOrders.length > 0) {
      const [{ gvSum }] = await db.select({ gvSum: sum(orderItemsTable.cvTotal) })
        .from(orderItemsTable)
        .where(inArray(orderItemsTable.orderId, communityOrders.map(o => o.id)));
      groupVolume = parseInt(gvSum ?? "0");
    }
  }

  // ── Power Squad Bonus Progress ────────────────────────────────────────────
  const [rules] = await db.select().from(commissionRulesTable).limit(1);
  const bonusTrigger = rules?.powerBonusTrigger ?? 9;
  const bonusAmount = parseFloat(rules?.powerBonusAmount ?? "200");
  const bonusEnabled = rules?.powerBonusEnabled ?? true;

  // Level 1 Pro Members: personally sponsored members who are Pro Members
  const [{ l1ProCount }] = await db.select({ l1ProCount: count() })
    .from(usersTable)
    .where(and(eq(usersTable.sponsorId, userId), eq(usersTable.isProMember, true)));
  const level1ProCount = Number(l1ProCount);
  const level1Qualified = level1ProCount >= bonusTrigger;

  // Level 2 Pro Package commissions earned by this user (each = one Pro Package purchase from their L2)
  const [{ l2CommCount }] = await db.select({ l2CommCount: count() })
    .from(commissionsTable)
    .where(and(
      eq(commissionsTable.userId, userId),
      eq(commissionsTable.level, 2),
      eq(commissionsTable.type, "level"),
    ));
  const level2L2Commissions = Number(l2CommCount);

  // How many Power Squad Bonuses has this user earned?
  const [{ bonusCount }] = await db.select({ bonusCount: count() })
    .from(commissionsTable)
    .where(and(
      eq(commissionsTable.userId, userId),
      eq(commissionsTable.type, "power_squad_bonus"),
    ));
  const bonusesEarned = Number(bonusCount);

  // Next bonus milestone
  const nextBonusAt = (bonusesEarned + 1) * bonusTrigger;
  const toNextBonus = Math.max(0, nextBonusAt - level2L2Commissions);

  res.json({
    monthlySales,
    salesByState,
    personalVolume,
    groupVolume,
    cvMaintenanceRequired: 100,
    powerSquadBonus: {
      bonusTrigger,
      bonusAmount,
      bonusEnabled,
      level1ProMembers: level1ProCount,
      level1Required: bonusTrigger,
      level1Qualified,
      level1Needed: Math.max(0, bonusTrigger - level1ProCount),
      level2Commissions: level2L2Commissions,
      bonusesEarned,
      nextBonusAt,
      toNextBonus,
    },
  });
});

router.get("/reports/sales", requireAdmin, async (req, res): Promise<void> => {
  const [{ totalRevenue }] = await db.select({ totalRevenue: sum(ordersTable.total) }).from(ordersTable);
  const [{ totalOrders }] = await db.select({ totalOrders: count() }).from(ordersTable);

  const avgOrderValue = parseFloat(totalRevenue ?? "0") / Math.max(Number(totalOrders), 1);

  const data: { date: string; orders: number; revenue: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));
    const [{ rev }] = await db.select({ rev: sum(ordersTable.total) }).from(ordersTable).where(
      and(gte(ordersTable.createdAt, startOfDay), sql`${ordersTable.createdAt} <= ${endOfDay}`)
    );
    const [{ cnt }] = await db.select({ cnt: count() }).from(ordersTable).where(
      and(gte(ordersTable.createdAt, startOfDay), sql`${ordersTable.createdAt} <= ${endOfDay}`)
    );
    data.push({ date: dateStr, orders: Number(cnt), revenue: parseFloat(rev ?? "0") });
  }

  const topProducts = await db.select({
    name: orderItemsTable.productName,
    quantity: count(orderItemsTable.id),
    revenue: sum(orderItemsTable.total),
  }).from(orderItemsTable)
    .groupBy(orderItemsTable.productName)
    .orderBy(desc(sum(orderItemsTable.total)))
    .limit(10);

  res.json({
    totalRevenue: parseFloat(totalRevenue ?? "0"),
    totalOrders: Number(totalOrders),
    averageOrderValue: avgOrderValue,
    data,
    topProducts: topProducts.map(p => ({ name: p.name, quantity: Number(p.quantity), revenue: parseFloat(p.revenue ?? "0") })),
  });
});

router.get("/reports/commissions", requireAdmin, async (req, res): Promise<void> => {
  const [{ totalCommissions }] = await db.select({ totalCommissions: sum(commissionsTable.commissionAmount) }).from(commissionsTable);
  const [{ pendingCommissions }] = await db.select({ pendingCommissions: sum(commissionsTable.commissionAmount) }).from(commissionsTable).where(eq(commissionsTable.status, "pending"));
  const [{ paidCommissions }] = await db.select({ paidCommissions: sum(commissionsTable.commissionAmount) }).from(commissionsTable).where(eq(commissionsTable.status, "approved"));

  const data: { date: string; amount: number; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));
    const [{ amt }] = await db.select({ amt: sum(commissionsTable.commissionAmount) }).from(commissionsTable).where(
      and(gte(commissionsTable.createdAt, startOfDay), sql`${commissionsTable.createdAt} <= ${endOfDay}`)
    );
    const [{ cnt }] = await db.select({ cnt: count() }).from(commissionsTable).where(
      and(gte(commissionsTable.createdAt, startOfDay), sql`${commissionsTable.createdAt} <= ${endOfDay}`)
    );
    data.push({ date: dateStr, amount: parseFloat(amt ?? "0"), count: Number(cnt) });
  }

  res.json({
    totalCommissions: parseFloat(totalCommissions ?? "0"),
    pendingCommissions: parseFloat(pendingCommissions ?? "0"),
    paidCommissions: parseFloat(paidCommissions ?? "0"),
    data,
  });
});

router.get("/reports/top-affiliates", requireAdmin, async (req, res): Promise<void> => {
  const proMembers = await db.select().from(usersTable).where(eq(usersTable.isProMember, true));

  const affiliates = [];
  for (const user of proMembers) {
    const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.userId, user.id));
    const [{ teamSize }] = await db.select({ teamSize: count() }).from(usersTable).where(eq(usersTable.sponsorId, user.id));

    affiliates.push({
      userId: user.id,
      name: `${user.firstName} ${user.lastName}`,
      avatar: user.avatar ?? null,
      teamSize: Number(teamSize),
      totalEarnings: parseFloat(wallet?.totalEarned ?? "0"),
      personallyEnrolled: Number(teamSize),
      rank: 0,
    });
  }

  affiliates.sort((a, b) => b.totalEarnings - a.totalEarnings);
  affiliates.forEach((a, i) => a.rank = i + 1);

  res.json(affiliates.slice(0, 20));
});

router.get("/replicated/:username", async (req, res): Promise<void> => {
  const username = Array.isArray(req.params.username) ? req.params.username[0] : req.params.username;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.referralCode, username));
  if (!user) { res.status(404).json({ error: "Consultant not found" }); return; }

  const featuredProducts = await db.select().from(productsTable)
    .where(and(eq(productsTable.featured, true), eq(productsTable.status, "active")))
    .limit(6);

  res.json({
    consultant: {
      id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName,
      role: user.role, status: user.status, referralCode: user.referralCode,
      sponsorId: user.sponsorId ?? null, avatar: user.avatar ?? null, phone: user.phone ?? null,
      isProMember: user.isProMember, createdAt: user.createdAt.toISOString(),
    },
    featuredProducts: featuredProducts.map(p => ({
      id: p.id, name: p.name, slug: p.slug, description: p.description,
      price: parseFloat(p.price), comparePrice: p.comparePrice ? parseFloat(p.comparePrice) : null,
      image: p.image ?? null, categoryId: p.categoryId ?? null, categoryName: null,
      stock: p.stock, featured: p.featured, isProPackage: p.isProPackage,
      status: p.status, commissionRate: parseFloat(p.commissionRate),
      createdAt: p.createdAt.toISOString(),
    })),
    testimonials: [
      { id: 1, name: "Maria T.", text: "NFGN transformed my health and my income. The products are incredible and the community is amazing!", rating: 5, avatar: null },
      { id: 2, name: "James K.", text: "I've been using IGNITE Herbal Cleanse for 3 months. The results speak for themselves. Best detox ever!", rating: 5, avatar: null },
      { id: 3, name: "Sophia R.", text: "The Pro Member program gave me financial freedom I never thought possible. Thank you NFGN!", rating: 5, avatar: null },
    ],
  });
});

// ── GET /dashboard/member-locations ──────────────────────────────────────────
// Admin: all member locations; Member: downline only
router.get("/dashboard/member-locations", requireAuth, async (req, res): Promise<void> => {
  const me = (req as any).user as typeof usersTable.$inferSelect;
  const isAdmin = ["admin", "super_admin", "store_admin"].includes(me.role);

  let users: Pick<typeof usersTable.$inferSelect, "id" | "city" | "state" | "country" | "createdAt">[] = [];

  if (isAdmin) {
    users = await db.select({
      id: usersTable.id,
      city: usersTable.city,
      state: usersTable.state,
      country: usersTable.country,
      createdAt: usersTable.createdAt,
    }).from(usersTable).where(eq(usersTable.status, "active"));
  } else {
    const downlineIds = await getAllDownlineIds(me.id, 9);
    if (downlineIds.length > 0) {
      users = await db.select({
        id: usersTable.id,
        city: usersTable.city,
        state: usersTable.state,
        country: usersTable.country,
        createdAt: usersTable.createdAt,
      }).from(usersTable).where(and(eq(usersTable.status, "active"), inArray(usersTable.id, downlineIds)));
    }
  }

  // Group by location label
  const locationMap: Record<string, { label: string; country: string; count: number; latestJoin: string }> = {};
  for (const u of users) {
    const country = u.country ?? "United States";
    const state = u.state ?? null;
    const city = u.city ?? null;
    const label = city && state ? `${city}, ${state}` : state ? state : country;
    const key = label;
    if (!locationMap[key]) {
      locationMap[key] = { label, country, count: 0, latestJoin: u.createdAt.toISOString() };
    }
    locationMap[key].count++;
    if (u.createdAt.toISOString() > locationMap[key].latestJoin) {
      locationMap[key].latestJoin = u.createdAt.toISOString();
    }
  }

  const locations = Object.values(locationMap).sort((a, b) => b.count - a.count);
  res.json({ locations, total: users.length });
});

export default router;
