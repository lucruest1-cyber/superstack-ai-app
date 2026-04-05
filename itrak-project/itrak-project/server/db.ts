import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";

// ============= TYPES =============

export interface UserRecord {
  id: string;           // Firestore doc ID (same as Firebase Auth UID)
  openId: string;       // Google UID from Firebase Auth
  name?: string | null;
  email?: string | null;
  loginMethod?: string | null;
  role: "user" | "admin";
  unitPreference: "lbs" | "kg";
  environmentPreference: "gym" | "home" | "hotel" | "outside";
  genderDemoPreference: "male" | "female" | "neutral";
  lastSignedIn?: Date | null;
  createdAt?: Date;
}

export interface WorkoutLogRecord {
  id?: string;
  userId: string;
  exerciseId: string;
  environment: "gym" | "home" | "hotel" | "outside";
  sets?: number | null;
  reps?: number | null;
  weightLbs?: number | null;
  durationSec?: number | null;
  notes?: string | null;
  loggedAt: Date;
}

export interface PhotoCaloricLogRecord {
  id?: string;
  userId: string;
  photoUrl?: string | null;
  mealDescription?: string | null;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
  aiResponse?: Record<string, unknown> | null;
  loggedAt: Date;
  expiresAt: Date;
}

export interface DailyCalorieSummaryRecord {
  id?: string;
  userId: string;
  date: string;         // "YYYY-MM-DD"
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  photoCount: number;
}

export interface ExerciseRecord {
  id?: string;
  name: string;
  description?: string | null;
  environments: string[];
  muscleGroups?: string[] | null;
  difficulty: "beginner" | "intermediate" | "advanced";
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
}

// ============= HELPERS =============

function db() {
  return getFirestore();
}

function toDate(ts: unknown): Date {
  if (ts instanceof Timestamp) return ts.toDate();
  if (ts instanceof Date) return ts;
  return new Date(ts as string);
}

function docToUser(id: string, data: FirebaseFirestore.DocumentData): UserRecord {
  return {
    ...data,
    id,
    lastSignedIn: data.lastSignedIn ? toDate(data.lastSignedIn) : null,
    createdAt: data.createdAt ? toDate(data.createdAt) : undefined,
  } as UserRecord;
}

// ============= USER FUNCTIONS =============

export async function upsertUser(user: Partial<UserRecord> & { openId: string }): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");

  const col = db().collection("users");
  const snapshot = await col.where("openId", "==", user.openId).limit(1).get();

  const now = new Date();
  const payload: Record<string, unknown> = {
    openId: user.openId,
    lastSignedIn: now,
  };

  if (user.name !== undefined)                   payload.name = user.name ?? null;
  if (user.email !== undefined)                  payload.email = user.email ?? null;
  if (user.loginMethod !== undefined)            payload.loginMethod = user.loginMethod ?? null;
  if (user.role !== undefined)                   payload.role = user.role;
  if (user.unitPreference !== undefined)         payload.unitPreference = user.unitPreference;
  if (user.environmentPreference !== undefined)  payload.environmentPreference = user.environmentPreference;
  if (user.genderDemoPreference !== undefined)   payload.genderDemoPreference = user.genderDemoPreference;

  if (snapshot.empty) {
    payload.createdAt = now;
    payload.role = payload.role ?? "user";
    payload.unitPreference = payload.unitPreference ?? "lbs";
    payload.environmentPreference = payload.environmentPreference ?? "gym";
    payload.genderDemoPreference = payload.genderDemoPreference ?? "neutral";
    await col.add(payload);
  } else {
    await snapshot.docs[0].ref.set(payload, { merge: true });
  }
}

export async function getUserByOpenId(openId: string): Promise<UserRecord | undefined> {
  const snapshot = await db().collection("users")
    .where("openId", "==", openId)
    .limit(1)
    .get();
  if (snapshot.empty) return undefined;
  const doc = snapshot.docs[0];
  return docToUser(doc.id, doc.data());
}

export async function getUserById(id: string): Promise<UserRecord | undefined> {
  const doc = await db().collection("users").doc(id).get();
  if (!doc.exists) return undefined;
  return docToUser(doc.id, doc.data()!);
}

export async function updateUserPreferences(userId: string, preferences: Partial<UserRecord>): Promise<void> {
  await db().collection("users").doc(userId).set(preferences, { merge: true });
}

// ============= EXERCISE FUNCTIONS =============

export async function getExercisesByEnvironment(environment: string): Promise<ExerciseRecord[]> {
  const snapshot = await db().collection("exercises")
    .where("environments", "array-contains", environment)
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExerciseRecord));
}

export async function getAllExercises(): Promise<ExerciseRecord[]> {
  const snapshot = await db().collection("exercises").get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExerciseRecord));
}

// ============= WORKOUT LOG FUNCTIONS =============

