import { Router, type IRouter } from "express";
import { db, usersTable, genealogyNodesTable, walletsTable } from "@workspace/db";
import { eq, count, sql, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

async function buildTree(userId: number, depth: number = 9, currentDepth: number = 0): Promise<any> {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) return null;

  const [node] = await db.select().from(genealogyNodesTable).where(eq(genealogyNodesTable.userId, userId));
  const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.userId, userId));
  const [{ value: teamSize }] = await db.select({ value: count() }).from(usersTable).where(eq(usersTable.sponsorId, userId));

  const children: any[] = [];
  if (currentDepth < depth) {
    const directDownline = await db.select().from(usersTable).where(eq(usersTable.sponsorId, userId));
    for (const member of directDownline.slice(0, 10)) {
      const child = await buildTree(member.id, depth, currentDepth + 1);
      if (child) children.push(child);
    }
  }

  return {
    id: node?.id ?? userId,
    userId: user.id,
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    avatar: user.avatar ?? null,
    role: user.role,
    isProMember: user.isProMember,
    status: user.status,
    generation: node?.generation ?? 1,
    teamSize: Number(teamSize),
    totalEarnings: parseFloat(wallet?.totalEarned ?? "0"),
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

export default router;
