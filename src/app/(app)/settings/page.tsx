import { Header } from "@/components/layout/header";
import { PagePlaceholder } from "@/components/shared/page-placeholder";

export default function SettingsPage() {
  return (
    <>
      <Header title="Settings" description="Preferences and account" />
      <PagePlaceholder
        title="Settings"
        description="Phase 2 will add authentication here. Later phases will add theme preferences, notifications, and data export."
      />
    </>
  );
}
