export type TaskRecurrence = "daily" | "weekdays" | null;

export type TaskPriority = "low" | "medium" | "high" | "urgent" | null;

export type Task = {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  completed: boolean;
  due_date: string | null;
  recurrence: TaskRecurrence;
  priority: TaskPriority;
  created_at: string;
  updated_at: string;
};

export const TASK_PRIORITIES: { id: Exclude<TaskPriority, null>; label: string }[] =
  [
    { id: "urgent", label: "Urgent" },
    { id: "high", label: "High" },
    { id: "medium", label: "Medium" },
    { id: "low", label: "Low" },
  ];

export type TaskWithContext = Task & {
  context: string | null;
  context_href: string | null;
};

export type TaskView = "inbox" | "today" | "week" | "upcoming" | "all";

export const TASK_VIEWS: { id: TaskView; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "Week" },
  { id: "inbox", label: "Inbox" },
  { id: "upcoming", label: "Upcoming" },
  { id: "all", label: "All" },
];

export type TaskProjectOption = {
  id: string;
  label: string;
};

export type FocusLinkableTask = {
  id: string;
  title: string;
  context: string | null;
};
