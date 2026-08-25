"use client";

import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { formatFocusClock, formatFocusMinutes } from "@/types/focus";

type FocusSealToastProps = {
  id: string | number;
  kind: "focus" | "break" | "task" | "goal";
  title: string;
  seconds?: number;
  todayMinutes?: number;
  goalMinutes?: number;
  nextLabel?: string;
  taskTitle?: string;
  onMarkDone?: () => void;
};

export function FocusSealToast({
  id,
  kind,
  title,
  seconds,
  todayMinutes,
  goalMinutes,
  nextLabel,
  taskTitle,
  onMarkDone,
}: FocusSealToastProps) {
  return (
    <div
      className={cn(
        "focus-seal-toast relative overflow-hidden rounded-2xl border border-border/50",
        "bg-background/90 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.45)] backdrop-blur-xl",
        "dark:bg-card/90 dark:shadow-[0_24px_60px_-20px_rgba(0,0,0,0.75)]",
        kind === "goal" && "border-foreground/20",
      )}
    >
      <div
        className="pointer-events-none absolute -top-16 left-1/2 size-40 -translate-x-1/2 rounded-full bg-foreground/[0.07] blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-foreground/25 to-transparent"
        aria-hidden
      />

      <div className="relative px-5 pb-4 pt-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            {title}
          </p>
          <button
            type="button"
            onClick={() => toast.dismiss(id)}
            className="-mr-1 -mt-1 flex size-6 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:bg-muted/60 hover:text-foreground"
            aria-label="Dismiss"
          >
            <span className="text-sm leading-none">×</span>
          </button>
        </div>

        {kind === "goal" && goalMinutes != null ? (
          <p className="focus-clock mt-2 text-[2rem] leading-none tracking-tight text-foreground sm:text-[2.15rem]">
            {formatFocusMinutes(goalMinutes)}
          </p>
        ) : null}

        {kind !== "task" && kind !== "goal" && seconds != null ? (
          <p className="focus-clock mt-2 text-[2rem] leading-none tracking-tight text-foreground sm:text-[2.15rem]">
            {formatFocusClock(seconds)}
          </p>
        ) : null}

        {kind === "task" && taskTitle ? (
          <p className="mt-2 truncate text-base font-medium tracking-tight text-foreground">
            {taskTitle}
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {kind === "goal" && todayMinutes != null ? (
            <span>Today · {formatFocusMinutes(todayMinutes)} · nicely done</span>
          ) : null}
          {kind === "focus" && todayMinutes != null ? (
            <span>Today · {formatFocusMinutes(todayMinutes)}</span>
          ) : null}
          {kind === "break" ? <span>Nicely reset</span> : null}
          {kind === "task" ? <span>Cleared from the board</span> : null}
          {nextLabel ? (
            <>
              <span className="text-border">·</span>
              <span>Next · {nextLabel}</span>
            </>
          ) : null}
        </div>

        {onMarkDone ? (
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onMarkDone();
                toast.dismiss(id);
              }}
              className="rounded-full bg-foreground px-3.5 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90"
            >
              Mark done
            </button>
            <button
              type="button"
              onClick={() => toast.dismiss(id)}
              className="rounded-full px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            >
              Keep open
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

type ShowFocusSealToastArgs = {
  kind: "focus" | "break" | "task" | "goal";
  title: string;
  seconds?: number;
  todayMinutes?: number;
  goalMinutes?: number;
  nextLabel?: string;
  taskTitle?: string;
  onMarkDone?: () => void;
};

export function showFocusSealToast({
  kind,
  title,
  seconds,
  todayMinutes,
  goalMinutes,
  nextLabel,
  taskTitle,
  onMarkDone,
}: ShowFocusSealToastArgs) {
  toast.custom(
    (id) => (
      <FocusSealToast
        id={id}
        kind={kind}
        title={title}
        seconds={seconds}
        todayMinutes={todayMinutes}
        goalMinutes={goalMinutes}
        nextLabel={nextLabel}
        taskTitle={taskTitle}
        onMarkDone={onMarkDone}
      />
    ),
    {
      duration: kind === "goal" ? (onMarkDone ? 8000 : 5600) : onMarkDone ? 8000 : 4200,
    },
  );
}
