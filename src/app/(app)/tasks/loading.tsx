import { Header } from "@/components/layout/header";
import { TasksSkeleton } from "@/components/tasks/tasks-skeleton";

export default function TasksLoading() {
  return (
    <>
      <Header chrome title="Tasks" />
      <TasksSkeleton />
    </>
  );
}
