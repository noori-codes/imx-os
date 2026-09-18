"use client";

import { useFormStatus } from "react-dom";
import { BookOpen, Loader2, Plus } from "lucide-react";

import { createNote } from "@/actions/notes";
import { cn } from "@/lib/utils";
import type { NoteType } from "@/types/note";

type CreateNoteButtonProps = {
  type?: NoteType;
  journalDate?: string;
  label: string;
  icon?: "plus" | "book";
  /** Primary filled vs outline surface */
  tone?: "primary" | "outline";
  className?: string;
  capture?: boolean;
};

function CreateNoteSubmit({
  label,
  icon,
  tone,
  className,
  capture,
}: Omit<CreateNoteButtonProps, "type" | "journalDate">) {
  const { pending } = useFormStatus();
  const Icon = icon === "book" ? BookOpen : Plus;

  return (
    <button
      type="submit"
      disabled={pending}
      data-imx-capture={capture ? true : undefined}
      aria-busy={pending || undefined}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium transition-opacity disabled:opacity-60",
        tone === "primary"
          ? "bg-foreground text-background hover:opacity-90"
          : "border border-surface-border bg-surface text-foreground hover:border-border",
        className,
      )}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Icon className="size-4" />
      )}
      {pending ? "Opening…" : label}
    </button>
  );
}

export function CreateNoteButton({
  type = "note",
  journalDate,
  label,
  icon = "plus",
  tone = "outline",
  className,
  capture,
}: CreateNoteButtonProps) {
  const action =
    journalDate !== undefined
      ? createNote.bind(null, type, journalDate)
      : createNote.bind(null, type);

  return (
    <form action={action}>
      <CreateNoteSubmit
        label={label}
        icon={icon}
        tone={tone}
        className={className}
        capture={capture}
      />
    </form>
  );
}
