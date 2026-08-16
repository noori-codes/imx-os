export type Task = {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  completed: boolean;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

export type TaskWithContext = Task & {
  context: string | null;
  context_href: string | null;
};

export type TaskView = "inbox" | "today" | "upcoming" | "all";

export const TASK_VIEWS: { id: TaskView; label: string }[] = [
  { id: "inbox", label: "Inbox" },
  { id: "today", label: "Today" },
  { id: "upcoming", label: "Upcoming" },
  { id: "all", label: "All" },
];

export type TaskProjectOption = {
  id: string;
  label: string;
};
