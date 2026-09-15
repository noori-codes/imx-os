import type { CoachSuggestion } from "@/lib/ai/coach-actions";
import type { AiCoachPromptId } from "@/lib/ai/coach-prompts";

const STORAGE_KEY = "imx-coach-chat-v1";
const MAX_MESSAGES = 40;

type CoachReply = {
  summary: string;
  suggestions: CoachSuggestion[];
};

export type PersistedChatMessage =
  | { id: string; role: "assistant"; kind: "welcome" }
  | { id: string; role: "user"; text: string }
  | {
      id: string;
      role: "assistant";
      kind: "reply";
      reply: CoachReply;
      at: string;
    };

export type PersistedCoachChat = {
  messages: PersistedChatMessage[];
  usedPromptIds: AiCoachPromptId[];
};

const WELCOME: PersistedChatMessage = {
  id: "welcome",
  role: "assistant",
  kind: "welcome",
};

export function defaultCoachChat(): PersistedCoachChat {
  return { messages: [WELCOME], usedPromptIds: [] };
}

export function readCoachChat(): PersistedCoachChat {
  if (typeof window === "undefined") return defaultCoachChat();
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultCoachChat();
    const parsed = JSON.parse(raw) as Partial<PersistedCoachChat>;
    if (!Array.isArray(parsed.messages) || parsed.messages.length === 0) {
      return defaultCoachChat();
    }
    return {
      messages: parsed.messages.slice(-MAX_MESSAGES),
      usedPromptIds: Array.isArray(parsed.usedPromptIds)
        ? parsed.usedPromptIds
        : [],
    };
  } catch {
    return defaultCoachChat();
  }
}

export function writeCoachChat(chat: PersistedCoachChat) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        messages: chat.messages.slice(-MAX_MESSAGES),
        usedPromptIds: chat.usedPromptIds,
      }),
    );
  } catch {
    // Ignore quota / private mode failures.
  }
}

export function clearCoachChat() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
