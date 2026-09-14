"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Sparkles, X } from "lucide-react";

import { askCoachQuestion, type CoachReply } from "@/actions/ai";
import {
  AI_COACH_PROMPTS,
  type AiCoachPromptId,
} from "@/lib/ai/coach-prompts";
import { coachActionLabel } from "@/lib/ai/coach-actions";
import { cn } from "@/lib/utils";
import { useFocusTimer } from "@/stores/focus-timer";

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

function BrandMark({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative shrink-0 overflow-hidden rounded-[0.7rem] border border-border bg-black shadow-sm dark:border-white/12",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src="/IMX-logo.png"
        alt=""
        fill
        sizes={`${size}px`}
        className="object-cover"
      />
    </span>
  );
}

function AssistantBubble({ children }: { children: ReactNode }) {
  return (
    <div className="imx-chat-msg flex gap-2.5">
      <BrandMark size={28} />
      <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border border-border/35 bg-card/70 px-3.5 py-2.5 text-sm leading-relaxed text-foreground shadow-[inset_0_1px_0_color-mix(in_oklab,var(--foreground)_4%,transparent)]">
        {children}
      </div>
    </div>
  );
}

function SuggestionList({
  suggestions,
  onNavigate,
}: {
  suggestions: CoachReply["suggestions"];
  onNavigate: () => void;
}) {
  return (
    <ul className="mt-3 space-y-2">
      {suggestions.map((item) => (
        <li
          key={`${item.text}-${item.href ?? "none"}`}
          className="rounded-xl border border-border/40 bg-background/50 px-3 py-2.5"
        >
          <p className="text-sm leading-snug text-foreground/90">{item.text}</p>
          {item.href ? (
            <Link
              href={item.href}
              onClick={onNavigate}
              className="mt-2 inline-flex items-center gap-1 rounded-full bg-foreground px-2.5 py-1 text-[11px] font-medium text-background transition-opacity hover:opacity-90"
            >
              {coachActionLabel(item.href)}
              <ArrowUpRight className="size-3 opacity-80" />
            </Link>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="imx-chat-msg flex justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-foreground px-3.5 py-2.5 text-sm leading-relaxed text-background">
        {text}
      </div>
    </div>
  );
}

export function ImxChat() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", kind: "welcome" },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [usedPromptIds, setUsedPromptIds] = useState<AiCoachPromptId[]>([]);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const isRunning = useFocusTimer((s) => s.isRunning);

  const availablePrompts = AI_COACH_PROMPTS.filter(
    (prompt) => !usedPromptIds.includes(prompt.id),
  );

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!mounted || isRunning) return null;

  return (
    <div
      className="imx-chat-dock pointer-events-none fixed inset-x-0 z-40 flex justify-end p-4 sm:p-5"
      style={{ bottom: "var(--mobile-chrome-bottom)" }}
    >
      <div className="pointer-events-auto flex flex-col items-end gap-3">
        {open ? (
          <div
            role="dialog"
            aria-label="IMX chat"
            className="imx-chat-panel relative flex h-[min(34rem,calc(100dvh-6.5rem-var(--mobile-chrome-bottom)))] w-[min(25rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-[1.35rem]"
          >
            <div className="imx-chat-wash" aria-hidden />

            <header className="relative z-[1] flex items-center gap-3 border-b border-border/40 px-4 pb-3.5 pt-4">
              <BrandMark size={42} className="rounded-xl shadow-md" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Coach
                </p>
                <p className="mt-0.5 text-lg font-semibold tracking-tight text-foreground">
                  IMX
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex size-9 items-center justify-center rounded-full border border-border/50 bg-background/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Close IMX"
              >
                <X className="size-4" />
              </button>
            </header>

            <div
              ref={scrollerRef}
              className="relative z-[1] flex flex-1 flex-col gap-3.5 overflow-y-auto px-4 py-4"
            >
              {messages.map((message) => {
                if (message.role === "user") {
                  return <UserBubble key={message.id} text={message.text} />;
                }

                if (message.kind === "welcome") {
                  return (
                    <AssistantBubble key={message.id}>
                      <p className="text-[15px] leading-snug">
                        I’m your week in one place — focus, habits, tasks,
                        reviews. Ask something sharp, or let me{" "}
                        <span className="font-medium">surprise</span> you.
                      </p>
                    </AssistantBubble>
                  );
                }

                return (
                  <AssistantBubble key={message.id}>
                    <p>{message.reply.summary}</p>
                    {message.reply.suggestions.length > 0 ? (
                      <SuggestionList
                        suggestions={message.reply.suggestions}
                        onNavigate={() => setOpen(false)}
                      />
                    ) : null}
                  </AssistantBubble>
                );
              })}

              {pending ? (
                <AssistantBubble>
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <span className="imx-chat-thinking" aria-hidden />
                    Reading your week…
                  </p>
                </AssistantBubble>
              ) : null}

              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}
            </div>

            <div className="relative z-[1] border-t border-border/40 bg-background/50 px-4 py-3.5 backdrop-blur-sm">
              {availablePrompts.length > 0 ? (
                <div
                  className="flex flex-wrap gap-2"
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
                        "rounded-full px-3 py-1.5 text-left text-xs transition-all",
                        prompt.id === "surprise_me"
                          ? "bg-foreground text-background shadow-sm hover:opacity-90 active:scale-[0.98]"
                          : "border border-border/55 bg-background/70 text-muted-foreground hover:border-foreground/25 hover:text-foreground",
                        "disabled:pointer-events-none disabled:opacity-50",
                      )}
                    >
                      {prompt.id === "surprise_me" ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Sparkles className="size-3.5" />
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
                  That’s the set for now — come back later for a fresh read.
                </p>
              )}
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          data-open={open ? "true" : "false"}
          className={cn("imx-chat-fab", open && "imx-chat-fab-open")}
          aria-expanded={open}
          aria-label={open ? "Close IMX" : "Open IMX"}
        >
          <span className="imx-chat-fab-glow" aria-hidden />
          {open ? (
            <span className="relative z-[1] inline-flex size-12 items-center justify-center rounded-2xl bg-foreground text-background">
              <X className="size-5" />
            </span>
          ) : (
            <>
              <BrandMark size={48} className="relative z-[1] rounded-2xl" />
              <span className="relative z-[1] flex min-w-0 flex-col items-start pr-1">
                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Ask
                </span>
                <span className="text-sm font-semibold tracking-tight text-foreground">
                  IMX
                </span>
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
