"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { MessageCircle, Sparkles, X } from "lucide-react";

import { askCoachQuestion, type CoachReply } from "@/actions/ai";
import {
  AI_COACH_PROMPTS,
  type AiCoachPromptId,
} from "@/lib/ai/coach-prompts";
import { cn } from "@/lib/utils";

type ChatMessage =
  | { id: string; role: "assistant"; kind: "welcome" }
  | { id: string; role: "user"; text: string }
  | {
      id: string;
      role: "assistant";
      kind: "reply";
      reply: CoachReply;
      at: string;
    };

function formatRetry(ms: number) {
  const seconds = Math.max(1, Math.ceil(ms / 1000));
  if (seconds < 60) return `${seconds}s`;
  return `${Math.ceil(seconds / 60)}m`;
}

function AssistantBubble({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2.5">
      <span
        className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold tracking-wide text-background"
        aria-hidden
      >
        IMX
      </span>
      <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border border-border/50 bg-muted/35 px-3 py-2.5 text-sm leading-relaxed text-foreground">
        {children}
      </div>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-foreground px-3 py-2.5 text-sm leading-relaxed text-background">
        {text}
      </div>
    </div>
  );
}

export function ImxChat() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", kind: "welcome" },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [usedPromptIds, setUsedPromptIds] = useState<AiCoachPromptId[]>([]);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const availablePrompts = AI_COACH_PROMPTS.filter(
    (prompt) => !usedPromptIds.includes(prompt.id),
  );

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function scrollToBottom() {
    requestAnimationFrame(() => {
      scrollerRef.current?.scrollTo({
        top: scrollerRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  }

  function handleAsk(promptId: AiCoachPromptId, label: string) {
    setError(null);
    setMessages((prev) => [
      ...prev,
      { id: `u-${promptId}-${Date.now()}`, role: "user", text: label },
    ]);
    setUsedPromptIds((prev) =>
      prev.includes(promptId) ? prev : [...prev, promptId],
    );
    scrollToBottom();

    startTransition(async () => {
      const result = await askCoachQuestion(promptId);
      if (!result.ok) {
        const suffix =
          result.code === "cooldown" && result.retryAfterMs
            ? ` Try again in ${formatRetry(result.retryAfterMs)}.`
            : "";
        setError(`${result.error}${suffix}`);
        scrollToBottom();
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${result.promptId}-${result.generatedAt}`,
          role: "assistant",
          kind: "reply",
          reply: result.reply,
          at: result.generatedAt,
        },
      ]);
      scrollToBottom();
    });
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-end p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5">
      <div className="pointer-events-auto flex flex-col items-end gap-3">
        {open ? (
          <div
            ref={panelRef}
            role="dialog"
            aria-label="IMX chat"
            className="flex h-[min(32rem,calc(100dvh-6.5rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border/60 bg-background shadow-2xl shadow-black/20"
          >
            <header className="flex items-center gap-2.5 border-b border-border/50 px-3.5 py-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold tracking-[0.12em] text-background">
                IMX
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">IMX</p>
                <p className="text-xs text-muted-foreground">
                  Your week, answered
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Close IMX"
              >
                <X className="size-4" />
              </button>
            </header>

            <div
              ref={scrollerRef}
              className="flex flex-1 flex-col gap-3 overflow-y-auto px-3.5 py-3.5"
            >
              {messages.map((message) => {
                if (message.role === "user") {
                  return <UserBubble key={message.id} text={message.text} />;
                }

                if (message.kind === "welcome") {
                  return (
                    <AssistantBubble key={message.id}>
                      <p>
                        Hey — I’m <span className="font-medium">IMX</span>. Ask
                        about your week, or hit{" "}
                        <span className="font-medium">Surprise me</span> if you
                        want the unexpected take.
                      </p>
                    </AssistantBubble>
                  );
                }

                return (
                  <AssistantBubble key={message.id}>
                    <p>{message.reply.summary}</p>
                    {message.reply.suggestions.length > 0 ? (
                      <ul className="mt-2 space-y-1.5 text-muted-foreground">
                        {message.reply.suggestions.map((item) => (
                          <li key={item} className="flex gap-2">
                            <span className="mt-2 size-1 shrink-0 rounded-full bg-foreground/45" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </AssistantBubble>
                );
              })}

              {pending ? (
                <AssistantBubble>
                  <p className="text-muted-foreground">Thinking…</p>
                </AssistantBubble>
              ) : null}

              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}
            </div>

            <div className="border-t border-border/50 px-3.5 py-3">
              {availablePrompts.length > 0 ? (
                <div
                  className="flex flex-wrap gap-1.5"
                  role="group"
                  aria-label="Suggested questions"
                >
                  {availablePrompts.map((prompt) => (
                    <button
                      key={prompt.id}
                      type="button"
                      disabled={pending}
                      onClick={() => handleAsk(prompt.id, prompt.label)}
                      className={cn(
                        "rounded-full border px-2.5 py-1.5 text-left text-[11px] transition-colors",
                        prompt.id === "surprise_me"
                          ? "border-foreground/25 bg-foreground text-background hover:opacity-90"
                          : "border-border/50 bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                        "disabled:pointer-events-none disabled:opacity-50",
                      )}
                    >
                      {prompt.id === "surprise_me" ? (
                        <span className="inline-flex items-center gap-1">
                          <Sparkles className="size-3" />
                          {prompt.label}
                        </span>
                      ) : (
                        prompt.label
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  That’s all for now — open IMX again later for a fresh read.
                </p>
              )}
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className={cn(
            "inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-4 text-sm font-medium text-background shadow-lg shadow-black/25 transition-transform hover:scale-[1.02] active:scale-[0.98]",
            open && "px-3",
          )}
          aria-expanded={open}
          aria-controls={open ? undefined : undefined}
          aria-label={open ? "Close IMX" : "Open IMX"}
        >
          {open ? (
            <X className="size-5" />
          ) : (
            <>
              <MessageCircle className="size-4" />
              <span>IMX</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
