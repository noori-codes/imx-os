import { Header } from "@/components/layout/header";
import { PagePlaceholder } from "@/components/shared/page-placeholder";

export default function GoalsPage() {
  return (
    <>
      <Header
        title="Goals"
        description="Goals, projects, and tasks"
      />
      <PagePlaceholder
        title="Goals → Projects → Tasks"
        description="Phase 4 will add a three-level hierarchy so you can break big goals into projects and actionable tasks."
      />
    </>
  );
}
