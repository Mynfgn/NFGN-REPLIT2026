import { pgTable, text, serial, timestamp, integer, numeric, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const commissionsTable = pgTable("commissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  fromUserId: integer("from_user_id").notNull(),
  orderId: integer("order_id").notNull(),
  orderNumber: text("order_number").notNull(),
  level: integer("level").notNull(),
  rate: numeric("rate", { precision: 5, scale: 2 }).notNull(),
  saleAmount: numeric("sale_amount", { precision: 10, scale: 2 }).notNull(),
  commissionAmount: numeric("commission_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  type: text("type").notNull().default("sales"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const commissionRulesTable = pgTable("commission_rules", {
  id: serial("id").primaryKey(),
  levels: jsonb("levels").notNull(),
  salesLevels: jsonb("sales_levels"),
  referralRate: numeric("referral_rate", { precision: 5, scale: 2 }).default("10"),
  powerBonusAmount: numeric("power_bonus_amount", { precision: 10, scale: 2 }).notNull().default("100"),
  powerBonusTrigger: integer("power_bonus_trigger").notNull().default(9),
  powerBonusEnabled: boolean("power_bonus_enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCommissionSchema = createInsertSchema(commissionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCommission = z.infer<typeof insertCommissionSchema>;
export type Commission = typeof commissionsTable.$inferSelect;
