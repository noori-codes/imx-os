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
  if (
    value === "inbox" ||
    value === "week" ||
    value === "upcoming" ||
    value === "all"
  ) {
    return value;
  }
  return "today";
}

function weekEndDate() {
  return toDateString(addDays(startOfDay(new Date()), 7));
}

export function filterTasksForView(
  tasks: TaskWithContext[],
  view: TaskView,
): TaskWithContext[] {
  const active = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);
  const today = toDateString(startOfDay(new Date()));
  const weekEnd = weekEndDate();

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
    case "week":
      return active
        .filter(
          (t) =>
            t.due_date != null &&
            (isOverdue(t.due_date) ||
              (t.due_date >= today && t.due_date < weekEnd)),
        )
        .sort(sortActive);
    case "upcoming":
      return active
        .filter((t) => t.due_date != null && t.due_date > today)
        .sort(sortActive);
    case "all":
      return [...active.sort(sortActive), ...completed];
  }
}

/** Best task to focus next: overdue → due today → soonest dated → newest. */
export function pickFocusNext(
  tasks: TaskWithContext[],
): TaskWithContext | null {
  const open = tasks.filter((t) => !t.completed);
  if (open.length === 0) return null;

  const overdue = open
    .filter((t) => t.due_date && isOverdue(t.due_date))
    .sort(sortActive);
  if (overdue[0]) return overdue[0];

  const dueToday = open
    .filter((t) => t.due_date && isToday(t.due_date))
    .sort(sortActive);
  if (dueToday[0]) return dueToday[0];

  const dated = open.filter((t) => t.due_date).sort(sortActive);
  if (dated[0]) return dated[0];

  return [...open].sort((a, b) => b.created_at.localeCompare(a.created_at))[0]!;
}

export function groupActiveTasks(
  tasks: TaskWithContext[],
  view: TaskView,
): TaskGroup[] {
  const active = tasks.filter((t) => !t.completed);
  const today = toDateString(startOfDay(new Date()));

  if (view === "upcoming" || view === "week") {
    const byDate = new Map<string, TaskWithContext[]>();
    for (const task of active) {
      if (!task.due_date) continue;
      const key =
        view === "week" && isOverdue(task.due_date)
          ? "overdue"
          : task.due_date;
      const list = byDate.get(key) ?? [];
      list.push(task);
      byDate.set(key, list);
    }
    return [...byDate.entries()]
      .sort(([a], [b]) => {
        if (a === "overdue") return -1;
        if (b === "overdue") return 1;
        return a.localeCompare(b);
      })
      .map(([date, list]) => ({
        id: date === "overdue" ? "overdue" : `day-${date}`,
        label: date === "overdue" ? "Overdue" : formatGroupDate(date),
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
    const doneToday = tasks
      .filter((t) => t.completed && t.due_date && isToday(t.due_date))
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    const groups: TaskGroup[] = [];
    if (overdue.length) {
      groups.push({ id: "overdue", label: "Overdue", tasks: overdue });
    }
    if (dueToday.length) {
      groups.push({ id: "today", label: "Today", tasks: dueToday });
    }
    if (doneToday.length) {
      groups.push({ id: "done", label: "Done today", tasks: doneToday });
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
  if (toDateString(today) === date) return "Today";
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
    case "week":
      return {
        title: "Quiet week",
        description: "Nothing due in the next seven days.",
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
