export type NoteType = "note" | "journal";

export type Note = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: NoteType;
  journal_date: string | null;
  created_at: string;
  updated_at: string;
};
