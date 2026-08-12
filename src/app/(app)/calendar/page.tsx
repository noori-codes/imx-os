import { Header } from "@/components/layout/header";
import { PagePlaceholder } from "@/components/shared/page-placeholder";

export default function CalendarPage() {
  return (
    <>
      <Header title="Calendar" description="Events and schedule" />
      <PagePlaceholder
        title="Calendar"
        description="Phase 9 will show a month/week view with tasks and events linked together."
      />
    </>
  );
}
