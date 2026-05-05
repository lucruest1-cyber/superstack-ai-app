import { publicProcedure, router } from "./trpc";
import { z } from "zod";
import { exercisesDatabase } from "../data/exercises";

export const systemRouter = router({
  health: publicProcedure.query(() => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  })),

  workoutGenerator: publicProcedure
    .input(z.object({ environment: z.string() }))
    .query(({ input }) => {
      const filtered = exercisesDatabase.filter(ex =>
        ex.environments.includes(input.environment)
      );

      if (filtered.length === 0) return [];

      const selected: typeof exercisesDatabase = [];
      const muscleCount: Record<string, number> = {};

      for (const ex of filtered) {
        if (selected.length >= 10) break;

        const needsMuscle = ex.muscleGroups.some(mg => (muscleCount[mg] || 0) < 2);

        if (needsMuscle || selected.length < 5) {
          selected.push(ex);
          ex.muscleGroups.forEach(mg => {
            muscleCount[mg] = (muscleCount[mg] || 0) + 1;
          });
        }
      }

      return selected;
    }),
});
