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
  ChartColumn,
  CheckSquare,
  Clock3,
  CornerDownLeft,
  Loader2,
  Moon,
  NotebookPen,
  Plus,
  Search,
  Settings,
  Sparkles,
  Target,
  Timer,
  X,
} from "lucide-react";

import { searchQuery } from "@/actions/search";
import { createNote } from "@/actions/notes";
import { SearchJumpNav } from "@/components/search/search-jump-nav";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { openImxCoach } from "@/lib/imx-events";
import {
  getHighlightParts,
  pushRecentSearch,
  readRecentSearches,
  clearRecentSearches,
  resolveSearchJump,
  SEARCH_ENTITY_META,
  SEARCH_ENTITY_ORDER,
  SEARCH_JUMP_PRIMARY,
  type SearchJumpLink,
} from "@/lib/search-ui";
import { cn } from "@/lib/utils";
import type { SearchEntityType, SearchResult } from "@/types/search";

type CommandAction = {
  id: string;
  label: string;
  description: string;
  href: string;
  keywords: string[];
  icon: typeof Plus;
  /** Run a create action instead of navigating. */
  run?: "create-note" | "create-journal" | "open-coach";
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
    id: "new-note",
    label: "New note",
    description: "Create a blank note and open it",
    href: "/notes",
    keywords: ["note", "notes", "write", "new", "create"],
    icon: NotebookPen,
    run: "create-note",
  },
  {
    id: "new-journal",
    label: "Today’s journal",
    description: "Open or start today’s journal",
    href: "/notes",
    keywords: ["journal", "diary", "reflect", "today"],
    icon: Moon,
    run: "create-journal",
  },
  {
    id: "ask-imx",
    label: "Ask IMX",
    description: "Open the coach panel",
    href: "/",
    keywords: ["ask", "imx", "coach", "ai", "chat", "help"],
    icon: Sparkles,
    run: "open-coach",
  },
  {
    id: "add-event",
    label: "Add event",
    description: "Capture on today’s calendar",
    href: "/calendar?compose=1",
    keywords: ["event", "calendar", "meeting", "schedule", "add", "new"],
    icon: Calendar,
  },
  {
    id: "add-habit",
    label: "Add habit",
    description: "Open capture on the habits board",
    href: "/habits?compose=1",
    keywords: ["habit", "habits", "ritual", "streak", "add", "new", "create"],
    icon: CheckSquare,
  },
  {
    id: "add-goal",
    label: "Add goal",
    description: "Declare a new outcome",
    href: "/goals?compose=1",
    keywords: ["goal", "goals", "outcome", "add", "new", "create"],
    icon: Target,
  },
  {
    id: "add-book",
    label: "Add book",
    description: "Put a title on your shelf",
    href: "/books?compose=1",
    keywords: ["book", "books", "reading", "shelf", "add", "new", "create"],
    icon: BookOpen,
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
  {
    id: "check-habits",
    label: "Check habits",
    description: "Today’s habit check-ins",
    href: "/habits",
    keywords: ["habit", "habits", "streak", "check", "checkin"],
    icon: CheckSquare,
  },
  {
    id: "goals",
    label: "Open goals",
    description: "Goals and projects",
    href: "/goals",
    keywords: ["goal", "goals", "project", "projects", "progress"],
    icon: Target,
  },
  {
    id: "calendar",
    label: "Open calendar",
    description: "Schedule and events",
    href: "/calendar",
    keywords: ["calendar", "events", "schedule", "agenda"],
    icon: Calendar,
  },
  {
    id: "books",
    label: "Open books",
    description: "Reading shelf",
    href: "/books",
    keywords: ["book", "books", "reading", "shelf"],
    icon: BookOpen,
  },
  {
    id: "analytics",
    label: "Open analytics",
    description: "Streaks and patterns",
    href: "/analytics",
    keywords: ["analytics", "stats", "insights", "charts"],
    icon: ChartColumn,
  },
  {
    id: "settings",
    label: "Open settings",
    description: "Preferences and account",
    href: "/settings",
    keywords: ["settings", "prefs", "preferences", "account"],
    icon: Settings,
  },
];

