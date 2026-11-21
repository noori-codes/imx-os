"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { useReducedMotion } from "motion/react";

import { focusGrowthProgress } from "@/lib/focus-growth";
import { cn } from "@/lib/utils";
import { useFocusTimer } from "@/stores/focus-timer";
import { FOCUS_DAILY_GOAL_DEFAULT } from "@/types/focus";

/** Soft blossom for post-maturity count-up richness. */
function Blossom({
  x,
  y,
  open,
  scale = 1,
}: {
  x: number;
  y: number;
  open: number;
  scale?: number;
}) {
  if (open <= 0.04) return null;
  const s = (0.35 + open * 0.65) * scale;
  return (
    <g
      opacity={0.15 + open * 0.75}
      transform={`translate(${x} ${y}) scale(${s.toFixed(3)})`}
    >
      <ellipse cx="0" cy="-2.8" rx="1.55" ry="2.35" fill="var(--fg-blossom)" opacity={0.88} />
      <ellipse cx="2.55" cy="-0.85" rx="1.55" ry="2.35" fill="var(--fg-blossom)" opacity={0.82} transform="rotate(72 2.55 -0.85)" />
      <ellipse cx="1.55" cy="2.35" rx="1.55" ry="2.35" fill="var(--fg-blossom)" opacity={0.8} transform="rotate(144 1.55 2.35)" />
      <ellipse cx="-1.55" cy="2.35" rx="1.55" ry="2.35" fill="var(--fg-blossom)" opacity={0.8} transform="rotate(216 -1.55 2.35)" />
      <ellipse cx="-2.55" cy="-0.85" rx="1.55" ry="2.35" fill="var(--fg-blossom)" opacity={0.82} transform="rotate(288 -2.55 -0.85)" />
      <circle cx="0" cy="0" r="1.55" fill="var(--fg-blossom-heart)" opacity={0.92} />
    </g>
  );
}

function TinyFruit({
  x,
  y,
  open,
  scale = 1,
}: {
  x: number;
  y: number;
  open: number;
  scale?: number;
}) {
  if (open <= 0.05) return null;
  const s = (0.4 + open * 0.6) * scale;
  return (
    <g
      opacity={0.2 + open * 0.7}
      transform={`translate(${x} ${y}) scale(${s.toFixed(3)})`}
    >
      <ellipse cx="0" cy="1.2" rx="2.2" ry="2.6" fill="var(--fg-fruit)" />
      <ellipse cx="-0.5" cy="0.2" rx="0.7" ry="0.9" fill="var(--fg-fruit-lit)" opacity={0.55} />
      <path
        d="M0 -1.2 C 0.4 -2.4 1.2 -3 1.6 -3.4"
        stroke="var(--fg-bark)"
        strokeWidth="0.55"
        strokeLinecap="round"
        fill="none"
        opacity={0.55}
      />
    </g>
  );
}

type FocusGrowthTreeProps = {
  wilt?: boolean;
  /**
   * Focus seconds already sealed today (excludes the live session).
   * Day tree = base + live focus elapsed, scaled to the daily goal.
   */
  baseElapsedSeconds?: number;
  /** Daily focus goal in minutes — structure matures at this target. */
  dailyGoalMinutes?: number;
  /** Smaller grove for the idle board. */
  compact?: boolean;
};

/** Smoothstep gate — continuous organic reveal, not hard stage swaps. */
function reveal(growth: number, at: number, span = 0.14) {
  if (growth <= at) return 0;
  if (growth >= at + span) return 1;
  const t = (growth - at) / span;
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * Math.min(1, Math.max(0, t));
}

function breezeSlot(n: number): 1 | 2 | 3 {
  return (((Math.max(1, Math.floor(n)) - 1) % 3) + 1) as 1 | 2 | 3;
}

