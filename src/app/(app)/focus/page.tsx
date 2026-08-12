import { Header } from "@/components/layout/header";
import { PagePlaceholder } from "@/components/shared/page-placeholder";

export default function FocusPage() {
  return (
    <>
      <Header title="Focus" description="Pomodoro and focus sessions" />
      <PagePlaceholder
        title="Focus Sessions"
        description="Phase 7 will add a Pomodoro timer with session logging so you can track deep work over time."
      />
    </>
  );
}
