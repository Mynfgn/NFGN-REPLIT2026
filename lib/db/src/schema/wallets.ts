import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const walletsTable = pgTable("wallets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  balance: numeric("balance", { precision: 10, scale: 2 }).notNull().default("0"),
  pendingBalance: numeric("pending_balance", { precision: 10, scale: 2 }).notNull().default("0"),
  totalEarned: numeric("total_earned", { precision: 10, scale: 2 }).notNull().default("0"),
  totalWithdrawn: numeric("total_withdrawn", { precision: 10, scale: 2 }).notNull().default("0"),
  currency: text("currency").notNull().default("USD"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const walletTransactionsTable = pgTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  walletId: integer("wallet_id").notNull(),
  type: text("type").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  balance: numeric("balance", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  reference: text("reference"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const payoutsTable = pgTable("payouts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  method: text("method").notNull(),
  status: text("status").notNull().default("pending"),
  reference: text("reference"),
  notes: text("notes"),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertWalletSchema = createInsertSchema(walletsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Wallet = typeof walletsTable.$inferSelect;
