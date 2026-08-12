import { Header } from "@/components/layout/header";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskList } from "@/components/tasks/task-list";
import { getTasks } from "@/actions/tasks";

export default async function TasksPage() {
  const tasks = await getTasks();

  return (
    <>
      <Header title="Tasks" description="Your to-do list" />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <TaskForm />
        <TaskList tasks={tasks} />
      </div>
    </>
  );
}
