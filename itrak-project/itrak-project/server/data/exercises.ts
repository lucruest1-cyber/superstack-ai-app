import exercisesData from "./exercises.json";

export interface Exercise {
  id: string;
  name: string;
  category: string;
  muscleGroups: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  environments: string[];
  formTips: string;
  commonMistakes: string;
  /** Optional MP4 demo loop (320px wide h264). Served from /demo-gifs/<slug>.mp4 */
  demoUrl?: string;
  /** Optional poster image for the demo (used as inline thumbnail and video poster) */
  posterUrl?: string;
}

export const exercisesDatabase: Exercise[] = exercisesData.exercises as Exercise[];

export function getExercisesByEnvironment(environment: string): Exercise[] {
  return exercisesDatabase.filter(ex => ex.environments.includes(environment));
}

export function getExercisesByDifficulty(difficulty: string): Exercise[] {
  return exercisesDatabase.filter(ex => ex.difficulty === difficulty);
}

export function searchExercises(query: string): Exercise[] {
  const lowerQuery = query.toLowerCase();
  return exercisesDatabase.filter(ex =>
    ex.name.toLowerCase().includes(lowerQuery) ||
    ex.category.toLowerCase().includes(lowerQuery) ||
    ex.muscleGroups.some(mg => mg.toLowerCase().includes(lowerQuery))
  );
}
