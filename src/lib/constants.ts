import {
  Calendar,
  ChartColumn,
  CheckSquare,
  LayoutDashboard,
  ListTodo,
  Moon,
  NotebookPen,
  Search,
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

export const NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Daily and weekly overview",
  },
  {
    title: "Tasks",
    href: "/tasks",
    icon: ListTodo,
    description: "Simple to-do list",
  },
  {
    title: "Goals",
    href: "/goals",
    icon: Target,
    description: "Goals, projects, and tasks",
  },
  {
    title: "Habits",
    href: "/habits",
    icon: CheckSquare,
    description: "Track daily habits and streaks",
  },
  {
    title: "Focus",
    href: "/focus",
    icon: Timer,
    description: "Pomodoro and focus sessions",
  },
  {
    title: "Notes",
    href: "/notes",
    icon: NotebookPen,
    description: "Notes and journaling",
  },
  {
    title: "Calendar",
    href: "/calendar",
    icon: Calendar,
    description: "Events and schedule",
  },
  {
    title: "Review",
    href: "/review",
    icon: Moon,
    description: "Daily reflection and review",
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: ChartColumn,
    description: "Streaks and productivity charts",
  },
  {
    title: "Search",
    href: "/search",
    icon: Search,
    description: "Full-text search",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Preferences and account",
  },
];
