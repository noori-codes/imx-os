import { Header } from "@/components/layout/header";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskList } from "@/components/tasks/task-list";
import { getStandaloneTasks } from "@/actions/tasks";

export default async function TasksPage() {
  const tasks = await getStandaloneTasks();

  return (
    <>
      <Header
        title="Tasks"
        description="Standalone to-dos not tied to a project"
      />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <TaskForm />
        <TaskList tasks={tasks} />
      </div>
    </>
  );
}
