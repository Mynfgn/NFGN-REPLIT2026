import { pgTable, text, serial, timestamp, boolean, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  comparePrice: numeric("compare_price", { precision: 10, scale: 2 }),
  image: text("image"),
  images: text("images").array().default([]),
  categoryId: integer("category_id"),
  stock: integer("stock").notNull().default(0),
  featured: boolean("featured").notNull().default(false),
  isProPackage: boolean("is_pro_package").notNull().default(false),
  status: text("status").notNull().default("active"),
  commissionRate: numeric("commission_rate", { precision: 5, scale: 2 }).notNull().default("10"),
  cv: integer("cv").notNull().default(0),
  ingredients: text("ingredients"),
  benefits: text("benefits"),

  // Dollar Credit program eligibility (admin sets per product)
  dollarCreditEligible: boolean("dollar_credit_eligible").notNull().default(false),
  // Refund policy: 'no_refund' or '7_day_return' (mandatory, admin sets per product)
  refundPolicy: text("refund_policy").notNull().default("no_refund"),

  // Referral commission mode: "flat" = fixed dollar amount (default), "percent" = % of product price
  commissionType: text("commission_type").notNull().default("flat"),
  // Flat dollar referral commission paid to sponsor per unit sold (used when commissionType = "flat")
  commissionAmount: numeric("commission_amount", { precision: 10, scale: 2 }).notNull().default("0"),

  // Per-product shipping & handling fees (admin adjustable per product)
  shippingFee: numeric("shipping_fee", { precision: 10, scale: 2 }).notNull().default("9.99"),
  handlingFee: numeric("handling_fee", { precision: 10, scale: 2 }).notNull().default("5.00"),

  // Pro Member discount program (cannot be enabled on Pro Registration Products)
  proMemberDiscountEligible: boolean("pro_member_discount_eligible").notNull().default(false),
  proMemberDiscountPercent: numeric("pro_member_discount_percent", { precision: 5, scale: 2 }).notNull().default("0"),

  // NFGN Sports product (tournament tickets, entry fees, sponsorships, concessions, etc.)
  isSports: boolean("is_sports").notNull().default(false),
  // Sports-specific sub-category (one of 9 options, only relevant when isSports = true)
  sportsCategory: text("sports_category"),
  // Name of the team, organization, or player this sports product is for
  teamOrganizationName: text("team_organization_name"),

  // Downloadable product (e-books, music, images, etc.)
  isDownloadable: boolean("is_downloadable").notNull().default(false),
  downloadUrl: text("download_url"),
  downloadFileName: text("download_file_name"),
  downloadFileSize: text("download_file_size"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
