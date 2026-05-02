import { pgTable, text, serial, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const proPackagesTable = pgTable("pro_packages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: numeric("original_price", { precision: 10, scale: 2 }).notNull(),
  badge: text("badge").notNull().default(""),
  badgeColor: text("badge_color").notNull().default("#C9A84C"),
  perks: text("perks").array().notNull().default([]),
  sortOrder: integer("sort_order").notNull().default(0),
  productId: integer("product_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertProPackageSchema = createInsertSchema(proPackagesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProPackage = z.infer<typeof insertProPackageSchema>;
export type ProPackage = typeof proPackagesTable.$inferSelect;
