import { pgTable, text, serial, timestamp, integer, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * ═══════════════════════════════════════════════════════
 *  BILL PAYER PROGRAM (BPP) — Pro Consultant Commissions
 * ═══════════════════════════════════════════════════════
 *
 *  A special monthly bonus program for Pro Members only.
 *  Members qualify by helping their GROUP reach volume
 *  thresholds (GV), plus maintaining a minimum Personal
 *  Volume (PV). Funds are capped and paid once per month.
 *
 *  Payout formula:
 *    percentage mode: min(GV × payout_percentage, max_cap)
 *    flat mode:       max_cap (if GV and PV thresholds met)
 * ═══════════════════════════════════════════════════════
 */

/** Global BPP program settings (single-row configuration) */
export const bppProgramSettingsTable = pgTable("bpp_program_settings", {
  id: serial("id").primaryKey(),
  isEnabled: boolean("is_enabled").notNull().default(true),
  autoApprove: boolean("auto_approve").notNull().default(false),
  autoPay: boolean("auto_pay").notNull().default(false),
  payoutDelayMessage: text("payout_delay_message").notNull().default(
    "Payouts are typically deposited within 1 to 5 business days after approval.",
  ),
  cycleClosingDay: integer("cycle_closing_day").notNull().default(28),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

/** One record per fund (Rent, Car, Utilities, Medical, Phone) */
export const bppFundsTable = pgTable("bpp_funds", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  payoutMode: text("payout_mode").notNull().default("percentage"), // "percentage" | "flat"
  payoutPercentage: numeric("payout_percentage", { precision: 5, scale: 2 }).notNull().default("12"),
  flatAmount: numeric("flat_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  gvRequirement: numeric("gv_requirement", { precision: 12, scale: 2 }).notNull().default("15000"),
  pvRequirement: numeric("pv_requirement", { precision: 10, scale: 2 }).notNull().default("100"),
  maxCap: numeric("max_cap", { precision: 10, scale: 2 }).notNull().default("1500"),
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  memberFacingCopy: text("member_facing_copy"),
  disclaimerText: text("disclaimer_text"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

/** Monthly qualification record: one row per member per fund per month */
export const bppMemberQualificationsTable = pgTable("bpp_member_qualifications", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull(),
  fundId: integer("fund_id").notNull(),
  qualificationMonth: integer("qualification_month").notNull(), // 1–12
  qualificationYear: integer("qualification_year").notNull(),
  memberPv: numeric("member_pv", { precision: 10, scale: 2 }).notNull().default("0"),
  memberGv: numeric("member_gv", { precision: 12, scale: 2 }).notNull().default("0"),
  qualifiedAmount: numeric("qualified_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  status: text("status").notNull().default("pending"), // pending | approved | paid | denied
  qualifiedAt: timestamp("qualified_at", { withTimezone: true }),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

/** Actual wallet payout transaction record after approval */
export const bppPayoutTransactionsTable = pgTable("bpp_payout_transactions", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull(),
  fundId: integer("fund_id").notNull(),
  qualificationId: integer("qualification_id").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  payoutMonth: integer("payout_month").notNull(),
  payoutYear: integer("payout_year").notNull(),
  paymentStatus: text("payment_status").notNull().default("pending"),
  paymentReference: text("payment_reference"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

/** Audit log for all admin BPP/compensation setting changes */
export const compensationSettingsAuditLogTable = pgTable("compensation_settings_audit_log", {
  id: serial("id").primaryKey(),
  adminUserId: integer("admin_user_id").notNull(),
  settingGroup: text("setting_group").notNull(),
  settingKey: text("setting_key").notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  changedAt: timestamp("changed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBppFundSchema = createInsertSchema(bppFundsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBppFund = z.infer<typeof insertBppFundSchema>;
export type BppFund = typeof bppFundsTable.$inferSelect;
export type BppMemberQualification = typeof bppMemberQualificationsTable.$inferSelect;
export type BppPayoutTransaction = typeof bppPayoutTransactionsTable.$inferSelect;
