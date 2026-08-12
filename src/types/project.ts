export type Project = {
  id: string;
  user_id: string;
  goal_id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectWithCounts = Project & {
  task_count: number;
  completed_task_count: number;
};
