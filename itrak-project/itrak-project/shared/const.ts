export const COOKIE_NAME = "itrak_session";

export const ENVIRONMENTS = ["gym", "home", "hotel", "outside"] as const;
export type Environment = (typeof ENVIRONMENTS)[number];

export const UNIT_PREFERENCES = ["lbs", "kg"] as const;
export type UnitPreference = (typeof UNIT_PREFERENCES)[number];

export const GENDER_PREFERENCES = ["male", "female", "neutral"] as const;
export type GenderPreference = (typeof GENDER_PREFERENCES)[number];

export const DIFFICULTY_LEVELS = ["beginner", "intermediate", "advanced"] as const;
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];

export const MUSCLE_GROUPS = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "forearms",
  "legs",
  "quadriceps",
  "hamstrings",
  "glutes",
  "calves",
  "core",
  "abs",
] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const PHOTO_LIMIT_PER_DAY = 10;
export const PHOTO_RETENTION_DAYS = 7;
