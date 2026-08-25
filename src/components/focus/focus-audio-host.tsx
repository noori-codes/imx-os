"use client";

import { useEffect, useRef } from "react";

import { attachFocusAudio } from "@/stores/focus-sound";

const AUDIO_ID = "imx-focus-audio";

export function FocusAudioHost() {
  const ref = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    attachFocusAudio(ref.current);
  }, []);

  return (
    <audio
      ref={ref}
      id={AUDIO_ID}
      loop
      preload="none"
      className="hidden"
    />
  );
}
