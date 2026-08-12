import { Header } from "@/components/layout/header";
import { PagePlaceholder } from "@/components/shared/page-placeholder";

export default function HabitsPage() {
  return (
    <>
      <Header title="Habits" description="Track daily habits and streaks" />
      <PagePlaceholder
        title="Habit Tracking"
        description="Phase 6 will let you define habits, check them off daily, and watch your streaks grow."
      />
    </>
  );
}
