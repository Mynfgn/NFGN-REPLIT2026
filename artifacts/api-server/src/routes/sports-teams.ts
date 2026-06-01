import { Router, type IRouter } from "express";
import { db, sportsTeamsTable, usersTable } from "@workspace/db";
import { eq, desc, sql, asc } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth";

const router: IRouter = Router();

// GET approved teams list — used in dropdowns (public)
router.get("/sports-teams/approved", async (req, res): Promise<void> => {
  const teams = await db
    .select({
      id: sportsTeamsTable.id,
      teamName: sportsTeamsTable.teamName,
      tin: sportsTeamsTable.tin,
      sport: sportsTeamsTable.sport,
      teamType: sportsTeamsTable.teamType,
      ageGroup: sportsTeamsTable.ageGroup,
    })
    .from(sportsTeamsTable)
    .where(eq(sportsTeamsTable.approvalStatus, "approved"))
    .orderBy(asc(sportsTeamsTable.teamName));
  res.json(teams);
});

// GET admin — all team registrations
router.get("/admin/sports-teams", requireAdmin, async (req, res): Promise<void> => {
  const rows = await db
    .select({
      team: sportsTeamsTable,
      coachFirstName: usersTable.firstName,
      coachLastName: usersTable.lastName,
      coachEmail: usersTable.email,
      coachPhone: usersTable.phone,
      coachIsProMember: usersTable.isProMember,
    })
    .from(sportsTeamsTable)
    .leftJoin(usersTable, eq(sportsTeamsTable.coachUserId, usersTable.id))
    .orderBy(desc(sportsTeamsTable.createdAt));

  res.json(rows.map(r => ({
    ...r.team,
    coachName: `${r.coachFirstName ?? ""} ${r.coachLastName ?? ""}`.trim(),
    coachEmail: r.coachEmail ?? null,
    coachPhone: r.coachPhone ?? null,
    membershipType: r.coachIsProMember ? "Pro Member" : "Free Member",
  })));
});

// PATCH admin — update approval status + notes; auto-generates TIN on approval
router.patch("/admin/sports-teams/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const adminUserId = (req as any).user.id as number;
  const { approvalStatus, adminNotes } = req.body;

  let tin: string | undefined;
  if (approvalStatus === "approved") {
    const [existing] = await db
      .select({ tin: sportsTeamsTable.tin })
      .from(sportsTeamsTable)
      .where(eq(sportsTeamsTable.id, id));
    if (!existing?.tin) {
      const [countRow] = await db
        .select({ count: sql<number>`count(*)` })
        .from(sportsTeamsTable)
        .where(sql`tin is not null`);
      const nextNum = (Number(countRow?.count ?? 0) + 1).toString().padStart(6, "0");
      tin = `NFGN-TIN-${nextNum}`;
    }
  }

  const updateData: Record<string, any> = {
    reviewedAt: new Date(),
    reviewedByUserId: adminUserId,
  };
  if (approvalStatus !== undefined) updateData.approvalStatus = approvalStatus;
  if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
  if (tin !== undefined) updateData.tin = tin;

  const [team] = await db
    .update(sportsTeamsTable)
    .set(updateData)
    .where(eq(sportsTeamsTable.id, id))
    .returning();

  if (!team) { res.status(404).json({ error: "Team not found" }); return; }
  res.json(team);
});

// GET dashboard — my team (coach view)
router.get("/dashboard/my-sports-team", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id as number;
  const [team] = await db
    .select()
    .from(sportsTeamsTable)
    .where(eq(sportsTeamsTable.coachUserId, userId))
    .limit(1);
  if (!team) { res.status(404).json({ error: "No team found" }); return; }
  res.json(team);
});

export default router;
