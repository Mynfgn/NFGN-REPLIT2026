import { Router, type IRouter } from "express";
import { db, usersTable, genealogyNodesTable, walletsTable, ordersTable, orderItemsTable } from "@workspace/db";
import { eq, count, sum, inArray, and, isNotNull, isNull } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

/** Compute Personal Volume: sum of cvTotal from user's own orders (all time). */
async function computePV(userId: number): Promise<number> {
  const orders = await db.select({ id: ordersTable.id }).from(ordersTable).where(eq(ordersTable.userId, userId));
  if (orders.length === 0) return 0;
  const [{ pvSum }] = await db.select({ pvSum: sum(orderItemsTable.cvTotal) })
    .from(orderItemsTable)
    .where(inArray(orderItemsTable.orderId, orders.map(o => o.id)));
  return parseInt(pvSum ?? "0");
}

/** Recursively collects all descendant user IDs up to maxDepth. */
async function getDownlineIds(userId: number, maxDepth = 9, depth = 1): Promise<number[]> {
  if (depth > maxDepth) return [];
  const children = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.sponsorId, userId));
  const ids = children.map(c => c.id);
  for (const c of children) {
    const sub = await getDownlineIds(c.id, maxDepth, depth + 1);
    ids.push(...sub);
  }
  return ids;
}

/** Compute Group Volume: PV of user + sum of PV of all downline members. */
async function computeGV(userId: number): Promise<number> {
  const downlineIds = await getDownlineIds(userId);
  const allIds = [userId, ...downlineIds];
  const orders = await db.select({ id: ordersTable.id }).from(ordersTable).where(inArray(ordersTable.userId, allIds));
  if (orders.length === 0) return 0;
  const [{ gvSum }] = await db.select({ gvSum: sum(orderItemsTable.cvTotal) })
    .from(orderItemsTable)
    .where(inArray(orderItemsTable.orderId, orders.map(o => o.id)));
  return parseInt(gvSum ?? "0");
}

async function buildTree(userId: number, depth: number = 9, currentDepth: number = 0): Promise<any> {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) return null;

  const [node] = await db.select().from(genealogyNodesTable).where(eq(genealogyNodesTable.userId, userId));
  const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.userId, userId));
  const [{ value: teamSize }] = await db.select({ value: count() }).from(usersTable).where(eq(usersTable.sponsorId, userId));

  const pv = await computePV(userId);
  const gv = await computeGV(userId);

  const children: any[] = [];
  if (currentDepth < depth) {
    const directDownline = await db.select().from(usersTable).where(eq(usersTable.sponsorId, userId));
    for (const member of directDownline) {
      const child = await buildTree(member.id, depth, currentDepth + 1);
      if (child) children.push(child);
    }
  }

  return {
    id: node?.id ?? userId,
    userId: user.id,
    name: `${user.firstName} ${user.lastName}`,
    username: user.referralCode ?? "",
    email: user.email,
    avatar: user.avatar ?? null,
    role: user.role,
    isProMember: user.isProMember,
    status: user.status,
    generation: node?.generation ?? 1,
    teamSize: Number(teamSize),
    totalEarnings: parseFloat(wallet?.totalEarned ?? "0"),
    personalVolume: pv,
    groupVolume: gv,
    joinedAt: user.createdAt.toISOString(),
    children,
  };
}

router.get("/genealogy/tree", requireAuth, async (req, res): Promise<void> => {
  const currentUser = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const isAdmin = ["super_admin", "admin"].includes(currentUser.role);
  const userId = req.query.userId ? parseInt(String(req.query.userId)) : currentUser.id;
  const depth = Math.min(parseInt(String(req.query.depth ?? "3")), 9);

  if (!isAdmin && userId !== currentUser.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const tree = await buildTree(userId, depth);
  res.json(tree);
});

router.get("/genealogy/downline", requireAuth, async (req, res): Promise<void> => {
  const currentUser = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const userId = req.query.userId ? parseInt(String(req.query.userId)) : currentUser.id;

  const downline: any[] = [];

  async function collectDownline(parentId: number, generation: number) {
    const members = await db.select().from(usersTable).where(eq(usersTable.sponsorId, parentId));
    for (const member of members) {
      const [node] = await db.select().from(genealogyNodesTable).where(eq(genealogyNodesTable.userId, member.id));
      const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.userId, member.id));
      const [sponsor] = await db.select().from(usersTable).where(eq(usersTable.id, parentId));

      const pv = await computePV(member.id);
      const gv = await computeGV(member.id);

      downline.push({
        id: node?.id ?? member.id,
        userId: member.id,
        name: `${member.firstName} ${member.lastName}`,
        email: member.email,
        avatar: member.avatar ?? null,
        role: member.role,
        isProMember: member.isProMember,
        status: member.status,
        generation,
        sponsorName: sponsor ? `${sponsor.firstName} ${sponsor.lastName}` : "Unknown",
        totalEarnings: parseFloat(wallet?.totalEarned ?? "0"),
        personalVolume: pv,
        groupVolume: gv,
        joinedAt: member.createdAt.toISOString(),
      });

      if (generation < 9) {
        await collectDownline(member.id, generation + 1);
      }
    }
  }

  await collectDownline(userId, 1);
  res.json(downline);
});

