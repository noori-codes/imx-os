type BooksStatsProps = {
  reading: number;
  finishedYear: number;
  wantToRead: number;
  avgRating: number | null;
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
    <div className="books-stat rounded-2xl border border-border/50 bg-card/80 px-4 py-3.5 sm:px-5 sm:py-4">
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

export function BooksStats({
  reading,
  finishedYear,
  wantToRead,
  avgRating,
}: BooksStatsProps) {
  return (
    <div className="books-stats grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      <Stat
        label="Reading"
        value={String(reading)}
        hint={reading === 0 ? "Nothing open" : "in progress"}
      />
      <Stat
        label="Finished"
        value={String(finishedYear)}
        hint="this year"
      />
      <Stat
        label="Want to read"
        value={String(wantToRead)}
        hint={wantToRead === 0 ? "Queue empty" : "queued"}
      />
      <Stat
        label="Avg rating"
        value={avgRating == null ? "—" : avgRating.toFixed(1)}
        hint={avgRating == null ? "No ratings yet" : "rated books"}
      />
    </div>
  );
}
