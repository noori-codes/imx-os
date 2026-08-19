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
    <aside className="rounded-[1.75rem] border border-border/60 bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Sound
          </p>
          <h2 className="mt-1 text-base font-semibold">Ambient player</h2>
        </div>
        <button
          type="button"
          onClick={() => (playing ? pause() : void play(activeId))}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-foreground text-background"
          aria-label={playing ? "Pause sound" : "Play sound"}
        >
          {playing ? (
            <Pause className="size-3.5 fill-current" />
          ) : (
            <Play className="size-3.5 fill-current pl-0.5" />
          )}
        </button>
      </div>

      <div className="mt-4 rounded-3xl bg-muted/45 p-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "relative flex size-14 shrink-0 items-end justify-center gap-0.5 overflow-hidden rounded-2xl bg-linear-to-br p-3",
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
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-medium">{active.label}</p>
            <p className="text-sm text-muted-foreground">
              {playing ? "Looping" : "Ready"} · {active.hint}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2.5">
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
      </div>

      <ul className="mt-4 space-y-2">
        {FOCUS_TRACKS.map((track) => {
          const isActive = activeId === track.id;
          return (
            <li key={track.id}>
              <button
                type="button"
                onClick={() => void toggle(track.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-colors",
                  isActive
                    ? "border-foreground/15 bg-muted/70"
                    : "border-transparent bg-muted/35 hover:bg-muted/60",
                )}
                aria-pressed={isActive && playing}
              >
                <span
                  className={cn(
                    "size-8 shrink-0 rounded-xl bg-linear-to-br",
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
                {isActive ? (
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {playing ? "Live" : "Selected"}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
