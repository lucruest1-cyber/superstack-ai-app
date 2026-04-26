import { GoogleGenerativeAI, type Part } from "@google/generative-ai";
import axios from "axios";

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

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const text = result.response.text();
  return { choices: [{ message: { content: text } }] };
}
