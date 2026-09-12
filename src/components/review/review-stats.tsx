import type { DailyReview, ReviewRecap } from "@/types/review";

type ReviewStatsProps = {
  recap: ReviewRecap;
  review: DailyReview | null;
};

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="review-stat rounded-2xl border border-border/50 bg-card/80 px-4 py-3.5 sm:px-5 sm:py-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums text-foreground sm:text-3xl">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

export function ReviewStats({ recap, review }: ReviewStatsProps) {
  const openDue = recap.tasks_due.filter((task) => !task.completed).length;

  return (
    <div className="review-stats grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      <Stat
        label="Done today"
        value={String(recap.tasks_completed.length)}
        hint={
          openDue > 0
            ? `${openDue} still due`
            : recap.tasks_completed.length === 0
              ? "No completions yet"
              : "tasks sealed"
        }
      />
      <Stat
        label="Habits"
        value={
          recap.habits_total > 0
            ? `${recap.habits_done}/${recap.habits_total}`
            : "—"
        }
        hint={
          recap.habits_total === 0
            ? "No habits"
            : recap.habits_done === recap.habits_total
              ? "All sealed"
              : "checked in"
        }
      />
      <Stat
        label="Focus"
        value={String(recap.focus_minutes)}
        hint={
          recap.focus_sessions > 0
            ? `${recap.focus_sessions} session${recap.focus_sessions === 1 ? "" : "s"}`
            : "minutes"
        }
      />
      <Stat
        label="Mood"
        value={review?.mood != null ? `${review.mood}/5` : "—"}
        hint={
          review?.energy != null
            ? `Energy ${review.energy}/5`
            : review
              ? "Logged"
              : "Not set yet"
        }
      />
    </div>
  );
}
