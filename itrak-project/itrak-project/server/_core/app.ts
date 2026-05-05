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
import Stripe from "stripe";
import { handleStripeWebhook } from "../webhooks/stripe";

const app = express();

// Stripe webhook — must be BEFORE express.json() (needs raw body for signature verification)
app.post("/api/webhooks/stripe", express.raw({ type: "application/json" }), async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET not set");
    return res.status(500).json({ error: "Webhook secret not configured" });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, secret);
    await handleStripeWebhook(event);
    res.json({ received: true });
  } catch (err: any) {
    console.error("[webhook] signature verification failed:", err.message);
    res.status(400).json({ error: "Webhook signature verification failed" });
  }
});

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
