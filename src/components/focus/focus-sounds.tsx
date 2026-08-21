"use client";

import { Pause, Play, Volume2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { FOCUS_TRACKS, useFocusSound } from "@/stores/focus-sound";

export function FocusSounds() {
  const { activeId, playing, volume, play, pause, toggle, setVolume } =
    useFocusSound();
  const active =
    FOCUS_TRACKS.find((track) => track.id === activeId) ?? FOCUS_TRACKS[3];

  return (
    <section className="imx-panel imx-panel-tight">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-medium">Ambient</h2>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {playing ? "Looping" : "Ready"} · {active.label}
          </p>
        </div>
        <button
          type="button"
          onClick={() => (playing ? pause() : void play(activeId))}
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background"
          aria-label={playing ? "Pause sound" : "Play sound"}
        >
          {playing ? (
            <Pause className="size-3.5 fill-current" />
          ) : (
            <Play className="size-3.5 fill-current pl-0.5" />
          )}
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2.5">
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

      <ul className="mt-3 space-y-1">
        {FOCUS_TRACKS.map((track) => {
          const isActive = activeId === track.id;
          return (
            <li key={track.id}>
              <button
                type="button"
                onClick={() => void toggle(track.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors",
                  isActive
                    ? "bg-muted/60"
                    : "hover:bg-muted/40",
                )}
                aria-pressed={isActive && playing}
              >
                <span
                  className={cn(
                    "size-7 shrink-0 rounded-lg bg-linear-to-br ring-1 ring-border/50",
                    track.tone,
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {track.label}
                  </span>
                  <span className="block text-[11px] text-muted-foreground">
                    {track.hint}
                  </span>
                </span>
                <span
                  className={cn(
                    "text-[11px] font-medium",
                    isActive ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {isActive ? (playing ? "Playing" : "On") : "Cue"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
