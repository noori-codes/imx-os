export type Goal = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type GoalWithCounts = Goal & {
  project_count: number;
  task_count: number;
  completed_task_count: number;
  /** First project id when any exist — used for compose deep-links. */
  first_project_id: string | null;
};
