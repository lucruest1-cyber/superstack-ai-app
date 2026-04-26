import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { type Response } from "express";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import * as db from "./db";
import { systemRouter } from "./_core/systemRouter";
import { COOKIE_NAME } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM, RateLimitError } from "./_core/llm";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

export const appRouter = router({
  system: systemRouter,

  // ============= AUTH ROUTES =============
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      (ctx.res as Response).clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============= USER PREFERENCES =============
  user: router({
    getPreferences: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      return {
        unitPreference: user?.unitPreference || "lbs",
        environmentPreference: user?.environmentPreference || "gym",
        genderDemoPreference: user?.genderDemoPreference || "neutral",
      };
    }),

    updatePreferences: protectedProcedure
      .input(
        z.object({
          unitPreference: z.enum(["lbs", "kg"]).optional(),
          environmentPreference: z.enum(["gym", "home", "hotel", "outside"]).optional(),
          genderDemoPreference: z.enum(["male", "female", "neutral"]).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.updateUserPreferences(ctx.user.id, input);
        return { success: true };
      }),
  }),

  // ============= EXERCISE LIBRARY =============
  exercises: router({
    listByEnvironment: protectedProcedure
      .input(z.object({ environment: z.enum(["gym", "home", "hotel", "outside"]) }))
      .query(async ({ input }) => {
        return await db.getExercisesByEnvironment(input.environment);
      }),

    listAll: protectedProcedure.query(async () => {
      return await db.getAllExercises();
    }),
  }),

  // ============= WORKOUT LOGGING =============
  workouts: router({
    log: protectedProcedure
      .input(
        z.object({
          exerciseName: z.string().min(1),
          environment: z.enum(["gym", "home", "hotel", "outside"]),
          sets: z.number().int().positive(),
          reps: z.number().int().positive(),
          weight: z.number().nonnegative(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const id = await db.createWorkoutLog({
          userId: ctx.user.id,
          name: input.exerciseName,
          environment: input.environment,
          sets: input.sets,
          reps: input.reps,
          weightLbs: input.weight,
          notes: input.notes,
        });
        return { success: true, id };
      }),

    logBatch: protectedProcedure
      .input(
        z.array(
          z.object({
            exerciseName: z.string().min(1),
            environment: z.enum(["gym", "home", "hotel", "outside"]),
            sets: z.number().int().positive(),
            reps: z.number().int().positive(),
            weight: z.number().nonnegative(),
            notes: z.string().optional(),
          })
        ).min(1).max(20)
      )
      .mutation(async ({ ctx, input }) => {
        const ids = await Promise.all(
          input.map((ex) =>
            db.createWorkoutLog({
              userId: ctx.user.id,
              name: ex.exerciseName,
              environment: ex.environment,
              sets: ex.sets,
              reps: ex.reps,
              weightLbs: ex.weight,
              notes: ex.notes,
            })
          )
        );
        return { success: true, count: ids.length };
      }),

    getToday: protectedProcedure.query(async ({ ctx }) => {
      const today = new Date().toISOString().split("T")[0];
      return await db.getWorkoutLogsByDate(ctx.user.id, today);
    }),

    getHistory: protectedProcedure
      .input(z.object({ limit: z.number().int().positive().default(50) }))
      .query(async ({ ctx, input }) => {
        return await db.getWorkoutLogsByUser(ctx.user.id, input.limit);
      }),
  }),

  // ============= PHOTO CALORIE TRACKER =============
  photoTracker: router({
    uploadAndAnalyze: protectedProcedure
      .input(
        z.object({
          imageBase64: z.string(),
          mimeType: z.string().default("image/jpeg"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Check daily limit (10 photos per day)
        const photoCount = await db.countPhotosLoggedToday(ctx.user.id);
        if (photoCount >= 10) {
          throw new Error("Daily photo limit (10) reached");
        }

        // Upload image to S3
        const imageBuffer = Buffer.from(input.imageBase64, "base64");
        const fileKey = `photos/${ctx.user.id}/${nanoid()}.jpg`;
        const { url: photoUrl } = await storagePut(fileKey, imageBuffer, input.mimeType);

        // Analyze with Gemini
        let analysisResponse;
        try {
          analysisResponse = await invokeLLM({
            messages: [
              {
                role: "system",
                content:
                  "You are a nutrition expert. Analyze the food in the image and provide detailed nutritional information. Return ONLY valid JSON with the following structure: {foodDescription: string, calories: number, protein: number (grams), carbs: number (grams), fat: number (grams), confidence: 'high' | 'medium' | 'low'}",
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Analyze this food image and provide nutritional information.",
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: photoUrl,
                      detail: "high",
                    },
                  },
                ],
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "nutrition_analysis",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    foodDescription: { type: "string" },
                    calories: { type: "number" },
                    protein: { type: "number" },
                    carbs: { type: "number" },
                    fat: { type: "number" },
                    confidence: { type: "string", enum: ["high", "medium", "low"] },
                  },
                  required: ["foodDescription", "calories", "protein", "carbs", "fat", "confidence"],
                  additionalProperties: false,
                },
              },
            },
          });
        } catch (err) {
          if (err instanceof RateLimitError) {
            throw new TRPCError({
              code: "TOO_MANY_REQUESTS",
              message: `Rate limited. Retry after ${err.retryAfterSeconds}s`,
            });
          }
          throw err;
        }

        const analysisText = analysisResponse.choices[0]?.message.content || "{}";
        const analysis = JSON.parse(analysisText);

        // Save to database
        await db.createPhotoCaloricLog({
          userId: ctx.user.id,
          photoUrl,
          foodDescription: analysis.foodDescription,
          calories: analysis.calories,
          protein: analysis.protein,
          carbs: analysis.carbs,
          fat: analysis.fat,
          analysisData: analysis,
        });

        // Update daily summary
        const today = new Date().toISOString().split("T")[0];
        const logs = await db.getPhotoCaloricLogsByDate(ctx.user.id, today);
        const totals = {
          calories: logs.reduce((sum, log) => sum + (log.calories || 0), 0),
          protein: logs.reduce((sum, log) => sum + (log.protein || 0), 0),
          carbs: logs.reduce((sum, log) => sum + (log.carbs || 0), 0),
          fat: logs.reduce((sum, log) => sum + (log.fat || 0), 0),
        };
        await db.updateDailyCalorieSummary(ctx.user.id, today, totals);

        return {
          success: true,
          analysis,
          photoUrl,
        };
      }),

    getToday: protectedProcedure.query(async ({ ctx }) => {
      const today = new Date().toISOString().split("T")[0];
      return await db.getPhotoCaloricLogsByDate(ctx.user.id, today);
    }),

    getHistory: protectedProcedure
      .input(z.object({ limit: z.number().int().positive().default(100) }))
      .query(async ({ ctx, input }) => {
        return await db.getPhotoCaloricLogsByUser(ctx.user.id, input.limit);
      }),

    getDailySummary: protectedProcedure
      .input(z.object({ date: z.string() }))
      .query(async ({ ctx, input }) => {
        return await db.getDailyCalorieSummary(ctx.user.id, input.date);
      }),

    getRemainingPhotos: protectedProcedure.query(async ({ ctx }) => {
      const count = await db.countPhotosLoggedToday(ctx.user.id);
      return { remaining: Math.max(0, 10 - count), total: 10 };
    }),
  }),
});

export type AppRouter = typeof appRouter;
