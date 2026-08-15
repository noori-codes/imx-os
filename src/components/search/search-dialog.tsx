"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Calendar,
  CheckSquare,
  CornerDownLeft,
  FileText,
  FolderKanban,
  ListTodo,
  Loader2,
  Search,
  Target,
  type LucideIcon,
} from "lucide-react";

import { searchQuery } from "@/actions/search";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { SearchEntityType, SearchResult } from "@/types/search";

const ENTITY_META: Record<
  SearchEntityType,
  { label: string; icon: LucideIcon }
> = {
  task: { label: "Tasks", icon: ListTodo },
  goal: { label: "Goals", icon: Target },
  project: { label: "Projects", icon: FolderKanban },
  note: { label: "Notes", icon: FileText },
  habit: { label: "Habits", icon: CheckSquare },
  event: { label: "Events", icon: Calendar },
};

const ENTITY_ORDER: SearchEntityType[] = [
  "task",
  "goal",
  "project",
  "note",
  "habit",
  "event",
];

const SUGGESTIONS = [
  { label: "Tasks", icon: ListTodo },
  { label: "Notes", icon: FileText },
  { label: "Goals", icon: Target },
  { label: "Habits", icon: CheckSquare },
] as const;

export function SearchDialog() {
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const requestId = useRef(0);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [pending, startTransition] = useTransition();
  const [activeIndex, setActiveIndex] = useState(0);
  const [modKey, setModKey] = useState("⌘");

  useEffect(() => {
    const isApple = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
    setModKey(isApple ? "⌘" : "Ctrl");
  }, []);

  useEffect(() => {
    function onGlobalKeyDown(event: globalThis.KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }

    document.addEventListener("keydown", onGlobalKeyDown);
    return () => document.removeEventListener("keydown", onGlobalKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;

    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setActiveIndex(0);
      return;
    }

    const timer = window.setTimeout(() => {
      const id = ++requestId.current;
      startTransition(async () => {
        const response = await searchQuery(q);
        if (id !== requestId.current) return;
        setResults(response.results);
        setActiveIndex(0);
      });
    }, 220);

    return () => window.clearTimeout(timer);
  }, [query, open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setActiveIndex(0);
    }
  }, [open]);

  const orderedResults = useMemo(() => {
    const list: SearchResult[] = [];
    for (const type of ENTITY_ORDER) {
      const items = results.filter((item) => item.entity_type === type);
      list.push(...items);
    }
    return list;
  }, [results]);

  const grouped = useMemo(() => {
    const map = {} as Partial<Record<SearchEntityType, SearchResult[]>>;
    for (const item of orderedResults) {
      const list = map[item.entity_type] ?? [];
      list.push(item);
      map[item.entity_type] = list;
    }
    return map;
  }, [orderedResults]);

  const indexById = useMemo(() => {
    const map = new Map<string, number>();
    orderedResults.forEach((item, index) => {
      map.set(`${item.entity_type}-${item.id}`, index);
    });
    return map;
  }, [orderedResults]);

  function goTo(href: string) {
    setOpen(false);
    router.push(href);
  }

  function onKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) =>
        orderedResults.length === 0
          ? 0
          : Math.min(index + 1, orderedResults.length - 1),
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
      return;
    }

    if (event.key === "Enter" && orderedResults[activeIndex]) {
      event.preventDefault();
      goTo(orderedResults[activeIndex].href);
    }
  }

  const trimmed = query.trim();
  const showIdle = trimmed.length < 2;
  const showEmpty =
    !pending && trimmed.length >= 2 && orderedResults.length === 0;
  const showResults = orderedResults.length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        size="icon"
        className="sm:hidden"
        aria-label="Search"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
      </Button>
      <Button
        variant="outline"
        className="hidden h-9 w-[13.5rem] justify-start gap-2 border-dashed text-muted-foreground sm:inline-flex"
        onClick={() => setOpen(true)}
      >
        <Search className="size-3.5 opacity-70" />
        <span className="flex-1 truncate text-left text-sm">Search…</span>
        <kbd className="pointer-events-none inline-flex h-5 items-center gap-0.5 rounded border bg-muted/80 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          {modKey}K
        </kbd>
      </Button>

      <DialogContent
        showCloseButton={false}
        className="top-[12vh] max-w-xl translate-y-0 gap-0 overflow-hidden border-border/80 bg-popover p-0 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 sm:top-[14vh]"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          inputRef.current?.focus();
        }}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Search</DialogTitle>
          <DialogDescription>
            Search tasks, notes, goals, projects, habits, and events.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 border-b border-border/80 px-4">
          {pending ? (
            <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
          ) : (
            <Search className="size-4 shrink-0 text-muted-foreground" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search across IMX OS…"
            className="h-14 w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/70"
            aria-label="Search"
            aria-controls={listId}
            aria-autocomplete="list"
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <ScrollArea className="max-h-[min(22rem,52vh)]">
          <div id={listId} className="px-2 py-2" role="listbox">
            {showIdle ? (
              <div className="px-2 py-3">
                <p className="mb-3 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Search in
                </p>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                  {SUGGESTIONS.map(({ label, icon: Icon }) => (
                    <div
                      key={label}
                      className="flex items-center gap-2 rounded-lg border border-transparent bg-muted/40 px-2.5 py-2 text-xs text-muted-foreground"
                    >
                      <Icon className="size-3.5 shrink-0 opacity-70" />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 px-2 text-center text-xs text-muted-foreground/80">
                  Type at least 2 characters
                </p>
              </div>
            ) : null}

            {showEmpty ? (
              <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                  <Search className="size-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">No results</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Nothing matched “{trimmed}”
                  </p>
                </div>
              </div>
            ) : null}

            {showResults
              ? ENTITY_ORDER.map((type) => {
                  const items = grouped[type];
                  if (!items?.length) return null;
                  const meta = ENTITY_META[type];
                  const Icon = meta.icon;

                  return (
                    <div key={type} className="mb-1">
                      <div className="flex items-center gap-1.5 px-3 pb-1.5 pt-2">
                        <Icon className="size-3 text-muted-foreground" />
                        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                          {meta.label}
                        </span>
                        <span className="text-[11px] text-muted-foreground/60">
                          {items.length}
                        </span>
                      </div>
                      <ul className="space-y-0.5">
                        {items.map((item) => {
                          const key = `${item.entity_type}-${item.id}`;
                          const index = indexById.get(key) ?? 0;
                          const active = index === activeIndex;

                          return (
                            <li key={key}>
                              <button
                                type="button"
                                role="option"
                                aria-selected={active}
                                className={cn(
                                  "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                                  active
                                    ? "bg-accent text-accent-foreground"
                                    : "hover:bg-muted/60",
                                )}
                                onMouseEnter={() => setActiveIndex(index)}
                                onClick={() => goTo(item.href)}
                              >
                                <div
                                  className={cn(
                                    "flex size-8 shrink-0 items-center justify-center rounded-md border",
                                    active
                                      ? "border-transparent bg-background/80"
                                      : "border-border/60 bg-muted/50",
                                  )}
                                >
                                  <Icon className="size-3.5 opacity-80" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium leading-snug">
                                    {item.title}
                                  </p>
                                  {item.subtitle ? (
                                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                      {item.subtitle}
                                    </p>
                                  ) : null}
                                </div>
                                <ArrowRight
                                  className={cn(
                                    "size-3.5 shrink-0 text-muted-foreground transition-opacity",
                                    active ? "opacity-70" : "opacity-0",
                                  )}
                                />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })
              : null}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between gap-3 border-t border-border/80 bg-muted/30 px-4 py-2.5 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border bg-background px-1 py-0.5 font-mono text-[10px]">
                ↑↓
              </kbd>
              navigate
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="inline-flex items-center rounded border bg-background px-1 py-0.5 font-mono text-[10px]">
                <CornerDownLeft className="size-2.5" />
              </kbd>
              open
            </span>
          </div>
          <span className="inline-flex items-center gap-1">
            <kbd className="rounded border bg-background px-1 py-0.5 font-mono text-[10px]">
              esc
            </kbd>
            close
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
