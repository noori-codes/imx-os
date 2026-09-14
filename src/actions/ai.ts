"use server";

import { getVerifiedUser } from "@/lib/auth";
import {
  buildActivitySnapshot,
  snapshotToPromptText,
} from "@/lib/ai/activity-snapshot";
import { groqChatCompletion } from "@/lib/ai/groq";
import { createClient } from "@/lib/supabase/server";

const COOLDOWN_MS = 6 * 60 * 60 * 1000;

export type WeeklyInsight = {
  summary: string;
  suggestions: string[];
};

export type WeeklyInsightResult =
  | { ok: true; insight: WeeklyInsight; generatedAt: string }
  | {
      ok: false;
      error: string;
      code?: "auth" | "missing_key" | "rate_limit" | "cooldown" | "upstream";
      retryAfterMs?: number;
    };

const SYSTEM_PROMPT = `You are a concise personal productivity coach for IMX OS, a private life-management app.
Given a JSON activity snapshot for the last 7 days, reply with ONLY valid JSON (no markdown fences) in this shape:
{"summary":"2-4 sentences about how the week went","suggestions":["actionable tip 1","actionable tip 2","actionable tip 3"]}
Rules:
- Be specific to the numbers (focus, habits, tasks, mood/energy if present).
- Suggestions must be concrete and doable this week (max 3).
- No fluff, no emojis, no medical advice.
- If data is sparse, say so honestly and suggest one simple habit to start logging.`;

function parseInsight(raw: string): WeeklyInsight | null {
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
          : ["Review your dashboard and pick one priority for tomorrow."],
    };
  } catch {
    return null;
  }
}

function fallbackInsight(raw: string): WeeklyInsight {
  const text = raw.trim();
  const lines = text
    .split(/\n+/)
    .map((line) => line.replace(/^[-*•\d.)\s]+/, "").trim())
    .filter(Boolean);
  return {
    summary: lines[0] ?? text.slice(0, 400),
    suggestions: lines.slice(1, 4).length
      ? lines.slice(1, 4)
      : ["Protect one short focus block tomorrow.", "Check off one overdue task.", "Log tonight’s daily review."],
  };
}

export async function generateWeeklyInsight(): Promise<WeeklyInsightResult> {
  const user = await getVerifiedUser();
  if (!user) {
    return { ok: false, code: "auth", error: "Sign in to get a weekly insight." };
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
        error: "You can generate another insight in a few hours (6h cooldown).",
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
        content: `Activity snapshot:\n${snapshotToPromptText(snapshot)}`,
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

  const insight =
    parseInsight(completion.content) ?? fallbackInsight(completion.content);
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

  return { ok: true, insight, generatedAt };
}
