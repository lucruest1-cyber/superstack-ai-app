import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow and profile management
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  unitPreference: mysqlEnum("unitPreference", ["lbs", "kg"]).default("lbs").notNull(),
  environmentPreference: mysqlEnum("environmentPreference", ["gym", "home", "hotel", "outside"]).default("gym").notNull(),
  genderDemoPreference: mysqlEnum("genderDemoPreference", ["male", "female", "neutral"]).default("neutral").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Exercise library table with exercise definitions
 */
export const exercises = mysqlTable("exercises", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  demoUrl: varchar("demoUrl", { length: 500 }),
  environments: json("environments").$type<string[]>().notNull(), // ["gym", "home", "hotel", "outside"]
  muscleGroups: json("muscleGroups").$type<string[]>().notNull(), // ["chest", "back", "legs", etc.]
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced"]).default("intermediate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = typeof exercises.$inferInsert;

/**
 * Workout logs table - tracks individual workouts
 */
export const workoutLogs = mysqlTable("workoutLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  exerciseName: varchar("exerciseName", { length: 255 }).notNull(),
  environment: mysqlEnum("environment", ["gym", "home", "hotel", "outside"]).notNull(),
  sets: int("sets").notNull(),
  reps: int("reps").notNull(),
  weight: decimal("weight", { precision: 8, scale: 2 }).notNull(), // in lbs or kg based on user preference
  notes: text("notes"),
  loggedAt: timestamp("loggedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WorkoutLog = typeof workoutLogs.$inferSelect;
export type InsertWorkoutLog = typeof workoutLogs.$inferInsert;

/**
 * Photo calorie tracker - stores food photos and AI analysis
 */
export const photoCaloricLogs = mysqlTable("photoCaloricLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  photoUrl: varchar("photoUrl", { length: 500 }).notNull(),
  foodDescription: text("foodDescription"),
  calories: int("calories"),
  protein: decimal("protein", { precision: 8, scale: 2 }),
  carbs: decimal("carbs", { precision: 8, scale: 2 }),
  fat: decimal("fat", { precision: 8, scale: 2 }),
  analysisData: json("analysisData").$type<Record<string, unknown>>(), // Full Gemini API response
  loggedAt: timestamp("loggedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"), // 7-day retention
});

export type PhotoCaloricLog = typeof photoCaloricLogs.$inferSelect;
export type InsertPhotoCaloricLog = typeof photoCaloricLogs.$inferInsert;

/**
 * Daily calorie tracker summary
 */
export const dailyCalorieSummary = mysqlTable("dailyCalorieSummary", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
  totalCalories: int("totalCalories").default(0).notNull(),
  totalProtein: decimal("totalProtein", { precision: 8, scale: 2 }).default("0").notNull(),
  totalCarbs: decimal("totalCarbs", { precision: 8, scale: 2 }).default("0").notNull(),
  totalFat: decimal("totalFat", { precision: 8, scale: 2 }).default("0").notNull(),
  photoCount: int("photoCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DailyCalorieSummary = typeof dailyCalorieSummary.$inferSelect;
export type InsertDailyCalorieSummary = typeof dailyCalorieSummary.$inferInsert;

/**
 * Whitelisted beta testers
 */
export const betaTesters = mysqlTable("betaTesters", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  status: mysqlEnum("status", ["invited", "active", "inactive"]).default("invited").notNull(),
  invitedAt: timestamp("invitedAt").defaultNow().notNull(),
  activatedAt: timestamp("activatedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BetaTester = typeof betaTesters.$inferSelect;
export type InsertBetaTester = typeof betaTesters.$inferInsert;
