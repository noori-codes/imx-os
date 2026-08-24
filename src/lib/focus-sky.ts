export const FOCUS_SKY_ARC = { cx: 50, cy: 58, r: 36 };

const DAY_START_HOUR = 5;
const DAY_END_HOUR = 23;

export function skyArcPoint(t: number) {
  const clamped = Math.min(1, Math.max(0, t));
  const angle = Math.PI - clamped * Math.PI;
  return {
    x: FOCUS_SKY_ARC.cx + FOCUS_SKY_ARC.r * Math.cos(angle),
    y: FOCUS_SKY_ARC.cy - FOCUS_SKY_ARC.r * Math.sin(angle),
    t: clamped,
  };
}

export function skyTimeToT(date: Date) {
  const hours =
    date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
  return Math.min(
    1,
    Math.max(0, (hours - DAY_START_HOUR) / (DAY_END_HOUR - DAY_START_HOUR)),
  );
}

export function skyOutward(
  point: { x: number; y: number },
  distance: number,
) {
  if (distance === 0) return { x: point.x, y: point.y };
  const dx = point.x - FOCUS_SKY_ARC.cx;
  const dy = point.y - FOCUS_SKY_ARC.cy;
  const len = Math.hypot(dx, dy) || 1;
  return {
    x: point.x + (dx / len) * distance,
    y: point.y + (dy / len) * distance,
  };
}

export function skyArcPath(fromT: number, toT: number) {
  const start = Math.min(fromT, toT);
  const end = Math.max(fromT, toT);
  if (end - start < 0.004) return null;
  const a = skyArcPoint(start);
  const b = skyArcPoint(end);
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${FOCUS_SKY_ARC.r} ${FOCUS_SKY_ARC.r} 0 0 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
}

export function unstackSkyPoints<T extends { key: string; t: number; radius: number }>(
  items: T[],
  later: T[] = [],
) {
  const placed: (T & { x: number; y: number })[] = [];

  function place(item: T) {
    const base = skyArcPoint(item.t);
    let stack = 0;
    let pos = { x: base.x, y: base.y };
    while (stack < 8) {
      pos = skyOutward(base, stack * 2.45);
      const overlaps = placed.some((other) => {
        const min = item.radius + other.radius + 1.35;
        return Math.hypot(pos.x - other.x, pos.y - other.y) < min;
      });
      if (!overlaps) break;
      stack += 1;
    }
    placed.push({ ...item, x: pos.x, y: pos.y });
  }

  const first = [...items].sort(
    (a, b) => a.t - b.t || a.key.localeCompare(b.key),
  );
  for (const item of first) place(item);
  for (const item of later) place(item);
  return placed;
}
