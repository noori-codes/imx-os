"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";

const SearchDialog = dynamic(
  () =>
    import("@/components/search/search-dialog").then((m) => ({
      default: m.SearchDialog,
    })),
  { ssr: false },
);

function SearchTriggers({
  modKey,
  onOpen,
}: {
  modKey: string;
  onOpen: () => void;
}) {
  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="sm:hidden"
        aria-label="Search (⌘K or /)"
        onClick={onOpen}
      >
        <Search className="size-4" />
      </Button>
      <Button
        variant="outline"
        className="search-trigger hidden h-9 w-[15.5rem] justify-start gap-2 border-border/60 bg-card/50 text-muted-foreground sm:inline-flex"
        aria-label="Search IMX (⌘K or /)"
        onClick={onOpen}
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
    </>
  );
}

/**
 * Keeps the heavy search palette off the critical path until ⌘K, `/`, or a
 * trigger click — header still shows lightweight chrome immediately.
 */
export function DeferredSearchDialog() {
  const [ready, setReady] = useState(false);
  const [defaultOpen, setDefaultOpen] = useState(false);
  const [modKey, setModKey] = useState("⌘");

  useEffect(() => {
    const isApple = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
    setModKey(isApple ? "⌘" : "Ctrl");
  }, []);

  useEffect(() => {
    if (ready) return;

    function activate() {
      setDefaultOpen(true);
      setReady(true);
    }

    function onGlobalKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        activate();
        return;
      }

      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

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
      activate();
    }

    document.addEventListener("keydown", onGlobalKeyDown);
    return () => document.removeEventListener("keydown", onGlobalKeyDown);
  }, [ready]);

  if (!ready) {
    return (
      <SearchTriggers
        modKey={modKey}
        onOpen={() => {
          setDefaultOpen(true);
          setReady(true);
        }}
      />
    );
  }

  return <SearchDialog defaultOpen={defaultOpen} />;
}
