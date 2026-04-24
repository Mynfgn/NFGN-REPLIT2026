import { Router } from "express";
import { db, visionGoalsTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/vision-goals", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const [row] = await db.select().from(visionGoalsTable).where(eq(visionGoalsTable.userId, user.id));
  res.json(row ?? null);
});

router.post("/vision-goals", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const {
    myWhy, myVision,
    goal7day, goal14day, goal30day, goal90day, goal6month, goal12month,
    income7day, income14day, income30day, income90day, income6month, income12month,
    financialProblems, ultimateDream, confidenceStatement, accountability,
  } = req.body;

  const data = {
    userId: user.id,
    myWhy, myVision,
    goal7day, goal14day, goal30day, goal90day, goal6month, goal12month,
    income7day, income14day, income30day, income90day, income6month, income12month,
    financialProblems, ultimateDream, confidenceStatement, accountability,
  };

  const existing = await db.select().from(visionGoalsTable).where(eq(visionGoalsTable.userId, user.id));
  if (existing.length > 0) {
    const [updated] = await db.update(visionGoalsTable).set(data).where(eq(visionGoalsTable.userId, user.id)).returning();
    res.json(updated);
  } else {
    const [created] = await db.insert(visionGoalsTable).values(data).returning();
    res.json(created);
  }
});

export default router;
