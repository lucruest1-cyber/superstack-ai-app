// Vercel serverless entry point — re-exports the Express app
// Vercel's @vercel/node runtime wraps this as a serverless function
import app from "../server/_core/app";

export default app;
