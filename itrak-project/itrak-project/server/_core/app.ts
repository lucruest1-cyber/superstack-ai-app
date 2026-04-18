// Firebase Admin must initialize before any other server imports
import "../firebase-admin";

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Loads .env.local in local dev; silently no-ops on Vercel (file absent, process.env already populated)
dotenv.config({ path: resolve(__dirname, "../../.env.local"), override: true });

import express, { type Request, type Response, type NextFunction } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./trpc";

const app = express();

app.use(express.json({ limit: "10mb" }));

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
    onError({ path, error }) {
      console.error(`[trpc] error on ${path ?? "unknown"}:`, error.message);
    },
  })
);

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// JSON error handler — must be last and must have 4 params
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[server] unhandled error:", err);
  res.status(500).json({ error: "Internal server error", message: err.message });
});

export default app;
