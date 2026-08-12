import { ListTodo } from "lucide-react";

import { TaskItem } from "@/components/tasks/task-item";
import type { Task } from "@/types/task";

type TaskListProps = {
  tasks: Task[];
};

export function TaskList({ tasks }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 py-16 text-center">
        <ListTodo className="mb-3 size-10 text-muted-foreground" />
        <h3 className="text-lg font-medium">No tasks yet</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Add your first task above. You can set an optional due date and mark
          it complete when done.
        </p>
      </div>
    );
  }

  const activeTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);

  return (
    <div className="space-y-6">
      {activeTasks.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            Active ({activeTasks.length})
          </h2>
          <ul className="space-y-2">
            {activeTasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </ul>
        </section>
      ) : null}

      {completedTasks.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            Completed ({completedTasks.length})
          </h2>
          <ul className="space-y-2">
            {completedTasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
