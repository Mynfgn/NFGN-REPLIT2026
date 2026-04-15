import { Router, type IRouter } from "express";
import { db, messagesTable, usersTable } from "@workspace/db";
import { eq, or, and, desc, count } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth";

const router: IRouter = Router();

router.get("/messages", requireAuth, async (req, res): Promise<void> => {
  const currentUser = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const page = parseInt(String(req.query.page ?? "1"));
  const limit = parseInt(String(req.query.limit ?? "20"));
  const offset = (page - 1) * limit;
  const folder = req.query.folder as string | undefined;

  let whereClause;
  if (folder === "sent") {
    whereClause = eq(messagesTable.fromUserId, currentUser.id);
  } else {
    whereClause = or(
      eq(messagesTable.toUserId, currentUser.id),
      eq(messagesTable.isBroadcast, true),
    );
  }

  const messages = await db.select().from(messagesTable)
    .where(whereClause)
    .orderBy(desc(messagesTable.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ value: total }] = await db.select({ value: count() }).from(messagesTable).where(whereClause);
  const unreadCount = messages.filter(m => !m.isRead && m.toUserId === currentUser.id).length;

  const result = [];
  for (const m of messages) {
    const [fromUser] = m.fromUserId ? await db.select().from(usersTable).where(eq(usersTable.id, m.fromUserId)) : [null];
    result.push({
      id: m.id,
      fromUserId: m.fromUserId ?? null,
      fromUserName: fromUser ? `${fromUser.firstName} ${fromUser.lastName}` : "NFGN Admin",
      toUserId: m.toUserId ?? null,
      subject: m.subject,
      body: m.body,
      isRead: m.isRead,
      isBroadcast: m.isBroadcast,
      createdAt: m.createdAt.toISOString(),
    });
  }

  res.json({ messages: result, total, unreadCount, page, totalPages: Math.ceil(total / limit) });
});

router.post("/messages", requireAuth, async (req, res): Promise<void> => {
  const currentUser = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const { toUserId, subject, body } = req.body;

  const [msg] = await db.insert(messagesTable).values({
    fromUserId: currentUser.id,
    toUserId,
    subject,
    body,
    isBroadcast: false,
  }).returning();

  res.status(201).json({
    id: msg.id,
    fromUserId: msg.fromUserId ?? null,
    fromUserName: `${currentUser.firstName} ${currentUser.lastName}`,
    toUserId: msg.toUserId ?? null,
    subject: msg.subject,
    body: msg.body,
    isRead: msg.isRead,
    isBroadcast: msg.isBroadcast,
    createdAt: msg.createdAt.toISOString(),
  });
});

router.post("/messages/:id/read", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  await db.update(messagesTable).set({ isRead: true }).where(eq(messagesTable.id, id));
  res.json({ success: true });
});

router.post("/messages/broadcast", requireAdmin, async (req, res): Promise<void> => {
  const currentUser = (req as typeof req & { user: typeof usersTable.$inferSelect }).user;
  const { subject, body, targetRole } = req.body;

  const [msg] = await db.insert(messagesTable).values({
    fromUserId: currentUser.id,
    subject,
    body,
    isBroadcast: true,
    targetRole: targetRole ?? undefined,
  }).returning();

  res.status(201).json({ success: true, messageId: msg.id });
});

export default router;
