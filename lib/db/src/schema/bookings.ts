import { pgTable, text, serial, timestamp, integer, numeric, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const professionalsTable = pgTable("professionals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  name: text("name").notNull(),
  businessName: text("business_name"),
  bio: text("bio").notNull(),
  specialty: text("specialty").notNull(),
  category: text("category"),         // slug: health-wellness | cosmetology | restaurants | ...
  subcategory: text("subcategory"),   // e.g. "Barbers", "Physical Trainers"
  avatar: text("avatar"),
  rating: numeric("rating", { precision: 3, scale: 2 }).notNull().default("5.0"),
  reviewCount: integer("review_count").notNull().default(0),
  isAvailable: boolean("is_available").notNull().default(true),
  providerStatus: text("provider_status").notNull().default("approved"),  // pending|approved|denied|suspended
  hourlyRate: numeric("hourly_rate", { precision: 10, scale: 2 }).notNull(),
  cv: integer("cv").notNull().default(0),
  proPayoutPercent: integer("pro_payout_percent").notNull().default(80),
  commissionPercent: numeric("commission_percent", { precision: 5, scale: 2 }).notNull().default("10"),
  isPaygEligible: boolean("is_payg_eligible").notNull().default(false),
  isCommissionable: boolean("is_commissionable").notNull().default(true),
  services: text("services").array().default([]),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  location: text("location"),
  adminNotes: text("admin_notes"),
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
  referralUserId: integer("referral_user_id"),
  reminder8hrSentAt: timestamp("reminder_8hr_sent_at", { withTimezone: true }),
  serviceRenderedAt: timestamp("service_rendered_at", { withTimezone: true }),
  digitalSignature: text("digital_signature"),
  digitalSignedAt: timestamp("digital_signed_at", { withTimezone: true }),
  paymentReleasedAt: timestamp("payment_released_at", { withTimezone: true }),
  cancellationNote: text("cancellation_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const professionalAvailabilityTable = pgTable("professional_availability", {
  id: serial("id").primaryKey(),
  professionalId: integer("professional_id").notNull(),
  availableDate: date("available_date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;

// ─────────────────────────────────────────────────────────────────────────────
//  Pay As You Go (PAYG)
// ─────────────────────────────────────────────────────────────────────────────

/** Up to 4 services offered by a Pro Member provider */
export const paygServicesTable = pgTable("payg_services", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  cv: numeric("cv", { precision: 10, scale: 2 }).notNull().default("0"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

/** Provider availability windows — date + open/close time + chair count */
export const paygAvailabilityTable = pgTable("payg_availability", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").notNull(),
  availableDate: date("available_date").notNull(),
  startTime: text("start_time").notNull(),   // "HH:MM" 24-hr
  endTime: text("end_time").notNull(),        // "HH:MM" 24-hr
  maxChairs: integer("max_chairs").notNull().default(1),
  notes: text("notes"),
  isBlocked: boolean("is_blocked").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Customer PAYG bookings */
export const paygBookingsTable = pgTable("payg_bookings", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  providerId: integer("provider_id").notNull(),
  serviceId: integer("service_id"),
  availabilityId: integer("availability_id"),
  bookingDate: date("booking_date").notNull(),
  startTime: text("start_time").notNull(),
  numHours: numeric("num_hours", { precision: 4, scale: 1 }).notNull().default("2"),
  serviceName: text("service_name").notNull(),
  providerName: text("provider_name").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(),
  cvGenerated: numeric("cv_generated", { precision: 10, scale: 2 }).notNull().default("0"),
  status: text("status").notNull().default("pending"),          // pending | approved | completed | cancelled
  paymentStatus: text("payment_status").notNull().default("pending"), // pending | paid
  paymentMethod: text("payment_method"),
  paymentLink: text("payment_link"),
  notes: text("notes"),
  adminNote: text("admin_note"),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type PaygService = typeof paygServicesTable.$inferSelect;
export type PaygAvailability = typeof paygAvailabilityTable.$inferSelect;
export type PaygBooking = typeof paygBookingsTable.$inferSelect;
