import { GoogleGenerativeAI, type Part } from "@google/generative-ai";
import axios from "axios";

export class RateLimitError extends Error {
  constructor(public retryAfterSeconds: number) {
    super(`Rate limited. Retry after ${retryAfterSeconds}s`);
    this.name = "RateLimitError";
  }
}

function extractRetrySeconds(msg: string): number {
  // Primary: parse retryDelay field from Gemini JSON error body
  const primary = msg.match(/"retryDelay":"(\d+\.?\d*)s"/);
  if (primary) return Math.ceil(parseFloat(primary[1]));
  // Fallback: any bare Ns pattern in the message
  const fallback = msg.match(/(\d+\.?\d*)s/);
  if (fallback) return Math.ceil(parseFloat(fallback[1]));
  return 60;
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

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
  // Separate system prompt from user messages
  const systemMsg = request.messages.find((m) => m.role === "system");
  const userMsgs  = request.messages.filter((m) => m.role !== "system");

  const systemInstruction =
    typeof systemMsg?.content === "string" ? systemMsg.content : undefined;

  const parts: Part[] = [];

  for (const msg of userMsgs) {
    if (typeof msg.content === "string") {
      parts.push({ text: msg.content });
    } else {
      for (const part of msg.content) {
        if (part.type === "text") {
          parts.push({ text: part.text });
        } else if (part.type === "image_url") {
          // Fetch image bytes from the public Firebase Storage URL
          const response = await axios.get(part.image_url.url, {
            responseType: "arraybuffer",
          });
          const mimeType =
            (response.headers["content-type"] as string) || "image/jpeg";
          const data = Buffer.from(response.data as ArrayBuffer).toString("base64");
          parts.push({ inlineData: { mimeType, data } });
        }
      }
    }
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    ...(systemInstruction ? { systemInstruction } : {}),
  });

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });
    const text = result.response.text();
    return { choices: [{ message: { content: text } }] };
  } catch (err: any) {
    const msg: string = err?.message ?? "";
    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota")) {
      throw new RateLimitError(extractRetrySeconds(msg));
    }
    throw err;
  }
}
