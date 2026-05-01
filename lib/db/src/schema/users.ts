import { pgTable, text, serial, timestamp, boolean, integer, date, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").notNull().default("customer"),
  status: text("status").notNull().default("active"),
  referralCode: text("referral_code").notNull().unique(),
  sponsorId: integer("sponsor_id"),
  avatar: text("avatar"),
  phone: text("phone"),
  isProMember: boolean("is_pro_member").notNull().default(false),
  proMemberSince: timestamp("pro_member_since", { withTimezone: true }),
  proMemberStatus: text("pro_member_status"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),

  gender: text("gender"),
  dateOfBirth: date("date_of_birth"),
  registrationPackage: text("registration_package").default("free"),

  bankName: text("bank_name"),
  bankAccountNumber: text("bank_account_number"),
  bankRoutingNumber: text("bank_routing_number"),
  bankAccountType: text("bank_account_type"),

  payoutMethod: text("payout_method").default("bank"),
  payoutPaypalEmail: text("payout_paypal_email"),
  payoutCashAppHandle: text("payout_cash_app_handle"),

  pvAdjustment: integer("pv_adjustment").notNull().default(0),
  gvAdjustment: integer("gv_adjustment").notNull().default(0),

  city: text("city"),
  state: text("state"),
  country: text("country").default("United States"),

  organizationName: text("organization_name"),

  isBookAProProvider: boolean("is_book_a_pro_provider").notNull().default(false),
  bookAProCategory: text("book_a_pro_category"),
  bookAProSubServices: json("book_a_pro_sub_services").$type<string[]>().default([]),
  bookAProBio: text("book_a_pro_bio"),

  // Member tier within the "member/customer" role
  // 'retail_member' → 'referring_retail_member' → 'unqualified_pro_member'
  // Pro Members use role='pro_member' instead
  memberTier: text("member_tier").notNull().default("retail_member"),

  // When true, this member is approved to collect Cash on Delivery payments.
  // Only admins can toggle this. COD is hidden in checkout for all others.
  canAcceptCod: boolean("can_accept_cod").notNull().default(false),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
