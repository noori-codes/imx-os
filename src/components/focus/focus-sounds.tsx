"use client";

import { Volume2, VolumeX } from "lucide-react";

import { cn } from "@/lib/utils";
import { FOCUS_TRACKS, useFocusSound } from "@/stores/focus-sound";

export function FocusSounds() {
  const { activeId, playing, volume, toggle, setVolume } = useFocusSound();
  const active =
    FOCUS_TRACKS.find((track) => track.id === activeId) ?? FOCUS_TRACKS[3];

  return (
    <div className="focus-sound-dock relative w-full">
      {playing ? (
        <div
          className="pointer-events-none absolute inset-x-8 -top-10 h-20 rounded-full opacity-70 blur-2xl"
          style={{
            background:
              "radial-gradient(circle at center, color-mix(in oklab, var(--foreground) 10%, transparent), transparent 70%)",
          }}
          aria-hidden
        />
      ) : null}

      <div className="relative flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Atmosphere
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {playing ? (
              <span className="inline-flex items-center gap-2">
                <span className="inline-flex h-3.5 items-end gap-0.5" aria-hidden>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span
                      key={i}
                      className="focus-eq-bar w-0.5 rounded-full bg-foreground/65"
                      style={{
                        height: "100%",
                        animationDelay: `${i * 0.1}s`,
                      }}
                    />
                  ))}
                </span>
                {active.hint} room
              </span>
            ) : (
              "Choose a texture for the room"
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setVolume(volume > 0 ? 0 : 0.55)}
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
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
            className="h-1 w-16 accent-foreground sm:w-20"
            aria-label="Volume"
          />
        </div>
      </div>

      <div
        className="relative mt-5 grid grid-cols-4 gap-3 sm:gap-4"
        role="listbox"
        aria-label="Ambient tracks"
      >
        {FOCUS_TRACKS.map((track) => {
          const isLive = playing && activeId === track.id;
          return (
            <button
              key={track.id}
              type="button"
              role="option"
              aria-selected={isLive}
              onClick={() => void toggle(track.id)}
              className="group/orb flex flex-col items-center gap-2.5 text-center"
            >
              <span className="relative flex size-14 items-center justify-center sm:size-16">
                {isLive ? (
                  <span
                    className="absolute inset-0 animate-ping rounded-full bg-foreground/10"
                    aria-hidden
                  />
                ) : null}
                <span
                  className={cn(
                    "relative size-11 rounded-full bg-linear-to-br shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition-all duration-300 sm:size-12",
                    track.tone,
                    isLive
                      ? "scale-110 ring-2 ring-foreground/35"
                      : "opacity-70 group-hover/orb:scale-105 group-hover/orb:opacity-100",
                  )}
                />
              </span>
              <span className="min-w-0">
                <span
                  className={cn(
                    "block text-[11px] font-medium tracking-wide",
                    isLive ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {track.hint}
                </span>
                <span className="block text-[10px] text-muted-foreground/70">
                  {isLive ? "Playing" : "Cue"}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
