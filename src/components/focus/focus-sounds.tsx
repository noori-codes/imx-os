"use client";

import { Pause, Play, Volume2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { FOCUS_TRACKS, useFocusSound } from "@/stores/focus-sound";

export function FocusSounds() {
  const { activeId, playing, volume, play, pause, toggle, setVolume } =
    useFocusSound();
  const active = FOCUS_TRACKS.find((track) => track.id === activeId) ?? FOCUS_TRACKS[3];

  return (
    <aside className="flex flex-col rounded-3xl border bg-card p-5 sm:p-6 lg:sticky lg:top-20">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Player
      </p>

      <div className="mt-5 flex items-center gap-4">
        <div
          className={cn(
            "relative flex size-16 shrink-0 items-end justify-center gap-0.5 overflow-hidden rounded-2xl bg-gradient-to-br p-4",
            active.tone,
          )}
        >
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={cn(
                "w-1 rounded-full bg-foreground/70",
                playing ? "focus-eq-bar h-full" : "h-2",
              )}
              style={playing ? { animationDelay: `${i * 0.12}s` } : undefined}
            />
          ))}
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium">{active.label}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {playing ? "Playing" : "Paused"} · {active.hint}
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => (playing ? pause() : void play(activeId))}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-foreground text-background"
          aria-label={playing ? "Pause sound" : "Play sound"}
        >
          {playing ? (
            <Pause className="size-4 fill-current" />
          ) : (
            <Play className="size-4 fill-current pl-0.5" />
          )}
        </button>
        <Volume2 className="size-4 shrink-0 text-muted-foreground" />
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="h-1.5 w-full accent-foreground"
          aria-label="Volume"
        />
      </div>

      <ul className="mt-6 grid grid-cols-2 gap-2">
        {FOCUS_TRACKS.map((track) => {
          const isActive = activeId === track.id;
          return (
            <li key={track.id}>
              <button
                type="button"
                onClick={() => void toggle(track.id)}
                className={cn(
                  "flex w-full flex-col items-start rounded-2xl border bg-gradient-to-br p-3.5 text-left transition-colors",
                  track.tone,
                  isActive
                    ? "border-foreground/20 ring-1 ring-foreground/15"
                    : "border-transparent hover:border-border",
                )}
                aria-pressed={isActive && playing}
              >
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {isActive && playing ? (
                    <Pause className="size-3" />
                  ) : (
                    <Play className="size-3" />
                  )}
                  {track.hint}
                </span>
                <span className="mt-1 text-sm font-medium">{track.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
