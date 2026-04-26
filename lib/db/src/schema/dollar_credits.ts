import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Dollar Credit ($-Credit) ledger.
 *
 * Earned by Referring Retail Members (RRM) when a referred member makes a purchase.
 * Rules:
 *   - 7-day hold from earnedAt before credit becomes available (availableAt)
 *   - Expires 30 days after availableAt (37 days total from earnedAt) → expiresAt
 *   - Only usable on products where dollarCreditEligible = true
 *   - Revoked if the source order is refunded
 *   - After signing 9 Retail Members, member can request cash-out
 */
export const dollarCreditsTable = pgTable("dollar_credits", {
  id: serial("id").primaryKey(),

  userId: integer("user_id").notNull(),

  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  remainingAmount: numeric("remaining_amount", { precision: 10, scale: 2 }).notNull(),

  // Timeline
  earnedAt: timestamp("earned_at", { withTimezone: true }).notNull().defaultNow(),
  availableAt: timestamp("available_at", { withTimezone: true }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),

  // Status: pending → available → used | expired | revoked
  status: text("status").notNull().default("pending"),

  // Source: the order that triggered this credit reward
  sourceOrderId: integer("source_order_id"),
  // The referred user whose purchase generated this credit
  referredUserId: integer("referred_user_id"),

  // If used: the order it was applied toward
  usedOnOrderId: integer("used_on_order_id"),
  usedAt: timestamp("used_at", { withTimezone: true }),

  notes: text("notes"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDollarCreditSchema = createInsertSchema(dollarCreditsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDollarCredit = z.infer<typeof insertDollarCreditSchema>;
export type DollarCredit = typeof dollarCreditsTable.$inferSelect;
