import type { FocusClock, FocusProfileId } from "@/types/focus";
import type { TaskView } from "@/types/task";

export type AppThemePref = "light" | "dark" | "system";

export type UserSettings = {
  daily_focus_goal_minutes: number;
  theme: AppThemePref;
  default_task_view: TaskView;
  focus_profile: FocusProfileId;
  focus_clock: FocusClock;
  auto_start_next: boolean;
  chime_enabled: boolean;
  celebrate_enabled: boolean;
  saved: boolean;
};

export type UserSettingsPatch = Partial<
  Omit<UserSettings, "saved">
>;

export const DEFAULT_USER_SETTINGS: Omit<UserSettings, "saved"> = {
  daily_focus_goal_minutes: 120,
  theme: "system",
  default_task_view: "today",
  focus_profile: "classic",
  focus_clock: "down",
  auto_start_next: false,
  chime_enabled: true,
  celebrate_enabled: true,
};
