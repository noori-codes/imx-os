"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
import { Plus } from "lucide-react";

import {
  createBook,
  updateBook,
  type BookActionState,
} from "@/actions/books";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BOOK_STATUSES, type Book } from "@/types/book";

type BookFormDialogProps = {
  book?: Book;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function BookFormDialog({
  book,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: BookFormDialogProps) {
  const isEdit = Boolean(book);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  const action = isEdit
    ? updateBook.bind(null, book!.id)
    : createBook;

  const [state, formAction, pending] = useActionState<
    BookActionState | null,
    FormData
  >(action, null);

  useEffect(() => {
    if (state && !state.error) {
      setOpen(false);
    }
  }, [state, setOpen]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      {!trigger && controlledOpen == null ? (
        <DialogTrigger asChild>
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" />
            Add book
          </button>
        </DialogTrigger>
      ) : null}

      <DialogContent className="max-w-md p-0" showCloseButton>
        <DialogHeader className="border-b border-border/40 px-5 py-4">
          <DialogTitle>{isEdit ? "Edit book" : "Add book"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update title, progress, or status."
              : "Add something to your reading shelf."}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4 px-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="book-title">Title</Label>
            <Input
              id="book-title"
              name="title"
              required
              defaultValue={book?.title ?? ""}
              placeholder="Book title"
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="book-author">Author</Label>
            <Input
              id="book-author"
              name="author"
              defaultValue={book?.author ?? ""}
              placeholder="Optional"
              autoComplete="off"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="book-status">Status</Label>
              <select
                id="book-status"
                name="status"
                defaultValue={book?.status ?? "want_to_read"}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {BOOK_STATUSES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="book-rating">Rating</Label>
              <select
                id="book-rating"
                name="rating"
                defaultValue={book?.rating?.toString() ?? ""}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="">None</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} ★
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="book-current">Current page</Label>
              <Input
                id="book-current"
                name="current_page"
                type="number"
                min={0}
                defaultValue={book?.current_page ?? 0}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="book-total">Total pages</Label>
              <Input
                id="book-total"
                name="total_pages"
                type="number"
                min={1}
                defaultValue={book?.total_pages ?? ""}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="book-started">Start date</Label>
              <Input
                id="book-started"
                name="started_at"
                type="date"
                defaultValue={book?.started_at ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="book-finished">Finish date</Label>
              <Input
                id="book-finished"
                name="finished_at"
                type="date"
                defaultValue={book?.finished_at ?? ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="book-notes">Notes</Label>
            <Textarea
              id="book-notes"
              name="notes"
              rows={2}
              defaultValue={book?.notes ?? ""}
              placeholder="Optional thoughts"
              className="resize-none"
            />
          </div>

          {state?.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2 border-t border-border/40 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save changes" : "Add book"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
