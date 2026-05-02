import { Router, type IRouter } from "express";
import { db, bannerMessagesTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

function formatBanner(b: typeof bannerMessagesTable.$inferSelect) {
  return {
    id: b.id,
    message: b.message,
    isActive: b.isActive,
    sortOrder: b.sortOrder,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  };
}

router.get("/banners", async (req, res): Promise<void> => {
  const banners = await db
    .select()
    .from(bannerMessagesTable)
    .where(eq(bannerMessagesTable.isActive, true))
    .orderBy(asc(bannerMessagesTable.sortOrder));
  res.json(banners.map(formatBanner));
});

router.get("/admin/banners", requireAdmin, async (req, res): Promise<void> => {
  const banners = await db
    .select()
    .from(bannerMessagesTable)
    .orderBy(asc(bannerMessagesTable.sortOrder));
  res.json(banners.map(formatBanner));
});

router.post("/admin/banners", requireAdmin, async (req, res): Promise<void> => {
  const { message, isActive, sortOrder } = req.body;
  if (!message || typeof message !== "string" || !message.trim()) {
    res.status(400).json({ error: "Message is required" });
    return;
  }
  const [banner] = await db
    .insert(bannerMessagesTable)
    .values({
      message: message.trim(),
      isActive: typeof isActive === "boolean" ? isActive : true,
      sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
    })
    .returning();
  res.status(201).json(formatBanner(banner));
});

router.put("/admin/banners/reorder", requireAdmin, async (req, res): Promise<void> => {
  const { order } = req.body as { order: { id: number; sortOrder: number }[] };
  if (!Array.isArray(order)) {
    res.status(400).json({ error: "order must be an array" });
    return;
  }
  await Promise.all(
    order.map(({ id, sortOrder }) =>
      db
        .update(bannerMessagesTable)
        .set({ sortOrder })
        .where(eq(bannerMessagesTable.id, id))
    )
  );
  res.json({ success: true });
});

router.put("/admin/banners/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string);
  const [existing] = await db.select().from(bannerMessagesTable).where(eq(bannerMessagesTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Banner not found" });
    return;
  }
  const updates: Partial<typeof bannerMessagesTable.$inferInsert> = {};
  if (req.body.message !== undefined) updates.message = String(req.body.message).trim();
  if (typeof req.body.isActive === "boolean") updates.isActive = req.body.isActive;
  if (typeof req.body.sortOrder === "number") updates.sortOrder = req.body.sortOrder;

  const [updated] = await db
    .update(bannerMessagesTable)
    .set(updates)
    .where(eq(bannerMessagesTable.id, id))
    .returning();
  res.json(formatBanner(updated));
});

router.delete("/admin/banners/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string);
  const [existing] = await db.select().from(bannerMessagesTable).where(eq(bannerMessagesTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Banner not found" });
    return;
  }
  await db.delete(bannerMessagesTable).where(eq(bannerMessagesTable.id, id));
  res.json({ success: true });
});

export default router;
