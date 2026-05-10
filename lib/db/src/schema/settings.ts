import { pgTable, text, serial, timestamp, numeric, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bannerMessagesTable = pgTable("banner_messages", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const appSettingsTable = pgTable("app_settings", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull().default("New Face Global Network"),
  companyLogo: text("company_logo"),
  contactEmail: text("contact_email").notNull().default("info@nfgn.com"),
  contactPhone: text("contact_phone"),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).notNull().default("8.5"),
  shippingRate: numeric("shipping_rate", { precision: 10, scale: 2 }).notNull().default("9.99"),
  freeShippingThreshold: numeric("free_shipping_threshold", { precision: 10, scale: 2 }).notNull().default("75"),
  paymentMethods: jsonb("payment_methods").notNull().default(["card", "paypal", "cashapp", "cod"]),
  cashAppHandle: text("cash_app_handle"),
  paypalEmail: text("paypal_email"),
  registrationPackagePrice: numeric("registration_package_price", { precision: 10, scale: 2 }).notNull().default("149.99"),
  registrationPackageId: integer("registration_package_id"),
  homePageBanner: text("home_page_banner"),
  homePageBannerSubtitle: text("home_page_banner_subtitle"),
  appIconUrl: text("app_icon_url"),
  demoMode: boolean("demo_mode").notNull().default(true),
  tickerSpeed: text("ticker_speed").notNull().default("medium"),
  tickerFontSize: text("ticker_font_size").notNull().default("medium"),
  tickerPlaceholder: text("ticker_placeholder").notNull().default("Check back soon for our latest news and promotions!"),
  welcomeMessage: text("welcome_message").notNull().default("Thank you for joining our community! Let me know if there is anything I can do to help!"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const promoCodesTable = pgTable("promo_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  discountType: text("discount_type").notNull(),
  discountValue: numeric("discount_value", { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: numeric("min_order_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const genealogyNodesTable = pgTable("genealogy_nodes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  parentId: integer("parent_id"),
  generation: integer("generation").notNull().default(1),
  path: text("path").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
