import { pgTable, text, serial, timestamp, integer, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const professionalsTable = pgTable("professionals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  name: text("name").notNull(),
  bio: text("bio").notNull(),
  specialty: text("specialty").notNull(),
  avatar: text("avatar"),
  rating: numeric("rating", { precision: 3, scale: 2 }).notNull().default("5.0"),
  reviewCount: integer("review_count").notNull().default(0),
  isAvailable: boolean("is_available").notNull().default(true),
  hourlyRate: numeric("hourly_rate", { precision: 10, scale: 2 }).notNull(),
  services: text("services").array().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  professionalId: integer("professional_id").notNull(),
  serviceType: text("service_type").notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  duration: integer("duration").notNull().default(60),
  status: text("status").notNull().default("pending"),
  paymentMethod: text("payment_method").notNull(),
  paymentStatus: text("payment_status").notNull().default("pending"),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  paymentLink: text("payment_link"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;
