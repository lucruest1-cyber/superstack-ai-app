import { exercisesDatabase } from "../data/exercises";

export function generateWorkout(environment: string): typeof exercisesDatabase {
  const filtered = exercisesDatabase.filter(ex => ex.environments.includes(environment));

  if (filtered.length === 0) return [];

  const workout: typeof exercisesDatabase = [];
  const muscleGroupCount: Record<string, number> = {};

  for (const exercise of filtered) {
    if (workout.length >= 10) break;

    const needsMuscle = exercise.muscleGroups.some(mg => (muscleGroupCount[mg] || 0) < 2);

    if (needsMuscle || workout.length < 5) {
      workout.push(exercise);
      exercise.muscleGroups.forEach(mg => {
        muscleGroupCount[mg] = (muscleGroupCount[mg] || 0) + 1;
      });
    }
  }

  return workout;
}
