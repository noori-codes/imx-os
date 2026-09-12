type NoteStatsProps = {
  total: number;
  notes: number;
  journals: number;
  words: number;
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
    <div className="notes-stat rounded-2xl border border-border/50 bg-card/80 px-4 py-3.5 sm:px-5 sm:py-4">
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

function formatWords(count: number) {
  if (count >= 1000) return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k`;
  return String(count);
}

export function NoteStats({ total, notes, journals, words }: NoteStatsProps) {
  return (
    <div className="notes-stats grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      <Stat
        label="Library"
        value={String(total)}
        hint={total === 0 ? "Empty shelf" : "pieces"}
      />
      <Stat
        label="Notes"
        value={String(notes)}
        hint={notes === 0 ? "None yet" : "freeform"}
      />
      <Stat
        label="Journals"
        value={String(journals)}
        hint={journals === 0 ? "Start today" : "daily entries"}
      />
      <Stat
        label="Words"
        value={formatWords(words)}
        hint={words === 0 ? "Still blank" : "written so far"}
      />
    </div>
  );
}
