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
import Stripe from "stripe";

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
        console.log("[upload] START userId:", ctx.user.id, "imageBase64 length:", input.imageBase64.length, "mimeType:", input.mimeType);

        // Check daily limit (10 photos per day)
        const photoCount = await db.countPhotosLoggedToday(ctx.user.id);
        console.log("[upload] quota check — used:", photoCount, "/ 10");
        if (photoCount >= 10) {
          console.log("[upload] quota exceeded, rejecting");
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "You've reached your daily photo limit of 10. Please try again tomorrow.",
          });
        }
        console.log("[upload] quota OK, proceeding");

        // Upload image to S3
        const imageBuffer = Buffer.from(input.imageBase64, "base64");
        const ext = input.mimeType === "image/png" ? "png" : input.mimeType === "image/gif" ? "gif" : input.mimeType === "image/webp" ? "webp" : "jpg";
        const fileKey = `photos/${ctx.user.id}/${nanoid()}.${ext}`;
        console.log("[upload] uploading to storage, key:", fileKey, "bytes:", imageBuffer.length);
        const { url: photoUrl } = await storagePut(fileKey, imageBuffer, input.mimeType);
        console.log("[upload] storage upload done, photoUrl:", photoUrl);

        // Analyze with Claude
        let analysisResponse;
        try {
          console.log("[upload] calling invokeLLM");
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
        } catch (err: any) {
          console.error("[upload] invokeLLM threw:", err?.name, err?.message);
          if (err instanceof RateLimitError) {
            throw new TRPCError({
              code: "TOO_MANY_REQUESTS",
              message: `Rate limited. Retry after ${err.retryAfterSeconds}s`,
            });
          }
          throw err;
        }

        const analysisText = analysisResponse.choices[0]?.message.content || "{}";
        console.log("[upload] raw LLM response:", analysisText.slice(0, 300));
        let analysis: any;
        try {
          analysis = JSON.parse(analysisText);
        } catch (parseErr: any) {
          console.error("[upload] JSON.parse failed:", parseErr.message, "— raw text:", analysisText.slice(0, 500));
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI returned invalid JSON: " + analysisText.slice(0, 100) });
        }
        console.log("[upload] parsed analysis:", JSON.stringify(analysis));

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

    deleteLog: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await db.deletePhotoCaloricLog(ctx.user.id, input.id);
        const today = new Date().toISOString().split("T")[0];
        const logs = await db.getPhotoCaloricLogsByDate(ctx.user.id, today);
        const totals = {
          calories: logs.reduce((s, l) => s + (l.calories || 0), 0),
          protein:  logs.reduce((s, l) => s + (l.protein  || 0), 0),
          carbs:    logs.reduce((s, l) => s + (l.carbs    || 0), 0),
          fat:      logs.reduce((s, l) => s + (l.fat      || 0), 0),
        };
        await db.updateDailyCalorieSummary(ctx.user.id, today, totals);
        return { success: true };
      }),

    getRemainingPhotos: protectedProcedure.query(async ({ ctx }) => {
      const count = await db.countPhotosLoggedToday(ctx.user.id);
      return { remaining: Math.max(0, 10 - count), total: 10 };
    }),
  }),

  // ============= STRIPE PAYMENTS =============
  stripe: router({
    createCheckoutSession: protectedProcedure
      .input(z.object({ priceId: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const secretKey = process.env.STRIPE_SECRET_KEY;
        if (!secretKey) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe is not configured" });
        }

        const stripe = new Stripe(secretKey, { apiVersion: "2025-04-30.basil" });

        const baseUrl = process.env.VITE_APP_URL || "https://superstack-ai-app.vercel.app";

        // Determine mode by inspecting the price object
        const price = await stripe.prices.retrieve(input.priceId);
        const mode = price.recurring ? "subscription" : "payment";

        const session = await stripe.checkout.sessions.create({
          mode,
          line_items: [{ price: input.priceId, quantity: 1 }],
          customer_email: ctx.user.email ?? undefined,
          success_url: `${baseUrl}/dashboard?upgraded=true`,
          cancel_url: `${baseUrl}/paywall`,
          metadata: { userId: ctx.user.id },
        });

        if (!session.url) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No checkout URL returned" });
        }

        return { url: session.url };
      }),
  }),
});

export type AppRouter = typeof appRouter;
