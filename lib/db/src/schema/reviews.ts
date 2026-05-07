import { pgTable, serial, integer, text, numeric, boolean, timestamp } from "drizzle-orm/pg-core";
import { productsTable } from "./products";
import { usersTable } from "./users";

export const productReviewsTable = pgTable("product_reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  rating: numeric("rating", { precision: 2, scale: 1 }).notNull().default("5"),
  title: text("title").notNull(),
  body: text("body").notNull(),
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ProductReview = typeof productReviewsTable.$inferSelect;
