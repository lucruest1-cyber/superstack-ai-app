import { router, publicProcedure } from "./trpc";
import { z } from "zod";
import { generateWorkout } from "../utils/workoutGenerator";

export const systemRouter = router({
  health: publicProcedure.query(() => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  })),

  workoutGenerator: publicProcedure
    .input(z.object({ environment: z.string() }))
    .query(({ input }) => {
      return generateWorkout(input.environment);
    }),
});
