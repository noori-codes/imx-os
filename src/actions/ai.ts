"use server";

import { getVerifiedUser } from "@/lib/auth";
import {
  buildActivitySnapshot,
  snapshotToPromptText,
} from "@/lib/ai/activity-snapshot";
import {
  AI_COACH_PROMPTS,
  type AiCoachPromptId,
} from "@/lib/ai/coach-prompts";
import { groqChatCompletion } from "@/lib/ai/groq";
import { createClient } from "@/lib/supabase/server";

/** Short gap between asks — free-tier friendly for suggested prompts. */
const COOLDOWN_MS = 2 * 60 * 1000;

export type CoachReply = {
  summary: string;
  suggestions: string[];
};

export type CoachAskResult =
  | {
      ok: true;
      promptId: AiCoachPromptId;
      promptLabel: string;
      reply: CoachReply;
      generatedAt: string;
    }
  | {
      ok: false;
      error: string;
      code?:
        | "auth"
        | "invalid_prompt"
        | "missing_key"
        | "rate_limit"
        | "cooldown"
        | "upstream";
      retryAfterMs?: number;
    };

const SYSTEM_PROMPT = `You are a concise personal productivity coach inside IMX OS.
Given a JSON activity snapshot for the last 7 days and a user question, reply with ONLY valid JSON (no markdown fences):
{"summary":"2-4 sentences answering the question","suggestions":["actionable tip 1","actionable tip 2","actionable tip 3"]}
Rules:
- Answer the asked question directly using the snapshot numbers.
- Suggestions must be concrete and doable soon (max 3).
- No fluff, no emojis, no medical advice.
- If data is sparse, say so honestly.`;

function resolvePrompt(id: string) {
  return AI_COACH_PROMPTS.find((prompt) => prompt.id === id) ?? null;
}

function parseReply(raw: string): CoachReply | null {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  try {
    const parsed = JSON.parse(candidate) as {
      summary?: unknown;
      suggestions?: unknown;
    };
    if (typeof parsed.summary !== "string" || !parsed.summary.trim()) {
      return null;
    }
    const suggestions = Array.isArray(parsed.suggestions)
      ? parsed.suggestions
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 3)
      : [];
    return {
      summary: parsed.summary.trim(),
      suggestions:
        suggestions.length > 0
          ? suggestions
          : ["Pick one priority on your dashboard and start a short focus block."],
    };
  } catch {
    return null;
  }
}

function fallbackReply(raw: string): CoachReply {
  const text = raw.trim();
  const lines = text
    .split(/\n+/)
    .map((line) => line.replace(/^[-*•\d.)\s]+/, "").trim())
    .filter(Boolean);
  return {
    summary: lines[0] ?? text.slice(0, 400),
    suggestions: lines.slice(1, 4).length
      ? lines.slice(1, 4)
      : [
          "Protect one short focus block tomorrow.",
          "Clear one overdue task.",
          "Log tonight’s daily review.",
        ],
  };
}

/** @deprecated Prefer askCoachQuestion — kept for compatibility. */
export async function generateWeeklyInsight() {
  return askCoachQuestion("week_overview");
}

export async function askCoachQuestion(
  promptId: string,
): Promise<CoachAskResult> {
  const prompt = resolvePrompt(promptId);
  if (!prompt) {
    return {
      ok: false,
      code: "invalid_prompt",
      error: "That question isn’t available.",
    };
  }

  const user = await getVerifiedUser();
  if (!user) {
    return { ok: false, code: "auth", error: "Sign in to ask the coach." };
  }

  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("user_settings")
    .select("last_ai_insight_at, daily_focus_goal_minutes")
    .eq("user_id", user.id)
    .maybeSingle();

  const lastAt = settings?.last_ai_insight_at
    ? new Date(settings.last_ai_insight_at).getTime()
    : 0;
  if (lastAt > 0) {
    const elapsed = Date.now() - lastAt;
    if (elapsed < COOLDOWN_MS) {
      return {
        ok: false,
        code: "cooldown",
        error: "Give the coach a moment before the next question.",
        retryAfterMs: COOLDOWN_MS - elapsed,
      };
    }
  }

  const snapshot = await buildActivitySnapshot(user.id);
  const completion = await groqChatCompletion(
    [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Question: ${prompt.label}\nGuidance: ${prompt.hint}\n\nActivity snapshot:\n${snapshotToPromptText(snapshot)}`,
      },
    ],
    { temperature: 0.35, maxTokens: 650 },
  );

  if (!completion.ok) {
    return {
      ok: false,
      code: completion.code,
      error: completion.error,
    };
  }

  const reply =
    parseReply(completion.content) ?? fallbackReply(completion.content);
  const generatedAt = new Date().toISOString();

  const { error: upsertError } = await supabase.from("user_settings").upsert(
    {
      user_id: user.id,
      daily_focus_goal_minutes:
        settings?.daily_focus_goal_minutes ??
        snapshot.summary.daily_focus_goal_minutes,
      last_ai_insight_at: generatedAt,
    },
    { onConflict: "user_id" },
  );

  if (upsertError) {
    console.error("[ai] cooldown upsert:", upsertError.message);
  }

  return {
    ok: true,
    promptId: prompt.id,
    promptLabel: prompt.label,
    reply,
    generatedAt,
  };
}
