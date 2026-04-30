import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Book-A-Pro payout records.
 *
 * Split per booking:
 *   80%  → professional payout (this table, pending admin approval)
 *   20%  → commissionable pool, further divided:
 *             60% of pool → product sales commissions
 *             25% of pool → referral commission (upline sponsor)
 *             15% of pool → NFGN platform fees
 */
export const bookingPayoutsTable = pgTable("booking_payouts", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull().unique(),
  professionalId: integer("professional_id").notNull(),
  professionalUserId: integer("professional_user_id"),
  professionalName: text("professional_name").notNull(),
  memberName: text("member_name").notNull(),
  serviceType: text("service_type").notNull(),
  bookingAmount: numeric("booking_amount", { precision: 10, scale: 2 }).notNull(),
  payoutAmount: numeric("payout_amount", { precision: 10, scale: 2 }).notNull(),
  commissionPool: numeric("commission_pool", { precision: 10, scale: 2 }).notNull(),
  productSalesCommission: numeric("product_sales_commission", { precision: 10, scale: 2 }).notNull(),
  referralCommission: numeric("referral_commission", { precision: 10, scale: 2 }).notNull(),
  nfgnFees: numeric("nfgn_fees", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  rejectedAt: timestamp("rejected_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBookingPayoutSchema = createInsertSchema(bookingPayoutsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBookingPayout = z.infer<typeof insertBookingPayoutSchema>;
export type BookingPayout = typeof bookingPayoutsTable.$inferSelect;