router.get("/genealogy/stats", requireAuth, async (req, res): Promise<void> => {
  const currentUser = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const userId = req.query.userId ? parseInt(String(req.query.userId)) : currentUser.id;

  const [{ value: personallyEnrolled }] = await db.select({ value: count() }).from(usersTable).where(eq(usersTable.sponsorId, userId));

  let totalTeamSize = 0;
  let activeMembers = 0;
  let proMembers = 0;
  const generationMap: Record<number, number> = {};

  async function countDownline(parentId: number, generation: number) {
    if (generation > 9) return;
    const members = await db.select().from(usersTable).where(eq(usersTable.sponsorId, parentId));
    for (const m of members) {
      totalTeamSize++;
      if (m.status === "active") activeMembers++;
      if (m.isProMember) proMembers++;
      generationMap[generation] = (generationMap[generation] ?? 0) + 1;
      await countDownline(m.id, generation + 1);
    }
  }

  await countDownline(userId, 1);

  res.json({
    totalTeamSize,
    activeMembers,
    proMembers,
    personallyEnrolled: Number(personallyEnrolled),
    generationBreakdown: Object.entries(generationMap).map(([gen, cnt]) => ({ generation: parseInt(gen), count: cnt })),
  });
});

/** Admin-only: unified tree with a virtual root that includes ALL member subtrees. */
router.get("/genealogy/admin-tree", requireAuth, async (req, res): Promise<void> => {
  const currentUser = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  if (!["super_admin", "admin"].includes(currentUser.role)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const depth = Math.min(parseInt(String(req.query.depth ?? "9")), 9);

  // Find all member users with no sponsor (or whose sponsor is an admin)
  const allUsers = await db.select({ id: usersTable.id, role: usersTable.role, sponsorId: usersTable.sponsorId })
    .from(usersTable);

  const adminIds = new Set(
    allUsers.filter(u => ["super_admin", "admin", "store_admin"].includes(u.role)).map(u => u.id)
  );

  const memberRoots = allUsers.filter(
    u => !adminIds.has(u.id) && (!u.sponsorId || adminIds.has(u.sponsorId))
  );

  const childTrees = await Promise.all(memberRoots.map(u => buildTree(u.id, depth)));
  const validChildren = childTrees.filter(Boolean);

  // Virtual root
  const virtualRoot = {
    id: 0,
    userId: 0,
    name: "NFGN Network",
    email: "",
    avatar: null,
    role: "virtual",
    isProMember: false,
    status: "active",
    generation: 0,
    teamSize: validChildren.length,
    totalEarnings: 0,
    personalVolume: 0,
    groupVolume: 0,
    joinedAt: new Date().toISOString(),
    children: validChildren,
  };

  res.json(virtualRoot);
});

/** Admin-only: fetch every member in the platform regardless of sponsor chain. */
router.get("/genealogy/admin-all", requireAuth, async (req, res): Promise<void> => {
  const currentUser = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  if (!["super_admin", "admin"].includes(currentUser.role)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const allUsers = await db.select().from(usersTable);

  const userIds = allUsers.map(u => u.id);

  // batch fetch wallets
  const wallets = userIds.length
    ? await db.select().from(walletsTable).where(inArray(walletsTable.userId, userIds))
    : [];
  const walletMap = new Map(wallets.map(w => [w.userId, w]));

  // batch fetch orders
  const orders = userIds.length
    ? await db.select({ id: ordersTable.id, userId: ordersTable.userId }).from(ordersTable).where(inArray(ordersTable.userId, userIds))
    : [];
  const ordersByUser = new Map<number, number[]>();
  for (const o of orders) {
    if (!ordersByUser.has(o.userId)) ordersByUser.set(o.userId, []);
    ordersByUser.get(o.userId)!.push(o.id);
  }

  // batch fetch order items cv
  const allOrderIds = orders.map(o => o.id);
  const cvRows = allOrderIds.length
    ? await db.select({ orderId: orderItemsTable.orderId, cv: sum(orderItemsTable.cvTotal) })
        .from(orderItemsTable)
        .where(inArray(orderItemsTable.orderId, allOrderIds))
        .groupBy(orderItemsTable.orderId)
    : [];
  const cvByOrder = new Map(cvRows.map(r => [r.orderId, parseInt(r.cv ?? "0")]));

  // sponsor name map
  const sponsorMap = new Map(allUsers.map(u => [u.id, `${u.firstName} ${u.lastName}`]));

  const result = allUsers
    .filter(u => !["super_admin", "admin", "store_admin"].includes(u.role))
    .map(u => {
      const userOrderIds = ordersByUser.get(u.id) ?? [];
      const pv = userOrderIds.reduce((sum, oid) => sum + (cvByOrder.get(oid) ?? 0), 0);
      const wallet = walletMap.get(u.id);
      return {
        userId: u.id,
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        avatar: u.avatar ?? null,
        role: u.role,
        isProMember: u.isProMember,
        status: u.status,
        sponsorId: u.sponsorId,
        sponsorName: u.sponsorId ? (sponsorMap.get(u.sponsorId) ?? "Unknown") : "No Sponsor",
        personalVolume: pv,
        totalEarnings: parseFloat(wallet?.totalEarned ?? "0"),
        joinedAt: u.createdAt.toISOString(),
      };
    });

  res.json(result);
});

/** Admin-only: global stats across ALL members. */
router.get("/genealogy/admin-stats", requireAuth, async (req, res): Promise<void> => {
  const currentUser = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  if (!["super_admin", "admin"].includes(currentUser.role)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const allMembers = await db.select().from(usersTable).where(
    inArray(usersTable.role, ["pro_member", "affiliate", "customer"])
  );

  const totalMembers = allMembers.length;
  const activeMembers = allMembers.filter(m => m.status === "active").length;
  const proMembers = allMembers.filter(m => m.isProMember).length;
  const noSponsor = allMembers.filter(m => !m.sponsorId).length;

  res.json({ totalMembers, activeMembers, proMembers, noSponsor });
});

export default router;
