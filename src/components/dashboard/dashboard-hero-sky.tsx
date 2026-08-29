"use client";

import { useEffect, useId, useState } from "react";

import {
  FOCUS_SKY_ARC,
  skyArcPath,
  skyArcPoint,
  skyTimeToT,
} from "@/lib/focus-sky";
import { cn } from "@/lib/utils";

type DashboardHeroSkyProps = {
  sessions: number;
  focusMinutes: number;
  emphasize: boolean;
};

type SkyStar = {
  key: string;
  x: number;
  y: number;
  r: number;
  lit: boolean;
};

const DUST_STARS = [
  { t: 0.18, r: 0.55 },
  { t: 0.52, r: 0.45 },
  { t: 0.82, r: 0.5 },
] as const;

function buildStars(sessions: number): SkyStar[] {
  if (sessions <= 0) {
    return DUST_STARS.map((star, index) => {
      const point = skyArcPoint(star.t);
      return {
        key: `dust-${index}`,
        x: point.x,
        y: point.y,
        r: star.r,
        lit: false,
      };
    });
  }

  const count = Math.min(sessions, 7);
  return Array.from({ length: count }, (_, index) => {
    const t =
      count === 1 ? 0.5 : 0.1 + (index / (count - 1)) * 0.8;
    const point = skyArcPoint(t);
    const minutesBoost = Math.min(1.2, 0.85 + sessions * 0.05);
    return {
      key: `session-${index}`,
      x: point.x,
      y: point.y,
      r: 0.95 * minutesBoost,
      lit: true,
    };
  });
}

export function DashboardHeroSky({
  sessions,
  focusMinutes,
  emphasize,
}: DashboardHeroSkyProps) {
  const uid = useId().replace(/:/g, "");
  const [nowT, setNowT] = useState(0.5);
  const stars = buildStars(sessions);
  const arc = skyArcPath(0.04, 0.96);
  const now = skyArcPoint(nowT);
  const active = emphasize && focusMinutes > 0;

  useEffect(() => {
    setNowT(skyTimeToT(new Date()));
    const timer = window.setInterval(() => {
      setNowT(skyTimeToT(new Date()));
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div
      className={cn("dash-hero-sky", active && "dash-hero-sky-active")}
      data-sessions={sessions > 0 ? "true" : "false"}
      aria-hidden="true"
    >
      <svg viewBox="6 14 88 52" className="dash-hero-sky-svg">
        <defs>
          <linearGradient
            id={`dash-hero-sky-dome-${uid}`}
            x1="0"
            y1="0"
            x2="1"
            y2="0"
          >
            <stop offset="0%" stopColor="oklch(0.84 0.11 58)" stopOpacity="0.2" />
            <stop
              offset="45%"
              stopColor="oklch(0.78 0.05 235)"
              stopOpacity="0.08"
            />
            <stop
              offset="100%"
              stopColor="oklch(0.58 0.14 285)"
              stopOpacity="0.22"
            />
          </linearGradient>
          <linearGradient
            id={`dash-hero-sky-arc-${uid}`}
            x1="0"
            y1="0"
            x2="1"
            y2="0"
          >
            <stop offset="0%" stopColor="oklch(0.88 0.1 62)" stopOpacity="0.35" />
            <stop
              offset="48%"
              stopColor="oklch(0.95 0.02 240)"
              stopOpacity="0.5"
            />
            <stop
              offset="100%"
              stopColor="oklch(0.72 0.12 290)"
              stopOpacity="0.42"
            />
          </linearGradient>
          <radialGradient id={`dash-hero-now-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.9" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
        </defs>

        <path
          d={`M ${FOCUS_SKY_ARC.cx - FOCUS_SKY_ARC.r} ${FOCUS_SKY_ARC.cy} A ${FOCUS_SKY_ARC.r} ${FOCUS_SKY_ARC.r} 0 0 1 ${FOCUS_SKY_ARC.cx + FOCUS_SKY_ARC.r} ${FOCUS_SKY_ARC.cy} Z`}
          fill={`url(#dash-hero-sky-dome-${uid})`}
          className="dash-hero-sky-fill"
        />

        {arc ? (
          <path
            d={arc}
            fill="none"
            stroke={`url(#dash-hero-sky-arc-${uid})`}
            strokeWidth="0.75"
            strokeLinecap="round"
            className="dash-hero-sky-arc"
          />
        ) : null}

        {stars.map((star, index) => (
          <circle
            key={star.key}
            cx={star.x}
            cy={star.y}
            r={star.r}
            className={cn(
              "dash-hero-sky-star",
              star.lit ? "dash-hero-sky-star-lit" : "dash-hero-sky-star-dust",
            )}
            style={{ animationDelay: `${index * 0.7}s` }}
          />
        ))}

        <circle
          cx={now.x}
          cy={now.y}
          r={1.35}
          className="dash-hero-sky-now fill-foreground/70"
        />
        <circle
          cx={now.x}
          cy={now.y}
          r={3.2}
          fill={`url(#dash-hero-now-${uid})`}
          className="dash-hero-sky-now-halo text-foreground/25"
        />
      </svg>
    </div>
  );
}
