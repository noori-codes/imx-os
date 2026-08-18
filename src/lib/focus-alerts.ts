"use client";

export function playFocusChime() {
  if (typeof window === "undefined") return;

  const AudioCtx =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) return;

  const ctx = new AudioCtx();
  const now = ctx.currentTime;
  const gain = ctx.createGain();
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

  const notes = [
    { freq: 523.25, start: 0 },
    { freq: 659.25, start: 0.14 },
    { freq: 783.99, start: 0.28 },
  ];

  for (const note of notes) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = note.freq;
    osc.connect(gain);
    osc.start(now + note.start);
    osc.stop(now + note.start + 0.35);
  }

  window.setTimeout(() => {
    void ctx.close();
  }, 900);
}

export async function requestFocusNotifyPermission() {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return;
  }
  if (Notification.permission === "default") {
    await Notification.requestPermission().catch(() => undefined);
  }
}

export function notifyFocusPhase(title: string, body: string) {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return;
  }
  if (Notification.permission !== "granted") return;

  try {
    new Notification(title, { body, silent: true });
  } catch {
    /* ignore */
  }
}
