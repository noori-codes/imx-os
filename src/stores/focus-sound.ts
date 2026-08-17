"use client";

import { create } from "zustand";

export const FOCUS_TRACKS = [
  {
    id: "first",
    label: "Sound 1",
    hint: "Warm",
    tone: "from-amber-500/25 to-orange-500/5",
    src: "/first-audio.mp3",
  },
  {
    id: "second",
    label: "Sound 2",
    hint: "Air",
    tone: "from-sky-500/25 to-cyan-500/5",
    src: "/second-audio.mp3",
  },
  {
    id: "third",
    label: "Sound 3",
    hint: "Soft",
    tone: "from-violet-500/25 to-fuchsia-500/5",
    src: "/third-audio.mp3",
  },
  {
    id: "fourth",
    label: "Sound 4",
    hint: "Deep",
    tone: "from-emerald-500/25 to-teal-500/5",
    src: "/forth-audio.mp3",
  },
] as const;

export const DEFAULT_FOCUS_TRACK = "fourth";

const VOLUME_KEY = "imx-focus-sound-volume";
const AUDIO_ID = "imx-focus-audio";

type FocusSoundState = {
  activeId: string;
  playing: boolean;
  volume: number;
  play: (id?: string) => Promise<void>;
  pause: () => void;
  toggle: (id?: string) => Promise<void>;
  setVolume: (volume: number) => void;
};

declare global {
  interface Window {
    __imxFocusAudio?: HTMLAudioElement;
    __imxFocusWantSound?: boolean;
    __imxFocusPlayers?: HTMLAudioElement[];
  }
}

function registry() {
  if (typeof window === "undefined") return [];
  if (!window.__imxFocusPlayers) window.__imxFocusPlayers = [];
  return window.__imxFocusPlayers;
}

function remember(el: HTMLAudioElement) {
  const list = registry();
  if (!list.includes(el)) list.push(el);
}

function wantsSound() {
  return typeof window !== "undefined" && window.__imxFocusWantSound === true;
}

function enableLoop(el: HTMLAudioElement) {
  el.loop = true;
  el.setAttribute("loop", "");
}

function halt(el: HTMLAudioElement) {
  el.muted = true;
  el.pause();
}

function haltAll() {
  if (typeof window === "undefined") return;

  window.__imxFocusWantSound = false;

  const seen = new Set<HTMLAudioElement>();
  const candidates: Array<HTMLAudioElement | null | undefined> = [
    window.__imxFocusAudio,
    document.getElementById(AUDIO_ID) as HTMLAudioElement | null,
    ...registry(),
    ...Array.from(document.querySelectorAll("audio")),
  ];

  for (const el of candidates) {
    if (!el || seen.has(el)) continue;
    seen.add(el);
    halt(el);
  }
}

function bindGuards(el: HTMLAudioElement) {
  if (el.dataset.imxBound === "true") return;
  el.dataset.imxBound = "true";
  remember(el);

  el.addEventListener("play", () => {
    enableLoop(el);
    if (!wantsSound()) {
      halt(el);
      useFocusSound.setState({ playing: false });
      return;
    }
    useFocusSound.setState({ playing: true });
  });

  el.addEventListener("pause", () => {
    if (!wantsSound()) {
      useFocusSound.setState({ playing: false });
    }
  });

  el.addEventListener("ended", () => {
    if (!wantsSound()) {
      useFocusSound.setState({ playing: false });
      return;
    }
    enableLoop(el);
    el.currentTime = 0;
    void el.play().catch(() => {
      window.__imxFocusWantSound = false;
      useFocusSound.setState({ playing: false });
    });
  });
}

function getAudio() {
  if (typeof window === "undefined") return null;

  const hosted = document.getElementById(AUDIO_ID);
  if (hosted instanceof HTMLAudioElement) {
    window.__imxFocusAudio = hosted;
    enableLoop(hosted);
    bindGuards(hosted);
    return hosted;
  }

  let el = window.__imxFocusAudio;
  if (!el) {
    el = document.createElement("audio");
    el.preload = "auto";
    enableLoop(el);
    window.__imxFocusAudio = el;
  }
  bindGuards(el);
  return el;
}

export function attachFocusAudio(el: HTMLAudioElement | null) {
  if (!el) return;
  window.__imxFocusAudio = el;
  enableLoop(el);
  bindGuards(el);
}

function trackById(id: string) {
  return FOCUS_TRACKS.find((track) => track.id === id) ?? FOCUS_TRACKS[3];
}

function readVolume() {
  if (typeof window === "undefined") return 0.7;
  const saved = window.localStorage.getItem(VOLUME_KEY);
  const next = saved ? Number(saved) : 0.7;
  return Number.isFinite(next) && next >= 0 && next <= 1 ? next : 0.7;
}

export const useFocusSound = create<FocusSoundState>((set, get) => ({
  activeId: DEFAULT_FOCUS_TRACK,
  playing: false,
  volume: readVolume(),

  play: async (id) => {
    if (typeof window === "undefined") return;
    const el = getAudio();
    if (!el) return;

    window.__imxFocusWantSound = true;

    const trackId = id ?? DEFAULT_FOCUS_TRACK;
    const track = trackById(trackId);
    const nextSrc = new URL(track.src, window.location.origin).href;

    el.muted = false;
    el.volume = get().volume;
    set({ activeId: trackId, playing: true });

    if (el.src !== nextSrc) {
      el.src = track.src;
    }
    enableLoop(el);

    try {
      await el.play();
    } catch {
      if (wantsSound()) {
        window.__imxFocusWantSound = false;
        set({ playing: false });
      }
      return;
    }

    if (!wantsSound()) {
      haltAll();
      set({ playing: false });
    }
  },

  pause: () => {
    haltAll();
    set({ playing: false });
  },

  toggle: async (id) => {
    const target = id ?? get().activeId;
    const el = getAudio();
    const isThisTrack = get().activeId === target;
    const isAudible = Boolean(
      (el && !el.paused) || registry().some((player) => !player.paused),
    );

    if (isThisTrack && (get().playing || isAudible || wantsSound())) {
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

export function stopFocusSound() {
  useFocusSound.getState().pause();
}
