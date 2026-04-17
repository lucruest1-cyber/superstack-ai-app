import { initTRPC, TRPCError } from "@trpc/server";
import { getAuth } from "firebase-admin/auth";
import { type Request, type Response } from "express";
import * as db from "../db";
import superjson from "superjson";

export interface Context {
  req: Request;
  res: Response;
  user: Awaited<ReturnType<typeof db.getUserByOpenId>> | null;
}

export async function createContext({
  req,
  res,
}: {
  req: Request;
  res: Response;
}): Promise<Context> {
  let user: Context["user"] = null;

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (token) {
    try {
      const decoded = await getAuth().verifyIdToken(token);
      user = await db.getUserByOpenId(decoded.uid) ?? null;

      if (!user) {
        // First sign-in — create the user record
        await db.upsertUser({
          openId: decoded.uid,
          email: decoded.email ?? null,
          name: decoded.name ?? null,
          loginMethod: "google",
        });
        user = await db.getUserByOpenId(decoded.uid) ?? null;
      }
    } catch {
      // Invalid or expired token — user stays null
    }
  }

  return { req, res, user };
}

const t = initTRPC.context<Context>().create({ transformer: superjson });

export const router             = t.router;
export const publicProcedure    = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
