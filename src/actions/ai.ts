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
import {
  COACH_ACTION_HREFS,
  DEFAULT_COACH_SUGGESTION_TEXTS,
  normalizeCoachSuggestions,
  type CoachSuggestion,
} from "@/lib/ai/coach-actions";
import { groqChatCompletion } from "@/lib/ai/groq";
import { createClient } from "@/lib/supabase/server";

/** Light anti-spam only — chat chips should feel snappy. */
const COOLDOWN_MS = 8_000;

export type CoachReply = {
  summary: string;
  suggestions: CoachSuggestion[];
};

export type CoachAskResult =
  | {
      ok: true;
      promptId: AiCoachPromptId | "custom";
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

const ALLOWED_HREFS = COACH_ACTION_HREFS.join(", ");

const SYSTEM_PROMPT = `You are IMX — a sharp, capable assistant inside a personal OS (tasks, focus, habits, goals, notes, calendar, review).

You may receive an optional activity briefing about the user. Treat it as background only.
- If the question is about their work, plans, habits, focus, energy, or that data → use the briefing.
- If the question is general (math, facts, wording, ideas, jokes, explanations, or anything unrelated) → answer it directly and IGNORE the briefing. Do not mention focus, tasks, projects, habits, or reviews unless the user asked about them.

Respond with ONLY a single JSON object (no markdown, no code fences, no extra keys):
{"summary":"<clear answer in plain English>","suggestions":[{"text":"<optional follow-up>","href":"<path or null>"}]}

Hard rules:
- Answer the user's actual question first. Never force a productivity angle onto an unrelated question.
- "summary" MUST be normal English prose (1–5 sentences, or a short direct answer). Never put nested JSON, numbers-only dumps, or the briefing text inside summary.
- "suggestions" may be an empty array, or 1–3 items. Each has "text" and "href".
- For general / non-productivity questions: use [] or brief follow-ups with "href": null. Do not invent task/focus CTAs.
- For productivity questions: "href" must be one of: ${ALLOWED_HREFS} — or null when no clear destination. Prefer null unless the tip clearly belongs there.
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

function parseReply(
  raw: string,
  fallbackSuggestionTexts: readonly string[] = [],
): CoachReply | null {
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
    if (summary.length < 1) return null;

    const suggestions = normalizeCoachSuggestions(
      parsed.suggestions,
      [...fallbackSuggestionTexts],
    );

    return { summary, suggestions };
  } catch {
    return null;
  }
}

function fallbackReply(
  raw: string,
  fallbackSuggestionTexts: readonly string[] = [],
): CoachReply {
  if (looksLikeRawDataDump(raw)) {
    return {
      summary:
        "I couldn’t shape that into a clear answer. Try asking once more.",
      suggestions: normalizeCoachSuggestions(null, [
        ...fallbackSuggestionTexts,
      ]),
    };
  }

  const text = raw.trim();
  const lines = text
    .split(/\n+/)
    .map((line) => line.replace(/^[-*•\d.)\s]+/, "").trim())
    .filter((line) => line && !looksLikeRawDataDump(line));

  return {
    summary: lines[0] ?? "Here’s a quick take.",
    suggestions: normalizeCoachSuggestions(
      lines.slice(1, 4),
      [...fallbackSuggestionTexts],
    ),
  };
}

/** @deprecated Prefer askCoachQuestion — kept for compatibility. */
export async function generateWeeklyInsight() {
  return askCoachQuestion("week_overview");
}

async function runCoachAsk(
  promptId: AiCoachPromptId | "custom",
  label: string,
  hint: string,
): Promise<CoachAskResult> {
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
  const isCustom = promptId === "custom";
  const suggestionFallback = isCustom
    ? ([] as string[])
    : [...DEFAULT_COACH_SUGGESTION_TEXTS];

  const completion = await groqChatCompletion(
    [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          `Question: ${label}`,
          `Guidance: ${hint}`,
          "",
          "Activity briefing (optional — use only if relevant to the question):",
          briefing,
          "",
          isCustom
            ? "Reply with JSON only. If this question is not about their activity, answer it directly and set suggestions to []."
            : "Reply with JSON only. summary must be prose sentences, never raw data.",
        ].join("\n"),
      },
    ],
    {
      temperature: isCustom ? 0.45 : 0.3,
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

  let reply = parseReply(completion.content, suggestionFallback);
  if (!reply) {
    const repair = await groqChatCompletion(
      [
        {
          role: "system",
          content:
            'Convert the assistant draft into JSON only: {"summary":"prose answer","suggestions":[{"text":"optional follow-up","href":null}]}. summary must be English that answers the question. suggestions may be []. href must be an allowed app path or null — use null for non-productivity answers.',
        },
        {
          role: "user",
          content: `Question was: ${label}\nDraft:\n${completion.content.slice(0, 2000)}`,
        },
      ],
      { temperature: 0.1, maxTokens: 500, jsonMode: true },
    );
    if (repair.ok) {
      reply =
        parseReply(repair.content, suggestionFallback) ??
        fallbackReply(repair.content, suggestionFallback);
    } else {
      reply = fallbackReply(completion.content, suggestionFallback);
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
    promptId,
    promptLabel: label,
    reply,
    generatedAt,
  };
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

  return runCoachAsk(prompt.id, prompt.label, prompt.hint);
}

/** Free-text coach ask — same activity briefing + cooldown as chip prompts. */
export async function askCoachMessage(
  rawQuestion: string,
): Promise<CoachAskResult> {
  const question = rawQuestion.trim().replace(/\s+/g, " ").slice(0, 280);
  if (question.length < 3) {
    return {
      ok: false,
      code: "invalid_prompt",
      error: "Ask something a bit more specific.",
    };
  }

  return runCoachAsk(
    "custom",
    question,
    "Answer this question on its own terms. Use the activity briefing only if it is clearly relevant. For general questions (math, facts, wording, ideas), do not mention focus, tasks, habits, goals, or projects unless the user asked about them. suggestions should be [] unless a natural follow-up helps.",
  );
}
