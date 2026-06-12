import { pgTable, text, serial, timestamp, integer, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const booksTable = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  slug: text("slug").notNull().unique(),
  authorName: text("author_name").notNull(),
  authorUserId: integer("author_user_id"),
  description: text("description"),
  shortDescription: text("short_description"),
  category: text("category").notNull().default("general"),
  type: text("type").notNull().default("ebook"),
  coverImage: text("cover_image"),
  fileUrl: text("file_url"),
  sampleFileUrl: text("sample_file_url"),
  audioUrl: text("audio_url"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull().default("0"),
  cv: numeric("cv", { precision: 10, scale: 2 }).notNull().default("0"),
  isFree: boolean("is_free").notNull().default(false),
  authorRoyaltyPct: numeric("author_royalty_pct", { precision: 5, scale: 2 }).notNull().default("70"),
  platformFeePct: numeric("platform_fee_pct", { precision: 5, scale: 2 }).notNull().default("30"),
  referralCommissionPct: numeric("referral_commission_pct", { precision: 5, scale: 2 }).notNull().default("10"),
  status: text("status").notNull().default("pending"),
  isFeatured: boolean("is_featured").notNull().default(false),
  isBestSeller: boolean("is_best_seller").notNull().default(false),
  isStaffPick: boolean("is_staff_pick").notNull().default(false),
  totalSales: integer("total_sales").notNull().default(0),
  pageCount: integer("page_count"),
  duration: text("duration"),
  language: text("language").notNull().default("English"),
  tags: text("tags"),
  isbn: text("isbn"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const authorApplicationsTable = pgTable("author_applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  bio: text("bio"),
  website: text("website"),
  socialLinks: text("social_links"),
  writingExperience: text("writing_experience"),
  categories: text("categories"),
  agreedToTerms: boolean("agreed_to_terms").notNull().default(false),
  status: text("status").notNull().default("pending"),
  adminNote: text("admin_note"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewedBy: integer("reviewed_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const bookPurchasesTable = pgTable("book_purchases", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  bookId: integer("book_id").notNull(),
  pricePaid: numeric("price_paid", { precision: 10, scale: 2 }).notNull().default("0"),
  royaltyAmount: numeric("royalty_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  platformAmount: numeric("platform_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  licenseAgreed: boolean("license_agreed").notNull().default(false),
  paymentMethod: text("payment_method"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const bookReadingProgressTable = pgTable("book_reading_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  bookId: integer("book_id").notNull(),
  currentPage: integer("current_page").notNull().default(1),
  totalPages: integer("total_pages"),
  pct: numeric("pct", { precision: 5, scale: 2 }).notNull().default("0"),
  lastReadAt: timestamp("last_read_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const bookRoyaltyOverridesTable = pgTable("book_royalty_overrides", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id"),
  authorUserId: integer("author_user_id"),
  category: text("category"),
  authorRoyaltyPct: numeric("author_royalty_pct", { precision: 5, scale: 2 }).notNull(),
  platformFeePct: numeric("platform_fee_pct", { precision: 5, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBookSchema = createInsertSchema(booksTable).omit({ id: true, createdAt: true, updatedAt: true, totalSales: true });
export type InsertBook = z.infer<typeof insertBookSchema>;
export type Book = typeof booksTable.$inferSelect;

export const insertAuthorApplicationSchema = createInsertSchema(authorApplicationsTable).omit({ id: true, createdAt: true });
export type InsertAuthorApplication = z.infer<typeof insertAuthorApplicationSchema>;
export type AuthorApplication = typeof authorApplicationsTable.$inferSelect;

export const insertBookPurchaseSchema = createInsertSchema(bookPurchasesTable).omit({ id: true, createdAt: true });
export type InsertBookPurchase = z.infer<typeof insertBookPurchaseSchema>;
export type BookPurchase = typeof bookPurchasesTable.$inferSelect;