export async function createWorkoutLog(log: Omit<WorkoutLogRecord, "id">): Promise<string> {
  const ref = await db().collection("workoutLogs").add({
    ...log,
    loggedAt: log.loggedAt ?? new Date(),
  });
  return ref.id;
}

export async function getWorkoutLogsByUser(userId: string, limit: number = 50): Promise<WorkoutLogRecord[]> {
  const snapshot = await db().collection("workoutLogs")
    .where("userId", "==", userId)
    .orderBy("loggedAt", "desc")
    .limit(limit)
    .get();
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    loggedAt: toDate(doc.data().loggedAt),
  } as WorkoutLogRecord));
}

export async function getWorkoutLogsByDate(userId: string, date: string): Promise<WorkoutLogRecord[]> {
  const startOfDay = new Date(`${date}T00:00:00Z`);
  const endOfDay = new Date(`${date}T23:59:59Z`);

  const snapshot = await db().collection("workoutLogs")
    .where("userId", "==", userId)
    .where("loggedAt", ">=", startOfDay)
    .where("loggedAt", "<=", endOfDay)
    .orderBy("loggedAt", "desc")
    .get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    loggedAt: toDate(doc.data().loggedAt),
  } as WorkoutLogRecord));
}

// ============= PHOTO CALORIE LOG FUNCTIONS =============

export async function createPhotoCaloricLog(log: Omit<PhotoCaloricLogRecord, "id" | "expiresAt">): Promise<string> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const ref = await db().collection("photoCaloricLogs").add({
    ...log,
    loggedAt: log.loggedAt ?? new Date(),
    expiresAt,
  });
  return ref.id;
}

export async function getPhotoCaloricLogsByUser(userId: string, limit: number = 100): Promise<PhotoCaloricLogRecord[]> {
  const now = new Date();
  const snapshot = await db().collection("photoCaloricLogs")
    .where("userId", "==", userId)
    .where("expiresAt", ">", now)
    .orderBy("expiresAt", "asc")
    .orderBy("loggedAt", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    loggedAt: toDate(doc.data().loggedAt),
    expiresAt: toDate(doc.data().expiresAt),
  } as PhotoCaloricLogRecord));
}

export async function getPhotoCaloricLogsByDate(userId: string, date: string): Promise<PhotoCaloricLogRecord[]> {
  const startOfDay = new Date(`${date}T00:00:00Z`);
  const endOfDay = new Date(`${date}T23:59:59Z`);
  const now = new Date();

  const snapshot = await db().collection("photoCaloricLogs")
    .where("userId", "==", userId)
    .where("loggedAt", ">=", startOfDay)
    .where("loggedAt", "<=", endOfDay)
    .where("expiresAt", ">", now)
    .orderBy("loggedAt", "desc")
    .get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    loggedAt: toDate(doc.data().loggedAt),
    expiresAt: toDate(doc.data().expiresAt),
  } as PhotoCaloricLogRecord));
}

export async function countPhotosLoggedToday(userId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const snapshot = await db().collection("photoCaloricLogs")
    .where("userId", "==", userId)
    .where("loggedAt", ">=", today)
    .where("loggedAt", "<", tomorrow)
    .get();

  return snapshot.size;
}

// ============= DAILY SUMMARY FUNCTIONS =============

export async function getDailyCalorieSummary(userId: string, date: string): Promise<DailyCalorieSummaryRecord | null> {
  const snapshot = await db().collection("dailyCalorieSummary")
    .where("userId", "==", userId)
    .where("date", "==", date)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as DailyCalorieSummaryRecord;
}

export async function updateDailyCalorieSummary(
  userId: string,
  date: string,
  totals: { calories: number; protein: number; carbs: number; fat: number }
): Promise<void> {
  const existing = await getDailyCalorieSummary(userId, date);

  const payload = {
    userId,
    date,
    totalCalories: totals.calories,
    totalProtein: totals.protein,
    totalCarbs: totals.carbs,
    totalFat: totals.fat,
  };

  if (existing?.id) {
    await db().collection("dailyCalorieSummary").doc(existing.id).set(payload, { merge: true });
  } else {
    await db().collection("dailyCalorieSummary").add({ ...payload, photoCount: 0 });
  }
}

// ============= BETA TESTER FUNCTIONS =============

export async function isBetaTesterWhitelisted(email: string): Promise<boolean> {
  const snapshot = await db().collection("betaTesters")
    .where("email", "==", email)
    .limit(1)
    .get();
  return !snapshot.empty;
}

export async function activateBetaTester(email: string): Promise<void> {
  const snapshot = await db().collection("betaTesters")
    .where("email", "==", email)
    .limit(1)
    .get();
  if (snapshot.empty) return;
  await snapshot.docs[0].ref.set({ status: "active", activatedAt: new Date() }, { merge: true });
}
