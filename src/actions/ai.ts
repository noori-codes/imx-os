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

/** Light anti-spam only — chat chips should feel snappy. */
const COOLDOWN_MS = 8_000;

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

const SYSTEM_PROMPT = `You are IMX, a concise personal productivity coach.
You receive a plain-language activity briefing and a question.
Respond with ONLY a single JSON object (no markdown, no code fences, no extra keys):
{"summary":"<2-4 full sentences of prose>","suggestions":["<tip>","<tip>","<tip>"]}

Hard rules:
- "summary" MUST be a string of normal English sentences. Never put numbers-only objects, nested JSON, or the briefing text inside summary.
- Do NOT repeat or paste the briefing. Interpret it.
- Exactly 3 short actionable suggestions as strings.
- No emojis. No medical advice.`;

function resolvePrompt(id: string) {
  return AI_COACH_PROMPTS.find((prompt) => prompt.id === id) ?? null;
}

function looksLikeRawDataDump(text: string) {
  return (
    text.trimStart().startsWith("{") ||
    /"focus_minutes"|"habit_streaks"|"generated_at"/.test(text)
  );
}

function extractJsonObject(raw: string): string | null {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = (fenced?.[1] ?? raw).trim();
  if (body.startsWith("{") && body.endsWith("}")) return body;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start >= 0 && end > start) return body.slice(start, end + 1);
  return null;
}

function parseReply(raw: string): CoachReply | null {
  const candidate = extractJsonObject(raw);
  if (!candidate) return null;
  try {
    const parsed = JSON.parse(candidate) as {
      summary?: unknown;
      suggestions?: unknown;
    };

    let summary =
      typeof parsed.summary === "string" ? parsed.summary.trim() : "";

    // Model sometimes nests prose wrong — reject data dumps.
    if (!summary || looksLikeRawDataDump(summary)) return null;
    if (summary.length < 24) return null;

    const suggestions = Array.isArray(parsed.suggestions)
      ? parsed.suggestions
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 3)
      : [];

    return {
      summary,
      suggestions:
        suggestions.length > 0
          ? suggestions
          : [
              "Protect one short focus block tomorrow.",
              "Clear one overdue task.",
              "Log tonight’s daily review.",
            ],
    };
  } catch {
    return null;
  }
}

function fallbackReply(raw: string): CoachReply {
  if (looksLikeRawDataDump(raw)) {
    return {
      summary:
        "I couldn’t shape that into a clear answer. Try the same question once more.",
      suggestions: [
        "Ask “How was my week?” again.",
        "Or try “What should I focus on next?”",
        "Surprise me can also work after a moment.",
      ],
    };
  }

  const text = raw.trim();
  const lines = text
    .split(/\n+/)
    .map((line) => line.replace(/^[-*•\d.)\s]+/, "").trim())
    .filter((line) => line && !looksLikeRawDataDump(line));

  return {
    summary: lines[0] ?? "Here’s a quick take based on your recent activity.",
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
        error: "One sec — IMX is catching up.",
        retryAfterMs: COOLDOWN_MS - elapsed,
      };
    }
  }

  const snapshot = await buildActivitySnapshot(user.id);
  const briefing = snapshotToPromptText(snapshot);

  const completion = await groqChatCompletion(
    [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Question: ${prompt.label}\nWhat to emphasize: ${prompt.hint}\n\nActivity briefing:\n${briefing}\n\nRemember: reply with JSON only. summary must be prose sentences, never raw data.`,
      },
    ],
    {
      temperature: 0.3,
      maxTokens: 900,
      jsonMode: true,
    },
  );

  if (!completion.ok) {
    return {
      ok: false,
      code: completion.code,
      error: completion.error,
    };
  }

  let reply = parseReply(completion.content);
  if (!reply) {
    // One repair pass if the model drifted.
    const repair = await groqChatCompletion(
      [
        {
          role: "system",
          content:
            'Convert the assistant draft into JSON only: {"summary":"prose sentences","suggestions":["tip","tip","tip"]}. summary must be English sentences, never JSON/data.',
        },
        {
          role: "user",
          content: `Question was: ${prompt.label}\nDraft:\n${completion.content.slice(0, 2000)}`,
        },
      ],
      { temperature: 0.1, maxTokens: 500, jsonMode: true },
    );
    if (repair.ok) {
      reply = parseReply(repair.content) ?? fallbackReply(repair.content);
    } else {
      reply = fallbackReply(completion.content);
    }
  }

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
