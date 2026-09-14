export type GroqChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type GroqChatResult =
  | { ok: true; content: string }
  | { ok: false; error: string; code?: "missing_key" | "rate_limit" | "upstream" };

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
/** Free-tier chat model available on current Groq accounts. */
const DEFAULT_MODEL = "allam-2-7b";
const TIMEOUT_MS = 25_000;

export function getGroqModel() {
  return process.env.GROQ_MODEL?.trim() || DEFAULT_MODEL;
}

export function hasGroqApiKey() {
  return Boolean(process.env.GROQ_API_KEY?.trim());
}

export async function groqChatCompletion(
  messages: GroqChatMessage[],
  options?: { temperature?: number; maxTokens?: number },
): Promise<GroqChatResult> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    return {
      ok: false,
      code: "missing_key",
      error:
        "AI insight isn’t configured. Add GROQ_API_KEY to the server environment.",
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: getGroqModel(),
        temperature: options?.temperature ?? 0.4,
        max_tokens: options?.maxTokens ?? 700,
        messages,
      }),
      signal: controller.signal,
    });

    if (response.status === 429) {
      return {
        ok: false,
        code: "rate_limit",
        error:
          "Groq rate limit hit. Wait a bit and try again — free tier has request limits.",
      };
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("[groq]", response.status, detail.slice(0, 400));
      if (response.status === 404 || detail.includes("model_not_found")) {
        return {
          ok: false,
          code: "upstream",
          error:
            "AI model isn’t available on this Groq account. Check GROQ_MODEL or update the app default.",
        };
      }
      return {
        ok: false,
        code: "upstream",
        error: "Couldn’t reach the AI service. Try again in a moment.",
      };
    }

    const data = (await response.json()) as {
      choices?: {
        message?: {
          content?: string | null;
          reasoning?: string | null;
        };
      }[];
    };
    const message = data.choices?.[0]?.message;
    const content =
      message?.content?.trim() ||
      message?.reasoning?.trim() ||
      "";
    if (!content) {
      return {
        ok: false,
        code: "upstream",
        error: "The AI returned an empty reply.",
      };
    }

    return { ok: true, content };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        ok: false,
        code: "upstream",
        error: "The AI request timed out. Try again.",
      };
    }
    console.error("[groq]", error);
    return {
      ok: false,
      code: "upstream",
      error: "Couldn’t reach the AI service. Try again in a moment.",
    };
  } finally {
    clearTimeout(timer);
  }
}
