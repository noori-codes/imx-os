export type SearchEntityType =
  | "task"
  | "goal"
  | "project"
  | "note"
  | "habit"
  | "event";

export type SearchResult = {
  id: string;
  entity_type: SearchEntityType;
  title: string;
  subtitle: string;
  href: string;
  rank: number;
};

export type SearchResponse = {
  query: string;
  results: SearchResult[];
};
