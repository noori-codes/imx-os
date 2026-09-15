import { Header } from "@/components/layout/header";
import { SettingsSkeleton } from "@/components/settings/settings-skeleton";

export default function SettingsLoading() {
  return (
    <>
      <Header chrome title="Settings" />
      <SettingsSkeleton />
    </>
  );
}
