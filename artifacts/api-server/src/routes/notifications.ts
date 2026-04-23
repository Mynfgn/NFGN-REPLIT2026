import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

// ── GET /notifications ────────────────────────────────────────────────────────
router.get("/notifications", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const limit = parseInt(String(req.query.limit ?? "30"));

  const rows = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, userId))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(limit);

  const unreadCount = rows.filter(n => !n.isRead).length;

  res.json({
    notifications: rows.map(n => ({
      id: n.id,
      type: n.type,
      message: n.message,
      relatedUserId: n.relatedUserId,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    })),
    unreadCount,
  });
});

// ── POST /notifications/:id/read ──────────────────────────────────────────────
router.post("/notifications/:id/read", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  await db.update(notificationsTable)
    .set({ isRead: true })
    .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, userId)));

  res.json({ ok: true });
});

// ── POST /notifications/read-all ──────────────────────────────────────────────
router.post("/notifications/read-all", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;

  await db.update(notificationsTable)
    .set({ isRead: true })
    .where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.isRead, false)));

  res.json({ ok: true });
});

export default router;
