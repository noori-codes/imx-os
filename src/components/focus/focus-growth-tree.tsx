"use client";

import {
  useEffect,
  useId,
  useRef,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { useReducedMotion } from "motion/react";

import { focusGrowthProgress } from "@/lib/focus-growth";
import { cn } from "@/lib/utils";
import { useFocusTimer } from "@/stores/focus-timer";

type FocusGrowthTreeProps = {
  wilt?: boolean;
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
  if (open <= 0.02) return null;
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
 * Branch limb — draws on, then tips bow slightly as the canopy weighs.
 * Wind bends the limb around its trunk joint; foliage follows after wood forms.
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
    at?: number;
  }>;
  denseTip?: boolean;
  children?: ReactNode;
}) {
  if (open <= 0.02) return null;
  const len = 140;
  const bowDrop = bow * 5.5;
  const bowRot = tipSide * bow * 3.5;
  // Limb draws first; foliage only after the branch is mostly formed.
  const limb = Math.min(1, open / 0.62);
  const foliage = reveal(open, 0.58, 0.42);

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
            open={reveal(foliage, leaf.at ?? 0.15, 0.5)}
            tone={leaf.tone ?? "mid"}
            breeze={breeze + i}
          />
        ))}
        <LeafTuft
          x={tipX}
          y={tipY}
          rot={tipRot + tipSide * bow * 10}
          open={foliage}
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
 * Growth value comes only from existing focusGrowthProgress.
 */
