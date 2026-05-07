import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const nonprofitRequestsTable = pgTable("nonprofit_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  orgName: text("org_name").notNull(),
  orgType: text("org_type").notNull().default("nonprofit"),
  ein: text("ein"),
  website: text("website"),
  description: text("description"),
  status: text("status").notNull().default("pending"),
  adminNote: text("admin_note"),
  donationProductId: integer("donation_product_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
