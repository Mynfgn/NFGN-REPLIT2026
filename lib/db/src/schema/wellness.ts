import { pgTable, text, serial, timestamp, integer, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ── Herb / Mineral / Vitamin reference library ────────────────────────────────
export const healthReferencesTable = pgTable("health_references", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // herb | mineral | vitamin
  name: text("name").notNull(),
  botanicalName: text("botanical_name"),
  category: text("category").notNull(),
  description: text("description").notNull(),
  cautions: text("cautions"),
  commonForms: text("common_forms"),
  sourceUrl: text("source_url"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertHealthReferenceSchema = createInsertSchema(healthReferencesTable).omit({ id: true, createdAt: true });
export type InsertHealthReference = z.infer<typeof insertHealthReferenceSchema>;
export type HealthReference = typeof healthReferencesTable.$inferSelect;

// ── Member health profile ─────────────────────────────────────────────────────
export const healthProfilesTable = pgTable("health_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  // Basic
  age: integer("age"),
  weightLbs: numeric("weight_lbs", { precision: 6, scale: 1 }),
  heightIn: integer("height_in"),
  gender: text("gender"), // male | female | other | prefer_not_to_say
  // Typing
  bloodType: text("blood_type"), // O+ O- A+ A- B+ B- AB+ AB-
  bodyType: text("body_type"), // ectomorph | mesomorph | endomorph
  gutBiome: text("gut_biome"), // diverse | low_diversity | dysbiotic | candida_dominant | inflammatory
  // Goals
  primaryGoal: text("primary_goal"), // weight_loss | muscle_gain | maintenance | detox | energy | sleep | hormonal
  activityLevel: text("activity_level"), // sedentary | light | moderate | active | athlete
  // Health conditions (comma-separated tags)
  conditions: text("conditions"),
  // Disclaimer acknowledgement
  disclaimerAcknowledged: boolean("disclaimer_acknowledged").notNull().default(false),
  disclaimerAcknowledgedAt: timestamp("disclaimer_acknowledged_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertHealthProfileSchema = createInsertSchema(healthProfilesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertHealthProfile = z.infer<typeof insertHealthProfileSchema>;
export type HealthProfile = typeof healthProfilesTable.$inferSelect;

// ── Weight log ────────────────────────────────────────────────────────────────
export const weightLogsTable = pgTable("weight_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  weightLbs: numeric("weight_lbs", { precision: 6, scale: 1 }).notNull(),
  note: text("note"),
  loggedAt: timestamp("logged_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertWeightLogSchema = createInsertSchema(weightLogsTable).omit({ id: true });
export type InsertWeightLog = z.infer<typeof insertWeightLogSchema>;
export type WeightLog = typeof weightLogsTable.$inferSelect;

// ── Water intake log ──────────────────────────────────────────────────────────
export const waterLogsTable = pgTable("water_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  ozAmount: numeric("oz_amount", { precision: 6, scale: 1 }).notNull(),
  loggedAt: timestamp("logged_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertWaterLogSchema = createInsertSchema(waterLogsTable).omit({ id: true });
export type InsertWaterLog = z.infer<typeof insertWaterLogSchema>;
export type WaterLog = typeof waterLogsTable.$inferSelect;