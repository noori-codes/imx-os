import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getUserSettings } from "@/actions/settings";
import { Header } from "@/components/layout/header";
import { SettingsHub } from "@/components/settings/settings-hub";
import { SettingsSkeleton } from "@/components/settings/settings-skeleton";
import { SettingsStage } from "@/components/settings/settings-stage";
import { AppPageFrame } from "@/components/shared/app-page-frame";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Settings",
  description: "Preferences and account",
};

async function SettingsBody() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const settings = await getUserSettings();

  const created = user.created_at ? new Date(user.created_at) : null;
  const memberSince = created
    ? created.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Unknown";
  const memberShort = created
    ? created.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : "—";

  return (
    <AppPageFrame className="max-w-5xl gap-8 md:py-8">
      <SettingsStage>
        <div className="settings-reveal">
          <SettingsHub
            email={user.email ?? "Signed in"}
            memberSince={memberSince}
            memberShort={memberShort}
            settings={settings}
          />
        </div>
      </SettingsStage>
    </AppPageFrame>
  );
}

export default function SettingsPage() {
  return (
    <>
      <Header chrome title="Settings" />
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsBody />
      </Suspense>
    </>
  );
}
