import { getDailyFocusGoal } from "@/actions/focus";
import { Header } from "@/components/layout/header";
import { SettingsHub } from "@/components/settings/settings-hub";
import { SettingsStage } from "@/components/settings/settings-stage";
import { AppPageFrame } from "@/components/shared/app-page-frame";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const dailyGoal = await getDailyFocusGoal();

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
    <>
      <Header title="Settings" />
      <AppPageFrame className="max-w-5xl gap-8 md:py-8">
        <SettingsStage>
          <div className="settings-reveal">
            <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Control room</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  Settings
                </h2>
                <p className="mt-1.5 max-w-lg text-sm text-muted-foreground">
                  Appearance, focus defaults, alerts, and account — tuned for how you work.
                </p>
              </div>
            </header>
          </div>

          <div className="settings-reveal settings-reveal-delay-1">
            <SettingsHub
              email={user.email ?? "Signed in"}
              memberSince={memberSince}
              memberShort={memberShort}
              dailyGoalMinutes={dailyGoal.minutes}
              dailyGoalSaved={dailyGoal.saved}
            />
          </div>
        </SettingsStage>
      </AppPageFrame>
    </>
  );
}
