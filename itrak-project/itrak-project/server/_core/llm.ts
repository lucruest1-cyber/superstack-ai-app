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

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY environment variable is not set");
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      ...(systemPrompt ? { system: systemPrompt } : {}),
      messages: [{ role: "user", content: contentBlocks }],
    });

    const text =
      response.content[0]?.type === "text" ? response.content[0].text : "";
    return { choices: [{ message: { content: text } }] };
  } catch (err: any) {
    if (err instanceof Anthropic.RateLimitError || err?.status === 429) {
      const header = err?.headers?.["retry-after"];
      const secs = header ? Math.ceil(parseFloat(header)) : 60;
      throw new RateLimitError(isNaN(secs) ? 60 : secs);
    }
    // Surface Anthropic API errors with status code and message
    if (err instanceof Anthropic.APIError) {
      throw new Error(`Anthropic API error ${err.status}: ${err.message}`);
    }
    throw err;
  }
}
