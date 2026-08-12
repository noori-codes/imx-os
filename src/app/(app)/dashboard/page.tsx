import { Header } from "@/components/layout/header";
import { PagePlaceholder } from "@/components/shared/page-placeholder";

export default function DashboardPage() {
  return (
    <>
      <Header
        title="Dashboard"
        description="Daily and weekly overview"
      />
      <PagePlaceholder
        title="Welcome to IMX OS"
        description="Phase 5 will bring today's tasks, weekly stats, and quick actions here. For now, explore the sidebar to see all planned modules."
      />
    </>
  );
}
