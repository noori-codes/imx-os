"use client";

import { create } from "zustand";

export const FOCUS_TRACKS = [
  {
    id: "first",
    label: "Warm desk",
    hint: "Warm",
    scene: "warm-desk",
    tone: "from-foreground/20 to-foreground/5",
    src: "/first-audio.mp3",
  },
  {
    id: "second",
    label: "Night air",
    hint: "Air",
    scene: "night-air",
    tone: "from-foreground/25 to-muted/40",
    src: "/second-audio.mp3",
  },
  {
    id: "third",
    label: "Soft rain",
    hint: "Soft",
    scene: "soft-rain",
    tone: "from-muted-foreground/25 to-foreground/5",
    src: "/third-audio.mp3",
  },
  {
    id: "fourth",
    label: "Deep library",
    hint: "Deep",
    scene: "deep-library",
    tone: "from-foreground/18 to-muted/50",
    src: "/forth-audio.mp3",
  },
] as const;

export type FocusSceneId = (typeof FOCUS_TRACKS)[number]["scene"];

export const DEFAULT_FOCUS_TRACK = "fourth";

const VOLUME_KEY = "imx-focus-sound-volume";
const SCENE_KEY = "imx-focus-scene";
const AUDIO_ID = "imx-focus-audio";

type FocusSoundState = {
  activeId: string;
  playing: boolean;
  volume: number;
  play: (id?: string) => Promise<void>;
  pause: () => void;
  toggle: (id?: string) => Promise<void>;
  setVolume: (volume: number) => void;
  setScene: (id: string) => void;
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
    el.preload = "none";
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

export function focusSceneForTrack(id: string): FocusSceneId {
  return trackById(id).scene;
}

function readVolume() {
  if (typeof window === "undefined") return 0.7;
  const saved = window.localStorage.getItem(VOLUME_KEY);
  const next = saved ? Number(saved) : 0.7;
  return Number.isFinite(next) && next >= 0 && next <= 1 ? next : 0.7;
}

function readSavedTrack() {
  if (typeof window === "undefined") return DEFAULT_FOCUS_TRACK;
  const saved = window.localStorage.getItem(SCENE_KEY);
  if (saved && FOCUS_TRACKS.some((track) => track.id === saved)) return saved;
  return DEFAULT_FOCUS_TRACK;
}

function persistTrack(id: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SCENE_KEY, id);
  } catch {
    /* ignore */
  }
}

function applySceneAttr(id: string) {
  if (typeof document === "undefined") return;
  const scene = focusSceneForTrack(id);
  document.documentElement.dataset.focusScene = scene;
  document
    .querySelectorAll<HTMLElement>(".focus-studio, .focus-session-lock, .focus-stage")
    .forEach((el) => {
      el.dataset.focusScene = scene;
    });
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

    const trackId = id ?? get().activeId ?? DEFAULT_FOCUS_TRACK;
    const track = trackById(trackId);
    const nextSrc = new URL(track.src, window.location.origin).href;

    el.muted = false;
    el.volume = get().volume;
    persistTrack(trackId);
    applySceneAttr(trackId);
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

  setScene: (id) => {
    const track = trackById(id);
    persistTrack(track.id);
    applySceneAttr(track.id);
    set({ activeId: track.id });
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

/** Hydrate persisted scene on Focus mount (client only). */
export function hydrateFocusScene() {
  if (typeof window === "undefined") return;
  const id = readSavedTrack();
  useFocusSound.setState({ activeId: id });
  applySceneAttr(id);
}

export function playDefaultFocusSound() {
  const id = useFocusSound.getState().activeId || readSavedTrack();
  void useFocusSound.getState().play(id);
}

export function stopFocusSound() {
  useFocusSound.getState().pause();
}
