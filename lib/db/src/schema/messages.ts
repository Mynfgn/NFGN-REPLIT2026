import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const messagesTable = pgTable("messages", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id"),
  toUserId: integer("to_user_id"),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  isBroadcast: boolean("is_broadcast").notNull().default(false),
  targetRole: text("target_role"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messagesTable).omit({ id: true, createdAt: true });
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messagesTable.$inferSelect;