export function FocusGrowthTree({ wilt = false }: FocusGrowthTreeProps) {
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

  // Same subscription contract as before — do not change growth math.
  const growth = useFocusTimer((s) => {
    void s.tickMs;
    void s.lastDisplaySecond;
    void s.elapsedSeconds;
    void s.remainingSeconds;
    const isStopwatch = s.clock === "up";
    const grows = isStopwatch || s.mode === "focus";
    const elapsed = isStopwatch
      ? s.liveElapsedSeconds()
      : Math.max(0, s.durationSeconds - s.displaySeconds());
    return focusGrowthProgress({
      grows,
      isStopwatch,
      elapsedSeconds: elapsed,
      durationSeconds: s.durationSeconds,
    });
  });

  const g = Math.round(growth * 1000) / 1000;
  const mature = g >= 0.92;
  const live = isRunning && !wilt && !reduce;
  const canWind = !reduce && !wilt && g > 0.12;

  // Keep imperative loop in sync with React-derived flags (no render on move).
  fx.current.growth = g;
  fx.current.live = live;
  fx.current.canAnimate = !reduce && !wilt;

  useEffect(() => {
    const state = fx.current;
    return () => {
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
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;

    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
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

  const stem = reveal(g, 0, 0.2);
  const sprout = reveal(g, 0.02, 0.14);
  const sproutFade = Math.max(0, 1 - reveal(g, 0.18, 0.16));
  const wood = reveal(g, 0.08, 0.3);
  const lean = reveal(g, 0.32, 0.55);
  const bow = reveal(g, 0.28, 0.6);

  const b1 = reveal(g, 0.14, 0.16);
  const b2 = reveal(g, 0.2, 0.16);
  const b3 = reveal(g, 0.28, 0.16);
  const b4 = reveal(g, 0.34, 0.16);
  const b5 = reveal(g, 0.42, 0.16);
  const b6 = reveal(g, 0.48, 0.16);
  const b7 = reveal(g, 0.55, 0.16);
  const b8 = reveal(g, 0.62, 0.16);
  const crown = reveal(g, 0.58, 0.22);
  const dense = reveal(g, 0.7, 0.24);

  const stemDash = 260;
  const trunkLean = lean * 4.2;
  const trunkTopY = lerp(348, 98, stem);
  const heightT = stem;

  const baseY = 355;
  const mid1 = lerp(baseY, 298, heightT);
  const mid2 = lerp(baseY, 245, heightT);
  const mid3 = lerp(baseY, 185, heightT);
  const mid4 = lerp(baseY, 138, heightT);
  const halfBase = lerp(2.1, 9.4, wood);
  const halfMid = lerp(1.55, 6.8, wood);
  const halfUpper = lerp(1.1, 4.4, wood);
  const halfTop = lerp(0.65, 2.45, wood);
  const left = 140 - halfBase;
  const right = 140 + halfBase * 0.88;

  // Slight S-curve: left recessed mid, right fuller near base
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
        canWind ? "pointer-events-auto cursor-default" : "pointer-events-none",
        live && "focus-growth-live",
        wilt && "focus-growth-wilt",
        mature && "focus-growth-mature",
      )}
      style={
        {
          ["--fg-growth" as string]: g.toFixed(4),
          ["--fg-breeze" as string]: "0",
          ["--fg-wind-x" as string]: "0",
          ["--fg-wind-y" as string]: "0",
          ["--fg-wind-a" as string]: "0",
          ["--fg-wind-b" as string]: "0",
          ["--fg-wind-c" as string]: "0",
          ["--fg-wind-flutter" as string]: "0",
          ["--fg-wind-energy" as string]: "0",
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
          <radialGradient id={`fg-soil-glow-${uid}`} cx="50%" cy="42%" r="55%">
            <stop offset="0%" stopColor="var(--fg-soil-lit)" stopOpacity="0.55" />
            <stop offset="45%" stopColor="var(--fg-soil)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--fg-soil)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`fg-soil-mound-${uid}`} x1="140" y1="348" x2="140" y2="372">
            <stop offset="0%" stopColor="var(--fg-soil-lit)" />
            <stop offset="48%" stopColor="var(--fg-soil)" />
            <stop offset="100%" stopColor="var(--fg-soil-deep)" />
          </linearGradient>
          <radialGradient id={`fg-soil-shadow-${uid}`} cx="50%" cy="35%" r="55%">
            <stop offset="0%" stopColor="var(--fg-soil-deep)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--fg-soil-deep)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ground — soft earth mound, moss, delicate blades */}
        <g
          className="focus-growth-ground"
          opacity={0.5 + g * 0.5}
        >
          {/* Ambient light pool */}
          <ellipse
            cx="140"
            cy="358"
            rx={36 + g * 58}
            ry={11 + g * 5}
            fill={`url(#fg-soil-glow-${uid})`}
          />
          {/* Soft contact shadow under trunk */}
          <ellipse
            cx="141"
            cy="356.5"
            rx={10 + wood * 8}
            ry={3.2 + wood * 1.4}
            fill={`url(#fg-soil-shadow-${uid})`}
            opacity={0.55 + wood * 0.35}
          />
          {/* Asymmetric soil mound */}
          <path
            d={`M${(88 - g * 18).toFixed(1)} 356
                C ${(108 - g * 8).toFixed(1)} 351 ${(122 - g * 2).toFixed(1)} 349.5 140 349
                C ${(158 + g * 2).toFixed(1)} 349.5 ${(176 + g * 10).toFixed(1)} 351.5 ${(194 + g * 20).toFixed(1)} 356.5
                C ${(188 + g * 14).toFixed(1)} 364 ${(168 + g * 6).toFixed(1)} 368.5 140 369
                C ${(112 - g * 6).toFixed(1)} 368.5 ${(94 - g * 12).toFixed(1)} 363.5 ${(88 - g * 18).toFixed(1)} 356 Z`}
            fill={`url(#fg-soil-mound-${uid})`}
            opacity={0.72 + g * 0.22}
          />
          {/* Earth ridge highlight */}
          <path
            d={`M${(96 - g * 12).toFixed(1)} 355.5
                C 118 351.2 132 350 140 350
                C 150 350.2 168 352.2 ${(186 + g * 14).toFixed(1)} 356`}
            stroke="var(--fg-soil-lit)"
            strokeWidth="1.15"
            strokeLinecap="round"
            fill="none"
            opacity={0.45 + g * 0.25}
          />
          {/* Deeper contour */}
          <path
            d={`M${(104 - g * 8).toFixed(1)} 360.5
                C 124 365 156 365.5 ${(178 + g * 10).toFixed(1)} 361`}
            stroke="var(--fg-soil-deep)"
            strokeWidth="1"
            strokeLinecap="round"
            fill="none"
            opacity={0.28 + g * 0.2}
          />
          {/* Moss patches */}
          <ellipse
            cx="112"
            cy="354.5"
            rx={5.5 + g * 3}
            ry={2.1 + g * 0.6}
            fill="var(--fg-moss)"
            opacity={0.35 + g * 0.35}
            transform="rotate(-8 112 354.5)"
          />
          <ellipse
            cx="168"
            cy="355"
            rx={6.2 + g * 3.5}
            ry={2.3 + g * 0.7}
            fill="var(--fg-moss-lit)"
            opacity={0.28 + g * 0.32}
            transform="rotate(6 168 355)"
          />
          <ellipse
            cx="148"
            cy="352.8"
            rx={3.2 + g * 1.5}
            ry={1.3}
            fill="var(--fg-moss)"
            opacity={0.22 + g * 0.28}
          />
          {/* Tiny grass blades — left */}
          <g
            stroke="var(--fg-moss-lit)"
            strokeLinecap="round"
            fill="none"
            opacity={0.25 + g * 0.45}
          >
            <path d="M102 355 C 100.5 350 99.2 346 98.5 343" strokeWidth="0.9" />
            <path d="M106 355.5 C 105.2 351 105.6 347.5 106.5 344.5" strokeWidth="0.75" />
            <path d="M99 356 C 97.8 352.5 96.2 350 94.8 348" strokeWidth="0.7" />
          </g>
          {/* Tiny grass blades — right */}
          <g
            stroke="var(--fg-moss)"
            strokeLinecap="round"
            fill="none"
            opacity={0.22 + g * 0.42}
          >
            <path d="M178 355.5 C 179.2 351 180.5 347.5 181.2 344.5" strokeWidth="0.85" />
            <path d="M183 356 C 184.5 352 186.2 349.5 187.5 347" strokeWidth="0.7" />
            <path d="M174 355 C 174.8 351.5 174.2 348.5 173.2 346" strokeWidth="0.75" />
          </g>
          {/* Pebble accents */}
          <ellipse
            cx="126"
            cy="357.5"
            rx="2.1"
            ry="1.15"
            fill="var(--fg-bark)"
            opacity={0.28 + g * 0.25}
            transform="rotate(-12 126 357.5)"
          />
          <ellipse
            cx="156"
            cy="358"
            rx="1.6"
            ry="0.95"
            fill="var(--fg-bark-lit)"
            opacity={0.22 + g * 0.22}
            transform="rotate(18 156 358)"
          />
        </g>

        {/* Outer: CSS sway. Inner: organic lean. */}
        <g className="focus-growth-plant">
          <g transform={`rotate(${trunkLean} 140 355)`}>
            {/* Sapling stem */}
            <path
              className="focus-growth-stem"
              d={`M140 355 C 137.5 ${lerp(318, 275, stem)} 135.5 ${lerp(275, 195, stem)} 137.5 ${trunkTopY + 22} C 138.5 ${trunkTopY + 10} 140.5 ${trunkTopY} 142 ${trunkTopY}`}
              stroke={`url(#fg-stem-${uid})`}
              strokeWidth={2 + stem * 1.8 * (1 - wood * 0.55)}
              strokeLinecap="round"
              fill="none"
              pathLength={stemDash}
              strokeDasharray={stemDash}
              strokeDashoffset={stemDash * (1 - stem)}
              opacity={Math.max(0.12, 1 - wood * 0.88)}
            />

            {/* Woody trunk */}
            <path d={trunkPath} fill={`url(#fg-bark-${uid})`} opacity={wood * 0.98} />
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

            {/* Cotyledons — fade as wood forms */}
            {sproutFade > 0.02 ? (
              <g
                opacity={sprout * sproutFade}
                transform={`translate(141 ${lerp(350, trunkTopY + 4, stem)})`}
              >
                <Leaf x={-10} y={0} rot={-52} scale={0.9} open={sprout} tone="lit" />
                <Leaf x={10} y={1} rot={48} scale={0.88} open={sprout} tone="mid" />
              </g>
            ) : null}

            {/* Lower — longer left, shorter right */}
            <Branch
              ox={137}
              oy={272}
              d="M137 272 C 115 265 88 262 62 272 C 48 278 36 290 28 302"
              open={b2}
              width={3.1}
              bow={bow * 0.95}
              tipX={28}
              tipY={302}
              tipRot={-58}
              tipSide={-1}
              breeze={1}
              tier="low"
              denseTip={dense > 0.4}
              midLeaves={[
                { x: 95, y: 268, rot: -38, scale: 0.7, tone: "shade", at: 0.4 },
                { x: 72, y: 275, rot: -62, scale: 0.65, tone: "mid", at: 0.5 },
              ]}
            />
            <Branch
              ox={147}
              oy={262}
              d="M147 262 C 172 252 202 256 228 270 C 240 278 250 290 256 300"
              open={b1}
              width={2.7}
              bow={bow * 0.78}
              tipX={256}
              tipY={300}
              tipRot={52}
              tipSide={1}
              breeze={2}
              tier="low"
              denseTip={dense > 0.4}
              midLeaves={[
                { x: 185, y: 262, rot: 36, scale: 0.68, tone: "lit", at: 0.4 },
                { x: 218, y: 274, rot: 55, scale: 0.62, tone: "mid", at: 0.52 },
              ]}
            />

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
                { x: 100, y: 212, rot: -28, scale: 0.78, tone: "lit", at: 0.35 },
                { x: 70, y: 200, rot: -50, scale: 0.7, tone: "shade", at: 0.48 },
                { x: 48, y: 194, rot: -18, scale: 0.62, tone: "mid", at: 0.58 },
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
                { x: 180, y: 204, rot: 24, scale: 0.75, tone: "mid", at: 0.35 },
                { x: 215, y: 198, rot: 48, scale: 0.68, tone: "lit", at: 0.48 },
                { x: 245, y: 206, rot: 18, scale: 0.6, tone: "shade", at: 0.58 },
              ]}
            />
            {/* Twig off mid-left */}
            <Branch
              ox={86}
              oy={208}
              d="M86 208 C 72 196 60 184 52 174"
              open={reveal(b3, 0.35, 0.5)}
              width={1.45}
              bow={bow * 0.55}
              tipX={52}
              tipY={174}
              tipRot={-30}
              tipSide={-1}
              breeze={2}
              tier="twig"
              midLeaves={[{ x: 70, y: 192, rot: -40, scale: 0.58, tone: "lit", at: 0.4 }]}
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
                { x: 112, y: 160, rot: -22, scale: 0.72, tone: "shade", at: 0.35 },
                { x: 88, y: 140, rot: -48, scale: 0.68, tone: "mid", at: 0.5 },
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
                { x: 175, y: 152, rot: 20, scale: 0.7, tone: "lit", at: 0.35 },
                { x: 210, y: 142, rot: 42, scale: 0.65, tone: "mid", at: 0.5 },
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
              midLeaves={[{ x: 118, y: 122, rot: -30, scale: 0.65, tone: "lit", at: 0.4 }]}
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
              midLeaves={[{ x: 168, y: 118, rot: 28, scale: 0.65, tone: "shade", at: 0.4 }]}
            />

            {/* Crown leader + side sprays */}
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
                { x: 138, y: 95, rot: -35, scale: 0.7, tone: "mid", at: 0.3 },
                { x: 146, y: 88, rot: 32, scale: 0.68, tone: "lit", at: 0.4 },
                { x: 140, y: 68, rot: -12, scale: 0.75, tone: "shade", at: 0.5 },
              ]}
            />
            <Branch
              ox={140}
              oy={88}
              d="M140 88 C 124 76 110 64 100 54"
              open={reveal(crown, 0.22, 0.5)}
              width={1.4}
              bow={bow * 0.35}
              tipX={100}
              tipY={54}
              tipRot={-32}
              tipSide={-1}
              breeze={2}
              tier="twig"
              denseTip
            />
            <Branch
              ox={144}
              oy={84}
              d="M144 84 C 162 72 178 62 192 56"
              open={reveal(crown, 0.28, 0.5)}
              width={1.35}
              bow={bow * 0.32}
              tipX={192}
              tipY={56}
              tipRot={28}
              tipSide={1}
              breeze={3}
              tier="twig"
              denseTip
            />

            {/* Late canopy — fills the silhouette without blobs */}
            <g opacity={dense}>
              <LeafTuft x={118} y={112} rot={-22} open={dense} side={-1} breeze={1} dense />
              <LeafTuft x={172} y={108} rot={18} open={dense} side={1} breeze={2} dense />
              <LeafTuft x={142} y={62} rot={4} open={dense} side={1} breeze={3} dense />
              <LeafTuft x={128} y={88} rot={-12} open={dense} side={-1} breeze={2} />
              <LeafTuft x={160} y={84} rot={14} open={dense} side={1} breeze={1} />
              <Leaf x={88} y={148} rot={-48} scale={0.92} open={dense} tone="shade" breeze={1} />
              <Leaf x={198} y={142} rot={44} scale={0.9} open={dense} tone="lit" breeze={2} />
              <Leaf x={108} y={128} rot={-28} scale={0.8} open={dense} tone="mid" breeze={3} />
              <Leaf x={182} y={122} rot={26} scale={0.82} open={dense} tone="lit" breeze={1} />
              <Leaf x={132} y={142} rot={-10} scale={0.78} open={dense} tone="mid" breeze={2} />
              <Leaf x={158} y={138} rot={16} scale={0.78} open={dense} tone="shade" breeze={3} />
              <Leaf x={148} y={48} rot={8} scale={0.95} open={dense} tone="lit" breeze={1} />
              <Leaf x={120} y={72} rot={-36} scale={0.72} open={dense} tone="shade" breeze={2} />
              <Leaf x={170} y={68} rot={30} scale={0.72} open={dense} tone="mid" breeze={3} />
            </g>
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
