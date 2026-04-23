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
  referralRateMode: text("referral_rate_mode").notNull().default("global"),
  // MCB — Money Circulation Bonus (Level 2 PMRC, recurring, requires N active qualified L1 Pro Members)
  powerBonusAmount: numeric("power_bonus_amount", { precision: 10, scale: 2 }).notNull().default("200"),
  powerBonusTrigger: integer("power_bonus_trigger").notNull().default(7),
  powerBonusEnabled: boolean("power_bonus_enabled").notNull().default(true),
  // CLB — Core Leadership Bonus (Level 1 PMRC, one-time, within 90 days of becoming Pro Member)
  clbEnabled: boolean("clb_enabled").notNull().default(true),
  clbAmount: numeric("clb_amount", { precision: 10, scale: 2 }).notNull().default("100"),
  clbTrigger: integer("clb_trigger").notNull().default(7),
  clbWindowDays: integer("clb_window_days").notNull().default(90),
  // Qualifying CV — minimum Personal Commission Volume required for a Pro Member to be "active"
  // and counted toward CLB, MCB, and BPP bonus thresholds. Pro Members below this are UPM.
  qualifyingCv: integer("qualifying_cv").notNull().default(150),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCommissionSchema = createInsertSchema(commissionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCommission = z.infer<typeof insertCommissionSchema>;
export type Commission = typeof commissionsTable.$inferSelect;
