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
