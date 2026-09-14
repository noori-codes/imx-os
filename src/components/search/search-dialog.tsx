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
  BookOpen,
  Calendar,
  CheckSquare,
  CornerDownLeft,
  FileText,
  FolderKanban,
  ListTodo,
  Loader2,
  Moon,
  Plus,
  Search,
  Target,
  Timer,
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
  book: { label: "Books", icon: BookOpen },
};

const ENTITY_ORDER: SearchEntityType[] = [
  "task",
  "goal",
  "project",
  "note",
  "habit",
  "event",
  "book",
];

type CommandAction = {
  id: string;
  label: string;
  description: string;
  href: string;
  keywords: string[];
  icon: LucideIcon;
};

const COMMAND_ACTIONS: CommandAction[] = [
  {
    id: "add-task",
    label: "Add task",
    description: "Open capture on the tasks board",
    href: "/tasks?compose=1",
    keywords: ["add", "task", "new", "create", "todo", "capture"],
    icon: Plus,
  },
  {
    id: "start-focus",
    label: "Start focus",
    description: "Jump to the timer",
    href: "/focus",
    keywords: ["focus", "timer", "pomodoro", "start", "session"],
    icon: Timer,
  },
  {
    id: "review",
    label: "Daily review",
    description: "Reflect on the day",
    href: "/review",
    keywords: ["review", "reflect", "journal", "daily"],
    icon: Moon,
  },
];

type PaletteItem =
  | { kind: "action"; action: CommandAction }
  | { kind: "result"; result: SearchResult };

function matchActions(query: string): CommandAction[] {
  const q = query.trim().toLowerCase();
  if (!q) return COMMAND_ACTIONS;
  return COMMAND_ACTIONS.filter((action) => {
    if (action.label.toLowerCase().includes(q)) return true;
    if (action.description.toLowerCase().includes(q)) return true;
    return action.keywords.some(
      (keyword) => keyword.includes(q) || q.includes(keyword),
    );
  });
}

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

  const matchedActions = useMemo(() => matchActions(query), [query]);

  const paletteItems = useMemo((): PaletteItem[] => {
    return [
      ...matchedActions.map((action) => ({ kind: "action" as const, action })),
      ...orderedResults.map((result) => ({ kind: "result" as const, result })),
    ];
  }, [matchedActions, orderedResults]);

  const indexByKey = useMemo(() => {
    const map = new Map<string, number>();
    paletteItems.forEach((item, index) => {
      const key =
        item.kind === "action"
          ? `action-${item.action.id}`
          : `result-${item.result.entity_type}-${item.result.id}`;
      map.set(key, index);
    });
    return map;
  }, [paletteItems]);

  function goTo(href: string) {
    setOpen(false);
    router.push(href);
  }

  function runActive() {
    const item = paletteItems[activeIndex];
    if (!item) return;
    if (item.kind === "action") {
      goTo(item.action.href);
      return;
    }
    goTo(item.result.href);
  }

  function onKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) =>
        paletteItems.length === 0
          ? 0
          : Math.min(index + 1, paletteItems.length - 1),
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
      return;
    }

    if (event.key === "Enter" && paletteItems[activeIndex]) {
      event.preventDefault();
      runActive();
    }
  }

  const trimmed = query.trim();
  const showIdle = trimmed.length === 0;
  const showActions = matchedActions.length > 0;
  const showEmpty =
    !pending &&
    trimmed.length >= 2 &&
    orderedResults.length === 0 &&
    matchedActions.length === 0;
  const showResults = orderedResults.length > 0;

  useEffect(() => {
    setActiveIndex(0);
  }, [matchedActions.length, orderedResults.length, query]);

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
          <DialogTitle>Command palette</DialogTitle>
          <DialogDescription>
            Run actions or search tasks, notes, books, goals, and more.
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
            placeholder="Search or jump to an action…"
            className="h-14 w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/70"
            aria-label="Search or run a command"
            aria-controls={listId}
            aria-autocomplete="list"
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <ScrollArea className="max-h-[min(22rem,52vh)]">
          <div id={listId} className="px-2 py-2" role="listbox">
            {showActions ? (
              <div className="mb-1">
                <div className="flex items-center gap-1.5 px-3 pb-1.5 pt-2">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Actions
                  </span>
                </div>
                <ul className="space-y-0.5">
                  {matchedActions.map((action) => {
                    const key = `action-${action.id}`;
                    const index = indexByKey.get(key) ?? 0;
                    const active = index === activeIndex;
                    const Icon = action.icon;

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
                          onClick={() => goTo(action.href)}
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
                              {action.label}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {action.description}
                            </p>
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
            ) : null}

            {showIdle ? (
              <p className="mt-1 px-3 pb-2 text-center text-xs text-muted-foreground/80">
                Type to search · ↑↓ to navigate · Enter to run
              </p>
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
                          const key = `result-${item.entity_type}-${item.id}`;
                          const index = indexByKey.get(key) ?? 0;
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
              run
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
