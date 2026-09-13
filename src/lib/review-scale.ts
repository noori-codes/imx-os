import type { LucideIcon } from "lucide-react";
import {
  Battery,
  BatteryFull,
  BatteryLow,
  BatteryMedium,
  Cloud,
  CloudRain,
  CloudSun,
  Smile,
  Sparkles,
  Zap,
} from "lucide-react";

export type ReviewScaleValue = 1 | 2 | 3 | 4 | 5;

export type ReviewScaleOption = {
  value: ReviewScaleValue;
  label: string;
  hint: string;
  icon: LucideIcon;
};

export const MOOD_SCALE: ReviewScaleOption[] = [
  { value: 1, label: "Heavy", hint: "Rough day", icon: CloudRain },
  { value: 2, label: "Flat", hint: "Low spark", icon: Cloud },
  { value: 3, label: "Steady", hint: "Holding fine", icon: CloudSun },
  { value: 4, label: "Good", hint: "Light lift", icon: Smile },
  { value: 5, label: "Bright", hint: "Full glow", icon: Sparkles },
];

export const ENERGY_SCALE: ReviewScaleOption[] = [
  { value: 1, label: "Drained", hint: "Running empty", icon: BatteryLow },
  { value: 2, label: "Low", hint: "Moving slow", icon: Battery },
  { value: 3, label: "Even", hint: "Balanced", icon: BatteryMedium },
  { value: 4, label: "Charged", hint: "Ready", icon: BatteryFull },
  { value: 5, label: "Wired", hint: "Full send", icon: Zap },
];

export function moodOption(value: number | null | undefined) {
  if (value == null) return null;
  return MOOD_SCALE.find((item) => item.value === value) ?? null;
}

export function energyOption(value: number | null | undefined) {
  if (value == null) return null;
  return ENERGY_SCALE.find((item) => item.value === value) ?? null;
}
