"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { IMX_OPEN_SEARCH_EVENT } from "@/lib/imx-events";

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
        className="size-8 rounded-md border-border/60 sm:hidden"
        aria-label="Search (⌘K or /)"
        onClick={onOpen}
      >
        <Search className="size-4" />
      </Button>
      <Button
        variant="outline"
        className="search-trigger hidden h-8 w-56 justify-start gap-2 rounded-md border-border/60 bg-background text-muted-foreground sm:inline-flex"
        aria-label="Search IMX (⌘K or /)"
        onClick={onOpen}
      >
        <Search className="size-3.5 opacity-70" />
        <span className="flex-1 truncate text-left text-sm">Search…</span>
        <kbd className="pointer-events-none inline-flex h-5 items-center rounded border border-border/70 bg-muted/60 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          {modKey}K
        </kbd>
      </Button>
    </>
  );
}

/**
 * Keeps the heavy search palette off the critical path until ⌘K, `/`,
 * or a header trigger click.
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
    function activate() {
      setDefaultOpen(true);
      setReady(true);
    }

    function onOpenSearch() {
      activate();
    }

    function onGlobalKeyDown(event: KeyboardEvent) {
      if (ready) return;

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

    window.addEventListener(IMX_OPEN_SEARCH_EVENT, onOpenSearch);
    document.addEventListener("keydown", onGlobalKeyDown);
    return () => {
      window.removeEventListener(IMX_OPEN_SEARCH_EVENT, onOpenSearch);
      document.removeEventListener("keydown", onGlobalKeyDown);
    };
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    function onOpenSearch() {
      setDefaultOpen(true);
    }
    window.addEventListener(IMX_OPEN_SEARCH_EVENT, onOpenSearch);
    return () => window.removeEventListener(IMX_OPEN_SEARCH_EVENT, onOpenSearch);
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
