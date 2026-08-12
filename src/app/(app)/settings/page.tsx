import { Header } from "@/components/layout/header";
import { ProfileCard } from "@/components/settings/profile-card";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return (
    <>
      <Header title="Settings" description="Preferences and account" />
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <ProfileCard user={user} />
      </div>
    </>
  );
}
