import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const visionGoalsTable = pgTable("vision_goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  myWhy: text("my_why"),
  myVision: text("my_vision"),
  goal7day: text("goal_7day"),
  goal14day: text("goal_14day"),
  goal30day: text("goal_30day"),
  goal90day: text("goal_90day"),
  goal6month: text("goal_6month"),
  goal12month: text("goal_12month"),
  income7day: text("income_7day"),
  income14day: text("income_14day"),
  income30day: text("income_30day"),
  income90day: text("income_90day"),
  income6month: text("income_6month"),
  income12month: text("income_12month"),
  financialProblems: text("financial_problems"),
  ultimateDream: text("ultimate_dream"),
  confidenceStatement: text("confidence_statement"),
  accountability: text("accountability"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertVisionGoalSchema = createInsertSchema(visionGoalsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertVisionGoal = z.infer<typeof insertVisionGoalSchema>;
export type VisionGoal = typeof visionGoalsTable.$inferSelect;
