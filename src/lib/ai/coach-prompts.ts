export const AI_COACH_PROMPTS = [
  {
    id: "week_overview",
    label: "How was my week?",
    hint: "Summarize the last 7 days across focus, habits, tasks, and reviews.",
  },
  {
    id: "focus_next",
    label: "What should I focus on next?",
    hint: "Recommend the single best next action for today based on overdue tasks, habits, and focus gaps.",
  },
  {
    id: "habits_slipping",
    label: "Which habits are slipping?",
    hint: "Call out habits with weak streaks or low completion and suggest one recovery move each.",
  },
  {
    id: "protect_energy",
    label: "How do I protect my energy?",
    hint: "Using mood/energy and focus load if present, suggest how to pace the coming days.",
  },
  {
    id: "surprise_me",
    label: "Surprise me",
    hint: "Pick the most unexpected, useful insight from the snapshot — something the user might not notice. Be specific and a little witty, still practical.",
  },
] as const;

export type AiCoachPromptId = (typeof AI_COACH_PROMPTS)[number]["id"];
