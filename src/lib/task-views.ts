import {
  isOverdue,
  isToday,
  toDateString,
  addDays,
  startOfDay,
} from "@/lib/date-utils";
import type { TaskView, TaskWithContext } from "@/types/task";

export type TaskGroup = {
  id: string;
  label: string;
  tasks: TaskWithContext[];
};

function sortActive(a: TaskWithContext, b: TaskWithContext) {
  if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
  if (a.due_date) return -1;
  if (b.due_date) return 1;
  return b.created_at.localeCompare(a.created_at);
}

export function parseTaskView(value: string | undefined | null): TaskView {
  if (value === "inbox" || value === "upcoming" || value === "all") {
    return value;
  }
  return "today";
}

export function filterTasksForView(
  tasks: TaskWithContext[],
  view: TaskView,
): TaskWithContext[] {
  const active = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);

  switch (view) {
    case "inbox":
      return [
        ...active.filter((t) => !t.project_id).sort(sortActive),
        ...completed.filter((t) => !t.project_id),
      ];
    case "today":
      return [
        ...active
          .filter(
            (t) =>
              t.due_date != null &&
              (isToday(t.due_date) || isOverdue(t.due_date)),
          )
          .sort(sortActive),
        ...completed.filter(
          (t) => t.due_date != null && isToday(t.due_date),
        ),
      ];
    case "upcoming": {
      const today = toDateString(startOfDay(new Date()));
      return active
        .filter((t) => t.due_date != null && t.due_date > today)
        .sort(sortActive);
    }
    case "all":
      return [...active.sort(sortActive), ...completed];
  }
}

export function groupActiveTasks(
  tasks: TaskWithContext[],
  view: TaskView,
): TaskGroup[] {
  const active = tasks.filter((t) => !t.completed);
  const today = toDateString(startOfDay(new Date()));

  if (view === "upcoming") {
    const byDate = new Map<string, TaskWithContext[]>();
    for (const task of active) {
      if (!task.due_date) continue;
      const list = byDate.get(task.due_date) ?? [];
      list.push(task);
      byDate.set(task.due_date, list);
    }
    return [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, list]) => ({
        id: `upcoming-${date}`,
        label: formatGroupDate(date),
        tasks: list,
      }));
  }

  if (view === "today") {
    const overdue = active
      .filter((t) => t.due_date && isOverdue(t.due_date))
      .sort(sortActive);
    const dueToday = active
      .filter((t) => t.due_date && isToday(t.due_date))
      .sort(sortActive);
    const groups: TaskGroup[] = [];
    if (overdue.length) {
      groups.push({ id: "overdue", label: "Overdue", tasks: overdue });
    }
    if (dueToday.length) {
      groups.push({ id: "today", label: "Today", tasks: dueToday });
    }
    return groups;
  }

  // inbox + all
  const overdue = active
    .filter((t) => t.due_date && isOverdue(t.due_date))
    .sort(sortActive);
  const dueToday = active
    .filter((t) => t.due_date && isToday(t.due_date))
    .sort(sortActive);
  const upcoming = active
    .filter((t) => t.due_date && t.due_date > today)
    .sort(sortActive);
  const nodate = active.filter((t) => !t.due_date).sort(sortActive);

  const groups: TaskGroup[] = [];
  if (overdue.length) {
    groups.push({ id: "overdue", label: "Overdue", tasks: overdue });
  }
  if (dueToday.length) {
    groups.push({ id: "today", label: "Today", tasks: dueToday });
  }
  if (upcoming.length) {
    groups.push({ id: "upcoming", label: "Upcoming", tasks: upcoming });
  }
  if (nodate.length) {
    groups.push({
      id: "nodate",
      label: view === "inbox" ? "Inbox" : "No date",
      tasks: nodate,
    });
  }
  return groups;
}

function formatGroupDate(date: string) {
  const d = new Date(`${date}T00:00:00`);
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  if (toDateString(tomorrow) === date) return "Tomorrow";
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function viewEmptyCopy(view: TaskView): {
  title: string;
  description: string;
} {
  switch (view) {
    case "inbox":
      return {
        title: "Inbox is clear",
        description: "Capture anything without a project.",
      };
    case "today":
      return {
        title: "Clear day",
        description: "Due today — or Everyday for work that returns.",
      };
    case "upcoming":
      return {
        title: "Nothing ahead",
        description: "Future due dates show up here.",
      };
    case "all":
      return {
        title: "No tasks yet",
        description: "Add one above to get started.",
      };
  }
}
