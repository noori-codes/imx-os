"use client";

import { Pause, Play, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FOCUS_TRACKS, useFocusSound } from "@/stores/focus-sound";

export function FocusSounds() {
  const { activeId, playing, volume, toggle, setVolume } = useFocusSound();

  return (
    <section className="mt-10 w-full max-w-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Sound
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 text-muted-foreground"
          onClick={() => void toggle()}
          aria-label={playing ? "Pause sound" : "Play sound"}
        >
          {playing ? (
            <Pause className="size-3.5" />
          ) : (
            <Play className="size-3.5" />
          )}
          {playing ? "Pause" : "Play"}
        </Button>
      </div>

      <ul className="border-t border-border/60">
        {FOCUS_TRACKS.map((track) => {
          const isActive = activeId === track.id;
          return (
            <li key={track.id} className="border-b border-border/50">
              <button
                type="button"
                onClick={() => void toggle(track.id)}
                className={cn(
                  "flex w-full items-center gap-3 py-2.5 text-left text-sm transition-colors",
                  isActive
                    ? "font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-pressed={isActive && playing}
              >
                {isActive && playing ? (
                  <Pause className="size-3.5 shrink-0" />
                ) : (
                  <Play className="size-3.5 shrink-0" />
                )}
                {track.label}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 flex items-center gap-2">
        <Volume2 className="size-3.5 shrink-0 text-muted-foreground" />
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="h-1 w-full accent-foreground"
          aria-label="Volume"
        />
      </div>
    </section>
  );
}
