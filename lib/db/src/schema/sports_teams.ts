import { pgTable, serial, integer, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const sportsTeamsTable = pgTable("sports_teams", {
  id: serial("id").primaryKey(),
  coachUserId: integer("coach_user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  teamName: text("team_name").notNull(),
  sport: text("sport").notNull(),
  sportOther: text("sport_other"),
  teamType: text("team_type").notNull(),
  ageGroupType: text("age_group_type").notNull().default("age_group"),
  ageGroup: text("age_group").notNull(),
  isHeadCoach: boolean("is_head_coach").notNull().default(false),
  isPrimaryContact: boolean("is_primary_contact").notNull().default(false),
  tin: text("tin"),
  approvalStatus: text("approval_status").notNull().default("pending"),
  adminNotes: text("admin_notes"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewedByUserId: integer("reviewed_by_user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});
