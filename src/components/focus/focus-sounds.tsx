"use client";

import { Volume2, VolumeX } from "lucide-react";

import { cn } from "@/lib/utils";
import { FOCUS_TRACKS, useFocusSound } from "@/stores/focus-sound";

export function FocusSounds() {
  const { activeId, playing, volume, toggle, setVolume } = useFocusSound();
  const active =
    FOCUS_TRACKS.find((track) => track.id === activeId) ?? FOCUS_TRACKS[3];

  return (
    <div className="focus-sound-dock w-full max-w-xl">
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Ambient
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {playing ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-flex h-3 items-end gap-0.5" aria-hidden>
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="focus-eq-bar w-0.5 rounded-full bg-foreground/70"
                      style={{
                        height: "100%",
                        animationDelay: `${i * 0.12}s`,
                      }}
                    />
                  ))}
                </span>
                {active.label}
              </span>
            ) : (
              <>Ready · {active.label}</>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setVolume(volume > 0 ? 0 : 0.55)}
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={volume > 0 ? "Mute ambient" : "Unmute ambient"}
          >
            {volume > 0 ? (
              <Volume2 className="size-3.5" />
            ) : (
              <VolumeX className="size-3.5" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="h-1 w-20 accent-foreground sm:w-24"
            aria-label="Volume"
          />
        </div>
      </div>

      <div
        className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="listbox"
        aria-label="Ambient tracks"
      >
        {FOCUS_TRACKS.map((track) => {
          const isActive = activeId === track.id;
          const isLive = isActive && playing;
          return (
            <button
              key={track.id}
              type="button"
              role="option"
              aria-selected={isActive}
              onClick={() => void toggle(track.id)}
              className={cn(
                "group/track flex min-w-[6.5rem] flex-1 items-center gap-2.5 rounded-2xl border px-2.5 py-2 text-left transition-all",
                isActive
                  ? "border-foreground/20 bg-foreground text-background shadow-sm"
                  : "border-border/50 bg-background/50 text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "size-8 shrink-0 rounded-xl bg-linear-to-br ring-1",
                  track.tone,
                  isActive ? "ring-background/30" : "ring-border/40",
                )}
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">
                  {track.label}
                </span>
                <span
                  className={cn(
                    "block text-[11px]",
                    isActive ? "text-background/70" : "text-muted-foreground",
                  )}
                >
                  {isLive ? "Playing" : track.hint}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
