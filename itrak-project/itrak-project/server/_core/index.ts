// Firebase Admin must initialize before any other server imports
import "../firebase-admin";

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import express from "express";
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
  })
);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`[server] running on http://localhost:${PORT}`);
});
