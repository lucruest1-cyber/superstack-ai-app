import Anthropic from "@anthropic-ai/sdk";
import axios from "axios";

export class RateLimitError extends Error {
  constructor(public retryAfterSeconds: number) {
    super(`Rate limited. Retry after ${retryAfterSeconds}s`);
    this.name = "RateLimitError";
  }
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });

interface Message {
  role: "system" | "user" | "assistant";
  content:
    | string
    | Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string; detail?: string } }
      >;
}

interface LLMRequest {
  messages: Message[];
  response_format?: {
    type: "json_schema";
    json_schema: { name: string; strict: boolean; schema: object };
  };
}

interface LLMResponse {
  choices: [{ message: { content: string } }];
}

export async function invokeLLM(request: LLMRequest): Promise<LLMResponse> {
  const systemMsg = request.messages.find((m) => m.role === "system");
  const userMsgs  = request.messages.filter((m) => m.role !== "system");

  const systemPrompt =
    typeof systemMsg?.content === "string" ? systemMsg.content : undefined;

  const contentBlocks: Anthropic.MessageParam["content"] = [];

  for (const msg of userMsgs) {
    if (typeof msg.content === "string") {
      contentBlocks.push({ type: "text", text: msg.content });
    } else {
      for (const part of msg.content) {
        if (part.type === "text") {
          contentBlocks.push({ type: "text", text: part.text });
        } else if (part.type === "image_url") {
          // Fetch image bytes from the Firebase Storage public URL
          const res = await axios.get(part.image_url.url, { responseType: "arraybuffer" });
          const mimeType = ((res.headers["content-type"] as string) || "image/jpeg")
            .split(";")[0]
            .trim() as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
          const data = Buffer.from(res.data as ArrayBuffer).toString("base64");
          contentBlocks.push({
            type: "image",
            source: { type: "base64", media_type: mimeType, data },
          });
        }
      }
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY ?? "";
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is not set");
  }

  const MODEL = "claude-sonnet-4-6";
  const loggableBlocks = contentBlocks.map((b) =>
    b.type === "image"
      ? { type: "image", media_type: (b.source as any).media_type, data_bytes: ((b.source as any).data as string).length }
      : b
  );

  console.log("[llm] model:", MODEL);
  console.log("[llm] api_key prefix:", apiKey.slice(0, 10));
  console.log("[llm] request:", JSON.stringify({ system: systemPrompt, content_blocks: loggableBlocks }, null, 2));

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      ...(systemPrompt ? { system: systemPrompt } : {}),
      messages: [{ role: "user", content: contentBlocks }],
    });

    const text =
      response.content[0]?.type === "text" ? response.content[0].text : "";
    console.log("[llm] success, response length:", text.length);
    return { choices: [{ message: { content: text } }] };
  } catch (err: any) {
    console.error("[llm] error name:", err?.name);
    console.error("[llm] error status:", err?.status);
    console.error("[llm] error message:", err?.message);
    console.error("[llm] error headers:", JSON.stringify(err?.headers ?? {}));
    console.error("[llm] error body:", typeof err?.error === "object" ? JSON.stringify(err.error) : err?.error);

    if (err instanceof Anthropic.RateLimitError || err?.status === 429) {
      const header = err?.headers?.["retry-after"];
      const secs = header ? Math.ceil(parseFloat(header)) : 60;
      throw new RateLimitError(isNaN(secs) ? 60 : secs);
    }
    if (err instanceof Anthropic.APIError) {
      throw new Error(`Anthropic API error ${err.status}: ${err.message}`);
    }
    throw err;
  }
}