type PaletteItem =
  | { kind: "action"; action: CommandAction }
  | { kind: "result"; result: SearchResult }
  | { kind: "recent"; query: string }
  | { kind: "jump"; link: SearchJumpLink };

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

function Highlighted({ text, query }: { text: string; query: string }) {
  return (
    <>
      {getHighlightParts(text, query).map((part) =>
        part.type === "mark" ? (
          <mark key={part.key} className="search-hit">
            {part.value}
          </mark>
        ) : (
          <span key={part.key}>{part.value}</span>
        ),
      )}
    </>
  );
}

type SearchDialogProps = {
  /** Open on first mount (used by deferred header host after ⌘K / click). */
  defaultOpen?: boolean;
};

export function SearchDialog({ defaultOpen = false }: SearchDialogProps) {
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const requestId = useRef(0);
  const [open, setOpen] = useState(defaultOpen);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [pending, startTransition] = useTransition();
  const [activeIndex, setActiveIndex] = useState(0);
  const [modKey, setModKey] = useState("⌘");
  const [entityFilter, setEntityFilter] = useState<SearchEntityType | "all">(
    "all",
  );
  const [recents, setRecents] = useState<string[]>([]);

  useEffect(() => {
    const isApple = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
    setModKey(isApple ? "⌘" : "Ctrl");
  }, []);

  useEffect(() => {
    function onGlobalKeyDown(event: globalThis.KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
        return;
      }

      // `/` opens the palette when you’re not typing in a field (GitHub-style).
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      if (open) return;

      const target = event.target as HTMLElement | null;
      if (!target) return;
      const tag = target.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      event.preventDefault();
      setOpen(true);
    }

    document.addEventListener("keydown", onGlobalKeyDown);
    return () => document.removeEventListener("keydown", onGlobalKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setRecents(readRecentSearches());

    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }

    const timer = window.setTimeout(() => {
      const id = ++requestId.current;
      startTransition(async () => {
        const response = await searchQuery(q);
        if (id !== requestId.current) return;
        setResults(response.results);
      });
    }, 220);

    return () => window.clearTimeout(timer);
  }, [query, open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setActiveIndex(0);
      setEntityFilter("all");
    }
  }, [open]);

  const filteredResults = useMemo(() => {
    const scoped =
      entityFilter === "all"
        ? results
        : results.filter((item) => item.entity_type === entityFilter);
    const list: SearchResult[] = [];
    for (const type of SEARCH_ENTITY_ORDER) {
      list.push(...scoped.filter((item) => item.entity_type === type));
    }
    return list;
  }, [results, entityFilter]);

  const grouped = useMemo(() => {
    const map = {} as Partial<Record<SearchEntityType, SearchResult[]>>;
    for (const item of filteredResults) {
      const list = map[item.entity_type] ?? [];
      list.push(item);
      map[item.entity_type] = list;
    }
    return map;
  }, [filteredResults]);

  const matchedActions = useMemo(() => matchActions(query), [query]);
  const trimmed = query.trim();
  const showIdle = trimmed.length === 0;
  const directJump = useMemo(
    () => (showIdle ? null : resolveSearchJump(trimmed)),
    [showIdle, trimmed],
  );

  const paletteItems = useMemo((): PaletteItem[] => {
    const jumps = SEARCH_JUMP_PRIMARY.map((link) => ({
      kind: "jump" as const,
      link,
    }));

    if (showIdle) {
      return [
        ...jumps,
        ...matchedActions.map((action) => ({
          kind: "action" as const,
          action,
        })),
        ...recents.map((recent) => ({
          kind: "recent" as const,
          query: recent,
        })),
      ];
    }

    return [
      ...jumps,
      ...matchedActions.map((action) => ({
        kind: "action" as const,
        action,
      })),
      ...filteredResults.map((result) => ({
        kind: "result" as const,
        result,
      })),
    ];
  }, [showIdle, matchedActions, recents, filteredResults]);

  const activeItem = paletteItems[activeIndex];
  const activeJumpHref =
    activeItem?.kind === "jump"
      ? activeItem.link.href
      : (directJump?.href ?? null);

  const indexByKey = useMemo(() => {
    const map = new Map<string, number>();
    paletteItems.forEach((item, index) => {
      const key =
        item.kind === "action"
          ? `action-${item.action.id}`
          : item.kind === "result"
            ? `result-${item.result.entity_type}-${item.result.id}`
            : item.kind === "recent"
              ? `recent-${item.query}`
              : `jump-${item.link.href}`;
      map.set(key, index);
    });
    return map;
  }, [paletteItems]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, entityFilter, filteredResults.length, matchedActions.length]);

  function goTo(href: string, saveQuery?: string) {
    if (saveQuery) pushRecentSearch(saveQuery);
    setOpen(false);
    router.push(href);
  }

  function runCommand(action: CommandAction) {
    if (action.run === "create-note") {
      setOpen(false);
      startTransition(() => {
        void createNote("note");
      });
      return;
    }
    if (action.run === "create-journal") {
      setOpen(false);
      startTransition(() => {
        void createNote("journal");
      });
      return;
    }
    if (action.run === "open-coach") {
      setOpen(false);
      queueMicrotask(() => openImxCoach());
      return;
    }
    goTo(action.href);
  }

  function runActive() {
    const item = paletteItems[activeIndex];
    if (!item) return;
    if (item.kind === "action") {
      runCommand(item.action);
      return;
    }
    if (item.kind === "result") {
      goTo(item.result.href, trimmed);
      return;
    }
    if (item.kind === "recent") {
      setQuery(item.query);
      return;
    }
    goTo(item.link.href);
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

    if (event.key === "Enter") {
      event.preventDefault();
      const active = paletteItems[activeIndex];
      // Arrowed onto a content hit → open that. Otherwise page names win.
      if (active?.kind === "result") {
        runActive();
        return;
      }
      if (directJump) {
        goTo(directJump.href);
        return;
      }
      if (active) {
        runActive();
        return;
      }
      if (trimmed.length >= 2) {
        goTo(`/search?q=${encodeURIComponent(trimmed)}`, trimmed);
      }
    }
  }

  const showEmpty =
    !pending &&
    trimmed.length >= 2 &&
    filteredResults.length === 0 &&
    matchedActions.length === 0 &&
    !directJump;
  const showResults = filteredResults.length > 0;
  const resultCounts = useMemo(() => {
    const counts = {} as Partial<Record<SearchEntityType, number>>;
    for (const item of results) {
      counts[item.entity_type] = (counts[item.entity_type] ?? 0) + 1;
    }
    return counts;
  }, [results]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        size="icon"
        className="sm:hidden"
        aria-label="Search (⌘K or /)"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
      </Button>
      <Button
        variant="outline"
        className="search-trigger hidden h-9 w-[15.5rem] justify-start gap-2 border-surface-border bg-surface text-muted-foreground sm:inline-flex"
        aria-label="Search IMX (⌘K or /)"
        onClick={() => setOpen(true)}
      >
        <Search className="size-3.5 opacity-70" />
        <span className="flex-1 truncate text-left text-sm">Search IMX…</span>
        <span className="pointer-events-none flex items-center gap-1">
          <kbd className="inline-flex h-5 items-center rounded-md border border-border/70 bg-muted/70 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            {modKey}K
          </kbd>
          <kbd className="inline-flex h-5 items-center rounded-md border border-border/70 bg-muted/70 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            /
          </kbd>
        </span>
      </Button>

      <DialogContent
        showCloseButton={false}
        className="search-palette top-[10vh] max-w-2xl translate-y-0 gap-0 overflow-hidden border-border/70 bg-background p-0 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 sm:top-[12vh]"
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

        <div className="search-palette-wash" aria-hidden />
        <div className="search-palette-glow" aria-hidden />

        <div className="relative z-[1] flex items-center gap-3 border-b border-border/60 px-4">
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
            placeholder="Search or jump…"
            className="h-14 w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/65"
            aria-label="Search or run a command"
            aria-controls={listId}
            aria-autocomplete="list"
            autoComplete="off"
            spellCheck={false}
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>

        {trimmed.length >= 2 ? (
          <div className="relative z-[1] flex gap-1.5 overflow-x-auto border-b border-border/50 px-3 py-2.5">
            <button
              type="button"
              onClick={() => setEntityFilter("all")}
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                entityFilter === "all"
                  ? "bg-foreground text-background"
                  : "bg-muted/60 text-muted-foreground hover:text-foreground",
              )}
            >
              All · {results.length}
            </button>
            {SEARCH_ENTITY_ORDER.map((type) => {
              const count = resultCounts[type] ?? 0;
              if (count === 0) return null;
              const meta = SEARCH_ENTITY_META[type];
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setEntityFilter(type)}
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                    entityFilter === type
                      ? "bg-foreground text-background"
                      : "bg-muted/60 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {meta.plural} · {count}
                </button>
              );
            })}
          </div>
        ) : null}

        <ScrollArea className="relative z-[1] max-h-[min(26rem,56vh)]">
          <div id={listId} className="px-2 py-2" role="listbox">
            <div className="mb-2 px-2 pt-2 pb-1">
              <SearchJumpNav
                query={trimmed}
                variant="palette"
                activeHref={activeJumpHref}
                onJump={(link) => goTo(link.href)}
                onHoverHref={(href) => {
                  const index = indexByKey.get(`jump-${href}`);
                  if (index !== undefined) setActiveIndex(index);
                }}
              />
            </div>

            {matchedActions.length > 0 ? (
              <div className="mb-1">
                <div className="flex items-center gap-1.5 px-3 pb-1.5 pt-2">
                  <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
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
                            "search-palette-row group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                            active
                              ? "bg-foreground text-background"
                              : "hover:bg-muted/70",
                          )}
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => runCommand(action)}
                        >
                          <div
                            className={cn(
                              "flex size-9 shrink-0 items-center justify-center rounded-xl border",
                              active
                                ? "border-transparent bg-background/15"
                                : "border-border/60 bg-muted/50",
                            )}
                          >
                            <Icon className="size-3.5 opacity-90" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium leading-snug">
                              {action.label}
                            </p>
                            <p
                              className={cn(
                                "mt-0.5 truncate text-xs",
                                active
                                  ? "text-background/70"
                                  : "text-muted-foreground",
                              )}
                            >
                              {action.description}
                            </p>
                          </div>
                          <ArrowRight
                            className={cn(
                              "size-3.5 shrink-0 transition-opacity",
                              active ? "opacity-80" : "opacity-0",
                            )}
                          />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}

            {showIdle && recents.length > 0 ? (
              <div className="mb-1">
                <div className="flex items-center justify-between gap-2 px-3 pb-1.5 pt-2">
                  <div className="flex items-center gap-1.5">
                    <Clock3 className="size-3 text-muted-foreground" />
                    <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      Recent
                    </span>
                  </div>
                  <button
                    type="button"
                    className="text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                    onClick={() => {
                      clearRecentSearches();
                      setRecents([]);
                    }}
                  >
                    Clear
                  </button>
                </div>
                <ul className="space-y-0.5">
                  {recents.map((recent) => {
                    const key = `recent-${recent}`;
                    const index = indexByKey.get(key) ?? 0;
                    const active = index === activeIndex;
                    return (
                      <li key={key}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={active}
                          className={cn(
                            "search-palette-row flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors",
                            active
                              ? "bg-foreground text-background"
                              : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                          )}
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => setQuery(recent)}
                        >
                          <Search className="size-3.5 shrink-0 opacity-70" />
                          <span className="truncate">{recent}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}

            {showEmpty ? (
              <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
                <div className="flex size-11 items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/40">
                  <Search className="size-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">No matches</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Nothing matched “{trimmed}”
                  </p>
                </div>
                <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    className="inline-flex h-8 items-center rounded-lg bg-foreground px-3 text-xs font-medium text-background transition-opacity hover:opacity-90"
                    onClick={() => goTo("/tasks?compose=1")}
                  >
                    Add task
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-8 items-center rounded-lg border border-surface-border bg-surface px-3 text-xs font-medium text-foreground transition-colors hover:border-border"
                    onClick={() => {
                      setOpen(false);
                      startTransition(() => {
                        void createNote("note");
                      });
                    }}
                  >
                    New note
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-8 items-center rounded-lg border border-surface-border bg-surface px-3 text-xs font-medium text-foreground transition-colors hover:border-border"
                    onClick={() => goTo("/calendar?compose=1")}
                  >
                    Add event
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-8 items-center rounded-lg border border-surface-border bg-surface px-3 text-xs font-medium text-foreground transition-colors hover:border-border"
                    onClick={() => goTo("/habits?compose=1")}
                  >
                    Add habit
                  </button>
                </div>
                <button
                  type="button"
                  className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                  onClick={() =>
                    goTo(`/search?q=${encodeURIComponent(trimmed)}`, trimmed)
                  }
                >
                  Open full search
                </button>
              </div>
            ) : null}

            {showResults
              ? SEARCH_ENTITY_ORDER.map((type) => {
                  const items = grouped[type];
                  if (!items?.length) return null;
                  const meta = SEARCH_ENTITY_META[type];
                  const Icon = meta.icon;

                  return (
                    <div key={type} className="mb-1">
                      <div className="flex items-center gap-1.5 px-3 pb-1.5 pt-2">
                        <Icon className="size-3 text-muted-foreground" />
                        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                          {meta.plural}
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
                                  "search-palette-row group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                                  active
                                    ? "bg-foreground text-background"
                                    : "hover:bg-muted/70",
                                )}
                                onMouseEnter={() => setActiveIndex(index)}
                                onClick={() => goTo(item.href, trimmed)}
                              >
                                <div
                                  className={cn(
                                    "flex size-9 shrink-0 items-center justify-center rounded-xl border",
                                    active
                                      ? "border-transparent bg-background/15"
                                      : "border-border/60 bg-muted/50",
                                  )}
                                >
                                  <Icon className="size-3.5 opacity-90" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium leading-snug">
                                    <Highlighted
                                      text={item.title}
                                      query={trimmed}
                                    />
                                  </p>
                                  {item.subtitle ? (
                                    <p
                                      className={cn(
                                        "mt-0.5 truncate text-xs",
                                        active
                                          ? "text-background/70"
                                          : "text-muted-foreground",
                                      )}
                                    >
                                      {item.subtitle}
                                    </p>
                                  ) : null}
                                </div>
                                <ArrowRight
                                  className={cn(
                                    "size-3.5 shrink-0 transition-opacity",
                                    active ? "opacity-80" : "opacity-0",
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

        <div className="relative z-[1] flex items-center justify-between gap-3 border-t border-border/60 bg-muted/25 px-4 py-2.5 text-[11px] text-muted-foreground">
          <div className="flex flex-wrap items-center gap-3">
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
              {directJump ? `go ${directJump.label}` : "open"}
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border bg-background px-1 py-0.5 font-mono text-[10px]">
                Esc
              </kbd>
              close
            </span>
          </div>
          <button
            type="button"
            className="shrink-0 transition-colors hover:text-foreground"
            onClick={() =>
              goTo(
                trimmed.length >= 2
                  ? `/search?q=${encodeURIComponent(trimmed)}`
                  : "/search",
                trimmed.length >= 2 ? trimmed : undefined,
              )
            }
          >
            Full page ↗
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
