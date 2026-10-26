import type { IncomingMessage, ServerResponse } from "node:http";
import { buildLeaRequest } from "../src/ai-request.ts";
import { isBusinessState } from "../src/domain.ts";
import type { BusinessState } from "../src/types.ts";

type Options = {
  apiKey: string;
  model?: string;
  fetcher?: (url: string, init: RequestInit) => Promise<Response>;
};
class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
const recentRequests: number[] = [];
function json(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(JSON.stringify(body));
}
function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let size = 0,
      rejected = false;
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => {
      if (rejected) return;
      size += chunk.length;
      if (size > 1000000) {
        rejected = true;
        reject(
          new ApiError(
            413,
            "Business records are too large for this local prototype request.",
          ),
        );
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (rejected) return;
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new ApiError(400, "Invalid JSON request."));
      }
    });
    req.on("error", () =>
      reject(new ApiError(400, "Could not read the request.")),
    );
  });
}
export async function handleApi(
  req: IncomingMessage,
  res: ServerResponse,
  options: Options,
) {
  try {
    const host = req.headers.host ?? "";
    const hostname = new URL("http://" + host).hostname;
    if (!["localhost", "127.0.0.1", "[::1]"].includes(hostname))
      throw new ApiError(403, "This API is limited to the local prototype.");
    const origin = req.headers.origin;
    if (origin && origin !== "http://" + host && origin !== "https://" + host)
      throw new ApiError(403, "Cross-origin requests are not allowed.");
    const path = new URL(req.url ?? "/", "http://" + host).pathname;
    const model = options.model || "gemini-3.8-flash";
    if (path === "/api/health" && req.method === "GET") {
      json(res, 200, {
        provider: "Gemini",
        model,
        configured: Boolean(options.apiKey.trim()),
      });
      return;
    }
    if (path !== "/api/chat") throw new ApiError(404, "API route not found.");
    if (req.method !== "POST") throw new ApiError(405, "Use POST for chat.");
    if (!req.headers["content-type"]?.startsWith("application/json"))
      throw new ApiError(415, "Send an application/json request.");
    const raw = await readBody(req);
    if (!raw || typeof raw !== "object")
      throw new ApiError(400, "Invalid chat request.");
    const body = raw as Record<string, unknown>;
    if (
      typeof body.question !== "string" ||
      !body.question.trim() ||
      body.question.length > 2000
    )
      throw new ApiError(400, "Enter a question of 1–2,000 characters.");
    if (body.business !== null && !isBusinessState(body.business))
      throw new ApiError(400, "The supplied business records are invalid.");
    if (
      !Array.isArray(body.history) ||
      body.history.length > 8 ||
      !body.history.every(
        (m) =>
          m &&
          ["user", "lea"].includes(m.role) &&
          typeof m.text === "string" &&
          m.text.length <= 4000,
      )
    )
      throw new ApiError(400, "Invalid conversation history.");
    if (!options.apiKey.trim())
      throw new ApiError(
        503,
        "Add GEMINI_API_KEY to the server .env file and restart the app to enable LEA.",
      );
    const now = Date.now();
    while (recentRequests.length && recentRequests[0] < now - 60000)
      recentRequests.shift();
    if (recentRequests.length >= 20)
      throw new ApiError(
        429,
        "Too many requests. Wait a minute before asking again.",
      );
    recentRequests.push(now);
    const language = ["English", "Tagalog", "Tagalog & English"].includes(
      String(body.language),
    )
      ? String(body.language)
      : "English";
    const business: BusinessState =
      body.business === null
        ? {
            version: 1,
            transactions: [],
            products: [],
            profile: {
              name: "",
              owner: "",
              mobile: "",
              location: "",
              businessType: "",
            },
            preferences: { language, reminder: "", leaContext: false },
          }
        : (body.business as BusinessState);
    const request = buildLeaRequest(
      { ...business, preferences: { ...business.preferences, language } },
      body.question,
      body.history,
    );
    const { conversation_history, ...currentInput } = request.input;
    const upstream = await (options.fetcher ?? fetch)(
      "https://generativelanguage.googleapis.com/v1beta/models/" +
        encodeURIComponent(model) +
        ":generateContent",
      {
        method: "POST",
        headers: {
          "x-goog-api-key": options.apiKey,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(60000),
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: request.instructions }] },
          contents: [
            ...conversation_history.map((m) => ({
              role: m.role === "assistant" ? "model" : "user",
              parts: [{ text: m.content }],
            })),
            { role: "user", parts: [{ text: JSON.stringify(currentInput) }] },
          ],
          generationConfig: { maxOutputTokens: 4096 },
        }),
      },
    );
    if (!upstream.ok) {
      const data = await upstream.json().catch(() => null) as {
        error?: { message?:unknown; details?: {reason?:unknown}[] }
      } | null;
      const message = typeof data?.error?.message === "string" ? data.error.message : "";
      const reasons = Array.isArray(data?.error?.details) ? data.error.details.map(d => typeof d.reason === "string" ? d.reason : "").join(" ") : "";
      // Return fixed explanations; provider error text can contain credentials or project identifiers.
      if (upstream.status === 403 && /free tier.*(?:not available|unavailable|not eligible)|restricted.*free tier/i.test(message)) {
        throw new ApiError(403,"Gemini free-tier access is unavailable for this Google project. Review the project in Google AI Studio. Creating another key in the same project will not restore access.");
      }
      if (/API_KEY_INVALID|API key (?:not valid|is invalid)/i.test(message+" "+reasons)) {
        throw new ApiError(502,"The Gemini server API key is invalid. Update GEMINI_API_KEY in the private .env file and restart the server.");
      }
      if (/leaked|key.*blocked/i.test(message)) {
        throw new ApiError(502,"Google has blocked this Gemini key. Create a replacement key in Google AI Studio and update the private .env file.");
      }
      if (upstream.status === 429) throw new ApiError(429,"Gemini usage limits have been reached. Check this project's quotas in Google AI Studio and try again when they reset.");
      if (upstream.status === 404) throw new ApiError(502,"The configured Gemini model is unavailable. Check GEMINI_MODEL and the models allowed for this project.");
      if (upstream.status === 400) throw new ApiError(502,"Gemini rejected the request format. Check the server request configuration.");
      if (upstream.status === 401 || upstream.status === 403) throw new ApiError(403,"Gemini denied generation for this project. Check project status, billing eligibility and API permissions in Google AI Studio.");
      throw new ApiError(502,"The AI provider is temporarily unavailable. Please try again later.");
    }
    const result = (await upstream.json()) as {
      promptFeedback?: { blockReason?: string };
      candidates?: {
        finishReason?: string;
        content?: { parts?: { text?: string; thought?: boolean }[] };
      }[];
    };
    const answer = result.candidates?.[0];
    if (
      result.promptFeedback?.blockReason ||
      (answer?.finishReason &&
        !["STOP", "MAX_TOKENS"].includes(answer.finishReason))
    )
      throw new ApiError(
        422,
        "Gemini could not answer this request. Try rephrasing or narrowing the question.",
      );
    if (answer?.finishReason === "MAX_TOKENS")
      throw new ApiError(
        502,
        "The AI reply was cut short. Ask a narrower question and try again.",
      );
    const html = answer?.content?.parts
      ?.filter((p) => !p.thought && typeof p.text === "string")
      .map((p) => p.text)
      .join("");
    if (typeof html !== "string" || !html.trim() || html.length > 40000)
      throw new ApiError(
        502,
        "The AI returned an empty or invalid reply. Please try again.",
      );
    json(res, 200, {
      html: html.trim().replace(/^```(?:html)?\s*([\s\S]*?)\s*```$/i, "$1"),
      provider: "Gemini",
      model,
    });
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 502;
    const message =
      err instanceof ApiError
        ? err.message
        : err instanceof Error &&
            (err.name === "TimeoutError" || err.name === "AbortError")
          ? "The AI request timed out. Please try again."
          : "Could not reach the AI provider. Check the server's internet connection.";
    if (!res.headersSent) json(res, status, { error: message });
    else res.end();
  }
}
