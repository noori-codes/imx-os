import {
  Calendar,
  ChartColumn,
  CheckSquare,
  LayoutDashboard,
  ListTodo,
  Moon,
  NotebookPen,
  Settings,
  Target,
  Timer,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

const DASHBOARD: NavItem = {
  title: "Dashboard",
  href: "/dashboard",
  icon: LayoutDashboard,
  description: "Daily and weekly overview",
};

const TASKS: NavItem = {
  title: "Tasks",
  href: "/tasks",
  icon: ListTodo,
  description: "Inbox, today, and upcoming",
};

const GOALS: NavItem = {
  title: "Goals",
  href: "/goals",
  icon: Target,
  description: "Goals, projects, and progress",
};

const HABITS: NavItem = {
  title: "Habits",
  href: "/habits",
  icon: CheckSquare,
  description: "Daily check-ins and streaks",
};

const FOCUS: NavItem = {
  title: "Focus",
  href: "/focus",
  icon: Timer,
  description: "Pomodoro timer and history",
};

const NOTES: NavItem = {
  title: "Notes",
  href: "/notes",
  icon: NotebookPen,
  description: "Notes and journaling",
};

const CALENDAR: NavItem = {
  title: "Calendar",
  href: "/calendar",
  icon: Calendar,
  description: "Events and schedule",
};

const REVIEW: NavItem = {
  title: "Review",
  href: "/review",
  icon: Moon,
  description: "Daily reflection and review",
};

const ANALYTICS: NavItem = {
  title: "Analytics",
  href: "/analytics",
  icon: ChartColumn,
  description: "Streaks and productivity charts",
};

export const NAV_SETTINGS: NavItem = {
  title: "Settings",
  href: "/settings",
  icon: Settings,
  description: "Preferences and account",
};

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Operate",
    items: [DASHBOARD, TASKS, FOCUS, CALENDAR],
  },
  {
    label: "Build",
    items: [GOALS, HABITS, NOTES],
  },
  {
    label: "Reflect",
    items: [REVIEW, ANALYTICS],
  },
];

/** Flat list for search / anything that needs every route. */
export const NAV_ITEMS: NavItem[] = [
  ...NAV_GROUPS.flatMap((group) => group.items),
  NAV_SETTINGS,
];
