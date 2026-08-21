type NoteStatsProps = {
  total: number;
  journals: number;
  notes: number;
};

export function NoteStats({ total, journals, notes }: NoteStatsProps) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-muted-foreground">
      <span>
        Library{" "}
        <span className="tabular-nums text-foreground">{total}</span>
      </span>
      <span>
        Notes{" "}
        <span className="tabular-nums text-foreground">{notes}</span>
      </span>
      <span>
        Journals{" "}
        <span className="tabular-nums text-foreground">{journals}</span>
      </span>
    </div>
  );
}