/** Leaf react lane — varied sway amp / phase for cascading canopy wind. */
function leafReact(n: number): 1 | 2 | 3 | 4 | 5 | 6 {
  return (((Math.max(1, Math.floor(n)) - 1) % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6;
}

type WindTier = "low" | "mid" | "high" | "crown" | "twig";

type FallingLeaf = {
  el: SVGGElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  spin: number;
  age: number;
  life: number;
  scale: number;
  liftMs: number;
  phase: number;
  lastTs: number;
};

/** Same silhouette as the on-tree Leaf illustration. */
const FALL_LEAF_PATH =
  "M0 0 C 5 -3.8 8.8 -10 8 -17 C 7.2 -22.5 3.6 -27.2 0 -28.8 C -3.6 -27.2 -7.2 -22.5 -8 -17 C -8.8 -10 -5 -3.8 0 0 Z";
const FALL_LEAF_SHADE =
  "M0 0 C 5.2 -4 9.2 -10.5 8.4 -17.5 C 7.6 -23.2 3.8 -28 0 -29.5 C -3.8 -28 -7.6 -23.2 -8.4 -17.5 C -9.2 -10.5 -5.2 -4 0 0 Z";
const FALL_LEAF_VEIN = "M0 -1.2 C 0.55 -9 0.35 -17.5 0 -26";

/**
 * Real canopy detach points — tip / mid-leaf coords from the drawn branches,
 * not arbitrary floating spawn spots.
 */
const FALL_SPAWN_POINTS: Array<[number, number]> = [
  [28, 302],
  [256, 300],
  [16, 202],
  [268, 222],
  [52, 174],
  [48, 120],
  [254, 154],
  [94, 98],
  [206, 108],
  [143, 34],
  [100, 54],
  [192, 56],
  [95, 268],
  [185, 262],
  [70, 200],
  [215, 198],
  [112, 160],
  [210, 142],
  [118, 112],
  [172, 108],
  [142, 62],
  [148, 48],
];

/**
 * Delicate botanical leaf — tip forward, slight asymmetry.
 * Outer group positions; inner group receives breeze so CSS transform
 * never overrides the SVG placement transform.
 */
function Leaf({
  x,
  y,
  rot = 0,
  scale = 1,
  open = 1,
  tone = "mid",
  breeze = 0,
}: {
  x: number;
  y: number;
  rot?: number;
  scale?: number;
  open?: number;
  tone?: "lit" | "mid" | "shade";
  breeze?: number;
}) {
  if (open <= 0.01) return null;
  const s = 0.22 + open * 0.78;
  const fold = (1 - open) * 18;
  const fill =
    tone === "lit"
      ? "var(--fg-leaf-lit)"
      : tone === "shade"
        ? "var(--fg-leaf-shade)"
        : "var(--fg-leaf)";
  const breezeAttr = breeze > 0 ? breezeSlot(breeze) : undefined;
  const react = leafReact(breeze > 0 ? breeze : 1);

  return (
    <g
      opacity={0.22 + open * 0.78}
      transform={`translate(${x} ${y}) rotate(${rot + fold * 0.35}) scale(${s * scale})`}
    >
      {/* Interactive wind layer — independent of placement + ambient flutter */}
      <g className="focus-growth-leaf-wind" data-react={react}>
        <g
          className={breezeAttr ? "focus-growth-leaf" : undefined}
          data-breeze={breezeAttr}
        >
          {/* Soft underside shade for depth */}
          <path
            d="M0 0
               C 5.2 -4 9.2 -10.5 8.4 -17.5
               C 7.6 -23.2 3.8 -28 0 -29.5
               C -3.8 -28 -7.6 -23.2 -8.4 -17.5
               C -9.2 -10.5 -5.2 -4 0 0 Z"
            fill="var(--fg-leaf-shade)"
            opacity={0.28}
            transform="translate(0.8 1.2) scale(0.92)"
          />
          <path
            d="M0 0
               C 5 -3.8 8.8 -10 8 -17
               C 7.2 -22.5 3.6 -27.2 0 -28.8
               C -3.6 -27.2 -7.2 -22.5 -8 -17
               C -8.8 -10 -5 -3.8 0 0 Z"
            fill={fill}
          />
          {/* Slight highlight lobe */}
          <path
            d="M -1.2 -4 C 0.8 -8 2.2 -14 1.6 -20 C 0.4 -18 -0.6 -12 -1.2 -4 Z"
            fill="var(--fg-leaf-lit)"
            opacity={0.35 * open}
          />
          <path
            d="M0 -1.2 C 0.55 -9 0.35 -17.5 0 -26"
            stroke="var(--fg-vein)"
            strokeWidth="0.55"
            strokeLinecap="round"
            fill="none"
            opacity={0.4 * open}
          />
        </g>
      </g>
    </g>
  );
}

/** Cluster of leaves at a tip — staggered open for continuous feel. */
function LeafTuft({
  x,
  y,
  rot = 0,
  open,
  side = 1,
  breeze = 1,
  dense = false,
}: {
  x: number;
  y: number;
  rot?: number;
  open: number;
  side?: 1 | -1;
  breeze?: number;
  dense?: boolean;
}) {
  if (open <= 0.03) return null;
  const b = breezeSlot(breeze);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <Leaf
        x={0}
        y={0}
        rot={side * -8}
        scale={1.12}
        open={reveal(open, 0, 0.5)}
        tone="lit"
        breeze={b}
      />
      <Leaf
        x={side * -8}
        y={6}
        rot={side * -42}
        scale={0.95}
        open={reveal(open, 0.1, 0.48)}
        tone="mid"
        breeze={b + 1}
      />
      <Leaf
        x={side * 8}
        y={5}
        rot={side * 38}
        scale={0.98}
        open={reveal(open, 0.18, 0.48)}
        tone="shade"
        breeze={b + 2}
      />
      <Leaf
        x={side * -3}
        y={13}
        rot={side * -20}
        scale={0.78}
        open={reveal(open, 0.32, 0.45)}
        tone="mid"
        breeze={b}
      />
      {dense ? (
        <>
          <Leaf
            x={side * 4}
            y={14}
            rot={side * 26}
            scale={0.7}
            open={reveal(open, 0.42, 0.4)}
            tone="lit"
            breeze={b + 1}
          />
          <Leaf
            x={side * -10}
            y={-2}
            rot={side * -55}
            scale={0.72}
            open={reveal(open, 0.5, 0.4)}
            tone="shade"
            breeze={b + 2}
          />
        </>
      ) : null}
    </g>
  );
}

/**
 * Branch limb — wood draws base→tip first; leaves unfold along the limb
 * from the trunk joint toward the tip (never tip-only pops).
 */
function Branch({
  d,
  open,
  width = 2.2,
  bow = 0,
  ox,
  oy,
  tipX,
  tipY,
  tipRot = 0,
  tipSide = 1,
  breeze = 1,
  tier = "mid",
  midLeaves,
  denseTip = false,
  children,
}: {
  d: string;
  open: number;
  width?: number;
  bow?: number;
  ox: number;
  oy: number;
  tipX: number;
  tipY: number;
  tipRot?: number;
  tipSide?: 1 | -1;
  breeze?: number;
  tier?: WindTier;
  midLeaves?: Array<{
    x: number;
    y: number;
    rot: number;
    scale?: number;
    tone?: "lit" | "mid" | "shade";
    /** 0 = near trunk joint, 1 = near tip */
    at?: number;
  }>;
  denseTip?: boolean;
  children?: ReactNode;
}) {
  if (open <= 0.02) return null;
  const len = 140;
  const bowDrop = bow * 5.5;
  const bowRot = tipSide * bow * 3.5;
  // Limb extends first; foliage waits until wood has real length.
  const limb = Math.min(1, open / 0.55);
  const foliage = reveal(open, 0.42, 0.55);
  const tipFoliage = reveal(foliage, 0.55, 0.45);

  return (
    <g
      className="focus-growth-branch"
      opacity={0.28 + limb * 0.72}
      transform={`translate(0 ${bowDrop}) rotate(${bowRot} ${ox} ${oy})`}
    >
      <g
        className="focus-growth-branch-wind"
        data-tier={tier}
        style={
          {
            ["--fg-bx" as string]: `${ox}px`,
            ["--fg-by" as string]: `${oy}px`,
          } as CSSProperties
        }
      >
        <path
          className="focus-growth-branch-stroke"
          d={d}
          stroke="var(--fg-bark)"
          strokeWidth={width}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          pathLength={len}
          strokeDasharray={len}
          strokeDashoffset={len * (1 - limb)}
        />
        <path
          d={d}
          stroke="var(--fg-bark-lit)"
          strokeWidth={Math.max(0.65, width * 0.32)}
          strokeLinecap="round"
          fill="none"
          pathLength={len}
          strokeDasharray={len}
          strokeDashoffset={len * (1 - limb)}
          opacity={0.45}
        />
        {midLeaves?.map((leaf, i) => (
          <Leaf
            key={i}
            x={leaf.x}
            y={leaf.y}
            rot={leaf.rot}
            scale={leaf.scale ?? 0.72}
            open={reveal(foliage, leaf.at ?? i * 0.18, 0.42)}
            tone={leaf.tone ?? "mid"}
            breeze={breeze + i}
          />
        ))}
        <LeafTuft
          x={tipX}
          y={tipY}
          rot={tipRot + tipSide * bow * 10}
          open={tipFoliage}
          side={tipSide}
          breeze={breeze}
          dense={denseTip}
        />
        {children}
      </g>
    </g>
  );
}

/**
 * Living focus tree — hand-illustrated SVG botanical.
 * Day progress = sealed today + live focus, scaled so structure matures at
 * the daily goal; past-goal minutes unlock advanced richness.
 */
export function FocusGrowthTree({
  wilt = false,
  baseElapsedSeconds = 0,
  dailyGoalMinutes = FOCUS_DAILY_GOAL_DEFAULT,
  compact = false,
}: FocusGrowthTreeProps) {
  const uid = useId().replace(/:/g, "");
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const fallLayerRef = useRef<SVGGElement>(null);
  /**
   * Garden breeze + falling leaves — all motion state lives in a ref so
   * pointer / faller updates never trigger React re-renders.
   */
  const fx = useRef({
    presence: 0,
    presenceTarget: 0,
    dirX: 0,
    dirY: 0,
    dirTX: 0,
    dirTY: 0,
    energy: 0,
    px: 0,
    py: 0,
    hasPoint: false,
    raf: 0 as number,
    fallers: [] as FallingLeaf[],
    lastSpawn: 0,
    spawnCooldown: 2800,
    lastSpawnIdx: -1,
    shedPressure: 0,
    growth: 0,
    live: false,
    canAnimate: false,
  });
  const isRunning = useFocusTimer((s) => s.isRunning);
  const goalSeconds = Math.max(1, dailyGoalMinutes) * 60;

  // Live focus seconds only (breaks contribute 0). Recomputes on timer ticks.
  const liveFocusSeconds = useFocusTimer((s) => {
    void s.tickMs;
    void s.lastDisplaySecond;
    void s.elapsedSeconds;
    void s.remainingSeconds;
    if (s.mode !== "focus") return 0;
    if (s.clock === "up") return s.liveElapsedSeconds();
    return Math.max(0, s.durationSeconds - s.displaySeconds());
  });

  // Day tree: sealed today + live focus, scaled to the daily goal.
  const growthTarget = focusGrowthProgress({
    grows: true,
    isStopwatch: true,
    elapsedSeconds: Math.max(0, baseElapsedSeconds) + liveFocusSeconds,
    durationSeconds: goalSeconds,
    goalSeconds,
  });

  /**
   * Visual growth eases toward the timer-derived target so second-scale
   * progress ticks never snap the trunk / foliage. Math source stays exact.
   * Ease runs at rAF; React SVG reconcile is throttled (~12fps / quanta).
   */
  const smoothRef = useRef({
    value: growthTarget,
    target: growthTarget,
    publishedQuantum: Math.round(growthTarget * 500),
    publishedValue: growthTarget,
    lastReactTs: 0,
  });
  const [displayGrowth, setDisplayGrowth] = useState(growthTarget);
  const boundsRef = useRef({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    ready: false,
  });

  function paintGrowthVars(value: number) {
    const el = rootRef.current;
    if (!el) return;
    const structure = Math.min(1, value);
    const adv = Math.max(0, value - 1);
    el.style.setProperty("--fg-growth", structure.toFixed(4));
    el.style.setProperty("--fg-advanced", adv.toFixed(4));
  }

  function syncBounds(el: HTMLDivElement) {
    const rect = el.getBoundingClientRect();
    boundsRef.current = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      ready: rect.width >= 1 && rect.height >= 1,
    };
  }

  useEffect(() => {
    smoothRef.current.target = growthTarget;
    if (reduce) {
      smoothRef.current.value = growthTarget;
      smoothRef.current.publishedQuantum = Math.round(growthTarget * 500);
      smoothRef.current.publishedValue = growthTarget;
      paintGrowthVars(growthTarget);
      setDisplayGrowth(growthTarget);
      return;
    }

    let raf = 0;
    let alive = true;
    let lastTs = 0;
    const REACT_MIN_MS = 80; // ~12.5 fps React structure updates

    const publishReact = (value: number, now: number, force = false) => {
      const s = smoothRef.current;
      const quantum = Math.round(value * 500);
      const due = now - s.lastReactTs >= REACT_MIN_MS;
      const quantumChanged = quantum !== s.publishedQuantum;
      const drifted = Math.abs(value - s.publishedValue) >= 0.002;

      if (!force && !quantumChanged && !(due && drifted)) return;

      s.publishedQuantum = quantum;
      s.publishedValue = value;
      s.lastReactTs = now;
      setDisplayGrowth(Math.round(value * 10000) / 10000);
    };

    const tick = (now: number) => {
      if (!alive) return;
      const s = smoothRef.current;
      const dt = lastTs ? Math.min(0.05, (now - lastTs) / 1000) : 1 / 60;
      lastTs = now;
      const diff = s.target - s.value;

      if (Math.abs(diff) < 0.00004) {
        if (s.value !== s.target) {
          s.value = s.target;
          paintGrowthVars(s.target);
          publishReact(s.target, now, true);
        }
        raf = 0;
        return;
      }

      // ~0.9–1.1s settle between second ticks; faster catch-up on big jumps.
      const rate = Math.abs(diff) > 0.04 ? 7.5 : 4.2;
      const alpha = 1 - Math.exp(-rate * dt);
      s.value += diff * alpha;
      paintGrowthVars(s.value);
      publishReact(s.value, now);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      alive = false;
      if (raf) cancelAnimationFrame(raf);
    };
  }, [growthTarget, reduce]);

  // Structure (0–1) drives the living tree. Advanced (>0) is post-maturity richness.
  const g = Math.min(1, displayGrowth);
  const advanced = Math.max(0, displayGrowth - 1);
  const flourish = Math.min(1, advanced);
  const legendary = Math.max(0, advanced - 1);
  const mature = g >= 0.92 || advanced > 0;
  const live = isRunning && !wilt && !reduce;
  const canWind = !reduce && !wilt && g > 0.12;

  // Keep imperative loop in sync with React-derived flags (no render on move).
  fx.current.growth = g;
  fx.current.live = live;
  fx.current.canAnimate = !reduce && !wilt;

  useEffect(() => {
    const state = fx.current;
    const onResize = () => {
      boundsRef.current.ready = false;
    };
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      window.removeEventListener("resize", onResize);
      if (state.raf) cancelAnimationFrame(state.raf);
      for (const f of state.fallers) f.el.remove();
      state.fallers = [];
    };
  }, []);

  function createFallerElement(fill: string) {
    const gEl = document.createElementNS("http://www.w3.org/2000/svg", "g");
    gEl.setAttribute("class", "focus-growth-faller");

    const shade = document.createElementNS("http://www.w3.org/2000/svg", "path");
    shade.setAttribute("d", FALL_LEAF_SHADE);
    shade.setAttribute("fill", "var(--fg-leaf-shade)");
    shade.setAttribute("opacity", "0.28");
    shade.setAttribute("transform", "translate(0.8 1.2) scale(0.92)");

    const body = document.createElementNS("http://www.w3.org/2000/svg", "path");
    body.setAttribute("d", FALL_LEAF_PATH);
    body.setAttribute("fill", fill);

    const vein = document.createElementNS("http://www.w3.org/2000/svg", "path");
    vein.setAttribute("d", FALL_LEAF_VEIN);
    vein.setAttribute("stroke", "var(--fg-vein)");
    vein.setAttribute("stroke-width", "0.55");
    vein.setAttribute("stroke-linecap", "round");
    vein.setAttribute("fill", "none");
    vein.setAttribute("opacity", "0.35");

    gEl.append(shade, body, vein);
    return gEl;
  }

  /**
   * Occasional, interaction-driven shed — never every hover.
   * Pressure builds from presence + sudden motion; rare rolls only.
   */
  function maybeSpawnFaller(now: number, force: number, dirX: number, energy: number) {
    const layer = fallLayerRef.current;
    const state = fx.current;
    if (!layer || !state.canAnimate) return;
    if (state.growth < 0.58) return;
    // One or two in the air at most — never a shower.
    if (state.fallers.length >= 2) return;
    // Long cool-down so drops feel spontaneous.
    if (now - state.lastSpawn < state.spawnCooldown) return;
    // Only while the pointer is (or just was) engaging the canopy.
    if (state.presence < 0.12 && state.presenceTarget < 0.5) return;

    // Gentle hover barely sheds; sharp movement raises pressure.
    const build = state.presence * 0.004 + energy * 0.055 + Math.max(0, force - 0.35) * 0.03;
    state.shedPressure = Math.min(1.6, state.shedPressure + build);

    if (state.shedPressure < 0.85) return;
    // Still a low roll — nature, not a hover trigger.
    const rollChance = 0.08 + energy * 0.12;
    if (Math.random() > rollChance) {
      state.shedPressure *= 0.72;
      return;
    }

    let idx = Math.floor(Math.random() * FALL_SPAWN_POINTS.length);
    if (idx === state.lastSpawnIdx) {
      idx = (idx + 1 + Math.floor(Math.random() * 5)) % FALL_SPAWN_POINTS.length;
    }
    const [sx, sy] = FALL_SPAWN_POINTS[idx]!;
    state.lastSpawnIdx = idx;

    const toneRoll = Math.random();
    const fill =
      toneRoll < 0.34
        ? "var(--fg-leaf-lit)"
        : toneRoll < 0.67
          ? "var(--fg-leaf)"
          : "var(--fg-leaf-shade)";

    const gEl = createFallerElement(fill);
    layer.appendChild(gEl);

    const drift = dirX * 0.7 + (Math.random() - 0.5) * 0.55;
    const faller: FallingLeaf = {
      el: gEl,
      x: sx + (Math.random() - 0.5) * 4,
      y: sy + (Math.random() - 0.5) * 3,
      // Brief lift / sideways float before gravity takes over.
      vx: drift * 0.9 + (Math.random() - 0.5) * 0.35,
      vy: -(0.12 + Math.random() * 0.22),
      rot: (Math.random() - 0.5) * 40,
      spin: (Math.random() - 0.5) * 2.2 + drift * 0.9,
      age: 0,
      life: 2800 + Math.random() * 1800,
      scale: 0.62 + Math.random() * 0.38,
      liftMs: 280 + Math.random() * 420,
      phase: Math.random() * Math.PI * 2,
      lastTs: now,
    };
    state.fallers.push(faller);
    state.lastSpawn = now;
    state.spawnCooldown = 2800 + Math.random() * 2200;
    state.shedPressure = 0;

    // Rarely arm a second leaf from another branch after a strong gust.
    if (state.fallers.length < 2 && energy > 0.55 && Math.random() < 0.16) {
      state.shedPressure = 0.92;
      state.spawnCooldown = 420 + Math.random() * 380;
    }
  }

  function updateFallers(now: number, dirX: number, force: number) {
    const state = fx.current;
    const windPush = dirX * (0.03 + force * 0.05);

    for (let i = state.fallers.length - 1; i >= 0; i--) {
      const f = state.fallers[i]!;
      const rawDt = now - f.lastTs;
      const dtMs = Math.min(34, Math.max(8, rawDt > 0 ? rawDt : 16.7));
      f.lastTs = now;
      const step = dtMs / 16.7;
      f.age += dtMs;
      const t = f.age / f.life;

      if (f.age < f.liftMs) {
        // Detach: float up / aside like a leaf catching the breeze.
        f.vy += (-0.004 + Math.sin(now * 0.005 + f.phase) * 0.006) * step;
        f.vx += (windPush * 1.4 + Math.sin(now * 0.004 + f.phase) * 0.03) * step;
      } else {
        // Descend with soft gravity and fluttering drag.
        f.vy += (0.022 + Math.sin(now * 0.004 + f.phase) * 0.006) * step;
        f.vx += (windPush + Math.sin(now * 0.003 + f.y * 0.025 + f.phase) * 0.028) * step;
        f.vy = Math.min(f.vy, 1.55);
      }

      f.vx *= Math.pow(0.991, step);
      f.x += f.vx * step;
      f.y += f.vy * step;
      f.rot += (f.spin + Math.sin(now * 0.007 + f.x * 0.04) * 0.55) * step;

      // Subtle tumble — leaf flips as it dances.
      const tumble = Math.sin(now * 0.008 + f.phase + f.age * 0.004);
      const scaleX = f.scale * (0.72 + Math.abs(tumble) * 0.28);
      const scaleY = f.scale * (0.9 + tumble * 0.08);

      // Soft landing near the soil line.
      let fade = t < 0.06 ? t / 0.06 : 1;
      let landScale = 1;
      if (f.y > 330) {
        const land = Math.min(1, (f.y - 330) / 40);
        fade *= 1 - land * 0.92;
        landScale = 1 - land * 0.28;
        f.vy *= 0.94;
        f.spin *= 0.97;
      }
      if (t > 0.78) {
        fade *= Math.max(0, 1 - (t - 0.78) / 0.22);
      }

      f.el.setAttribute(
        "transform",
        `translate(${f.x.toFixed(2)} ${f.y.toFixed(2)}) rotate(${f.rot.toFixed(2)}) scale(${(scaleX * landScale).toFixed(3)} ${(scaleY * landScale).toFixed(3)})`,
      );
      f.el.setAttribute("opacity", (0.92 * fade).toFixed(3));

      if (t >= 1 || f.y > 368 || fade < 0.02) {
        f.el.remove();
        state.fallers.splice(i, 1);
      }
    }
  }

  function paintFx(now: number) {
    const el = rootRef.current;
    const w = fx.current;
    const dt = 1;

    // Soft presence ramp — enter/leave without jumps.
    const pEase = w.presenceTarget > w.presence ? 0.045 : 0.028;
    w.presence += (w.presenceTarget - w.presence) * pEase * dt;

    // Direction eases toward cursor bias + leftover motion.
    w.dirX += (w.dirTX - w.dirX) * 0.07 * dt;
    w.dirY += (w.dirTY - w.dirY) * 0.07 * dt;

    // Energy decays; while present, a quiet base keeps a garden hush.
    w.energy *= w.presenceTarget > 0.5 ? 0.965 : 0.92;
    const calm = w.presence * 0.22;
    const force = Math.min(1, calm + w.energy);

    const t = now * 0.001;
    const a = Math.sin(t * 2.15) * force;
    const b = Math.sin(t * 3.35 + 1.15) * force;
    const c = Math.sin(t * 5.05 + 2.4) * force * 0.85;
    const flutter =
      Math.sin(t * 8.4 + 0.7) *
      Math.min(1, w.energy * 1.4 + w.presence * 0.15);

    if (el) {
      el.style.setProperty("--fg-breeze", w.presence.toFixed(4));
      el.style.setProperty("--fg-wind-x", (w.dirX * force).toFixed(4));
      el.style.setProperty("--fg-wind-y", (w.dirY * force).toFixed(4));
      el.style.setProperty("--fg-wind-a", a.toFixed(4));
      el.style.setProperty("--fg-wind-b", b.toFixed(4));
      el.style.setProperty("--fg-wind-c", c.toFixed(4));
      el.style.setProperty("--fg-wind-flutter", flutter.toFixed(4));
      el.style.setProperty("--fg-wind-energy", force.toFixed(4));
      el.classList.toggle(
        "focus-growth-breezy",
        w.presence > 0.04 || force > 0.04,
      );
    }

    if (w.canAnimate && w.growth >= 0.58) {
      maybeSpawnFaller(now, force, w.dirX, w.energy);
      updateFallers(now, w.dirX, force);
    } else if (w.shedPressure > 0) {
      w.shedPressure *= 0.96;
    }

    const breezeSettled =
      w.presence < 0.004 &&
      w.presenceTarget < 0.01 &&
      Math.abs(w.dirX) < 0.004 &&
      Math.abs(w.dirY) < 0.004 &&
      w.energy < 0.008;

    const keepAlive = !breezeSettled || w.fallers.length > 0;

    if (!keepAlive) {
      w.presence = 0;
      w.dirX = 0;
      w.dirY = 0;
      w.energy = 0;
      w.raf = 0;
      if (el) {
        el.style.setProperty("--fg-breeze", "0");
        el.style.setProperty("--fg-wind-x", "0");
        el.style.setProperty("--fg-wind-y", "0");
        el.style.setProperty("--fg-wind-a", "0");
        el.style.setProperty("--fg-wind-b", "0");
        el.style.setProperty("--fg-wind-c", "0");
        el.style.setProperty("--fg-wind-flutter", "0");
        el.style.setProperty("--fg-wind-energy", "0");
        el.classList.remove("focus-growth-breezy");
      }
      return;
    }

    w.raf = requestAnimationFrame(paintFx);
  }

  function kickFx() {
    if (!fx.current.raf) {
      fx.current.raf = requestAnimationFrame(paintFx);
    }
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!canWind) return;
    const bounds = boundsRef.current;
    if (!bounds.ready) {
      syncBounds(e.currentTarget);
      if (!boundsRef.current.ready) return;
    }

    const { left, top, width, height } = boundsRef.current;
    const x = (e.clientX - left) / width;
    const y = (e.clientY - top) / height;
    const w = fx.current;
    w.presenceTarget = 1;

    const nx = x * 2 - 1;
    const ny = y * 2 - 1;

    if (w.hasPoint) {
      const dx = x - w.px;
      const dy = y - w.py;
      const speed = Math.hypot(dx, dy);
      w.energy = Math.min(1, w.energy + speed * 2.8);
      w.dirTX = Math.max(-1, Math.min(1, nx * 0.55 + dx * 8));
      w.dirTY = Math.max(-1, Math.min(1, ny * 0.35 + dy * 5));
    } else {
      w.hasPoint = true;
      w.dirTX = nx * 0.4;
      w.dirTY = ny * 0.25;
      w.energy = Math.min(1, w.energy + 0.12);
    }
    w.px = x;
    w.py = y;
    kickFx();
  }

  function onPointerEnter(e: ReactPointerEvent<HTMLDivElement>) {
    if (!canWind) return;
    syncBounds(e.currentTarget);
    fx.current.presenceTarget = 1;
    fx.current.hasPoint = false;
    onPointerMove(e);
  }

  function onPointerLeave() {
    const w = fx.current;
    w.presenceTarget = 0;
    w.hasPoint = false;
    w.dirTX *= 0.35;
    w.dirTY *= 0.35;
    w.energy *= 0.55;
    w.shedPressure *= 0.4;
    // In-flight leaves keep falling via keepAlive while fallers.length > 0.
    kickFx();
  }

  /*
   * Organic growth timeline (structure 0→1 scales to daily goal):
   *  0.00–0.10  tiny seedling (short stem + fixed cotyledons)
   *  0.06–0.34  trunk rises & thickens
   *  0.18+      laterals one at a time (each mostly finishes before the next)
   *  0.82+      crown + dense canopy
   * Advanced (past daily goal) adds richness without resizing the silhouette.
   */
  const seedling = reveal(g, 0, 0.1);
  const cotyledon = reveal(g, 0.015, 0.1);
  const cotyledonFade = Math.max(0, 1 - reveal(g, 0.16, 0.18));
  const trunkRise = reveal(g, 0.05, 0.3);
  const wood = reveal(g, 0.1, 0.28);
  const lean = reveal(g, 0.38, 0.5);
  const bow = reveal(g, 0.32, 0.55);

  // One limb at a time — short exclusive windows so pairs don’t open together.
  const BRANCH_SPAN = 0.07;
  const bFirst = reveal(g, 0.18, BRANCH_SPAN); // right lower
  const bSecond = reveal(g, 0.26, BRANCH_SPAN); // left lower
  const b3 = reveal(g, 0.34, BRANCH_SPAN);
  const b4 = reveal(g, 0.42, BRANCH_SPAN);
  const b5 = reveal(g, 0.5, BRANCH_SPAN);
  const b6 = reveal(g, 0.58, BRANCH_SPAN);
  const b7 = reveal(g, 0.66, BRANCH_SPAN);
  const b8 = reveal(g, 0.74, BRANCH_SPAN);
  const crown = reveal(g, 0.82, 0.1);
  const dense = reveal(g, 0.9, 0.1);
  const deepRoots = reveal(flourish, 0, 0.55);
  const blossomOpen = reveal(flourish, 0.28, 0.5);
  const fruitOpen = reveal(flourish, 0.55, 0.45);
  const legendaryCanopy = reveal(legendary, 0, 0.8);
  // Flourish secondaries — left finishes before right starts.
  const flourishTwigL = reveal(flourish, 0.06, 0.32);
  const flourishTwigR = reveal(flourish, 0.42, 0.32);

  const baseY = 355;
  // Seedling is SHORT — never a tall empty pole with tip leaves.
  const seedlingHeight = lerp(14, 26, seedling);
  const seedlingTopY = baseY - seedlingHeight;
  // Cotyledons stay at this fixed node — they do not ride the rising crown.
  const cotyledonY = baseY - lerp(12, 22, seedling);

  const trunkTopY = lerp(seedlingTopY, 98, trunkRise);
  const heightT = trunkRise;
  const trunkLean = lean * 4.2;

  const mid1 = lerp(baseY, 298, heightT);
  const mid2 = lerp(baseY, 245, heightT);
  const mid3 = lerp(baseY, 185, heightT);
  const mid4 = lerp(baseY, 138, heightT);
  const halfBase = lerp(1.4, 9.4, Math.max(seedling * 0.35, wood));
  const halfMid = lerp(1.0, 6.8, Math.max(seedling * 0.25, wood));
  const halfUpper = lerp(0.7, 4.4, wood);
  const halfTop = lerp(0.45, 2.45, wood);
  const left = 140 - halfBase;
  const right = 140 + halfBase * 0.88;

  const stemDash = 80;
  const trunkPath = [
    `M${left.toFixed(1)} ${baseY}`,
    `C ${(138.5 - halfMid * 1.1).toFixed(1)} ${mid1.toFixed(1)} ${(137.8 - halfMid).toFixed(1)} ${mid2.toFixed(1)} ${(137.2 - halfUpper).toFixed(1)} ${mid3.toFixed(1)}`,
    `C ${(136.8 - halfUpper * 0.9).toFixed(1)} ${mid4.toFixed(1)} ${(138.5 - halfTop).toFixed(1)} ${lerp(mid4, trunkTopY, 0.5).toFixed(1)} ${(139.2 - halfTop * 0.65).toFixed(1)} ${trunkTopY.toFixed(1)}`,
    `L ${(141.2 + halfTop * 0.9).toFixed(1)} ${trunkTopY.toFixed(1)}`,
    `C ${(142.5 + halfTop).toFixed(1)} ${lerp(mid4, trunkTopY, 0.5).toFixed(1)} ${(143.8 + halfUpper * 0.95).toFixed(1)} ${mid4.toFixed(1)} ${(144.5 + halfUpper).toFixed(1)} ${mid3.toFixed(1)}`,
    `C ${(145.5 + halfMid * 0.95).toFixed(1)} ${mid2.toFixed(1)} ${(146.2 + halfMid * 0.9).toFixed(1)} ${mid1.toFixed(1)} ${right.toFixed(1)} ${baseY}`,
    `Q 140 ${(baseY + 4).toFixed(1)} ${left.toFixed(1)} ${baseY} Z`,
  ].join(" ");

  return (
    <div
      ref={rootRef}
      className={cn(
        "focus-growth relative z-0 w-full",
        compact && "focus-growth-compact",
        canWind ? "pointer-events-auto cursor-default" : "pointer-events-none",
        live && "focus-growth-live",
        wilt && "focus-growth-wilt",
        mature && "focus-growth-mature",
        flourish > 0.08 && "focus-growth-flourish",
      )}
      style={
        {
          // Growth only — paintFx owns --fg-wind-* / --fg-breeze exclusively.
          ["--fg-growth" as string]: g.toFixed(4),
          ["--fg-advanced" as string]: advanced.toFixed(4),
        } as CSSProperties
      }
      onPointerEnter={onPointerEnter}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      aria-hidden
    >
      <svg
        className="focus-growth-svg"
        viewBox="0 0 280 380"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id={`fg-bark-${uid}`} x1="132" y1="360" x2="152" y2="100">
            <stop offset="0%" stopColor="var(--fg-bark)" />
            <stop offset="55%" stopColor="var(--fg-bark)" />
            <stop offset="100%" stopColor="var(--fg-bark-lit)" />
          </linearGradient>
          <linearGradient id={`fg-stem-${uid}`} x1="140" y1="360" x2="142" y2="110">
            <stop offset="0%" stopColor="var(--fg-bark)" />
            <stop offset="50%" stopColor="var(--fg-leaf-shade)" />
            <stop offset="100%" stopColor="var(--fg-leaf)" />
          </linearGradient>
          <radialGradient id={`fg-soil-glow-${uid}`} cx="48%" cy="40%" r="62%">
            <stop offset="0%" stopColor="var(--fg-soil-lit)" stopOpacity="0.62" />
            <stop offset="40%" stopColor="var(--fg-soil)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--fg-soil-deep)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`fg-soil-mound-${uid}`} x1="100" y1="346" x2="180" y2="372">
            <stop offset="0%" stopColor="var(--fg-soil-lit)" />
            <stop offset="38%" stopColor="var(--fg-soil)" />
            <stop offset="72%" stopColor="var(--fg-soil)" />
            <stop offset="100%" stopColor="var(--fg-soil-deep)" />
          </linearGradient>
          <linearGradient id={`fg-soil-top-${uid}`} x1="140" y1="346" x2="140" y2="358">
            <stop offset="0%" stopColor="var(--fg-soil-lit)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--fg-soil)" stopOpacity="0" />
          </linearGradient>
          <radialGradient id={`fg-soil-shadow-${uid}`} cx="50%" cy="30%" r="60%">
            <stop offset="0%" stopColor="var(--fg-soil-deep)" stopOpacity="0.55" />
            <stop offset="70%" stopColor="var(--fg-soil-deep)" stopOpacity="0.12" />
            <stop offset="100%" stopColor="var(--fg-soil-deep)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/*
          Ground scene — always present, gently enriched with growth.
          Layered mound + moss + pebbles; roots join from the trunk after wood forms.
        */}
        <g className="focus-growth-ground">
          {/* Soft earth glow — keeps the scene grounded even as a sapling */}
          <ellipse
            cx="140"
            cy="360"
            rx={42 + g * 48}
            ry={13 + g * 4.5}
            fill={`url(#fg-soil-glow-${uid})`}
            opacity={0.72 + g * 0.28}
          />

          {/* Far soil shelf — irregular silhouette */}
          <path
            d={`M${(72 - g * 14).toFixed(1)} 358.5
                C ${(92 - g * 6).toFixed(1)} 352.5 118 348.5 140 348
                C 164 348.2 ${(190 + g * 8).toFixed(1)} 352 ${(210 + g * 16).toFixed(1)} 359
                C ${(204 + g * 12).toFixed(1)} 366.5 ${(176 + g * 4).toFixed(1)} 372.5 140 373
                C ${(104 - g * 4).toFixed(1)} 372.5 ${(80 - g * 10).toFixed(1)} 366 ${(72 - g * 14).toFixed(1)} 358.5 Z`}
            fill={`url(#fg-soil-mound-${uid})`}
            opacity={0.88}
          />

          {/* Raised inner mound under the trunk */}
          <path
            d={`M${(102 - g * 6).toFixed(1)} 356
                C 118 350.5 130 348.2 140 348
                C 151 348.2 166 350.8 ${(180 + g * 8).toFixed(1)} 356.5
                C ${(174 + g * 4).toFixed(1)} 361.5 158 364.5 140 365
                C 122 364.5 ${(108 - g * 2).toFixed(1)} 361 ${(102 - g * 6).toFixed(1)} 356 Z`}
            fill={`url(#fg-soil-top-${uid})`}
            opacity={0.7 + wood * 0.25}
          />

          {/* Contact shadow — tree planted in the earth */}
          <ellipse
            cx="140.5"
            cy="355.5"
            rx={9 + halfBase * 1.15}
            ry={2.8 + wood * 1.6}
            fill={`url(#fg-soil-shadow-${uid})`}
            opacity={0.5 + wood * 0.4}
          />

          {/* Surface ridge (lit edge of the mound) */}
          <path
            d={`M${(84 - g * 10).toFixed(1)} 357.5
                C 108 351.5 126 348.8 140 348.5
                C 156 348.6 176 351.8 ${(198 + g * 12).toFixed(1)} 358`}
            stroke="var(--fg-soil-lit)"
            strokeWidth="1.35"
            strokeLinecap="round"
            fill="none"
            opacity={0.55}
          />
          {/* Soft underside contour */}
          <path
            d={`M${(96 - g * 6).toFixed(1)} 363
                C 120 368 160 368.5 ${(186 + g * 8).toFixed(1)} 363.5`}
            stroke="var(--fg-soil-deep)"
            strokeWidth="1.1"
            strokeLinecap="round"
            fill="none"
            opacity={0.32}
          />
          {/* Tiny soil grain marks */}
          <g stroke="var(--fg-soil-deep)" strokeLinecap="round" fill="none" opacity={0.18 + g * 0.12}>
            <path d="M118 358.5 C 120 357.8 122.5 358.2 124 357.6" strokeWidth="0.55" />
            <path d="M152 359 C 154.5 358.2 157 358.8 159 358" strokeWidth="0.5" />
            <path d="M134 361.5 C 136 360.8 138.5 361.2 140.5 360.6" strokeWidth="0.45" />
          </g>

          {/* Moss cushions */}
          <ellipse
            cx="108"
            cy="354"
            rx={7 + g * 2.5}
            ry={2.4 + g * 0.5}
            fill="var(--fg-moss)"
            opacity={0.42}
            transform="rotate(-10 108 354)"
          />
          <ellipse
            cx="171"
            cy="354.5"
            rx={7.5 + g * 3}
            ry={2.6 + g * 0.55}
            fill="var(--fg-moss-lit)"
            opacity={0.36}
            transform="rotate(8 171 354.5)"
          />
          <ellipse
            cx="146"
            cy="351.8"
            rx={3.8 + g}
            ry="1.4"
            fill="var(--fg-moss)"
            opacity={0.3}
          />
          <ellipse
            cx="124"
            cy="356.2"
            rx="3"
            ry="1.15"
            fill="var(--fg-moss-lit)"
            opacity={0.26}
            transform="rotate(-4 124 356.2)"
          />

          {/* Delicate grass — sparse, not a cartoon lawn */}
          <g strokeLinecap="round" fill="none" opacity={0.38 + g * 0.28}>
            <path d="M96 355.5 C 94.6 351 93.2 347.5 92.4 344.5" stroke="var(--fg-moss-lit)" strokeWidth="0.85" />
            <path d="M100 355 C 99.4 351.2 99.8 348 100.8 345.2" stroke="var(--fg-moss)" strokeWidth="0.7" />
            <path d="M93 356 C 91.5 353 90 351 88.6 349.2" stroke="var(--fg-moss-lit)" strokeWidth="0.65" />
            <path d="M184 355.5 C 185.4 351.2 186.8 348 187.8 345" stroke="var(--fg-moss)" strokeWidth="0.8" />
            <path d="M189 356 C 190.6 352.5 192.2 350.2 193.6 348" stroke="var(--fg-moss-lit)" strokeWidth="0.65" />
            <path d="M179 355 C 179.6 351.5 179 348.8 178 346.5" stroke="var(--fg-moss)" strokeWidth="0.7" />
          </g>

          {/* Pebbles */}
          <ellipse cx="122" cy="358.2" rx="2.4" ry="1.25" fill="var(--fg-bark)" opacity={0.4} transform="rotate(-14 122 358.2)" />
          <ellipse cx="160" cy="358.8" rx="1.9" ry="1.05" fill="var(--fg-bark-lit)" opacity={0.34} transform="rotate(16 160 358.8)" />
          <ellipse cx="138" cy="360.5" rx="1.35" ry="0.8" fill="var(--fg-soil-deep)" opacity={0.3} transform="rotate(6 138 360.5)" />
          <ellipse cx="175" cy="357.5" rx="1.5" ry="0.85" fill="var(--fg-bark)" opacity={0.28} transform="rotate(-8 175 357.5)" />
        </g>

        {/* Outer: CSS sway. Inner: organic lean. */}
        <g className="focus-growth-plant">
          <g transform={`rotate(${trunkLean} 140 355)`}>
            {/* Tiny seedling stem — short, from soil only */}
            <path
              className="focus-growth-stem"
              d={`M140 355 C 139.2 ${((baseY + seedlingTopY) / 2).toFixed(1)} 139.6 ${((baseY + seedlingTopY) / 2 - 4).toFixed(1)} 140.4 ${seedlingTopY.toFixed(1)}`}
              stroke={`url(#fg-stem-${uid})`}
              strokeWidth={1.6 + seedling * 1.1 * (1 - wood * 0.7)}
              strokeLinecap="round"
              fill="none"
              pathLength={stemDash}
              strokeDasharray={stemDash}
              strokeDashoffset={stemDash * (1 - seedling)}
              opacity={Math.max(0.15, seedling * (1 - wood * 0.85))}
            />

            {/* Rising woody trunk — grows from the seedling */}
            <path
              d={trunkPath}
              fill={`url(#fg-bark-${uid})`}
              opacity={Math.max(wood * 0.98, trunkRise * seedling * 0.35)}
            />
            <path
              d={`M138.8 348 C 137.8 ${mid1.toFixed(1)} 138.2 ${mid2.toFixed(1)} 139.2 ${mid3.toFixed(1)} C 139.8 ${mid4.toFixed(1)} 140.6 ${lerp(mid4, trunkTopY, 0.55).toFixed(1)} 141.4 ${(trunkTopY + 6).toFixed(1)}`}
              stroke="var(--fg-bark-lit)"
              strokeWidth="1.15"
              strokeLinecap="round"
              opacity={wood * 0.42}
            />
            <path
              d={`M${(140 - halfMid * 0.5).toFixed(1)} ${mid1.toFixed(1)} C ${(140 - halfMid * 0.05).toFixed(1)} ${(mid1 - 3.5).toFixed(1)} ${(140 + halfMid * 0.3).toFixed(1)} ${(mid1 + 1.2).toFixed(1)} ${(140 + halfMid * 0.75).toFixed(1)} ${(mid1 - 2.2).toFixed(1)}`}
              stroke="var(--fg-bark)"
              strokeWidth="0.6"
              strokeLinecap="round"
              opacity={wood * 0.32}
            />
            <path
              d={`M${(140 - halfUpper * 0.45).toFixed(1)} ${mid3.toFixed(1)} C ${(140 - halfUpper * 0.02).toFixed(1)} ${(mid3 - 4).toFixed(1)} ${(140 + halfUpper * 0.35).toFixed(1)} ${(mid3 + 1).toFixed(1)} ${(140 + halfUpper * 0.8).toFixed(1)} ${(mid3 - 3).toFixed(1)}`}
              stroke="var(--fg-bark)"
              strokeWidth="0.5"
              strokeLinecap="round"
              opacity={wood * 0.26}
            />

            {/* Root collar + exposed roots — develop as the tree matures */}
            <g opacity={wood * 0.95} className="focus-growth-roots">
              {/* Flare where trunk meets earth */}
              <path
                d={`M${(140 - halfBase * 0.92).toFixed(1)} 353.5
                    C ${(138 - halfBase * 0.2).toFixed(1)} 356.2  ${(142 + halfBase * 0.15).toFixed(1)} 356.4 ${(140 + halfBase * 0.85).toFixed(1)} 353.8
                    C ${(141 + halfBase * 0.35).toFixed(1)} 355.6 ${(139 - halfBase * 0.25).toFixed(1)} 355.8 ${(140 - halfBase * 0.92).toFixed(1)} 353.5 Z`}
                fill="var(--fg-bark)"
                opacity={0.85}
              />
              {/* Primary roots into the mound */}
              <path
                d="M134 354.5 C 126 356.5 116 358.5 108 361.5 C 103 363.5 99 365.5 96 367"
                stroke="var(--fg-bark)"
                strokeWidth={1.35 + wood * 0.55}
                strokeLinecap="round"
                fill="none"
                opacity={0.55 + wood * 0.25}
              />
              <path
                d="M146.5 354.2 C 156 356 166 357.8 174 360.5 C 179 362.2 183 364 186 365.5"
                stroke="var(--fg-bark)"
                strokeWidth={1.25 + wood * 0.5}
                strokeLinecap="round"
                fill="none"
                opacity={0.5 + wood * 0.25}
              />
              {/* Finer secondary roots */}
              <path
                d="M132 355 C 124 357.5 118 360 114 363"
                stroke="var(--fg-bark-lit)"
                strokeWidth="0.85"
                strokeLinecap="round"
                fill="none"
                opacity={0.35 + wood * 0.25}
              />
              <path
                d="M148 354.8 C 155 356.5 161 359 166 362"
                stroke="var(--fg-bark-lit)"
                strokeWidth="0.8"
                strokeLinecap="round"
                fill="none"
                opacity={0.32 + wood * 0.22}
              />
              <path
                d="M138 355.5 C 132 358 128 361.5 126 364.5"
                stroke="var(--fg-bark)"
                strokeWidth="0.7"
                strokeLinecap="round"
                fill="none"
                opacity={wood * 0.45}
              />
              {/* Deep roots — count-up post-maturity */}
              {deepRoots > 0.02 ? (
                <g opacity={deepRoots}>
                  <path
                    d="M130 355.5 C 118 359 106 364 98 370"
                    stroke="var(--fg-bark)"
                    strokeWidth={0.75 + deepRoots * 0.35}
                    strokeLinecap="round"
                    fill="none"
                    opacity={0.4 + deepRoots * 0.25}
                  />
                  <path
                    d="M150 355 C 162 358.5 174 363 184 368.5"
                    stroke="var(--fg-bark)"
                    strokeWidth={0.7 + deepRoots * 0.3}
                    strokeLinecap="round"
                    fill="none"
                    opacity={0.36 + deepRoots * 0.22}
                  />
                  <path
                    d="M142 355.8 C 148 360 152 365 154 369"
                    stroke="var(--fg-bark-lit)"
                    strokeWidth="0.65"
                    strokeLinecap="round"
                    fill="none"
                    opacity={0.3 + deepRoots * 0.28}
                  />
                </g>
              ) : null}
            </g>

            {/* Cotyledons — fixed on the seedling node, never ride the crown */}
            {cotyledonFade > 0.02 ? (
              <g
                opacity={cotyledon * cotyledonFade}
                transform={`translate(140 ${cotyledonY.toFixed(1)})`}
              >
                <Leaf x={-8} y={1} rot={-48} scale={0.72} open={cotyledon} tone="lit" />
                <Leaf x={8} y={2} rot={44} scale={0.7} open={cotyledon} tone="mid" />
              </g>
            ) : null}

            {/* First laterals — only after trunk has risen */}
            <Branch
              ox={146}
              oy={300}
              d="M146 300 C 162 296 182 298 200 308 C 210 314 218 322 224 330"
              open={bFirst}
              width={2.2}
              bow={bow * 0.55}
              tipX={224}
              tipY={330}
              tipRot={42}
              tipSide={1}
              breeze={2}
              tier="low"
              midLeaves={[
                { x: 158, y: 298, rot: 28, scale: 0.55, tone: "lit", at: 0.02 },
                { x: 178, y: 302, rot: 40, scale: 0.62, tone: "mid", at: 0.2 },
                { x: 198, y: 312, rot: 52, scale: 0.58, tone: "shade", at: 0.38 },
              ]}
            >
              {/* Flourish secondary — after left twig; sprouts from this limb */}
              {flourishTwigR > 0.02 ? (
                <Branch
                  ox={182}
                  oy={300}
                  d="M182 300 C 196 292 208 286 218 282"
                  open={flourishTwigR}
                  width={1.15}
                  bow={bow * 0.28}
                  tipX={218}
                  tipY={282}
                  tipRot={28}
                  tipSide={1}
                  breeze={1}
                  tier="twig"
                  midLeaves={[
                    { x: 190, y: 296, rot: 22, scale: 0.46, tone: "shade", at: 0.08 },
                    { x: 204, y: 288, rot: 34, scale: 0.5, tone: "lit", at: 0.4 },
                  ]}
                />
              ) : null}
            </Branch>
            <Branch
              ox={136}
              oy={288}
              d="M136 288 C 118 284 96 286 76 296 C 64 302 54 312 46 322"
              open={bSecond}
              width={2.45}
              bow={bow * 0.7}
              tipX={46}
              tipY={322}
              tipRot={-52}
              tipSide={-1}
              breeze={1}
              tier="low"
              midLeaves={[
                { x: 124, y: 286, rot: -30, scale: 0.55, tone: "mid", at: 0.02 },
                { x: 100, y: 288, rot: -42, scale: 0.65, tone: "shade", at: 0.18 },
                { x: 78, y: 298, rot: -55, scale: 0.6, tone: "lit", at: 0.36 },
              ]}
            >
              {/* Flourish secondary — grows first; sprouts from this limb */}
              {flourishTwigL > 0.02 ? (
                <Branch
                  ox={100}
                  oy={288}
                  d="M100 288 C 86 280 74 274 64 270"
                  open={flourishTwigL}
                  width={1.2}
                  bow={bow * 0.3}
                  tipX={64}
                  tipY={270}
                  tipRot={-32}
                  tipSide={-1}
                  breeze={2}
                  tier="twig"
                  midLeaves={[
                    { x: 92, y: 284, rot: -24, scale: 0.46, tone: "lit", at: 0.08 },
                    { x: 78, y: 276, rot: -38, scale: 0.5, tone: "mid", at: 0.4 },
                  ]}
                />
              ) : null}
            </Branch>

            {/* Mid canopy */}
            <Branch
              ox={136}
              oy={222}
              d="M136 222 C 108 208 78 196 50 192 C 36 190 24 194 16 202"
              open={b3}
              width={2.85}
              bow={bow * 0.72}
              tipX={16}
              tipY={202}
              tipRot={-44}
              tipSide={-1}
              breeze={3}
              tier="mid"
              denseTip
              midLeaves={[
                { x: 122, y: 218, rot: -22, scale: 0.58, tone: "lit", at: 0.02 },
                { x: 100, y: 212, rot: -28, scale: 0.72, tone: "mid", at: 0.16 },
                { x: 70, y: 200, rot: -50, scale: 0.68, tone: "shade", at: 0.32 },
                { x: 48, y: 194, rot: -18, scale: 0.6, tone: "mid", at: 0.48 },
              ]}
            />
            <Branch
              ox={148}
              oy={214}
              d="M148 214 C 176 198 210 194 240 200 C 252 204 262 212 268 222"
              open={b4}
              width={2.6}
              bow={bow * 0.68}
              tipX={268}
              tipY={222}
              tipRot={40}
              tipSide={1}
              breeze={1}
              tier="mid"
              denseTip
              midLeaves={[
                { x: 160, y: 210, rot: 18, scale: 0.55, tone: "mid", at: 0.02 },
                { x: 180, y: 204, rot: 24, scale: 0.7, tone: "lit", at: 0.16 },
                { x: 215, y: 198, rot: 48, scale: 0.65, tone: "shade", at: 0.34 },
                { x: 245, y: 206, rot: 18, scale: 0.58, tone: "mid", at: 0.5 },
              ]}
            />
            {/* Twig off b3 — only after that limb is mostly grown */}
            <Branch
              ox={86}
              oy={208}
              d="M86 208 C 72 196 60 184 52 174"
              open={reveal(b3, 0.72, 0.28)}
              width={1.45}
              bow={bow * 0.55}
              tipX={52}
              tipY={174}
              tipRot={-30}
              tipSide={-1}
              breeze={2}
              tier="twig"
              midLeaves={[
                { x: 78, y: 202, rot: -28, scale: 0.5, tone: "lit", at: 0.05 },
                { x: 66, y: 190, rot: -40, scale: 0.55, tone: "mid", at: 0.35 },
              ]}
            />

            {/* Upper */}
            <Branch
              ox={137}
              oy={172}
              d="M137 172 C 114 156 92 140 74 126 C 64 118 56 116 48 120"
              open={b5}
              width={2.35}
              bow={bow * 0.52}
              tipX={48}
              tipY={120}
              tipRot={-34}
              tipSide={-1}
              breeze={3}
              tier="high"
              denseTip
              midLeaves={[
                { x: 128, y: 168, rot: -16, scale: 0.55, tone: "shade", at: 0.02 },
                { x: 112, y: 160, rot: -22, scale: 0.68, tone: "mid", at: 0.18 },
                { x: 88, y: 140, rot: -48, scale: 0.65, tone: "lit", at: 0.4 },
              ]}
            />
            <Branch
              ox={147}
              oy={166}
              d="M147 166 C 172 150 200 140 226 140 C 238 140 248 146 254 154"
              open={b6}
              width={2.25}
              bow={bow * 0.5}
              tipX={254}
              tipY={154}
              tipRot={30}
              tipSide={1}
              breeze={1}
              tier="high"
              denseTip
              midLeaves={[
                { x: 158, y: 162, rot: 14, scale: 0.52, tone: "lit", at: 0.02 },
                { x: 175, y: 152, rot: 20, scale: 0.66, tone: "mid", at: 0.18 },
                { x: 210, y: 142, rot: 42, scale: 0.62, tone: "shade", at: 0.4 },
              ]}
            />

            {/* Near crown */}
            <Branch
              ox={139}
              oy={138}
              d="M139 138 C 124 122 108 108 94 98"
              open={b7}
              width={1.9}
              bow={bow * 0.42}
              tipX={94}
              tipY={98}
              tipRot={-26}
              tipSide={-1}
              breeze={2}
              tier="high"
              denseTip
              midLeaves={[
                { x: 132, y: 132, rot: -18, scale: 0.52, tone: "lit", at: 0.05 },
                { x: 118, y: 122, rot: -30, scale: 0.62, tone: "mid", at: 0.3 },
              ]}
            />
            <Branch
              ox={145}
              oy={134}
              d="M145 134 C 164 118 186 108 206 108"
              open={b8}
              width={1.85}
              bow={bow * 0.4}
              tipX={206}
              tipY={108}
              tipRot={24}
              tipSide={1}
              breeze={3}
              tier="high"
              denseTip
              midLeaves={[
                { x: 154, y: 128, rot: 16, scale: 0.52, tone: "shade", at: 0.05 },
                { x: 168, y: 118, rot: 28, scale: 0.62, tone: "lit", at: 0.3 },
              ]}
            />

            {/* Crown leader */}
            <Branch
              ox={141}
              oy={122}
              d="M141 122 C 140 102 139 80 140.5 58 C 141 48 142 40 143 34"
              open={crown}
              width={2.4}
              bow={bow * 0.22}
              tipX={143}
              tipY={34}
              tipRot={-6}
              tipSide={1}
              breeze={1}
              tier="crown"
              denseTip
              midLeaves={[
                { x: 140, y: 112, rot: -20, scale: 0.55, tone: "mid", at: 0.05 },
                { x: 138, y: 95, rot: -35, scale: 0.68, tone: "lit", at: 0.22 },
                { x: 146, y: 88, rot: 32, scale: 0.65, tone: "shade", at: 0.36 },
                { x: 140, y: 68, rot: -12, scale: 0.72, tone: "mid", at: 0.52 },
              ]}
            />
            <Branch
              ox={140}
              oy={88}
              d="M140 88 C 124 76 110 64 100 54"
              open={reveal(crown, 0.35, 0.4)}
              width={1.4}
              bow={bow * 0.35}
              tipX={100}
              tipY={54}
              tipRot={-32}
              tipSide={-1}
              breeze={2}
              tier="twig"
              denseTip
              midLeaves={[
                { x: 132, y: 82, rot: -24, scale: 0.48, tone: "lit", at: 0.08 },
                { x: 116, y: 68, rot: -36, scale: 0.55, tone: "mid", at: 0.4 },
              ]}
            />
            <Branch
              ox={144}
              oy={84}
              d="M144 84 C 162 72 178 62 192 56"
              open={reveal(crown, 0.72, 0.28)}
              width={1.35}
              bow={bow * 0.32}
              tipX={192}
              tipY={56}
              tipRot={28}
              tipSide={1}
              breeze={3}
              tier="twig"
              denseTip
              midLeaves={[
                { x: 152, y: 78, rot: 20, scale: 0.48, tone: "shade", at: 0.08 },
                { x: 170, y: 66, rot: 32, scale: 0.55, tone: "lit", at: 0.4 },
              ]}
            />

            {/* Late canopy — only after structure exists */}
            <g opacity={dense}>
              <LeafTuft x={118} y={112} rot={-22} open={dense} side={-1} breeze={1} dense />
              <LeafTuft x={172} y={108} rot={16} open={dense} side={1} breeze={2} dense />
              <LeafTuft x={142} y={62} rot={4} open={dense} side={1} breeze={3} dense />
              <LeafTuft x={128} y={88} rot={-12} open={reveal(dense, 0.2, 0.5)} side={-1} breeze={2} />
              <LeafTuft x={160} y={84} rot={14} open={reveal(dense, 0.25, 0.5)} side={1} breeze={1} />
              <Leaf x={108} y={128} rot={-28} scale={0.8} open={reveal(dense, 0.3, 0.45)} tone="mid" breeze={3} />
              <Leaf x={182} y={122} rot={26} scale={0.82} open={reveal(dense, 0.35, 0.45)} tone="lit" breeze={1} />
              <Leaf x={148} y={48} rot={8} scale={0.9} open={reveal(dense, 0.4, 0.45)} tone="lit" breeze={2} />
            </g>

            {/*
              Post-maturity richness (count-up beyond ~60m).
              Adds foliage irregularity, blossoms, fruit — not overall scale.
            */}
            {flourish > 0.02 ? (
              <g className="focus-growth-advanced">
                <LeafTuft
                  x={96}
                  y={148}
                  rot={-18}
                  open={reveal(flourish, 0.18, 0.5)}
                  side={-1}
                  breeze={3}
                  dense
                />
                <LeafTuft
                  x={188}
                  y={142}
                  rot={14}
                  open={reveal(flourish, 0.22, 0.5)}
                  side={1}
                  breeze={1}
                  dense
                />
                <Leaf
                  x={132}
                  y={72}
                  rot={-14}
                  scale={0.7}
                  open={reveal(flourish, 0.3, 0.45)}
                  tone="shade"
                  breeze={2}
                />
                <Leaf
                  x={156}
                  y={70}
                  rot={18}
                  scale={0.68}
                  open={reveal(flourish, 0.34, 0.45)}
                  tone="lit"
                  breeze={3}
                />
                <Leaf
                  x={64}
                  y={188}
                  rot={-42}
                  scale={0.58}
                  open={reveal(flourish, 0.4, 0.4)}
                  tone="mid"
                  breeze={1}
                />
                <Leaf
                  x={218}
                  y={184}
                  rot={38}
                  scale={0.56}
                  open={reveal(flourish, 0.44, 0.4)}
                  tone="shade"
                  breeze={2}
                />

                <Blossom x={104} y={118} open={blossomOpen} scale={0.85} />
                <Blossom x={176} y={112} open={reveal(blossomOpen, 0.15, 0.5)} scale={0.78} />
                <Blossom x={140} y={56} open={reveal(blossomOpen, 0.28, 0.5)} scale={0.72} />
                <Blossom
                  x={52}
                  y={196}
                  open={reveal(blossomOpen, 0.4, 0.45)}
                  scale={0.65}
                />

                <TinyFruit x={198} y={156} open={fruitOpen} scale={0.9} />
                <TinyFruit
                  x={86}
                  y={168}
                  open={reveal(fruitOpen, 0.2, 0.5)}
                  scale={0.82}
                />
                <TinyFruit
                  x={148}
                  y={92}
                  open={reveal(fruitOpen, 0.35, 0.5)}
                  scale={0.75}
                />

                {legendaryCanopy > 0.02 ? (
                  <g opacity={legendaryCanopy}>
                    <LeafTuft
                      x={110}
                      y={98}
                      rot={-8}
                      open={legendaryCanopy}
                      side={-1}
                      breeze={2}
                      dense
                    />
                    <LeafTuft
                      x={170}
                      y={94}
                      rot={10}
                      open={reveal(legendaryCanopy, 0.15, 0.5)}
                      side={1}
                      breeze={1}
                      dense
                    />
                    <Blossom
                      x={124}
                      y={78}
                      open={reveal(legendaryCanopy, 0.25, 0.5)}
                      scale={0.7}
                    />
                    <Blossom
                      x={162}
                      y={74}
                      open={reveal(legendaryCanopy, 0.35, 0.5)}
                      scale={0.68}
                    />
                    <TinyFruit
                      x={132}
                      y={130}
                      open={reveal(legendaryCanopy, 0.4, 0.5)}
                      scale={0.7}
                    />
                  </g>
                ) : null}
              </g>
            ) : null}
          </g>
        </g>

        {/* Falling leaves — imperatively spawned, drifts with the breeze */}
        <g
          ref={fallLayerRef}
          className="focus-growth-fallers"
          pointerEvents="none"
        />

        {live && g > 0.45 ? (
          <g className="focus-growth-motes">
            <circle className="focus-growth-mote" cx="64" cy="150" r="1.15" />
            <circle className="focus-growth-mote" cx="218" cy="130" r="1" />
            <circle className="focus-growth-mote" cx="128" cy="52" r="1.1" />
            <circle className="focus-growth-mote" cx="182" cy="178" r="0.9" />
          </g>
        ) : null}
      </svg>
    </div>
  );
}
