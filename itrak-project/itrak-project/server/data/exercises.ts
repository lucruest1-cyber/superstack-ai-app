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
