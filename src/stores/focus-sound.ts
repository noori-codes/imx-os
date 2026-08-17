"use client";

import { create } from "zustand";

export const FOCUS_TRACKS = [
  { id: "first", label: "Sound 1", src: "/first-audio.mp3" },
  { id: "second", label: "Sound 2", src: "/second-audio.mp3" },
  { id: "third", label: "Sound 3", src: "/third-audio.mp3" },
  { id: "fourth", label: "Sound 4", src: "/forth-audio.mp3" },
] as const;

export const DEFAULT_FOCUS_TRACK = "fourth";

const VOLUME_KEY = "imx-focus-sound-volume";

type FocusSoundState = {
  activeId: string;
  playing: boolean;
  volume: number;
  play: (id?: string) => Promise<void>;
  pause: () => void;
  toggle: (id?: string) => Promise<void>;
  setVolume: (volume: number) => void;
};

let audio: HTMLAudioElement | null = null;

function onEnded() {
  const el = audio;
  if (!el) return;
  el.currentTime = 0;
  el.loop = true;
  void el.play().then(() => {
    useFocusSound.setState({ playing: true });
  }).catch(() => {
    useFocusSound.setState({ playing: false });
  });
}

function getAudio() {
  if (typeof window === "undefined") return null;
  if (!audio) {
    audio = new Audio();
    audio.loop = true;
    audio.preload = "auto";
    audio.addEventListener("ended", onEnded);
  }
  audio.loop = true;
  return audio;
}

function trackById(id: string) {
  return FOCUS_TRACKS.find((track) => track.id === id) ?? FOCUS_TRACKS[3];
}

export const useFocusSound = create<FocusSoundState>((set, get) => ({
  activeId: DEFAULT_FOCUS_TRACK,
  playing: false,
  volume:
    typeof window === "undefined"
      ? 0.7
      : (() => {
          const saved = window.localStorage.getItem(VOLUME_KEY);
          const next = saved ? Number(saved) : 0.7;
          return Number.isFinite(next) && next >= 0 && next <= 1 ? next : 0.7;
        })(),

  play: async (id) => {
    const el = getAudio();
    if (!el) return;

    const trackId = id ?? DEFAULT_FOCUS_TRACK;
    const track = trackById(trackId);
    const nextSrc = new URL(track.src, window.location.origin).href;

    el.loop = true;
    el.volume = get().volume;
    set({ activeId: trackId });

    if (el.src !== nextSrc) {
      el.src = track.src;
      el.loop = true;
    }

    try {
      await el.play();
      set({ playing: true });
    } catch {
      set({ playing: false });
    }
  },

  pause: () => {
    getAudio()?.pause();
    set({ playing: false });
  },

  toggle: async (id) => {
    const target = id ?? get().activeId;
    const el = getAudio();
    if (get().activeId === target && el && !el.paused) {
      get().pause();
      return;
    }
    await get().play(target);
  },

  setVolume: (volume) => {
    const next = Math.min(1, Math.max(0, volume));
    const el = getAudio();
    if (el) el.volume = next;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(VOLUME_KEY, String(next));
    }
    set({ volume: next });
  },
}));

export function playDefaultFocusSound() {
  void useFocusSound.getState().play(DEFAULT_FOCUS_TRACK);
}
