import { Router, type IRouter } from "express";
import { db, usersTable, ordersTable, commissionsTable, payoutsTable, bookingsTable, orderItemsTable, productsTable, walletsTable } from "@workspace/db";
import { eq, and, desc, count, sum, sql, gte } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth";

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

export default router;
