import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";

export const paygProviderApplicationsTable = pgTable("payg_provider_applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),

  // Status workflow
  status: text("status").notNull().default("draft"),
  // draft | pending_submission | pending_review | additional_info_requested | approved | rejected | suspended

  // Business Information
  businessName: text("business_name"),
  businessAddress: text("business_address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  country: text("country").default("US"),
  businessPhone: text("business_phone"),
  businessEmail: text("business_email"),
  website: text("website"),
  businessDescription: text("business_description"),
  businessType: text("business_type"),

  // Online Presence / Social Media
  facebook: text("facebook"),
  instagram: text("instagram"),
  googleBusiness: text("google_business"),
  otherListings: text("other_listings"),

  // Ownership
  ownerName: text("owner_name"),
  ownerContact: text("owner_contact"),

  // Documents (stored as object-storage URLs)
  businessLicense: text("business_license"),
  certifications: text("certifications").array(),
  licenses: text("licenses").array(),
  insurance: text("insurance"),
  taxDocs: text("tax_docs").array(),

  // Location photos (required)
  locationPhotos: text("location_photos").array(),

  // Legal certification
  certifiedAccurate: boolean("certified_accurate").notNull().default(false),

  // Admin fields
  adminNotes: text("admin_notes"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewedById: integer("reviewed_by_id"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type PaygProviderApplication = typeof paygProviderApplicationsTable.$inferSelect;
export type InsertPaygProviderApplication = typeof paygProviderApplicationsTable.$inferInsert;
