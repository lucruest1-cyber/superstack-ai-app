import { eq, and, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  exercises, 
  workoutLogs, 
  photoCaloricLogs, 
  dailyCalorieSummary,
  betaTesters,
  InsertWorkoutLog,
  InsertPhotoCaloricLog
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============= USER FUNCTIONS =============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserPreferences(userId: number, preferences: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) return;

  await db.update(users).set(preferences).where(eq(users.id, userId));
}

// ============= EXERCISE FUNCTIONS =============

export async function getExercisesByEnvironment(environment: string) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(exercises);
  return result.filter(ex => {
    const envs = Array.isArray(ex.environments) ? ex.environments : JSON.parse(ex.environments as string);
    return envs.includes(environment);
  });
}

export async function getAllExercises() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(exercises);
}

// ============= WORKOUT LOG FUNCTIONS =============

export async function createWorkoutLog(log: InsertWorkoutLog) {
  const db = await getDb();
  if (!db) return;

  const result = await db.insert(workoutLogs).values(log);
  return result;
}

export async function getWorkoutLogsByUser(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db.select()
    .from(workoutLogs)
    .where(eq(workoutLogs.userId, userId))
    .orderBy((t) => t.loggedAt)
    .limit(limit);
}

export async function getWorkoutLogsByDate(userId: number, date: string) {
  const db = await getDb();
  if (!db) return [];

  const startOfDay = new Date(`${date}T00:00:00Z`);
  const endOfDay = new Date(`${date}T23:59:59Z`);

  return await db.select()
    .from(workoutLogs)
    .where(
      and(
        eq(workoutLogs.userId, userId),
        gte(workoutLogs.loggedAt, startOfDay),
        lte(workoutLogs.loggedAt, endOfDay)
      )
    );
}

// ============= PHOTO CALORIE LOG FUNCTIONS =============

export async function createPhotoCaloricLog(log: InsertPhotoCaloricLog) {
  const db = await getDb();
  if (!db) return;

  // Set expiration to 7 days from now
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  const logWithExpiry = {
    ...log,
    expiresAt,
  };

  return await db.insert(photoCaloricLogs).values(logWithExpiry);
}

export async function getPhotoCaloricLogsByUser(userId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  return await db.select()
    .from(photoCaloricLogs)
    .where(
      and(
        eq(photoCaloricLogs.userId, userId),
        gte(photoCaloricLogs.expiresAt, now)
      )
    )
    .orderBy((t) => t.loggedAt)
    .limit(limit);
}

export async function getPhotoCaloricLogsByDate(userId: number, date: string) {
  const db = await getDb();
  if (!db) return [];

  const startOfDay = new Date(`${date}T00:00:00Z`);
  const endOfDay = new Date(`${date}T23:59:59Z`);
  const now = new Date();

  return await db.select()
    .from(photoCaloricLogs)
    .where(
      and(
        eq(photoCaloricLogs.userId, userId),
        gte(photoCaloricLogs.loggedAt, startOfDay),
        lte(photoCaloricLogs.loggedAt, endOfDay),
        gte(photoCaloricLogs.expiresAt, now)
      )
    );
}

export async function countPhotosLoggedToday(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const result = await db.select()
    .from(photoCaloricLogs)
    .where(
      and(
        eq(photoCaloricLogs.userId, userId),
        gte(photoCaloricLogs.loggedAt, today),
        lte(photoCaloricLogs.loggedAt, tomorrow)
      )
    );

  return result.length;
}

// ============= DAILY SUMMARY FUNCTIONS =============

export async function getDailyCalorieSummary(userId: number, date: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select()
    .from(dailyCalorieSummary)
    .where(
      and(
        eq(dailyCalorieSummary.userId, userId),
        eq(dailyCalorieSummary.date, date)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateDailyCalorieSummary(userId: number, date: string, totals: {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}) {
  const db = await getDb();
  if (!db) return;

  const existing = await getDailyCalorieSummary(userId, date);

  if (existing) {
    await db.update(dailyCalorieSummary)
      .set({
        totalCalories: totals.calories,
        totalProtein: totals.protein.toString(),
        totalCarbs: totals.carbs.toString(),
        totalFat: totals.fat.toString(),
      })
      .where(
        and(
          eq(dailyCalorieSummary.userId, userId),
          eq(dailyCalorieSummary.date, date)
        )
      );
  } else {
    await db.insert(dailyCalorieSummary).values({
      userId,
      date,
      totalCalories: totals.calories,
      totalProtein: totals.protein.toString(),
      totalCarbs: totals.carbs.toString(),
      totalFat: totals.fat.toString(),
      photoCount: 0,
    });
  }
}

// ============= BETA TESTER FUNCTIONS =============

export async function isBetaTesterWhitelisted(email: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db.select()
    .from(betaTesters)
    .where(eq(betaTesters.email, email))
    .limit(1);

  return result.length > 0;
}

export async function activateBetaTester(email: string) {
  const db = await getDb();
  if (!db) return;

  await db.update(betaTesters)
    .set({
      status: "active",
      activatedAt: new Date(),
    })
    .where(eq(betaTesters.email, email));
}
