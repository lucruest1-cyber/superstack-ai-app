import type { IncomingMessage, ServerResponse } from "http";

type Handler = (req: IncomingMessage, res: ServerResponse) => void;

let handler: Handler | null = null;
let initError: Error | null = null;

const initPromise = import("../itrak-project/itrak-project/server/_core/app")
  .then((mod) => { handler = mod.default as Handler; })
  .catch((err) => {
    initError = err instanceof Error ? err : new Error(String(err));
    console.error("[api] initialization failed:", initError.message);
  });

export default async function(req: IncomingMessage, res: ServerResponse): Promise<void> {
  await initPromise;
  if (initError || !handler) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      error: "Server initialization failed",
      message: initError?.message ?? "Unknown error",
    }));
    return;
  }
  handler(req, res);
}
